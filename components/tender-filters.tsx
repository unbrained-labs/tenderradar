"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { CANTONS } from "@/lib/cantons";
import { CPV_DIVISIONS } from "@/lib/cpv-codes";
import { cn } from "@/lib/utils";

export default function TenderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);

  // Read current filters from URL
  const keyword = searchParams.get("keyword") ?? "";
  const selectedCantons = searchParams.getAll("canton");
  const cpvPrefix = searchParams.get("cpv") ?? "";
  const valueMin = searchParams.get("value_min") ?? "";
  const valueMax = searchParams.get("value_max") ?? "";

  function updateParams(updates: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== "") {
        params.set(key, value);
      }
    }

    // Always reset to page 1 on filter change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleCanton(code: string) {
    const next = selectedCantons.includes(code)
      ? selectedCantons.filter((c) => c !== code)
      : [...selectedCantons, code];
    updateParams({ canton: next });
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters = keyword || selectedCantons.length > 0 || cpvPrefix || valueMin || valueMax;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
          >
            <path
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z"
              fill="currentColor"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tenders…"
            defaultValue={keyword}
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-lg border text-sm font-mono",
              "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-500",
              "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
              "transition-all"
            )}
            onChange={(e) => updateParams({ keyword: e.target.value })}
          />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-mono transition-all",
            open || hasFilters
              ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
          )}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74z"
              clipRule="evenodd"
            />
          </svg>
          Filters
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center">
              {[keyword, selectedCantons.length > 0, cpvPrefix, valueMin, valueMax].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm mono transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-5 animate-fade-in">
          {/* Cantons */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Canton
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CANTONS.map((canton) => (
                <button
                  key={canton.code}
                  onClick={() => toggleCanton(canton.code)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-mono font-medium border transition-all",
                    selectedCantons.includes(canton.code)
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  )}
                  title={canton.name}
                >
                  {canton.code}
                </button>
              ))}
            </div>
          </div>

          {/* CPV Division */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Sector (CPV Division)
            </label>
            <select
              value={cpvPrefix}
              onChange={(e) => updateParams({ cpv: e.target.value })}
              className={cn(
                "w-full sm:w-auto px-3 py-1.5 rounded border text-sm font-mono",
                "bg-zinc-800 border-zinc-700 text-zinc-200",
                "focus:outline-none focus:border-amber-500/50"
              )}
            >
              <option value="">All sectors</option>
              {Object.entries(CPV_DIVISIONS).map(([div, { label }]) => (
                <option key={div} value={div}>
                  {div} — {label}
                </option>
              ))}
            </select>
          </div>

          {/* Value range */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Estimated Value (CHF)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={valueMin}
                className={cn(
                  "w-32 px-3 py-1.5 rounded border text-sm font-mono",
                  "bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-600",
                  "focus:outline-none focus:border-amber-500/50"
                )}
                onBlur={(e) => updateParams({ value_min: e.target.value })}
              />
              <span className="text-zinc-600 mono text-sm">—</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={valueMax}
                className={cn(
                  "w-32 px-3 py-1.5 rounded border text-sm font-mono",
                  "bg-zinc-800 border-zinc-700 text-zinc-200 placeholder-zinc-600",
                  "focus:outline-none focus:border-amber-500/50"
                )}
                onBlur={(e) => updateParams({ value_max: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
