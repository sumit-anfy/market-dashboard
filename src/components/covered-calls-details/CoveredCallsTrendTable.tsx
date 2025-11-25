import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SortableTableHeader } from "@/components/modal/SortableTableHeader";
import { CoveredCallsTrendRow } from "@/types/market";

interface CoveredCallsTrendTableProps {
    trendLoading: boolean;
    trendError: string | null;
    sortedTrendData: CoveredCallsTrendRow[];
    trendType: "daily" | "hourly";
    trendSortConfig: any;
    handleTrendSortColumn: (key: any) => void;
    getTrendRowColor: (dateStr: string) => string;
    trendPagination: any;
    trendPage: number;
    handleTrendPreviousPage: () => void;
    handleTrendNextPage: () => void;
    handleTrendPageClick: (page: number) => void;
    getTrendPageNumbers: () => (number | string)[];
}

export function CoveredCallsTrendTable({
    trendLoading,
    trendError,
    sortedTrendData,
    trendType,
    trendSortConfig,
    handleTrendSortColumn,
    getTrendRowColor,
    trendPagination,
    trendPage,
    handleTrendPreviousPage,
    handleTrendNextPage,
    handleTrendPageClick,
    getTrendPageNumbers,
}: CoveredCallsTrendTableProps) {
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
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableTableHeader
                                sortKey="underlying"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Underlying
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="time"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Time
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="underlying_price"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Price
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="strike"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Strike
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="expiry_month"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Expiry Month
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="option_type"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Type
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="premium"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Premium
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="volume"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Volume
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="otm"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                OTM (%)
                            </SortableTableHeader>
                            <SortableTableHeader
                                sortKey="premium_percentage"
                                sortConfig={trendSortConfig}
                                onSort={handleTrendSortColumn}
                                align="center"
                            >
                                Premium %
                            </SortableTableHeader>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trendLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : trendError ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-red-600">
                                    Error: {trendError}
                                </TableCell>
                            </TableRow>
                        ) : sortedTrendData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center">
                                    No trend data available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedTrendData.map((row, idx) => (
                                <TableRow
                                    key={`${row.underlying}-${row.time}-${idx}`}
                                    className={getTrendRowColor(row.time)}
                                >
                                    <TableCell className="text-center">
                                        {row.underlying}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {trendType !== "daily"
                                            ? formatDateOnly(row.time) +
                                            " " +
                                            row.time.split(" ")[1] +
                                            " " +
                                            row.time.split(" ")[2]
                                            : formatDateOnly(row.time)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.underlying_price)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.strike, 2)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {row.expiry_month}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={
                                                row.option_type === "CE" ? "default" : "secondary"
                                            }
                                        >
                                            {row.option_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.premium)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.volume, 0)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.otm)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {formatNumber(row.premium_percentage)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Trend Pagination */}
            {trendPagination && trendPagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {(trendPage - 1) * trendPagination.limit + 1} to{" "}
                        {Math.min(
                            trendPage * trendPagination.limit,
                            trendPagination.total
                        )}{" "}
                        of {trendPagination.total} rows
                    </p>

                    <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTrendPreviousPage}
                            disabled={trendPage === 1 || trendLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {getTrendPageNumbers().map((pageNum, idx) =>
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
                                        variant={trendPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleTrendPageClick(pageNum as number)}
                                        disabled={trendLoading}
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
                            onClick={handleTrendNextPage}
                            disabled={!trendPagination.hasMore || trendLoading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Pagination Info (when only 1 page) */}
            {trendPagination && trendPagination.totalPages === 1 && (
                <div className="flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Showing all {trendPagination.total} rows
                    </p>
                </div>
            )}
        </>
    );
}
