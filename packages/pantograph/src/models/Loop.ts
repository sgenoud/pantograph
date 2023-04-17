import type { Vector } from "../definitions";
import { rayIntersectionsCount } from "../algorithms/intersections/rayIntersections";
import { AbstractStroke, checkValidStroke } from "./Stroke";
import type { TransformationMatrix } from "./TransformationMatrix";
import { simplifySegments } from "../algorithms/simplify";
import { Segment } from "./segments/Segment";
import { sameVector } from "../vectorOperations";

export class Loop extends AbstractStroke<Loop> {
  strokeType = "LOOP";

  constructor(segments: Segment[], { ignoreChecks = false } = {}) {
    super(segments, { ignoreChecks: true });
    if (!ignoreChecks) checkValidLoop(segments);
  }

  clone(): Loop {
    return new Loop(
      this.segments.map((segment) => segment.clone()),
      { ignoreChecks: true }
    );
  }

  reverse(): Loop {
    const reversedSegments = this.segments.map((segment) => segment.reverse());
    reversedSegments.reverse();
    return new Loop(reversedSegments, { ignoreChecks: true });
  }

  transform(matrix: TransformationMatrix): Loop {
    return new Loop(
      this.segments.map((segment) => segment.transform(matrix)),
      { ignoreChecks: true }
    );
  }

  contains(point: Vector): boolean {
    if (this.onStroke(point)) return false;
    if (!this.boundingBox.contains(point)) return false;

    const intersections = this.segments.reduce((acc, segment) => {
      return acc + rayIntersectionsCount(point, segment);
    }, 0);

    return intersections % 2 === 1;
  }

  simplify(): Loop {
    const newSegments = simplifySegments(this);
    if (!newSegments) return this;
    return new Loop(newSegments, { ignoreChecks: true });
  }
}

export function checkValidLoop(segments: Segment[]): void {
  checkValidStroke(segments, "Loop");
  if (
    !sameVector(segments[0].firstPoint, segments[segments.length - 1].lastPoint)
  )
    throw new Error("Loop segment must be closed");
}
