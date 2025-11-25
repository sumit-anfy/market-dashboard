import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ArbitrageSummaryCardsProps {
    summary: {
        positiveGapCount: number;
        negativeGapCount: number;
    } | null;
}

export function ArbitrageSummaryCards({ summary }: ArbitrageSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Positive Gaps</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {summary?.positiveGapCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total positive gaps from both columns
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Negative Gaps</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {summary?.negativeGapCount || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total negative gaps from both columns
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
