import { classifyCharacterClass } from "./scoring";
import type { Insight, KeystrokeEvent } from "../types";

const isMeaningfulCharacter = (char: string): boolean => char.length > 0;

const contextSnippet = (prompt: string, index: number): string => {
  const start = Math.max(0, index - 12);
  const end = Math.min(prompt.length, index + 12);
  return prompt.slice(start, end).replaceAll("\n", " ");
};

const pushUnique = (list: Insight[], insight: Insight): void => {
  if (!list.some((item) => item.code === insight.code)) {
    list.push(insight);
  }
};

export const generateLearnInsights = (payload: {
  prompt: string;
  input: string;
  events: KeystrokeEvent[];
  accuracy: number;
  netWpm: number;
}): Insight[] => {
  const insights: Insight[] = [];
  const typedEvents = payload.events.filter(
    (event) => !event.corrected && isMeaningfulCharacter(event.actual),
  );
  const correctionEvents = payload.events.filter((event) => event.corrected);

  if (typedEvents.length < 12) {
    return [
      {
        code: "warmup-needed",
        title: "Need a longer sample",
        description:
          "Type a longer Learn run for sharper diagnostics. Short runs hide stable pace and error patterns.",
        severity: "low",
      },
      {
        code: "warmup-accuracy",
        title: "Prioritize clean accuracy",
        description:
          "Start with smooth, deliberate keystrokes. Accuracy-first passes produce better long-term speed gains.",
        severity: "low",
      },
      {
        code: "warmup-rhythm",
        title: "Keep a steady rhythm",
        description:
          "Avoid bursts. A calm cadence tends to reduce corrections and improve consistency over time.",
        severity: "low",
      },
    ];
  }

  let averageGap = 0;
  for (let index = 1; index < typedEvents.length; index += 1) {
    averageGap += typedEvents[index].timestampMs - typedEvents[index - 1].timestampMs;
  }
  averageGap /= Math.max(typedEvents.length - 1, 1);

  const pauses: Array<{ gap: number; index: number }> = [];
  for (let index = 1; index < typedEvents.length; index += 1) {
    const gap = typedEvents[index].timestampMs - typedEvents[index - 1].timestampMs;
    if (gap > Math.max(350, averageGap * 1.75)) {
      pauses.push({ gap, index: typedEvents[index].index });
    }
  }
  pauses.sort((a, b) => b.gap - a.gap);
  if (pauses.length > 0) {
    const hotspot = pauses[0];
    pushUnique(insights, {
      code: "slowdown-zone",
      title: "Noticeable slowdown zone",
      description: `Longest pause was around "${contextSnippet(payload.prompt, hotspot.index)}". Drill this transition at reduced speed.`,
      severity: "medium",
    });
  }

  const classErrors = {
    symbol: 0,
    identifier: 0,
    whitespace: 0,
    other: 0,
  };

  for (let index = 0; index < Math.min(payload.prompt.length, payload.input.length); index += 1) {
    if (payload.prompt[index] === payload.input[index]) {
      continue;
    }
    const className = classifyCharacterClass(payload.prompt[index]);
    classErrors[className] += 1;
  }

  const worstClass = Object.entries(classErrors).sort((a, b) => b[1] - a[1])[0];
  if (worstClass && worstClass[1] >= 3) {
    const classLabelMap: Record<string, string> = {
      symbol: "symbols and punctuation",
      identifier: "letters and number runs",
      whitespace: "spacing and line breaks",
      other: "mixed character groups",
    };

    pushUnique(insights, {
      code: `error-cluster-${worstClass[0]}`,
      title: "Recurring error cluster",
      description: `Most misses happened in ${classLabelMap[worstClass[0]]}. Add short focused drills for this class.`,
      severity: "high",
    });
  }

  const correctionRatio = correctionEvents.length / Math.max(typedEvents.length, 1);
  if (correctionRatio >= 0.12) {
    pushUnique(insights, {
      code: "high-correction-load",
      title: "High correction load",
      description:
        "Frequent backtracking is slowing total pace. Slightly lower speed for the first line, then climb gradually.",
      severity: "medium",
    });
  }

  const postCorrectionGaps: number[] = [];
  for (let correctionIndex = 0; correctionIndex < correctionEvents.length; correctionIndex += 1) {
    const correction = correctionEvents[correctionIndex];
    const nextTyped = typedEvents.find((event) => event.timestampMs > correction.timestampMs);
    if (!nextTyped) {
      continue;
    }
    postCorrectionGaps.push(nextTyped.timestampMs - correction.timestampMs);
  }
  if (postCorrectionGaps.length > 0) {
    const averagePostCorrectionGap =
      postCorrectionGaps.reduce((sum, gap) => sum + gap, 0) / postCorrectionGaps.length;
    if (averagePostCorrectionGap > averageGap * 1.4) {
      pushUnique(insights, {
        code: "post-correction-stall",
        title: "Recovery stalls after fixes",
        description:
          "After a correction, rhythm drops for too long. Practice immediate resume drills with short code-like fragments.",
        severity: "medium",
      });
    }
  }

  if (payload.accuracy < 92) {
    pushUnique(insights, {
      code: "accuracy-floor",
      title: "Accuracy floor needs work",
      description:
        "Your accuracy dropped below 92%. Run one slower pass first, then attempt speed increases in 5 WPM increments.",
      severity: "high",
    });
  }

  if (payload.netWpm < 35) {
    pushUnique(insights, {
      code: "pace-foundation",
      title: "Build a stronger base pace",
      description:
        "Spend 5 minutes on steady cadence drills without sprinting. A smoother baseline usually improves peak pace too.",
      severity: "low",
    });
  } else if (payload.netWpm > 70 && payload.accuracy >= 95) {
    pushUnique(insights, {
      code: "advanced-progression",
      title: "Ready for denser drills",
      description:
        "You are handling this difficulty cleanly. Increase punctuation density and mixed-case passages to keep improving.",
      severity: "low",
    });
  }

  while (insights.length < 3) {
    pushUnique(insights, {
      code: `fallback-${insights.length + 1}`,
      title: "Keep the cadence even",
      description:
        "Aim for fewer spikes and smoother throughput. Stable pace tends to raise both accuracy and net speed.",
      severity: "low",
    });
  }

  return insights.slice(0, 5);
};
