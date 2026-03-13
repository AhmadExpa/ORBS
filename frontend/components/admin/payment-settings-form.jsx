"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextArea, TextInput } from "@/lib/ui";
import { serviceCategories } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

export function PaymentSettingsForm() {
  const { data, refetch } = useStaffQuery({
    queryKey: ["admin-payment-settings"],
    path: "/admin/payment-settings",
  });
  const [form, setForm] = useState({
    title: "",
    paymentLink: "",
    instructions: "",
    supportedFor: serviceCategories.map((item) => item.slug),
  });
  const [qrCode, setQrCode] = useState(null);
  const [state, setState] = useState({ saving: false, message: "", error: "" });

  useEffect(() => {
    const paymentSetting = data?.paymentSetting;
    if (paymentSetting) {
      setForm({
        title: paymentSetting.title || "",
        paymentLink: paymentSetting.paymentLink || "",
        instructions: paymentSetting.instructions || "",
        supportedFor: paymentSetting.supportedFor?.length ? paymentSetting.supportedFor : serviceCategories.map((item) => item.slug),
      });
    }
  }, [data]);

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ saving: true, message: "", error: "" });

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("paymentLink", form.paymentLink);
      formData.append("instructions", form.instructions);
      formData.append("supportedFor", form.supportedFor.join(","));
      if (qrCode) {
        formData.append("qrCode", qrCode);
      }

      await apiFetch("/admin/payment-settings", {
        method: "PUT",
        body: formData,
        isMultipart: true,
      });
      await refetch();
      setState({ saving: false, message: "Payment settings updated.", error: "" });
    } catch (error) {
      setState({ saving: false, message: "", error: error.message });
    }
  }

  const currentQrCode = data?.paymentSetting?.qrCodeImageUrl;

  return (
    <div>
      <Topbar title="Payment Settings" subtitle="Upload the QR code, update instructions, and manage the fallback payment link." />
      <div className="p-6">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Manual Payment Configuration</CardTitle>
            <CardDescription>Only one active payment profile is expected in the initial rollout.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {currentQrCode ? (
                      <Image
                        alt="Current QR code"
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000"}${currentQrCode}`}
                        width={220}
                        height={220}
                        className="h-auto w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                        No QR code uploaded yet
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => setQrCode(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                    <TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Fallback Payment Link</label>
                    <TextInput value={form.paymentLink} onChange={(event) => setForm((current) => ({ ...current, paymentLink: event.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Instructions</label>
                    <TextArea value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Supported Categories</label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {serviceCategories.map((category) => (
                        <label key={category.slug} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                          <input
                            type="checkbox"
                            checked={form.supportedFor.includes(category.slug)}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                supportedFor: event.target.checked
                                  ? [...current.supportedFor, category.slug]
                                  : current.supportedFor.filter((item) => item !== category.slug),
                              }))
                            }
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {state.message ? <p className="text-sm font-medium text-emerald-700">{state.message}</p> : null}
              {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
              <Button type="submit" disabled={state.saving}>
                {state.saving ? "Saving..." : "Save Payment Settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
