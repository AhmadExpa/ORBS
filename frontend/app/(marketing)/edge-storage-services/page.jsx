import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("edge-storage-services");

export default function EdgeStorageServicesPage() {
  return <ProductVerticalPage slug="edge-storage-services" />;
}
