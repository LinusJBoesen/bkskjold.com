export type Position = "keeper" | "defender" | "wing" | "midfield" | "attacker";

export interface FormationSlotDef {
  index: number;
  position: Position;
  x: number; // percentage from left
  y: number; // percentage from top
  label: string; // Danish abbreviation
}

export interface SlotAssignment {
  slotIndex: number;
  playerId: string | null;
  playerName?: string;
  profilePicture?: string | null;
  position: Position;
  isBench: boolean;
}

export const POSITION_LABELS: Record<Position, string> = {
  keeper: "K",
  defender: "F",
  wing: "Ka",
  midfield: "C",
  attacker: "A",
};

export const POSITION_NAMES: Record<Position, string> = {
  keeper: "Målmand",
  defender: "Forsvar",
  wing: "Kant",
  midfield: "Central",
  attacker: "Angriber",
};

export const FORMATION_TYPES = ["1-2-3-1", "1-3-2-1", "1-3-3"] as const;
export type FormationType = (typeof FORMATION_TYPES)[number];

export const FORMATIONS: Record<FormationType, FormationSlotDef[]> = {
  "1-2-3-1": [
    { index: 0, position: "keeper", x: 50, y: 90, label: "K" },
    { index: 1, position: "defender", x: 30, y: 70, label: "F" },
    { index: 2, position: "defender", x: 70, y: 70, label: "F" },
    { index: 3, position: "wing", x: 15, y: 45, label: "Ka" },
    { index: 4, position: "midfield", x: 50, y: 45, label: "C" },
    { index: 5, position: "wing", x: 85, y: 45, label: "Ka" },
    { index: 6, position: "attacker", x: 50, y: 15, label: "A" },
  ],
  "1-3-2-1": [
    { index: 0, position: "keeper", x: 50, y: 90, label: "K" },
    { index: 1, position: "defender", x: 25, y: 70, label: "F" },
    { index: 2, position: "defender", x: 50, y: 70, label: "F" },
    { index: 3, position: "defender", x: 75, y: 70, label: "F" },
    { index: 4, position: "midfield", x: 35, y: 45, label: "C" },
    { index: 5, position: "midfield", x: 65, y: 45, label: "C" },
    { index: 6, position: "attacker", x: 50, y: 15, label: "A" },
  ],
  "1-3-3": [
    { index: 0, position: "keeper", x: 50, y: 90, label: "K" },
    { index: 1, position: "defender", x: 25, y: 70, label: "F" },
    { index: 2, position: "defender", x: 50, y: 70, label: "F" },
    { index: 3, position: "defender", x: 75, y: 70, label: "F" },
    { index: 4, position: "wing", x: 20, y: 35, label: "Ka" },
    { index: 5, position: "midfield", x: 50, y: 35, label: "C" },
    { index: 6, position: "wing", x: 80, y: 35, label: "Ka" },
  ],
};
