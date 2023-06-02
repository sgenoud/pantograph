import { BoundingBox, pointsBoundingBox } from "../BoundingBox";
import { Vector } from "../../definitions";
import { TransformationMatrix } from "../TransformationMatrix";
import {
  add,
  DEG2RAD,
  distance,
  isOnAxis,
  normalize,
  perpendicular,
  perpendicularClockwise,
  polarToCartesian,
  RAD2DEG,
  reprVector,
  sameVector,
  scalarMultiply,
} from "../../vectorOperations";
import { AbstractSegment } from "./Segment";
import { unitAngle } from "../../utils/unitAngle";
import { angularDistance } from "../../utils/angularDistance";
import zip from "../../utils/zip";
import { Arc } from "./Arc";

export class EllipseArc extends AbstractSegment<EllipseArc> {
  segmentType = "ELLIPSE_ARC";

  // I would need to do some more work to improve the precision that I can have
  // on an ellipse with intersection algorithms
  precision = 1e-6;

  readonly majorRadius: number;
  readonly minorRadius: number;
  readonly center: Vector;
  readonly tiltAngle: number;
  readonly clockwise: boolean;

  constructor(
    firstPoint: Vector,
    lastPoint: Vector,
    center: Vector,
    r0: number,
    r1: number,
    tiltAngle: number,
    clockwise = false,
    {
      ignoreChecks = false,
      angleUnits = "deg",
    }: { ignoreChecks?: boolean; angleUnits?: "deg" | "rad" } = {}
  ) {
    super(firstPoint, lastPoint);

    // Ellipse configuration
    this.center = center;

    const majorOrdered = r0 >= r1;

    this.majorRadius = majorOrdered ? r0 : r1;
    this.minorRadius = majorOrdered ? r1 : r0;

    const radTiltAngle = angleUnits === "deg" ? tiltAngle * DEG2RAD : tiltAngle;
    this.tiltAngle = unitAngle(
      majorOrdered ? radTiltAngle : radTiltAngle + Math.PI / 2
    );
    this.clockwise = clockwise;

    if (!ignoreChecks) {
      if (sameVector(firstPoint, lastPoint)) {
        throw new Error("Invalid arc, cannot be a full circle");
      }

      if (!this.isPointOnEllipse(firstPoint)) {
        throw new Error(
          `First point ${reprVector(
            firstPoint
          )} not on the ellipse defined by ${this.info}`
        );
      }
      if (!this.isPointOnEllipse(lastPoint)) {
        throw new Error(
          `Last point ${reprVector(lastPoint)} not on the ellipse defined by ${
            this.info
          }`
        );
      }

      if (Math.abs(this.majorRadius - this.minorRadius) < this.precision) {
        throw new Error(
          `Both radii should be different, create an arc instead`
        );
      }
    }
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
      const a2 = this.majorRadius * this.majorRadius;
      const b2 = this.minorRadius * this.minorRadius;
      const A = Math.cos(-this.tiltAngle);
      const B = Math.sin(-this.tiltAngle);

      this._coefficients = {
        x2: (A * A) / a2 + (B * B) / b2,
        xy: (2 * A * B) / b2 - (2 * A * B) / a2,
        y2: (A * A) / b2 + (B * B) / a2,
        x:
          (2 * A * B * y0 - 2 * x0 * A * A) / a2 +
          (-2 * x0 * B * B - 2 * A * B * y0) / b2,
        y:
          (2 * x0 * A * B - 2 * B * B * y0) / a2 +
          (-2 * x0 * A * B - 2 * A * A * y0) / b2,
        c:
          (x0 * x0 * A * A - 2 * x0 * A * B * y0 + B * B * y0 * y0) / a2 +
          (x0 * x0 * B * B + 2 * x0 * A * B * y0 + A * A * y0 * y0) / b2 -
          1,
      };
    }
    return this._coefficients;
  }

  get info() {
    return `ELLIPSE_ARC(${reprVector(this.firstPoint)}, ${reprVector(
      this.lastPoint
    )}, ${reprVector(this.center)}, ${this.majorRadius}, ${this.minorRadius}, ${
      this.tiltAngle * RAD2DEG
    }, ${this.clockwise ? "CW" : "CCW"})`;
  }

  reverse(): EllipseArc {
    return new EllipseArc(
      this.lastPoint,
      this.firstPoint,
      this.center,
      this.majorRadius,
      this.minorRadius,
      this.tiltAngle,
      !this.clockwise,
      { ignoreChecks: true, angleUnits: "rad" }
    );
  }

  clone(): EllipseArc {
    return new EllipseArc(
      this.firstPoint,
      this.lastPoint,
      this.center,
      this.majorRadius,
      this.minorRadius,
      this.tiltAngle,
      this.clockwise,
      { ignoreChecks: true, angleUnits: "rad" }
    );
  }

  private computeEllipseExtrema(): Vector[] {
    const tanTiltAngle = Math.tan(this.tiltAngle);
    const radiRatio = this.minorRadius / this.majorRadius;
    const v1 = -Math.atan(radiRatio * tanTiltAngle);
    const v2 = Math.atan(radiRatio / tanTiltAngle);
    const extremaAngles = [v1, Math.PI + v1, v2, Math.PI + v2];

    return extremaAngles
      .map((angle) => this.thetaToParam(angle))
      .filter((param) => this.isValidParameter(param))
      .map((param) => this.paramPoint(param));
  }

  private _boundingBox: BoundingBox | undefined;
  get boundingBox(): BoundingBox {
    if (this._boundingBox === undefined) {
      const ellipseExtrema = this.computeEllipseExtrema();
      const extremaPoints = [
        this.firstPoint,
        this.lastPoint,
        ...ellipseExtrema,
      ];
      this._boundingBox = pointsBoundingBox(extremaPoints);
    }

    return this._boundingBox;
  }

  private _linearExentricity?: number | undefined;
  get linearExentricity(): number {
    if (this._linearExentricity === undefined) {
      this._linearExentricity = Math.sqrt(
        this.majorRadius * this.majorRadius -
          this.minorRadius * this.minorRadius
      );
    }
    return this._linearExentricity;
  }

  private _exentricity?: number | undefined;
  get exentricity(): number {
    if (this._exentricity === undefined) {
      this._exentricity = this.linearExentricity / this.majorRadius;
    }
    return this._exentricity;
  }

  private _focals?: [Vector, Vector] | undefined;
  get focals(): [Vector, Vector] {
    if (this._focals === undefined) {
      const axis = this.majorAxis;
      this._focals = [
        add(this.center, scalarMultiply(axis, this.linearExentricity)),
        add(this.center, scalarMultiply(axis, -this.linearExentricity)),
      ];
    }

    return this._focals;
  }

  get majorAxis(): Vector {
    return polarToCartesian(1, this.tiltAngle);
  }

  paramPoint(t: number): Vector {
    const angle =
      this.firstAngle + t * this.deltaAngle * (this.clockwise ? -1 : 1);
    return this.reverseEllipseReferenceFrameTransform.transform([
      this.majorRadius * Math.cos(angle),
      this.minorRadius * Math.sin(angle),
    ]);
  }

  pointToParam(point: Vector): number {
    if (!this.isPointOnEllipse(point)) {
      throw new Error(
        `Point ${reprVector(point)} not on the ellipse defined by ${this.repr}`
      );
    }

    const param = this.thetaToParam(this.pointTheta(point));
    if (!this.isValidParameter(param))
      throw new Error(
        `Point ${reprVector(point)} is not on segment ${this.repr}`
      );

    return param;
  }

  get midPoint(): Vector {
    return this.paramPoint(0.5);
  }

  isValidParameter(t: number): boolean {
    return 1 - t >= -this.precision && t >= -this.precision;
  }

  isSame(other: EllipseArc): boolean {
    const sameEllipse =
      sameVector(this.center, other.center) &&
      Math.abs(this.majorRadius - other.majorRadius) < this.precision &&
      Math.abs(this.minorRadius - other.minorRadius) < this.precision &&
      (Math.abs(this.tiltAngle - other.tiltAngle) < this.precision ||
        Math.abs(Math.abs(this.tiltAngle - other.tiltAngle) - Math.PI) <
          this.precision);

    return (
      sameEllipse &&
      ((sameVector(this.firstPoint, other.firstPoint) &&
        this.clockwise === other.clockwise) ||
        (sameVector(this.firstPoint, other.lastPoint) &&
          this.clockwise !== other.clockwise))
    );
  }

  pointTheta(point: Vector): number {
    const pPrime = this.ellipseReferenceFrameTransform.transform(point);
    const theta = Math.atan2(
      pPrime[1] / this.minorRadius,
      pPrime[0] / this.majorRadius
    );
    return unitAngle(theta);
  }
  thetaToParam(angle: number): number {
    return (
      angularDistance(this.firstAngle, unitAngle(angle), this.clockwise) /
      this.deltaAngle
    );
  }

  private isPointOnEllipse(point: Vector): boolean {
    const [f1, f2] = this.focals;

    const d1 = distance(point, f1);
    const d2 = distance(point, f2);

    return Math.abs(2 * this.majorRadius - d1 - d2) < this.precision;
  }

  isOnSegment(point: Vector): boolean {
    if (!this.isPointOnEllipse(point)) {
      return false;
    }
    return this.isValidParameter(this.thetaToParam(this.pointTheta(point)));
  }

  distanceFrom(point: Vector): number {
    let closestPoint;
    if (sameVector(point, this.center)) {
      closestPoint = add(
        this.center,
        scalarMultiply(perpendicular(this.majorAxis), this.minorRadius)
      );
    } else {
      closestPoint = this.reverseEllipseReferenceFrameTransform.transform(
        closestPointOnEllipse(
          this.majorRadius,
          this.minorRadius,
          this.ellipseReferenceFrameTransform.transform(point)
        )
      );
    }

    // We already know that the point is on the ellipse, so we can just
    // check that it is within the range of the arc
    if (this.isValidParameter(this.thetaToParam(this.pointTheta(point)))) {
      return distance(point, closestPoint);
    } else if (isOnAxis(point, this.majorAxis, this.center)) {
      const complementaryTheta = unitAngle(
        2 * Math.PI - this.pointTheta(point)
      );
      const param = this.thetaToParam(complementaryTheta);
      if (this.isValidParameter(param)) {
        return distance(point, this.paramPoint(param));
      }
    }
    return Math.min(
      distance(point, this.firstPoint),
      distance(point, this.lastPoint)
    );
  }

  private _ellipseReferenceFrameTransform: TransformationMatrix | undefined;
  get ellipseReferenceFrameTransform(): TransformationMatrix {
    if (this._ellipseReferenceFrameTransform === undefined) {
      this._ellipseReferenceFrameTransform = new TransformationMatrix()
        .rotate(-this.tiltAngle)
        .translate(-this.center[0], -this.center[1]);
    }
    return this._ellipseReferenceFrameTransform;
  }

  private _reverseEllipseReferenceFrameTransform:
    | TransformationMatrix
    | undefined;
  get reverseEllipseReferenceFrameTransform(): TransformationMatrix {
    if (this._reverseEllipseReferenceFrameTransform === undefined) {
      this._reverseEllipseReferenceFrameTransform = new TransformationMatrix()
        .translate(this.center[0], this.center[1])
        .rotate(this.tiltAngle);
    }
    return this._reverseEllipseReferenceFrameTransform;
  }

  private _rotateFromEllipseReferenceFrame: TransformationMatrix | undefined;
  get rotateFromEllipseReferenceFrame(): TransformationMatrix {
    if (this._rotateFromEllipseReferenceFrame === undefined) {
      this._rotateFromEllipseReferenceFrame = new TransformationMatrix().rotate(
        this.tiltAngle
      );
    }
    return this._rotateFromEllipseReferenceFrame;
  }

  private _firstAngle: number | undefined;
  get firstAngle(): number {
    if (this._firstAngle === undefined) {
      this._firstAngle = this.pointTheta(this.firstPoint);
    }
    return this._firstAngle;
  }

  private _lastAngle: number | undefined;
  get lastAngle(): number {
    if (this._lastAngle === undefined) {
      this._lastAngle = this.pointTheta(this.lastPoint);
    }
    return this._lastAngle;
  }

  private _deltaAngle: number | undefined;
  get deltaAngle(): number {
    if (this._deltaAngle === undefined) {
      this._deltaAngle = angularDistance(
        this.firstAngle,
        this.lastAngle,
        this.clockwise
      );
    }
    return this._deltaAngle;
  }

  normalAt(point: Vector): Vector {
    const tgt = this.tangentAt(point);
    return this.clockwise ? perpendicular(tgt) : perpendicularClockwise(tgt);
  }

  gradientAt(param: number): Vector {
    const angle =
      this.firstAngle + param * this.deltaAngle * (this.clockwise ? -1 : 1);

    const x = -this.majorRadius * this.deltaAngle * Math.sin(angle);
    const y = this.minorRadius * this.deltaAngle * Math.cos(angle);

    const tgt: Vector = this.clockwise ? [-x, -y] : [x, y];
    return this.rotateFromEllipseReferenceFrame.transform(tgt);
  }

  tangentAt(point: Vector): Vector {
    const angle = this.pointTheta(point);

    const x = -this.majorRadius * Math.sin(angle);
    const y = this.minorRadius * Math.cos(angle);

    const tgt: Vector = this.clockwise ? [-x, -y] : [x, y];
    return normalize(this.rotateFromEllipseReferenceFrame.transform(tgt));
  }

  get tangentAtFirstPoint(): Vector {
    const x = -this.majorRadius * Math.sin(this.firstAngle);
    const y = this.minorRadius * Math.cos(this.firstAngle);

    const tgt: Vector = this.clockwise ? [-x, -y] : [x, y];
    return normalize(this.rotateFromEllipseReferenceFrame.transform(tgt));
  }

  get tangentAtLastPoint(): Vector {
    const x = -this.majorRadius * Math.sin(this.lastAngle);
    const y = this.minorRadius * Math.cos(this.lastAngle);

    const tgt: Vector = this.clockwise ? [-x, -y] : [x, y];
    return normalize(this.rotateFromEllipseReferenceFrame.transform(tgt));
  }

  transform(matrix: TransformationMatrix): EllipseArc {
    const modifiedAngle = matrix.transformAngle(this.tiltAngle);
    const scaleFactor = matrix.scaleFactor();
    return new EllipseArc(
      matrix.transform(this.firstPoint),
      matrix.transform(this.lastPoint),
      matrix.transform(this.center),
      this.majorRadius * scaleFactor,
      this.minorRadius * scaleFactor,
      modifiedAngle,
      matrix.keepsOrientation() ? this.clockwise : !this.clockwise,
      { angleUnits: "rad" }
    );
  }

  splitAt(points: Vector | Vector[]): EllipseArc[] {
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
      const arc = new EllipseArc(
        paramsMap.get(startParam) || this.paramPoint(startParam),
        paramsMap.get(nextParam) || this.paramPoint(nextParam),
        this.center,
        this.majorRadius,
        this.minorRadius,
        this.tiltAngle,
        this.clockwise,
        { angleUnits: "rad" }
      );
      skipped = null;
      return arc;
    });
  }
}

export function svgEllipse(
  firstPoint: Vector,
  lastPoint: Vector,
  r0: number,
  r1: number,
  phi: number,
  fA: boolean,
  fS: boolean
): EllipseArc | Arc {
  const { center, rx, ry } = findSVGCenter(
    firstPoint,
    lastPoint,
    r0,
    r1,
    phi * DEG2RAD,
    !fA,
    fS
  );

  if (Math.abs(rx - ry) < 1e-9) {
    return new Arc(firstPoint, lastPoint, center, fS);
  }

  return new EllipseArc(firstPoint, lastPoint, center, rx, ry, phi, fS);
}

/*
 * adapted from https://stackoverflow.com/a/12329083
 */
function findSVGCenter(
  [x1, y1]: Vector,
  [x2, y2]: Vector,
  rx: number,
  ry: number,
  phi: number,
  fA: boolean,
  fS: boolean
): { center: Vector; rx: number; ry: number } {
  if (rx < 0) {
    rx = -rx;
  }
  if (ry < 0) {
    ry = -ry;
  }
  if (rx == 0.0 || ry == 0.0) {
    // invalid arguments
    throw Error("rx and ry can not be 0");
  }

  const s_phi = Math.sin(phi);
  const c_phi = Math.cos(phi);
  const hd_x = (x1 - x2) / 2.0; // half diff of x
  const hd_y = (y1 - y2) / 2.0; // half diff of y
  const hs_x = (x1 + x2) / 2.0; // half sum of x
  const hs_y = (y1 + y2) / 2.0; // half sum of y

  // F6.5.1
  const x1_ = c_phi * hd_x + s_phi * hd_y;
  const y1_ = c_phi * hd_y - s_phi * hd_x;

  // F.6.6 Correction of out-of-range radii
  //   Step 3: Ensure radii are large enough
  const lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
  if (lambda > 1) {
    rx = rx * Math.sqrt(lambda);
    ry = ry * Math.sqrt(lambda);
  }

  const rxry = rx * ry;
  const rxy1_ = rx * y1_;
  const ryx1_ = ry * x1_;
  const sum_of_sq = rxy1_ * rxy1_ + ryx1_ * ryx1_; // sum of square
  if (!sum_of_sq) {
    throw Error("start point can not be same as end point");
  }
  let coe = Math.sqrt(Math.abs((rxry * rxry - sum_of_sq) / sum_of_sq));
  if (fA == fS) {
    coe = -coe;
  }

  // F6.5.2
  const cx_ = (coe * rxy1_) / ry;
  const cy_ = (-coe * ryx1_) / rx;

  // F6.5.3
  const cx = c_phi * cx_ - s_phi * cy_ + hs_x;
  const cy = s_phi * cx_ + c_phi * cy_ + hs_y;

  return {
    center: [cx, cy],
    rx,
    ry,
  };
}

// This function was adapted from https://github.com/0xfaded/ellipse_demo/blob/master/ellipse_trig_free.py
// Read more about it here: https://blog.chatfield.io/simple-method-for-distance-to-ellipse/
function closestPointOnEllipse(
  majorRadius: number,
  minorRadius: number,
  point: Vector
): Vector {
  const px = Math.abs(point[0]);
  const py = Math.abs(point[1]);

  let tx = 0.707;
  let ty = 0.707;

  const a = majorRadius;
  const b = minorRadius;

  for (let i = 0; i < 3; i++) {
    const x = a * tx;
    const y = b * ty;

    const ex = ((a * a - b * b) * tx ** 3) / a;
    const ey = ((b * b - a * a) * ty ** 3) / b;

    const rx = x - ex;
    const ry = y - ey;

    const qx = px - ex;
    const qy = py - ey;

    const r = Math.hypot(rx, ry);
    const q = Math.hypot(qx, qy);

    tx = Math.min(1, Math.max(0, ((qx * r) / q + ex) / a));
    ty = Math.min(1, Math.max(0, ((qy * r) / q + ey) / b));
    const t = Math.hypot(tx, ty);
    tx /= t;
    ty /= t;
  }

  return [a * tx * Math.sign(point[0]), b * ty * Math.sign(point[1])];
}
