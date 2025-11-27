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
import { Select } from "@radix-ui/react-select";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface CoveredCallsTrendFiltersProps {
    trendType: "daily" | "hourly";
    setTrendType: (value: "daily" | "hourly") => void;
    trendOptionType: "ALL" | "CE" | "PE";
    setTrendOptionType: (value: "ALL" | "CE" | "PE") => void;
    expiryMonth: string;
    setExpiryMonth: (value: string) => void;
    expiryFilter: string[];
    trendOtmMin: number;
    setTrendOtmMin: (value: number) => void;
    trendOtmMax: number;
    setTrendOtmMax: (value: number) => void;
    trendPremiumMin: number;
    setTrendPremiumMin: (value: number) => void;
    trendPremiumMax: number;
    setTrendPremiumMax: (value: number) => void;
    trendStartDate: string;
    setTrendStartDate: (value: string) => void;
    trendEndDate: string;
    setTrendEndDate: (value: string) => void;
    trendLoading: boolean;
    onApplyTrendFilters: () => void;
    onResetTrendFilters: () => void;
}

export function CoveredCallsTrendFilters({
    trendType,
    setTrendType,
    trendOptionType,
    setTrendOptionType,
    expiryMonth,
    setExpiryMonth,
    expiryFilter,
    trendOtmMin,
    setTrendOtmMin,
    trendOtmMax,
    setTrendOtmMax,
    trendPremiumMin,
    setTrendPremiumMin,
    trendPremiumMax,
    setTrendPremiumMax,
    trendStartDate,
    setTrendStartDate,
    trendEndDate,
    setTrendEndDate,
    trendLoading,
    onApplyTrendFilters,
    onResetTrendFilters,
}: CoveredCallsTrendFiltersProps) {
    const strToDate = (s?: string): Date | undefined => {
        if (!s) return undefined;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? undefined : d;
    };

    return (
        <Card>
            <CardContent className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    {/* Trend Type */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="trend-type" className="text-sm">
                                Daily
                            </Label>
                            <Switch
                                id="trend-type"
                                checked={trendType === "hourly"}
                                onCheckedChange={(checked) => {
                                    setTrendType(checked ? "hourly" : "daily");
                                }}
                            />
                            <Label htmlFor="trend-type" className="text-sm">
                                Hourly
                            </Label>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetTrendFilters}
                    >
                        Reset Filters
                    </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {/* Option Type */}
                    <div className="space-y-6">
                        <Label className="text-sm font-medium">Option Type</Label>
                        <RadioGroup
                            className="flex space-x-2"
                            value={trendOptionType}
                            onValueChange={(value: "ALL" | "CE" | "PE") => {
                                setTrendOptionType(value);
                            }}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ALL" id="trend-all" />
                                <Label htmlFor="trend-all" className="text-sm font-normal">
                                    All
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="CE" id="trend-ce" />
                                <Label htmlFor="trend-ce" className="text-sm font-normal">
                                    Call (CE)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PE" id="trend-pe" />
                                <Label htmlFor="trend-pe" className="text-sm font-normal">
                                    Put (PE)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Expiry Month</Label>
                        <Select
                            value={expiryMonth || "ALL"}
                            onValueChange={(value) => setExpiryMonth(value)}
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Select expiry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All</SelectItem>
                                {expiryFilter?.map((month) => (
                                  <SelectItem key={month?.trim()} value={month}>
                                    {month}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    {/* OTM % Range */}
                    <div className="space-y-8">
                        <Label className="text-sm font-medium">OTM Range (%)</Label>
                        <div className="space-y-4">
                            <div className="relative w-full px-3">
                                <div className="relative">
                                    <Slider
                                        value={[trendOtmMin, trendOtmMax]}
                                        onValueChange={(value) => {
                                            setTrendOtmMin(value[0]);
                                            setTrendOtmMax(value[1]);
                                        }}
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

                                    {[
                                        { val: trendOtmMin, key: "min" },
                                        { val: trendOtmMax, key: "max" },
                                    ].map((item, idx) => (
                                        <div
                                            key={item.key}
                                            className="absolute -top-8 transform -translate-x-1/2"
                                            style={{
                                                left: `${((item.val + 100) / 200) * 100}%`,
                                            }}
                                        >
                                            <Input
                                                type="text"
                                                pattern="^-?\\d+$"
                                                title="Enter digits"
                                                value={item.val}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    if (idx === 0) {
                                                        setTrendOtmMin(
                                                            Math.max(-100, Math.min(value, trendOtmMax))
                                                        );
                                                    } else {
                                                        setTrendOtmMax(
                                                            Math.min(100, Math.max(value, trendOtmMin))
                                                        );
                                                    }
                                                }}
                                                className="h-6 w-12 text-xs font-medium text-primary text-center px-1 py-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>-100</span>
                                    <span>0</span>
                                    <span>+100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium % Range */}
                    <div className="space-y-8">
                        <Label className="text-sm font-medium">Premium % Range</Label>
                        <div className="space-y-4">
                            <div className="relative w-full px-3">
                                <div className="relative">
                                    <Slider
                                        value={[trendPremiumMin, trendPremiumMax]}
                                        onValueChange={(value) => {
                                            setTrendPremiumMin(value[0]);
                                            setTrendPremiumMax(value[1]);
                                        }}
                                        min={0}
                                        max={50}
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

                                    {[
                                        { val: trendPremiumMin, key: "min" },
                                        { val: trendPremiumMax, key: "max" },
                                    ].map((item, idx) => (
                                        <div
                                            key={item.key}
                                            className="absolute -top-8 transform -translate-x-1/2"
                                            style={{
                                                left: `${(item.val / 100) * 200}%`,
                                            }}
                                        >
                                            <Input
                                                type="text"
                                                pattern="^\\d+$"
                                                title="Enter digits"
                                                value={item.val}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value) || 0;
                                                    if (idx === 0) {
                                                        setTrendPremiumMin(
                                                            Math.max(0, Math.min(value, trendPremiumMax))
                                                        );
                                                    } else {
                                                        setTrendPremiumMax(
                                                            Math.min(25, Math.max(value, trendPremiumMin))
                                                        );
                                                    }
                                                }}
                                                className="h-6 w-12 text-xs font-medium text-primary text-center px-1 py-0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>0</span>
                                    <span>50</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-4">
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
                                        value={trendStartDate}
                                        onChange={(e) => setTrendStartDate(e.target.value)}
                                        className="h-9 text-sm sm:text-xs w-full"
                                        autoComplete="off"
                                        inputMode="numeric"
                                    />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="p-0">
                                            <Calendar
                                                mode="single"
                                                selected={strToDate(trendStartDate)}
                                                onSelect={(d) =>
                                                    setTrendStartDate(
                                                        d ? d.toISOString().split("T")[0] : ""
                                                    )
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
                                        value={trendEndDate}
                                        onChange={(e) => setTrendEndDate(e.target.value)}
                                        className="h-9 text-sm sm:text-xs w-full"
                                        autoComplete="off"
                                        inputMode="numeric"
                                    />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9"
                                            >
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="p-0">
                                            <Calendar
                                                mode="single"
                                                selected={strToDate(trendEndDate)}
                                                onSelect={(d) =>
                                                    setTrendEndDate(
                                                        d ? d.toISOString().split("T")[0] : ""
                                                    )
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={onApplyTrendFilters}
                        disabled={trendLoading}
                        variant="default"
                        size="sm"
                    >
                        Apply Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
