export type ClefType = 'treble' | 'bass';

export type Difficulty = 'principiante' | 'esploratore' | 'maestro';

export type MiniGameId = 'caccia' | 'posiziona' | 'ritmo' | 'melodia';

export type StudyMode = 'solo' | 'genitore';

export type AppTab = 'esercizi' | 'batteria' | 'trucchi' | 'premi' | 'genitori';

export type ItalianNoteName = 'Do' | 'Re' | 'Mi' | 'Fa' | 'Sol' | 'La' | 'Si';

export interface NoteDefinition {
  id: string;
  name: ItalianNoteName;
  englishName: string;
  octave: number;
  clef: ClefType;
  /**
   * Step relative to bottom line of the staff:
   * 0 = 1st line, 1 = 1st space, 2 = 2nd line ... 8 = 5th line
   * -1 = space below 1st line, -2 = 1st ledger line below
   */
  staffStep: number;
  frequency: number;
  color: string;
  positionLabel: string;
  mnemonicTip: string;
  parentTip: string;
  minDifficulty: Difficulty;
}

export type RhythmId = 'semibreve' | 'minima' | 'semiminima' | 'croma' | 'pausa_semiminima';

export interface RhythmDefinition {
  id: RhythmId;
  name: string;
  beats: number;
  beatsLabel: string;
  syllable: string;
  tip: string;
  parentTip: string;
  minDifficulty: Difficulty;
}

export interface InstrumentReward {
  id: string;
  name: string;
  costNotes: number;
  description: string;
  timbre: 'xylophone' | 'flute' | 'piano' | 'violin' | 'trumpet' | 'harp' | 'drum';
  sampleFrequencies: number[];
  badgeColor: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  requirementText: string;
  checkUnlocked: (stats: PlayerStats) => boolean;
}

export interface NoteAccuracy {
  attempts: number;
  correct: number;
}

export type ChallengeMode = 'standard' | 'timed';

export interface PlayerStats {
  goldenNotes: number;
  stars: number;
  totalCorrect: number;
  totalAttempts: number;
  bestStreak: number;
  currentStreak: number;
  roundsCompleted: number;
  bestTimedScore?: number;
  unlockedInstruments: string[];
  noteStats: Record<ItalianNoteName, NoteAccuracy>;
  completedDifficulties: Record<Difficulty, number>;
}

export type DrumPieceId =
  | 'cassa'
  | 'timpano'
  | 'rullante'
  | 'tom_alto'
  | 'charleston'
  | 'piatto_crash';

export interface DrumPieceDefinition {
  id: DrumPieceId;
  name: string;
  soundWord: string;
  notehead: 'circle' | 'x';
  /**
   * Step relative to bottom line of the percussion staff:
   * 0 = 1st line, 1 = 1st space, 2 = 2nd line ... 8 = 5th line
   * 9 = space above 5th line, 10 = ledger line above 5th line
   */
  staffStep: number;
  positionLabel: string;
  color: string;
  tip: string;
  level: 'base' | 'avanzato';
}

export interface DrumGrooveDefinition {
  id: string;
  title: string;
  description: string;
  level: 'base' | 'avanzato';
  steps: DrumPieceId[];
}
