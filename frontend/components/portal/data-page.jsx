"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/page-loader";
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

  if (isLoading && !data) {
    return <PageLoader title={title} subtitle={subtitle} cardCount={2} lines={4} />;
  }

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />
      <div className="space-y-6 p-6">
        {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
        {rows.length ? (
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} rows={rows} emptyMessage="No records found." />
            </CardContent>
          </Card>
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </div>
  );
}
