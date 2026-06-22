import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/marketing/legal-page";
import { getLegalPage, legalPages } from "@/lib/legal-content";
import { siteConfig } from "@/lib/constants/site";

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/legal/${page.slug}`,
    },
    openGraph: {
      title: `${page.title} | ${siteConfig.name}`,
      description: page.description,
      url: `${siteConfig.publicUrl}/legal/${page.slug}`,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}

export default async function LegalPolicyPage({ params }) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    notFound();
  }

  return <LegalPageShell page={page} />;
}
