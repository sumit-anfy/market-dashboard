import React, { useState, useMemo } from 'react';
import { CalendarDays, Download, Filter, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from '@/components/ui/data-table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import { HistoricalData, FilterOptions } from '@/types/market';
import { generateHistoricalData } from '@/lib/mockData';

export function HistoricalDataView() {
  const [data] = useState<HistoricalData[]>(generateHistoricalData(90));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof HistoricalData>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({
    segment: [],
    symbol: '',
    dateRange: { from: null, to: null },
    minPrice: null,
    maxPrice: null,
    minVolume: null,
    maxVolume: null,
  });

  const handleSort = (field: keyof HistoricalData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      if (filters.symbol && !item.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
      if (filters.segment.length > 0 && !filters.segment.includes(item.segment)) return false;
      if (filters.minPrice !== null && item.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && item.price > filters.maxPrice) return false;
      if (filters.minVolume !== null && item.volume < filters.minVolume) return false;
      if (filters.maxVolume !== null && item.volume > filters.maxVolume) return false;
      return true;
    });

    if (selectedSymbol) {
      filtered = filtered.filter(item => item.symbol === selectedSymbol);
    }

    return filtered.sort((a, b) => {
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
  }, [data, filters, sortField, sortDirection, selectedSymbol]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedSymbol, sortField, sortDirection]);

  const exportToCsv = () => {
    const headers = ['Symbol', 'Segment', 'Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'Change%', 'Turnover'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(row => [
        row.symbol,
        row.segment,
        row.date,
        row.open,
        row.high,
        row.low,
        row.price,
        row.volume,
        row.changePercent.toFixed(2),
        row.turnover
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historical_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueSymbols = useMemo(() => 
    Array.from(new Set(data.map(d => d.symbol))).sort()
  , [data]);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => setCurrentPage(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Symbol</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search symbols..."
                  value={filters.symbol}
                  onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}
                  className="pl-10"
                />
              </div>
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
                  <SelectItem value="NSE_FO">NSE F&O</SelectItem>
                  <SelectItem value="BSE_EQ">BSE Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Volume</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minVolume || ''}
                onChange={(e) => setFilters({ ...filters, minVolume: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            
            <div className="space-y-2">
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
            </div>
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
                  Market Data ({filteredAndSortedData.length} records)
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} records
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead sortable onClick={() => handleSort('symbol')}>Symbol</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('segment')}>Segment</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('date')}>Date</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('price')}>Close</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('change')}>Change</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('volume')}>Volume</DataTableHead>
                    <DataTableHead>OHLC</DataTableHead>
                    <DataTableHead sortable onClick={() => handleSort('turnover')}>Turnover</DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {paginatedData.map((item) => (
                    <DataTableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedSymbol(item.symbol)}>
                      <DataTableCell>
                        <div className="font-medium font-mono">{item.symbol}</div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant="secondary">{item.segment}</Badge>
                      </DataTableCell>
                      <DataTableCell className="font-mono text-sm">{item.date}</DataTableCell>
                      <DataTableCell className="font-mono">₹{item.price.toFixed(2)}</DataTableCell>
                      <DataTableCell>
                        <div className={`flex items-center gap-1 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="font-mono">
                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="font-mono">{item.volume.toLocaleString()}</DataTableCell>
                      <DataTableCell>
                        <div className="text-xs font-mono space-y-1">
                          <div>O: ₹{item.open.toFixed(2)}</div>
                          <div>H: ₹{item.high.toFixed(2)}</div>
                          <div>L: ₹{item.low.toFixed(2)}</div>
                        </div>
                      </DataTableCell>
                      <DataTableCell className="font-mono">₹{(item.turnover / 100000).toFixed(1)}L</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a symbol for detailed analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueSymbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedSymbol && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const symbolData = filteredAndSortedData.filter(d => d.symbol === selectedSymbol);
                      const avgPrice = symbolData.reduce((sum, d) => sum + d.price, 0) / symbolData.length;
                      const totalVolume = symbolData.reduce((sum, d) => sum + d.volume, 0);
                      const maxPrice = Math.max(...symbolData.map(d => d.price));
                      const minPrice = Math.min(...symbolData.map(d => d.price));
                      
                      return (
                        <>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">₹{avgPrice.toFixed(2)}</div>
                              <p className="text-sm text-muted-foreground">Average Price</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">{totalVolume.toLocaleString()}</div>
                              <p className="text-sm text-muted-foreground">Total Volume</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">₹{maxPrice.toFixed(2)}</div>
                              <p className="text-sm text-muted-foreground">Highest Price</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold font-mono">₹{minPrice.toFixed(2)}</div>
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