import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { POSITION_LABELS, POSITION_NAMES, type DragData, type PlayerInfo, type Position } from "./formations";
import { Search, GripVertical } from "lucide-react";

interface PlayerPanelProps {
  players: PlayerInfo[];
  assignedPlayerIds: Set<string>;
  onRemovePlayer?: (data: DragData) => void;
  onPlayerTap?: (player: PlayerInfo) => void;
  selectedPlayerId?: string;
  className?: string;
}

const POSITION_BADGE_COLORS: Record<Position, string> = {
  keeper: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  defender: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  wing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  midfield: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  attacker: "bg-red-500/20 text-red-400 border-red-500/30",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PlayerPanel({ players, assignedPlayerIds, onRemovePlayer, onPlayerTap, selectedPlayerId, className }: PlayerPanelProps) {
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const available = players.filter((p) => !assignedPlayerIds.has(p.id));
  const filtered = search
    ? available.filter((p) => p.displayName.toLowerCase().includes(search.toLowerCase()))
    : available;

  const handlePanelDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handlePanelDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the panel entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw && onRemovePlayer) {
        const data: DragData = JSON.parse(raw);
        if (data.source === "pitch" || data.source === "bench") {
          onRemovePlayer(data);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      data-testid="player-panel"
      className={cn(
        "rounded-lg border bg-zinc-900/50 overflow-hidden transition-colors",
        dragOver ? "border-red-400/40 bg-red-400/5" : "border-zinc-800",
        className
      )}
      onDragOver={handlePanelDragOver}
      onDragLeave={handlePanelDragLeave}
      onDrop={handlePanelDrop}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-200">Tilgængelige spillere</h3>
          <span className="text-xs text-zinc-500">{available.length} ledige</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            data-testid="player-panel-search"
            placeholder="Søg spiller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Player list */}
      <div className="max-h-[400px] overflow-y-auto" data-testid="player-panel-list">
        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-zinc-500">
            {search ? "Ingen spillere fundet" : dragOver ? "Slip for at fjerne fra banen" : "Alle spillere er tildelt"}
          </div>
        ) : (
          filtered.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              onTap={onPlayerTap}
              isSelected={selectedPlayerId === player.id}
            />
          ))
        )}
      </div>

      {/* Drop hint when dragging from pitch */}
      {dragOver && (
        <div className="px-4 py-2 border-t border-red-400/20 bg-red-400/5 text-center">
          <span className="text-xs text-red-400">Slip her for at fjerne fra banen</span>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, onTap, isSelected }: { player: PlayerInfo; onTap?: (player: PlayerInfo) => void; isSelected?: boolean }) {
  const handleDragStart = (e: React.DragEvent) => {
    const data: DragData = {
      playerId: player.id,
      playerName: player.displayName,
      profilePicture: player.profilePicture,
      positions: player.positions,
      source: "panel",
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";

    // Ghost image opacity
    if (e.dataTransfer.setDragImage) {
      const el = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
    }
  };

  return (
    <div
      data-testid={`player-panel-row-${player.id}`}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onTap?.(player)}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2 cursor-grab active:cursor-grabbing hover:bg-white/[0.03] transition-colors select-none group",
        isSelected && "bg-emerald-500/10 border-l-2 border-emerald-400"
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
        {player.profilePicture ? (
          <img src={player.profilePicture} alt={player.displayName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-zinc-400">{getInitials(player.displayName)}</span>
        )}
      </div>

      {/* Name */}
      <span className="text-sm text-zinc-200 truncate flex-1">{player.displayName}</span>

      {/* Position badges */}
      <div className="flex gap-1 shrink-0">
        {player.positions.length > 0 ? (
          player.positions.map((pos) => (
            <span
              key={pos}
              className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                POSITION_BADGE_COLORS[pos]
              )}
            >
              {POSITION_LABELS[pos]}
            </span>
          ))
        ) : (
          <span className="text-[9px] text-zinc-600 px-1.5 py-0.5">—</span>
        )}
      </div>
    </div>
  );
}
