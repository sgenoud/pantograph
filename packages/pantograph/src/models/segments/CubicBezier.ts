import { findScalarMinimum } from "../../algorithms/optimisation/Brent.js";
import {
  solveCubic,
  solveQuadratic,
} from "../../algorithms/solvers/solvePolynomials.js";
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

export class CubicBezier extends AbstractSegment<CubicBezier> {
  segmentType = "CUBIC_BEZIER";

  readonly firstControlPoint: Vector;
  readonly lastControlPoint: Vector;

  constructor(
    firstPoint: Vector,
    lastPoint: Vector,
    firstControlPoint: Vector,
    lastControlPoint: Vector,
    //{ ignoreChecks = false } = {}
  ) {
    super(firstPoint, lastPoint);
    this.firstControlPoint = firstControlPoint;
    this.lastControlPoint = lastControlPoint;
  }

  get midPoint() {
    return this.paramPoint(0.5);
  }

  private _extremaInDirection(idx: 0 | 1) {
    const [p1, p2, p3, p4] = [
      this.firstPoint[idx],
      this.firstControlPoint[idx],
      this.lastControlPoint[idx],
      this.lastPoint[idx],
    ];

    const a = -p1 + 3 * p2 - 3 * p3 + p4;
    const b = 2 * p1 - 4 * p2 + 2 * p3;
    const c = -p1 + p2;

    return solveQuadratic(c, b, a).filter(
      (r) => r >= -this.precision && r <= 1 + this.precision,
    );
  }

  getParametersOfExtrema() {
    return Array.from(
      new Set(this._extremaInDirection(0).concat(this._extremaInDirection(1))),
    );
  }

  _boundingBox: BoundingBox | null = null;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === null) {
      this._boundingBox = pointsBoundingBox([
        this.firstPoint,
        ...this.getParametersOfExtrema().map((t) => this.paramPoint(t)),
        this.lastPoint,
      ]).grow(this.precision);
    }

    return this._boundingBox;
  }

  clone() {
    return new CubicBezier(
      this.firstPoint,
      this.lastPoint,
      this.firstControlPoint,
      this.lastControlPoint,
    );
  }

  reverse() {
    return new CubicBezier(
      this.lastPoint,
      this.firstPoint,
      this.lastControlPoint,
      this.firstControlPoint,
    );
  }

  isSame(other: CubicBezier): boolean {
    if (other.segmentType !== "CUBIC_BEZIER") {
      return false;
    }
    return (
      sameVector(this.firstPoint, other.firstPoint) &&
      sameVector(this.lastPoint, other.lastPoint) &&
      sameVector(this.firstControlPoint, other.firstControlPoint) &&
      sameVector(this.lastControlPoint, other.lastControlPoint)
    );
  }

  distanceFrom(element: Vector): number {
    const func = (t: number) => squareDistance(this.paramPoint(t), element);

    // We might want to scan for the global minimum before using Brent's method
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
    const complement = 1 - t;
    const complement2 = complement * complement;
    const t2 = t * t;

    const a = 3 * complement2;
    const b = 6 * complement * t;
    const c = 3 * t2;

    const p1p0 = subtract(this.firstControlPoint, this.firstPoint);
    const p2p1 = subtract(this.lastControlPoint, this.firstControlPoint);
    const p3p2 = subtract(this.lastPoint, this.lastControlPoint);

    return [
      a * p1p0[0] + b * p2p1[0] + c * p3p2[0],
      a * p1p0[1] + b * p2p1[1] + c * p3p2[1],
    ] as Vector;
  }

  tangentAt(point: Vector) {
    const t = this.pointToParam(point);
    return normalize(this.gradientAt(t));
  }

  get tangentAtFirstPoint() {
    return normalize(subtract(this.firstControlPoint, this.firstPoint));
  }
  get tangentAtLastPoint() {
    return normalize(subtract(this.lastPoint, this.lastControlPoint));
  }

  normalAt(point: Vector): Vector {
    const tgt = this.tangentAt(point);
    return perpendicular(tgt);
  }

  get normalAtFirstPoint() {
    return perpendicular(this.tangentAtFirstPoint);
  }

  get normalAtLastPoint() {
    return perpendicular(this.tangentAtLastPoint);
  }

  splitAtParameters(
    params: number[],
    paramsMap: null | Map<number, Vector> = null,
  ): CubicBezier[] {
    const splitParams = [...params];
    splitParams.sort((a, b) => a - b);

    let previousPointInfo = {
      originalParam: 0,
      param: 0,
      p0: this.firstPoint,
      p1: this.firstControlPoint,
      p2: this.lastControlPoint,
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
        [
          previousPointInfo.p0,
          previousPointInfo.p1,
          previousPointInfo.p2,
          this.lastPoint,
        ],
        paramCloseTo1 ? 1 : param,
      );

      const splitPoint = paramCloseTo1
        ? this.lastPoint
        : (paramsMap?.get(originalParam) ?? splitHistory[0][0]);
      const newLastControlPoint = splitHistory[1][0];
      const newFirstControlPoint = splitHistory[2][0];
      const nextFirstControlPoint = splitHistory[1][1];
      const nextLastControlPoint = splitHistory[2][2];

      const newSegment = new CubicBezier(
        previousPointInfo.p0,
        splitPoint,
        newFirstControlPoint,
        newLastControlPoint,
      );

      previousPointInfo = {
        param: param,
        originalParam: originalParam,
        p0: splitPoint,
        p1: nextFirstControlPoint,
        p2: nextLastControlPoint,
      };

      if (index === splitParams.length - 1 && !paramCloseTo1) {
        return [
          newSegment,
          new CubicBezier(
            previousPointInfo.p0,
            this.lastPoint,
            previousPointInfo.p1,
            previousPointInfo.p2,
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
    return new CubicBezier(
      matrix.transform(this.firstPoint),
      matrix.transform(this.lastPoint),
      matrix.transform(this.firstControlPoint),
      matrix.transform(this.lastControlPoint),
    );
  }

  paramPoint(t: number) {
    const complement = 1 - t;
    const complement2 = complement * complement;
    const t2 = t * t;

    const a = complement2 * complement;
    const b = 3 * complement2 * t;
    const c = 3 * complement * t2;
    const d = t2 * t;

    return [
      a * this.firstPoint[0] +
        b * this.firstControlPoint[0] +
        c * this.lastControlPoint[0] +
        d * this.lastPoint[0],
      a * this.firstPoint[1] +
        b * this.firstControlPoint[1] +
        c * this.lastControlPoint[1] +
        d * this.lastPoint[1],
    ] as Vector;
  }

  _polynomialCoefficients: null | [number, number, number, number][] = null;
  get polynomialCoefficients() {
    if (this._polynomialCoefficients === null) {
      const coeffs = (index: 0 | 1) => {
        const p1 = this.firstPoint[index];
        const p2 = this.firstControlPoint[index];
        const p3 = this.lastControlPoint[index];
        const p4 = this.lastPoint[index];

        // We formulate the equation as z3 * t^3 + z2 * t^2 + z1 * t  + z0 = 0
        const z3 = -p1 + 3 * p2 - 3 * p3 + p4;
        const z2 = 3 * p1 - 6 * p2 + 3 * p3;
        const z1 = -3 * p1 + 3 * p2;
        const z0 = p1;

        return [z0, z1, z2, z3] as [number, number, number, number];
      };

      this._polynomialCoefficients = [coeffs(0), coeffs(1)];
    }

    return this._polynomialCoefficients;
  }

  paramsAtY(y: number) {
    const [z0, z1, z2, z3] = this.polynomialCoefficients[1];
    return solveCubic(z0 - y, z1, z2, z3).filter(
      (z) => z >= -this.precision && z <= 1 + this.precision,
    );
  }

  pointToParam(point: Vector) {
    const potentialParams = this.paramsAtY(point[1]);
    if (potentialParams.length === 0) {
      throw new Error("Point is not on the curve");
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
