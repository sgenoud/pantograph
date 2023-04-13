import {
  distance,
  normalize,
  polarAngle,
  subtract,
} from "../../vectorOperations";
import type { Arc } from "../../models/segments/Arc";
import { arcArcIntersection } from "../intersections/arcArcIntersection";

const overlappingAngles = (arc1: Arc, arc2: Arc): boolean => {
  const p1 = arc1.angleToParam(arc2.firstAngle);
  if (arc1.isValidParameter(p1)) return true;

  const p2 = arc1.angleToParam(arc2.lastAngle);
  if (arc1.isValidParameter(p2)) return true;
  return false;
};

export function arcArcDistance(arc1: Arc, arc2: Arc): number {
  if (arcArcIntersection(arc1, arc2, true).length > 0) return 0;

  const centersDistance = distance(arc1.center, arc2.center);

  if (centersDistance < arc1.precision) {
    if (overlappingAngles(arc1, arc2)) {
      return Math.abs(arc1.radius - arc2.radius);
    }
  }

  const centerCenterDirection = normalize(subtract(arc2.center, arc1.center));

  const containedCircles =
    centersDistance - (arc1.radius + arc2.radius) < arc1.precision;

  let arc1ClosestPointAngle = polarAngle(centerCenterDirection);
  if (containedCircles && arc2.radius > arc1.radius) {
    arc1ClosestPointAngle += Math.PI;
  }
  const arc2ClosestPointAngle = containedCircles
    ? arc1ClosestPointAngle
    : arc1ClosestPointAngle + Math.PI;

  if (
    arc1.isValidParameter(arc1.angleToParam(arc1ClosestPointAngle)) &&
    arc2.isValidParameter(arc2.angleToParam(arc2ClosestPointAngle))
  ) {
    return containedCircles
      ? Math.abs(arc1.radius - arc2.radius) - centersDistance
      : centersDistance - (arc1.radius + arc2.radius);
  }

  return Math.min(
    arc1.distanceFrom(arc2.firstPoint),
    arc1.distanceFrom(arc2.lastPoint),
    arc2.distanceFrom(arc1.firstPoint),
    arc2.distanceFrom(arc1.lastPoint)
  );
}
