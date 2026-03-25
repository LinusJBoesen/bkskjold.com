import { cn } from "@/lib/utils";
import { FORMATION_TYPES, type FormationType } from "./formations";

interface FormationSelectorProps {
  value: FormationType;
  onChange: (formation: FormationType) => void;
  className?: string;
}

export function FormationSelector({ value, onChange, className }: FormationSelectorProps) {
  return (
    <div
      data-testid="formation-selector"
      className={cn("flex items-center gap-2", className)}
    >
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Formation</span>
      <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/50 overflow-hidden">
        {FORMATION_TYPES.map((f) => (
          <button
            key={f}
            data-testid={`formation-option-${f}`}
            onClick={() => onChange(f)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              value === f
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            )}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
