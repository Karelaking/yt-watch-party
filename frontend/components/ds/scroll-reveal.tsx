"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  threshold?: string;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  distance = 36,
  duration = 0.8,
  delay = 0,
  stagger = 0.08,
  threshold = "top 85%",
  ...props
}: ScrollRevealProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const getInitialOffsets = () => {
        switch (direction) {
          case "up":
            return { y: distance, x: 0 };
          case "down":
            return { y: -distance, x: 0 };
          case "left":
            return { x: distance, y: 0 };
          case "right":
            return { x: -distance, y: 0 };
          case "none":
          default:
            return { x: 0, y: 0 };
        }
      };

      const offsets = getInitialOffsets();
      const elements = containerRef.current.children.length > 1
        ? containerRef.current.children
        : containerRef.current;

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          ...offsets,
          scale: direction === "none" ? 0.95 : 1,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: threshold,
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
}
