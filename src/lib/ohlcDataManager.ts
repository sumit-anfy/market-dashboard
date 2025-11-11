// import { OHLCData, SymbolMarketData } from "../types/market";

// /**
//  * OHLC Data Manager with circular buffer pattern for efficient memory usage
//  * Implements data validation, transformation utilities, and symbol-specific operations
//  */
// export class OHLCDataManager {
//   private ohlcHistory: { [symbol: string]: OHLCData[] } = {};
//   private readonly maxEntries: number;

//   constructor(maxEntries: number = 5) {
//     this.maxEntries = maxEntries;
//   }

//   /**
//    * Add new OHLC entry for a symbol using circular buffer pattern
//    * Automatically limits memory usage to latest N entries
//    */
//   addOHLCEntry(symbol: string, data: OHLCData): void {
//     if (!this.isValidSymbol(symbol)) {
//       console.warn(`Invalid symbol: ${symbol}`);
//       return;
//     }

//     const validatedData = this.validateOHLCData(data);
//     if (!validatedData) {
//       console.warn(`Invalid OHLC data for symbol ${symbol}:`, data);
//       return;
//     }

//     // Initialize array if it doesn't exist
//     if (!this.ohlcHistory[symbol]) {
//       this.ohlcHistory[symbol] = [];
//     }

//     // Add new entry at the beginning (most recent first)
//     this.ohlcHistory[symbol].unshift(validatedData);

//     // Implement circular buffer - keep only latest maxEntries
//     if (this.ohlcHistory[symbol].length > this.maxEntries) {
//       this.ohlcHistory[symbol] = this.ohlcHistory[symbol].slice(
//         0,
//         this.maxEntries
//       );
//     }
//   }

//   /**
//    * Get latest N entries for a symbol (most recent first)
//    */
//   getLatestEntries(
//     symbol: string,
//     count: number = this.maxEntries
//   ): OHLCData[] {
//     if (!this.isValidSymbol(symbol)) {
//       return [];
//     }

//     const history = this.ohlcHistory[symbol] || [];
//     return history.slice(0, Math.min(count, history.length));
//   }

//   /**
//    * Clear all history for a specific symbol
//    */
//   clearHistory(symbol: string): void {
//     if (this.ohlcHistory[symbol]) {
//       delete this.ohlcHistory[symbol];
//     }
//   }

//   /**
//    * Clear all history for all symbols
//    */
//   clearAllHistory(): void {
//     this.ohlcHistory = {};
//   }

//   /**
//    * Get all symbols that have OHLC data
//    */
//   getAvailableSymbols(): string[] {
//     return Object.keys(this.ohlcHistory);
//   }

//   /**
//    * Get the count of entries for a specific symbol
//    */
//   getEntryCount(symbol: string): number {
//     return this.ohlcHistory[symbol]?.length || 0;
//   }

//   /**
//    * Check if a symbol has any OHLC data
//    */
//   hasData(symbol: string): boolean {
//     return this.getEntryCount(symbol) > 0;
//   }

//   /**
//    * Get the latest (most recent) OHLC entry for a symbol
//    */
//   getLatestEntry(symbol: string): OHLCData | null {
//     const entries = this.getLatestEntries(symbol, 1);
//     return entries.length > 0 ? entries[0] : null;
//   }

//   /**
//    * Batch add multiple OHLC entries for a symbol
//    * Useful for initial data loading or bulk updates
//    */
//   addBatchOHLCEntries(symbol: string, dataArray: OHLCData[]): void {
//     if (!this.isValidSymbol(symbol) || !Array.isArray(dataArray)) {
//       return;
//     }

//     // Sort by timestamp (newest first) and validate each entry
//     const validEntries = dataArray
//       .map((data) => this.validateOHLCData(data))
//       .filter((data): data is OHLCData => data !== null)
//       .sort(
//         (a, b) =>
//           new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//       );

//     if (validEntries.length === 0) {
//       return;
//     }

//     // Initialize array if it doesn't exist
//     if (!this.ohlcHistory[symbol]) {
//       this.ohlcHistory[symbol] = [];
//     }

//     // Add all valid entries and maintain circular buffer
//     this.ohlcHistory[symbol] = [
//       ...validEntries,
//       ...this.ohlcHistory[symbol],
//     ].slice(0, this.maxEntries);
//   }

//   /**
//    * Transform market data to OHLC format
//    * Useful for converting incoming socket data to OHLC structure
//    */
//   transformMarketDataToOHLC(marketData: any): OHLCData | null {
//     if (!marketData || typeof marketData !== "object") {
//       return null;
//     }

//     // Extract OHLC values from various possible field names
//     const open = this.extractNumericValue(marketData, [
//       "open",
//       "openPrice",
//       "o",
//     ]);
//     const high = this.extractNumericValue(marketData, [
//       "high",
//       "highPrice",
//       "h",
//       "dayHigh",
//     ]);
//     const low = this.extractNumericValue(marketData, [
//       "low",
//       "lowPrice",
//       "l",
//       "dayLow",
//     ]);
//     const close = this.extractNumericValue(marketData, [
//       "close",
//       "closePrice",
//       "c",
//       "price",
//       "ltp",
//       "lastPrice",
//     ]);
//     const timestamp = this.extractTimestamp(marketData);

//     if (
//       open === null ||
//       high === null ||
//       low === null ||
//       close === null ||
//       !timestamp
//     ) {
//       return null;
//     }

//     return {
//       timestamp,
//       open,
//       high,
//       low,
//       close,
//     };
//   }

//   /**
//    * Validate OHLC data structure and values
//    */
//   private validateOHLCData(data: any): OHLCData | null {
//     if (!data || typeof data !== "object") {
//       return null;
//     }

//     const { timestamp, open, high, low, close } = data;

//     // Validate timestamp
//     if (!timestamp || !this.isValidTimestamp(timestamp)) {
//       return null;
//     }

//     // Validate numeric values
//     if (
//       !this.isValidPrice(open) ||
//       !this.isValidPrice(high) ||
//       !this.isValidPrice(low) ||
//       !this.isValidPrice(close)
//     ) {
//       return null;
//     }

//     // Validate OHLC relationships (high >= low, etc.)
//     if (
//       high < low ||
//       high < open ||
//       high < close ||
//       low > open ||
//       low > close
//     ) {
//       console.warn("Invalid OHLC relationships:", { open, high, low, close });
//       return null;
//     }

//     return {
//       timestamp: this.normalizeTimestamp(timestamp),
//       open: Number(open),
//       high: Number(high),
//       low: Number(low),
//       close: Number(close),
//     };
//   }

//   /**
//    * Validate symbol name
//    */
//   private isValidSymbol(symbol: string): boolean {
//     return typeof symbol === "string" && symbol.trim().length > 0;
//   }

//   /**
//    * Validate price values
//    */
//   private isValidPrice(value: any): boolean {
//     const num = Number(value);
//     return !isNaN(num) && isFinite(num) && num >= 0;
//   }

//   /**
//    * Validate timestamp
//    */
//   private isValidTimestamp(timestamp: any): boolean {
//     if (!timestamp) return false;

//     const date = new Date(timestamp);
//     return !isNaN(date.getTime());
//   }

//   /**
//    * Normalize timestamp to ISO string format
//    */
//   private normalizeTimestamp(timestamp: any): string {
//     return new Date(timestamp).toISOString();
//   }

//   /**
//    * Extract numeric value from object using multiple possible field names
//    */
//   private extractNumericValue(obj: any, fieldNames: string[]): number | null {
//     for (const fieldName of fieldNames) {
//       if (obj[fieldName] !== undefined && this.isValidPrice(obj[fieldName])) {
//         return Number(obj[fieldName]);
//       }
//     }
//     return null;
//   }

//   /**
//    * Extract timestamp from object using multiple possible field names
//    */
//   private extractTimestamp(obj: any): string | null {
//     const timestampFields = [
//       "timestamp",
//       "time",
//       "datetime",
//       "date",
//       "lastUpdated",
//     ];

//     for (const field of timestampFields) {
//       if (obj[field] && this.isValidTimestamp(obj[field])) {
//         return this.normalizeTimestamp(obj[field]);
//       }
//     }

//     // If no timestamp field found, use current time
//     return new Date().toISOString();
//   }

//   /**
//    * Get memory usage statistics
//    */
//   getMemoryStats(): {
//     totalSymbols: number;
//     totalEntries: number;
//     maxEntriesPerSymbol: number;
//     symbolStats: { [symbol: string]: number };
//   } {
//     const symbolStats: { [symbol: string]: number } = {};
//     let totalEntries = 0;

//     Object.keys(this.ohlcHistory).forEach((symbol) => {
//       const count = this.ohlcHistory[symbol].length;
//       symbolStats[symbol] = count;
//       totalEntries += count;
//     });

//     return {
//       totalSymbols: Object.keys(this.ohlcHistory).length,
//       totalEntries,
//       maxEntriesPerSymbol: this.maxEntries,
//       symbolStats,
//     };
//   }
// }

// /**
//  * Singleton instance for global use
//  */
// export const ohlcDataManager = new OHLCDataManager(5);

// /**
//  * Utility functions for OHLC data operations
//  */
// export const ohlcUtils = {
//   /**
//    * Format OHLC data for display
//    */
//   formatOHLCForDisplay(data: OHLCData): {
//     timestamp: string;
//     open: string;
//     high: string;
//     low: string;
//     close: string;
//   } {
//     return {
//       timestamp: new Date(data.timestamp).toLocaleTimeString(),
//       open: data.open.toFixed(2),
//       high: data.high.toFixed(2),
//       low: data.low.toFixed(2),
//       close: data.close.toFixed(2),
//     };
//   },

//   /**
//    * Calculate price change from OHLC data
//    */
//   calculateChange(
//     current: OHLCData,
//     previous: OHLCData
//   ): {
//     change: number;
//     changePercent: number;
//   } {
//     const change = current.close - previous.close;
//     const changePercent = (change / previous.close) * 100;

//     return {
//       change: Number(change.toFixed(2)),
//       changePercent: Number(changePercent.toFixed(2)),
//     };
//   },

//   /**
//    * Get price range from OHLC data
//    */
//   getPriceRange(data: OHLCData[]): {
//     min: number;
//     max: number;
//     range: number;
//   } {
//     if (data.length === 0) {
//       return { min: 0, max: 0, range: 0 };
//     }

//     const allPrices = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
//     const min = Math.min(...allPrices);
//     const max = Math.max(...allPrices);

//     return {
//       min,
//       max,
//       range: max - min,
//     };
//   },

//   /**
//    * Check if OHLC data represents a bullish candle
//    */
//   isBullish(data: OHLCData): boolean {
//     return data.close > data.open;
//   },

//   /**
//    * Check if OHLC data represents a bearish candle
//    */
//   isBearish(data: OHLCData): boolean {
//     return data.close < data.open;
//   },

//   /**
//    * Check if OHLC data represents a doji candle (open ≈ close)
//    */
//   isDoji(data: OHLCData, threshold: number = 0.01): boolean {
//     const bodySize = Math.abs(data.close - data.open);
//     const range = data.high - data.low;
//     return range > 0 && bodySize / range <= threshold;
//   },
// };
