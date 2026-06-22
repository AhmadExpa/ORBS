import { notFound } from "next/navigation";
import { IndustryDetail } from "@/components/marketing/listing-pages";
import { getIndustryPage, industryPages } from "@/lib/marketing-content";
import { siteConfig } from "@/lib/constants/site";

export function generateStaticParams() {
  return industryPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getIndustryPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/industries/${page.slug}`,
    },
    openGraph: {
      title: `${page.title} | ${siteConfig.name}`,
      description: page.description,
      url: `${siteConfig.publicUrl}/industries/${page.slug}`,
      siteName: siteConfig.name,
      type: "website",
    },
  };
}

export default async function IndustryPage({ params }) {
  const { slug } = await params;
  const page = getIndustryPage(slug);

  if (!page) {
    notFound();
  }

  return <IndustryDetail industry={page} />;
}
