import { BoundingBox } from "./BoundingBox.js";
import { Vector } from "../definitions.js";
import { findIntersectionsAndOverlaps } from "../algorithms/intersections";
import { Segment } from "./segments/Segment.js";
import { TransformationMatrix } from "./TransformationMatrix.js";
import { allCombinations } from "../utils/allCombinations.js";
import zip from "../utils/zip.js";
import { sameVector } from "../vectorOperations.js";
import { Transformable } from "./utils/Transformable.js";

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
      const epsilon = Math.max(segment.precision, otherSegment.precision);

      if (intersections.count === 0) return;
      if (intersections.count === 1 && !intersections.overlaps.length) {
        const distance = segmentIndex - otherSegmentIndex;

        const intersection = intersections.intersections[0];

        if (distance === 1) {
          if (sameVector(segment.firstPoint, intersection, epsilon)) return;
        }
        if (distance === -1) {
          if (sameVector(segment.lastPoint, intersection, epsilon)) return;
        }
        if (distance === segments.length - 1) {
          if (
            sameVector(segment.lastPoint, intersection, epsilon) &&
            sameVector(otherSegment.firstPoint, intersection, epsilon)
          )
            return;
        }
        if (-distance === segments.length - 1) {
          if (
            sameVector(segment.firstPoint, intersection, epsilon) &&
            sameVector(otherSegment.lastPoint, intersection, epsilon)
          )
            return;
        }
      }
      if (intersections.count === 2 && segments.length === 2) {
        if (
          (sameVector(
            segment.firstPoint,
            intersections.intersections[0],
            epsilon
          ) &&
            sameVector(
              segment.lastPoint,
              intersections.intersections[1],
              epsilon
            )) ||
          (sameVector(
            segment.firstPoint,
            intersections.intersections[1],
            epsilon
          ) &&
            sameVector(
              segment.lastPoint,
              intersections.intersections[0],
              epsilon
            ))
        )
          return;
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
