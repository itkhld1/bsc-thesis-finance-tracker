import { useState, useCallback } from "react";
import { Upload, Camera, Image, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Tesseract from 'tesseract.js';
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type UploadState = "idle" | "processing" | "complete";

interface ParsedReceipt {
  amount: number | null;
  categoryId: string;
  description: string;
  date: string;
}

interface GroupReceiptUploadProps {
  onParsed: (data: ParsedReceipt) => void;
  className?: string;
}

export function GroupReceiptUpload({ onParsed, className }: GroupReceiptUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const { token } = useAuth();
  const { toast } = useToast();

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
      const result = await Tesseract.recognize(file, 'tur+eng');
      
      const rawText = result.data.text;

      // 2. send text to backend for parsing
      const response = await fetch('http://localhost:5001/expenses/parse-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) throw new Error('Parsing failed');

      const data = await response.json();
      onParsed(data);
      setState("complete");
      toast({ title: "OCR Success", description: "Receipt details extracted!" });
    } catch (error: any) {
      toast({ title: "Extraction Error", description: error.message, variant: "destructive" });
      setState("idle");
    }
  };

  const handleReset = () => {
    setState("idle");
    setFileName("");
  };

  if (state === "processing") {
    return (
      <div className={cn("text-center py-4 border-2 border-dashed rounded-xl bg-muted/30", className)}>
        <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
        <p className="text-xs font-medium">Extracting data...</p>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className={cn("flex items-center justify-between p-3 border-2 border-dashed border-green-200 bg-green-50 rounded-xl", className)}>
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Receipt Loaded</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0 rounded-full hover:bg-green-100">
          <X className="w-3 h-3 text-green-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
        onClick={() => document.getElementById('group-receipt-input')?.click()}
      >
        <div className="flex flex-col items-center gap-1">
          <Upload className="w-5 h-5 text-primary mb-1" />
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Scan Receipt</p>
          <p className="text-[10px] text-muted-foreground">Drag receipt or click</p>
          <input
            id="group-receipt-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
          <label className="cursor-pointer">
            <Image className="w-3 h-3 mr-2" />
            Gallery
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
          <label className="cursor-pointer">
            <Camera className="w-3 h-3 mr-2" />
            Camera
            <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </label>
        </Button>
      </div>
    </div>
  );
}