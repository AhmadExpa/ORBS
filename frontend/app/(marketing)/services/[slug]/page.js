import { notFound } from "next/navigation";
import { serviceCategories } from "@/lib/shared";
import { ServicePage } from "@/components/marketing/service-page";

export function generateStaticParams() {
  return serviceCategories.map((category) => ({ slug: category.slug }));
}

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const exists = serviceCategories.some((category) => category.slug === slug);
  if (!exists) {
    notFound();
  }

  return <ServicePage slug={slug} />;
}
