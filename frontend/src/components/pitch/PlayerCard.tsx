import { cn } from "@/lib/utils";
import { POSITION_LABELS, type Position } from "./formations";

interface PlayerCardProps {
  name: string;
  position: Position;
  profilePicture?: string | null;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const POSITION_COLORS: Record<Position, string> = {
  keeper: "bg-amber-500/80 text-amber-950",
  defender: "bg-blue-500/80 text-blue-950",
  wing: "bg-emerald-500/80 text-emerald-950",
  midfield: "bg-purple-500/80 text-purple-950",
  attacker: "bg-red-500/80 text-red-950",
};

export function PlayerCard({ name, position, profilePicture, className }: PlayerCardProps) {
  return (
    <div
      data-testid={`player-card-${name.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none",
        className
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full border-2 border-zinc-600 bg-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
        {profilePicture ? (
          <img src={profilePicture} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-zinc-300">{getInitials(name)}</span>
        )}
      </div>
      {/* Name + position badge */}
      <div className="bg-zinc-900/90 border border-zinc-700 rounded px-1.5 py-0.5 text-center shadow-md backdrop-blur-sm max-w-[80px]">
        <div className="text-[10px] font-medium text-zinc-100 truncate leading-tight">{name}</div>
        <span
          className={cn(
            "inline-block text-[9px] font-bold rounded px-1 leading-relaxed mt-0.5",
            POSITION_COLORS[position]
          )}
        >
          {POSITION_LABELS[position]}
        </span>
      </div>
    </div>
  );
}
