import { formatMetric, formatSeconds } from "../lib/format";
import type { AppMode } from "../types";

type StatRailProps = {
  mode: AppMode;
  timed: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  grossWpm: number;
  netWpm: number;
  tpm: number;
  accuracy: number;
};

export const StatRail = ({
  mode,
  timed,
  elapsedSeconds,
  remainingSeconds,
  grossWpm,
  netWpm,
  tpm,
  accuracy,
}: StatRailProps) => {
  return (
    <aside className="stat-rail" aria-label="Live typing statistics">
      <div className="stat-card stat-card-timer">
        <span className="stat-label">{timed ? "remaining" : "elapsed"}</span>
        <strong className="stat-value">{formatSeconds(timed ? remainingSeconds : elapsedSeconds)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">net wpm</span>
        <strong className="stat-value">{formatMetric(netWpm)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">gross wpm</span>
        <strong className="stat-value">{formatMetric(grossWpm)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">tpm</span>
        <strong className="stat-value">{formatMetric(tpm)}</strong>
      </div>
      <div className="stat-card">
        <span className="stat-label">accuracy</span>
        <strong className="stat-value">{formatMetric(accuracy, 1)}%</strong>
      </div>
      <div className="stat-card stat-card-mode">
        <span className="stat-label">mode</span>
        <strong className="stat-value">{mode}</strong>
      </div>
    </aside>
  );
};
