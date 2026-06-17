import React from "react";
import { cn } from "./utils.js";

export function DataTable({ columns = [], rows = [], emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-950/[0.08] bg-white/78 ring-1 ring-white/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-950/[0.07] text-left">
          <thead className="bg-slate-50/85">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-950/[0.05]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm font-medium text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id || index} className="transition hover:bg-white">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3.5 text-sm font-medium text-slate-700", column.className)}>
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
