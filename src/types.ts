/**
 * Shared TypeScript types and interfaces for Flappy Bird Clone
 */

/** Rectangle bounding box for collision detection */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Pipe pair bounding boxes */
export interface PipeBoundingBoxes {
    top: BoundingBox;
    bottom: BoundingBox;
}

/** Game state enumeration */
export enum GameState {
    MENU = 'menu',
    READY = 'ready',
    PLAYING = 'playing',
    GAME_OVER = 'game_over',
    PAUSED = 'paused'
}

/** Menu screen types */
export enum MenuScreen {
    MAIN = 'main',
    HOW_TO_PLAY = 'how_to_play',
    ACHIEVEMENTS = 'achievements',
    TUTORIAL = 'tutorial'
}

/** Button definition for menu */
export interface MenuButton {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    action: string;
}

/** Game configuration constants */
export interface GameConfig {
    width: number;
    height: number;
    groundHeight: number;
    birdStartX: number;
    birdStartY: number;
    pipeSpawnInterval: number;
    pipeGapMinY: number;
    pipeGapMaxY: number;
}

/** Bird physics configuration */
export interface BirdConfig {
    readonly gravity: number;
    readonly flapVelocity: number;
    readonly maxFallVelocity: number;
    readonly rotationSpeed: number;
    readonly maxUpRotation: number;
    readonly maxDownRotation: number;
    readonly width: number;
    readonly height: number;
}

/** Pipe configuration */
export interface PipeConfig {
    readonly width: number;
    readonly gap: number;
    readonly speed: number;
}

/** Stored game data for persistence */
export interface StoredGameData {
    highScore: number;
    totalGames: number;
    totalScore: number;
    achievements: string[];
    selectedSkin: string;
    soundEnabled: boolean;
    musicEnabled: boolean;
}

/** Achievement definition */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    condition: (stats: GameStats) => boolean;
    icon?: string;
}

/** Current game statistics */
export interface GameStats {
    currentScore: number;
    highScore: number;
    totalGames: number;
    totalScore: number;
    pipesPassed: number;
    flapsCount: number;
}

/** Canvas rendering context type alias */
export type RenderContext = CanvasRenderingContext2D;
