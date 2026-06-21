import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("ai-services");

export default function AiServicesPage() {
  return <ProductVerticalPage slug="ai-services" />;
}
