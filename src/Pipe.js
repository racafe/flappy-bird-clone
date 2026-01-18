// Pipe constants
const PIPE_WIDTH = 52;
const PIPE_GAP = 120; // Gap size between top and bottom pipes
const PIPE_SPEED = 2;

/**
 * Creates pixel art pipe sprites (top and bottom variants)
 * @returns {{top: HTMLCanvasElement, bottom: HTMLCanvasElement}}
 */
function createPipeSprites() {
    const sprites = {};

    // Create bottom pipe sprite
    const bottomCanvas = document.createElement('canvas');
    bottomCanvas.width = PIPE_WIDTH;
    bottomCanvas.height = 400; // Max height for pipe
    const bottomCtx = bottomCanvas.getContext('2d');
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
    // Top edge of cap
    bottomCtx.fillRect(0, 0, PIPE_WIDTH, 2);
    // Left edge
    bottomCtx.fillRect(0, 0, 2, 26);
    bottomCtx.fillRect(2, 26, 2, 374);
    // Right edge
    bottomCtx.fillRect(PIPE_WIDTH - 2, 0, 2, 26);
    bottomCtx.fillRect(PIPE_WIDTH - 4, 26, 2, 374);
    // Bottom of cap
    bottomCtx.fillRect(0, 24, 4, 2);
    bottomCtx.fillRect(PIPE_WIDTH - 4, 24, 4, 2);

    sprites.bottom = bottomCanvas;

    // Create top pipe sprite (flipped version)
    const topCanvas = document.createElement('canvas');
    topCanvas.width = PIPE_WIDTH;
    topCanvas.height = 400;
    const topCtx = topCanvas.getContext('2d');
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
    // Bottom edge of cap
    topCtx.fillRect(0, 398, PIPE_WIDTH, 2);
    // Left edge
    topCtx.fillRect(0, 374, 2, 26);
    topCtx.fillRect(2, 0, 2, 374);
    // Right edge
    topCtx.fillRect(PIPE_WIDTH - 2, 374, 2, 26);
    topCtx.fillRect(PIPE_WIDTH - 4, 0, 2, 374);
    // Top of cap
    topCtx.fillRect(0, 374, 4, 2);
    topCtx.fillRect(PIPE_WIDTH - 4, 374, 4, 2);

    sprites.top = topCanvas;

    return sprites;
}

// Shared sprites for all pipes
let sharedSprites = null;

function getSprites() {
    if (!sharedSprites) {
        sharedSprites = createPipeSprites();
    }
    return sharedSprites;
}

export class Pipe {
    /**
     * Create a pipe pair
     * @param {number} x - X position (right side of screen)
     * @param {number} gapY - Y position of the gap center
     * @param {number} gameHeight - Total game height
     * @param {number} groundHeight - Height of the ground
     */
    constructor(x, gapY, gameHeight, groundHeight) {
        this.x = x;
        this.gapY = gapY;
        this.width = PIPE_WIDTH;
        this.gap = PIPE_GAP;
        this.speed = PIPE_SPEED;
        this.gameHeight = gameHeight;
        this.groundHeight = groundHeight;
        this.sprites = getSprites();
        this.passed = false; // For scoring

        // Calculate pipe heights
        this.topPipeHeight = gapY - this.gap / 2;
        this.bottomPipeY = gapY + this.gap / 2;
        this.bottomPipeHeight = gameHeight - groundHeight - this.bottomPipeY;
    }

    /**
     * Update pipe position
     */
    update() {
        this.x -= this.speed;
    }

    /**
     * Check if pipe is off screen (left side)
     * @returns {boolean}
     */
    isOffScreen() {
        return this.x + this.width < 0;
    }

    /**
     * Draw the pipe pair
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        // Draw top pipe
        if (this.topPipeHeight > 0) {
            ctx.drawImage(
                this.sprites.top,
                0, 400 - this.topPipeHeight, // Source: bottom portion of sprite
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
     * @returns {{top: {x: number, y: number, width: number, height: number}, bottom: {x: number, y: number, width: number, height: number}}}
     */
    getBoundingBoxes() {
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

export { PIPE_WIDTH, PIPE_GAP, PIPE_SPEED };
