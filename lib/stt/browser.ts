"use client";

interface SpeechRecognitionAPI extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface BrowserSttHandle {
  stop: () => void;
}

export function isSttSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function startBrowserStt(opts: {
  lang?: string;
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
}): BrowserSttHandle | null {
  if (!isSttSupported()) {
    opts.onError?.("Speech recognition not supported in this browser");
    return null;
  }
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionAPI }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionAPI }).webkitSpeechRecognition;
  if (!Ctor) {
    opts.onError?.("Speech recognition unavailable");
    return null;
  }
  const recognition = new Ctor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = opts.lang || "en-US";
  let finalTranscript = "";
  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0]?.transcript ?? "";
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interim += transcript;
      }
    }
    opts.onPartial?.(finalTranscript + interim);
  };
  recognition.onerror = (event) => {
    opts.onError?.((event as unknown as { error?: string }).error ?? "STT error");
  };
  recognition.onend = () => {
    if (finalTranscript) opts.onFinal(finalTranscript);
  };
  recognition.start();
  return {
    stop: () => recognition.stop(),
  };
}
