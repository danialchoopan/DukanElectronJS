# Setup Guide — HesabDari Danial

> **[فارسی](SETUP.md) | English**

## Prerequisites

- Node.js 18+
- npm 9+
- Windows 10+ / macOS 12+ / Linux

## Installation

```bash
git clone https://github.com/danialchoopan/DukanElectronJS.git
cd DukanElectronJS
npm install
```

## Running

```bash
npm start
```

## Building Executables

### Windows
```bash
npx electron-builder --win
```
Output: `release/win-unpacked/`

### macOS
```bash
npx electron-builder --mac
```

### Linux
```bash
npx electron-builder --linux
```

## Setup Wizard

On first launch, the wizard guides you through:

### Step 1: Initial Settings
- Language (Farsi/English)
- Theme (Dark/Light)
- Store name, address, phone

### Step 2: Admin Account
- Admin name
- 4-digit PIN code

### Step 3: Financial Settings
- Business type selection (13 types)
- Auto-configured defaults per business type
- Tax enable/disable

## Restoring Previous Data

1. Click "Do you have previous data?" in the setup wizard
2. Select your backup file
3. System auto-checks version compatibility

## Fresh Install

### Method 1: From Settings
1. Go to Settings > Backup
2. Click "Export" → choose format → save
3. Click "Delete Database" button
4. Step 1: Save backup
5. Step 2: Confirm deletion
6. App restarts with fresh empty database

### Method 2: Manual
1. Delete `pos.db` from the database path
2. Delete `backups/` directory
3. Relaunch the app

## Database Location

| OS | Path |
|----|------|
| **Windows** | `%APPDATA%\hesabdari-danial\pos.db` |
| **macOS** | `~/Library/Application Support/hesabdari-danial/pos.db` |
| **Linux** | `~/.config/hesabdari-danial/pos.db` |

## Upgrading Versions

When upgrading from an older version, the database auto-migrates:
- New columns are added with safe defaults
- New tables are created automatically
- No need to delete the database
- Auto-migration covers v1.0 → v1.5

## Export Formats

| Format | Description | Best For |
|--------|-------------|----------|
| SQLite (.db) | Direct database copy | Fast restore, device transfer |
| JSON (.json) | Structured text with metadata | Reading, editing, migration |

## See Also

- [README](README-en.md) — Project overview
- [TECHNICAL](TECHNICAL-en.md) — Technical documentation
- [Developer Guide](docs/developer-en.html) — How to extend the app
