export function practicePhase(id, elapsed) {
  const phases = id === 'box_breathing' ? [['inhale', 4], ['hold', 4], ['exhale', 4], ['rest', 4]]
    : id === '478_breathing' ? [['inhale', 4], ['hold', 7], ['exhale', 8]] : null;
  if (!phases) return null;
  let second = Math.floor(elapsed) % phases.reduce((sum, [, duration]) => sum + duration, 0);
  for (const [name, duration] of phases) { if (second < duration) return { name, remaining: duration - second }; second -= duration; }
}
export function practiceElapsed(elapsed, delta, running, duration) {
  return running && Number.isFinite(delta) && delta > 0 ? Math.min(duration, elapsed + delta) : elapsed;
}
export function audioPracticeDelta(previousPosition, status) {
  if (previousPosition == null || !status.isLoaded || !status.isPlaying || status.isBuffering) return 0;
  const milliseconds = status.positionMillis >= previousPosition ? status.positionMillis - previousPosition
    : status.didJustFinish && status.durationMillis ? status.durationMillis - previousPosition + status.positionMillis : 0;
  return Math.max(0, milliseconds / 1000);
}
