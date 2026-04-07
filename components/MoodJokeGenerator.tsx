"use client";

import { useRef, useState } from "react";
import { JokeCard } from "@/components/JokeCard";

const FALLBACK_MESSAGE =
  "I couldn't reach the joke machine just now, but your mood still deserves a soft little smile. Please try again.";

export function MoodJokeGenerator() {
  const [mood, setMood] = useState("");
  const [joke, setJoke] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedMood = mood.trim();
  const hasMood = trimmedMood.length > 0 && !isLoading;

  const handleGenerate = async () => {
    setIsLoading(true);
    setJoke("");

    try {
      const response = await fetch("/api/generate-joke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mood: trimmedMood })
      });

      const data = (await response.json()) as { joke?: string };

      if (!response.ok || !data.joke) {
        throw new Error("Unable to generate a joke right now.");
      }

      setJoke(data.joke);
    } catch {
      setJoke(FALLBACK_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDifferentMood = () => {
    setMood("");
    setJoke("");
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-[36rem] px-1 sm:px-0">
      <div className="text-center">
        <h1 className="whitespace-nowrap font-doodle text-[2.15rem] leading-none text-ink sm:text-[2.95rem]">
          How are you feeling?
        </h1>
      </div>

      <div className="mt-9 space-y-5">
        <label className="block">
          <span className="sr-only">How are you feeling?</span>
          <textarea
            ref={textareaRef}
            value={mood}
            onChange={(event) => setMood(event.target.value)}
            placeholder="tired, overwhelmed, happy..."
            className="min-h-[8.5rem] w-full rounded-[1.55rem] border border-white/60 bg-cream/82 px-6 py-5 text-[1.02rem] leading-7 text-ink shadow-soft outline-none transition duration-200 placeholder:text-ink/45 focus:border-violet/20 focus:bg-white/90 focus:ring-2 focus:ring-violet/15"
          />
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!hasMood}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ab7cf2] to-[#e481af] px-6 text-[0.97rem] font-medium tracking-[0.01em] text-white shadow-[0_14px_30px_rgba(191,132,210,0.28)] transition duration-200 hover:from-[#9f73ef] hover:to-[#de78a8] hover:shadow-[0_16px_34px_rgba(191,132,210,0.34)] disabled:cursor-not-allowed disabled:from-violet/40 disabled:to-rose/40 disabled:shadow-none"
        >
          {isLoading ? "Making you smile..." : "Make me smile"}
        </button>

        <div
          aria-live="polite"
          className={`flex items-center justify-center gap-3 text-sm text-ink/70 transition-all duration-300 ${
            isLoading ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          <span className="loading-dot" aria-hidden="true" />
          <span>Thinking of something funny...</span>
        </div>
      </div>

      <div className="mt-7 sm:mt-8">
        {joke ? (
          <div className="space-y-3 text-center">
            <JokeCard joke={joke} />
            <button
              type="button"
              onClick={handleUseDifferentMood}
              className="text-sm font-medium text-ink/65 transition hover:text-ink"
            >
              Use a different mood
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
