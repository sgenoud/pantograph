import { add, scalarMultiply, distance } from "../../vectorOperations";
import { Line } from "../../models/segments/Line";
import { Vector } from "../../definitions";
import { Arc } from "../../models/segments/Arc";
import { projectPointOnLine } from "../../utils/projectPointOnLine";

export function lineArcIntersection(
  line: Line,
  arc: Arc,
  precision?: number
): Vector[] {
  const epsilon = precision ? precision : line.precision;

  const centerOnLine = projectPointOnLine(line, arc.center);
  const centerDistance = distance(centerOnLine, arc.center);

  // the line does not touch the circle
  if (centerDistance > arc.radius + epsilon) return [];

  // The line is tangent to the arc
  if (Math.abs(centerDistance - arc.radius) < epsilon) {
    const intersectionPoint = centerOnLine;
    if (
      line.isOnSegment(intersectionPoint) &&
      arc.isOnSegment(intersectionPoint)
    ) {
      return [intersectionPoint];
    }
    return [];
  }

  // The line crosses the arc
  const intersections = [];

  // delta corresponds to the length between the project center on the line and
  // the crossing points
  const delta = Math.sqrt(
    arc.radius * arc.radius - centerDistance * centerDistance
  );

  // We might be able to optimise the check on segment, but it is not clear
  // that it is worth it
  const lineDir = line.tangentAtFirstPoint;
  const p1 = add(centerOnLine, scalarMultiply(lineDir, delta));
  if (line.isOnSegment(p1) && arc.isOnSegment(p1)) {
    intersections.push(p1);
  }

  const p2 = add(centerOnLine, scalarMultiply(lineDir, -delta));
  if (line.isOnSegment(p2) && arc.isOnSegment(p2)) {
    intersections.push(p2);
  }

  return intersections;
}
