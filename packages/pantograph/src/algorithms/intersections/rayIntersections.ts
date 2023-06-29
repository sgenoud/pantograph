import { Line } from "../../models/segments/Line.js";
import { lineLineParams } from "./lineLineIntersection.js";
import { lineEllipseArcIntersection } from "./lineEllipseArcIntersection.js";
import type { Vector } from "../../definitions.js";
import { Segment } from "../../models/segments/Segment.js";
import { sameVector, squareDistance } from "../../vectorOperations.js";
import { Arc } from "../../models/segments/Arc.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";

const rayLineIntersectionsCount = (point: Vector, line: Line) => {
  const intersectionParams = lineLineParams(line, {
    V: [1, 0],
    firstPoint: point,
    precision: line.precision,
  });
  if (intersectionParams === "parallel") {
    // When the ray is parallel with the line, we can ignore its extremities.
    // They will be handled by the segments getting into and out of this one.
    return 0;
  }

  const { intersectionParam1, intersectionParam2 } = intersectionParams;

  if (!line.isValidParameter(intersectionParam1)) return 0;
  // With the ray we only check one side of the parameter
  if (intersectionParam2 <= -line.precision) return 0;

  // We need to check if the ray intersects the line segment at the extremities
  // In that case we considers that it crosses the segment if its midpoint is
  // above the line.

  if (
    Math.abs(intersectionParam1) < line.precision ||
    Math.abs(intersectionParam1 - 1) < line.precision
  ) {
    const [, y] = line.midPoint;
    return point[1] - y < 0 ? 1 : 0;
  }

  return 1;
};

class IntersectionCounter {
  private _count = 0;
  private readonly segment: Segment;

  constructor(segment: Segment) {
    this.segment = segment;
  }

  update(intersectionPoint: Vector, isOnSegment = false) {
    if (!isOnSegment && !this.segment.isOnSegment(intersectionPoint)) return;

    // We extend the convention of the line ray interaction. We look at the
    // tangent at the point of intersection. If it is pointing to the top we
    // consider that the ray is crossing the arc.
    if (sameVector(intersectionPoint, this.segment.firstPoint)) {
      this._count += this.segment.tangentAtFirstPoint[1] > 0 ? 1 : 0;
    } else if (sameVector(intersectionPoint, this.segment.lastPoint)) {
      this._count += this.segment.tangentAtLastPoint[1] > 0 ? 0 : 1;
    } else {
      this._count += 1;
    }
  }

  get count() {
    return this._count;
  }
}

const rayArcIntersectionsCount = (point: Vector, arc: Arc) => {
  const epsilon = arc.precision;

  const verticalDistance = Math.abs(point[1] - arc.center[1]);

  // the line is above or below the circle
  if (verticalDistance > arc.radius + epsilon) return 0;

  const squareDist = squareDistance(point, arc.center);
  const squareR = arc.radius * arc.radius;
  const squareEpsilon = epsilon * epsilon;

  // On the border
  if (Math.abs(squareDist - squareR) < squareEpsilon && arc.isOnSegment(point))
    return 0;

  const pointOutsideCircle = squareDist - squareR > squareEpsilon;

  // the point is at the right of the circle
  if (pointOutsideCircle && arc.center[0] < point[0]) return 0;

  // delta corresponds to the length between the project center on the line and
  // the crossing points
  const delta = Math.sqrt(
    arc.radius * arc.radius - verticalDistance * verticalDistance
  );

  const counter = new IntersectionCounter(arc);

  // We might be able to optimise the check on segment, but it is not clear
  // that it is worth it
  counter.update([arc.center[0] + delta, point[1]]);

  if (pointOutsideCircle) {
    counter.update([arc.center[0] - delta, point[1]]);
  }

  return counter.count;
};

const rayEllipseArcIntersectionsCount = (point: Vector, arc: EllipseArc) => {
  const end = arc.boundingBox.xMax + arc.boundingBox.width / 2;
  const ray = new Line(point, [end, point[1]]);

  const counter = new IntersectionCounter(arc);
  lineEllipseArcIntersection(ray, arc).forEach((intersection) => {
    // We already know that the intersection is on the ellipse, se we se
    // isOnSegment as true
    counter.update(intersection, true);
  });

  return counter.count;
};

const rayBezierIntersectionsCount = (
  point: Vector,
  curve: CubicBezier | QuadraticBezier
) => {
  // We rely on the fact that the ray is horizontal

  const counter = new IntersectionCounter(curve);
  curve
    .paramsAtY(point[1])
    .map((p) => {
      try {
        return curve.paramPoint(p);
      } catch (e) {
        return null;
      }
    })
    .filter((p) => p !== null)
    .filter((p) => {
      const [x] = p!;
      return x >= point[0];
    })
    .forEach((param) => {
      counter.update(param!, true);
    });

  return counter.count;
};

export function rayIntersectionsCount(point: Vector, segment: Segment): number {
  if (segment instanceof Line) {
    return rayLineIntersectionsCount(point, segment);
  }

  if (segment instanceof Arc) {
    return rayArcIntersectionsCount(point, segment);
  }

  if (segment instanceof EllipseArc) {
    return rayEllipseArcIntersectionsCount(point, segment);
  }

  if (segment instanceof CubicBezier || segment instanceof QuadraticBezier) {
    return rayBezierIntersectionsCount(point, segment);
  }

  throw new Error("Not implemented");
}
