import { API_BASE_URL } from '@/lib/api-config';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be a positive number"
  ),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(1, "Description is required").max(100, "Description too long"),
  date: z.date({ required_error: "Please select a date" }),
  notes: z.string().max(500, "Notes too long").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ManualEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, error: categoriesFetchError } = useCategories();
  const { token } = useAuth(); // Get the token from auth context
  const queryClient = useQueryClient(); // For query invalidation

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      category: "",
      description: "",
      date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to add an expense.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(values.amount),
          categoryId: values.category, // Backend expects categoryId
          description: values.description,
          date: values.date.toISOString(), // Send as ISO string
          notes: values.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add expense');
      }

      toast({
        title: "Expense added!",
        description: `₺${values.amount} for ${values.description} has been recorded.`,
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] }); // Invalidate expenses query
      form.reset();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error adding expense",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full border-slate-100 shadow-sm text-slate-900">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-xl font-bold tracking-tight">Manual Entry</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">Enter expense details manually</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7 h-10 sm:h-11 font-bold text-lg"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 sm:h-11 font-medium">
                          <SelectValue placeholder={categoriesLoading ? "..." : "Select"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1">
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-10 sm:h-11 pl-3 text-left font-medium",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What was this for?" className="h-10 sm:h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Details..."
                      className="resize-none text-sm"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 gradient-primary font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
              disabled={isSubmitting || categoriesLoading || categoriesError || !token}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Record Expense"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>  );
}