import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";

export function EmptyState({ title, description, action }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
