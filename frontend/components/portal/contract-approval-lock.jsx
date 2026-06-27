import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/lib/ui";

export function isContractApprovedForPayments(status) {
  return String(status || "") === "APPROVED";
}

export function ContractApprovalLock({
  title = "Payment locked",
  description = "Your signed agreement is waiting for ElevenOrbits admin approval. Payment actions unlock after approval.",
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-950">{title}</p>
          <p className="mt-1">{description}</p>
          <Link href="/portal/contracts" className="mt-3 inline-flex">
            <Button variant="ghost" className="min-h-9 px-4 py-2 text-xs">
              View contract status
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
