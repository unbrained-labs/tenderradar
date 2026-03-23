import Link from "next/link";
import { cn, formatValueRange, truncate } from "@/lib/utils";
import { getCantonName } from "@/lib/cantons";
import type { Tender, TenderMatch } from "@/lib/types";
import DeadlineBadge from "./deadline-badge";
import { CpvList } from "./cpv-badge";

interface TenderCardProps {
  tender: Tender | TenderMatch;
  variant?: "row" | "card";
  showMatch?: boolean;
}

function isMatch(t: Tender | TenderMatch): t is TenderMatch {
  return "match_score" in t;
}

export default function TenderCard({ tender, variant = "row", showMatch = false }: TenderCardProps) {
  const match = isMatch(tender) ? tender : null;

  if (variant === "card") {
    return (
      <Link href={`/tender/${tender.id}`}>
        <div className={cn(
          "group relative p-4 rounded-lg border transition-all duration-150",
          "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900",
          "animate-fade-in"
        )}>
          {/* Top row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {tender.issuer_region && (
                <span className="mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                  {tender.issuer_region}
                </span>
              )}
              <span className="text-xs text-zinc-500 truncate mono">{tender.issuer_name}</span>
            </div>
            {match && showMatch && (
              <MatchScore score={match.match_score} />
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white mb-2 leading-snug">
            {truncate(tender.title, 100)}
          </h3>

          {/* Description */}
          {tender.description && (
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              {truncate(tender.description, 120)}
            </p>
          )}

          {/* CPV codes */}
          <CpvList codes={tender.cpv_codes} limit={2} className="mb-3" />

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
            <span className="mono text-xs text-zinc-500">
              {formatValueRange(tender.estimated_value_min, tender.estimated_value_max, tender.currency)}
            </span>
            <DeadlineBadge date={tender.response_deadline} showDate={false} />
          </div>
        </div>
      </Link>
    );
  }

  // Row variant (table row)
  return (
    <tr className="group hover:bg-zinc-900/50 transition-colors cursor-pointer animate-fade-in">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {tender.issuer_region && (
            <span className="mono text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
              {tender.issuer_region}
            </span>
          )}
          <Link
            href={`/tender/${tender.id}`}
            className="text-sm font-medium text-zinc-200 hover:text-white hover:underline underline-offset-2 line-clamp-2 leading-snug"
          >
            {tender.title}
          </Link>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 ml-0 pl-0 mono">{tender.issuer_name}</p>
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <CpvList codes={tender.cpv_codes} limit={2} />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <span className="mono text-xs text-zinc-400">
          {formatValueRange(tender.estimated_value_min, tender.estimated_value_max, tender.currency)}
        </span>
      </td>
      <td className="py-3 px-4">
        <DeadlineBadge date={tender.response_deadline} />
      </td>
      {showMatch && match && (
        <td className="py-3 px-4">
          <MatchScore score={match.match_score} reasons={match.match_reasons} />
        </td>
      )}
      <td className="py-3 px-4">
        <StatusBadge status={tender.status} />
      </td>
    </tr>
  );
}

function MatchScore({ score, reasons }: { score: number; reasons?: string[] }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-green-400" : pct >= 40 ? "text-amber-400" : "text-zinc-400";
  return (
    <div className="flex items-center gap-1.5" title={reasons?.join(", ")}>
      <div className="w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-zinc-600")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("mono text-xs font-medium", color)}>{pct}%</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: "Active",    color: "text-green-400",  bg: "bg-green-950/50" },
    expired:   { label: "Expired",   color: "text-zinc-500",   bg: "bg-zinc-800/50" },
    cancelled: { label: "Cancelled", color: "text-red-400",    bg: "bg-red-950/50" },
    awarded:   { label: "Awarded",   color: "text-blue-400",   bg: "bg-blue-950/50" },
  };
  const { label, color, bg } = config[status] ?? config.active;
  return (
    <span className={cn("mono text-xs px-1.5 py-0.5 rounded font-medium", color, bg)}>
      {label}
    </span>
  );
}
