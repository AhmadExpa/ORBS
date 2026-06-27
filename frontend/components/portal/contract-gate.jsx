"use client";

import { usePathname } from "next/navigation";
import { ContractsPage } from "@/components/portal/contracts-page";
import { PageLoader } from "@/components/shared/page-loader";
import { useCustomerQuery } from "@/lib/api/hooks";

const submittedStatuses = new Set(["SIGNED_PENDING_ADMIN", "APPROVED"]);

export function isContractSubmittedForPortal(status) {
  return submittedStatuses.has(String(status || ""));
}

export function ContractGate({ children }) {
  const pathname = usePathname();
  const isContractRoute = pathname?.startsWith("/portal/contracts");
  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-gate"],
    path: "/contracts/current",
    enabled: !isContractRoute,
  });

  if (isContractRoute) {
    return children;
  }

  if (contractQuery.isLoading && !contractQuery.data) {
    return <PageLoader title="Contract Required" subtitle="Checking your service agreement status..." cardCount={1} lines={4} />;
  }

  const status = contractQuery.data?.contract?.status || contractQuery.data?.status || "NOT_STARTED";
  if (!isContractSubmittedForPortal(status)) {
    return <ContractsPage />;
  }

  return children;
}
