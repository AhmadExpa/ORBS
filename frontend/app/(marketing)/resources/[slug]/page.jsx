import { notFound } from "next/navigation";
import { ResourceDetail } from "@/components/marketing/listing-pages";
import { getResourcePage, resourcePages } from "@/lib/marketing-content";
import { siteConfig } from "@/lib/constants/site";

export function generateStaticParams() {
  return resourcePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getResourcePage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/resources/${page.slug}`,
    },
    openGraph: {
      title: `${page.title} | ${siteConfig.name}`,
      description: page.description,
      url: `${siteConfig.publicUrl}/resources/${page.slug}`,
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export default async function ResourcePage({ params }) {
  const { slug } = await params;
  const page = getResourcePage(slug);

  if (!page) {
    notFound();
  }

  return <ResourceDetail resource={page} />;
}
