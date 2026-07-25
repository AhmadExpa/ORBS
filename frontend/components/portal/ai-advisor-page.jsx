"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  ChevronRight,
  CircleGauge,
  LifeBuoy,
  MessageSquareText,
  Plus,
  Server,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

const SUGGESTED_PROMPTS = [
  "Design a secure SaaS architecture for a multi-tenant B2B application.",
  "Which managed server plan fits a production Node.js app with PostgreSQL?",
  "Help me structure an MVP, deployment plan, and monthly managed services.",
  "Compare self-hosting with an ElevenOrbits managed deployment.",
];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function AdvisorMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[92%] md:max-w-[82%]", isUser ? "text-right" : "text-left")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3.5 text-sm leading-7 shadow-sm",
            isUser
              ? "rounded-br-md bg-slate-950 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-700",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && message.recommendations?.length ? (
          <div className="mt-3 grid gap-2">
            {message.recommendations.map((plan) => (
              <div key={plan.slug} className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-left">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{plan.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{plan.reason}</p>
                  </div>
                  <span className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-sky-800">
                    {plan.priceLabel}
                  </span>
                </div>
                <Link
                  href={plan.orderUrl}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-700"
                >
                  Review service
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : null}

        {!isUser && message.nextSteps?.length ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Suggested next steps</p>
            <ol className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
              {message.nextSteps.map((step, index) => (
                <li key={`${message._id}-step-${index}`} className="flex gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {!isUser && message.shouldContactTeam ? (
          <Link
            href="/portal/support"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <LifeBuoy className="h-4 w-4 text-sky-700" />
            Ask our team for a tailored quotation
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function AiAdvisorPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const overviewQuery = useCustomerQuery({
    queryKey: ["portal-ai-advisor"],
    path: "/ai-advisor",
  });
  const messagesQuery = useCustomerQuery({
    queryKey: ["portal-ai-advisor-messages", selectedId],
    path: `/ai-advisor/conversations/${selectedId}/messages`,
    enabled: Boolean(selectedId),
  });

  const conversations = overviewQuery.data?.conversations || [];
  const usage = overviewQuery.data?.usage || {
    limit: 200,
    used: 0,
    remaining: 200,
    resetsAt: "",
  };
  const configured = overviewQuery.data?.configured !== false;
  const messages = messagesQuery.data?.messages || [];
  const usagePercent = usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const outOfCredits = usage.remaining <= 0;

  useEffect(() => {
    if (!selectedId && conversations.length) {
      setSelectedId(conversations[0]._id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, pendingQuestion, sending]);

  async function createConversation() {
    setCreating(true);
    setError("");
    try {
      const token = await getToken();
      const response = await apiFetch("/ai-advisor/conversations", {
        method: "POST",
        token,
        authMode: "customer",
        body: {},
      });
      setSelectedId(response.conversation._id);
      await overviewQuery.refetch();
      return response.conversation._id;
    } catch (requestError) {
      setError(requestError.message);
      return "";
    } finally {
      setCreating(false);
    }
  }

  async function handleNewConversation() {
    if (sending || creating || !configured) return;
    await createConversation();
    setInput("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || sending || outOfCredits || !configured) return;

    setError("");
    setSending(true);
    setPendingQuestion(question);
    setInput("");

    try {
      let conversationId = selectedId;
      if (!conversationId) {
        conversationId = await createConversation();
      }
      if (!conversationId) {
        return;
      }

      const token = await getToken();
      await apiFetch(`/ai-advisor/conversations/${conversationId}/messages`, {
        method: "POST",
        token,
        authMode: "customer",
        body: { message: question },
      });
      await Promise.all([
        overviewQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["portal-ai-advisor-messages", conversationId] }),
      ]);
    } catch (requestError) {
      setInput(question);
      setError(requestError.message);
      await overviewQuery.refetch();
    } finally {
      setPendingQuestion("");
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return <PageLoader title="AI Service Advisor" subtitle="Preparing your service and SaaS workspace…" cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar
        title="AI Service Advisor"
        subtitle="Plan SaaS products, compare infrastructure, and find the right ElevenOrbits managed services."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <CircleGauge className="h-4 w-4 text-sky-700" />
            <span className="text-sm font-semibold text-slate-800">{usage.remaining} messages left</span>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-[1680px] p-4 sm:p-6 md:p-8">
        {!configured ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            The AI Service Advisor is not configured on the backend yet. Add the server-side OpenRouter key and restart the backend.
          </div>
        ) : null}

        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="border-b border-slate-200 bg-slate-950 p-4 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
            <button
              type="button"
              onClick={handleNewConversation}
              disabled={creating || sending || !configured}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating…" : "New conversation"}
            </button>

            <p className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Conversations</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[560px] lg:space-y-1 lg:overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => {
                    setSelectedId(conversation._id);
                    setError("");
                  }}
                  className={cn(
                    "min-w-[220px] rounded-xl border px-3 py-3 text-left transition lg:min-w-0 lg:w-full",
                    selectedId === conversation._id
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <p className="truncate text-sm font-semibold">{conversation.title}</p>
                  <p className="mt-1 truncate text-xs text-white/35">{conversation.preview || "Ready for your question"}</p>
                </button>
              ))}
              {!conversations.length ? (
                <p className="px-2 py-3 text-xs leading-5 text-white/40">Your advisory conversations will appear here.</p>
              ) : null}
            </div>
          </aside>

          <section className="flex min-h-[680px] min-w-0 flex-col bg-[#f7f9fc]">
            <header className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <MessageSquareText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">ElevenOrbits Advisor</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Service selection and SaaS architecture
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
              {!messages.length && !pendingQuestion ? (
                <div className="mx-auto flex min-h-[440px] max-w-2xl flex-col items-center justify-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                    <Server className="h-6 w-6" />
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">What are you planning?</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Ask about a service, infrastructure sizing, SaaS architecture, deployment strategy, or how ElevenOrbits can manage the operational layer.
                  </p>
                  <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-medium leading-5 text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messagesQuery.isLoading && selectedId && !messages.length ? (
                <p className="text-center text-sm text-slate-500">Loading conversation…</p>
              ) : null}
              {messages.map((message) => <AdvisorMessage key={message._id} message={message} />)}
              {pendingQuestion ? (
                <AdvisorMessage message={{ _id: "pending-user", role: "user", content: pendingQuestion }} />
              ) : null}
              {sending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5" aria-label="Advisor is preparing a response">
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
              {error ? (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">
                  {error}
                </div>
              ) : null}
              {outOfCredits ? (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  You have used this month’s {usage.limit} messages. Your allowance resets on {formatDate(usage.resetsAt)}.
                </div>
              ) : null}
              <form onSubmit={handleSubmit}>
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    maxLength={4000}
                    placeholder="Ask about a service, SaaS architecture, or managed deployment…"
                    disabled={sending || outOfCredits || !configured}
                    className="max-h-32 min-h-[48px] min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={sending || !input.trim() || outOfCredits || !configured}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 px-1 text-[11px] leading-4 text-slate-400">
                  One question uses one monthly message. Don’t share passwords, API keys, card details, or production credentials.
                </p>
              </form>
            </footer>
          </section>

          <aside className="border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
            <div>
              <div className="flex items-center gap-2">
                <CircleGauge className="h-4 w-4 text-sky-700" />
                <p className="text-sm font-semibold text-slate-950">Monthly allowance</p>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{usage.remaining}</p>
                  <p className="mt-1 text-xs text-slate-500">of {usage.limit} messages available</p>
                </div>
                <p className="text-xs font-semibold text-slate-500">{usagePercent}% used</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Resets {formatDate(usage.resetsAt)}. Assistant responses do not consume an extra message.</p>
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-semibold text-slate-950">What it can help with</p>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <li>Service and plan comparisons using current portal pricing</li>
                <li>SaaS architecture, MVP scope, and build phases</li>
                <li>Hosting, databases, AI workloads, storage, CDN, and automation</li>
                <li>Managed operations recommendations and implementation paths</li>
              </ul>
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Need account-specific help?</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                The advisor cannot inspect your services, billing, or account. Use Support for operational requests.
              </p>
              <Link href="/portal/support" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-700">
                Open Support
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <p className="mt-5 text-[11px] leading-5 text-slate-400">
              AI guidance can be inaccurate. Confirm the final configuration and price on the service order page or with our team before purchasing.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
