"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export interface HighlightHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  animateOnLoad?: boolean;
}

export function HighlightHeading({
  className,
  as: Component = "h1",
  children,
  animateOnLoad = true,
  ...props
}: HighlightHeadingProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!animateOnLoad || !containerRef.current) return;

      const animTargets = containerRef.current.querySelectorAll(".anim-chunk, .anim-word");
      if (animTargets.length > 0) {
        gsap.from(animTargets, {
          opacity: 0.2,
          y: 12,
          duration: 0.5,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.05,
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <Component
      ref={containerRef}
      className={cn(
        "font-bold tracking-tight text-zinc-900 dark:text-white",
        Component === "h1" && "text-3xl sm:text-4xl md:text-5xl lg:text-[50px] leading-[1.35] sm:leading-[1.4]",
        Component === "h2" && "text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.3]",
        Component === "h3" && "text-xl sm:text-2xl md:text-3xl leading-[1.3]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
