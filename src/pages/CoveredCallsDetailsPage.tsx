import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/config/axiosClient";
import { config } from "@/config/api";
import { ArrowLeft, RefreshCw, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import { CronStatusCard } from "@/components/CronStatusCard";
import { useCoveredCallsDetails } from "@/hooks/useCoveredCallsDetails";
import { useCoveredCallsFilters } from "@/hooks/useCoveredCallsFilters";
import { useSocketIO } from "@/hooks/useSocketIO";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { SortableTableHeader } from "@/components/modal/SortableTableHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { CoveredCallsTrendRow, CoveredCallsTrendResponse } from "@/types/market";

type OptionSide = "CE" | "PE";
type SortDirection = "asc" | "desc";
type SortKey =
  | "strike"
  | "ce_date"
  | "ce_oi"
  | "ce_volume"
  | "ce_ltp"
  | "ce_bidQty"
  | "ce_bid"
  | "ce_ask"
  | "ce_askQty"
  | "pe_askQty"
  | "pe_ask"
  | "pe_bid"
  | "pe_bidQty"
  | "pe_ltp"
  | "pe_volume"
  | "pe_oi"
  | "pe_date";

interface TableSortConfig {
  key: SortKey;
  direction: SortDirection;
}

// Sort keys for trend table
type TrendSortKey =
  | "underlying"
  | "time"
  | "underlying_price"
  | "strike"
  | "expiry_month"
  | "option_type"
  | "premium"
  | "volume"
  | "otm"
  | "premium_percentage";

interface TrendTableSortConfig {
  key: TrendSortKey;
  direction: SortDirection;
}

interface LiveSnapshot {
  symbol: string;
  ltp: number;
  volume: number;
  bid: number;
  bidQty: number;
  ask: number;
  askQty: number;
  oi?: number;
  timestamp: string;
}

interface StrikeGroup {
  strike: number;
  ce?: { symbol: string };
  pe?: { symbol: string };
}

const formatNumber = (num: number | undefined, decimals = 2) => {
  return num !== null && num !== undefined && !Number.isNaN(num)
    ? Number(num).toFixed(decimals)
    : "-";
};

// const formatTime = (ts?: string) => (ts ? new Date(ts).toLocaleTimeString() : "-");
const formatDateOnly = (ts?: string) => (ts ? new Date(ts).toLocaleDateString("en-GB") : "-");

// function OptionLiveBox({
//   title,
//   data,
//   status,
//   highlighted,
// }: {
//   title: string;
//   data?: LiveSnapshot;
//   status?: "connected" | "disconnected" | "error";
//   highlighted?: boolean;
// }) {
//   const statusColor =
//     status === "connected"
//       ? "bg-green-500"
//       : status === "error"
//       ? "bg-red-500"
//       : "bg-gray-400";
//   return (
//     <div
//       className={`rounded-md border p-3 h-[168px] min-h-[168px] overflow-hidden ${
//         highlighted ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""
//       }`}
//     >
//       <div className="flex items-center justify-between mb-2">
//         <span className="text-xs uppercase tracking-wide text-muted-foreground">
//           {title}
//         </span>
//         <div className="flex items-center gap-2">
//           <span className={`h-2 w-2 rounded-full ${statusColor}`} />
//           <Badge variant="outline" className="whitespace-nowrap">
//             {data?.symbol || "-"}
//           </Badge>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
//         <div className="text-muted-foreground">LTP</div>
//         <div className="font-medium whitespace-nowrap">{formatNumber(data?.ltp)}</div>
//         <div className="text-muted-foreground">Volume</div>
//         <div className="font-medium whitespace-nowrap">{formatNumber(data?.volume, 0)}</div>
//         <div className="text-muted-foreground">Bid/BidQty</div>
//         <div className="font-medium whitespace-nowrap">
//           {formatNumber(data?.bid)} / {formatNumber(data?.bidQty, 0)}
//         </div>
//         <div className="text-muted-foreground">Ask/AskQty</div>
//         <div className="font-medium whitespace-nowrap">
//           {formatNumber(data?.ask)} / {formatNumber(data?.askQty, 0)}
//         </div>
//         <div className="text-muted-foreground">Timestamp</div>
//         <div className="font-mono text-xs whitespace-nowrap">
//           {formatTime(data?.timestamp)}
//         </div>
//       </div>
//     </div>
//   );
// }

export default function CoveredCallsDetailsPage() {
  const { instrumentId } = useParams<{ instrumentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Market hours (9:00–16:00 IST)
  const isMarketHours = useMemo(() => {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const minutes = istTime.getHours() * 60 + istTime.getMinutes();
    return minutes >= 9 * 60 && minutes < 16 * 60;
  }, []);
  const [isMarketOpen, setIsMarketOpen] = useState(isMarketHours);
  useEffect(() => {
    setIsMarketOpen(isMarketHours);
    const interval = setInterval(() => {
      const now = new Date();
      const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const minutes = istTime.getHours() * 60 + istTime.getMinutes();
      setIsMarketOpen(minutes >= 9 * 60 && minutes < 16 * 60);
    }, 60000);
    return () => clearInterval(interval);
  }, [isMarketHours]);

  // Fetch base list used to derive symbols/strikes (no historical UI shown)
  const { data: baseData } = useCoveredCallsDetails({
    instrumentId: instrumentId!,
    page: 1,
    limit: 360,
    optionType: "ALL",
  });

  // Fetch filter metadata (symbols, expiry dates, strikes)
  const {
    symbolExpiries,
    expiryDates,
  } = useCoveredCallsFilters({ instrumentId: instrumentId! });

  // Selected expiry date (nearest by default)
  const [selectedExpiry, setSelectedExpiry] = useState<string | undefined>();

  // If we navigated with an option symbol, try to align initial expiry to that symbol
  useEffect(() => {
    if (selectedExpiry || !baseData || baseData.length === 0) return;
    const urlOptionSymbol = searchParams.get("optionSymbol");
    if (!urlOptionSymbol) return;
    const match = (baseData as any[]).find(
      (row) => row.option_symbol === urlOptionSymbol
    );
    if (match?.expiry_date) {
      setSelectedExpiry(match.expiry_date as string);
    }
  }, [baseData, searchParams, selectedExpiry]);

  // Fallback: if no URL-based expiry, default to nearest expiry from filters
  useEffect(() => {
    if (selectedExpiry || !expiryDates || expiryDates.length === 0) return;
    setSelectedExpiry(expiryDates[0]);
  }, [expiryDates, selectedExpiry]);

  // Build grouping by strike with CE/PE symbols and index for quick lookup, for the selected expiry only
  const { strikeGroups, symbolIndex, symbols } = useMemo(() => {
    const groupsMap = new Map<number, StrikeGroup>();
    const index = new Map<string, { strike: number; side: OptionSide }>();
    const allSymbols: string[] = [];

    if (!selectedExpiry) {
      return { strikeGroups: [], symbolIndex: index, symbols: allSymbols };
    }

    symbolExpiries
      .filter((row) => row.expiry_date === selectedExpiry)
      .forEach((row) => {
        const strike = Number(row.strike);
        const symbol = String(row.symbol);
        const side: OptionSide = symbol.endsWith("PE") ? "PE" : "CE";

        if (!groupsMap.has(strike)) groupsMap.set(strike, { strike });
        const group = groupsMap.get(strike)!;
        if (side === "CE") group.ce = { symbol };
        else group.pe = { symbol };

        if (!index.has(symbol)) {
          index.set(symbol, { strike, side });
          allSymbols.push(symbol);
        }
      });

    // Sort strikes ascending
    const ordered = Array.from(groupsMap.values()).sort(
      (a, b) => a.strike - b.strike
    );

    return {
      strikeGroups: ordered,
      symbolIndex: index,
      symbols: allSymbols,
    };
  }, [symbolExpiries, selectedExpiry]);

  // Socket.IO live streaming
  const {
    isConnected,
    multiSymbolData,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    // symbolConnectionStatus,
    error,
  } = useSocketIO();

  // Underlying symbol and live price (computed after socket is available)
  const underlyingSymbol = useMemo(() => {
    const row = (baseData || [])[0];
    return row?.underlying as string | undefined;
  }, [baseData]);
  // Keep last known underlying price even if no websocket data arrives
  const initialUnderlyingPrice = useMemo(() => {
    const v = searchParams.get("underlyingPrice");
    if (!v) return undefined;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);
  const [underlyingPrice, setUnderlyingPrice] = useState<number | undefined>(
    initialUnderlyingPrice
  );
  // Fallback to API baseData price if present and no state yet
  useEffect(() => {
    if (underlyingPrice === undefined && baseData && baseData.length) {
      const p = Number((baseData as any)[0]?.underlying_price);
      if (!Number.isNaN(p)) setUnderlyingPrice(p);
    }
  }, [baseData, underlyingPrice]);
  // Update from websocket when available, otherwise retain last
  useEffect(() => {
    if (!underlyingSymbol) return;
    const d: any = (multiSymbolData as any)[underlyingSymbol];
    const v = d?.price ?? d?.ltp;
    if (typeof v === "number") setUnderlyingPrice(v);
  }, [multiSymbolData, underlyingSymbol]);

  // Subscribe/unsubscribe following Arbitrage logic
  // Subscribe also to underlying to display its live price and shade strikes
  const subscriptionSymbols = useMemo(() => {
    return underlyingSymbol ? [...symbols, underlyingSymbol] : symbols;
  }, [symbols, underlyingSymbol]);
  const symbolsKey = useMemo(() => subscriptionSymbols.join("|"), [subscriptionSymbols]);
  useEffect(() => {
    if (!subscriptionSymbols.length) return;
    if (!isConnected) return;

    if (!isMarketOpen) {
      unsubscribeFromSymbols(subscriptionSymbols);
      return;
    }

    subscribeToSymbols(subscriptionSymbols);
    return () => unsubscribeFromSymbols(subscriptionSymbols);
  }, [symbolsKey, isConnected, isMarketOpen, subscribeToSymbols, unsubscribeFromSymbols, subscriptionSymbols]);

  // Maintain last snapshots per strike/side
  const [snapshots, setSnapshots] = useState<
    Record<number, { ce?: LiveSnapshot; pe?: LiveSnapshot }>
  >({});
  const lastTimestampsRef = useRef<Record<string, string | undefined>>({});
  const [highlighted, setHighlighted] = useState<Record<string, number>>({});

  // Sorting state (by column + direction)
  const [sortConfig, setSortConfig] = useState<TableSortConfig | null>({
    key: "strike",
    direction: "asc",
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

  const orderedGroups = useMemo(() => {
    if (!sortConfig) return strikeGroups;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    const getValue = (group: StrikeGroup): number => {
      const snap = snapshots[group.strike];
      const ce = snap?.ce;
      const pe = snap?.pe;

      switch (key) {
        case "strike":
          return group.strike;
        case "ce_date":
          return ce?.timestamp ? new Date(ce.timestamp).getTime() : Number.NaN;
        case "ce_oi":
          return ce?.oi ?? Number.NaN;
        case "ce_volume":
          return ce?.volume ?? Number.NaN;
        case "ce_ltp":
          return ce?.ltp ?? Number.NaN;
        case "ce_bidQty":
          return ce?.bidQty ?? Number.NaN;
        case "ce_bid":
          return ce?.bid ?? Number.NaN;
        case "ce_ask":
          return ce?.ask ?? Number.NaN;
        case "ce_askQty":
          return ce?.askQty ?? Number.NaN;
        case "pe_date":
          return pe?.timestamp ? new Date(pe.timestamp).getTime() : Number.NaN;
        case "pe_oi":
          return pe?.oi ?? Number.NaN;
        case "pe_volume":
          return pe?.volume ?? Number.NaN;
        case "pe_ltp":
          return pe?.ltp ?? Number.NaN;
        case "pe_bidQty":
          return pe?.bidQty ?? Number.NaN;
        case "pe_bid":
          return pe?.bid ?? Number.NaN;
        case "pe_ask":
          return pe?.ask ?? Number.NaN;
        case "pe_askQty":
          return pe?.askQty ?? Number.NaN;
        default:
          return group.strike;
      }
    };

    const copy = [...strikeGroups];
    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      const aIsNaN = Number.isNaN(av);
      const bIsNaN = Number.isNaN(bv);

      if (aIsNaN && bIsNaN) return 0;
      if (aIsNaN) return 1;
      if (bIsNaN) return -1;
      if (av === bv) return 0;
      return av > bv ? 1 * multiplier : -1 * multiplier;
    });

    return copy;
  }, [strikeGroups, sortConfig, snapshots]);

  // Totals for Volume and OI across all strikes (current snapshots)
  const totals = useMemo(() => {
    let ceVolume = 0;
    let ceOi = 0;
    let peVolume = 0;
    let peOi = 0;
    Object.values(snapshots).forEach((g) => {
      if (g.ce) {
        if (typeof g.ce.volume === "number") ceVolume += g.ce.volume;
        if (typeof g.ce.oi === "number") ceOi += g.ce.oi as number;
      }
      if (g.pe) {
        if (typeof g.pe.volume === "number") peVolume += g.pe.volume;
        if (typeof g.pe.oi === "number") peOi += g.pe.oi as number;
      }
    });
    return { ceVolume, ceOi, peVolume, peOi };
  }, [snapshots]);

  // Historical fallback detection and fetch
  const STALE_MS = Number((import.meta as any).env?.VITE_LIVE_STALE_MS) || 15000; // configurable via VITE_LIVE_STALE_MS
  const [historicalMode, setHistoricalMode] = useState(false);
  const [historicalLastDate, setHistoricalLastDate] = useState<string | null>(null);
  const [historicalLoadedAt, setHistoricalLoadedAt] = useState<number | null>(null);
  const [isReloadingFallback, setIsReloadingFallback] = useState(false);

  // For banner tooltip: derive last-seen timestamps per subscription symbol
  const lastSeen = useMemo(
    () =>
      subscriptionSymbols.map((s) => ({
        symbol: s,
        ts: lastTimestampsRef.current[s],
      })),
    [subscriptionSymbols, multiSymbolData]
  );

  // Build a comprehensive expected symbol list (subs or from groups)
  const expectedSymbols = useMemo(() => {
    if (subscriptionSymbols.length) return subscriptionSymbols;
    const arr: string[] = [];
    strikeGroups.forEach((g) => {
      if (g.ce?.symbol) arr.push(g.ce.symbol);
      if (g.pe?.symbol) arr.push(g.pe.symbol);
    });
    return arr;
  }, [subscriptionSymbols, strikeGroups]);

  // Evaluate staleness periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // If socket disconnected, go historical
      if (!isConnected) {
        setHistoricalMode(true);
        return;
      }

      // If we have symbols but none updated within threshold, go historical
      const now = Date.now();
      const expected = expectedSymbols;
      if (!expected.length) {
        // If we don't even have expected symbols yet but nothing has updated, prefer historical as a safety net
        setHistoricalMode(true);
        return;
      }
      let allStale = true;
      for (const s of expected) {
        const ts = lastTimestampsRef.current[s];
        if (ts) {
          const age = now - new Date(ts).getTime();
          if (age < STALE_MS) {
            allStale = false;
            break;
          }
        }
      }
      setHistoricalMode(allStale);
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, expectedSymbols, STALE_MS]);

  // When expiry changes, reset snapshots and historical metadata to avoid mixing expiries
  useEffect(() => {
    setSnapshots({});
    lastTimestampsRef.current = {};
    setHighlighted({});
    setHistoricalLastDate(null);
    setHistoricalLoadedAt(null);
  }, [selectedExpiry]);

  // Historical fetch (reusable)
  const fetchHistorical = useMemo(
    () =>
      async () => {
        if (!selectedExpiry) return;
        try {
          const url = `${config.apiBaseUrl}/api/covered-calls/${instrumentId}/latest`;
          const resp = await apiClient.get(url, {
            params: { expiryDate: selectedExpiry },
          });
          const rows: any[] = resp.data?.data || [];

          const next: Record<number, { ce?: LiveSnapshot; pe?: LiveSnapshot }> = {};
          let maxDate: string | null = null;
          for (const r of rows) {
            const strikeNum = Number(r.strike);
            const sym: string = r.symbol;
            const side: OptionSide = sym.endsWith("PE") ? "PE" : "CE";
            const ts = r.time;
            const s: LiveSnapshot = {
              symbol: sym,
              ltp: Number(r.ltp) || 0,
              volume: Number(r.volume) || 0,
              bid: Number(r.bid) || 0,
              bidQty: Number(r.bidqty) || 0,
              ask: Number(r.ask) || 0,
              askQty: Number(r.askqty) || 0,
              timestamp: ts,
              oi: r.oi ? Number(r.oi) : undefined,
            };
            if (!next[strikeNum]) next[strikeNum] = {};
            (next[strikeNum] as any)[side.toLowerCase()] = s;

            if (!maxDate || ts > maxDate) maxDate = ts;
          }

          setSnapshots((prev) => {
            const merged: Record<number, { ce?: LiveSnapshot; pe?: LiveSnapshot }> = { ...prev };
            Object.entries(next).forEach(([k, grp]) => {
              const strikeNum = Number(k);
              const prior = merged[strikeNum] || {};
              merged[strikeNum] = { ...grp, ...prior };
            });
            return merged;
          });
          setHistoricalLastDate(maxDate);
          setHistoricalLoadedAt(Date.now());
        } catch (e) {
          console.error("Historical fallback fetch failed", e);
        }
      },
    [instrumentId, selectedExpiry]
  );

  // Fetch historical data once per fallback event
  useEffect(() => {
    if (historicalMode && selectedExpiry) {
      if (!historicalLoadedAt || Date.now() - historicalLoadedAt > 30000) {
        fetchHistorical();
      }
    }
  }, [historicalMode, historicalLoadedAt, fetchHistorical, selectedExpiry]);

  // If market is closed, immediately switch to historical mode (no 15s wait)
  useEffect(() => {
    if (!isMarketOpen) {
      setHistoricalMode(true);
    }
  }, [isMarketOpen]);

  // Populate initial selected row (from list) as last fallback for its strike/side
  useEffect(() => {
    const sym = searchParams.get("optionSymbol");
    const strike = searchParams.get("strikePrice");
    const premium = searchParams.get("premium");
    const volume = searchParams.get("volume");
    const time = searchParams.get("time");
    if (!sym || !strike) return;
    const side: OptionSide = sym.endsWith("PE") ? "PE" : "CE";
    const strikeNum = Number(strike);
    const ts = time?.toString() || new Date().toLocaleString();
    setSnapshots((prev) => {
      const prevGroup = prev[strikeNum] || {};
      if ((prevGroup as any)[side.toLowerCase()]) return prev; // don't overwrite if exists
      const s: LiveSnapshot = {
        symbol: sym,
        ltp: premium ? Number(premium) : 0,
        volume: volume ? Number(volume) : 0,
        bid: 0,
        bidQty: 0,
        ask: 0,
        askQty: 0,
        timestamp: ts,
      };
      return {
        ...prev,
        [strikeNum]: { ...prevGroup, [side.toLowerCase()]: s },
      } as Record<number, { ce?: LiveSnapshot; pe?: LiveSnapshot }>;
    });
  }, [searchParams]);

  // Update snapshots only for symbols with new data
  useEffect(() => {
    Object.entries(multiSymbolData).forEach(([symbol, data]) => {
      const idx = symbolIndex.get(symbol);
      if (!idx) return;

      const ts = (data.timestamp as string) || new Date().toISOString();
      if (lastTimestampsRef.current[symbol] === ts) return;
      lastTimestampsRef.current[symbol] = ts;

      const next: LiveSnapshot = {
        symbol,
        ltp: (data.price as number) ?? (data.ltp as number) ?? 0,
        volume: (data.volume as number) ?? 0,
        bid: (data.bid as number) ?? 0,
        bidQty: (data.bidQty as number) ?? 0,
        ask: (data.ask as number) ?? 0,
        askQty: (data.askQty as number) ?? 0,
        oi: (data as any)?.oi as number | undefined,
        timestamp: ts,
      };

      setSnapshots((prev) => {
        const prevGroup = prev[idx.strike] || {};
        const prevSide = idx.side === "CE" ? prevGroup.ce : prevGroup.pe;
        // Shallow equality to avoid unnecessary re-renders
        if (
          prevSide &&
          prevSide.timestamp === next.timestamp &&
          prevSide.ltp === next.ltp &&
          prevSide.volume === next.volume &&
          prevSide.bid === next.bid &&
          prevSide.bidQty === next.bidQty &&
          prevSide.ask === next.ask &&
          prevSide.askQty === next.askQty
        ) {
          return prev;
        }
        const updated = {
          ...prev,
          [idx.strike]: {
            ...prevGroup,
            [idx.side.toLowerCase()]: next,
          },
        } as Record<number, { ce?: LiveSnapshot; pe?: LiveSnapshot }>;
        return updated;
      });

      // Trigger highlight for the updated symbol briefly
      setHighlighted((prev) => ({ ...prev, [symbol]: Date.now() }));
      setTimeout(() => {
        setHighlighted((prev) => {
          const copy = { ...prev } as Record<string, number>;
          delete copy[symbol];
          return copy;
        });
      }, 800);
    });
  }, [multiSymbolData, symbolIndex]);

  // Refresh subscriptions (global)
  const [, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    if (!isConnected || !isMarketOpen || !subscriptionSymbols.length) return;
    setIsRefreshing(true);
    unsubscribeFromSymbols(subscriptionSymbols);
    setTimeout(() => {
      subscribeToSymbols(subscriptionSymbols);
      setIsRefreshing(false);
    }, 500);
  };

  // ---------- Trend Section State ----------
  type TrendType = "daily" | "hourly";

  const [trendType, setTrendType] = useState<TrendType>("daily");
  // const [, setTrendExpiry] = useState<string>("ALL");
  const [trendOptionType, setTrendOptionType] = useState<"ALL" | "CE" | "PE">(
    "CE"
  );
  // const [, setTrendStrike] = useState<string>("ALL");
  const [trendPage, setTrendPage] = useState(1);
  const [trendOtmMin, setTrendOtmMin] = useState(-50);
  const [trendOtmMax, setTrendOtmMax] = useState(50);
  const [trendPremiumMin, setTrendPremiumMin] = useState(0);
  const [trendPremiumMax, setTrendPremiumMax] = useState(25);
  const [trendStartDate, setTrendStartDate] = useState<string>("");
  const [trendEndDate, setTrendEndDate] = useState<string>("");
  const [appliedTrendFilters, setAppliedTrendFilters] = useState<{
    optionType: "ALL" | "CE" | "PE";
    otmMin: number;
    otmMax: number;
    premiumMin: number;
    premiumMax: number;
    startDate: string;
    endDate: string;
  }>({
    optionType: "CE",
    otmMin: -50,
    otmMax: 50,
    premiumMin: 0,
    premiumMax: 25,
    startDate: "",
    endDate: "",
  });

  const [trendData, setTrendData] = useState<CoveredCallsTrendRow[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendPagination, setTrendPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null>(null);

  // Sorting state for trend table
  const [trendSortConfig, setTrendSortConfig] = useState<TrendTableSortConfig | null>({
    key: "time",
    direction: "desc",
  });

  const getTrendPageNumbers = () => {
    if (!trendPagination) return [];

    const totalPages = trendPagination.totalPages;
    const current = trendPage;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      if (current > 3) {
        pageNumbers.push("...");
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (current < totalPages - 2) {
        pageNumbers.push("...");
      }

      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Build expiry month options (YYYY-MM value, human label) from symbolExpiries
  // const trendExpiryOptions = useMemo(() => {
  //   const map = new Map<string, string>();
  //   symbolExpiries.forEach((row) => {
  //     const d = new Date(row.expiry_date);
  //     if (Number.isNaN(d.getTime())) return;
  //     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
  //       2,
  //       "0"
  //     )}`;
  //     if (!map.has(key)) {
  //       const label = d.toLocaleDateString("en-IN", {
  //         month: "short",
  //         year: "2-digit",
  //       });
  //       map.set(key, label);
  //     }
  //   });
  //   const items = Array.from(map.entries()).map(([value, label]) => ({
  //     value,
  //     label,
  //   }));
  //   items.sort((a, b) => a.value.localeCompare(b.value));
  //   return items;
  // }, [symbolExpiries]);

  // Strike options across all expiries
  // const trendStrikeOptions = useMemo(() => {
  //   const set = new Set<number>();
  //   symbolExpiries.forEach((row) => {
  //     const s = Number(row.strike);
  //     if (!Number.isNaN(s)) set.add(s);
  //   });
  //   return Array.from(set).sort((a, b) => a - b);
  // }, [symbolExpiries]);

  const fetchTrend = useMemo(
    () => async () => {
      try {
        if (!instrumentId) return;
        setTrendLoading(true);
        setTrendError(null);

        const path =
          trendType === "daily"
            ? "trend/daily"
            : "trend/hourly";
        const url = `${config.apiBaseUrl}/api/covered-calls/${instrumentId}/${path}`;

        const params: Record<string, string | number> = {
          page: trendPage,
        };

        // if (appliedTrendFilters.expiry !== "ALL") {
        //   params.expiry = appliedTrendFilters.expiry;
        // }
        if (
          appliedTrendFilters.optionType &&
          appliedTrendFilters.optionType !== "ALL"
        ) {
          params.optionType = appliedTrendFilters.optionType;
        }
        // if (appliedTrendFilters.strike !== "ALL") {
        //   params.strike = appliedTrendFilters.strike;
        // }
        params.minOtm = appliedTrendFilters.otmMin;
        params.maxOtm = appliedTrendFilters.otmMax;
        params.minPremium = appliedTrendFilters.premiumMin;
        params.maxPremium = appliedTrendFilters.premiumMax;
        if (appliedTrendFilters.startDate) {
          params.startDate = appliedTrendFilters.startDate;
        }
        if (appliedTrendFilters.endDate) {
          params.endDate = appliedTrendFilters.endDate;
        }

        const resp = await apiClient.get<CoveredCallsTrendResponse>(url, {
          params,
        });

        if (!resp.data?.success) {
          throw new Error("Failed to fetch trend data");
        }

        setTrendData(resp.data.data || []);
        setTrendPagination(resp.data.pagination);
      } catch (e: any) {
        // Ignore axios cancellation (common on rapid filter changes / StrictMode)
        if (e?.cancelled || e?.message === "canceled" || e?.code === "ERR_CANCELED") {
          // eslint-disable-next-line no-console
          console.log("[CoveredCallsDetails] Trend request cancelled, ignoring");
          return;
        }
        const msg = e?.message || "Failed to fetch trend data";
        setTrendError(msg);
        console.error("Error fetching covered calls trend:", e);
      } finally {
        setTrendLoading(false);
      }
    },
    [instrumentId, trendType, trendPage, appliedTrendFilters]
  );

  // Refetch trend data when filters/page change
  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const handleApplyTrendFilters = () => {
    setTrendPage(1);
    setAppliedTrendFilters({
      optionType: trendOptionType,
      otmMin: trendOtmMin,
      otmMax: trendOtmMax,
      premiumMin: trendPremiumMin,
      premiumMax: trendPremiumMax,
      startDate: trendStartDate || "",
      endDate: trendEndDate || "",
    });
  };

  const handleResetTrendFilters = () => {
    setTrendOptionType("CE");
    setTrendOtmMin(-50);
    setTrendOtmMax(50);
    setTrendPremiumMin(0);
    setTrendPremiumMax(25);
    setTrendStartDate("");
    setTrendEndDate("");
    setTrendPage(1);
    setAppliedTrendFilters({
      optionType: "ALL",
      otmMin: -50,
      otmMax: 50,
      premiumMin: 0,
      premiumMax: 25,
      startDate: "",
      endDate: "",
    });
  };

  const strToDate = (s?: string): Date | undefined => {
    if (!s) return undefined;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  // Color palette for month-based row coloring (same as ArbitrageDetailsPage)
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
  const trendColorMap = useMemo(() => {
    if (!trendData?.length) return new Map<string, string>();

    const map = new Map<string, string>();
    let colorIndex = 0;

    // Ensure chronological order so months get stable, sequential colors
    const sorted = [...trendData].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    for (const row of sorted) {
      const d = new Date(row.time);
      if (Number.isNaN(d.getTime())) continue;
      const key = monthKey(d);
      if (!map.has(key)) {
        map.set(key, colorPalette[colorIndex % colorPalette.length]);
        colorIndex++;
      }
    }

    return map;
  }, [trendData]);

  // Helper to get row color based on row date month
  const getTrendRowColor = (dateStr: string) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const key = monthKey(d);
    return trendColorMap.get(key) || "";
  };

  // Pagination handlers for trend section
  const handleTrendPreviousPage = () => {
    if (trendPage > 1) {
      setTrendPage((prev) => prev - 1);
    }
  };

  const handleTrendNextPage = () => {
    if (trendPagination && trendPagination.hasMore) {
      setTrendPage((prev) => prev + 1);
    }
  };

  const handleTrendPageClick = (page: number) => {
    setTrendPage(page);
  };

  // Trend table sort handler
  const handleTrendSortColumn = (key: TrendSortKey) => {
    setTrendSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Sorted trend data
  const sortedTrendData = useMemo(() => {
    if (!trendData || !trendSortConfig) return trendData;

    const { key, direction } = trendSortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    const getValue = (row: CoveredCallsTrendRow): number | string => {
      switch (key) {
        case "underlying":
          return row.underlying ?? "";
        case "time":
          return row.time ? new Date(row.time).getTime() : Number.NaN;
        case "underlying_price":
          return typeof row.underlying_price === "number"
            ? row.underlying_price
            : parseFloat(String(row.underlying_price ?? "NaN"));
        case "strike":
          return typeof row.strike === "number"
            ? row.strike
            : parseFloat(String(row.strike ?? "NaN"));
        case "expiry_month":
          return row.expiry_month ?? "";
        case "option_type":
          return row.option_type ?? "";
        case "premium":
          return typeof row.premium === "number"
            ? row.premium
            : parseFloat(String(row.premium ?? "NaN"));
        case "volume":
          return typeof row.volume === "number"
            ? row.volume
            : parseFloat(String(row.volume ?? "NaN"));
        case "otm":
          return typeof row.otm === "number"
            ? row.otm
            : parseFloat(String(row.otm ?? "NaN"));
        case "premium_percentage":
          return typeof row.premium_percentage === "number"
            ? row.premium_percentage
            : parseFloat(String(row.premium_percentage ?? "NaN"));
        default:
          return "";
      }
    };

    const copy = [...trendData];
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
  }, [trendData, trendSortConfig]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/covered-calls")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Covered Calls - Live Details
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Instrument ID: {instrumentId}</p>
          {underlyingSymbol && (
            <div className="flex items-center gap-3 text-sm">
              <div className="font-medium">{underlyingSymbol}</div>
              <div className="rounded border px-2 py-0.5 bg-muted font-mono tabular-nums">
                {underlyingPrice !== undefined ? formatNumber(underlyingPrice) : "-"}
              </div>
            </div>
          )}
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSortConfig((prev) => {
                const nextDirection: SortDirection =
                  prev?.key === "strike" && prev.direction === "asc"
                    ? "desc"
                    : "asc";
                return { key: "strike", direction: nextDirection };
              })
            }
          >
            Sort Strike:{" "}
            {sortConfig?.key === "strike" && sortConfig.direction === "desc"
              ? "Desc"
              : "Asc"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Live/Historical banner */}
      <Card className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <CardContent className="py-3 flex items-center justify-between gap-4">
          {/* Left: Live/Historical status + last updated date */}
          <div className="flex items-center gap-3">
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                historicalMode
                  ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {historicalMode ? "HISTORICAL DATA" : "LIVE DATA"}
            </div>
            {historicalMode && historicalLastDate && (
              <div className="text-xs text-muted-foreground">
                Last updated on: {new Date(historicalLastDate).toLocaleDateString("en-GB")}
              </div>
            )}
          </div>

          {/* Right: connection + market + stale info + actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )} */}
              {/* <span className="text-sm">
                Connection: {isConnected ? "Connected" : "Disconnected"}
              </span> */}
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isMarketOpen ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm">Market: {isMarketOpen ? "Open" : "Closed"}</span>
            </div>
            {/* <div className="text-xs text-muted-foreground">
              Stale threshold: {Math.round(STALE_MS / 1000)}s
            </div> */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" /> Details
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium mb-1">Last live timestamps</div>
                    {lastSeen.length === 0 ? (
                      <div className="text-xs">No symbols</div>
                    ) : (
                      lastSeen.slice(0, 10).map((it) => (
                        <div key={it.symbol} className="text-xs">
                          {it.symbol}: {it.ts ? new Date(it.ts).toLocaleTimeString() : "-"}
                        </div>
                      ))
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {historicalMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={isConnected ? async () => {
                  setIsReloadingFallback(true);
                  try {
                    await fetchHistorical();
                  } finally {
                    setIsReloadingFallback(false);
                  }
                } : handleRefresh}
                disabled={isReloadingFallback}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReloadingFallback ? "animate-spin" : ""}`} />
                Reload
              </Button>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!isConnected || !isMarketOpen || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Live
            </Button> */}
            {error && (
              <span className="text-xs text-red-600 truncate max-w-[320px]">
                {error}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      

      {/* <div className="gap-2 grid grid-cols-2 w-full">
        <CronStatusCard jobName="loginJob" displayName="Daily Ticks NSE Options Job" />
        <CronStatusCard jobName="hourlyTicksNseOptJob" displayName="Hourly Ticks NSE Options Job" />
      </div> */}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Live Market Data</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Expiry</span>
            <Select
              value={selectedExpiry ?? ""}
              onValueChange={(value) => setSelectedExpiry(value)}
              disabled={!expiryDates || expiryDates.length === 0}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent>
                {expiryDates?.map((date) => (
                  <SelectItem key={date} value={date}>
                    {formatDateOnly(date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {orderedGroups.length === 0 ? (
            <div className="text-sm text-muted-foreground">No strikes available.</div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <TooltipProvider>
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-background">
                    <TableRow>
                      <TableHead className="text-center border-b" colSpan={8}>CALLS</TableHead>
                      <TableHead className="text-center border-b" colSpan={1}></TableHead>
                      <TableHead className="text-center border-b" colSpan={8}>PUTS</TableHead>
                    </TableRow>
                    <TableRow>
                      <SortableTableHeader
                        sortKey="ce_date"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_oi"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        OI
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_volume"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        Volume
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_ltp"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        LTP
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_bidQty"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        BidQTY
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_bid"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        BID
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_ask"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        ASK
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="ce_askQty"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        ASKQTY
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="strike"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        Strike
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_askQty"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        AskQty
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_ask"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        ASK
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_bid"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        BID
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_bidQty"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        BidQty
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_ltp"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        LTP
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_volume"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        Volume
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_oi"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        OI
                      </SortableTableHeader>
                      <SortableTableHeader
                        sortKey="pe_date"
                        sortConfig={sortConfig}
                        onSort={handleSortColumn}
                        align="center"
                      >
                        Date
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {orderedGroups.map((group) => {
                    const ce = snapshots[group.strike]?.ce;
                    const pe = snapshots[group.strike]?.pe;
                    const ceUpdated = group.ce?.symbol ? !!highlighted[group.ce.symbol] : false;
                    const peUpdated = group.pe?.symbol ? !!highlighted[group.pe.symbol] : false;
                    const shadeCE = underlyingPrice !== undefined && group.strike <= underlyingPrice;
                    const shadePE = underlyingPrice !== undefined && group.strike >= underlyingPrice;
                    // const latestTs = [ce?.timestamp, pe?.timestamp].filter(Boolean).sort().slice(-1)[0] as string | undefined;
                    // const latestDateBadge = formatDateOnly(latestTs);
                    return (
                      <TableRow key={group.strike}>
                        {/* CE side */}
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatDateOnly(ce?.timestamp)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.oi, 0)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.volume, 0)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.ltp)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.bidQty, 0)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.bid)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.ask)}</TableCell>
                        <TableCell className={`text-center ${ceUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(ce?.askQty, 0)}</TableCell>
                          {/* Strike */}
                          <TableCell className="text-center font-semibold  bg-background z-10">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="px-4 inline-block">
                                  <div>{formatNumber(group.strike, 2)}</div>
                                  <div className="mt-1">
                                    {/* <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                      {latestDateBadge}
                                    </span> */}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  {/* <div className="font-medium">CE</div> */}
                                  <div className="text-xs">
                                    Symbol: {ce?.symbol || "-"}
                                  </div>
                                  {/* <div className="text-xs">Date: {formatDateOnly(ce?.timestamp)}</div> */}
                                  {/* <div className="mt-2 font-medium">PE</div> */}
                                  <div className="text-xs">
                                    Symbol: {pe?.symbol || "-"}
                                  </div>
                                  {/* <div className="text-xs">Date: {formatDateOnly(pe?.timestamp)}</div> */}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          {/* PE side (mirrored) */}
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.askQty, 0)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.ask)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.bid)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.bidQty, 0)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.ltp)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.volume, 0)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatNumber(pe?.oi, 0)}</TableCell>
                        <TableCell className={`text-center ${peUpdated ? "bg-amber-50 dark:bg-amber-950/20 transition-colors" : ""} ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}>{formatDateOnly(pe?.timestamp)}</TableCell>
                        </TableRow>
                      );
                  })}
                  {/* Totals row */}
                  <TableRow>
                    {/* CE side totals: OI, Volume, others as '-' */}
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center font-semibold">{formatNumber(totals.ceOi, 0)}</TableCell>
                    <TableCell className="text-center font-semibold">{formatNumber(totals.ceVolume, 0)}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    {/* Strike label */}
                    <TableCell className="text-center font-semibold">Total</TableCell>
                    {/* PE side totals: ..., Volume, OI */}
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center font-semibold">{formatNumber(totals.peVolume, 0)}</TableCell>
                    <TableCell className="text-center font-semibold">{formatNumber(totals.peOi, 0)}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Options Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
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
                  onClick={handleResetTrendFilters}
                >
                  Reset Filters
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                
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
                  onClick={handleApplyTrendFilters}
                  disabled={trendLoading}
                  variant="default"
                  size="sm"
                >
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trend Data Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHeader
                    sortKey="underlying"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Underlying
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="time"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Time
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="underlying_price"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Underlying Price
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="strike"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Strike
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="expiry_month"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Expiry Month
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="option_type"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Option Type
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="premium"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Premium
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="volume"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Volume
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="otm"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    OTM (%)
                  </SortableTableHeader>
                  <SortableTableHeader
                    sortKey="premium_percentage"
                    sortConfig={trendSortConfig as any}
                    onSort={handleTrendSortColumn as any}
                    align="center"
                  >
                    Premium %
                  </SortableTableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : trendError ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-red-600"
                    >
                      Error: {trendError}
                    </TableCell>
                  </TableRow>
                ) : sortedTrendData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      No trend data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTrendData.map((row, idx) => (
                    <TableRow
                      key={`${row.underlying}-${row.time}-${idx}`}
                      className={getTrendRowColor(row.time)}
                    >
                      <TableCell className="text-center">
                        {row.underlying}
                      </TableCell>
                      <TableCell className="text-center">{row.time}</TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.underlying_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.strike, 2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.expiry_month}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={row.option_type === "CE" ? "default" : "secondary"}
                        >
                          {row.option_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.premium)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.volume, 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.otm)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatNumber(row.premium_percentage)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Trend Pagination */}
          {trendPagination && trendPagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(trendPage - 1) * trendPagination.limit + 1} to{" "}
                {Math.min(trendPage * trendPagination.limit, trendPagination.total)} of{" "}
                {trendPagination.total} rows
              </p>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrendPreviousPage}
                  disabled={trendPage === 1 || trendLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getTrendPageNumbers().map((pageNum, idx) =>
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
                          trendPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleTrendPageClick(pageNum as number)}
                        disabled={trendLoading}
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
                  onClick={handleTrendNextPage}
                  disabled={!trendPagination.hasMore || trendLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Pagination Info (when only 1 page) */}
          {trendPagination && trendPagination.totalPages === 1 && (
            <div className="flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Showing all {trendPagination.total} rows
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
