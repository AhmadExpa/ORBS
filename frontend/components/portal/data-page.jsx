"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { EmptyState } from "@/components/shared/empty-state";
import { useCustomerQuery } from "@/lib/api/hooks";

export function PortalDataPage({
  title,
  subtitle,
  path,
  queryKey,
  dataKey,
  columns,
  emptyTitle,
  emptyDescription,
  children,
}) {
  const { data, isLoading } = useCustomerQuery({ queryKey, path });
  const rows = data?.[dataKey] || [];

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />
      <div className="space-y-6 p-6">
        {children}
        {rows.length ? (
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} rows={rows} emptyMessage={isLoading ? "Loading..." : "No records found."} />
            </CardContent>
          </Card>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </div>
  );
}
