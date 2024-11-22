import { CubicBezier } from "../models/segments/CubicBezier";
import { QuadraticBezier } from "../models/segments/QuadraticBezier";
import {
  angle,
  dotProduct,
  perpendicular,
  subtract,
} from "../vectorOperations";

// This is based on https://github.com/Pomax/bezierjs

type Bezier = CubicBezier | QuadraticBezier;

export type SafeCubicBezier = CubicBezier & { readonly __safe: unique symbol };
export type SafeQuadraticBezier = QuadraticBezier & {
  readonly __safe: unique symbol;
};

type SafeBezier = SafeCubicBezier | SafeQuadraticBezier;

export type SafeVersion<T> = T extends CubicBezier
  ? SafeCubicBezier
  : T extends QuadraticBezier
    ? SafeQuadraticBezier
    : never;

function isOffsetSafeBezier(segment: Bezier): segment is SafeBezier {
  if (segment instanceof CubicBezier) {
    // We check that both control points are on the same side of the chord
    const chord = subtract(segment.lastPoint, segment.firstPoint);
    const v2 = subtract(segment.firstControlPoint, segment.firstPoint);
    const v3 = subtract(segment.lastControlPoint, segment.firstPoint);

    const a1 = angle(chord, v2);
    const a2 = angle(chord, v3);

    if ((a1 > 0 && a2 < 0) || (a1 < 0 && a2 > 0)) return false;
  }

  const n1 = perpendicular(segment.tangentAtFirstPoint);
  const n2 = perpendicular(segment.tangentAtLastPoint);

  let s = dotProduct(n1, n2);
  return Math.abs(Math.acos(s)) < Math.PI / 3;
}

function _splitIntoOffsetSafeBezier(
  segment: Bezier,
): SafeVersion<typeof segment>[] {
  if (isOffsetSafeBezier(segment)) return [segment];

  const [left, right] = segment.splitAtParameters([0.5]);
  return [
    ..._splitIntoOffsetSafeBezier(left),
    ..._splitIntoOffsetSafeBezier(right),
  ];
}

export function splitIntoOffsetSafeBezier(
  segment: Bezier,
): SafeVersion<typeof segment>[] {
  if (isOffsetSafeBezier(segment)) return [segment];

  const segments = segment.splitAtParameters(segment.getParametersOfExtrema());
  return segments.flatMap(_splitIntoOffsetSafeBezier);
}
