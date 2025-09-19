import { HistoricalData, LiveData } from '@/types/market';

const symbols = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'ITC', 'LT', 'SBIN',
  'BHARTIARTL', 'ASIANPAINT', 'HCLTECH', 'AXISBANK', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'NESTLEIND'
];

const segments = ['NSE_EQ', 'NSE_FO', 'BSE_EQ'] as const;

function generateRandomPrice(basePrice: number): number {
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  return Math.round(basePrice * (1 + variation) * 100) / 100;
}

function generateRandomVolume(): number {
  return Math.floor(Math.random() * 1000000) + 10000;
}

export function generateHistoricalData(days: number = 30): HistoricalData[] {
  const data: HistoricalData[] = [];
  
  for (let day = days; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    symbols.forEach(symbol => {
      segments.forEach(segment => {
        const basePrice = Math.random() * 3000 + 100;
        const open = generateRandomPrice(basePrice);
        const close = generateRandomPrice(open);
        const high = Math.max(open, close) + Math.random() * 50;
        const low = Math.min(open, close) - Math.random() * 50;
        const volume = generateRandomVolume();
        const previousClose = generateRandomPrice(close);
        
        data.push({
          id: `${symbol}_${segment}_${date.toISOString().split('T')[0]}`,
          symbol,
          segment,
          price: close,
          previousClose,
          change: close - previousClose,
          changePercent: ((close - previousClose) / previousClose) * 100,
          volume,
          high,
          low,
          open,
          timestamp: date,
          date: date.toISOString().split('T')[0],
          turnover: volume * close
        });
      });
    });
  }
  
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function generateLiveData(): LiveData[] {
  return symbols.slice(0, 15).map(symbol => {
    const segment = segments[Math.floor(Math.random() * segments.length)];
    const basePrice = Math.random() * 3000 + 100;
    const price = generateRandomPrice(basePrice);
    const previousClose = generateRandomPrice(price);
    const volume = generateRandomVolume();
    
    return {
      id: `${symbol}_${segment}_live`,
      symbol,
      segment,
      price,
      previousClose,
      change: price - previousClose,
      changePercent: ((price - previousClose) / previousClose) * 100,
      volume,
      high: price + Math.random() * 50,
      low: price - Math.random() * 50,
      open: generateRandomPrice(price),
      timestamp: new Date(),
      bid: price - Math.random() * 2,
      ask: price + Math.random() * 2,
      lastTradeTime: new Date(),
      dayHigh: price + Math.random() * 100,
      dayLow: price - Math.random() * 100,
      totalTradedVolume: volume * (1 + Math.random())
    };
  });
}

export function updateLiveData(data: LiveData[]): LiveData[] {
  return data.map(item => {
    const priceChange = (Math.random() - 0.5) * 10; // Random price movement
    const newPrice = Math.max(1, item.price + priceChange);
    const change = newPrice - item.previousClose;
    
    return {
      ...item,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / item.previousClose) * 10000) / 100,
      volume: item.volume + Math.floor(Math.random() * 1000),
      lastTradeTime: new Date(),
      bid: Math.round((newPrice - Math.random() * 2) * 100) / 100,
      ask: Math.round((newPrice + Math.random() * 2) * 100) / 100,
    };
  });
}