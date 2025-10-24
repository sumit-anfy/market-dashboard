import { Clock, Target } from "lucide-react";
import { DerivativesDataTable } from "./DerivativesDataTable";
import { useTableSearch } from "@/hooks/useTableSearch";
import { useTableSort } from "@/hooks/useTableSort";

export interface TickData {
  symbol: string;
  ltp: string;
  volume: string;
  oi: string;
  bid: string;
  bidqty: string;
  ask: string;
  askqty: string;
  expiry_date: string;
}

interface TicksTabProps {
  data: TickData[];
  loading: boolean;
  error: string | null;
  tabSwitchLoading: boolean;
  type: "futures" | "options";
}

export function TicksTab({
  data,
  loading,
  error,
  tabSwitchLoading,
  type,
}: TicksTabProps) {
  const { filteredData, searchTerm, setSearchTerm } = useTableSearch(data);
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData);

  const columns = [
    {
      key: "symbol" as keyof TickData,
      label: "Symbol",
      align: "left" as const,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "ltp" as keyof TickData,
      label: "LTP",
      align: "right" as const,
      render: (value: string) => (
        <span className="font-mono font-semibold">{value}</span>
      ),
    },
    {
      key: "volume" as keyof TickData,
      label: "Volume",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: "oi" as keyof TickData,
      label: "OI",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: "bid" as keyof TickData,
      label: "Bid",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: "bidqty" as keyof TickData,
      label: "Bid Qty",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: "ask" as keyof TickData,
      label: "Ask",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
    {
      key: "askqty" as keyof TickData,
      label: "Ask Qty",
      align: "right" as const,
      render: (value: string) => <span className="font-mono">{value}</span>,
    },
  ];

  const title =
    type === "futures" ? "NSE Futures Ticks Data" : "NSE Options Ticks Data";
  const icon =
    type === "futures" ? (
      <Clock className="h-5 w-5" />
    ) : (
      <Target className="h-5 w-5" />
    );

  return (
    <DerivativesDataTable
      title={title}
      icon={icon}
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
