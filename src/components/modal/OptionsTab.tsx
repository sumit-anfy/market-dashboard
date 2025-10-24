import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DerivativesDataTable } from "./DerivativesDataTable";
import { useTableSearch } from "@/hooks/useTableSearch";
import { useTableSort } from "@/hooks/useTableSort";

export interface OptionData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi: number;
  expiry_date: Date;
  option_type: string;
}

interface OptionsTabProps {
  data: OptionData[];
  loading: boolean;
  error: string | null;
  tabSwitchLoading: boolean;
}

export function OptionsTab({
  data,
  loading,
  error,
  tabSwitchLoading,
}: OptionsTabProps) {
  const { filteredData, searchTerm, setSearchTerm } = useTableSearch(data);
  const { sortedData, sortConfig, handleSort } = useTableSort(filteredData);

  const columns = [
    {
      key: "symbol" as keyof OptionData,
      label: "Symbol",
      align: "left" as const,
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "option_type" as keyof OptionData,
      label: "Type",
      align: "center" as const,
      render: (value: string) => (
        <Badge variant={value === "CE" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "expiry_date" as keyof OptionData,
      label: "Expiry",
      align: "center" as const,
      render: (value: Date) => (
        <span className="text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "open" as keyof OptionData,
      label: "Open",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "high" as keyof OptionData,
      label: "High",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "low" as keyof OptionData,
      label: "Low",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "close" as keyof OptionData,
      label: "Close",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono font-semibold">₹{value.toFixed(2)}</span>
      ),
    },
    {
      key: "volume" as keyof OptionData,
      label: "Volume",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()}</span>
      ),
    },
    {
      key: "oi" as keyof OptionData,
      label: "OI",
      align: "right" as const,
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <DerivativesDataTable
      title="NSE Options Data"
      icon={<Target className="h-5 w-5" />}
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
