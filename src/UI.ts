/**
 * UI Module
 * Handles all rendering, text display, and visual effects
 */

import { GameConfig, GameState, MenuScreen, MenuButton, RenderContext } from './types.js';
import { Bird } from './Bird.js';
import { Pipe } from './Pipe.js';
import { storage } from './Storage.js';
import { achievements } from './Achievements.js';

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
    private menuButtons: MenuButton[] = [];
    private currentMenuScreen: MenuScreen = MenuScreen.MAIN;
    private menuBirdSprite: HTMLCanvasElement | null = null;
    private menuBirdFrame: number = 0;
    private menuBirdTimer: number = 0;

    constructor(ctx: RenderContext, config: GameConfig) {
        this.ctx = ctx;
        this.config = config;
        this.createMenuBirdSprite();
    }

    /**
     * Create bird sprite for menu display
     */
    private createMenuBirdSprite(): void {
        const canvas = document.createElement('canvas');
        canvas.width = 34;
        canvas.height = 24;
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

        // Wing (mid position)
        ctx.fillStyle = '#D4AC0D';
        ctx.fillRect(6, 10, 10, 4);

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

        this.menuBirdSprite = canvas;
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
            const skinName = storage.getSelectedSkin();
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            const skinLabel = skinName === 'default' ? 'Classic Bird' : skinName;
            this.ctx.strokeText(skinLabel, this.config.width / 2, birdY + 24 * scale + 15);
            this.ctx.fillText(skinLabel, this.config.width / 2, birdY + 24 * scale + 15);
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
        const buttonHeight = 45;
        const buttonX = (this.config.width - buttonWidth) / 2;
        const startY = 300;
        const buttonGap = 55;

        const buttons: Array<{ label: string; action: string }> = [
            { label: 'Start Game', action: 'start' },
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

        // Achievement list
        const allAchievements = achievements.getAllAchievements();
        const itemHeight = 42;
        const startY = 100;
        const maxVisible = 10;

        allAchievements.slice(0, maxVisible).forEach((achievement, index) => {
            const y = startY + index * itemHeight;
            const boxX = 30;
            const boxWidth = this.config.width - 60;

            // Background
            this.ctx.fillStyle = achievement.unlocked ? 'rgba(0, 100, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(boxX, y, boxWidth, itemHeight - 4);

            // Border
            this.ctx.strokeStyle = achievement.unlocked ? '#00FF00' : '#666666';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(boxX, y, boxWidth, itemHeight - 4);

            // Achievement name
            this.ctx.font = 'bold 12px "Courier New", monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = achievement.unlocked ? '#00FF00' : '#888888';
            this.ctx.fillText(achievement.name, boxX + 10, y + 15);

            // Achievement description
            this.ctx.font = '10px "Courier New", monospace';
            this.ctx.fillStyle = achievement.unlocked ? '#CCFFCC' : '#666666';
            this.ctx.fillText(achievement.description, boxX + 10, y + 30);

            // Checkmark or lock icon
            this.ctx.font = 'bold 14px "Courier New", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = achievement.unlocked ? '#00FF00' : '#666666';
            this.ctx.fillText(achievement.unlocked ? '✓' : '○', boxX + boxWidth - 10, y + 22);
        });

        // Show "more achievements" message if there are more
        if (allAchievements.length > maxVisible) {
            this.ctx.font = 'bold 10px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText(
                `+ ${allAchievements.length - maxVisible} more`,
                this.config.width / 2,
                startY + maxVisible * itemHeight + 5
            );
        }

        // Back button
        this.menuButtons = [];
        const backButton: MenuButton = {
            x: (this.config.width - 150) / 2,
            y: this.config.height - 80,
            width: 150,
            height: 40,
            label: 'Back',
            action: 'back'
        };
        this.menuButtons.push(backButton);
        this.drawButton(backButton);
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

        this.clearCanvas();
        this.drawPipes(pipes);
        this.drawBird(bird);
        this.drawGround();
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
