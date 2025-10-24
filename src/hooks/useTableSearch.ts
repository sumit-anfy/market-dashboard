import { useState, useMemo } from "react";

export function useTableSearch<T extends { symbol: string }>(data: T[]) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const resetSearch = () => setSearchTerm("");

  return { filteredData, searchTerm, setSearchTerm, resetSearch };
}
