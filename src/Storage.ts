/**
 * Storage Module
 * Handles persistent game data using localStorage
 */

import { StoredGameData, AchievementUnlockData, LeaderboardEntry } from './types.js';

const STORAGE_KEY = 'flappy_bird_save';

/** Default game data */
const DEFAULT_DATA: StoredGameData = {
    highScore: 0,
    totalGames: 0,
    totalScore: 0,
    achievements: [],
    achievementDates: [],
    selectedSkin: 'default',
    soundEnabled: true,
    musicEnabled: true,
    leaderboard: []
};

const MAX_LEADERBOARD_ENTRIES = 10;

export class Storage {
    private data: StoredGameData;

    constructor() {
        this.data = this.load();
    }

    /**
     * Load game data from localStorage
     */
    private load(): StoredGameData {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<StoredGameData>;
                // Merge with defaults to handle missing fields
                return { ...DEFAULT_DATA, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load game data:', e);
        }
        return { ...DEFAULT_DATA };
    }

    /**
     * Save game data to localStorage
     */
    private save(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save game data:', e);
        }
    }

    /**
     * Get the current high score
     */
    getHighScore(): number {
        return this.data.highScore;
    }

    /**
     * Update high score if the new score is higher
     * @returns true if high score was updated
     */
    updateHighScore(score: number): boolean {
        if (score > this.data.highScore) {
            this.data.highScore = score;
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Record a completed game
     */
    recordGame(score: number): void {
        this.data.totalGames++;
        this.data.totalScore += score;
        this.updateHighScore(score);
        this.save();
    }

    /**
     * Get total number of games played
     */
    getTotalGames(): number {
        return this.data.totalGames;
    }

    /**
     * Get total accumulated score
     */
    getTotalScore(): number {
        return this.data.totalScore;
    }

    /**
     * Get list of unlocked achievement IDs
     */
    getAchievements(): string[] {
        return [...this.data.achievements];
    }

    /**
     * Unlock an achievement
     * @returns true if achievement was newly unlocked
     */
    unlockAchievement(id: string): boolean {
        if (!this.data.achievements.includes(id)) {
            this.data.achievements.push(id);
            this.data.achievementDates.push({
                id,
                unlockedAt: new Date().toISOString()
            });
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Get achievement unlock date
     * @returns ISO date string or undefined if not unlocked
     */
    getAchievementUnlockDate(id: string): string | undefined {
        const unlockData = this.data.achievementDates.find(a => a.id === id);
        return unlockData?.unlockedAt;
    }

    /**
     * Get all achievement unlock dates
     */
    getAchievementDates(): AchievementUnlockData[] {
        return [...this.data.achievementDates];
    }

    /**
     * Check if an achievement is unlocked
     */
    hasAchievement(id: string): boolean {
        return this.data.achievements.includes(id);
    }

    /**
     * Get selected bird skin
     */
    getSelectedSkin(): string {
        return this.data.selectedSkin;
    }

    /**
     * Set selected bird skin
     */
    setSelectedSkin(skin: string): void {
        this.data.selectedSkin = skin;
        this.save();
    }

    /**
     * Check if sound is enabled
     */
    isSoundEnabled(): boolean {
        return this.data.soundEnabled;
    }

    /**
     * Set sound enabled state
     */
    setSoundEnabled(enabled: boolean): void {
        this.data.soundEnabled = enabled;
        this.save();
    }

    /**
     * Check if music is enabled
     */
    isMusicEnabled(): boolean {
        return this.data.musicEnabled;
    }

    /**
     * Set music enabled state
     */
    setMusicEnabled(enabled: boolean): void {
        this.data.musicEnabled = enabled;
        this.save();
    }

    /**
     * Reset all game data
     */
    reset(): void {
        this.data = { ...DEFAULT_DATA };
        this.save();
    }

    /**
     * Get all stored data (for debugging/export)
     */
    getAllData(): StoredGameData {
        return { ...this.data };
    }

    /**
     * Add a score to the leaderboard
     * @returns The entry ID if added to leaderboard, null otherwise
     */
    addLeaderboardEntry(score: number): string | null {
        // Only add scores greater than 0
        if (score <= 0) {
            return null;
        }

        const entry: LeaderboardEntry = {
            score,
            date: new Date().toISOString(),
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        // Add to leaderboard and sort by score descending
        this.data.leaderboard.push(entry);
        this.data.leaderboard.sort((a, b) => b.score - a.score);

        // Keep only top entries
        if (this.data.leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
            this.data.leaderboard = this.data.leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
        }

        this.save();

        // Return the entry ID if it's still in the leaderboard
        const isOnLeaderboard = this.data.leaderboard.some(e => e.id === entry.id);
        return isOnLeaderboard ? entry.id : null;
    }

    /**
     * Get the leaderboard entries
     */
    getLeaderboard(): LeaderboardEntry[] {
        return [...this.data.leaderboard];
    }

    /**
     * Check if a score would qualify for the leaderboard
     */
    wouldQualifyForLeaderboard(score: number): boolean {
        if (score <= 0) return false;
        if (this.data.leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true;
        const lowestScore = this.data.leaderboard[this.data.leaderboard.length - 1]?.score ?? 0;
        return score > lowestScore;
    }
}

/** Singleton storage instance */
export const storage = new Storage();
