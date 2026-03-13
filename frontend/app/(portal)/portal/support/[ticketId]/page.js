import { TicketThread } from "@/components/portal/ticket-thread";

export default async function PortalSupportThreadPage({ params }) {
  const { ticketId } = await params;

  return <TicketThread ticketId={ticketId} />;
}
