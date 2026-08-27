"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  iconBg?: string;
  tag?: string;
  title: string;
  description: string;
  preview?: React.ReactNode;
  span?: "col-span-1" | "col-span-2" | "col-span-3" | "row-span-2";
}

export function BentoCard({
  className,
  icon: Icon,
  iconBg = "bg-zinc-100 text-zinc-900",
  tag,
  title,
  description,
  preview,
  span = "col-span-1",
  children,
  ...props
}: BentoCardProps): React.JSX.Element {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!cardRef.current) return;

      const previewEl = cardRef.current.querySelector(".bento-preview-slot");
      if (previewEl) {
        gsap.fromTo(
          previewEl,
          { opacity: 0, scale: 0.93, y: 16 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      }
    },
    { scope: cardRef }
  );

  const handleMouseEnter = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1.15,
        rotate: 6,
        duration: 0.3,
        ease: "back.out(2)",
      });
    }
  };

  const handleMouseLeave = () => {
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1,
        rotate: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/90 shadow-xs hover:shadow-xl hover:shadow-zinc-950/5 transition-all duration-300 hover:-translate-y-1 select-none",
        span,
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Background soft radial glow on hover */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-zinc-100/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        {Icon && (
          <div
            ref={iconRef}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200/70 shadow-xs",
              iconBg
            )}
          >
            <Icon className="h-6 w-6 stroke-[1.75]" />
          </div>
        )}
        {tag && (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200">
            {tag}
          </span>
        )}
      </div>

      {/* Preview Graphic Slot */}
      {preview && (
        <div className="bento-preview-slot relative z-10 my-6 flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
          {preview}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 mt-6 space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-zinc-900 group-hover:text-black">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>

      {children}
    </div>
  );
}
