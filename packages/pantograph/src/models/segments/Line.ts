import { BoundingBox } from "../BoundingBox.js";
import { Vector } from "../../definitions.js";
import { TransformationMatrix } from "../TransformationMatrix.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";
import {
  add,
  distance,
  dotProduct,
  normalize,
  parallel,
  perpendicular,
  reprVector,
  sameVector,
  scalarMultiply,
  squareDistance,
  subtract,
} from "../../vectorOperations";
import { Segment, AbstractSegment } from "./Segment.js";

const LINE_INSTANCE = Symbol.for("pantograph:Line");

export class Line extends AbstractSegment<Line> {
  segmentType = "LINE";

  static isInstance(value: unknown): value is Line {
    return (
      !!value && (value as { [LINE_INSTANCE]?: boolean })[LINE_INSTANCE] === true
    );
  }

  constructor(firstPoint: Vector, lastPoint: Vector) {
    super(firstPoint, lastPoint);
    Object.defineProperty(this, LINE_INSTANCE, { value: true });
  }

  isValidParameter(t: number): boolean {
    const linearPrecision = this.length * this.precision;
    return t >= -linearPrecision && 1 - t >= -linearPrecision;
  }

  paramPoint(t: number): Vector {
    return add(this.firstPoint, scalarMultiply(this.V, t));
  }

  get length(): number {
    return distance(this.firstPoint, this.lastPoint);
  }

  get squareLength(): number {
    return squareDistance(this.firstPoint, this.lastPoint);
  }

  private _V: Vector | null = null;
  get V(): Vector {
    if (this._V === null) {
      this._V = subtract(this.lastPoint, this.firstPoint);
    }
    return this._V;
  }

  private _slope: number | null = null;
  get slope(): number {
    if (this._slope === null) {
      const [x, y] = this.V;
      this._slope = y / x;
    }
    return this._slope;
  }

  private _yIntercept: number | null = null;
  get yIntercept(): number {
    if (this._yIntercept === null) {
      this._yIntercept = this.firstPoint[1] - this.slope * this.firstPoint[0];
    }
    return this._yIntercept;
  }

  get midPoint(): Vector {
    return add(this.firstPoint, scalarMultiply(this.V, 0.5));
  }

  isSame(other: Segment): boolean {
    if (!Line.isInstance(other)) return false;
    return (
      (sameVector(this.firstPoint, other.firstPoint) &&
        sameVector(this.lastPoint, other.lastPoint)) ||
      (sameVector(this.lastPoint, other.firstPoint) &&
        sameVector(this.firstPoint, other.lastPoint))
    );
  }

  clone(): Line {
    return new Line(this.firstPoint, this.lastPoint);
  }

  reverse(): Line {
    return new Line(this.lastPoint, this.firstPoint);
  }

  private _boundingBox: BoundingBox | null = null;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === null) {
      this._boundingBox = new BoundingBox(
        Math.min(this.firstPoint[0], this.lastPoint[0]) - this.precision,
        Math.min(this.firstPoint[1], this.lastPoint[1]) - this.precision,
        Math.max(this.firstPoint[0], this.lastPoint[0]) + this.precision,
        Math.max(this.firstPoint[1], this.lastPoint[1]) + this.precision,
      );
    }
    return this._boundingBox;
  }

  distanceFrom(point: Vector): number {
    const delta = subtract(point, this.firstPoint);
    const u = dotProduct(delta, this.V) / this.squareLength;

    if (u < 0) {
      return distance(point, this.firstPoint);
    }

    if (u > 1) {
      return distance(point, this.lastPoint);
    }

    const intersection = this.paramPoint(u);
    return distance(point, intersection);
  }
  isOnSegment(point: Vector): boolean {
    if (sameVector(point, this.firstPoint, this.precision)) return true;
    const pointVec = subtract(point, this.firstPoint);

    if (!parallel(this.V, pointVec)) return false;

    const u = dotProduct(pointVec, this.V) / this.squareLength;
    return this.isValidParameter(u);
  }

  gradientAt(param: number): Vector {
    return this.V;
  }

  tangentAt(point: Vector): Vector {
    if (!this.isOnSegment(point)) throw new Error("Point is not on segment");
    return normalize(this.V);
  }

  get normalVector() {
    return perpendicular(normalize(this.V));
  }

  get tangentAtFirstPoint(): Vector {
    return normalize(this.V);
  }

  get tangentAtLastPoint(): Vector {
    return normalize(this.V);
  }

  splitAt(points: Vector | Vector[]): Line[] {
    let splitPoints: Vector[];
    if (Array.isArray(points) && points.length === 0) {
      return [this];
    }
    if (!Array.isArray(points[0])) {
      splitPoints = [points as Vector];
    } else {
      splitPoints = points as Vector[];
    }

    // Check that all points are on the segment
    splitPoints.forEach((point) => {
      if (!this.isOnSegment(point))
        throw new Error(
          `Point ${reprVector(point)} is not on segment ${this.repr}`,
        );
    });

    const allPoints = [this.firstPoint, ...splitPoints, this.lastPoint];
    const uniquePoints = removeDuplicatePoints(allPoints);

    // Sort the points to make sure they go from the first point to the last
    const xChange = this.lastPoint[0] - this.firstPoint[0];
    let defaultDir = Math.sign(xChange);
    let comparisonAxis = 0;

    if (Math.abs(xChange) < this.precision) {
      defaultDir = Math.sign(this.lastPoint[1] - this.firstPoint[1]);
      comparisonAxis = 1;
    }

    uniquePoints.sort(
      (a, b) => defaultDir * (a[comparisonAxis] - b[comparisonAxis]),
    );

    return uniquePoints.flatMap((point, index) => {
      if (index === uniquePoints.length - 1) return [];
      return new Line(point, uniquePoints[index + 1]);
    });
  }

  transform(matrix: TransformationMatrix): Line {
    return new Line(
      matrix.transform(this.firstPoint),
      matrix.transform(this.lastPoint),
    );
  }
}
