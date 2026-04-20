import { LABEL_FONT_SIZE } from "../config";
import { getAlternatingPatternLabel, getMemoryPhaseLabel } from "../exerciseLogic";
import { clampInt } from "../math";
import {
  getLabelOffset,
  polygonPoints,
  starPoints,
  trianglePoints,
} from "../shapeLogic";
import type {
  AlternatingPattern,
  BorderStyleMode,
  CenterMarkerStyle,
  CornerStyle,
  ExerciseMode,
  FillStyle,
  GridMode,
  LabelType,
  MemoryPhase,
  Shape,
} from "../types";

type WhiteboardProps = {
  boardWidth: number;
  boardHeight: number;
  shapeCount: number;
  enabledShapeTypeCount: number;
  paletteTheme: string;
  gridMode: GridMode;
  gridOpacity: number;
  effectiveShowLabels: boolean;
  effectiveLabelType: LabelType;
  exerciseMode: ExerciseMode;
  currentTargetIndex: number | null;
  anchorIndex: number | null;
  alternatingPattern: AlternatingPattern;
  memoryPhase: MemoryPhase;
  memoryRecallIndex: number;
  memorySequenceLength: number;
  visualPulseEnabled: boolean;
  isMetronomeRunning: boolean;
  pulseToken: number;
  lastPulseAccent: boolean;
  showAlert: boolean;
  alertCount: number;
  responseFeedback: {
    kind: "correct" | "incorrect";
    message: string;
    token: number;
  } | null;
  shapes: Shape[];
  labels: string[];
  responseTrackingEnabled: boolean;
  borderStyleMode: BorderStyleMode;
  borderColor: string;
  cornerStyle: CornerStyle;
  fillStyle: FillStyle;
  fillOpacity: number;
  centerMarkerStyle: CenterMarkerStyle;
  centerMarkerSize: number;
  centerMarkerColor: string;
  onShapeSelect: (index: number) => void;
};

export function Whiteboard({
  boardWidth,
  boardHeight,
  shapeCount,
  enabledShapeTypeCount,
  paletteTheme,
  gridMode,
  gridOpacity,
  effectiveShowLabels,
  effectiveLabelType,
  exerciseMode,
  currentTargetIndex,
  anchorIndex,
  alternatingPattern,
  memoryPhase,
  memoryRecallIndex,
  memorySequenceLength,
  visualPulseEnabled,
  isMetronomeRunning,
  pulseToken,
  lastPulseAccent,
  showAlert,
  alertCount,
  responseFeedback,
  shapes,
  labels,
  responseTrackingEnabled,
  borderStyleMode,
  borderColor,
  cornerStyle,
  fillStyle,
  fillOpacity,
  centerMarkerStyle,
  centerMarkerSize,
  centerMarkerColor,
  onShapeSelect,
}: WhiteboardProps) {
  return (
    <section className="board-frame" aria-label="Generated whiteboard">
      <div className="board-meta">
        <span>Board {boardWidth} x {boardHeight}</span>
        <span>
          {shapeCount} shapes • {enabledShapeTypeCount} types • {paletteTheme}
          {" palette"} • {gridMode === "none" ? "no grid" : `${gridMode} grid`}
          {effectiveShowLabels ? ` • labels: ${effectiveLabelType}` : ""}
          {exerciseMode !== "free"
            ? currentTargetIndex !== null
              ? ` • target ${currentTargetIndex + 1}`
              : ""
            : ""}
          {exerciseMode === "anchor-return" ? " • anchor 1" : ""}
          {exerciseMode === "alternating-feature"
            ? ` • ${getAlternatingPatternLabel(alternatingPattern)}`
            : ""}
          {exerciseMode === "memory-replay"
            ? ` • ${getMemoryPhaseLabel(memoryPhase, memoryRecallIndex, memorySequenceLength)}`
            : ""}
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
        {responseFeedback ? (
          <div
            key={responseFeedback.token}
            className={`response-feedback is-${responseFeedback.kind}`}
            role="status"
            aria-live="polite"
          >
            {responseFeedback.message}
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
                borderStyleMode={borderStyleMode}
                borderColor={borderColor}
                cornerStyle={cornerStyle}
                fillStyle={fillStyle}
                fillOpacity={fillOpacity}
                centerMarkerStyle={centerMarkerStyle}
                centerMarkerSize={centerMarkerSize}
                centerMarkerColor={centerMarkerColor}
                highlighted={currentTargetIndex === index}
                anchored={anchorIndex === index}
                selectable={
                  responseTrackingEnabled &&
                  exerciseMode !== "free" &&
                  (exerciseMode !== "memory-replay" || memoryPhase === "recall")
                }
                onSelect={() => onShapeSelect(index)}
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
  borderStyleMode,
  borderColor,
  cornerStyle,
  fillStyle,
  fillOpacity,
  centerMarkerStyle,
  centerMarkerSize,
  centerMarkerColor,
  highlighted,
  anchored,
  selectable,
  onSelect,
}: {
  shape: Shape;
  borderStyleMode: BorderStyleMode;
  borderColor: string;
  cornerStyle: CornerStyle;
  fillStyle: FillStyle;
  fillOpacity: number;
  centerMarkerStyle: CenterMarkerStyle;
  centerMarkerSize: number;
  centerMarkerColor: string;
  highlighted: boolean;
  anchored: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  const borderProps = getShapeBorderProps(
    borderStyleMode,
    borderColor,
    fillStyle,
    shape.color,
  );
  const fillProps = getShapeFillProps(shape.color, fillStyle, fillOpacity);
  const cornerRadius = getCornerRadius(shape, cornerStyle);

  return (
    <g
      className={selectable ? "shape-mark is-selectable" : "shape-mark"}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation})`}
      onClick={selectable ? onSelect : undefined}
      onKeyDown={
        selectable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      {highlighted ? (
        <ShapeHalo shape={shape} variant="active" />
      ) : anchored ? (
        <ShapeHalo shape={shape} variant="anchor" />
      ) : null}
      {shape.type === "circle" ? (
        <circle r={shape.radius} {...fillProps} {...borderProps} />
      ) : null}
      {shape.type === "ring" ? (
        <>
          <circle r={shape.radius} {...fillProps} {...borderProps} />
          <circle
            r={shape.radius * 0.54}
            fill="#fffdf8"
            stroke={borderStyleMode === "none" ? shape.color : borderColor}
            strokeWidth={borderStyleMode === "none" ? 0 : 3}
          />
        </>
      ) : null}
      {shape.type === "rectangle" ? (
        <rect
          x={-shape.width / 2}
          y={-shape.height / 2}
          width={shape.width}
          height={shape.height}
          rx={cornerRadius}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "capsule" ? (
        <rect
          x={-shape.width / 2}
          y={-shape.height / 2}
          width={shape.width}
          height={shape.height}
          rx={cornerRadius}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "triangle" ? (
        <polygon
          points={trianglePoints(shape.width, shape.height)}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "diamond" ? (
        <polygon
          points={polygonPoints(4, shape.width / 2)}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "star" ? (
        <polygon
          points={starPoints(shape.width / 2)}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "pentagon" ? (
        <polygon
          points={polygonPoints(5, shape.width / 2)}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      {shape.type === "hexagon" ? (
        <polygon
          points={polygonPoints(6, shape.width / 2)}
          {...fillProps}
          {...borderProps}
        />
      ) : null}
      <CenterMarker
        styleMode={centerMarkerStyle}
        size={centerMarkerSize}
        color={centerMarkerColor}
      />
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

  if ("radius" in shape) {
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

  if (shape.type === "rectangle" || shape.type === "capsule") {
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
      points={getPolygonHaloPoints(shape)}
      fill="none"
      stroke={stroke}
      strokeDasharray={strokeDasharray}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}

function getPolygonHaloPoints(shape: Exclude<Shape, { type: "circle" | "ring" }>) {
  if (shape.type === "triangle") {
    return trianglePoints(shape.width + 22, shape.height + 22);
  }

  if (shape.type === "diamond") {
    return polygonPoints(4, shape.width / 2 + 16);
  }

  if (shape.type === "star") {
    return starPoints(shape.width / 2 + 18);
  }

  return polygonPoints(shape.type === "pentagon" ? 5 : 6, shape.width / 2 + 16);
}

function CenterMarker({
  styleMode,
  size,
  color,
}: {
  styleMode: CenterMarkerStyle;
  size: number;
  color: string;
}) {
  if (styleMode === "none") {
    return null;
  }

  if (styleMode === "ring") {
    return (
      <circle
        r={size}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(2, size * 0.28)}
      />
    );
  }

  if (styleMode === "crosshair") {
    const arm = size * 1.3;
    const strokeWidth = Math.max(2, size * 0.25);

    return (
      <g stroke={color} strokeLinecap="round" strokeWidth={strokeWidth}>
        <line x1={-arm} y1={0} x2={arm} y2={0} />
        <line x1={0} y1={-arm} x2={0} y2={arm} />
        <circle r={Math.max(1.5, size * 0.28)} fill={color} stroke="none" />
      </g>
    );
  }

  return <circle r={size} fill={color} />;
}

function getShapeBorderProps(
  borderStyleMode: BorderStyleMode,
  borderColor: string,
  fillStyle: FillStyle,
  shapeColor: string,
) {
  if (borderStyleMode === "none" && fillStyle !== "outline") {
    return undefined;
  }

  const strokeWidth =
    borderStyleMode === "thin"
      ? 2
      : borderStyleMode === "bold"
        ? 7
        : borderStyleMode === "dashed"
          ? 4
          : 4;

  return {
    stroke: borderStyleMode === "none" ? shapeColor : borderColor,
    strokeDasharray: borderStyleMode === "dashed" ? "14 10" : undefined,
    strokeLinejoin: "round" as const,
    strokeWidth,
  };
}

function getShapeFillProps(
  color: string,
  fillStyle: FillStyle,
  fillOpacity: number,
) {
  if (fillStyle === "outline") {
    return { fill: "none" };
  }

  return {
    fill: color,
    fillOpacity: fillStyle === "translucent" ? fillOpacity : 1,
  };
}

function getCornerRadius(shape: Shape, cornerStyle: CornerStyle) {
  if (!("width" in shape)) {
    return 0;
  }

  if (shape.type === "capsule") {
    return shape.height / 2;
  }

  if (cornerStyle === "sharp") {
    return 0;
  }

  if (cornerStyle === "round") {
    return Math.min(shape.width, shape.height) * 0.32;
  }

  return Math.min(14, Math.min(shape.width, shape.height) * 0.18);
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
