import { cn, daysUntil, deadlineUrgency, formatDate } from "@/lib/utils";

interface DeadlineBadgeProps {
  date: string | null | undefined;
  showDate?: boolean;
  className?: string;
}

export default function DeadlineBadge({ date, showDate = true, className }: DeadlineBadgeProps) {
  const urgency = deadlineUrgency(date);
  const days = daysUntil(date);

  const config = {
    expired:  { color: "text-zinc-500",  bg: "bg-zinc-800/50",     label: "Expired" },
    critical: { color: "text-red-400",   bg: "bg-red-950/40",      label: days === 1 ? "1 day left" : `${days}d left` },
    warning:  { color: "text-orange-400",bg: "bg-orange-950/40",   label: `${days}d left` },
    ok:       { color: "text-green-400", bg: "bg-green-950/40",    label: `${days}d left` },
    none:     { color: "text-zinc-500",  bg: "bg-zinc-800/50",     label: "No deadline" },
  } as const;

  const { color, bg, label } = config[urgency];

  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-xs", className)}>
      {showDate && date && (
        <span className="text-zinc-400">{formatDate(date)}</span>
      )}
      <span className={cn("px-1.5 py-0.5 rounded font-medium", color, bg)}>
        {label}
      </span>
    </span>
  );
}
