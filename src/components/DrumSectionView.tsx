import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Lightbulb,
  Play,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { DRUM_GROOVES, DRUM_PIECES, DRUM_TIPS } from '../data/drumCurriculum';
import {
  Difficulty,
  DrumGrooveDefinition,
  DrumPieceDefinition,
  DrumPieceId,
} from '../types/music';
import {
  playDrumGroove,
  playDrumPiece,
  playGentleError,
  playStreakFanfare,
  playSuccessChime,
} from '../utils/audio';
import { DrumStaffNoteItem, DrumStaffSVG } from './DrumStaffSVG';

interface DrumSectionViewProps {
  onRecordAnswer: (params: {
    correct: boolean;
    difficulty: Difficulty;
  }) => void;
}

type DrumTab = 'impara' | 'indovina' | 'posiziona' | 'prova';
type DrumLevel = 'base' | 'avanzato';

function pickRandomPiece(pool: DrumPieceDefinition[], excludeId?: DrumPieceId): DrumPieceDefinition {
  const filtered = excludeId && pool.length > 1 ? pool.filter((p) => p.id !== excludeId) : pool;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const DrumSectionView: React.FC<DrumSectionViewProps> = ({ onRecordAnswer }) => {
  const [subTab, setSubTab] = useState<DrumTab>('impara');
  const [level, setLevel] = useState<DrumLevel>('base');

  // Impara explorer state
  const [selectedPiece, setSelectedPiece] = useState<DrumPieceDefinition>(DRUM_PIECES[0]);

  // Exercise state (Indovina & Posiziona)
  const availablePieces = useMemo(
    () => (level === 'base' ? DRUM_PIECES.filter((p) => p.level === 'base') : DRUM_PIECES),
    [level]
  );

  const [targetPiece, setTargetPiece] = useState<DrumPieceDefinition>(DRUM_PIECES[0]);
  const [placedPiece, setPlacedPiece] = useState<DrumPieceDefinition | null>(null);
  const [tipTier, setTipTier] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'correct' | 'wrong';
    text: string;
    detail?: string;
  }>({ status: 'idle', text: '' });

  // Groove test state (Prova il Groove)
  const availableGrooves = useMemo(
    () => (level === 'base' ? DRUM_GROOVES.filter((g) => g.level === 'base') : DRUM_GROOVES),
    [level]
  );
  const [activeGroove, setActiveGroove] = useState<DrumGrooveDefinition>(DRUM_GROOVES[0]);
  const [grooveStepIndex, setGrooveStepIndex] = useState<number>(0);
  const [playingGrooveIdx, setPlayingGrooveIdx] = useState<number | null>(null);
  const [grooveCompleted, setGrooveCompleted] = useState<boolean>(false);

  const startNextExercise = (nextPool = availablePieces, currentId = targetPiece.id) => {
    setTargetPiece(pickRandomPiece(nextPool, currentId));
    setPlacedPiece(null);
    setTipTier(0);
    setFeedback({ status: 'idle', text: '' });
  };

  const handleSwitchSubTab = (tab: DrumTab) => {
    setSubTab(tab);
    setTipTier(0);
    setFeedback({ status: 'idle', text: '' });
    setPlacedPiece(null);
    if (tab === 'indovina' || tab === 'posiziona') {
      setTargetPiece(pickRandomPiece(availablePieces));
    }
    if (tab === 'prova') {
      const firstGroove = availableGrooves[0];
      setActiveGroove(firstGroove);
      setGrooveStepIndex(0);
      setGrooveCompleted(false);
    }
  };

  const handleSwitchLevel = (nextLevel: DrumLevel) => {
    setLevel(nextLevel);
    const nextPool =
      nextLevel === 'base' ? DRUM_PIECES.filter((p) => p.level === 'base') : DRUM_PIECES;
    const nextGrooves =
      nextLevel === 'base' ? DRUM_GROOVES.filter((g) => g.level === 'base') : DRUM_GROOVES;
    setTargetPiece(pickRandomPiece(nextPool));
    setActiveGroove(nextGrooves[0]);
    setGrooveStepIndex(0);
    setGrooveCompleted(false);
    setPlacedPiece(null);
    setTipTier(0);
    setFeedback({ status: 'idle', text: '' });
  };

  const handleGuessAnswer = (piece: DrumPieceDefinition) => {
    if (feedback.status === 'correct') return;
    playDrumPiece(piece.id);

    if (piece.id === targetPiece.id) {
      window.setTimeout(() => playSuccessChime(), 180);
      setFeedback({
        status: 'correct',
        text: `Bravissimo! È proprio ${targetPiece.name}!`,
        detail: `${targetPiece.positionLabel} · +10 Note d'Oro`,
      });
      onRecordAnswer({
        correct: true,
        difficulty: level === 'base' ? 'principiante' : 'esploratore',
      });
      window.setTimeout(() => startNextExercise(availablePieces, targetPiece.id), 1300);
    } else {
      playGentleError();
      setFeedback({
        status: 'wrong',
        text: `Quasi! Hai scelto ${piece.name}.`,
        detail: 'Controlla se la nota ha la pallina tonda (tamburo) o la X (piatto)!',
      });
      onRecordAnswer({
        correct: false,
        difficulty: level === 'base' ? 'principiante' : 'esploratore',
      });
    }
  };

  const handleStaffPlace = (clickedPiece: DrumPieceDefinition) => {
    if (feedback.status === 'correct') return;
    setPlacedPiece(clickedPiece);
    playDrumPiece(clickedPiece.id);

    if (clickedPiece.id === targetPiece.id) {
      window.setTimeout(() => playSuccessChime(), 180);
      setFeedback({
        status: 'correct',
        text: `Centro perfetto! Hai posizionato ${targetPiece.name}!`,
        detail: `${clickedPiece.positionLabel} · +10 Note d'Oro`,
      });
      onRecordAnswer({
        correct: true,
        difficulty: level === 'base' ? 'principiante' : 'esploratore',
      });
      window.setTimeout(() => startNextExercise(availablePieces, targetPiece.id), 1400);
    } else {
      playGentleError();
      const hint =
        clickedPiece.staffStep < targetPiece.staffStep
          ? 'Prova più in ALTO sullo spartito!'
          : 'Prova più in BASSO sullo spartito!';
      setFeedback({
        status: 'wrong',
        text: `Qui suona ${clickedPiece.name}.`,
        detail: hint,
      });
      onRecordAnswer({
        correct: false,
        difficulty: level === 'base' ? 'principiante' : 'esploratore',
      });
    }
  };

  const handleGroovePadHit = (piece: DrumPieceDefinition) => {
    playDrumPiece(piece.id);
    if (grooveCompleted) return;

    const expectedId = activeGroove.steps[grooveStepIndex];
    if (piece.id === expectedId) {
      const nextStep = grooveStepIndex + 1;
      if (nextStep >= activeGroove.steps.length) {
        setGrooveStepIndex(nextStep);
        setGrooveCompleted(true);
        onRecordAnswer({
          correct: true,
          difficulty: level === 'base' ? 'principiante' : 'esploratore',
        });
        window.setTimeout(() => playStreakFanfare(), 240);
        setFeedback({
          status: 'correct',
          text: `Groove "${activeGroove.title}" suonato alla perfezione!`,
          detail: '+10 Note d\'Oro guadagnate!',
        });
      } else {
        setGrooveStepIndex(nextStep);
        setFeedback({
          status: 'idle',
          text: `Colpo ${nextStep} di ${activeGroove.steps.length} giusto! Continua a ritmo!`,
        });
      }
    } else {
      playGentleError();
      const expectedPiece = DRUM_PIECES.find((p) => p.id === expectedId);
      setFeedback({
        status: 'wrong',
        text: `Ops! Al battito ${grooveStepIndex + 1} serve ${expectedPiece?.name}.`,
        detail: 'Guarda la nota evidenziata in blu sullo spartito e riprova!',
      });
      onRecordAnswer({
        correct: false,
        difficulty: level === 'base' ? 'principiante' : 'esploratore',
      });
    }
  };

  const staffNotes: DrumStaffNoteItem[] = useMemo(() => {
    if (subTab === 'impara') {
      return [{ piece: selectedPiece, state: 'active', showLabel: true }];
    }
    if (subTab === 'indovina') {
      return [
        {
          piece: targetPiece,
          state: feedback.status === 'correct' ? 'correct' : 'default',
          showLabel: feedback.status === 'correct',
        },
      ];
    }
    if (subTab === 'posiziona') {
      if (!placedPiece) return [];
      return [
        {
          piece: placedPiece,
          state: placedPiece.id === targetPiece.id ? 'correct' : 'wrong',
          showLabel: true,
        },
      ];
    }
    // Prova il Groove
    return activeGroove.steps.map((stepId, idx) => {
      const piece = DRUM_PIECES.find((p) => p.id === stepId) || DRUM_PIECES[0];
      let state: DrumStaffNoteItem['state'] = 'default';
      if (playingGrooveIdx === idx) state = 'active';
      else if (idx < grooveStepIndex) state = 'correct';
      else if (idx === grooveStepIndex && !grooveCompleted) state = 'active';
      return {
        piece,
        state,
        showLabel: idx < grooveStepIndex || grooveCompleted,
      };
    });
  }, [
    activeGroove.steps,
    feedback.status,
    grooveCompleted,
    grooveStepIndex,
    placedPiece,
    playingGrooveIdx,
    selectedPiece,
    subTab,
    targetPiece,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Sub-tabs & Difficulty */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div
          className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl"
          role="tablist"
          aria-label="Attività sullo spartito per batteria"
        >
          {[
            { id: 'impara' as DrumTab, label: '1. Impara & Tips' },
            { id: 'indovina' as DrumTab, label: '2. Esercizio: Indovina' },
            { id: 'posiziona' as DrumTab, label: '3. Esercizio: Posiziona' },
            { id: 'prova' as DrumTab, label: '4. Prova il Groove' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={subTab === tab.id}
              onClick={() => handleSwitchSubTab(tab.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === tab.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Livello:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleSwitchLevel('base')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                level === 'base'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Base (3 pezzi)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchLevel('avanzato')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                level === 'avanzato'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completo (6 pezzi)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Stage (8 cols) */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
          {/* Header prompt per sub-tab */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              {subTab === 'impara' && (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Mappa Interattiva dello Spartito per Batteria
                </h2>
              )}
              {subTab === 'indovina' && (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Quale pezzo della batteria suona qui?
                </h2>
              )}
              {subTab === 'posiziona' && (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Metti sullo spartito:{' '}
                  <span
                    className="underline decoration-2 underline-offset-4"
                    style={{ color: targetPiece.color }}
                  >
                    {targetPiece.name}
                  </span>
                </h2>
              )}
              {subTab === 'prova' && (
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Prova Pratica: {activeGroove.title}
                </h2>
              )}
            </div>

            {subTab === 'indovina' && (
              <button
                type="button"
                onClick={() => playDrumPiece(targetPiece.id)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Ascolta il suono</span>
              </button>
            )}

            {subTab === 'prova' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playDrumGroove(activeGroove.steps, 420, (idx) => setPlayingGrooveIdx(idx));
                    window.setTimeout(
                      () => setPlayingGrooveIdx(null),
                      activeGroove.steps.length * 440 + 150
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  <span>Ascolta il Groove</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGrooveStepIndex(0);
                    setGrooveCompleted(false);
                    setFeedback({ status: 'idle', text: '' });
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ricomincia</span>
                </button>
              </div>
            )}
          </div>

          {/* Percussion Staff */}
          <div className="bg-[#FFFDF8] border border-amber-200/75 rounded-2xl px-3 py-4 sm:px-6 sm:py-5 shadow-[inset_0_1px_4px_rgba(120,90,40,0.05)]">
            <DrumStaffSVG
              notes={staffNotes}
              highlightStep={
                subTab === 'impara'
                  ? selectedPiece.staffStep
                  : tipTier >= 2
                    ? targetPiece.staffStep
                    : null
              }
              interactivePlacement={subTab === 'impara' || subTab === 'posiziona'}
              onStepSelect={(piece) => {
                if (subTab === 'impara') {
                  setSelectedPiece(piece);
                  playDrumPiece(piece.id);
                } else if (subTab === 'posiziona') {
                  handleStaffPlace(piece);
                }
              }}
              onNoteClick={(piece) => playDrumPiece(piece.id)}
            />
            {subTab === 'posiziona' && (
              <p className="text-center text-xs text-slate-500 mt-1">
                Scegli lo spazio giusto (o sopra la 5ª riga per i piatti) e clicca sullo spartito!
              </p>
            )}
          </div>

          {/* Groove selector when in Prova tab */}
          {subTab === 'prova' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Scegli ritmo:</span>
              {availableGrooves.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setActiveGroove(g);
                    setGrooveStepIndex(0);
                    setGrooveCompleted(false);
                    setFeedback({ status: 'idle', text: '' });
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    activeGroove.id === g.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Drum Kit Pads */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-500">
              {subTab === 'impara' && 'Clicca un pad della batteria per vedere dove abita sullo spartito e ascoltarlo:'}
              {subTab === 'indovina' && 'Scegli lo strumento corrispondente alla nota sullo spartito:'}
              {subTab === 'posiziona' && 'Pad di ascolto rapido:'}
              {subTab === 'prova' &&
                `Suona i pad nell'ordine dello spartito (colpo ${Math.min(grooveStepIndex + 1, activeGroove.steps.length)} di ${activeGroove.steps.length}):`}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(subTab === 'impara' ? DRUM_PIECES : availablePieces).map((piece) => {
                const isSelected = subTab === 'impara' && selectedPiece.id === piece.id;
                return (
                  <button
                    key={piece.id}
                    type="button"
                    onClick={() => {
                      if (subTab === 'impara') {
                        setSelectedPiece(piece);
                        playDrumPiece(piece.id);
                      } else if (subTab === 'indovina') {
                        handleGuessAnswer(piece);
                      } else if (subTab === 'posiziona') {
                        playDrumPiece(piece.id);
                      } else if (subTab === 'prova') {
                        handleGroovePadHit(piece);
                      }
                    }}
                    style={{ borderBottomColor: piece.color }}
                    className={`min-h-[60px] px-3.5 py-2.5 rounded-xl border border-b-[3px] text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-[#FFFDF8] text-slate-900 border-slate-200 hover:-translate-y-0.5 active:translate-y-0 shadow-xs'
                    }`}
                  >
                    <div>
                      <p className="font-display font-bold text-sm">{piece.name}</p>
                      <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {piece.notehead === 'x' ? 'Testina a X' : 'Testina tonda'} · {piece.soundWord}
                      </p>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: piece.color }}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback banner */}
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
        </section>

        {/* Right Zone: Drum Tips & Progressive Help (4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Selected Piece or Active Exercise Tip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            {subTab === 'impara' ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Strumento selezionato</p>
                  <h3 className="text-xl font-bold mt-0.5" style={{ color: selectedPiece.color }}>
                    {selectedPiece.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    <strong>Posizione:</strong> {selectedPiece.positionLabel}
                  </p>
                </div>
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-950 leading-relaxed">
                  <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1 text-xs">
                    <Lightbulb className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    <span>Trucco per ricordarlo</span>
                  </p>
                  <p>{selectedPiece.tip}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Aiuto Batteria</p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {subTab === 'prova'
                      ? activeGroove.description
                      : 'Ricorda: i tamburi sono palline tonde, i piatti sono X!'}
                  </h3>
                </div>

                {(subTab === 'indovina' || subTab === 'posiziona') && (
                  <>
                    {tipTier >= 1 && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-950 leading-relaxed">
                        <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1 text-xs">
                          <Lightbulb className="w-4 h-4 text-amber-600" aria-hidden="true" />
                          <span>Trucco di Solino</span>
                        </p>
                        <p>{targetPiece.tip}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={tipTier === 2}
                      onClick={() => setTipTier((t) => (t < 2 ? ((t + 1) as 0 | 1 | 2) : 2))}
                      className="w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>
                        {tipTier === 0
                          ? 'Chiedi un aiuto'
                          : tipTier === 1
                            ? 'Mostrami dove guardare'
                            : 'Aiuto già mostrato'}
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* 3 Core Drum Reading Tips */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900">
              Tips per Leggere la Batteria
            </h3>
            <div className="space-y-3">
              {DRUM_TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="bg-[#FAF8F3] border border-slate-200/80 rounded-xl p-3.5 space-y-1"
                >
                  <p className="text-[11px] font-semibold text-blue-700">{tip.kicker}</p>
                  <p className="text-xs font-bold text-slate-900">{tip.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
