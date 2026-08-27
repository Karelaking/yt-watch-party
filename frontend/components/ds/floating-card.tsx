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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    gsap.to(cardRef.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      scale: 1.03,
      boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.2)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!enableTilt || !cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.1)",
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/90 p-4 shadow-xl shadow-zinc-950/5 transition-shadow select-none",
        floatReverse ? "animate-float-reverse" : "animate-float",
        className
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}
