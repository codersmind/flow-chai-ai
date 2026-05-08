"use client";

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!isTtsSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function speak(text: string, opts: { voice?: string; rate?: number; pitch?: number } = {}) {
  if (!isTtsSupported()) return;
  const utter = new SpeechSynthesisUtterance(text);
  if (opts.voice) {
    const match = listVoices().find((v) => v.name === opts.voice);
    if (match) utter.voice = match;
  }
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech() {
  if (!isTtsSupported()) return;
  window.speechSynthesis.cancel();
}
