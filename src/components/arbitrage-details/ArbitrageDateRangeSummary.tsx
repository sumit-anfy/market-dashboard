import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface DateRange {
    min_date: string | null;
    max_date: string | null;
    hourly_min_date: string | null;
    hourly_max_date: string | null;
}

interface ArbitrageDateRangeSummaryProps {
    equityRange: DateRange;
    futuresRange: DateRange;
}

export function ArbitrageDateRangeSummary({
    equityRange,
    futuresRange,
}: ArbitrageDateRangeSummaryProps) {
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

    return (
        <>
            {/* Daily Data range summary */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="grid grid-cols-3 text-center">
                        <CardTitle className="text-base">Equity Date Range (Daily)</CardTitle>
                        <CardTitle>
                            From:{" "}
                            <span className="font-medium text-foreground">
                                {equityRange.min_date && formatDateOnly(equityRange.min_date)}
                            </span>
                        </CardTitle>
                        <CardTitle>
                            Last:{" "}
                            <span className="font-medium text-foreground">
                                {equityRange.max_date && formatDateOnly(equityRange.max_date)}
                            </span>
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="grid grid-cols-3 text-center">
                        <CardTitle className="text-base">Futures Date Range (Daily)</CardTitle>
                        <CardTitle>
                            From:{" "}
                            <span className="font-medium">
                                {futuresRange.min_date && formatDateOnly(futuresRange.min_date)}
                            </span>
                        </CardTitle>
                        <CardTitle>
                            Last:{" "}
                            <span className="font-medium">
                                {futuresRange.max_date && formatDateOnly(futuresRange.max_date)}
                            </span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Hourly Data range summary */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="grid grid-cols-3 text-center">
                        <CardTitle className="text-base">Equity Date Range (Hourly)</CardTitle>
                        <CardTitle>
                            From:{" "}
                            <span className="font-medium">
                                {equityRange.hourly_min_date &&
                                    formatDateTime(equityRange.hourly_min_date)}
                            </span>
                        </CardTitle>
                        <CardTitle>
                            Last:{" "}
                            <span className="font-medium">
                                {equityRange.hourly_max_date &&
                                    formatDateTime(equityRange.hourly_max_date)}
                            </span>
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="grid grid-cols-3 text-center">
                        <CardTitle className="text-base">Futures Date Range (Hourly)</CardTitle>
                        <CardTitle>
                            From:{" "}
                            <span className="font-medium text-foreground">
                                {futuresRange.hourly_min_date &&
                                    formatDateTime(futuresRange.hourly_min_date)}
                            </span>
                        </CardTitle>
                        <CardTitle>
                            Last:{" "}
                            <span className="font-medium text-foreground">
                                {futuresRange.hourly_max_date &&
                                    formatDateTime(futuresRange.hourly_max_date)}
                            </span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </>
    );
}
