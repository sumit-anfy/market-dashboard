import { useState, useCallback } from "react";
import { apiClient } from "@/config/axiosClient";
import { config } from "@/config/api";

interface UseDerivativesDataProps {
  instrumentId: number | null;
  endpoint: string;
}

export function useDerivativesData<T>({
  instrumentId,
  endpoint,
}: UseDerivativesDataProps) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabSwitchLoading, setTabSwitchLoading] = useState(false);

  const fetchData = useCallback(
    async (isTabSwitch = false) => {
      if (!instrumentId) {
        console.log("No instrumentId provided, skipping fetch");
        return;
      }

      console.log(`Fetching data for instrumentId: ${instrumentId} from ${endpoint}`);
      const startTime = Date.now();

      try {
        setLoading(true);
        if (isTabSwitch) {
          setTabSwitchLoading(true);
        }
        setError(null);

        const url = `${config.endpoints.arbitrage}${endpoint}`;
        console.log("API URL:", url, "params:", { instrumentId });

        const response = await apiClient.get(url, {
          params: { instrumentId },
        });

        console.log("Response:", response.data);
        if (response.data.success) {
          setData(response.data.data);
          console.log("Data set:", response.data.data.length, "records");
        }
      } catch (err: any) {
        // Ignore cancelled requests
        if (err?.cancelled) {
          console.log("[useDerivativesData] Request cancelled, ignoring");
          return;
        }
        console.error("Error fetching data:", err);
        setError(`Failed to fetch data from ${endpoint}`);
      } finally {
        // Ensure minimum loading time of 500ms for better UX
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 500;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          setLoading(false);
          if (isTabSwitch) {
            setTabSwitchLoading(false);
          }
        }, remainingTime);
      }
    },
    [instrumentId, endpoint]
  );

  const resetData = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
    setTabSwitchLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    tabSwitchLoading,
    fetchData,
    resetData,
  };
}
