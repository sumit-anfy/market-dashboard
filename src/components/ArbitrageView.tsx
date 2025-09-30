import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Sample data for the arbitrage table
const arbitrageData = [
  {
    underlyingSymbol: 'RELIANCE',
    underlyingPrice: 2456.75,
    nearFutureSymbol: 'RELIANCE25JANFUT',
    nearFuturePrice: 2461.20,
    nearFutureVolume: 125000,
    nextFutureSymbol: 'RELIANCE25FEBFUT',
    nextFuturePrice: 2465.80,
    nextFutureVolume: 89000,
    farFutureSymbol: 'RELIANCE25MARFUT',
    farFuturePrice: 2470.35,
    farFutureVolume: 45000,
  },
  {
    underlyingSymbol: 'TCS',
    underlyingPrice: 3890.45,
    nearFutureSymbol: 'TCS25JANFUT',
    nearFuturePrice: 3895.20,
    nearFutureVolume: 78000,
    nextFutureSymbol: 'TCS25FEBFUT',
    nextFuturePrice: 3900.15,
    nextFutureVolume: 52000,
    farFutureSymbol: 'TCS25MARFUT',
    farFuturePrice: 3905.60,
    farFutureVolume: 31000,
  },
  {
    underlyingSymbol: 'INFY',
    underlyingPrice: 1834.30,
    nearFutureSymbol: 'INFY25JANFUT',
    nearFuturePrice: 1837.85,
    nearFutureVolume: 95000,
    nextFutureSymbol: 'INFY25FEBFUT',
    nextFuturePrice: 1841.70,
    nextFutureVolume: 67000,
    farFutureSymbol: 'INFY25MARFUT',
    farFuturePrice: 1845.25,
    farFutureVolume: 38000,
  },
  {
    underlyingSymbol: 'HDFCBANK',
    underlyingPrice: 1678.90,
    nearFutureSymbol: 'HDFCBANK25JANFUT',
    nearFuturePrice: 1682.45,
    nearFutureVolume: 110000,
    nextFutureSymbol: 'HDFCBANK25FEBFUT',
    nextFuturePrice: 1686.20,
    nextFutureVolume: 73000,
    farFutureSymbol: 'HDFCBANK25MARFUT',
    farFuturePrice: 1690.15,
    farFutureVolume: 42000,
  },
  {
    underlyingSymbol: 'ICICIBANK',
    underlyingPrice: 1245.60,
    nearFutureSymbol: 'ICICIBANK25JANFUT',
    nearFuturePrice: 1248.35,
    nearFutureVolume: 88000,
    nextFutureSymbol: 'ICICIBANK25FEBFUT',
    nextFuturePrice: 1251.80,
    nextFutureVolume: 61000,
    farFutureSymbol: 'ICICIBANK25MARFUT',
    farFuturePrice: 1255.40,
    farFutureVolume: 35000,
  },
  {
    underlyingSymbol: 'YESBANK',
    underlyingPrice: 23.45,
    nearFutureSymbol: 'YESBANK25JANFUT',
    nearFuturePrice: 23.8,
    nearFutureVolume: 450000,
    nextFutureSymbol: 'YESBANK25FEBFUT',
    nextFuturePrice: 24.1,
    nextFutureVolume: 320000,
    farFutureSymbol: 'YESBANK25MARFUT',
    farFuturePrice: 24.5,
    farFutureVolume: 180000,
  },
];

export function ArbitrageView() {
  // Filter states
  const [filters, setFilters] = useState({
    nextNearMin: -5,
    nextNearMax: 5,
    farNextMin: -5,
    farNextMax: 5,
    farNearMin: -5,
    farNearMax: 5,
  });

  // Format price based on value - no decimals if >= 50, one decimal if < 50
  const formatPrice = (price: number) => {
    return price >= 50 ? price.toFixed(0) : price.toFixed(1);
  };

  // Format volume with commas
  const formatVolume = (volume: number) => {
    return volume.toLocaleString();
  };

  // Calculate gap between two futures
  const calculateGap = (future1: number, future2: number, spotPrice: number) => {
    const gapAmount = future1 - future2;
    const gapPercentage = (gapAmount / spotPrice) * 100;
    return { gapAmount, gapPercentage };
  };

  // Filter data based on gap percentages
  const filteredData = arbitrageData.filter(row => {
    const gapNextNear = calculateGap(row.nextFuturePrice, row.nearFuturePrice, row.underlyingPrice);
    const gapFarNext = calculateGap(row.farFuturePrice, row.nextFuturePrice, row.underlyingPrice);
    const gapFarNear = calculateGap(row.farFuturePrice, row.nearFuturePrice, row.underlyingPrice);
    
    return (
      gapNextNear.gapPercentage >= filters.nextNearMin && gapNextNear.gapPercentage <= filters.nextNearMax &&
      gapFarNext.gapPercentage >= filters.farNextMin && gapFarNext.gapPercentage <= filters.farNextMax &&
      gapFarNear.gapPercentage >= filters.farNearMin && gapFarNear.gapPercentage <= filters.farNearMax
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Arbitrage Opportunities</h2>
          <p className="text-muted-foreground">
            Monitor price differences between underlying stocks and their futures contracts
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter data based on gap percentages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Gap (Next/Near) Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Gap (Next/Near) %</Label>
              <div className="space-y-2">
                <Slider
                  value={[filters.nextNearMin, filters.nextNearMax]}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    nextNearMin: value[0], 
                    nextNearMax: value[1] 
                  }))}
                  min={-10}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={filters.nextNearMin}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        nextNearMin: parseFloat(e.target.value) || -10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={filters.nextNearMax}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        nextNearMax: parseFloat(e.target.value) || 10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gap (Far/Next) Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Gap (Far/Next) %</Label>
              <div className="space-y-2">
                <Slider
                  value={[filters.farNextMin, filters.farNextMax]}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    farNextMin: value[0], 
                    farNextMax: value[1] 
                  }))}
                  min={-10}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={filters.farNextMin}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        farNextMin: parseFloat(e.target.value) || -10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={filters.farNextMax}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        farNextMax: parseFloat(e.target.value) || 10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gap (Far/Near) Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Gap (Far/Near) %</Label>
              <div className="space-y-2">
                <Slider
                  value={[filters.farNearMin, filters.farNearMax]}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    farNearMin: value[0], 
                    farNearMax: value[1] 
                  }))}
                  min={-10}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={filters.farNearMin}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        farNearMin: parseFloat(e.target.value) || -10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={filters.farNearMax}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        farNearMax: parseFloat(e.target.value) || 10 
                      }))}
                      className="h-8 text-xs"
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Futures Arbitrage Analysis</CardTitle>
          <CardDescription>
            Compare underlying stock prices with near, next, and far future contract prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Underlying Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Price</TableHead>
                  <TableHead className="text-center font-semibold">Near Future Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Near Future Price</TableHead>
                  <TableHead className="text-center font-semibold">Near Volume</TableHead>
                  <TableHead className="text-center font-semibold">Next Future Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Next Future Price</TableHead>
                  <TableHead className="text-center font-semibold">Next Volume</TableHead>
                  <TableHead className="text-center font-semibold">Far Future Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Far Future Price</TableHead>
                  <TableHead className="text-center font-semibold">Far Volume</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Next/Near)</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Next/Near %)</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Far/Next)</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Far/Next %)</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Far/Near)</TableHead>
                  <TableHead className="text-center font-semibold">Gap (Far/Near %)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, index) => {
                  const gapNextNear = calculateGap(row.nextFuturePrice, row.nearFuturePrice, row.underlyingPrice);
                  const gapFarNext = calculateGap(row.farFuturePrice, row.nextFuturePrice, row.underlyingPrice);
                  const gapFarNear = calculateGap(row.farFuturePrice, row.nearFuturePrice, row.underlyingPrice);
                  
                  return (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{row.underlyingSymbol}</TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(row.underlyingPrice)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {row.nearFutureSymbol}
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(row.nearFuturePrice)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {formatVolume(row.nearFutureVolume)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {row.nextFutureSymbol}
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(row.nextFuturePrice)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {formatVolume(row.nextFutureVolume)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {row.farFutureSymbol}
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(row.farFuturePrice)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {formatVolume(row.farFutureVolume)}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapNextNear.gapAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapNextNear.gapAmount > 0 ? '+' : ''}{formatPrice(gapNextNear.gapAmount)}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapNextNear.gapPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapNextNear.gapPercentage > 0 ? '+' : ''}{gapNextNear.gapPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapFarNext.gapAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapFarNext.gapAmount > 0 ? '+' : ''}{formatPrice(gapFarNext.gapAmount)}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapFarNext.gapPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapFarNext.gapPercentage > 0 ? '+' : ''}{gapFarNext.gapPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapFarNear.gapAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapFarNear.gapAmount > 0 ? '+' : ''}{formatPrice(gapFarNear.gapAmount)}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-base ${gapFarNear.gapPercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {gapFarNear.gapPercentage > 0 ? '+' : ''}{gapFarNear.gapPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtered Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">of {arbitrageData.length} instruments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Gap (Next/Near)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.length > 0 ? (
                filteredData.reduce((acc, row) => {
                  const gap = calculateGap(row.nextFuturePrice, row.nearFuturePrice, row.underlyingPrice);
                  return acc + gap.gapPercentage;
                }, 0) / filteredData.length
              ).toFixed(1) : '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">Average Next/Near gap</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Gap (Far/Near)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.length > 0 ? (
                filteredData.reduce((acc, row) => {
                  const gap = calculateGap(row.farFuturePrice, row.nearFuturePrice, row.underlyingPrice);
                  return acc + gap.gapPercentage;
                }, 0) / filteredData.length
              ).toFixed(1) : '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">Average Far/Near gap</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
