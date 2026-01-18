/**
 * UI Module
 * Handles all rendering, text display, and visual effects
 */

import { GameConfig, GameState, RenderContext } from './types.js';
import { Bird } from './Bird.js';
import { Pipe } from './Pipe.js';

/** UI color palette */
const COLORS = {
    sky: '#87CEEB',
    ground: '#8B4513',
    grass: '#228B22',
    textOutline: '#000000',
    textFill: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)'
};

export class UI {
    private ctx: RenderContext;
    private config: GameConfig;

    constructor(ctx: RenderContext, config: GameConfig) {
        this.ctx = ctx;
        this.config = config;
    }

    /**
     * Clear the canvas with sky background
     */
    clearCanvas(): void {
        this.ctx.fillStyle = COLORS.sky;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    /**
     * Draw the ground
     */
    drawGround(): void {
        // Ground base
        this.ctx.fillStyle = COLORS.ground;
        this.ctx.fillRect(
            0,
            this.config.height - this.config.groundHeight,
            this.config.width,
            this.config.groundHeight
        );

        // Grass on top
        this.ctx.fillStyle = COLORS.grass;
        this.ctx.fillRect(
            0,
            this.config.height - this.config.groundHeight,
            this.config.width,
            10
        );
    }

    /**
     * Draw all pipes
     */
    drawPipes(pipes: Pipe[]): void {
        for (const pipe of pipes) {
            pipe.draw(this.ctx);
        }
    }

    /**
     * Draw the bird
     */
    drawBird(bird: Bird): void {
        bird.draw(this.ctx);
    }

    /**
     * Draw text with pixel font style (outline + fill)
     */
    drawPixelText(
        text: string,
        x: number,
        y: number,
        size: number,
        align: CanvasTextAlign = 'center'
    ): void {
        this.ctx.font = `bold ${size}px "Courier New", monospace`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';

        // Draw outline
        this.ctx.strokeStyle = COLORS.textOutline;
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(text, x, y);

        // Draw fill
        this.ctx.fillStyle = COLORS.textFill;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Draw the score display
     */
    drawScore(score: number): void {
        this.drawPixelText(score.toString(), this.config.width / 2, 20, 48);
    }

    /**
     * Draw high score indicator
     */
    drawHighScore(highScore: number): void {
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(`Best: ${highScore}`, this.config.width / 2, 75);
        this.ctx.fillText(`Best: ${highScore}`, this.config.width / 2, 75);
    }

    /**
     * Draw semi-transparent overlay
     */
    drawOverlay(): void {
        this.ctx.fillStyle = COLORS.overlay;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    /**
     * Draw game over screen
     */
    drawGameOver(score: number, highScore: number, isNewHighScore: boolean): void {
        this.drawOverlay();

        // Game Over text
        this.drawPixelText('GAME OVER', this.config.width / 2, this.config.height / 2 - 80, 36);

        // Final score
        this.drawPixelText(`Score: ${score}`, this.config.width / 2, this.config.height / 2 - 20, 28);

        // High score
        if (isNewHighScore) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 20px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText('NEW HIGH SCORE!', this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText('NEW HIGH SCORE!', this.config.width / 2, this.config.height / 2 + 20);
        } else {
            this.ctx.font = 'bold 18px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(`Best: ${highScore}`, this.config.width / 2, this.config.height / 2 + 20);
            this.ctx.fillText(`Best: ${highScore}`, this.config.width / 2, this.config.height / 2 + 20);
        }

        // Restart instruction
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Press SPACE to restart', this.config.width / 2, this.config.height / 2 + 70);
    }

    /**
     * Draw start screen
     */
    drawStartScreen(): void {
        // Title
        this.drawPixelText('FLAPPY BIRD', this.config.width / 2, 100, 32);

        // Instructions
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;

        const instructions = [
            'Press SPACE or Click to flap',
            'Avoid the pipes!',
            '',
            'Press SPACE to start'
        ];

        instructions.forEach((text, i) => {
            this.ctx.strokeText(text, this.config.width / 2, 250 + i * 30);
            this.ctx.fillText(text, this.config.width / 2, 250 + i * 30);
        });
    }

    /**
     * Draw pause overlay
     */
    drawPauseScreen(): void {
        this.drawOverlay();
        this.drawPixelText('PAUSED', this.config.width / 2, this.config.height / 2 - 30, 36);

        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Press P to resume', this.config.width / 2, this.config.height / 2 + 30);
    }

    /**
     * Draw achievement notification
     */
    drawAchievementNotification(name: string, description: string): void {
        const boxWidth = 280;
        const boxHeight = 60;
        const x = (this.config.width - boxWidth) / 2;
        const y = 100;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);

        // Border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Title
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('Achievement Unlocked!', this.config.width / 2, y + 18);

        // Achievement name
        this.ctx.font = 'bold 12px "Courier New", monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(name, this.config.width / 2, y + 38);

        // Description
        this.ctx.font = '10px "Courier New", monospace';
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText(description, this.config.width / 2, y + 52);
    }

    /**
     * Render the full game frame
     */
    render(
        state: GameState,
        bird: Bird,
        pipes: Pipe[],
        score: number,
        highScore: number,
        isNewHighScore: boolean = false
    ): void {
        this.clearCanvas();
        this.drawPipes(pipes);
        this.drawBird(bird);
        this.drawGround();
        this.drawScore(score);

        if (state === GameState.READY) {
            this.drawStartScreen();
        } else if (state === GameState.GAME_OVER) {
            this.drawGameOver(score, highScore, isNewHighScore);
        } else if (state === GameState.PAUSED) {
            this.drawPauseScreen();
        }
    }
}
