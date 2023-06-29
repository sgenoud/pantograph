import { Vector } from "../../definitions.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { sameVector } from "../../vectorOperations.js";
import { bezierClip } from "./bezierClip.js";

export function handleOverlaps(curve1: CubicBezier, curve2: CubicBezier) {
  const commonPoints: Vector[] = [];
  const toTest: [Vector, CubicBezier][] = [
    [curve1.firstPoint, curve2],
    [curve1.lastPoint, curve2],
    [curve2.firstPoint, curve1],
    [curve2.lastPoint, curve1],
  ];

  // This could be optimised by doing only one vector => parameter conversion

  toTest.forEach(([point, curve]) => {
    if (curve.isOnSegment(point)) {
      commonPoints.push(point);
    }
  });

  if (commonPoints.length < 2) {
    // no overlap
    return null;
  }

  if (commonPoints.length === 2) {
    return [curve1.splitAt(commonPoints)[1]];
  }

  if (commonPoints.length === 3) {
    // there is one curve that is within the other
    if (
      sameVector(commonPoints[0], curve1.firstPoint) &&
      sameVector(commonPoints[1], curve1.lastPoint)
    ) {
      return [curve1];
    }
    return [curve2];
  }

  if (commonPoints.length === 4) {
    return [curve1];
  }
}

export function cubicBezierCubicBezierIntersection(
  curve1: CubicBezier,
  curve2: CubicBezier,
  includeOverlaps = false
) {
  const epsilon = Math.max(curve1.precision, curve2.precision);

  if (includeOverlaps) {
    const overlappingCurve = handleOverlaps(curve1, curve2);
    if (overlappingCurve) {
      return overlappingCurve;
    }
  }

  return bezierClip(curve1, curve2, epsilon);
}
