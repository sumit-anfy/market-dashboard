import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// // Re-export OHLC utilities for easy access
// export { ohlcDataManager, ohlcUtils, OHLCDataManager } from "./ohlcDataManager";
// export * from "./ohlcIntegration";
