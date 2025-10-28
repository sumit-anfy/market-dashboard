import { useState, useEffect, useMemo } from 'react';
import { useSocketIO, MarketData } from '../hooks/useSocketIO';

// Watchlist symbols
const WATCHLIST_SYMBOLS = ['RELIANCE', 'SBICARD', 'AXISBANK', 'BEL'];

export function LiveMarketWatch() {
  const {
    isConnected,
    marketDataHistory,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    currentSubscriptions,
    error,
  } = useSocketIO({
    url: import.meta.env.VITE_API_BASE_URL,
    autoConnect: true,
  });

  const [customSymbol, setCustomSymbol] = useState('');

  // Auto-subscribe to watchlist symbols on connection
  useEffect(() => {
    if (isConnected) {
      console.log('Auto-subscribing to watchlist symbols:', WATCHLIST_SYMBOLS);
      subscribeToSymbols(WATCHLIST_SYMBOLS);
    }
  }, [isConnected]);

  // Group market data by symbol and keep only the latest for each
  const latestDataBySymbol = useMemo(() => {
    const dataMap = new Map<string, MarketData>();

    // Process history in reverse (newest first) to get latest for each symbol
    [...marketDataHistory].forEach(data => {
      if (data.symbol && !dataMap.has(data.symbol)) {
        dataMap.set(data.symbol, data);
      }
    });

    return dataMap;
  }, [marketDataHistory]);

  // Get watchlist data
  const watchlistData = WATCHLIST_SYMBOLS.map(symbol => ({
    symbol,
    data: latestDataBySymbol.get(symbol) || null
  }));

  // Handle add custom symbol
  const handleAddSymbol = () => {
    if (!customSymbol.trim()) return;

    const symbol = customSymbol.trim().toUpperCase();
    subscribeToSymbols([symbol]);
    setCustomSymbol('');
  };

  // Handle remove symbol
  const handleRemoveSymbol = (symbol: string) => {
    unsubscribeFromSymbols([symbol]);
  };

  // Calculate price change
  const getPriceChange = (data: MarketData | null) => {
    if (!data || !data.close || !data.open) return null;
    const change = data.close - data.open;
    const changePercent = ((change / data.open) * 100);
    return { change, changePercent };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Live Market Watch</h1>
              <p className="text-gray-400 mt-2">Real-time stock prices powered by Socket.io</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isConnected ? 'bg-green-900/50 text-green-400 border border-green-500' : 'bg-red-900/50 text-red-400 border border-red-500'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="font-semibold">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              <p className="font-semibold">Connection Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Watchlist Cards - Primary Symbols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {watchlistData.map(({ symbol, data }) => {
            const priceChange = getPriceChange(data);
            const isPositive = priceChange && priceChange.change > 0;
            const isNegative = priceChange && priceChange.change < 0;

            return (
              <div
                key={symbol}
                className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 hover:border-gray-600 transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{symbol}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Waiting...'}
                    </p>
                  </div>
                  {data && (
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      isPositive ? 'bg-green-900/50 text-green-400' :
                      isNegative ? 'bg-red-900/50 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {isPositive ? '↑' : isNegative ? '↓' : '–'}
                    </div>
                  )}
                </div>

                {data ? (
                  <>
                    {/* Price */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-3xl font-bold text-white">
                        ₹{data.price?.toFixed(2) || data.close?.toFixed(2) || 'N/A'}
                      </p>
                    </div>

                    {/* Price Change */}
                    {priceChange && (
                      <div className="mb-3">
                        <p className={`text-lg font-semibold ${
                          isPositive ? 'text-green-400' :
                          isNegative ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {isPositive ? '+' : ''}{priceChange.change.toFixed(2)} ({priceChange.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    )}

                    {/* OHLC */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Open</p>
                        <p className="text-white font-semibold">₹{data.open?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">High</p>
                        <p className="text-green-400 font-semibold">₹{data.high?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Low</p>
                        <p className="text-red-400 font-semibold">₹{data.low?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Volume</p>
                        <p className="text-blue-400 font-semibold">{data.volume?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-8 bg-gray-700 rounded w-full mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <p className="text-gray-500 text-sm mt-4">Waiting for data...</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom Symbol */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Add Symbol to Watch</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
              placeholder="Enter symbol (e.g., TCS, INFY, HDFCBANK)"
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            <button
              onClick={handleAddSymbol}
              disabled={!isConnected || !customSymbol.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              Add Symbol
            </button>
          </div>

          {/* Active Subscriptions */}
          {currentSubscriptions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Active Subscriptions ({currentSubscriptions.length}):</p>
              <div className="flex flex-wrap gap-2">
                {currentSubscriptions.map((symbol) => (
                  <div
                    key={symbol}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-medium border border-blue-700"
                  >
                    <span>{symbol}</span>
                    {!WATCHLIST_SYMBOLS.includes(symbol) && (
                      <button
                        onClick={() => handleRemoveSymbol(symbol)}
                        className="text-blue-300 hover:text-blue-100 font-bold"
                        title="Remove symbol"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">
            Live Data Feed ({marketDataHistory.length} updates)
          </h2>

          {marketDataHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">No market data received yet</p>
              <p className="text-sm mt-2">Waiting for live updates from backend...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-400">Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-400">Symbol</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Open</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">High</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Low</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Volume</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {marketDataHistory.slice(0, 30).map((data, index) => {
                    const priceChange = getPriceChange(data);
                    const isPositive = priceChange && priceChange.change > 0;
                    const isNegative = priceChange && priceChange.change < 0;

                    return (
                      <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">
                          {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{data.symbol || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">
                          ₹{data.price?.toFixed(2) || data.close?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">
                          ₹{data.open?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">
                          ₹{data.high?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          ₹{data.low?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400">
                          {data.volume?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {priceChange ? (
                            <span
                              className={`font-semibold ${
                                isPositive ? 'text-green-400' :
                                isNegative ? 'text-red-400' :
                                'text-gray-400'
                              }`}
                            >
                              {isPositive ? '+' : ''}{priceChange.changePercent.toFixed(2)}%
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
