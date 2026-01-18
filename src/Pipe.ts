/**
 * Pipe Module
 * Handles pipe obstacles, movement, and rendering
 */

import { PipeBoundingBoxes, PipeConfig, RenderContext } from './types.js';

/** Default pipe configuration */
const DEFAULT_CONFIG: PipeConfig = {
    width: 52,
    gap: 120,
    speed: 2
};

/** Pipe sprite cache */
interface PipeSprites {
    top: HTMLCanvasElement;
    bottom: HTMLCanvasElement;
}

let sharedSprites: PipeSprites | null = null;

/**
 * Creates pixel art pipe sprites (top and bottom variants)
 */
function createPipeSprites(): PipeSprites {
    const PIPE_WIDTH = DEFAULT_CONFIG.width;

    // Create bottom pipe sprite
    const bottomCanvas = document.createElement('canvas');
    bottomCanvas.width = PIPE_WIDTH;
    bottomCanvas.height = 400;
    const bottomCtx = bottomCanvas.getContext('2d')!;
    bottomCtx.imageSmoothingEnabled = false;

    // Main pipe body (green)
    bottomCtx.fillStyle = '#73BF2E';
    bottomCtx.fillRect(4, 26, PIPE_WIDTH - 8, 374);

    // Pipe body darker shade (left side)
    bottomCtx.fillStyle = '#5A9A24';
    bottomCtx.fillRect(4, 26, 8, 374);

    // Pipe body lighter shade (right side highlight)
    bottomCtx.fillStyle = '#8ED43A';
    bottomCtx.fillRect(PIPE_WIDTH - 16, 26, 8, 374);

    // Pipe cap (lip at top)
    bottomCtx.fillStyle = '#73BF2E';
    bottomCtx.fillRect(0, 0, PIPE_WIDTH, 26);

    // Cap darker shade (left)
    bottomCtx.fillStyle = '#5A9A24';
    bottomCtx.fillRect(0, 0, 6, 26);

    // Cap lighter shade (right highlight)
    bottomCtx.fillStyle = '#8ED43A';
    bottomCtx.fillRect(PIPE_WIDTH - 10, 0, 6, 26);

    // Cap top highlight
    bottomCtx.fillStyle = '#9BE048';
    bottomCtx.fillRect(6, 2, PIPE_WIDTH - 16, 4);

    // Outline (dark green/black)
    bottomCtx.fillStyle = '#2C5F0F';
    bottomCtx.fillRect(0, 0, PIPE_WIDTH, 2);
    bottomCtx.fillRect(0, 0, 2, 26);
    bottomCtx.fillRect(2, 26, 2, 374);
    bottomCtx.fillRect(PIPE_WIDTH - 2, 0, 2, 26);
    bottomCtx.fillRect(PIPE_WIDTH - 4, 26, 2, 374);
    bottomCtx.fillRect(0, 24, 4, 2);
    bottomCtx.fillRect(PIPE_WIDTH - 4, 24, 4, 2);

    // Create top pipe sprite (flipped version)
    const topCanvas = document.createElement('canvas');
    topCanvas.width = PIPE_WIDTH;
    topCanvas.height = 400;
    const topCtx = topCanvas.getContext('2d')!;
    topCtx.imageSmoothingEnabled = false;

    // Main pipe body (green)
    topCtx.fillStyle = '#73BF2E';
    topCtx.fillRect(4, 0, PIPE_WIDTH - 8, 374);

    // Pipe body darker shade (left side)
    topCtx.fillStyle = '#5A9A24';
    topCtx.fillRect(4, 0, 8, 374);

    // Pipe body lighter shade (right side highlight)
    topCtx.fillStyle = '#8ED43A';
    topCtx.fillRect(PIPE_WIDTH - 16, 0, 8, 374);

    // Pipe cap (lip at bottom)
    topCtx.fillStyle = '#73BF2E';
    topCtx.fillRect(0, 374, PIPE_WIDTH, 26);

    // Cap darker shade (left)
    topCtx.fillStyle = '#5A9A24';
    topCtx.fillRect(0, 374, 6, 26);

    // Cap lighter shade (right highlight)
    topCtx.fillStyle = '#8ED43A';
    topCtx.fillRect(PIPE_WIDTH - 10, 374, 6, 26);

    // Cap bottom shadow
    topCtx.fillStyle = '#5A9A24';
    topCtx.fillRect(6, 394, PIPE_WIDTH - 16, 4);

    // Outline (dark green/black)
    topCtx.fillStyle = '#2C5F0F';
    topCtx.fillRect(0, 398, PIPE_WIDTH, 2);
    topCtx.fillRect(0, 374, 2, 26);
    topCtx.fillRect(2, 0, 2, 374);
    topCtx.fillRect(PIPE_WIDTH - 2, 374, 2, 26);
    topCtx.fillRect(PIPE_WIDTH - 4, 0, 2, 374);
    topCtx.fillRect(0, 374, 4, 2);
    topCtx.fillRect(PIPE_WIDTH - 4, 374, 4, 2);

    return { top: topCanvas, bottom: bottomCanvas };
}

/**
 * Get shared pipe sprites (lazy initialization)
 */
function getSprites(): PipeSprites {
    if (!sharedSprites) {
        sharedSprites = createPipeSprites();
    }
    return sharedSprites;
}

export class Pipe {
    x: number;
    readonly width: number;
    readonly gap: number;
    readonly speed: number;
    passed: boolean = false;

    private sprites: PipeSprites;
    private topPipeHeight: number;
    private bottomPipeY: number;
    private bottomPipeHeight: number;

    /**
     * Create a pipe pair
     * @param x - X position (right side of screen)
     * @param gapY - Y position of the gap center
     * @param gameHeight - Total game height
     * @param groundHeight - Height of the ground
     * @param config - Optional pipe configuration
     */
    constructor(
        x: number,
        gapY: number,
        gameHeight: number,
        groundHeight: number,
        config: Partial<PipeConfig> = {}
    ) {
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };

        this.x = x;
        this.width = mergedConfig.width;
        this.gap = mergedConfig.gap;
        this.speed = mergedConfig.speed;
        this.sprites = getSprites();

        // Calculate pipe heights
        this.topPipeHeight = gapY - this.gap / 2;
        this.bottomPipeY = gapY + this.gap / 2;
        this.bottomPipeHeight = gameHeight - groundHeight - this.bottomPipeY;
    }

    /**
     * Update pipe position
     */
    update(): void {
        this.x -= this.speed;
    }

    /**
     * Check if pipe is off screen (left side)
     */
    isOffScreen(): boolean {
        return this.x + this.width < 0;
    }

    /**
     * Draw the pipe pair
     */
    draw(ctx: RenderContext): void {
        // Draw top pipe
        if (this.topPipeHeight > 0) {
            ctx.drawImage(
                this.sprites.top,
                0, 400 - this.topPipeHeight,
                this.width, this.topPipeHeight,
                this.x, 0,
                this.width, this.topPipeHeight
            );
        }

        // Draw bottom pipe
        if (this.bottomPipeHeight > 0) {
            ctx.drawImage(
                this.sprites.bottom,
                0, 0,
                this.width, this.bottomPipeHeight,
                this.x, this.bottomPipeY,
                this.width, this.bottomPipeHeight
            );
        }
    }

    /**
     * Get bounding boxes for collision detection
     */
    getBoundingBoxes(): PipeBoundingBoxes {
        return {
            top: {
                x: this.x,
                y: 0,
                width: this.width,
                height: this.topPipeHeight
            },
            bottom: {
                x: this.x,
                y: this.bottomPipeY,
                width: this.width,
                height: this.bottomPipeHeight
            }
        };
    }
}

/** Export pipe constants for external use */
export const PIPE_WIDTH = DEFAULT_CONFIG.width;
export const PIPE_GAP = DEFAULT_CONFIG.gap;
export const PIPE_SPEED = DEFAULT_CONFIG.speed;
