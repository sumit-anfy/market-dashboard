import { useState } from 'react';
import { useSocketIO } from '../hooks/useSocketIO';

export function LiveMarketData() {
  const {
    isConnected,
    marketData,
    marketDataHistory,
    subscribeToSymbols,
    unsubscribeFromSymbols,
    currentSubscriptions,
    error,
  } = useSocketIO({
    url: import.meta.env.VITE_API_BASE_URL,
    autoConnect: true,
  });

  const [symbolInput, setSymbolInput] = useState('');
  // const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());

  // Handle subscribe
  const handleSubscribe = () => {
    if (!symbolInput.trim()) return;

    const symbols = symbolInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (symbols.length > 0) {
      subscribeToSymbols(symbols);
      // setSelectedSymbols((prev) => new Set([...prev, ...symbols]));
      setSymbolInput('');
    }
  };

  // Handle unsubscribe
  const handleUnsubscribe = (symbol: string) => {
    unsubscribeFromSymbols([symbol]);
    // setSelectedSymbols((prev) => {
    //   const newSet = new Set(prev);
    //   newSet.delete(symbol);
    //   return newSet;
    // });
  };

  // Quick subscribe presets
  const quickSubscribeGroups = {
    'Top Stocks': ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'],
    'Banking': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK'],
    'IT Sector': ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM'],
    'Indices': ['NIFTY', 'BANKNIFTY', 'FINNIFTY'],
  };

  const handleQuickSubscribe = (groupName: keyof typeof quickSubscribeGroups) => {
    const symbols = quickSubscribeGroups[groupName];
    subscribeToSymbols(symbols);
    // setSelectedSymbols((prev) => new Set([...prev, ...symbols]));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Market Data</h1>
              <p className="text-gray-600 mt-1">Real-time stock market updates via Socket.io</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="font-semibold">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Connection Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Subscription Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscribe to Symbols</h2>

          {/* Manual subscription */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
              placeholder="Enter symbols (e.g., RELIANCE, TCS, INFY)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={handleSubscribe}
              disabled={!isConnected || !symbolInput.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Subscribe
            </button>
          </div>

          {/* Quick subscribe groups */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Quick Subscribe:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(quickSubscribeGroups).map((groupName) => (
                <button
                  key={groupName}
                  onClick={() => handleQuickSubscribe(groupName as keyof typeof quickSubscribeGroups)}
                  disabled={!isConnected}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                >
                  {groupName}
                </button>
              ))}
            </div>
          </div>

          {/* Current subscriptions */}
          {currentSubscriptions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Current Subscriptions:</p>
              <div className="flex flex-wrap gap-2">
                {currentSubscriptions.map((symbol) => (
                  <div
                    key={symbol}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    <span>{symbol}</span>
                    <button
                      onClick={() => handleUnsubscribe(symbol)}
                      className="text-blue-900 hover:text-blue-600 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Latest Market Data */}
        {marketData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Update</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Symbol</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.symbol || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-green-600">₹{marketData.price?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Volume</p>
                <p className="text-2xl font-bold text-blue-600">{marketData.volume?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {marketData.timestamp ? new Date(marketData.timestamp).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Market Data History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Market Data Stream ({marketDataHistory.length} updates)
          </h2>

          {marketDataHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No market data received yet</p>
              <p className="text-sm mt-2">Subscribe to symbols to start receiving live updates</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Symbol</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Volume</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {marketDataHistory.slice(0, 20).map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">
                        {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{data.symbol || 'N/A'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ₹{data.price?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {data.volume?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {data.close && data.open ? (
                          <span
                            className={`font-semibold ${
                              data.close > data.open ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {((((data.close - data.open) / data.open) * 100)).toFixed(2)}%
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
