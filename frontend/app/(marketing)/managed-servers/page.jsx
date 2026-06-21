import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("managed-servers");

export default function ManagedServersPage() {
  return <ProductVerticalPage slug="managed-servers" />;
}
