import { useState, useMemo } from "react";
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GapTrendGraphProps {
    data: any[];
    timeRange: "day" | "hour";
}

interface ChartDataPoint {
    time: string;
    gap1: number | null;
    gap2: number | null;
    fullDate: any;
    gap1_sma?: number | null;
    gap2_sma?: number | null;
}

// Helper to calculate SMA (Rolling Average)
const calculateSMA = (data: any[], period: number, key: string) => {
    return data.map((item, index, arr) => {
        if (index < period - 1) return { ...item, [`${key}_sma`]: null };

        const slice = arr.slice(index - period + 1, index + 1);
        // Filter out null values and convert to numbers
        const validValues = slice
            .map(i => i[key])
            .filter(v => v !== null && v !== undefined)
            .map(v => Number(v))
            .filter(v => !isNaN(v) && isFinite(v));

        // Need at least 30% of the period with valid values (minimum 3)
        const minRequired = Math.max(3, Math.floor(period * 0.3));
        if (validValues.length < minRequired) {
            return { ...item, [`${key}_sma`]: null };
        }

        const sum = validValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / validValues.length;

        // Ensure result is a valid number
        if (!isFinite(avg)) {
            return { ...item, [`${key}_sma`]: null };
        }

        return { ...item, [`${key}_sma`]: avg };
    });
};

export function GapTrendGraph({ data, timeRange }: GapTrendGraphProps) {
    const [showSMA, setShowSMA] = useState(false);
    const [gapView, setGapView] = useState<"both" | "gap1" | "gap2">("both");
    const [smaPeriod, setSmaPeriod] = useState(20);

    // Format data for the chart
    const processedData = useMemo<ChartDataPoint[]>(() => {
        let chartData: ChartDataPoint[] = data
            .filter((row) => row.gap_1 !== null || row.gap_2 !== null)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((row) => {
                const datePart = row.date.split(' ')[0];
                const t1 = row.time_1 ? new Date(`${datePart} ${row.time_1}`).getTime() : 0;
                const t2 = row.time_2 ? new Date(`${datePart} ${row.time_2}`).getTime() : 0;
                const t3 = row.time_3 ? new Date(`${datePart} ${row.time_3}`).getTime() : 0;

                const diff1 = Math.abs(t2 - t1);
                const diff2 = Math.abs(t3 - t2);

                let isValid1 = true;
                let isValid2 = true;

                if (timeRange === "hour") {
                    isValid1 = t1 !== 0 && t2 !== 0 && diff1 <= 15000;
                    isValid2 = t2 !== 0 && t3 !== 0 && diff2 <= 15000;
                }

                return {
                    time: new Date(row.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    gap1: isValid1 && row.gap_1 !== null ? Number(row.gap_1) : null,
                    gap2: isValid2 && row.gap_2 !== null ? Number(row.gap_2) : null,
                    fullDate: row.date,
                };
            });

        if (chartData.length === 0) {
            return [];
        }

        // Calculate Indicators
        chartData = calculateSMA(chartData, smaPeriod, 'gap1') as ChartDataPoint[];
        chartData = calculateSMA(chartData, smaPeriod, 'gap2') as ChartDataPoint[];

        return chartData;
    }, [data, timeRange, smaPeriod]);

    if (processedData.length === 0) {
        return null;
    }

    // Calculate min and max gap values for Y-axis based on selected view
    const gapValues = processedData.flatMap(item => {
        const values: (number | null)[] = [];

        // Add gap values based on view selection
        if (gapView === "both" || gapView === "gap1") {
            values.push(item.gap1);
            if (showSMA) values.push(item.gap1_sma ?? null);
        }

        if (gapView === "both" || gapView === "gap2") {
            values.push(item.gap2);
            if (showSMA) values.push(item.gap2_sma ?? null);
        }

        return values;
    }).filter((val): val is number => val !== null && !isNaN(val));

    let yMin = 0;
    let yMax = 100;

    if (gapValues.length > 0) {
        const minGap = Math.min(...gapValues);
        const maxGap = Math.max(...gapValues);
        const range = maxGap - minGap;
        const padding = range * 0.1 || 10; // 10% padding or default 10

        yMin = Number((minGap - padding).toFixed(1));
        yMax = Number((maxGap + padding).toFixed(1));
    }

    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-col space-y-3 pb-2">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium">Gap Trend Analysis</CardTitle>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="sma-mode" checked={showSMA} onCheckedChange={setShowSMA} />
                            <Label htmlFor="sma-mode">Rolling Avg</Label>
                            {showSMA && (
                                <select
                                    value={smaPeriod}
                                    onChange={(e) => setSmaPeriod(Number(e.target.value))}
                                    className="ml-1 px-2 py-0.5 text-xs border rounded bg-background"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                    <option value={30}>30</option>
                                    <option value={50}>50</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Label className="text-sm text-muted-foreground">View:</Label>
                    <div className="flex items-center border rounded-md">
                        <button
                            onClick={() => setGapView("both")}
                            className={`px-3 py-1 text-sm font-medium transition-colors ${gapView === "both"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent hover:bg-muted"
                                } rounded-l-md`}
                        >
                            Both
                        </button>
                        <button
                            onClick={() => setGapView("gap1")}
                            className={`px-3 py-1 text-sm font-medium transition-colors border-l ${gapView === "gap1"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent hover:bg-muted"
                                }`}
                        >
                            Gap 1
                        </button>
                        <button
                            onClick={() => setGapView("gap2")}
                            className={`px-3 py-1 text-sm font-medium transition-colors border-l ${gapView === "gap2"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent hover:bg-muted"
                                } rounded-r-md`}
                        >
                            Gap 2
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={processedData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="fullDate"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                                tickFormatter={(value) => {
                                    // Value is full date string
                                    try {
                                        const date = new Date(value);
                                        if (timeRange === "day") {
                                            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                        }
                                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    } catch (e) {
                                        return value;
                                    }
                                }}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[yMin, yMax]}
                                tickFormatter={(value) => {
                                    if (typeof value === 'number') return value.toFixed(1);
                                    return String(value);
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                                formatter={(value: number | string, name: string) => {
                                    if (typeof value === 'number') return [value.toFixed(2), name];
                                    return [value, name];
                                }}
                                labelFormatter={(label) => `${label}`}
                            />
                            <Legend />

                            {showSMA && (gapView === "both" || gapView === "gap1") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap1_sma"
                                    name={`RA Gap 1`}
                                    stroke="#570000ff"
                                    strokeDasharray="5 5"
                                    dot={false}
                                    strokeWidth={2}
                                    connectNulls
                                />
                            )}

                            {/* Main Gap Lines */}
                            {(gapView === "both" || gapView === "gap1") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap1"
                                    name="Gap 1"
                                    stroke="#2563eb" // Blue
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}

                            {showSMA && (gapView === "both" || gapView === "gap2") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap2_sma"
                                    name={`RA Gap 2`}
                                    stroke="#ff0000ff"
                                    strokeDasharray="5 5"
                                    dot={false}
                                    strokeWidth={2}
                                    connectNulls
                                />
                            )}

                            {/* Main Gap Lines */}
                            {(gapView === "both" || gapView === "gap2") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap2"
                                    name="Gap 2"
                                    stroke="#16a34a" // Green
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
