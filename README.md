# Freedium Tray

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Freedium Tray is a Tauri + React + TypeScript desktop application that provides a system tray interface for reading Medium articles via proxy.

## Features

- Read Medium articles without paywall via proxy
- System tray integration for quick access
- Article history tracking
- Dark mode support
- Open articles directly from command line

## Prerequisites

- Node.js 24+
- Rust 1.93+
- npm or pnpm

## Installation

```bash
# Clone the repository
git clone https://github.com/leandroyalet/freedium-tray
cd freedium-tray

# Install dependencies
npm install
```

## Usage

```bash
# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build

# Open a specific article via CLI
./freedium-tray https://medium.com/@username/article-slug
```

## Development

| Command                       | Description             |
| ----------------------------- | ----------------------- |
| `npm run dev`                 | Start Vite dev server   |
| `npm run tauri dev`           | Run full Tauri app      |
| `npm run tauri build`         | Build production app    |
| `cd src-tauri && cargo build` | Build Rust backend only |

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Rust, Tauri 2
- **Database:** SQLite (rusqlite)
- **Build:** Vite

## License

MIT License - see [LICENSE](LICENSE) for details.
