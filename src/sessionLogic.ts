import { MAX_ALERT_SECONDS, MAX_BPM, MIN_ALERT_SECONDS } from "./config";
import type { TempoLadderIntervalSeconds, TempoLadderStepBpm } from "./types";

export function formatSessionTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function formatTempoLadderInterval(seconds: number) {
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const minutes = seconds / 60;
  return `${minutes} min`;
}

export function getTempoLadderBpm(
  baseBpm: number,
  stepBpm: TempoLadderStepBpm,
  intervalSeconds: TempoLadderIntervalSeconds,
  elapsedSeconds: number,
) {
  const stageIndex = Math.max(0, Math.floor(elapsedSeconds / intervalSeconds));

  return Math.min(MAX_BPM, baseBpm + stageIndex * stepBpm);
}

export function normalizeAlertWindow(min: number, max: number) {
  const lower = Math.max(MIN_ALERT_SECONDS, Math.min(min, max));
  const upper = Math.min(
    MAX_ALERT_SECONDS,
    Math.max(lower + 0.1, Math.max(min, max)),
  );

  return [lower, upper] as const;
}
