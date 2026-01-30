import { Line } from "../../models/segments/Line.js";
import { Arc } from "../../models/segments/Arc.js";
import { Segment } from "../../models/segments/Segment.js";
import {
  add,
  distance,
  dotProduct,
  perpendicular,
  scalarMultiply,
  subtract,
} from "../../vectorOperations";
import { Vector } from "../../definitions.js";
import { CubicBezier, QuadraticBezier } from "../../models/exports.js";
import { fullLineIntersection } from "../intersections/fullLinesIntersection.js";
import {
  SafeCubicBezier,
  SafeQuadraticBezier,
} from "../conversions/bezierToSafeBezier.js";

const DEGENERATE_SEGMENT_INSTANCE = Symbol.for(
  "pantograph:DegenerateSegment",
);

export class DegenerateSegment {
  static isInstance(value: unknown): value is DegenerateSegment {
    return (
      !!value &&
      (value as { [DEGENERATE_SEGMENT_INSTANCE]?: boolean })[
        DEGENERATE_SEGMENT_INSTANCE
      ] === true
    );
  }

  constructor(
    public readonly firstPoint: Vector,
    public readonly lastPoint: Vector,
  ) {
    Object.defineProperty(this, DEGENERATE_SEGMENT_INSTANCE, { value: true });
  }
}

export type OffsettableSegment =
  | Line
  | Arc
  | SafeCubicBezier
  | SafeQuadraticBezier;

export function offsetSegment(
  segment: OffsettableSegment,
  offset: number,
): Segment | DegenerateSegment {
  if (Line.isInstance(segment)) {
    return offsetLine(segment, offset);
  }

  if (Arc.isInstance(segment)) {
    return offsetArc(segment, offset);
  }

  if (QuadraticBezier.isInstance(segment) || CubicBezier.isInstance(segment)) {
    return offsetSafeBezier(segment, offset);
  }

  throw new Error("Not implemented");
}

export function offsetLine(line: Line, offset: number): Line {
  const { firstPoint, lastPoint } = line;

  const normal = line.normalVector;
  return new Line(
    add(firstPoint, scalarMultiply(normal, offset)),
    add(lastPoint, scalarMultiply(normal, offset)),
  );
}

export function offsetArc(arc: Arc, offset: number): Arc | DegenerateSegment {
  const offsetStartPoint = add(
    arc.firstPoint,
    scalarMultiply(perpendicular(arc.tangentAtFirstPoint), offset),
  );
  const offsetEndPoint = add(
    arc.lastPoint,
    scalarMultiply(perpendicular(arc.tangentAtLastPoint), offset),
  );

  const orientedOffset = offset * (arc.clockwise ? 1 : -1);
  const newRadius = arc.radius + orientedOffset;
  if (newRadius < arc.precision) {
    return new DegenerateSegment(offsetStartPoint, offsetEndPoint);
  }

  return new Arc(offsetStartPoint, offsetEndPoint, arc.center, arc.clockwise);
}

function computeControlPointOffset(
  origin: Vector,
  controlPoint: Vector,
  tangent: Vector,
  newPoint: Vector,
  precision: number,
): Vector {
  const newControlPoint = fullLineIntersection(
    {
      V: tangent,
      firstPoint: newPoint,
      precision: precision,
    },
    {
      V: subtract(controlPoint, origin),
      firstPoint: origin,
      precision: precision,
    },
  );

  if (newControlPoint === "parallel") {
    throw new Error(
      "Parallel lines not expected in safe bezier offset control point calculation",
    );
  }

  return newControlPoint;
}

export function offsetSafeBezier(
  curve: SafeQuadraticBezier | SafeCubicBezier,
  offset: number,
): typeof curve | DegenerateSegment {
  const { firstPoint, lastPoint, normalAtFirstPoint, normalAtLastPoint } =
    curve;

  const origin = fullLineIntersection(
    { V: normalAtFirstPoint, firstPoint, precision: curve.precision },
    { V: normalAtLastPoint, firstPoint: lastPoint, precision: curve.precision },
  );

  const offsetStartPoint = add(
    firstPoint,
    scalarMultiply(normalAtFirstPoint, offset),
  );
  const offsetEndPoint = add(
    lastPoint,
    scalarMultiply(normalAtLastPoint, offset),
  );

  if (origin === "parallel") {
    throw new Error("Parallel lines not expected in safe bezier offset");
  }

  const offsetTowardsOrigin =
    dotProduct(subtract(origin, firstPoint), normalAtFirstPoint) * offset > 0;
  if (offsetTowardsOrigin) {
    const minDistance = Math.min(
      distance(firstPoint, origin),
      distance(lastPoint, origin),
    );

    if (minDistance < offset) {
      return new DegenerateSegment(offsetStartPoint, offsetEndPoint);
    }
  }

  if (QuadraticBezier.isInstance(curve)) {
    const newControlPoint = computeControlPointOffset(
      origin,
      curve.controlPoint,
      curve.tangentAtFirstPoint,
      offsetStartPoint,
      curve.precision,
    );

    return new QuadraticBezier(
      offsetStartPoint,
      offsetEndPoint,
      newControlPoint,
    );
  }

  const newControlPoint1 = computeControlPointOffset(
    origin,
    curve.firstControlPoint,
    curve.tangentAtFirstPoint,
    offsetStartPoint,
    curve.precision,
  );
  const newControlPoint2 = computeControlPointOffset(
    origin,
    curve.lastControlPoint,
    curve.tangentAtLastPoint,
    offsetEndPoint,
    curve.precision,
  );

  return new CubicBezier(
    offsetStartPoint,
    offsetEndPoint,
    newControlPoint1,
    newControlPoint2,
  );
}
