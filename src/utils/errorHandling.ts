import { MarketData } from "@/hooks/useSocketIO";
import { OHLCData } from "@/types/market";

// Error types for different scenarios
export interface SymbolError {
  symbol: string;
  error: string;
  timestamp: string;
  type: "connection" | "data" | "subscription" | "validation";
}

export interface ConnectionError {
  type: "websocket" | "network" | "timeout";
  message: string;
  timestamp: string;
  retryCount: number;
}

// Data validation utilities
export class DataValidator {
  static validateMarketData(data: any): MarketData | null {
    try {
      // Check if data exists and has required fields
      if (!data || typeof data !== "object") {
        console.warn("❌ Invalid market data: not an object", data);
        return null;
      }

      // Validate symbol
      if (
        !data.symbol ||
        typeof data.symbol !== "string" ||
        data.symbol.trim() === ""
      ) {
        console.warn("❌ Invalid market data: missing or invalid symbol", data);
        return null;
      }

      // Validate numeric fields
      const numericFields = ["price", "ltp", "volume"];
      for (const field of numericFields) {
        if (data[field] !== undefined && data[field] !== null) {
          const value = Number(data[field]);
          if (isNaN(value) || value < 0) {
            console.warn(
              `❌ Invalid market data: invalid ${field}`,
              data[field]
            );
            return null;
          }
          data[field] = value;
        }
      }

      // Validate OHLC fields if present
      const ohlcFields = ["open", "high", "low", "close"];
      for (const field of ohlcFields) {
        if (data[field] !== undefined && data[field] !== null) {
          const value = Number(data[field]);
          if (isNaN(value) || value < 0) {
            console.warn(
              `❌ Invalid market data: invalid ${field}`,
              data[field]
            );
            return null;
          }
          data[field] = value;
        }
      }

      // Validate OHLC relationships if all are present
      if (data.open && data.high && data.low && data.close) {
        if (
          data.high < Math.max(data.open, data.close) ||
          data.low > Math.min(data.open, data.close)
        ) {
          console.warn(
            "❌ Invalid market data: OHLC relationship violation",
            data
          );
          return null;
        }
      }

      // Validate timestamp
      if (data.timestamp) {
        const timestamp = new Date(data.timestamp);
        if (isNaN(timestamp.getTime())) {
          console.warn(
            "❌ Invalid market data: invalid timestamp",
            data.timestamp
          );
          data.timestamp = new Date().toISOString();
        }
      } else {
        data.timestamp = new Date().toISOString();
      }

      return data as MarketData;
    } catch (error) {
      console.error("❌ Error validating market data:", error, data);
      return null;
    }
  }

  static validateOHLCData(data: any): OHLCData | null {
    try {
      if (!data || typeof data !== "object") {
        console.warn("❌ Invalid OHLC data: not an object", data);
        return null;
      }

      // Validate required OHLC fields
      const requiredFields = ["bid", "bidQty", "ask", "askQty"];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          console.warn(`❌ Invalid OHLC data: missing ${field}`, data);
          return null;
        }

        const value = Number(data[field]);
        if (isNaN(value) || value <= 0) {
          console.warn(`❌ Invalid OHLC data: invalid ${field}`, data[field]);
          return null;
        }
        data[field] = value;
      }

      // Validate timestamp
      if (data.timestamp) {
        const timestamp = new Date(data.timestamp);
        if (isNaN(timestamp.getTime())) {
          console.warn(
            "❌ Invalid OHLC data: invalid timestamp",
            data.timestamp
          );
          data.timestamp = new Date().toISOString();
        }
      } else {
        data.timestamp = new Date().toISOString();
      }

      return data as OHLCData;
    } catch (error) {
      console.error("❌ Error validating OHLC data:", error, data);
      return null;
    }
  }

  static isValidSymbol(symbol: string): boolean {
    if (!symbol || typeof symbol !== "string") {
      return false;
    }

    const trimmedSymbol = symbol.trim();

    // Basic symbol validation - should be alphanumeric with possible hyphens/underscores
    const symbolRegex = /^[A-Z0-9_-]+$/i;

    return (
      trimmedSymbol.length > 0 &&
      trimmedSymbol.length <= 20 &&
      symbolRegex.test(trimmedSymbol)
    );
  }
}

// Error recovery utilities
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Base delay in ms

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  shouldRetry(symbol: string): boolean {
    const attempts = this.retryAttempts.get(symbol) || 0;
    return attempts < this.maxRetries;
  }

  incrementRetry(symbol: string): number {
    const attempts = (this.retryAttempts.get(symbol) || 0) + 1;
    this.retryAttempts.set(symbol, attempts);
    return attempts;
  }

  resetRetries(symbol: string): void {
    this.retryAttempts.delete(symbol);
  }

  getRetryDelay(symbol: string): number {
    const attempts = this.retryAttempts.get(symbol) || 0;
    // Exponential backoff: base delay * 2^attempts
    return this.retryDelay * Math.pow(2, attempts);
  }

  clearAllRetries(): void {
    this.retryAttempts.clear();
  }
}

// Market hours utilities
export class MarketHoursManager {
  private static readonly MARKET_OPEN_HOUR = 9;
  private static readonly MARKET_OPEN_MINUTE = 0;
  private static readonly MARKET_CLOSE_HOUR = 16;
  private static readonly MARKET_CLOSE_MINUTE = 0;

  static isMarketOpen(date: Date = new Date()): boolean {
    // Check if it's a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Sunday = 0, Saturday = 6
      return false;
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    const currentTimeInMinutes = hours * 60 + minutes;
    const marketOpenInMinutes =
      this.MARKET_OPEN_HOUR * 60 + this.MARKET_OPEN_MINUTE;
    const marketCloseInMinutes =
      this.MARKET_CLOSE_HOUR * 60 + this.MARKET_CLOSE_MINUTE;

    return (
      currentTimeInMinutes >= marketOpenInMinutes &&
      currentTimeInMinutes < marketCloseInMinutes
    );
  }

  static getMarketStatus(
    date: Date = new Date()
  ): "open" | "closed" | "weekend" {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "weekend";
    }

    return this.isMarketOpen(date) ? "open" : "closed";
  }

  static getTimeUntilMarketOpen(date: Date = new Date()): number | null {
    const dayOfWeek = date.getDay();

    // If it's weekend, calculate time until Monday
    if (dayOfWeek === 0) {
      // Sunday
      const mondayOpen = new Date(date);
      mondayOpen.setDate(date.getDate() + 1);
      mondayOpen.setHours(this.MARKET_OPEN_HOUR, this.MARKET_OPEN_MINUTE, 0, 0);
      return mondayOpen.getTime() - date.getTime();
    } else if (dayOfWeek === 6) {
      // Saturday
      const mondayOpen = new Date(date);
      mondayOpen.setDate(date.getDate() + 2);
      mondayOpen.setHours(this.MARKET_OPEN_HOUR, this.MARKET_OPEN_MINUTE, 0, 0);
      return mondayOpen.getTime() - date.getTime();
    }

    // Weekday - check if market is closed
    if (!this.isMarketOpen(date)) {
      const nextOpen = new Date(date);

      // If it's after market close, next open is tomorrow
      if (date.getHours() >= this.MARKET_CLOSE_HOUR) {
        nextOpen.setDate(date.getDate() + 1);
      }

      nextOpen.setHours(this.MARKET_OPEN_HOUR, this.MARKET_OPEN_MINUTE, 0, 0);
      return nextOpen.getTime() - date.getTime();
    }

    return null; // Market is currently open
  }
}

// Connection status utilities
export class ConnectionStatusManager {
  private symbolStatuses: Map<
    string,
    {
      status: "connected" | "disconnected" | "error";
      lastUpdate: Date;
      errorMessage?: string;
    }
  > = new Map();

  updateSymbolStatus(
    symbol: string,
    status: "connected" | "disconnected" | "error",
    errorMessage?: string
  ): void {
    this.symbolStatuses.set(symbol, {
      status,
      lastUpdate: new Date(),
      errorMessage,
    });
  }

  getSymbolStatus(symbol: string): "connected" | "disconnected" | "error" {
    return this.symbolStatuses.get(symbol)?.status || "disconnected";
  }

  getSymbolError(symbol: string): string | undefined {
    return this.symbolStatuses.get(symbol)?.errorMessage;
  }

  getOverallStatus(
    symbols: string[]
  ): "connected" | "partial" | "disconnected" | "error" {
    if (symbols.length === 0) return "disconnected";

    const statuses = symbols.map((symbol) => this.getSymbolStatus(symbol));
    const connectedCount = statuses.filter(
      (status) => status === "connected"
    ).length;
    const errorCount = statuses.filter((status) => status === "error").length;

    if (errorCount > 0) return "error";
    if (connectedCount === symbols.length) return "connected";
    if (connectedCount > 0) return "partial";
    return "disconnected";
  }

  clearSymbolStatus(symbol: string): void {
    this.symbolStatuses.delete(symbol);
  }

  clearAllStatuses(): void {
    this.symbolStatuses.clear();
  }

  getStaleConnections(maxAgeMs: number = 30000): string[] {
    const now = new Date();
    const staleSymbols: string[] = [];

    this.symbolStatuses.forEach((statusInfo, symbol) => {
      if (
        statusInfo.status === "connected" &&
        now.getTime() - statusInfo.lastUpdate.getTime() > maxAgeMs
      ) {
        staleSymbols.push(symbol);
      }
    });

    return staleSymbols;
  }
}
