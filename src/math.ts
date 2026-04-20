export function clampFloat(value: string, min: number, max: number) {
  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.max(min, Math.min(max, parsed));
}

export function clampInt(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.max(min, Math.min(max, parsed));
}

export function lerp(min: number, max: number, amount: number) {
  return min + (max - min) * amount;
}

export function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
