import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Music,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  BASS_NOTES,
  ITALIAN_NOTE_ORDER,
  NOTE_COLORS,
  RHYTHMS,
  TREBLE_NOTES,
  getNotesForDifficulty,
  getRhythmsForDifficulty,
} from '../data/curriculum';
import {
  ChallengeMode,
  ClefType,
  Difficulty,
  ItalianNoteName,
  MiniGameId,
  NoteDefinition,
  PlayerStats,
  RhythmDefinition,
  StudyMode,
} from '../types/music';
import {
  InstrumentTimbre,
  playBeatPattern,
  playGentleError,
  playInstrumentNote,
  playMelodySequence,
  playStreakFanfare,
  playSuccessChime,
} from '../utils/audio';
import { motion } from 'motion/react';
import { speakItalian, stopSpeech } from '../utils/voice';
import { StaffNoteItem, StaffSVG } from './StaffSVG';
import { RhythmCardSVG } from './RhythmCardSVG';
import { SolinoAssistant } from './SolinoAssistant';
import { CelebrationConfetti } from './CelebrationConfetti';

interface ExerciseArenaProps {
  stats: PlayerStats;
  activeTimbre: InstrumentTimbre;
  studyMode: StudyMode;
  voiceGuideEnabled: boolean;
  onToggleVoiceGuide: () => void;
  onStudyModeChange: (mode: StudyMode) => void;
  onRecordAnswer: (params: {
    correct: boolean;
    noteName?: ItalianNoteName;
    difficulty: Difficulty;
    isRoundComplete?: boolean;
    roundScore?: number;
    timedBonusGolden?: number;
  }) => void;
  onGoToRewards: () => void;
}

const QUESTIONS_PER_ROUND = 10;
const TIMED_DURATION_SEC = 60;

interface QuestionState {
  id: number;
  targetNote?: NoteDefinition;
  melodyNotes?: NoteDefinition[];
  targetRhythm?: RhythmDefinition;
  rhythmOptions?: RhythmDefinition[];
  rhythmQuestionType?: 'identify_beats' | 'identify_name';
}

function pickRandom<T>(arr: T[], excludeItem?: T): T {
  const filtered = excludeItem && arr.length > 1 ? arr.filter((x) => x !== excludeItem) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const ExerciseArena: React.FC<ExerciseArenaProps> = ({
  stats,
  activeTimbre,
  studyMode,
  voiceGuideEnabled,
  onToggleVoiceGuide,
  onStudyModeChange,
  onRecordAnswer,
  onGoToRewards,
}) => {
  const [miniGame, setMiniGame] = useState<MiniGameId>('caccia');
  const [difficulty, setDifficulty] = useState<Difficulty>('principiante');
  const [clef, setClef] = useState<ClefType>('treble');
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>('standard');
  const [showXylophoneHelper, setShowXylophoneHelper] = useState<boolean>(true);

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [roundCorrect, setRoundCorrect] = useState<number>(0);
  const [roundGoldenEarned, setRoundGoldenEarned] = useState<number>(0);
  const [roundFinished, setRoundFinished] = useState<boolean>(false);

  // Timed challenge state (1 minute)
  const [timedPhase, setTimedPhase] = useState<'ready' | 'running' | 'finished'>('ready');
  const [secondsLeft, setSecondsLeft] = useState<number>(TIMED_DURATION_SEC);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const roundCorrectRef = useRef<number>(0);
  useEffect(() => {
    roundCorrectRef.current = roundCorrect;
  }, [roundCorrect]);

  const [tipTier, setTipTier] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'correct' | 'wrong';
    text: string;
    detail?: string;
  }>({ status: 'idle', text: '' });

  // Placement mini-game state
  const [placedNote, setPlacedNote] = useState<NoteDefinition | null>(null);

  // Melody sequence mini-game state
  const [melodyStepIndex, setMelodyStepIndex] = useState<number>(0);
  const [melodyPlayingIdx, setMelodyPlayingIdx] = useState<number | null>(null);

  // Rhythm beat pulse visual
  const [activeBeatPulse, setActiveBeatPulse] = useState<number | null>(null);

  const lastTargetRef = useRef<string | undefined>(undefined);
  const questionCounterRef = useRef<number>(1);

  const availableNotes = useMemo(
    () => getNotesForDifficulty(clef, difficulty),
    [clef, difficulty]
  );

  const availableRhythms = useMemo(
    () => getRhythmsForDifficulty(difficulty),
    [difficulty]
  );

  const generateQuestion = useCallback(
    (game: MiniGameId, diff: Difficulty, activeClef: ClefType): QuestionState => {
      const notesPool = getNotesForDifficulty(activeClef, diff);
      const rhythmPool = getRhythmsForDifficulty(diff);
      const qId = questionCounterRef.current++;

      if (game === 'caccia' || game === 'posiziona') {
        const previous = notesPool.find((n) => n.id === lastTargetRef.current);
        const picked = pickRandom(notesPool, previous);
        lastTargetRef.current = picked.id;
        return { id: qId, targetNote: picked };
      }

      if (game === 'melodia') {
        const length = diff === 'principiante' ? 3 : diff === 'esploratore' ? 4 : 5;
        const seq: NoteDefinition[] = [];
        for (let i = 0; i < length; i++) {
          seq.push(pickRandom(notesPool, i > 0 ? seq[i - 1] : undefined));
        }
        return { id: qId, melodyNotes: seq };
      }

      // Rhythm mini-game
      const targetR = pickRandom(rhythmPool);
      const qType = Math.random() > 0.45 ? 'identify_beats' : 'identify_name';
      return {
        id: qId,
        targetRhythm: targetR,
        rhythmOptions: RHYTHMS.slice(0, diff === 'principiante' ? 3 : diff === 'esploratore' ? 4 : 5),
        rhythmQuestionType: qType,
      };
    },
    []
  );

  const [question, setQuestion] = useState<QuestionState>(() =>
    generateQuestion('caccia', 'principiante', 'treble')
  );

  const startFreshQuestion = useCallback(
    (game: MiniGameId, diff: Difficulty, activeClef: ClefType) => {
      setTipTier(0);
      setFeedback({ status: 'idle', text: '' });
      setPlacedNote(null);
      setMelodyStepIndex(0);
      setMelodyPlayingIdx(null);
      setActiveBeatPulse(null);
      setQuestion(generateQuestion(game, diff, activeClef));
    },
    [generateQuestion]
  );

  const advanceTimerRef = useRef<number | null>(null);

  const handleRestartRound = useCallback(
    (
      newGame = miniGame,
      newDiff = difficulty,
      newClef = clef,
      newChallenge = challengeMode,
      autoStartTimed = false
    ) => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      setQuestionIndex(0);
      setRoundCorrect(0);
      roundCorrectRef.current = 0;
      setRoundGoldenEarned(0);
      setRoundFinished(false);
      setIsNewRecord(false);
      setSecondsLeft(TIMED_DURATION_SEC);
      if (newChallenge === 'timed') {
        setTimedPhase(autoStartTimed ? 'running' : 'ready');
      } else {
        setTimedPhase('ready');
      }
      startFreshQuestion(newGame, newDiff, newClef);
    },
    [challengeMode, clef, difficulty, miniGame, startFreshQuestion]
  );

  // 1-Minute Countdown Effect
  useEffect(() => {
    if (challengeMode !== 'timed' || timedPhase !== 'running') return;

    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
          const finalCorrect = roundCorrectRef.current;
          const extraBonus = finalCorrect * 5;
          setIsNewRecord(finalCorrect > 0 && finalCorrect > (stats.bestTimedScore || 0));
          setTimedPhase('finished');
          setRoundFinished(true);
          onRecordAnswer({
            correct: false,
            difficulty,
            isRoundComplete: true,
            roundScore: finalCorrect,
            timedBonusGolden: extraBonus,
          });
          playStreakFanfare();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [challengeMode, difficulty, onRecordAnswer, stats.bestTimedScore, timedPhase]);

  // Switch game / difficulty / clef / challenge mode
  const speakMiniGameIntro = useCallback(
    (g: MiniGameId) => {
      if (!voiceGuideEnabled) return;
      const intros: Record<MiniGameId, string> = {
        caccia:
          'Caccia alla nota! Osserva la nota sul pentagramma e clicca il nome giusto o il tasto sullo xilofono.',
        posiziona:
          'Costruisci lo spartito! Tocca la riga o lo spazio giusto sul pentagramma per sistemare la nota richiesta.',
        ritmo:
          'Treno del ritmo! Ascolta o osserva la figura musicale e scegli quanti battiti dura o come si chiama.',
        melodia:
          'Leggi la melodia! Leggi le note da sinistra verso destra e cliccale nell ordine giusto.',
      };
      speakItalian(intros[g]);
    },
    [voiceGuideEnabled]
  );

  const selectMiniGame = (g: MiniGameId) => {
    setMiniGame(g);
    handleRestartRound(g, difficulty, clef, challengeMode, false);
    speakMiniGameIntro(g);
  };

  const selectDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    handleRestartRound(miniGame, d, clef, challengeMode, false);
    if (voiceGuideEnabled) {
      const labels: Record<Difficulty, string> = {
        principiante: 'Livello Principiante: partiamo dalle note da Do a Sol con i numeri sulle righe.',
        esploratore: 'Livello Esploratore: esploriamo tutta la scala musicale.',
        maestro: 'Livello Maestro: ci alleniamo anche con le note più alte!',
      };
      speakItalian(labels[d]);
    }
  };

  const selectClef = (c: ClefType) => {
    setClef(c);
    handleRestartRound(miniGame, difficulty, c, challengeMode, false);
    if (voiceGuideEnabled) {
      speakItalian(
        c === 'treble'
          ? 'Ora leggiamo in Chiave di Violino.'
          : 'Ora esploriamo la Chiave di Basso!'
      );
    }
  };

  const selectChallengeMode = (mode: ChallengeMode) => {
    setChallengeMode(mode);
    handleRestartRound(miniGame, difficulty, clef, mode, false);
    if (voiceGuideEnabled) {
      speakItalian(
        mode === 'timed'
          ? 'Sfida a tempo da un minuto! Premi il pulsante Inizia quando sei pronto.'
          : 'Modalità classica da dieci domande!'
      );
    }
  };

  const advanceQuestion = (wasCorrect: boolean) => {
    if (challengeMode === 'timed') {
      setQuestionIndex((idx) => idx + 1);
      startFreshQuestion(miniGame, difficulty, clef);
      return;
    }

    const nextIdx = questionIndex + 1;
    const updatedRoundCorrect = wasCorrect ? roundCorrect + 1 : roundCorrect;

    if (nextIdx >= QUESTIONS_PER_ROUND) {
      setRoundFinished(true);
      onRecordAnswer({
        correct: false, // already recorded on click; this triggers round completion bonus
        difficulty,
        isRoundComplete: true,
        roundScore: updatedRoundCorrect,
      });
      playStreakFanfare();
    } else {
      setQuestionIndex(nextIdx);
      startFreshQuestion(miniGame, difficulty, clef);
    }
  };

  // Auto-advance timer ref cleanup + speech cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      stopSpeech();
    };
  }, []);

  const scheduleNext = (delayMs: number, wasCorrect: boolean) => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    const actualDelay = challengeMode === 'timed' ? Math.min(delayMs, 420) : delayMs;
    advanceTimerRef.current = window.setTimeout(() => {
      advanceQuestion(wasCorrect);
    }, actualDelay);
  };

  const handleCacciaAnswer = (chosenName: ItalianNoteName) => {
    if (feedback.status === 'correct' || !question.targetNote) return;

    const target = question.targetNote;
    if (chosenName === target.name) {
      playInstrumentNote(target.frequency, activeTimbre, 0.55);
      window.setTimeout(() => playSuccessChime(), 160);

      const bonus = stats.currentStreak + 1 >= 3 ? 15 : 10;
      setRoundCorrect((c) => c + 1);
      setRoundGoldenEarned((g) => g + bonus);
      setFeedback({
        status: 'correct',
        text: `Bravissimo! È proprio ${target.name}!`,
        detail: `${target.positionLabel} · +${bonus} Note d'Oro`,
      });
      onRecordAnswer({ correct: true, noteName: target.name, difficulty });
      scheduleNext(1350, true);
    } else {
      playGentleError();
      setFeedback({
        status: 'wrong',
        text: `Quasi! Non è ${chosenName}.`,
        detail: 'Guarda bene se la nota è su una riga o in uno spazio, oppure chiedi un aiuto a Solino!',
      });
      onRecordAnswer({ correct: false, noteName: target.name, difficulty });
    }
  };

  const handleStaffPlace = (clickedNote: NoteDefinition) => {
    if (feedback.status === 'correct' || !question.targetNote) return;
    setPlacedNote(clickedNote);
    playInstrumentNote(clickedNote.frequency, activeTimbre, 0.5);

    const target = question.targetNote;
    const isSameNoteName = clickedNote.name === target.name;

    if (isSameNoteName) {
      window.setTimeout(() => playSuccessChime(), 160);
      const bonus = stats.currentStreak + 1 >= 3 ? 15 : 10;
      setRoundCorrect((c) => c + 1);
      setRoundGoldenEarned((g) => g + bonus);
      setFeedback({
        status: 'correct',
        text: `Perfetto! Hai messo il ${target.name} al posto giusto!`,
        detail: `${clickedNote.positionLabel} · +${bonus} Note d'Oro`,
      });
      onRecordAnswer({ correct: true, noteName: target.name, difficulty });
      scheduleNext(1450, true);
    } else {
      playGentleError();
      const directionHint =
        clickedNote.staffStep < target.staffStep
          ? 'Prova un po\' più in ALTO sul pentagramma!'
          : 'Prova un po\' più in BASSO sul pentagramma!';
      setFeedback({
        status: 'wrong',
        text: `Qui abita il ${clickedNote.name}.`,
        detail: directionHint,
      });
      onRecordAnswer({ correct: false, noteName: target.name, difficulty });
    }
  };

  const handleRhythmAnswer = (selectedRhythm: RhythmDefinition) => {
    if (feedback.status === 'correct' || !question.targetRhythm) return;
    const target = question.targetRhythm;

    if (selectedRhythm.id === target.id) {
      playBeatPattern(target.beats, target.id === 'pausa_semiminima', (b) => setActiveBeatPulse(b));
      window.setTimeout(() => playSuccessChime(), 300);

      const bonus = stats.currentStreak + 1 >= 3 ? 15 : 10;
      setRoundCorrect((c) => c + 1);
      setRoundGoldenEarned((g) => g + bonus);
      setFeedback({
        status: 'correct',
        text: `Fantastico! È la ${target.name} (${target.beatsLabel})!`,
        detail: `Si legge "${target.syllable}" · +${bonus} Note d'Oro`,
      });
      onRecordAnswer({ correct: true, difficulty });
      scheduleNext(1500, true);
    } else {
      playGentleError();
      setFeedback({
        status: 'wrong',
        text: `Quasi! Hai scelto "${selectedRhythm.name}" (${selectedRhythm.beatsLabel}).`,
        detail: 'Osserva se la testina è bianca o nera, e se ha la gambetta o la bandierina!',
      });
      onRecordAnswer({ correct: false, difficulty });
    }
  };

  const handleMelodyTap = (chosenName: ItalianNoteName) => {
    if (feedback.status === 'correct' || !question.melodyNotes) return;
    const expectedNote = question.melodyNotes[melodyStepIndex];
    if (!expectedNote) return;

    if (chosenName === expectedNote.name) {
      playInstrumentNote(expectedNote.frequency, activeTimbre, 0.42);
      const nextStep = melodyStepIndex + 1;

      if (nextStep >= question.melodyNotes.length) {
        setMelodyStepIndex(nextStep);
        const freqs = question.melodyNotes.map((n) => n.frequency);
        window.setTimeout(() => {
          playMelodySequence(freqs, activeTimbre, 280, (idx) => setMelodyPlayingIdx(idx));
        }, 250);

        const bonus = 15;
        setRoundCorrect((c) => c + 1);
        setRoundGoldenEarned((g) => g + bonus);
        setFeedback({
          status: 'correct',
          text: 'Melodia completata alla perfezione!',
          detail: `Hai letto tutte e ${question.melodyNotes.length} le note · +${bonus} Note d'Oro`,
        });
        onRecordAnswer({ correct: true, noteName: expectedNote.name, difficulty });
        scheduleNext(challengeMode === 'timed' ? 750 : 1900, true);
      } else {
        setMelodyStepIndex(nextStep);
        setFeedback({
          status: 'idle',
          text: `Ottimo! Nota ${nextStep} di ${question.melodyNotes.length} giusta. Avanti così!`,
        });
      }
    } else {
      playGentleError();
      setFeedback({
        status: 'wrong',
        text: `Ops! La nota numero ${melodyStepIndex + 1} non è ${chosenName}.`,
        detail: 'Leggiamo sempre da sinistra verso destra, una nota alla volta!',
      });
      onRecordAnswer({ correct: false, noteName: expectedNote.name, difficulty });
    }
  };

  // Compute Solino's dynamic message & tip
  const solinoState = useMemo(() => {
    if (challengeMode === 'timed' && timedPhase === 'ready') {
      return {
        mood: 'happy' as const,
        message:
          'Sfida a Tempo! Hai 1 minuto per leggere più note possibile: più ne indovini, più Note d\'Oro extra guadagni alla fine!',
        tipText: undefined,
        parentTipText: undefined,
      };
    }

    if (roundFinished) {
      if (challengeMode === 'timed') {
        return {
          mood: 'happy' as const,
          message:
            roundCorrect >= 10
              ? `Incredibile velocità! Hai riconosciuto ben ${roundCorrect} esercizi in un solo minuto!`
              : `Tempo scaduto! Hai fatto ${roundCorrect} risposte giuste in 60 secondi. Riproviamo a battere il record?`,
          tipText: undefined,
          parentTipText: undefined,
        };
      }
      return {
        mood: 'happy' as const,
        message: `Evviva! Hai finito tutta la sfida con ${roundCorrect} risposte esatte su ${QUESTIONS_PER_ROUND}! Sei un vero musicista!`,
        tipText: undefined,
        parentTipText: undefined,
      };
    }

    if (feedback.status === 'correct') {
      const cheer =
        stats.currentStreak >= 5
          ? `Che meraviglia! Sei a ${stats.currentStreak} risposte di fila senza errori!`
          : 'Ottimo lavoro! Le tue orecchie e i tuoi occhi diventano sempre più veloci!';
      return {
        mood: 'happy' as const,
        message: cheer,
        tipText: undefined,
        parentTipText: undefined,
      };
    }

    if (feedback.status === 'wrong') {
      const activeTarget =
        miniGame === 'melodia' && question.melodyNotes
          ? question.melodyNotes[melodyStepIndex]
          : question.targetNote;
      return {
        mood: 'thinking' as const,
        message: 'Niente paura! Sbagliando si allena l\'orecchio. Vuoi un piccolo trucco per trovarla subito?',
        tipText:
          miniGame === 'ritmo'
            ? question.targetRhythm?.tip
            : activeTarget?.mnemonicTip,
        parentTipText:
          miniGame === 'ritmo'
            ? question.targetRhythm?.parentTip
            : activeTarget?.parentTip,
      };
    }

    // Idle state prompts per mini-game
    if (miniGame === 'caccia' && question.targetNote) {
      return {
        mood: 'happy' as const,
        message:
          studyMode === 'genitore'
            ? 'Leggete insieme questa nota sul pentagramma! Chiedi prima al bambino di dirla ad alta voce.'
            : 'Osserva la nota sul pentagramma: come si chiama? Clicca il nome giusto o usa lo xilofono!',
        tipText: question.targetNote.mnemonicTip,
        parentTipText: question.targetNote.parentTip,
      };
    }

    if (miniGame === 'posiziona' && question.targetNote) {
      return {
        mood: 'happy' as const,
        message: `Tocca la riga o lo spazio giusto sul pentagramma per sistemare la nota ${question.targetNote.name}!`,
        tipText: question.targetNote.mnemonicTip,
        parentTipText: question.targetNote.parentTip,
      };
    }

    if (miniGame === 'ritmo' && question.targetRhythm) {
      return {
        mood: 'happy' as const,
        message: 'Ascolta o osserva la figura musicale: quanto dura il suo suono o il suo silenzio?',
        tipText: question.targetRhythm.tip,
        parentTipText: question.targetRhythm.parentTip,
      };
    }

    if (miniGame === 'melodia' && question.melodyNotes) {
      const currentTarget = question.melodyNotes[melodyStepIndex];
      return {
        mood: 'happy' as const,
        message: `Leggi la melodia da sinistra a destra! Ora tocca la nota numero ${melodyStepIndex + 1} di ${question.melodyNotes.length}.`,
        tipText: currentTarget?.mnemonicTip,
        parentTipText: currentTarget?.parentTip,
      };
    }

    return {
      mood: 'happy' as const,
      message: 'Pronto a fare musica insieme?',
      tipText: undefined,
      parentTipText: undefined,
    };
  }, [
    challengeMode,
    feedback.status,
    melodyStepIndex,
    miniGame,
    question,
    roundCorrect,
    roundFinished,
    stats.currentStreak,
    studyMode,
    timedPhase,
  ]);

  // Speak tips, target placement instructions, and celebration milestones when voice guide is enabled
  useEffect(() => {
    if (!voiceGuideEnabled) return;
    if (roundFinished) {
      const t = window.setTimeout(() => {
        speakItalian(solinoState.message);
      }, 450);
      return () => window.clearTimeout(t);
    }
  }, [roundFinished, solinoState.message, voiceGuideEnabled]);

  useEffect(() => {
    if (!voiceGuideEnabled) return;
    if (tipTier === 1 && solinoState.tipText) {
      speakItalian(`Ecco un trucco: ${solinoState.tipText}`);
    } else if (tipTier === 2) {
      speakItalian('Guarda la fascia dorata sul pentagramma!');
    }
  }, [solinoState.tipText, tipTier, voiceGuideEnabled]);

  useEffect(() => {
    if (!voiceGuideEnabled) return;
    if (challengeMode === 'timed' && timedPhase === 'running') return;
    if (miniGame === 'posiziona' && question.targetNote && !roundFinished) {
      const t = window.setTimeout(() => {
        speakItalian(`Metti sul pentagramma la nota ${question.targetNote?.name}!`);
      }, 250);
      return () => window.clearTimeout(t);
    }
  }, [challengeMode, miniGame, question.id, question.targetNote, roundFinished, timedPhase, voiceGuideEnabled]);

  // Compute staff notes to display
  const staffDisplayNotes: StaffNoteItem[] = useMemo(() => {
    if (miniGame === 'caccia' && question.targetNote) {
      return [
        {
          note: question.targetNote,
          state: feedback.status === 'correct' ? 'correct' : 'default',
          showLabel: feedback.status === 'correct',
        },
      ];
    }

    if (miniGame === 'posiziona') {
      if (!placedNote) return [];
      const isRight = placedNote.name === question.targetNote?.name;
      return [
        {
          note: placedNote,
          state: isRight ? 'correct' : 'wrong',
          showLabel: true,
        },
      ];
    }

    if (miniGame === 'melodia' && question.melodyNotes) {
      return question.melodyNotes.map((n, idx) => {
        let state: StaffNoteItem['state'] = 'default';
        if (melodyPlayingIdx === idx) state = 'active';
        else if (idx < melodyStepIndex) state = 'correct';
        else if (idx === melodyStepIndex) state = 'active';
        return {
          note: n,
          state,
          showLabel: idx < melodyStepIndex || feedback.status === 'correct',
        };
      });
    }

    return [];
  }, [feedback.status, melodyPlayingIdx, melodyStepIndex, miniGame, placedNote, question]);

  const highlightTargetStep = useMemo(() => {
    if (tipTier < 2) return null;
    if (miniGame === 'caccia' || miniGame === 'posiziona') {
      return question.targetNote?.staffStep ?? null;
    }
    if (miniGame === 'melodia' && question.melodyNotes) {
      return question.melodyNotes[melodyStepIndex]?.staffStep ?? null;
    }
    return null;
  }, [melodyStepIndex, miniGame, question, tipTier]);

  const noteChoices = useMemo(() => {
    const uniqueNames = Array.from(new Set(availableNotes.map((n) => n.name)));
    return ITALIAN_NOTE_ORDER.filter((name) => uniqueNames.includes(name));
  }, [availableNotes]);

  const xylophoneKeys = useMemo(() => {
    const pool = clef === 'treble' ? TREBLE_NOTES : BASS_NOTES;
    return pool.filter((n) =>
      difficulty === 'principiante'
        ? n.minDifficulty === 'principiante'
        : difficulty === 'esploratore'
          ? n.minDifficulty !== 'maestro'
          : true
    );
  }, [clef, difficulty]);

  return (
    <div className="space-y-6">
      {/* Control Strip: Mini-Game Selector + Difficulty + Study Mode */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 4 Mini-Games Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl" role="tablist" aria-label="Scegli il mini-gioco">
            {[
              { id: 'caccia' as MiniGameId, label: '1. Caccia alla Nota' },
              { id: 'posiziona' as MiniGameId, label: '2. Metti sul Pentagramma' },
              { id: 'ritmo' as MiniGameId, label: '3. Treno del Ritmo' },
              { id: 'melodia' as MiniGameId, label: '4. Leggi la Melodia' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={miniGame === tab.id}
                onClick={() => selectMiniGame(tab.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  miniGame === tab.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Study Mode Toggle: Solo vs Parent */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl" role="group" aria-label="Modalità di studio">
            <button
              type="button"
              onClick={() => onStudyModeChange('solo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                studyMode === 'solo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Studio da Solo
            </button>
            <button
              type="button"
              onClick={() => onStudyModeChange('genitore')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                studyMode === 'genitore'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Con un Genitore
            </button>
          </div>
        </div>

        {/* Difficulty & Clef Secondary Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Difficoltà:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(
                [
                  { id: 'principiante', label: 'Principiante (Do–Sol)' },
                  { id: 'esploratore', label: 'Esploratore (Tutta la scala)' },
                  { id: 'maestro', label: 'Maestro (Note alte)' },
                ] as { id: Difficulty; label: string }[]
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDifficulty(d.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    difficulty === d.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {miniGame !== 'ritmo' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Chiave:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => selectClef('treble')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    clef === 'treble'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chiave di Violino (Sol)
                </button>
                <button
                  type="button"
                  onClick={() => selectClef('bass')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    clef === 'bass'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chiave di Basso (Fa)
                </button>
              </div>
            </div>
          )}

          {/* Challenge Format Toggle: Standard 10 Questions vs 1-Minute Timed */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Formato:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => selectChallengeMode('standard')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  challengeMode === 'standard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                10 Domande
              </button>
              <button
                type="button"
                onClick={() => selectChallengeMode('timed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
                  challengeMode === 'timed'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Timer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sfida a Tempo (1 min)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Zone Learning Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main Zone: Interactive Sheet Music Stage (8 cols) */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 flex flex-col gap-5">
          {/* Clean Unboxed Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">
                {miniGame === 'caccia' && 'Caccia alla Nota'}
                {miniGame === 'posiziona' && 'Costruisci lo Spartito'}
                {miniGame === 'ritmo' && 'Treno del Ritmo'}
                {miniGame === 'melodia' && 'Lettura Veloce della Melodia'}
              </span>
              <span aria-hidden="true">·</span>
              {challengeMode === 'timed' ? (
                <span className="font-mono-nums font-semibold text-slate-800">
                  Esatte: {roundCorrect}
                </span>
              ) : (
                <span className="font-mono-nums">
                  Domanda {Math.min(questionIndex + 1, QUESTIONS_PER_ROUND)} / {QUESTIONS_PER_ROUND}
                </span>
              )}
              {stats.currentStreak >= 2 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 font-mono-nums">
                    <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
                    Serie {stats.currentStreak}
                  </span>
                </>
              )}
            </div>

            {challengeMode === 'timed' ? (
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 text-sm font-bold font-mono-nums ${
                    secondsLeft <= 10 && timedPhase === 'running'
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}
                >
                  <Timer className="w-4 h-4" aria-hidden="true" />
                  <span>
                    00:{String(secondsLeft).padStart(2, '0')}
                    {secondsLeft <= 10 && timedPhase === 'running' ? ' · Ultimi secondi!' : ''}
                  </span>
                </div>
                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      secondsLeft <= 10 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(secondsLeft / TIMED_DURATION_SEC) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Step Progress Dots */
              <div className="flex items-center gap-1.5" aria-label={`Progresso sfida: ${questionIndex} di ${QUESTIONS_PER_ROUND}`}>
                {Array.from({ length: QUESTIONS_PER_ROUND }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx < questionIndex
                        ? 'w-4 bg-emerald-500'
                        : idx === questionIndex && !roundFinished
                          ? 'w-5 bg-blue-600'
                          : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {challengeMode === 'timed' && timedPhase === 'ready' ? (
            /* Timed Challenge Ready Screen */
            <div className="py-8 px-4 text-center flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Timer className="w-8 h-8 text-amber-600" aria-hidden="true" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Sfida a Tempo: 1 Minuto!
                </h2>
                <p className="text-slate-600 text-base leading-relaxed">
                  Hai <strong>60 secondi</strong> per riconoscere più note o ritmi possibile. Ogni risposta esatta ti regala <strong>+5 Note d&apos;Oro di bonus extra</strong> alla fine del minuto!
                </p>
                <p className="text-xs font-semibold text-slate-500 font-mono-nums pt-1">
                  Record personale attuale: {stats.bestTimedScore || 0} risposte in 1 minuto
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRestartRound(miniGame, difficulty, clef, 'timed', true)}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Inizia la Sfida da 1 Minuto!</span>
              </button>
            </div>
          ) : roundFinished ? (
            /* Round Summary Victory View */
            <div className="relative overflow-hidden py-8 px-4 text-center flex flex-col items-center gap-5 rounded-2xl">
              <CelebrationConfetti key={`celebration-${stats.roundsCompleted}`} />

              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="relative z-10 w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs"
              >
                <Trophy className="w-8 h-8 text-amber-600" aria-hidden="true" />
              </motion.div>

              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="relative z-10 space-y-2 max-w-md"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {challengeMode === 'timed' ? 'Tempo Scaduto · Ottima Corsa!' : 'Sfida Completata!'}
                </h2>
                {challengeMode === 'timed' ? (
                  <>
                    <p className="text-slate-600 text-base leading-relaxed">
                      In 1 minuto hai completato <strong className="text-slate-900 font-mono-nums">{roundCorrect}</strong> risposte esatte, guadagnando <strong className="text-amber-700 font-mono-nums">+{roundGoldenEarned} Note d&apos;Oro</strong> più <strong className="text-emerald-700 font-mono-nums">+{roundCorrect * 5} di Bonus Tempo</strong>!
                    </p>
                    {isNewRecord && (
                      <p className="text-sm font-bold text-blue-700">
                        Nuovo Record Personale: {roundCorrect} risposte in 60 secondi!
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-600 text-base leading-relaxed">
                    Hai risposto bene al primo colpo a <strong className="text-slate-900 font-mono-nums">{roundCorrect}</strong> domande su <strong className="text-slate-900 font-mono-nums">{QUESTIONS_PER_ROUND}</strong> e hai guadagnato <strong className="text-amber-700 font-mono-nums">+{roundGoldenEarned + 25} Note d&apos;Oro</strong> (incluso il bonus finale!).
                  </p>
                )}
              </motion.div>

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleRestartRound(
                      miniGame,
                      difficulty,
                      clef,
                      challengeMode,
                      challengeMode === 'timed'
                    )
                  }
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>{challengeMode === 'timed' ? 'Riprova 1 Minuto' : 'Gioca ancora'}</span>
                </button>
                <button
                  type="button"
                  onClick={onGoToRewards}
                  className="px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  <span>Vai ai Premi e Orchestra</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Mini-Game Interactive Area */}
              {miniGame !== 'ritmo' ? (
                <div className="space-y-5">
                  {/* Prompt headline */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {miniGame === 'caccia' && question.targetNote && (
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Che nota è questa sul pentagramma?
                      </h2>
                    )}
                    {miniGame === 'posiziona' && question.targetNote && (
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Metti sul pentagramma la nota{' '}
                        <span
                          className="underline decoration-2 underline-offset-4"
                          style={{ color: question.targetNote.color }}
                        >
                          {question.targetNote.name}
                        </span>
                      </h2>
                    )}
                    {miniGame === 'melodia' && question.melodyNotes && (
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Suona la melodia nell&apos;ordine giusto ({melodyStepIndex + 1} di{' '}
                        {question.melodyNotes.length})
                      </h2>
                    )}

                    {/* Audio Preview Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (miniGame === 'melodia' && question.melodyNotes) {
                          playMelodySequence(
                            question.melodyNotes.map((n) => n.frequency),
                            activeTimbre,
                            340,
                            (idx) => setMelodyPlayingIdx(idx)
                          );
                          window.setTimeout(
                            () => setMelodyPlayingIdx(null),
                            question.melodyNotes.length * 360 + 200
                          );
                        } else if (question.targetNote) {
                          playInstrumentNote(question.targetNote.frequency, activeTimbre, 0.6);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                      <span>{miniGame === 'melodia' ? 'Ascolta melodia' : 'Ascolta il suono'}</span>
                    </button>
                  </div>

                  {/* Sheet Music Canvas — Quaderno Pentagrammato */}
                  <div className="bg-[#FFFDF8] border border-amber-200/75 rounded-2xl px-3 py-4 sm:px-6 sm:py-5 shadow-[inset_0_1px_4px_rgba(120,90,40,0.05)]">
                    <StaffSVG
                      clef={clef}
                      notes={staffDisplayNotes}
                      highlightStep={highlightTargetStep}
                      showLineNumbers={difficulty === 'principiante'}
                      showColorHints={difficulty === 'principiante'}
                      interactivePlacement={miniGame === 'posiziona'}
                      onStepSelect={handleStaffPlace}
                      onNoteClick={(note) => playInstrumentNote(note.frequency, activeTimbre, 0.5)}
                    />
                    {miniGame === 'posiziona' && (
                      <p className="text-center text-xs text-slate-500 mt-1">
                        Muovi il dito o il mouse tra le righe e gli spazi, poi clicca per appoggiare la nota!
                      </p>
                    )}
                  </div>

                  {/* Answer Buttons for Caccia alla Nota & Melodia */}
                  {(miniGame === 'caccia' || miniGame === 'melodia') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                        {noteChoices.map((noteName) => (
                          <button
                            key={noteName}
                            type="button"
                            onClick={() =>
                              miniGame === 'caccia'
                                ? handleCacciaAnswer(noteName)
                                : handleMelodyTap(noteName)
                            }
                            style={{ borderBottomColor: NOTE_COLORS[noteName] }}
                            className="min-h-[58px] rounded-xl border border-slate-200 border-b-[3px] bg-white hover:bg-[#FFFDF8] hover:-translate-y-0.5 active:translate-y-0 text-slate-900 font-display font-bold text-lg transition-all flex flex-col items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span>{noteName}</span>
                            {difficulty === 'principiante' && (
                              <span
                                className="w-5 h-1 rounded-full opacity-85"
                                style={{ backgroundColor: NOTE_COLORS[noteName] }}
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Optional Interactive Colored Xylophone Helper */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            Xilofono d&apos;aiuto (clicca per ascoltare o rispondere)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowXylophoneHelper((v) => !v)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            {showXylophoneHelper ? 'Nascondi' : 'Mostra'}
                          </button>
                        </div>

                        {showXylophoneHelper && (
                          <div className="bg-[#F8F5ED] border border-slate-200/80 rounded-xl p-2.5 flex items-end gap-1.5 overflow-x-auto">
                            {xylophoneKeys.map((n, idx) => {
                              const heightPx = 80 - idx * 3;
                              return (
                                <button
                                  key={`xylo-${n.id}`}
                                  type="button"
                                  onClick={() => {
                                    playInstrumentNote(n.frequency, activeTimbre, 0.45);
                                    if (miniGame === 'caccia') {
                                      handleCacciaAnswer(n.name);
                                    } else if (miniGame === 'melodia') {
                                      handleMelodyTap(n.name);
                                    }
                                  }}
                                  style={{
                                    height: `${Math.max(52, heightPx)}px`,
                                    borderBottomColor: n.color,
                                  }}
                                  className="flex-1 min-w-[44px] rounded-lg border border-slate-200 border-b-4 bg-white hover:bg-[#FFFDF8] text-slate-800 text-xs font-bold flex flex-col items-center justify-between py-2 transition-transform active:translate-y-0.5 shadow-xs cursor-pointer"
                                  title={`${n.name} (${n.positionLabel})`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" aria-hidden="true" />
                                  <span>{n.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Mini-game 3: Treno del Ritmo */
                question.targetRhythm && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {question.rhythmQuestionType === 'identify_beats'
                          ? 'Quanti battiti vale questa figura musicale?'
                          : 'Come si chiama questa figura musicale?'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          const target = question.targetRhythm!;
                          playBeatPattern(
                            target.beats,
                            target.id === 'pausa_semiminima',
                            (b) => setActiveBeatPulse(b)
                          );
                          window.setTimeout(() => setActiveBeatPulse(null), 2200);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        <span>Ascolta i battiti</span>
                      </button>
                    </div>

                    <div className="bg-[#FAF9F6] border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                      <div className="w-28 h-28 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <RhythmCardSVG rhythmId={question.targetRhythm.id} size={92} />
                      </div>

                      <div className="space-y-2 text-center sm:text-left">
                        <p className="text-sm font-medium text-slate-600">
                          Osserva bene la forma della nota (o della pausa).
                        </p>
                        {/* Beat clap visual indicator when listening */}
                        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                          {Array.from({
                            length:
                              question.targetRhythm.beats < 1
                                ? 2
                                : Math.round(question.targetRhythm.beats),
                          }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-7 h-7 rounded-full border text-xs font-bold flex items-center justify-center transition-transform font-mono-nums ${
                                activeBeatPulse === idx
                                  ? 'bg-blue-600 border-blue-600 text-white scale-110'
                                  : 'bg-white border-slate-300 text-slate-500'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(question.rhythmOptions || []).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleRhythmAnswer(opt)}
                          className="min-h-[56px] px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        >
                          <span className="font-display font-bold text-base text-slate-900">
                            {question.rhythmQuestionType === 'identify_beats'
                              ? opt.beatsLabel
                              : opt.name}
                          </span>
                          <span className="text-xs font-mono-nums text-slate-500">
                            {opt.syllable}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Feedback Banner (Color + Icon + Text) */}
              {feedback.status !== 'idle' && (
                <div
                  role="status"
                  className={`rounded-xl border p-4 flex items-start gap-3 ${
                    feedback.status === 'correct'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {feedback.status === 'correct' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="text-sm leading-relaxed">
                    <p className="font-bold">{feedback.text}</p>
                    {feedback.detail && <p className="opacity-90 mt-0.5">{feedback.detail}</p>}
                  </div>
                </div>
              )}

              {feedback.status === 'idle' && feedback.text && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm font-medium text-blue-900">
                  {feedback.text}
                </div>
              )}
            </>
          )}
        </section>

        {/* Right Zone: Solino Mascot & Tips Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <SolinoAssistant
            mood={solinoState.mood}
            message={solinoState.message}
            tipText={solinoState.tipText}
            parentTipText={solinoState.parentTipText}
            tipTier={tipTier}
            canShowVisualHint={miniGame !== 'ritmo'}
            onRequestTip={() => setTipTier((t) => (t < 2 ? ((t + 1) as 0 | 1 | 2) : 2))}
            studyMode={studyMode}
            voiceGuideEnabled={voiceGuideEnabled}
            onToggleVoiceGuide={onToggleVoiceGuide}
          />

          {/* Compact Quick Reference Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Promemoria Veloce ({clef === 'treble' ? 'Chiave di Violino' : 'Chiave di Basso'})
            </h3>
            {miniGame === 'ritmo' ? (
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>
                  <strong className="text-slate-900">Semibreve</strong>: cerchio vuoto · 4 battiti
                </li>
                <li>
                  <strong className="text-slate-900">Minima</strong>: vuota con gambetta · 2 battiti
                </li>
                <li>
                  <strong className="text-slate-900">Semiminima</strong>: nera con gambetta · 1 battito
                </li>
                <li>
                  <strong className="text-slate-900">Pausa</strong>: saetta · 1 battito di silenzio
                </li>
              </ul>
            ) : clef === 'treble' ? (
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <strong className="text-slate-900">5 Righe (dal basso):</strong>{' '}
                  <span className="font-semibold text-blue-700">MI · SOL · SI · RE · FA</span>
                </p>
                <p>
                  <strong className="text-slate-900">4 Spazi (dal basso):</strong>{' '}
                  <span className="font-semibold text-amber-700">FA · LA · DO · MI</span>
                </p>
                <p className="text-slate-500">
                  Sotto la 1ª riga c&apos;è il <strong className="text-slate-800">Re</strong>, e più sotto col taglietto il <strong className="text-slate-800">Do basso</strong>!
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <strong className="text-slate-900">5 Righe Basso:</strong>{' '}
                  <span className="font-semibold text-blue-700">SOL · SI · RE · FA · LA</span>
                </p>
                <p>
                  <strong className="text-slate-900">4 Spazi Basso:</strong>{' '}
                  <span className="font-semibold text-amber-700">LA · DO · MI · SOL</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
