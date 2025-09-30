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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Sample data for covered calls options
const optionContractsData = [
  {
    underlyingSymbol: 'RELIANCE',
    underlyingPrice: 2456.75,
    optionType: 'CE',
    strikePrice: 2500,
    premium: 45.20,
    volume: 125000,
  },
  {
    underlyingSymbol: 'RELIANCE',
    underlyingPrice: 2456.75,
    optionType: 'PE',
    strikePrice: 2400,
    premium: 38.50,
    volume: 98000,
  },
  {
    underlyingSymbol: 'RELIANCE',
    underlyingPrice: 2456.75,
    optionType: 'CE',
    strikePrice: 2550,
    premium: 28.75,
    volume: 67000,
  },
  {
    underlyingSymbol: 'TCS',
    underlyingPrice: 3890.45,
    optionType: 'CE',
    strikePrice: 3900,
    premium: 62.30,
    volume: 89000,
  },
  {
    underlyingSymbol: 'TCS',
    underlyingPrice: 3890.45,
    optionType: 'PE',
    strikePrice: 3850,
    premium: 55.80,
    volume: 76000,
  },
  {
    underlyingSymbol: 'TCS',
    underlyingPrice: 3890.45,
    optionType: 'CE',
    strikePrice: 4000,
    premium: 35.40,
    volume: 45000,
  },
  {
    underlyingSymbol: 'INFY',
    underlyingPrice: 1834.30,
    optionType: 'CE',
    strikePrice: 1850,
    premium: 42.15,
    volume: 112000,
  },
  {
    underlyingSymbol: 'INFY',
    underlyingPrice: 1834.30,
    optionType: 'PE',
    strikePrice: 1800,
    premium: 35.90,
    volume: 87000,
  },
  {
    underlyingSymbol: 'INFY',
    underlyingPrice: 1834.30,
    optionType: 'CE',
    strikePrice: 1900,
    premium: 25.60,
    volume: 54000,
  },
  {
    underlyingSymbol: 'HDFCBANK',
    underlyingPrice: 1678.90,
    optionType: 'CE',
    strikePrice: 1700,
    premium: 38.25,
    volume: 95000,
  },
  {
    underlyingSymbol: 'HDFCBANK',
    underlyingPrice: 1678.90,
    optionType: 'PE',
    strikePrice: 1650,
    premium: 32.70,
    volume: 78000,
  },
  {
    underlyingSymbol: 'HDFCBANK',
    underlyingPrice: 1678.90,
    optionType: 'CE',
    strikePrice: 1750,
    premium: 22.80,
    volume: 42000,
  },
  {
    underlyingSymbol: 'ICICIBANK',
    underlyingPrice: 1245.60,
    optionType: 'CE',
    strikePrice: 1260,
    premium: 28.45,
    volume: 103000,
  },
  {
    underlyingSymbol: 'ICICIBANK',
    underlyingPrice: 1245.60,
    optionType: 'PE',
    strikePrice: 1220,
    premium: 24.30,
    volume: 85000,
  },
  {
    underlyingSymbol: 'ICICIBANK',
    underlyingPrice: 1245.60,
    optionType: 'CE',
    strikePrice: 1300,
    premium: 18.75,
    volume: 38000,
  },
  {
    underlyingSymbol: 'YESBANK',
    underlyingPrice: 23.45,
    optionType: 'CE',
    strikePrice: 25.0,
    premium: 1.85,
    volume: 450000,
  },
  {
    underlyingSymbol: 'YESBANK',
    underlyingPrice: 23.45,
    optionType: 'PE',
    strikePrice: 22.0,
    premium: 1.60,
    volume: 380000,
  },
  {
    underlyingSymbol: 'YESBANK',
    underlyingPrice: 23.45,
    optionType: 'CE',
    strikePrice: 27.0,
    premium: 1.25,
    volume: 290000,
  },
];

export function CoveredCallsView() {
  // Filter states
  const [filters, setFilters] = useState({
    otmMin: 0,
    otmMax: 25,
    premiumMin: 0,
    premiumMax: 12,
  });

  // Format price based on value - no decimals if >= 50, one decimal if < 50
  const formatPrice = (price: number) => {
    return price >= 50 ? price.toFixed(0) : price.toFixed(1);
  };

  // Format volume with commas
  const formatVolume = (volume: number) => {
    return volume.toLocaleString();
  };

  // Get badge variant based on option type
  const getOptionTypeBadge = (optionType: string) => {
    return optionType === 'CE' ? 'default' : 'secondary';
  };

  // Check if option is ATM (At The Money)
  const isATM = (underlyingPrice: number, strikePrice: number) => {
    const difference = Math.abs(underlyingPrice - strikePrice);
    const percentDiff = (difference / underlyingPrice) * 100;
    return percentDiff < 1; // ATM if within 1%
  };

  // Calculate OTM % = |Strike Price / Spot Price - 1| * 100
  const calculateOTMPercent = (strikePrice: number, spotPrice: number) => {
    return Math.abs((strikePrice / spotPrice) - 1) * 100;
  };

  // Calculate Premium % = Premium / Spot Price * 100
  const calculatePremiumPercent = (premium: number, spotPrice: number) => {
    return (premium / spotPrice) * 100;
  };

  // Filter data based on OTM% and Premium%
  const filteredData = optionContractsData.filter(option => {
    const otmPercent = calculateOTMPercent(option.strikePrice, option.underlyingPrice);
    const premiumPercent = calculatePremiumPercent(option.premium, option.underlyingPrice);
    
    return (
      otmPercent >= filters.otmMin && otmPercent <= filters.otmMax &&
      premiumPercent >= filters.premiumMin && premiumPercent <= filters.premiumMax
    );
  });

  // Group data by underlying symbol for summary
  const summaryData = optionContractsData.reduce((acc, option) => {
    if (!acc[option.underlyingSymbol]) {
      acc[option.underlyingSymbol] = {
        symbol: option.underlyingSymbol,
        price: option.underlyingPrice,
        ceCount: 0,
        peCount: 0,
        totalPremium: 0,
      };
    }
    
    if (option.optionType === 'CE') {
      acc[option.underlyingSymbol].ceCount++;
    } else {
      acc[option.underlyingSymbol].peCount++;
    }
    
    acc[option.underlyingSymbol].totalPremium += option.premium;
    
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Covered Calls</h2>
          <p className="text-muted-foreground">
            Monitor option contracts for covered call strategies
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter options based on OTM% and Premium%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* OTM % Filter */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">OTM %</Label>
              <div className="space-y-4">
                <div className="relative px-3">
                  <Slider
                    value={[filters.otmMin, filters.otmMax]}
                    onValueChange={(value) => {
                      if (value.length === 2) {
                        setFilters(prev => ({ 
                          ...prev, 
                          otmMin: value[0], 
                          otmMax: value[1] 
                        }));
                      }
                    }}
                    min={0}
                    max={30}
                    step={0.5}
                    minStepsBetweenThumbs={1}
                    className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-3 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-xl [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing [&>.relative]:h-3 [&_.bg-primary]:bg-primary [&_[role=slider]]:ring-4 [&_[role=slider]]:ring-primary/10 [&_[role=slider]]:transition-all [&_[role=slider]]:hover:scale-110"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={filters.otmMin}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        otmMin: parseFloat(e.target.value) || 0 
                      }))}
                      className="h-8 text-xs font-mono"
                      step={0.1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={filters.otmMax}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        otmMax: parseFloat(e.target.value) || 30 
                      }))}
                      className="h-8 text-xs font-mono"
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Premium % Filter */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Premium %</Label>
              <div className="space-y-4">
                <div className="relative px-3">
                  <Slider
                    value={[filters.premiumMin, filters.premiumMax]}
                    onValueChange={(value) => {
                      if (value.length === 2) {
                        setFilters(prev => ({ 
                          ...prev, 
                          premiumMin: value[0], 
                          premiumMax: value[1] 
                        }));
                      }
                    }}
                    min={0}
                    max={15}
                    step={0.5}
                    minStepsBetweenThumbs={1}
                    className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-3 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-xl [&_[role=slider]]:cursor-grab [&_[role=slider]:active]:cursor-grabbing [&>.relative]:h-3 [&_.bg-primary]:bg-primary [&_[role=slider]]:ring-4 [&_[role=slider]]:ring-primary/10 [&_[role=slider]]:transition-all [&_[role=slider]]:hover:scale-110"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>7.5%</span>
                    <span>15%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={filters.premiumMin}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        premiumMin: parseFloat(e.target.value) || 0 
                      }))}
                      className="h-8 text-xs font-mono"
                      step={0.1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={filters.premiumMax}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        premiumMax: parseFloat(e.target.value) || 15 
                      }))}
                      className="h-8 text-xs font-mono"
                      step={0.1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtered Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">of {optionContractsData.length} contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Call Options (CE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.filter(option => option.optionType === 'CE').length}
            </div>
            <p className="text-xs text-muted-foreground">Call option contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Put Options (PE)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.filter(option => option.optionType === 'PE').length}
            </div>
            <p className="text-xs text-muted-foreground">Put option contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ATM Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.filter(option => 
                isATM(option.underlyingPrice, option.strikePrice)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">At-the-money contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Premium %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {filteredData.length > 0 ? (
                filteredData.reduce((sum, option) => 
                  sum + calculatePremiumPercent(option.premium, option.underlyingPrice), 0
                ) / filteredData.length
              ).toFixed(2) : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">Average premium percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Options Table */}
      <Card>
        <CardHeader>
          <CardTitle>Option Contracts</CardTitle>
          <CardDescription>
            All available option contracts with strike prices and premiums
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Underlying Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Price</TableHead>
                  <TableHead className="text-center font-semibold">Type of Option</TableHead>
                  <TableHead className="text-center font-semibold">Strike Price</TableHead>
                  <TableHead className="text-center font-semibold">Premium</TableHead>
                  <TableHead className="text-center font-semibold">Volume</TableHead>
                  <TableHead className="text-center font-semibold">OTM %</TableHead>
                  <TableHead className="text-center font-semibold">Premium %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((option, index) => {
                  const atmOption = isATM(option.underlyingPrice, option.strikePrice);
                  const otmPercent = calculateOTMPercent(option.strikePrice, option.underlyingPrice);
                  const premiumPercent = calculatePremiumPercent(option.premium, option.underlyingPrice);
                  
                  return (
                    <TableRow 
                      key={index} 
                      className={`hover:bg-muted/50 ${atmOption ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    >
                      <TableCell className="text-center font-medium">{option.underlyingSymbol}</TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(option.underlyingPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getOptionTypeBadge(option.optionType)}>
                          {option.optionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(option.strikePrice)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {formatPrice(option.premium)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {formatVolume(option.volume)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {otmPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center font-mono text-base">
                        {premiumPercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary by Underlying */}
      <Card>
        <CardHeader>
          <CardTitle>Summary by Underlying</CardTitle>
          <CardDescription>
            Option contract summary grouped by underlying stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Symbol</TableHead>
                  <TableHead className="text-center font-semibold">Current Price</TableHead>
                  <TableHead className="text-center font-semibold">CE Contracts</TableHead>
                  <TableHead className="text-center font-semibold">PE Contracts</TableHead>
                  <TableHead className="text-center font-semibold">Total Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(summaryData).map((summary: any, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="text-center font-medium">{summary.symbol}</TableCell>
                    <TableCell className="text-center font-mono text-base">
                      {formatPrice(summary.price)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-base">
                      {summary.ceCount}
                    </TableCell>
                    <TableCell className="text-center font-mono text-base">
                      {summary.peCount}
                    </TableCell>
                    <TableCell className="text-center font-mono text-base">
                      {formatPrice(summary.totalPremium)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
