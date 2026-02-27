import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// SkillTag -- shows a skill name with a level indicator (1-5 filled dots)
// ---------------------------------------------------------------------------

interface SkillTagProps {
  name: string;
  /** Skill level from 1 to 5 */
  level: number;
  className?: string;
  /** Visual variant */
  variant?: "default" | "outline";
}

function LevelDots({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < level ? "bg-blue-500" : "bg-slate-300"
          )}
        />
      ))}
    </span>
  );
}

export function SkillTag({ name, level, className, variant = "default" }: SkillTagProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(level)));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variant === "default" && "bg-slate-100 text-slate-700",
        variant === "outline" && "border border-slate-200 text-slate-700 bg-white",
        className
      )}
      title={`${name} - Level ${clamped}/5`}
    >
      <span>{name}</span>
      <LevelDots level={clamped} />
      <span className="sr-only">Level {clamped} of 5</span>
    </span>
  );
}
