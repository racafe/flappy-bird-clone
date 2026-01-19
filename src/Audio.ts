/**
 * Audio Module
 * Handles all game sound effects and background music using Web Audio API
 */

export class Audio {
    private context: AudioContext | null = null;
    private enabled: boolean = true;
    private musicEnabled: boolean = true;
    private musicOscillators: OscillatorNode[] = [];
    private musicGainNode: GainNode | null = null;
    private musicPlaying: boolean = false;
    private musicLoopTimeout: ReturnType<typeof setTimeout> | null = null;

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
     * Enable or disable background music
     */
    setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Check if music is enabled
     */
    isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    /**
     * Toggle music on/off
     */
    toggleMusic(): boolean {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    /**
     * Suspend audio context (pause all audio)
     */
    suspend(): void {
        if (this.context && this.context.state === 'running') {
            this.context.suspend();
        }
    }

    /**
     * Resume audio context (unpause audio)
     */
    resume(): void {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
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

    /**
     * Start playing background music (chiptune-style loop)
     */
    startMusic(): void {
        if (!this.context || !this.musicEnabled || this.musicPlaying) return;

        this.musicPlaying = true;
        this.playMusicLoop();
    }

    /**
     * Stop background music
     */
    stopMusic(): void {
        this.musicPlaying = false;

        // Clear any pending loop
        if (this.musicLoopTimeout) {
            clearTimeout(this.musicLoopTimeout);
            this.musicLoopTimeout = null;
        }

        // Stop all active oscillators
        for (const osc of this.musicOscillators) {
            try {
                osc.stop();
            } catch {
                // Oscillator may have already stopped
            }
        }
        this.musicOscillators = [];
    }

    /**
     * Play a single music loop iteration
     */
    private playMusicLoop(): void {
        if (!this.context || !this.musicEnabled || !this.musicPlaying) return;

        // Chiptune melody - a simple catchy 8-bar loop
        // Notes in Hz (C major pentatonic scale mostly)
        const melody = [
            { note: 523.25, duration: 0.15 },  // C5
            { note: 587.33, duration: 0.15 },  // D5
            { note: 659.25, duration: 0.15 },  // E5
            { note: 783.99, duration: 0.30 },  // G5
            { note: 659.25, duration: 0.15 },  // E5
            { note: 523.25, duration: 0.15 },  // C5
            { note: 587.33, duration: 0.30 },  // D5
            { note: 0, duration: 0.15 },       // Rest
            { note: 783.99, duration: 0.15 },  // G5
            { note: 659.25, duration: 0.15 },  // E5
            { note: 587.33, duration: 0.15 },  // D5
            { note: 523.25, duration: 0.30 },  // C5
            { note: 392.00, duration: 0.15 },  // G4
            { note: 440.00, duration: 0.15 },  // A4
            { note: 523.25, duration: 0.30 },  // C5
            { note: 0, duration: 0.15 },       // Rest
        ];

        // Bass line
        const bass = [
            { note: 130.81, duration: 0.30 },  // C3
            { note: 130.81, duration: 0.30 },  // C3
            { note: 146.83, duration: 0.30 },  // D3
            { note: 146.83, duration: 0.30 },  // D3
            { note: 164.81, duration: 0.30 },  // E3
            { note: 164.81, duration: 0.30 },  // E3
            { note: 130.81, duration: 0.30 },  // C3
            { note: 196.00, duration: 0.30 },  // G3
        ];

        const now = this.context.currentTime;

        // Create master gain for music (quieter than SFX)
        if (!this.musicGainNode) {
            this.musicGainNode = this.context.createGain();
            this.musicGainNode.connect(this.context.destination);
        }
        this.musicGainNode.gain.setValueAtTime(0.08, now);

        // Play melody
        let melodyTime = 0;
        for (const { note, duration } of melody) {
            if (note > 0) {
                this.playMusicNote(note, now + melodyTime, duration * 0.9, 'square', 0.06);
            }
            melodyTime += duration;
        }

        // Play bass
        let bassTime = 0;
        for (const { note, duration } of bass) {
            if (note > 0) {
                this.playMusicNote(note, now + bassTime, duration * 0.9, 'triangle', 0.04);
            }
            bassTime += duration;
        }

        // Calculate total loop duration
        const loopDuration = Math.max(melodyTime, bassTime) * 1000;

        // Schedule next loop
        this.musicLoopTimeout = setTimeout(() => {
            if (this.musicPlaying && this.musicEnabled) {
                this.playMusicLoop();
            }
        }, loopDuration);
    }

    /**
     * Play a single music note
     */
    private playMusicNote(
        frequency: number,
        startTime: number,
        duration: number,
        waveType: OscillatorType,
        volume: number
    ): void {
        if (!this.context || !this.musicGainNode) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.musicGainNode);

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Envelope for chiptune feel
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.setValueAtTime(volume, startTime + duration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        this.musicOscillators.push(oscillator);

        // Clean up oscillator reference after it stops
        oscillator.onended = () => {
            const index = this.musicOscillators.indexOf(oscillator);
            if (index > -1) {
                this.musicOscillators.splice(index, 1);
            }
        };
    }

    /**
     * Check if music is currently playing
     */
    isMusicPlaying(): boolean {
        return this.musicPlaying;
    }
}

/** Singleton audio instance */
export const audio = new Audio();
