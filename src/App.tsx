import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_BOARD_WIDTH = 1600;
const DEFAULT_BOARD_HEIGHT = 960;
const MIN_BOARD_WIDTH = 400;
const MAX_BOARD_WIDTH = 4000;
const MIN_BOARD_HEIGHT = 300;
const MAX_BOARD_HEIGHT = 3000;
const MIN_SHAPES = 5;
const MAX_SHAPES = 250;
const MIN_ALERT_SECONDS = 0.2;
const MAX_ALERT_SECONDS = 60;
const MIN_BPM = 30;
const MAX_BPM = 180;
const LABEL_FONT_SIZE = 24;

const palette = [
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
];

const wordBank = [
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

type ShapeType = "circle" | "rectangle" | "triangle" | "pentagon" | "hexagon";
type GridMode = "none" | "square" | "hex";
type LabelType = "word" | "number";
type ExerciseMode = "free" | "sequential" | "anchor-return";
type BeatsPerTarget = 1 | 2 | 4;
type AnchorReturnInterval = 4 | 6 | 8;

type Shape =
  | {
      type: "circle";
      id: string;
      x: number;
      y: number;
      rotation: number;
      color: string;
      radius: number;
    }
  | {
      type: Exclude<ShapeType, "circle">;
      id: string;
      x: number;
      y: number;
      rotation: number;
      color: string;
      width: number;
      height: number;
    };

function getCurrentTargetIndex(
  exerciseMode: ExerciseMode,
  movementStep: number,
  shapeCount: number,
  anchorReturnInterval: AnchorReturnInterval,
) {
  if (exerciseMode === "free" || shapeCount === 0) {
    return null;
  }

  if (exerciseMode === "sequential" || shapeCount === 1) {
    return movementStep % shapeCount;
  }

  if (movementStep === 0 || movementStep % anchorReturnInterval === 0) {
    return 0;
  }

  return ((movementStep - 1) % (shapeCount - 1)) + 1;
}

function getExerciseLabel(exerciseMode: ExerciseMode) {
  if (exerciseMode === "sequential") {
    return "Sequential";
  }

  if (exerciseMode === "anchor-return") {
    return "Anchor return";
  }

  return "Free";
}

export default function App() {
  const [shapeCount, setShapeCount] = useState(40);
  const [seed, setSeed] = useState(() => randomSeed());
  const [boardWidth, setBoardWidth] = useState(DEFAULT_BOARD_WIDTH);
  const [boardHeight, setBoardHeight] = useState(DEFAULT_BOARD_HEIGHT);
  const [showBorder, setShowBorder] = useState(true);
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
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [pulseToken, setPulseToken] = useState(0);
  const [lastPulseAccent, setLastPulseAccent] = useState(false);
  const alertTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
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
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isMetronomeRunning) {
      return;
    }

    const intervalMs = 60_000 / bpm;
    intervalRef.current = window.setInterval(() => {
      setBeatCount((count) => count + 1);
    }, intervalMs);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMetronomeRunning, bpm]);

  useEffect(() => {
    if (!isMetronomeRunning || beatCount === 0) {
      return;
    }

    const accent = accentFirstBeat && ((beatCount - 1) % beatsPerBar === 0);

    if (audioEnabled) {
      playMetronomeTick(audioContextRef.current, accent);
    }

    if (visualPulseEnabled) {
      setLastPulseAccent(accent);
      setPulseToken((token) => token + 1);
    }
  }, [
    accentFirstBeat,
    audioEnabled,
    beatCount,
    beatsPerBar,
    isMetronomeRunning,
    visualPulseEnabled,
  ]);

  useEffect(() => {
    setBeatCount(0);
  }, [anchorReturnInterval, beatsPerTarget, exerciseMode, seed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }

      if (audioContextRef.current !== null) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  const effectiveLabelType = exerciseMode !== "free" ? "number" : labelType;
  const effectiveShowLabels = showLabels || exerciseMode !== "free";

  const shapes = useMemo(
    () => generateShapes(shapeCount, seed, boardWidth, boardHeight),
    [shapeCount, seed, boardWidth, boardHeight],
  );

  const labels = useMemo(
    () => generateLabels(shapeCount, seed, effectiveLabelType),
    [effectiveLabelType, seed, shapeCount],
  );

  const movementStep = Math.floor(beatCount / beatsPerTarget);
  const currentTargetIndex = getCurrentTargetIndex(
    exerciseMode,
    movementStep,
    shapes.length,
    anchorReturnInterval,
  );
  const anchorIndex = exerciseMode === "anchor-return" ? 0 : null;
  const currentBeatInBar =
    beatCount === 0 ? 1 : ((beatCount - 1) % beatsPerBar) + 1;
  const beatsUntilShift =
    exerciseMode !== "free"
      ? beatsPerTarget - (beatCount % beatsPerTarget || beatsPerTarget)
      : null;

  function regenerateBoard() {
    setSeed(randomSeed());
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
    setBeatCount(0);
    setPulseToken(0);
    setIsMetronomeRunning(true);
  }

  function handleAudioToggle(nextValue: boolean) {
    setAudioEnabled(nextValue);

    if (nextValue) {
      ensureAudioContext();
    }
  }

  return (
    <main className="app-shell">
      <section className="app-card">
        <header className="hero">
          <div>
            <p className="eyebrow">Pass 3: Metronome Foundation</p>
            <h1>Random Shape Whiteboard</h1>
            <p className="hero-copy">
              The board can now run as a paced visual attention surface. Use the
              optional metronome to scaffold sequential stepping one target at a
              time, without turning the experience into a rhythm game.
            </p>
          </div>
          <button className="board-button" onClick={regenerateBoard}>
            New board (N or Ctrl/Cmd+Enter)
          </button>
        </header>

        <section className="controls" aria-label="Board controls">
          <div className="controls-grid">
            <div className="metronome-strip">
              <div className="metronome-copy">
                <p className="metronome-kicker">Pacing scaffold</p>
                <strong>
                  {isMetronomeRunning ? "Metronome running" : "Metronome stopped"}
                </strong>
                <span>
                  {exerciseMode === "free"
                    ? "Free practice mode with optional beat support."
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
                  </select>
                </label>

                <label className="select-field" htmlFor="beats-per-target">
                  <span>Pacing</span>
                  <select
                    id="beats-per-target"
                    value={String(beatsPerTarget)}
                    disabled={exerciseMode === "free"}
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
              </div>
            </div>

            <RangeControl
              label="Tempo"
              output={`${bpm} BPM`}
              inputId="bpm"
              rangeId="bpm-range"
              value={bpm}
              min={MIN_BPM}
              max={MAX_BPM}
              step={1}
              onChange={(value) => setBpm(Math.round(value))}
            />

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
                  checked={showBorder}
                  onChange={(event) => setShowBorder(event.target.checked)}
                />
                <span>Add border to shapes</span>
              </label>

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

        <section className="board-frame" aria-label="Generated whiteboard">
          <div className="board-meta">
            <span>Board {boardWidth} x {boardHeight}</span>
            <span>
              {shapeCount} shapes • {gridMode === "none" ? "no grid" : `${gridMode} grid`}
              {effectiveShowLabels ? ` • labels: ${effectiveLabelType}` : ""}
              {exerciseMode !== "free"
                ? ` • target ${currentTargetIndex !== null ? currentTargetIndex + 1 : 1}`
                : ""}
              {exerciseMode === "anchor-return" ? " • anchor 1" : ""}
            </span>
          </div>
          <div className="board-stage">
            {visualPulseEnabled && isMetronomeRunning ? (
              <div
                key={pulseToken}
                className={`beat-pulse${lastPulseAccent ? " is-accent" : ""}`}
              />
            ) : null}
            {showAlert ? (
              <div className="board-alert" role="status" aria-live="polite">
                Alert #{alertCount}
              </div>
            ) : null}
            <div
              className="board-surface"
              style={{ aspectRatio: `${boardWidth} / ${boardHeight}` }}
            >
              <svg
                viewBox={`0 0 ${boardWidth} ${boardHeight}`}
                role="img"
                aria-label={`Whiteboard containing ${shapeCount} random shapes`}
                preserveAspectRatio="xMidYMid meet"
              >
                <rect width={boardWidth} height={boardHeight} fill="#fffdf8" />
                <GridPattern
                  mode={gridMode}
                  width={boardWidth}
                  height={boardHeight}
                  opacity={gridOpacity}
                />
                {shapes.map((shape, index) => (
                  <ShapeMark
                    key={shape.id}
                    shape={shape}
                    showBorder={showBorder}
                    highlighted={currentTargetIndex === index}
                    anchored={anchorIndex === index}
                  />
                ))}
                {effectiveShowLabels
                  ? shapes.map((shape, index) => (
                      <ShapeLabel
                        key={`label-${shape.id}`}
                        shape={shape}
                        label={labels[index] ?? ""}
                        active={currentTargetIndex === index}
                        anchored={anchorIndex === index}
                      />
                    ))
                  : null}
              </svg>
            </div>
          </div>
        </section>
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

function GridPattern({
  mode,
  width,
  height,
  opacity,
}: {
  mode: GridMode;
  width: number;
  height: number;
  opacity: number;
}) {
  if (mode === "none") {
    return null;
  }

  if (mode === "square") {
    return <SquareGrid width={width} height={height} opacity={opacity} />;
  }

  return <HexGrid width={width} height={height} opacity={opacity} />;
}

function SquareGrid({
  width,
  height,
  opacity,
}: {
  width: number;
  height: number;
  opacity: number;
}) {
  const spacing = clampInt(String(Math.round(Math.min(width, height) / 24)), 28, 72);
  const columns = Math.floor(width / spacing);
  const rows = Math.floor(height / spacing);

  return (
    <g opacity={opacity} stroke="#94a3b8" strokeWidth="1">
      {Array.from({ length: columns }, (_, index) => {
        const x = (index + 1) * spacing;
        return <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} />;
      })}
      {Array.from({ length: rows }, (_, index) => {
        const y = (index + 1) * spacing;
        return <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} />;
      })}
    </g>
  );
}

function HexGrid({
  width,
  height,
  opacity,
}: {
  width: number;
  height: number;
  opacity: number;
}) {
  const size = clampInt(String(Math.round(Math.min(width, height) / 34)), 18, 34);
  const hexWidth = Math.sqrt(3) * size;
  const verticalStep = size * 1.5;
  const rows = Math.ceil(height / verticalStep) + 2;
  const columns = Math.ceil(width / hexWidth) + 2;

  return (
    <g opacity={opacity} fill="none" stroke="#94a3b8" strokeWidth="1">
      {Array.from({ length: rows }, (_, rowIndex) => {
        const y = rowIndex * verticalStep - size;
        const rowOffset = rowIndex % 2 === 0 ? 0 : hexWidth / 2;

        return Array.from({ length: columns }, (_, columnIndex) => {
          const x = columnIndex * hexWidth - hexWidth + rowOffset;
          return (
            <polygon
              key={`hex-${rowIndex}-${columnIndex}`}
              points={polygonPoints(6, size, x, y, Math.PI / 6)}
            />
          );
        });
      })}
    </g>
  );
}

function ShapeMark({
  shape,
  showBorder,
  highlighted,
  anchored,
}: {
  shape: Shape;
  showBorder: boolean;
  highlighted: boolean;
  anchored: boolean;
}) {
  const borderProps = showBorder
    ? { stroke: "#243041", strokeWidth: 4, strokeLinejoin: "round" as const }
    : undefined;

  return (
    <g transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation})`}>
      {highlighted ? (
        <ShapeHalo shape={shape} variant="active" />
      ) : anchored ? (
        <ShapeHalo shape={shape} variant="anchor" />
      ) : null}
      {shape.type === "circle" ? (
        <circle r={shape.radius} fill={shape.color} {...borderProps} />
      ) : null}
      {shape.type === "rectangle" ? (
        <rect
          x={-shape.width / 2}
          y={-shape.height / 2}
          width={shape.width}
          height={shape.height}
          rx="12"
          fill={shape.color}
          {...borderProps}
        />
      ) : null}
      {shape.type === "triangle" ? (
        <polygon
          points={trianglePoints(shape.width, shape.height)}
          fill={shape.color}
          {...borderProps}
        />
      ) : null}
      {shape.type === "pentagon" ? (
        <polygon
          points={polygonPoints(5, shape.width / 2)}
          fill={shape.color}
          {...borderProps}
        />
      ) : null}
      {shape.type === "hexagon" ? (
        <polygon
          points={polygonPoints(6, shape.width / 2)}
          fill={shape.color}
          {...borderProps}
        />
      ) : null}
      <circle r="8" fill="#111111" />
    </g>
  );
}

function ShapeHalo({
  shape,
  variant,
}: {
  shape: Shape;
  variant: "active" | "anchor";
}) {
  const stroke =
    variant === "active"
      ? "rgba(31, 141, 108, 0.35)"
      : "rgba(245, 159, 0, 0.36)";
  const strokeWidth = variant === "active" ? 18 : 10;
  const strokeDasharray = variant === "anchor" ? "16 12" : undefined;

  if (shape.type === "circle") {
    return (
      <circle
        r={shape.radius + 18}
        fill="none"
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (shape.type === "rectangle") {
    return (
      <rect
        x={-shape.width / 2 - 12}
        y={-shape.height / 2 - 12}
        width={shape.width + 24}
        height={shape.height + 24}
        rx="18"
        fill="none"
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <polygon
      points={
        shape.type === "triangle"
          ? trianglePoints(shape.width + 22, shape.height + 22)
          : polygonPoints(
              shape.type === "pentagon" ? 5 : 6,
              shape.width / 2 + 16,
            )
      }
      fill="none"
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}

function ShapeLabel({
  shape,
  label,
  active,
  anchored,
}: {
  shape: Shape;
  label: string;
  active: boolean;
  anchored: boolean;
}) {
  const centerY = shape.y + getLabelOffset(shape);
  const pillWidth = Math.max(86, label.length * LABEL_FONT_SIZE * 0.64 + 28);
  const pillHeight = 34;

  return (
    <g className="label-mark">
      <rect
        x={shape.x - pillWidth / 2}
        y={centerY - pillHeight / 2}
        width={pillWidth}
        height={pillHeight}
        rx={pillHeight / 2}
        fill={
          active
            ? "rgba(227, 247, 241, 0.98)"
            : anchored
              ? "rgba(255, 246, 224, 0.98)"
              : "rgba(255, 255, 255, 0.9)"
        }
        stroke={
          active
            ? "rgba(20, 96, 76, 0.32)"
            : anchored
              ? "rgba(245, 159, 0, 0.32)"
              : "rgba(36, 48, 65, 0.12)"
        }
      />
      <text
        x={shape.x}
        y={centerY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={LABEL_FONT_SIZE}
        fontWeight="600"
        fill={active ? "#155c49" : anchored ? "#7c4f08" : "#233043"}
      >
        {label}
      </text>
    </g>
  );
}

function trianglePoints(width: number, height: number) {
  return [
    `0 ${-height / 2}`,
    `${width / 2} ${height / 2}`,
    `${-width / 2} ${height / 2}`,
  ].join(" ");
}

function polygonPoints(
  sides: number,
  radius: number,
  offsetX = 0,
  offsetY = 0,
  initialAngle = -Math.PI / 2,
) {
  return Array.from({ length: sides }, (_, index) => {
    const angle = initialAngle + (index * Math.PI * 2) / sides;
    const x = offsetX + Math.cos(angle) * radius;
    const y = offsetY + Math.sin(angle) * radius;
    return `${x} ${y}`;
  }).join(" ");
}

function generateShapes(
  count: number,
  seed: number,
  boardWidth: number,
  boardHeight: number,
) {
  const random = mulberry32(seed);
  const shapeTypes: ShapeType[] = [
    "circle",
    "rectangle",
    "triangle",
    "pentagon",
    "hexagon",
  ];
  const padding = clampInt(
    String(Math.round(Math.min(boardWidth, boardHeight) * 0.055)),
    42,
    120,
  );

  return Array.from({ length: count }, (_, index) => {
    const type = shapeTypes[Math.floor(random() * shapeTypes.length)]!;
    const x = lerp(padding, boardWidth - padding, random());
    const y = lerp(padding, boardHeight - padding, random());
    const rotation = Math.round(random() * 360);
    const color = palette[Math.floor(random() * palette.length)]!;
    const scale = Math.min(boardWidth, boardHeight) / DEFAULT_BOARD_HEIGHT;

    if (type === "circle") {
      return {
        type,
        id: `shape-${index}`,
        x,
        y,
        rotation,
        color,
        radius: lerp(24, 68, random()) * scale,
      } satisfies Shape;
    }

    if (type === "rectangle") {
      return {
        type,
        id: `shape-${index}`,
        x,
        y,
        rotation,
        color,
        width: lerp(64, 162, random()) * scale,
        height: lerp(44, 124, random()) * scale,
      } satisfies Shape;
    }

    const baseSize = lerp(72, 150, random()) * scale;
    return {
      type,
      id: `shape-${index}`,
      x,
      y,
      rotation,
      color,
      width: baseSize,
      height: baseSize,
    } satisfies Shape;
  });
}

function generateLabels(count: number, seed: number, labelType: LabelType) {
  const random = mulberry32(seed ^ 0x9e3779b9);

  return Array.from({ length: count }, (_, index) => {
    if (labelType === "number") {
      return String(index + 1);
    }

    return wordBank[Math.floor(random() * wordBank.length)] ?? "signal";
  });
}

function getLabelOffset(shape: Shape) {
  if (shape.type === "circle") {
    return shape.radius + 28;
  }

  if (shape.type === "rectangle") {
    return shape.height / 2 + 28;
  }

  return Math.max(shape.width, shape.height) / 2 + 28;
}

function normalizeAlertWindow(min: number, max: number) {
  const lower = Math.max(MIN_ALERT_SECONDS, Math.min(min, max));
  const upper = Math.min(
    MAX_ALERT_SECONDS,
    Math.max(lower + 0.1, Math.max(min, max)),
  );

  return [lower, upper] as const;
}

function playMetronomeTick(
  audioContext: AudioContext | null,
  isAccent: boolean,
) {
  if (!audioContext) {
    return;
  }

  const startAt = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(isAccent ? 1046 : 784, startAt);
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.18, startAt + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.09);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.1);
}

function clampFloat(value: string, min: number, max: number) {
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.max(min, Math.min(max, parsed));
}

function clampInt(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.max(min, Math.min(max, parsed));
}

function lerp(min: number, max: number, amount: number) {
  return min + (max - min) * amount;
}

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
