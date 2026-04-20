export function playMetronomeTick(
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
