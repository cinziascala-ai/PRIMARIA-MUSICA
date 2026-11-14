import React, { useState } from 'react';
import { BookOpen, Lightbulb, Play, Volume2 } from 'lucide-react';
import { BASS_NOTES, RHYTHMS, TREBLE_NOTES } from '../data/curriculum';
import { ClefType, NoteDefinition } from '../types/music';
import { InstrumentTimbre, playBeatPattern, playInstrumentNote } from '../utils/audio';
import { RhythmCardSVG } from './RhythmCardSVG';
import { StaffSVG } from './StaffSVG';

interface TipsAndStudyViewProps {
  activeTimbre: InstrumentTimbre;
}

export const TipsAndStudyView: React.FC<TipsAndStudyViewProps> = ({ activeTimbre }) => {
  const [clef, setClef] = useState<ClefType>('treble');
  const notesPool = clef === 'treble' ? TREBLE_NOTES : BASS_NOTES;
  const [selectedNote, setSelectedNote] = useState<NoteDefinition>(TREBLE_NOTES[4]); // Sol default
  const [activeBeatRhythmId, setActiveBeatRhythmId] = useState<string | null>(null);
  const [activeBeatNum, setActiveBeatNum] = useState<number | null>(null);

  const handleClefSwitch = (nextClef: ClefType) => {
    setClef(nextClef);
    const nextPool = nextClef === 'treble' ? TREBLE_NOTES : BASS_NOTES;
    setSelectedNote(nextPool[0]);
  };

  const handleSelectNote = (note: NoteDefinition) => {
    setSelectedNote(note);
    playInstrumentNote(note.frequency, activeTimbre, 0.65);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Interactive Staff Explorer */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Esplora lo Spartito e Ascolta le Note
            </h2>
            <p className="text-sm text-slate-600">
              Clicca su una nota qui sotto o direttamente sul pentagramma per sentirne il suono e scoprire il trucco per ricordarla!
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleClefSwitch('treble')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                clef === 'treble'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chiave di Violino (Sol)
            </button>
            <button
              type="button"
              onClick={() => handleClefSwitch('bass')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                clef === 'bass'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chiave di Basso (Fa)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 bg-[#FAF9F6] border border-slate-200 rounded-2xl p-4 sm:p-5">
            <StaffSVG
              clef={clef}
              notes={[{ note: selectedNote, state: 'active', showLabel: true }]}
              highlightStep={selectedNote.staffStep}
              showLineNumbers={true}
              showColorHints={true}
              interactivePlacement={true}
              onStepSelect={handleSelectNote}
            />
          </div>

          {/* Note Detail Card */}
          <div className="lg:col-span-5 bg-[#FAF9F6] border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Nota selezionata</p>
                <h3
                  className="text-3xl font-bold"
                  style={{ color: selectedNote.color }}
                >
                  {selectedNote.name} ({selectedNote.englishName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => playInstrumentNote(selectedNote.frequency, activeTimbre, 0.7)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                <span>Suona</span>
              </button>
            </div>

            <div className="text-sm text-slate-700 space-y-2">
              <p>
                <strong className="text-slate-900">Dove abita:</strong> {selectedNote.positionLabel}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-950">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>Trucco di memoria</span>
                </p>
                <p className="text-sm leading-relaxed">{selectedNote.mnemonicTip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clickable Note Strip */}
        <div className="flex flex-wrap gap-2">
          {notesPool.map((n) => {
            const isSelected = n.id === selectedNote.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelectNote(n)}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: n.color }}
                  aria-hidden="true"
                />
                <span>{n.name}</span>
                <span className={`text-xs font-normal ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {n.octave}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Tips & Tricks — Memory Aids for 3rd Graders */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <span>Trucchi e Segreti della Maestra (Tips &amp; Tricks)</span>
          </h2>
          <p className="text-sm text-slate-600">
            Impara queste filastrocche semplici per leggere lo spartito alla velocità della luce!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Treble Clef Lines */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-blue-700">Chiave di Violino · Le 5 Righe</p>
            <h3 className="text-lg font-bold text-slate-900">
              Filastrocca delle Righe: MI - SOL - SI - RE - FA
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Contando sempre <strong>dal basso verso l&apos;alto</strong> (come i piani di un ascensore!), le note infilate sulle cinque righe formano la frase:
            </p>
            <p className="text-base font-display font-bold text-slate-900 bg-[#FAF9F6] border border-slate-200 rounded-xl px-4 py-3">
              &ldquo;<span className="text-blue-700">MI</span> <span className="text-blue-700">SOL</span>o <span className="text-blue-700">SI</span>amo <span className="text-blue-700">RE</span> e <span className="text-blue-700">FA</span>te!&rdquo;
            </p>
            <p className="text-xs text-slate-500">
              Trucco extra: la 2ª riga è SOL, proprio dove nasce il ricciolo della Chiave di Violino!
            </p>
          </article>

          {/* Treble Clef Spaces */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-amber-700">Chiave di Violino · I 4 Spazi</p>
            <h3 className="text-lg font-bold text-slate-900">
              La Parola Magica degli Spazi: FA - LA - DO - MI
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Tra una riga e l&apos;altra ci sono 4 comodi spazi. Anche qui si sale <strong>dal basso verso l&apos;alto</strong>:
            </p>
            <p className="text-base font-display font-bold text-slate-900 bg-[#FAF9F6] border border-slate-200 rounded-xl px-4 py-3">
              &ldquo;<span className="text-amber-700">FA</span>mmi <span className="text-amber-700">LA</span> <span className="text-amber-700">DO</span>lce <span className="text-amber-700">MI</span>a!&rdquo; (FA · LA · DO · MI)
            </p>
            <p className="text-xs text-slate-500">
              Se la nota tocca due righe sopra e sotto senza essere tagliata, è dentro uno spazio!
            </p>
          </article>

          {/* Do and Re below staff */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-emerald-700">Le Note Speciali sotto casa</p>
            <h3 className="text-lg font-bold text-slate-900">
              Il Do col &ldquo;Baffetto&rdquo; e il Re appoggiato
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Il <strong>Do basso</strong> ama stare al piano terra, fuori dal pentagramma, con una piccola riga tutta per sé che sembra un baffetto. Subito sopra, appoggiato sotto la 1ª riga, c&apos;è il suo vicino <strong>Re</strong>!
            </p>
          </article>

          {/* Bass Clef Bonus Tip */}
          <article className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-indigo-700">Per gli Esploratori · Chiave di Basso</p>
            <h3 className="text-lg font-bold text-slate-900">
              I Due Puntini della Chiave di Fa
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Nella mano sinistra del pianoforte si usa la Chiave di Basso. I suoi due puntini abbracciano la <strong>4ª riga</strong>, che si chiama <strong>FA</strong>! Le righe dal basso sono <strong>SOL - SI - RE - FA - LA</strong> e gli spazi <strong>LA - DO - MI - SOL</strong>.
            </p>
          </article>
        </div>
      </section>

      {/* Section 3: Note Values & Rhythm Guide */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Come Riconoscere i Valori Musicali (Durata e Ritmo)
          </h2>
          <p className="text-sm text-slate-600">
            Premi &ldquo;Ascolta battiti&rdquo; e batti le mani insieme al suono per imparare quanto dura ogni figura!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {RHYTHMS.map((rhythm) => {
            const isPlaying = activeBeatRhythmId === rhythm.id;
            const dotCount = rhythm.beats < 1 ? 2 : Math.round(rhythm.beats);

            return (
              <div
                key={rhythm.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="w-full h-24 rounded-xl bg-[#FAF9F6] border border-slate-100 flex items-center justify-center">
                    <RhythmCardSVG rhythmId={rhythm.id} size={76} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{rhythm.name}</h3>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">
                      {rhythm.beatsLabel} · &ldquo;{rhythm.syllable}&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rhythm.tip}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: dotCount }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center font-mono-nums transition-transform ${
                          isPlaying && activeBeatNum === idx
                            ? 'bg-blue-600 text-white scale-110'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveBeatRhythmId(rhythm.id);
                      playBeatPattern(
                        rhythm.beats,
                        rhythm.id === 'pausa_semiminima',
                        (b) => setActiveBeatNum(b)
                      );
                      window.setTimeout(() => {
                        setActiveBeatRhythmId(null);
                        setActiveBeatNum(null);
                      }, 2200);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                    <span>Ascolta battiti</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
