import { cn } from "@/lib/ui";

/**
 * Spinning ElevenOrbits swirl mark used as the app loader. The mark is white,
 * so it sits on a dark circular backdrop to stay visible on any surface.
 */
export function LogoSpinner({ size = 64, className }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-slate-900 shadow-[0_12px_30px_-10px_rgba(15,23,42,0.55)] ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/invoice.png"
        alt=""
        aria-hidden="true"
        className="animate-spin"
        style={{ width: size * 0.74, height: size * 0.74, animationDuration: "1.1s" }}
      />
    </span>
  );
}
