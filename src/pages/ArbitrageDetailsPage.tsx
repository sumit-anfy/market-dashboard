import { useEffect, useState, useMemo, useRef } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/config/axiosClient";
import { config } from "@/config/api";
import { useArbitrageDetails } from "@/hooks/useArbitrageDetails";
import { MultiSymbolLiveData } from "@/components/MultiSymbolLiveData";
import { ArbitrageHeader } from "@/components/arbitrage-details/ArbitrageHeader";
import { ArbitrageDateRangeSummary } from "@/components/arbitrage-details/ArbitrageDateRangeSummary";
import { SelectedArbitrageTable } from "@/components/arbitrage-details/SelectedArbitrageTable";
import { ArbitrageFilters } from "@/components/arbitrage-details/ArbitrageFilters";
import { ArbitrageSummaryCards } from "@/components/arbitrage-details/ArbitrageSummaryCards";
import { ArbitrageHistoryTable } from "@/components/arbitrage-details/ArbitrageHistoryTable";

type FiltersState = {
  gapFilter: "both" | "positive" | "negative";
  gapRange: [number, number];
  startDate: string;
  endDate: string;
};

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

type SortDirection = "asc" | "desc";
type SortKey =
  | "date"
  | "symbol_1"
  | "time_1"
  | "price_1"
  | "symbol_2"
  | "time_2"
  | "price_2"
  | "symbol_3"
  | "time_3"
  | "price_3"
  | "gap_1"
  | "gap_2";

interface TableSortConfig {
  key: SortKey;
  direction: SortDirection;
}

const DEFAULT_GAP_RANGE: [number, number] = [-1000, 1000];

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
  const [gapRange, setGapRange] =
    useState<[number, number]>(DEFAULT_GAP_RANGE);
  const [isGapFilterActive, setIsGapFilterActive] = useState(false);
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
  const [equityRange, setEquityRange] = useState<{
    min_date: string | null;
    max_date: string | null;
    hourly_min_date: string | null;
    hourly_max_date: string | null;
  }>({
    min_date: null,
    max_date: null,
    hourly_min_date: null,
    hourly_max_date: null,
  });
  const [futuresRange, setFuturesRange] = useState<{
    min_date: string | null;
    max_date: string | null;
    hourly_min_date: string | null;
    hourly_max_date: string | null;
  }>({
    min_date: null,
    max_date: null,
    hourly_min_date: null,
    hourly_max_date: null,
  });

  // Applied filters (used for API calls)
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({
    gapFilter,
    gapRange: DEFAULT_GAP_RANGE,
    startDate: "",
    endDate: "",
  });

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
  const appliedDateRange = useMemo(() => {
    // If no dates selected, don't filter by date
    if (!appliedFilters.startDate && !appliedFilters.endDate) {
      return { startDate: undefined, endDate: undefined };
    }

    return {
      startDate: appliedFilters.startDate || undefined,
      endDate: appliedFilters.endDate || undefined,
    };
  }, [appliedFilters.startDate, appliedFilters.endDate]);

  // const formatDateOnly = (ts?: string) => (ts ? new Date(ts).toLocaleDateString("en-GB", {
  //       day: "2-digit",
  //       month: "2-digit",
  //       year: "2-digit",  // 2-digit year → dd/mm/yy
  //     }) : "-")

  const gapRangeToApply = isGapFilterActive ? appliedFilters.gapRange : undefined;

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
    gapFilter: appliedFilters.gapFilter,
    minGap: gapRangeToApply?.[0],
    maxGap: gapRangeToApply?.[1],
    startDate: appliedDateRange.startDate,
    endDate: appliedDateRange.endDate,
  });

  // Sorting for Historical Arbitrage Patterns table
  const [sortConfig, setSortConfig] = useState<TableSortConfig | null>({
    key: "date",
    direction: "desc",
  });

  const handleSortColumn = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedFilteredData = useMemo(() => {
    if (!filteredData || !sortConfig) return filteredData;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    const getValue = (row: any): number | string => {
      switch (key) {
        case "date":
          return row.date ? new Date(row.date).getTime() : Number.NaN;
        case "symbol_1":
          return row.symbol_1 ?? "";
        case "time_1":
          return row.time_1 ?? "";
        case "price_1":
          return typeof row.price_1 === "number"
            ? row.price_1
            : parseFloat(row.price_1 ?? "NaN");
        case "symbol_2":
          return row.symbol_2 ?? "";
        case "time_2":
          return row.time_2 ?? "";
        case "price_2":
          return typeof row.price_2 === "number"
            ? row.price_2
            : parseFloat(row.price_2 ?? "NaN");
        case "symbol_3":
          return row.symbol_3 ?? "";
        case "time_3":
          return row.time_3 ?? "";
        case "price_3":
          return typeof row.price_3 === "number"
            ? row.price_3
            : parseFloat(row.price_3 ?? "NaN");
        case "gap_1":
          return typeof row.gap_1 === "number"
            ? row.gap_1
            : parseFloat(row.gap_1 ?? "NaN");
        case "gap_2":
          return typeof row.gap_2 === "number"
            ? row.gap_2
            : parseFloat(row.gap_2 ?? "NaN");
        default:
          return "";
      }
    };

    const copy = [...filteredData];
    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);

      const aIsNumber = typeof av === "number";
      const bIsNumber = typeof bv === "number";

      if (aIsNumber && bIsNumber) {
        const aNum = av as number;
        const bNum = bv as number;
        const aNaN = Number.isNaN(aNum);
        const bNaN = Number.isNaN(bNum);
        if (aNaN && bNaN) return 0;
        if (aNaN) return 1;
        if (bNaN) return -1;
        if (aNum === bNum) return 0;
        return aNum > bNum ? 1 * multiplier : -1 * multiplier;
      }

      const aStr = String(av);
      const bStr = String(bv);
      if (aStr === bStr) return 0;
      return aStr > bStr ? 1 * multiplier : -1 * multiplier;
    });

    return copy;
  }, [filteredData, sortConfig]);

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

  // Fetch min/max date range for this instrument + underlying symbol
  useEffect(() => {
    const fetchRanges = async () => {
      try {
        const symbol = state?.name || null;
        const instId = state?.instrumentid || null;
        const [eq, fut] = await Promise.all([
          apiClient.get(`${config.apiBaseUrl}/api/nse-equity/date-range`, {
            params: { symbol: symbol ?? "null" },
          }),
          apiClient.get(`${config.apiBaseUrl}/api/nse-futures/date-range`, {
            params: { instrumentId: instId ?? "null" },
          }),
        ]);
        setEquityRange({
          min_date: eq.data?.min_date ?? null,
          max_date: eq.data?.max_date ?? null,
          hourly_min_date: eq.data?.hourly_min_date ?? null,
          hourly_max_date: eq.data?.hourly_max_date ?? null,
        });
        setFuturesRange({
          min_date: fut.data?.min_date ?? null,
          max_date: fut.data?.max_date ?? null,
          hourly_min_date: fut.data?.hourly_min_date ?? null,
          hourly_max_date: fut.data?.hourly_max_date ?? null,
        });
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
        minDate:
          timeRange === "hour"
            ? futuresRange.hourly_min_date
              ? new Date(futuresRange.hourly_min_date)
              : null
            : futuresRange.min_date
              ? new Date(futuresRange.min_date)
              : null,
        maxDate:
          timeRange === "hour"
            ? futuresRange.hourly_max_date
              ? new Date(futuresRange.hourly_max_date)
              : null
            : futuresRange.max_date
              ? new Date(futuresRange.max_date)
              : null,
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

  const handleApplyFilters = () => {
    setAppliedFilters({
      gapFilter,
      gapRange,
      startDate: selectedStartDate || "",
      endDate: selectedEndDate || "",
    });
    setIsGapFilterActive(true);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setGapFilter("both");
    setGapRange(DEFAULT_GAP_RANGE);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setAppliedFilters({
      gapFilter: "both",
      gapRange: DEFAULT_GAP_RANGE,
      startDate: "",
      endDate: "",
    });
    setIsGapFilterActive(false);
    setCurrentPage(1);
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
      <ArbitrageHeader name={state.name} date={state.date} />

      {/* Date Range Summary */}
      <ArbitrageDateRangeSummary
        equityRange={equityRange}
        futuresRange={futuresRange}
      />

      {/* Section 1: Selected Row Data */}
      <SelectedArbitrageTable data={state} />

      {/* Section 2: Enhanced Multi-Symbol Live Data */}
      <MultiSymbolLiveData symbols={symbols} isMarketOpen={isMarketOpen} />

      {/* Section 3: Filtered Query Data */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Arbitrage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <ArbitrageFilters
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            gapFilter={gapFilter}
            setGapFilter={setGapFilter}
            gapRange={gapRange}
            setGapRange={setGapRange}
            selectedStartDate={selectedStartDate}
            setSelectedStartDate={setSelectedStartDate}
            selectedEndDate={selectedEndDate}
            setSelectedEndDate={setSelectedEndDate}
            dateRangeBounds={dateRangeBounds}
            loading={loading}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />

          {/* Summary Cards */}
          <ArbitrageSummaryCards summary={summary} />

          {/* Data Table */}
          <ArbitrageHistoryTable
            loading={loading}
            error={error}
            sortedFilteredData={sortedFilteredData}
            timeRange={timeRange}
            sortConfig={sortConfig}
            handleSortColumn={handleSortColumn as any}
            getRowColor={getRowColor}
            pagination={pagination}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
            handlePageClick={handlePageClick}
            getPageNumbers={getPageNumbers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
