"use client";

import Script from "next/script";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { siteConfig } from "@/lib/constants/site";
import { Button, FieldLabel, Select, TextArea, TextInput, cn } from "@/lib/ui";

const initialForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
  department: "sales",
  serviceInterest: "",
  subject: "",
  message: "",
};

const departments = [
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "billing", label: "Billing" },
  { value: "security", label: "Cybersecurity" },
  { value: "general", label: "General" },
];

const serviceInterests = [
  "Managed VPS",
  "Managed VDS",
  "AI Services",
  "Workflow Automation",
  "Vicidial",
  "Cybersecurity",
  "O7 Bucket",
  "Managed CDN",
  "Self-hosted Apps",
  "Other",
];

function StatusMessage({ state }) {
  if (!state.message) {
    return null;
  }

  const isSuccess = state.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
      )}
      role={isSuccess ? "status" : "alert"}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}

export function ContactForm({ className }) {
  const [form, setForm] = useState(initialForm);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteConfig.turnstileSiteKey || !turnstileLoaded || !turnstileRef.current || !window.turnstile || widgetIdRef.current !== null) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteConfig.turnstileSiteKey,
      action: "contact_form",
      callback(token) {
        setTurnstileToken(token);
      },
      "expired-callback"() {
        setTurnstileToken("");
      },
      "error-callback"() {
        setTurnstileToken("");
      },
    });

    return () => {
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [turnstileLoaded]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetTurnstile() {
    setTurnstileToken("");
    if (widgetIdRef.current !== null && window.turnstile?.reset) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!siteConfig.turnstileSiteKey) {
      setStatus({ type: "error", message: "The contact form protection is not configured yet." });
      return;
    }

    if (!turnstileToken) {
      setStatus({ type: "error", message: "Complete the verification before sending the form." });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch("/contact-submissions", {
        method: "POST",
        body: {
          ...form,
          turnstileToken,
        },
      });

      setForm(initialForm);
      setStatus({ type: "success", message: "Your message was sent. The team can now review it in the admin panel." });
      resetTurnstile();
    } catch (error) {
      setStatus({ type: "error", message: error.message || "The contact form could not be submitted." });
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={cn("eo-premium-card space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.34)]", className)} onSubmit={handleSubmit}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
        onReady={() => setTurnstileLoaded(true)}
      />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Contact Form</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Send the request to ElevenOrbits.</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="contact-name">Name</FieldLabel>
          <TextInput id="contact-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" required />
        </div>
        <div>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
          <TextInput id="contact-email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" required />
        </div>
        <div>
          <FieldLabel htmlFor="contact-company">Company</FieldLabel>
          <TextInput id="contact-company" value={form.company} onChange={(event) => updateField("company", event.target.value)} autoComplete="organization" />
        </div>
        <div>
          <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
          <TextInput id="contact-phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" />
        </div>
        <div>
          <FieldLabel htmlFor="contact-department">Department</FieldLabel>
          <Select id="contact-department" value={form.department} onChange={(event) => updateField("department", event.target.value)}>
            {departments.map((department) => (
              <option key={department.value} value={department.value}>
                {department.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="contact-service">Service</FieldLabel>
          <Select id="contact-service" value={form.serviceInterest} onChange={(event) => updateField("serviceInterest", event.target.value)}>
            <option value="">Select a service</option>
            {serviceInterests.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="contact-subject">Subject</FieldLabel>
        <TextInput id="contact-subject" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} required />
      </div>

      <div>
        <FieldLabel htmlFor="contact-message">Message</FieldLabel>
        <TextArea id="contact-message" className="min-h-36" value={form.message} onChange={(event) => updateField("message", event.target.value)} required />
      </div>

      <div className="min-h-[74px]">
        {siteConfig.turnstileSiteKey ? (
          <div ref={turnstileRef} />
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Turnstile is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable submissions.
          </div>
        )}
      </div>

      <StatusMessage state={status} />

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !siteConfig.turnstileSiteKey}>
        <Send className="h-4 w-4" />
        {isSubmitting ? "Sending" : "Send Message"}
      </Button>
    </form>
  );
}
