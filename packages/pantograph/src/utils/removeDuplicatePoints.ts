import type { Vector } from "../definitions";

const asFixed = (p: number, precision = 1e-9): string => {
  let num = p;
  if (Math.abs(p) < precision) num = 0;
  return num.toFixed(-Math.log10(precision));
};
export default function removeDuplicatePoints(
  points: Vector[],
  precision = 1e-9
): Vector[] {
  return Array.from(
    new Map(
      points.map(([p0, p1]) => [
        `[${asFixed(p0, precision)},${asFixed(p1, precision)}]`,
        [p0, p1] as Vector,
      ])
    ).values()
  );
}
