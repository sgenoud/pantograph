import { Vector } from "../../definitions.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";
import { sameVector } from "../../vectorOperations.js";
import { ellipseEllipseIntersection } from "./ellipseEllipseIntersection.js";

const complementArc = (arc: EllipseArc): EllipseArc => {
  const {
    firstPoint,
    lastPoint,
    center,
    majorRadius,
    minorRadius,
    tiltAngle,
    clockwise,
  } = arc;
  return new EllipseArc(
    lastPoint,
    firstPoint,
    center,
    majorRadius,
    minorRadius,
    tiltAngle,
    clockwise,
    {
      ignoreChecks: true,
      angleUnits: "rad",
    }
  );
};

const handleOverlaps = (arc1: EllipseArc, arc2: EllipseArc): EllipseArc[] => {
  // handle the case with common points at start or end first
  if (arc1.isSame(arc2)) {
    return [arc1];
  }
  // two arcs with common points at start and end (but not the same arc)

  const partialArc = (firstPoint: Vector, lastPoint: Vector) =>
    new EllipseArc(
      firstPoint,
      lastPoint,
      arc1.center,
      arc1.majorRadius,
      arc1.minorRadius,
      arc1.tiltAngle,
      arc1.clockwise,
      { ignoreChecks: true, angleUnits: "rad" }
    );

  const points = removeDuplicatePoints(
    [
      arc2.isOnSegment(arc1.firstPoint) ? arc1.firstPoint : null,
      arc2.isOnSegment(arc1.lastPoint) ? arc1.lastPoint : null,
      arc1.isOnSegment(arc2.firstPoint) ? arc2.firstPoint : null,
      arc1.isOnSegment(arc2.lastPoint) ? arc2.lastPoint : null,
    ].filter((p) => p !== null) as Vector[]
    // We sort by the param value of the first arc. This means that the points
    // will be sorted with the same orientation than arc1
  ).sort((a, b) => arc1.pointToParam(a) - arc1.pointToParam(b));

  if (points.length === 0) return [];
  // We consider the case when the arcs touch only on
  // the last point. We consider that they do not overlap there
  //
  // We might want to revisit this choice
  else if (points.length === 1) return [];
  else if (points.length === 2) {
    // Similar to the case with length 1, we ignore the double overlapping point
    if (arc1.isSame(complementArc(arc2))) return [];
    return [partialArc(points[0], points[1])];
  } else if (points.length === 3) {
    // Similar to the case with length 1, we ignore the single overlapping point
    const startIndex =
      sameVector(points[0], arc2.lastPoint) ||
      sameVector(points[0], arc2.firstPoint)
        ? 1
        : 0;
    return [partialArc(points[0 + startIndex], points[1 + startIndex])];
  } else if (points.length === 4) {
    return [partialArc(points[0], points[1]), partialArc(points[2], points[3])];
  }
  throw new Error("Bug in the ellipse arc ellipse arc overlap algorithm");
};

export function ellipseArcEllipseArcIntersection(
  arc1: EllipseArc,
  arc2: EllipseArc,
  includeOverlaps = false
): Vector[] | EllipseArc[] {
  const epsilon = Math.max(arc1.precision, arc2.precision);
  const sameEllipse =
    sameVector(arc1.center, arc2.center) &&
    Math.abs(arc1.majorRadius - arc2.majorRadius) < epsilon &&
    Math.abs(arc1.minorRadius - arc2.minorRadius) < epsilon &&
    (Math.abs(arc1.tiltAngle - arc2.tiltAngle) < epsilon ||
      Math.abs(Math.abs(arc1.tiltAngle - arc2.tiltAngle) - Math.PI) < epsilon);
  if (sameEllipse) {
    if (includeOverlaps) return handleOverlaps(arc1, arc2);
    else return [];
  }
  const points = ellipseEllipseIntersection(arc1, arc2);
  return points.filter((p) => arc1.isOnSegment(p) && arc2.isOnSegment(p));
}
