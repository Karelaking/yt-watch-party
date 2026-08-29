"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import gsap from "gsap";
export interface PillButtonProps extends ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  magnetic?: boolean;
  pulse?: boolean;
  confettiOnClick?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      className,
      children,
      variant = "default",
      magnetic = false,
      pulse = false,
      confettiOnClick = false,
      icon,
      iconPosition = "right",
      onClick,
      ...props
    },
    ref
  ): React.JSX.Element => {
    const buttonRef = React.useRef<HTMLButtonElement | null>(null);
    const rectRef = React.useRef<DOMRect | null>(null);

    // Merge internal ref with forwarded ref
    const handleRef = (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleMouseEnter = () => {
      if (!magnetic || !buttonRef.current) return;
      rectRef.current = buttonRef.current.getBoundingClientRect();
    };

    // Magnetic cursor tracking (only when magnetic is explicitly true)
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !buttonRef.current) return;
      if (!rectRef.current) {
        rectRef.current = buttonRef.current.getBoundingClientRect();
      }
      const rect = rectRef.current;
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(buttonRef.current, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleMouseLeave = () => {
      rectRef.current = null;
      if (!magnetic || !buttonRef.current) return;
      gsap.to(buttonRef.current, {
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (confettiOnClick) {
        try {
          const confettiModule = await import("canvas-confetti");
          const confetti = confettiModule.default || confettiModule;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;

          confetti({
            particleCount: 35,
            spread: 55,
            origin: { x, y },
            colors: ["#000000", "#71717a", "#ef4444", "#3b82f6"],
          });
        } catch {
          // Ignore confetti error gracefully
        }
      }

      onClick?.(e);
    };

    const baseStyles =
      variant === "default"
        ? "bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-6 py-2.5 shadow-md shadow-zinc-900/10 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-95 transition-all duration-200 border border-zinc-800"
        : variant === "outline"
        ? "bg-white hover:bg-zinc-50 text-zinc-900 rounded-full px-6 py-2.5 border border-zinc-300 shadow-sm hover:border-zinc-400 active:scale-95 transition-all duration-200"
        : "rounded-full px-5 py-2";

    return (
      <Button
        ref={handleRef}
        variant={variant}
        className={cn(
          baseStyles,
          pulse && "animate-pulse-subtle",
          "font-medium text-sm gap-2 cursor-pointer",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="inline-flex">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === "right" && <span className="inline-flex">{icon}</span>}
      </Button>
    );
  }
);

PillButton.displayName = "PillButton";
