"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export interface StepCardProps extends React.HTMLAttributes<HTMLDivElement> {
  stepNumber: string | number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export function StepCard({
  className,
  stepNumber,
  title,
  description,
  icon,
  active = false,
  ...props
}: StepCardProps): React.JSX.Element {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: -6,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex flex-col p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs transition-shadow hover:shadow-xl hover:shadow-zinc-950/5 dark:hover:shadow-black/40 group select-none",
        active && "ring-2 ring-zinc-900 dark:ring-zinc-100 border-transparent",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Top step number badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black text-lg tracking-tight shadow-md group-hover:scale-110 transition-transform duration-300">
          {stepNumber}
        </div>
        {icon && <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{icon}</div>}
      </div>

      <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2 group-hover:text-black dark:group-hover:text-zinc-100">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
