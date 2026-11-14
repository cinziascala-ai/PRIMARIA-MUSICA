import React, { useState } from 'react';
import { BookHeart, CheckCircle2, RotateCcw, Users } from 'lucide-react';
import { ITALIAN_NOTE_ORDER, NOTE_COLORS } from '../data/curriculum';
import { PlayerStats, StudyMode } from '../types/music';

interface ParentsCornerViewProps {
  stats: PlayerStats;
  studyMode: StudyMode;
  onSetStudyMode: (mode: StudyMode) => void;
  onResetProgress: () => void;
}

export const ParentsCornerView: React.FC<ParentsCornerViewProps> = ({
  stats,
  studyMode,
  onSetStudyMode,
  onResetProgress,
}) => {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const accuracyPct =
    stats.totalAttempts > 0
      ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Warm Teacher Letter to Parents */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <BookHeart className="w-4 h-4" aria-hidden="true" />
            <span>Dalla Maestra di Musica · Classe Terza</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Come esercitarsi insieme in 10 minuti al giorno
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            In terza elementare la lettura dello spartito è come imparare a leggere le prime parole: serve serenità, ascolto e piccoli trucchetti visivi. Non serve avere fretta!
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>1. Parti sempre dalle domande guida:</strong> prima che il bambino clicchi, chiedigli &ldquo;È su una riga o in uno spazio?&rdquo;.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>2. Attiva la modalità &ldquo;Con un Genitore&rdquo;:</strong> Solino mostrerà un riquadro azzurro con il suggerimento esatto da fare ad alta voce senza svelare la soluzione.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>3. Batti il ritmo con le mani:</strong> nel Treno del Ritmo, ascoltate insieme i battiti e provate a ripeterli sul tavolo.
              </span>
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSetStudyMode(studyMode === 'genitore' ? 'solo' : 'genitore')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                studyMode === 'genitore'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>
                {studyMode === 'genitore'
                  ? 'Modalità "Con un Genitore" Attiva'
                  : 'Attiva Modalità "Con un Genitore"'}
              </span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-[#FAF9F6]">
            <img
              src="/src/assets/images/hero_music_classroom_1794670445135.jpg"
              alt="Banco di musica di scuola primaria con xilofono, flauto e quaderno pentagrammato"
              referrerPolicy="no-referrer"
              className="w-full h-56 sm:h-64 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Per-Note Progress Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Andamento per Ogni Nota Musicale
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Precisione complessiva: <strong className="font-mono-nums text-slate-900">{accuracyPct}%</strong> ({stats.totalCorrect} risposte giuste su {stats.totalAttempts} tentativi · {stats.roundsCompleted} sfide completate).
            </p>
          </div>

          {/* Inline 2-step reset */}
          {!confirmingReset ? (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Azzera progressi</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-rose-700">Confermi di ripartire da zero?</span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmingReset(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Sì, azzera
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {ITALIAN_NOTE_ORDER.map((noteName) => {
            const data = stats.noteStats[noteName] || { attempts: 0, correct: 0 };
            const pct = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : null;
            const statusText =
              pct === null
                ? 'Non ancora provata'
                : pct >= 80
                  ? 'Ottima!'
                  : pct >= 55
                    ? 'Buona'
                    : 'Da ripassare';

            return (
              <div
                key={noteName}
                className="rounded-xl border border-slate-200 bg-[#FAF9F6] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-display font-bold text-lg"
                    style={{ color: NOTE_COLORS[noteName] }}
                  >
                    {noteName}
                  </span>
                  <span className="font-mono-nums text-sm font-bold text-slate-900">
                    {pct !== null ? `${pct}%` : '—'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono-nums">
                  {data.correct} / {data.attempts} esatte
                </p>
                <p
                  className={`text-xs font-semibold ${
                    pct === null
                      ? 'text-slate-400'
                      : pct >= 80
                        ? 'text-emerald-700'
                        : pct >= 55
                          ? 'text-amber-700'
                          : 'text-rose-700'
                  }`}
                >
                  {statusText}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
