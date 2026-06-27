import { ContractCompletePage } from "@/components/portal/contract-complete-page";

export default async function PortalContractCompleteRoute({ params }) {
  const { id } = await params;

  return <ContractCompletePage contractId={id} />;
}
