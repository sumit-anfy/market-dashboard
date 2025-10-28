import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
  subscribeToSymbols: (symbols: string[]) => void;
  unsubscribeFromSymbols: (symbols: string[]) => void;
  getSubscriptions: () => void;
  currentSubscriptions: string[];
  error: string | null;
}

export function useSocketIO(options: UseSocketIOOptions = {}): UseSocketIOReturn {
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
  const [currentSubscriptions, setCurrentSubscriptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store history limit
  const historyLimit = useRef(100);

  useEffect(() => {
    if (!autoConnect) return;

    console.log('🔌 Initializing Socket.io connection to:', url);

    const socketInstance = io(url, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket.io connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket.io connection error:', err.message);
      setError(err.message);
      setIsConnected(false);
    });

    // Connection status from backend
    socketInstance.on('connection-status', (data) => {
      console.log('📡 Connection status:', data);
    });

    // Market data events
    socketInstance.on('market-data', (data: MarketData) => {
      console.log('📊 Received market data:', data);
      setMarketData(data);

      // Add to history (keep last N items)
      setMarketDataHistory((prev) => {
        const newHistory = [data, ...prev].slice(0, historyLimit.current);
        return newHistory;
      });
    });

    // Bulk market data
    socketInstance.on('market-data-bulk', (payload: { data: MarketData[]; count: number; timestamp: string }) => {
      console.log(`📊 Received bulk market data: ${payload.count} items`);

      if (payload.data.length > 0) {
        setMarketData(payload.data[0]); // Set latest as current

        // Add all to history
        setMarketDataHistory((prev) => {
          const newHistory = [...payload.data, ...prev].slice(0, historyLimit.current);
          return newHistory;
        });
      }
    });

    // Symbol-specific updates
    socketInstance.on('symbol-update', (data: MarketData) => {
      console.log('📈 Symbol update:', data.symbol, data);
      setMarketData(data);

      setMarketDataHistory((prev) => {
        const newHistory = [data, ...prev].slice(0, historyLimit.current);
        return newHistory;
      });
    });

    // Subscription confirmations
    socketInstance.on('subscription-confirmed', (data: { symbols: string[]; timestamp: string }) => {
      console.log('✅ Subscription confirmed:', data.symbols);
      setCurrentSubscriptions((prev) => [...new Set([...prev, ...data.symbols])]);
    });

    socketInstance.on('unsubscription-confirmed', (data: { symbols: string[]; timestamp: string }) => {
      console.log('✅ Unsubscription confirmed:', data.symbols);
      setCurrentSubscriptions((prev) => prev.filter((s) => !data.symbols.includes(s)));
    });

    socketInstance.on('current-subscriptions', (data: { symbols: string[]; timestamp: string }) => {
      console.log('📋 Current subscriptions:', data.symbols);
      setCurrentSubscriptions(data.symbols);
    });

    // WebSocket backend status
    socketInstance.on('websocket-status', (data: { status: string; timestamp: string }) => {
      console.log('🌐 WebSocket backend status:', data.status);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.io');
      socketInstance.disconnect();
    };
  }, [url, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Subscribe to symbols
  const subscribeToSymbols = useCallback(
    (symbols: string[]) => {
      if (!socket || !isConnected) {
        console.warn('⚠️ Cannot subscribe: Socket not connected');
        return;
      }

      console.log('📡 Subscribing to symbols:', symbols);
      socket.emit('subscribe-symbols', symbols);
    },
    [socket, isConnected]
  );

  // Unsubscribe from symbols
  const unsubscribeFromSymbols = useCallback(
    (symbols: string[]) => {
      if (!socket || !isConnected) {
        console.warn('⚠️ Cannot unsubscribe: Socket not connected');
        return;
      }

      console.log('📡 Unsubscribing from symbols:', symbols);
      socket.emit('unsubscribe-symbols', symbols);
    },
    [socket, isConnected]
  );

  // Get current subscriptions
  const getSubscriptions = useCallback(() => {
    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot get subscriptions: Socket not connected');
      return;
    }

    socket.emit('get-subscriptions');
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    marketData,
    marketDataHistory,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    getSubscriptions,
    currentSubscriptions,
    error,
  };
}
