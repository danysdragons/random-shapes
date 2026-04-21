import { describe, expect, it } from "vitest";
import { practicePresets, workoutPlans } from "./config";
import {
  generateMemorySequence,
  getCurrentTargetIndex,
  getDwellPrompt,
  getExerciseLabel,
  getExerciseInstruction,
  getSessionSummary,
} from "./exerciseLogic";
import { generateLabels, generateShapes } from "./shapeLogic";
import {
  formatSessionTime,
  getTempoLadderBpm,
  normalizeAlertWindow,
} from "./sessionLogic";
import type { Shape } from "./types";

const simpleShapes: Shape[] = [
  {
    type: "circle",
    id: "shape-0",
    x: 0,
    y: 0,
    rotation: 0,
    color: "#ff6b6b",
    radius: 20,
  },
  {
    type: "triangle",
    id: "shape-1",
    x: 0,
    y: 0,
    rotation: 0,
    color: "#4dabf7",
    width: 40,
    height: 40,
  },
  {
    type: "circle",
    id: "shape-2",
    x: 0,
    y: 0,
    rotation: 0,
    color: "#69db7c",
    radius: 20,
  },
];

describe("exercise targeting", () => {
  it("steps sequentially by movement step", () => {
    expect(
      getCurrentTargetIndex("sequential", 0, simpleShapes, 4, "triangle-circle"),
    ).toBe(0);
    expect(
      getCurrentTargetIndex("sequential", 3, simpleShapes, 4, "triangle-circle"),
    ).toBe(0);
    expect(
      getCurrentTargetIndex("sequential", 4, simpleShapes, 4, "triangle-circle"),
    ).toBe(1);
  });

  it("returns to anchor on the configured interval", () => {
    expect(
      getCurrentTargetIndex(
        "anchor-return",
        0,
        simpleShapes,
        4,
        "triangle-circle",
      ),
    ).toBe(0);
    expect(
      getCurrentTargetIndex(
        "anchor-return",
        1,
        simpleShapes,
        4,
        "triangle-circle",
      ),
    ).toBe(1);
    expect(
      getCurrentTargetIndex(
        "anchor-return",
        4,
        simpleShapes,
        4,
        "triangle-circle",
      ),
    ).toBe(0);
  });

  it("does not assign paced targets for free or memory replay modes", () => {
    expect(
      getCurrentTargetIndex("free", 1, simpleShapes, 4, "triangle-circle"),
    ).toBeNull();
    expect(
      getCurrentTargetIndex(
        "memory-replay",
        1,
        simpleShapes,
        4,
        "triangle-circle",
      ),
    ).toBeNull();
  });

  it("provides stable exercise labels", () => {
    expect(getExerciseLabel("free")).toBe("Free");
    expect(getExerciseLabel("memory-replay")).toBe("Memory replay");
  });

  it("describes drill instructions for configured modes", () => {
    expect(
      getExerciseInstruction("sequential", 2, 4, "triangle-circle", 6),
    ).toContain("2 beats");
    expect(
      getExerciseInstruction("anchor-return", 2, 6, "triangle-circle", 6),
    ).toContain("every 6 target steps");
    expect(
      getExerciseInstruction("memory-replay", 1, 4, "triangle-circle", 8),
    ).toContain("Preview 8");
  });

  it("provides dwell prompts for paced and memory drills", () => {
    expect(getDwellPrompt("sequential", 2, 1, "idle", 0, 6)).toBe(
      "Hold target 3 for 1 more beat.",
    );
    expect(getDwellPrompt("sequential", 2, 0, "idle", 0, 6)).toBe(
      "Shift now to target 3.",
    );
    expect(getDwellPrompt("memory-replay", null, null, "recall", 2, 6)).toBe(
      "Recall target 3 of 6.",
    );
  });
});

describe("board generation", () => {
  it("generates deterministic shapes for the same seed and options", () => {
    const first = generateShapes(
      4,
      123,
      800,
      600,
      ["circle", "star"],
      "bright",
      "mixed",
      "full",
    );
    const second = generateShapes(
      4,
      123,
      800,
      600,
      ["circle", "star"],
      "bright",
      "mixed",
      "full",
    );

    expect(second).toEqual(first);
  });

  it("generates sequential numeric labels", () => {
    expect(generateLabels(4, 123, "number")).toEqual(["1", "2", "3", "4"]);
  });
});

describe("memory replay", () => {
  it("builds the requested sequence length without adjacent repeats", () => {
    const sequence = generateMemorySequence(8, 123, 6);

    expect(sequence).toHaveLength(6);
    expect(sequence.every((target) => target >= 0 && target < 8)).toBe(true);
    expect(
      sequence.every((target, index) => index === 0 || target !== sequence[index - 1]),
    ).toBe(true);
  });
});

describe("session math", () => {
  it("formats session time", () => {
    expect(formatSessionTime(0)).toBe("0:00");
    expect(formatSessionTime(125)).toBe("2:05");
  });

  it("increases tempo by ladder stages and caps at max BPM", () => {
    expect(getTempoLadderBpm(60, 4, 30, 0)).toBe(60);
    expect(getTempoLadderBpm(60, 4, 30, 61)).toBe(68);
    expect(getTempoLadderBpm(176, 8, 30, 120)).toBe(180);
  });

  it("normalizes alert windows", () => {
    expect(normalizeAlertWindow(10, 1)).toEqual([1, 10]);
    const [lower, upper] = normalizeAlertWindow(0, 0);

    expect(lower).toBe(0.2);
    expect(upper).toBeCloseTo(0.3);
  });

  it("summarizes completed sessions", () => {
    expect(getSessionSummary("Sequential", 125, "60 BPM", 4, 3, 75)).toBe(
      "Sequential • 2:05 • 60 BPM • 3/4 correct (75%)",
    );
    expect(getSessionSummary("Free", 60, "54 BPM", 0, 0, 0)).toContain(
      "no clicks tracked",
    );
  });
});

describe("practice presets", () => {
  it("keeps all presets within available session duration options", () => {
    expect(practicePresets.map((preset) => preset.sessionDurationMinutes)).toEqual([
      3,
      3,
      5,
      3,
    ]);
  });

  it("includes the expected training modes", () => {
    expect(practicePresets.map((preset) => preset.exerciseMode)).toEqual([
      "sequential",
      "anchor-return",
      "alternating-feature",
      "memory-replay",
    ]);
  });
});

describe("guided workouts", () => {
  it("references configured practice presets for every block", () => {
    const presetIds = new Set(practicePresets.map((preset) => preset.id));

    expect(workoutPlans.length).toBeGreaterThan(0);
    expect(
      workoutPlans.every(
        (workout) =>
          workout.steps.length > 0 &&
          workout.steps.every((step) => presetIds.has(step.presetId)),
      ),
    ).toBe(true);
  });

  it("includes multi-block routines with memory and temporal-control coverage", () => {
    expect(workoutPlans.some((workout) => workout.steps.length >= 4)).toBe(true);
    expect(
      workoutPlans.some((workout) =>
        workout.steps.some((step) => step.presetId === "memory-replay"),
      ),
    ).toBe(true);
    expect(
      workoutPlans.some((workout) =>
        workout.steps.some((step) => step.presetId === "feature-switch"),
      ),
    ).toBe(true);
  });
});
