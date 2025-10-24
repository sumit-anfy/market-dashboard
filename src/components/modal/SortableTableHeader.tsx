import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableTableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: any) => void;
  align?: "left" | "center" | "right";
}

export function SortableTableHeader({
  children,
  sortKey,
  sortConfig,
  onSort,
  align = "left",
}: SortableTableHeaderProps) {
  const isActive = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th
      className={`px-4 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors ${
        align === "right"
          ? "text-right"
          : align === "center"
          ? "text-center"
          : "text-left"
      }`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right"
            ? "justify-end"
            : align === "center"
            ? "justify-center"
            : "justify-start"
        }`}
      >
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`h-3 w-3 ${
              isActive && direction === "asc"
                ? "text-primary"
                : "text-muted-foreground/50"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 -mt-1 ${
              isActive && direction === "desc"
                ? "text-primary"
                : "text-muted-foreground/50"
            }`}
          />
        </div>
      </div>
    </th>
  );
}
