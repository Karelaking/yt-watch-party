"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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
  duration = 1.5,
  ...props
}: AnimatedCounterProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = React.useState("0");

  React.useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setDisplayValue(decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString());
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();

            const step = (timestamp: number) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
              // easeOutExpo
              const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
              const currentVal = eased * value;
              setDisplayValue(decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toLocaleString());

              if (progress < 1) {
                animationFrame = requestAnimationFrame(step);
              }
            };
            animationFrame = requestAnimationFrame(step);
          }
        });
      },
      { rootMargin: "50px 0px" }
    );

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [value, decimals, duration]);

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col items-center text-center p-4 select-none", className)}
      {...props}
    >
      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center justify-center">
        {prefix && <span>{prefix}</span>}
        <span>{displayValue}</span>
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
      {sublabel && <div className="text-xs text-zinc-400 dark:text-zinc-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}
