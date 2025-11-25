import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface GapAlertEvent {
  instrumentId: number;
  instrumentName: string;
  alertType: "gap_1" | "gap_2";
  timeSlot: string;
  currentValue: number;
  baselineValue: number | null;
  deviationPercent: number;
  baselineDate?: string | Date | null;
  triggeredAt: string;
}

export interface GapAlertItem extends GapAlertEvent {
  id: string;
  read?: boolean;
  receivedAt?: string;
}

interface UseGapAlertsOptions {
  url?: string;
  maxVisible?: number;
  autoDismissMs?: number;
}

const DEFAULT_AUTO_DISMISS_MS = 30000;
const DEFAULT_MAX_VISIBLE = 5;
const HISTORY_STORAGE_KEY = "gap-alert-history";
const HISTORY_LIMIT = 50;

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useGapAlerts(
  options: UseGapAlertsOptions = {}
): {
  alerts: GapAlertItem[];
  history: GapAlertItem[];
  unreadCount: number;
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;
} {
  const {
    url = import.meta.env.VITE_API_BASE_URL,
    maxVisible = DEFAULT_MAX_VISIBLE,
    autoDismissMs = DEFAULT_AUTO_DISMISS_MS,
  } = options;

  const [alerts, setAlerts] = useState<GapAlertItem[]>([]);
  const [history, setHistory] = useState<GapAlertItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, HISTORY_LIMIT);
    } catch (error) {
      console.error("Failed to parse stored notifications", error);
      return [];
    }
  });
  const socketRef = useRef<Socket | null>(null);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateHistory = useCallback(
    (
      updater:
        | GapAlertItem[]
        | ((prev: GapAlertItem[]) => GapAlertItem[])
    ) => {
      setHistory((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: GapAlertItem[]) => GapAlertItem[])(prev)
            : updater;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              HISTORY_STORAGE_KEY,
              JSON.stringify(next.slice(0, HISTORY_LIMIT))
            );
          } catch (error) {
            console.error("Failed to store notifications", error);
          }
        }
        return next;
      });
    },
    []
  );

  const markAlertRead = useCallback((id: string) => {
    updateHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  }, [updateHistory]);

  const markAllRead = useCallback(() => {
    updateHistory((prev) => prev.map((item) => ({ ...item, read: true })));
  }, [updateHistory]);

  const clearHistory = useCallback(() => {
    updateHistory([]);
  }, [updateHistory]);

  const dismissAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      markAlertRead(id);
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    },
    [markAlertRead]
  );

  useEffect(() => {
    const socket = io(url, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("gap-alert", (payload: GapAlertEvent) => {
      const alertItem: GapAlertItem = {
        id: makeId(),
        ...payload,
        read: false,
        receivedAt: new Date().toISOString(),
      };

      setAlerts((prev) => {
        const next: GapAlertItem[] = [alertItem, ...prev].slice(
          0,
          maxVisible
        );

        // schedule auto-dismiss for the newest alert
        const newest = next[0];
        if (newest && autoDismissMs > 0) {
          const timer = setTimeout(() => dismissAlert(newest.id), autoDismissMs);
          timersRef.current.set(newest.id, timer);
        }

        return next;
      });

      updateHistory((prev) =>
        [alertItem, ...prev].slice(0, HISTORY_LIMIT)
      );
    });

    return () => {
      socket.off("gap-alert");
      socket.disconnect();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [url, maxVisible, autoDismissMs, dismissAlert, updateHistory]);

  const unreadCount = useMemo(
    () => history.filter((item) => !item.read).length,
    [history]
  );

  return {
    alerts,
    history,
    unreadCount,
    dismissAlert,
    markAlertRead,
    markAllRead,
    clearHistory,
  };
}
