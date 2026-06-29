import React from "react";
import { cn } from "./utils.js";

export function DataTable({ columns = [], rows = [], emptyMessage = "No records found.", dense = false }) {
  const headCell = dense ? "px-3 py-2.5" : "px-4 py-3";
  const bodyCell = dense ? "px-3 py-2.5" : "px-4 py-3.5";
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500", headCell)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id || index} className="transition-colors hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("text-sm font-medium text-slate-700", bodyCell, column.className)}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
