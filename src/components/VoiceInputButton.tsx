'use client';

import { useEffect, useRef, useState } from 'react';

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    [i: number]: {
      [j: number]: { transcript: string };
      isFinal: boolean;
    };
    length: number;
  };
};

type SpeechRecognitionInstance = {
  start(): void;
  stop(): void;
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInputButton({
  onTranscript,
  onInterim,
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        onInterim?.(interim);
      }

      if (final) {
        onTranscript(final.trim());
        setInterimText('');
      }
    };

    recognition.onerror = (event: { error: string }) => {
      if (event.error === 'not-allowed') {
        setHasPermission(false);
        setError('Mic access blocked');
      } else if (event.error === 'no-speech') {
        setError(null);
        setIsListening(false);
      } else {
        setError(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onInterim]);

  const toggleListening = () => {
    if (!recognitionRef.current || !isSupported) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      setError(null);
      setHasPermission(true);
      setInterimText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const buttonTitle = !isSupported
    ? 'Voice input requires Chrome, Safari, or Edge'
    : !hasPermission
      ? 'Mic access blocked'
      : isListening
        ? 'Listening... Click to stop'
        : 'Click to dictate your concept';

  return (
    <div className="voice-input-wrapper" title={buttonTitle}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled || !isSupported || !hasPermission}
        className={`voice-input-btn ${isListening ? 'listening' : ''} ${className}`}
        aria-label={buttonTitle}
        aria-pressed={isListening}
      >
        {isListening && <span className="voice-input-pulse" aria-hidden />}
        <svg
          className="voice-input-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {isListening && (
        <div className="voice-input-label" aria-live="polite">
          <span className="voice-input-label-dot" aria-hidden />
          Listening…
          {interimText && (
            <span className="voice-input-interim">
              {' '}
              <em>{interimText}</em>
            </span>
          )}
        </div>
      )}

      {error && !isListening && (
        <div className="voice-input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
