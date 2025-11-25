import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, RefreshCw } from "lucide-react";
import { SortableTableHeader } from "@/components/modal/SortableTableHeader";

interface CoveredCallsLiveTableProps {
    historicalMode: boolean;
    historicalLastDate: string | null;
    isMarketOpen: boolean;
    lastSeen: { symbol: string; ts?: string }[];
    error: string | null;
    isConnected: boolean;
    isReloadingFallback: boolean;
    onReload: () => void;
    selectedExpiry?: string;
    setSelectedExpiry: (value: string) => void;
    expiryDates: string[];
    orderedGroups: any[];
    snapshots: any;
    highlighted: Record<string, number>;
    underlyingPrice?: number;
    totals: {
        ceVolume: number;
        ceOi: number;
        peVolume: number;
        peOi: number;
    };
    sortConfig: any;
    handleSortColumn: (key: any) => void;
}

export function CoveredCallsLiveTable({
    historicalMode,
    historicalLastDate,
    isMarketOpen,
    lastSeen,
    error,
    isConnected,
    isReloadingFallback,
    onReload,
    selectedExpiry,
    setSelectedExpiry,
    expiryDates,
    orderedGroups,
    snapshots,
    highlighted,
    underlyingPrice,
    totals,
    sortConfig,
    handleSortColumn,
}: CoveredCallsLiveTableProps) {
    const formatDateOnly = (ts?: string) =>
        ts
            ? new Date(ts).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            })
            : "-";

    const formatNumber = (num: number | undefined, decimals = 2) => {
        return num !== null && num !== undefined && !Number.isNaN(num)
            ? Number(num).toFixed(decimals)
            : "-";
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`px-2 py-1 rounded text-xs font-medium ${historicalMode
                                    ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300"
                                }`}
                        >
                            {historicalMode ? "HISTORICAL DATA" : "LIVE DATA"}
                        </div>
                        {historicalMode && historicalLastDate && (
                            <div className="text-xs text-muted-foreground">
                                Last updated on:{" "}
                                {new Date(historicalLastDate).toLocaleDateString("en-GB")}
                            </div>
                        )}
                    </div>
                </CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span
                            className={`h-2 w-2 rounded-full ${isMarketOpen ? "bg-green-500" : "bg-gray-400"
                                }`}
                        />
                        <span className="text-sm">
                            Market: {isMarketOpen ? "Open" : "Closed"}
                        </span>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Info className="h-4 w-4 mr-2" /> Details
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <div className="space-y-1">
                                    <div className="font-medium mb-1">Last live timestamps</div>
                                    {lastSeen.length === 0 ? (
                                        <div className="text-xs">No symbols</div>
                                    ) : (
                                        lastSeen.slice(0, 10).map((it) => (
                                            <div key={it.symbol} className="text-xs">
                                                {it.symbol}:{" "}
                                                {it.ts ? new Date(it.ts).toLocaleTimeString() : "-"}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {error && (
                        <span className="text-xs text-red-600 truncate max-w-[320px]">
                            {error}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {historicalMode && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onReload}
                            disabled={isReloadingFallback}
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${isReloadingFallback ? "animate-spin" : ""
                                    }`}
                            />
                            Reload
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground">Expiry</span>
                    <Select
                        value={selectedExpiry ?? ""}
                        onValueChange={(value) => setSelectedExpiry(value)}
                        disabled={!expiryDates || expiryDates.length === 0}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Select expiry" />
                        </SelectTrigger>
                        <SelectContent>
                            {expiryDates?.map((date) => (
                                <SelectItem key={date} value={date}>
                                    {formatDateOnly(date)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {orderedGroups.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                        No strikes available.
                    </div>
                ) : (
                    <div className="overflow-auto max-h-[70vh]">
                        <TooltipProvider>
                            <Table>
                                <TableHeader className="sticky top-0 z-20 bg-background">
                                    <TableRow>
                                        <TableHead className="text-center border-b" colSpan={8}>
                                            CALLS
                                        </TableHead>
                                        <TableHead
                                            className="text-center border-b"
                                            colSpan={1}
                                        ></TableHead>
                                        <TableHead className="text-center border-b" colSpan={8}>
                                            PUTS
                                        </TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <SortableTableHeader
                                            sortKey="ce_date"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            Date
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_oi"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            OI
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_volume"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            Volume
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_ltp"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            LTP
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_bidQty"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            BidQTY
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_bid"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            BID
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_ask"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            ASK
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="ce_askQty"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            ASKQTY
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="strike"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            Strike
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_askQty"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            AskQty
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_ask"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            ASK
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_bid"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            BID
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_bidQty"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            BidQty
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_ltp"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            LTP
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_volume"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            Volume
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_oi"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            OI
                                        </SortableTableHeader>
                                        <SortableTableHeader
                                            sortKey="pe_date"
                                            sortConfig={sortConfig}
                                            onSort={handleSortColumn}
                                            align="center"
                                        >
                                            Date
                                        </SortableTableHeader>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderedGroups.map((group) => {
                                        const ce = snapshots[group.strike]?.ce;
                                        const pe = snapshots[group.strike]?.pe;
                                        const ceUpdated = group.ce?.symbol
                                            ? !!highlighted[group.ce.symbol]
                                            : false;
                                        const peUpdated = group.pe?.symbol
                                            ? !!highlighted[group.pe.symbol]
                                            : false;
                                        const shadeCE =
                                            underlyingPrice !== undefined &&
                                            group.strike <= underlyingPrice;
                                        const shadePE =
                                            underlyingPrice !== undefined &&
                                            group.strike >= underlyingPrice;

                                        return (
                                            <TableRow key={group.strike}>
                                                {/* CE side */}
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatDateOnly(ce?.timestamp)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.oi, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.volume, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.ltp)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.bidQty, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.bid)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.ask)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${ceUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadeCE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(ce?.askQty, 0)}
                                                </TableCell>
                                                {/* Strike */}
                                                <TableCell className="text-center font-semibold  bg-background z-10">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="px-4 inline-block">
                                                                <div>{formatNumber(group.strike, 2)}</div>
                                                                <div className="mt-1"></div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="space-y-1">
                                                                <div className="text-xs">
                                                                    Symbol: {ce?.symbol || "-"}
                                                                </div>
                                                                <div className="text-xs">
                                                                    Symbol: {pe?.symbol || "-"}
                                                                </div>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                {/* PE side (mirrored) */}
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.askQty, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.ask)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.bid)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.bidQty, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.ltp)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.volume, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatNumber(pe?.oi, 0)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-center ${peUpdated
                                                            ? "bg-amber-50 dark:bg-amber-950/20 transition-colors"
                                                            : ""
                                                        } ${shadePE ? "bg-gray-100 dark:bg-gray-900/30" : ""}`}
                                                >
                                                    {formatDateOnly(pe?.timestamp)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {/* Totals row */}
                                    <TableRow>
                                        {/* CE side totals: OI, Volume, others as '-' */}
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {formatNumber(totals.ceOi, 0)}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {formatNumber(totals.ceVolume, 0)}
                                        </TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        {/* Strike label */}
                                        <TableCell className="text-center font-semibold">
                                            Total
                                        </TableCell>
                                        {/* PE side totals: ..., Volume, OI */}
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {formatNumber(totals.peVolume, 0)}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {formatNumber(totals.peOi, 0)}
                                        </TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
