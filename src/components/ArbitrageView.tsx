import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { CronStatusCard } from './CronStatusCard';

interface ArbitrageData {
  instrumentId: number;
  underlyingSymbol: string;
  underlyingPrice: number;
  time: string;
  nearFutureSymbol: string | null;
  nearFuturePrice: number | null;
  nearFutureVolume: number | null;
  nearFutureTime: string | null;
  nextFutureSymbol: string | null;
  nextFuturePrice: number | null;
  nextFutureVolume: number | null;
  nextFutureTime: string | null;
  farFutureSymbol: string | null;
  farFuturePrice: number | null;
  farFutureVolume: number | null;
  farFutureTime: string | null;
}

export function ArbitrageView() {
  // const navigate = useNavigate();

  // Data states
  const [arbitrageData, setArbitrageData] = useState<ArbitrageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    nextNearMin: -5,
    nextNearMax: 5,
    farNextMin: -5,
    farNextMax: 5,
    farNearMin: -5,
    farNearMax: 5,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch arbitrage data from API
  const fetchArbitrageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/arbitrage`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.success) {
        setArbitrageData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch arbitrage data');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
          setError('Unable to connect to backend server.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.statusText}`);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
      console.error('Error fetching arbitrage data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchArbitrageData();
  }, []);

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
    // Check if at least one gap can be calculated
    const hasNextNearGap = row.nextFuturePrice && row.nearFuturePrice;
    const hasFarNextGap = row.farFuturePrice && row.nextFuturePrice;
    const hasFarNearGap = row.farFuturePrice && row.nearFuturePrice;

    // Exclude rows where ALL three gaps are null/N/A
    if (!hasNextNearGap && !hasFarNextGap && !hasFarNearGap) {
      return false;
    }

    // Calculate gaps only if data exists
    let passesNextNearFilter = true;
    let passesFarNextFilter = true;
    let passesFarNearFilter = true;

    // Check Next/Near gap filter only if both prices exist
    if (hasNextNearGap) {
      const gapNextNear = calculateGap(row.nextFuturePrice!, row.nearFuturePrice!, row.underlyingPrice);
      passesNextNearFilter = gapNextNear.gapPercentage >= filters.nextNearMin &&
                             gapNextNear.gapPercentage <= filters.nextNearMax;
    }

    // Check Far/Next gap filter only if both prices exist
    if (hasFarNextGap) {
      const gapFarNext = calculateGap(row.farFuturePrice!, row.nextFuturePrice!, row.underlyingPrice);
      passesFarNextFilter = gapFarNext.gapPercentage >= filters.farNextMin &&
                            gapFarNext.gapPercentage <= filters.farNextMax;
    }

    // Check Far/Near gap filter only if both prices exist
    if (hasFarNearGap) {
      const gapFarNear = calculateGap(row.farFuturePrice!, row.nearFuturePrice!, row.underlyingPrice);
      passesFarNearFilter = gapFarNear.gapPercentage >= filters.farNearMin &&
                            gapFarNear.gapPercentage <= filters.farNearMax;
    }

    return passesNextNearFilter && passesFarNextFilter && passesFarNearFilter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, rowsPerPage]);

  // Handle row click to navigate to details page in a new tab
  const handleRowClick = (row: ArbitrageData) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    // Calculate gaps for passing to the details page
    const gap1 = (row.nextFuturePrice && row.nearFuturePrice)
      ? row.nextFuturePrice - row.nearFuturePrice
      : 0;
    const gap2 = (row.farFuturePrice && row.nextFuturePrice)
      ? row.farFuturePrice - row.nextFuturePrice
      : 0;

    // Construct the URL with state parameters as query string
    const url = `/arbitrage/${row.instrumentId}/${currentDate}?` +
      new URLSearchParams({
        instrumentid: row.instrumentId.toString(),
        name: row.underlyingSymbol,
        date: row.time,
        symbol_1: row.nearFutureSymbol || '',
        price_1: row.nearFuturePrice?.toString() || '',
        time_1: row.nearFutureTime?.toString() || '',
        symbol_2: row.nextFutureSymbol || '',
        price_2: row.nextFuturePrice?.toString() || '',
        time_2: row.nextFutureTime?.toString() || '',
        symbol_3: row.farFutureSymbol || '',
        price_3: row.farFuturePrice?.toString() || '',
        time_3: row.farFutureTime?.toString() || '',
        gap_1: gap1.toString(),
        gap_2: gap2.toString(),
      }).toString();

    // Open in new tab
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Arbitrage Opportunities</h2>
          <p className="text-muted-foreground">
            Monitor price differences between underlying stocks and their futures contracts
          </p>
        </div>
        <Button
          onClick={fetchArbitrageData}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Cron Status Card */}
      <div className='gap-2 grid grid-cols-2 w-full'>
        <CronStatusCard
          jobName="loginJob"
          displayName="Daily Ticks NSE Futures Job"
        />
        <CronStatusCard
          jobName="hourlyTicksNseFutJob"
          displayName="Hourly Ticks NSE Futures Job"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid gap-6 mt-4 md:grid-cols-3">
            {/* Gap (Next/Near) Filter */}
            <div className="space-y-8">
              <Label className="text-sm font-medium">Gap (Next/Near) %</Label>
              <div className="space-y-4">
                <div className="relative w-full px-3">
                  <div className="relative">
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
                      className="w-full [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-lg [&>.relative]:h-2 [&_.bg-primary]:bg-primary"
                    />

                    {/* Editable value inputs */}
                    {[
                      { val: filters.nextNearMin, key: 'nextNearMin' },
                      { val: filters.nextNearMax, key: 'nextNearMax' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="absolute -top-8 transform -translate-x-1/2"
                        style={{
                          left: `${((item.val + 10) / 20) * 100}%`,
                        }}
                      >
                        <Input
                          type="text"
                          pattern="^-?\d*\.?\d+$"
                          title="Enter number"
                          value={item.val.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (idx === 0) {
                              setFilters(prev => ({
                                ...prev,
                                nextNearMin: Math.max(-10, Math.min(value, prev.nextNearMax))
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                nextNearMax: Math.min(10, Math.max(value, prev.nextNearMin))
                              }));
                            }
                          }}
                          className="h-6 w-14 text-xs font-medium text-primary text-center px-1 py-0"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>-10%</span>
                    <span>0%</span>
                    <span>+10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap (Far/Next) Filter */}
            <div className="space-y-8">
              <Label className="text-sm font-medium">Gap (Far/Next) %</Label>
              <div className="space-y-4">
                <div className="relative w-full px-3">
                  <div className="relative">
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
                      className="w-full [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-lg [&>.relative]:h-2 [&_.bg-primary]:bg-primary"
                    />

                    {/* Editable value inputs */}
                    {[
                      { val: filters.farNextMin, key: 'farNextMin' },
                      { val: filters.farNextMax, key: 'farNextMax' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="absolute -top-8 transform -translate-x-1/2"
                        style={{
                          left: `${((item.val + 10) / 20) * 100}%`,
                        }}
                      >
                        <Input
                          type="text"
                          pattern="^-?\d*\.?\d+$"
                          title="Enter number"
                          value={item.val.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (idx === 0) {
                              setFilters(prev => ({
                                ...prev,
                                farNextMin: Math.max(-10, Math.min(value, prev.farNextMax))
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                farNextMax: Math.min(10, Math.max(value, prev.farNextMin))
                              }));
                            }
                          }}
                          className="h-6 w-14 text-xs font-medium text-primary text-center px-1 py-0"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>-10%</span>
                    <span>0%</span>
                    <span>+10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap (Far/Near) Filter */}
            <div className="space-y-8">
              <Label className="text-sm font-medium">Gap (Far/Near) %</Label>
              <div className="space-y-4">
                <div className="relative w-full px-3">
                  <div className="relative">
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
                      className="w-full [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&_[role=slider]]:shadow-lg [&>.relative]:h-2 [&_.bg-primary]:bg-primary"
                    />

                    {/* Editable value inputs */}
                    {[
                      { val: filters.farNearMin, key: 'farNearMin' },
                      { val: filters.farNearMax, key: 'farNearMax' }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="absolute -top-8 transform -translate-x-1/2"
                        style={{
                          left: `${((item.val + 10) / 20) * 100}%`,
                        }}
                      >
                        <Input
                          type="text"
                          pattern="^-?\d*\.?\d+$"
                          title="Enter number"
                          value={item.val.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (idx === 0) {
                              setFilters(prev => ({
                                ...prev,
                                farNearMin: Math.max(-10, Math.min(value, prev.farNearMax))
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                farNearMax: Math.min(10, Math.max(value, prev.farNearMin))
                              }));
                            }
                          }}
                          className="h-6 w-14 text-xs font-medium text-primary text-center px-1 py-0"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>-10%</span>
                    <span>0%</span>
                    <span>+10%</span>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Loading arbitrage data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">
                      No data available matching the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row: ArbitrageData, index) => {
                    // Calculate gaps only if data exists
                    const gapNextNear = (row.nextFuturePrice && row.nearFuturePrice)
                      ? calculateGap(row.nextFuturePrice, row.nearFuturePrice, row.underlyingPrice)
                      : null;
                    const gapFarNext = (row.farFuturePrice && row.nextFuturePrice)
                      ? calculateGap(row.farFuturePrice, row.nextFuturePrice, row.underlyingPrice)
                      : null;
                    const gapFarNear = (row.farFuturePrice && row.nearFuturePrice)
                      ? calculateGap(row.farFuturePrice, row.nearFuturePrice, row.underlyingPrice)
                      : null;

                    return (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(row)}
                      >
                        <TableCell className="text-center font-medium">
                          <div className="flex items-center justify-center flex-col">
                            <div>{row.underlyingSymbol}</div><div className='text-xs'>({row.time.split(" ")[1]+row.time.split(" ")[2]})</div>
                            {/* <Activity className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" /> */}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-base">
                          {formatPrice(row.underlyingPrice)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground flex flex-col">
                          <div>{row.nearFutureSymbol || 'N/A'}</div>
                          <div className='text-xs'>
                            ({row.nearFutureTime ? row.nearFutureTime.split(" ")[1] + row.nearFutureTime.split(" ")[2] : '00:00'})
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-base">
                          {row.nearFuturePrice ? formatPrice(row.nearFuturePrice) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {row.nearFutureVolume ? formatVolume(row.nearFutureVolume) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground flex flex-col">
                          <div>{row.nextFutureSymbol || 'N/A'}</div>
                          <div className='text-xs'>
                            ({row.nextFutureTime ? row.nextFutureTime.split(" ")[1] + row.nextFutureTime.split(" ")[2] : '00:00'})
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-base">
                          {row.nextFuturePrice ? formatPrice(row.nextFuturePrice) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {row.nextFutureVolume ? formatVolume(row.nextFutureVolume) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground flex flex-col">
                          <div>{row.farFutureSymbol || 'N/A'}</div>
                          <div className='text-xs'>
                            ({row.farFutureTime ? row.farFutureTime.split(" ")[1] + row.farFutureTime.split(" ")[2] : '00:00'})
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-base">
                          {row.farFuturePrice ? formatPrice(row.farFuturePrice) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {row.farFutureVolume ? formatVolume(row.farFutureVolume) : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapNextNear ? (gapNextNear.gapAmount > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapNextNear ? `${gapNextNear.gapAmount > 0 ? '+' : ''}${formatPrice(gapNextNear.gapAmount)}` : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapNextNear ? (gapNextNear.gapPercentage > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapNextNear ? `${gapNextNear.gapPercentage > 0 ? '+' : ''}${gapNextNear.gapPercentage.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapFarNext ? (gapFarNext.gapAmount > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapFarNext ? `${gapFarNext.gapAmount > 0 ? '+' : ''}${formatPrice(gapFarNext.gapAmount)}` : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapFarNext ? (gapFarNext.gapPercentage > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapFarNext ? `${gapFarNext.gapPercentage > 0 ? '+' : ''}${gapFarNext.gapPercentage.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapFarNear ? (gapFarNear.gapAmount > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapFarNear ? `${gapFarNear.gapAmount > 0 ? '+' : ''}${formatPrice(gapFarNear.gapAmount)}` : 'N/A'}
                        </TableCell>
                        <TableCell className={`text-center font-mono text-base ${gapFarNear ? (gapFarNear.gapPercentage > 0 ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                          {gapFarNear ? `${gapFarNear.gapPercentage > 0 ? '+' : ''}${gapFarNear.gapPercentage.toFixed(1)}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {!loading && filteredData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <Label htmlFor="rowsPerPage" className="text-sm whitespace-nowrap">
                  Rows per page:
                </Label>
                <select
                  id="rowsPerPage"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>

              {/* Page info and navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  <span className="text-sm font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  const gap = calculateGap(row.nextFuturePrice || 0, row.nearFuturePrice || 0, row.underlyingPrice || 0);
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
                  const gap = calculateGap(row.farFuturePrice || 0, row.nearFuturePrice || 0, row.underlyingPrice || 0);
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
