import { ContractSignPage } from "@/components/portal/contract-sign-page";

export default async function PortalContractSignRoute({ params }) {
  const { id } = await params;

  return <ContractSignPage contractId={id} />;
}
