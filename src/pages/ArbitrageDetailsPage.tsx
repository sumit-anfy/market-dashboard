import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSocketIO } from "@/hooks/useSocketIO";
import { useArbitrageDetails } from "@/hooks/useArbitrageDetails";

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

interface LiveDataRow {
  symbol: string;
  time: string;
  ltp: number;
  volume: number;
  oi: number;
  ltq: number;
  avgTradedPrice: number;
  tbq: number;
  tsq: number;
  open: number;
  high: number;
  low: number;
  close: number;
  totalBuyQty: number;
  totalSellQty: number;
}

export default function ArbitrageDetailsPage() {
  const { instrumentId } = useParams<{ instrumentId: string; date: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Try to get state from location.state first (for backward compatibility),
  // otherwise parse from URL query parameters
  const state: LocationState | null = location.state || (() => {
    const instrumentid = searchParams.get('instrumentid');
    const name = searchParams.get('name');
    const date = searchParams.get('date');
    const symbol_1 = searchParams.get('symbol_1');
    const time_1 = searchParams.get('time_1');
    const price_1 = searchParams.get('price_1');
    const symbol_2 = searchParams.get('symbol_2');
    const time_2 = searchParams.get('time_2');
    const price_2 = searchParams.get('price_2');
    const symbol_3 = searchParams.get('symbol_3');
    const time_3 = searchParams.get('time_3');
    const price_3 = searchParams.get('price_3');
    const gap_1 = searchParams.get('gap_1');
    const gap_2 = searchParams.get('gap_2');

    // Return null if required params are missing
    if (!instrumentid || !name || !date) {
      return null;
    }

    return {
      instrumentid: parseInt(instrumentid),
      name,
      date,
      symbol_1: symbol_1 || '',
      time_1,
      price_1: parseFloat(price_1 || '0'),
      symbol_2: symbol_2 || '',
      time_2,
      price_2: parseFloat(price_2 || '0'),
      symbol_3: symbol_3 || '',
      time_3,
      price_3: parseFloat(price_3 || '0'),
      gap_1: parseFloat(gap_1 || '0'),
      gap_2: parseFloat(gap_2 || '0'),
    };
  })();

  // State management
  const [timeRange, setTimeRange] = useState<"day" | "hour">("day");
  const [gapFilter, setGapFilter] = useState<"both" | "positive" | "negative">("both");
  const [gapRange, setGapRange] = useState<[number, number]>([-50, 50]);
  const [liveData, setLiveData] = useState<LiveDataRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if current time is within market hours (9 AM - 4 PM IST)
  const isMarketHours = useMemo(() => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Market hours: 9:00 AM (9:00) to 4:00 PM (16:00)
    const currentTimeInMinutes = hours * 60 + minutes;
    const marketOpenTime = 9 * 60; // 9:00 AM
    const marketCloseTime = 16 * 60; // 4:00 PM

    return currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime;
  }, []);

  // Update market hours status every minute
  const [isMarketOpen, setIsMarketOpen] = useState(isMarketHours);

  useEffect(() => {
    // Update market hours status immediately
    setIsMarketOpen(isMarketHours);

    // Set up interval to check every minute
    const interval = setInterval(() => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = istTime.getHours();
      const minutes = istTime.getMinutes();
      const currentTimeInMinutes = hours * 60 + minutes;
      const marketOpenTime = 9 * 60;
      const marketCloseTime = 16 * 60;

      setIsMarketOpen(currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isMarketHours]);

  // Get symbol from state (single symbol)
  const symbol = useMemo(() => {
    if (!state) return '';
    return state.name;
  }, [state]);

  // WebSocket connection for live data
  const { isConnected, marketData, marketDataHistory, subscribeToSymbols, unsubscribeFromSymbols } = useSocketIO();

  // Fetch filtered arbitrage data
  const {
    data: filteredData,
    loading,
    error,
    pagination,
    summary,
    refetch,
  } = useArbitrageDetails({
    instrumentId: instrumentId!,
    timeRange,
    page: 1,
    limit: 180,
    gapFilter,
    minGap: gapRange[0],
    maxGap: gapRange[1],
  });

  // Track the currently subscribed symbol to avoid duplicate subscriptions
  const subscribedSymbolRef = useRef<string>('');

  // Subscribe to symbol when connected and during market hours
  useEffect(() => {
    // Only subscribe during market hours
    if (!symbol || !isConnected || !isMarketOpen) {
      // Unsubscribe if market is closed but we were subscribed
      if (subscribedSymbolRef.current && !isMarketOpen) {
        console.log('🔕 Unsubscribing - Market closed:', subscribedSymbolRef.current);
        unsubscribeFromSymbols([subscribedSymbolRef.current]);
        subscribedSymbolRef.current = '';
      }
      return;
    }

    // Check if we need to subscribe (avoid duplicate subscriptions)
    if (symbol !== subscribedSymbolRef.current) {
      // Unsubscribe from old symbol if any
      if (subscribedSymbolRef.current) {
        console.log('🔕 Unsubscribing from old symbol:', subscribedSymbolRef.current);
        unsubscribeFromSymbols([subscribedSymbolRef.current]);
      }

      // Subscribe to new symbol
      console.log('🔔 Subscribing to symbol:', symbol);
      subscribeToSymbols([symbol]);
      subscribedSymbolRef.current = symbol;
    }

    // Cleanup: unsubscribe when component unmounts
    return () => {
      if (subscribedSymbolRef.current) {
        console.log('🔕 Unsubscribing on unmount:', subscribedSymbolRef.current);
        unsubscribeFromSymbols([subscribedSymbolRef.current]);
        subscribedSymbolRef.current = '';
      }
    };
  }, [symbol, isConnected, isMarketOpen, subscribeToSymbols, unsubscribeFromSymbols]);

  // Update live data from market data
  useEffect(() => {
    console.log('🔍 Market Data received:', marketData);
    console.log('🔍 Market Data History:', marketDataHistory);
    console.log('🔍 Current Symbol:', symbol);

    if (marketData && symbol) {
      // Check if marketData has the symbol property and matches our subscribed symbol
      if (marketData.symbol === symbol) {
        console.log('✅ Data matches subscribed symbol:', symbol, marketData);

        const newRow: LiveDataRow = {
          symbol: marketData.symbol || symbol,
          time: new Date(marketData.timestamp || marketData.time || Date.now()).toLocaleTimeString(),
          ltp: marketData.ltp || marketData.price || 0,
          volume: marketData.volume || 0,
          oi: marketData.oi || 0,
          ltq: marketData.ltq || 0,
          avgTradedPrice: marketData.avgTradedPrice || 0,
          tbq: marketData.tbq || 0,
          tsq: marketData.tsq || 0,
          open: marketData.open || 0,
          high: marketData.high || 0,
          low: marketData.low || 0,
          close: marketData.close || 0,
          totalBuyQty: marketData.totalBuyQty || 0,
          totalSellQty: marketData.totalSellQty || 0,
        };

        // Keep only latest 5 rows
        setLiveData((prev) => {
          const updated = [newRow, ...prev].slice(0, 5);
          console.log('📊 Updated live data (latest 5):', updated);
          return updated;
        });
      } else {
        console.log('⚠️ Symbol mismatch - Expected:', symbol, 'Received:', marketData.symbol);
      }
    }
  }, [marketData, symbol]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Format number helper
  const formatNumber = (num: number, decimals = 2) => {
    return Number(num).toFixed(decimals) || "0.00";
  };

  if (!state) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No data available. Please select a row from the arbitrage table.</p>
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
            <Badge variant="outline">{new Date(state.date).toLocaleDateString()}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Instrument ID: {state.instrumentid}
          </p>
        </div>
      </div>

      <Separator />

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
                  <TableHead className="text-center">Near Future Symbol</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Next Future Symbol</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Far Future Symbol</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Gap</TableHead>
                  <TableHead className="text-center">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center">{state.name}</TableCell>
                  <TableCell className="text-center">{state.date}</TableCell>
                  <TableCell className="text-center">{state.symbol_1}</TableCell>
                  <TableCell className="text-center">{formatNumber(state.price_1)}</TableCell>
                  <TableCell className="text-center">{state.symbol_2}</TableCell>
                  <TableCell className="text-center">{formatNumber(state.price_2)}</TableCell>
                  <TableCell className="text-center">{state.symbol_3}</TableCell>
                  <TableCell className="text-center">{formatNumber(state.price_3)}</TableCell>
                  <TableCell className={state.gap_1 > 0 ? "text-green-600 text-center" : "text-red-600 text-center"}>
                    {formatNumber(state.gap_1)}
                  </TableCell>
                  <TableCell className={state.gap_2 > 0 ? "text-green-600 text-center" : "text-red-600 text-center"}>
                    {formatNumber(state.gap_2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Live Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Market Data</CardTitle>
            <div className="flex items-center gap-2">
              {isMarketOpen ? (
                <>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "LIVE" : "OFFLINE"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </>
              ) : (
                <Badge variant="secondary">MARKET CLOSED</Badge>
              )}
            </div>
          </div>
          {!isMarketOpen && (
            <CardDescription className="mt-2">
              Live market data is only available during market hours (9:00 AM - 4:00 PM IST)
            </CardDescription>
          )}
        </CardHeader>
        
          {isMarketOpen ? (
            <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Symbol</TableHead>
                    <TableHead className="text-center">Time</TableHead>
                    <TableHead className="text-center">LTP</TableHead>
                    <TableHead className="text-center">Volume</TableHead>
                    <TableHead className="text-center">OI</TableHead>
                    <TableHead className="text-center">LTQ</TableHead>
                    <TableHead className="text-center">Avg Price</TableHead>
                    <TableHead className="text-center">TBQ</TableHead>
                    <TableHead className="text-center">TSQ</TableHead>
                    <TableHead className="text-center">Open</TableHead>
                    <TableHead className="text-center">High</TableHead>
                    <TableHead className="text-center">Low</TableHead>
                    <TableHead className="text-center">Close</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveData.length > 0 ? (
                    liveData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.symbol}</TableCell>
                        <TableCell className="text-center">{row.time}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.ltp)}</TableCell>
                        <TableCell className="text-center">{row.volume.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{row.oi.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{row.ltq.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.avgTradedPrice)}</TableCell>
                        <TableCell className="text-center">{row.tbq.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{row.tsq.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.open)}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.high)}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.low)}</TableCell>
                        <TableCell className="text-center">{formatNumber(row.close)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-muted-foreground">
                        {isConnected ? "Waiting for live data..." : "Disconnected from live feed"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </CardContent>
          ) : (
            <div> 
            </div>
          )}
      </Card>

      {/* Section 3: Filtered Query Data */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Arbitrage Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="mt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Time Range Toggle */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Data Trend</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="time-range" className="text-sm">Day-wise</Label>
                    <Switch
                      id="time-range"
                      checked={timeRange === "hour"}
                      onCheckedChange={(checked) => setTimeRange(checked ? "hour" : "day")}
                    />
                    <Label htmlFor="time-range" className="text-sm">Hour-wise</Label>
                  </div>
                </div>

                {/* Gap Type Filter */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Gap Type</Label>
                  <RadioGroup className="flex space-x-2" value={gapFilter} onValueChange={(value: any) => setGapFilter(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="text-sm font-normal">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="positive" id="positive" />
                      <Label htmlFor="positive" className="text-sm font-normal">Positive Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="negative" id="negative" />
                      <Label htmlFor="negative" className="text-sm font-normal">Negative Only</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Gap Range Filter */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Gap Range</Label>
                  <div className="space-y-4">
                    <div className="relative px-3">
                      <Slider
                        value={gapRange}
                        onValueChange={(value) => setGapRange(value as [number, number])}
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

                      {/* ✅ Static scale labels */}
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>-100</span>
                        <span>0</span>
                        <span>+100</span>
                      </div>

                      {/* ✅ Dynamic value labels */}
                      <div className="absolute top-0 left-0 right-0 -translate-y-4 flex justify-between text-xs font-medium text-primary mx-3">
                        <span>{gapRange[0]}</span>
                        <span>{gapRange[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positive Gaps</CardTitle>
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
                <CardTitle className="text-sm font-medium">Negative Gaps</CardTitle>
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
                  <TableHead className="text-center">Near Future Symbol</TableHead>
                  <TableHead className="text-center">Near Future Time</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Next Future Symbol</TableHead>
                  <TableHead className="text-center">Next Future Time</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Far Future Symbol</TableHead>
                  <TableHead className="text-center">Far Future Time</TableHead>
                  <TableHead className="text-center">Price</TableHead>
                  <TableHead className="text-center">Gap (Near & Next)</TableHead>
                  <TableHead className="text-center">Gap (Next & Far)</TableHead>
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
                    <TableRow key={idx}>
                      <TableCell className="text-center">
                        {row.date.split("T")[0]}
                      </TableCell>
                      <TableCell className="text-center">{row.symbol_1 || 'N/A'}</TableCell>
                      <TableCell className="text-center">{row.time_1 || '00:00'}</TableCell>
                      <TableCell className="text-center">{formatNumber(row.price_1)}</TableCell>
                      <TableCell className="text-center">{row.symbol_2 || 'N/A'}</TableCell>
                      <TableCell className="text-center">{row.time_2 || '00:00'}</TableCell>
                      <TableCell className="text-center">{formatNumber(row.price_2)}</TableCell>
                      <TableCell className="text-center">{row.symbol_3 || 'N/A'}</TableCell>
                      <TableCell className="text-center">{row.time_3 || '00:00'}</TableCell>
                      <TableCell className="text-center">{formatNumber(row.price_3)}</TableCell>
                      <TableCell className={row.gap_1 > 0 ? "text-green-600 text-center" : "text-red-600 text-center"}>
                        {formatNumber(row.gap_1)}
                      </TableCell>
                      <TableCell className={row.gap_2 > 0 ? "text-green-600 text-center" : "text-red-600 text-center"}>
                        {formatNumber(row.gap_2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData?.length || 0} of {pagination.total} rows
              </p>
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
