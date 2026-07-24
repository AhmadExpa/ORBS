"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ui";

const EXIT_DURATION_MS = 240;

function useMenuPresence(open) {
  const [rendered, setRendered] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return undefined;
    }

    if (!rendered) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setRendered(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [open, rendered]);

  return rendered;
}

export function AnimatedMenuButton({
  open,
  onClick,
  className,
  controls,
  label = open ? "Close menu" : "Open menu",
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md",
        className,
      )}
    >
      <span className="relative block h-5 w-5" aria-hidden>
        <span
          className={cn(
            "absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-y-0 rotate-45" : "-translate-y-[6px]",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-current transition-[transform,opacity] duration-200",
            open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-y-0 -rotate-45" : "translate-y-[6px]",
          )}
        />
      </span>
    </button>
  );
}

export function FullScreenMobileMenu({
  open,
  onClose,
  id,
  label,
  className,
  children,
  breakpointClassName = "xl:hidden",
  desktopMinWidth = 1280,
}) {
  const [mounted, setMounted] = useState(false);
  const rendered = useMenuPresence(open);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    function handleResize() {
      if (window.innerWidth >= desktopMinWidth) {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [desktopMinWidth, open]);

  if (!mounted || !rendered) {
    return null;
  }

  return createPortal(
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      data-state={open ? "open" : "closed"}
      className={cn(
        "eo-mobile-menu fixed inset-0 z-[100] overflow-x-hidden overflow-y-auto",
        breakpointClassName,
        className,
      )}
      {...(!open ? { inert: "" } : {})}
    >
      {children}
    </div>,
    document.body,
  );
}
