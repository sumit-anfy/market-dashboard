export interface MarketData {
  id: string;
  symbol: string;
  segment: "NSE_EQ" | "NSE_FO" | "BSE_EQ";
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: Date;
}

export interface HistoricalData extends MarketData {
  date: string;
  turnover: number;
}

export interface LiveData extends MarketData {
  bid: number;
  ask: number;
  lastTradeTime: Date;
  dayHigh: number;
  dayLow: number;
  totalTradedVolume: number;
}

// Enhanced interfaces for multi-symbol support
export interface OHLCData {
  timestamp: string;
  bid: number;
  bidQty: number;
  ask: number;
  askQty: number;
}

export interface SymbolMarketData {
  symbol: string;
  ltp: number;
  volume: number;
  timestamp: string;
  ohlcHistory: OHLCData[];
  status: "connected" | "disconnected" | "error";
}

export interface MultiSymbolMarketData {
  [symbol: string]: SymbolMarketData;
}

export interface SymbolCardData {
  symbol: string;
  ltp: number;
  volume: number;
  lastUpdated: string;
  status: "connected" | "disconnected" | "error";
}

export interface SymbolConnectionStatus {
  [symbol: string]: "connected" | "disconnected" | "error";
}

// Component prop interfaces for multi-symbol components
export interface SymbolCardProps {
  symbol: string;
  ltp: number;
  volume: number;
  lastUpdated: string;
  isConnected: boolean;
  status: "connected" | "disconnected" | "error";
}

export interface SymbolOHLCTableProps {
  symbol: string;
  data: OHLCData[];
  maxEntries?: number;
}

export interface MultiSymbolLiveDataProps {
  symbols: string[];
  isMarketOpen: boolean;
}

// Data management interfaces
export interface OHLCDataManager {
  addOHLCEntry(symbol: string, data: OHLCData): void;
  getLatestEntries(symbol: string, count: number): OHLCData[];
  clearHistory(symbol: string): void;
}

// Enhanced market data validation
export interface DataValidator {
  validateMarketData(data: any): MarketData | null;
  validateOHLCData(data: any): OHLCData | null;
  isValidSymbol(symbol: string): boolean;
}

export interface FilterOptions {
  segment: string[];
  symbol: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  minPrice: number | null;
  maxPrice: number | null;
  minVolume: number | null;
  maxVolume: number | null;
}

// Covered Calls Detail Page Types
export interface CoveredCallsDetail {
  id: number;
  underlying: string;
  option_symbol: string;
  time: string;
  underlying_price: number;
  premium: number;
  volume: number;
  strike: number;
  option_type: "CE" | "PE";
  otm: number;
  premium_percentage: number;
  expiry_date: string;
}

export interface CoveredCallsSymbolExpiry {
  symbol: string;
  expiry_date: string;
  strike: number;
}

export interface CoveredCallsDetailsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CoveredCallsDetailsSummary {
  ceCount: number;
  peCount: number;
  totalCount: number;
  avgPremiumPercentage: number;
}

export interface CoveredCallsDetailsResponse {
  success: boolean;
  data: CoveredCallsDetail[];
  pagination: CoveredCallsDetailsPagination;
  summary: CoveredCallsDetailsSummary;
}

export interface CoveredCallsSymbolsExpiryResponse {
  success: boolean;
  data: CoveredCallsSymbolExpiry[];
}
