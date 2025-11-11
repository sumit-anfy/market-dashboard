import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  WifiOff,
} from "lucide-react";
import { SymbolCardProps } from "../types/market";

export function SymbolCard({
  symbol,
  ltp,
  volume,
  lastUpdated,
  status,
}: SymbolCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      connected: "default",
      disconnected: "outline",
      error: "destructive",
    };

    const labels: Record<string, string> = {
      connected: "LIVE",
      disconnected: "OFFLINE",
      error: "ERROR",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {labels[status] || "UNKNOWN"}
      </Badge>
    );
  };

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) {
      return `${(vol / 10000000).toFixed(1)}Cr`;
    } else if (vol >= 100000) {
      return `${(vol / 100000).toFixed(1)}L`;
    } else if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}K`;
    }
    return vol.toLocaleString();
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return "N/A";
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <Card
      className={`w-full border-l-4 border-l-black hover:shadow-md transition-shadow duration-200`}
    >
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-md font-bold text-gray-900 truncate">
              {symbol}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* LTP, Volume and Timestamp */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Last Traded Price</p>
            <p className="text-sm font-bold">
              ₹{formatPrice(ltp)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Volume</p>
            <p className="text-sm font-semibold">
              {formatVolume(volume)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Updated</p>
            <p className="text-xs font-medium">
              {formatTimestamp(lastUpdated)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
