import Image from "next/image";
import { cn } from "@/lib/ui";

const sizeMap = {
  sm: {
    frame: "w-[152px] rounded-[2rem] p-3",
    image: "w-[108px]",
  },
  md: {
    frame: "w-[208px] rounded-[2.2rem] p-4",
    image: "w-[148px]",
  },
  lg: {
    frame: "w-[272px] rounded-[2.5rem] p-5",
    image: "w-[194px]",
  },
};

export function OrbMascot({
  className,
  frameClassName,
  imageClassName,
  textClassName,
  size = "md",
  eyebrow = "",
  title = "",
  description = "",
  badge = "",
  align = "left",
  priority = false,
}) {
  const styles = sizeMap[size] || sizeMap.md;
  const hasText = Boolean(eyebrow || title || description || badge);

  return (
    <div
      className={cn(
        "flex gap-5",
        hasText ? "flex-col" : "inline-flex",
        align === "center" && hasText ? "items-center text-center" : "",
        align === "left" && hasText ? "sm:flex-row sm:items-center" : "",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-end justify-center overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_48%,#fff3e8_100%)] shadow-[0_26px_70px_-46px_rgba(15,23,42,0.26)]",
          styles.frame,
          frameClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(255,255,255,0)_64%)]" />
        <div className="pointer-events-none absolute inset-x-6 bottom-3 h-6 rounded-full bg-slate-950/12 blur-xl" />
        <Image
          src="/orbs.png"
          alt="Orbs by ElevenOrbits"
          width={1024}
          height={1536}
          priority={priority}
          className={cn("relative h-auto object-contain drop-shadow-[0_18px_38px_rgba(15,23,42,0.16)]", styles.image, imageClassName)}
        />
      </div>

      {hasText ? (
        <div className={cn("min-w-0 space-y-3", align === "center" ? "max-w-xl text-center" : "", textClassName)}>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{eyebrow}</p> : null}
          {title ? <p className="text-2xl font-semibold tracking-tight text-slate-950">{title}</p> : null}
          {description ? <p className="text-sm leading-7 text-slate-600">{description}</p> : null}
          {badge ? (
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
              {badge}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
