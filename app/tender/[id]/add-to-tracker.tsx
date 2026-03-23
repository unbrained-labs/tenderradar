"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AddToTrackerButton({ tenderId }: { tenderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleAdd() {
    setState("loading");
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tender_id: tenderId, status: "new" }),
      });
      if (!res.ok) throw new Error("Failed");
      setState("done");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={state === "loading" || state === "done"}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm mono font-medium transition-all shrink-0",
        state === "done"
          ? "border-green-700 bg-green-950/40 text-green-400 cursor-default"
          : state === "error"
          ? "border-red-700 text-red-400"
          : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-500/60 hover:bg-amber-500/20"
      )}
    >
      {state === "done" ? (
        <>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          In Tracker
        </>
      ) : state === "loading" ? (
        <>
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Adding…
        </>
      ) : (
        <>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
          </svg>
          Track
        </>
      )}
    </button>
  );
}
