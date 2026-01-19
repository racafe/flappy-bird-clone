## Flappy Bird Clone (TypeScript + HTML5 Canvas)

This is a browser-based Flappy Bird clone built with **TypeScript**, **HTML5 Canvas**, and **native ES6 modules** (no bundler). The project was **one-shot vibecoded** using [Ralph TUI](https://ralph-tui.com/) as the AI agent loop orchestrator, with **Claude Code** as the agent provider.

### Features

- **Arcade-style gameplay**: Classic Flappy Bird mechanics with smooth physics and precise collision detection.
- **Game states**: `MENU → READY → PLAYING ↔ PAUSED → GAME_OVER → MENU` managed via a central game state machine.
- **Bird physics & skins**: Gravity, flapping, terminal velocity, and multiple bird skin variants.
- **Procedural pipes**: Pipe generation with configurable gaps and difficulty scaling as score increases.
- **Rich UI**: HUD, menus, game over screen, parallax backgrounds, and a day/night visual cycle.
- **Audio & music**: Web Audio–based sound effects and procedurally generated music.
- **Persistence**: localStorage saves high score, achievements, selected skin, audio settings, and leaderboard (top 10).

### Tech Stack

- **Language**: TypeScript (strict mode, targeting ES2020)
- **Rendering**: HTML5 Canvas
- **Modules**: Native ES6 modules (imports use `.js` extensions in compiled output)
- **Tooling**: `typescript`, `live-server`, `concurrently`

### Getting Started

#### Prerequisites

- Node.js (LTS recommended)
- npm (bundled with Node)

#### Install dependencies

```bash
npm install
```

#### Run the dev server

Starts TypeScript in watch mode and `live-server` on port 3000 with auto-reload:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser (it should auto-open).

#### Other scripts

```bash
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type check without emitting files
npm run watch      # TypeScript watch mode only
npm run serve      # Serve without compilation (live-server on port 3000)
```

### Project Structure (High-Level)

- `index.html` – Root HTML document and canvas container.
- `src/main.ts` – Entry point, bootstraps the `Game` instance.
- `src/Game.ts` – Core game loop, state machine, input handling, collision detection, and difficulty progression.
- `src/Bird.ts` – Bird entity, physics, animation, and skin handling.
- `src/Pipe.ts` – Pipe entities and spawn logic.
- `src/UI.ts` – All drawing and UI rendering (menus, HUD, overlays, visual effects).
- `src/Storage.ts` – localStorage management for settings, scores, and achievements.
- `src/Audio.ts` – Sound effects and music via Web Audio.
- `src/Achievements.ts` – Achievement system and progression tracking.
- `src/types.ts` – Shared interfaces, types, and enums (including `GameState`).

### Development Notes

- Because the project uses **native ES modules**, imports in TypeScript must use `.js` extensions to match the compiled output, e.g.:

```typescript
import { Game } from './Game.js';
```

- Canvas size is currently `400x600`.
- Difficulty increases with score (pipe speed increases roughly every 5 points, to a configured cap).

### Credits

- **Core implementation**: Generated in a single agent loop as a **one-shot vibecode** session.
- **Orchestration & planning**: [Ralph TUI](https://ralph-tui.com/) – AI agent loop orchestrator.
- **Agent provider**: Claude Code (`claude.ai/code`).

### License

This project is open source under the **MIT License**.

