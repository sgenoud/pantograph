import { CubicBezier } from "../../models/segments/CubicBezier";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier";
import { Arc, biarcWithoutInflexion } from "../../models/segments/Arc";
import {
  parallel,
  dotProduct,
  subtract,
  add,
  sameVector,
  squareDistance,
} from "../../vectorOperations";
import { Vector } from "../../definitions";

/* this is based on Approximation of a planar cubic Bézier spiral by circular
 * arcs by D.J.Walton and D.S.Meek
 *
 * Implentation inspired by https://github.com/domoszlai/bezier2biarc
 * */

type Bezier = CubicBezier | QuadraticBezier;

export function findZeroViaNewtonOrBisection(
  f: (x: number) => number,
  fPrime: (x: number) => number,
  lowerBound: number,
  upperBound: number,
  precision = 1e-6,
  maxIterations = 100,
): number | null {
  let fmin = f(lowerBound);
  let fmax = f(upperBound);

  // Check if there's a root in the interval
  if (fmin * fmax > 0) return null;
  if (fmin === 0) return lowerBound;
  if (fmax === 0) return upperBound;

  let root = (lowerBound + upperBound) / 2;
  let fx = f(root);

  // Newton-Raphson iteration with bisection fallback
  for (let i = 0; i < maxIterations && Math.abs(fx) >= precision; i++) {
    const h = f(root) / fPrime(root);

    // If Newton step would go outside bounds, use bisection
    if (root - h < lowerBound || root - h > upperBound) {
      if (fmin * fx < 0) {
        upperBound = root;
        fmax = fx;
      } else {
        lowerBound = root;
        fmin = fx;
      }
      root = (lowerBound + upperBound) / 2;
    } else {
      root = root - h;
    }

    fx = f(root);
  }

  return root;
}

function junctionPointClosestParam(
  biarc: [Arc, Arc],
  bezier: Bezier,
): number | null {
  const junction = biarc[0].lastPoint;
  const tangent = biarc[0].tangentAtLastPoint;

  const deviationFromRadius = (param: number) =>
    dotProduct(subtract(bezier.paramPoint(param), junction), tangent);

  const diffDeviationFromRadius = (param: number) =>
    dotProduct(bezier.gradientAt(param), tangent);

  return findZeroViaNewtonOrBisection(
    deviationFromRadius,
    diffDeviationFromRadius,
    0,
    1,
  );
}

function maxDistanceParam(
  arc: Arc,
  bezier: Bezier,
  bezierRange: [number, number],
): number | null {
  const fn = (param: number) => {
    const bezierPoint = bezier.paramPoint(param);
    const V = subtract(bezierPoint, arc.center);
    return dotProduct(V, bezier.gradientAt(param));
  };

  const fPrime = (param: number) => {
    const p = bezier.gradientAt(param);
    const t1 = dotProduct(p, p);
    const t2 = dotProduct(
      subtract(bezier.paramPoint(param), arc.center),
      bezier.secondDerivativeAt(param),
    );
    return t1 + t2;
  };

  return findZeroViaNewtonOrBisection(
    fn,
    fPrime,
    bezierRange[0],
    bezierRange[1],
  );
}

function bezierSegmentToArcs(segment: Bezier, precision = 1e-4, v = 0): Arc[] {
  if (!segment) return [];

  if (parallel(segment.tangentAtFirstPoint, segment.tangentAtLastPoint)) {
    return segment
      .splitAtParameters([0.5])
      .flatMap((s) => bezierSegmentToArcs(s, precision));
  }

  const biarc = biarcWithoutInflexion(
    segment.firstPoint,
    segment.lastPoint,
    segment.tangentAtFirstPoint,
    segment.tangentAtLastPoint,
  );

  const junctionParam = junctionPointClosestParam(biarc, segment);
  if (junctionParam === null) {
    return biarc;
  }

  const m1 = maxDistanceParam(biarc[0], segment, [1e-12, junctionParam]);
  const m2 = maxDistanceParam(biarc[1], segment, [junctionParam, 1 - 1e-12]);

  const d1 =
    m1 === null ? 0 : squareDistance(segment.paramPoint(m1), biarc[0].center);
  const d2 =
    m2 === null ? 0 : squareDistance(segment.paramPoint(m2), biarc[1].center);

  const maxDist = Math.max(
    Math.abs(Math.sqrt(d1) - biarc[0].radius),
    Math.abs(Math.sqrt(d2) - biarc[1].radius),
  );

  console.log("distance", d1, d2, maxDist);
  if (maxDist < precision) {
    return biarc;
  }

  // We split at the parameter with the largest distance
  const param = d1 < d2 ? m2 : m1;

  if (!param) return biarc;
  if (v > 2) return biarc;

  const [s1, s2] = segment.splitAtParameters([param]);

  return [
    ...bezierSegmentToArcs(s1, precision, v + 1),
    ...bezierSegmentToArcs(s2, precision, v + 1),
  ];
}

export function approximateBezierCurveAsArcs(
  segment: Bezier,
  precision = 1e-4,
): Arc[] {
  const params = segment.getParametersOfExtrema();
  if (segment instanceof CubicBezier) {
    const inflexionPoints = segment.getInflexionParameters();
    console.log(inflexionPoints);
    params.push(...inflexionPoints);
  }
  const segments = segment.splitAtParameters(params);

  return segments.flatMap((segment) => bezierSegmentToArcs(segment, precision));
}
