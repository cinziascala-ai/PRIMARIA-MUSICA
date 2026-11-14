let cachedItalianVoice: SpeechSynthesisVoice | null = null;
let voiceListenersInitialized = false;

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

function selectItalianVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const exactIt = voices.find((v) => v.lang.toLowerCase() === 'it-it');
  if (exactIt) return exactIt;

  const anyIt = voices.find((v) => v.lang.toLowerCase().startsWith('it'));
  return anyIt || null;
}

export function initVoiceEngine() {
  if (!isSpeechSupported() || voiceListenersInitialized) return;
  voiceListenersInitialized = true;
  cachedItalianVoice = selectItalianVoice();

  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedItalianVoice = selectItalianVoice();
    });
  }
}

export function stopSpeech() {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore browser speech cancel errors
  }
}

export function speakItalian(
  rawText: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    interrupt?: boolean;
  }
) {
  if (!isSpeechSupported() || !rawText.trim()) return;

  initVoiceEngine();

  const cleaned = rawText
    .replace(/·/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    if (options?.interrupt !== false) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'it-IT';
    utterance.rate = 0.96;
    utterance.pitch = 1.06;
    utterance.volume = 0.95;

    if (!cachedItalianVoice) {
      cachedItalianVoice = selectItalianVoice();
    }
    if (cachedItalianVoice) {
      utterance.voice = cachedItalianVoice;
    }

    if (options?.onStart) {
      utterance.onstart = options.onStart;
    }
    if (options?.onEnd) {
      utterance.onend = options.onEnd;
      utterance.onerror = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    options?.onEnd?.();
  }
}
