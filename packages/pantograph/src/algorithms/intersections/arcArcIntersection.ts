import { Vector } from "../../definitions.js";
import { Arc } from "../../models/segments/Arc.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";
import {
  add,
  distance,
  normalize,
  perpendicular,
  sameVector,
  scalarMultiply,
  subtract,
} from "../../vectorOperations";

const complementArc = (arc: Arc): Arc => {
  const { firstPoint, lastPoint, center, clockwise } = arc;
  return new Arc(lastPoint, firstPoint, center, clockwise, {
    ignoreChecks: true,
  });
};

const handleOverlaps = (arc1: Arc, arc2: Arc): Arc[] => {
  // handle the case with common points at start or end first
  if (arc1.isSame(arc2)) {
    return [arc1];
  }
  // two arcs with common points at start and end (but not the same arc)

  const points = removeDuplicatePoints(
    [
      arc2.isOnSegment(arc1.firstPoint) ? arc1.firstPoint : null,
      arc2.isOnSegment(arc1.lastPoint) ? arc1.lastPoint : null,
      arc1.isOnSegment(arc2.firstPoint) ? arc2.firstPoint : null,
      arc1.isOnSegment(arc2.lastPoint) ? arc2.lastPoint : null,
    ].filter((p) => p !== null) as Vector[],
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
    return [new Arc(points[0], points[1], arc1.center, arc1.clockwise)];
  } else if (points.length === 3) {
    // Similar to the case with length 1, we ignore the single overlapping point
    const startIndex =
      sameVector(points[0], arc2.lastPoint) ||
      sameVector(points[0], arc2.firstPoint)
        ? 1
        : 0;
    return [
      new Arc(
        points[0 + startIndex],
        points[1 + startIndex],
        arc1.center,
        arc1.clockwise,
      ),
    ];
  } else if (points.length === 4) {
    return [
      new Arc(points[0], points[1], arc1.center, arc1.clockwise),
      new Arc(points[2], points[3], arc1.center, arc1.clockwise),
    ];
  }
  throw new Error("Bug in the arc arc overlap algorithm");
};

export function arcArcIntersection(
  arc1: Arc,
  arc2: Arc,
  includeOverlaps = false,
  precision?: number,
): Vector[] | Arc[] {
  const epsilon = precision ? precision : arc1.precision;
  const centersDistance = distance(arc1.center, arc2.center);

  const radiusSum = arc1.radius + arc2.radius;

  // The circles do not touch
  if (centersDistance > radiusSum + epsilon) {
    return [];
  }

  const radiusDifference = Math.abs(arc1.radius - arc2.radius);

  // The arcs are concentric
  if (centersDistance < radiusDifference - epsilon) {
    return [];
  }

  // With a common center we can have overlaps
  if (centersDistance < epsilon) {
    if (radiusDifference > epsilon) {
      return [];
    } else {
      if (!includeOverlaps) {
        return [];
      }
      return handleOverlaps(arc1, arc2);
    }
  }

  const centersVector = normalize(subtract(arc2.center, arc1.center));
  // The circles are tangent to each other
  const isOutsideTangent = centersDistance > radiusSum - epsilon;
  if (
    // circles are outside each other
    isOutsideTangent ||
    // circles are inside each other
    Math.abs(centersDistance - radiusDifference) < epsilon
  ) {
    const orientation = isOutsideTangent || arc1.radius > arc2.radius ? 1 : -1;
    const intersectionPoint = add(
      arc1.center,
      scalarMultiply(centersVector, orientation * arc1.radius),
    );

    if (
      arc1.isOnSegment(intersectionPoint) &&
      arc2.isOnSegment(intersectionPoint)
    ) {
      return [intersectionPoint];
    } else {
      return [];
    }
  }

  // The circles cross each other
  const radiusToChord =
    (arc1.radius * arc1.radius) / (2 * centersDistance) -
    (arc2.radius * arc2.radius) / (2 * centersDistance) +
    centersDistance / 2;

  const midPoint = add(
    arc1.center,
    scalarMultiply(centersVector, radiusToChord),
  );

  const halfChord = Math.sqrt(
    arc1.radius * arc1.radius - radiusToChord * radiusToChord,
  );

  const chordVector = perpendicular(centersVector);

  const p1 = add(midPoint, scalarMultiply(chordVector, halfChord));
  const p2 = add(midPoint, scalarMultiply(chordVector, -halfChord));

  const intersections = [];
  if (arc1.isOnSegment(p1) && arc2.isOnSegment(p1)) {
    intersections.push(p1);
  }
  if (arc1.isOnSegment(p2) && arc2.isOnSegment(p2)) {
    intersections.push(p2);
  }

  return intersections;
}
