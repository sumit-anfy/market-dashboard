import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { SymbolOHLCTableProps } from "../types/market";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function SymbolOHLCTable({
  data,
  maxEntries = 5,
}: SymbolOHLCTableProps) {
  // Get the latest entries limited by maxEntries
  const latestData = data.slice(-maxEntries).reverse();

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // const formatTimestamp = (timestamp: string) => {
  //   try {
  //     const date = new Date(timestamp);
  //     return date.toLocaleTimeString("en-US", {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //       hour12: false,
  //     });
  //   } catch {
  //     return "N/A";
  //   }
  // };

  // const getPriceChangeIndicator = (open: number, close: number) => {
  //   if (close > open) {
  //     return <TrendingUp className="h-3 w-3 text-green-500" />;
  //   } else if (close < open) {
  //     return <TrendingDown className="h-3 w-3 text-red-500" />;
  //   }
  //   return <Minus className="h-3 w-3 text-gray-500" />;
  // };

  // const getPriceChangeColor = (open: number, close: number) => {
  //   if (close > open) return "text-green-600";
  //   if (close < open) return "text-red-600";
  //   return "text-gray-600";
  // };

  return (
    <Card className="w-full pt-3">
      {/* <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">
            {symbol} OHLC Data
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Latest {latestData.length} entries
          </Badge>
        </div>
      </CardHeader> */}

      <CardContent>
        {latestData.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-gray-500">
            <div className="mb-2">
              <TrendingUp className="h-8 w-8 mx-auto text-gray-300" />
            </div>
            <p className="text-sm font-medium">No Ask & Bid data available</p>
            <p className="text-xs mt-1">
              Data will appear here once market updates are received
            </p>
          </div>
        ) : (
          // Data table with horizontal scrolling for mobile
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">
                    Bid Qty
                  </TableHead>
                  <TableHead className="text-center">
                    Bid Price
                  </TableHead>
                  <TableHead className="text-center">
                    Ask Qty
                  </TableHead>
                  <TableHead className="text-center">
                    Ask Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {latestData.map((entry, index) => (
                  <TableRow
                    key={`${entry.timestamp}-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="text-center">
                      {(entry.bidQty)}
                    </TableCell>
                    <TableCell className="text-center">
                      ₹{formatPrice(entry.bid)}
                    </TableCell>
                    <TableCell className="text-center">
                      {(entry.askQty)}
                    </TableCell>
                    <TableCell className="text-center">
                      ₹{formatPrice(entry.ask)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary footer for additional context */}
        {/* {latestData.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                Showing latest {latestData.length} of {data.length} entries
              </span>
              <span>
                Last updated: {formatTimestamp(latestData[0]?.timestamp || "")}
              </span>
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
