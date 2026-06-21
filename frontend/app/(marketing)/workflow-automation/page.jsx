import { ProductVerticalPage } from "@/components/marketing/product-vertical-page";
import { createVerticalMetadata } from "../_vertical-page-metadata";

export const metadata = createVerticalMetadata("workflow-automation");

export default function WorkflowAutomationPage() {
  return <ProductVerticalPage slug="workflow-automation" />;
}
