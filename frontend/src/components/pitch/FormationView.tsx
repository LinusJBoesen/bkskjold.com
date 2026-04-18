import { useState, useCallback } from "react";
import { Pitch } from "./Pitch";
import { BenchArea } from "./BenchArea";
import { FormationSelector } from "./FormationSelector";
import { PlayerPanel } from "./PlayerPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { Save, RotateCcw, X } from "lucide-react";
import {
  FORMATIONS,
  type DragData,
  type FormationType,
  type PlayerInfo,
  type Position,
  type SlotAssignment,
} from "./formations";

interface FormationViewProps {
  players: PlayerInfo[];
  matchId?: string;
  teamNumber: number;
  initialFormation?: FormationType;
  initialAssignments?: SlotAssignment[];
  formationId?: string;
  readOnly?: boolean;
  onSaved?: () => void;
}

export function FormationView({
  players,
  matchId,
  teamNumber,
  initialFormation = "1-2-3-1",
  initialAssignments,
  formationId: existingFormationId,
  readOnly = false,
  onSaved,
}: FormationViewProps) {
  const [formation, setFormation] = useState<FormationType>(initialFormation);
  const [assignments, setAssignments] = useState<SlotAssignment[]>(initialAssignments ?? []);
  const [formationId, setFormationId] = useState<string | undefined>(existingFormationId);
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const { toast } = useToast();

  const assignedPlayerIds = new Set(
    assignments.filter((a) => a.playerId).map((a) => a.playerId!)
  );

  const pitchAssignments = assignments.filter((a) => !a.isBench);
  const benchAssignments = assignments.filter((a) => a.isBench);

  const handleSlotDrop = useCallback(
    (slotIndex: number, data: DragData) => {
      setAssignments((prev) => {
        const next = prev.filter(
          (a) =>
            // Remove from source
            !(data.source === "pitch" && a.slotIndex === data.sourceSlotIndex && !a.isBench) &&
            !(data.source === "bench" && a.slotIndex === data.sourceSlotIndex && a.isBench) &&
            // Remove existing player at target slot
            !(a.slotIndex === slotIndex && !a.isBench)
        );

        // If there was a player at the target slot and source was pitch, swap them
        const targetOccupant = prev.find((a) => a.slotIndex === slotIndex && !a.isBench);
        if (targetOccupant?.playerId && data.source === "pitch" && data.sourceSlotIndex !== undefined) {
          const sourceSlot = FORMATIONS[formation][data.sourceSlotIndex];
          next.push({
            ...targetOccupant,
            slotIndex: data.sourceSlotIndex,
            position: sourceSlot?.position ?? targetOccupant.position,
            isBench: false,
          });
        }

        const slot = FORMATIONS[formation][slotIndex];
        next.push({
          slotIndex,
          playerId: data.playerId,
          playerName: data.playerName,
          profilePicture: data.profilePicture,
          position: slot?.position ?? "midfield",
          isBench: false,
        });

        return next;
      });
    },
    [formation]
  );

  const handleBenchDrop = useCallback(
    (benchIndex: number, data: DragData) => {
      setAssignments((prev) => {
        const next = prev.filter(
          (a) =>
            !(data.source === "pitch" && a.slotIndex === data.sourceSlotIndex && !a.isBench) &&
            !(data.source === "bench" && a.slotIndex === data.sourceSlotIndex && a.isBench) &&
            !(a.slotIndex === benchIndex && a.isBench)
        );

        // Swap if bench slot was occupied
        const targetOccupant = prev.find((a) => a.slotIndex === benchIndex && a.isBench);
        if (targetOccupant?.playerId && data.source === "bench" && data.sourceSlotIndex !== undefined) {
          next.push({
            ...targetOccupant,
            slotIndex: data.sourceSlotIndex,
            isBench: true,
          });
        }

        next.push({
          slotIndex: benchIndex,
          playerId: data.playerId,
          playerName: data.playerName,
          profilePicture: data.profilePicture,
          position: data.positions?.[0] ?? "midfield",
          isBench: true,
        });

        return next;
      });
    },
    []
  );

  const handleRemovePlayer = useCallback((data: DragData) => {
    setAssignments((prev) =>
      prev.filter(
        (a) =>
          !(data.source === "pitch" && a.slotIndex === data.sourceSlotIndex && !a.isBench) &&
          !(data.source === "bench" && a.slotIndex === data.sourceSlotIndex && a.isBench)
      )
    );
  }, []);

  // Tap-to-assign: select a player from panel, then tap a slot
  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (!selectedPlayer) return;
      const data: DragData = {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.displayName,
        profilePicture: selectedPlayer.profilePicture,
        positions: selectedPlayer.positions,
        source: "panel",
      };
      handleSlotDrop(slotIndex, data);
      setSelectedPlayer(null);
    },
    [selectedPlayer, handleSlotDrop]
  );

  const handlePlayerTap = useCallback((player: PlayerInfo) => {
    setSelectedPlayer((prev) => (prev?.id === player.id ? null : player));
  }, []);

  const handleFormationChange = useCallback(
    (newFormation: FormationType) => {
      setFormation(newFormation);
      // Re-map assignments to new formation slots
      const newSlots = FORMATIONS[newFormation];
      setAssignments((prev) => {
        const pitchPlayers = prev.filter((a) => !a.isBench && a.playerId);
        const benchPlayers = prev.filter((a) => a.isBench);
        const remapped: SlotAssignment[] = [];

        // Try to fit pitch players into new formation slots
        const used = new Set<string>();
        for (const slot of newSlots) {
          // Find a player that matches this position
          const match = pitchPlayers.find(
            (a) => !used.has(a.playerId!) && a.position === slot.position
          );
          if (match) {
            used.add(match.playerId!);
            remapped.push({ ...match, slotIndex: slot.index, position: slot.position, isBench: false });
          }
        }
        // Assign remaining players to empty slots
        for (const player of pitchPlayers) {
          if (!used.has(player.playerId!)) {
            const emptySlot = newSlots.find(
              (s) => !remapped.some((r) => r.slotIndex === s.index)
            );
            if (emptySlot) {
              used.add(player.playerId!);
              remapped.push({ ...player, slotIndex: emptySlot.index, position: emptySlot.position, isBench: false });
            }
          }
        }

        return [...remapped, ...benchPlayers];
      });
    },
    []
  );

  const handleReset = () => {
    setAssignments([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const slots = assignments.map((a) => ({
        slotIndex: a.slotIndex,
        playerId: a.playerId,
        position: a.position,
        isBench: a.isBench,
      }));

      if (formationId) {
        await api.put(`/formations/${formationId}`, { formation, slots });
      } else {
        const res = await api.post<{ id: string }>("/formations", {
          matchId,
          teamNumber,
          formation,
          slots,
        });
        setFormationId(res.id);
      }
      toast("Opstilling gemt — spillere kan nu se opstillingen", "success");
      onSaved?.();
    } catch {
      toast("Kunne ikke gemme opstilling", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="formation-view" className="space-y-4">
      {/* Header with formation selector + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <FormationSelector value={formation} onChange={readOnly ? () => {} : handleFormationChange} />
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              data-testid="formation-reset"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Nulstil
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              data-testid="formation-save"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Gemmer..." : "Gem opstilling"}
            </Button>
          </div>
        )}
      </div>

      {/* Selected player indicator (mobile tap-to-assign) — only in edit mode */}
      {!readOnly && selectedPlayer && (
        <div
          data-testid="selected-player-indicator"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-300 lg:hidden"
        >
          <span>Tryk på en plads for at placere <strong>{selectedPlayer.displayName}</strong></span>
          <button onClick={() => setSelectedPlayer(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pitch + Player Panel side by side (panel hidden in readOnly) */}
      <div className={readOnly ? "space-y-3" : "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4"}>
        <div className="space-y-3">
          <Pitch
            formation={formation}
            assignments={pitchAssignments}
            onSlotDrop={readOnly ? undefined : handleSlotDrop}
            onSlotClick={!readOnly && selectedPlayer ? handleSlotClick : undefined}
            onRemovePlayer={readOnly ? undefined : handleRemovePlayer}
            highlightSlots={!readOnly && !!selectedPlayer}
          />
          <BenchArea
            slots={benchAssignments}
            onDrop={readOnly ? undefined : handleBenchDrop}
          />
        </div>
        {!readOnly && (
          <PlayerPanel
            players={players}
            assignedPlayerIds={assignedPlayerIds}
            onRemovePlayer={handleRemovePlayer}
            onPlayerTap={handlePlayerTap}
            selectedPlayerId={selectedPlayer?.id}
          />
        )}
      </div>
    </div>
  );
}

/** Auto-assign players to formation slots based on preferred positions */
export function autoAssign(
  players: { id: string; displayName: string; profilePicture?: string | null; positions: Position[] }[],
  formation: FormationType
): SlotAssignment[] {
  const slots = FORMATIONS[formation];
  const assignments: SlotAssignment[] = [];
  const assigned = new Set<string>();

  // Priority: exact position match
  for (const slot of slots) {
    const match = players.find(
      (p) => !assigned.has(p.id) && p.positions.includes(slot.position)
    );
    if (match) {
      assigned.add(match.id);
      assignments.push({
        slotIndex: slot.index,
        playerId: match.id,
        playerName: match.displayName,
        profilePicture: match.profilePicture,
        position: slot.position,
        isBench: false,
      });
    }
  }

  // Fill remaining slots with closest position match
  const CLOSE_POSITIONS: Record<Position, Position[]> = {
    keeper: [],
    defender: ["midfield"],
    wing: ["attacker", "midfield"],
    midfield: ["defender", "wing"],
    attacker: ["wing", "midfield"],
  };

  for (const slot of slots) {
    if (assignments.some((a) => a.slotIndex === slot.index)) continue;
    const close = CLOSE_POSITIONS[slot.position] ?? [];
    const match = players.find(
      (p) => !assigned.has(p.id) && close.some((c) => p.positions.includes(c))
    );
    if (match) {
      assigned.add(match.id);
      assignments.push({
        slotIndex: slot.index,
        playerId: match.id,
        playerName: match.displayName,
        profilePicture: match.profilePicture,
        position: slot.position,
        isBench: false,
      });
    }
  }

  // Fill any remaining slots with any unassigned player
  for (const slot of slots) {
    if (assignments.some((a) => a.slotIndex === slot.index)) continue;
    const remaining = players.find((p) => !assigned.has(p.id));
    if (remaining) {
      assigned.add(remaining.id);
      assignments.push({
        slotIndex: slot.index,
        playerId: remaining.id,
        playerName: remaining.displayName,
        profilePicture: remaining.profilePicture,
        position: slot.position,
        isBench: false,
      });
    }
  }

  // Remaining players go to bench (up to 3)
  const unassigned = players.filter((p) => !assigned.has(p.id));
  for (let i = 0; i < Math.min(3, unassigned.length); i++) {
    assignments.push({
      slotIndex: i,
      playerId: unassigned[i].id,
      playerName: unassigned[i].displayName,
      profilePicture: unassigned[i].profilePicture,
      position: unassigned[i].positions[0] ?? "midfield",
      isBench: true,
    });
  }

  return assignments;
}
