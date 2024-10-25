import { Vector } from "../../../definitions.js";

const lerp = (a: Vector, b: Vector, t: number) => {
  return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t] as Vector;
};

function nextNeighborZip<T>(arr: T[]) {
  const result: [T, T][] = [];
  for (let i = 0; i < arr.length - 1; i++) {
    result.push([arr[i], arr[i + 1]]);
  }
  return result;
}

export function deCasteljauWithHistory(
  points: Vector[],
  t: number,
): Vector[][] {
  const nextPoints = nextNeighborZip(points).map(([a, b]) => lerp(a, b, t));
  if (points.length === 2) {
    return [nextPoints];
  }
  return [...deCasteljauWithHistory(nextPoints, t), nextPoints];
}

export function deCasteljau(points: Vector[], t: number): Vector {
  if (points.length === 1) {
    return points[0];
  }
  const nextPoints = nextNeighborZip(points).map(([a, b]) => lerp(a, b, t));
  return deCasteljau(nextPoints, t);
}
