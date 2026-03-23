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
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const SOURCES = [
    { id: "simap",  label: "CH",  endpoint: "/api/sync" },
    { id: "ted",    label: "EU",  endpoint: "/api/sync/ted" },
    { id: "fts",    label: "UK",  endpoint: "/api/sync/fts" },
    { id: "sam",    label: "US",  endpoint: "/api/sync/sam" },
  ];

  async function handleSync(sourceId: string, endpoint: string) {
    setSyncing(sourceId);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.upserted !== undefined) {
        setLastSync(`${sourceId.toUpperCase()} ↑${data.upserted}`);
      } else if (data.error) {
        setLastSync(`${sourceId.toUpperCase()}: ${data.error.slice(0, 40)}`);
      }
    } catch {
      setLastSync("Error");
    } finally {
      setSyncing(null);
      setTimeout(() => setLastSync(null), 6000);
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

          {/* Sync controls */}
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="font-mono text-xs text-amber-400">
                {lastSync}
              </span>
            )}
            <div className="flex items-center gap-1 border border-zinc-800 rounded-md p-0.5">
              {SOURCES.map((src) => (
                <button
                  key={src.id}
                  onClick={() => handleSync(src.id, src.endpoint)}
                  disabled={syncing !== null}
                  title={`Sync ${src.label}`}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium transition-all",
                    syncing === src.id
                      ? "bg-amber-500/10 text-amber-400"
                      : syncing !== null
                      ? "text-zinc-600 cursor-not-allowed"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  {syncing === src.id && (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 animate-spin">
                      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5M13.5 2.5V6H10"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {src.label}
                </button>
              ))}
            </div>

            {/* Status dot */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 radar-pulse" />
              <span className="font-mono text-xs text-zinc-500">live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
