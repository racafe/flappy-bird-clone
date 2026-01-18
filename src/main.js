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
 * Handle bird flap input
 */
function handleFlap() {
    bird.flap();
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

    // Spawn pipes at regular intervals
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        pipeSpawnTimer = 0;
    }

    // Update pipes and remove off-screen ones
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();

        // Remove pipes that are fully off-screen (left side)
        if (pipes[i].isOffScreen()) {
            pipes.splice(i, 1);
        }
    }
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
