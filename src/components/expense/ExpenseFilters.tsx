import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories"; // Use the new hook
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function ExpenseFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sortBy,
  onSortChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
}: ExpenseFiltersProps) {
  const { data: categories, isLoading, isError, error } = useCategories(); // Fetch categories using the hook
  const hasActiveFilters = search || category !== "all" || sortBy !== "date-desc" || dateRange;

  const getCategoryName = (categoryId: string) => {
    if (isLoading) return "Loading...";
    if (isError) return "Error";
    return categories?.find(c => c.id === categoryId)?.name || "Unknown";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          {/* Category Filter */}
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-9 text-xs font-bold uppercase tracking-tight bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-9 text-xs font-bold uppercase tracking-tight bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest</SelectItem>
              <SelectItem value="date-asc">Oldest</SelectItem>
              <SelectItem value="amount-desc">Highest</SelectItem>
              <SelectItem value="amount-asc">Lowest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "h-9 text-xs font-bold uppercase tracking-tight bg-slate-50 border-slate-200 justify-start text-left rounded-lg",
              !dateRange && "text-slate-400"
            )}>
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <span className="truncate">{format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}</span>
                ) : (
                  format(dateRange.from, "LLL dd")
                )
              ) : (
                "Range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={1}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {search && (
            <Badge variant="secondary" className="gap-1 h-5 text-[9px] font-bold uppercase py-0 px-2 bg-slate-100 text-slate-600 border-none">
              "{search}"
              <X className="w-2.5 h-2.5 cursor-pointer opacity-60" onClick={() => onSearchChange("")} />
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1 h-5 text-[9px] font-bold uppercase py-0 px-2 bg-slate-100 text-slate-600 border-none">
              {getCategoryName(category)}
              <X className="w-2.5 h-2.5 cursor-pointer opacity-60" onClick={() => onCategoryChange("all")} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-5 px-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
