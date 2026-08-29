"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export interface SocialProofProps extends React.HTMLAttributes<HTMLDivElement> {
  rating?: number;
  maxStars?: number;
  trustedCount?: string;
  avatarUrls?: string[];
}

export function SocialProof({
  className,
  rating = 4.9,
  maxStars = 5,
  trustedCount = "Trusted by 10,000+ Party Hosts & Streamers",
  ...props
}: SocialProofProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const stars = containerRef.current.querySelectorAll(".star-icon");
      const avatars = containerRef.current.querySelectorAll(".avatar-item");

      gsap.fromTo(
        avatars,
        { scale: 0, opacity: 0, x: -10 },
        {
          scale: 1,
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.4,
          ease: "back.out(2)",
          delay: 0.3,
        }
      );

      gsap.fromTo(
        stars,
        { scale: 0, opacity: 0, rotate: -30 },
        {
          scale: 1,
          opacity: 1,
          rotate: 0,
          stagger: 0.06,
          duration: 0.4,
          ease: "back.out(2)",
          delay: 0.5,
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col sm:flex-row items-center gap-3 select-none", className)}
      {...props}
    >
      {/* Avatar Stack */}
      <div className="flex -space-x-2.5 overflow-hidden p-0.5">
        <img
          className="avatar-item inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover shadow-xs"
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
          alt="Avatar 1"
        />
        <img
          className="avatar-item inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover shadow-xs"
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
          alt="Avatar 2"
        />
        <img
          className="avatar-item inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover shadow-xs"
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
          alt="Avatar 3"
        />
        <img
          className="avatar-item inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover shadow-xs"
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
          alt="Avatar 4"
        />
      </div>

      {/* Stars & Rating */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center text-amber-500">
          {Array.from({ length: maxStars }).map((_, i) => (
            <Star
              key={i}
              className="star-icon w-4 h-4 fill-amber-500 text-amber-500 stroke-[1.5]"
            />
          ))}
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-white ml-0.5">{rating}</span>
      </div>

      {/* Trust Text */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:pl-3">
        {trustedCount}
      </div>
    </div>
  );
}
