import * as React from "react";
import Link from "next/link";
import { Play, ArrowLeft } from "lucide-react";

export default function GlobalNotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white mx-auto flex items-center justify-center font-bold">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">404</h1>
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Page Not Found</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            The page or stream you are looking for does not exist or has been removed.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
