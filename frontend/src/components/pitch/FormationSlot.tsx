import { cn } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";
import { POSITION_LABELS, POSITION_NAMES, type FormationSlotDef, type SlotAssignment } from "./formations";

interface FormationSlotProps {
  slot: FormationSlotDef;
  assignment?: SlotAssignment | null;
}

export function FormationSlot({ slot, assignment }: FormationSlotProps) {
  const hasPlayer = assignment?.playerId;

  return (
    <div
      data-testid={`formation-slot-${slot.index}`}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {hasPlayer ? (
        <PlayerCard
          name={assignment.playerName || "Spiller"}
          position={slot.position}
          profilePicture={assignment.profilePicture}
        />
      ) : (
        <div
          data-testid={`empty-slot-${slot.index}`}
          className={cn(
            "flex flex-col items-center gap-1 select-none"
          )}
        >
          {/* Empty avatar placeholder */}
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-500/50 bg-zinc-800/30 flex items-center justify-center animate-pulse">
            <span className="text-xs font-bold text-zinc-500">{POSITION_LABELS[slot.position]}</span>
          </div>
          {/* Position label */}
          <div className="bg-zinc-900/50 border border-dashed border-zinc-600/50 rounded px-1.5 py-0.5 text-center backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 leading-tight">{POSITION_NAMES[slot.position]}</div>
          </div>
        </div>
      )}
    </div>
  );
}
