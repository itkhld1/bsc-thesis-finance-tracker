import { API_BASE_URL } from '@/lib/api-config';
import { useState, useCallback } from "react";
import { Upload, Camera, Image, Loader2, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Tesseract from 'tesseract.js';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type UploadState = "idle" | "processing" | "complete";

interface ParsedReceipt {
  amount: number | null;
  categoryId: string;
  description: string;
  date: string;
}

export function ReceiptUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setState("processing");
    
    try {
      // 1. Perform Tesseract.js turkish + english support
      const result = await Tesseract.recognize(file, 'tur+eng', {
        logger: m => console.log(m)
      });
      
      const rawText = result.data.text;
      console.log("OCR Raw Text:", rawText);

      // 2. send text to backend for parsing
      const response = await fetch(`${API_BASE_URL}/expenses/parse-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) throw new Error('Parsing failed');

      const data = await response.json();
      setParsedData(data);
      setState("complete");
    } catch (error: any) {
      toast({ title: "Extraction Error", description: error.message, variant: "destructive" });
      setState("idle");
    }
  };

  const handleSaveExpense = async () => {
    if (!parsedData || !token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parsedData.amount,
          categoryId: parsedData.categoryId,
          description: `Receipt: ${parsedData.categoryId}`,
          date: new Date(parsedData.date).toISOString(),
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Expense saved from receipt." });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        handleReset();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setState("idle");
    setFileName("");
    setParsedData(null);
  };

  return (
    <Card className="h-full border-slate-100 shadow-sm text-slate-900">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-xl font-bold tracking-tight">Receipt Scan</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">OCR extraction (Turkish/English)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-2">
        {state === "idle" && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-4 sm:p-8 text-center transition-all duration-200 cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
              )}
              onClick={() => document.getElementById('receipt-input')?.click()}
            >
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-base font-bold text-slate-700">Drop your receipt</p>
                  <p className="text-[10px] sm:text-sm text-slate-400 font-medium">or click to browse</p>
                </div>
                <input
                  id="receipt-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-wider" asChild>
                <label className="cursor-pointer">
                  <Image className="w-3.5 h-3.5 mr-1.5" />
                  Files
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button variant="outline" className="h-9 text-[10px] font-bold uppercase tracking-wider" asChild>
                <label className="cursor-pointer">
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </>
        )}

        {state === "processing" && (
          <div className="text-center py-6">
            <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Scanning Receipt...</p>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{fileName}</p>
          </div>
        )}

        {state === "complete" && parsedData && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-600">
              <Check className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Scan Complete!</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Amount:</span>
                <span className="font-black text-slate-900">₺{(Number(parsedData.amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Category:</span>
                <span className="font-black text-slate-900 uppercase">{parsedData.categoryId}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1 h-9 text-xs font-bold uppercase tracking-wider">
                Discard
              </Button>
              <Button onClick={handleSaveExpense} className="flex-1 h-9 gradient-primary text-xs font-bold uppercase tracking-wider">
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>  );
}
