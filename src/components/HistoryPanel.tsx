import { formatDateTime, formatMetric } from "../lib/format";
import type { SessionResult, StreakMeta } from "../types";

type HistoryPanelProps = {
  history: SessionResult[];
  streak: StreakMeta;
};

export const HistoryPanel = ({ history, streak }: HistoryPanelProps) => {
  const recent = history.slice(0, 5);
  return (
    <section className="history-panel">
      <header>
        <h3>Recent Sessions</h3>
        <p>
          Streak <strong>{streak.currentStreak}</strong> day
          {streak.currentStreak === 1 ? "" : "s"} | Best <strong>{streak.bestStreak}</strong>
        </p>
      </header>
      {recent.length === 0 ? (
        <p className="history-empty">No sessions saved yet.</p>
      ) : (
        <ul>
          {recent.map((entry) => (
            <li key={`${entry.endedAt}-${entry.mode}-${entry.config.promptId}`}>
              <span>{entry.mode}</span>
              <strong>{formatMetric(entry.netWpm)}</strong>
              <span>{formatMetric(entry.accuracy, 1)}%</span>
              <time dateTime={entry.endedAt}>{formatDateTime(entry.endedAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
