import {
  DEFAULT_BOARD_HEIGHT,
  paletteThemes,
  shapeTypeOptions,
  wordBank,
} from "./config";
import { clampInt, lerp, mulberry32 } from "./math";
import type {
  LabelType,
  PaletteTheme,
  RotationMode,
  Shape,
  ShapeSizeMode,
  ShapeType,
} from "./types";

export function trianglePoints(width: number, height: number) {
  return [
    `0 ${-height / 2}`,
    `${width / 2} ${height / 2}`,
    `${-width / 2} ${height / 2}`,
  ].join(" ");
}

export function polygonPoints(
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

export function starPoints(radius: number) {
  const innerRadius = radius * 0.48;

  return Array.from({ length: 10 }, (_, index) => {
    const activeRadius = index % 2 === 0 ? radius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const x = Math.cos(angle) * activeRadius;
    const y = Math.sin(angle) * activeRadius;
    return `${x} ${y}`;
  }).join(" ");
}

export function generateShapes(
  count: number,
  seed: number,
  boardWidth: number,
  boardHeight: number,
  enabledTypes: ShapeType[],
  paletteTheme: PaletteTheme,
  sizeMode: ShapeSizeMode,
  rotationMode: RotationMode,
) {
  const random = mulberry32(seed);
  const shapeTypes =
    enabledTypes.length > 0
      ? enabledTypes
      : shapeTypeOptions.map(({ type }) => type);
  const palette = paletteThemes[paletteTheme];
  const padding = clampInt(
    String(Math.round(Math.min(boardWidth, boardHeight) * 0.055)),
    42,
    120,
  );

  return Array.from({ length: count }, (_, index) => {
    const type = shapeTypes[Math.floor(random() * shapeTypes.length)]!;
    const x = lerp(padding, boardWidth - padding, random());
    const y = lerp(padding, boardHeight - padding, random());
    const rotation = getShapeRotation(random, rotationMode);
    const color = palette[Math.floor(random() * palette.length)]!;
    const scale =
      (Math.min(boardWidth, boardHeight) / DEFAULT_BOARD_HEIGHT) *
      getShapeSizeScale(random, sizeMode);

    if (type === "circle" || type === "ring") {
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

    if (type === "rectangle" || type === "capsule") {
      return {
        type,
        id: `shape-${index}`,
        x,
        y,
        rotation,
        color,
        width: lerp(type === "capsule" ? 92 : 64, 168, random()) * scale,
        height: lerp(type === "capsule" ? 42 : 44, 118, random()) * scale,
      } satisfies Shape;
    }

    const baseSize = lerp(type === "star" ? 80 : 72, 150, random()) * scale;
    return {
      type,
      id: `shape-${index}`,
      x,
      y,
      rotation,
      color,
      width: baseSize,
      height: type === "triangle" ? baseSize * 0.9 : baseSize,
    } satisfies Shape;
  });
}

export function getShapeRotation(
  random: () => number,
  rotationMode: RotationMode,
) {
  if (rotationMode === "none") {
    return 0;
  }

  if (rotationMode === "subtle") {
    return Math.round(lerp(-18, 18, random()));
  }

  return Math.round(random() * 360);
}

export function getShapeSizeScale(
  random: () => number,
  sizeMode: ShapeSizeMode,
) {
  if (sizeMode === "small") {
    return 0.72;
  }

  if (sizeMode === "medium") {
    return 0.96;
  }

  if (sizeMode === "large") {
    return 1.24;
  }

  return lerp(0.62, 1.32, random());
}

export function generateLabels(
  count: number,
  seed: number,
  labelType: LabelType,
) {
  const random = mulberry32(seed ^ 0x9e3779b9);

  return Array.from({ length: count }, (_, index) => {
    if (labelType === "number") {
      return String(index + 1);
    }

    return wordBank[Math.floor(random() * wordBank.length)] ?? "signal";
  });
}

export function getLabelOffset(shape: Shape) {
  if ("radius" in shape) {
    return shape.radius + 28;
  }

  if (shape.type === "rectangle") {
    return shape.height / 2 + 28;
  }

  return Math.max(shape.width, shape.height) / 2 + 28;
}
