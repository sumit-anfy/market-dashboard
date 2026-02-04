import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveTick } from "@/types/market";
import { AlertTriangle, Clock3, Wifi, WifiOff } from "lucide-react";

type LiveStatus = "connected" | "disconnected" | "error" | "waiting";

interface LiveTickCardProps {
  symbol: string;
  symbolName?: string;
  data?: LiveTick;
  status: LiveStatus;
}

const statusConfig: Record<
  LiveStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  connected: { label: "LIVE", variant: "default" },
  waiting: { label: "WAITING", variant: "secondary" },
  disconnected: { label: "OFFLINE", variant: "outline" },
  error: { label: "ERROR", variant: "destructive" },
};

const statusBorder: Record<LiveStatus, string> = {
  connected: "border-l-emerald-500",
  waiting: "border-l-amber-400",
  disconnected: "border-l-slate-400",
  error: "border-l-red-500",
};

function formatVolume(volume?: number) {
  if (volume === undefined || volume === null) return "--";
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
  if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toLocaleString();
}

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  return value.toFixed(2);
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function LiveTickCard({ symbol, symbolName, data, status }: LiveTickCardProps) {
  const badgeConfig = statusConfig[status];

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md border-l-4 ${statusBorder[status]}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === "connected" ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : status === "error" ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-slate-500" />
            )}
            <CardTitle className="text-lg font-mono">{symbolName || data?.symbolName || symbol}</CardTitle>
          </div>
          <Badge variant={badgeConfig.variant} className="text-xs">
            {badgeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">LTP</div>
                <div className="font-mono text-xl font-semibold">
                  {formatNumber(data.ltp)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Volume</div>
                <div className="font-mono text-lg">
                  {formatVolume(data.volume)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Bid / BidQty</div>
                <div className="font-mono">
                  {formatNumber(data.bid)} / {formatNumber(data.bidQty)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Ask / AskQty</div>
                <div className="font-mono">
                  {formatNumber(data.ask)} / {formatNumber(data.askQty)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Clock3 className="h-3 w-3" />
              <span>Timestamp: {formatTimestamp(data.timestamp)}</span>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground bg-muted/40">
            Waiting for data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
