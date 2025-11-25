import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Clock, Wifi, WifiOff } from "lucide-react";
import { SymbolCard } from "./SymbolCard";
import { SymbolOHLCTable } from "./SymbolOHLCTable";
import { useSocketIO } from "@/hooks/useSocketIO";
import { MarketHoursManager, DataValidator } from "@/utils/errorHandling";
import {
  MultiSymbolLiveDataProps,
  OHLCData,
  SymbolMarketData,
} from "@/types/market";

export function MultiSymbolLiveData({
  symbols,
  isMarketOpen,
}: MultiSymbolLiveDataProps) {
  // WebSocket connection for live data
  const {
    isConnected,
    multiSymbolData,
    symbolConnectionStatus,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    error,
  } = useSocketIO();

  // Local state for OHLC history management
  const [ohlcHistory, setOhlcHistory] = useState<{
    [symbol: string]: OHLCData[];
  }>({});

  // State for refresh functionality and error handling
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);
  const [connectionErrors, setConnectionErrors] = useState<{
    [symbol: string]: { message: string; timestamp: Date };
  }>({});

  // Enhanced OHLC data management utilities with validation
  const addOHLCEntry = useCallback((symbol: string, data: OHLCData) => {
    // Validate OHLC data before adding
    const validatedData = DataValidator.validateOHLCData(data);
    if (!validatedData) {
      console.warn(
        `❌ Invalid OHLC data for symbol ${symbol}, skipping:`,
        data
      );
      setConnectionErrors((prev) => ({
        ...prev,
        [symbol]: {
          message: "Invalid OHLC data received",
          timestamp: new Date(),
        },
      }));
      return;
    }

    setOhlcHistory((prev) => {
      const currentHistory = prev[symbol] || [];
      const newHistory = [...currentHistory, validatedData];

      // Keep only the latest 5 entries (circular buffer pattern)
      const limitedHistory = newHistory.slice(-5);

      return {
        ...prev,
        [symbol]: limitedHistory,
      };
    });

    // Clear any previous error for this symbol
    setConnectionErrors((prev) => {
      const updated = { ...prev };
      delete updated[symbol];
      return updated;
    });
  }, []);

  const getLatestEntries = useCallback(
    (symbol: string, count: number = 5): OHLCData[] => {
      const history = ohlcHistory[symbol] || [];
      return history.slice(-count);
    },
    [ohlcHistory]
  );

  // Utility function for clearing history (available for future use)
  const clearHistory = useCallback((symbol: string) => {
    setOhlcHistory((prev) => {
      const updated = { ...prev };
      delete updated[symbol];
      return updated;
    });
  }, []);

  // Suppress unused variable warning - this function is part of the OHLC data management interface
  void clearHistory;

  // Enhanced market data to OHLC transformation with error tracking
  useEffect(() => {
    Object.entries(multiSymbolData).forEach(([symbol, data]) => {
      if (
        data &&
        data.bid !== undefined &&
        data.bidQty !== undefined &&
        data.ask !== undefined &&
        data.askQty !== undefined
      ) {
        const ohlcEntry: OHLCData = {
          timestamp: data.timestamp || new Date().toISOString(),
          bid: data.bid,
          bidQty: data.bidQty,
          ask: data.ask,
          askQty: data.askQty,
        };

        // Add OHLC entry (validation happens inside addOHLCEntry)
        addOHLCEntry(symbol, ohlcEntry);
      }
    });
  }, [multiSymbolData, addOHLCEntry]);

  // Track errors and update error state
  useEffect(() => {
    if (error) {
      setLastErrorTime(new Date());
    }
  }, [error]);

  // Enhanced subscription management with better error handling
  useEffect(() => {
    // Validate symbols before attempting subscription
    const validSymbols = symbols.filter((symbol) => {
      if (!DataValidator.isValidSymbol(symbol)) {
        console.warn(`❌ Invalid symbol format: ${symbol}`);
        setConnectionErrors((prev) => ({
          ...prev,
          [symbol]: {
            message: "Invalid symbol format",
            timestamp: new Date(),
          },
        }));
        return false;
      }
      return true;
    });

    if (!validSymbols.length) {
      // console.warn("⚠️ No valid symbols provided");
      return;
    }

    if (!isConnected) {
      // console.log(
      //   "⚠️ MultiSymbolLiveData: Not connected, waiting for connection"
      // );
      return;
    }

    if (!isMarketOpen) {
      // Unsubscribe if market is closed
      if (validSymbols.length > 0) {
        unsubscribeFromSymbols(validSymbols);
      }
      return;
    }

    // console.log(
    //   "🔔 MultiSymbolLiveData: Subscribing to symbols:",
    //   validSymbols
    // );
    subscribeToSymbols(validSymbols);

    // Cleanup: unsubscribe when component unmounts or symbols change
    return () => {
      // console.log(
      //   "🔕 MultiSymbolLiveData: Unsubscribing on cleanup:",
      //   validSymbols
      // );
      unsubscribeFromSymbols(validSymbols);
    };
  }, [
    symbols,
    isConnected,
    isMarketOpen,
    subscribeToSymbols,
    unsubscribeFromSymbols,
  ]);

  // Enhanced manual refresh handler with error clearing
  const handleRefresh = useCallback(async () => {
    if (!isMarketOpen || !isConnected) return;

    setIsRefreshing(true);

    // Clear previous errors
    setConnectionErrors({});
    setLastErrorTime(null);

    // Validate symbols before refresh
    const validSymbols = symbols.filter((symbol) =>
      DataValidator.isValidSymbol(symbol)
    );

    if (validSymbols.length === 0) {
      console.warn("⚠️ No valid symbols to refresh");
      setIsRefreshing(false);
      return;
    }

    try {
      // Resubscribe to all valid symbols to get fresh data
      unsubscribeFromSymbols(validSymbols);

      setTimeout(() => {
        subscribeToSymbols(validSymbols);
        setIsRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("❌ Error during refresh:", error);
      setIsRefreshing(false);
    }
  }, [
    symbols,
    isMarketOpen,
    isConnected,
    subscribeToSymbols,
    unsubscribeFromSymbols,
  ]);

  // Transform multiSymbolData to SymbolMarketData format for cards
  const symbolsData: SymbolMarketData[] = useMemo(() => {
    return symbols.map((symbol) => {
      const data = multiSymbolData[symbol];
      // If main WebSocket is not connected, force all symbols to show as disconnected
      const status = !isConnected
        ? "disconnected"
        : (symbolConnectionStatus[symbol] || "disconnected");

      return {
        symbol,
        ltp: data?.price || data?.ltp || 0,
        volume: data?.volume || 0,
        timestamp: data?.timestamp || new Date().toISOString(),
        ohlcHistory: getLatestEntries(symbol),
        status,
      };
    });
  }, [symbols, multiSymbolData, symbolConnectionStatus, getLatestEntries, isConnected]);

  // Enhanced overall connection status with error detection
  const overallConnectionStatus = useMemo(() => {
    if (!isConnected) return "OFFLINE";

    // Check market status using utility
    const marketStatus = MarketHoursManager.getMarketStatus();
    if (marketStatus === "weekend") return "WEEKEND";
    if (marketStatus === "closed") return "MARKET CLOSED";

    // Filter valid symbols for status calculation
    const validSymbols = symbols.filter((symbol) =>
      DataValidator.isValidSymbol(symbol)
    );

    if (validSymbols.length === 0) return "NO VALID SYMBOLS";

    const connectedCount = validSymbols.filter(
      (symbol) => symbolConnectionStatus[symbol] === "connected"
    ).length;

    const errorCount = validSymbols.filter(
      (symbol) => symbolConnectionStatus[symbol] === "error"
    ).length;

    // Check for connection errors
    if (Object.keys(connectionErrors).length > 0 || errorCount > 0) {
      if (connectedCount === 0) return "ERROR";
      return "PARTIAL ERROR";
    }

    if (connectedCount === validSymbols.length) return "LIVE";
    if (connectedCount > 0) return "PARTIAL";
    return "OFFLINE";
  }, [isConnected, symbols, symbolConnectionStatus, connectionErrors]);

  // Enhanced badge variant with more status types
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "LIVE":
        return "default";
      case "PARTIAL":
        return "secondary";
      case "MARKET CLOSED":
      case "WEEKEND":
        return "secondary";
      case "ERROR":
      case "PARTIAL ERROR":
        return "destructive";
      case "NO VALID SYMBOLS":
        return "destructive";
      case "OFFLINE":
      default:
        return "destructive";
    }
  };

  // Get status icon for connection status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "LIVE":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "PARTIAL":
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case "MARKET CLOSED":
      case "WEEKEND":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "ERROR":
      case "PARTIAL ERROR":
      case "NO VALID SYMBOLS":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "OFFLINE":
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Market Data</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(overallConnectionStatus)}
            <Badge variant={getBadgeVariant(overallConnectionStatus)}>
              {overallConnectionStatus}
            </Badge>
            {isMarketOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || !isConnected}
                title="Refresh all symbol connections"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>
        {!isMarketOpen && (
          <div className="mt-2 text-center">
            <p className="text-sm text-black mt-1">
              Live market data is available during market hours (9:00 AM - 4:00
              PM IST, Monday-Friday)
            </p>
          </div>
        )}

        {/* Offline status display */}
        {!isConnected && isMarketOpen && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-gray-600" />
              <p className="text-sm text-gray-800 font-medium">
                WebSocket Offline
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Unable to connect to the WebSocket server. Please check if the backend server is running on the correct port.
            </p>
          </div>
        )}

        {/* Connection error display */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800 font-medium">
                Connection Error
              </p>
            </div>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            {lastErrorTime && (
              <p className="text-xs text-red-500 mt-1">
                Last error: {lastErrorTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Symbol-specific errors */}
        {Object.keys(connectionErrors).length > 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 font-medium">
                Symbol Errors
              </p>
            </div>
            <div className="space-y-1">
              {Object.entries(connectionErrors).map(([symbol, errorInfo]) => (
                <div key={symbol} className="text-xs text-yellow-700">
                  <span className="font-medium">{symbol}:</span>{" "}
                  {errorInfo.message}
                  <span className="text-yellow-600 ml-2">
                    ({errorInfo.timestamp.toLocaleTimeString()})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {isMarketOpen ? (
          <>
            {/* Three-card horizontal layout for desktop, responsive stacking for mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {symbolsData.map((symbolData) => (
                <SymbolCard
                  key={symbolData.symbol}
                  symbol={symbolData.symbol}
                  ltp={symbolData.ltp}
                  volume={symbolData.volume}
                  lastUpdated={symbolData.timestamp}
                  isConnected={isConnected && symbolData.status === "connected"}
                  status={symbolData.status}
                />
              ))}
            </div>

            {/* Three separate OHLC tables below the cards */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {symbolsData.map((symbolData) => (
                  <SymbolOHLCTable
                    key={`ohlc-${symbolData.symbol}`}
                    symbol={symbolData.symbol}
                    data={symbolData.ohlcHistory}
                    maxEntries={5}
                  />
                ))}
              </div>
            </div>

            {/* Connection status summary */}
            {/* {symbols.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Symbols: {symbols.join(", ")}
                  </span>
                  <span className="text-muted-foreground">
                    Connected:{" "}
                    {
                      symbols.filter(
                        (s) => symbolConnectionStatus[s] === "connected"
                      ).length
                    }
                    /{symbols.length}
                  </span>
                </div>
              </div>
            )} */}
          </>
        ) : (
          // Market closed state
          // <div className="text-center py-8 text-muted-foreground">
          //   <div className="space-y-2">
          //     <p className="text-lg font-medium">Market is currently closed</p>
          //     <p className="text-sm">
          //       Live data will be available during market hours (9:00 AM - 4:00
          //       PM IST)
          //     </p>
          //     {symbols.length > 0 && (
          //       <p className="text-xs mt-4">Symbols: {symbols.join(", ")}</p>
          //     )}
          //   </div>
          // </div>
          <></>
        )}
      </CardContent>
    </Card>
  );
}
