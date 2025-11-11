// import { OHLCDataManager, ohlcUtils } from "./ohlcDataManager";
// import { OHLCData } from "../types/market";

// /**
//  * Validation and testing utilities for OHLC data management
//  * This file provides functions to validate the OHLC data manager functionality
//  */

// /**
//  * Test data for validation
//  */
// const testOHLCData: OHLCData[] = [
//   {
//     timestamp: "2024-01-01T10:00:00.000Z",
//     open: 100.0,
//     high: 105.0,
//     low: 98.0,
//     close: 103.0,
//   },
//   {
//     timestamp: "2024-01-01T10:01:00.000Z",
//     open: 103.0,
//     high: 107.0,
//     low: 102.0,
//     close: 106.0,
//   },
//   {
//     timestamp: "2024-01-01T10:02:00.000Z",
//     open: 106.0,
//     high: 108.0,
//     low: 104.0,
//     close: 105.0,
//   },
//   {
//     timestamp: "2024-01-01T10:03:00.000Z",
//     open: 105.0,
//     high: 109.0,
//     low: 103.0,
//     close: 108.0,
//   },
//   {
//     timestamp: "2024-01-01T10:04:00.000Z",
//     open: 108.0,
//     high: 110.0,
//     low: 107.0,
//     close: 109.0,
//   },
//   {
//     timestamp: "2024-01-01T10:05:00.000Z",
//     open: 109.0,
//     high: 112.0,
//     low: 108.0,
//     close: 111.0,
//   },
// ];

// /**
//  * Test market data in various formats
//  */
// const testMarketData = [
//   {
//     symbol: "AAPL",
//     price: 150.0,
//     open: 148.0,
//     high: 152.0,
//     low: 147.0,
//     timestamp: "2024-01-01T10:00:00.000Z",
//   },
//   {
//     symbol: "GOOGL",
//     ltp: 2800.0,
//     openPrice: 2790.0,
//     highPrice: 2820.0,
//     lowPrice: 2785.0,
//     time: "2024-01-01T10:00:00.000Z",
//   },
//   {
//     symbol: "MSFT",
//     close: 380.0,
//     o: 378.0,
//     h: 385.0,
//     l: 376.0,
//     datetime: "2024-01-01T10:00:00.000Z",
//   },
// ];

// /**
//  * Validation results interface
//  */
// interface ValidationResult {
//   testName: string;
//   passed: boolean;
//   message: string;
//   details?: any;
// }

// /**
//  * Run all validation tests
//  */
// export function runOHLCValidationTests(): ValidationResult[] {
//   const results: ValidationResult[] = [];

//   console.log("🧪 Starting OHLC Data Manager validation tests...");

//   // Test 1: Basic OHLC manager creation
//   results.push(testOHLCManagerCreation());

//   // Test 2: Adding single OHLC entry
//   results.push(testAddSingleOHLCEntry());

//   // Test 3: Circular buffer functionality
//   results.push(testCircularBuffer());

//   // Test 4: Data validation
//   results.push(testDataValidation());

//   // Test 5: Batch operations
//   results.push(testBatchOperations());

//   // Test 6: Market data transformation
//   results.push(testMarketDataTransformation());

//   // Test 7: Utility functions
//   results.push(testUtilityFunctions());

//   // Test 8: Memory management
//   results.push(testMemoryManagement());

//   // Test 9: Edge cases
//   results.push(testEdgeCases());

//   // Print summary
//   const passed = results.filter((r) => r.passed).length;
//   const total = results.length;

//   console.log(`\n📊 Validation Summary: ${passed}/${total} tests passed`);

//   if (passed === total) {
//     console.log("✅ All OHLC validation tests passed!");
//   } else {
//     console.log("❌ Some tests failed. Check details above.");
//     results
//       .filter((r) => !r.passed)
//       .forEach((result) => {
//         console.log(`❌ ${result.testName}: ${result.message}`);
//       });
//   }

//   return results;
// }

// /**
//  * Test OHLC manager creation
//  */
// function testOHLCManagerCreation(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);
//     const stats = manager.getMemoryStats();

//     return {
//       testName: "OHLC Manager Creation",
//       passed: stats.totalSymbols === 0 && stats.maxEntriesPerSymbol === 5,
//       message: "Manager created successfully with correct initial state",
//     };
//   } catch (error) {
//     return {
//       testName: "OHLC Manager Creation",
//       passed: false,
//       message: `Failed to create manager: ${error}`,
//     };
//   }
// }

// /**
//  * Test adding single OHLC entry
//  */
// function testAddSingleOHLCEntry(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);
//     const testData = testOHLCData[0];

//     manager.addOHLCEntry("TEST", testData);

//     const entries = manager.getLatestEntries("TEST", 1);
//     const hasData = manager.hasData("TEST");
//     const count = manager.getEntryCount("TEST");

//     const passed =
//       entries.length === 1 &&
//       hasData &&
//       count === 1 &&
//       entries[0].open === testData.open &&
//       entries[0].close === testData.close;

//     return {
//       testName: "Add Single OHLC Entry",
//       passed,
//       message: passed
//         ? "Single entry added successfully"
//         : "Failed to add single entry",
//       details: { entries, hasData, count },
//     };
//   } catch (error) {
//     return {
//       testName: "Add Single OHLC Entry",
//       passed: false,
//       message: `Error adding single entry: ${error}`,
//     };
//   }
// }

// /**
//  * Test circular buffer functionality
//  */
// function testCircularBuffer(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(3); // Limit to 3 entries

//     // Add more entries than the limit
//     testOHLCData.forEach((data, index) => {
//       manager.addOHLCEntry("BUFFER_TEST", {
//         ...data,
//         timestamp: new Date(Date.now() + index * 1000).toISOString(),
//       });
//     });

//     const entries = manager.getLatestEntries("BUFFER_TEST");
//     const count = manager.getEntryCount("BUFFER_TEST");

//     const passed = count === 3 && entries.length === 3;

//     return {
//       testName: "Circular Buffer",
//       passed,
//       message: passed
//         ? "Circular buffer working correctly"
//         : "Circular buffer failed",
//       details: {
//         expectedCount: 3,
//         actualCount: count,
//         entriesLength: entries.length,
//       },
//     };
//   } catch (error) {
//     return {
//       testName: "Circular Buffer",
//       passed: false,
//       message: `Circular buffer test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test data validation
//  */
// function testDataValidation(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);

//     // Test valid data
//     const validData = testOHLCData[0];
//     manager.addOHLCEntry("VALID_TEST", validData);
//     const validCount = manager.getEntryCount("VALID_TEST");

//     // Test invalid data
//     const invalidData = [
//       { timestamp: "invalid", open: 100, high: 105, low: 98, close: 103 },
//       {
//         timestamp: "2024-01-01T10:00:00.000Z",
//         open: -100,
//         high: 105,
//         low: 98,
//         close: 103,
//       },
//       {
//         timestamp: "2024-01-01T10:00:00.000Z",
//         open: 100,
//         high: 95,
//         low: 98,
//         close: 103,
//       }, // high < low
//       null,
//       undefined,
//       "not an object",
//     ];

//     invalidData.forEach((data, index) => {
//       manager.addOHLCEntry("INVALID_TEST", data as any);
//     });

//     const invalidCount = manager.getEntryCount("INVALID_TEST");

//     const passed = validCount === 1 && invalidCount === 0;

//     return {
//       testName: "Data Validation",
//       passed,
//       message: passed
//         ? "Data validation working correctly"
//         : "Data validation failed",
//       details: { validCount, invalidCount },
//     };
//   } catch (error) {
//     return {
//       testName: "Data Validation",
//       passed: false,
//       message: `Data validation test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test batch operations
//  */
// function testBatchOperations(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(10);

//     // Add batch data
//     manager.addBatchOHLCEntries("BATCH_TEST", testOHLCData);

//     const entries = manager.getLatestEntries("BATCH_TEST");
//     const count = manager.getEntryCount("BATCH_TEST");

//     const passed =
//       count === testOHLCData.length && entries.length === testOHLCData.length;

//     return {
//       testName: "Batch Operations",
//       passed,
//       message: passed
//         ? "Batch operations working correctly"
//         : "Batch operations failed",
//       details: { expectedCount: testOHLCData.length, actualCount: count },
//     };
//   } catch (error) {
//     return {
//       testName: "Batch Operations",
//       passed: false,
//       message: `Batch operations test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test market data transformation
//  */
// function testMarketDataTransformation(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);
//     let successfulTransformations = 0;

//     testMarketData.forEach((data) => {
//       const ohlcData = manager.transformMarketDataToOHLC(data);
//       if (ohlcData) {
//         successfulTransformations++;
//         manager.addOHLCEntry(data.symbol, ohlcData);
//       }
//     });

//     const passed = successfulTransformations === testMarketData.length;

//     return {
//       testName: "Market Data Transformation",
//       passed,
//       message: passed
//         ? "Market data transformation working correctly"
//         : "Market data transformation failed",
//       details: {
//         expected: testMarketData.length,
//         successful: successfulTransformations,
//       },
//     };
//   } catch (error) {
//     return {
//       testName: "Market Data Transformation",
//       passed: false,
//       message: `Market data transformation test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test utility functions
//  */
// function testUtilityFunctions(): ValidationResult {
//   try {
//     const testData = testOHLCData[0];

//     // Test formatting
//     const formatted = ohlcUtils.formatOHLCForDisplay(testData);
//     const formatPassed =
//       formatted.open === "100.00" && formatted.close === "103.00";

//     // Test price change calculation
//     const change = ohlcUtils.calculateChange(testOHLCData[1], testOHLCData[0]);
//     const changePassed =
//       change.change === 3.0 && Math.abs(change.changePercent - 2.91) < 0.01;

//     // Test price range
//     const range = ohlcUtils.getPriceRange([testOHLCData[0], testOHLCData[1]]);
//     const rangePassed = range.min === 98 && range.max === 107;

//     // Test candle patterns
//     const bullish = ohlcUtils.isBullish(testOHLCData[0]); // close > open
//     const bearish = ohlcUtils.isBearish(testOHLCData[2]); // close < open
//     const patternsPassed = bullish && bearish;

//     const passed =
//       formatPassed && changePassed && rangePassed && patternsPassed;

//     return {
//       testName: "Utility Functions",
//       passed,
//       message: passed
//         ? "Utility functions working correctly"
//         : "Utility functions failed",
//       details: { formatPassed, changePassed, rangePassed, patternsPassed },
//     };
//   } catch (error) {
//     return {
//       testName: "Utility Functions",
//       passed: false,
//       message: `Utility functions test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test memory management
//  */
// function testMemoryManagement(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);

//     // Add data for multiple symbols
//     const symbols = ["SYM1", "SYM2", "SYM3"];
//     symbols.forEach((symbol) => {
//       testOHLCData.forEach((data) => {
//         manager.addOHLCEntry(symbol, data);
//       });
//     });

//     const stats = manager.getMemoryStats();
//     const availableSymbols = manager.getAvailableSymbols();

//     // Clear one symbol
//     manager.clearHistory("SYM1");
//     const statsAfterClear = manager.getMemoryStats();

//     // Clear all
//     manager.clearAllHistory();
//     const statsAfterClearAll = manager.getMemoryStats();

//     const passed =
//       stats.totalSymbols === 3 &&
//       statsAfterClear.totalSymbols === 2 &&
//       statsAfterClearAll.totalSymbols === 0;

//     return {
//       testName: "Memory Management",
//       passed,
//       message: passed
//         ? "Memory management working correctly"
//         : "Memory management failed",
//       details: {
//         initialSymbols: stats.totalSymbols,
//         afterClear: statsAfterClear.totalSymbols,
//         afterClearAll: statsAfterClearAll.totalSymbols,
//       },
//     };
//   } catch (error) {
//     return {
//       testName: "Memory Management",
//       passed: false,
//       message: `Memory management test error: ${error}`,
//     };
//   }
// }

// /**
//  * Test edge cases
//  */
// function testEdgeCases(): ValidationResult {
//   try {
//     const manager = new OHLCDataManager(5);

//     // Test empty symbol
//     manager.addOHLCEntry("", testOHLCData[0]);
//     const emptySymbolCount = manager.getEntryCount("");

//     // Test non-existent symbol
//     const nonExistentEntries = manager.getLatestEntries("NON_EXISTENT");
//     const nonExistentHasData = manager.hasData("NON_EXISTENT");

//     // Test zero max entries
//     const zeroManager = new OHLCDataManager(0);
//     zeroManager.addOHLCEntry("ZERO_TEST", testOHLCData[0]);
//     const zeroCount = zeroManager.getEntryCount("ZERO_TEST");

//     const passed =
//       emptySymbolCount === 0 &&
//       nonExistentEntries.length === 0 &&
//       !nonExistentHasData &&
//       zeroCount === 0;

//     return {
//       testName: "Edge Cases",
//       passed,
//       message: passed ? "Edge cases handled correctly" : "Edge cases failed",
//       details: {
//         emptySymbolCount,
//         nonExistentEntries: nonExistentEntries.length,
//         zeroCount,
//       },
//     };
//   } catch (error) {
//     return {
//       testName: "Edge Cases",
//       passed: false,
//       message: `Edge cases test error: ${error}`,
//     };
//   }
// }

// /**
//  * Run a quick validation check
//  */
// export function quickValidationCheck(): boolean {
//   try {
//     const manager = new OHLCDataManager(5);

//     // Basic functionality test
//     manager.addOHLCEntry("QUICK_TEST", testOHLCData[0]);
//     const hasData = manager.hasData("QUICK_TEST");
//     const entries = manager.getLatestEntries("QUICK_TEST", 1);

//     return hasData && entries.length === 1;
//   } catch (error) {
//     console.error("Quick validation failed:", error);
//     return false;
//   }
// }

// // Export test data for external use
// export { testOHLCData, testMarketData };
