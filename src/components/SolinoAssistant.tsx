import React, { useState } from 'react';
import { Lightbulb, Sparkles, Speech, Users, Volume2 } from 'lucide-react';
import { StudyMode } from '../types/music';
import { isSpeechSupported, speakItalian, stopSpeech } from '../utils/voice';

interface SolinoAssistantProps {
  mood: 'happy' | 'thinking';
  message: string;
  tipText?: string;
  parentTipText?: string;
  tipTier: 0 | 1 | 2;
  onRequestTip: () => void;
  canShowVisualHint?: boolean;
  studyMode: StudyMode;
  voiceGuideEnabled: boolean;
  onToggleVoiceGuide: () => void;
}

export const SolinoAssistant: React.FC<SolinoAssistantProps> = ({
  mood,
  message,
  tipText,
  parentTipText,
  tipTier,
  onRequestTip,
  canShowVisualHint = true,
  studyMode,
  voiceGuideEnabled,
  onToggleVoiceGuide,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const speechAvailable = isSpeechSupported();

  const imageSrc =
    mood === 'happy'
      ? '/src/assets/images/mascot_fox_happy_1794671092500.jpg'
      : '/src/assets/images/mascot_fox_thinking_1794671091942.jpg';

  const handleReadAloud = () => {
    if (!speechAvailable) return;
    if (isSpeakingNow) {
      stopSpeech();
      setIsSpeakingNow(false);
      return;
    }
    const textToRead =
      tipTier >= 1 && tipText ? `${message} Ecco il trucco: ${tipText}` : message;
    speakItalian(textToRead, {
      onStart: () => setIsSpeakingNow(true),
      onEnd: () => setIsSpeakingNow(false),
    });
  };

  return (
    <aside
      className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col gap-4 shadow-xs"
      aria-label="Solino, il tuo assistente musicale"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-[#FAF8F3] border border-amber-200/70 shrink-0 flex items-center justify-center shadow-xs">
          {!imgFailed ? (
            <img
              src={imageSrc}
              alt="Solino il volpino maestro di musica"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Sparkles className="w-8 h-8 text-amber-500" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-slate-900 truncate">Maestro Solino</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">Guida</span>
            </div>

            {speechAvailable && (
              <button
                type="button"
                onClick={handleReadAloud}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                title="Ascolta Solino leggere questo messaggio"
              >
                <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isSpeakingNow ? 'Ferma' : 'Ascolta'}</span>
              </button>
            )}
          </div>

          <div className="bg-[#FAF8F3] border border-slate-200/80 rounded-xl px-3.5 py-2.5">
            <p className="text-[14.5px] leading-relaxed text-slate-800 font-medium">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Guide Opt-in Switch inside Solino's Card */}
      {speechAvailable ? (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <Speech
              className={`w-4 h-4 shrink-0 ${voiceGuideEnabled ? 'text-blue-600' : 'text-slate-400'}`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-slate-700 truncate">
              Guida vocale automatica
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={voiceGuideEnabled}
            onClick={onToggleVoiceGuide}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              voiceGuideEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {voiceGuideEnabled ? 'Attiva' : 'Spenta'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          La guida vocale non è disponibile su questo browser.
        </p>
      )}

      {/* Progressive Tip Reveal */}
      {tipTier >= 1 && tipText && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>Trucco di Solino</span>
          </div>
          <p>{tipText}</p>
        </div>
      )}

      {/* Parent guidance when studying together */}
      {studyMode === 'genitore' && parentTipText && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-sm text-blue-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900 mb-1">
            <Users className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
            <span>Suggerimento per il Genitore</span>
          </div>
          <p>{parentTipText}</p>
        </div>
      )}

      {tipText && (
        <button
          type="button"
          onClick={onRequestTip}
          disabled={tipTier === 2 || (tipTier === 1 && !canShowVisualHint)}
          className="w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">
            {tipTier === 0
              ? 'Chiedi un aiuto a Solino'
              : tipTier === 1 && canShowVisualHint
                ? 'Mostrami dove guardare sul pentagramma'
                : 'Aiuto già mostrato'}
          </span>
        </button>
      )}
    </aside>
  );
};
