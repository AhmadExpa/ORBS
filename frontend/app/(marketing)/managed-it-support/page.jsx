import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("managed-it-support");

export default function ManagedItSupportPage() {
  return <ProductVerticalPage slug="managed-it-support" />;
}
