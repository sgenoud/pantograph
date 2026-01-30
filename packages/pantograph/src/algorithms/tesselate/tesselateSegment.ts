import type { Vector } from "../../definitions.js";
import type { Segment } from "../../models/segments/Segment.js";
import {
  DEG2RAD,
  dotProduct,
  length,
  normalize,
  subtract,
} from "../../vectorOperations.js";

export type TesselateSegmentOptions = {
  maxAngle?: number;
  maxDepth?: number;
};

const DEFAULT_MAX_ANGLE = 1 * DEG2RAD;
const DEFAULT_MAX_DEPTH = 24;

function unitTangent(
  segment: Segment,
  t: number,
  fallback: Vector,
  precision: number,
): Vector {
  const grad = segment.gradientAt(t);
  if (length(grad) <= precision) return fallback;
  return normalize(grad);
}

function tesselateSegmentRange(
  segment: Segment,
  t0: number,
  t1: number,
  options: Required<TesselateSegmentOptions>,
  cosTol: number,
  depth: number,
): Vector[] {
  const p0 = segment.paramPoint(t0);
  const p1 = segment.paramPoint(t1);
  const chord = subtract(p1, p0);
  const chordLength = length(chord);

  if (chordLength <= segment.precision || depth >= options.maxDepth) {
    return [p0, p1];
  }

  const chordDir: Vector = [chord[0] / chordLength, chord[1] / chordLength];
  const tm = (t0 + t1) * 0.5;
  const tan0 = unitTangent(segment, t0, chordDir, segment.precision);
  const tanm = unitTangent(segment, tm, chordDir, segment.precision);
  const tan1 = unitTangent(segment, t1, chordDir, segment.precision);

  const cos0 = dotProduct(tan0, tanm);
  const cos1 = dotProduct(tanm, tan1);

  if (cos0 >= cosTol && cos1 >= cosTol) {
    return [p0, p1];
  }

  const pm = segment.paramPoint(tm);
  const left =
    cos0 >= cosTol
      ? [p0, pm]
      : tesselateSegmentRange(segment, t0, tm, options, cosTol, depth + 1);
  const right =
    cos1 >= cosTol
      ? [pm, p1]
      : tesselateSegmentRange(segment, tm, t1, options, cosTol, depth + 1);

  return [...left.slice(0, -1), ...right];
}

export function tesselateSegment(
  segment: Segment,
  options: TesselateSegmentOptions = {},
): Vector[] {
  const resolved: Required<TesselateSegmentOptions> = {
    maxAngle: options.maxAngle ?? DEFAULT_MAX_ANGLE,
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
  };

  const cosTol = Math.cos(resolved.maxAngle);
  return tesselateSegmentRange(segment, 0, 1, resolved, cosTol, 0);
}
