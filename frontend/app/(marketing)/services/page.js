import Link from "next/link";
import { serviceCategories } from "@/lib/shared";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SectionHeading } from "@/lib/ui";

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        eyebrow="Services"
        title="Managed service lines for infrastructure, AI, workflows, and support."
        description="Customers browse services here, review managed plan details, and move into the order flow for fixed-price offerings."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {serviceCategories.map((category) => (
          <Card key={category.slug} className="transition hover:-translate-y-1 hover:shadow-panel">
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm font-medium text-sky-700">Managed by ElevenOrbits Team</p>
              <Link href={`/services/${category.slug}`}>
                <Button variant="ghost">Open</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
