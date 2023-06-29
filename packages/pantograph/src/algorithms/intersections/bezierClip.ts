import { Vector } from "../../definitions.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";
import {
  subtract,
  length,
  crossProduct,
  squareLength,
  perpendicular,
  add,
  sameVector,
} from "../../vectorOperations.js";

function orientedDistanceToLine(
  point: Vector,
  { firstPoint, lastPoint }: { firstPoint: Vector; lastPoint: Vector },
  epsilon = 1e-9
) {
  const direction = subtract(lastPoint, firstPoint);

  // Case of an vertical line
  if (Math.abs(direction[0]) < epsilon) {
    return direction[1] > 0
      ? firstPoint[0] - point[0]
      : point[0] - firstPoint[0];
  }

  // Case of an horizontal line
  if (Math.abs(direction[1]) < epsilon) {
    return direction[0] > 0
      ? point[1] - firstPoint[1]
      : firstPoint[1] - point[1];
  }

  return (
    crossProduct(direction, subtract(point, firstPoint)) / length(direction)
  );
}

class FatLine {
  constructor(
    public readonly firstPoint: Vector,
    public readonly lastPoint: Vector,
    public negativeThickness: number,
    public positiveThickness: number
  ) {}

  get width() {
    return this.positiveThickness - this.negativeThickness;
  }
}

const V_3_4 = 3 / 4;
const V_4_9 = 4 / 9;
export function fatLineFromCubicCurve(curve: CubicBezier) {
  const d1 = orientedDistanceToLine(curve.firstControlPoint, curve);
  const d2 = orientedDistanceToLine(curve.lastControlPoint, curve);

  // We use the quick approximation of the fat line
  const factor = d1 * d2 > 0 ? V_3_4 : V_4_9;

  return new FatLine(
    curve.firstPoint,
    curve.lastPoint,
    factor * Math.min(0, d1, d2),
    factor * Math.max(0, d1, d2)
  );
}

export function fatLineFromQuadratic(curve: QuadraticBezier) {
  const d1 = orientedDistanceToLine(curve.controlPoint, curve);

  return new FatLine(
    curve.firstPoint,
    curve.lastPoint,
    Math.min(0, d1 / 2),
    Math.max(0, d1 / 2)
  );
}

export function fatLineFromCurve(curve: CubicBezier | QuadraticBezier) {
  if (curve instanceof CubicBezier) {
    return fatLineFromCubicCurve(curve);
  }
  if (curve instanceof QuadraticBezier) {
    return fatLineFromQuadratic(curve);
  }
  throw new Error("Not implemented");
}

export function perpendicularFatLineFromCurve(
  curve: CubicBezier | QuadraticBezier
) {
  const midPoint = curve.paramPoint(0.5);
  const offset = perpendicular(subtract(midPoint, curve.firstPoint));

  const targetPoint = add(midPoint, offset);

  const curvePoints = {
    firstPoint: midPoint,
    lastPoint: targetPoint,
  };

  const distances = [
    orientedDistanceToLine(curve.firstPoint, curvePoints),
    orientedDistanceToLine(curve.lastPoint, curvePoints),
  ];

  if (curve instanceof CubicBezier) {
    distances.push(
      orientedDistanceToLine(curve.firstControlPoint, curvePoints),
      orientedDistanceToLine(curve.lastControlPoint, curvePoints)
    );
  } else if (curve instanceof QuadraticBezier) {
    distances.push(orientedDistanceToLine(curve.controlPoint, curvePoints));
  }

  return new FatLine(
    midPoint,
    targetPoint,
    Math.min(...distances),
    Math.max(...distances)
  );
}

function intersectionParameter(linePoints: Vector[], bound: number) {
  const parameters = [];
  for (let i = 1; i < linePoints.length; i++) {
    const point = linePoints[i];
    if (point[1] === bound) {
      parameters.push(point[0]);
      continue;
    }

    const previousPoint = linePoints[i - 1];

    const previousDistanceToBound = bound - previousPoint[1];
    const distanceToBound = bound - point[1];

    if (previousDistanceToBound * distanceToBound < 0) {
      parameters.push(
        previousPoint[0] +
          ((bound - previousPoint[1]) * (point[0] - previousPoint[0])) /
            (point[1] - previousPoint[1])
      );
      continue;
    }
  }

  return parameters;
}

class ClippingBounds {
  constructor(
    public readonly from: number | "start",
    public readonly to: number | "end"
  ) {}

  get size() {
    if (this.from === "start") {
      if (this.to === "end") {
        return 1;
      } else {
        return this.to;
      }
    } else {
      if (this.to === "end") {
        return 1 - this.from;
      } else {
        return Math.abs(this.from - this.to);
      }
    }
  }

  clipCurve(curve: QuadraticBezier | CubicBezier) {
    if (this.from === "start") {
      if (this.to === "end") {
        return curve;
      } else {
        return curve.splitAtParameters([this.to])[0];
      }
    } else {
      if (this.to === "end") {
        return curve.splitAtParameters([this.from])[1];
      } else {
        return curve.splitAtParameters([this.from, this.to])[1];
      }
    }
  }
}

function createDistanceHull(
  curve: QuadraticBezier | CubicBezier,
  fatLine: FatLine
) {
  if (curve instanceof CubicBezier) {
    return new DistanceToFatLineCubicCurve([
      orientedDistanceToLine(curve.firstPoint, fatLine),
      orientedDistanceToLine(curve.firstControlPoint, fatLine),
      orientedDistanceToLine(curve.lastControlPoint, fatLine),
      orientedDistanceToLine(curve.lastPoint, fatLine),
    ]);
  }
  if (curve instanceof QuadraticBezier) {
    return new DistanceToFatLineQuadraticCurve([
      orientedDistanceToLine(curve.firstPoint, fatLine),
      orientedDistanceToLine(curve.controlPoint, fatLine),
      orientedDistanceToLine(curve.lastPoint, fatLine),
    ]);
  }
  throw new Error("Not implemented");
}

class DistanceToFatLineQuadraticCurve {
  public readonly topHull: Vector[] = [];
  public readonly bottomHull: Vector[] = [];

  constructor(public readonly distances: [number, number, number]) {
    const [d1, d2, d3] = distances;

    const p1: Vector = [0, d1];
    const p2: Vector = [1 / 2, d2];
    const p3: Vector = [1, d3];

    // We want to have the hull defined by these points
    const midLineSlope = d3 - d1;
    const midLineIntercept = d1;

    const deltaAtD2 = d2 - (midLineSlope * (1 / 2) + midLineIntercept);

    if (deltaAtD2 > 0) {
      this.topHull = [p1, p2, p3];
      this.bottomHull = [p1, p3];
    } else {
      this.topHull = [p1, p3];
      this.bottomHull = [p1, p2, p3];
    }
  }

  get startDistance() {
    return this.distances[0];
  }

  get endDistance() {
    return this.distances[2];
  }
}

class DistanceToFatLineCubicCurve {
  public readonly topHull: Vector[] = [];
  public readonly bottomHull: Vector[] = [];

  constructor(public readonly distances: [number, number, number, number]) {
    const [d1, d2, d3, d4] = distances;

    const p1: Vector = [0, d1];
    const p2: Vector = [1 / 3, d2];
    const p3: Vector = [2 / 3, d3];
    const p4: Vector = [1, d4];

    // We want to have the hull defined by these points
    const midLineSlope = d4 - d1;
    const midLineIntercept = d1;

    const deltaAtD2 = d2 - (midLineSlope * (1 / 3) + midLineIntercept);
    const deltaAtD3 = d3 - (midLineSlope * (2 / 3) + midLineIntercept);

    let topHull = null;
    let bottomHull = null;

    const crossesMidLine = deltaAtD2 * deltaAtD3 < 0;

    // We first assume that d2 is above the mid line
    if (crossesMidLine) {
      topHull = [p1, p2, p4];
      bottomHull = [p1, p3, p4];
    } else {
      // We know that the x distance is 1/3 so we can only care about the ratio
      // of y to figure out if we need to include the points in the hull
      const ratio = deltaAtD2 / deltaAtD3;
      if (ratio >= 2) {
        topHull = [p1, p2, p4];
        bottomHull = [p1, p4];
      } else if (ratio <= 0.5) {
        topHull = [p1, p3, p4];
        bottomHull = [p1, p4];
      } else {
        topHull = [p1, p2, p3, p4];
        bottomHull = [p1, p4];
      }
    }
    if (deltaAtD2 < 0) {
      [topHull, bottomHull] = [bottomHull, topHull];
    }

    this.topHull = topHull;
    this.bottomHull = bottomHull;
  }

  get startDistance() {
    return this.distances[0];
  }

  get endDistance() {
    return this.distances[3];
  }
}

export function fatLineIntersections(
  fatLine: FatLine,
  curve: QuadraticBezier | CubicBezier
): ClippingBounds | null {
  // These correspond to the y values of the distance curve
  const distancesAtParam = createDistanceHull(curve, fatLine);

  // We want to compute the places where the hull of distance is outside of the
  // bound of the fat line
  const t1 = intersectionParameter(
    distancesAtParam.topHull,
    fatLine.negativeThickness
  );
  const t2 = intersectionParameter(
    distancesAtParam.bottomHull,
    fatLine.positiveThickness
  );

  const endsWithinBounds =
    distancesAtParam.endDistance >= fatLine.negativeThickness &&
    distancesAtParam.endDistance <= fatLine.positiveThickness;

  if (!t1.length && !t2.length) {
    if (endsWithinBounds) return new ClippingBounds("start", "end");
    else return null;
  }

  if (t1.length === 1 && t2.length === 1) {
    return new ClippingBounds(t1[0], t2[0]);
  }

  if (t1.length === 2 && t2.length === 2) {
    throw new Error(
      "Bug in the clipping algorithm, unexpected number of crossing points"
    );
  }

  const t: number[] = t1.length ? t1 : t2;

  if (t.length === 2) {
    return new ClippingBounds(t[0], t[1]);
  }

  if (endsWithinBounds) return new ClippingBounds(t[0], "end");
  else return new ClippingBounds("start", t[0]);
}

export function clipFatLineIntersections(
  curve1: QuadraticBezier | CubicBezier,
  curve2: QuadraticBezier | CubicBezier
) {
  const fatLine = fatLineFromCurve(curve1);

  const limits = fatLineIntersections(fatLine, curve2);
  if (!limits) {
    return null; // there is no intersection
  }

  const perpendicularFatLine = perpendicularFatLineFromCurve(curve1);

  const perpendicularLimits = fatLineIntersections(
    perpendicularFatLine,
    curve2
  );
  if (!perpendicularLimits) {
    return null; // there is no intersection
  }

  if (limits.size > perpendicularLimits.size) {
    return perpendicularLimits.clipCurve(curve2);
  }
  return limits.clipCurve(curve2);
}

const hullSquareLength = (curve: QuadraticBezier | CubicBezier) => {
  if (curve instanceof QuadraticBezier) {
    return (
      squareLength(subtract(curve.controlPoint, curve.firstPoint)) +
      squareLength(subtract(curve.controlPoint, curve.lastPoint))
    );
  }
  return (
    squareLength(subtract(curve.firstControlPoint, curve.firstPoint)) +
    squareLength(subtract(curve.lastControlPoint, curve.firstControlPoint)) +
    squareLength(subtract(curve.lastControlPoint, curve.lastPoint))
  );
};

/* Bézier clipping algorithm
 *
 * This algorithm is based on the paper "Curve intersections using Bézier
 * Clipping" by Sederberg and Nishita.
 *
 * Note that we assume that the curves are not overlapping
 *
 * This implementation has been inspired by both the rust implementation of
 * https://github.com/Logicalshift/flo_curves and the javascript one of
 * https://github.com/alexkirsz/curve-intersection
 *
 * */
export function bezierClip(
  curve1: CubicBezier | QuadraticBezier,
  curve2: CubicBezier | QuadraticBezier,
  precision = 1e-9,
  { maxIterations = 100 } = {}
): Vector[] {
  // I should understand better how to handle the bottom of the precision
  // better
  const squarePrecision = Math.max(precision * precision, Number.EPSILON * 10);

  let pCurve = curve1;
  let qCurve = curve2;

  let pCurveLength = hullSquareLength(pCurve);
  let qCurveLength = hullSquareLength(qCurve);

  for (let it = 0; it < maxIterations; it++) {
    const pCurveClipped =
      pCurveLength > squarePrecision
        ? clipFatLineIntersections(qCurve, pCurve)
        : pCurve;
    if (!pCurveClipped) return [];
    const pCurveClippedLength = hullSquareLength(pCurveClipped);

    const qCurveClipped =
      qCurveLength > squarePrecision
        ? clipFatLineIntersections(pCurveClipped, qCurve)
        : qCurve;
    if (!qCurveClipped) return [];
    const qCurveClippedLength = hullSquareLength(qCurveClipped);

    // We found a good enough approximation
    if (
      pCurveClippedLength <= squarePrecision &&
      qCurveClippedLength <= squarePrecision
    ) {
      return [
        pCurveClipped.boundingBox.intersection(qCurveClipped.boundingBox)
          .center,
      ];
    }

    // Another way to detect that we are close enough (i.e. the curves are
    // nearly a point
    if (
      sameVector(pCurveClipped.firstPoint, pCurveClipped.lastPoint) &&
      qCurveClipped.isOnSegment(pCurveClipped.firstPoint)
    ) {
      return [pCurveClipped.firstPoint];
    }
    if (
      sameVector(qCurveClipped.firstPoint, qCurveClipped.lastPoint) &&
      pCurveClipped.isOnSegment(qCurveClipped.firstPoint)
    ) {
      return [qCurveClipped.firstPoint];
    }

    if (
      pCurveClippedLength > 0.8 * pCurveLength &&
      qCurveClippedLength > 0.8 * qCurveLength
    ) {
      // It seems that we need to split the curves
      if (
        pCurveClippedLength / pCurveLength >
        qCurveClippedLength / qCurveLength
      ) {
        const [pCurveLeft, pCurveRight] = pCurveClipped.splitAtParameters([
          0.5,
        ]);
        return removeDuplicatePoints(
          [
            ...bezierClip(pCurveLeft, qCurveClipped, precision, {
              maxIterations: maxIterations - it,
            }),
            ...bezierClip(pCurveRight, qCurveClipped, precision, {
              maxIterations: maxIterations - it,
            }),
          ],
          precision
        );
      } else {
        const [qCurveLeft, qCurveRight] = qCurveClipped.splitAtParameters([
          0.5,
        ]);
        return removeDuplicatePoints(
          [
            ...bezierClip(pCurveClipped, qCurveLeft, precision, {
              maxIterations: maxIterations - it,
            }),
            ...bezierClip(pCurveClipped, qCurveRight, precision, {
              maxIterations: maxIterations - it,
            }),
          ],
          precision
        );
      }
    }

    pCurve = pCurveClipped;
    qCurve = qCurveClipped;
    pCurveLength = pCurveClippedLength;
    qCurveLength = qCurveClippedLength;
  }

  throw new Error("Bézier clip: Maximum number of iterations reached");
}
