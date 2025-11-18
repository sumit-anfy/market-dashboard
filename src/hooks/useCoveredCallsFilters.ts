import { useState, useEffect } from "react";
import { apiClient } from "../config/axiosClient";
import { config } from "../config/api";
import {
  CoveredCallsSymbolsExpiryResponse,
  CoveredCallsSymbolExpiry,
} from "../types/market";

interface UseCoveredCallsFiltersParams {
  instrumentId: string;
}

export const useCoveredCallsFilters = ({
  instrumentId,
}: UseCoveredCallsFiltersParams) => {
  const [symbolExpiries, setSymbolExpiries] = useState<
    CoveredCallsSymbolExpiry[]
  >([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [strikes, setStrikes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<CoveredCallsSymbolsExpiryResponse>(
          `${config.apiBaseUrl}/api/covered-calls/${instrumentId}/symbols-expiry`
        );

        if (response.data.success) {
          const rows = response.data.data;
          setSymbolExpiries(rows);

          // Extract unique symbols and expiry dates
          const uniqueSymbols = [
            ...new Set(rows.map((item) => item.symbol)),
          ];
          const uniqueExpiryDates = [
            ...new Set(rows.map((item) => item.expiry_date)),
          ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          const uniqueStrikePrices = [
            ...new Set(rows.map((item) => item.strike)),
          ] as number[];

          setSymbols(uniqueSymbols);
          setExpiryDates(uniqueExpiryDates);
          setStrikes(uniqueStrikePrices.sort((a, b) => a - b));
        } else {
          throw new Error("Failed to fetch filter data");
        }
      } catch (err: any) {
        // Ignore cancelled requests
        if (err?.cancelled) {
          console.log("[useCoveredCallsFilters] Request cancelled, ignoring");
          return;
        }
        const errorMessage = err?.message || "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching covered calls filters:", err);
      } finally {
        setLoading(false);
      }
    };

    if (instrumentId) {
      fetchFiltersData();
    }
  }, [instrumentId]);

  return {
    symbolExpiries,
    symbols,
    expiryDates,
    strikes,
    loading,
    error,
  };
};
