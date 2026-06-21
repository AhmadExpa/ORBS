import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("voip-services");

export default function VoipServicesPage() {
  return <ProductVerticalPage slug="voip-services" />;
}
