/**
 * Main Entry Point
 * Initializes and starts the Flappy Bird game
 */

import { Game } from './Game.js';

// Initialize game when DOM is ready
const game = new Game('game-canvas');
game.init();

// Export for debugging purposes
(window as any).game = game;
