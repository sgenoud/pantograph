import { BoundingBox } from "./BoundingBox.js";
import { Vector } from "../definitions.js";
import { findIntersectionsAndOverlaps } from "../algorithms/intersections/index.js";
import { Segment } from "./segments/Segment.js";
import { TransformationMatrix } from "./TransformationMatrix.js";
import zip from "../utils/zip.js";
import { sameVector } from "../vectorOperations.js";
import { Transformable } from "./utils/Transformable.js";
import { checkSelfIntersections } from "./segments/utils/selfIntersections.js";

export type Stroke = AbstractStroke<any>;

export abstract class AbstractStroke<
  T extends AbstractStroke<T>
> extends Transformable<T> {
  readonly segments: Segment[];

  abstract strokeType: string;

  get repr(): string {
    return this.segments.map((segment) => segment.repr).join("\n") + "\n";
  }
  get info(): string {
    return this.repr;
  }
  constructor(segments: Segment[], { ignoreChecks = false } = {}) {
    super();
    if (!ignoreChecks) checkValidStroke(segments);
    this.segments = segments;
  }

  get firstPoint(): Vector {
    return this.segments[0].firstPoint;
  }

  get lastPoint(): Vector {
    return this.segments[this.segments.length - 1].lastPoint;
  }

  get segmentsCount(): number {
    return this.segments.length;
  }

  onStroke(point: Vector): boolean {
    return this.segments.some((segment) => segment.isOnSegment(point));
  }

  intersects(other: Stroke): boolean {
    if (!this.boundingBox.overlaps(other.boundingBox)) return false;
    return this.segments.some((segment) =>
      other.segments.some(
        (otherSegment) =>
          findIntersectionsAndOverlaps(segment, otherSegment).count > 0
      )
    );
  }

  overlappingSegments(other: Stroke): Segment[] {
    return this.segments.flatMap((segment) => {
      return other.segments.flatMap((otherSegment) => {
        if (!segment.boundingBox.overlaps(otherSegment.boundingBox)) return [];
        return findIntersectionsAndOverlaps(segment, otherSegment).overlaps;
      });
    });
  }

  private _boundingBox: BoundingBox | null = null;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === null) {
      let bbox = this.segments[0].boundingBox;

      this.segments.slice(1).forEach((segment) => {
        bbox = bbox.merge(segment.boundingBox);
      });
      this._boundingBox = bbox;
    }
    return this._boundingBox;
  }

  abstract reverse(): T;

  abstract clone(): T;

  abstract transform(matrix: TransformationMatrix): T;

  abstract simplify(): T;

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.repr;
  }
}

export { checkSelfIntersections };

export function checkValidStroke(segments: Segment[], type = "Stroke"): void {
  if (segments.length === 0)
    throw new Error(`${type} must have at least one segment`);

  zip([segments.slice(0, -1), segments.slice(1)]).forEach(
    ([segment, nextSegment]) => {
      if (!sameVector(segment.lastPoint, nextSegment.firstPoint))
        throw new Error(
          `${type} segments must be connected, but ${segment.info} and ${nextSegment.info} are not`
        );
    }
  );

  checkSelfIntersections(segments, type);
}
