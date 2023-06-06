import { BoundingBox } from "../BoundingBox.js";
import { Vector } from "../../definitions.js";
import { TransformationMatrix } from "../TransformationMatrix.js";
import {
  add,
  cartesianToPolar,
  crossProduct,
  distance,
  normalize,
  perpendicular,
  perpendicularClockwise,
  polarToCartesian,
  reprVector,
  sameVector,
  scalarMultiply,
  squareDistance,
  subtract,
} from "../../vectorOperations";
import { Segment, AbstractSegment } from "./Segment.js";
import zip from "../../utils/zip.js";
import { unitAngle } from "../../utils/unitAngle.js";
import { angularDistance } from "../../utils/angularDistance.js";
import { Line } from "./Line.js";
import { lineLineParams } from "../../algorithms/intersections/lineLineIntersection.js";

const polarCoordsFromCenter = (point: Vector, center: Vector) => {
  const vector = subtract(point, center);
  return cartesianToPolar(vector);
};

export class Arc extends AbstractSegment<Arc> {
  segmentType = "ARC";

  readonly center: Vector;
  readonly clockwise: boolean;

  constructor(
    firstPoint: Vector,
    lastPoint: Vector,
    center: Vector,
    clockwise = false,
    { ignoreChecks = false } = {}
  ) {
    super(firstPoint, lastPoint);
    this.center = center;
    this.clockwise = clockwise;

    if (!ignoreChecks) {
      if (sameVector(firstPoint, lastPoint)) {
        throw new Error("Invalid arc, cannot be a full circle");
      }
      if (
        Math.abs(this.radius - distance(this.lastPoint, this.center)) >
        this.precision
      )
        throw new Error(
          `Invalid arc, radius does not match between ${reprVector(
            firstPoint
          )} and ${reprVector(lastPoint)}} (center ${reprVector(center)})`
        );
    }
  }

  get info() {
    return `ARC(${reprVector(this.firstPoint)}, ${reprVector(
      this.lastPoint
    )}, ${reprVector(this.center)}, ${this.clockwise ? "CW" : "CCW"})`;
  }

  private _coefficients: {
    x2: number;
    xy: number;
    y2: number;
    x: number;
    y: number;
    c: number;
  } | null = null;
  get coefficients(): {
    x2: number;
    xy: number;
    y2: number;
    x: number;
    y: number;
    c: number;
  } {
    if (this._coefficients === null) {
      const [x0, y0] = this.center;
      const r2 = this.radius * this.radius;

      this._coefficients = {
        x2: 1 / r2,
        xy: 0,
        y2: 1 / r2,
        x: -(2 * x0) / r2,
        y: -(2 * y0) / r2,
        c: (x0 * x0 + y0 * y0 - r2) / r2,
      };
    }
    return this._coefficients;
  }

  isValidParameter(t: number): boolean {
    return 1 - t >= -this.precision && t >= -this.precision;
  }

  angleToParam(angle: number): number {
    return (
      angularDistance(this.firstAngle, unitAngle(angle), this.clockwise) /
      this.angularLength
    );
  }

  private _angularLength: number | null = null;
  get angularLength() {
    if (!this._angularLength) {
      this._angularLength = angularDistance(
        this.firstAngle,
        this.lastAngle,
        this.clockwise
      );
    }
    return this._angularLength;
  }

  paramPoint(t: number): Vector {
    return add(
      this.center,
      polarToCartesian(
        this.radius,
        this.firstAngle + t * this.angularLength * (this.clockwise ? -1 : 1)
      )
    );
  }

  pointToParam(point: Vector): number {
    const [r, theta] = polarCoordsFromCenter(point, this.center);
    if (Math.abs(r - this.radius) > this.precision)
      throw new Error(
        `Point ${reprVector(point)} is not on segment ${this.repr}`
      );

    const param = this.angleToParam(theta);
    if (!this.isValidParameter(param))
      throw new Error(
        `Point ${reprVector(point)} is not on segment ${this.repr}`
      );

    return param;
  }

  private _radius: number | null = null;
  get radius(): number {
    if (this._radius === null) {
      this._radius = distance(this.firstPoint, this.center);
    }
    return this._radius;
  }

  private _firstAngle: number | null = null;
  get firstAngle(): number {
    if (this._firstAngle === null) {
      const [x, y] = subtract(this.firstPoint, this.center);
      this._firstAngle = unitAngle(Math.atan2(y, x));
    }
    return this._firstAngle;
  }

  private _lastAngle: number | null = null;
  get lastAngle(): number {
    if (this._lastAngle === null) {
      const [x, y] = subtract(this.lastPoint, this.center);
      this._lastAngle = unitAngle(Math.atan2(y, x));
    }
    return this._lastAngle;
  }

  get length(): number {
    return this.radius * this.angularLength;
  }

  get squareLength(): number {
    return this.length * this.length;
  }

  get midPoint(): Vector {
    return this.paramPoint(0.5);
  }

  isSame(other: Segment): boolean {
    if (!(other instanceof Arc)) return false;
    if (!sameVector(this.center, other.center)) return false;

    return (
      (sameVector(this.firstPoint, other.firstPoint) &&
        sameVector(this.lastPoint, other.lastPoint) &&
        this.clockwise === other.clockwise) ||
      (sameVector(this.lastPoint, other.firstPoint) &&
        sameVector(this.firstPoint, other.lastPoint) &&
        this.clockwise === !other.clockwise)
    );
  }

  clone(): Arc {
    return new Arc(
      this.firstPoint,
      this.lastPoint,
      this.center,
      this.clockwise
    );
  }

  reverse(): Arc {
    return new Arc(
      this.lastPoint,
      this.firstPoint,
      this.center,
      !this.clockwise
    );
  }

  private _boundingBox: BoundingBox | null = null;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === null) {
      const extendedR = this.radius + this.precision;
      const validAngle = (angle: number) =>
        this.isValidParameter(this.angleToParam(angle));
      this._boundingBox = new BoundingBox(
        validAngle(Math.PI)
          ? this.center[0] - extendedR
          : Math.min(this.firstPoint[0], this.lastPoint[0]) - this.precision,
        validAngle(Math.PI * 1.5)
          ? this.center[1] - extendedR
          : Math.min(this.firstPoint[1], this.lastPoint[1]) - this.precision,
        validAngle(0)
          ? this.center[0] + extendedR
          : Math.max(this.firstPoint[0], this.lastPoint[0]) + this.precision,
        validAngle(Math.PI / 2)
          ? this.center[1] + extendedR
          : Math.max(this.firstPoint[1], this.lastPoint[1]) + this.precision
      );
    }
    return this._boundingBox;
  }

  distanceFrom(point: Vector): number {
    const [r, theta] = polarCoordsFromCenter(point, this.center);
    if (this.isValidParameter(this.angleToParam(theta))) {
      return Math.abs(r - this.radius);
    }
    return Math.sqrt(
      Math.min(
        squareDistance(point, this.firstPoint),
        squareDistance(point, this.lastPoint)
      )
    );
  }

  isOnSegment(point: Vector): boolean {
    if (sameVector(point, this.firstPoint) || sameVector(point, this.lastPoint))
      return true;
    const [r, theta] = polarCoordsFromCenter(point, this.center);
    if (Math.abs(r - this.radius) > this.precision) return false;

    const param = this.angleToParam(theta);
    return this.isValidParameter(param);
  }

  gradientAt(param: number): Vector {
    const theta =
      this.firstAngle + param * this.angularLength * (this.clockwise ? -1 : 1);
    const r = this.radius * this.angularLength;

    const x = -r * Math.sin(theta);
    const y = r * Math.cos(theta);

    return this.clockwise ? [-x, -y] : [x, y];
  }

  tangentAt(point: Vector): Vector {
    const [r, theta] = polarCoordsFromCenter(point, this.center);
    if (Math.abs(r - this.radius) > this.precision)
      throw new Error("Point is not on the arc");

    const param = this.angleToParam(theta);
    if (!this.isValidParameter(param))
      throw new Error("Point is not on the arc");

    const tangent = polarToCartesian(1, theta);
    const fcn = this.clockwise ? perpendicularClockwise : perpendicular;
    return fcn(normalize(tangent));
  }

  get tangentAtFirstPoint(): Vector {
    const tangent = polarToCartesian(1, this.firstAngle);
    const fcn = this.clockwise ? perpendicularClockwise : perpendicular;
    return fcn(normalize(tangent));
  }

  get tangentAtLastPoint(): Vector {
    const tangent = polarToCartesian(1, this.lastAngle);
    const fcn = this.clockwise ? perpendicularClockwise : perpendicular;
    return fcn(normalize(tangent));
  }

  splitAt(points: Vector | Vector[]): Arc[] {
    let splitPoints: Vector[];
    if (Array.isArray(points) && points.length === 0) {
      return [this];
    }
    if (!Array.isArray(points[0])) {
      splitPoints = [points as Vector];
    } else {
      splitPoints = points as Vector[];
    }

    // Point to param also checks that all points are on the segment
    const splitParams = splitPoints.map((point) => this.pointToParam(point));

    const allParams = [0, 1, ...splitParams];

    // We use a map here, because we want to keep the entered split points
    // exactly (no change from the transformation from and to params).
    const paramsMap = new Map<number, Vector>(
      zip([allParams, [this.firstPoint, this.lastPoint, ...splitPoints]]) as [
        number,
        Vector
      ][]
    );
    allParams.sort((a, b) => a - b);

    let skipped: null | number = null;
    return allParams.flatMap((param, index) => {
      if (index === allParams.length - 1) return [];
      const nextParam = allParams[index + 1];

      if (nextParam - param < this.precision) {
        if (skipped === null) skipped = param;
        return [];
      }

      const startParam = skipped === null ? param : skipped;
      const arc = new Arc(
        paramsMap.get(startParam) || this.paramPoint(startParam),
        paramsMap.get(nextParam) || this.paramPoint(nextParam),
        this.center,
        this.clockwise
      );
      skipped = null;
      return arc;
    });
  }

  transform(matrix: TransformationMatrix): Arc {
    return new Arc(
      matrix.transform(this.firstPoint),
      matrix.transform(this.lastPoint),
      matrix.transform(this.center),
      matrix.keepsOrientation() ? this.clockwise : !this.clockwise
    );
  }
}

export function threePointsArc(
  firstPoint: Vector,
  midPoint: Vector,
  lastPoint: Vector
) {
  const chord1 = new Line(midPoint, firstPoint);
  const chord2 = new Line(midPoint, lastPoint);

  const dir1 = perpendicular(chord1.tangentAtFirstPoint);
  const dir2 = perpendicular(chord2.tangentAtLastPoint);

  const result = lineLineParams(
    { firstPoint: chord1.midPoint, V: dir1, precision: 1e-9 },
    { firstPoint: chord2.midPoint, V: dir2, precision: 1e-9 }
  );

  if (result === "parallel")
    throw new Error("Cannot create an arc from three colinear points");

  const clockwise =
    crossProduct(
      subtract(firstPoint, midPoint),
      subtract(lastPoint, midPoint)
    ) > 0;

  return new Arc(
    firstPoint,
    lastPoint,
    add(chord1.midPoint, scalarMultiply(dir1, result.intersectionParam1)),
    clockwise,
    { ignoreChecks: true }
  );
}

export function tangentArc(
  firstPoint: Vector,
  lastPoint: Vector,
  tangentAtFirstPoint: Vector
) {
  const chord = new Line(lastPoint, firstPoint);
  const dir = perpendicular(chord.tangentAtFirstPoint);

  const result = lineLineParams(
    { firstPoint: chord.midPoint, V: dir, precision: 1e-9 },
    {
      firstPoint: firstPoint,
      V: perpendicular(tangentAtFirstPoint),
      precision: 1e-9,
    }
  );

  if (result === "parallel")
    throw new Error("Cannot create an arc from three colinear points");

  const center = add(
    chord.midPoint,
    scalarMultiply(dir, result.intersectionParam1)
  );

  const clockwise =
    crossProduct(
      subtract(center, firstPoint),
      subtract(center, add(firstPoint, tangentAtFirstPoint))
    ) < 0;

  return new Arc(firstPoint, lastPoint, center, clockwise, {
    ignoreChecks: true,
  });
}
