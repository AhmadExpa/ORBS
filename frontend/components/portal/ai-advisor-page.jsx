"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Layers3,
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

const ADVISOR_STARTERS = [
  {
    label: "Design a SaaS",
    description: "Architecture, tenancy, data, security, and scale.",
    prompt: "Design a secure SaaS architecture for a multi-tenant B2B application.",
    icon: Network,
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    label: "Size infrastructure",
    description: "Choose the right server, database, and deployment.",
    prompt: "Which managed server plan fits a production Node.js app with PostgreSQL?",
    icon: Server,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    label: "Structure an MVP",
    description: "Scope phases, priorities, delivery, and operations.",
    prompt: "Help me structure an MVP, deployment plan, and monthly managed services.",
    icon: Layers3,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    label: "Compare operations",
    description: "Evaluate self-hosted and fully managed approaches.",
    prompt: "Compare self-hosting with an ElevenOrbits managed deployment.",
    icon: ShieldCheck,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
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
      return <span key={key}>{part}</span>;
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

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] md:max-w-[74%]">
          <p className="mb-2 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">You</p>
          <div className="rounded-[20px] rounded-br-md bg-slate-950 px-5 py-3.5 text-sm leading-7 text-white shadow-[0_14px_30px_-20px_rgba(2,6,23,0.8)]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#0f172a,#1e3a5f)] text-white shadow-[0_12px_24px_-14px_rgba(15,23,42,0.8)]">
        <Network className="h-4 w-4" />
      </span>
      <div className="min-w-0 max-w-[860px] flex-1">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-950">ElevenOrbits Advisor</p>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            Catalog grounded
          </span>
        </div>

        <article className="rounded-[22px] rounded-tl-md border border-slate-200/90 bg-white px-5 py-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.38)] sm:px-6">
          <StructuredAdvisorText content={message.content} />
        </article>

        {message.recommendations?.length ? (
          <div className="mt-4">
            <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">Recommended managed services</p>
              <span className="text-[10px] font-medium text-slate-400">Based on current catalog</span>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              {message.recommendations.map((plan) => (
                <Link
                  key={plan.slug}
                  href={plan.orderUrl}
                  className="group flex min-h-[150px] flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_-28px_rgba(2,132,199,0.45)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                      <Server className="h-4 w-4" />
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {plan.priceLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">{plan.name}</p>
                  <p className="mt-1.5 flex-1 text-xs leading-5 text-slate-500">{plan.reason}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                    Review configuration
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {message.nextSteps?.length ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                <Layers3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-950">Recommended path forward</p>
                <p className="text-[10px] text-slate-400">A practical sequence for the next decision</p>
              </div>
            </div>
            <ol className="mt-4 grid gap-2.5 md:grid-cols-2">
              {message.nextSteps.map((step, index) => (
                <li key={`${message._id}-step-${index}`} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs leading-5 text-slate-600">{renderInlineAdvisorText(step, `${message._id}-step-${index}`)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {message.shouldContactTeam ? (
          <Link
            href="/portal/support"
            className="group mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[linear-gradient(135deg,#07111f,#0f172a)] px-5 py-4 text-left text-white shadow-[0_20px_45px_-30px_rgba(2,6,23,0.9)]"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sky-200">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Turn this plan into a managed quotation</span>
                <span className="mt-0.5 block text-xs text-white/50">Share the architecture with the ElevenOrbits team.</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-white/60 transition-transform group-hover:translate-x-1" />
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
  const activeConversation = conversations.find((conversation) => conversation._id === selectedId);
  const inputRef = useRef(null);

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

  function selectStarter(prompt) {
    setInput(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (overviewQuery.isLoading && !overviewQuery.data) {
    return <PageLoader title="AI Service Advisor" subtitle="Preparing your service and SaaS workspace…" cardCount={3} lines={4} />;
  }

  return (
    <div className="min-h-full bg-[#f3f5f8]">
      <div
        className="sticky z-30 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6"
        style={{ top: "var(--eo-topbar-top, 0px)" }}
      >
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#07111f,#1d4d76)] text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.9)]">
              <Network className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-sky-700">ElevenOrbits Intelligence</p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-[-0.025em] text-slate-950">AI Strategy Studio</h1>
              <p className="mt-0.5 hidden text-xs text-slate-500 md:block">Architecture, infrastructure, and managed-service planning in one focused workspace.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Live service catalog
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#0284c7 ${usagePercent}%, #e2e8f0 ${usagePercent}% 100%)` }}
              >
                <span className="h-6 w-6 rounded-full bg-white" />
              </span>
              <div className="pr-1">
                <p className="text-sm font-semibold leading-none text-slate-950">{usage.remaining} messages</p>
                <p className="mt-1 text-[10px] text-slate-400">Resets {formatDate(usage.resetsAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-12 h-80 w-80 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-48 h-96 w-96 rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1500px] p-3 sm:p-5 lg:p-6">
          {!configured ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              The AI Strategy Studio is not configured on the backend yet. Add the server-side OpenRouter key and restart the backend.
            </div>
          ) : null}

          <div className="grid overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_36px_100px_-50px_rgba(15,23,42,0.48)] lg:h-[calc(100dvh-13rem)] lg:min-h-[700px] lg:max-h-[940px] lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col border-b border-slate-800 bg-[linear-gradient(180deg,#07111f_0%,#020617_100%)] p-4 text-white lg:border-b-0 lg:border-r lg:p-5">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/55">Strategy sessions</p>
                  <p className="mt-1 text-xs text-white/40">Private conversation history</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/50">{conversations.length}</span>
              </div>

              <button
                type="button"
                onClick={handleNewConversation}
                disabled={creating || sending || !configured}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-[0_16px_30px_-18px_rgba(0,0,0,0.8)] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {creating ? "Creating session…" : "Start a new strategy"}
              </button>

              <div className="eo-scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-y-auto lg:pb-0">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    type="button"
                    onClick={() => {
                      setSelectedId(conversation._id);
                      setError("");
                    }}
                    className={cn(
                      "group min-w-[230px] rounded-xl border px-3.5 py-3.5 text-left transition lg:min-w-0 lg:w-full",
                      selectedId === conversation._id
                        ? "border-sky-300/25 bg-sky-300/10 text-white shadow-[inset_3px_0_0_#38bdf8]"
                        : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquareText className={cn("h-3.5 w-3.5 shrink-0", selectedId === conversation._id ? "text-sky-300" : "text-white/25 group-hover:text-white/50")} />
                      <p className="truncate text-sm font-semibold">{conversation.title}</p>
                    </div>
                    <p className="mt-1.5 truncate pl-[22px] text-[11px] text-white/35">{conversation.preview || "Ready for your first question"}</p>
                  </button>
                ))}
                {!conversations.length ? (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs leading-5 text-white/35">
                    Your saved strategy sessions will appear here.
                  </div>
                ) : null}
              </div>

              <div className="mt-5 hidden border-t border-white/10 pt-5 lg:block">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs font-semibold text-white/75">
                      <CircleGauge className="h-4 w-4 text-sky-300" />
                      Monthly allowance
                    </span>
                    <span className="text-xs font-semibold text-white">{usage.remaining}/{usage.limit}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${usagePercent}%` }} />
                  </div>
                  <p className="mt-2.5 text-[10px] leading-4 text-white/35">One customer message uses one credit. Advisor replies are included.</p>
                </div>
                <Link href="/portal/support" className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white">
                  Need account-specific help?
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>

            <section className="flex min-h-[720px] min-w-0 flex-col bg-[#f7f8fb] lg:min-h-0">
              <header className="shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700">
                      <MessageSquareText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{activeConversation?.title || "New strategy session"}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                        Advisor ready
                      </p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 shadow-sm sm:flex">
                    <Clock3 className="h-3.5 w-3.5" />
                    Thoughtful responses may take a moment
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex min-h-full w-full max-w-[980px] flex-col px-4 py-6 sm:px-7 sm:py-8">
                  {!messages.length && !pendingQuestion && !messagesQuery.isLoading ? (
                    <div className="my-auto py-6">
                      <div className="mx-auto max-w-3xl text-center">
                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                          <span className="absolute inset-0 rounded-full border border-sky-200 bg-white shadow-[0_22px_55px_-28px_rgba(2,132,199,0.55)]" />
                          <span className="absolute inset-2 rounded-full border border-dashed border-sky-200" />
                          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#07111f,#1d4d76)] text-white">
                            <Network className="h-5 w-5" />
                          </span>
                        </div>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-700">Plan with confidence</p>
                        <h2 className="mx-auto mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">From first idea to production-ready architecture.</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                          Describe what you want to build. The advisor will structure the product, map the technical stack, compare current ElevenOrbits services, and give you a practical path forward.
                        </p>
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        {ADVISOR_STARTERS.map((starter) => {
                          const StarterIcon = starter.icon;
                          return (
                            <button
                              key={starter.label}
                              type="button"
                              onClick={() => selectStarter(starter.prompt)}
                              className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_12px_30px_-26px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_20px_40px_-28px_rgba(2,132,199,0.38)]"
                            >
                              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", starter.tone)}>
                                <StarterIcon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-slate-950">{starter.label}</span>
                                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                                </span>
                                <span className="mt-1 block text-xs leading-5 text-slate-500">{starter.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        <span>Architecture</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Pricing</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Security</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Managed operations</span>
                      </div>
                    </div>
                  ) : null}

                  {messagesQuery.isLoading && selectedId && !messages.length ? (
                    <div className="my-auto flex flex-col items-center justify-center py-16 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sky-700 shadow-sm">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      </span>
                      <p className="mt-4 text-sm font-semibold text-slate-950">Opening strategy session</p>
                      <p className="mt-1 text-xs text-slate-500">Loading the conversation and recommendations…</p>
                    </div>
                  ) : null}

                  {messages.length || pendingQuestion || sending ? (
                    <div className="space-y-7">
                      {messages.map((message) => <AdvisorMessage key={message._id} message={message} />)}
                      {pendingQuestion ? (
                        <AdvisorMessage message={{ _id: "pending-user", role: "user", content: pendingQuestion }} />
                      ) : null}
                      {sending ? <AdvisorThinking /> : null}
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="shrink-0 border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
                <div className="mx-auto w-full max-w-[940px]">
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
                    <div className="rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100/70">
                      <div className="flex items-end gap-2">
                        <textarea
                          ref={inputRef}
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          maxLength={4000}
                          placeholder="Describe the product, service, or architecture you want to plan…"
                          disabled={sending || outOfCredits || !configured}
                          className="max-h-36 min-h-[52px] min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="submit"
                          aria-label="Send message"
                          disabled={sending || !input.trim() || outOfCredits || !configured}
                          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <span className="hidden sm:inline">Send</span>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 pb-1 pt-2">
                        <p className="text-[10px] leading-4 text-slate-400">One message per question · Never share credentials or payment details</p>
                        <p className="hidden text-[10px] text-slate-400 sm:block">Enter to send · Shift + Enter for a new line</p>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                      AI guidance can be inaccurate. Confirm final pricing and configuration before ordering.
                    </p>
                  </form>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
