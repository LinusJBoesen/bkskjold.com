import { cn } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";
import type { Position, SlotAssignment } from "./formations";

interface BenchAreaProps {
  slots: (SlotAssignment | null)[];
  className?: string;
}

const BENCH_SIZE = 3;

export function BenchArea({ slots, className }: BenchAreaProps) {
  const benchSlots = Array.from({ length: BENCH_SIZE }, (_, i) => slots[i] ?? null);

  return (
    <div
      data-testid="bench-area"
      className={cn(
        "flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3",
        className
      )}
    >
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider shrink-0">Bænk</span>
      <div className="flex items-center gap-6 flex-1 justify-center">
        {benchSlots.map((slot, i) => (
          <div
            key={i}
            data-testid={`bench-slot-${i}`}
            className="flex items-center justify-center"
          >
            {slot?.playerId ? (
              <PlayerCard
                name={slot.playerName || "Spiller"}
                position={slot.position}
                profilePicture={slot.profilePicture}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-600/40 bg-zinc-800/20 flex items-center justify-center">
                <span className="text-[10px] text-zinc-600">+</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
