/**
 * Game Module
 * Core game orchestration, state management, and game loop
 */

import { GameConfig, GameState, MenuScreen, GameStats, BoundingBox } from './types.js';
import { Bird } from './Bird.js';
import { Pipe } from './Pipe.js';
import { UI } from './UI.js';
import { audio } from './Audio.js';
import { storage } from './Storage.js';
import { achievements, Achievement } from './Achievements.js';

/** Default game configuration */
const DEFAULT_CONFIG: GameConfig = {
    width: 400,
    height: 600,
    groundHeight: 50,
    birdStartX: 80,
    birdStartY: 250,
    pipeSpawnInterval: 90,
    pipeGapMinY: 100,
    pipeGapMaxY: 450 // height - groundHeight - 100
};

export class Game {
    private config: GameConfig;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ui: UI;

    private bird: Bird;
    private pipes: Pipe[] = [];
    private pipeSpawnTimer: number = 0;

    private state: GameState = GameState.MENU;
    private score: number = 0;
    private highScore: number = 0;
    private isNewHighScore: boolean = false;
    private flapsCount: number = 0;

    private pendingAchievement: Achievement | null = null;
    private achievementDisplayTimer: number = 0;
    private gameOverAchievements: Achievement[] = [];

    private animationFrameId: number | null = null;

    constructor(canvasId: string, config: Partial<GameConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.config.pipeGapMaxY = this.config.height - this.config.groundHeight - 100;

        // Initialize canvas
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        this.ctx = this.canvas.getContext('2d')!;

        // Set canvas dimensions
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // Initialize game objects
        this.bird = new Bird(this.config.birdStartX, this.config.birdStartY);
        this.ui = new UI(this.ctx, this.config);

        // Load high score
        this.highScore = storage.getHighScore();

        // Apply audio settings
        audio.setEnabled(storage.isSoundEnabled());
    }

    /**
     * Initialize the game (call after DOM is ready)
     */
    init(): void {
        this.setupInputListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.start();
    }

    /**
     * Start the game loop
     */
    private start(): void {
        this.gameLoop();
    }

    /**
     * Main game loop
     */
    private gameLoop = (): void => {
        this.update();
        this.render();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    };

    /**
     * Stop the game loop
     */
    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Update game state
     */
    private update(): void {
        // Update achievement notification timer
        if (this.pendingAchievement) {
            this.achievementDisplayTimer++;
            if (this.achievementDisplayTimer > 180) { // 3 seconds at 60fps
                this.pendingAchievement = null;
                this.achievementDisplayTimer = 0;
            }
        }

        // Check for new achievement notifications
        if (!this.pendingAchievement && achievements.hasPendingNotifications()) {
            const notifications = achievements.getPendingNotifications();
            if (notifications.length > 0) {
                this.pendingAchievement = notifications[0];
                this.achievementDisplayTimer = 0;
            }
        }

        if (this.state === GameState.MENU) {
            // Update menu animations
            this.ui.updateMenuAnimation();
            return;
        }

        if (this.state === GameState.READY) {
            // Idle bird animation only
            this.bird.update();
            return;
        }

        if (this.state === GameState.PAUSED) {
            return;
        }

        if (this.state === GameState.GAME_OVER) {
            // Still apply gravity when dead so bird falls
            this.bird.update();
            this.clampBirdToGround();
            return;
        }

        // Playing state
        this.bird.update();
        this.clampBirdToBounds();

        // Check for collisions
        if (this.checkCollisions()) {
            this.triggerGameOver();
            return;
        }

        // Spawn pipes at regular intervals
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.config.pipeSpawnInterval) {
            this.spawnPipe();
            this.pipeSpawnTimer = 0;
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].update();

            // Check if bird passed this pipe (for scoring)
            if (!this.pipes[i].passed && this.bird.x > this.pipes[i].x + this.pipes[i].width) {
                this.pipes[i].passed = true;
                this.score++;
                audio.playScore();

                // Check achievements
                this.checkAchievements();
            }

            // Remove pipes that are fully off-screen
            if (this.pipes[i].isOffScreen()) {
                this.pipes.splice(i, 1);
            }
        }
    }

    /**
     * Render the game frame
     */
    private render(): void {
        this.ui.render(
            this.state,
            this.bird,
            this.pipes,
            this.score,
            this.highScore,
            this.isNewHighScore,
            this.gameOverAchievements
        );

        // Draw achievement notification if present
        if (this.pendingAchievement) {
            this.ui.drawAchievementNotification(
                this.pendingAchievement.name,
                this.pendingAchievement.description
            );
        }
    }

    /**
     * Handle flap input
     */
    private handleFlap(): void {
        audio.init();

        if (this.state === GameState.READY) {
            this.state = GameState.PLAYING;
            this.bird.flap();
            this.flapsCount++;
            audio.playFlap();
            return;
        }

        if (this.state === GameState.PLAYING) {
            this.bird.flap();
            this.flapsCount++;
            audio.playFlap();
        }
    }

    /**
     * Handle game over button click
     */
    private handleGameOverClick(x: number, y: number): boolean {
        const buttons = this.ui.getMenuButtons();

        for (const button of buttons) {
            if (
                x >= button.x &&
                x <= button.x + button.width &&
                y >= button.y &&
                y <= button.y + button.height
            ) {
                audio.init();
                audio.playClick();

                switch (button.action) {
                    case 'playagain':
                        this.restartGame();
                        break;
                    case 'mainmenu':
                        this.reset();
                        break;
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Restart game directly (Play Again)
     */
    private restartGame(): void {
        this.bird.reset(this.config.birdStartX, this.config.birdStartY);
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.state = GameState.READY;
        this.score = 0;
        this.isNewHighScore = false;
        this.flapsCount = 0;
        this.gameOverAchievements = [];
        // Reload high score in case it changed
        this.highScore = storage.getHighScore();
    }

    /**
     * Handle menu button click
     */
    private handleMenuClick(x: number, y: number): void {
        const buttons = this.ui.getMenuButtons();

        for (const button of buttons) {
            if (
                x >= button.x &&
                x <= button.x + button.width &&
                y >= button.y &&
                y <= button.y + button.height
            ) {
                audio.init();
                audio.playClick();

                switch (button.action) {
                    case 'start':
                        this.state = GameState.READY;
                        this.ui.setCurrentMenuScreen(MenuScreen.MAIN);
                        break;
                    case 'tutorial':
                        this.ui.setCurrentMenuScreen(MenuScreen.TUTORIAL);
                        break;
                    case 'howtoplay':
                        this.ui.setCurrentMenuScreen(MenuScreen.HOW_TO_PLAY);
                        break;
                    case 'achievements':
                        this.ui.setCurrentMenuScreen(MenuScreen.ACHIEVEMENTS);
                        break;
                    case 'back':
                    case 'gotit':
                        this.ui.setCurrentMenuScreen(MenuScreen.MAIN);
                        break;
                }
                return;
            }
        }
    }

    /**
     * Get canvas coordinates from mouse/touch event
     */
    private getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.config.width / rect.width;
        const scaleY = this.config.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * Toggle pause state
     */
    private togglePause(): void {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            audio.suspend();
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            audio.resume();
        }
    }

    /**
     * Handle pause menu button click
     */
    private handlePauseClick(x: number, y: number): boolean {
        const buttons = this.ui.getMenuButtons();

        for (const button of buttons) {
            if (
                x >= button.x &&
                x <= button.x + button.width &&
                y >= button.y &&
                y <= button.y + button.height
            ) {
                audio.resume();
                audio.playClick();

                switch (button.action) {
                    case 'resume':
                        this.state = GameState.PLAYING;
                        break;
                    case 'quit':
                        this.reset();
                        break;
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Reset game to initial state
     */
    private reset(): void {
        this.bird.reset(this.config.birdStartX, this.config.birdStartY);
        this.pipes = [];
        this.pipeSpawnTimer = 0;
        this.state = GameState.MENU;
        this.ui.setCurrentMenuScreen(MenuScreen.MAIN);
        this.score = 0;
        this.isNewHighScore = false;
        this.flapsCount = 0;
        this.gameOverAchievements = [];
        // Reload high score in case it changed
        this.highScore = storage.getHighScore();
    }

    /**
     * Trigger game over state
     */
    private triggerGameOver(): void {
        if (this.state === GameState.GAME_OVER) return;

        this.state = GameState.GAME_OVER;
        audio.playDeath();

        // Record game and check for high score
        storage.recordGame(this.score);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.isNewHighScore = true;
        }

        // Check achievements and capture newly unlocked ones
        const stats = this.getStats();
        this.gameOverAchievements = achievements.checkAchievements(stats);
    }

    /**
     * Check and unlock achievements
     */
    private checkAchievements(): void {
        const stats = this.getStats();
        achievements.checkAchievements(stats);
    }

    /**
     * Get current game statistics
     */
    private getStats(): GameStats {
        return {
            currentScore: this.score,
            highScore: this.highScore,
            totalGames: storage.getTotalGames(),
            totalScore: storage.getTotalScore(),
            pipesPassed: this.score,
            flapsCount: this.flapsCount
        };
    }

    /**
     * Spawn a new pipe pair
     */
    private spawnPipe(): void {
        const gapY = this.config.pipeGapMinY +
            Math.random() * (this.config.pipeGapMaxY - this.config.pipeGapMinY);
        const pipe = new Pipe(
            this.config.width,
            gapY,
            this.config.height,
            this.config.groundHeight
        );
        this.pipes.push(pipe);
    }

    /**
     * Check AABB collision between two rectangles
     */
    private checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Check for collisions between bird and obstacles
     */
    private checkCollisions(): boolean {
        const birdBox = this.bird.getBoundingBox();

        // Check ceiling collision
        if (this.bird.y <= 0) {
            return true;
        }

        // Check ground collision
        if (this.bird.y + this.bird.height >= this.config.height - this.config.groundHeight) {
            return true;
        }

        // Check pipe collisions
        for (const pipe of this.pipes) {
            const pipeBoxes = pipe.getBoundingBoxes();

            if (this.checkAABBCollision(birdBox, pipeBoxes.top)) {
                return true;
            }

            if (this.checkAABBCollision(birdBox, pipeBoxes.bottom)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Clamp bird to stay within bounds (during play)
     */
    private clampBirdToBounds(): void {
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }

        if (this.bird.y + this.bird.height > this.config.height - this.config.groundHeight) {
            this.bird.y = this.config.height - this.config.groundHeight - this.bird.height;
            this.bird.velocity = 0;
        }
    }

    /**
     * Clamp bird to ground (when dead)
     */
    private clampBirdToGround(): void {
        if (this.bird.y + this.bird.height > this.config.height - this.config.groundHeight) {
            this.bird.y = this.config.height - this.config.groundHeight - this.bird.height;
            this.bird.velocity = 0;
        }
    }

    /**
     * Resize canvas to maintain aspect ratio
     */
    private resizeCanvas(): void {
        const container = document.getElementById('game-container');
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const gameAspectRatio = this.config.width / this.config.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let displayWidth: number;
        let displayHeight: number;

        if (containerAspectRatio > gameAspectRatio) {
            displayHeight = containerHeight;
            displayWidth = displayHeight * gameAspectRatio;
        } else {
            displayWidth = containerWidth;
            displayHeight = displayWidth / gameAspectRatio;
        }

        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
    }

    /**
     * Set up input event listeners
     */
    private setupInputListeners(): void {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state !== GameState.MENU) {
                    this.handleFlap();
                }
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                if (this.state === GameState.MENU) {
                    // Escape goes back in menu (from any submenu including Tutorial)
                    const currentScreen = this.ui.getCurrentMenuScreen();
                    if (currentScreen !== MenuScreen.MAIN) {
                        this.ui.setCurrentMenuScreen(MenuScreen.MAIN);
                    }
                } else {
                    this.togglePause();
                }
            }
        });

        // Mouse click
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            const coords = this.getCanvasCoordinates(e.clientX, e.clientY);

            if (this.state === GameState.MENU) {
                this.handleMenuClick(coords.x, coords.y);
            } else if (this.state === GameState.GAME_OVER) {
                this.handleGameOverClick(coords.x, coords.y);
            } else if (this.state === GameState.PAUSED) {
                this.handlePauseClick(coords.x, coords.y);
            } else {
                this.handleFlap();
            }
        });

        // Touch (for mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY);

            if (this.state === GameState.MENU) {
                this.handleMenuClick(coords.x, coords.y);
            } else if (this.state === GameState.GAME_OVER) {
                this.handleGameOverClick(coords.x, coords.y);
            } else if (this.state === GameState.PAUSED) {
                this.handlePauseClick(coords.x, coords.y);
            } else {
                this.handleFlap();
            }
        });
    }

    /**
     * Get current game state
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * Get current score
     */
    getScore(): number {
        return this.score;
    }

    /**
     * Get high score
     */
    getHighScore(): number {
        return this.highScore;
    }
}
