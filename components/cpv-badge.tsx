import { cn } from "@/lib/utils";
import { getCpvLabel, getCpvDivisionLabel } from "@/lib/cpv-codes";

interface CpvBadgeProps {
  code: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function CpvBadge({
  code,
  showLabel = true,
  size = "sm",
  className,
}: CpvBadgeProps) {
  const label = getCpvLabel(code);
  const division = getCpvDivisionLabel(code);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-mono",
        size === "sm"
          ? "px-1.5 py-0.5 text-xs"
          : "px-2 py-1 text-sm",
        "border-zinc-700 bg-zinc-800/60 text-zinc-300",
        className
      )}
      title={label}
    >
      <span className="text-amber-400/80">{code}</span>
      {showLabel && (
        <span className="text-zinc-400 truncate max-w-[160px]">
          {division}
        </span>
      )}
    </span>
  );
}

interface CpvListProps {
  codes: string[];
  limit?: number;
  className?: string;
}

export function CpvList({ codes, limit = 3, className }: CpvListProps) {
  if (!codes || codes.length === 0) return <span className="text-zinc-600 text-xs mono">—</span>;

  const visible = codes.slice(0, limit);
  const overflow = codes.length - limit;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visible.map((code) => (
        <CpvBadge key={code} code={code} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-500 text-xs mono">
          +{overflow}
        </span>
      )}
    </div>
  );
}
