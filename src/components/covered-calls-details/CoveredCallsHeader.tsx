import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export function CoveredCallsHeader() {
    const navigate = useNavigate();

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/covered-calls")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Covered Calls - Live Details
                        </h1>
                    </div>
                </div>
            </div>
            <Separator />
        </>
    );
}
