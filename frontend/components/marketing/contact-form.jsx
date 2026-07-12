"use client";

import Script from "next/script";
import { AlertCircle, CheckCircle2, Send, X } from "lucide-react";
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

function normalizeErrorMessages(error) {
  if (Array.isArray(error?.details)) {
    return error.details.map((item) => item?.message).filter(Boolean);
  }

  const message = error?.message || "The contact form could not be submitted.";

  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        const path = Array.isArray(item?.path) && item.path.length ? `${item.path.join(".")}: ` : "";
        return `${path}${item?.message || "Invalid value"}`;
      });
    }
  } catch {
    // The API can return a plain string; keep that as the fallback.
  }

  return [message];
}

function ErrorDialog({ messages, onClose }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="contact-error-title">
      <div className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-6 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.45)]">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="contact-error-title" className="text-lg font-semibold tracking-tight text-slate-950">
              Check the form details
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">The request was not sent. Fix the item below and try again.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close error dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50/70 p-4">
          <ul className="grid gap-2 text-sm font-medium leading-6 text-rose-900">
            {messages.map((message, index) => (
              <li key={`${message}-${index}`} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            Review Form
          </Button>
        </div>
      </div>
    </div>
  );
}

function ThankYouPanel({ className, onReset }) {
  return (
    <div className={cn("rounded-lg border border-emerald-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.34)]", className)} role="status">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Message Sent</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Thank you for contacting ElevenOrbits.</h2>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Your request is now available to the team. The right department can review the service context and follow up through the managed contact flow.
      </p>
      <Button type="button" variant="ghost" className="mt-6" onClick={onReset}>
        Send Another Message
      </Button>
    </div>
  );
}

export function ContactForm({ className }) {
  const [form, setForm] = useState(initialForm);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errorMessages, setErrorMessages] = useState([]);
  const [sent, setSent] = useState(false);
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
    setErrorMessages([]);

    if (!siteConfig.turnstileSiteKey) {
      setErrorMessages(["The contact form protection is not configured yet."]);
      return;
    }

    if (!turnstileToken) {
      setErrorMessages(["Complete the verification before sending the form."]);
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
      setSent(true);
      resetTurnstile();
    } catch (error) {
      setErrorMessages(normalizeErrorMessages(error));
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return <ThankYouPanel className={className} onReset={() => setSent(false)} />;
  }

  return (
    <form className={cn("space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.34)]", className)} onSubmit={handleSubmit}>
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

      <ErrorDialog messages={errorMessages} onClose={() => setErrorMessages([])} />

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !siteConfig.turnstileSiteKey}>
        <Send className="h-4 w-4" />
        {isSubmitting ? "Sending" : "Send Message"}
      </Button>
    </form>
  );
}
