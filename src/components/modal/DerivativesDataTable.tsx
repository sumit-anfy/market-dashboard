import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "./SearchBar";
import { SortableTableHeader } from "./SortableTableHeader";
import { ReactNode } from "react";

interface DerivativesDataTableProps<T> {
  title: string;
  icon: ReactNode;
  data: T[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortConfig: { key: keyof T; direction: "asc" | "desc" } | null;
  onSort: (key: keyof T) => void;
  columns: {
    key: keyof T;
    label: string;
    align?: "left" | "center" | "right";
    render?: (value: any, row: T) => ReactNode;
  }[];
  tabSwitchLoading?: boolean;
}

export function DerivativesDataTable<T extends { symbol: string }>({
  title,
  icon,
  data,
  loading,
  error,
  searchValue,
  onSearchChange,
  sortConfig,
  onSort,
  columns,
  tabSwitchLoading = false,
}: DerivativesDataTableProps<T>) {
  return (
    <div className="space-y-4 relative">
      {tabSwitchLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading data...</span>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              disabled={tabSwitchLoading}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>
                {searchValue
                  ? `No results found matching "${searchValue}"`
                  : "No data available for this instrument"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b sticky top-0 z-10">
                    <tr>
                      {columns.map((column) => (
                        <SortableTableHeader
                          key={String(column.key)}
                          sortKey={String(column.key)}
                          sortConfig={sortConfig as any}
                          onSort={onSort as any}
                          align={column.align}
                        >
                          {column.label}
                        </SortableTableHeader>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((row, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        {columns.map((column) => {
                          const value = row[column.key];
                          const alignClass =
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                              ? "text-center"
                              : "text-left";

                          return (
                            <td
                              key={String(column.key)}
                              className={`px-4 py-3 ${alignClass}`}
                            >
                              {column.render ? column.render(value, row) : String(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
