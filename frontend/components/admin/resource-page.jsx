"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";

export function AdminResourcePage({ title, subtitle, path, queryKey, rowsBuilder, sections }) {
  const { data, isLoading, refetch } = useStaffQuery({ queryKey, path });
  const resolvedSections = sections ? sections(data, refetch) : rowsBuilder ? rowsBuilder(data) : [];

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />
      <div className="space-y-6 p-6">
        {resolvedSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={section.columns} rows={section.rows} emptyMessage={isLoading ? "Loading..." : "No records found."} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
