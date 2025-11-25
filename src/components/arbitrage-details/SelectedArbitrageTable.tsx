import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationState {
    instrumentid: number;
    name: string;
    date: string;
    symbol_1: string;
    price_1: number;
    symbol_2: string;
    price_2: number;
    symbol_3: string;
    price_3: number;
    gap_1: number;
    gap_2: number;
}

interface SelectedArbitrageTableProps {
    data: LocationState;
}

export function SelectedArbitrageTable({ data }: SelectedArbitrageTableProps) {
    const formatDateOnly = (ts?: string) =>
        ts
            ? new Date(ts).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            })
            : "-";

    const formatDateTime = (ts?: string) => {
        if (!ts) return "-";
        const parts = ts.split(" ");
        return `${formatDateOnly(ts)} ${parts[1] || ""} ${parts[2] || ""}`;
    };

    const formatNumber = (num: number, decimals = 2) => {
        return num !== null ? Number(num).toFixed(decimals) : "-";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Selected Arbitrage Data</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Date</TableHead>
                                <TableHead className="text-center">Near Future Symbol</TableHead>
                                <TableHead className="text-center">Price</TableHead>
                                <TableHead className="text-center">Next Future Symbol</TableHead>
                                <TableHead className="text-center">Price</TableHead>
                                <TableHead className="text-center">Far Future Symbol</TableHead>
                                <TableHead className="text-center">Price</TableHead>
                                <TableHead className="text-center">Gap (Near & Next)</TableHead>
                                <TableHead className="text-center">Gap (Next & Far)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="text-center">{data.name}</TableCell>
                                <TableCell className="text-center">
                                    {formatDateTime(data.date)}
                                </TableCell>
                                <TableCell className="text-center">{data.symbol_1}</TableCell>
                                <TableCell className="text-center">
                                    {formatNumber(data.price_1)}
                                </TableCell>
                                <TableCell className="text-center">{data.symbol_2}</TableCell>
                                <TableCell className="text-center">
                                    {formatNumber(data.price_2)}
                                </TableCell>
                                <TableCell className="text-center">{data.symbol_3}</TableCell>
                                <TableCell className="text-center">
                                    {formatNumber(data.price_3)}
                                </TableCell>
                                <TableCell
                                    className={
                                        data.gap_1 > 0
                                            ? "text-green-600 text-center"
                                            : "text-red-600 text-center"
                                    }
                                >
                                    {formatNumber(data.gap_1)}
                                </TableCell>
                                <TableCell
                                    className={
                                        data.gap_2 > 0
                                            ? "text-green-600 text-center"
                                            : "text-red-600 text-center"
                                    }
                                >
                                    {formatNumber(data.gap_2)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
