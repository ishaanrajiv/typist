export type AlignmentOp =
  | {
      type: "match" | "substitute";
      promptIndex: number;
      inputIndex: number;
      expected: string;
      actual: string;
    }
  | {
      type: "delete";
      promptIndex: number;
      inputIndex: null;
      expected: string;
      actual: "";
    }
  | {
      type: "insert";
      promptIndex: null;
      inputIndex: number;
      expected: "";
      actual: string;
    };

export type AlignmentMode = "full" | "input";

const MATCH_COST = 0;
const SUBSTITUTE_COST = 100;
const GAP_COST = 135;
const SPACE_GAP_COST = 260;
const SPACE_SUBSTITUTE_COST = 180;

const min3 = (a: number, b: number, c: number): number => Math.min(a, Math.min(b, c));
const isWhitespace = (char: string): boolean => /\s/.test(char);
const getSubstitutionCost = (expected: string, actual: string): number => {
  if (expected === actual) {
    return MATCH_COST;
  }
  return isWhitespace(expected) || isWhitespace(actual)
    ? SPACE_SUBSTITUTE_COST
    : SUBSTITUTE_COST;
};
const getDeleteCost = (expected: string): number => (isWhitespace(expected) ? SPACE_GAP_COST : GAP_COST);
const getInsertCost = (actual: string): number => (isWhitespace(actual) ? SPACE_GAP_COST : GAP_COST);

export const alignPromptInput = (
  prompt: string,
  input: string,
  mode: AlignmentMode = "full",
): AlignmentOp[] => {
  const promptChars = Array.from(prompt);
  const inputChars = Array.from(input);
  const promptLength = promptChars.length;
  const inputLength = inputChars.length;

  const dp: number[][] = Array.from({ length: promptLength + 1 }, () =>
    Array.from({ length: inputLength + 1 }, () => 0),
  );

  for (let row = 1; row <= promptLength; row += 1) {
    dp[row][0] = dp[row - 1][0] + getDeleteCost(promptChars[row - 1]);
  }
  for (let column = 1; column <= inputLength; column += 1) {
    dp[0][column] = dp[0][column - 1] + getInsertCost(inputChars[column - 1]);
  }

  for (let row = 1; row <= promptLength; row += 1) {
    for (let column = 1; column <= inputLength; column += 1) {
      const substitutionCost = getSubstitutionCost(promptChars[row - 1], inputChars[column - 1]);
      const diagonal = dp[row - 1][column - 1] + substitutionCost;
      const deleteCost = dp[row - 1][column] + getDeleteCost(promptChars[row - 1]);
      const insertCost = dp[row][column - 1] + getInsertCost(inputChars[column - 1]);
      dp[row][column] = min3(diagonal, deleteCost, insertCost);
    }
  }

  let row = promptLength;
  if (mode === "input") {
    let bestScore = Number.POSITIVE_INFINITY;
    let bestRow = 0;
    for (let candidate = 0; candidate <= promptLength; candidate += 1) {
      const score = dp[candidate][inputLength];
      if (score < bestScore || (score === bestScore && candidate < bestRow)) {
        bestScore = score;
        bestRow = candidate;
      }
    }
    row = bestRow;
  }
  let column = inputLength;

  const operations: AlignmentOp[] = [];
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0) {
      const expected = promptChars[row - 1];
      const actual = inputChars[column - 1];
      const substitutionCost = getSubstitutionCost(expected, actual);
      if (dp[row][column] === dp[row - 1][column - 1] + substitutionCost) {
        operations.push({
          type: substitutionCost === MATCH_COST ? "match" : "substitute",
          promptIndex: row - 1,
          inputIndex: column - 1,
          expected,
          actual,
        });
        row -= 1;
        column -= 1;
        continue;
      }
    }

    if (row > 0 && dp[row][column] === dp[row - 1][column] + getDeleteCost(promptChars[row - 1])) {
      operations.push({
        type: "delete",
        promptIndex: row - 1,
        inputIndex: null,
        expected: promptChars[row - 1],
        actual: "",
      });
      row -= 1;
      continue;
    }

    operations.push({
      type: "insert",
      promptIndex: null,
      inputIndex: column - 1,
      expected: "",
      actual: inputChars[column - 1] ?? "",
    });
    column -= 1;
  }

  operations.reverse();
  return operations;
};
