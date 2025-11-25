import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

interface ArbitrageHeaderProps {
    name: string;
    date: string;
}

export function ArbitrageHeader({ name, date }: ArbitrageHeaderProps) {
    const navigate = useNavigate();

    const formatDateOnly = (ts?: string) =>
        ts
            ? new Date(ts).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
            })
            : "-";

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/arbitrage")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                        <Badge variant="outline">{formatDateOnly(date)}</Badge>
                    </div>
                </div>
            </div>
            <Separator />
        </>
    );
}
