// makes sure the angle is in one unit circle
export function unitAngle(angle: number, precision = 1e-9) {
  if (angle < 0) {
    return angle + 2 * Math.PI;
  }
  if (angle >= 2 * Math.PI) {
    return angle % (2 * Math.PI);
  }

  if (angle > 2 * Math.PI - precision) {
    return 0;
  }

  return angle;
}
