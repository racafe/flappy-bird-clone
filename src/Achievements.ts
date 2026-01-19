/**
 * Achievements Module
 * Handles achievement definitions, tracking, and unlocking
 */

import { Achievement, GameStats } from './types.js';
import { storage } from './Storage.js';
import { audio } from './Audio.js';

// Re-export Achievement type for consumers
export type { Achievement } from './types.js';

/** All available achievements */
export const ACHIEVEMENTS: Achievement[] = [
    // Score-based milestones
    {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Reach 10 points in a single game',
        condition: (stats) => stats.currentScore >= 10
    },
    {
        id: 'warming_up',
        name: 'Warming Up',
        description: 'Reach 25 points in a single game',
        condition: (stats) => stats.currentScore >= 25,
        skinReward: 'Blue Bird'
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Reach 50 points (reach night)',
        condition: (stats) => stats.currentScore >= 50,
        skinReward: 'Night Bird'
    },
    {
        id: 'century_club',
        name: 'Century Club',
        description: 'Reach 100 points in a single game',
        condition: (stats) => stats.currentScore >= 100,
        skinReward: 'Golden Bird'
    },
    {
        id: 'flappy_master',
        name: 'Flappy Master',
        description: 'Reach 200 points in a single game',
        condition: (stats) => stats.currentScore >= 200,
        skinReward: 'Rainbow Bird'
    },
    // Play count achievements
    {
        id: 'first_flight',
        name: 'First Flight',
        description: 'Play your first game',
        condition: (stats) => stats.totalGames >= 1
    },
    {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Play 10 games',
        condition: (stats) => stats.totalGames >= 10,
        skinReward: 'Red Bird'
    },
    {
        id: 'persistent',
        name: 'Persistent',
        description: 'Play 50 games',
        condition: (stats) => stats.totalGames >= 50,
        skinReward: 'Purple Bird'
    },
    {
        id: 'addicted',
        name: 'Addicted',
        description: 'Play 100 games',
        condition: (stats) => stats.totalGames >= 100,
        skinReward: 'Cyber Bird'
    },
    // Total score achievements
    {
        id: 'accumulator',
        name: 'Accumulator',
        description: 'Accumulate 100 total points',
        condition: (stats) => stats.totalScore >= 100
    },
    {
        id: 'collector',
        name: 'Collector',
        description: 'Accumulate 500 total points',
        condition: (stats) => stats.totalScore >= 500,
        skinReward: 'Silver Bird'
    },
    {
        id: 'hoarder',
        name: 'Hoarder',
        description: 'Accumulate 1000 total points',
        condition: (stats) => stats.totalScore >= 1000,
        skinReward: 'Diamond Bird'
    }
];

export class Achievements {
    private unlockedIds: Set<string>;
    private pendingNotifications: Achievement[] = [];

    constructor() {
        this.unlockedIds = new Set(storage.getAchievements());
    }

    /**
     * Check and unlock any newly earned achievements
     * @returns Array of newly unlocked achievements
     */
    checkAchievements(stats: GameStats): Achievement[] {
        const newlyUnlocked: Achievement[] = [];

        for (const achievement of ACHIEVEMENTS) {
            if (!this.unlockedIds.has(achievement.id) && achievement.condition(stats)) {
                this.unlockedIds.add(achievement.id);
                storage.unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
                this.pendingNotifications.push(achievement);
                audio.playAchievement();
            }
        }

        return newlyUnlocked;
    }

    /**
     * Get all achievements with their unlock status and dates
     */
    getAllAchievements(): Array<Achievement & { unlocked: boolean; unlockedAt?: string }> {
        return ACHIEVEMENTS.map(achievement => ({
            ...achievement,
            unlocked: this.unlockedIds.has(achievement.id),
            unlockedAt: storage.getAchievementUnlockDate(achievement.id)
        }));
    }

    /**
     * Get only unlocked achievements
     */
    getUnlockedAchievements(): Achievement[] {
        return ACHIEVEMENTS.filter(a => this.unlockedIds.has(a.id));
    }

    /**
     * Get count of unlocked achievements
     */
    getUnlockedCount(): number {
        return this.unlockedIds.size;
    }

    /**
     * Get total achievement count
     */
    getTotalCount(): number {
        return ACHIEVEMENTS.length;
    }

    /**
     * Check if a specific achievement is unlocked
     */
    isUnlocked(id: string): boolean {
        return this.unlockedIds.has(id);
    }

    /**
     * Get pending achievement notifications and clear them
     */
    getPendingNotifications(): Achievement[] {
        const notifications = [...this.pendingNotifications];
        this.pendingNotifications = [];
        return notifications;
    }

    /**
     * Check if there are pending notifications
     */
    hasPendingNotifications(): boolean {
        return this.pendingNotifications.length > 0;
    }

    /**
     * Get achievement by ID
     */
    getAchievement(id: string): Achievement | undefined {
        return ACHIEVEMENTS.find(a => a.id === id);
    }

    /**
     * Calculate completion percentage
     */
    getCompletionPercentage(): number {
        return Math.round((this.unlockedIds.size / ACHIEVEMENTS.length) * 100);
    }
}

/** Singleton achievements instance */
export const achievements = new Achievements();
