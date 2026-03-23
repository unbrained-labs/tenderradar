"use client";

import { useState, useEffect } from "react";
import { CANTONS } from "@/lib/cantons";
import { CPV_CODES, CPV_DIVISIONS } from "@/lib/cpv-codes";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({
    company_name: "",
    cpv_codes: [],
    cantons: [],
    keywords: [],
    value_min: null,
    value_max: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [activeDiv, setActiveDiv] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleCpv(code: string) {
    const current = profile.cpv_codes ?? [];
    setProfile({
      ...profile,
      cpv_codes: current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code],
    });
  }

  function toggleCanton(code: string) {
    const current = profile.cantons ?? [];
    setProfile({
      ...profile,
      cantons: current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code],
    });
  }

  function addKeyword() {
    const kw = newKeyword.trim();
    if (!kw) return;
    const current = profile.keywords ?? [];
    if (!current.includes(kw)) {
      setProfile({ ...profile, keywords: [...current, kw] });
    }
    setNewKeyword("");
  }

  function removeKeyword(kw: string) {
    setProfile({
      ...profile,
      keywords: (profile.keywords ?? []).filter((k) => k !== kw),
    });
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-zinc-900 rounded" />
        <div className="h-64 bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Profile</h1>
          <p className="text-sm text-zinc-500 mt-0.5 mono">
            Define what you&apos;re looking for. Used to power the Matches view.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm mono font-medium transition-all",
            saved
              ? "border-green-700 bg-green-950/40 text-green-400"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-500/60"
          )}
        >
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {/* Company Name */}
      <Section title="Company">
        <input
          type="text"
          value={profile.company_name ?? ""}
          onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
          placeholder="Your company name"
          className={cn(
            "w-full px-3 py-2 rounded-lg border text-sm",
            "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600",
            "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          )}
        />
      </Section>

      {/* CPV Codes */}
      <Section
        title="CPV Codes"
        description={`${(profile.cpv_codes ?? []).length} selected — defines which sectors you work in`}
      >
        {/* Division tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveDiv(null)}
            className={cn(
              "px-2.5 py-1 rounded text-xs mono font-medium border transition-all",
              !activeDiv
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            )}
          >
            All
          </button>
          {Object.entries(CPV_DIVISIONS).map(([div, { label }]) => (
            <button
              key={div}
              onClick={() => setActiveDiv(activeDiv === div ? null : div)}
              className={cn(
                "px-2.5 py-1 rounded text-xs mono font-medium border transition-all",
                activeDiv === div
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              )}
            >
              {div} {label}
            </button>
          ))}
        </div>

        {/* CPV code list */}
        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
          {CPV_CODES
            .filter((c) => !activeDiv || c.division === activeDiv)
            .map((cpv) => {
              const selected = (profile.cpv_codes ?? []).includes(cpv.code);
              return (
                <label
                  key={cpv.code}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all",
                    selected ? "bg-amber-500/8 border border-amber-500/20" : "hover:bg-zinc-900 border border-transparent"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCpv(cpv.code)}
                    className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 accent-amber-500 shrink-0"
                  />
                  <span className="mono text-xs text-amber-400/80 shrink-0">{cpv.code}</span>
                  <span className="text-xs text-zinc-300 truncate">{cpv.label}</span>
                </label>
              );
            })}
        </div>
      </Section>

      {/* Cantons */}
      <Section
        title="Cantons"
        description={`${(profile.cantons ?? []).length} selected — where you can take on work`}
      >
        <div className="flex flex-wrap gap-1.5">
          {CANTONS.map((canton) => {
            const selected = (profile.cantons ?? []).includes(canton.code);
            return (
              <button
                key={canton.code}
                onClick={() => toggleCanton(canton.code)}
                title={canton.name}
                className={cn(
                  "px-2.5 py-1.5 rounded border text-xs mono font-medium transition-all",
                  selected
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                )}
              >
                {canton.code}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-600 mt-2 mono">
          Leave empty to see tenders from all cantons
        </p>
      </Section>

      {/* Keywords */}
      <Section
        title="Keywords"
        description="Terms that appear in relevant tenders"
      >
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="e.g. SCADA, avalanche, tunnel…"
            className={cn(
              "flex-1 px-3 py-2 rounded-lg border text-sm mono",
              "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600",
              "focus:outline-none focus:border-amber-500/50"
            )}
          />
          <button
            onClick={addKeyword}
            className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm mono transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(profile.keywords ?? []).map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800 text-xs mono text-zinc-300"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="text-zinc-600 hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          {(profile.keywords ?? []).length === 0 && (
            <span className="text-xs text-zinc-700 mono">No keywords yet</span>
          )}
        </div>
      </Section>

      {/* Value Range */}
      <Section
        title="Contract Value Range (CHF)"
        description="Filter out tenders too small or too large"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs mono text-zinc-500 mb-1">Minimum</label>
            <input
              type="number"
              value={profile.value_min ?? ""}
              onChange={(e) => setProfile({ ...profile, value_min: e.target.value ? Number(e.target.value) : null })}
              placeholder="0"
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm mono",
                "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600",
                "focus:outline-none focus:border-amber-500/50"
              )}
            />
          </div>
          <span className="text-zinc-600 mt-5">—</span>
          <div className="flex-1">
            <label className="block text-xs mono text-zinc-500 mb-1">Maximum</label>
            <input
              type="number"
              value={profile.value_max ?? ""}
              onChange={(e) => setProfile({ ...profile, value_max: e.target.value ? Number(e.target.value) : null })}
              placeholder="No limit"
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm mono",
                "bg-zinc-900 border-zinc-700 text-zinc-200 placeholder-zinc-600",
                "focus:outline-none focus:border-amber-500/50"
              )}
            />
          </div>
        </div>
      </Section>

      {/* Save button (bottom) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className={cn(
            "px-6 py-2.5 rounded-lg border text-sm mono font-medium transition-all",
            saved
              ? "border-green-700 bg-green-950/40 text-green-400"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-500/60 hover:bg-amber-500/15"
          )}
        >
          {saved ? "✓ Profile Saved" : saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        {description && <p className="text-xs text-zinc-500 mono mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}
