import { getServiceVertical } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";

export function createVerticalMetadata(slug) {
  const vertical = getServiceVertical(slug);

  if (!vertical) {
    return {};
  }

  const path = `/${vertical.slug}`;
  const url = `${siteConfig.publicUrl}${path}`;

  return {
    title: vertical.seoTitle,
    description: vertical.seoDescription,
    keywords: vertical.keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: vertical.seoTitle,
      description: vertical.seoDescription,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: vertical.seoTitle,
      description: vertical.seoDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
