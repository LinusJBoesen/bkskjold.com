# Skjold Bode UI Overhaul — PRD

## Goal

Transform the existing functional but dated-looking UI into a modern, polished interface inspired by openclaw.ai. The app should feel premium, fast, and visually striking — dark-mode first with clean typography, generous whitespace, and subtle visual effects.

## Design Direction: openclaw.ai-inspired

Key characteristics to replicate:
- **Dark-mode first**: Rich dark backgrounds (`#0A0A0A` or `#09090B`), not harsh black
- **High contrast text**: Crisp white/light text on dark backgrounds
- **Subtle gradients**: Gentle gradient overlays on cards and sections
- **Glassmorphism touches**: Subtle backdrop-blur on overlays and sidebar
- **Clean typography**: Large, bold headings with generous letter-spacing. Clean sans-serif (Inter)
- **Generous whitespace**: Lots of breathing room between elements
- **Minimal borders**: Very subtle borders (`border-white/10` or `border-gray-800`)
- **Soft glows**: Subtle box-shadow glows on hover or key elements (red glow for brand accent)
- **Smooth animations**: `transition-all duration-300` on interactive elements
- **Cards**: Dark cards (`bg-gray-900/50`) with subtle border and rounded corners
- **Status indicators**: Clean pill badges with soft colored backgrounds
- **Modern inputs**: Dark inputs with subtle borders and clean focus states
- **Premium feel**: Everything should feel intentional and polished

## Color Palette

### Backgrounds
- Page background: `#09090B` (zinc-950)
- Card background: `#18181B` (zinc-900) or `rgba(24,24,27,0.5)` with backdrop-blur
- Sidebar: `#0A0A0A` with subtle border-right `border-white/5`
- Input background: `#27272A` (zinc-800)
- Hover states: `#27272A` (zinc-800)

### Text
- Primary: `#FAFAFA` (zinc-50) — headings, main content
- Secondary: `#A1A1AA` (zinc-400) — labels, descriptions, muted text
- Tertiary: `#71717A` (zinc-500) — placeholders, least important text

### Brand Accent
- Red: `#D42428` — primary CTAs, active states, key highlights
- Red hover: `#B91C1F` — darker on hover
- Red glow: `0 0 20px rgba(212,36,40,0.3)` — subtle glow on primary buttons

### Status Colors (on dark backgrounds)
- Success: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
- Error/Unpaid: `bg-red-500/10 text-red-400 border-red-500/20`
- Warning/Pending: `bg-amber-500/10 text-amber-400 border-amber-500/20`
- Info: `bg-blue-500/10 text-blue-400 border-blue-500/20`

### Borders
- Subtle: `border-white/5` or `border-zinc-800`
- Medium: `border-white/10` or `border-zinc-700`
- Dividers: `border-zinc-800`

## Key UI Patterns

### Sidebar
- Background: `#0A0A0A` with `border-r border-white/5`
- Logo/team name at top in white bold
- Nav items with Lucide icons, `text-zinc-400` default
- Active: `text-white bg-white/5 border-l-2 border-red-500`
- Hover: `text-zinc-200 bg-white/5`
- Clean `transition-colors duration-200`

### Page Layout
- Page title: `text-2xl font-bold text-white tracking-tight`
- Subtitle: `text-sm text-zinc-400`
- Content sections separated by `space-y-6`
- Cards: `bg-zinc-900/50 border border-zinc-800 rounded-xl p-6`

### Tables
- Header: `bg-zinc-900 text-zinc-400 text-xs font-medium uppercase tracking-wider`
- Rows: `border-b border-zinc-800/50`
- Row hover: `hover:bg-white/[0.02]`
- Cell text: `text-zinc-200`
- Spacious: `px-4 py-3`

### Buttons
- Primary: `bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all duration-200`
- Secondary: `bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors`
- Ghost: `text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors`
- All with `font-medium text-sm`

### Status Badges
- Pill: `rounded-full px-2.5 py-0.5 text-xs font-medium border`
- Paid: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`
- Unpaid: `bg-red-500/10 text-red-400 border-red-500/20`
- Pending: `bg-amber-500/10 text-amber-400 border-amber-500/20`

### Stat Cards
- `bg-zinc-900/50 border border-zinc-800 rounded-xl p-6`
- Label: `text-xs text-zinc-500 uppercase tracking-wider font-medium`
- Value: `text-3xl font-bold text-white tabular-nums mt-1`
- Optional trend: small colored text below value

### Form Inputs
- `bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all`
- Labels: `text-sm font-medium text-zinc-300`
- Select dropdowns: same dark styling as inputs

### Charts (Recharts)
- Background: transparent (inherits card bg)
- Grid lines: `#27272A` (zinc-800)
- Primary data: `#D42428` (brand red)
- Secondary: `#A1A1AA` (zinc-400)
- Tertiary: `#3B82F6` (blue-500)
- Tooltip: `bg-zinc-800 border border-zinc-700 text-white rounded-lg shadow-xl`

### Login Page
- Full dark background
- Centered card with subtle border glow
- Clean form with dark inputs
- Brand red login button with glow effect

---

## Missing Features to Add

During this overhaul, also add these missing features:

1. **Copy teams to clipboard** — button in team selector to copy team lists as text
2. **Player profile pictures** — display player avatars (from Spond) in dashboard top performers, team selector, and player stats

---

## Round 1: Foundation — Dark Theme, Base Components, Layout

- [ ] Install `lucide-react` for icons
- [ ] Completely rewrite `index.css`: dark theme with zinc color scale, remove all old light-mode variables
- [ ] Rewrite `button.tsx`: dark variants (primary red/secondary zinc/ghost) with explicit Tailwind classes
- [ ] Rewrite `card.tsx`: dark `bg-zinc-900/50 border-zinc-800 rounded-xl`
- [ ] Rewrite `input.tsx`: dark styling with zinc-800 bg and red focus ring
- [ ] Rewrite `table.tsx`: dark theme, zinc-900 header, subtle row borders
- [ ] Create `badge.tsx`: pill badges with semi-transparent colored backgrounds
- [ ] Rewrite `sidebar.tsx`: dark with Lucide icons, red active state, clean transitions
- [ ] Rewrite `header.tsx`: dark, minimal
- [ ] Update App.tsx layout: `bg-zinc-950` page background
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dark theme foundation — components and layout`

### Round 2: Login + Dashboard

- [ ] Rewrite `login.tsx`: full dark page, centered card with subtle glow, dark inputs, red CTA
- [ ] Rewrite `dashboard.tsx`: dark stat cards, modern chart styling with dark tooltips
- [ ] Add player profile pictures to top performers section
- [ ] Update Recharts: dark theme (zinc-800 grid, dark tooltips, brand colors)
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dark modern login and dashboard`

### Round 3: Fine Management Pages

- [ ] Rewrite `fines/overview.tsx`: dark table, status badges, clickable rows with hover
- [ ] Rewrite `fines/detail.tsx`: dark player header, fine history with badges
- [ ] Style manual fine creation form with dark inputs
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dark modern fine management UI`

### Round 4: Team Selector

- [ ] Rewrite `teams/selector.tsx`: dark player cards, visual team columns, modern generate button
- [ ] Add "Kopiér hold" (copy to clipboard) button
- [ ] Show player profile pictures in team cards
- [ ] Dark balance metrics display
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dark modern team selector with clipboard copy`

### Round 5: History + Tournament + Analysis + Admin

- [ ] Rewrite `history/training.tsx`: dark pending matches, dark stats table, dark history
- [ ] Rewrite `tournament/standings.tsx`: dark league table with subtle position colors
- [ ] Rewrite `analysis/match.tsx`: dark stats cards and player table
- [ ] Rewrite `admin/settings.tsx`: dark tabs, dark forms, dark tables
- [ ] Style all select/dropdown elements to match dark theme
- [ ] Run E2E tests — all pass
- [ ] Commit: `feat(skjold): dark modern history, tournament, analysis, and admin`

### Round 6: Polish + Animations + Final Pass

- [ ] Add smooth hover transitions on all interactive elements (cards, rows, buttons)
- [ ] Add subtle glow effects on primary buttons (red shadow)
- [ ] Audit spacing consistency across all pages
- [ ] Add subtle entrance animations for page content
- [ ] Show player profile pictures in player stats tables where relevant
- [ ] Verify responsive design on mobile (375px) — dark sidebar overlay
- [ ] Run ALL E2E tests — all pass
- [ ] Commit: `feat(skjold): UI polish — animations, glows, consistency`

---

## Success Criteria

1. The entire app uses a dark theme (no light backgrounds anywhere)
2. Brand red used sparingly for CTAs, active states, and key highlights
3. All tables use dark consistent styling
4. All status indicators use Badge component with semi-transparent colors
5. Smooth transitions on all interactive elements
6. Lucide icons throughout navigation
7. Player profile pictures displayed where relevant
8. Copy to clipboard works in team selector
9. All E2E tests still pass
10. Responsive on mobile with dark sidebar overlay
