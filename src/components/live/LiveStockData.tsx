import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LiveSymbolSelector } from "./LiveSymbolSelector";
import { LiveTickGrid } from "./LiveTickGrid";
import { apiClient } from "@/config/axiosClient";
import { toast } from "@/hooks/use-toast";
import { MarketData, useSocketIO } from "@/hooks/useSocketIO";
import {
  DerivativeSymbol,
  EquityInstrument,
  LiveTick,
} from "@/types/market";
import { Loader2, Wifi, WifiOff } from "lucide-react";

const MAX_SYMBOL_SELECTION = 200;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

type SocketMarketData = MarketData & {
  totalVolume?: number | string;
  ltq?: number | string;
  bidQty?: number | string;
  askQty?: number | string;
};

export function LiveStockDataView() {
  const [equities, setEquities] = useState<EquityInstrument[]>([]);
  const [equitySymbolMap, setEquitySymbolMap] = useState<
    Record<number, DerivativeSymbol[]>
  >({});
  const [selectedEquities, setSelectedEquities] = useState<number[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isLoadingEquities, setIsLoadingEquities] = useState(false);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const symbolCacheRef = useRef<Record<number, DerivativeSymbol[]>>({});
  const lastLtpRef = useRef<Record<string, number>>({});

  const {
    isConnected,
    multiSymbolData,
    symbolConnectionStatus,
    subscribeToSymbols,
    unsubscribeFromSymbols,
  } = useSocketIO();

  const previousSymbolsRef = useRef<string[]>([]);

  const loadEquities = useCallback(async () => {
    setIsLoadingEquities(true);
    setFetchError(null);
    try {
      const response = await apiClient.get<ApiResponse<EquityInstrument[]>>(
        "/api/live-data/equities"
      );
      setEquities(response.data.data || []);
    } catch (error: unknown) {
      console.error("Failed to load equities", error);
      toast({
        title: "Equities unavailable",
        description: "Unable to load equities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEquities(false);
    }
  }, []);

  const loadSymbols = useCallback(
    async (
      equityId: number | null,
      options: { skipIfCached?: boolean; equityLabel?: string } = {}
    ) => {
      if (!equityId) {
        return;
      }

      const cached = symbolCacheRef.current[equityId];
      const hasCache = Boolean(cached?.length);
      if (options.skipIfCached && hasCache) {
        // Ensure UI sees cached data
        setEquitySymbolMap((prev) => ({
          ...prev,
          [equityId]: cached || [],
        }));
        return;
      }

      setIsLoadingSymbols(true);
      if (!hasCache) {
        setFetchError(null);
      }

      try {
        const response = await apiClient.get<ApiResponse<DerivativeSymbol[]>>(
          `/api/live-data/equities/${equityId}/symbols`
        );
        const symbols = response.data.data || [];
        symbolCacheRef.current[equityId] = symbols;
        setEquitySymbolMap((prev) => ({
          ...prev,
          [equityId]: symbols,
        }));
      } catch (error: unknown) {
        console.error("Failed to load symbols", error);
        if (!hasCache) {
          const name = options.equityLabel || `Equity ${equityId}`;
          const message = `Unable to load symbols for ${name}.`;
          setFetchError(message);
          toast({
            title: "Symbol load failed",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoadingSymbols(false);
      }
    },
    []
  );

  useEffect(() => {
    loadEquities();
  }, [loadEquities]);

  const liveTicks = useMemo(() => {
    const entries: Record<string, LiveTick> = {};
    Object.entries(multiSymbolData).forEach(([symbol, data]) => {
      if (!symbol) return;
      const payload = data as SocketMarketData;
      const rawLtp = payload.ltp ?? payload.price ?? payload.close ?? payload.bid;
      const ltpValue = rawLtp !== undefined ? Number(rawLtp) : NaN;
      if (!Number.isFinite(ltpValue)) {
        return;
      }
      const volumeRaw = payload.volume ?? payload.totalVolume ?? payload.ltq ?? 0;
      const numericVolume =
        typeof volumeRaw === "string" ? Number(volumeRaw) : Number(volumeRaw ?? 0);
      const prevLtp = lastLtpRef.current[symbol];
      const change = prevLtp !== undefined ? ltpValue - prevLtp : undefined;
      const changePercent =
        prevLtp !== undefined && prevLtp !== 0
          ? (change! / prevLtp) * 100
          : undefined;

      entries[symbol] = {
        symbol,
        ltp: ltpValue,
        volume: Number.isNaN(numericVolume) ? 0 : numericVolume,
        bid: payload.bid !== undefined ? Number(payload.bid) : undefined,
        bidQty: payload.bidQty !== undefined ? Number(payload.bidQty) : undefined,
        ask: payload.ask !== undefined ? Number(payload.ask) : undefined,
        askQty: payload.askQty !== undefined ? Number(payload.askQty) : undefined,
        timestamp: payload.timestamp || new Date().toISOString(),
        prevLtp: prevLtp,
        change,
        changePercent,
      };

      lastLtpRef.current[symbol] = ltpValue;
    });
    return entries;
  }, [multiSymbolData]);

  useEffect(() => {
    if (!isConnected) return;

    const previous = previousSymbolsRef.current;
    const added = selectedSymbols.filter((symbol) => !previous.includes(symbol));
    const removed = previous.filter((symbol) => !selectedSymbols.includes(symbol));

    if (added.length) {
      subscribeToSymbols(added);
    }
    if (removed.length) {
      unsubscribeFromSymbols(removed);
    }

    previousSymbolsRef.current = selectedSymbols;
  }, [
    isConnected,
    selectedSymbols,
    subscribeToSymbols,
    unsubscribeFromSymbols,
  ]);

  useEffect(() => {
    if (isConnected && selectedSymbols.length) {
      subscribeToSymbols(selectedSymbols);
    }
  }, [isConnected, selectedSymbols, subscribeToSymbols]);

  useEffect(() => {
    return () => {
      const active = previousSymbolsRef.current;
      if (active.length) {
        unsubscribeFromSymbols(active);
      }
    };
  }, [unsubscribeFromSymbols]);

  const handleToggleEquity = (equityId: number) => {
    const equity = equities.find((item) => item.id === equityId);
    const equitySymbol = equity?.instrumentType;

    // Enforce max selection before adding the equity symbol
    if (
      equitySymbol &&
      !selectedSymbols.includes(equitySymbol) &&
      selectedSymbols.length >= MAX_SYMBOL_SELECTION
    ) {
      const message = `You can select up to ${MAX_SYMBOL_SELECTION} symbols`;
      setSelectionError(message);
      toast({
        title: "Selection limit reached",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setSelectedEquities((prev) => {
      const exists = prev.includes(equityId);
      if (exists) {
        // Removing equity will also remove its equity symbol
        if (equitySymbol) {
          setSelectedSymbols((symbols) =>
            symbols.filter((sym) => sym !== equitySymbol)
          );
        }
        return prev.filter((id) => id !== equityId);
      }
      if (equitySymbol) {
        setSelectedSymbols((symbols) => {
          if (symbols.includes(equitySymbol)) return symbols;
          const next = [...symbols, equitySymbol];
          return next;
        });
      }
      return [...prev, equityId];
    });
    setSelectionError(null);
    // Always refresh symbols for the equity so dropdown stays current
    loadSymbols(equityId, { equityLabel: equitySymbol, skipIfCached: true });
  };

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      if (prev.includes(symbol)) {
        setSelectionError(null);
        return prev.filter((item) => item !== symbol);
      }

      if (prev.length >= MAX_SYMBOL_SELECTION) {
        const message = `You can select up to ${MAX_SYMBOL_SELECTION} symbols`;
        setSelectionError(message);
        toast({
          title: "Selection limit reached",
          description: message,
          variant: "destructive",
        });
        return prev;
      }

      setSelectionError(null);
      return [...prev, symbol];
    });
  };

  const handleClearSymbols = () => {
    setSelectedSymbols([]);
    setSelectionError(null);
  };

  const symbolOptions = useMemo(() => {
    const seen = new Set<number>();
    const merged: DerivativeSymbol[] = [];
    selectedEquities.forEach((equityId) => {
      const list = equitySymbolMap[equityId] || [];
      list.forEach((symbol) => {
        if (!seen.has(symbol.id)) {
          seen.add(symbol.id);
          merged.push(symbol);
        }
      });
    });
    return merged;
  }, [equitySymbolMap, selectedEquities]);

  // Symbols are fetched when an equity is toggled; no additional effect needed to avoid duplicate calls.

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Stock Data</h2>
          <p className="text-muted-foreground">
            Subscribe to up to 200 FUT and OPT symbols. Only the most recent tick is shown per symbol.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Badge variant="default" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Reconnecting
            </Badge>
          )}
          {isLoadingSymbols && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Symbol selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LiveSymbolSelector
            equities={equities}
            selectedEquities={selectedEquities}
            onToggleEquity={handleToggleEquity}
            symbolOptions={symbolOptions}
            selectedSymbols={selectedSymbols}
            onToggleSymbol={handleToggleSymbol}
            onClearSymbols={handleClearSymbols}
            maxSelections={MAX_SYMBOL_SELECTION}
            selectionError={selectionError}
            isLoadingSymbols={isLoadingSymbols}
            isLoadingEquities={isLoadingEquities}
          />
          {fetchError && selectedEquities.length > 0 && (
            <Alert>
              <AlertTitle>Notice</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <LiveTickGrid
        selectedSymbols={selectedSymbols}
        liveTicks={liveTicks}
        connectionStatus={symbolConnectionStatus}
        isConnected={isConnected}
      />
    </div>
  );
}
