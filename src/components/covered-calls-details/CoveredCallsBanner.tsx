import { Card, CardContent } from "@/components/ui/card";

interface CoveredCallsBannerProps {
    underlyingSymbol?: string;
    underlyingPrice?: number;
}

export function CoveredCallsBanner({
    underlyingSymbol,
    underlyingPrice,
}: CoveredCallsBannerProps) {
    const formatNumber = (num: number | undefined, decimals = 2) => {
        return num !== null && num !== undefined && !Number.isNaN(num)
            ? Number(num).toFixed(decimals)
            : "-";
    };

    return (
        <Card className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <CardContent className="py-3 flex items-center justify-between gap-4">
                {underlyingSymbol && (
                    <div className="flex items-center gap-3 text-sm">
                        <div>Underlying Symbol :</div>
                        <div className="font-medium">{underlyingSymbol}</div>
                    </div>
                )}
                {underlyingSymbol && (
                    <div className="flex items-center gap-3 text-sm">
                        <div>Underlying Price :</div>
                        <div className="px-2 py-0.5 font-mono font-medium tabular-nums">
                            {underlyingPrice !== undefined
                                ? formatNumber(underlyingPrice)
                                : "-"}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
