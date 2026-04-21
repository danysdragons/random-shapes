import type {
  AlternatingPattern,
  AnchorReturnInterval,
  BeatsPerTarget,
  ExerciseMode,
  MemoryPhase,
  MemorySequenceLength,
  Shape,
} from "./types";
import { mulberry32 } from "./math";

export function getCurrentTargetIndex(
  exerciseMode: ExerciseMode,
  movementStep: number,
  shapes: Shape[],
  anchorReturnInterval: AnchorReturnInterval,
  alternatingPattern: AlternatingPattern,
) {
  const shapeCount = shapes.length;

  if (
    exerciseMode === "free" ||
    exerciseMode === "memory-replay" ||
    shapeCount === 0
  ) {
    return null;
  }

  if (exerciseMode === "sequential" || shapeCount === 1) {
    return movementStep % shapeCount;
  }

  if (movementStep === 0 || movementStep % anchorReturnInterval === 0) {
    return 0;
  }

  if (exerciseMode === "anchor-return") {
    return ((movementStep - 1) % (shapeCount - 1)) + 1;
  }

  return getAlternatingTargetIndex(shapes, movementStep, alternatingPattern);
}

export function getExerciseLabel(exerciseMode: ExerciseMode) {
  if (exerciseMode === "sequential") {
    return "Sequential";
  }

  if (exerciseMode === "anchor-return") {
    return "Anchor return";
  }

  if (exerciseMode === "alternating-feature") {
    return "Alternating feature";
  }

  if (exerciseMode === "memory-replay") {
    return "Memory replay";
  }

  return "Free";
}

export function getAlternatingTargetIndex(
  shapes: Shape[],
  movementStep: number,
  pattern: AlternatingPattern,
) {
  const firstClass =
    pattern === "triangle-circle"
      ? shapes
          .map((shape, index) => ({ shape, index }))
          .filter(({ shape }) => shape.type === "triangle")
      : shapes
          .map((shape, index) => ({ shape, index }))
          .filter(({ shape }) => isWarmColor(shape.color));
  const secondClass =
    pattern === "triangle-circle"
      ? shapes
          .map((shape, index) => ({ shape, index }))
          .filter(({ shape }) => shape.type === "circle")
      : shapes
          .map((shape, index) => ({ shape, index }))
          .filter(({ shape }) => !isWarmColor(shape.color));
  const activeClass = movementStep % 2 === 0 ? firstClass : secondClass;
  const fallbackClass = movementStep % 2 === 0 ? secondClass : firstClass;
  const targetClass = activeClass.length > 0 ? activeClass : fallbackClass;

  if (targetClass.length === 0) {
    return movementStep % shapes.length;
  }

  return targetClass[Math.floor(movementStep / 2) % targetClass.length]!.index;
}

export function getAlternatingPatternLabel(pattern: AlternatingPattern) {
  if (pattern === "triangle-circle") {
    return "Triangle / circle";
  }

  return "Warm / cool";
}

export function getMemoryPhaseLabel(
  phase: MemoryPhase,
  recallIndex: number,
  sequenceLength: number,
) {
  if (phase === "preview") {
    return "Previewing sequence";
  }

  if (phase === "recall") {
    return `Recall step ${Math.min(recallIndex + 1, sequenceLength)}/${sequenceLength}`;
  }

  if (phase === "complete") {
    return "Sequence complete";
  }

  return "Ready to preview";
}

export function getExerciseInstruction(
  exerciseMode: ExerciseMode,
  beatsPerTarget: BeatsPerTarget,
  anchorReturnInterval: AnchorReturnInterval,
  alternatingPattern: AlternatingPattern,
  memorySequenceLength: MemorySequenceLength,
) {
  if (exerciseMode === "sequential") {
    return `Follow targets in numeric order. Let each target occupy ${formatBeatCount(beatsPerTarget)} before shifting.`;
  }

  if (exerciseMode === "anchor-return") {
    return `Move through the numbered targets, then return to target 1 every ${anchorReturnInterval} target steps.`;
  }

  if (exerciseMode === "alternating-feature") {
    return `Alternate attention by ${getAlternatingPatternLabel(alternatingPattern).toLowerCase()} while keeping the shift on the beat.`;
  }

  if (exerciseMode === "memory-replay") {
    return `Preview ${memorySequenceLength} highlighted targets, then recall the same sequence after labels disappear.`;
  }

  return "Explore the board freely. Add pacing, labels, alerts, or a timer when you want more structure.";
}

export function getDwellPrompt(
  exerciseMode: ExerciseMode,
  currentTargetIndex: number | null,
  beatsUntilShift: number | null,
  memoryPhase: MemoryPhase,
  memoryRecallIndex: number,
  memorySequenceLength: number,
) {
  if (exerciseMode === "memory-replay") {
    if (memoryPhase === "preview") {
      return "Watch the highlighted target and avoid clicking during preview.";
    }

    if (memoryPhase === "recall") {
      return `Recall target ${Math.min(memoryRecallIndex + 1, memorySequenceLength)} of ${memorySequenceLength}.`;
    }

    if (memoryPhase === "complete") {
      return "Sequence complete. Restart preview or advance the workout block.";
    }

    return "Press Preview sequence when you are ready to encode the targets.";
  }

  if (exerciseMode === "free") {
    return "No assigned target. Use the board for unpaced visual search or orientation checks.";
  }

  const targetLabel =
    currentTargetIndex === null ? "the highlighted target" : `target ${currentTargetIndex + 1}`;

  if (beatsUntilShift === null || beatsUntilShift === 0) {
    return `Shift now to ${targetLabel}.`;
  }

  if (beatsUntilShift === 1) {
    return `Hold ${targetLabel} for 1 more beat.`;
  }

  return `Hold ${targetLabel} for ${beatsUntilShift} more beats.`;
}

export function getSessionSummary(
  exerciseLabel: string,
  durationSeconds: number,
  bpmLabel: string,
  attempts: number,
  correct: number,
  accuracy: number,
) {
  const accuracyLabel =
    attempts > 0 ? `${correct}/${attempts} correct (${accuracy}%)` : "no clicks tracked";

  return `${exerciseLabel} • ${formatDuration(durationSeconds)} • ${bpmLabel} • ${accuracyLabel}`;
}

function formatBeatCount(beats: BeatsPerTarget) {
  if (beats === 1) {
    return "1 beat";
  }

  return `${beats} beats`;
}

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isWarmColor(color: string) {
  return ["#ff6b6b", "#f59f00", "#ffd43b", "#f783ac", "#ffa94d"].includes(
    color,
  );
}

export function generateMemorySequence(
  shapeCount: number,
  seed: number,
  sequenceLength: MemorySequenceLength,
) {
  if (shapeCount === 0) {
    return [];
  }

  const random = mulberry32(seed ^ 0x51f15e);
  const sequence: number[] = [];

  for (let index = 0; index < sequenceLength; index++) {
    let nextTarget = Math.floor(random() * shapeCount);

    if (shapeCount > 1 && sequence[index - 1] === nextTarget) {
      nextTarget = (nextTarget + 1) % shapeCount;
    }

    sequence.push(nextTarget);
  }

  return sequence;
}
