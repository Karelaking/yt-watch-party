"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface AnimatedCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  sublabel?: string;
  duration?: number;
}

export function AnimatedCounter({
  className,
  value,
  prefix = "",
  suffix = "+",
  decimals = 0,
  label,
  sublabel,
  duration = 2,
  ...props
}: AnimatedCounterProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const countRef = React.useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!countRef.current || !containerRef.current) return;

      const obj = { val: 0 };

      gsap.to(obj, {
        val: value,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
          once: true,
        },
        onUpdate: () => {
          if (countRef.current) {
            countRef.current.textContent =
              decimals > 0
                ? obj.val.toFixed(decimals)
                : Math.floor(obj.val).toLocaleString();
          }
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col items-center text-center p-4 select-none", className)}
      {...props}
    >
      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center justify-center">
        {prefix && <span>{prefix}</span>}
        <span ref={countRef}>0</span>
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
      {sublabel && <div className="text-xs text-zinc-400 dark:text-zinc-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}
