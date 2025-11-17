import { useEffect, useState, useMemo, useRef } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import { config } from "@/config/api";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useArbitrageDetails } from "@/hooks/useArbitrageDetails";
import { MultiSymbolLiveData } from "@/components/MultiSymbolLiveData";

interface LocationState {
  instrumentid: number;
  name: string;
  date: string;
  symbol_1: string;
  price_1: number;
  symbol_2: string;
  price_2: number;
  symbol_3: string;
  price_3: number;
  gap_1: number;
  gap_2: number;
}

// LiveDataRow interface is no longer needed - data is handled by MultiSymbolLiveData

export default function ArbitrageDetailsPage() {
  const { instrumentId } = useParams<{ instrumentId: string; date: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Try to get state from location.state first (for backward compatibility),
  // otherwise parse from URL query parameters
  const state: LocationState | null =
    location.state ||
    (() => {
      const instrumentid = searchParams.get("instrumentid");
      const name = searchParams.get("name");
      const date = searchParams.get("date");
      const symbol_1 = searchParams.get("symbol_1");
      const time_1 = searchParams.get("time_1");
      const price_1 = searchParams.get("price_1");
      const symbol_2 = searchParams.get("symbol_2");
      const time_2 = searchParams.get("time_2");
      const price_2 = searchParams.get("price_2");
      const symbol_3 = searchParams.get("symbol_3");
      const time_3 = searchParams.get("time_3");
      const price_3 = searchParams.get("price_3");
      const gap_1 = searchParams.get("gap_1");
      const gap_2 = searchParams.get("gap_2");

      // Return null if required params are missing
      if (!instrumentid || !name || !date) {
        return null;
      }

      return {
        instrumentid: parseInt(instrumentid),
        name,
        date,
        symbol_1: symbol_1 || "",
        time_1,
        price_1: parseFloat(price_1 || "0"),
        symbol_2: symbol_2 || "",
        time_2,
        price_2: parseFloat(price_2 || "0"),
        symbol_3: symbol_3 || "",
        time_3,
        price_3: parseFloat(price_3 || "0"),
        gap_1: parseFloat(gap_1 || "0"),
        gap_2: parseFloat(gap_2 || "0"),
      };
    })();

  // State management
  const [timeRange, setTimeRange] = useState<"day" | "hour">("day");
  const [gapFilter, setGapFilter] = useState<"both" | "positive" | "negative">(
    "both"
  );
  const [gapRange, setGapRange] = useState<[number, number]>([-50, 50]);
  // Live data state is now managed by MultiSymbolLiveData component
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(360);
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [dateRangeBounds, setDateRangeBounds] = useState<{
    minDate: Date | null;
    maxDate: Date | null;
  }>({
    minDate: null,
    maxDate: null,
  });
  const [equityRange, setEquityRange] = useState<{ min_date: string | null; max_date: string | null; hourly_min_date: string | null; hourly_max_date: string | null }>({ min_date: null, max_date: null, hourly_min_date: null, hourly_max_date: null });
  const [futuresRange, setFuturesRange] = useState<{ min_date: string | null; max_date: string | null; hourly_min_date: string | null; hourly_max_date: string | null}>({ min_date: null, max_date: null, hourly_min_date: null, hourly_max_date: null });


  // Check if current time is within market hours (9 AM - 4 PM IST)
  const isMarketHours = useMemo(() => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Market hours: 9:00 AM (9:00) to 4:00 PM (16:00)
    const currentTimeInMinutes = hours * 60 + minutes;
    const marketOpenTime = 9 * 60; // 9:00 AM
    const marketCloseTime = 16 * 60; // 4:00 PM

    return (
      currentTimeInMinutes >= marketOpenTime &&
      currentTimeInMinutes < marketCloseTime
    );
  }, []);

  // Update market hours status every minute
  const [isMarketOpen, setIsMarketOpen] = useState(isMarketHours);

  useEffect(() => {
    // Update market hours status immediately
    setIsMarketOpen(isMarketHours);

    // Set up interval to check every minute
    const interval = setInterval(() => {
      const now = new Date();
      const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;
      const marketOpenTime = 9 * 60;
      const marketCloseTime = 16 * 60;

      setIsMarketOpen(
        currentTimeInMinutes >= marketOpenTime &&
          currentTimeInMinutes < marketCloseTime
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isMarketHours]);

  // Extract three symbols from state for multi-symbol support
  const symbols = useMemo(() => {
    if (!state) return [];
    return [state.symbol_1, state.symbol_2, state.symbol_3].filter(Boolean);
  }, [state]);

  // Note: WebSocket connections are now managed by MultiSymbolLiveData component

  // Calculate actual date range from selected dates
  const actualDateRange = useMemo(() => {
    // If no dates selected, don't filter by date
    if (!selectedStartDate && !selectedEndDate) {
      return { startDate: undefined, endDate: undefined };
    }

    return {
      startDate: selectedStartDate || undefined,
      endDate: selectedEndDate || undefined,
    };
  }, [selectedStartDate, selectedEndDate]);

  // Fetch filtered arbitrage data
  const {
    data: filteredData,
    loading,
    error,
    pagination,
    summary,
  } = useArbitrageDetails({
    instrumentId: instrumentId!,
    timeRange,
    page: currentPage,
    limit: itemsPerPage,
    gapFilter,
    minGap: gapRange[0],
    maxGap: gapRange[1],
    startDate: actualDateRange.startDate,
    endDate: actualDateRange.endDate,
  });

  // Track if dates have been initialized to prevent unnecessary API calls
  const datesInitializedRef = useRef<boolean>(false);

  // Note: Symbol subscription logic is now handled by MultiSymbolLiveData component

  // Note: Live data updates are now handled by MultiSymbolLiveData component

  // Calculate min/max dates from filtered data (only once on initial load)
  useEffect(() => {
    // Only calculate dates if they haven't been initialized yet
    if (
      filteredData &&
      filteredData.length > 0 &&
      !datesInitializedRef.current
    ) {
      const dates = filteredData
        .map((row: any) => new Date(row.date))
        .filter((d) => !isNaN(d.getTime()));

      if (dates.length > 0) {
        // const min = new Date(Math.min(...dates.map((d) => d.getTime())));
        // const max = new Date(Math.max(...dates.map((d) => d.getTime())));

        // Mark as initialized before setting state
        datesInitializedRef.current = true;
      }
    }
  }, [filteredData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange, gapFilter, gapRange, selectedStartDate, selectedEndDate]);

  // Fetch min/max date range for this instrument + underlying symbol
  useEffect(() => {
    const fetchRanges = async () => {
      try {
        const symbol = state?.name || null;
        const instId = state?.instrumentid || null;
        const [eq, fut] = await Promise.all([
          axios.get(`${config.apiBaseUrl}/api/nse-equity/date-range`, { params: { symbol: symbol ?? 'null' } }),
          axios.get(`${config.apiBaseUrl}/api/nse-futures/date-range`, { params: { instrumentId: instId ?? 'null' } }),
        ]);
        setEquityRange({ min_date: eq.data?.min_date ?? null, max_date: eq.data?.max_date ?? null, hourly_min_date: eq.data?.hourly_min_date ?? null, hourly_max_date: eq.data?.hourly_max_date ?? null });
        setFuturesRange({ min_date: fut.data?.min_date ?? null, max_date: fut.data?.max_date ?? null, hourly_min_date: fut.data?.hourly_min_date ?? null, hourly_max_date: fut.data?.hourly_max_date ?? null });
      } catch (e) {
        // ignore
      }
    };
    fetchRanges();
  }, [state?.name, state?.instrumentid]);

  // Keep dateRangeBounds synced to futures date range (for filters/UI bounds)
  useEffect(() => {
    if (futuresRange.min_date || futuresRange.max_date) {
      setDateRangeBounds({
        minDate: timeRange === "hour" ? futuresRange.hourly_min_date ? new Date(futuresRange.hourly_min_date) : null : futuresRange.min_date ? new Date(futuresRange.min_date) : null,
        maxDate: timeRange === "hour" ? futuresRange.hourly_max_date ? new Date(futuresRange.hourly_max_date) : null : futuresRange.max_date ? new Date(futuresRange.max_date) : null,
      });
    }
  }, [futuresRange.min_date, futuresRange.max_date, timeRange]);

  // Note: Refresh functionality is now handled by MultiSymbolLiveData component

  // Pagination handlers
  const handleNextPage = () => {
    if (pagination && pagination.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const totalPages = pagination.totalPages;
    const current = currentPage;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if total pages <= 7
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      if (current > 3) {
        pageNumbers.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (current < totalPages - 2) {
        pageNumbers.push("...");
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Color palette for symbol groups (subtle, professional colors)
  const colorPalette = [
    "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50",
    "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50",
    "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50",
    "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
    "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
    "bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/50",
    "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50",
    "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50",
  ];

  // Month key helper (YYYY-MM)
  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  // Create color mapping per month (chronological assignment)
  const symbolColorMap = useMemo(() => {
    if (!filteredData?.length) return new Map<string, string>();

    const map = new Map<string, string>();
    let colorIndex = 0;

    // Ensure chronological order so months get stable, sequential colors
    const sorted = [...filteredData].sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const row of sorted) {
      const d = new Date(row.date);
      if (isNaN(d.getTime())) continue;
      const key = monthKey(d);
      if (!map.has(key)) {
        map.set(key, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    }

    return map;
  }, [filteredData, colorPalette]);

  // Helper to get row color based on row date month
  const getRowColor = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const key = monthKey(d);
    return symbolColorMap.get(key) || "";
  };

  // Format number helper
  const formatNumber = (num: number, decimals = 2) => {
    return num !== null ? Number(num).toFixed(decimals) : "-";
  };

  const strToDate = (s?: string): Date | undefined => {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  };

  if (!state) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No data available. Please select a row from the arbitrage table.
            </p>
            <Button onClick={() => navigate("/arbitrage")} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Arbitrage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/arbitrage")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{state.name}</h1>
            <Badge variant="outline">
              {new Date(state.date).toLocaleDateString()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Instrument ID: {state.instrumentid}
          </p>
        </div>
      </div>

      <Separator />

      {/* Daily Data range summary */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='grid grid-cols-3 text-center'>
            <CardTitle className='text-base'>Equity Date Range (Daily)</CardTitle>
            <CardTitle>From: <span className='font-medium text-foreground'>{equityRange.min_date ? new Date(equityRange.min_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : '-'}</span></CardTitle>
            <CardTitle>Last: <span className='font-medium text-foreground'>{equityRange.max_date ? new Date(equityRange.max_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : '-'}</span></CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='grid grid-cols-3 text-center'>
            <CardTitle className='text-base'>Futures Date Range (Daily)</CardTitle>
            <CardTitle>From: <span className='font-medium'>{futuresRange.min_date ? new Date(futuresRange.min_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : '-'}</span></CardTitle>
            <CardTitle>Last: <span className='font-medium'>{futuresRange.max_date ? new Date(futuresRange.max_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : '-'}</span></CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Hourly Data range summary */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader className='grid grid-cols-3 text-center'>
            <CardTitle className='text-base'>Equity Date Range (Hourly)</CardTitle>
            <CardTitle>From: <span className='font-medium'>{equityRange.hourly_min_date ? new Date(equityRange.hourly_min_date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour:"2-digit",
                            minute:"2-digit"
                          }) : '-'}</span></CardTitle>
            <CardTitle>Last: <span className='font-medium'>{equityRange.hourly_max_date ? new Date(equityRange.hourly_max_date).toLocaleDateString("en-IN", {
                            timeZone: "UTC",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour:"2-digit",
                            minute:"2-digit"
                          }) : '-'}</span></CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='grid grid-cols-3 text-center'>
            <CardTitle className='text-base'>Futures Date Range (Hourly)</CardTitle>
            <CardTitle>From: <span className='font-medium text-foreground'>{futuresRange.hourly_min_date ? new Date(futuresRange.hourly_min_date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour:"2-digit",
                            minute:"2-digit"
                          }) : '-'}</span></CardTitle>
            <CardTitle>Last: <span className='font-medium text-foreground'>{futuresRange.hourly_max_date ? new Date(futuresRange.hourly_max_date).toLocaleDateString("en-IN", {
                            timeZone: "UTC",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour:"2-digit",
                            minute:"2-digit"
                          }) : '-'}</span></CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Section 1: Selected Row Data */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Arbitrage Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Name</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">
                    Near Future Symbol
                  </TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">
                    Next Future Symbol
                  </TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">
                    Far Future Symbol
                  </TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Gap (Near & Next)</TableHead>
                  <TableHead className="text-center">Gap (Next & Far)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center">{state.name}</TableCell>
                  <TableCell className="text-center">{state.date}</TableCell>
                  <TableCell className="text-center">
                    {state.symbol_1}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatNumber(state.price_1)}
                  </TableCell>
                  <TableCell className="text-center">
                    {state.symbol_2}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatNumber(state.price_2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {state.symbol_3}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatNumber(state.price_3)}
                  </TableCell>
                  <TableCell
                    className={
                      state.gap_1 > 0
                        ? "text-green-600 text-center"
                        : "text-red-600 text-center"
                    }
                  >
                    {formatNumber(state.gap_1)}
                  </TableCell>
                  <TableCell
                    className={
                      state.gap_2 > 0
                        ? "text-green-600 text-center"
                        : "text-red-600 text-center"
                    }
                  >
                    {formatNumber(state.gap_2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Enhanced Multi-Symbol Live Data */}
      <MultiSymbolLiveData symbols={symbols} isMarketOpen={isMarketOpen} />

      {/* Section 3: Filtered Query Data */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Arbitrage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
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
                      <span className="text-[10px] text-muted-foreground sm:hidden mb-1">From</span>
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
                                setSelectedStartDate(d ? d.toISOString().split("T")[0] : "")
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
                    <div className="text-center text-xs text-muted-foreground py-1">to</div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-[10px] text-muted-foreground sm:hidden mb-1">To</span>
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
                                setSelectedEndDate(d ? d.toISOString().split("T")[0] : "")
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
                          Available: {dateRangeBounds.minDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span>
                          to {dateRangeBounds.maxDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                  )}
                </div>
                </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Positive Gaps
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary?.positiveGapCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total positive gaps from both columns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Negative Gaps
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {summary?.negativeGapCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total negative gaps from both columns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">
                    Near Future Symbol
                  </TableHead>
                  {timeRange == "hour" && <TableHead className="text-center">
                    Near Future Time
                  </TableHead>}
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">
                    Next Future Symbol
                  </TableHead>
                  {timeRange == "hour" && <TableHead className="text-center">
                    Next Future Time
                  </TableHead>}
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">
                    Far Future Symbol
                  </TableHead>
                  {timeRange == "hour" && <TableHead className="text-center">Far Future Time</TableHead>}
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">
                    Gap (Near & Next)
                  </TableHead>
                  <TableHead className="text-center">
                    Gap (Next & Far)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-red-600">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredData && filteredData.length > 0 ? (
                  filteredData.map((row: any, idx: number) => (
                    <TableRow
                      key={idx}
                      className={getRowColor(row.date || "-")}
                    >
                      <TableCell className="text-center text-xs">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                            timeZone: "UTC",
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                            hour:"numeric",
                            minute:"2-digit",
                            hour12: false
                          })}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {row.symbol_1 || "-"}
                      </TableCell>
                      {timeRange == "hour" && <TableCell className="text-center">
                        {row.time_1 || "-"}
                      </TableCell>}
                      <TableCell className="text-center">
                        {formatNumber(row.price_1)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {row.symbol_2 || "-"}
                      </TableCell>
                      {timeRange == "hour" && <TableCell className="text-center">
                        {row.time_2 || "-"}
                      </TableCell>}
                      <TableCell className="text-center">
                        {formatNumber(row.price_2)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {row.symbol_3 || "-"}
                      </TableCell>
                      {timeRange == "hour" && <TableCell className="text-center">
                        {row.time_3 || "-"}
                      </TableCell>}
                      <TableCell className="text-center">
                        {formatNumber(row.price_3)}
                      </TableCell>
                      <TableCell
                        className={
                          row.gap_1 > 0
                            ? "text-green-600 text-center font-semibold"
                            : "text-red-600 text-center font-semibold"
                        }
                      >
                        {formatNumber(row.gap_1)}
                      </TableCell>
                      <TableCell
                        className={
                          row.gap_2 > 0
                            ? "text-green-600 text-center font-semibold"
                            : "text-red-600 text-center font-semibold"
                        }
                      >
                        {formatNumber(row.gap_2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                {pagination.total} rows
              </p>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, idx) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageClick(pageNum as number)}
                        disabled={loading}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    )
                  )}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Pagination Info (when only 1 page) */}
          {pagination && pagination.totalPages === 1 && (
            <div className="flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Showing all {pagination.total} rows
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
