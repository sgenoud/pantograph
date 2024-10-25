import { findScalarMinimum } from "../../algorithms/optimisation/Brent.js";
import { solveQuadratic } from "../../algorithms/solvers/solvePolynomials.js";
import { Vector } from "../../definitions.js";
import zip from "../../utils/zip.js";
import {
  distance,
  normalize,
  perpendicular,
  sameVector,
  squareDistance,
  subtract,
} from "../../vectorOperations.js";
import { BoundingBox, pointsBoundingBox } from "../BoundingBox.js";
import { TransformationMatrix } from "../TransformationMatrix.js";
import { AbstractSegment } from "./Segment.js";
import { deCasteljauWithHistory } from "./utils/deCasteljau.js";

export class QuadraticBezier extends AbstractSegment<QuadraticBezier> {
  segmentType = "QUADRATIC_BEZIER";

  readonly controlPoint: Vector;

  constructor(
    firstPoint: Vector,
    lastPoint: Vector,
    controlPoint: Vector,
    //{ ignoreChecks = false } = {}
  ) {
    super(firstPoint, lastPoint);
    this.controlPoint = controlPoint;
  }

  get midPoint() {
    return this.paramPoint(0.5);
  }

  _boundingBox: BoundingBox | null = null;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === null) {
      const extremaInDir = (idx: number) => {
        const [p1, p2, p3] = [
          this.firstPoint[idx],
          this.controlPoint[idx],
          this.lastPoint[idx],
        ];

        const denom = p1 - 2 * p2 + p3;
        if (!denom) {
          return [];
        }
        const ratio = (p1 - p2) / denom;
        return ratio >= -this.precision && ratio <= 1 + this.precision
          ? [ratio]
          : [];
      };

      this._boundingBox = pointsBoundingBox([
        this.firstPoint,
        // There is either one or zero extrema in each direction
        ...extremaInDir(0).map((t) => this.paramPoint(t)),
        ...extremaInDir(1).map((t) => this.paramPoint(t)),
        this.lastPoint,
      ]).grow(this.precision);
    }

    return this._boundingBox;
  }

  clone() {
    return new QuadraticBezier(
      this.firstPoint,
      this.lastPoint,
      this.controlPoint,
    );
  }

  reverse() {
    return new QuadraticBezier(
      this.lastPoint,
      this.firstPoint,
      this.controlPoint,
    );
  }

  isSame(other: QuadraticBezier): boolean {
    if (other.segmentType !== "QUADRATIC_BEZIER") {
      return false;
    }
    return (
      sameVector(this.firstPoint, other.firstPoint) &&
      sameVector(this.lastPoint, other.lastPoint) &&
      sameVector(this.controlPoint, other.controlPoint)
    );
  }

  distanceFrom(element: Vector): number {
    const func = (t: number) => squareDistance(this.paramPoint(t), element);

    const status = findScalarMinimum(func, this.precision);

    // We check that it converged in the valid interval
    if (status.argMin < -this.precision || status.argMin > 1 + this.precision) {
      return Math.min(
        distance(this.firstPoint, element),
        distance(this.lastPoint, element),
      );
    }
    return Math.sqrt(status.fMin);
  }

  isOnSegment(point: Vector) {
    if (!this.boundingBox.contains(point)) {
      return false;
    }
    try {
      const t = this.pointToParam(point);
      return t >= -this.precision && t <= 1 + this.precision;
    } catch (e) {
      return false;
    }
  }

  gradientAt(t: number) {
    const f = (index: 0 | 1) => {
      const p1 = this.firstPoint[index];
      const p2 = this.controlPoint[index];
      const p3 = this.lastPoint[index];

      return 2 * (t * (p1 - 2 * p2 + p3) - p1 + p2);
    };

    return [f(0), f(1)] as Vector;
  }

  tangentAt(point: Vector) {
    const t = this.pointToParam(point);
    return normalize(this.gradientAt(t));
  }

  get tangentAtFirstPoint() {
    return normalize(subtract(this.controlPoint, this.firstPoint));
  }
  get tangentAtLastPoint() {
    return normalize(subtract(this.controlPoint, this.lastPoint));
  }

  normalAt(point: Vector): Vector {
    const tgt = this.tangentAt(point);
    return perpendicular(tgt);
  }

  splitAtParameters(
    params: number[],
    paramsMap: null | Map<number, Vector> = null,
  ): QuadraticBezier[] {
    const splitParams = [...params];
    splitParams.sort((a, b) => a - b);

    let previousPointInfo = {
      originalParam: 0,
      param: 0,
      p0: this.firstPoint,
      p1: this.controlPoint,
    };

    return splitParams.flatMap((originalParam, index) => {
      if (originalParam - previousPointInfo.originalParam < this.precision) {
        // We skip when params are very close to each other
        return [];
      }

      // If we have params close to one we clamp them to one
      let paramCloseTo1 = false;
      if (originalParam > 1 - this.precision) {
        paramCloseTo1 = true;
      }

      const param =
        (originalParam - previousPointInfo.originalParam) /
        (1 - previousPointInfo.originalParam);

      const splitHistory = deCasteljauWithHistory(
        [previousPointInfo.p0, previousPointInfo.p1, this.lastPoint],
        paramCloseTo1 ? 1 : param,
      );

      const splitPoint = paramCloseTo1
        ? this.lastPoint
        : (paramsMap?.get(originalParam) ?? splitHistory[0][0]);
      const newControlPoint = splitHistory[1][0];
      const newNextControlPoint = splitHistory[1][1];

      const newSegment = new QuadraticBezier(
        previousPointInfo.p0,
        splitPoint,
        newControlPoint,
      );

      previousPointInfo = {
        param: param,
        originalParam: originalParam,
        p0: splitPoint,
        p1: newNextControlPoint,
      };

      if (index === splitParams.length - 1 && !paramCloseTo1) {
        return [
          newSegment,
          new QuadraticBezier(
            previousPointInfo.p0,
            this.lastPoint,
            previousPointInfo.p1,
          ),
        ];
      }

      return newSegment;
    });
  }

  splitAt(points: Vector[] | Vector) {
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

    // We use a map here, because we want to keep the entered split points
    // exactly (no change from the transformation from and to params).
    const paramsMap = new Map<number, Vector>(
      zip([splitParams, splitPoints]) as [number, Vector][],
    );

    return this.splitAtParameters(splitParams, paramsMap);
  }

  transform(matrix: TransformationMatrix) {
    return new QuadraticBezier(
      matrix.transform(this.firstPoint),
      matrix.transform(this.lastPoint),
      matrix.transform(this.controlPoint),
    );
  }

  paramPoint(t: number) {
    const complement = 1 - t;

    const a = complement * complement;
    const b = 2 * complement * t;
    const c = t * t;

    return [
      a * this.firstPoint[0] + b * this.controlPoint[0] + c * this.lastPoint[0],
      a * this.firstPoint[1] + b * this.controlPoint[1] + c * this.lastPoint[1],
    ] as Vector;
  }

  _polynomialCoefficients: null | [number, number, number][] = null;
  get polynomialCoefficients() {
    if (this._polynomialCoefficients === null) {
      const coeffs = (index: 0 | 1) => {
        const p1 = this.firstPoint[index];
        const p2 = this.controlPoint[index];
        const p3 = this.lastPoint[index];

        // We formulate the equation as z2 * t^2 + z1 * t  + z0 = 0
        const z2 = p1 - 2 * p2 + p3;
        const z1 = 2 * (p2 - p1);
        const z0 = p1;

        return [z0, z1, z2] as [number, number, number];
      };

      this._polynomialCoefficients = [coeffs(0), coeffs(1)];
    }

    return this._polynomialCoefficients;
  }

  paramsAtY(y: number) {
    const [z0, z1, z2] = this.polynomialCoefficients[1];
    return solveQuadratic(z0 - y, z1, z2).filter(
      (z) => z >= -this.precision && z <= 1 + this.precision,
    );
  }

  pointToParam(point: Vector) {
    const potentialParams = this.paramsAtY(point[1]);
    if (potentialParams.length === 0) {
      throw new Error("Point is not on the curve!");
    }

    const valueChecks = (t: number) => {
      return Math.abs(this.paramPoint(t)[0] - point[0]) <= this.precision;
    };

    const t = potentialParams.find(valueChecks);
    if (t === undefined) {
      throw new Error("Point is not on the curve");
    }
    return t;
  }
}
