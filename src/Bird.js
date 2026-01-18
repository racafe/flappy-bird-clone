// Bird constants
const GRAVITY = 0.5;
const FLAP_VELOCITY = -8;
const MAX_FALL_VELOCITY = 10;
const ROTATION_SPEED = 3;
const MAX_UP_ROTATION = -30;
const MAX_DOWN_ROTATION = 90;

// Bird sprite dimensions
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;

/**
 * Creates pixel art bird sprite frames on offscreen canvases
 * @returns {HTMLCanvasElement[]} Array of 3 animation frames
 */
function createBirdSprites() {
    const frames = [];

    // Wing positions for each frame: 0 = up, 1 = mid, 2 = down
    const wingPositions = ['up', 'mid', 'down'];

    for (const wingPos of wingPositions) {
        const canvas = document.createElement('canvas');
        canvas.width = BIRD_WIDTH;
        canvas.height = BIRD_HEIGHT;
        const ctx = canvas.getContext('2d');

        // Enable pixelated rendering
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
        // Top outline
        ctx.fillRect(12, 0, 8, 2);
        ctx.fillRect(8, 2, 4, 2);
        ctx.fillRect(20, 2, 4, 2);
        ctx.fillRect(6, 4, 2, 2);
        ctx.fillRect(22, 4, 2, 4);
        // Bottom outline
        ctx.fillRect(4, 18, 22, 2);
        ctx.fillRect(2, 16, 2, 2);
        ctx.fillRect(26, 16, 2, 2);
        // Side outlines
        ctx.fillRect(2, 6, 2, 10);

        frames.push(canvas);
    }

    return frames;
}

export class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = BIRD_WIDTH;
        this.height = BIRD_HEIGHT;
        this.velocity = 0;
        this.rotation = 0;

        // Animation state
        this.sprites = createBirdSprites();
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 8; // frames per animation frame change
        this.isFlapping = false;
        this.flapAnimationTimer = 0;
    }

    /**
     * Make the bird flap (jump)
     */
    flap() {
        this.velocity = FLAP_VELOCITY;
        this.isFlapping = true;
        this.flapAnimationTimer = 0;
        this.currentFrame = 0; // Start from wing up
    }

    /**
     * Update bird physics and animation
     */
    update() {
        // Apply gravity
        this.velocity += GRAVITY;

        // Cap fall velocity
        if (this.velocity > MAX_FALL_VELOCITY) {
            this.velocity = MAX_FALL_VELOCITY;
        }

        // Update position
        this.y += this.velocity;

        // Update rotation based on velocity
        if (this.velocity < 0) {
            // Rising - rotate up
            this.rotation += (MAX_UP_ROTATION - this.rotation) * 0.2;
        } else {
            // Falling - rotate down gradually
            this.rotation += ROTATION_SPEED;
            if (this.rotation > MAX_DOWN_ROTATION) {
                this.rotation = MAX_DOWN_ROTATION;
            }
        }

        // Update animation
        this.animationTimer++;
        if (this.isFlapping) {
            // Fast flap animation when actively flapping
            this.flapAnimationTimer++;
            if (this.flapAnimationTimer < 4) {
                this.currentFrame = 0; // Wing up
            } else if (this.flapAnimationTimer < 8) {
                this.currentFrame = 1; // Wing mid
            } else if (this.flapAnimationTimer < 12) {
                this.currentFrame = 2; // Wing down
            } else {
                this.isFlapping = false;
                this.currentFrame = 1; // Return to mid
            }
        } else {
            // Gentle idle animation
            if (this.animationTimer % this.animationSpeed === 0) {
                this.currentFrame = (this.currentFrame + 1) % 3;
            }
        }
    }

    /**
     * Draw the bird on the canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.save();

        // Move to bird center for rotation
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Apply rotation (convert to radians)
        ctx.rotate(this.rotation * Math.PI / 180);

        // Draw sprite centered
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
     * @param {number} x
     * @param {number} y
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
        this.currentFrame = 1;
        this.isFlapping = false;
    }

    /**
     * Get bird bounding box for collision detection
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBoundingBox() {
        // Slightly smaller hitbox for better gameplay feel
        const padding = 4;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}
