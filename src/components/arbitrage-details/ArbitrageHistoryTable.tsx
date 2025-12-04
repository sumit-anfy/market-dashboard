import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SortableTableHeader } from "@/components/modal/SortableTableHeader";

interface ArbitrageHistoryTableProps {
    loading: boolean;
    error: string | null;
    sortedFilteredData: any[];
    timeRange: "day" | "hour";
    sortConfig: any;
    handleSortColumn: (key: string) => void;
    getRowColor: (dateStr: string) => string;
    pagination: any;
    currentPage: number;
    itemsPerPage: number;
    handlePreviousPage: () => void;
    handleNextPage: () => void;
    handlePageClick: (page: number) => void;
    getPageNumbers: () => (number | string)[];
}

export function ArbitrageHistoryTable({
    loading,
    error,
    sortedFilteredData,
    timeRange,
    sortConfig,
    handleSortColumn,
    getRowColor,
    pagination,
    currentPage,
    itemsPerPage,
    handlePreviousPage,
    handleNextPage,
    handlePageClick,
    getPageNumbers,
}: ArbitrageHistoryTableProps) {
    const formatDateOnly = (ts?: string) =>
        ts
            ? new Date(ts).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            })
            : "-";

    const formatNumber = (num: number, decimals = 2) => {
        return num !== null ? Number(num).toFixed(decimals) : "-";
    };

    const getTimeMatchFlags = (row: any) => {
        const t1 = row.time_1 as string | null | undefined;
        const t2 = row.time_2 as string | null | undefined;
        const t3 = row.time_3 as string | null | undefined;

        // Use pre-calculated differences from backend if available
        const diff12 = row.diff_12 !== undefined ? Number(row.diff_12) : null;
        const diff23 = row.diff_23 !== undefined ? Number(row.diff_23) : null;

        const isValid = (t?: string | null) => !!t && t.trim().length > 0;

        // Exact match logic
        const exactMatch1 = isValid(t1) && ((isValid(t2) && t1 === t2) || (isValid(t3) && t1 === t3));
        const exactMatch2 = isValid(t2) && ((isValid(t1) && t2 === t1) || (isValid(t3) && t2 === t3));
        const exactMatch3 = isValid(t3) && ((isValid(t1) && t3 === t1) || (isValid(t2) && t3 === t2));

        // Within 15 seconds logic (Sync)
        const isNearNextSync = diff12 !== null && diff12 <= 15;
        const isNextFarSync = diff23 !== null && diff23 <= 15;

        // Determine final status for each symbol
        // Status: 'exact' (Blue) | 'sync' (Red) | 'none' (Default)

        let status1 = 'none';
        if (exactMatch1) status1 = 'exact';
        else if (isNearNextSync) status1 = 'sync';

        let status2 = 'none';
        if (exactMatch2) status2 = 'exact';
        else if (isNearNextSync || isNextFarSync) status2 = 'sync';

        let status3 = 'none';
        if (exactMatch3) status3 = 'exact';
        else if (isNextFarSync) status3 = 'sync';

        return { status1, status2, status3 };
    };

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableTableHeader
                                sortKey="date"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Date
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="symbol_1"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Near Future Symbol
                            </SortableTableHeader>
                            {timeRange == "hour" && (
                                <SortableTableHeader
                                    sortKey="time_1"
                                    sortConfig={sortConfig}
                                    onSort={handleSortColumn}
                                    align="center"
                                >
                                    Near Future Time
                                </SortableTableHeader>
                            )}
                            <SortableTableHeader
                                sortKey="price_1"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Price
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="symbol_2"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Next Future Symbol
                            </SortableTableHeader>
                            {timeRange == "hour" && (
                                <SortableTableHeader
                                    sortKey="time_2"
                                    sortConfig={sortConfig}
                                    onSort={handleSortColumn}
                                    align="center"
                                >
                                    Next Future Time
                                </SortableTableHeader>
                            )}
                            <SortableTableHeader
                                sortKey="price_2"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Price
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="symbol_3"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Far Future Symbol
                            </SortableTableHeader>
                            {timeRange == "hour" && (
                                <SortableTableHeader
                                    sortKey="time_3"
                                    sortConfig={sortConfig}
                                    onSort={handleSortColumn}
                                    align="center"
                                >
                                    Far Future Time
                                </SortableTableHeader>
                            )}
                            <SortableTableHeader
                                sortKey="price_3"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Price
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="gap_1"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Gap (Near & Next)
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="gap_2"
                                sortConfig={sortConfig}
                                onSort={handleSortColumn}
                                align="center"
                            >
                                Gap (Next & Far)
                            </SortableTableHeader>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-red-600">
                                    Error: {error}
                                </TableCell>
                            </TableRow>
                        ) : sortedFilteredData && sortedFilteredData.length > 0 ? (
                            sortedFilteredData.map((row: any, idx: number) => {
                                const { status1, status2, status3 } =
                                    timeRange === "hour"
                                        ? getTimeMatchFlags(row)
                                        : { status1: 'none', status2: 'none', status3: 'none' };

                                const symbolBaseClass = "text-center font-medium text-red-300";
                                const exactMatchClass = "text-blue-800 font-bold rounded px-2";
                                const syncMatchClass = "font-bold text-black-600";

                                const getSymbolClass = (status: string) => {
                                    if (status === 'exact') return `${symbolBaseClass} ${exactMatchClass}`;
                                    if (status === 'sync') return `${symbolBaseClass} ${syncMatchClass}`;
                                    return symbolBaseClass;
                                };

                                return (
                                    <TableRow key={idx} className={getRowColor(row.date || "-")}>
                                        <TableCell className="text-center text-xs">
                                            {timeRange === "hour"
                                                ? formatDateOnly(row.date) +
                                                " " +
                                                row.date.split(" ")[1] +
                                                " " +
                                                row.date.split(" ")[2]
                                                : formatDateOnly(row.date)}
                                        </TableCell>
                                        <TableCell className={getSymbolClass(status1)}>
                                            {row.symbol_1 || "-"}
                                        </TableCell>
                                        {timeRange == "hour" && (
                                            <TableCell className="text-center">
                                                {row.time_1 || "-"}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-center">
                                            {formatNumber(row.price_1)}
                                        </TableCell>
                                        <TableCell className={getSymbolClass(status2)}>
                                            {row.symbol_2 || "-"}
                                        </TableCell>
                                        {timeRange == "hour" && (
                                            <TableCell className="text-center">
                                                {row.time_2 || "-"}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-center">
                                            {formatNumber(row.price_2)}
                                        </TableCell>
                                        <TableCell className={getSymbolClass(status3)}>
                                            {row.symbol_3 || "-"}
                                        </TableCell>
                                        {timeRange == "hour" && (
                                            <TableCell className="text-center">
                                                {row.time_3 || "-"}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-center">
                                            {formatNumber(row.price_3)}
                                        </TableCell>
                                        <TableCell
                                            className={
                                                row.gap_1 > 0
                                                    ? "text-green-600 text-center font-semibold"
                                                    : "text-red-600 text-center font-semibold"
                                            }
                                        >
                                            {formatNumber(row.gap_1)}
                                        </TableCell>
                                        <TableCell
                                            className={
                                                row.gap_2 > 0
                                                    ? "text-green-600 text-center font-semibold"
                                                    : "text-red-600 text-center font-semibold"
                                            }
                                        >
                                            {formatNumber(row.gap_2)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-center text-muted-foreground"
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                        {pagination.total} rows
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {getPageNumbers().map((pageNum, idx) =>
                                pageNum === "..." ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="px-2 text-muted-foreground"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageClick(pageNum as number)}
                                        disabled={loading}
                                        className="min-w-[40px]"
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            )}
                        </div>

                        {/* Next Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!pagination.hasMore || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Pagination Info (when only 1 page) */}
            {pagination && pagination.totalPages === 1 && (
                <div className="flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Showing all {pagination.total} rows
                    </p>
                </div>
            )}
        </div>
    );
}
