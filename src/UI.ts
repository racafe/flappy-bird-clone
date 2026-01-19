/**
 * UI Module
 * Handles all rendering, text display, and visual effects
 */

import { GameConfig, GameState, MenuScreen, MenuButton, RenderContext } from './types.js';
import { Bird, BIRD_SKINS, BirdSkinId, createBirdSpriteForSkin } from './Bird.js';
import { Pipe } from './Pipe.js';
import { storage } from './Storage.js';
import { achievements } from './Achievements.js';
import { audio } from './Audio.js';

/** UI color palette */
const COLORS = {
    sky: '#87CEEB',
    ground: '#8B4513',
    grass: '#228B22',
    textOutline: '#000000',
    textFill: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)'
};

/** Time of day phases based on score */
enum TimeOfDay {
    DAY = 'day',
    SUNSET = 'sunset',
    NIGHT = 'night'
}

/** Color palette for each time of day */
interface TimeColors {
    skyTop: string;
    skyBottom: string;
    ground: string;
    grass: string;
}

const TIME_PALETTES: Record<TimeOfDay, TimeColors> = {
    [TimeOfDay.DAY]: {
        skyTop: '#4A90D9',
        skyBottom: '#87CEEB',
        ground: '#8B4513',
        grass: '#228B22'
    },
    [TimeOfDay.SUNSET]: {
        skyTop: '#2C3E50',
        skyBottom: '#E67E22',
        ground: '#5D3A1A',
        grass: '#1A5C1A'
    },
    [TimeOfDay.NIGHT]: {
        skyTop: '#0D1B2A',
        skyBottom: '#1B263B',
        ground: '#3D2914',
        grass: '#0F3D0F'
    }
};

/** Score thresholds for time phases */
const TIME_THRESHOLDS = {
    dayEnd: 25,
    sunsetEnd: 50
};

/** Parallax element interface */
interface ParallaxElement {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
}

/** Parse hex color to RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

/** Convert RGB to hex */
function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/** Interpolate between two colors */
function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    return rgbToHex(
        c1.r + (c2.r - c1.r) * t,
        c1.g + (c2.g - c1.g) * t,
        c1.b + (c2.b - c1.b) * t
    );
}

export class UI {
    private ctx: RenderContext;
    private config: GameConfig;
    private menuButtons: MenuButton[] = [];
    private currentMenuScreen: MenuScreen = MenuScreen.MAIN;
    private menuBirdSprite: HTMLCanvasElement | null = null;
    private menuBirdFrame: number = 0;
    private menuBirdTimer: number = 0;

    // Day/night cycle state
    private clouds: ParallaxElement[] = [];
    private stars: ParallaxElement[] = [];

    // Achievements screen scroll state
    private achievementsScrollOffset: number = 0;

    // Skin selection state
    private skinRainbowTimer: number = 0;
    private skinRainbowFrame: number = 0;

    constructor(ctx: RenderContext, config: GameConfig) {
        this.ctx = ctx;
        this.config = config;
        this.createMenuBirdSprite();
        this.initParallaxElements();
    }

    /**
     * Initialize parallax elements (clouds and stars)
     */
    private initParallaxElements(): void {
        // Create clouds (visible during day and sunset)
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.config.width,
                y: 50 + Math.random() * 150,
                size: 30 + Math.random() * 40,
                speed: 0.3 + Math.random() * 0.3,
                opacity: 0.6 + Math.random() * 0.4
            });
        }

        // Create stars (visible during night)
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: Math.random() * this.config.width,
                y: Math.random() * (this.config.height - this.config.groundHeight - 100),
                size: 1 + Math.random() * 2,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.3 + Math.random() * 0.7
            });
        }
    }

    /**
     * Get current time of day and transition progress based on score
     */
    private getTimeState(score: number): { time: TimeOfDay; transition: number; nextTime: TimeOfDay | null } {
        if (score < TIME_THRESHOLDS.dayEnd) {
            // Day phase (0-24): transition to sunset starts at score 20
            const transitionStart = TIME_THRESHOLDS.dayEnd - 5;
            if (score >= transitionStart) {
                return {
                    time: TimeOfDay.DAY,
                    transition: (score - transitionStart) / 5,
                    nextTime: TimeOfDay.SUNSET
                };
            }
            return { time: TimeOfDay.DAY, transition: 0, nextTime: null };
        } else if (score < TIME_THRESHOLDS.sunsetEnd) {
            // Sunset phase (25-49): transition to night starts at score 45
            const transitionStart = TIME_THRESHOLDS.sunsetEnd - 5;
            if (score >= transitionStart) {
                return {
                    time: TimeOfDay.SUNSET,
                    transition: (score - transitionStart) / 5,
                    nextTime: TimeOfDay.NIGHT
                };
            }
            return { time: TimeOfDay.SUNSET, transition: 0, nextTime: null };
        } else {
            // Night phase (50+)
            return { time: TimeOfDay.NIGHT, transition: 0, nextTime: null };
        }
    }

    /**
     * Get interpolated colors based on current time state
     */
    private getInterpolatedColors(score: number): TimeColors {
        const state = this.getTimeState(score);
        const currentPalette = TIME_PALETTES[state.time];

        if (state.transition > 0 && state.nextTime) {
            const nextPalette = TIME_PALETTES[state.nextTime];
            return {
                skyTop: lerpColor(currentPalette.skyTop, nextPalette.skyTop, state.transition),
                skyBottom: lerpColor(currentPalette.skyBottom, nextPalette.skyBottom, state.transition),
                ground: lerpColor(currentPalette.ground, nextPalette.ground, state.transition),
                grass: lerpColor(currentPalette.grass, nextPalette.grass, state.transition)
            };
        }

        return currentPalette;
    }

    /**
     * Draw gradient sky background
     */
    private drawSkyGradient(colors: TimeColors): void {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height - this.config.groundHeight);
        gradient.addColorStop(0, colors.skyTop);
        gradient.addColorStop(1, colors.skyBottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height - this.config.groundHeight);
    }

    /**
     * Draw parallax clouds
     */
    private drawClouds(opacity: number): void {
        if (opacity <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        for (const cloud of this.clouds) {
            this.drawCloud(cloud.x, cloud.y, cloud.size, cloud.opacity);
        }

        this.ctx.restore();
    }

    /**
     * Draw a single cloud
     */
    private drawCloud(x: number, y: number, size: number, opacity: number): void {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        // Draw cloud as overlapping circles
        const baseRadius = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        this.ctx.arc(x + baseRadius * 0.8, y - baseRadius * 0.3, baseRadius * 0.7, 0, Math.PI * 2);
        this.ctx.arc(x + baseRadius * 1.4, y, baseRadius * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x - baseRadius * 0.6, y - baseRadius * 0.2, baseRadius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw parallax stars
     */
    private drawStars(opacity: number): void {
        if (opacity <= 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        for (const star of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Update parallax element positions
     */
    updateParallax(): void {
        // Update clouds
        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.config.width + cloud.size;
                cloud.y = 50 + Math.random() * 150;
            }
        }

        // Update stars (slower movement)
        for (const star of this.stars) {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.config.width;
                star.y = Math.random() * (this.config.height - this.config.groundHeight - 100);
            }
        }
    }

    /**
     * Get parallax element opacities based on time of day
     */
    private getParallaxOpacities(score: number): { clouds: number; stars: number } {
        const state = this.getTimeState(score);

        let cloudOpacity = 0;
        let starOpacity = 0;

        if (state.time === TimeOfDay.DAY) {
            cloudOpacity = 1;
            if (state.nextTime === TimeOfDay.SUNSET) {
                cloudOpacity = 1 - state.transition * 0.3; // Fade slightly during sunset transition
            }
        } else if (state.time === TimeOfDay.SUNSET) {
            cloudOpacity = 0.7;
            if (state.nextTime === TimeOfDay.NIGHT) {
                cloudOpacity = 0.7 * (1 - state.transition);
                starOpacity = state.transition;
            }
        } else {
            starOpacity = 1;
        }

        return { clouds: cloudOpacity, stars: starOpacity };
    }

    /**
     * Create bird sprite for menu display based on selected skin
     */
    private createMenuBirdSprite(): void {
        const skinId = storage.getSelectedSkin() as BirdSkinId;
        const validSkinId = skinId in BIRD_SKINS ? skinId : 'default';
        this.menuBirdSprite = createBirdSpriteForSkin(validSkinId, this.skinRainbowFrame);
    }

    /**
     * Update menu bird sprite for the selected skin (handles rainbow animation)
     */
    updateMenuBirdSprite(): void {
        const skinId = storage.getSelectedSkin() as BirdSkinId;
        if (skinId === 'rainbow') {
            this.skinRainbowTimer++;
            if (this.skinRainbowTimer % 15 === 0) {
                this.skinRainbowFrame = (this.skinRainbowFrame + 1) % 6;
                this.menuBirdSprite = createBirdSpriteForSkin('rainbow', this.skinRainbowFrame);
            }
        } else {
            this.createMenuBirdSprite();
        }
    }

    /**
     * Clear the canvas with sky background (score-based day/night cycle)
     */
    clearCanvas(score: number = 0): void {
        const colors = this.getInterpolatedColors(score);

        // Draw gradient sky
        this.drawSkyGradient(colors);

        // Draw parallax elements
        const opacities = this.getParallaxOpacities(score);
        this.drawStars(opacities.stars);
        this.drawClouds(opacities.clouds);

        // Update parallax positions
        this.updateParallax();
    }

    /**
     * Draw the ground with score-based colors
     */
    drawGround(score: number = 0): void {
        const colors = this.getInterpolatedColors(score);

        // Ground base
        this.ctx.fillStyle = colors.ground;
        this.ctx.fillRect(
            0,
            this.config.height - this.config.groundHeight,
            this.config.width,
            this.config.groundHeight
        );

        // Grass on top
        this.ctx.fillStyle = colors.grass;
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
    drawGameOver(
        score: number,
        highScore: number,
        isNewHighScore: boolean,
        newlyUnlockedAchievements: Array<{ name: string; description: string }> = []
    ): void {
        this.drawOverlay();

        // Calculate vertical offset based on achievements
        const hasAchievements = newlyUnlockedAchievements.length > 0;
        const baseY = hasAchievements ? this.config.height / 2 - 120 : this.config.height / 2 - 80;

        // Game Over text
        this.drawPixelText('GAME OVER', this.config.width / 2, baseY, 36);

        // Final score
        this.drawPixelText(`Score: ${score}`, this.config.width / 2, baseY + 60, 28);

        // High score
        if (isNewHighScore) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.font = 'bold 20px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.strokeText('NEW HIGH SCORE!', this.config.width / 2, baseY + 100);
            this.ctx.fillText('NEW HIGH SCORE!', this.config.width / 2, baseY + 100);
        } else {
            this.ctx.font = 'bold 18px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(`Best: ${highScore}`, this.config.width / 2, baseY + 100);
            this.ctx.fillText(`Best: ${highScore}`, this.config.width / 2, baseY + 100);
        }

        // Display newly unlocked achievements
        if (hasAchievements) {
            const achievementY = baseY + 135;

            // Section header
            this.ctx.font = 'bold 14px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('Achievements Unlocked!', this.config.width / 2, achievementY);
            this.ctx.fillText('Achievements Unlocked!', this.config.width / 2, achievementY);

            // List achievements (max 3 displayed)
            const displayedAchievements = newlyUnlockedAchievements.slice(0, 3);
            displayedAchievements.forEach((achievement, index) => {
                const y = achievementY + 20 + index * 18;
                this.ctx.font = 'bold 12px "Courier New", monospace';
                this.ctx.fillStyle = '#00FF00';
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.strokeText(`★ ${achievement.name}`, this.config.width / 2, y);
                this.ctx.fillText(`★ ${achievement.name}`, this.config.width / 2, y);
            });

            // Show "+X more" if there are more achievements
            if (newlyUnlockedAchievements.length > 3) {
                const moreY = achievementY + 20 + 3 * 18;
                this.ctx.font = '10px "Courier New", monospace';
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText(
                    `+${newlyUnlockedAchievements.length - 3} more`,
                    this.config.width / 2,
                    moreY
                );
            }
        }

        // Game over buttons
        this.menuButtons = [];
        const buttonWidth = 150;
        const buttonHeight = 40;
        const buttonX = (this.config.width - buttonWidth) / 2;
        const buttonsY = hasAchievements ? this.config.height - 130 : this.config.height / 2 + 60;
        const buttonGap = 50;

        const playAgainButton: MenuButton = {
            x: buttonX,
            y: buttonsY,
            width: buttonWidth,
            height: buttonHeight,
            label: 'Play Again',
            action: 'playagain'
        };
        this.menuButtons.push(playAgainButton);
        this.drawButton(playAgainButton);

        const mainMenuButton: MenuButton = {
            x: buttonX,
            y: buttonsY + buttonGap,
            width: buttonWidth,
            height: buttonHeight,
            label: 'Main Menu',
            action: 'mainmenu'
        };
        this.menuButtons.push(mainMenuButton);
        this.drawButton(mainMenuButton);
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
     * Draw pause overlay with resume and quit options
     */
    drawPauseScreen(): void {
        this.drawOverlay();
        this.drawPixelText('PAUSED', this.config.width / 2, this.config.height / 2 - 80, 36);

        // Pause menu buttons
        this.menuButtons = [];
        const buttonWidth = 150;
        const buttonHeight = 40;
        const buttonX = (this.config.width - buttonWidth) / 2;
        const buttonsY = this.config.height / 2 - 20;
        const buttonGap = 50;

        const resumeButton: MenuButton = {
            x: buttonX,
            y: buttonsY,
            width: buttonWidth,
            height: buttonHeight,
            label: 'Resume',
            action: 'resume'
        };
        this.menuButtons.push(resumeButton);
        this.drawButton(resumeButton);

        const quitButton: MenuButton = {
            x: buttonX,
            y: buttonsY + buttonGap,
            width: buttonWidth,
            height: buttonHeight,
            label: 'Quit',
            action: 'quit'
        };
        this.menuButtons.push(quitButton);
        this.drawButton(quitButton);

        // Keyboard hint
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.fillText('Press ESC or P to resume', this.config.width / 2, buttonsY + buttonGap + 70);

        // Draw music toggle button
        this.drawMusicToggle();
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
     * Draw a button on the canvas
     */
    drawButton(button: MenuButton, isHovered: boolean = false): void {
        const { x, y, width, height, label } = button;

        // Button background
        this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x, y, width, height);

        // Button border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        // Button text
        this.ctx.font = 'bold 18px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(label, x + width / 2, y + height / 2);
    }

    /**
     * Draw music toggle button
     */
    drawMusicToggle(): void {
        const size = 36;
        const x = this.config.width - size - 10;
        const y = 10;
        const isMusicEnabled = audio.isMusicEnabled();

        // Button background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x, y, size, size);

        // Button border
        this.ctx.strokeStyle = isMusicEnabled ? '#00FF00' : '#FF6666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, size, size);

        // Music icon (note symbol)
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = isMusicEnabled ? '#00FF00' : '#FF6666';

        // Draw a musical note using text
        this.ctx.fillText(isMusicEnabled ? '♪' : '♪', x + size / 2, y + size / 2);

        // Draw strike-through if muted
        if (!isMusicEnabled) {
            this.ctx.strokeStyle = '#FF6666';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 6, y + size - 6);
            this.ctx.lineTo(x + size - 6, y + 6);
            this.ctx.stroke();
        }

        // Add this button to menu buttons for click detection
        const musicButton: MenuButton = {
            x,
            y,
            width: size,
            height: size,
            label: 'Music',
            action: 'togglemusic'
        };

        // Only add if not already present
        if (!this.menuButtons.some(b => b.action === 'togglemusic')) {
            this.menuButtons.push(musicButton);
        }
    }

    /**
     * Draw the main menu
     */
    drawMainMenu(): void {
        this.clearCanvas();
        this.drawGround();

        // Draw game logo / title
        this.drawPixelText('FLAPPY', this.config.width / 2, 60, 42);
        this.drawPixelText('BIRD', this.config.width / 2, 105, 42);

        // Draw decorative bird below title
        if (this.menuBirdSprite) {
            const birdX = this.config.width / 2 - 34;
            const birdY = 155;
            const scale = 2;

            this.ctx.save();
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(
                this.menuBirdSprite,
                birdX,
                birdY,
                34 * scale,
                24 * scale
            );
            this.ctx.restore();

            // Skin label
            const skinId = storage.getSelectedSkin() as BirdSkinId;
            const skin = BIRD_SKINS[skinId] || BIRD_SKINS.default;
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(skin.name, this.config.width / 2, birdY + 24 * scale + 15);
            this.ctx.fillText(skin.name, this.config.width / 2, birdY + 24 * scale + 15);
        }

        // High score display
        const highScore = storage.getHighScore();
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`High Score: ${highScore}`, this.config.width / 2, 260);
        this.ctx.fillText(`High Score: ${highScore}`, this.config.width / 2, 260);

        // Menu buttons
        this.menuButtons = [];
        const buttonWidth = 200;
        const buttonHeight = 36;
        const buttonX = (this.config.width - buttonWidth) / 2;
        const startY = 290;
        const buttonGap = 44;

        const buttons: Array<{ label: string; action: string }> = [
            { label: 'Start Game', action: 'start' },
            { label: 'Bird Skins', action: 'skins' },
            { label: 'Tutorial', action: 'tutorial' },
            { label: 'How to Play', action: 'howtoplay' },
            { label: 'Achievements', action: 'achievements' }
        ];

        buttons.forEach((btn, index) => {
            const button: MenuButton = {
                x: buttonX,
                y: startY + index * buttonGap,
                width: buttonWidth,
                height: buttonHeight,
                label: btn.label,
                action: btn.action
            };
            this.menuButtons.push(button);
            this.drawButton(button);
        });

        // Draw music toggle button
        this.drawMusicToggle();
    }

    /**
     * Draw the How to Play screen
     */
    drawHowToPlay(): void {
        this.clearCanvas();
        this.drawGround();
        this.drawOverlay();

        // Title
        this.drawPixelText('HOW TO PLAY', this.config.width / 2, 50, 28);

        // Instructions
        const instructions = [
            '',
            'CONTROLS:',
            'Press SPACE or Click to flap',
            'Press P or ESC to pause',
            '',
            'OBJECTIVE:',
            'Fly through the gaps',
            'between the pipes',
            '',
            'TIPS:',
            'Time your flaps carefully',
            'Watch your height',
            'Stay calm and focused!'
        ];

        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        instructions.forEach((line, index) => {
            if (line === 'CONTROLS:' || line === 'OBJECTIVE:' || line === 'TIPS:') {
                this.ctx.fillStyle = '#FFD700';
            } else {
                this.ctx.fillStyle = '#FFFFFF';
            }
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(line, this.config.width / 2, 95 + index * 25);
            this.ctx.fillText(line, this.config.width / 2, 95 + index * 25);
        });

        // Back button
        this.menuButtons = [];
        const backButton: MenuButton = {
            x: (this.config.width - 150) / 2,
            y: this.config.height - 120,
            width: 150,
            height: 40,
            label: 'Back',
            action: 'back'
        };
        this.menuButtons.push(backButton);
        this.drawButton(backButton);
    }

    /**
     * Draw the Tutorial screen with visual demonstration
     */
    drawTutorialScreen(): void {
        this.clearCanvas();
        this.drawGround();
        this.drawOverlay();

        // Title
        this.drawPixelText('TUTORIAL', this.config.width / 2, 40, 28);

        // Visual demonstration area
        const demoAreaY = 80;
        const demoAreaHeight = 180;

        // Draw demo background (lighter area)
        this.ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        this.ctx.fillRect(20, demoAreaY, this.config.width - 40, demoAreaHeight);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, demoAreaY, this.config.width - 40, demoAreaHeight);

        // Draw static illustration: bird approaching pipe gap
        // Bird
        if (this.menuBirdSprite) {
            const birdDemoX = 80;
            const birdDemoY = demoAreaY + demoAreaHeight / 2 - 24;
            this.ctx.save();
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(this.menuBirdSprite, birdDemoX, birdDemoY, 51, 36);
            this.ctx.restore();

            // Draw arrow showing flap direction
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(birdDemoX + 25, birdDemoY - 5);
            this.ctx.lineTo(birdDemoX + 25, birdDemoY - 30);
            this.ctx.lineTo(birdDemoX + 15, birdDemoY - 20);
            this.ctx.moveTo(birdDemoX + 25, birdDemoY - 30);
            this.ctx.lineTo(birdDemoX + 35, birdDemoY - 20);
            this.ctx.stroke();
        }

        // Draw simplified pipe pair
        const pipeX = 220;
        const pipeWidth = 52;
        const gapTop = demoAreaY + 50;
        const gapBottom = demoAreaY + demoAreaHeight - 50;

        // Top pipe
        this.ctx.fillStyle = '#2ECC71';
        this.ctx.fillRect(pipeX, demoAreaY, pipeWidth, gapTop - demoAreaY);
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(pipeX - 4, gapTop - 20, pipeWidth + 8, 20);

        // Bottom pipe
        this.ctx.fillStyle = '#2ECC71';
        this.ctx.fillRect(pipeX, gapBottom, pipeWidth, demoAreaY + demoAreaHeight - gapBottom);
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(pipeX - 4, gapBottom, pipeWidth + 8, 20);

        // Arrow pointing to gap
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        const arrowStartX = pipeX + pipeWidth + 30;
        const arrowEndX = pipeX + pipeWidth + 5;
        const gapCenterY = (gapTop + gapBottom) / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowStartX, gapCenterY);
        this.ctx.lineTo(arrowEndX, gapCenterY);
        this.ctx.lineTo(arrowEndX + 10, gapCenterY - 8);
        this.ctx.moveTo(arrowEndX, gapCenterY);
        this.ctx.lineTo(arrowEndX + 10, gapCenterY + 8);
        this.ctx.stroke();

        // Demo labels
        this.ctx.font = 'bold 11px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('FLAP!', 105, demoAreaY + 25);
        this.ctx.fillText('FLY HERE', pipeX + pipeWidth + 50, gapCenterY + 4);

        // Control instructions
        const instructionsY = demoAreaY + demoAreaHeight + 25;

        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        const instructions = [
            { text: 'CONTROLS:', color: '#FFD700' },
            { text: 'SPACE / Click / Tap to flap', color: '#FFFFFF' },
            { text: '', color: '#FFFFFF' },
            { text: 'OBJECTIVE:', color: '#FFD700' },
            { text: 'Avoid pipes, get high score!', color: '#FFFFFF' }
        ];

        instructions.forEach((line, index) => {
            this.ctx.fillStyle = line.color;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(line.text, this.config.width / 2, instructionsY + index * 24);
            this.ctx.fillText(line.text, this.config.width / 2, instructionsY + index * 24);
        });

        // "Got it" button
        this.menuButtons = [];
        const gotItButton: MenuButton = {
            x: (this.config.width - 150) / 2,
            y: this.config.height - 100,
            width: 150,
            height: 45,
            label: 'Got it!',
            action: 'gotit'
        };
        this.menuButtons.push(gotItButton);
        this.drawButton(gotItButton);
    }

    /**
     * Draw the Achievements screen
     */
    drawAchievementsScreen(): void {
        this.clearCanvas();
        this.drawGround();
        this.drawOverlay();

        // Title
        this.drawPixelText('ACHIEVEMENTS', this.config.width / 2, 40, 24);

        // Achievement progress
        const unlocked = achievements.getUnlockedCount();
        const total = achievements.getTotalCount();
        const percentage = achievements.getCompletionPercentage();

        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        const progressText = `${unlocked}/${total} (${percentage}%)`;
        this.ctx.strokeText(progressText, this.config.width / 2, 75);
        this.ctx.fillText(progressText, this.config.width / 2, 75);

        // Achievement list with scrolling
        const allAchievements = achievements.getAllAchievements();
        const itemHeight = 55;
        const startY = 95;
        const visibleHeight = this.config.height - 180; // Space for title and buttons
        const maxVisible = Math.floor(visibleHeight / itemHeight);
        const maxScroll = Math.max(0, allAchievements.length - maxVisible);

        // Clamp scroll offset
        this.achievementsScrollOffset = Math.max(0, Math.min(this.achievementsScrollOffset, maxScroll));

        // Create clipping region for achievement list
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, startY, this.config.width, visibleHeight);
        this.ctx.clip();

        allAchievements.forEach((achievement, index) => {
            const y = startY + (index - this.achievementsScrollOffset) * itemHeight;

            // Skip if outside visible area
            if (y < startY - itemHeight || y > startY + visibleHeight) {
                return;
            }

            const boxX = 20;
            const boxWidth = this.config.width - 40;

            // Background
            this.ctx.fillStyle = achievement.unlocked ? 'rgba(0, 100, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(boxX, y, boxWidth, itemHeight - 4);

            // Border
            this.ctx.strokeStyle = achievement.unlocked ? '#00FF00' : '#666666';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(boxX, y, boxWidth, itemHeight - 4);

            // Achievement name
            this.ctx.font = 'bold 11px "Courier New", monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = achievement.unlocked ? '#00FF00' : '#888888';
            this.ctx.fillText(achievement.name, boxX + 8, y + 14);

            // Achievement description/requirement
            this.ctx.font = '9px "Courier New", monospace';
            this.ctx.fillStyle = achievement.unlocked ? '#CCFFCC' : '#AAAAAA';
            const descText = achievement.unlocked ? achievement.description : `Requires: ${achievement.description}`;
            this.ctx.fillText(descText, boxX + 8, y + 27);

            // Third line: unlock date OR skin reward info
            this.ctx.font = '8px "Courier New", monospace';
            const skinName = achievement.skinReward && achievement.skinReward in BIRD_SKINS
                ? BIRD_SKINS[achievement.skinReward as BirdSkinId].name
                : achievement.skinReward;
            if (achievement.unlocked && achievement.unlockedAt) {
                // Show completion date for unlocked achievements
                const date = new Date(achievement.unlockedAt);
                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                if (achievement.skinReward) {
                    // Show earned skin for unlocked achievements with skin
                    this.ctx.fillStyle = '#FFD700';
                    const shortDateStr = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                    this.ctx.fillText(`${shortDateStr} | Skin: ${skinName}`, boxX + 8, y + 40);
                } else {
                    this.ctx.fillStyle = '#88FF88';
                    this.ctx.fillText(`Unlocked: ${dateStr}`, boxX + 8, y + 40);
                }
            } else if (!achievement.unlocked && achievement.skinReward) {
                // Show skin reward for locked achievements
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillText(`Unlocks: ${skinName}`, boxX + 8, y + 40);
            }

            // Checkmark or lock icon
            this.ctx.font = 'bold 16px "Courier New", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = achievement.unlocked ? '#00FF00' : '#666666';
            this.ctx.fillText(achievement.unlocked ? '✓' : '🔒', boxX + boxWidth - 10, y + 28);
        });

        this.ctx.restore();

        // Scroll indicators
        if (this.achievementsScrollOffset > 0) {
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText('▲ Scroll Up', this.config.width / 2, startY - 5);
        }
        if (this.achievementsScrollOffset < maxScroll) {
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText('▼ Scroll Down', this.config.width / 2, startY + visibleHeight + 12);
        }

        // Navigation buttons
        this.menuButtons = [];

        // Scroll up button
        if (allAchievements.length > maxVisible) {
            const scrollUpButton: MenuButton = {
                x: 20,
                y: this.config.height - 80,
                width: 80,
                height: 35,
                label: '▲ Up',
                action: 'scroll_up'
            };
            this.menuButtons.push(scrollUpButton);
            this.drawButton(scrollUpButton);

            const scrollDownButton: MenuButton = {
                x: this.config.width - 100,
                y: this.config.height - 80,
                width: 80,
                height: 35,
                label: '▼ Down',
                action: 'scroll_down'
            };
            this.menuButtons.push(scrollDownButton);
            this.drawButton(scrollDownButton);
        }

        // Back button
        const backButton: MenuButton = {
            x: (this.config.width - 100) / 2,
            y: this.config.height - 80,
            width: 100,
            height: 35,
            label: 'Back',
            action: 'back'
        };
        this.menuButtons.push(backButton);
        this.drawButton(backButton);
    }

    /**
     * Scroll achievements list
     */
    scrollAchievements(direction: 'up' | 'down'): void {
        if (direction === 'up') {
            this.achievementsScrollOffset = Math.max(0, this.achievementsScrollOffset - 1);
        } else {
            const allAchievements = achievements.getAllAchievements();
            const visibleHeight = this.config.height - 180;
            const itemHeight = 55;
            const maxVisible = Math.floor(visibleHeight / itemHeight);
            const maxScroll = Math.max(0, allAchievements.length - maxVisible);
            this.achievementsScrollOffset = Math.min(maxScroll, this.achievementsScrollOffset + 1);
        }
    }

    /**
     * Reset achievements scroll position
     */
    resetAchievementsScroll(): void {
        this.achievementsScrollOffset = 0;
    }

    /**
     * Draw the Skins selection screen
     */
    drawSkinsScreen(): void {
        this.clearCanvas();
        this.drawGround();
        this.drawOverlay();

        // Title
        this.drawPixelText('BIRD SKINS', this.config.width / 2, 40, 28);

        // Get all skin IDs and unlocked skins
        const allSkinIds: BirdSkinId[] = ['default', 'blue', 'red', 'golden', 'rainbow'];
        const unlockedSkins = achievements.getUnlockedSkins();
        const currentSkinId = storage.getSelectedSkin() as BirdSkinId;

        // Skin display area
        const cardWidth = 160;
        const cardHeight = 110;
        const cardsPerRow = 2;
        const startX = (this.config.width - (cardWidth * cardsPerRow + 20)) / 2;
        const startY = 85;
        const rowGap = 15;
        const colGap = 20;

        this.menuButtons = [];

        allSkinIds.forEach((skinId, index) => {
            const skin = BIRD_SKINS[skinId];
            const isUnlocked = unlockedSkins.includes(skinId);
            const isSelected = currentSkinId === skinId;

            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;
            const x = startX + col * (cardWidth + colGap);
            const y = startY + row * (cardHeight + rowGap);

            // Card background
            if (isSelected) {
                this.ctx.fillStyle = 'rgba(0, 150, 0, 0.7)';
            } else if (isUnlocked) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            } else {
                this.ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            }
            this.ctx.fillRect(x, y, cardWidth, cardHeight);

            // Card border
            this.ctx.strokeStyle = isSelected ? '#00FF00' : (isUnlocked ? '#FFFFFF' : '#666666');
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Draw bird sprite (centered in card)
            const birdSprite = createBirdSpriteForSkin(skinId, skinId === 'rainbow' ? this.skinRainbowFrame : 0);
            const birdScale = 2;
            const birdX = x + (cardWidth - 34 * birdScale) / 2;
            const birdY = y + 12;

            this.ctx.save();
            this.ctx.imageSmoothingEnabled = false;
            if (!isUnlocked) {
                this.ctx.globalAlpha = 0.3;
            }
            this.ctx.drawImage(birdSprite, birdX, birdY, 34 * birdScale, 24 * birdScale);
            this.ctx.restore();

            // Lock icon for locked skins
            if (!isUnlocked) {
                this.ctx.font = 'bold 20px "Courier New", monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText('🔒', x + cardWidth / 2, birdY + 30);
            }

            // Skin name
            this.ctx.font = 'bold 11px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = isUnlocked ? '#FFFFFF' : '#888888';
            this.ctx.fillText(skin.name, x + cardWidth / 2, y + cardHeight - 28);

            // Unlock requirement or "Selected" label
            this.ctx.font = '9px "Courier New", monospace';
            if (isSelected) {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillText('EQUIPPED', x + cardWidth / 2, y + cardHeight - 12);
            } else if (isUnlocked) {
                this.ctx.fillStyle = '#AAAAAA';
                this.ctx.fillText('Click to equip', x + cardWidth / 2, y + cardHeight - 12);
            } else {
                this.ctx.fillStyle = '#FFD700';
                const requirement = this.getSkinUnlockRequirement(skinId);
                this.ctx.fillText(requirement, x + cardWidth / 2, y + cardHeight - 12);
            }

            // Add button for unlocked skins
            if (isUnlocked && !isSelected) {
                const skinButton: MenuButton = {
                    x,
                    y,
                    width: cardWidth,
                    height: cardHeight,
                    label: skin.name,
                    action: `select_skin_${skinId}`
                };
                this.menuButtons.push(skinButton);
            }
        });

        // Back button
        const backButton: MenuButton = {
            x: (this.config.width - 120) / 2,
            y: this.config.height - 75,
            width: 120,
            height: 40,
            label: 'Back',
            action: 'back'
        };
        this.menuButtons.push(backButton);
        this.drawButton(backButton);
    }

    /**
     * Get unlock requirement text for a skin
     */
    private getSkinUnlockRequirement(skinId: BirdSkinId): string {
        switch (skinId) {
            case 'blue': return 'Score 10 pts';
            case 'red': return 'Score 50 pts';
            case 'golden': return 'Score 100 pts';
            case 'rainbow': return 'Score 200 pts';
            default: return '';
        }
    }

    /**
     * Select a bird skin
     */
    selectSkin(skinId: BirdSkinId): void {
        if (achievements.isSkinUnlocked(skinId)) {
            storage.setSelectedSkin(skinId);
            this.createMenuBirdSprite();
        }
    }

    /**
     * Draw the current menu screen
     */
    drawMenu(screen: MenuScreen): void {
        this.currentMenuScreen = screen;

        switch (screen) {
            case MenuScreen.MAIN:
                this.drawMainMenu();
                break;
            case MenuScreen.HOW_TO_PLAY:
                this.drawHowToPlay();
                break;
            case MenuScreen.ACHIEVEMENTS:
                this.drawAchievementsScreen();
                break;
            case MenuScreen.TUTORIAL:
                this.drawTutorialScreen();
                break;
            case MenuScreen.SKINS:
                this.drawSkinsScreen();
                break;
        }
    }

    /**
     * Get menu buttons for click detection
     */
    getMenuButtons(): MenuButton[] {
        return this.menuButtons;
    }

    /**
     * Get current menu screen
     */
    getCurrentMenuScreen(): MenuScreen {
        return this.currentMenuScreen;
    }

    /**
     * Set current menu screen
     */
    setCurrentMenuScreen(screen: MenuScreen): void {
        this.currentMenuScreen = screen;
    }

    /**
     * Update menu animation
     */
    updateMenuAnimation(): void {
        this.menuBirdTimer++;
        if (this.menuBirdTimer % 10 === 0) {
            this.menuBirdFrame = (this.menuBirdFrame + 1) % 3;
        }
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
        isNewHighScore: boolean = false,
        newlyUnlockedAchievements: Array<{ name: string; description: string }> = []
    ): void {
        if (state === GameState.MENU) {
            this.drawMenu(this.currentMenuScreen);
            return;
        }

        this.clearCanvas(score);
        this.drawPipes(pipes);
        this.drawBird(bird);
        this.drawGround(score);
        this.drawScore(score);

        if (state === GameState.READY) {
            this.drawStartScreen();
        } else if (state === GameState.GAME_OVER) {
            this.drawGameOver(score, highScore, isNewHighScore, newlyUnlockedAchievements);
        } else if (state === GameState.PAUSED) {
            this.drawPauseScreen();
        }
    }
}
