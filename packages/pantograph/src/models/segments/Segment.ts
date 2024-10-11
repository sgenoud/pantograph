import type { Vector } from "../../definitions.js";
import { BoundingBox } from "../BoundingBox.js";
import type { TransformationMatrix } from "../TransformationMatrix.js";
import { reprVector } from "../../vectorOperations.js";
import { Transformable } from "../utils/Transformable.js";

export type Segment = AbstractSegment<any>;

export abstract class AbstractSegment<
  T extends AbstractSegment<T>
> extends Transformable<T> {
  constructor(
    public firstPoint: Vector,
    public lastPoint: Vector,
    precision?: number
  ) {
    super();
    this.firstPoint = firstPoint;
    this.lastPoint = lastPoint;
    if (precision) {
      this.precision = precision;
    }
  }

  readonly precision: number = 1e-9;

  abstract segmentType: string;

  get repr() {
    return `${this.segmentType} ${reprVector(this.firstPoint)} - ${reprVector(
      this.lastPoint
    )}`;
  }
  get info() {
    return this.repr;
  }

  abstract get midPoint(): Vector;

  abstract get boundingBox(): BoundingBox;

  abstract clone(): T;

  abstract reverse(): T;

  abstract isSame(other: AbstractSegment<any>): boolean;

  abstract distanceFrom(element: Vector): number;

  abstract isOnSegment(point: Vector): boolean;

  abstract gradientAt(param: number): Vector;

  abstract tangentAt(point: Vector): Vector;

  abstract get tangentAtFirstPoint(): Vector;
  abstract get tangentAtLastPoint(): Vector;

  abstract splitAt(points: Vector[] | number[]): T[];

  abstract transform(matrix: TransformationMatrix): T;

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.repr;
  }

  abstract paramPoint(t: number): Vector;
}
