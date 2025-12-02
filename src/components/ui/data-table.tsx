import * as React from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn("rounded-md border overflow-auto max-h-[600px]", className)}>
      <div className="relative w-full">
        <table className="w-full caption-bottom text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

interface DataTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
  return (
    <thead className={cn("sticky top-0 z-10 bg-background [&_tr]:border-b", className)}>
      {children}
    </thead>
  );
}

interface DataTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

interface DataTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr
      className={cn("border-b transition-colors hover:bg-muted/50", className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface DataTableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onClick?: () => void;
}

export function DataTableHead({ children, className, sortable, onClick }: DataTableHeadProps) {
  return (
    <th 
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground items-center",
        sortable && "cursor-pointer hover:text-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

interface DataTableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export function DataTableCell({ children, className, colSpan }: DataTableCellProps) {
  return (
    <td className={cn("p-4 align-middle items-center", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}
