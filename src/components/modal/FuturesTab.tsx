import { BarChart3 } from "lucide-react";
import { DerivativesDataTable } from "./DerivativesDataTable";
import { useTableSearch } from "@/hooks/useTableSearch";
import { useTableSort } from "@/hooks/useTableSort";

export interface FutureData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi: number;
  expiry_date: Date;
}

interface FuturesTabProps {
  data: FutureData[];
  loading: boolean;
  error: string | null;
  tabSwitchLoading: boolean;
}

export function FuturesTab({
  data,
  loading,
  error,
  tabSwitchLoading,
}: FuturesTabProps) {
  const { filteredData, searchTerm, setSearchTerm } = useTableSearch(data);
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData);

  const columns = [
    {
      key: "symbol" as keyof FutureData,
      label: "Symbol",
      align: "left" as const,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "expiry_date" as keyof FutureData,
      label: "Expiry",
      align: "center" as const,
      render: (value: Date) => (
        <span className="text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "open" as keyof FutureData,
      label: "Open",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "high" as keyof FutureData,
      label: "High",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "low" as keyof FutureData,
      label: "Low",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "close" as keyof FutureData,
      label: "Close",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono font-semibold">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "volume" as keyof FutureData,
      label: "Volume",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()}</span>
      ),
    },
    {
      key: "oi" as keyof FutureData,
      label: "OI",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <DerivativesDataTable
      title="NSE Futures Data"
      icon={<BarChart3 className="h-5 w-5" />}
      data={sortedData}
      loading={loading}
      error={error}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      sortConfig={sortConfig}
      onSort={handleSort}
      columns={columns}
      tabSwitchLoading={tabSwitchLoading}
    />
  );
}
