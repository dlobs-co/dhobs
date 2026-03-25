# Project S — Design System & Implementation Log

This document defines the visual language, component architecture, and implementation record for the Project S dashboard. It serves as both the design specification and a living log of what was built, how, and why.

---

## 1. Design Principles

1. **Clarity over cleverness** — Every element has an obvious purpose. No decorative noise.
2. **Trust through transparency** — The UI always communicates system state honestly. Show container health, encryption status, and resource usage. Never hide errors.
3. **Power without complexity** — Default views are simple enough for a first-time self-hoster. Advanced controls are layered and revealed on demand.
4. **Consistent and predictable** — Same action, same pattern, everywhere.
5. **Privacy-first aesthetic** — Secure, grounded, dark-first. Think vault door, not toy box.

---

## 2. Technology Stack (As Built)

| Layer | Technology | Version | License |
|---|---|---|---|
| Framework | Next.js | 16.2.0 | MIT |
| Runtime | React | 19.2.4 | MIT |
| Language | TypeScript | 5.7.3 | Apache-2.0 |
| Styling | Tailwind CSS | 4.2.0 | MIT |
| Component Library | shadcn/ui (New York) | latest | MIT |
| Primitives | Radix UI | 30+ packages | MIT |
| Charts | Recharts | 2.15.0 | MIT |
| Icons | Lucide React | 0.564.0 | ISC |
| Fonts | Inter + JetBrains Mono | Google Fonts | OFL |
| Utilities | clsx, tailwind-merge, class-variance-authority | latest | MIT |
| Package Manager | npm | 11.x | — |

### Why These Choices

- **Next.js 16 + React 19:** Server components by default, Turbopack dev server for fast iteration, built-in font optimization.
- **Tailwind CSS 4:** Native CSS custom properties integration, no `tailwind.config.js` needed — theming is done entirely through CSS variables.
- **shadcn/ui:** Not a dependency — components are copied into the project and owned. Full control, no version lock-in. Over 60 UI primitives installed.
- **Recharts:** Declarative charting built on D3 with React components. Supports responsive containers, gradient fills, and composable chart types (Area, Bar, Pie).
- **Lucide:** MIT-licensed icon set with consistent 24x24 grid and 1.5px stroke. Direct replacement for Feather Icons with active maintenance.

---

## 3. Architecture Overview

### 3.1 Component Tree

```
RootLayout (app/layout.tsx) — Server Component
├── Inline <script> — Injects "dark" class immediately (no flash)
├── Google Fonts — Inter (--font-sans), JetBrains Mono (--font-mono)
├── ThemeProvider (context wrapper) — Client Component
│   └── HomePage (app/page.tsx) — Client Component
│       ├── Aurora Background — Fixed, 3 animated gradient blobs
│       ├── Sidebar — Fixed left, icon-only, glassmorphism
│       │   ├── Logo ("S" mark)
│       │   ├── NavButton × 4 (Dashboard, Media, Storage, Metrics)
│       │   ├── Settings popup → Theme selector popup
│       │   └── ThemeButton × 11 (color previews in 4-column grid)
│       ├── WelcomeSection — Fades OUT on scroll (opacity + translateY)
│       │   ├── Date + Greeting header
│       │   ├── Applications grid (16 self-hosted apps)
│       │   └── Bookmarks grid (6 categories × 3 links)
│       └── DashboardSection — Fades IN after 30% scroll
│           ├── Quick stats bar (CPU, RAM, Disk)
│           ├── CPU Gauge (PieChart donut)
│           ├── CPU History (AreaChart, 24h)
│           ├── Memory Gauge (PieChart donut)
│           ├── Network Activity (AreaChart, upload/download)
│           ├── System Load (BarChart, 1/5/15 min)
│           ├── Disk Space (progress bars)
│           ├── System Alerts (list)
│           └── Services grid (6 services with status)
```

### 3.2 File Structure

```
Dashboard/Dashboard1/
├── app/
│   ├── globals.css          — Design tokens, animations, glass utility
│   ├── layout.tsx           — Root layout, fonts, ThemeProvider
│   └── page.tsx             — Main page with scroll-driven transitions
├── components/
│   ├── theme-provider.tsx   — 11-theme context, localStorage persistence
│   ├── dashboard/
│   │   ├── sidebar.tsx      — Glass sidebar + settings + theme picker
│   │   ├── welcome-section.tsx  — Apps + bookmarks landing
│   │   └── dashboard-section.tsx — Charts + metrics + services
│   └── ui/                  — 60+ shadcn/ui primitives
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   └── utils.ts             — cn() helper (clsx + twMerge)
├── public/                  — Static assets (icons, placeholders)
├── next.config.mjs          — TS errors ignored, dev indicators off
├── tsconfig.json
├── components.json          — shadcn/ui config (new-york style)
├── postcss.config.mjs
└── package.json
```

---

## 4. Theme System (As Implemented)

### 4.1 How It Works

The theme system is built on **CSS custom properties** applied directly to `document.documentElement`. When a user selects a theme, the `ThemeProvider`:

1. Updates React context state
2. Applies 10 CSS variables to `:root` via `style.setProperty()`
3. Persists the theme ID to `localStorage.colorThemeId`
4. Toggles the `dark` class on `<html>` for light themes (Cloud, Chalk, Paper)

### 4.2 The 11 Themes

| # | ID | Name | Background | Accent | Mode |
|---|---|---|---|---|---|
| 1 | `blackboard` | Blackboard | `#0a0a0a` | `#d4e157` (lime) | Dark |
| 2 | `gazette` | Gazette | `#3d4654` | `#8bb8a8` (teal) | Dark |
| 3 | `espresso` | Espresso | `#2c2724` | `#d4a574` (tan) | Dark |
| 4 | `cab` | Cab | `#1a1a1a` | `#facc15` (yellow) | Dark |
| 5 | `cloud` | Cloud | `#f5f5f7` | `#ef4444` (red) | Light |
| 6 | `lime` | Lime | `#1a2e1a` | `#84cc16` (green) | Dark |
| 7 | `passion` | Passion | `#2d1f3d` | `#a855f7` (purple) | Dark |
| 8 | `blues` | Blues | `#1e1b4b` | `#6366f1` (indigo) | Dark |
| 9 | `chalk` | Chalk | `#fdf2f8` | `#ec4899` (pink) | Light |
| 10 | `tron` | Tron | `#0c1821` | `#22d3ee` (cyan) | Dark |
| 11 | `paper` | Paper | `#fefce8` | `#ca8a04` (gold) | Light |

### 4.3 Theme Interface

```typescript
interface ColorTheme {
  id: string
  name: string
  background: string      // Page background
  foreground: string       // Primary text
  accent: string           // Interactive elements, active states
  accentForeground: string // Text on accent backgrounds
  card: string             // Card/panel background (rgba for glass)
  muted: string            // Secondary/helper text
  border: string           // Borders and dividers (rgba)
  preview: {               // Theme selector button preview
    bg: string
    text: string
    accent: string
    border?: string
  }
}
```

### 4.4 CSS Variables Applied

```css
--background, --foreground, --primary, --primary-foreground,
--accent, --accent-foreground, --card, --muted-foreground,
--border, --glass-border, --glow-primary
```

### 4.5 Theme Selector UX

The theme picker follows the reference design (Obelisk-style):

1. User clicks **Settings** gear icon in the sidebar
2. A floating glass popup appears with a "Color themes" button
3. Clicking it reveals a second popup with an 4-column grid of 11 theme preview buttons
4. Each button shows the theme name on its background color
5. Active theme has a `ring-2 ring-white/30` indicator and a colored dot
6. Selecting a theme instantly applies it and closes both popups

---

## 5. Color System

### 5.1 Core Tokens (Default: Blackboard)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0a0a0a` | Page background |
| `--foreground` | `#f5f5f7` | Primary text |
| `--card` | `rgba(20,20,20,0.8)` | Card backgrounds (translucent) |
| `--primary` | `#d4e157` | Accent color |
| `--border` | `rgba(255,255,255,0.1)` | Borders |
| `--muted-foreground` | `#86868b` | Secondary text |

### 5.2 Semantic Colors (Hardcoded in CSS)

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#22c55e` | Healthy services, online status |
| `--warning` | `#facc15` | High usage, degraded |
| `--danger` | `#ef4444` | Errors, stopped, alerts |

### 5.3 Chart-Specific Colors

| Element | Color | Rationale |
|---|---|---|
| CPU gauge/history | Theme accent | Primary metric, matches brand |
| Memory gauge | `#22d3ee` (cyan) | Distinct from CPU, cool tone |
| Network upload | `#a855f7` (purple) | Outbound = warm-adjacent |
| Network download | `#22d3ee` (cyan) | Inbound = cool |
| Disk root | `#22c55e` (green) | System = healthy green |
| Disk home | `#facc15` (yellow) | User data = attention |

---

## 6. Typography (As Implemented)

| Role | Font | Variable | Loaded Via |
|---|---|---|---|
| UI / Body | Inter | `--font-sans` | `next/font/google` |
| Code / Mono | JetBrains Mono | `--font-mono` | `next/font/google` |

Both fonts are loaded with `subsets: ["latin"]` and applied as CSS variables on `<html>`. Tailwind maps them via `--font-sans` and `--font-mono`.

---

## 7. Glass Morphism Implementation

### 7.1 The `.glass` Utility Class

```css
.glass {
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  background: rgba(255, 255, 255, 0.03);
}
```

### 7.2 Where Glass Is Used

- **Sidebar:** `bg-black/40 backdrop-blur-2xl` + `border-white/[0.08]`
- **Settings popup:** `bg-black/60 backdrop-blur-2xl`
- **Theme selector popup:** `bg-black/70 backdrop-blur-2xl`
- **Dashboard cards (GlassCard):** `bg-white/[0.03] backdrop-blur-xl border-white/[0.06]`

### 7.3 Aurora Background

Three fixed-position gradient blobs animate behind all content:

| Blob | Size | Color | Position | Delay |
|---|---|---|---|---|
| 1 | 60% | Accent @ 40% opacity | Top-left (-15%, -15%) | 0s |
| 2 | 50% | Cyan @ 30% opacity | Bottom-right (-10%, 10%) | -12s |
| 3 | 40% | Accent @ 30% opacity | Bottom-center (40%, -10%) | -6s |

All three use `blur-[120px]` (or `blur-[100px]`) and the `aurora` keyframe animation (25s infinite ease-in-out) with subtle translation, rotation, and scale.

---

## 8. Scroll-Driven Page Transition

The dashboard uses a two-section scroll model inspired by Apple product pages:

### 8.1 How It Works

```
scrollProgress = Math.min(window.scrollY / window.innerHeight, 1)
```

| Section | Opacity | Transform | Trigger |
|---|---|---|---|
| **Welcome** | `1 - progress × 1.5` | `translateY(-progress × 50px)` | Starts fading immediately |
| **Dashboard** | `(progress - 0.3) / 0.7` | `translateY((1 - progress) × 30px)` | Fades in after 30% scroll |

- Page height is `min-h-[200vh]` to create scroll room
- Transitions use `0.1s ease-out` for smooth tracking
- Scroll listener uses `{ passive: true }` for performance

### 8.2 The Welcome Section

- **Header:** Current date (formatted uppercase, e.g., "SUNDAY, MARCH 23, 2026") + time-based greeting
- **Applications:** 4-column grid of 16 self-hosted services (Jellyfin, Nextcloud, Code Server, Matrix, Vaultwarden, Home Assistant, PostgreSQL, Authelia, Plex, Navidrome, Portainer, Pi-hole, Grafana, Filebrowser, Miniflux, Syncthing)
- **Bookmarks:** 6-column grid of categorized links (Communicate, Cloud, Design, Dev, Media, Tech) with 3 links each
- **Scroll indicator:** "Scroll for dashboard" text + animated vertical line

### 8.3 The Dashboard Section

System monitoring dashboard with Recharts visualizations:

| Widget | Chart Type | Data |
|---|---|---|
| CPU Usage | PieChart (donut gauge) | Single percentage value |
| CPU History | AreaChart with gradient fill | 7 time points over 24h |
| Memory Usage | PieChart (donut gauge) | Single percentage value |
| Network Activity | Dual AreaChart (upload + download) | 7 time points |
| System Load | BarChart | 1min, 5min, 15min averages |
| Disk Space | CSS progress bars | 2 mount points with percentages |
| System Alerts | List component | Warning items with timestamps |
| Services | Status card grid | 6 services with ping times |

---

## 9. Sidebar Navigation (As Built)

### 9.1 Structure

```
┌─────────────────┐
│   [ S ]         │  ← Accent-colored logo mark
├─────────────────┤
│   ◆ Dashboard   │  ← Active: accent bg + dark text
│   ◇ Media       │
│   ◇ Storage     │
│   ◇ Metrics     │
├─────────────────┤
│   ◇ Settings    │  ← Opens settings popup
└─────────────────┘
```

- **Position:** `fixed left-4 top-1/2 -translate-y-1/2 z-50`
- **Style:** Rounded pill (`rounded-2xl`), glass effect, `py-3`
- **Icons:** Lucide at 18×18, stroke-width 1.5
- **Active state:** Accent background color with dark text
- **Inactive state:** `text-white/50`, hover: `bg-white/[0.06] text-white/80`
- **Tooltips:** Radix Tooltip on each button, appears to the right with 12px offset

---

## 10. Animation System

### 10.1 Keyframes Defined

| Animation | Duration | Effect |
|---|---|---|
| `aurora` | 25s infinite | Translate + rotate + scale on background blobs |
| `pulse-glow` | 2s infinite | Opacity 100% → 50% → 100% for status dots |
| `float-up` | 0.5s forwards | `translateY(20px) → 0` with fade-in for card entrance |

### 10.2 Scroll Animations

Handled via inline styles updated on `scroll` event, not CSS animations. This gives frame-precise control tied to scroll position rather than time.

### 10.3 UI Transitions

- Sidebar popup enter: `animate-in slide-in-from-left-2 fade-in duration-200`
- Theme button hover: `hover:scale-105 active:scale-95`
- All interactive elements: `transition-all` or `transition-colors`

---

## 11. Hydration Safety

Several measures prevent React hydration mismatches between server and client:

1. **Inline dark mode script** in `layout.tsx` — adds `dark` class before React hydrates
2. **`mounted` state** in `page.tsx` — uses fallback colors (`#0a0a0a`, `#d4e157`) until after first render
3. **`suppressHydrationWarning`** on `<html>` element
4. **ThemeProvider always renders children** — no conditional return during hydration, just default values that update after mount

---

## 12. Build & Development

### Running Locally

```bash
cd Dashboard/Dashboard1
npm install          # 195 packages, 0 vulnerabilities
npx next dev --port 5111
```

### Configuration

- **next.config.mjs:** `typescript.ignoreBuildErrors: true`, `images.unoptimized: true`, `devIndicators: false`
- **tsconfig.json:** `target: ES6`, `moduleResolution: bundler`, `jsx: react-jsx`, path alias `@/*`
- **components.json:** shadcn/ui style `new-york`, icon library `lucide`

### What Is Not Yet Implemented (Mocked)

- All chart data is hardcoded mock data (not connected to real system metrics)
- Service status/ping times are static
- Application links point to placeholder URLs
- Sidebar navigation does not route between pages (single-page layout)
- No authentication or user management
- No WebSocket connection for live metrics

---

## 13. Iteration History

| Version | Date | Changes |
|---|---|---|
| v1 | 2026-03-23 | Initial scaffolding — basic page with module cards and layout |
| v2 | 2026-03-23 | Fixed client component boundary issues, refactored icon passing |
| v3 | 2026-03-23 | Complete redesign — Apple-inspired glassmorphism, aurora background, floating sidebar, 11 color themes, dark/light mode |
| v4 | 2026-03-23 | Added Welcome section (apps + bookmarks), Recharts dashboard (CPU/memory/network/disk/load charts), scroll-driven page transition, glass theme selector popup, hydration fixes |

---

## 14. Design References & Inspirations

- **Apple.com** — Clean typography, generous whitespace, scroll-driven reveals
- **Obelisk dashboard** — Aurora glow backgrounds, glassmorphism cards, floating sidebar
- **Heimdall** — Application launcher grid with icons and URLs
- **Monitor Board** — Recharts-based system monitoring with donut gauges and area charts
- **Homepage (gethomepage.dev)** — Service status cards with ping times and categories

---

## 15. Next Steps

- [ ] Connect to real system metrics via WebSocket endpoint (replaces mock data)
- [ ] Implement page routing for sidebar navigation (Media, Storage, Metrics views)
- [ ] Add authentication flow (master credentials from Phase 2 spec)
- [ ] Build the App Store module installer UI
- [ ] Add drag-and-drop card reordering on the home screen
- [ ] Implement notification system (toast + persistent alerts)
- [ ] Mobile responsive testing and React Native companion app sync
- [ ] Integrate with Docker API for real container status in service cards
