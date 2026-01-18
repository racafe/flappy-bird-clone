/**
 * Bird Module
 * Handles bird entity, physics, animation, and rendering
 */

import { BoundingBox, BirdConfig, RenderContext } from './types.js';

/** Default bird configuration */
const DEFAULT_CONFIG: BirdConfig = {
    gravity: 0.5,
    flapVelocity: -8,
    maxFallVelocity: 10,
    rotationSpeed: 3,
    maxUpRotation: -30,
    maxDownRotation: 90,
    width: 34,
    height: 24
};

/** Wing position for animation frames */
type WingPosition = 'up' | 'mid' | 'down';

/**
 * Creates pixel art bird sprite frames on offscreen canvases
 */
function createBirdSprites(): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    const wingPositions: WingPosition[] = ['up', 'mid', 'down'];

    for (const wingPos of wingPositions) {
        const canvas = document.createElement('canvas');
        canvas.width = DEFAULT_CONFIG.width;
        canvas.height = DEFAULT_CONFIG.height;
        const ctx = canvas.getContext('2d')!;

        ctx.imageSmoothingEnabled = false;

        // Bird body (yellow)
        ctx.fillStyle = '#F7DC6F';
        ctx.fillRect(4, 6, 22, 14);

        // Bird belly (lighter yellow)
        ctx.fillStyle = '#FCF3CF';
        ctx.fillRect(4, 12, 16, 6);

        // Bird head top curve
        ctx.fillStyle = '#F7DC6F';
        ctx.fillRect(8, 4, 14, 4);
        ctx.fillRect(12, 2, 8, 4);

        // Eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(18, 6, 6, 6);

        // Eye pupil
        ctx.fillStyle = '#000000';
        ctx.fillRect(20, 8, 3, 3);

        // Beak (orange)
        ctx.fillStyle = '#E67E22';
        ctx.fillRect(26, 10, 8, 4);
        ctx.fillRect(28, 14, 4, 2);

        // Wing (darker yellow/orange)
        ctx.fillStyle = '#D4AC0D';
        if (wingPos === 'up') {
            ctx.fillRect(6, 4, 10, 6);
        } else if (wingPos === 'mid') {
            ctx.fillRect(6, 10, 10, 4);
        } else {
            ctx.fillRect(6, 14, 10, 6);
        }

        // Tail feathers
        ctx.fillStyle = '#D4AC0D';
        ctx.fillRect(0, 8, 6, 3);
        ctx.fillRect(0, 13, 6, 3);

        // Outline (dark)
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(12, 0, 8, 2);
        ctx.fillRect(8, 2, 4, 2);
        ctx.fillRect(20, 2, 4, 2);
        ctx.fillRect(6, 4, 2, 2);
        ctx.fillRect(22, 4, 2, 4);
        ctx.fillRect(4, 18, 22, 2);
        ctx.fillRect(2, 16, 2, 2);
        ctx.fillRect(26, 16, 2, 2);
        ctx.fillRect(2, 6, 2, 10);

        frames.push(canvas);
    }

    return frames;
}

export class Bird {
    x: number;
    y: number;
    velocity: number = 0;
    rotation: number = 0;

    readonly width: number;
    readonly height: number;

    private config: BirdConfig;
    private sprites: HTMLCanvasElement[];
    private currentFrame: number = 0;
    private animationTimer: number = 0;
    private animationSpeed: number = 8;
    private isFlapping: boolean = false;
    private flapAnimationTimer: number = 0;

    constructor(x: number, y: number, config: Partial<BirdConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.x = x;
        this.y = y;
        this.width = this.config.width;
        this.height = this.config.height;
        this.sprites = createBirdSprites();
    }

    /**
     * Make the bird flap (jump)
     */
    flap(): void {
        this.velocity = this.config.flapVelocity;
        this.isFlapping = true;
        this.flapAnimationTimer = 0;
        this.currentFrame = 0;
    }

    /**
     * Update bird physics and animation
     */
    update(): void {
        // Apply gravity
        this.velocity += this.config.gravity;

        // Cap fall velocity
        if (this.velocity > this.config.maxFallVelocity) {
            this.velocity = this.config.maxFallVelocity;
        }

        // Update position
        this.y += this.velocity;

        // Update rotation based on velocity
        if (this.velocity < 0) {
            this.rotation += (this.config.maxUpRotation - this.rotation) * 0.2;
        } else {
            this.rotation += this.config.rotationSpeed;
            if (this.rotation > this.config.maxDownRotation) {
                this.rotation = this.config.maxDownRotation;
            }
        }

        // Update animation
        this.animationTimer++;
        if (this.isFlapping) {
            this.flapAnimationTimer++;
            if (this.flapAnimationTimer < 4) {
                this.currentFrame = 0;
            } else if (this.flapAnimationTimer < 8) {
                this.currentFrame = 1;
            } else if (this.flapAnimationTimer < 12) {
                this.currentFrame = 2;
            } else {
                this.isFlapping = false;
                this.currentFrame = 1;
            }
        } else {
            if (this.animationTimer % this.animationSpeed === 0) {
                this.currentFrame = (this.currentFrame + 1) % 3;
            }
        }
    }

    /**
     * Draw the bird on the canvas
     */
    draw(ctx: RenderContext): void {
        ctx.save();

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation * Math.PI / 180);

        ctx.drawImage(
            this.sprites[this.currentFrame],
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();
    }

    /**
     * Reset bird to initial position
     */
    reset(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
        this.currentFrame = 1;
        this.isFlapping = false;
    }

    /**
     * Get bird bounding box for collision detection
     */
    getBoundingBox(): BoundingBox {
        const padding = 4;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}
