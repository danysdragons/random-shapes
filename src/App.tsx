import { useEffect, useMemo, useState } from "react";

const DEFAULT_BOARD_WIDTH = 1600;
const DEFAULT_BOARD_HEIGHT = 960;
const MIN_BOARD_WIDTH = 400;
const MAX_BOARD_WIDTH = 4000;
const MIN_BOARD_HEIGHT = 300;
const MAX_BOARD_HEIGHT = 3000;
const MIN_SHAPES = 5;
const MAX_SHAPES = 250;

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

type ShapeType = "circle" | "rectangle" | "triangle" | "pentagon" | "hexagon";
type GridMode = "none" | "square" | "hex";

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

export default function App() {
  const [shapeCount, setShapeCount] = useState(40);
  const [seed, setSeed] = useState(() => randomSeed());
  const [boardWidth, setBoardWidth] = useState(DEFAULT_BOARD_WIDTH);
  const [boardHeight, setBoardHeight] = useState(DEFAULT_BOARD_HEIGHT);
  const [showBorder, setShowBorder] = useState(true);
  const [gridMode, setGridMode] = useState<GridMode>("none");
  const [gridOpacity, setGridOpacity] = useState(0.35);

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

  const shapes = useMemo(
    () => generateShapes(shapeCount, seed, boardWidth, boardHeight),
    [shapeCount, seed, boardWidth, boardHeight],
  );

  return (
    <main className="app-shell">
      <section className="app-card">
        <header className="hero">
          <div>
            <p className="eyebrow">Pass 1: Layout, Dimensions, Grid</p>
            <h1>Random Shape Whiteboard</h1>
            <p className="hero-copy">
              Tune the board dimensions, toggle borders, and switch between no
              grid, square grid, or hexagonal grid. The board sits below the
              controls and stretches wider to use the available space.
            </p>
          </div>
          <button className="board-button" onClick={() => setSeed(randomSeed())}>
            New board
          </button>
        </header>

        <section className="controls" aria-label="Board controls">
          <div className="controls-grid">
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

            <DimensionControl
              label="Width"
              value={boardWidth}
              min={MIN_BOARD_WIDTH}
              max={MAX_BOARD_WIDTH}
              step={10}
              inputId="board-width"
              rangeId="board-width-range"
              onChange={setBoardWidth}
            />

            <DimensionControl
              label="Height"
              value={boardHeight}
              min={MIN_BOARD_HEIGHT}
              max={MAX_BOARD_HEIGHT}
              step={10}
              inputId="board-height"
              rangeId="board-height-range"
              onChange={setBoardHeight}
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
            </div>

            <div className="control-block">
              <div className="control-label-row">
                <label htmlFor="grid-opacity">Grid faintness</label>
                <output htmlFor="grid-opacity">{gridOpacity.toFixed(2)}</output>
              </div>
              <div className="paired-inputs">
                <input
                  id="grid-opacity"
                  className="number-input"
                  type="number"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={gridOpacity}
                  disabled={gridMode === "none"}
                  onChange={(event) =>
                    setGridOpacity(clampFloat(event.target.value, 0.05, 1))
                  }
                />
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={gridOpacity}
                  disabled={gridMode === "none"}
                  onChange={(event) =>
                    setGridOpacity(clampFloat(event.target.value, 0.05, 1))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="board-frame" aria-label="Generated whiteboard">
          <div className="board-meta">
            <span>Board {boardWidth} x {boardHeight}</span>
            <span>
              {shapeCount} shapes • {gridMode === "none" ? "no grid" : `${gridMode} grid`}
            </span>
          </div>
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
              {shapes.map((shape) => (
                <ShapeMark key={shape.id} shape={shape} showBorder={showBorder} />
              ))}
            </svg>
          </div>
        </section>
      </section>
    </main>
  );
}

function DimensionControl({
  label,
  value,
  min,
  max,
  step,
  inputId,
  rangeId,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  inputId: string;
  rangeId: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="control-block">
      <div className="control-label-row">
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={`${inputId} ${rangeId}`}>{value}px</output>
      </div>
      <div className="paired-inputs">
        <input
          id={inputId}
          className="number-input"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(clampInt(event.target.value, min, max))}
        />
        <input
          id={rangeId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(clampInt(event.target.value, min, max))}
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
}: {
  shape: Shape;
  showBorder: boolean;
}) {
  const borderProps = showBorder
    ? { stroke: "#243041", strokeWidth: 4, strokeLinejoin: "round" as const }
    : undefined;

  return (
    <g transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation})`}>
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
