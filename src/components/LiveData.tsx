import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveData } from '@/types/market';
import { generateLiveData, updateLiveData } from '@/lib/mockData';

export function LiveDataView() {
  const [data, setData] = useState<LiveData[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Initialize data
    setData(generateLiveData());
    
    let interval: NodeJS.Timeout;
    
    if (isLive) {
      interval = setInterval(() => {
        setData(currentData => updateLiveData(currentData));
        setLastUpdate(new Date());
      }, 2000); // Update every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  const topGainers = data.slice().sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = data.slice().sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Market Data</h2>
          <p className="text-muted-foreground">
            Real-time prices and updates from NSE and BSE markets
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button onClick={toggleLive} variant={isLive ? "default" : "outline"}>
            {isLive ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                Live
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Paused
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            {topGainers.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium font-mono text-sm">{stock.symbol}</div>
                  <Badge variant="secondary" className="text-xs">{stock.segment}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">₹{stock.price.toFixed(2)}</div>
                  <div className="text-xs text-green-600 font-mono">
                    +{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Losers</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            {topLosers.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium font-mono text-sm">{stock.symbol}</div>
                  <Badge variant="secondary" className="text-xs">{stock.segment}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">₹{stock.price.toFixed(2)}</div>
                  <div className="text-xs text-red-600 font-mono">
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Status</CardTitle>
            <Zap className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">NSE Equity</span>
                <Badge variant="default">Open</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">NSE F&O</span>
                <Badge variant="default">Open</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">BSE Equity</span>
                <Badge variant="default">Open</Badge>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Updates: {isLive ? 'Real-time' : 'Paused'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((stock) => (
          <Card 
            key={stock.id} 
            className={`transition-all duration-200 hover:shadow-md ${
              stock.change >= 0 
                ? 'border-l-4 border-l-green-500' 
                : 'border-l-4 border-l-red-500'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-mono">{stock.symbol}</CardTitle>
                  <Badge variant="outline" className="text-xs mt-1">
                    {stock.segment}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono">
                    ₹{stock.price.toFixed(2)}
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="font-mono">
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </span>
                    <span className="font-mono">
                      ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Bid/Ask</div>
                  <div className="font-mono">
                    ₹{stock.bid.toFixed(2)} / ₹{stock.ask.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volume</div>
                  <div className="font-mono">{stock.volume.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Day High</div>
                  <div className="font-mono">₹{stock.dayHigh.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Day Low</div>
                  <div className="font-mono">₹{stock.dayLow.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  Last Trade: {stock.lastTradeTime.toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}