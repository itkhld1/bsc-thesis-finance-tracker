import { ManualEntryForm } from "@/components/expense/ManualEntryForm";
import { VoiceInput } from "@/components/expense/VoiceInput";
import { ReceiptUpload } from "@/components/expense/ReceiptUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Keyboard, Mic, Receipt } from "lucide-react";

export default function AddExpense() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="px-1 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Add Expense</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Choose a method to record your expense
        </p>
      </div>

      {/* Mobile: Tabs | Desktop: Grid */}
      <div className="block lg:hidden">
        <Tabs defaultValue="manual" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/50 border border-slate-200 p-1">
            <TabsTrigger value="manual" className="flex flex-col gap-0.5 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Keyboard className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex flex-col gap-0.5 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Mic className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex flex-col gap-0.5 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Receipt className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Scan</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="mt-0">
            <ManualEntryForm />
          </TabsContent>
          <TabsContent value="voice" className="mt-0">
            <VoiceInput />
          </TabsContent>
          <TabsContent value="receipt" className="mt-0">
            <ReceiptUpload />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid (Hidden on Mobile) */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        <ManualEntryForm />
        <VoiceInput />
        <ReceiptUpload />
      </div>
    </div>
  );
}
