import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../config/axiosClient";
import { config } from "../config/api";
import {
  CoveredCallsDetail,
  CoveredCallsDetailsPagination,
  CoveredCallsDetailsSummary,
  CoveredCallsDetailsResponse,
} from "../types/market";

interface UseCoveredCallsDetailsParams {
  instrumentId: string;
  page?: number;
  limit?: number;
  optionType?: "CE" | "PE" | "ALL";
  expiryDate?: string;
  symbol?: string;
}

export const useCoveredCallsDetails = ({
  instrumentId,
  page = 1,
  limit = 360,
  optionType = "ALL",
  expiryDate,
  symbol,
}: UseCoveredCallsDetailsParams) => {
  const [data, setData] = useState<CoveredCallsDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<CoveredCallsDetailsPagination | null>(null);
  const [summary, setSummary] = useState<CoveredCallsDetailsSummary | null>(
    null
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (optionType && optionType !== "ALL") {
        params.optionType = optionType;
      }

      if (expiryDate && expiryDate !== "ALL") {
        params.expiryDate = expiryDate;
      }

      if (symbol && symbol !== "ALL") {
        params.symbol = symbol;
      }

      const response = await apiClient.get<CoveredCallsDetailsResponse>(
        `${config.apiBaseUrl}/api/covered-calls/${instrumentId}/filtered`,
        { params }
      );

      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      } else {
        throw new Error("Failed to fetch covered calls details");
      }
    } catch (err: any) {
      // Ignore cancelled requests
      if (err?.cancelled) {
        console.log("[useCoveredCallsDetails] Request cancelled, ignoring");
        return;
      }
      const errorMessage = err?.message || "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching covered calls details:", err);
    } finally {
      setLoading(false);
    }
  }, [instrumentId, page, limit, optionType, expiryDate, symbol]);

  useEffect(() => {
    if (instrumentId) {
      fetchData();
    }
  }, [fetchData, instrumentId]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    pagination,
    summary,
    refetch,
  };
};
