/**
 * Audio Module
 * Handles all game sound effects using Web Audio API
 */

export class Audio {
    private context: AudioContext | null = null;
    private enabled: boolean = true;

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init(): void {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    /**
     * Enable or disable sound effects
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Check if audio is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Play flap sound effect
     */
    playFlap(): void {
        if (!this.context || !this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }

    /**
     * Play death sound effect
     */
    playDeath(): void {
        if (!this.context || !this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.3);
    }

    /**
     * Play score sound effect
     */
    playScore(): void {
        if (!this.context || !this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, this.context.currentTime);
        oscillator.frequency.setValueAtTime(800, this.context.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }

    /**
     * Play achievement unlock sound
     */
    playAchievement(): void {
        if (!this.context || !this.enabled) return;

        const now = this.context.currentTime;

        // Play a pleasant ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const oscillator = this.context!.createOscillator();
            const gainNode = this.context!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context!.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + i * 0.1);

            gainNode.gain.setValueAtTime(0.15, now + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);

            oscillator.start(now + i * 0.1);
            oscillator.stop(now + i * 0.1 + 0.2);
        });
    }

    /**
     * Play button click sound
     */
    playClick(): void {
        if (!this.context || !this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);

        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.05);
    }
}

/** Singleton audio instance */
export const audio = new Audio();
