import { useState } from "react";
import { Bell, CheckCheck, History } from "lucide-react";
import { useGapAlerts } from "@/hooks/useGapAlerts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatTime(value?: string | Date) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { history, unreadCount, markAllRead, markAlertRead, clearHistory } =
    useGapAlerts({ maxVisible: 4, autoDismissMs: 8000 });

  const hasNotifications = history.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Live socket alerts and saved history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-green-500/50 bg-green-50 text-[11px] font-semibold text-green-700"
            >
              Live
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark read
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[360px]">
          {!hasNotifications ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet. Live socket events will show up here.
            </div>
          ) : (
            <div className="divide-y">
              {history.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => markAlertRead(alert.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/60",
                    !alert.read && "bg-muted/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full",
                      alert.read
                        ? "bg-muted-foreground/40"
                        : "bg-emerald-500"
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {alert.instrumentName}
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(alert.triggeredAt ?? alert.receivedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Slot {alert.timeSlot} · Δ {alert.deviationPercent.toFixed(2)}%
                      {" · "}
                      {alert.alertType.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current {alert.currentValue} · Baseline{" "}
                      {alert.baselineValue ?? "—"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            {hasNotifications
              ? "Most recent notifications are stored locally."
              : "No history stored yet."}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={clearHistory}
            disabled={!hasNotifications}
          >
            <History className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
