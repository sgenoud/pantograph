import type { Vector } from "../../definitions";
import { BoundingBox } from "../BoundingBox";
import type { TransformationMatrix } from "../TransformationMatrix";
import { reprVector } from "../../vectorOperations";
import { Transformable } from "../utils/Transformable";

export abstract class AbstractSegment<
  T extends AbstractSegment<T>,
> extends Transformable<T> {
  constructor(
    public firstPoint: Vector,
    public lastPoint: Vector,
  ) {
    super();
    this.firstPoint = firstPoint;
    this.lastPoint = lastPoint;
  }

  readonly precision: number = 1e-9;

  abstract segmentType: string;

  get repr() {
    return `${this.segmentType} ${reprVector(this.firstPoint)} - ${reprVector(
      this.lastPoint,
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

  abstract tangentAt(point: Vector): Vector;

  abstract get tangentAtFirstPoint(): Vector;
  abstract get tangentAtLastPoint(): Vector;

  abstract splitAt(points: Vector[] | number[]): T[];

  abstract transform(matrix: TransformationMatrix): T;
}
