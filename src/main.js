// Game constants
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set fixed game resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

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
 * Render the game frame
 */
function render() {
    // Clear canvas with sky blue background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw a simple ground placeholder
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);

    // Draw grass on top of ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 10);
}

/**
 * Main game loop
 */
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    gameLoop();
}

// Start the game
init();
