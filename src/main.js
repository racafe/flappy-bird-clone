import { Bird } from './Bird.js';
import { Pipe } from './Pipe.js';

// Game constants
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GROUND_HEIGHT = 50;
const BIRD_START_X = 80;
const BIRD_START_Y = 250;

// Pipe spawning constants
const PIPE_SPAWN_INTERVAL = 90; // Frames between pipe spawns
const PIPE_GAP_MIN_Y = 100; // Minimum gap center Y
const PIPE_GAP_MAX_Y = GAME_HEIGHT - GROUND_HEIGHT - 100; // Maximum gap center Y

// Audio context for sound effects
let audioContext = null;

/**
 * Initialize audio context (must be called after user interaction)
 */
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/**
 * Play death sound effect using Web Audio API
 */
function playDeathSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Play score sound effect using Web Audio API
 */
function playScoreSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * Check AABB collision between two rectangles
 * @param {Object} a - First rectangle {x, y, width, height}
 * @param {Object} b - Second rectangle {x, y, width, height}
 * @returns {boolean}
 */
function checkCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set fixed game resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game objects
const bird = new Bird(BIRD_START_X, BIRD_START_Y);
const pipes = [];
let pipeSpawnTimer = 0;
let isGameOver = false;
let score = 0;

/**
 * Resize canvas to maintain aspect ratio while fitting the viewport
 */
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;

    if (containerAspectRatio > gameAspectRatio) {
        // Container is wider than game - fit to height
        displayHeight = containerHeight;
        displayWidth = displayHeight * gameAspectRatio;
    } else {
        // Container is taller than game - fit to width
        displayWidth = containerWidth;
        displayHeight = displayWidth / gameAspectRatio;
    }

    // Apply CSS dimensions for display scaling
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
}

/**
 * Reset game to initial state
 */
function resetGame() {
    bird.reset(BIRD_START_X, BIRD_START_Y);
    pipes.length = 0;
    pipeSpawnTimer = 0;
    isGameOver = false;
    score = 0;
}

/**
 * Handle bird flap input
 */
function handleFlap() {
    initAudio();
    if (isGameOver) {
        resetGame();
        return;
    }
    bird.flap();
}

/**
 * Trigger game over state
 */
function triggerGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    playDeathSound();
}

/**
 * Check for collisions between bird and all obstacles
 * @returns {boolean} True if collision detected
 */
function checkCollisions() {
    const birdBox = bird.getBoundingBox();

    // Check ceiling collision
    if (bird.y <= 0) {
        return true;
    }

    // Check ground collision
    if (bird.y + bird.height >= GAME_HEIGHT - GROUND_HEIGHT) {
        return true;
    }

    // Check pipe collisions
    for (const pipe of pipes) {
        const pipeBoxes = pipe.getBoundingBoxes();

        if (checkCollision(birdBox, pipeBoxes.top)) {
            return true;
        }

        if (checkCollision(birdBox, pipeBoxes.bottom)) {
            return true;
        }
    }

    return false;
}

/**
 * Spawn a new pipe pair with randomized gap position
 */
function spawnPipe() {
    const gapY = PIPE_GAP_MIN_Y + Math.random() * (PIPE_GAP_MAX_Y - PIPE_GAP_MIN_Y);
    const pipe = new Pipe(GAME_WIDTH, gapY, GAME_HEIGHT, GROUND_HEIGHT);
    pipes.push(pipe);
}

/**
 * Set up input event listeners
 */
function setupInputListeners() {
    // Spacebar
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleFlap();
        }
    });

    // Mouse click
    canvas.addEventListener('click', (e) => {
        e.preventDefault();
        handleFlap();
    });

    // Touch (for mobile)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleFlap();
    });
}

/**
 * Update game state
 */
function update() {
    if (isGameOver) {
        // Still apply gravity when dead so bird falls
        bird.update();
        // Clamp to ground
        if (bird.y + bird.height > GAME_HEIGHT - GROUND_HEIGHT) {
            bird.y = GAME_HEIGHT - GROUND_HEIGHT - bird.height;
            bird.velocity = 0;
        }
        return;
    }

    bird.update();

    // Keep bird within bounds (don't go above screen)
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Check ground collision
    if (bird.y + bird.height > GAME_HEIGHT - GROUND_HEIGHT) {
        bird.y = GAME_HEIGHT - GROUND_HEIGHT - bird.height;
        bird.velocity = 0;
    }

    // Check for collisions
    if (checkCollisions()) {
        triggerGameOver();
        return;
    }

    // Spawn pipes at regular intervals
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        pipeSpawnTimer = 0;
    }

    // Update pipes and remove off-screen ones
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();

        // Check if bird passed this pipe (for scoring)
        if (!pipes[i].passed && bird.x > pipes[i].x + pipes[i].width) {
            pipes[i].passed = true;
            score++;
            playScoreSound();
        }

        // Remove pipes that are fully off-screen (left side)
        if (pipes[i].isOffScreen()) {
            pipes.splice(i, 1);
        }
    }
}

/**
 * Draw text with pixel font style (outline + fill for visibility)
 * @param {string} text - Text to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position
 * @param {number} size - Font size
 */
function drawPixelText(text, x, y, size) {
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Draw outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);

    // Draw fill
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);
}

/**
 * Render the game frame
 */
function render() {
    // Clear canvas with sky blue background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw pipes (behind bird)
    for (const pipe of pipes) {
        pipe.draw(ctx);
    }

    // Draw the bird
    bird.draw(ctx);

    // Draw a simple ground placeholder
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

    // Draw grass on top of ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, 10);

    // Draw score (top center)
    drawPixelText(score.toString(), GAME_WIDTH / 2, 20, 48);

    // Draw game over screen
    if (isGameOver) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Game Over text
        drawPixelText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 36);

        // Final score
        drawPixelText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2, 28);

        // Restart instruction
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    }
}

/**
 * Main game loop
 */
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupInputListeners();
    gameLoop();
}

// Start the game
init();
