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

  const avatars = [
    { initials: "AK", bg: "bg-gradient-to-tr from-indigo-500 to-purple-500" },
    { initials: "ML", bg: "bg-gradient-to-tr from-pink-500 to-rose-500" },
    { initials: "JS", bg: "bg-gradient-to-tr from-amber-500 to-orange-500" },
    { initials: "RK", bg: "bg-gradient-to-tr from-emerald-500 to-teal-500" },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.from(".avatar-item, .star-icon", {
        scale: 0.8,
        opacity: 0.5,
        stagger: 0.04,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.1,
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col sm:flex-row items-center gap-3 select-none", className)}
      {...props}
    >
      {/* Avatar Stack with zero network dependency */}
      <div className="flex -space-x-2 overflow-hidden p-0.5">
        {avatars.map((av, idx) => (
          <div
            key={idx}
            className={cn(
              "avatar-item inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900 text-white font-bold text-[10px] shadow-xs select-none",
              av.bg
            )}
          >
            {av.initials}
          </div>
        ))}
      </div>

      {/* Stars & Rating */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center text-amber-500">
          {Array.from({ length: maxStars }).map((_, i) => (
            <Star
              key={i}
              className="star-icon w-3.5 h-3.5 fill-amber-500 text-amber-500 stroke-[1.5]"
            />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white ml-0.5">{rating}</span>
      </div>

      {/* Trust Text */}
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:pl-3">
        {trustedCount}
      </div>
    </div>
  );
}
