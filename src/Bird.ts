/**
 * Bird Module
 * Handles bird entity, physics, animation, and rendering
 */

import { BoundingBox, BirdConfig, RenderContext } from './types.js';
import { storage } from './Storage.js';

/** Default bird configuration */
const DEFAULT_CONFIG: BirdConfig = {
    gravity: 0.3,
    flapVelocity: -4.5,
    maxFallVelocity: 10,
    rotationSpeed: 3,
    maxUpRotation: -30,
    maxDownRotation: 90,
    width: 34,
    height: 24
};

/** Wing position for animation frames */
type WingPosition = 'up' | 'mid' | 'down';

/** Bird skin color palette */
export interface BirdSkinColors {
    body: string;
    belly: string;
    wing: string;
    beak: string;
    outline: string;
}

/** Available bird skins */
export type BirdSkinId = 'default' | 'blue' | 'red' | 'golden' | 'rainbow';

/** Bird skin definition */
export interface BirdSkin {
    id: BirdSkinId;
    name: string;
    colors: BirdSkinColors;
    isRainbow?: boolean;
}

/** All available bird skins */
export const BIRD_SKINS: Record<BirdSkinId, BirdSkin> = {
    default: {
        id: 'default',
        name: 'Classic Bird',
        colors: {
            body: '#F7DC6F',
            belly: '#FCF3CF',
            wing: '#D4AC0D',
            beak: '#E67E22',
            outline: '#2C3E50'
        }
    },
    blue: {
        id: 'blue',
        name: 'Blue Bird',
        colors: {
            body: '#5DADE2',
            belly: '#AED6F1',
            wing: '#2E86C1',
            beak: '#E67E22',
            outline: '#1B4F72'
        }
    },
    red: {
        id: 'red',
        name: 'Red Bird',
        colors: {
            body: '#E74C3C',
            belly: '#F5B7B1',
            wing: '#B03A2E',
            beak: '#E67E22',
            outline: '#641E16'
        }
    },
    golden: {
        id: 'golden',
        name: 'Golden Bird',
        colors: {
            body: '#F4D03F',
            belly: '#FCF3CF',
            wing: '#D4AC0D',
            beak: '#E67E22',
            outline: '#7D6608'
        }
    },
    rainbow: {
        id: 'rainbow',
        name: 'Rainbow Bird',
        colors: {
            body: '#FF6B6B',
            belly: '#FFE66D',
            wing: '#4ECDC4',
            beak: '#E67E22',
            outline: '#2C3E50'
        },
        isRainbow: true
    }
};

/** Rainbow color cycle for the rainbow bird */
const RAINBOW_COLORS = [
    { body: '#FF6B6B', belly: '#FFB6C1', wing: '#FF4757' },  // Red
    { body: '#FFA500', belly: '#FFD93D', wing: '#FF8C00' },  // Orange
    { body: '#F7DC6F', belly: '#FCF3CF', wing: '#F1C40F' },  // Yellow
    { body: '#4ECDC4', belly: '#A8E6CF', wing: '#26A69A' },  // Green/Teal
    { body: '#5DADE2', belly: '#AED6F1', wing: '#3498DB' },  // Blue
    { body: '#9B59B6', belly: '#D7BDE2', wing: '#8E44AD' }   // Purple
];

/**
 * Creates pixel art bird sprite frames on offscreen canvases
 */
function createBirdSprites(skinId: BirdSkinId = 'default', rainbowFrame: number = 0): HTMLCanvasElement[] {
    const frames: HTMLCanvasElement[] = [];
    const wingPositions: WingPosition[] = ['up', 'mid', 'down'];
    const skin = BIRD_SKINS[skinId];

    // Get colors - for rainbow bird, cycle through colors
    let colors = skin.colors;
    if (skin.isRainbow) {
        const rainbowIdx = rainbowFrame % RAINBOW_COLORS.length;
        colors = {
            ...skin.colors,
            body: RAINBOW_COLORS[rainbowIdx].body,
            belly: RAINBOW_COLORS[rainbowIdx].belly,
            wing: RAINBOW_COLORS[rainbowIdx].wing
        };
    }

    for (const wingPos of wingPositions) {
        const canvas = document.createElement('canvas');
        canvas.width = DEFAULT_CONFIG.width;
        canvas.height = DEFAULT_CONFIG.height;
        const ctx = canvas.getContext('2d')!;

        ctx.imageSmoothingEnabled = false;

        // Bird body
        ctx.fillStyle = colors.body;
        ctx.fillRect(4, 6, 22, 14);

        // Bird belly
        ctx.fillStyle = colors.belly;
        ctx.fillRect(4, 12, 16, 6);

        // Bird head top curve
        ctx.fillStyle = colors.body;
        ctx.fillRect(8, 4, 14, 4);
        ctx.fillRect(12, 2, 8, 4);

        // Eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(18, 6, 6, 6);

        // Eye pupil
        ctx.fillStyle = '#000000';
        ctx.fillRect(20, 8, 3, 3);

        // Beak
        ctx.fillStyle = colors.beak;
        ctx.fillRect(26, 10, 8, 4);
        ctx.fillRect(28, 14, 4, 2);

        // Wing
        ctx.fillStyle = colors.wing;
        if (wingPos === 'up') {
            ctx.fillRect(6, 4, 10, 6);
        } else if (wingPos === 'mid') {
            ctx.fillRect(6, 10, 10, 4);
        } else {
            ctx.fillRect(6, 14, 10, 6);
        }

        // Tail feathers
        ctx.fillStyle = colors.wing;
        ctx.fillRect(0, 8, 6, 3);
        ctx.fillRect(0, 13, 6, 3);

        // Outline
        ctx.fillStyle = colors.outline;
        ctx.fillRect(12, 0, 8, 2);
        ctx.fillRect(8, 2, 4, 2);
        ctx.fillRect(20, 2, 4, 2);
        ctx.fillRect(6, 4, 2, 2);
        ctx.fillRect(22, 4, 2, 4);
        ctx.fillRect(4, 18, 22, 2);
        ctx.fillRect(2, 16, 2, 2);
        ctx.fillRect(26, 16, 2, 2);
        ctx.fillRect(2, 6, 2, 10);

        // Add sparkle effect for golden bird
        if (skinId === 'golden') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(10, 6, 2, 2);
            ctx.fillRect(14, 10, 2, 2);
        }

        frames.push(canvas);
    }

    return frames;
}

/**
 * Create a bird sprite for display purposes (menu, skin selection)
 */
export function createBirdSpriteForSkin(skinId: BirdSkinId, rainbowFrame: number = 0): HTMLCanvasElement {
    const sprites = createBirdSprites(skinId, rainbowFrame);
    return sprites[1]; // Return mid-wing position
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
    private currentSkinId: BirdSkinId;
    private rainbowTimer: number = 0;
    private rainbowFrame: number = 0;

    constructor(x: number, y: number, config: Partial<BirdConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.x = x;
        this.y = y;
        this.width = this.config.width;
        this.height = this.config.height;
        // Load skin from storage or use default
        const savedSkin = storage.getSelectedSkin();
        this.currentSkinId = this.isValidSkinId(savedSkin) ? savedSkin : 'default';
        this.sprites = createBirdSprites(this.currentSkinId, this.rainbowFrame);
    }

    /**
     * Check if a string is a valid BirdSkinId
     */
    private isValidSkinId(id: string): id is BirdSkinId {
        return id in BIRD_SKINS;
    }

    /**
     * Set the bird's skin
     */
    setSkin(skinId: BirdSkinId): void {
        this.currentSkinId = skinId;
        this.sprites = createBirdSprites(skinId, this.rainbowFrame);
    }

    /**
     * Get the current skin ID
     */
    getSkinId(): BirdSkinId {
        return this.currentSkinId;
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

        // Update rainbow animation (color cycling)
        if (this.currentSkinId === 'rainbow') {
            this.rainbowTimer++;
            if (this.rainbowTimer % 15 === 0) {
                this.rainbowFrame = (this.rainbowFrame + 1) % RAINBOW_COLORS.length;
                this.sprites = createBirdSprites('rainbow', this.rainbowFrame);
            }
        }
    }

    /**
     * Update only animation (no physics) - used during READY state
     */
    updateAnimation(): void {
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

        // Update rainbow animation (color cycling)
        if (this.currentSkinId === 'rainbow') {
            this.rainbowTimer++;
            if (this.rainbowTimer % 15 === 0) {
                this.rainbowFrame = (this.rainbowFrame + 1) % RAINBOW_COLORS.length;
                this.sprites = createBirdSprites('rainbow', this.rainbowFrame);
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
        // Reload skin from storage in case it changed
        const savedSkin = storage.getSelectedSkin();
        if (this.isValidSkinId(savedSkin) && savedSkin !== this.currentSkinId) {
            this.currentSkinId = savedSkin;
            this.rainbowFrame = 0;
            this.rainbowTimer = 0;
            this.sprites = createBirdSprites(this.currentSkinId, this.rainbowFrame);
        }
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
