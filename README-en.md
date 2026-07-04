# HesabDari Danial — حسابداری دانیال

**Smart Accounting, Professional Sales**

> **English | [فارسی](README.md)**

---

## Quick Start (Clone & Run)

```bash
# 1. Clone the repo
git clone https://github.com/danialchoopan/DukanElectronJS.git
cd DukanElectronJS

# 2. Install dependencies
npm install

# 3. Start the app in dev mode
npm run dev
```

That's it — the app launches with an empty database. No database setup needed.

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 18+ | https://nodejs.org |
| **npm** | 9+ | Comes with Node.js |
| **Git** | any | https://git-scm.com |

No SQLite install needed — `better-sqlite3` is bundled as a native dependency and installs automatically with `npm install`.

### Build for Production

```bash
# Windows
npm run dist:win

# Linux
npm run dist:linux

# Typecheck only (no build)
npm run typecheck

# Run verification checks
node scripts/verify.js
```

---

## Project Structure

```
src/
├── main/                         # Electron main process
│   ├── database/
│   │   ├── connection.ts         # SQLite schema (20+ tables)
│   │   ├── repositories/         # All CRUD operations
│   │   ├── seed.ts               # Sample data generator
│   │   ├── schemaMigration.ts    # Version-based migrations
│   │   ├── backup.ts             # Backup/restore
│   │   └── smartExport.ts        # Selective import/export
│   ├── ipc/handlers.ts           # IPC bridge (main ↔ renderer)
│   └── index.ts                  # App entry point
├── renderer/src/
│   ├── views/                    # Page components
│   │   ├── reports/              # 6 advanced sales reports
│   │   ├── accounting/           # Journal, Balance, Income, etc.
│   │   ├── settings/             # UI, Login, Shortcuts, Customization
│   │   └── ...
│   ├── components/
│   │   ├── layout/               # Sidebar, TitleBar
│   │   ├── ui/                   # Dialog, Button, Table, etc.
│   │   ├── business/             # ShamsiDateInput, Scanner, etc.
│   │   └── print/                # Print dialogs, Receipt
│   ├── store/                    # Zustand stores (settings, auth, etc.)
│   ├── hooks/                    # useTheme, useShortcuts, etc.
│   ├── theme.ts                  # Centralized dark/light color tokens
│   ├── utils/                    # Jalali, export, QR, etc.
│   ├── i18n/                     # Farsi + English translations
│   └── App.tsx                   # Root component & routing
├── preload/index.ts              # Electron preload (IPC bridge)
└── types/index.ts                # TypeScript interfaces
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript 5 + Tailwind CSS |
| Backend | Electron 33 + Node.js |
| Database | SQLite (better-sqlite3) |
| State | Zustand 5 |
| Build | Vite 6 |
| Calendar | jalaali-js (Shamsi/Jalali) |
| Font | Vazirmatn (local woff2) |

## Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in dev mode (Vite + Electron) |
| `npm run build` | TypeScript check + Vite build |
| `npm run typecheck` | TypeScript check only |
| `npm run dist:win` | Build Windows installer |
| `npm run dist:linux` | Build Linux package |
| `node scripts/verify.js` | Run 72 verification checks |

---

## Documentation

| File | Language | Description |
|------|----------|-------------|
| [README.md](README.md) | فارسی | Overview & quick start |
| [README-en.md](README-en.md) | English | Overview & quick start |
| [SETUP.md](SETUP.md) | فارسی | Installation guide |
| [SETUP-en.md](SETUP-en.md) | English | Installation guide |
| [TECHNICAL.md](TECHNICAL.md) | فارسی | Technical documentation |
| [TECHNICAL-en.md](TECHNICAL-en.md) | English | Technical documentation |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | English | Feature implementation plan |
| [docs/index.html](docs/index.html) | فارسی | Full technical reference |
| [docs/developer-fa.html](docs/developer-fa.html) | فارسی | Developer guide |
| [docs/developer-en.html](docs/developer-en.html) | English | Developer guide |
| [docs/doc-features.html](docs/doc-features.html) | English | Features (20 sections) |
| [docs/doc-schema.html](docs/doc-schema.html) | English | Database schema |
| [docs/doc-api.html](docs/doc-api.html) | English | API reference |
| [docs/doc-accounting.html](docs/doc-accounting.html) | English | Accounting system |
| [docs/doc-backup.html](docs/doc-backup.html) | English | Backup & migration |
| [docs/doc-ui.html](docs/doc-ui.html) | English | UI components |

## License

MIT License — free for all uses.
