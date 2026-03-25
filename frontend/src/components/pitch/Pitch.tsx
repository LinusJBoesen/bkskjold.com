import { cn } from "@/lib/utils";
import { FormationSlot } from "./FormationSlot";
import { FORMATIONS, type DragData, type FormationType, type SlotAssignment } from "./formations";

interface PitchProps {
  formation: FormationType;
  assignments: (SlotAssignment | null)[];
  onSlotDrop?: (slotIndex: number, data: DragData) => void;
  onSlotClick?: (slotIndex: number) => void;
  onDragStart?: (data: DragData) => void;
  onRemovePlayer?: (data: DragData) => void;
  highlightSlots?: boolean;
  className?: string;
}

export function Pitch({ formation, assignments, onSlotDrop, onSlotClick, onDragStart, onRemovePlayer, highlightSlots, className }: PitchProps) {
  const slots = FORMATIONS[formation];

  const handlePitchDragOver = (e: React.DragEvent) => {
    // Allow dropping on the pitch background to remove players
    e.preventDefault();
  };

  return (
    <div
      data-testid="pitch"
      className={cn(
        "relative w-full aspect-[3/4] max-w-md mx-auto rounded-xl overflow-hidden",
        className
      )}
      onDragOver={handlePitchDragOver}
    >
      {/* Pitch background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 to-emerald-900" />

      {/* Field lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 300 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer boundary */}
        <rect x="10" y="10" width="280" height="380" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* Halfway line */}
        <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx="150" cy="200" r="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <circle cx="150" cy="200" r="2" fill="rgba(255,255,255,0.2)" />

        {/* Top penalty area */}
        <rect x="75" y="10" width="150" height="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <rect x="110" y="10" width="80" height="25" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <path d="M 110 70 Q 150 90 190 70" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />

        {/* Bottom penalty area */}
        <rect x="75" y="330" width="150" height="60" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <rect x="110" y="365" width="80" height="25" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <path d="M 110 330 Q 150 310 190 330" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />

        {/* Corner arcs */}
        <path d="M 10 20 Q 20 10 30 10" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        <path d="M 270 10 Q 280 10 290 20" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        <path d="M 10 380 Q 20 390 30 390" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
        <path d="M 270 390 Q 280 390 290 380" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
      </svg>

      {/* Formation slots */}
      <div className="absolute inset-0">
        {slots.map((slot) => {
          const assignment = assignments.find(
            (a) => a && a.slotIndex === slot.index && !a.isBench
          );
          return (
            <FormationSlot
              key={slot.index}
              slot={slot}
              assignment={assignment}
              onDrop={onSlotDrop}
              onClick={onSlotClick}
              onDragStart={onDragStart}
              highlight={highlightSlots && !assignment?.playerId}
            />
          );
        })}
      </div>
    </div>
  );
}
