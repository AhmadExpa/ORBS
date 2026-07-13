"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button, cn } from "@/lib/ui";

const PREDEFINED_REASONS = [
  "Order placed by mistake",
  "Duplicate invoice",
  "Service no longer needed",
  "Switched to a different plan",
  "Pricing / billing issue",
  "Other",
];

export function DeleteReasonModal({
  open,
  title = "Confirm deletion",
  subtitle = "Please tell us why you are deleting this item.",
  confirmLabel = "Delete",
  reasonLabel = "Reason for deletion",
  otherLabel = "Please describe your reason",
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherText, setOtherText] = useState("");

  // Reset state whenever the modal opens
  useEffect(() => {
    if (open) {
      setSelectedReason("");
      setOtherText("");
    }
  }, [open]);

  if (!open) return null;

  const isOther = selectedReason === "Other";
  const finalReason = isOther ? otherText.trim() : selectedReason;
  const canConfirm = selectedReason && (!isOther || otherText.trim().length > 0);

  function handleConfirm() {
    if (!canConfirm || isDeleting) return;
    onConfirm(finalReason);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          {!isDeleting ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Reason selection */}
        <div className="px-6 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{reasonLabel}</p>
          <div className="space-y-2">
            {PREDEFINED_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                disabled={isDeleting}
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                  selectedReason === reason
                    ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                    selectedReason === reason
                      ? "border-rose-500 bg-rose-500"
                      : "border-slate-300 bg-white",
                  )}
                >
                  {selectedReason === reason ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                {reason}
              </button>
            ))}
          </div>

          {/* Free-text box for "Other" */}
          {isOther ? (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">{otherLabel}</label>
              <textarea
                autoFocus
                disabled={isDeleting}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Tell us more so we can improve the service..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
                rows={3}
              />
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="ghost" disabled={isDeleting} onClick={onClose}>
            Cancel
          </Button>
          <button
            type="button"
            disabled={!canConfirm || isDeleting}
            onClick={handleConfirm}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
              canConfirm && !isDeleting
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            {isDeleting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
