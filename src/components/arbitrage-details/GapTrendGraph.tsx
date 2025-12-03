import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface GapTrendGraphProps {
    data: any[];
    timeRange: "day" | "hour";
}

// Helper to calculate SMA
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

        // Need at least 5 valid values for a meaningful average
        if (validValues.length < 5) {
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

// Helper to calculate Bollinger Bands
const calculateBollingerBands = (data: any[], period: number, stdDevMultiplier: number, key: string) => {
    return data.map((item, index, arr) => {
        if (index < period - 1) return { ...item, [`${key}_upper`]: null, [`${key}_lower`]: null, [`${key}_mid`]: null };

        const slice = arr.slice(index - period + 1, index + 1);
        // Filter out null values and convert to numbers
        const validValues = slice
            .map(i => i[key])
            .filter(v => v !== null && v !== undefined)
            .map(v => Number(v))
            .filter(v => !isNaN(v) && isFinite(v));

        // Need at least 5 valid values for a meaningful calculation
        if (validValues.length < 5) {
            return { ...item, [`${key}_upper`]: null, [`${key}_lower`]: null, [`${key}_mid`]: null };
        }

        const sum = validValues.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / validValues.length;

        const squaredDiffs = validValues.map(val => Math.pow(val - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / validValues.length;
        const stdDev = Math.sqrt(avgSquaredDiff);

        const upper = avg + (stdDev * stdDevMultiplier);
        const lower = avg - (stdDev * stdDevMultiplier);

        // Ensure results are valid numbers
        if (!isFinite(avg) || !isFinite(upper) || !isFinite(lower)) {
            return { ...item, [`${key}_upper`]: null, [`${key}_lower`]: null, [`${key}_mid`]: null };
        }

        return {
            ...item,
            [`${key}_mid`]: avg,
            [`${key}_upper`]: upper,
            [`${key}_lower`]: lower
        };
    });
};

export function GapTrendGraph({ data, timeRange }: GapTrendGraphProps) {
    const [showSMA, setShowSMA] = useState(false);
    const [showBollinger, setShowBollinger] = useState(false);
    const [gapView, setGapView] = useState<"both" | "gap1" | "gap2">("both");

    // Format data for the chart
    const processedData = useMemo(() => {
        let chartData = data
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
                    isValid1 = t1 !== 0 && t2 !== 0 && diff1 <= 30000;
                    isValid2 = t2 !== 0 && t3 !== 0 && diff2 <= 30000;
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

        console.log('Chart data before indicators:', chartData.length, 'points');
        console.log('Sample data:', chartData.slice(0, 3));

        // Calculate Indicators
        // We calculate them sequentially to accumulate properties
        chartData = calculateSMA(chartData, 20, 'gap1');
        chartData = calculateSMA(chartData, 20, 'gap2');
        chartData = calculateBollingerBands(chartData, 20, 2, 'gap1');
        chartData = calculateBollingerBands(chartData, 20, 2, 'gap2');

        console.log('Chart data after indicators:', chartData.length, 'points');
        console.log('Sample with indicators:', chartData.slice(Math.max(0, chartData.length - 3)));

        return chartData;
    }, [data, timeRange]);

    if (processedData.length === 0) {
        return null;
    }

    // Calculate min and max gap values for Y-axis based on selected view
    const gapValues = processedData.flatMap(item => {
        const values: (number | null)[] = [];

        // Add gap values based on view selection
        if (gapView === "both" || gapView === "gap1") {
            values.push(item.gap1);
            if (showSMA) values.push(item.gap1_sma);
            if (showBollinger) values.push(item.gap1_upper, item.gap1_lower, item.gap1_mid);
        }

        if (gapView === "both" || gapView === "gap2") {
            values.push(item.gap2);
            if (showSMA) values.push(item.gap2_sma);
            if (showBollinger) values.push(item.gap2_upper, item.gap2_lower, item.gap2_mid);
        }

        return values;
    }).filter((val): val is number => val !== null && !isNaN(val));

    let yMin = 0;
    let yMax = 100;

    if (gapValues.length > 0) {
        const minGap = Math.min(...gapValues);
        const maxGap = Math.max(...gapValues);
        const range = maxGap - minGap;
        const padding = range * 0.1 || 10;

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
                            <Label htmlFor="sma-mode">SMA (20)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="bb-mode" checked={showBollinger} onCheckedChange={setShowBollinger} />
                            <Label htmlFor="bb-mode">Bollinger Bands</Label>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Label className="text-sm text-muted-foreground">View:</Label>
                    <div className="flex items-center border rounded-md">
                        <button
                            onClick={() => setGapView("both")}
                            className={`px-3 py-1 text-sm font-medium transition-colors ${
                                gapView === "both"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent hover:bg-muted"
                            } rounded-l-md`}
                        >
                            Both
                        </button>
                        <button
                            onClick={() => setGapView("gap1")}
                            className={`px-3 py-1 text-sm font-medium transition-colors border-l ${
                                gapView === "gap1"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent hover:bg-muted"
                            }`}
                        >
                            Gap 1
                        </button>
                        <button
                            onClick={() => setGapView("gap2")}
                            className={`px-3 py-1 text-sm font-medium transition-colors border-l ${
                                gapView === "gap2"
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

                            {/* Bollinger Bands Areas - Gap 1 */}
                            {showBollinger && (gapView === "both" || gapView === "gap1") && (
                                <>
                                    {/* Gap 1 Bollinger Bands */}
                                    <Area
                                        type="monotone"
                                        dataKey="gap1_upper"
                                        stroke="#93c5fd"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        fill="#2563eb"
                                        fillOpacity={0.15}
                                        connectNulls
                                        name="BB Upper Gap 1"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="gap1_lower"
                                        stroke="#93c5fd"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        fill="#2563eb"
                                        fillOpacity={0.15}
                                        connectNulls
                                        name="BB Lower Gap 1"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="gap1_mid"
                                        name="BB Mid Gap 1"
                                        stroke="#2563eb"
                                        strokeDasharray="5 5"
                                        dot={false}
                                        strokeWidth={1}
                                        strokeOpacity={0.5}
                                        connectNulls
                                    />
                                </>
                            )}

                            {showBollinger && (gapView === "both" || gapView === "gap2") && (
                                <>
                                    {/* Gap 2 Bollinger Bands */}
                                    <Area
                                        type="monotone"
                                        dataKey="gap2_upper"
                                        stroke="#86efac"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        fill="#16a34a"
                                        fillOpacity={0.15}
                                        connectNulls
                                        name="BB Upper Gap 2"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="gap2_lower"
                                        stroke="#86efac"
                                        strokeWidth={1}
                                        strokeDasharray="3 3"
                                        fill="#16a34a"
                                        fillOpacity={0.15}
                                        connectNulls
                                        name="BB Lower Gap 2"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="gap2_mid"
                                        name="BB Mid Gap 2"
                                        stroke="#16a34a"
                                        strokeDasharray="5 5"
                                        dot={false}
                                        strokeWidth={1}
                                        strokeOpacity={0.5}
                                        connectNulls
                                    />
                                </>
                            )}

                            {/* SMA Lines */}
                            {showSMA && (gapView === "both" || gapView === "gap1") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap1_sma"
                                    name="SMA Gap 1"
                                    stroke="#93c5fd"
                                    strokeDasharray="5 5"
                                    dot={false}
                                    strokeWidth={2}
                                    connectNulls
                                />
                            )}

                            {showSMA && (gapView === "both" || gapView === "gap2") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap2_sma"
                                    name="SMA Gap 2"
                                    stroke="#86efac"
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
                                    name="Gap 1 (Next-Near)"
                                    stroke="#2563eb" // Blue
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                    connectNulls
                                />
                            )}

                            {(gapView === "both" || gapView === "gap2") && (
                                <Line
                                    type="monotone"
                                    dataKey="gap2"
                                    name="Gap 2 (Far-Next)"
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
