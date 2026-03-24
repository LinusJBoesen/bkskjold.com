# BK Skjold Brand Guidelines

## Overview
Visual identity for the BK Skjold football team management app. Inspired by football/soccer aesthetics with a bold red, white, and black palette.

## Colors

### Primary Colors

- **Red**: `#D42428` - Primary brand color, CTAs, active states, highlights
- **Black**: `#1A1A1A` - Primary text, dark backgrounds, sidebar
- **White**: `#FFFFFF` - Light backgrounds, text on dark surfaces
- **Off-White**: `#F5F5F5` - Page backgrounds, subtle separation

### Neutral Colors

- **Dark Gray**: `#2D2D2D` - Secondary text, card backgrounds on dark
- **Mid Gray**: `#6B7280` - Muted text, labels, secondary info
- **Light Gray**: `#E5E7EB` - Borders, dividers, table stripes
- **Warm Gray**: `#F9FAFB` - Input backgrounds, hover states

### Accent Colors

- **Dark Blue**: `#1E3A5F` - Used near black contexts (sidebar accents, dark cards)
- **Steel Blue**: `#4A6FA5` - Used near white contexts (links, info badges, secondary actions)
- **Success Green**: `#16A34A` - Paid status, positive stats, win indicators
- **Warning Amber**: `#D97706` - Pending status, caution states

### Semantic Usage

| Context | Color | Usage |
|---------|-------|-------|
| Primary action | Red `#D42428` | Buttons, active nav, important badges |
| Destructive action | Red `#D42428` | Delete buttons (same red, with confirm dialog) |
| Success / Paid | Green `#16A34A` | Paid fines, wins, positive metrics |
| Pending / Warning | Amber `#D97706` | Pending matches, unpaid fines |
| Info / Links | Steel Blue `#4A6FA5` | Hyperlinks, info tooltips, secondary CTAs |
| Win rate > 50% | Green `#16A34A` | Player stats color coding |
| Win rate = 50% | Steel Blue `#4A6FA5` | Player stats color coding |
| Win rate < 50% | Red `#D42428` | Player stats color coding |

## Typography

- **Headings**: Inter (with system-ui fallback) - Bold, clean, sporty
- **Body Text**: Inter (with system-ui fallback) - Consistent and readable
- **Monospace**: JetBrains Mono (with monospace fallback) - Stats, numbers, tables

### Font Sizes (Tailwind scale)

| Element | Size | Weight |
|---------|------|--------|
| Page title | `text-2xl` (24px) | `font-bold` |
| Section heading | `text-xl` (20px) | `font-semibold` |
| Card title | `text-lg` (18px) | `font-semibold` |
| Body text | `text-sm` (14px) | `font-normal` |
| Labels / Muted | `text-xs` (12px) | `font-medium` |
| Stats / Numbers | `text-lg` or `text-2xl` | `font-bold` + `tabular-nums` |

## Component Styling

### Sidebar
- Background: Black `#1A1A1A`
- Text: White `#FFFFFF`
- Active item: Red `#D42428` left border + subtle red background `rgba(212,36,40,0.1)`
- Hover: Dark Gray `#2D2D2D`

### Cards
- Background: White `#FFFFFF`
- Border: Light Gray `#E5E7EB`
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-sm`

### Tables
- Header: Black `#1A1A1A` background, White text
- Rows: Alternating White / Off-White `#F5F5F5`
- Hover: Light Gray `#E5E7EB`

### Buttons
- Primary: Red `#D42428` background, White text, hover darken to `#B91C1F`
- Secondary: White background, Black border, hover Light Gray
- Ghost: Transparent, Black text, hover Light Gray background

### Badges / Status Pills
- Betalt (Paid): Green background `#DCFCE7`, Green text `#16A34A`
- Ubetalt (Unpaid): Red background `#FEE2E2`, Red text `#D42428`
- Afventer (Pending): Amber background `#FEF3C7`, Amber text `#D97706`

### Charts (Recharts)
- Primary series: Red `#D42428`
- Secondary series: Black `#1A1A1A`
- Tertiary series: Steel Blue `#4A6FA5`
- Positive/Win: Green `#16A34A`
- Grid lines: Light Gray `#E5E7EB`
- Background: White

## Tailwind CSS Config

```js
colors: {
  brand: {
    red: '#D42428',
    'red-dark': '#B91C1F',
    black: '#1A1A1A',
    white: '#FFFFFF',
    'off-white': '#F5F5F5',
  },
  accent: {
    'dark-blue': '#1E3A5F',
    'steel-blue': '#4A6FA5',
    green: '#16A34A',
    amber: '#D97706',
  },
}
```

## Design Principles

1. **Bold and sporty** - Red accents create energy, black grounds the interface
2. **High contrast** - Black/white base ensures readability
3. **Stats-forward** - Numbers and metrics are prominent with tabular number formatting
4. **Minimal decoration** - Let the data speak, avoid unnecessary ornamentation
5. **Danish-first** - All labels, headings, and UI text in Danish
