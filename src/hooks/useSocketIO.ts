import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  DataValidator,
  ErrorRecoveryManager,
  MarketHoursManager,
  ConnectionStatusManager,
} from "@/utils/errorHandling";

export interface MarketData {
  symbol?: string;
  price?: number;
  volume?: number;
  timestamp?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  [key: string]: any;
}

export interface UseSocketIOOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface UseSocketIOReturn {
  socket: Socket | null;
  isConnected: boolean;
  marketData: MarketData | null;
  marketDataHistory: MarketData[];
  // Enhanced multi-symbol support
  multiSymbolData: { [symbol: string]: MarketData };
  symbolConnectionStatus: {
    [symbol: string]: "connected" | "disconnected" | "error";
  };
  subscribeToSymbols: (symbols: string[]) => void;
  unsubscribeFromSymbols: (symbols: string[]) => void;
  getSubscriptions: () => void;
  currentSubscriptions: string[];
  error: string | null;
}

export function useSocketIO(
  options: UseSocketIOOptions = {}
): UseSocketIOReturn {
  const {
    url = import.meta.env.VITE_API_BASE_URL,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketDataHistory, setMarketDataHistory] = useState<MarketData[]>([]);
  // Enhanced multi-symbol state
  const [multiSymbolData, setMultiSymbolData] = useState<{
    [symbol: string]: MarketData;
  }>({});
  const [symbolConnectionStatus, setSymbolConnectionStatus] = useState<{
    [symbol: string]: "connected" | "disconnected" | "error";
  }>({});
  const [currentSubscriptions, setCurrentSubscriptions] = useState<string[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Use ref to store history limit
  const historyLimit = useRef(100);

  // Error handling and recovery managers
  const errorRecoveryManager = useRef(new ErrorRecoveryManager(3, 2000));
  const connectionStatusManager = useRef(new ConnectionStatusManager());
  const reconnectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastDataReceived = useRef<Map<string, Date>>(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    // console.log("🔌 Initializing Socket.io connection to:", url);

    const socketInstance = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ["websocket", "polling"],
    });

    // Connection event handlers
    socketInstance.on("connect", () => {
      // console.log("✅ Socket.io connected:", socketInstance.id);
      setIsConnected(true);
      setError(null);

      // Request current subscriptions to restore symbol statuses after reconnection
      setTimeout(() => {
        if (socketInstance.connected) {
          socketInstance.emit("get-subscriptions");
        }
      }, 100);
    });

    socketInstance.on("disconnect", (reason) => {
      // console.log("❌ Socket.io disconnected:", reason);
      setIsConnected(false);

      // Clear all pending reconnection timeouts
      reconnectionTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      reconnectionTimeouts.current.clear();

      // Mark all symbols as disconnected when main connection is lost
      setSymbolConnectionStatus((prev) => {
        const updated: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        Object.keys(prev).forEach((symbol) => {
          updated[symbol] = "disconnected";
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "disconnected"
          );
        });
        return updated;
      });

      // Set appropriate error message based on disconnect reason
      if (reason === "io server disconnect") {
        setError("Server disconnected the connection");
      } else if (reason === "transport close") {
        setError("Connection lost due to network issues");
      } else if (reason === "transport error") {
        setError("Connection error occurred");
      } else {
        setError(`Connection lost: ${reason}`);
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket.io connection error:", err.message);
      setError(err.message);
      setIsConnected(false);
    });

    // Connection status from backend
    socketInstance.on("connection-status", (data) => {
      console.log("📡 Connection status:", data);
    });

    // Market data events with enhanced error handling
    socketInstance.on("market-data", (data: MarketData) => {
      // console.log("📊 Received market data:", data);

      // Validate incoming data
      const validatedData = DataValidator.validateMarketData(data);
      if (!validatedData) {
        console.error("❌ Invalid market data received, skipping:", data);
        if (data.symbol) {
          const symbol = data.symbol;
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "error",
            "Invalid data format"
          );
          setSymbolConnectionStatus((prev) => ({
            ...prev,
            [symbol]: "error",
          }));
        }
        return;
      }

      setMarketData(validatedData);

      // Update multi-symbol data if symbol is provided
      if (validatedData.symbol) {
        setMultiSymbolData((prev) => ({
          ...prev,
          [validatedData.symbol!]: validatedData,
        }));

        // Update connection status and reset retry count on successful data
        connectionStatusManager.current.updateSymbolStatus(
          validatedData.symbol,
          "connected"
        );
        errorRecoveryManager.current.resetRetries(validatedData.symbol);
        lastDataReceived.current.set(validatedData.symbol, new Date());

        setSymbolConnectionStatus((prev) => ({
          ...prev,
          [validatedData.symbol!]: "connected",
        }));

        // Clear any pending reconnection timeout for this symbol
        const timeoutId = reconnectionTimeouts.current.get(
          validatedData.symbol
        );
        if (timeoutId) {
          clearTimeout(timeoutId);
          reconnectionTimeouts.current.delete(validatedData.symbol);
        }
      }

      // Add to history (keep last N items)
      setMarketDataHistory((prev) => {
        const newHistory = [validatedData, ...prev].slice(
          0,
          historyLimit.current
        );
        return newHistory;
      });
    });

    // Bulk market data with enhanced validation
    socketInstance.on(
      "market-data-bulk",
      (payload: { data: MarketData[]; count: number; timestamp: string }) => {
        // console.log(`📊 Received bulk market data: ${payload.count} items`);

        if (!payload.data || !Array.isArray(payload.data)) {
          console.error("❌ Invalid bulk market data payload:", payload);
          setError("Invalid bulk data format received");
          return;
        }

        // Validate each item in the bulk data
        const validatedData: MarketData[] = [];
        const symbolUpdates: { [symbol: string]: MarketData } = {};
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};

        payload.data.forEach((item) => {
          const validatedItem = DataValidator.validateMarketData(item);
          if (validatedItem) {
            validatedData.push(validatedItem);
            if (validatedItem.symbol) {
              symbolUpdates[validatedItem.symbol] = validatedItem;
              statusUpdates[validatedItem.symbol] = "connected";

              // Update connection tracking
              connectionStatusManager.current.updateSymbolStatus(
                validatedItem.symbol,
                "connected"
              );
              errorRecoveryManager.current.resetRetries(validatedItem.symbol);
              lastDataReceived.current.set(validatedItem.symbol, new Date());
            }
          } else {
            console.warn("❌ Skipping invalid item in bulk data:", item);
          }
        });

        if (validatedData.length > 0) {
          setMarketData(validatedData[0]); // Set latest as current

          if (Object.keys(symbolUpdates).length > 0) {
            setMultiSymbolData((prev) => ({ ...prev, ...symbolUpdates }));
            setSymbolConnectionStatus((prev) => ({
              ...prev,
              ...statusUpdates,
            }));
          }

          // Add validated data to history
          setMarketDataHistory((prev) => {
            const newHistory = [...validatedData, ...prev].slice(
              0,
              historyLimit.current
            );
            return newHistory;
          });
        }
      }
    );

    // Symbol-specific updates with validation
    socketInstance.on("symbol-update", (data: MarketData) => {
      // console.log("📈 Symbol update:", data.symbol, data);

      // Validate incoming symbol update
      const validatedData = DataValidator.validateMarketData(data);
      if (!validatedData) {
        console.error("❌ Invalid symbol update received, skipping:", data);
        if (data.symbol) {
          const symbol = data.symbol;
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "error",
            "Invalid update data"
          );
          setSymbolConnectionStatus((prev) => ({
            ...prev,
            [symbol]: "error",
          }));
        }
        return;
      }

      setMarketData(validatedData);

      // Update multi-symbol data
      if (validatedData.symbol) {
        setMultiSymbolData((prev) => ({
          ...prev,
          [validatedData.symbol!]: validatedData,
        }));

        // Update connection status and tracking
        connectionStatusManager.current.updateSymbolStatus(
          validatedData.symbol,
          "connected"
        );
        errorRecoveryManager.current.resetRetries(validatedData.symbol);
        lastDataReceived.current.set(validatedData.symbol, new Date());

        setSymbolConnectionStatus((prev) => ({
          ...prev,
          [validatedData.symbol!]: "connected",
        }));
      }

      setMarketDataHistory((prev) => {
        const newHistory = [validatedData, ...prev].slice(
          0,
          historyLimit.current
        );
        return newHistory;
      });
    });

    // Subscription confirmations
    socketInstance.on(
      "subscription-confirmed",
      (data: { symbols: string[]; timestamp: string }) => {
        // console.log("✅ Subscription confirmed:", data.symbols);
        setCurrentSubscriptions((prev) => [
          ...new Set([...prev, ...data.symbols]),
        ]);

        // Update connection status for confirmed symbols
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        data.symbols.forEach((symbol) => {
          statusUpdates[symbol] = "connected";
        });
        setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));
      }
    );

    socketInstance.on(
      "unsubscription-confirmed",
      (data: { symbols: string[]; timestamp: string }) => {
        // console.log("✅ Unsubscription confirmed:", data.symbols);
        setCurrentSubscriptions((prev) =>
          prev.filter((s) => !data.symbols.includes(s))
        );

        // Update connection status for unsubscribed symbols
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        data.symbols.forEach((symbol) => {
          statusUpdates[symbol] = "disconnected";
        });
        setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));

        // Remove unsubscribed symbols from multi-symbol data
        setMultiSymbolData((prev) => {
          const updated = { ...prev };
          data.symbols.forEach((symbol) => {
            delete updated[symbol];
          });
          return updated;
        });
      }
    );

    socketInstance.on(
      "current-subscriptions",
      (data: { symbols: string[]; timestamp: string }) => {
        // console.log("📋 Current subscriptions:", data.symbols);
        setCurrentSubscriptions(data.symbols);

        // Update connection status for all current subscriptions
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        data.symbols.forEach((symbol) => {
          statusUpdates[symbol] = "connected";
        });
        setSymbolConnectionStatus(statusUpdates);
      }
    );

    // WebSocket backend status
    socketInstance.on(
      "websocket-status",
      (data: { status: string; timestamp: string }) => {
        console.log("🌐 WebSocket backend status:", data.status);
      }
    );

    // Enhanced symbol-specific error handling with recovery
    socketInstance.on(
      "symbol-error",
      (data: { symbol: string; error: string; timestamp: string }) => {
        console.error(`❌ Symbol error for ${data.symbol}:`, data.error);

        // Update connection status
        connectionStatusManager.current.updateSymbolStatus(
          data.symbol,
          "error",
          data.error
        );
        setSymbolConnectionStatus((prev) => ({
          ...prev,
          [data.symbol]: "error",
        }));
        setError(`Error for symbol ${data.symbol}: ${data.error}`);

        // Attempt recovery if market is open and retries are available
        if (
          MarketHoursManager.isMarketOpen() &&
          errorRecoveryManager.current.shouldRetry(data.symbol)
        ) {
          const retryCount = errorRecoveryManager.current.incrementRetry(
            data.symbol
          );
          const retryDelay = errorRecoveryManager.current.getRetryDelay(
            data.symbol
          );

          // console.log(
          //   `🔄 Scheduling retry ${retryCount} for symbol ${data.symbol} in ${retryDelay}ms`
          // );

          const timeoutId = setTimeout(() => {
            if (socketInstance.connected) {
              console.log(
                `🔄 Retrying subscription for symbol ${data.symbol} (attempt ${retryCount})`
              );
              socketInstance.emit("subscribe-symbols", [data.symbol]);
            }
            reconnectionTimeouts.current.delete(data.symbol);
          }, retryDelay);

          reconnectionTimeouts.current.set(data.symbol, timeoutId);
        } else {
          console.log(
            `❌ Max retries exceeded or market closed for symbol ${data.symbol}`
          );
        }
      }
    );

    // Symbol connection status updates
    socketInstance.on(
      "symbol-connection-status",
      (data: {
        symbol: string;
        status: "connected" | "disconnected" | "error";
        timestamp: string;
      }) => {
        // console.log(`📡 Symbol ${data.symbol} status:`, data.status);
        setSymbolConnectionStatus((prev) => ({
          ...prev,
          [data.symbol]: data.status,
        }));
      }
    );

    // Enhanced subscription errors with recovery
    socketInstance.on(
      "subscription-error",
      (data: { symbols: string[]; error: string; timestamp: string }) => {
        // console.error(
        //   "❌ Subscription error:",
        //   data.error,
        //   "for symbols:",
        //   data.symbols
        // );

        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};

        data.symbols.forEach((symbol) => {
          statusUpdates[symbol] = "error";
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "error",
            data.error
          );

          // Attempt recovery for each failed symbol
          if (
            MarketHoursManager.isMarketOpen() &&
            errorRecoveryManager.current.shouldRetry(symbol)
          ) {
            const retryCount =
              errorRecoveryManager.current.incrementRetry(symbol);
            const retryDelay =
              errorRecoveryManager.current.getRetryDelay(symbol);

            console.log(
              `🔄 Scheduling subscription retry ${retryCount} for symbol ${symbol} in ${retryDelay}ms`
            );

            const timeoutId = setTimeout(() => {
              if (socketInstance.connected) {
                // console.log(
                //   `🔄 Retrying subscription for symbol ${symbol} (attempt ${retryCount})`
                // );
                socketInstance.emit("subscribe-symbols", [symbol]);
              }
              reconnectionTimeouts.current.delete(symbol);
            }, retryDelay);

            reconnectionTimeouts.current.set(symbol, timeoutId);
          }
        });

        setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));
        setError(`Subscription error: ${data.error}`);
      }
    );

    setSocket(socketInstance);

    // Set up periodic health check for stale connections
    const healthCheckInterval = setInterval(() => {
      if (socketInstance.connected) {
        // Check for stale connections (no data received in 30 seconds)
        const staleSymbols =
          connectionStatusManager.current.getStaleConnections(30000);

        if (staleSymbols.length > 0) {
          console.warn(
            "⚠️ Detected stale connections for symbols:",
            staleSymbols
          );

          staleSymbols.forEach((symbol) => {
            connectionStatusManager.current.updateSymbolStatus(
              symbol,
              "error",
              "No data received (connection may be stale)"
            );

            setSymbolConnectionStatus((prev) => ({
              ...prev,
              [symbol]: "error",
            }));

            // Attempt to resubscribe to stale symbols if market is open
            if (
              MarketHoursManager.isMarketOpen() &&
              errorRecoveryManager.current.shouldRetry(symbol)
            ) {
              const retryDelay =
                errorRecoveryManager.current.getRetryDelay(symbol);
              errorRecoveryManager.current.incrementRetry(symbol);

              // console.log(
              //   `🔄 Resubscribing to stale symbol ${symbol} in ${retryDelay}ms`
              // );

              const timeoutId = setTimeout(() => {
                if (socketInstance.connected) {
                  socketInstance.emit("subscribe-symbols", [symbol]);
                }
                reconnectionTimeouts.current.delete(symbol);
              }, retryDelay);

              reconnectionTimeouts.current.set(symbol, timeoutId);
            }
          });
        }

        // Check market hours and handle market closure
        if (!MarketHoursManager.isMarketOpen()) {
          const currentSubs = Array.from(reconnectionTimeouts.current.keys());
          if (currentSubs.length > 0) {
            // console.log("🔕 Market closed, clearing pending reconnections");
            reconnectionTimeouts.current.forEach((timeoutId) => {
              clearTimeout(timeoutId);
            });
            reconnectionTimeouts.current.clear();
            errorRecoveryManager.current.clearAllRetries();
          }
        }
      }
    }, 15000); // Check every 15 seconds

    // Cleanup on unmount
    return () => {
      // console.log("🔌 Disconnecting Socket.io");

      // Clear health check interval
      clearInterval(healthCheckInterval);

      // Clear all pending timeouts
      reconnectionTimeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      reconnectionTimeouts.current.clear();

      // Clear managers
      errorRecoveryManager.current.clearAllRetries();
      connectionStatusManager.current.clearAllStatuses();

      socketInstance.disconnect();
    };
  }, [url, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Enhanced subscribe to symbols with validation and error handling
  const subscribeToSymbols = useCallback(
    (symbols: string[]) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Cannot subscribe: Socket not connected");
        // Mark symbols as disconnected if we can't subscribe
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        symbols.forEach((symbol) => {
          statusUpdates[symbol] = "disconnected";
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "disconnected"
          );
        });
        setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));
        return;
      }

      // Check if market is open before subscribing
      if (!MarketHoursManager.isMarketOpen()) {
        console.warn("⚠️ Cannot subscribe: Market is closed");
        const statusUpdates: {
          [symbol: string]: "connected" | "disconnected" | "error";
        } = {};
        symbols.forEach((symbol) => {
          statusUpdates[symbol] = "disconnected";
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "disconnected",
            "Market is closed"
          );
        });
        setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));
        setError("Cannot subscribe to symbols: Market is closed");
        return;
      }

      // Validate symbols before subscribing
      const validSymbols = symbols.filter((symbol) => {
        if (!DataValidator.isValidSymbol(symbol)) {
          console.warn(`⚠️ Invalid symbol format: ${symbol}`);
          connectionStatusManager.current.updateSymbolStatus(
            symbol,
            "error",
            "Invalid symbol format"
          );
          setSymbolConnectionStatus((prev) => ({
            ...prev,
            [symbol]: "error",
          }));
          return false;
        }
        return true;
      });

      if (validSymbols.length === 0) {
        console.warn("⚠️ No valid symbols to subscribe to");
        setError("No valid symbols provided for subscription");
        return;
      }

      // console.log("📡 Subscribing to symbols:", validSymbols);

      // Mark symbols as attempting connection
      const statusUpdates: {
        [symbol: string]: "connected" | "disconnected" | "error";
      } = {};
      validSymbols.forEach((symbol) => {
        statusUpdates[symbol] = "disconnected"; // Will be updated to "connected" on confirmation
        connectionStatusManager.current.updateSymbolStatus(
          symbol,
          "disconnected"
        );
        // Clear any existing retry count for fresh subscription
        errorRecoveryManager.current.resetRetries(symbol);
      });
      setSymbolConnectionStatus((prev) => ({ ...prev, ...statusUpdates }));

      // Clear any previous error
      setError(null);

      socket.emit("subscribe-symbols", validSymbols);
    },
    [socket, isConnected]
  );

  // Enhanced unsubscribe from symbols with cleanup
  const unsubscribeFromSymbols = useCallback(
    (symbols: string[]) => {
      if (!socket || !isConnected) {
        console.warn("⚠️ Cannot unsubscribe: Socket not connected");
        return;
      }

      // Validate symbols before unsubscribing
      const validSymbols = symbols.filter((symbol) => {
        if (!DataValidator.isValidSymbol(symbol)) {
          console.warn(`⚠️ Invalid symbol format for unsubscribe: ${symbol}`);
          return false;
        }
        return true;
      });

      if (validSymbols.length === 0) {
        console.warn("⚠️ No valid symbols to unsubscribe from");
        return;
      }

      // console.log("📡 Unsubscribing from symbols:", validSymbols);

      // Clear any pending reconnection timeouts for these symbols
      validSymbols.forEach((symbol) => {
        const timeoutId = reconnectionTimeouts.current.get(symbol);
        if (timeoutId) {
          clearTimeout(timeoutId);
          reconnectionTimeouts.current.delete(symbol);
        }

        // Reset retry counts and clear connection status
        errorRecoveryManager.current.resetRetries(symbol);
        connectionStatusManager.current.clearSymbolStatus(symbol);
        lastDataReceived.current.delete(symbol);
      });

      socket.emit("unsubscribe-symbols", validSymbols);
    },
    [socket, isConnected]
  );

  // Get current subscriptions
  const getSubscriptions = useCallback(() => {
    if (!socket || !isConnected) {
      console.warn("⚠️ Cannot get subscriptions: Socket not connected");
      return;
    }

    socket.emit("get-subscriptions");
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    marketData,
    marketDataHistory,
    // Enhanced multi-symbol support
    multiSymbolData,
    symbolConnectionStatus,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    getSubscriptions,
    currentSubscriptions,
    error,
  };
}
