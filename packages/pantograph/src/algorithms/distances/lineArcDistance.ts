import type { Line } from "../../models/segments/Line";
import type { Arc } from "../../models/segments/Arc";
import {
  normalize,
  subtract,
  distance,
  add,
  scalarMultiply,
} from "../../vectorOperations";
import { projectPointOnLine } from "../../utils/projectPointOnLine";
import { lineArcIntersection } from "../intersections/lineArcIntersection";

export function lineArcDistance(line: Line, arc: Arc): number {
  // We might be able to optimise this if necessary

  if (lineArcIntersection(line, arc).length > 0) {
    return 0;
  }

  const closestPointOnLine = projectPointOnLine(line, arc.center);

  if (line.isOnSegment(closestPointOnLine)) {
    const circleCenterLineDistance = distance(closestPointOnLine, arc.center);

    // The line is tangent to the circle
    if (Math.abs(circleCenterLineDistance - arc.radius) < line.precision) {
      if (arc.isOnSegment(closestPointOnLine)) {
        return 0;
      }
    }

    if (circleCenterLineDistance - arc.radius > line.precision) {
      const centerLineDirection = normalize(
        subtract(closestPointOnLine, arc.center)
      );

      const closestPointOnCircle = add(
        arc.center,
        scalarMultiply(centerLineDirection, arc.radius)
      );

      if (arc.isOnSegment(closestPointOnCircle)) {
        return distance(closestPointOnCircle, closestPointOnLine);
      }
    }
  }

  return Math.min(
    arc.distanceFrom(line.firstPoint),
    arc.distanceFrom(line.lastPoint),
    line.distanceFrom(arc.firstPoint),
    line.distanceFrom(arc.lastPoint)
  );
}
