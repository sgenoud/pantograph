import type { Vector } from "../definitions";
import { rayIntersectionsCount } from "../algorithms/intersections/rayIntersections";
import { AbstractStroke, checkValidStroke } from "./Stroke";
import type { TransformationMatrix } from "./TransformationMatrix";
import { simplifySegments } from "../algorithms/simplify";
import { Segment } from "./segments/Segment";
import { sameVector } from "../vectorOperations";
import { Line } from "./segments/Line";

export class Loop extends AbstractStroke<Loop> {
  strokeType = "LOOP";

  constructor(segments: Segment[], { ignoreChecks = false } = {}) {
    super(segments, { ignoreChecks: true });
    if (!ignoreChecks) checkValidLoop(segments);
  }

  private _clockwise: boolean | null = null;
  get clockwise(): boolean {
    if (this._clockwise === null) {
      const vertices = this.segments.flatMap((c) => {
        if (!(c instanceof Line)) {
          // We just go with a simple approximation here, we should use some extrema
          // points instead, but this is quick (and good enough for now)
          return [c.firstPoint, c.paramPoint(0.5)];
        }
        return [c.firstPoint];
      });

      const approximateArea = vertices
        .map((v1, i) => {
          const v2 = vertices[(i + 1) % vertices.length];
          return (v2[0] - v1[0]) * (v2[1] + v1[1]);
        })
        .reduce((a, b) => a + b, 0);

      this._clockwise = approximateArea > 0;
    }
    return this._clockwise;
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
