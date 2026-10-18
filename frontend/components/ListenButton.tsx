"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, Square, RotateCw, AlertCircle } from "lucide-react";
import { speakText } from "@/lib/api";
import { AppLanguage } from "@/lib/types";

interface ListenButtonProps {
  text: string;
  lang?: AppLanguage;
  className?: string;
  label?: string;
}

type PlayerState = "idle" | "loading" | "playing" | "error";

export function ListenButton({
  text,
  lang = "en",
  className = "",
  label = "Listen",
}: ListenButtonProps) {
  const [state, setState] = useState<PlayerState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on unmount or when text/lang changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [text, lang]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently playing, clicking stops playback
    if (state === "playing") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setState("idle");
      return;
    }

    if (state === "loading") return;

    if (!text || !text.trim()) return;

    setState("loading");

    try {
      const audioUrl = await speakText(text, lang);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setState("idle");
        audioRef.current = null;
      };

      audio.onerror = () => {
        setState("error");
        audioRef.current = null;
      };

      await audio.play();
      setState("playing");
    } catch {
      setState("error");
      audioRef.current = null;
      setTimeout(() => {
        setState("idle");
      }, 3000);
    }
  };

  const getAriaLabel = () => {
    switch (state) {
      case "loading":
        return "Generating audio speech with Sarvam Bulbul v3...";
      case "playing":
        return "Stop audio playback";
      case "error":
        return "Audio playback failed. Click to retry.";
      case "idle":
      default:
        return `${label}: Listen to text with Sarvam text-to-speech`;
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={state === "loading"}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-ink ${
        state === "playing"
          ? "bg-ink text-paper shadow-sm animate-pulse"
          : state === "error"
          ? "bg-amber-100 text-amber-800 border border-amber-300"
          : "bg-paper-100 hover:bg-paper-200 border border-paper-border text-ink"
      } ${className}`}
    >
      {state === "loading" && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
      {state === "playing" && <Square className="w-3 h-3 fill-current" />}
      {state === "error" && <AlertCircle className="w-3.5 h-3.5 text-amber-700" />}
      {state === "idle" && <Volume2 className="w-3.5 h-3.5" />}

      <span>
        {state === "loading"
          ? "Loading..."
          : state === "playing"
          ? "Stop"
          : state === "error"
          ? "Error"
          : label}
      </span>
    </button>
  );
}
