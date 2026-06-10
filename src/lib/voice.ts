// src/lib/voice.ts
// VOICE-FIRST - Kokoro TTS (Self-hosted, Kostenlos)
// Für: Sprachausgabe, Barrierefreiheit, ältere Nutzer

export interface TTSOptions {
  text: string;
  lang?: 'de' | 'en' | 'ar' | 'tr';
  speed?: number;
  pitch?: number;
}

// ============================================
// TYPE DEFINITIONS FÜR WEB SPEECH API (Ersetzt 'any')
// ============================================
export interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
}

export interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

// ============================================
// KOKORO TTS - Open Source, Local
// ============================================
export async function speakWithKokoro({
  text,
  lang = 'de',
  speed = 1.0,
}: TTSOptions): Promise<void> {
  // Prüfe ob Browser-API verfügbar
  if (typeof window === 'undefined') return;

  // Web Speech API als Fallback (kostenlos, Browser-integriert)
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'tr-TR';
    utterance.rate = speed;

    window.speechSynthesis.speak(utterance);
    return;
  }

  // Fallback: Audio-Element mit Kokoro (wenn vorhanden)
  console.warn('Web Speech API nicht verfügbar');
}

// ============================================
// STT - Speech to Text (Whisper.cpp Alternative)
// ============================================
export async function startSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  // LÖSUNG ERROR: Typsicherer Zugriff auf Window dank 'declare global' oben
  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) {
    onError?.(new Error('Speech Recognition nicht unterstützt'));
    return;
  }

  const recognition = new SpeechRecognitionConstructor();
  recognition.lang = 'de-DE';
  recognition.continuous = true;
  recognition.interimResults = false;

  // LÖSUNG ERROR: Typsichere Parameter statt 'any'
  recognition.onresult = (event: ISpeechRecognitionEvent) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
    onError?.(new Error(`Speech Recognition Error: ${event.error}`));
  };

  recognition.start();
}

// ============================================
// VOICE-COMMANDS (Franks Befehle)
// ============================================
export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    command: 'zeig mir das portal',
    action: () => window.open('http://localhost:3000', '_blank'),
    description: 'Portal im Browser öffnen',
  },
  {
    command: 'öffne den rechner',
    action: () => (window.location.href = '/pflegegrad/start'),
    description: 'Pflegegrad-Rechner öffnen',
  },
  {
    command: 'lies mir das vor',
    action: () => {
      const mainContent = document.querySelector('main')?.textContent || '';
      speakWithKokoro({ text: mainContent });
    },
    description: 'Aktuelle Seite vorlesen',
  },
  {
    command: 'zum inhalt springen',
    action: () => {
      document.getElementById('main-content')?.focus();
    },
    description: 'Zum Hauptinhalt springen',
  },
  {
    command: 'mach einen screenshot',
    action: () => {
      // Wird über OpenClaw Node ausgeführt
      console.log('Screenshot angefordert');
    },
    description: 'Screenshot erstellen',
  },
];

export function processVoiceCommand(transcript: string): boolean {
  const lowerTranscript = transcript.toLowerCase().trim();

  for (const cmd of VOICE_COMMANDS) {
    if (lowerTranscript.includes(cmd.command)) {
      cmd.action();
      return true;
    }
  }

  return false;
}

// ============================================
// REACT HOOK: Voice-First Integration
// ============================================
// LÖSUNG WARNING: 'useEffect' entfernt, da er nicht genutzt wurde
import { useState, useCallback } from 'react';

export function useVoiceFirst() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState('');

  const speak = useCallback(async (text: string, lang?: 'de' | 'en' | 'ar' | 'tr') => {
    setIsSpeaking(true);
    await speakWithKokoro({ text, lang });
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    setIsListening(true);

    startSpeechRecognition(
      (text) => {
        setLastCommand(text);
        const executed = processVoiceCommand(text);

        if (!executed) {
          speak(
            'Befehl nicht erkannt. Verfügbare Befehle: ' +
              VOICE_COMMANDS.map((c) => c.command).join(', ')
          );
        }
      },
      (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
      }
    );
  }, [speak]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    lastCommand,
    speak,
    startListening,
    stopListening,
    commands: VOICE_COMMANDS,
  };
}
