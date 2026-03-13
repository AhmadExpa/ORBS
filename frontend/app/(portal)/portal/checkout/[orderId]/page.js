import { CheckoutPaymentView } from "@/components/portal/checkout-payment-view";

export default async function PortalCheckoutPage({ params }) {
  const { orderId } = await params;

  return <CheckoutPaymentView orderId={orderId} />;
}
