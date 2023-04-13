import type { Stroke } from "../models/Stroke";
import { Line } from "../models/segments/Line";
import { Segment } from "../models/segments/Segment";
import { parallel, sameVector } from "../vectorOperations";
import { Arc } from "../models/segments/Arc";

function canExtendSegment(segment1: Segment, segment2: Segment): boolean {
  if (segment1 instanceof Line && segment2 instanceof Line) {
    if (parallel(segment1.V, segment2.V)) {
      return true;
    }
  }

  if (segment1 instanceof Arc && segment2 instanceof Arc) {
    if (
      sameVector(segment1.center, segment2.center) &&
      segment1.radius - segment2.radius < segment1.precision
    ) {
      return true;
    }
  }
  return false;
}

function extendSegment(segment1: Segment, segment2: Segment): Segment {
  if (segment1 instanceof Line && segment2 instanceof Line) {
    return new Line(segment1.firstPoint, segment2.lastPoint);
  }
  if (segment1 instanceof Arc && segment2 instanceof Arc) {
    // clockwise is the same for both segments, we would otherwise have some
    // self-intersections in the stroke
    return new Arc(
      segment1.firstPoint,
      segment2.lastPoint,
      segment1.center,
      segment1.clockwise
    );
  }

  throw new Error("Not implemented");
}

export function simplifySegments(stroke: Stroke): Segment[] | null {
  let foundSimplification = false;
  const simplifiedSegments: Segment[] = [];

  for (const segment of stroke.segments) {
    if (simplifiedSegments.length === 0) {
      simplifiedSegments.push(segment);
      continue;
    }

    const lastSegment = simplifiedSegments[simplifiedSegments.length - 1];
    if (canExtendSegment(lastSegment, segment)) {
      foundSimplification = true;
      simplifiedSegments.pop();
      simplifiedSegments.push(extendSegment(lastSegment, segment));
    } else {
      simplifiedSegments.push(segment);
    }
  }

  if (sameVector(stroke.firstPoint, stroke.lastPoint)) {
    if (
      canExtendSegment(
        simplifiedSegments[0],
        simplifiedSegments[simplifiedSegments.length - 1]
      )
    ) {
      foundSimplification = true;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastSegment = simplifiedSegments.pop()!;
      simplifiedSegments[0] = extendSegment(lastSegment, simplifiedSegments[0]);
    }
  }

  if (!foundSimplification) return null;
  return simplifiedSegments;
}
