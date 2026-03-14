"use client";

import Image from "next/image";
import { cn } from "@/lib/ui";

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
  src = "/logo.png",
  alt = "ElevenOrbits",
  width = 1019,
  height = 284,
}) {
  return (
    <div className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(max-width: 768px) 180px, 240px"
        className={cn("h-full w-auto object-contain", imageClassName)}
      />
    </div>
  );
}
