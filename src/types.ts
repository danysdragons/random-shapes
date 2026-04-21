export type ShapeType =
  | "circle"
  | "rectangle"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "diamond"
  | "star"
  | "capsule"
  | "ring";

export type GridMode = "none" | "square" | "hex";
export type LabelType = "word" | "number";
export type PaletteTheme =
  | "bright"
  | "muted"
  | "pastel"
  | "highContrast"
  | "grayscale";
export type ShapeSizeMode = "small" | "medium" | "large" | "mixed";
export type RotationMode = "none" | "subtle" | "full";
export type BorderStyleMode = "none" | "thin" | "medium" | "bold" | "dashed";
export type CornerStyle = "sharp" | "soft" | "round";
export type FillStyle = "solid" | "translucent" | "outline";
export type CenterMarkerStyle = "dot" | "ring" | "crosshair" | "none";

export type ExerciseMode =
  | "free"
  | "sequential"
  | "anchor-return"
  | "alternating-feature"
  | "memory-replay";
export type BeatsPerTarget = 1 | 2 | 4;
export type AnchorReturnInterval = 4 | 6 | 8;
export type AlternatingPattern = "triangle-circle" | "warm-cool";
export type MemoryPhase = "idle" | "preview" | "recall" | "complete";
export type MemorySequenceLength = 4 | 6 | 8 | 10;
export type SessionDurationMinutes = 1 | 3 | 5 | 10;
export type TempoLadderStepBpm = 2 | 4 | 6 | 8;
export type TempoLadderIntervalSeconds = 30 | 60 | 120;

export type PracticePreset = {
  id: string;
  name: string;
  description: string;
  exerciseMode: ExerciseMode;
  bpm: number;
  beatsPerTarget: BeatsPerTarget;
  sessionDurationMinutes: SessionDurationMinutes;
  tempoLadderEnabled: boolean;
  tempoLadderStepBpm: TempoLadderStepBpm;
  tempoLadderIntervalSeconds: TempoLadderIntervalSeconds;
  anchorReturnInterval?: AnchorReturnInterval;
  alternatingPattern?: AlternatingPattern;
  memorySequenceLength?: MemorySequenceLength;
};

export type WorkoutStep = {
  presetId: string;
  note: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  steps: WorkoutStep[];
};

export type SessionRecord = {
  id: string;
  kind: "completed" | "saved";
  exerciseLabel: string;
  durationSeconds: number;
  bpmLabel: string;
  attempts: number;
  correct: number;
  accuracy: number;
};

export type ResponseFeedback = {
  kind: "correct" | "incorrect";
  message: string;
  token: number;
} | null;

export type Shape =
  | {
      type: "circle" | "ring";
      id: string;
      x: number;
      y: number;
      rotation: number;
      color: string;
      radius: number;
    }
  | {
      type: Exclude<ShapeType, "circle" | "ring">;
      id: string;
      x: number;
      y: number;
      rotation: number;
      color: string;
      width: number;
      height: number;
    };
