import type { PracticePreset, ShapeType } from "./types";

export const DEFAULT_BOARD_WIDTH = 1600;
export const DEFAULT_BOARD_HEIGHT = 960;
export const MIN_BOARD_WIDTH = 400;
export const MAX_BOARD_WIDTH = 4000;
export const MIN_BOARD_HEIGHT = 300;
export const MAX_BOARD_HEIGHT = 3000;
export const MIN_SHAPES = 5;
export const MAX_SHAPES = 250;
export const MIN_ALERT_SECONDS = 0.2;
export const MAX_ALERT_SECONDS = 60;
export const MIN_BPM = 30;
export const MAX_BPM = 180;
export const LABEL_FONT_SIZE = 24;
export const SESSION_DURATIONS = [1, 3, 5, 10] as const;
export const TEMPO_LADDER_STEPS = [2, 4, 6, 8] as const;
export const TEMPO_LADDER_INTERVALS = [30, 60, 120] as const;
export const SESSION_RECORDS_STORAGE_KEY = "random-shapes-session-records";

export const paletteThemes = {
  bright: [
    "#ff6b6b",
    "#f59f00",
    "#ffd43b",
    "#69db7c",
    "#38d9a9",
    "#4dabf7",
    "#748ffc",
    "#b197fc",
    "#f783ac",
    "#ffa94d",
  ],
  muted: [
    "#b85c5c",
    "#b7791f",
    "#a58a2a",
    "#5f8f65",
    "#4c8577",
    "#527fa4",
    "#626c9f",
    "#7b679d",
    "#a35f82",
    "#b8754a",
  ],
  pastel: [
    "#ffb3ba",
    "#ffd6a5",
    "#fdffb6",
    "#caffbf",
    "#bde0fe",
    "#a0c4ff",
    "#ffc6ff",
    "#d0f4de",
    "#e4c1f9",
    "#f1c0a8",
  ],
  highContrast: [
    "#e11d48",
    "#f97316",
    "#eab308",
    "#16a34a",
    "#0891b2",
    "#2563eb",
    "#4f46e5",
    "#9333ea",
    "#111827",
    "#f8fafc",
  ],
  grayscale: [
    "#111827",
    "#374151",
    "#4b5563",
    "#6b7280",
    "#9ca3af",
    "#d1d5db",
    "#e5e7eb",
    "#f3f4f6",
  ],
} as const;

export const shapeTypeOptions = [
  { type: "circle", label: "Circle" },
  { type: "rectangle", label: "Rectangle" },
  { type: "triangle", label: "Triangle" },
  { type: "pentagon", label: "Pentagon" },
  { type: "hexagon", label: "Hexagon" },
  { type: "diamond", label: "Diamond" },
  { type: "star", label: "Star" },
  { type: "capsule", label: "Capsule" },
  { type: "ring", label: "Ring" },
] satisfies Array<{ type: ShapeType; label: string }>;

export const wordBank = [
  "orbit",
  "glyph",
  "ember",
  "vector",
  "signal",
  "delta",
  "anchor",
  "lumen",
  "kernel",
  "beacon",
  "ripple",
  "cobalt",
  "atlas",
  "mosaic",
  "quartz",
  "drift",
  "nova",
  "hinge",
  "pocket",
  "prism",
  "thread",
  "harbor",
  "motive",
  "field",
];

export const practicePresets = [
  {
    id: "steady-sequence",
    name: "Steady sequence",
    description: "Slow one-target-per-beat stepping for calibration.",
    exerciseMode: "sequential",
    bpm: 54,
    beatsPerTarget: 1,
    sessionDurationMinutes: 3,
    tempoLadderEnabled: false,
    tempoLadderStepBpm: 4,
    tempoLadderIntervalSeconds: 60,
  },
  {
    id: "anchor-return",
    name: "Anchor return",
    description: "Return to target 1 every fourth shift to train re-centering.",
    exerciseMode: "anchor-return",
    bpm: 60,
    beatsPerTarget: 2,
    sessionDurationMinutes: 3,
    tempoLadderEnabled: false,
    tempoLadderStepBpm: 4,
    tempoLadderIntervalSeconds: 60,
    anchorReturnInterval: 4,
  },
  {
    id: "feature-switch",
    name: "Feature switch",
    description: "Alternate by feature class with a gentle tempo ladder.",
    exerciseMode: "alternating-feature",
    bpm: 56,
    beatsPerTarget: 2,
    sessionDurationMinutes: 5,
    tempoLadderEnabled: true,
    tempoLadderStepBpm: 4,
    tempoLadderIntervalSeconds: 60,
    alternatingPattern: "triangle-circle",
  },
  {
    id: "memory-replay",
    name: "Memory replay",
    description: "Preview six targets, then click them back in order.",
    exerciseMode: "memory-replay",
    bpm: 60,
    beatsPerTarget: 1,
    sessionDurationMinutes: 3,
    tempoLadderEnabled: false,
    tempoLadderStepBpm: 4,
    tempoLadderIntervalSeconds: 60,
    memorySequenceLength: 6,
  },
] satisfies PracticePreset[];
