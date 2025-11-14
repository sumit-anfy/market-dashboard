import { useState, useEffect } from "react";
import axios from "axios";
import { config } from "../config/api";
import { CoveredCallsSymbolsExpiryResponse } from "../types/market";

interface UseCoveredCallsFiltersParams {
  instrumentId: string;
}

export const useCoveredCallsFilters = ({
  instrumentId,
}: UseCoveredCallsFiltersParams) => {
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

        const response = await axios.get<CoveredCallsSymbolsExpiryResponse>(
          `${config.apiBaseUrl}/api/covered-calls/${instrumentId}/symbols-expiry`
        );

        if (response.data.success) {
          // Extract unique symbols and expiry dates
          const uniqueSymbols = [
            ...new Set(response.data.data.map((item) => item.symbol)),
          ];
          const uniqueExpiryDates = [
            ...new Set(response.data.data.map((item) => item.expiry_date)),
          ];
          const uniqueStrikePrices = [
            ...new Set(response.data.data.map((item) => item.strike)),
          ] as number[];

          setSymbols(uniqueSymbols);
          setExpiryDates(uniqueExpiryDates);
          setStrikes(uniqueStrikePrices.sort((a, b) => a - b));
        } else {
          throw new Error("Failed to fetch filter data");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
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
    symbols,
    expiryDates,
    strikes,
    loading,
    error,
  };
};
