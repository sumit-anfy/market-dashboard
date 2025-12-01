import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Filter, TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { HistoricalData, FilterOptions, EquityInstrument } from '@/types/market';
import { apiClient } from '@/config/axiosClient';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

type ExtendedHistoricalData = HistoricalData & {
  month?: string;
  strike?: string | number;
  expiry?: string;
};

export function HistoricalDataView() {
  const [data, setData] = useState<ExtendedHistoricalData[]>([]);
  const [sortField, setSortField] = useState<keyof ExtendedHistoricalData>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedSymbolId, setSelectedSymbolId] = useState<number | string | null>(null);
  const [symbolOptions, setSymbolOptions] = useState<EquityInstrument[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [symbolsError, setSymbolsError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    limit: 360,
    offset: 0,
    hasMore: false,
  });
  const [queryOffset, setQueryOffset] = useState(0);
  const [pendingDateRange, setPendingDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [filters, setFilters] = useState<FilterOptions>({
    segment: [],
    symbol: '',
    dateRange: { from: null, to: null },
    minPrice: null,
    maxPrice: null,
    minVolume: null,
    maxVolume: null,
  });

  const loadSymbolsFromApi = useCallback(async () => {
    setIsLoadingSymbols(true);
    setSymbolsError(null);
    try {
      const equitiesResponse = await apiClient.get<ApiResponse<EquityInstrument[]>>('/api/live-data/equities');
      const equities = (equitiesResponse.data?.data || []).map((equity) => ({
        ...equity,
        id: Number(equity.id),
      }));

      if (!equities.length) {
        setSymbolOptions([]);
        setSymbolsError('No symbols available from the server.');
        return;
      }

      setSymbolOptions(equities);

    } catch (error) {
      console.error('Failed to load symbols for Historical Data filters', error);
      setSymbolsError('Unable to load symbols from server. Showing local list.');
      toast({
        title: 'Symbol list unavailable',
        description: 'The API is unavailable. Using local symbols instead.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSymbols(false);
    }
  }, []);

  const displayValue = (value: any) =>
    value === null || value === undefined || value === '' ? '-' : value;

  const formatDate = (value: any) => {
    if (!value) return '-';
    const dateObj = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : null;
    if (!dateObj || Number.isNaN(dateObj.getTime())) return displayValue(value);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const displayNumber = (value: any, digits?: number) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return value || '-';
    return digits !== undefined ? num.toFixed(digits) : num.toString();
  };

  const displayVolume = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return value || '-';
    return num.toLocaleString();
  };

  const toNumericId = (value: string | number | null | undefined) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const toCsvValue = (value: any) => {
    const display = displayValue(value);
    const str = typeof display === 'string' ? display : String(display);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const handleServerPageChange = (direction: 'next' | 'prev') => {
    const limit = paginationMeta.limit || 100;
    if (direction === 'next') {
      const nextOffset = paginationMeta.offset + limit;
      if (paginationMeta.hasMore || nextOffset < paginationMeta.total) {
        setQueryOffset(nextOffset);
      }
    } else {
      const prevOffset = Math.max(0, paginationMeta.offset - limit);
      if (prevOffset !== paginationMeta.offset) {
        setQueryOffset(prevOffset);
      }
    }
  };

  const fetchHistoricalData = useCallback(
    async (
      segment: string,
      symbolObject: { name: string; id: string | number | null },
      offset: number = 0
    ) => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        let url = '';
        const params: Record<string, string | number> = {
          limit: paginationMeta.limit || 100,
          offset,
        };
        const fromDate = filters.dateRange.from
          ? filters.dateRange.from.toISOString().split('T')[0]
          : undefined;
        const toDate = filters.dateRange.to
          ? filters.dateRange.to.toISOString().split('T')[0]
          : undefined;
        if (fromDate) params.startDate = fromDate;
        if (toDate) params.endDate = toDate;

        switch (segment) {
          case 'NSE_EQ':
            url = '/api/nse-equity';
            params.symbol = symbolObject.name;
            break;
          case 'NSE_FUT':
            url = '/api/nse-futures';
            {
              const underlyingId = Number(symbolObject.id);
              if (!Number.isFinite(underlyingId)) {
                setData([]);
                setDataError('Symbol ID is required for NSE_FUT.');
                setIsLoadingData(false);
                return;
              }
              params.underlying = underlyingId;
            }
            break;
          case 'NSE_OPT':
            url = '/api/nse-options';
            {
              const underlyingId = Number(symbolObject.id);
              if (!Number.isFinite(underlyingId)) {
                setData([]);
                setDataError('Symbol ID is required for NSE_OPT.');
                setIsLoadingData(false);
                return;
              }
              params.underlying = underlyingId;
            }
            break;
          case 'BSE_EQ':
            url = '/api/bse-equity';
            params.underlying = symbolObject.name;
            break;
          default:
            setData([]);
            setDataError('Unsupported segment selected.');
            setIsLoadingData(false);
            return;
        }

        if (!url) {
          setData([]);
          setIsLoadingData(false);
          return;
        }

        const response = await apiClient.get<ApiResponse<any[]>>(url, {
          params,
          paramsSerializer: (p) => {
            const usp = new URLSearchParams();
            Object.entries(p).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              const num = Number(value);
              usp.append(key, Number.isFinite(num) ? String(num) : String(value));
            });
            return usp.toString();
          },
        });
        const rows = response.data?.data || [];

        const toNumber = (value: any) => {
          const num = Number(value);
          return Number.isFinite(num) ? num : 0;
        };

        const mapped: ExtendedHistoricalData[] = rows.map((row, index) => {
          const price =
            row.price ?? row.close ?? row.ltp ?? row.last_price ?? row.last ?? row.open ?? null;
          const previousClose =
            row.previousClose ?? row.prev_close ?? row.previous_close ?? row.close ?? null;
          const change =
            row.change ?? row.change_amount ??
            (price !== null && previousClose !== null
              ? Number(price) - Number(previousClose)
              : null);
          const changePercent =
            row.changePercent ?? row.change_percent ?? row.change_percentage ??
            (change !== null && previousClose
              ? (Number(change) / Number(previousClose)) * 100
              : null);

          const expiryValue =
            row.expiry ??
            row.expiry_date ??
            row.expiryDate ??
            row.expiryDateString ??
            row.expiry_date_string ??
            null;

          const expiryDateObj = expiryValue ? new Date(expiryValue) : undefined;
          const monthValue =
            row.expiryMonth ??
            row.expiry_month ??
            (expiryDateObj ? expiryDateObj.toLocaleString('en-US', { month: 'long' }) : null);

          return {
            id: (row.id ?? `${symbolObject.name}-${index}`).toString(),
            symbol: row.symbol ?? symbolObject.name ?? '-',
            segment: row.segment ?? segment,
            price: toNumber(price),
            previousClose: toNumber(previousClose),
            change: toNumber(change),
            changePercent: toNumber(changePercent),
            volume: toNumber(row.volume ?? row.total_traded_volume ?? row.totalVolume ?? row.traded_qty),
            high: toNumber(row.high ?? row.high_price ?? row.day_high),
            low: toNumber(row.low ?? row.low_price ?? row.day_low),
            open: toNumber(row.open ?? row.open_price),
            timestamp: row.timestamp ? new Date(row.timestamp) : row.date ? new Date(row.date) : new Date(),
            date: row.date ?? row.time ?? row.trade_date ?? row.timestamp ?? '',
            turnover: toNumber(toNumber(price) * toNumber(row.volume)),
            month: monthValue ?? undefined,
            strike: row.strike ?? row.strike_price ?? undefined,
            expiry: expiryDateObj ? expiryDateObj.toISOString() : undefined,
          } as ExtendedHistoricalData;
        });

        setData(mapped);
        const pagination = (response.data as any)?.pagination || {};
        const limitValue = Number(pagination.limit ?? params.limit ?? mapped.length ?? 100);
        const offsetValue = Number(pagination.offset ?? offset ?? 0);
        const totalValue = Number(pagination.total ?? mapped.length ?? 0);
        setPaginationMeta({
          total: Number.isFinite(totalValue) ? totalValue : mapped.length,
          limit: Number.isFinite(limitValue) ? limitValue : 100,
          offset: Number.isFinite(offsetValue) ? offsetValue : 0,
          hasMore: Boolean(pagination.hasMore),
        });
      } catch (error) {
        console.error('Failed to fetch historical data', error);
        setData([]);
        setDataError('Unable to fetch historical data for the selected filters.');
      } finally {
        setIsLoadingData(false);
      }
    },
    [paginationMeta.limit]
  );

  const handleSort = (field: keyof ExtendedHistoricalData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    loadSymbolsFromApi();
  }, [loadSymbolsFromApi]);

  const selectedSegment = useMemo(() => filters.segment[0] || '', [filters.segment]);
  const dateBounds = useMemo(() => {
    if (selectedSegment === 'NSE_EQ') {
      return { min: new Date('2019-01-01'), max: new Date() };
    }
    if (selectedSegment === 'NSE_FUT' || selectedSegment === 'NSE_OPT') {
      return { min: new Date('2022-01-01'), max: new Date() };
    }
    return { min: null, max: new Date() };
  }, [selectedSegment]);

  useEffect(() => {
    setQueryOffset(0);
    if (selectedSegment === 'NSE_EQ') {
      setFilters((prev) => ({
        ...prev,
        dateRange: {
          from: prev.dateRange.from ?? new Date('2019-01-01'),
          to: prev.dateRange.to ?? new Date(),
        },
      }));
    }
  }, [selectedSegment, selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol || !selectedSegment) {
      setData([]);
      setDataError(null);
      setPaginationMeta((prev) => ({
        total: 0,
        limit: prev.limit || 100,
        offset: 0,
        hasMore: false,
      }));
      return;
    }

    const symbolObject = { name: selectedSymbol, id: selectedSymbolId };
    fetchHistoricalData(selectedSegment, symbolObject, queryOffset);
  }, [fetchHistoricalData, selectedSegment, selectedSymbol, selectedSymbolId, queryOffset]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (filters.symbol && !item.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
      if (filters.segment.length > 0) {
        const itemSegment = (item.segment || '').toUpperCase();
        const activeSegment = selectedSegment.toUpperCase();
        const segmentMatches =
          !item.segment ||
          filters.segment.includes(item.segment) ||
          (activeSegment === 'NSE_FUT' && itemSegment === 'FUT') ||
          (activeSegment === 'NSE_OPT' && itemSegment === 'OPT') ||
          activeSegment === itemSegment;

        if (!segmentMatches) return false;
      }
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = item.date ? new Date(item.date) : null;
        if (itemDate && !Number.isNaN(itemDate.getTime())) {
          if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
          if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
        }
      }
      if (filters.minPrice !== null && item.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && item.price > filters.maxPrice) return false;
      if (filters.minVolume !== null && item.volume < filters.minVolume) return false;
      if (filters.maxVolume !== null && item.volume > filters.maxVolume) return false;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }
      
      return 0;
    });

    const adjusted = sorted.map((row, index) => {
      const nextRow = sorted[index + 1];
      if (!nextRow) return row;

      const change = row.price - nextRow.price;
      const changePercent =
        nextRow.price !== 0 ? (change / nextRow.price) * 100 : row.changePercent;

      return {
        ...row,
        change,
        changePercent,
      };
    });

    return adjusted;
  }, [data, filters, sortField, sortDirection, selectedSymbol, selectedSegment]);

  const showingFrom = filteredAndSortedData.length ? paginationMeta.offset + 1 : 0;
  const showingTo = filteredAndSortedData.length ? paginationMeta.offset + filteredAndSortedData.length : 0;
  const totalRecords = paginationMeta.total || filteredAndSortedData.length;
  const columnCount = useMemo(() => {
    let count = 8; // base columns without derivative extras
    if (selectedSegment === 'NSE_FUT') count += 1;
    if (selectedSegment === 'NSE_OPT') count += 3;
    return count;
  }, [selectedSegment]);

  const exportToCsv = () => {
    if (!selectedSegment || filteredAndSortedData.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Load data for a segment and apply filters before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Symbol',
      'Segment',
      'Date',
      ...(selectedSegment === 'NSE_FUT' || selectedSegment === 'NSE_OPT' ? ['Month'] : []),
      ...(selectedSegment === 'NSE_OPT' ? ['Strike', 'Expiry'] : []),
      'Open',
      'High',
      'Low',
      'Close',
      'Volume',
      'Change%',
      'Turnover',
    ];

    const rows = filteredAndSortedData.map((row) => {
      const cells: (string | number)[] = [
        displayValue(row.symbol),
        selectedSegment || displayValue(row.segment),
        formatDate(row.date),
      ];

      if (selectedSegment === 'NSE_FUT' || selectedSegment === 'NSE_OPT') {
        cells.push(displayValue(row.month));
      }

      if (selectedSegment === 'NSE_OPT') {
        cells.push(displayValue(row.strike), formatDate(row.expiry));
      }

      cells.push(
        displayNumber(row.open, 2),
        displayNumber(row.high, 2),
        displayNumber(row.low, 2),
        displayNumber(row.price, 2),
        displayVolume(row.volume),
        displayNumber(row.changePercent, 2),
        displayNumber(row.turnover, 2)
      );

      return cells.map(toCsvValue).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const fileNameParts = [
      'historical_data',
      selectedSegment.toLowerCase(),
      selectedSymbol ? selectedSymbol.replace(/\s+/g, '_') : null,
    ].filter(Boolean);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameParts.join('_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const availableSymbols = useMemo(() => {
    if (symbolOptions.length) {
      return symbolOptions.map((option) => option.instrumentType);
    }

    return Array.from(new Set(data.map((d) => d.symbol))).sort();
  }, [data, symbolOptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historical Market Data</h2>
          <p className="text-muted-foreground">
            Analyze historical price movements and trading volumes across NSE and BSE
          </p>
        </div>
        <Button onClick={exportToCsv} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-2">
              <label className="text-sm font-medium">Symbol</label>
              <Select
                value={selectedSymbol || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedSymbol('');
                    setSelectedSymbolId(null);
                  } else {
                    setSelectedSymbol(value);
                    const matched = symbolOptions.find((option) => option.instrumentType === value);
                    setSelectedSymbolId(toNumericId(matched?.id));
                  }
                  setFilters((prev) => ({ ...prev, symbol: '' }));
                }}
                disabled={isLoadingSymbols && availableSymbols.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSymbols ? "Loading symbols..." : "All symbols"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All symbols</SelectItem>
                  {isLoadingSymbols && availableSymbols.length === 0 && (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                  {availableSymbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {symbolsError && (
                <p className="text-xs text-destructive">{symbolsError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Segment</label>
              <Select onValueChange={(value) => setFilters({ ...filters, segment: value === "all" ? [] : [value] })}>
                <SelectTrigger>
                  <SelectValue placeholder="All segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All segments</SelectItem>
                  <SelectItem value="NSE_EQ">NSE Equity</SelectItem>
                  <SelectItem value="NSE_FUT">NSE Futures</SelectItem>
                  <SelectItem value="NSE_OPT">NSE Options</SelectItem>
                  <SelectItem value="BSE_EQ">BSE Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center">
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] text-muted-foreground sm:hidden mb-1">From</span>
                  <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={pendingDateRange.from ? pendingDateRange.from.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const value = e.target.value ? new Date(e.target.value) : null;
                        setPendingDateRange((prev) => ({ ...prev, from: value }));
                      }}
                      className="h-9 text-sm sm:text-xs w-full"
                      autoComplete="off"
                      inputMode="numeric"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={pendingDateRange.from ?? undefined}
                          onSelect={(d) => setPendingDateRange((prev) => ({ ...prev, from: d || null }))}
                          fromDate={dateBounds.min ?? undefined}
                          toDate={pendingDateRange.to ?? dateBounds.max ?? undefined}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground py-1">to</div>
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] text-muted-foreground sm:hidden mb-1">To</span>
                  <div className="grid grid-cols-[1fr_auto] gap-1 items-center">
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={pendingDateRange.to ? pendingDateRange.to.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const value = e.target.value ? new Date(e.target.value) : null;
                        setPendingDateRange((prev) => ({ ...prev, to: value }));
                      }}
                      className="h-9 text-sm sm:text-xs w-full"
                      autoComplete="off"
                      inputMode="numeric"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0">
                        <Calendar
                          mode="single"
                          selected={pendingDateRange.to ?? undefined}
                          onSelect={(d) => setPendingDateRange((prev) => ({ ...prev, to: d || null }))}
                          fromDate={pendingDateRange.from ?? dateBounds.min ?? undefined}
                          toDate={dateBounds.max ?? undefined}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {selectedSegment === 'NSE_EQ'
                    ? 'NSE_EQ: 01/01/19 to today'
                    : selectedSegment === 'NSE_FUT' || selectedSegment === 'NSE_OPT'
                      ? 'NSE_FUT/OPT: 01/01/22 to today'
                      : 'Select a segment to view available range'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, ...pendingDateRange },
                    }));
                    setQueryOffset(0);
                  }}
                >
                  Apply Dates
                </Button>
              </div>
            </div>
            
            {/* <div className="space-y-2">
              <label className="text-sm font-medium">Items per page</label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table" className="w-full">
        <TabsList>
          <TabsTrigger value="table">Data Table</TabsTrigger>
          <TabsTrigger value="analysis">Symbol Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>
                  Market Data
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {showingFrom}-{showingTo} of {totalRecords} records
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingData && (
                <p className="mb-2 text-sm text-muted-foreground">Loading historical data...</p>
              )}
              {dataError && (
                <p className="mb-2 text-sm text-destructive">{dataError}</p>
              )}
              <DataTable>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead sortable onClick={() => handleSort('symbol')}>Symbol</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('segment')}>Segment</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('date')}>Date</DataTableHead>
                    {selectedSegment === 'NSE_FUT' && (
                      <DataTableHead sortable onClick={() => handleSort('month' as keyof ExtendedHistoricalData)}>
                        Month
                      </DataTableHead>
                    )}
                    {selectedSegment === 'NSE_OPT' && (
                      <>
                        <DataTableHead sortable onClick={() => handleSort('month' as keyof ExtendedHistoricalData)}>
                          Month
                        </DataTableHead>
                        <DataTableHead sortable onClick={() => handleSort('strike' as keyof ExtendedHistoricalData)}>
                          Strike
                        </DataTableHead>
                        <DataTableHead sortable onClick={() => handleSort('expiry' as keyof ExtendedHistoricalData)}>
                          Expiry
                        </DataTableHead>
                      </>
                    )}
                    <DataTableHead sortable onClick={() => handleSort('price')}>Close</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('change')}>Change</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('volume')}>Volume</DataTableHead>
                    <DataTableHead>OHLC</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('turnover')}>Turnover</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {!isLoadingData && !dataError && filteredAndSortedData.length === 0 && (
                    <DataTableRow>
                      <DataTableCell colSpan={columnCount} className="text-center text-muted-foreground">
                        No data available.
                      </DataTableCell>
                    </DataTableRow>
                  )}
                  {filteredAndSortedData.map((item) => (
                    <DataTableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedSymbol(item.symbol);
                        const matched = symbolOptions.find((option) => option.instrumentType === item.symbol);
                        setSelectedSymbolId(toNumericId(matched?.id));
                      }}
                    >
                      <DataTableCell>
                        <div className="font-medium font-mono">{selectedSymbol || item.symbol}</div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="secondary">{item.segment}</Badge>
                      </DataTableCell>
                      <DataTableCell className="font-mono text-sm">
                        {formatDate(item.date)}
                      </DataTableCell>
                      {selectedSegment === 'NSE_FUT' && (
                        <DataTableCell className="font-mono text-sm">{displayValue(item.month)}</DataTableCell>
                      )}
                      {selectedSegment === 'NSE_OPT' && (
                        <>
                          <DataTableCell className="font-mono text-sm">{displayValue(item.month)}</DataTableCell>
                          <DataTableCell className="font-mono text-sm">{displayValue(item.strike)}</DataTableCell>
                          <DataTableCell className="font-mono text-sm">{formatDate(item.expiry)}</DataTableCell>
                        </>
                      )}
                      <DataTableCell className="font-mono">{displayNumber(item.price, 2)}</DataTableCell>
                      <DataTableCell>
                        {(() => {
                          const changeValue = Number(item.change);
                          const isGain = Number.isFinite(changeValue) ? changeValue >= 0 : false;
                          return (
                            <div className={`flex items-center gap-1 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                              {isGain ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              <span className="font-mono">
                                {displayNumber(item.change, 2)} ({displayNumber(item.changePercent, 2)}%)
                              </span>
                            </div>
                          );
                        })()}
                      </DataTableCell>
                      <DataTableCell className="font-mono">{displayVolume(item.volume)}</DataTableCell>
                      <DataTableCell>
                        <div className="text-xs font-mono space-y-1">
                          <div>O: {displayNumber(item.open, 2)}</div>
                          <div>H: {displayNumber(item.high, 2)}</div>
                          <div>L: {displayNumber(item.low, 2)}</div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="font-mono">{displayNumber(item.turnover,2)}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
                <div>
                  Offset {paginationMeta.offset} · Limit {paginationMeta.limit} · Total {totalRecords}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServerPageChange('prev')}
                    disabled={isLoadingData || paginationMeta.offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServerPageChange('next')}
                    disabled={
                      isLoadingData ||
                      (!paginationMeta.hasMore && paginationMeta.offset + paginationMeta.limit >= totalRecords)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symbol Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedSymbol}
                  onValueChange={(value) => {
                    setSelectedSymbol(value);
                    const matched = symbolOptions.find((option) => option.instrumentType === value);
                    setSelectedSymbolId(toNumericId(matched?.id));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSymbols ? "Loading symbols..." : "Select a symbol for detailed analysis"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingSymbols && availableSymbols.length === 0 && (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                    {availableSymbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedSymbol && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const symbolData = filteredAndSortedData.filter(d => d.symbol === selectedSymbol);
                      const total = symbolData.length || 1;
                      const avgPrice = total ? symbolData.reduce((sum, d) => sum + d.price, 0) / total : 0;
                      const totalVolume = symbolData.reduce((sum, d) => sum + d.volume, 0);
                      const maxPrice = symbolData.length ? Math.max(...symbolData.map(d => d.price)) : 0;
                      const minPrice = symbolData.length ? Math.min(...symbolData.map(d => d.price)) : 0;
                      
                      return (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">{displayNumber(avgPrice, 2)}</div>
                              <p className="text-sm text-muted-foreground">Average Price</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">{displayVolume(totalVolume)}</div>
                              <p className="text-sm text-muted-foreground">Total Volume</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">{displayNumber(maxPrice, 2)}</div>
                              <p className="text-sm text-muted-foreground">Highest Price</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">{displayNumber(minPrice, 2)}</div>
                              <p className="text-sm text-muted-foreground">Lowest Price</p>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
