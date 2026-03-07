import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ControlBar } from "../components/ControlBar";
import { HistoryPanel } from "../components/HistoryPanel";
import { PromptCanvas } from "../components/PromptCanvas";
import { ResultCard } from "../components/ResultCard";
import { StatRail } from "../components/StatRail";
import { formatDuration } from "../lib/format";
import { generateLearnInsights } from "../lib/insights";
import { createPromptFromSettings, getDurationForMode, type PromptSettings } from "../lib/prompt";
import { buildSessionResult, calculateLiveMetrics, diffInputEvents } from "../lib/scoring";
import { appendResult, loadPersistedState, saveSettings } from "../lib/storage";
import type { AppMode, AppSettings, SessionConfig, SessionPhase, SessionResult } from "../types";

const buildSessionConfig = (settings: AppSettings, promptId: string): SessionConfig => ({
  mode: settings.mode,
  durationSeconds: getDurationForMode(settings) as SessionConfig["durationSeconds"],
  language: settings.mode === "coder" ? settings.language : "english",
  promptId,
  punctuation: settings.punctuation,
  numbers: settings.numbers,
});

const isTimedMode = (mode: AppMode): boolean => mode !== "learn";

export default function App() {
  const persisted = useMemo(() => loadPersistedState(), []);
  const [settings, setSettings] = useState<AppSettings>(persisted.settings);
  const [history, setHistory] = useState<SessionResult[]>(persisted.history);
  const [streak, setStreak] = useState(persisted.streak);
  const [promptBundle, setPromptBundle] = useState(() => createPromptFromSettings(persisted.settings));
  const [input, setInput] = useState("");
  const [sessionEvents, setSessionEvents] = useState<ReturnType<typeof diffInputEvents>>([]);
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAtPerfMs, setStartedAtPerfMs] = useState<number | null>(null);
  const [startedAtIso, setStartedAtIso] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const typingRef = useRef<HTMLTextAreaElement | null>(null);
  const finalizingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const resetSessionState = useCallback(() => {
    finalizingRef.current = false;
    setInput("");
    setSessionEvents([]);
    setPhase("idle");
    setElapsedMs(0);
    setStartedAtPerfMs(null);
    setStartedAtIso(null);
    setResult(null);
    requestAnimationFrame(() => {
      typingRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const promptSettings = useMemo<PromptSettings>(
    () => ({
      mode: settings.mode,
      classicDuration: settings.classicDuration,
      coderDuration: settings.coderDuration,
      language: settings.language,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
    }),
    [
      settings.classicDuration,
      settings.coderDuration,
      settings.language,
      settings.mode,
      settings.numbers,
      settings.punctuation,
    ],
  );

  const duration = getDurationForMode(promptSettings);
  const timed = isTimedMode(settings.mode) && typeof duration === "number";

  useEffect(() => {
    typingRef.current?.focus();
  }, []);

  useEffect(() => {
    startTransition(() => {
      setPromptBundle(createPromptFromSettings(promptSettings));
      resetSessionState();
    });
  }, [promptSettings, resetSessionState]);

  const liveMetrics = useMemo(
    () => calculateLiveMetrics(promptBundle.text, input, Math.max(elapsedMs, 1)),
    [elapsedMs, input, promptBundle.text],
  );

  const playTick = useCallback(() => {
    if (!settings.sound) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 440;
    gain.gain.value = 0.015;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.03);
  }, [settings.sound]);

  const finishSession = useCallback(
    (elapsedOverrideMs?: number) => {
      if (finalizingRef.current || phase === "finished") {
        return;
      }
      finalizingRef.current = true;

      const nowIso = new Date().toISOString();
      const finalElapsed = Math.max(
        1,
        elapsedOverrideMs ?? (startedAtPerfMs === null ? elapsedMs : performance.now() - startedAtPerfMs),
      );
      const startedIso =
        startedAtIso ?? new Date(Date.now() - finalElapsed).toISOString();
      const config = buildSessionConfig(settings, promptBundle.id);
      const provisionalResult = buildSessionResult({
        mode: settings.mode,
        config,
        prompt: promptBundle.text,
        input,
        events: sessionEvents,
        elapsedMs: finalElapsed,
        startedAt: startedIso,
        endedAt: nowIso,
      });

      const insights =
        settings.mode === "learn"
          ? generateLearnInsights({
              prompt: promptBundle.text,
              input,
              events: sessionEvents,
              accuracy: provisionalResult.accuracy,
              netWpm: provisionalResult.netWpm,
            })
          : undefined;

      const nextResult = buildSessionResult({
        mode: settings.mode,
        config,
        prompt: promptBundle.text,
        input,
        events: sessionEvents,
        elapsedMs: finalElapsed,
        startedAt: startedIso,
        endedAt: nowIso,
        insights,
      });

      const persistedState = appendResult(nextResult);
      setHistory(persistedState.history);
      setStreak(persistedState.streak);
      setElapsedMs(finalElapsed);
      setPhase("finished");
      setResult(nextResult);
      setStartedAtPerfMs(null);
    },
    [elapsedMs, input, phase, promptBundle.id, promptBundle.text, sessionEvents, settings, startedAtIso, startedAtPerfMs],
  );

  useEffect(() => {
    if (phase !== "active" || startedAtPerfMs === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const nextElapsed = now - startedAtPerfMs;
      setElapsedMs(nextElapsed);

      if (duration && nextElapsed >= duration * 1000) {
        finishSession(duration * 1000);
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [duration, finishSession, phase, startedAtPerfMs]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const patchSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (phase === "finished") {
      return;
    }

    const next = event.target.value;
    const previous = input;
    if (next === previous) {
      return;
    }

    const now = performance.now();
    let referenceStart = startedAtPerfMs;
    const addedChars = Math.max(0, next.length - previous.length);
    if (phase === "idle" && addedChars > 0) {
      referenceStart = now;
      setPhase("active");
      setStartedAtPerfMs(referenceStart);
      setStartedAtIso(new Date().toISOString());
      setElapsedMs(0);
    }

    const elapsedFromStart =
      referenceStart === null ? elapsedMs : Math.max(0, now - referenceStart);
    const eventDelta = diffInputEvents(previous, next, promptBundle.text, elapsedFromStart);
    if (eventDelta.length > 0) {
      setSessionEvents((current) => [...current, ...eventDelta]);
    }

    if (addedChars > 0) {
      playTick();
    }

    setInput(next);
  };

  const elapsedSeconds = elapsedMs / 1000;
  const remainingSeconds = timed ? Math.max(duration - elapsedSeconds, 0) : 0;
  const retryPrompt = () => {
    resetSessionState();
  };

  const newPrompt = () => {
    setPromptBundle(createPromptFromSettings(settings));
    resetSessionState();
  };

  return (
    <div className="app-shell">
      <ControlBar
        settings={settings}
        showSettings={showSettings}
        onModeChange={(mode) => patchSettings({ mode })}
        onSettingsPatch={patchSettings}
        onToggleSettings={() => setShowSettings((current) => !current)}
      />

      <main className="workspace">
        <div className="main-column">
          <StatRail
            mode={settings.mode}
            timed={timed}
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={remainingSeconds}
            grossWpm={liveMetrics.grossWpm}
            netWpm={liveMetrics.netWpm}
            tpm={liveMetrics.tpm}
            accuracy={liveMetrics.accuracy}
          />

          <PromptCanvas
            mode={settings.mode}
            prompt={promptBundle.text}
            input={input}
            phase={phase}
            fontScale={settings.fontScale}
            textareaRef={typingRef}
            onInputChange={onInputChange}
            onFocusRequest={() => typingRef.current?.focus()}
          />

          <div className="session-actions">
            <button type="button" onClick={retryPrompt}>
              restart
            </button>
            <button type="button" onClick={newPrompt}>
              new prompt
            </button>
            {settings.mode === "learn" && phase !== "finished" && (
              <button
                type="button"
                onClick={() => finishSession()}
                disabled={input.trim().length === 0}
              >
                submit report
              </button>
            )}
            {timed && <span className="duration-chip">{formatDuration(duration)}</span>}
          </div>

          {result && <ResultCard result={result} onRetry={retryPrompt} onNewPrompt={newPrompt} />}
          <HistoryPanel history={history} streak={streak} />
        </div>
      </main>
    </div>
  );
}
