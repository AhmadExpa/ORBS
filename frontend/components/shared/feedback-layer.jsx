"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { subscribeToApiActivity } from "@/lib/api/client";
import { cn } from "@/lib/ui";

const ActionToastContext = createContext(null);
const LOADER_HIDE_DELAY_MS = 180;

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    label: "Success",
    panelClassName: "border-emerald-200 bg-white text-slate-950",
    iconClassName: "bg-emerald-100 text-emerald-700",
    badgeClassName: "bg-emerald-50 text-emerald-700",
  },
  error: {
    icon: XCircle,
    label: "Error",
    panelClassName: "border-rose-200 bg-white text-slate-950",
    iconClassName: "bg-rose-100 text-rose-700",
    badgeClassName: "bg-rose-50 text-rose-700",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    panelClassName: "border-amber-200 bg-white text-slate-950",
    iconClassName: "bg-amber-100 text-amber-700",
    badgeClassName: "bg-amber-50 text-amber-700",
  },
  info: {
    icon: BellRing,
    label: "Update",
    panelClassName: "border-sky-200 bg-white text-slate-950",
    iconClassName: "bg-sky-100 text-sky-700",
    badgeClassName: "bg-sky-50 text-sky-700",
  },
};

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const loaderTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const toastCleanupTimerRef = useRef(null);

  useEffect(() => subscribeToApiActivity(setPendingRequests), []);

  useEffect(() => {
    if (pendingRequests > 0) {
      if (loaderTimerRef.current) {
        window.clearTimeout(loaderTimerRef.current);
        loaderTimerRef.current = null;
      }

      setLoaderVisible(true);
      return;
    }

    if (!loaderVisible || loaderTimerRef.current) {
      return;
    }

    // Hold the overlay briefly so back-to-back API calls do not flash it off and on.
    loaderTimerRef.current = window.setTimeout(() => {
      setLoaderVisible(false);
      loaderTimerRef.current = null;
    }, LOADER_HIDE_DELAY_MS);
  }, [loaderVisible, pendingRequests]);

  useEffect(
    () => () => {
      if (loaderTimerRef.current) {
        window.clearTimeout(loaderTimerRef.current);
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (toastCleanupTimerRef.current) {
        window.clearTimeout(toastCleanupTimerRef.current);
      }
    },
    [],
  );

  const showToast = useCallback((payload) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    if (toastCleanupTimerRef.current) {
      window.clearTimeout(toastCleanupTimerRef.current);
    }

    const nextToast = {
      id: Date.now(),
      type: payload.type || "success",
      title: payload.title || "Action completed",
      description: payload.description || "",
      action: payload.action || "",
      duration: payload.duration ?? 2600,
    };

    setToast(nextToast);
    setToastVisible(true);

    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastCleanupTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastCleanupTimerRef.current = null;
      }, 220);
      toastTimerRef.current = null;
    }, nextToast.duration);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);
  const toastStyle = toast ? TOAST_STYLES[toast.type] || TOAST_STYLES.info : TOAST_STYLES.info;
  const ToastIcon = toastStyle.icon;

  return (
    <ActionToastContext.Provider value={contextValue}>
      {children}

      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[70] flex items-start justify-center p-6 pt-24 transition duration-300",
          loaderVisible ? "opacity-100" : "opacity-0",
        )}
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="overflow-hidden rounded-full border border-white/80 bg-white/90 px-3 py-3 shadow-[0_28px_90px_-45px_rgba(15,23,42,0.58)] ring-1 ring-slate-950/[0.04] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white">
              <LoaderCircle className="h-4 w-4 animate-spin" />
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
              <div className="loader-progress h-full rounded-full bg-slate-950" />
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/18 p-6 backdrop-blur-[2px] transition duration-300",
            toastVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "w-full max-w-md rounded-[34px] border px-6 py-6 shadow-[0_40px_140px_-45px_rgba(15,23,42,0.6)] transition duration-300",
              toastStyle.panelClassName,
              toastVisible ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
            )}
          >
            <div className="flex items-start gap-4">
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toastStyle.iconClassName)}>
                <ToastIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]", toastStyle.badgeClassName)}>
                    {toastStyle.label}
                  </span>
                  {toast.action ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {toast.action}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-2 text-sm leading-7 text-slate-600">{toast.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ActionToastContext.Provider>
  );
}

export function useActionToast() {
  const context = useContext(ActionToastContext);
  if (!context) {
    throw new Error("useActionToast must be used within FeedbackProvider.");
  }

  return context;
}
