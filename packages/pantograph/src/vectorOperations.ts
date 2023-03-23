import type { Vector } from "./definitions";

export const DEG2RAD = Math.PI / 180;

export const reprVector = (vector: Vector): string => {
  return `[${vector[0]}, ${vector[1]}]`;
};

export const sameVector = (
  [x0, y0]: Vector,
  [x1, y1]: Vector,
  precision = 1e-9
): boolean => {
  return Math.abs(x0 - x1) <= precision && Math.abs(y0 - y1) <= precision;
};

export const add = ([x0, y0]: Vector, [x1, y1]: Vector): Vector => {
  return [x0 + x1, y0 + y1];
};

export const subtract = ([x0, y0]: Vector, [x1, y1]: Vector): Vector => {
  return [x0 - x1, y0 - y1];
};

export const squareLength = ([x, y]: Vector): number => {
  return x * x + y * y;
};

export const length = ([x, y]: Vector): number => {
  return Math.sqrt(squareLength([x, y]));
};

export const scalarMultiply = ([x0, y0]: Vector, scalar: number): Vector => {
  return [x0 * scalar, y0 * scalar];
};

export const squareDistance = (
  [x0, y0]: Vector,
  [x1, y1]: Vector = [0, 0]
): number => {
  return (x0 - x1) ** 2 + (y0 - y1) ** 2;
};

export const distance = (p0: Vector, p1: Vector = [0, 0]): number => {
  return Math.sqrt(squareDistance(p0, p1));
};

export function crossProduct([x0, y0]: Vector, [x1, y1]: Vector): number {
  return x0 * y1 - y0 * x1;
}

export function dotProduct([x0, y0]: Vector, [x1, y1]: Vector): number {
  return x0 * x1 + y0 * y1;
}

export const angle = ([x0, y0]: Vector, [x1, y1]: Vector = [0, 0]): number => {
  return Math.atan2(y1 * x0 - y0 * x1, x0 * x1 + y0 * y1);
};

export function normalize([x0, y0]: Vector): Vector {
  const l = distance([x0, y0]);
  return [x0 / l, y0 / l];
}

export function polarToCartesian(r: number, theta: number): Vector {
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r;
  return [x, y];
}

export function cartesianToPolar([x, y]: Vector): [number, number] {
  const r = distance([x, y]);
  const theta = Math.atan2(y, x);

  return [r, theta];
}

export function parallel(v1: Vector, v2: Vector, precision = 1e-9): boolean {
  const V1xV2 = crossProduct(v1, v2);

  const xLength = squareLength(v1);
  const yLength = squareLength(v2);

  return V1xV2 * V1xV2 < xLength * yLength * precision * precision;
}
