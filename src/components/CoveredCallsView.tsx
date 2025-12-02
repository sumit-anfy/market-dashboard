import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/config/axiosClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Search } from "lucide-react";
import { config } from "@/config/api";
import { RadioGroup } from "@radix-ui/react-radio-group";
import { RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type FiltersState = {
  underlying: string;
  optionType: "" | "CE" | "PE";
  otmMin: number;
  otmMax: number;
  premiumMin: number;
  premiumMax: number;
  expiryMonth: string;
};

interface CoveredCallData {
  id: number;
  underlyingSymbol: string;
  underlyingPrice: number | null;
  expiryMonth: string;
  time: string;
  premium: number | null;
  volume: number | null;
  strikePrice: number | null;
  optionType: string;
  otm: number | null;
  premiumPercent: number | null;
  monthlyPercent: number | null;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function CoveredCallsView() {
  // Data and loading states
  const [optionContractsData, setOptionContractsData] = useState<
    CoveredCallData[]
  >([]);
  // const [avgPremium, setAvgPremium] = useState<number>(0);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 360,
    totalPages: 0,
    hasMore: false,
  });

  // Filter states
  const [filters, setFilters] = useState<FiltersState>({
    underlying: "",
    optionType: "CE",
    otmMin: -50,
    otmMax: 50,
    premiumMin: 0,
    premiumMax: 25,
    expiryMonth: ""
  });

  // Applied filters state (used for API calls)
  const [appliedFilters, setAppliedFilters] = useState<FiltersState>(filters);
  const [optionFilter, setOptionFilter] = useState<"" | "CE" | "PE">("CE");
  const [expiryFilter, setExpiryFilter] = useState<string[]>([]);

  // Fetch covered calls data from API with pagination and filters
  const fetchCoveredCallsData = useCallback(
    async (page: number = 1, filtersForApi: FiltersState = appliedFilters) => {
      try {
        setLoading({ isLoading: true, error: null });

        // Build query parameters using debounced filters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        // Add optional filters if they have values
        if (filtersForApi.underlying.trim()) {
          params.append("underlying", filtersForApi.underlying.trim());
        }
        if (filtersForApi.optionType) {
          params.append("optionType", filtersForApi.optionType);
        }
        if (filtersForApi.expiryMonth) {
          params.append("expiryMonth", filtersForApi.expiryMonth?.trim());
        }
        // Always send OTM and Premium filters (including default values)
        params.append("minOtm", filtersForApi.otmMin.toString());
        params.append("maxOtm", filtersForApi.otmMax.toString());
        params.append("minPremium", filtersForApi.premiumMin.toString());
        params.append("maxPremium", filtersForApi.premiumMax.toString());

        const response = await apiClient.get<{
          success: boolean;
          data: CoveredCallData[];
          avg_premium: number;
          expiry_month?: string[];
          count: number;
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasMore: boolean;
        }>(`${config.endpoints.coveredCalls}?${params.toString()}`);

        if (response.data.success) {
          setOptionContractsData(response.data.data);
          // setAvgPremium(response.data.avg_premium || 0);
          const expiryList =
            response.data.expiry_month ??
            [];
          const normalized = Array.from(
            new Set(
              (expiryList || [])
                .map((m) => (m ? m.toString().trim() : ""))
                .filter(Boolean)
            )
          ).sort((a, b) => a.localeCompare(b));
          setExpiryFilter(normalized);
          setPagination({
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit,
            totalPages: response.data.totalPages,
            hasMore: response.data.hasMore,
          });
          setLoading({ isLoading: false, error: null });
        } else {
          throw new Error("Failed to fetch covered calls data");
        }
      } catch (error: any) {
        // Ignore cancelled requests
        if (error?.cancelled) {
          console.log("[CoveredCallsView] Request cancelled, ignoring");
          return;
        }
        console.error("Error fetching covered calls data:", error);
        setLoading({
          isLoading: false,
          error: error.message || "Failed to fetch covered calls data",
        });
      }
    },
    [appliedFilters, pagination.limit]
  );

  // Fetch data on component mount (initial load with default filters)
  useEffect(() => {
    fetchCoveredCallsData(1, appliedFilters);
    // We intentionally only load once on mount; filters are applied via button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle page navigation
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCoveredCallsData(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Format price based on value
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "N/A";
    return price;
  };

  // Format volume with commas
  const formatVolume = (volume: number | null) => {
    if (volume === null || volume === undefined) return "N/A";
    return volume.toLocaleString();
  };

  // Get badge variant based on option type
  const getOptionTypeBadge = (optionType: string) => {
    return optionType === "CE" ? "default" : "secondary";
  };

  // Check if option is ATM (At The Money)
  const isATM = (underlyingPrice: number | null, strikePrice: number | null) => {
    if (!underlyingPrice || !strikePrice) return false;
    const difference = Math.abs(underlyingPrice - strikePrice);
    const percentDiff = (difference / underlyingPrice) * 100;
    return percentDiff < 1;
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCoveredCallsData(1, filters);
  };

  const handleResetFilters = () => {
    const defaultFilters: FiltersState = {
      underlying: "",
      optionType: "CE",
      otmMin: -50,
      otmMax: 50,
      premiumMin: 0,
      premiumMax: 25,
      expiryMonth: ""
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCoveredCallsData(1, defaultFilters);
  };

  const formatDateOnly = (ts?: string) => (ts ? new Date(ts).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",  // 2-digit year → dd/mm/yy
      }) : "-");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Covered Calls</h2>
          <p className="text-muted-foreground">
            Monitor option contracts for covered call strategies
          </p>
        </div>
        <Button
          onClick={() => fetchCoveredCallsData(1)}
          disabled={loading.isLoading}
          variant="outline"
          size="sm"
        >
          {loading.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Error State */}
      {loading.error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-600 dark:text-red-300">
            <p>{loading.error}</p>
            <p className="text-sm mt-2">Please check:</p>
            <ul className="text-sm list-disc list-inside mt-1 space-y-1">
              <li>Backend server is running on port 3000</li>
              <li>Database connection is working</li>
              <li>NSE options and equity tick data exists in the database</li>
              <li>Options have valid expiry dates (expiry_date &gt;= today)</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters - Always visible */}
      <Card>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mt-4">
            {/* Underlying Symbol Filter - Elastic Search */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Underlying Symbol</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search symbol..."
                  value={filters.underlying}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      underlying: e.target.value,
                    }));
                  }}
                  className="h-9 pl-9"
                />
              </div>
            </div>

            {/* Option Type Filter */}
            <div className="space-y-6">
              <Label className="text-sm font-medium">Option Type</Label>
                  <RadioGroup className="flex space-x-2" value={optionFilter} onValueChange={(value: any) => {setOptionFilter(value)
                    setFilters((prev) => ({
                    ...prev,
                    optionType: value,
                  }))}}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="" id="both" />
                      <Label htmlFor="both" className="text-sm font-normal">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CE" id="CE" />
                      <Label htmlFor="CE" className="text-sm font-normal">Call (CE)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PE" id="PE" />
                      <Label htmlFor="PE" className="text-sm font-normal">Put (PE)</Label>
                    </div>
                  </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Expiry Month</Label>
                <Select
                    value={filters.expiryMonth || "ALL"}
                    onValueChange={(value) => setFilters((prev) => ({
                    ...prev,
                    expiryMonth: value,
                  }))}
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

            {/* OTM % Filter - Dual Slider */}
            <div className="space-y-8">
              <Label className="text-sm font-medium">OTM Range</Label>
              <div className="space-y-4">
                <div className="relative w-full px-3">
                  {/* Slider */}
                  <div className="relative">
                  <Slider
                    value={[filters.otmMin, filters.otmMax]}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        otmMin: value[0],
                        otmMax: value[1],
                      }))
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
                    {[
                      { val: filters.otmMin, key: 'otmMin' },
                      { val: filters.otmMax, key: 'otmMax' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="absolute -top-8 transform -translate-x-1/2"
                        style={{
                          left: `${((item.val + 100) / 200) * 100}%`,
                        }}
                      >
                        <Input
                          type="text"
                          pattern="^-?\d+$"
                          title="Enter digits"
                          value={item.val}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (idx === 0) {
                              // Min value
                              setFilters((prev) => ({
                                ...prev,
                                otmMin: Math.max(-100, Math.min(value, prev.otmMax))
                              }));
                            } else {
                              // Max value
                              setFilters((prev) => ({
                                ...prev,
                                otmMax: Math.min(100, Math.max(value, prev.otmMin))
                              }));
                            }
                          }}
                          min={idx === 0 ? -100 : filters.otmMin}
                          max={idx === 0 ? filters.otmMax : 100}
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

            {/* Premium % Filter - Dual Slider */}
            <div className="space-y-8">
              <Label className="text-sm font-medium">Monthly Premium Range</Label>
              <div className="space-y-4">
                <div className="relative w-full px-3">
                  {/* Slider */}
                  <div className="relative">
                  <Slider
                    value={[filters.premiumMin, filters.premiumMax]}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        premiumMin: value[0],
                        premiumMax: value[1],
                      }))
                    }
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

                    {/* Editable value inputs */}
                    {[
                      { val: filters.premiumMin, key: 'premiumMin' },
                      { val: filters.premiumMax, key: 'premiumMax' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="absolute -top-8 transform -translate-x-1/2"
                        style={{
                          left: `${((item.val) / 100) * 200}%`,
                        }}
                      >
                        <Input
                          type="text"
                          pattern="^\d+$"
                          title="Enter only digits"
                          value={item.val}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (idx === 0) {
                              // Min value
                              setFilters((prev) => ({
                                ...prev,
                                premiumMin: Math.max(0, Math.min(value, prev.premiumMax))
                              }));
                            } else {
                              // Max value
                              setFilters((prev) => ({
                                ...prev,
                                premiumMax: Math.min(50, Math.max(value, prev.premiumMin))
                              }));
                            }
                          }}
                          min={idx === 0 ? 0 : filters.premiumMin}
                          max={idx === 0 ? filters.premiumMax : 50}
                          className="h-6 w-12 text-xs font-medium text-primary text-center px-1 py-0"
                        />
                  </div>
                    ))}
                  </div>

                  {/* Scale labels */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-4">
            <Button
              onClick={handleApplyFilters}
              disabled={loading.isLoading}
              variant="default"
              size="sm"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={loading.isLoading}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State - Only for tables */}
      {loading.isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Fetching covered calls data...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading.isLoading &&
        !loading.error &&
        optionContractsData.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-700 dark:text-yellow-400">
                No Data Available
              </CardTitle>
            </CardHeader>
            <CardContent className="text-yellow-600 dark:text-yellow-300">
              <p>No covered calls data found. This could mean:</p>
              <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                <li>No active option contracts in the database</li>
                <li>No tick data available for options or equity</li>
                <li>All options have expired (expiry_date &lt; today)</li>
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Main Content - Show only when not loading and have data */}
      {!loading.isLoading && !loading.error && optionContractsData.length > 0 && (
        <>
          {/* Summary Cards */}
          {/* <div className="grid gap-4 md:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {pagination.total.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {optionContractsData.length} on this page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Current Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {pagination.page}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {pagination.totalPages} pages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Call Options (CE)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {
                    optionContractsData.filter(
                      (option) => option.optionType === "CE"
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  on this page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Put Options (PE)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {
                    optionContractsData.filter(
                      (option) => option.optionType === "PE"
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  on this page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ATM Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {
                    optionContractsData.filter((option) =>
                      isATM(option.underlyingPrice, option.strikePrice)
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  on this page
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avg Premium %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {avgPremium !== null && !Number.isNaN(avgPremium)
                    ? avgPremium.toFixed(2)
                    : "0.00"}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  on this page
                </p>
              </CardContent>
            </Card>
          </div> */}

          {/* Options Table */}
          <Card>
            <CardHeader>
              <CardTitle>Option Contracts</CardTitle>
              <CardDescription>
                All available option contracts with strike prices and premiums
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center font-semibold">
                        Underlying
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Time
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Price
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Expiry Month
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Strike
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Type
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Premium
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Volume
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        OTM %
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Premium %
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Monthly Premium %
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optionContractsData.map((option, index) => {
                      const atmOption = isATM(
                        option.underlyingPrice,
                        option.strikePrice
                      );

                      return (
                        <TableRow
                          key={index}
                          className={`hover:bg-muted/50 cursor-pointer transition-colors ${
                            atmOption
                              ? "bg-blue-50/50 dark:bg-blue-950/20"
                              : ""
                          }`}
                          onClick={() => {
                            const url = `/covered-calls-details/${option.id}?` +
                              new URLSearchParams({
                                id: String(option.id),
                                underlyingSymbol: option.underlyingSymbol,
                                expiryMonth: option.expiryMonth,
                                time: option.time,
                                underlyingPrice: String(option.underlyingPrice ?? ''),
                                premium: String(option.premium ?? ''),
                                volume: String(option.volume ?? ''),
                                strikePrice: String(option.strikePrice ?? ''),
                                optionType: option.optionType,
                                otm: String(option.otm ?? ''),
                                premiumPercent: String(option.premiumPercent ?? ''),
                                monthlyPercent: String(option.monthlyPercent ?? ''),
                              }).toString();
                            window.open(url, '_blank');
                          }}
                        >
                          <TableCell className="text-center font-medium">
                            {option.underlyingSymbol}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {formatDateOnly(option.time)+" "+(option.time.split(" ")[1])+" "+(option.time.split(" ")[2])}
                          </TableCell>
                          <TableCell className="text-center font-mono text-base">
                            {formatPrice(option.underlyingPrice)}
                          </TableCell>
                          <TableCell className="text-center text-sm font-mono">
                            {option.expiryMonth}
                          </TableCell>
                          <TableCell className="text-center font-mono text-base">
                            {formatPrice(option.strikePrice)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getOptionTypeBadge(option.optionType)}>
                              {option.optionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-base">
                            {formatPrice(option.premium)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {formatVolume(option.volume)}
                          </TableCell>
                          <TableCell className={`text-center font-mono text-base calc-highlight ${option.otm! > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {option.otm !== null ? option.otm : "N/A"}%
                          </TableCell>
                          <TableCell className="text-center font-mono text-base calc-highlight">
                            {option.premiumPercent !== null
                              ? option.premiumPercent
                              : "N/A"}
                            %
                          </TableCell>
                          <TableCell className="text-center font-mono text-base calc-highlight">
                            {option.monthlyPercent !== null
                              ? option.monthlyPercent
                              : "N/A"}
                            %
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Pagination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} (Total:{" "}
                  {pagination.total.toLocaleString()} contracts)
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {(() => {
                      const pages = [];
                      const maxPagesToShow = 5;
                      let startPage = Math.max(
                        1,
                        pagination.page - Math.floor(maxPagesToShow / 2)
                      );
                      let endPage = Math.min(
                        pagination.totalPages,
                        startPage + maxPagesToShow - 1
                      );

                      if (endPage - startPage + 1 < maxPagesToShow) {
                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            variant={pagination.page === 1 ? "default" : "outline"}
                            className="h-9 w-9 p-0"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 py-2">
                              ...
                            </span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            variant={
                              pagination.page === i ? "default" : "outline"
                            }
                            className="h-9 w-9 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }

                      if (endPage < pagination.totalPages) {
                        if (endPage < pagination.totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 py-2">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <Button
                            key={pagination.totalPages}
                            onClick={() => handlePageChange(pagination.totalPages)}
                            variant={
                              pagination.page === pagination.totalPages
                                ? "default"
                                : "outline"
                            }
                            className="h-9 w-9 p-0"
                          >
                            {pagination.totalPages}
                          </Button>
                        );
                      }

                      return pages;
                    })()}
                  </div>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
