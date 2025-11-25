import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ArbitrageFiltersProps {
    timeRange: "day" | "hour";
    setTimeRange: (value: "day" | "hour") => void;
    gapFilter: "both" | "positive" | "negative";
    setGapFilter: (value: "both" | "positive" | "negative") => void;
    gapRange: [number, number];
    setGapRange: (value: [number, number]) => void;
    selectedStartDate: string;
    setSelectedStartDate: (value: string) => void;
    selectedEndDate: string;
    setSelectedEndDate: (value: string) => void;
    dateRangeBounds: {
        minDate: Date | null;
        maxDate: Date | null;
    };
    loading: boolean;
    onApplyFilters: () => void;
    onResetFilters: () => void;
}

export function ArbitrageFilters({
    timeRange,
    setTimeRange,
    gapFilter,
    setGapFilter,
    gapRange,
    setGapRange,
    selectedStartDate,
    setSelectedStartDate,
    selectedEndDate,
    setSelectedEndDate,
    dateRangeBounds,
    loading,
    onApplyFilters,
    onResetFilters,
}: ArbitrageFiltersProps) {
    const strToDate = (s?: string): Date | undefined => {
        if (!s) return undefined;
        const d = new Date(s);
        return isNaN(d.getTime()) ? undefined : d;
    };

    return (
        <Card>
            <CardContent className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Time Range Toggle */}
                    <div className="space-y-8">
                        <Label className="text-sm font-medium">Data Trend</Label>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="time-range" className="text-sm">
                                Day-wise
                            </Label>
                            <Switch
                                id="time-range"
                                checked={timeRange === "hour"}
                                onCheckedChange={(checked) =>
                                    setTimeRange(checked ? "hour" : "day")
                                }
                            />
                            <Label htmlFor="time-range" className="text-sm">
                                Hour-wise
                            </Label>
                        </div>
                    </div>

                    {/* Gap Type Filter */}
                    <div className="space-y-8">
                        <Label className="text-sm font-medium">Gap Type</Label>
                        <RadioGroup
                            className="flex space-x-2"
                            value={gapFilter}
                            onValueChange={(value: any) => setGapFilter(value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="both" />
                                <Label htmlFor="both" className="text-sm font-normal">
                                    All
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="positive" />
                                <Label htmlFor="positive" className="text-sm font-normal">
                                    Positive Only
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="negative" id="negative" />
                                <Label htmlFor="negative" className="text-sm font-normal">
                                    Negative Only
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Gap Range Filter */}
                    <div className="space-y-8">
                        <Label className="text-sm font-medium">Gap Range</Label>
                        <div className="space-y-4">
                            <div className="relative w-full px-3">
                                {/* Slider */}
                                <div className="relative">
                                    <Slider
                                        value={gapRange}
                                        onValueChange={(value) =>
                                            setGapRange(value as [number, number])
                                        }
                                        min={-100}
                                        max={100}
                                        step={1}
                                        className="w-full 
      [&_[role=slider]]:h-5 
      [&_[role=slider]]:w-5 
      [&_[role=slider]]:border-2 
      [&_[role=slider]]:border-primary 
      [&_[role=slider]]:bg-background 
      [&_[role=slider]]:shadow-lg 
      [&>.relative]:h-2 
      [&_.bg-primary]:bg-primary"
                                    />

                                    {/* Editable value inputs */}
                                    {gapRange.map((val, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute -top-8 transform -translate-x-1/2"
                                            style={{
                                                left: `${((val + 100) / 200) * 100}%`, // converts value (-100–100) to %
                                            }}
                                        >
                                            <Input
                                                type="text"
                                                pattern="^-?\d+$"
                                                title="Enter digits"
                                                value={val}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    const newRange: [number, number] = [
                                                        ...gapRange,
                                                    ] as [number, number];
                                                    if (idx === 0) {
                                                        // Min value
                                                        newRange[0] = Math.max(
                                                            -100,
                                                            Math.min(value, gapRange[1])
                                                        );
                                                    } else {
                                                        // Max value
                                                        newRange[1] = Math.min(
                                                            100,
                                                            Math.max(value, gapRange[0])
                                                        );
                                                    }
                                                    setGapRange(newRange);
                                                }}
                                                min={idx === 0 ? -100 : gapRange[0]}
                                                max={idx === 0 ? gapRange[1] : 100}
                                                className="h-6 w-12 text-xs font-medium text-primary text-center px-1 py-0"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Scale labels */}
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>-100</span>
                                    <span>0</span>
                                    <span>+100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Date Range</Label>
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center">
                            <div className="flex-1 flex flex-col">
                                <span className="text-[10px] text-muted-foreground sm:hidden mb-1">
                                    From
                                </span>
                                <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
                                    <Input
                                        type="text"
                                        placeholder="YYYY-MM-DD"
                                        value={selectedStartDate}
                                        onChange={(e) => setSelectedStartDate(e.target.value)}
                                        className="h-9 text-sm sm:text-xs w-full"
                                        autoComplete="off"
                                        inputMode="numeric"
                                    />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="p-0">
                                            <Calendar
                                                mode="single"
                                                selected={strToDate(selectedStartDate)}
                                                onSelect={(d) =>
                                                    setSelectedStartDate(
                                                        d ? d.toISOString().split("T")[0] : ""
                                                    )
                                                }
                                                fromDate={dateRangeBounds.minDate || undefined}
                                                toDate={
                                                    selectedEndDate
                                                        ? strToDate(selectedEndDate)
                                                        : dateRangeBounds.maxDate || undefined
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="text-center text-xs text-muted-foreground py-1">
                                to
                            </div>
                            <div className="flex-1 flex flex-col">
                                <span className="text-[10px] text-muted-foreground sm:hidden mb-1">
                                    To
                                </span>
                                <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
                                    <Input
                                        type="text"
                                        placeholder="YYYY-MM-DD"
                                        value={selectedEndDate}
                                        onChange={(e) => setSelectedEndDate(e.target.value)}
                                        className="h-9 text-sm sm:text-xs w-full"
                                        autoComplete="off"
                                        inputMode="numeric"
                                    />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="p-0">
                                            <Calendar
                                                mode="single"
                                                selected={strToDate(selectedEndDate)}
                                                onSelect={(d) =>
                                                    setSelectedEndDate(
                                                        d ? d.toISOString().split("T")[0] : ""
                                                    )
                                                }
                                                fromDate={
                                                    selectedStartDate
                                                        ? strToDate(selectedStartDate)
                                                        : dateRangeBounds.minDate || undefined
                                                }
                                                toDate={dateRangeBounds.maxDate || undefined}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        {dateRangeBounds.minDate && dateRangeBounds.maxDate && (
                            <div className="flex flex-col sm:flex-row gap-1 text-xs text-muted-foreground px-1 sm:px-3">
                                <span>
                                    Available:{" "}
                                    {dateRangeBounds.minDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                                <span>
                                    to{" "}
                                    {dateRangeBounds.maxDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-4">
                    <Button
                        onClick={onApplyFilters}
                        disabled={!!loading}
                        variant="default"
                        size="sm"
                    >
                        Apply Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={onResetFilters}>
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
