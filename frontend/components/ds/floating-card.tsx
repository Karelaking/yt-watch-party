"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export interface FloatingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  rotate?: number;
  floatDelay?: number;
  floatDuration?: number;
  floatReverse?: boolean;
  enableTilt?: boolean;
}

export function FloatingCard({
  className,
  children,
  rotate = 0,
  floatReverse = false,
  enableTilt = true,
  style,
  ...props
}: FloatingCardProps): React.JSX.Element {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const rectRef = React.useRef<DOMRect | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (!enableTilt || !cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    if (!rectRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / (centerY || 1)) * -8;
    const rotateY = ((x - centerX) / (centerX || 1)) * 8;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      gsap.to(cardRef.current, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        scale: 1.02,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!enableTilt || !cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-4 shadow-xl shadow-zinc-950/5 dark:shadow-black/40 transition-shadow select-none",
        floatReverse ? "animate-float-reverse" : "animate-float",
        className
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}
