export const formatSeconds = (seconds: number): string => {
  const rounded = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${`${remainder}`.padStart(2, "0")}`;
};

export const formatDuration = (seconds: number): string => `${seconds}s`;

export const formatMetric = (value: number, decimals = 0): string =>
  value.toFixed(decimals);

export const formatDateTime = (isoDate: string): string =>
  new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
