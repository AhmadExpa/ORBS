import { AdminContractDetailPage } from "@/components/admin/contract-detail-page";

export default async function AdminContractDetailRoute({ params }) {
  const { id } = await params;

  return <AdminContractDetailPage contractId={id} />;
}
