import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerCard } from "./PlayerCard";
import { POSITION_LABELS, POSITION_NAMES, type DragData, type FormationSlotDef, type SlotAssignment } from "./formations";

interface FormationSlotProps {
  slot: FormationSlotDef;
  assignment?: SlotAssignment | null;
  onDrop?: (slotIndex: number, data: DragData) => void;
  onClick?: (slotIndex: number) => void;
  onDragStart?: (data: DragData) => void;
  highlight?: boolean;
}

export function FormationSlot({ slot, assignment, onDrop, onClick, onDragStart, highlight }: FormationSlotProps) {
  const [dragOver, setDragOver] = useState(false);
  const [positionMatch, setPositionMatch] = useState<boolean | null>(null);
  const hasPlayer = assignment?.playerId;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);

    try {
      const raw = e.dataTransfer.types.includes("application/json");
      if (raw) {
        // We can't read data during dragover in HTML5 DnD, so just show generic highlight
        setPositionMatch(null);
      }
    } catch {
      // ignore
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
    setPositionMatch(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setPositionMatch(null);

    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw && onDrop) {
        const data: DragData = JSON.parse(raw);
        // Check position match for visual feedback
        const matches = data.positions?.includes(slot.position) ?? false;
        setPositionMatch(matches);
        setTimeout(() => setPositionMatch(null), 600);
        onDrop(slot.index, data);
      }
    } catch {
      // ignore invalid data
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!hasPlayer || !assignment) return;
    const data: DragData = {
      playerId: assignment.playerId!,
      playerName: assignment.playerName || "Spiller",
      profilePicture: assignment.profilePicture,
      source: "pitch",
      sourceSlotIndex: slot.index,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(data);
  };

  return (
    <div
      data-testid={`formation-slot-${slot.index}`}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150",
        dragOver && "scale-110",
        highlight && "scale-105",
        onClick && "cursor-pointer"
      )}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onClick?.(slot.index)}
    >
      {/* Drop zone glow */}
      {dragOver && (
        <div className="absolute inset-0 -m-2 rounded-xl border-2 border-emerald-400/60 bg-emerald-400/10 animate-pulse pointer-events-none" />
      )}

      {/* Position match indicator */}
      {positionMatch === false && (
        <div className="absolute inset-0 -m-2 rounded-xl border-2 border-amber-400/60 bg-amber-400/10 pointer-events-none" />
      )}

      {hasPlayer ? (
        <div
          draggable
          onDragStart={handleDragStart}
        >
          <PlayerCard
            name={assignment.playerName || "Spiller"}
            position={slot.position}
            profilePicture={assignment.profilePicture}
          />
        </div>
      ) : (
        <div
          data-testid={`empty-slot-${slot.index}`}
          className="flex flex-col items-center gap-1 select-none"
        >
          <div className={cn(
            "w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
            dragOver || highlight
              ? "border-emerald-400/60 bg-emerald-400/10"
              : "border-zinc-500/50 bg-zinc-800/30 animate-pulse"
          )}>
            <span className={cn(
              "text-xs font-bold",
              dragOver || highlight ? "text-emerald-400" : "text-zinc-500"
            )}>{POSITION_LABELS[slot.position]}</span>
          </div>
          <div className="bg-zinc-900/50 border border-dashed border-zinc-600/50 rounded px-1.5 py-0.5 text-center backdrop-blur-sm">
            <div className="text-[10px] text-zinc-500 leading-tight">{POSITION_NAMES[slot.position]}</div>
          </div>
        </div>
      )}
    </div>
  );
}
