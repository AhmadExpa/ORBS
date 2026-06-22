import { serviceCategories, serviceVerticals } from "@/lib/shared";
import { siteConfig } from "@/lib/constants/site";
import { legalPages } from "@/lib/legal-content";
import { companyPages, industryPages, resourcePages } from "@/lib/marketing-content";

function page(path, priority, changeFrequency = "weekly") {
  return {
    url: `${siteConfig.publicUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap() {
  return [
    page("/", 1, "weekly"),
    page("/services", 0.95, "weekly"),
    page("/pricing", 0.75, "weekly"),
    page("/contact", 0.7, "monthly"),
    ...Object.values(companyPages).map((item) => page(item.href, 0.78, "monthly")),
    page("/tech-stack", 0.8, "monthly"),
    page("/industries", 0.72, "monthly"),
    page("/resources", 0.72, "monthly"),
    page("/legal", 0.5, "monthly"),
    ...serviceVerticals.map((vertical) => page(`/${vertical.slug}`, 0.9, "weekly")),
    ...serviceCategories.map((category) => page(`/services/${category.slug}`, 0.82, "weekly")),
    ...industryPages.map((item) => page(`/industries/${item.slug}`, 0.68, "monthly")),
    ...resourcePages.map((item) => page(`/resources/${item.slug}`, 0.65, "monthly")),
    ...legalPages.map((item) => page(`/legal/${item.slug}`, 0.45, "monthly")),
  ];
}
