# Skjold Bode Formation Builder — PRD

## Goal

Build a Football Manager / FIFA-style visual formation and lineup builder for 7-a-side training matches. Coaches can assign player positions, choose formations, drag-and-drop players onto a visual pitch, and manage bench slots — all integrated with Spond availability data.

## Feature Overview

### Player Positions
Each player can be assigned one or more preferred positions:
- **Keeper** (K) — Goalkeeper
- **Forsvar** (F) — Defender
- **Kant** (Ka) — Wing
- **Central** (C) — Central midfielder
- **Angriber** (A) — Attacker

Players can have multiple positions (e.g., a player might play both Wing and Attacker). Positions are stored in the database and managed via admin settings.

### Formations (7-a-side)
Three formations available:

1. **1-2-3-1** — 1 Keeper, 2 Defenders, 2 Wings + 1 Central Mid, 1 Attacker
2. **1-3-2-1** — 1 Keeper, 3 Defenders, 2 Central Mids, 1 Attacker
3. **1-3-3** — 1 Keeper, 3 Defenders, 2 Wings + 1 Central Mid (no dedicated attacker)

### Visual Pitch
A top-down football pitch with:
- Field lines (center circle, penalty areas, halfway line)
- Player cards positioned at formation slots
- Empty slots shown as dashed placeholders with position label
- Cards show: player name, position badge, profile picture (or initials)
- Dark green pitch aesthetic matching the app's dark theme

### Drag and Drop
- Drag players from the available player list onto pitch slots
- Drag players between positions on the pitch
- Drag players to/from the bench
- Visual feedback: highlight valid drop zones, ghost card while dragging
- Use HTML5 Drag and Drop API (no external library needed)

### Bench
- 3 bench slots below the pitch
- Players on bench are available but not in the starting formation
- For training there are no substitutions — bench is just overflow/rotation tracking

### Player Source
- **Spond integration**: Players who accepted the next training/match event are auto-loaded
- **Manual add**: Button to add players who didn't reply on Spond (from all active players list)
- Shows availability status indicator for each player

### Integration with Existing Team Selector
- The formation view is a new tab/mode alongside the existing team generator
- After teams are generated (Team 1 / Team 2), each team can be viewed in formation mode
- Formation assignments are per-match, not permanent (but player position preferences persist)

---

## Rounds

### Round 1: Database + API — Player Positions & Formations

**Backend changes:**

- [ ] Add `player_positions` table: `player_id TEXT, position TEXT ('keeper'|'defender'|'wing'|'midfield'|'attacker'), PRIMARY KEY (player_id, position)`
- [ ] Add `lineup_formations` table: `id TEXT PRIMARY KEY, match_id TEXT, team_number INTEGER (1 or 2), formation TEXT ('1-2-3-1'|'1-3-2-1'|'1-3-3'), created_at TEXT`
- [ ] Add `lineup_slots` table: `formation_id TEXT, slot_index INTEGER, player_id TEXT, position TEXT, is_bench INTEGER DEFAULT 0, PRIMARY KEY (formation_id, slot_index)`
- [ ] Add migration for new tables in `db/migrate.ts`
- [ ] API routes for player positions:
  - `GET /api/players/:id/positions` — get player's positions
  - `PUT /api/players/:id/positions` — set player's positions (body: `{ positions: string[] }`)
  - `GET /api/players/positions` — get all players with their positions
- [ ] API routes for formations:
  - `POST /api/formations` — create/save a formation (body: `{ matchId?, teamNumber, formation, slots: [{slotIndex, playerId, position, isBench}] }`)
  - `GET /api/formations/:matchId/:teamNumber` — get saved formation for a match team
  - `PUT /api/formations/:id` — update formation (change formation type or slot assignments)
  - `DELETE /api/formations/:id` — delete formation
- [ ] Formation slot definitions (which positions go where for each formation type):
  ```
  1-2-3-1: [keeper, defender, defender, wing, midfield, wing, attacker]
  1-3-2-1: [keeper, defender, defender, defender, midfield, midfield, attacker]
  1-3-3:   [keeper, defender, defender, defender, wing, midfield, wing]
  ```
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): formation builder backend — positions, formations, lineups API`

### Round 2: Frontend — Pitch Component & Formation Rendering

**Build the visual pitch and formation display:**

- [ ] Create `frontend/src/components/pitch/` directory:
  - `Pitch.tsx` — The football pitch SVG/div with field markings (dark green)
  - `FormationSlot.tsx` — A position slot on the pitch (empty or filled with player card)
  - `PlayerCard.tsx` — Small card showing player name, position badge, avatar
  - `BenchArea.tsx` — Bench row below the pitch with 3 slots
  - `FormationSelector.tsx` — Dropdown/tabs to switch between the 3 formations
- [ ] Pitch layout: CSS grid or absolute positioning to place slots according to formation
  - Each formation defines x,y coordinates (as percentages) for its 7 slots
  - Pitch is responsive (scales with container width, maintains aspect ratio)
- [ ] Formation slot positions (approximate % from top-left of pitch):
  ```
  1-2-3-1:
    Keeper:     (50%, 90%)
    Def left:   (30%, 70%)
    Def right:  (70%, 70%)
    Wing left:  (15%, 45%)
    Mid center: (50%, 45%)
    Wing right: (85%, 45%)
    Attacker:   (50%, 15%)

  1-3-2-1:
    Keeper:     (50%, 90%)
    Def left:   (25%, 70%)
    Def center: (50%, 70%)
    Def right:  (75%, 70%)
    Mid left:   (35%, 45%)
    Mid right:  (65%, 45%)
    Attacker:   (50%, 15%)

  1-3-3:
    Keeper:     (50%, 90%)
    Def left:   (25%, 70%)
    Def center: (50%, 70%)
    Def right:  (75%, 70%)
    Wing left:  (20%, 35%)
    Mid center: (50%, 35%)
    Wing right: (80%, 35%)
  ```
- [ ] Player cards on pitch: dark bg, rounded, shows name + position abbreviation + avatar
- [ ] Empty slots: dashed border, position abbreviation label, subtle pulse animation
- [ ] Add Danish strings to `i18n/da.ts` for all new UI text
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): formation pitch component with visual field and player cards`

### Round 3: Frontend — Drag and Drop & Player Panel

**Make it interactive:**

- [ ] Create `PlayerPanel.tsx` — sidebar/drawer listing available players
  - Shows players from Spond who accepted (auto-loaded)
  - "Tilføj spiller" (Add player) button to add from all active players not yet in lineup
  - Each player row: avatar, name, position badges, drag handle
  - Players already on pitch/bench are grayed out or hidden
  - Search/filter by name
- [ ] Implement HTML5 Drag and Drop:
  - Drag from player panel → drop on pitch slot or bench slot
  - Drag from pitch slot → drop on another pitch slot (swap)
  - Drag from pitch slot → drop on bench (move to bench)
  - Drag from bench → drop on pitch slot (move to pitch)
  - Drag from pitch/bench → drop back on player panel (remove from lineup)
- [ ] Drop zone validation:
  - Highlight valid drop zones when dragging (green glow)
  - Show position compatibility indicator (player's preferred positions vs slot position)
  - Allow dropping on any slot regardless of position (flexibility), but show warning color if position mismatch
- [ ] Visual drag feedback:
  - Dragged card shows as semi-transparent ghost
  - Drop target highlights with border glow
  - Smooth transition when card lands
- [ ] Add `data-testid` attributes on all interactive elements
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): drag and drop formation builder with player panel`

### Round 4: Integration — Team Selector + Formation View + Position Admin

**Wire everything together:**

- [ ] Add "Formation" tab/toggle in the team selector page
  - After generating teams, user can switch to formation view for Team 1 or Team 2
  - Players from generated team auto-populate the formation (best-fit based on positions)
  - User can then rearrange via drag-and-drop
- [ ] Auto-assignment logic: when switching to formation view, assign players to slots based on their preferred positions (best fit algorithm)
- [ ] Add player position management in admin settings:
  - New section "Spillerpositioner" (Player Positions)
  - List all players with checkboxes for each position
  - Bulk-save positions
- [ ] Save/load formations:
  - "Gem opstilling" (Save lineup) button saves to backend
  - When returning to a match, load saved formation if exists
- [ ] Manual player add:
  - "Tilføj spiller" opens a modal/dropdown with all active players not in the current lineup
  - Added players appear in the player panel ready to be dragged onto the pitch
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): formation builder integration with team selector and admin`

### Round 5: Polish, E2E Tests & Edge Cases

**Final polish and test coverage:**

- [ ] Add E2E tests for formation feature:
  - `specs/formations/pitch-display.spec.ts` — pitch renders, formations switch, slots show
  - `specs/formations/drag-drop.spec.ts` — drag player to slot, swap players, bench management
  - `specs/formations/position-admin.spec.ts` — assign positions in admin
- [ ] Handle edge cases:
  - Fewer players than formation slots (show empty slots)
  - More players than slots + bench (extra players stay in panel)
  - Player with no position preference (show as flexible/any)
  - Guest players in formation (manual add with no position data)
- [ ] Responsive design:
  - On mobile (< lg): pitch scales down, player panel becomes bottom sheet
  - Touch-friendly: tap to select player, tap slot to place (alternative to drag on mobile)
- [ ] Animations:
  - Smooth slot transitions when formation changes
  - Card entrance animations when players are assigned
  - Subtle pitch line animations on load
- [ ] Accessibility: keyboard navigation for slot assignment (tab through slots, enter to assign)
- [ ] Run ALL E2E tests (existing + new) — all pass
- [ ] Commit: `feat(skjold): formation builder polish, E2E tests, and responsive design`

---

## Technical Notes

### Formation Slot Schema
Each formation type maps to an array of slot definitions:
```typescript
interface FormationSlot {
  index: number;
  position: 'keeper' | 'defender' | 'wing' | 'midfield' | 'attacker';
  x: number; // percentage from left
  y: number; // percentage from top
  label: string; // Danish display label
}

const FORMATIONS: Record<string, FormationSlot[]> = {
  '1-2-3-1': [
    { index: 0, position: 'keeper', x: 50, y: 90, label: 'K' },
    { index: 1, position: 'defender', x: 30, y: 70, label: 'F' },
    { index: 2, position: 'defender', x: 70, y: 70, label: 'F' },
    { index: 3, position: 'wing', x: 15, y: 45, label: 'Ka' },
    { index: 4, position: 'midfield', x: 50, y: 45, label: 'C' },
    { index: 5, position: 'wing', x: 85, y: 45, label: 'Ka' },
    { index: 6, position: 'attacker', x: 50, y: 15, label: 'A' },
  ],
  '1-3-2-1': [
    { index: 0, position: 'keeper', x: 50, y: 90, label: 'K' },
    { index: 1, position: 'defender', x: 25, y: 70, label: 'F' },
    { index: 2, position: 'defender', x: 50, y: 70, label: 'F' },
    { index: 3, position: 'defender', x: 75, y: 70, label: 'F' },
    { index: 4, position: 'midfield', x: 35, y: 45, label: 'C' },
    { index: 5, position: 'midfield', x: 65, y: 45, label: 'C' },
    { index: 6, position: 'attacker', x: 50, y: 15, label: 'A' },
  ],
  '1-3-3': [
    { index: 0, position: 'keeper', x: 50, y: 90, label: 'K' },
    { index: 1, position: 'defender', x: 25, y: 70, label: 'F' },
    { index: 2, position: 'defender', x: 50, y: 70, label: 'F' },
    { index: 3, position: 'defender', x: 75, y: 70, label: 'F' },
    { index: 4, position: 'wing', x: 20, y: 35, label: 'Ka' },
    { index: 5, position: 'midfield', x: 50, y: 35, label: 'C' },
    { index: 6, position: 'wing', x: 80, y: 35, label: 'Ka' },
  ],
};
```

### Position Abbreviations (Danish)
| Position | Danish | Abbreviation |
|----------|--------|--------------|
| Keeper | Målmand | K |
| Defender | Forsvar | F |
| Wing | Kant | Ka |
| Midfield | Central | C |
| Attacker | Angriber | A |

### Auto-Assignment Algorithm
When populating a formation from a generated team:
1. For each slot (in order: keeper → defenders → midfield/wings → attacker):
   - Find unassigned player whose preferred positions include the slot's position
   - If no exact match, find player with closest position (defender ↔ midfield, wing ↔ attacker)
   - If still no match, assign any remaining unassigned player
2. Remaining players go to bench (up to 3)
3. Extra players stay in the available panel

### Drag and Drop Data Transfer
```typescript
// On drag start
e.dataTransfer.setData('application/json', JSON.stringify({
  playerId: string,
  source: 'panel' | 'pitch' | 'bench',
  sourceSlotIndex?: number, // if from pitch/bench
}));
```

## Success Criteria

1. Visual pitch displays correctly with all 3 formations
2. Players can be dragged and dropped between panel, pitch slots, and bench
3. Player positions are persisted in the database
4. Formation integrates with existing team generation flow
5. Position management available in admin settings
6. Works on mobile with tap-to-assign fallback
7. All existing + new E2E tests pass
8. Dark theme consistent with rest of app
9. All UI text in Danish
