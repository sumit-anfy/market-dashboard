import { AlertTriangle, X } from "lucide-react";
import { useGapAlerts } from "../hooks/useGapAlerts";

export function GapAlertToast() {
  const { alerts, dismissAlert } = useGapAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed right-4 top-24 z-50 flex w-80 flex-col gap-3 sm:right-6 sm:top-24 sm:w-96">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-lg border border-amber-200 bg-white/95 p-3 shadow-lg shadow-amber-200/50 backdrop-blur dark:border-amber-300/40 dark:bg-slate-900/95 dark:shadow-amber-500/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 rounded-full bg-amber-100 p-1 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {alert.instrumentName} · {alert.alertType.toUpperCase()}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Slot {alert.timeSlot} · Δ {alert.deviationPercent.toFixed(2)}%
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-500/10">
              <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-200">
                Current
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {alert.currentValue}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-800">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Baseline
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {alert.baselineValue ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Baseline date:{" "}
              {alert.baselineDate
                ? new Date(alert.baselineDate).toISOString().slice(0, 10)
                : "n/a"}
            </span>
            <span>{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
