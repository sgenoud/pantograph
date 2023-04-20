import { Line } from "../../models/segments/Line";
import { Arc } from "../../models/segments/Arc";
import { Segment } from "../../models/segments/Segment";
import {
  add,
  normalize,
  perpendicular,
  scalarMultiply,
  subtract,
} from "../../vectorOperations";
import { Vector } from "../../definitions";

export class DegenerateSegment {
  constructor(
    public readonly firstPoint: Vector,
    public readonly lastPoint: Vector
  ) {}
}

export function offsetSegment(
  segment: Segment,
  offset: number
): Segment | DegenerateSegment {
  if (segment instanceof Line) {
    return offsetLine(segment, offset);
  }

  if (segment instanceof Arc) {
    return offsetArc(segment, offset);
  }

  throw new Error("Not implemented");
}

export function offsetLine(line: Line, offset: number): Line {
  const { firstPoint, lastPoint } = line;

  const normal = line.normalVector;
  return new Line(
    add(firstPoint, scalarMultiply(normal, offset)),
    add(lastPoint, scalarMultiply(normal, offset))
  );
}

export function offsetArc(arc: Arc, offset: number): Arc | DegenerateSegment {
  const offsetStartPoint = add(
    arc.firstPoint,
    scalarMultiply(perpendicular(arc.tangentAtFirstPoint), offset)
  );
  const offsetEndPoint = add(
    arc.lastPoint,
    scalarMultiply(perpendicular(arc.tangentAtLastPoint), offset)
  );

  const orientedOffset = offset * (arc.clockwise ? 1 : -1);
  const newRadius = arc.radius + orientedOffset;
  if (newRadius < arc.precision) {
    return new DegenerateSegment(offsetStartPoint, offsetEndPoint);
  }

  return new Arc(offsetStartPoint, offsetEndPoint, arc.center, arc.clockwise);
}
