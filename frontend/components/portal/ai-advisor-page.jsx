"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  LifeBuoy,
  LoaderCircle,
  MessageSquareText,
  Network,
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

function renderInlineAdvisorText(value, keyPrefix) {
  return String(value || "")
    .split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/gu)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={key} className="font-semibold text-slate-950">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{part.slice(1, -1)}</code>;
      }
      return part;
    });
}

function StructuredAdvisorText({ content }) {
  const lines = String(content || "").replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/u);
    if (heading) {
      blocks.push({
        type: "heading",
        content: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/u.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/u.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/u, ""));
        index += 1;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (/^\d+[.)]\s+/u.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+[.)]\s+/u.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/u, ""));
        index += 1;
      }
      blocks.push({ type: "numbers", items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/u.test(lines[index].trim()) &&
      !/^[-*]\s+/u.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/u.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", content: paragraph.join(" ") });
  }

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700">
      {blocks.map((block, blockIndex) => {
        const blockKey = `advisor-block-${blockIndex}`;
        if (block.type === "heading") {
          return (
            <h3 key={blockKey} className="pt-1 text-[15px] font-semibold tracking-tight text-slate-950">
              {renderInlineAdvisorText(block.content, blockKey)}
            </h3>
          );
        }
        if (block.type === "bullets") {
          return (
            <ul key={blockKey} className="space-y-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-sky-600" />
                  <span>{renderInlineAdvisorText(item, `${blockKey}-${itemIndex}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "numbers") {
          return (
            <ol key={blockKey} className="space-y-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={`${blockKey}-${itemIndex}`} className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                    {itemIndex + 1}
                  </span>
                  <span>{renderInlineAdvisorText(item, `${blockKey}-${itemIndex}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={blockKey}>{renderInlineAdvisorText(block.content, blockKey)}</p>;
      })}
    </div>
  );
}

function AdvisorMessage({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[94%] md:max-w-[88%]", isUser ? "text-right" : "text-left")}>
        <div
          className={cn(
            "rounded-2xl shadow-sm",
            isUser
              ? "rounded-br-md bg-slate-950 px-4 py-3.5 text-sm leading-7 text-white"
              : "overflow-hidden rounded-bl-md border border-slate-200 bg-white",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">ElevenOrbits Advisor</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Architecture guidance</p>
                </div>
              </div>
              <div className="px-5 py-4">
                <StructuredAdvisorText content={message.content} />
              </div>
            </>
          )}
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
                  <span>{renderInlineAdvisorText(step, `${message._id}-step-${index}`)}</span>
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

function AdvisorThinking() {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="w-full max-w-[560px] overflow-hidden rounded-2xl rounded-bl-md border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Network className="h-4 w-4" />
            <LoaderCircle className="absolute -right-1 -top-1 h-4 w-4 animate-spin rounded-full bg-white text-sky-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">Building your recommendation</p>
            <p className="mt-0.5 text-xs text-slate-500">Reviewing architecture, pricing, and managed options</p>
          </div>
        </div>
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-3">
          {["Clarifying scope", "Checking catalog", "Preparing next steps"].map((label, index) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", index === 0 ? "animate-pulse bg-sky-600" : "bg-slate-300")} />
              <span className="text-[11px] font-medium text-slate-600">{label}</span>
            </div>
          ))}
        </div>
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
        trackActivity: false,
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
        trackActivity: false,
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

        <div className="grid min-h-[720px] overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_32px_100px_-48px_rgba(15,23,42,0.42)] xl:grid-cols-[288px_minmax(0,1fr)_300px]">
          <aside className="border-b border-slate-800 bg-[linear-gradient(180deg,#07111f_0%,#020617_100%)] p-5 text-white xl:border-b-0 xl:border-r">
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                  <Network className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Strategy workspace</p>
                  <p className="mt-0.5 text-[11px] text-white/45">Private to your account</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNewConversation}
              disabled={creating || sending || !configured}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating…" : "New conversation"}
            </button>

            <div className="mt-7 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Conversations</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/45">{conversations.length}</span>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 xl:block xl:max-h-[500px] xl:space-y-1.5 xl:overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => {
                    setSelectedId(conversation._id);
                    setError("");
                  }}
                  className={cn(
                    "min-w-[230px] rounded-xl border px-3.5 py-3.5 text-left transition xl:min-w-0 xl:w-full",
                    selectedId === conversation._id
                      ? "border-sky-300/25 bg-sky-300/10 text-white shadow-[inset_3px_0_0_#38bdf8]"
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

          <section className="flex min-h-[720px] min-w-0 flex-col bg-[#f5f7fb]">
            <header className="border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 shadow-sm">
                    <MessageSquareText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">ElevenOrbits Advisor</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                      Ready for service and SaaS planning
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-500">Responses may take a moment</span>
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
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
              {sending ? <AdvisorThinking /> : null}
              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-slate-200 bg-white p-4 sm:p-5">
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
                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100/70">
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
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
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

          <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 xl:border-l xl:border-t-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

            <div className="my-5 border-t border-slate-200" />

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

            <div className="my-5 border-t border-slate-200" />

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
