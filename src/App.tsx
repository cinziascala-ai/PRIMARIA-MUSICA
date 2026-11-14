import { useCallback, useEffect, useState } from 'react';
import { Speech, Volume2, VolumeX } from 'lucide-react';
import {
  INITIAL_PLAYER_STATS,
  INSTRUMENTS_REWARDS,
  getLevelInfo,
} from './data/curriculum';
import {
  AppTab,
  Difficulty,
  InstrumentReward,
  ItalianNoteName,
  PlayerStats,
  StudyMode,
} from './types/music';
import { InstrumentTimbre, setMuted } from './utils/audio';
import { initVoiceEngine, isSpeechSupported, speakItalian, stopSpeech } from './utils/voice';
import { ExerciseArena } from './components/ExerciseArena';
import { DrumSectionView } from './components/DrumSectionView';
import { TipsAndStudyView } from './components/TipsAndStudyView';
import { RewardsAndOrchestraView } from './components/RewardsAndOrchestraView';
import { ParentsCornerView } from './components/ParentsCornerView';

const STORAGE_KEY_STATS = 'solino_spartito_stats_v1';
const STORAGE_KEY_TIMBRE = 'solino_spartito_timbre_v1';
const STORAGE_KEY_VOICE = 'accademia_doremi_voice_v1';

function loadSavedStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return INITIAL_PLAYER_STATS;
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      ...INITIAL_PLAYER_STATS,
      ...parsed,
      noteStats: {
        ...INITIAL_PLAYER_STATS.noteStats,
        ...(parsed.noteStats || {}),
      },
      completedDifficulties: {
        ...INITIAL_PLAYER_STATS.completedDifficulties,
        ...(parsed.completedDifficulties || {}),
      },
      unlockedInstruments:
        parsed.unlockedInstruments && parsed.unlockedInstruments.length > 0
          ? parsed.unlockedInstruments
          : INITIAL_PLAYER_STATS.unlockedInstruments,
    };
  } catch {
    return INITIAL_PLAYER_STATS;
  }
}

function loadSavedTimbre(): InstrumentTimbre {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMBRE) as InstrumentTimbre | null;
    return raw || 'xylophone';
  } catch {
    return 'xylophone';
  }
}

function loadSavedVoiceGuide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_VOICE) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('esercizi');
  const [stats, setStats] = useState<PlayerStats>(loadSavedStats);
  const [activeTimbre, setActiveTimbre] = useState<InstrumentTimbre>(loadSavedTimbre);
  const [studyMode, setStudyMode] = useState<StudyMode>('solo');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState<boolean>(loadSavedVoiceGuide);
  const speechAvailable = isSpeechSupported();

  useEffect(() => {
    initVoiceEngine();
    return () => stopSpeech();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore storage quota errors
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TIMBRE, activeTimbre);
    } catch {
      // Ignore storage quota errors
    }
  }, [activeTimbre]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOICE, String(voiceGuideEnabled));
    } catch {
      // Ignore storage quota errors
    }
  }, [voiceGuideEnabled]);

  useEffect(() => {
    if (activeTab !== 'esercizi') {
      stopSpeech();
    }
  }, [activeTab]);

  const handleToggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    setMuted(next);
    if (next) stopSpeech();
  };

  const handleToggleVoiceGuide = () => {
    if (!speechAvailable) return;
    const next = !voiceGuideEnabled;
    setVoiceGuideEnabled(next);
    if (next) {
      if (isAudioMuted) {
        setIsAudioMuted(false);
        setMuted(false);
      }
      speakItalian(
        'Ciao! Sono Solino, la tua guida vocale! Ti spiegherò a voce i passaggi degli esercizi e i miei trucchi.'
      );
    } else {
      stopSpeech();
    }
  };

  const handleRecordAnswer = useCallback(
    ({
      correct,
      noteName,
      difficulty,
      isRoundComplete,
      roundScore,
      timedBonusGolden,
    }: {
      correct: boolean;
      noteName?: ItalianNoteName;
      difficulty: Difficulty;
      isRoundComplete?: boolean;
      roundScore?: number;
      timedBonusGolden?: number;
    }) => {
      setStats((prev) => {
        if (isRoundComplete) {
          const isTimed = typeof timedBonusGolden === 'number';
          const goldenReward = isTimed ? timedBonusGolden : 25;
          const starsReward = isTimed
            ? Math.max(2, Math.floor((roundScore || 0) / 3))
            : 3;

          return {
            ...prev,
            roundsCompleted: prev.roundsCompleted + 1,
            goldenNotes: prev.goldenNotes + goldenReward,
            stars: prev.stars + starsReward,
            bestTimedScore: isTimed
              ? Math.max(prev.bestTimedScore || 0, roundScore || 0)
              : prev.bestTimedScore || 0,
            completedDifficulties: {
              ...prev.completedDifficulties,
              [difficulty]: (prev.completedDifficulties[difficulty] || 0) + 1,
            },
          };
        }

        const nextStreak = correct ? prev.currentStreak + 1 : 0;
        const nextBestStreak = Math.max(prev.bestStreak, nextStreak);
        const goldenBonus = correct ? (nextStreak >= 3 ? 15 : 10) : 0;
        const starBonus = correct ? 1 : 0;

        const updatedNoteStats = { ...prev.noteStats };
        if (noteName) {
          const currentNoteStat = updatedNoteStats[noteName] || { attempts: 0, correct: 0 };
          updatedNoteStats[noteName] = {
            attempts: currentNoteStat.attempts + 1,
            correct: currentNoteStat.correct + (correct ? 1 : 0),
          };
        }

        return {
          ...prev,
          goldenNotes: prev.goldenNotes + goldenBonus,
          stars: prev.stars + starBonus,
          totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
          totalAttempts: prev.totalAttempts + 1,
          currentStreak: nextStreak,
          bestStreak: nextBestStreak,
          noteStats: updatedNoteStats,
        };
      });
    },
    []
  );

  const handleUnlockInstrument = useCallback((instrument: InstrumentReward) => {
    setStats((prev) => {
      if (prev.unlockedInstruments.includes(instrument.id)) return prev;
      if (prev.goldenNotes < instrument.costNotes) return prev;
      return {
        ...prev,
        goldenNotes: prev.goldenNotes - instrument.costNotes,
        unlockedInstruments: [...prev.unlockedInstruments, instrument.id],
      };
    });
    setActiveTimbre(instrument.timbre);
  }, []);

  const handleResetProgress = useCallback(() => {
    setStats(INITIAL_PLAYER_STATS);
    setActiveTimbre('xylophone');
  }, []);

  const { current: levelInfo } = getLevelInfo(stats.stars);
  const activeInstrumentName =
    INSTRUMENTS_REWARDS.find((i) => i.timbre === activeTimbre)?.name || 'Xilofono Arcobaleno';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F3] via-[#F7F4EC] to-[#F3EFE6] text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200/90 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark with musical crest */}
          <button
            type="button"
            onClick={() => setActiveTab('esercizi')}
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
          >
            <span
              className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </span>
            <span>Accademia DoReMi</span>
          </button>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" aria-label="Menu principale">
            {[
              { id: 'esercizi' as AppTab, label: 'Esercizi' },
              { id: 'batteria' as AppTab, label: 'Batteria' },
              { id: 'trucchi' as AppTab, label: 'Trucchi & Ripasso' },
              { id: 'premi' as AppTab, label: 'Premi & Orchestra' },
              { id: 'genitori' as AppTab, label: 'Genitori' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'premi' ? 'esercizi' : 'premi')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono-nums"
            >
              {activeTab === 'premi' ? 'Torna a Giocare' : `Note d'Oro: ${stats.goldenNotes}`}
            </button>
          </div>
        </div>

        {/* Mobile compact nav row */}
        <nav
          className="md:hidden border-t border-slate-100 px-3 py-2 flex items-center justify-around gap-1 overflow-x-auto"
          aria-label="Menu mobile"
        >
          {[
            { id: 'esercizi' as AppTab, label: 'Esercizi' },
            { id: 'batteria' as AppTab, label: 'Batteria' },
            { id: 'trucchi' as AppTab, label: 'Trucchi' },
            { id: 'premi' as AppTab, label: 'Premi' },
            { id: 'genitori' as AppTab, label: 'Genitori' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Clean Unboxed Status & Welcome Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {activeTab === 'esercizi' && 'La Palestra dello Spartito'}
              {activeTab === 'batteria' && 'Spartito per Batteria'}
              {activeTab === 'trucchi' && 'Trucchi e Ripasso Facile'}
              {activeTab === 'premi' && 'I Tuoi Premi e l\'Orchestra'}
              {activeTab === 'genitori' && 'Angolo Genitori e Progressi'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{levelInfo.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-nums">{stats.stars} Stelle</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-nums">{stats.goldenNotes} Note d&apos;Oro</span>
              <span aria-hidden="true">·</span>
              <span>Suono: {activeInstrumentName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {speechAvailable && (
              <button
                type="button"
                aria-pressed={voiceGuideEnabled}
                onClick={handleToggleVoiceGuide}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  voiceGuideEnabled
                    ? 'border-blue-600 bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Speech className={`w-4 h-4 ${voiceGuideEnabled ? 'text-blue-600' : 'text-slate-500'}`} aria-hidden="true" />
                <span>{voiceGuideEnabled ? 'Guida vocale attiva' : 'Attiva guida vocale'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleMute}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAudioMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" aria-hidden="true" />
                  <span>Audio disattivo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Audio attivo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active View */}
        {activeTab === 'esercizi' && (
          <ExerciseArena
            stats={stats}
            activeTimbre={activeTimbre}
            studyMode={studyMode}
            voiceGuideEnabled={voiceGuideEnabled}
            onToggleVoiceGuide={handleToggleVoiceGuide}
            onStudyModeChange={setStudyMode}
            onRecordAnswer={handleRecordAnswer}
            onGoToRewards={() => setActiveTab('premi')}
          />
        )}

        {activeTab === 'batteria' && (
          <DrumSectionView onRecordAnswer={handleRecordAnswer} />
        )}

        {activeTab === 'trucchi' && <TipsAndStudyView activeTimbre={activeTimbre} />}

        {activeTab === 'premi' && (
          <RewardsAndOrchestraView
            stats={stats}
            activeTimbre={activeTimbre}
            onSelectTimbre={setActiveTimbre}
            onUnlockInstrument={handleUnlockInstrument}
          />
        )}

        {activeTab === 'genitori' && (
          <ParentsCornerView
            stats={stats}
            studyMode={studyMode}
            onSetStudyMode={(mode) => {
              setStudyMode(mode);
              setActiveTab('esercizi');
            }}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Accademia DoReMi · Musica per la Classe Terza</span>
          <span>I tuoi progressi restano salvati su questo dispositivo</span>
        </div>
      </footer>
    </div>
  );
}
