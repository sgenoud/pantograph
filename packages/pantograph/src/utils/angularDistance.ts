export function angularDistance(
  angle1: number,
  angle2: number,
  clockwise: boolean,
  precision = 1e-9
) {
  let relDistance = angle2 - angle1;

  if (clockwise) {
    relDistance = -relDistance;
  }

  if (relDistance < 0) {
    relDistance += 2 * Math.PI;
  }

  if (relDistance > 2 * Math.PI - precision) {
    return 0;
  }

  return relDistance;
}
