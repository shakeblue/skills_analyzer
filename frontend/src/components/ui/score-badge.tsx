import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ScoreBadge -- displays a 0-100 score with color-coded background
// ---------------------------------------------------------------------------

interface ScoreBadgeProps {
  score: number;
  className?: string;
  /** Render the score as a compact pill (default) or a larger card-style badge */
  size?: "sm" | "md";
}

function getScoreColor(score: number) {
  if (score >= 80) return { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-600/20" };
  if (score >= 60) return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-600/20" };
  if (score >= 40) return { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-600/20" };
  return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-600/20" };
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Low";
}

export function ScoreBadge({ score, className, size = "sm" }: ScoreBadgeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColor(clamped);
  const label = getScoreLabel(clamped);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold ring-1 ring-inset",
        colors.bg,
        colors.text,
        colors.ring,
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
      title={`${clamped}/100 - ${label}`}
      role="status"
      aria-label={`Score: ${clamped} out of 100, rated ${label}`}
    >
      {clamped}
    </span>
  );
}
