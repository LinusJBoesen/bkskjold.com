import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";
import type { DragData, SlotAssignment } from "./formations";

interface BenchAreaProps {
  slots: (SlotAssignment | null)[];
  onDrop?: (benchIndex: number, data: DragData) => void;
  onDragStart?: (data: DragData) => void;
  className?: string;
}

const BENCH_SIZE = 3;

export function BenchArea({ slots, onDrop, onDragStart, className }: BenchAreaProps) {
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
          <BenchSlot
            key={i}
            index={i}
            slot={slot}
            onDrop={onDrop}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

function BenchSlot({
  index,
  slot,
  onDrop,
  onDragStart,
}: {
  index: number;
  slot: SlotAssignment | null;
  onDrop?: (benchIndex: number, data: DragData) => void;
  onDragStart?: (data: DragData) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw && onDrop) {
        onDrop(index, JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!slot?.playerId) return;
    const data: DragData = {
      playerId: slot.playerId,
      playerName: slot.playerName || "Spiller",
      profilePicture: slot.profilePicture,
      source: "bench",
      sourceSlotIndex: index,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(data);
  };

  return (
    <div
      data-testid={`bench-slot-${index}`}
      className={cn(
        "flex items-center justify-center rounded-lg p-1 transition-all",
        dragOver && "ring-2 ring-emerald-400/60 bg-emerald-400/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {slot?.playerId ? (
        <div draggable onDragStart={handleDragStart}>
          <PlayerCard
            name={slot.playerName || "Spiller"}
            position={slot.position}
            profilePicture={slot.profilePicture}
          />
        </div>
      ) : (
        <div className={cn(
          "w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
          dragOver
            ? "border-emerald-400/60 bg-emerald-400/10"
            : "border-zinc-600/40 bg-zinc-800/20"
        )}>
          <span className={cn(
            "text-[10px]",
            dragOver ? "text-emerald-400" : "text-zinc-600"
          )}>+</span>
        </div>
      )}
    </div>
  );
}
