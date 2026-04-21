import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import trainingManualMarkdown from "../TRAINING_MANUAL.md?raw";
import { playMetronomeTick } from "./audio";
import { Whiteboard } from "./components/Whiteboard";
import {
  DEFAULT_BOARD_HEIGHT,
  DEFAULT_BOARD_WIDTH,
  MAX_BOARD_HEIGHT,
  MAX_BOARD_WIDTH,
  MAX_SHAPES,
  MAX_ALERT_SECONDS,
  MAX_BPM,
  MIN_BOARD_HEIGHT,
  MIN_BOARD_WIDTH,
  MIN_SHAPES,
  MIN_ALERT_SECONDS,
  MIN_BPM,
  SESSION_DURATIONS,
  SESSION_RECORDS_STORAGE_KEY,
  TEMPO_LADDER_INTERVALS,
  TEMPO_LADDER_STEPS,
  practicePresets,
  shapeTypeOptions,
  workoutPlans,
} from "./config";
import {
  generateMemorySequence,
  getAlternatingPatternLabel,
  getCurrentTargetIndex,
  getDwellPrompt,
  getExerciseLabel,
  getExerciseInstruction,
  getMemoryPhaseLabel,
  getSessionSummary,
} from "./exerciseLogic";
import { clampFloat, clampInt, randomSeed } from "./math";
import {
  formatSessionTime,
  formatTempoLadderInterval,
  getTempoLadderBpm,
  normalizeAlertWindow,
} from "./sessionLogic";
import {
  generateLabels,
  generateShapes,
} from "./shapeLogic";
import type {
  AlternatingPattern,
  AnchorReturnInterval,
  BeatsPerTarget,
  BorderStyleMode,
  CenterMarkerStyle,
  CornerStyle,
  ExerciseMode,
  FillStyle,
  GridMode,
  LabelType,
  MemoryPhase,
  MemorySequenceLength,
  PaletteTheme,
  PracticePreset,
  ResponseFeedback,
  RotationMode,
  SessionDurationMinutes,
  SessionRecord,
  Shape,
  ShapeSizeMode,
  ShapeType,
  TempoLadderIntervalSeconds,
  TempoLadderStepBpm,
  WorkoutPlan,
} from "./types";

const METRONOME_LOOKAHEAD_MS = 25;
const METRONOME_SCHEDULE_AHEAD_SECONDS = 0.12;

function getDefaultWorkoutPlan(): WorkoutPlan {
  const [defaultWorkoutPlan] = workoutPlans;

  if (!defaultWorkoutPlan) {
    throw new Error("At least one workout plan must be configured.");
  }

  return defaultWorkoutPlan;
}

function loadStoredSessionRecords() {
  try {
    const storedRecords = window.localStorage.getItem(SESSION_RECORDS_STORAGE_KEY);

    if (!storedRecords) {
      return [];
    }

    const parsed = JSON.parse(storedRecords);

    return Array.isArray(parsed) ? (parsed as SessionRecord[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [shapeCount, setShapeCount] = useState(40);
  const [showTrainingManual, setShowTrainingManual] = useState(false);
  const [seed, setSeed] = useState(() => randomSeed());
  const [boardWidth, setBoardWidth] = useState(DEFAULT_BOARD_WIDTH);
  const [boardHeight, setBoardHeight] = useState(DEFAULT_BOARD_HEIGHT);
  const [enabledShapeTypes, setEnabledShapeTypes] = useState<ShapeType[]>(
    () => shapeTypeOptions.map(({ type }) => type),
  );
  const [paletteTheme, setPaletteTheme] = useState<PaletteTheme>("bright");
  const [shapeSizeMode, setShapeSizeMode] = useState<ShapeSizeMode>("mixed");
  const [rotationMode, setRotationMode] = useState<RotationMode>("full");
  const [borderStyleMode, setBorderStyleMode] =
    useState<BorderStyleMode>("medium");
  const [borderColor, setBorderColor] = useState("#243041");
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>("soft");
  const [fillStyle, setFillStyle] = useState<FillStyle>("solid");
  const [fillOpacity, setFillOpacity] = useState(0.72);
  const [centerMarkerStyle, setCenterMarkerStyle] =
    useState<CenterMarkerStyle>("dot");
  const [centerMarkerSize, setCenterMarkerSize] = useState(8);
  const [centerMarkerColor, setCenterMarkerColor] = useState("#111111");
  const [gridMode, setGridMode] = useState<GridMode>("none");
  const [gridOpacity, setGridOpacity] = useState(0.35);
  const [showLabels, setShowLabels] = useState(false);
  const [labelType, setLabelType] = useState<LabelType>("word");
  const [minAlertSec, setMinAlertSec] = useState(1);
  const [maxAlertSec, setMaxAlertSec] = useState(10);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>("free");
  const [bpm, setBpm] = useState(60);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [visualPulseEnabled, setVisualPulseEnabled] = useState(true);
  const [beatsPerTarget, setBeatsPerTarget] = useState<BeatsPerTarget>(1);
  const [anchorReturnInterval, setAnchorReturnInterval] =
    useState<AnchorReturnInterval>(4);
  const [alternatingPattern, setAlternatingPattern] =
    useState<AlternatingPattern>("triangle-circle");
  const [memorySequenceLength, setMemorySequenceLength] =
    useState<MemorySequenceLength>(6);
  const [memoryPhase, setMemoryPhase] = useState<MemoryPhase>("idle");
  const [memoryPreviewIndex, setMemoryPreviewIndex] = useState(0);
  const [memoryRecallIndex, setMemoryRecallIndex] = useState(0);
  const [memoryMistakeCount, setMemoryMistakeCount] = useState(0);
  const [responseTrackingEnabled, setResponseTrackingEnabled] = useState(true);
  const [responseStats, setResponseStats] = useState({
    attempts: 0,
    correct: 0,
  });
  const [responseFeedback, setResponseFeedback] =
    useState<ResponseFeedback>(null);
  const [sessionDurationMinutes, setSessionDurationMinutes] =
    useState<SessionDurationMinutes>(3);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState(3 * 60);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>(
    loadStoredSessionRecords,
  );
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(
    () => getDefaultWorkoutPlan().id,
  );
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeWorkoutStepIndex, setActiveWorkoutStepIndex] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [tempoLadderEnabled, setTempoLadderEnabled] = useState(false);
  const [tempoLadderBaseBpm, setTempoLadderBaseBpm] = useState(60);
  const [tempoLadderStepBpm, setTempoLadderStepBpm] =
    useState<TempoLadderStepBpm>(4);
  const [tempoLadderIntervalSeconds, setTempoLadderIntervalSeconds] =
    useState<TempoLadderIntervalSeconds>(60);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [pulseToken, setPulseToken] = useState(0);
  const [lastPulseAccent, setLastPulseAccent] = useState(false);
  const alertTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scheduledPulseTimeoutsRef = useRef<number[]>([]);
  const beatCountRef = useRef(0);
  const memoryPreviewTimeoutRef = useRef<number | null>(null);
  const sessionIntervalRef = useRef<number | null>(null);
  const sessionCompletionLoggedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const viewportWidth = Math.max(
      DEFAULT_BOARD_WIDTH,
      Math.min(MAX_BOARD_WIDTH, window.innerWidth - 120),
    );
    const viewportHeight = Math.max(
      DEFAULT_BOARD_HEIGHT,
      Math.min(MAX_BOARD_HEIGHT, Math.floor(window.innerHeight * 0.82)),
    );

    setBoardWidth(viewportWidth);
    setBoardHeight(viewportHeight);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      const isPlainN =
        (event.key === "n" || event.key === "N") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;
      const isSubmitShortcut =
        event.key === "Enter" && (event.ctrlKey || event.metaKey);

      if (!isPlainN && !isSubmitShortcut) {
        return;
      }

      event.preventDefault();
      regenerateBoard();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const clearTimers = () => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current);
      }

      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };

    clearTimers();

    const [minSeconds, maxSeconds] = normalizeAlertWindow(
      minAlertSec,
      maxAlertSec,
    );

    const scheduleNext = () => {
      const delay =
        (minSeconds + Math.random() * (maxSeconds - minSeconds)) * 1000;

      alertTimeoutRef.current = window.setTimeout(() => {
        setAlertCount((count) => count + 1);
        setShowAlert(true);

        if (hideTimeoutRef.current !== null) {
          window.clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = window.setTimeout(() => {
          setShowAlert(false);
        }, 1200);

        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return clearTimers;
  }, [minAlertSec, maxAlertSec]);

  useEffect(() => {
    beatCountRef.current = beatCount;
  }, [beatCount]);

  useEffect(() => {
    if (intervalRef.current !== null) {
      window.clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    scheduledPulseTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    scheduledPulseTimeoutsRef.current = [];

    if (!isMetronomeRunning) {
      return;
    }

    const audioContext = ensureAudioContext();
    const secondsPerBeat = 60 / bpm;
    let nextBeatTime =
      (audioContext?.currentTime ?? window.performance.now() / 1000) + 0.04;
    let scheduledBeatNumber = beatCountRef.current;

    const scheduleBeat = (beatNumber: number, startAt: number) => {
      const accent =
        accentFirstBeat && ((beatNumber - 1) % beatsPerBar === 0);

      if (audioEnabled && audioContext) {
        playMetronomeTick(audioContext, accent, startAt);
      }

      const now = audioContext?.currentTime ?? window.performance.now() / 1000;
      const delayMs = Math.max(0, (startAt - now) * 1000);
      const timeoutId = window.setTimeout(() => {
        scheduledPulseTimeoutsRef.current =
          scheduledPulseTimeoutsRef.current.filter((id) => id !== timeoutId);
        beatCountRef.current = beatNumber;
        setBeatCount(beatNumber);

        if (visualPulseEnabled) {
          setLastPulseAccent(accent);
          setPulseToken((token) => token + 1);
        }
      }, delayMs);

      scheduledPulseTimeoutsRef.current.push(timeoutId);
    };

    const runScheduler = () => {
      const now = audioContext?.currentTime ?? window.performance.now() / 1000;

      while (nextBeatTime < now + METRONOME_SCHEDULE_AHEAD_SECONDS) {
        scheduledBeatNumber += 1;
        scheduleBeat(scheduledBeatNumber, nextBeatTime);
        nextBeatTime += secondsPerBeat;
      }

      intervalRef.current = window.setTimeout(
        runScheduler,
        METRONOME_LOOKAHEAD_MS,
      );
    };

    runScheduler();

    return () => {
      if (intervalRef.current !== null) {
        window.clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }

      scheduledPulseTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      scheduledPulseTimeoutsRef.current = [];
    };
  }, [
    accentFirstBeat,
    audioEnabled,
    bpm,
    beatsPerBar,
    isMetronomeRunning,
    visualPulseEnabled,
  ]);

  useEffect(() => {
    resetBeatClock();
    resetResponseStats();
    resetMemoryReplay();
  }, [
    alternatingPattern,
    anchorReturnInterval,
    beatsPerTarget,
    exerciseMode,
    memorySequenceLength,
    seed,
  ]);

  useEffect(() => {
    if (memoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(memoryPreviewTimeoutRef.current);
      memoryPreviewTimeoutRef.current = null;
    }

    if (memoryPhase !== "preview") {
      return;
    }

    memoryPreviewTimeoutRef.current = window.setTimeout(() => {
      setMemoryPreviewIndex((index) => {
        if (index >= memorySequenceLength - 1) {
          setMemoryPhase("recall");
          return index;
        }

        return index + 1;
      });
    }, 850);

    return () => {
      if (memoryPreviewTimeoutRef.current !== null) {
        window.clearTimeout(memoryPreviewTimeoutRef.current);
        memoryPreviewTimeoutRef.current = null;
      }
    };
  }, [memoryPhase, memoryPreviewIndex, memorySequenceLength]);

  useEffect(() => {
    setSessionRemainingSeconds(sessionDurationMinutes * 60);
    setSessionCompleted(false);
    sessionCompletionLoggedRef.current = false;
  }, [sessionDurationMinutes]);

  useEffect(() => {
    if (!tempoLadderEnabled || !isSessionRunning) {
      return;
    }

    const elapsedSeconds = sessionDurationMinutes * 60 - sessionRemainingSeconds;
    const nextBpm = getTempoLadderBpm(
      tempoLadderBaseBpm,
      tempoLadderStepBpm,
      tempoLadderIntervalSeconds,
      elapsedSeconds,
    );

    setBpm((currentBpm) => (currentBpm === nextBpm ? currentBpm : nextBpm));
  }, [
    isSessionRunning,
    sessionDurationMinutes,
    sessionRemainingSeconds,
    tempoLadderBaseBpm,
    tempoLadderEnabled,
    tempoLadderIntervalSeconds,
    tempoLadderStepBpm,
  ]);

  useEffect(() => {
    if (sessionIntervalRef.current !== null) {
      window.clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }

    if (!isSessionRunning) {
      return;
    }

    sessionIntervalRef.current = window.setInterval(() => {
      setSessionRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          setIsSessionRunning(false);
          setSessionCompleted(true);
          setIsMetronomeRunning(false);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => {
      if (sessionIntervalRef.current !== null) {
        window.clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
    };
  }, [isSessionRunning]);

  useEffect(() => {
    if (!sessionCompleted || sessionCompletionLoggedRef.current) {
      return;
    }

    setSessionRecords((records) => [
      createSessionRecord("completed"),
      ...records,
    ].slice(0, 5));
    sessionCompletionLoggedRef.current = true;
  }, [sessionCompleted]);

  useEffect(() => {
    window.localStorage.setItem(
      SESSION_RECORDS_STORAGE_KEY,
      JSON.stringify(sessionRecords),
    );
  }, [sessionRecords]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearTimeout(intervalRef.current);
      }

      scheduledPulseTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      scheduledPulseTimeoutsRef.current = [];

      if (memoryPreviewTimeoutRef.current !== null) {
        window.clearTimeout(memoryPreviewTimeoutRef.current);
      }

      if (sessionIntervalRef.current !== null) {
        window.clearInterval(sessionIntervalRef.current);
      }

      if (audioContextRef.current !== null) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const effectiveLabelType = exerciseMode !== "free" ? "number" : labelType;
  const effectiveShowLabels =
    exerciseMode === "memory-replay"
      ? memoryPhase === "preview"
      : showLabels || exerciseMode !== "free";

  const shapes = useMemo(
    () =>
      generateShapes(
        shapeCount,
        seed,
        boardWidth,
        boardHeight,
        enabledShapeTypes,
        paletteTheme,
        shapeSizeMode,
        rotationMode,
      ),
    [
      boardHeight,
      boardWidth,
      enabledShapeTypes,
      paletteTheme,
      rotationMode,
      seed,
      shapeCount,
      shapeSizeMode,
    ],
  );

  const labels = useMemo(
    () => generateLabels(shapeCount, seed, effectiveLabelType),
    [effectiveLabelType, seed, shapeCount],
  );
  const memorySequence = useMemo(
    () => generateMemorySequence(shapes.length, seed, memorySequenceLength),
    [memorySequenceLength, seed, shapes.length],
  );

  const movementStep = Math.floor(beatCount / beatsPerTarget);
  const pacedTargetIndex = getCurrentTargetIndex(
    exerciseMode,
    movementStep,
    shapes,
    anchorReturnInterval,
    alternatingPattern,
  );
  const memoryPreviewTargetIndex =
    exerciseMode === "memory-replay" && memoryPhase === "preview"
      ? (memorySequence[memoryPreviewIndex] ?? null)
      : null;
  const expectedTargetIndex =
    exerciseMode === "memory-replay" && memoryPhase === "recall"
      ? (memorySequence[memoryRecallIndex] ?? null)
      : pacedTargetIndex;
  const currentTargetIndex =
    exerciseMode === "memory-replay" ? memoryPreviewTargetIndex : pacedTargetIndex;
  const anchorIndex = exerciseMode === "anchor-return" ? 0 : null;
  const currentBeatInBar =
    beatCount === 0 ? 1 : ((beatCount - 1) % beatsPerBar) + 1;
  const beatsUntilShift =
    exerciseMode !== "free"
      ? beatsPerTarget - (beatCount % beatsPerTarget || beatsPerTarget)
      : null;
  const responseAccuracy =
    responseStats.attempts === 0
      ? 0
      : Math.round((responseStats.correct / responseStats.attempts) * 100);
  const sessionElapsedSeconds = sessionDurationMinutes * 60 - sessionRemainingSeconds;
  const tempoLadderStage = tempoLadderEnabled
    ? Math.floor(sessionElapsedSeconds / tempoLadderIntervalSeconds) + 1
    : 0;
  const tempoLadderEndBpm = getTempoLadderBpm(
    tempoLadderBaseBpm,
    tempoLadderStepBpm,
    tempoLadderIntervalSeconds,
    Math.max(0, sessionDurationMinutes * 60 - 1),
  );
  const sessionStatus = sessionCompleted
    ? "Session complete"
    : isSessionRunning
      ? "Session running"
      : "Session ready";
  const exerciseInstruction = getExerciseInstruction(
    exerciseMode,
    beatsPerTarget,
    anchorReturnInterval,
    alternatingPattern,
    memorySequenceLength,
  );
  const dwellPrompt = getDwellPrompt(
    exerciseMode,
    currentTargetIndex,
    beatsUntilShift,
    memoryPhase,
    memoryRecallIndex,
    memorySequence.length,
  );
  const currentBpmLabel = tempoLadderEnabled
    ? `${tempoLadderBaseBpm}-${Math.max(bpm, tempoLadderBaseBpm)} BPM`
    : `${bpm} BPM`;
  const sessionSummary = getSessionSummary(
    getExerciseLabel(exerciseMode),
    sessionElapsedSeconds,
    currentBpmLabel,
    responseStats.attempts,
    responseStats.correct,
    responseAccuracy,
  );
  const memoryReplayOutcome =
    memoryPhase === "complete"
      ? memoryMistakeCount === 0
        ? "Passed cleanly"
        : `Completed with ${memoryMistakeCount} correction${
            memoryMistakeCount === 1 ? "" : "s"
          }`
      : null;
  const selectedWorkout =
    workoutPlans.find((workout) => workout.id === selectedWorkoutId) ??
    getDefaultWorkoutPlan();
  const activeWorkout =
    activeWorkoutId === null
      ? null
      : (workoutPlans.find((workout) => workout.id === activeWorkoutId) ??
        null);
  const activeWorkoutStep =
    activeWorkout?.steps[activeWorkoutStepIndex] ?? null;
  const activeWorkoutPreset = activeWorkoutStep
    ? (practicePresets.find(
        (preset) => preset.id === activeWorkoutStep.presetId,
      ) ?? null)
    : null;
  const isLastWorkoutStep =
    activeWorkout !== null &&
    activeWorkoutStepIndex >= activeWorkout.steps.length - 1;
  const workoutStatus = activeWorkout
    ? workoutCompleted
      ? `${activeWorkout.name} complete`
      : `Block ${activeWorkoutStepIndex + 1}/${activeWorkout.steps.length}: ${
          activeWorkoutPreset?.name ?? "Unknown preset"
        }`
    : workoutCompleted
      ? "Workout complete"
      : "No workout running";

  function regenerateBoard() {
    setSeed(randomSeed());
    resetBeatClock();
    resetResponseStats();
    resetMemoryReplay();
  }

  function resetBeatClock() {
    beatCountRef.current = 0;
    setBeatCount(0);
    setPulseToken(0);
  }

  function ensureAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioCtor =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioCtor) {
      return null;
    }

    if (audioContextRef.current === null) {
      audioContextRef.current = new AudioCtor();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  function toggleMetronome() {
    if (isMetronomeRunning) {
      setIsMetronomeRunning(false);
      return;
    }

    ensureAudioContext();
    resetBeatClock();
    setIsMetronomeRunning(true);
  }

  function handleAudioToggle(nextValue: boolean) {
    setAudioEnabled(nextValue);

    if (nextValue) {
      ensureAudioContext();
    }
  }

  function handleTempoLadderToggle(nextValue: boolean) {
    setTempoLadderEnabled(nextValue);

    if (nextValue) {
      setTempoLadderBaseBpm(bpm);
    }
  }

  function handleTempoChange(nextValue: number) {
    const nextBpm = Math.round(nextValue);

    setBpm(nextBpm);

    if (tempoLadderEnabled && !isSessionRunning) {
      setTempoLadderBaseBpm(nextBpm);
    }
  }

  function resetResponseStats() {
    setResponseStats({ attempts: 0, correct: 0 });
    setResponseFeedback(null);
  }

  function resetMemoryReplay() {
    setMemoryPhase("idle");
    setMemoryPreviewIndex(0);
    setMemoryRecallIndex(0);
    setMemoryMistakeCount(0);

    if (memoryPreviewTimeoutRef.current !== null) {
      window.clearTimeout(memoryPreviewTimeoutRef.current);
      memoryPreviewTimeoutRef.current = null;
    }
  }

  function startMemoryPreview() {
    resetResponseStats();
    resetBeatClock();
    setMemoryMistakeCount(0);
    setMemoryRecallIndex(0);
    setMemoryPreviewIndex(0);
    setMemoryPhase("preview");
  }

  function startSession() {
    const isFreshSession =
      sessionRemainingSeconds === 0 ||
      sessionCompleted ||
      sessionRemainingSeconds === sessionDurationMinutes * 60;

    if (sessionRemainingSeconds === 0 || sessionCompleted) {
      setSessionRemainingSeconds(sessionDurationMinutes * 60);
    }

    if (tempoLadderEnabled && isFreshSession) {
      setTempoLadderBaseBpm(bpm);
    }

    sessionCompletionLoggedRef.current = false;
    setSessionCompleted(false);
    setIsSessionRunning(true);
  }

  function pauseSession() {
    setIsSessionRunning(false);
  }

  function resetSession() {
    setIsSessionRunning(false);
    setSessionCompleted(false);
    setSessionRemainingSeconds(sessionDurationMinutes * 60);
    sessionCompletionLoggedRef.current = false;
  }

  function toggleShapeType(shapeType: ShapeType) {
    setEnabledShapeTypes((types) => {
      if (types.includes(shapeType)) {
        return types.length === 1
          ? types
          : types.filter((type) => type !== shapeType);
      }

      return [...types, shapeType];
    });
  }

  function applyPracticePreset(preset: PracticePreset) {
    setExerciseMode(preset.exerciseMode);
    setBpm(preset.bpm);
    setBeatsPerTarget(preset.beatsPerTarget);
    setSessionDurationMinutes(preset.sessionDurationMinutes);
    setSessionRemainingSeconds(preset.sessionDurationMinutes * 60);
    setTempoLadderEnabled(preset.tempoLadderEnabled);
    setTempoLadderBaseBpm(preset.bpm);
    setTempoLadderStepBpm(preset.tempoLadderStepBpm);
    setTempoLadderIntervalSeconds(preset.tempoLadderIntervalSeconds);
    setAnchorReturnInterval(preset.anchorReturnInterval ?? 4);
    setAlternatingPattern(preset.alternatingPattern ?? "triangle-circle");
    setMemorySequenceLength(preset.memorySequenceLength ?? 6);
    setResponseTrackingEnabled(preset.exerciseMode !== "free");
    setIsMetronomeRunning(false);
    setIsSessionRunning(false);
    setSessionCompleted(false);
    sessionCompletionLoggedRef.current = false;
    resetBeatClock();
    resetResponseStats();
    resetMemoryReplay();
  }

  function getPresetById(presetId: string) {
    return practicePresets.find((preset) => preset.id === presetId) ?? null;
  }

  function applyWorkoutStep(workout: WorkoutPlan, stepIndex: number) {
    const step = workout.steps[stepIndex];

    if (!step) {
      return false;
    }

    const preset = getPresetById(step.presetId);

    if (!preset) {
      return false;
    }

    applyPracticePreset(preset);
    return true;
  }

  function startWorkout(workout: WorkoutPlan = selectedWorkout) {
    if (!applyWorkoutStep(workout, 0)) {
      return;
    }

    setSelectedWorkoutId(workout.id);
    setActiveWorkoutId(workout.id);
    setActiveWorkoutStepIndex(0);
    setWorkoutCompleted(false);
  }

  function advanceWorkoutStep() {
    if (!activeWorkout) {
      return;
    }

    if (isLastWorkoutStep) {
      setWorkoutCompleted(true);
      setIsSessionRunning(false);
      setIsMetronomeRunning(false);
      return;
    }

    const nextStepIndex = activeWorkoutStepIndex + 1;

    if (!applyWorkoutStep(activeWorkout, nextStepIndex)) {
      return;
    }

    setActiveWorkoutStepIndex(nextStepIndex);
    setWorkoutCompleted(false);
  }

  function stopWorkout() {
    setActiveWorkoutId(null);
    setActiveWorkoutStepIndex(0);
    setWorkoutCompleted(false);
  }

  function handlePresetClick(preset: PracticePreset) {
    stopWorkout();
    applyPracticePreset(preset);
  }

  function saveSessionSnapshot() {
    setSessionRecords((records) => [
      createSessionRecord("saved"),
      ...records,
    ].slice(0, 5));
  }

  function createSessionRecord(kind: SessionRecord["kind"]): SessionRecord {
    return {
      id: `${Date.now()}-${kind}`,
      kind,
      exerciseLabel: getExerciseLabel(exerciseMode),
      durationSeconds: Math.max(0, sessionElapsedSeconds),
      bpmLabel: currentBpmLabel,
      attempts: responseStats.attempts,
      correct: responseStats.correct,
      accuracy: responseAccuracy,
    };
  }

  function exportSessionLog() {
    const blob = new Blob([JSON.stringify(sessionRecords, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `random-shapes-session-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleShapeSelect(index: number) {
    if (
      !responseTrackingEnabled ||
      exerciseMode === "free" ||
      expectedTargetIndex === null ||
      (exerciseMode === "memory-replay" && memoryPhase !== "recall")
    ) {
      return;
    }

    const correct = index === expectedTargetIndex;

    setResponseStats((stats) => ({
      attempts: stats.attempts + 1,
      correct: stats.correct + (correct ? 1 : 0),
    }));

    if (exerciseMode === "memory-replay" && correct) {
      const nextRecallIndex = memoryRecallIndex + 1;

      if (nextRecallIndex >= memorySequence.length) {
        setMemoryPhase("complete");
      } else {
        setMemoryRecallIndex(nextRecallIndex);
      }
    }

    if (exerciseMode === "memory-replay" && !correct) {
      setMemoryMistakeCount((count) => count + 1);
    }

    setResponseFeedback({
      kind: correct ? "correct" : "incorrect",
      message: correct
        ? `Correct: target ${index + 1}`
        : `Expected target ${expectedTargetIndex + 1}, clicked ${index + 1}`,
      token: Date.now(),
    });
  }

  return (
    <main className="app-shell">
      <section className="app-card">
        <header className="hero">
          <div>
            <p className="eyebrow">Pass 4: Timed Practice Blocks</p>
            <h1>Random Shape Whiteboard</h1>
            <p className="hero-copy">
              The board can now run as a paced visual attention surface. Use
              optional beat cues, response tracking, and timed sessions to
              structure short attention drills without turning the experience
              into a rhythm game.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="secondary-button hero-manual-button"
              type="button"
              aria-expanded={showTrainingManual}
              onClick={() => setShowTrainingManual((isVisible) => !isVisible)}
            >
              {showTrainingManual ? "Hide manual" : "Training manual"}
            </button>
            <button className="board-button" onClick={regenerateBoard}>
              New board (N or Ctrl/Cmd+Enter)
            </button>
          </div>
        </header>

        {showTrainingManual ? (
          <section className="manual-panel" aria-label="Training manual">
            <div className="manual-panel-header">
              <div>
                <p className="metronome-kicker">Training manual</p>
                <h2>How to use the training features</h2>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowTrainingManual(false)}
              >
                Close manual
              </button>
            </div>
            <MarkdownDocument source={trainingManualMarkdown} />
          </section>
        ) : null}

        <section className="controls" aria-label="Board controls">
          <div className="controls-grid">
            <div className="control-section-heading">
              <div>
                <p className="metronome-kicker">Pacing & exercise</p>
                <h2>Beat-guided attention drills</h2>
              </div>
              <span>Optional scaffolding</span>
            </div>

            <div className="preset-grid" aria-label="Practice presets">
              {practicePresets.map((preset) => (
                <button
                  key={preset.id}
                  className="preset-card"
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                >
                  <span>{preset.name}</span>
                  <strong>{preset.bpm} BPM</strong>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>

            <div className="metrics-strip workout-strip" aria-live="polite">
              <div className="workout-copy">
                <p className="metronome-kicker">Guided workout</p>
                <strong>{workoutStatus}</strong>
                <span>
                  {activeWorkout
                    ? activeWorkout.description
                    : selectedWorkout.description}
                </span>
              </div>

              <div className="session-actions">
                <label className="select-field compact-select" htmlFor="workout-plan">
                  <span>Routine</span>
                  <select
                    id="workout-plan"
                    value={selectedWorkoutId}
                    disabled={activeWorkout !== null && !workoutCompleted}
                    onChange={(event) => setSelectedWorkoutId(event.target.value)}
                  >
                    {workoutPlans.map((workout) => (
                      <option key={workout.id} value={workout.id}>
                        {workout.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => startWorkout(selectedWorkout)}
                >
                  {activeWorkout && !workoutCompleted
                    ? "Restart workout"
                    : "Start workout"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  disabled={activeWorkout === null || workoutCompleted}
                  onClick={advanceWorkoutStep}
                >
                  {isLastWorkoutStep ? "Finish workout" : "Next block"}
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  disabled={activeWorkout === null}
                  onClick={stopWorkout}
                >
                  Stop workout
                </button>
              </div>

              <ol className="workout-step-list">
                {(activeWorkout ?? selectedWorkout).steps.map((step, index) => {
                  const preset = getPresetById(step.presetId);
                  const isCurrent =
                    activeWorkout !== null &&
                    index === activeWorkoutStepIndex &&
                    !workoutCompleted;

                  return (
                    <li
                      key={`${step.presetId}-${index}`}
                      className={`workout-step${isCurrent ? " is-current" : ""}${
                        workoutCompleted || (activeWorkout !== null && index < activeWorkoutStepIndex)
                          ? " is-complete"
                          : ""
                      }`}
                    >
                      <strong>
                        {index + 1}. {preset?.name ?? "Missing preset"}
                      </strong>
                      <span>{step.note}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="metronome-strip">
              <div className="metronome-copy">
                <p className="metronome-kicker">Pacing scaffold</p>
                <strong>
                  {isMetronomeRunning ? "Metronome running" : "Metronome stopped"}
                </strong>
                <span>
                  {exerciseMode === "free"
                    ? "Free practice mode with optional beat support."
                    : exerciseMode === "memory-replay"
                      ? getMemoryPhaseLabel(
                          memoryPhase,
                          memoryRecallIndex,
                          memorySequence.length,
                        )
                      : `${getExerciseLabel(exerciseMode)}: target ${currentTargetIndex !== null ? currentTargetIndex + 1 : 1} of ${shapeCount}.`}
                </span>
              </div>
              <button className="board-button metronome-button" onClick={toggleMetronome}>
                {isMetronomeRunning ? "Stop metronome" : "Start metronome"}
              </button>
            </div>

            <div className="control-block">
              <div className="control-label-row">
                <label htmlFor="exercise-mode">Exercise mode</label>
                <output htmlFor="exercise-mode">
                  {getExerciseLabel(exerciseMode)}
                </output>
              </div>
              <div className="select-grid">
                <label className="select-field" htmlFor="exercise-mode">
                  <span>Attention mode</span>
                  <select
                    id="exercise-mode"
                    value={exerciseMode}
                    onChange={(event) =>
                      setExerciseMode(event.target.value as ExerciseMode)
                    }
                  >
                    <option value="free">Free practice</option>
                    <option value="sequential">Sequential stepping</option>
                    <option value="anchor-return">Anchor-return drill</option>
                    <option value="alternating-feature">Alternating-feature drill</option>
                    <option value="memory-replay">Memory replay</option>
                  </select>
                </label>

                <label className="select-field" htmlFor="beats-per-target">
                  <span>Pacing</span>
                  <select
                    id="beats-per-target"
                    value={String(beatsPerTarget)}
                    disabled={
                      exerciseMode === "free" || exerciseMode === "memory-replay"
                    }
                    onChange={(event) =>
                      setBeatsPerTarget(Number(event.target.value) as BeatsPerTarget)
                    }
                  >
                    <option value="1">1 target per beat</option>
                    <option value="2">1 target every 2 beats</option>
                    <option value="4">1 target every 4 beats</option>
                  </select>
                </label>

                <label className="select-field" htmlFor="anchor-return-interval">
                  <span>Anchor return</span>
                  <select
                    id="anchor-return-interval"
                    value={String(anchorReturnInterval)}
                    disabled={exerciseMode !== "anchor-return"}
                    onChange={(event) =>
                      setAnchorReturnInterval(
                        Number(event.target.value) as AnchorReturnInterval,
                      )
                    }
                  >
                    <option value="4">Every 4 target steps</option>
                    <option value="6">Every 6 target steps</option>
                    <option value="8">Every 8 target steps</option>
                  </select>
                </label>

                <label className="select-field" htmlFor="alternating-pattern">
                  <span>Alternating pattern</span>
                  <select
                    id="alternating-pattern"
                    value={alternatingPattern}
                    disabled={exerciseMode !== "alternating-feature"}
                    onChange={(event) =>
                      setAlternatingPattern(
                        event.target.value as AlternatingPattern,
                      )
                    }
                  >
                    <option value="triangle-circle">Triangle / circle</option>
                    <option value="warm-cool">Warm / cool color</option>
                  </select>
                </label>

                <label className="select-field" htmlFor="memory-sequence-length">
                  <span>Memory length</span>
                  <select
                    id="memory-sequence-length"
                    value={String(memorySequenceLength)}
                    disabled={exerciseMode !== "memory-replay"}
                    onChange={(event) =>
                      setMemorySequenceLength(
                        Number(event.target.value) as MemorySequenceLength,
                      )
                    }
                  >
                    <option value="4">4 targets</option>
                    <option value="6">6 targets</option>
                    <option value="8">8 targets</option>
                    <option value="10">10 targets</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="metrics-strip guidance-strip" aria-live="polite">
              <div>
                <p className="metronome-kicker">Drill instructions</p>
                <strong>{getExerciseLabel(exerciseMode)}</strong>
                <span>{exerciseInstruction}</span>
              </div>
              <div className="guidance-prompt">
                <span>Next action</span>
                <strong>{dwellPrompt}</strong>
              </div>
            </div>

            <RangeControl
              label="Tempo"
              output={
                tempoLadderEnabled && isSessionRunning
                  ? `${bpm} BPM (ladder)`
                  : `${bpm} BPM`
              }
              inputId="bpm"
              rangeId="bpm-range"
              value={bpm}
              min={MIN_BPM}
              max={MAX_BPM}
              step={1}
              disabled={tempoLadderEnabled && isSessionRunning}
              onChange={handleTempoChange}
            />

            <div className="metrics-strip tempo-ladder-strip" aria-live="polite">
              <div>
                <p className="metronome-kicker">Tempo ladder</p>
                <strong>
                  {tempoLadderEnabled
                    ? isSessionRunning
                      ? `Stage ${tempoLadderStage}: ${bpm} BPM`
                      : `${tempoLadderBaseBpm}-${tempoLadderEndBpm} BPM planned`
                    : "Manual tempo"}
                </strong>
                <span>
                  {tempoLadderEnabled
                    ? `During timed sessions, BPM rises by ${tempoLadderStepBpm} every ${formatTempoLadderInterval(tempoLadderIntervalSeconds)}.`
                    : "Keep tempo fixed, or enable a gradual ladder for timed practice blocks."}
                </span>
              </div>
              <div className="session-actions">
                <label className="checkbox-field ladder-toggle">
                  <input
                    type="checkbox"
                    checked={tempoLadderEnabled}
                    onChange={(event) =>
                      handleTempoLadderToggle(event.target.checked)
                    }
                  />
                  <span>Use ladder</span>
                </label>

                <label className="select-field compact-select" htmlFor="tempo-ladder-step">
                  <span>Step</span>
                  <select
                    id="tempo-ladder-step"
                    value={String(tempoLadderStepBpm)}
                    disabled={tempoLadderEnabled && isSessionRunning}
                    onChange={(event) =>
                      setTempoLadderStepBpm(
                        Number(event.target.value) as TempoLadderStepBpm,
                      )
                    }
                  >
                    {TEMPO_LADDER_STEPS.map((step) => (
                      <option key={step} value={step}>
                        +{step} BPM
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  className="select-field compact-select"
                  htmlFor="tempo-ladder-interval"
                >
                  <span>Every</span>
                  <select
                    id="tempo-ladder-interval"
                    value={String(tempoLadderIntervalSeconds)}
                    disabled={tempoLadderEnabled && isSessionRunning}
                    onChange={(event) =>
                      setTempoLadderIntervalSeconds(
                        Number(event.target.value) as TempoLadderIntervalSeconds,
                      )
                    }
                  >
                    {TEMPO_LADDER_INTERVALS.map((seconds) => (
                      <option key={seconds} value={seconds}>
                        {formatTempoLadderInterval(seconds)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="control-block">
              <div className="control-label-row">
                <label htmlFor="beats-per-bar">Meter</label>
                <output htmlFor="beats-per-bar">
                  Beat {currentBeatInBar}/{beatsPerBar}
                </output>
              </div>
              <div className="select-grid">
                <label className="select-field" htmlFor="beats-per-bar">
                  <span>Beats per bar</span>
                  <select
                    id="beats-per-bar"
                    value={String(beatsPerBar)}
                    onChange={(event) =>
                      setBeatsPerBar(clampInt(event.target.value, 2, 8))
                    }
                  >
                    <option value="2">2 / bar</option>
                    <option value="3">3 / bar</option>
                    <option value="4">4 / bar</option>
                    <option value="6">6 / bar</option>
                    <option value="8">8 / bar</option>
                  </select>
                </label>

                <div className="status-stack">
                  <span className="status-pill">
                    {accentFirstBeat ? "Accent first beat" : "Flat beat"}
                  </span>
                  {exerciseMode !== "free" ? (
                    <span className="status-pill">
                      {beatsUntilShift === 0 || beatsUntilShift === null
                        ? "Shift now"
                        : `Shift in ${beatsUntilShift} beat${beatsUntilShift === 1 ? "" : "s"}`}
                    </span>
                  ) : null}
                  {exerciseMode === "anchor-return" ? (
                    <span className="status-pill">Anchor is target 1</span>
                  ) : null}
                  {exerciseMode === "alternating-feature" ? (
                    <span className="status-pill">
                      {getAlternatingPatternLabel(alternatingPattern)}
                    </span>
                  ) : null}
                  {exerciseMode === "memory-replay" ? (
                    <span className="status-pill">
                      {getMemoryPhaseLabel(memoryPhase, memoryRecallIndex, memorySequence.length)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="toggle-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={accentFirstBeat}
                  onChange={(event) => setAccentFirstBeat(event.target.checked)}
                />
                <span>Accent first beat</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(event) => handleAudioToggle(event.target.checked)}
                />
                <span>Audio pulse</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={visualPulseEnabled}
                  onChange={(event) => setVisualPulseEnabled(event.target.checked)}
                />
                <span>Visual pulse</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={responseTrackingEnabled}
                  disabled={exerciseMode === "free"}
                  onChange={(event) =>
                    setResponseTrackingEnabled(event.target.checked)
                  }
                />
                <span>Track clicks</span>
              </label>
            </div>

            {exerciseMode === "memory-replay" ? (
              <div className="metrics-strip" aria-live="polite">
                <div>
                  <p className="metronome-kicker">Memory replay</p>
                  <strong>
                    {getMemoryPhaseLabel(
                      memoryPhase,
                      memoryRecallIndex,
                      memorySequence.length,
                    )}
                  </strong>
                  <span>
                    {memoryReplayOutcome ??
                      "Preview the highlighted sequence, then click the same shapes from memory after labels disappear."}
                  </span>
                  {memoryPhase === "complete" ? (
                    <span className="memory-result">
                      {memoryMistakeCount === 0
                        ? "Clean recall: no corrections needed."
                        : "Replay finished after one or more corrected clicks."}
                    </span>
                  ) : null}
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={startMemoryPreview}
                >
                  {memoryPhase === "preview" ? "Restart preview" : "Preview sequence"}
                </button>
              </div>
            ) : null}

            <div className="control-section-heading">
              <div>
                <p className="metronome-kicker">Response & session</p>
                <h2>Practice block controls</h2>
              </div>
              <span>{sessionStatus}</span>
            </div>

            <div className="metrics-strip session-strip" aria-live="polite">
              <div>
                <p className="metronome-kicker">Session timer</p>
                <strong>{formatSessionTime(sessionRemainingSeconds)}</strong>
                <span>
                  {sessionCompleted
                    ? "Timer complete. The metronome stopped automatically."
                    : isSessionRunning
                      ? `Running a ${sessionDurationMinutes}-minute practice block.`
                      : "Start a timed practice block when you want bounded reps."}
                </span>
              </div>
              <div className="session-actions">
                <label className="select-field compact-select" htmlFor="session-duration">
                  <span>Duration</span>
                  <select
                    id="session-duration"
                    value={String(sessionDurationMinutes)}
                    disabled={isSessionRunning}
                    onChange={(event) =>
                      setSessionDurationMinutes(
                        Number(event.target.value) as SessionDurationMinutes,
                      )
                    }
                  >
                    {SESSION_DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} min
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={isSessionRunning ? pauseSession : startSession}
                >
                  {isSessionRunning ? "Pause timer" : "Start timer"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={
                    sessionRemainingSeconds === sessionDurationMinutes * 60 &&
                    !sessionCompleted
                  }
                  onClick={resetSession}
                >
                  Reset timer
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={sessionElapsedSeconds === 0 && responseStats.attempts === 0}
                  onClick={saveSessionSnapshot}
                >
                  Save snapshot
                </button>
              </div>
            </div>

            {sessionCompleted ? (
              <div className="metrics-strip summary-strip" aria-live="polite">
                <div>
                  <p className="metronome-kicker">End-of-session summary</p>
                  <strong>{sessionSummary}</strong>
                  <span>
                    {activeWorkout && !workoutCompleted
                      ? isLastWorkoutStep
                        ? "This was the final workout block. Finish the workout when ready."
                        : "Advance to the next workout block when ready."
                      : "Use the summary to decide whether to repeat, slow down, or raise difficulty."}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="metrics-strip" aria-live="polite">
              <div>
                <p className="metronome-kicker">Response tracking</p>
                <strong>
                  {exerciseMode === "free"
                    ? "Choose a paced exercise to track clicks"
                    : responseTrackingEnabled
                      ? `${responseStats.correct}/${responseStats.attempts} correct`
                      : "Click tracking is off"}
                </strong>
                <span>
                  {responseStats.attempts > 0
                    ? `${responseAccuracy}% accuracy`
                    : exerciseMode === "memory-replay"
                      ? "After preview, click remembered targets in order."
                      : "Click the highlighted target to confirm each attentional step."}
                </span>
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={responseStats.attempts === 0}
                onClick={resetResponseStats}
              >
                Reset metrics
              </button>
            </div>

            <div className="metrics-strip session-log-strip" aria-live="polite">
              <div>
                <p className="metronome-kicker">Session log</p>
                <strong>
                  {sessionRecords.length > 0
                    ? `${sessionRecords.length} recent block${sessionRecords.length === 1 ? "" : "s"}`
                    : "No sessions recorded yet"}
                </strong>
                <span>
                  Completed timed sessions are saved automatically. Use snapshots
                  for partial blocks or untimed reps.
                </span>
              </div>

              {sessionRecords.length > 0 ? (
                <ol className="session-record-list">
                  {sessionRecords.map((record) => (
                    <li key={record.id} className="session-record">
                      <strong>{record.exerciseLabel}</strong>
                      <span>
                        {record.kind === "completed" ? "Completed" : "Saved"} •{" "}
                        {formatSessionTime(record.durationSeconds)} • {record.bpmLabel}
                      </span>
                      <span>
                        {record.correct}/{record.attempts} correct •{" "}
                        {record.attempts > 0
                          ? `${record.accuracy}% accuracy`
                          : "no clicks tracked"}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}

              <button
                className="secondary-button"
                type="button"
                disabled={sessionRecords.length === 0}
                onClick={exportSessionLog}
              >
                Export log
              </button>

              <button
                className="secondary-button"
                type="button"
                disabled={sessionRecords.length === 0}
                onClick={() => setSessionRecords([])}
              >
                Clear log
              </button>
            </div>

            <div className="control-section-heading">
              <div>
                <p className="metronome-kicker">Board & appearance</p>
                <h2>Whiteboard setup</h2>
              </div>
              <span>{shapeCount} shapes</span>
            </div>

            <div className="control-block">
              <div className="control-label-row">
                <label htmlFor="shape-count">Number of shapes</label>
                <output htmlFor="shape-count">{shapeCount}</output>
              </div>
              <input
                id="shape-count"
                type="range"
                min={MIN_SHAPES}
                max={MAX_SHAPES}
                step={1}
                value={shapeCount}
                onChange={(event) =>
                  setShapeCount(clampInt(event.target.value, MIN_SHAPES, MAX_SHAPES))
                }
              />
            </div>

            <div className="control-block">
              <div className="control-label-row">
                <span>Shape types</span>
                <output>{enabledShapeTypes.length}/{shapeTypeOptions.length}</output>
              </div>
              <div className="shape-option-grid">
                {shapeTypeOptions.map(({ type, label }) => (
                  <label key={type} className="shape-option">
                    <input
                      type="checkbox"
                      checked={enabledShapeTypes.includes(type)}
                      onChange={() => toggleShapeType(type)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="select-grid">
              <label className="select-field" htmlFor="palette-theme">
                <span>Palette</span>
                <select
                  id="palette-theme"
                  value={paletteTheme}
                  onChange={(event) =>
                    setPaletteTheme(event.target.value as PaletteTheme)
                  }
                >
                  <option value="bright">Bright</option>
                  <option value="muted">Muted</option>
                  <option value="pastel">Pastel</option>
                  <option value="highContrast">High contrast</option>
                  <option value="grayscale">Grayscale</option>
                </select>
              </label>

              <label className="select-field" htmlFor="shape-size-mode">
                <span>Shape size</span>
                <select
                  id="shape-size-mode"
                  value={shapeSizeMode}
                  onChange={(event) =>
                    setShapeSizeMode(event.target.value as ShapeSizeMode)
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>

              <label className="select-field" htmlFor="rotation-mode">
                <span>Rotation</span>
                <select
                  id="rotation-mode"
                  value={rotationMode}
                  onChange={(event) =>
                    setRotationMode(event.target.value as RotationMode)
                  }
                >
                  <option value="none">None</option>
                  <option value="subtle">Subtle</option>
                  <option value="full">Full random</option>
                </select>
              </label>
            </div>

            <div className="select-grid">
              <label className="select-field" htmlFor="fill-style">
                <span>Fill style</span>
                <select
                  id="fill-style"
                  value={fillStyle}
                  onChange={(event) => setFillStyle(event.target.value as FillStyle)}
                >
                  <option value="solid">Solid</option>
                  <option value="translucent">Translucent</option>
                  <option value="outline">Outline only</option>
                </select>
              </label>

              <label className="select-field" htmlFor="border-style">
                <span>Border style</span>
                <select
                  id="border-style"
                  value={borderStyleMode}
                  onChange={(event) =>
                    setBorderStyleMode(event.target.value as BorderStyleMode)
                  }
                >
                  <option value="none">None</option>
                  <option value="thin">Thin</option>
                  <option value="medium">Medium</option>
                  <option value="bold">Bold</option>
                  <option value="dashed">Dashed</option>
                </select>
              </label>

              <label className="select-field" htmlFor="corner-style">
                <span>Corners</span>
                <select
                  id="corner-style"
                  value={cornerStyle}
                  onChange={(event) =>
                    setCornerStyle(event.target.value as CornerStyle)
                  }
                >
                  <option value="sharp">Sharp</option>
                  <option value="soft">Soft rounded</option>
                  <option value="round">Round</option>
                </select>
              </label>

              <label className="select-field" htmlFor="center-marker-style">
                <span>Center marker</span>
                <select
                  id="center-marker-style"
                  value={centerMarkerStyle}
                  onChange={(event) =>
                    setCenterMarkerStyle(
                      event.target.value as CenterMarkerStyle,
                    )
                  }
                >
                  <option value="dot">Dot</option>
                  <option value="ring">Ring</option>
                  <option value="crosshair">Crosshair</option>
                  <option value="none">None</option>
                </select>
              </label>
            </div>

            <div className="select-grid">
              <label className="select-field color-field" htmlFor="border-color">
                <span>Border color</span>
                <input
                  id="border-color"
                  type="color"
                  value={borderColor}
                  disabled={borderStyleMode === "none" && fillStyle !== "outline"}
                  onChange={(event) => setBorderColor(event.target.value)}
                />
              </label>

              <label className="select-field color-field" htmlFor="center-marker-color">
                <span>Marker color</span>
                <input
                  id="center-marker-color"
                  type="color"
                  value={centerMarkerColor}
                  disabled={centerMarkerStyle === "none"}
                  onChange={(event) => setCenterMarkerColor(event.target.value)}
                />
              </label>
            </div>

            <RangeControl
              label="Fill opacity"
              output={fillStyle === "outline" ? "outline" : fillOpacity.toFixed(2)}
              inputId="fill-opacity"
              rangeId="fill-opacity-range"
              value={fillOpacity}
              min={0.15}
              max={1}
              step={0.05}
              disabled={fillStyle === "outline"}
              onChange={(value) => setFillOpacity(value)}
            />

            <RangeControl
              label="Marker size"
              output={
                centerMarkerStyle === "none" ? "hidden" : `${centerMarkerSize}px`
              }
              inputId="marker-size"
              rangeId="marker-size-range"
              value={centerMarkerSize}
              min={3}
              max={18}
              step={1}
              disabled={centerMarkerStyle === "none"}
              onChange={(value) => setCenterMarkerSize(Math.round(value))}
            />

            <RangeControl
              label="Width"
              output={`${boardWidth}px`}
              inputId="board-width"
              rangeId="board-width-range"
              value={boardWidth}
              min={MIN_BOARD_WIDTH}
              max={MAX_BOARD_WIDTH}
              step={10}
              onChange={(value) => setBoardWidth(Math.round(value))}
            />

            <RangeControl
              label="Height"
              output={`${boardHeight}px`}
              inputId="board-height"
              rangeId="board-height-range"
              value={boardHeight}
              min={MIN_BOARD_HEIGHT}
              max={MAX_BOARD_HEIGHT}
              step={10}
              onChange={(value) => setBoardHeight(Math.round(value))}
            />

            <div className="toggle-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={showLabels}
                  disabled={exerciseMode !== "free"}
                  onChange={(event) => setShowLabels(event.target.checked)}
                />
                <span>Show labels below shapes</span>
              </label>
            </div>

            <div className="select-grid">
              <label className="select-field" htmlFor="grid-mode">
                <span>Grid</span>
                <select
                  id="grid-mode"
                  value={gridMode}
                  onChange={(event) => setGridMode(event.target.value as GridMode)}
                >
                  <option value="none">No grid</option>
                  <option value="square">Square grid</option>
                  <option value="hex">Hexagonal grid</option>
                </select>
              </label>

              <label className="select-field" htmlFor="label-type">
                <span>Label type</span>
                <select
                  id="label-type"
                  value={effectiveLabelType}
                  disabled={!showLabels || exerciseMode !== "free"}
                  onChange={(event) => setLabelType(event.target.value as LabelType)}
                >
                  <option value="word">Random word</option>
                  <option value="number">Sequential number</option>
                </select>
              </label>
            </div>

            <RangeControl
              label="Grid faintness"
              output={gridOpacity.toFixed(2)}
              inputId="grid-opacity"
              rangeId="grid-opacity-range"
              value={gridOpacity}
              min={0.05}
              max={1}
              step={0.05}
              disabled={gridMode === "none"}
              onChange={(value) => setGridOpacity(value)}
            />

            <RangeControl
              label="Alert min (s)"
              output={`${minAlertSec.toFixed(1)}s`}
              inputId="alert-min"
              rangeId="alert-min-range"
              value={minAlertSec}
              min={MIN_ALERT_SECONDS}
              max={MAX_ALERT_SECONDS}
              step={0.1}
              onChange={(value) => setMinAlertSec(value)}
            />

            <RangeControl
              label="Alert max (s)"
              output={`${maxAlertSec.toFixed(1)}s`}
              inputId="alert-max"
              rangeId="alert-max-range"
              value={maxAlertSec}
              min={MIN_ALERT_SECONDS}
              max={MAX_ALERT_SECONDS}
              step={0.1}
              onChange={(value) => setMaxAlertSec(value)}
            />
          </div>
        </section>

        <Whiteboard
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          shapeCount={shapeCount}
          enabledShapeTypeCount={enabledShapeTypes.length}
          paletteTheme={paletteTheme}
          gridMode={gridMode}
          gridOpacity={gridOpacity}
          effectiveShowLabels={effectiveShowLabels}
          effectiveLabelType={effectiveLabelType}
          exerciseMode={exerciseMode}
          currentTargetIndex={currentTargetIndex}
          anchorIndex={anchorIndex}
          alternatingPattern={alternatingPattern}
          memoryPhase={memoryPhase}
          memoryRecallIndex={memoryRecallIndex}
          memorySequenceLength={memorySequence.length}
          visualPulseEnabled={visualPulseEnabled}
          isMetronomeRunning={isMetronomeRunning}
          pulseToken={pulseToken}
          lastPulseAccent={lastPulseAccent}
          showAlert={showAlert}
          alertCount={alertCount}
          responseFeedback={responseFeedback}
          shapes={shapes}
          labels={labels}
          responseTrackingEnabled={responseTrackingEnabled}
          borderStyleMode={borderStyleMode}
          borderColor={borderColor}
          cornerStyle={cornerStyle}
          fillStyle={fillStyle}
          fillOpacity={fillOpacity}
          centerMarkerStyle={centerMarkerStyle}
          centerMarkerSize={centerMarkerSize}
          centerMarkerColor={centerMarkerColor}
          onShapeSelect={handleShapeSelect}
        />
      </section>
    </main>
  );
}

function RangeControl({
  label,
  output,
  inputId,
  rangeId,
  value,
  min,
  max,
  step,
  disabled = false,
  onChange,
}: {
  label: string;
  output: string;
  inputId: string;
  rangeId: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="control-block">
      <div className="control-label-row">
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={`${inputId} ${rangeId}`}>{output}</output>
      </div>
      <div className="paired-inputs">
        <input
          id={inputId}
          className="number-input"
          type="number"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(clampFloat(event.target.value, min, max))}
        />
        <input
          id={rangeId}
          type="range"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(clampFloat(event.target.value, min, max))}
        />
      </div>
    </div>
  );
}

function MarkdownDocument({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);

    if (heading) {
      const level = heading[1]!.length;
      const content = renderMarkdownInline(heading[2]!);

      if (level === 1) {
        blocks.push(<h1 key={`heading-${index}`}>{content}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={`heading-${index}`}>{content}</h2>);
      } else {
        blocks.push(<h3 key={`heading-${index}`}>{content}</h3>);
      }

      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];

      while (index < lines.length && lines[index]?.trimStart().startsWith("- ")) {
        const item = lines[index]!.trimStart().slice(2);
        items.push(<li key={`item-${index}`}>{renderMarkdownInline(item)}</li>);
        index += 1;
      }

      blocks.push(<ul key={`list-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
        const item = (lines[index] ?? "").replace(/^\d+\.\s+/, "");
        items.push(<li key={`item-${index}`}>{renderMarkdownInline(item)}</li>);
        index += 1;
      }

      blocks.push(<ol key={`ordered-${index}`}>{items}</ol>);
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index]?.trim() !== "" &&
      !/^(#{1,3})\s+/.test(lines[index] ?? "") &&
      !lines[index]?.trimStart().startsWith("- ") &&
      !/^\d+\.\s+/.test(lines[index] ?? "")
    ) {
      paragraphLines.push(lines[index]!.trim());
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${index}`}>
        {renderMarkdownInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return <div className="manual-content">{blocks}</div>;
}

function renderMarkdownInline(text: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>,
      );
    } else {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}
