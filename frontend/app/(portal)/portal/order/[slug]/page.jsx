import { OrderConfigurator } from "@/components/portal/order-configurator";

export default async function PortalOrderPage({ params }) {
  const { slug } = await params;

  return <OrderConfigurator slug={slug} />;
}
