import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002/api";

interface UseArbitrageDetailsParams {
  instrumentId: string;
  timeRange: "day" | "hour";
  page: number;
  limit: number;
  gapFilter: "both" | "positive" | "negative";
  minGap?: number;
  maxGap?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface SummaryInfo {
  positiveGapCount: number;
  negativeGapCount: number;
  totalCount: number;
}

interface ArbitrageDetailsResponse {
  success: boolean;
  data: any[];
  pagination: PaginationInfo;
  summary: SummaryInfo;
}

export const useArbitrageDetails = ({
  instrumentId,
  timeRange,
  page,
  limit,
  gapFilter,
  minGap,
  maxGap,
}: UseArbitrageDetailsParams) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [summary, setSummary] = useState<SummaryInfo | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        timeRange,
        page,
        limit,
        gapFilter,
      };

      if (minGap !== undefined) {
        params.minGap = minGap;
      }

      if (maxGap !== undefined) {
        params.maxGap = maxGap;
      }

      const response = await axios.get<ArbitrageDetailsResponse>(
        `${API_BASE_URL}/arbitrage-details/${instrumentId}/filtered`,
        { params }
      );

      if (response.data.success) {
        setData(response.data.data);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      } else {
        setError("Failed to fetch arbitrage details");
      }
    } catch (err) {
      console.error("Error fetching arbitrage details:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instrumentId) {
      fetchData();
    }
  }, [instrumentId, timeRange, page, limit, gapFilter, minGap, maxGap]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    pagination,
    summary,
    refetch,
  };
};
