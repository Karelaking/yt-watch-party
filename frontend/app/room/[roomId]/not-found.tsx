import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Tv } from "lucide-react";

export default function RoomNotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-2xl">
        <div className="h-12 w-12 rounded-full bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
          <Tv className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Watch Room Not Found</h2>
          <p className="text-xs text-zinc-400">
            This room code does not exist, has expired, or was closed by the host.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
