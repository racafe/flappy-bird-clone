# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based Flappy Bird clone built with TypeScript and HTML5 Canvas. Uses native ES6 modules (no bundler) with live-server for development.

## Development Commands

```bash
npm run dev        # Start dev server with TypeScript watch + live reload (port 3000)
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type check without emitting files
npm run watch      # TypeScript watch mode only
npm run serve      # Serve without compilation
```

## Architecture

### Module Structure

The game uses ES6 modules without a bundler. Import paths must use `.js` extension (TypeScript compiles to JS):

```typescript
import { Game } from './Game.js';
```

### Core Components

- **main.ts** - Entry point, creates Game instance
- **Game.ts** - Core orchestrator: game loop, state machine, input handling, collision detection, difficulty progression
- **Bird.ts** - Bird entity with physics (gravity, flapping, velocity), animation, and 5 skin variants
- **Pipe.ts** - Obstacle generation with procedural pixel art sprites
- **UI.ts** - All rendering: menus, HUD, game over screen, visual effects (day/night cycle, parallax)
- **Storage.ts** - localStorage persistence (high scores, achievements, settings)
- **Audio.ts** - Web Audio API for sound effects and procedurally generated music
- **Achievements.ts** - Achievement system with 11 achievements across score/playtime milestones
- **types.ts** - Shared TypeScript interfaces and enums

### Game State Machine

```
MENU → READY → PLAYING ↔ PAUSED
                ↓
            GAME_OVER → MENU
```

States defined in `GameState` enum (types.ts). Transitions handled in `Game.ts`.

### Singleton Services

These are instantiated once and exported for use across modules:

```typescript
// Storage.ts
export const storage = new Storage();

// Audio.ts
export const audio = new Audio();

// Achievements.ts
export const achievements = new Achievements();
```

### Game Loop

Located in `Game.ts`, runs at ~60fps via `requestAnimationFrame`:
1. `update()` - Physics, collisions, state changes
2. `render()` - Delegates to UI module for all drawing

### Data Persistence

localStorage key: `flappy_bird_save` - Contains high score, achievements, selected skin, audio settings, leaderboard (top 10).

## Key Configuration

Game constants in `Game.ts`:
- Canvas: 400x600
- Difficulty scales with score (speed increases every 5 points, capped at 5)
- Pipe gap: 120px, spawn interval: 140 frames

Bird physics in `Bird.ts`:
- Gravity: 0.3, Flap velocity: -4.5, Max fall: 10

## TypeScript

- Target: ES2020
- Strict mode enabled
- Output: `./dist/` from `./src/`
