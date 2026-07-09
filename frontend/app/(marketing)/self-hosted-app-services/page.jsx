import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("self-hosted-app-services");

export default function SelfHostedAppServicesPage() {
  return <ProductVerticalPage slug="self-hosted-app-services" />;
}
