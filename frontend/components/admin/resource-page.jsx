"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, TextInput } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";

function flattenValues(value, depth = 0) {
  if (value == null || depth > 2) {
    return [];
  }
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenValues(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value).flatMap((item) => flattenValues(item, depth + 1));
  }
  return [];
}

function rowMatches(row, term) {
  if (!term) {
    return true;
  }
  return flattenValues(row).join(" ").toLowerCase().includes(term);
}

function ResourceSection({ section }) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const rows = useMemo(
    () => (section.searchable && term ? section.rows.filter((row) => rowMatches(row, term)) : section.rows),
    [section.rows, section.searchable, term],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </div>
          {section.searchable ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-9 md:w-72"
                placeholder={section.searchPlaceholder || "Search…"}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable dense columns={section.columns} rows={rows} emptyMessage={term ? "No records match your search." : "No records found."} />
      </CardContent>
    </Card>
  );
}

export function AdminResourcePage({ title, subtitle, path, queryKey, rowsBuilder, sections }) {
  const { data, isLoading, refetch } = useStaffQuery({ queryKey, path });
  const resolvedSections = sections ? sections(data, refetch) : rowsBuilder ? rowsBuilder(data) : [];

  if (isLoading && !data) {
    return <PageLoader title={`Loading ${String(title).toLowerCase()}`} subtitle={subtitle} />;
  }

  return (
    <div>
      <Topbar title={title} subtitle={subtitle} />
      <div className="space-y-6 p-6 md:p-8">
        {resolvedSections.map((section) => (
          <ResourceSection key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}
