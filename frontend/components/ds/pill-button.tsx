"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import confetti from "canvas-confetti";

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
      magnetic = true,
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

    // Merge internal ref with forwarded ref
    const handleRef = (node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Magnetic cursor tracking
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!magnetic || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(buttonRef.current, {
        x: x * 0.22,
        y: y * 0.22,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      if (!magnetic || !buttonRef.current) return;
      gsap.to(buttonRef.current, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.4)",
      });
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (confettiOnClick) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x, y },
          colors: ["#000000", "#71717a", "#ef4444", "#3b82f6"],
        });
      }

      // Micro bounce effect on click
      if (buttonRef.current) {
        gsap.timeline()
          .to(buttonRef.current, { scale: 0.95, duration: 0.1, ease: "power1.inOut" })
          .to(buttonRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });
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
