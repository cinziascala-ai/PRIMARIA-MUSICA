import React from 'react';
import { Award, Check, Lock, Music, Play, Sparkles, Star, Trophy } from 'lucide-react';
import { InstrumentIconSVG } from './InstrumentIconSVG';
import {
  ACHIEVEMENT_BADGES,
  INSTRUMENTS_REWARDS,
  getLevelInfo,
} from '../data/curriculum';
import { InstrumentReward, PlayerStats } from '../types/music';
import { InstrumentTimbre, playInstrumentNote, playMelodySequence, playStreakFanfare } from '../utils/audio';

interface RewardsAndOrchestraViewProps {
  stats: PlayerStats;
  activeTimbre: InstrumentTimbre;
  onSelectTimbre: (timbre: InstrumentTimbre) => void;
  onUnlockInstrument: (instrument: InstrumentReward) => void;
}

export const RewardsAndOrchestraView: React.FC<RewardsAndOrchestraViewProps> = ({
  stats,
  activeTimbre,
  onSelectTimbre,
  onUnlockInstrument,
}) => {
  const { current, next } = getLevelInfo(stats.stars);

  const levelProgressPct = next
    ? Math.min(
        100,
        Math.round(((stats.stars - current.minStars) / (next.minStars - current.minStars)) * 100)
      )
    : 100;

  return (
    <div className="space-y-8">
      {/* Top Progress & Level Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-700">Il Tuo Percorso Musicale</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{current.name}</h2>
            <p className="text-sm text-slate-600">
              Guadagni <strong>Note d&apos;Oro</strong> e <strong>Stelle</strong> ogni volta che leggi una nota o un ritmo correttamente. Usa le Note d&apos;Oro per sbloccare e suonare gli strumenti dell&apos;orchestra!
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#FAF9F6] border border-slate-200 rounded-2xl px-5 py-4">
            <div>
              <p className="text-xs text-slate-500">Note d&apos;Oro</p>
              <p className="text-2xl font-bold text-amber-700 font-mono-nums flex items-center gap-1.5">
                <Music className="w-5 h-5 text-amber-600" aria-hidden="true" />
                <span>{stats.goldenNotes}</span>
              </p>
            </div>
            <div className="w-px h-9 bg-slate-200" aria-hidden="true" />
            <div>
              <p className="text-xs text-slate-500">Stelle Totali</p>
              <p className="text-2xl font-bold text-blue-700 font-mono-nums flex items-center gap-1.5">
                <Star className="w-5 h-5 text-blue-600" aria-hidden="true" />
                <span>{stats.stars}</span>
              </p>
            </div>
            <div className="w-px h-9 bg-slate-200" aria-hidden="true" />
            <div>
              <p className="text-xs text-slate-500">Miglior Serie</p>
              <p className="text-2xl font-bold text-slate-900 font-mono-nums">
                {stats.bestStreak}
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Livello attuale: {current.name}</span>
            {next ? (
              <span className="font-mono-nums">
                Prossimo livello ({next.name}): {stats.stars} / {next.minStars} stelle
              </span>
            ) : (
              <span>Hai raggiunto il livello massimo!</span>
            )}
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Virtual Playable Orchestra */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" aria-hidden="true" />
              <span>La Mia Orchestra Virtuale</span>
            </h2>
            <p className="text-sm text-slate-600">
              Sblocca gli strumenti con le tue Note d&apos;Oro: puoi suonarli dal vivo e scegliere quale suono usare durante gli esercizi!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {INSTRUMENTS_REWARDS.map((inst) => {
            const isUnlocked = stats.unlockedInstruments.includes(inst.id);
            const isSelected = activeTimbre === inst.timbre;
            const canAfford = stats.goldenNotes >= inst.costNotes;

            return (
              <article
                key={inst.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                  isSelected ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        {isUnlocked ? 'Strumento sbloccato' : `Costo: ${inst.costNotes} Note d'Oro`}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">{inst.name}</h3>
                    </div>
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: isUnlocked ? inst.badgeColor : '#94A3B8' }}
                      aria-hidden="true"
                    >
                      {isUnlocked ? (
                        <InstrumentIconSVG timbre={inst.timbre} className="w-6 h-6" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">{inst.description}</p>
                </div>

                {isUnlocked ? (
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    {/* Interactive Mini Keys to actually play the reward */}
                    <div className="flex items-center gap-1.5">
                      {inst.sampleFrequencies.map((freq, idx) => (
                        <button
                          key={`${inst.id}-note-${idx}`}
                          type="button"
                          onClick={() => playInstrumentNote(freq, inst.timbre, 0.5)}
                          className="flex-1 min-h-[38px] rounded-lg border border-slate-200 bg-[#FAF9F6] hover:bg-slate-100 text-xs font-bold text-slate-700 font-mono-nums transition-transform active:scale-95 cursor-pointer"
                          title={`Suona nota ${idx + 1} con ${inst.name}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playMelodySequence(inst.sampleFrequencies, inst.timbre, 230)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                        <span>Melodia</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTimbre(inst.timbre);
                          playInstrumentNote(inst.sampleFrequencies[0], inst.timbre, 0.45);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span>{isSelected ? 'In uso negli esercizi' : 'Usa negli esercizi'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        onUnlockInstrument(inst);
                        playStreakFanfare();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Music className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {canAfford
                          ? `Sblocca per ${inst.costNotes} Note d'Oro`
                          : `Mancano ${inst.costNotes - stats.goldenNotes} Note d'Oro`}
                      </span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Achievement Badges */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-600" aria-hidden="true" />
            <span>Bacheca dei Distintivi</span>
          </h2>
          <p className="text-sm text-slate-600">
            Raggiungi questi obiettivi speciali giocando alle sfide e salendo di difficoltà.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENT_BADGES.map((badge) => {
            const unlocked = badge.checkUnlocked(stats);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-5 space-y-2.5 ${
                  unlocked
                    ? 'bg-white border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      unlocked ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {unlocked ? 'Sbloccato' : badge.requirementText}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{badge.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
