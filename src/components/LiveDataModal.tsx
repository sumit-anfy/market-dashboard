import { useEffect, useMemo } from "react";
import { useSocketIO } from "../hooks/useSocketIO";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Timer,
  Zap,
  Target,
  ArrowUpDown,
} from "lucide-react";

interface LiveDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  title?: string;
}

export function LiveDataModal({
  isOpen,
  onClose,
  symbol,
  title,
}: LiveDataModalProps) {
  const {
    isConnected,
    marketDataHistory,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    error,
  } = useSocketIO({
    url: "http://localhost:3002",
    // url: 'http://15.207.43.160:3000',
    autoConnect: true,
  });

  // Subscribe to symbol when modal opens
  useEffect(() => {
    if (isOpen && isConnected && symbol) {
      console.log("Subscribing to:", symbol);
      subscribeToSymbols([symbol]);
    }

    return () => {
      if (symbol) {
        console.log("Unsubscribing from:", symbol);
        unsubscribeFromSymbols([symbol]);
      }
    };
  }, [isOpen, isConnected, symbol, subscribeToSymbols, unsubscribeFromSymbols]);

  // Get latest data for this symbol
  const latestData = useMemo(() => {
    const symbolData = marketDataHistory.find((d) => d.symbol === symbol);
    return symbolData || null;
  }, [marketDataHistory, symbol]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (!latestData || !latestData.close || !latestData.open) return null;
    const change = latestData.close - latestData.open;
    const changePercent = (change / latestData.open) * 100;
    return { change, changePercent, isPositive: change > 0 };
  }, [latestData]);

  // Get symbol-specific history (last 10 updates)
  const symbolHistory = useMemo(() => {
    return marketDataHistory.filter((d) => d.symbol === symbol).slice(0, 10);
  }, [marketDataHistory, symbol]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                {title || `Live Data - ${symbol}`}
              </DialogTitle>
              <DialogDescription>
                Real-time market data for {symbol}
              </DialogDescription>
            </div>
            <Badge
              variant={isConnected ? "default" : "outline"}
              className="ml-auto"
            >
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-current rounded-full mr-2 animate-pulse"></div>
                  LIVE
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
                  OFFLINE
                </>
              )}
            </Badge>
          </div>
        </DialogHeader>

        {error && (
          <Card className="border-2">
            <CardContent className="p-4">
              <p className="font-semibold">Connection Error:</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Latest Data Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Live Market Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestData ? (
              <div className="space-y-6">
                {/* Price Display */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Price
                    </p>
                    <p className="text-4xl font-bold font-mono">
                      ₹
                      {latestData.price?.toFixed(2) ||
                        latestData.close?.toFixed(2) ||
                        "N/A"}
                    </p>
                  </div>
                  {priceChange && (
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          {priceChange.isPositive ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <TrendingDown className="h-5 w-5" />
                          )}
                          <div className="text-right">
                            <p className="text-lg font-bold font-mono">
                              {priceChange.isPositive ? "+" : ""}
                              {priceChange.change.toFixed(2)}
                            </p>
                            <p className="text-sm font-mono text-muted-foreground">
                              ({priceChange.isPositive ? "+" : ""}
                              {priceChange.changePercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* OHLC Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4" />
                        <p className="text-xs text-muted-foreground font-medium">
                          Open
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">
                        ₹{latestData.open?.toFixed(2) || "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <p className="text-xs text-muted-foreground font-medium">
                          High
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">
                        ₹{latestData.high?.toFixed(2) || "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4" />
                        <p className="text-xs text-muted-foreground font-medium">
                          Low
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">
                        ₹{latestData.low?.toFixed(2) || "N/A"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4" />
                        <p className="text-xs text-muted-foreground font-medium">
                          Volume
                        </p>
                      </div>
                      <p className="text-xl font-bold font-mono">
                        {latestData.volume?.toLocaleString() || "N/A"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Advanced Trading Data */}
                <div>
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Trading Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          LTP (Last Traded)
                        </p>
                        <p className="text-lg font-bold font-mono">
                          ₹{latestData.ltp?.toFixed(2) || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty: {latestData.ltq?.toLocaleString() || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          ATP (Avg Price)
                        </p>
                        <p className="text-lg font-bold font-mono">
                          ₹{latestData.atp?.toFixed(2) || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Total Trades
                        </p>
                        <p className="text-lg font-bold font-mono">
                          {latestData.totalTrades?.toLocaleString() || "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Bid-Ask Spread */}
                <div>
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Bid-Ask Spread
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Best Bid
                        </p>
                        <p className="text-xl font-bold font-mono">
                          ₹{latestData.bid?.toFixed(2) || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty: {latestData.bidQty?.toLocaleString() || "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Best Ask
                        </p>
                        <p className="text-xl font-bold font-mono">
                          ₹{latestData.ask?.toFixed(2) || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty: {latestData.askQty?.toLocaleString() || "N/A"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Turnover */}
                {latestData.totalValue && (
                  <>
                    <Separator />
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Total Turnover
                        </p>
                        <p className="text-2xl font-bold font-mono">
                          ₹{(latestData.totalValue / 10000000).toFixed(2)} Cr
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Separator />

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>
                    Last updated:{" "}
                    {latestData.timestamp
                      ? new Date(latestData.timestamp).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mt-4">
                  {isConnected ? "Waiting for live data..." : "Connecting..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Updates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Updates ({symbolHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {symbolHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No updates received yet</p>
                <p className="text-sm mt-1">Waiting for live data stream...</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Time
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Price
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Open
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          High
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Low
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Volume
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {symbolHistory.map((data, index) => {
                        const change =
                          data.close && data.open
                            ? data.close - data.open
                            : null;
                        const changePercent =
                          change && data.open
                            ? (change / data.open) * 100
                            : null;
                        const isPositive = change ? change > 0 : false;

                        return (
                          <tr key={index} className="hover:bg-muted/50">
                            <td className="px-4 py-2 text-muted-foreground">
                              {data.timestamp
                                ? new Date(data.timestamp).toLocaleTimeString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold font-mono">
                              ₹
                              {data.price?.toFixed(2) ||
                                data.close?.toFixed(2) ||
                                "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              ₹{data.open?.toFixed(2) || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              ₹{data.high?.toFixed(2) || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              ₹{data.low?.toFixed(2) || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {data.volume?.toLocaleString() || "N/A"}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-semibold font-mono ${
                                isPositive ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {changePercent !== null ? (
                                <>
                                  {isPositive ? "+" : ""}
                                  {changePercent.toFixed(2)}%
                                </>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">Symbol: {symbol}</span>
              <span>Updates received: {symbolHistory.length}</span>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
