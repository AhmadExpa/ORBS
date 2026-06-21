import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("cybersecurity-services");

export default function CybersecurityServicesPage() {
  return <ProductVerticalPage slug="cybersecurity-services" />;
}
