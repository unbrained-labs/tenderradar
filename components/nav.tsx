"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/",         label: "Feed",    shortcut: "F" },
  { href: "/matches",  label: "Matches", shortcut: "M" },
  { href: "/tracker",  label: "Tracker", shortcut: "T" },
  { href: "/profile",  label: "Profile", shortcut: "P" },
];

export default function Nav() {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET ?? "",
        },
      });
      const data = await res.json();
      if (data.upserted !== undefined) {
        setLastSync(`↑ ${data.upserted} new`);
      }
    } catch {
      setLastSync("Error");
    } finally {
      setSyncing(false);
      setTimeout(() => setLastSync(null), 5000);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-6 h-6">
              {/* Radar icon */}
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" stroke="#3f3f46" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="6"  stroke="#3f3f46" strokeWidth="1" />
                <circle cx="12" cy="12" r="2.5" fill="#f59e0b" className="radar-pulse" />
                <line x1="12" y1="12" x2="20" y2="5"
                  stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"
                  className="origin-center"
                />
              </svg>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-zinc-50 group-hover:text-amber-400 transition-colors">
              TenderRadar
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    active
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sync button */}
          <div className="flex items-center gap-3">
            {lastSync && (
              <span className="mono text-xs text-amber-400 animate-fade-in">
                {lastSync}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium border transition-all",
                syncing
                  ? "border-amber-500/30 text-amber-400/50 cursor-not-allowed"
                  : "border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400"
              )}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className={cn("w-3.5 h-3.5", syncing && "animate-spin")}
              >
                <path
                  d="M13.5 8A5.5 5.5 0 1 1 8 2.5M13.5 2.5V6H10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {syncing ? "Syncing…" : "Sync"}
            </button>

            {/* Status dot */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 radar-pulse" />
              <span className="mono text-xs text-zinc-500">live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
