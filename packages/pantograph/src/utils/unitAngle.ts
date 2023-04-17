// makes sure the angle is in one unit circle
export function unitAngle(angle: number) {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }
  if (angle >= 2 * Math.PI) {
    return angle % (2 * Math.PI);
  }
  return angle;
}
