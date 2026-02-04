import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DerivativeSymbol, EquityInstrument } from "@/types/market";
import { ChevronsUpDown, Loader2, X, XCircle } from "lucide-react";

interface LiveSymbolSelectorProps {
  equities: EquityInstrument[];
  selectedEquities: number[];
  onToggleEquity: (equityId: number) => void;
  symbolOptions: DerivativeSymbol[];
  selectedSymbols: string[];
  onToggleSymbol: (symbol: string) => void;
  onClearSymbols: () => void;
  maxSelections: number;
  selectionError?: string | null;
  isLoadingSymbols?: boolean;
  isLoadingEquities?: boolean;
}

export function LiveSymbolSelector({
  equities,
  selectedEquities,
  onToggleEquity,
  symbolOptions,
  selectedSymbols,
  onToggleSymbol,
  onClearSymbols,
  maxSelections,
  selectionError,
  isLoadingSymbols,
  isLoadingEquities,
}: LiveSymbolSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isOptPopoverOpen, setIsOptPopoverOpen] = useState(false);

  const futSymbols = useMemo(
    () => symbolOptions.filter((option) => option.segment === "FUT"),
    [symbolOptions]
  );
  const optSymbols = useMemo(
    () => symbolOptions.filter((option) => option.segment === "OPT"),
    [symbolOptions]
  );

  const futEmpty = futSymbols.length === 0;
  const optEmpty = optSymbols.length === 0;

  const renderMeta = (symbol: DerivativeSymbol) => {
    const parts: string[] = [];
    if (symbol.segment) parts.push(symbol.segment);
    if (symbol.optionType) parts.push(symbol.optionType);
    if (symbol.expiryMonth) parts.push(symbol.expiryMonth);
    return parts.join(" • ");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Equities</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={isLoadingEquities}
              >
                <span className="flex items-center gap-2">
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  {isLoadingEquities
                    ? "Loading equities..."
                    : selectedEquities.length
                      ? `${selectedEquities.length} selected`
                      : "Select equities"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0">
              <Command>
                <CommandInput placeholder="Search equity" />
                <CommandList className="max-h-[420px] overflow-auto">
                  <CommandEmpty>{isLoadingEquities ? "Loading..." : "No equities found."}</CommandEmpty>
                  <CommandGroup heading="Equity">
                    {equities.map((equity) => {
                      const isChecked = selectedEquities.includes(equity.id);
                      return (
                        <CommandItem
                          key={equity.id}
                          value={equity.instrumentType}
                          className="cursor-pointer"
                          onSelect={() => onToggleEquity(equity.id)}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div>
                              <div className="font-mono text-sm">{equity.instrumentType}</div>
                              <div className="text-xs text-muted-foreground">{equity.exchange}</div>
                            </div>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => onToggleEquity(equity.id)}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedEquities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedEquities.map((id) => {
                const equity = equities.find((item) => item.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                  >
                    {equity ? equity.instrumentType : id}
                    <button
                      type="button"
                      onClick={() => onToggleEquity(id)}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>FUT Symbols</span>
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={!selectedEquities.length || isLoadingSymbols}
              >
                {isLoadingSymbols ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading FUT symbols...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    {selectedSymbols.length
                      ? `${selectedSymbols.length} selected`
                      : "Select FUT symbols"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0">
              <Command>
                <CommandInput placeholder="Search FUT symbol" />
                <CommandList className="max-h-[420px] overflow-auto">
                  <CommandEmpty>
                    {isLoadingSymbols
                      ? "Loading symbols..."
                      : "No FUT symbols for selected equities."}
                  </CommandEmpty>
                  <CommandGroup heading="FUT">
                    {futSymbols.map((symbol) => {
                      const id = symbol.upstoxId || symbol.symbol;
                      const isChecked = selectedSymbols.includes(id);
                      return (
                        <CommandItem
                          key={`${symbol.id}-fut`}
                          value={id}
                          className="cursor-pointer"
                          onSelect={() => onToggleSymbol(id)}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div>
                              <div className="font-mono text-sm">{symbol.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {renderMeta(symbol)}
                              </div>
                            </div>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => onToggleSymbol(id)}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
                    {futEmpty && !isLoadingSymbols && (
                      <div className="p-3 text-xs text-muted-foreground">
                        Not available for selected instruments.
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>OPT Symbols</span>
            <span className="font-medium text-foreground">
              {selectedSymbols.length} / {maxSelections}
            </span>
          </div>
          <Popover open={isOptPopoverOpen} onOpenChange={setIsOptPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={!selectedEquities.length || isLoadingSymbols}
              >
                {isLoadingSymbols ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading OPT symbols...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    {selectedSymbols.length
                      ? `${selectedSymbols.length} selected`
                      : "Select OPT symbols"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0">
              <Command>
                <CommandInput placeholder="Search OPT symbol" />
                <CommandList className="max-h-[420px] overflow-auto">
                  <CommandEmpty>
                    {isLoadingSymbols
                      ? "Loading symbols..."
                      : "No OPT symbols for selected equities."}
                  </CommandEmpty>
                  <CommandGroup heading="OPT">
                    {optSymbols.map((symbol) => {
                      const id = symbol.upstoxId || symbol.symbol;
                      const isChecked = selectedSymbols.includes(id);
                      return (
                        <CommandItem
                          key={`${symbol.id}-opt`}
                          value={id}
                          className="cursor-pointer"
                          onSelect={() => onToggleSymbol(id)}
                        >
                          <div className="flex w-full items-center justify-between">
                            <div>
                              <div className="font-mono text-sm">{symbol.symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                {renderMeta(symbol)}
                              </div>
                            </div>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => onToggleSymbol(id)}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
                    {optEmpty && !isLoadingSymbols && (
                      <div className="p-3 text-xs text-muted-foreground">
                        Not available for selected instruments.
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Live selection supports up to {maxSelections} symbols.</span>
            {selectedSymbols.length > 0 && (
              <button
                type="button"
                onClick={onClearSymbols}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <XCircle className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          {selectionError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              <span>{selectionError}</span>
            </div>
          )}
        </div>
      </div>

      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSymbols.map((id) => {
            const deriv = symbolOptions.find((s) => (s.upstoxId || s.symbol) === id);
            const equity = equities.find((e) => (e.upstoxId || e.instrumentType) === id);
            const displayName = deriv?.symbol || equity?.instrumentType || id;

            return (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {displayName}
                <button
                  type="button"
                  onClick={() => onToggleSymbol(id)}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
