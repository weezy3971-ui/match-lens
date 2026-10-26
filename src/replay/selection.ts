export type PointerSample = { x: number; y: number };

export function isClickGesture(start: PointerSample, end: PointerSample, maximumMovementPixels = 6) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= maximumMovementPixels;
}
