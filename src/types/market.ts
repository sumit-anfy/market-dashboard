export interface MarketData {
  id: string;
  symbol: string;
  segment: 'NSE_EQ' | 'NSE_FO' | 'BSE_EQ';
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