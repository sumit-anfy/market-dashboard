// import { OHLCDataManager, ohlcDataManager, ohlcUtils } from "./ohlcDataManager";
// import { OHLCData, SymbolMarketData } from "../types/market";
// import { MarketData } from "../hooks/useSocketIO";

// /**
//  * Integration utilities for OHLC data management with existing market data system
//  */

// /**
//  * Convert socket market data to OHLC format and add to manager
//  */
// export function processMarketDataForOHLC(marketData: MarketData): void {
//   if (!marketData.symbol) {
//     console.warn("Market data missing symbol, cannot process for OHLC");
//     return;
//   }

//   const ohlcData = ohlcDataManager.transformMarketDataToOHLC(marketData);
//   if (ohlcData) {
//     ohlcDataManager.addOHLCEntry(marketData.symbol, ohlcData);
//   }
// }

// /**
//  * Get OHLC data for multiple symbols
//  */
// export function getMultiSymbolOHLCData(
//   symbols: string[],
//   maxEntries: number = 5
// ): {
//   [symbol: string]: OHLCData[];
// } {
//   const result: { [symbol: string]: OHLCData[] } = {};

//   symbols.forEach((symbol) => {
//     result[symbol] = ohlcDataManager.getLatestEntries(symbol, maxEntries);
//   });

//   return result;
// }

// /**
//  * Initialize OHLC data for symbols
//  */
// export function initializeSymbolOHLCData(symbols: string[]): void {
//   symbols.forEach((symbol) => {
//     if (!ohlcDataManager.hasData(symbol)) {
//       // Initialize with empty array - data will be populated as it comes in
//       console.log(`Initialized OHLC tracking for symbol: ${symbol}`);
//     }
//   });
// }

// /**
//  * Clean up OHLC data for symbols that are no longer needed
//  */
// export function cleanupUnusedSymbols(activeSymbols: string[]): void {
//   const availableSymbols = ohlcDataManager.getAvailableSymbols();
//   const unusedSymbols = availableSymbols.filter(
//     (symbol) => !activeSymbols.includes(symbol)
//   );

//   unusedSymbols.forEach((symbol) => {
//     ohlcDataManager.clearHistory(symbol);
//     console.log(`Cleaned up OHLC data for unused symbol: ${symbol}`);
//   });
// }

// /**
//  * Get formatted OHLC data for display in tables
//  */
// export function getFormattedOHLCData(
//   symbol: string,
//   maxEntries: number = 5
// ): Array<{
//   timestamp: string;
//   open: string;
//   high: string;
//   low: string;
//   close: string;
// }> {
//   const rawData = ohlcDataManager.getLatestEntries(symbol, maxEntries);
//   return rawData.map((data) => ohlcUtils.formatOHLCForDisplay(data));
// }

// /**
//  * Get symbol summary with latest OHLC data
//  */
// export function getSymbolSummary(symbol: string): {
//   symbol: string;
//   hasData: boolean;
//   entryCount: number;
//   latestEntry: OHLCData | null;
//   latestPrice: number | null;
//   priceChange: { change: number; changePercent: number } | null;
// } {
//   const hasData = ohlcDataManager.hasData(symbol);
//   const entryCount = ohlcDataManager.getEntryCount(symbol);
//   const latestEntry = ohlcDataManager.getLatestEntry(symbol);

//   let latestPrice: number | null = null;
//   let priceChange: { change: number; changePercent: number } | null = null;

//   if (latestEntry) {
//     latestPrice = latestEntry.close;

//     // Calculate change if we have at least 2 entries
//     const entries = ohlcDataManager.getLatestEntries(symbol, 2);
//     if (entries.length >= 2) {
//       priceChange = ohlcUtils.calculateChange(entries[0], entries[1]);
//     }
//   }

//   return {
//     symbol,
//     hasData,
//     entryCount,
//     latestEntry,
//     latestPrice,
//     priceChange,
//   };
// }

// /**
//  * Batch process multiple market data updates
//  */
// export function processBatchMarketData(marketDataArray: MarketData[]): void {
//   const symbolGroups: { [symbol: string]: MarketData[] } = {};

//   // Group by symbol
//   marketDataArray.forEach((data) => {
//     if (data.symbol) {
//       if (!symbolGroups[data.symbol]) {
//         symbolGroups[data.symbol] = [];
//       }
//       symbolGroups[data.symbol].push(data);
//     }
//   });

//   // Process each symbol's data
//   Object.keys(symbolGroups).forEach((symbol) => {
//     const symbolData = symbolGroups[symbol];
//     const ohlcEntries: OHLCData[] = [];

//     symbolData.forEach((data) => {
//       const ohlcData = ohlcDataManager.transformMarketDataToOHLC(data);
//       if (ohlcData) {
//         ohlcEntries.push(ohlcData);
//       }
//     });

//     if (ohlcEntries.length > 0) {
//       ohlcDataManager.addBatchOHLCEntries(symbol, ohlcEntries);
//     }
//   });
// }

// /**
//  * Get memory usage statistics for monitoring
//  */
// export function getOHLCMemoryStats(): {
//   totalSymbols: number;
//   totalEntries: number;
//   maxEntriesPerSymbol: number;
//   symbolStats: { [symbol: string]: number };
//   memoryEfficiency: string;
// } {
//   const stats = ohlcDataManager.getMemoryStats();
//   const efficiency =
//     stats.totalSymbols > 0
//       ? `${(
//           (stats.totalEntries /
//             (stats.totalSymbols * stats.maxEntriesPerSymbol)) *
//           100
//         ).toFixed(1)}%`
//       : "0%";

//   return {
//     ...stats,
//     memoryEfficiency: efficiency,
//   };
// }

// /**
//  * Validate and sanitize symbol names for OHLC operations
//  */
// export function sanitizeSymbolName(symbol: string): string | null {
//   if (typeof symbol !== "string") {
//     return null;
//   }

//   const cleaned = symbol.trim().toUpperCase();

//   // Basic validation - symbol should be alphanumeric with possible dots, hyphens, underscores
//   if (
//     !/^[A-Z0-9._-]+$/.test(cleaned) ||
//     cleaned.length === 0 ||
//     cleaned.length > 20
//   ) {
//     return null;
//   }

//   return cleaned;
// }

// /**
//  * Create a new OHLC data manager instance with custom settings
//  */
// export function createCustomOHLCManager(maxEntries: number): OHLCDataManager {
//   return new OHLCDataManager(maxEntries);
// }

// // Export the singleton instance for easy access
// export { ohlcDataManager, ohlcUtils };
