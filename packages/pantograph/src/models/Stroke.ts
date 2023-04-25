import { BoundingBox } from "./BoundingBox";
import { Vector } from "../definitions";
import { findIntersectionsAndOverlaps } from "../algorithms/intersections";
import { Segment } from "./segments/Segment";
import { TransformationMatrix } from "./TransformationMatrix";
import { allCombinations } from "../utils/allCombinations";
import zip from "../utils/zip";
import { sameVector } from "../vectorOperations";
import { Transformable } from "./utils/Transformable";

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

export function checkSelfIntersections(
  segments: Segment[],
  type = "Stroke"
): void {
  allCombinations(segments.length).forEach(
    ([segmentIndex, otherSegmentIndex]) => {
      if (segmentIndex === otherSegmentIndex) return;
      const segment = segments[segmentIndex];
      const otherSegment = segments[otherSegmentIndex];

      const intersections = findIntersectionsAndOverlaps(segment, otherSegment);
      if (intersections.count === 0) return;
      if (intersections.count === 1 && !intersections.overlaps.length) {
        const distance = segmentIndex - otherSegmentIndex;

        const intersection = intersections.intersections[0];

        if (distance === 1) {
          if (sameVector(segment.firstPoint, intersection)) return;
        }
        if (distance === -1) {
          if (sameVector(segment.lastPoint, intersection)) return;
        }
        if (distance === segments.length - 1) {
          if (
            sameVector(segment.lastPoint, intersection) &&
            sameVector(otherSegment.firstPoint, intersection)
          )
            return;
        }
        if (-distance === segments.length - 1) {
          if (
            sameVector(segment.firstPoint, intersection) &&
            sameVector(otherSegment.lastPoint, intersection)
          )
            return;
        }
      }

      throw new Error(
        `${type} segments must not intersect, but segments ${
          segment.info
        } and ${otherSegment.info} do at ${JSON.stringify(
          intersections.intersections
        )}`
      );
    }
  );
}

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
