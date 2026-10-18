"use client";

import React, { useState, useRef, useEffect } from "react";
import { DocumentPage, AnswerItem, AppLanguage } from "@/lib/types";
import { ask, translateTexts, transcribeAudio } from "@/lib/api";
import { convertBlobTo16kHzMonoWav } from "@/lib/audio";
import { ListenButton } from "./ListenButton";
import {
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  Mic,
  Square,
  RotateCw,
  Languages,
} from "lucide-react";

interface AskTabProps {
  pages: DocumentPage[];
  onSelectQuote: (quote: string, page?: number) => void;
  activeQuote?: string;
  lang?: AppLanguage;
  sarvamEnabled?: boolean;
}

const MAX_QUESTION_CHARS = 500;

// Generic preset questions for uploads (Task 11 requirement: deposit, notice period, rent, maintenance, pet, sublet without cited/refusal tags)
const UPLOAD_PRESET_QUESTIONS = [
  { label: "Security Deposit", question: "What is the security deposit amount and refund terms?" },
  { label: "Notice Period", question: "What is the required notice period to terminate the agreement?" },
  { label: "Monthly Rent", question: "What is the monthly rent and due date?" },
  { label: "Maintenance", question: "What are the society maintenance and utility charges?" },
  { label: "Can I keep a pet?", question: "Can I keep a pet in the premises?" },
  { label: "Can I sublet?", question: "Can I sublet or share the apartment with others?" },
];

export function AskTab({
  pages,
  onSelectQuote,
  activeQuote,
  lang = "en",
  sarvamEnabled = true,
}: AskTabProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerItem | null>(null);
  const [translatedAnswerText, setTranslatedAnswerText] = useState("");
  const [isTranslatingAnswer, setIsTranslatingAnswer] = useState(false);
  const [answerTranslationError, setAnswerTranslationError] = useState<string | null>(null);
  const [askedQuestion, setAskedQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Audio recording state for Sarvam STT
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Translate answer when language changes or new answer arrives
  useEffect(() => {
    let active = true;

    if (!currentAnswer) {
      setTranslatedAnswerText("");
      setAnswerTranslationError(null);
      return;
    }

    if (lang === "en") {
      setTranslatedAnswerText(currentAnswer.text);
      setAnswerTranslationError(null);
      return;
    }

    setIsTranslatingAnswer(true);
    setAnswerTranslationError(null);
    translateTexts([currentAnswer.text], lang)
      .then(([trans]) => {
        if (!active) return;
        setTranslatedAnswerText(trans || currentAnswer.text);
        setAnswerTranslationError(null);
      })
      .catch(() => {
        if (!active) return;
        setTranslatedAnswerText(currentAnswer.text);
        setAnswerTranslationError("Translation is unavailable right now. Showing original English answer.");
      })
      .finally(() => {
        if (active) setIsTranslatingAnswer(false);
      });

    return () => {
      active = false;
    };
  }, [currentAnswer, lang]);

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk !== undefined ? queryToAsk : question).trim();
    if (!q || isLoading || q.length > MAX_QUESTION_CHARS) return;

    setIsLoading(true);
    setError(null);
    setAskedQuestion(q);

    try {
      const fullText = pages.map((p) => p.text).join("\n\n");
      const response = await ask(q, fullText);
      setCurrentAnswer(response);
      if (response.quotes && response.quotes.length > 0) {
        onSelectQuote(response.quotes[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to answer question";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (presetQ: string) => {
    setQuestion(presetQ);
    handleAsk(presetQ);
  };

  // Start audio recording with MediaRecorder (max 30s)
  const startRecording = async () => {
    setMicNotice(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicNotice("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Stop all tracks to release hardware mic
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) {
          setIsRecording(false);
          return;
        }

        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const wavBlob = await convertBlobTo16kHzMonoWav(audioBlob);
          const filename = wavBlob.type === "audio/wav" ? "user_question.wav" : "user_question.webm";
          const result = await transcribeAudio(wavBlob, filename);
          if (result.text && result.text.trim()) {
            setQuestion(result.text.trim());
            setMicNotice(null);
          } else {
            setMicNotice("Could not detect any speech in the recording. Please try typing your question.");
          }
        } catch {
          setMicNotice("Voice transcription is unavailable right now. Please check backend connectivity or type your question.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      // 30-second visible timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const errorObj = err as { name?: string };
      if (errorObj?.name === "NotAllowedError" || errorObj?.name === "PermissionDeniedError") {
        setMicNotice("Microphone access was denied. Please allow microphone permissions in your browser to speak your question.");
      } else if (errorObj?.name === "NotFoundError" || errorObj?.name === "DevicesNotFoundError") {
        setMicNotice("No microphone found on your device. Please plug in a microphone or type your question.");
      } else {
        setMicNotice("Could not access microphone. Please check your browser device permissions.");
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const charsRemaining = MAX_QUESTION_CHARS - question.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="space-y-6">
      {/* Preset chips row */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-ink" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink font-mono">
            Common questions:
          </span>
          <span className="text-[11px] text-ink-muted">
            (Click any question to ask your agreement)
          </span>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Preset questions">
          {UPLOAD_PRESET_QUESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(item.question)}
              disabled={isLoading || isRecording}
              className="text-xs px-3 py-1.5 rounded-xl border border-paper-border bg-paper-100 hover:bg-paper-200 text-ink font-medium transition-all text-left focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice recording live status banner */}
      {isRecording && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs text-ink font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="font-semibold text-red-700">
              Recording... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-ink-muted">
              (max 30s)
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ink text-paper text-xs font-semibold hover:bg-ink-deep transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Done Speaking</span>
          </button>
        </div>
      )}

      {/* Voice transcribing banner */}
      {isTranscribing && (
        <div className="p-3 rounded-xl bg-paper-200 border border-paper-border flex items-center gap-2.5 text-xs text-ink font-mono">
          <RotateCw className="w-4 h-4 animate-spin text-ink" />
          <span>Transcribing...</span>
        </div>
      )}

      {/* Microphone status or permission denial warning */}
      {micNotice && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-ink flex items-start justify-between gap-2"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{micNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setMicNotice(null)}
            className="text-[11px] font-mono text-ink-muted hover:text-ink flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Free-text Question Form (Max 500 chars) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="space-y-2"
      >
        <div className="relative">
          <label htmlFor="agreement-question-input" className="sr-only">
            Ask a question about this agreement
          </label>
          <input
            id="agreement-question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about deposit return, notice, pets, painting, repairs..."
            maxLength={MAX_QUESTION_CHARS + 20}
            disabled={isRecording || isTranscribing}
            aria-describedby="question-helper-text"
            className={`w-full px-4 py-3 pr-32 rounded-xl border bg-paper-50 text-ink placeholder:text-ink-muted/60 text-sm focus:outline-none focus:ring-2 focus:border-transparent shadow-sm ${
              isOverLimit
                ? "border-amber-600 focus:ring-amber-600"
                : "border-paper-border focus:ring-ink"
            }`}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Sarvam Voice Input Microphone Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!sarvamEnabled || isLoading || isTranscribing}
              aria-label={
                !sarvamEnabled
                  ? "Voice question input is disabled"
                  : isRecording
                  ? "Stop voice recording"
                  : "Ask question using voice microphone"
              }
              title={
                !sarvamEnabled
                  ? "Voice question input is disabled. Set SARVAM_API_KEY in backend to enable."
                  : isRecording
                  ? "Stop recording"
                  : "Speak your question (Sarvam Saaras STT)"
              }
              className={`p-1.5 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-ink ${
                !sarvamEnabled
                  ? "bg-paper-100 text-ink-muted/40 border-paper-border cursor-not-allowed opacity-60"
                  : isRecording
                  ? "bg-red-600 text-white border-red-700 animate-pulse"
                  : "bg-paper-100 hover:bg-paper-200 border-paper-border text-ink"
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!question.trim() || isOverLimit || isLoading || isRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-paper text-xs font-medium hover:bg-ink-deep disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:ring-2 focus-visible:ring-ink"
            >
              {isLoading ? (
                <span className="animate-spin text-xs">●</span>
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Character Counter */}
        <div
          id="question-helper-text"
          className="flex items-center justify-between px-1 text-[11px] font-mono"
        >
          <span className="text-ink-muted">
            Ask any question. Review transcribed voice before pressing Ask.
          </span>
          <span
            className={
              isOverLimit
                ? "text-amber-700 font-semibold"
                : "text-ink-muted"
            }
          >
            {question.length}/{MAX_QUESTION_CHARS}
          </span>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-xl bg-paper-200 border border-paper-border text-xs text-ink flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-ink flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Output Thread Item */}
      {currentAnswer && (
        <div className="p-5 rounded-2xl bg-paper-50 border border-paper-border shadow-paper space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-border pb-3">
            <span className="text-[11px] font-mono text-ink-muted">
              Question: &ldquo;{askedQuestion}&rdquo;
            </span>

            <div className="flex items-center gap-2">
              {/* Listen button for answer text */}
              <ListenButton
                text={translatedAnswerText || currentAnswer.text}
                lang={lang}
                label="Listen"
                sarvamEnabled={sarvamEnabled}
              />

              {/* Status Pill: Real status on answered thread item */}
              {currentAnswer.status === "answered" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink bg-highlighter-solid px-2.5 py-0.5 rounded-full border border-highlighter-accent font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-ink" />
                  Answered with clause
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-paper-200 px-2.5 py-0.5 rounded-full border border-paper-border font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-ink-muted" />
                  Not found in this agreement
                </span>
              )}
            </div>
          </div>

          {/* Translation Disclaimer Pill when language is not English */}
          {lang !== "en" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-paper-200 border border-paper-border text-[10px] font-mono text-ink">
              <Languages className="w-3 h-3 text-ink" />
              <span>
                {isTranslatingAnswer
                  ? "Translating answer..."
                  : "AI translation. The English clause is the source."}
              </span>
            </div>
          )}

          {/* Answer translation error notice */}
          {answerTranslationError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-ink flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>{answerTranslationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAnswerTranslationError(null)}
                className="text-[11px] font-mono text-ink-muted hover:text-ink flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Answer Text */}
          <p className="text-sm text-ink leading-relaxed font-sans">
            {translatedAnswerText || currentAnswer.text}
          </p>

          {/* Cited clauses (NEVER translated; exact source clause from document) */}
          {currentAnswer.status === "answered" && currentAnswer.quotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-paper-border">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block">
                Cited Source Clause{currentAnswer.quotes.length > 1 ? "s" : ""} (Click to highlight in reader):
              </span>
              {currentAnswer.quotes.map((quote, qIdx) => {
                const isSelected = activeQuote === quote;
                return (
                  <div
                    key={qIdx}
                    onClick={() => onSelectQuote(quote)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectQuote(quote);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs font-mono leading-relaxed transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-highlighter-solid/35 border-highlighter-accent shadow-sm ring-1 ring-highlighter-accent"
                        : "bg-paper-100 border-paper-border hover:bg-paper-200/70"
                    }`}
                  >
                    <p className="italic text-ink/90 line-clamp-3">&ldquo;{quote}&rdquo;</p>
                    <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-ink-muted group-hover:text-ink flex-shrink-0">
                      <span>Show in doc</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Friendly note for "not_found" status */}
          {currentAnswer.status === "not_found" && (
            <div className="p-3.5 bg-paper-100 rounded-xl border border-paper-border text-xs text-ink-muted leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Document does not settle this question:</strong>{" "}
                This topic is not addressed anywhere in the extracted agreement text. If this matter is important for your tenancy, it is worth asking your landlord to confirm terms in writing before signing.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
