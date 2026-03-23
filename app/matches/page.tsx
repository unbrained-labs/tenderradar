import { sql, rawQuery } from "@/lib/db";
import type { Tender, Profile, TenderMatch } from "@/lib/types";
import TenderCard from "@/components/tender-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  // Load profile
  const profileRows = await sql`SELECT * FROM profile LIMIT 1`;
  const profile = profileRows[0] as Profile | undefined;

  if (!profile || (
    (profile.cpv_codes as string[]).length === 0 &&
    (profile.cantons as string[]).length === 0 &&
    (profile.keywords as string[]).length === 0
  )) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Matches</h1>
          <p className="text-sm text-zinc-500 mt-0.5 mono">Tenders matched to your profile</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-zinc-800">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-zinc-600">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Profile not configured</p>
          <p className="text-zinc-600 text-xs mt-1 mono">Set up your company profile to see matched tenders</p>
          <Link
            href="/profile"
            className="mt-4 px-4 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm mono hover:border-amber-500/60 transition-all"
          >
            Set Up Profile →
          </Link>
        </div>
      </div>
    );
  }

  // Build matching query
  const cpvCodes = profile.cpv_codes as string[];
  const cantons  = profile.cantons as string[];
  const keywords = profile.keywords as string[];

  // Fetch active tenders that match at least one criterion
  const conditions: string[] = ["t.status = 'active'"];
  const orConditions: string[] = [];
  const values: (string | number)[] = [];
  let p = 1;

  // CPV match
  if (cpvCodes.length > 0) {
    const cpvChecks = cpvCodes.map((code) => {
      values.push(`${code.slice(0, 2)}%`);
      return `EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.cpv_codes) c WHERE c LIKE $${p++})`;
    });
    orConditions.push(`(${cpvChecks.join(" OR ")})`);
  }

  // Canton match
  if (cantons.length > 0) {
    const list = cantons.map(() => `$${p++}`).join(", ");
    orConditions.push(`t.issuer_region IN (${list})`);
    values.push(...cantons);
  }

  // Keyword match
  if (keywords.length > 0) {
    const kwChecks = keywords.map((kw) => {
      values.push(`%${kw}%`);
      return `(t.title ILIKE $${p} OR t.description ILIKE $${p++})`;
    });
    orConditions.push(`(${kwChecks.join(" OR ")})`);
  }

  if (orConditions.length > 0) {
    conditions.push(`(${orConditions.join(" OR ")})`);
  }

  // Value range filter
  if (profile.value_min) {
    conditions.push(`(t.estimated_value_max IS NULL OR t.estimated_value_max >= $${p++})`);
    values.push(Number(profile.value_min));
  }
  if (profile.value_max) {
    conditions.push(`(t.estimated_value_min IS NULL OR t.estimated_value_min <= $${p++})`);
    values.push(Number(profile.value_max));
  }

  const where = conditions.join(" AND ");

  const dataRows = await rawQuery<Record<string, unknown>>(
    `SELECT id, source_id, title, description, issuer_name, issuer_region,
            cpv_codes, posted_date, response_deadline,
            estimated_value_min, estimated_value_max, currency,
            status, source_url, attachments, contacts, created_at, updated_at
     FROM tenders t
     WHERE ${where}
     ORDER BY
       CASE WHEN response_deadline IS NULL THEN 1 ELSE 0 END,
       response_deadline ASC
     LIMIT 100`,
    values
  );

  // Score and sort
  const matches: TenderMatch[] = dataRows.map((row) => {
    const tender = row as unknown as Tender;
    const reasons: string[] = [];
    let score = 0;

    // CPV match (+0.5 per matching division)
    const tenderCpvs = Array.isArray(row.cpv_codes) ? row.cpv_codes as string[] : [];
    let cpvHits = 0;
    for (const profileCode of cpvCodes) {
      const div = profileCode.slice(0, 2);
      if (tenderCpvs.some((tc) => (tc as string).startsWith(div))) {
        cpvHits++;
      }
    }
    if (cpvHits > 0) {
      score += Math.min(0.5, cpvHits * 0.15);
      reasons.push(`${cpvHits} CPV match${cpvHits > 1 ? "es" : ""}`);
    }

    // Canton match (+0.3)
    if (row.issuer_region && cantons.includes(String(row.issuer_region))) {
      score += 0.3;
      reasons.push(`Canton match: ${row.issuer_region}`);
    }

    // Keyword match (+0.1 per keyword hit)
    const text = `${row.title ?? ""} ${row.description ?? ""}`.toLowerCase();
    let kwHits = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        kwHits++;
      }
    }
    if (kwHits > 0) {
      score += Math.min(0.2, kwHits * 0.05);
      reasons.push(`${kwHits} keyword match${kwHits > 1 ? "es" : ""}`);
    }

    return { ...tender, match_score: Math.min(1, score), match_reasons: reasons };
  });

  // Sort by score descending
  matches.sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Matches</h1>
          <p className="text-sm text-zinc-500 mt-0.5 mono">
            {matches.length} tender{matches.length !== 1 ? "s" : ""} matched for{" "}
            <span className="text-zinc-300">{profile.company_name || "your profile"}</span>
          </p>
        </div>
        <Link
          href="/profile"
          className="text-xs mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Edit profile →
        </Link>
      </div>

      {/* Profile summary */}
      <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
        {cpvCodes.map((code) => (
          <span key={code} className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs mono text-amber-400">
            {code.slice(0, 2)}×
          </span>
        ))}
        {cantons.map((c) => (
          <span key={c} className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs mono text-zinc-300">
            {c}
          </span>
        ))}
        {keywords.map((kw) => (
          <span key={kw} className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-xs mono text-zinc-400">
            &quot;{kw}&quot;
          </span>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-zinc-500 text-sm">No matches yet</p>
          <p className="text-zinc-700 text-xs mt-1 mono">Sync more tenders or broaden your profile</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tender</th>
                <th className="hidden md:table-cell">CPV</th>
                <th className="hidden lg:table-cell">Value</th>
                <th>Deadline</th>
                <th>Match</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="stagger">
              {matches.map((tender) => (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  variant="row"
                  showMatch
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
