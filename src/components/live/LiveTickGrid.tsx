import { LiveTickCard } from "./LiveTickCard";
import { LiveTick } from "@/types/market";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity } from "lucide-react";

type SymbolStatus = "connected" | "disconnected" | "error" | "waiting";

interface LiveTickGridProps {
  selectedSymbols: string[];
  liveTicks: Record<string, LiveTick>;
  connectionStatus: Record<string, "connected" | "disconnected" | "error">;
  isConnected: boolean;
  symbolNameMap?: Map<string, string>;
}

export function LiveTickGrid({
  selectedSymbols,
  liveTicks,
  connectionStatus,
  isConnected,
  symbolNameMap,
}: LiveTickGridProps) {
  if (!selectedSymbols.length) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>No symbols selected</AlertTitle>
        <AlertDescription>
          Choose an equity and add up to 200 FUT/OPT symbols to start streaming live ticks.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {selectedSymbols.map((symbol) => {
        const tick = liveTicks[symbol];
        const status: SymbolStatus = !isConnected
          ? "disconnected"
          : connectionStatus[symbol] || (tick ? "connected" : "waiting");

        const name = symbolNameMap?.get(symbol) || tick?.symbolName || symbol;

        return (
          <LiveTickCard
            key={symbol}
            symbol={symbol}
            symbolName={name}
            data={tick}
            status={status}
          />
        );
      })}
    </div>
  );
}
