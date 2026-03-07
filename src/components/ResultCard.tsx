import { formatDateTime, formatMetric } from "../lib/format";
import type { SessionResult } from "../types";

type ResultCardProps = {
  result: SessionResult;
  onRetry: () => void;
  onNewPrompt: () => void;
};

const timelineSummary = (timeline: SessionResult["timeline"]): { avg: number; peak: number } => {
  if (timeline.length === 0) {
    return { avg: 0, peak: 0 };
  }
  const sum = timeline.reduce((acc, sample) => acc + sample.wpm, 0);
  const peak = timeline.reduce((max, sample) => Math.max(max, sample.wpm), 0);
  return {
    avg: sum / timeline.length,
    peak,
  };
};

export const ResultCard = ({ result, onRetry, onNewPrompt }: ResultCardProps) => {
  const summary = timelineSummary(result.timeline);

  return (
    <section className="result-card" aria-live="polite">
      <header className="result-head">
        <h2>Session Report</h2>
        <p>{formatDateTime(result.endedAt)}</p>
      </header>
      <div className="result-grid">
        <div>
          <span>net wpm</span>
          <strong>{formatMetric(result.netWpm)}</strong>
        </div>
        <div>
          <span>gross wpm</span>
          <strong>{formatMetric(result.grossWpm)}</strong>
        </div>
        <div>
          <span>accuracy</span>
          <strong>{formatMetric(result.accuracy, 1)}%</strong>
        </div>
        <div>
          <span>consistency</span>
          <strong>{formatMetric(result.consistency, 1)}%</strong>
        </div>
        <div>
          <span>avg pace</span>
          <strong>{formatMetric(summary.avg)}</strong>
        </div>
        <div>
          <span>peak pace</span>
          <strong>{formatMetric(summary.peak)}</strong>
        </div>
      </div>

      {result.mode === "coder" && (
        <div className="result-coder">
          <div>
            <span>symbol accuracy</span>
            <strong>{formatMetric(result.symbolAccuracy ?? 0, 1)}%</strong>
          </div>
          <div>
            <span>identifier accuracy</span>
            <strong>{formatMetric(result.identifierAccuracy ?? 0, 1)}%</strong>
          </div>
          <div>
            <span>whitespace accuracy</span>
            <strong>{formatMetric(result.whitespaceAccuracy ?? 0, 1)}%</strong>
          </div>
        </div>
      )}

      {result.mode === "learn" && (result.insights?.length ?? 0) > 0 && (
        <div className="result-insights">
          <h3>Habits and Suggestions</h3>
          <ul>
            {result.insights?.map((insight) => (
              <li key={insight.code}>
                <p>{insight.title}</p>
                <span>{insight.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="result-actions">
        <button type="button" onClick={onRetry}>
          retry
        </button>
        <button type="button" onClick={onNewPrompt}>
          new prompt
        </button>
      </footer>
    </section>
  );
};
