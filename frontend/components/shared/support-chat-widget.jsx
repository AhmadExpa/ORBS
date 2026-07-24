"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  ArrowUp,
  LifeBuoy,
  MailCheck,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function botMessage(text) {
  return { id: `bot-${Date.now()}-${Math.random()}`, role: "bot", text };
}

function userMessage(text, { privateValue = false } = {}) {
  return {
    id: `user-${Date.now()}-${Math.random()}`,
    role: "user",
    text: privateValue ? "••••••" : text,
  };
}

function initialConversation(isCustomer) {
  return isCustomer
    ? {
        phase: "customer_pin",
        messages: [
          botMessage("Welcome back. Before I attach account details to a support request, please enter your 6-digit Support PIN."),
          botMessage("You can find it in Portal → Account → Support & security."),
        ],
      }
    : {
        phase: "visitor_initial",
        messages: [
          botMessage("Hi! Welcome to ElevenOrbits support."),
          botMessage("Tell me briefly what you need help with, and I’ll prepare the right support request."),
        ],
      };
}

function inputConfiguration(phase) {
  const configurations = {
    visitor_initial: {
      placeholder: "Briefly tell us what you need...",
      type: "text",
      multiline: true,
    },
    visitor_email: {
      placeholder: "you@company.com",
      type: "email",
      multiline: false,
    },
    visitor_question: {
      placeholder: "Describe your question and the result you need...",
      type: "text",
      multiline: true,
    },
    visitor_verify: {
      placeholder: "6-digit email code",
      type: "text",
      inputMode: "numeric",
      multiline: false,
    },
    customer_pin: {
      placeholder: "6-digit Support PIN",
      type: "password",
      inputMode: "numeric",
      multiline: false,
    },
    customer_question: {
      placeholder: "Describe your question and the result you need...",
      type: "text",
      multiline: true,
    },
  };

  return configurations[phase] || null;
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const { isLoaded, userId, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState({
    initialQuery: "",
    email: "",
    pinSessionToken: "",
    ticketNumber: "",
    ticketId: "",
    clarifyingQuestion: "",
  });
  const messagesEndRef = useRef(null);

  const hidden =
    pathname?.startsWith("/eo-admin") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup");
  const isCustomer = Boolean(userId);
  const inputConfig = inputConfiguration(phase);
  const complete = phase === "visitor_complete" || phase === "customer_complete";

  useEffect(() => {
    if (!open || !isLoaded || started) {
      return;
    }

    const conversation = initialConversation(isCustomer);
    setPhase(conversation.phase);
    setMessages(conversation.messages);
    setStarted(true);
  }, [isCustomer, isLoaded, open, started]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  if (hidden) {
    return null;
  }

  function addBot(text) {
    setMessages((current) => [...current, botMessage(text)]);
  }

  function addUser(text, options) {
    setMessages((current) => [...current, userMessage(text, options)]);
  }

  function resetConversation() {
    const conversation = initialConversation(isCustomer);
    setPhase(conversation.phase);
    setMessages(conversation.messages);
    setDraft({
      initialQuery: "",
      email: "",
      pinSessionToken: "",
      ticketNumber: "",
      ticketId: "",
      clarifyingQuestion: "",
    });
    setInput("");
    setError("");
    setSending(false);
    setStarted(true);
  }

  async function handleVisitorInput(value) {
    if (phase === "visitor_initial") {
      if (value.length < 3) {
        setError("Please add a little more detail so we can route the request.");
        return;
      }
      addUser(value);
      setDraft((current) => ({ ...current, initialQuery: value }));
      setSending(true);
      try {
        const response = await apiFetch("/chat-support/assistant", {
          method: "POST",
          body: {
            phase: "visitor_initial",
            message: value,
          },
        });
        setDraft((current) => ({
          ...current,
          clarifyingQuestion: response.clarifyingQuestion || "",
        }));
        addBot(response.reply);
      } catch {
        addBot("I understand the request. I’ll collect a verified contact address next, then ask for the details the support team needs.");
      } finally {
        setSending(false);
      }
      setPhase("visitor_email");
      addBot("What email address should we use for verification and support updates?");
      return;
    }

    if (phase === "visitor_email") {
      const email = value.toLowerCase();
      if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        setError("Enter a valid email address, such as you@company.com.");
        return;
      }
      addUser(email);
      setDraft((current) => ({ ...current, email }));
      setPhase("visitor_question");
      addBot("Email format looks good. Now describe the full question, any affected service, and what outcome you need.");
      if (draft.clarifyingQuestion) {
        addBot(draft.clarifyingQuestion);
      }
      return;
    }

    if (phase === "visitor_question") {
      if (value.length < 10) {
        setError("Please describe the question in at least 10 characters.");
        return;
      }
      addUser(value);
      setSending(true);
      try {
        const response = await apiFetch("/chat-support/visitor/tickets", {
          method: "POST",
          body: {
            initialQuery: draft.initialQuery,
            email: draft.email,
            question: value,
          },
        });
        setDraft((current) => ({
          ...current,
          ticketNumber: response.ticketNumber,
        }));
        if (response.assistantMessage) {
          addBot(response.assistantMessage);
        }
        addBot(`Your ticket number is ${response.ticketNumber}.`);
        if (response.emailSent) {
          setPhase("visitor_verify");
          addBot(`I sent a verification email to ${response.email}. Check your inbox and enter the 6-digit code here.`);
        } else {
          setPhase("visitor_complete");
          addBot(response.message);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSending(false);
      }
      return;
    }

    if (phase === "visitor_verify") {
      if (!/^\d{6}$/u.test(value)) {
        setError("Enter the 6-digit code from the verification email.");
        return;
      }
      addUser(value, { privateValue: true });
      setSending(true);
      try {
        const response = await apiFetch("/chat-support/visitor/verify", {
          method: "POST",
          body: {
            ticketNumber: draft.ticketNumber,
            email: draft.email,
            code: value,
          },
        });
        setPhase("visitor_complete");
        addBot(response.message);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSending(false);
      }
    }
  }

  async function handleCustomerInput(value) {
    if (phase === "customer_pin") {
      if (!/^\d{6}$/u.test(value)) {
        setError("Enter your 6-digit Support PIN.");
        return;
      }
      addUser(value, { privateValue: true });
      setSending(true);
      try {
        const token = await getToken();
        const response = await apiFetch("/chat-support/customer/verify-pin", {
          method: "POST",
          token,
          body: { pin: value },
        });
        setDraft((current) => ({
          ...current,
          pinSessionToken: response.pinSessionToken,
        }));
        setPhase("customer_question");
        addBot(response.message);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setSending(false);
      }
      return;
    }

    if (phase === "customer_question") {
      if (value.length < 10) {
        setError("Please describe the question in at least 10 characters.");
        return;
      }
      addUser(value);
      setSending(true);
      try {
        const token = await getToken();
        const response = await apiFetch("/chat-support/customer/tickets", {
          method: "POST",
          token,
          body: {
            pinSessionToken: draft.pinSessionToken,
            question: value,
          },
        });
        setDraft((current) => ({
          ...current,
          ticketId: response.ticketId,
          ticketNumber: response.ticketNumber,
        }));
        setPhase("customer_complete");
        if (response.assistantMessage) {
          addBot(response.assistantMessage);
        }
        addBot(`Your ticket number is ${response.ticketNumber}. ${response.message}`);
        if (response.clarifyingQuestion) {
          addBot(`A useful follow-up for the support team is: ${response.clarifyingQuestion} You can add that detail in the ticket thread.`);
        }
        addBot("Stay tuned—once our team reviews your request, we’ll send the next response or quotation through your support thread.");
      } catch (requestError) {
        if (requestError.message?.toLowerCase().includes("support verification")) {
          setPhase("customer_pin");
          setDraft((current) => ({ ...current, pinSessionToken: "" }));
        }
        setError(requestError.message);
      } finally {
        setSending(false);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value || sending || !inputConfig) {
      return;
    }

    setInput("");
    setError("");
    if (isCustomer) {
      await handleCustomerInput(value);
    } else {
      await handleVisitorInput(value);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && inputConfig?.multiline) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="fixed bottom-20 right-3 z-[80] flex flex-col items-end md:bottom-6 md:right-6">
      {open ? (
        <section
          role="dialog"
          aria-label="ElevenOrbits support chat"
          className="mb-3 flex h-[min(680px,calc(100vh-7rem))] w-[calc(100vw-1.5rem)] max-w-[410px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]"
        >
          <header className="bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <LifeBuoy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">ElevenOrbits Support</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    AI-assisted secure intake
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Restart support chat"
                  onClick={resetConversation}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Close support chat"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              {isCustomer ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <MailCheck className="h-4 w-4 text-sky-600" />}
              {isCustomer ? "Customer account · Support PIN required" : "Visitor request · Email verification required"}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fc] px-4 py-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6",
                    message.role === "user"
                      ? "rounded-br-md bg-slate-950 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm",
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5" aria-label="Support assistant is working">
                    {[0, 1, 2].map((item) => (
                      <span
                        key={item}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400"
                        style={{ animationDelay: `${item * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <footer className="border-t border-slate-200 bg-white p-4">
            {phase === "customer_pin" ? (
              <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-900">
                Can’t find your PIN? Open{" "}
                <Link href="/portal/account" className="font-semibold underline underline-offset-2" onClick={() => setOpen(false)}>
                  Portal → Account
                </Link>
                {" "}and select “Support &amp; security.”
              </div>
            ) : null}

            {error ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700" role="alert">
                {error}
              </div>
            ) : null}

            {complete ? (
              <div className="space-y-3">
                {draft.ticketNumber ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Ticket created</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-emerald-950">{draft.ticketNumber}</p>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  {draft.ticketId ? (
                    <Link href={`/portal/support/${draft.ticketId}`} className="flex-1" onClick={() => setOpen(false)}>
                      <span className="flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                        Open ticket
                      </span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    New request
                  </button>
                </div>
              </div>
            ) : inputConfig ? (
              <form onSubmit={handleSubmit}>
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100">
                  {inputConfig.multiline ? (
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      maxLength={4000}
                      placeholder={inputConfig.placeholder}
                      disabled={sending}
                      className="max-h-28 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      autoFocus
                    />
                  ) : (
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      type={inputConfig.type}
                      inputMode={inputConfig.inputMode}
                      maxLength={phase.includes("pin") || phase.includes("verify") ? 6 : 254}
                      placeholder={inputConfig.placeholder}
                      disabled={sending}
                      className="h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      autoFocus
                    />
                  )}
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={sending || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 px-1 text-[11px] leading-4 text-slate-400">
                  Don’t share passwords, payment card numbers, or server credentials in chat.
                </p>
              </form>
            ) : null}
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group flex h-14 items-center gap-3 rounded-full border border-slate-800 bg-slate-950 px-4 text-white shadow-[0_16px_40px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:bg-slate-900"
        aria-label={open ? "Close support chat" : "Open support chat"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="pr-1 text-sm font-semibold">{open ? "Close" : "Support"}</span>
      </button>
    </div>
  );
}
