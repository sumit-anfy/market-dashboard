import { useState, useEffect } from "react";
import { apiClient } from "@/config/axiosClient";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface ArbitrageHistoryRow {
    date: string;
    avgGap1: number | null;
    avgGap2: number | null;
    minGap1: number | null;
    maxGap1: number | null;
    minGap2: number | null;
    maxGap2: number | null;
    volume: number;
}

interface Instrument {
    instrumentId: number;
    underlyingSymbol: string;
}

export default function ArbitrageHistoryPage() {
    const [instruments, setInstruments] = useState<Instrument[]>([]);
    const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>("");
    const [historyData, setHistoryData] = useState<ArbitrageHistoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingInstruments, setLoadingInstruments] = useState(true);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    // Fetch list of instruments on mount
    useEffect(() => {
        const fetchInstruments = async () => {
            try {
                setLoadingInstruments(true);
                // Reuse the main arbitrage endpoint to get the list of active instruments
                // Ideally we should have a dedicated /instruments endpoint, but this works
                const response = await apiClient.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/arbitrage`
                );
                if (response.data.success) {
                    // Extract unique instruments
                    const uniqueInstruments = response.data.data.map((item: any) => ({
                        instrumentId: item.instrumentId,
                        underlyingSymbol: item.underlyingSymbol,
                    }));
                    // Deduplicate just in case
                    const unique = uniqueInstruments.filter(
                        (v: Instrument, i: number, a: Instrument[]) =>
                            a.findIndex((t) => t.instrumentId === v.instrumentId) === i
                    );
                    setInstruments(unique);
                    if (unique.length > 0) {
                        setSelectedInstrumentId(unique[0].instrumentId.toString());
                    }
                }
            } catch (error) {
                console.error("Failed to fetch instruments:", error);
            } finally {
                setLoadingInstruments(false);
            }
        };

        fetchInstruments();
    }, []);

    // Fetch history when instrument or dates change
    const fetchHistory = async () => {
        if (!selectedInstrumentId) return;

        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const response = await apiClient.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/arbitrage-details/${selectedInstrumentId}/history?${params.toString()}`
            );

            if (response.data.success) {
                setHistoryData(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedInstrumentId) {
            fetchHistory();
        }
    }, [selectedInstrumentId]); // Auto-fetch on symbol change

    const formatNumber = (num: number | null, decimals = 2) => {
        if (num === null || num === undefined) return "-";
        return num.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Arbitrage History</h2>
                    <p className="text-muted-foreground">
                        View daily average gaps and volumes for specific instruments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchHistory}
                        disabled={loading || !selectedInstrumentId}
                        variant="outline"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Instrument</label>
                            <Select
                                value={selectedInstrumentId}
                                onValueChange={setSelectedInstrumentId}
                                disabled={loadingInstruments}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select instrument" />
                                </SelectTrigger>
                                <SelectContent>
                                    {instruments.map((inst) => (
                                        <SelectItem
                                            key={inst.instrumentId}
                                            value={inst.instrumentId.toString()}
                                        >
                                            {inst.underlyingSymbol}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchHistory} disabled={loading || !selectedInstrumentId}>Apply Filters</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Avg Gap 1 (Next-Near)</TableHead>
                                <TableHead className="text-right">Min Gap 1</TableHead>
                                <TableHead className="text-right">Max Gap 1</TableHead>
                                <TableHead className="text-right">Avg Gap 2 (Far-Next)</TableHead>
                                <TableHead className="text-right">Min Gap 2</TableHead>
                                <TableHead className="text-right">Max Gap 2</TableHead>
                                <TableHead className="text-right">Near Vol</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : historyData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No history data found for this period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                historyData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">
                                            {new Date(row.date).toLocaleDateString("en-GB")}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${row.avgGap1 && row.avgGap1 > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatNumber(row.avgGap1)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground text-xs">
                                            {formatNumber(row.minGap1)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground text-xs">
                                            {formatNumber(row.maxGap1)}
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${row.avgGap2 && row.avgGap2 > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatNumber(row.avgGap2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground text-xs">
                                            {formatNumber(row.minGap2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground text-xs">
                                            {formatNumber(row.maxGap2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {row.volume.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
