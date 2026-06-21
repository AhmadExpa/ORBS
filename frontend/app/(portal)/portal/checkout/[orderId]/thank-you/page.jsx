import { CheckoutThankYouView } from "@/components/portal/checkout-thank-you-view";

export default async function PortalCheckoutThankYouPage({ params }) {
  const { orderId } = await params;

  return <CheckoutThankYouView orderId={orderId} />;
}

