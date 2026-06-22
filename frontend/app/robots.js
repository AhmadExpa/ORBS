import { siteConfig } from "@/lib/constants/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal",
          "/portal/",
          "/eo-admin",
          "/eo-admin/",
          "/login",
          "/login/",
          "/signup",
          "/signup/",
          "/api",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteConfig.publicUrl}/sitemap.xml`,
    host: siteConfig.publicUrl,
  };
}
