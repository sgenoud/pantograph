import { Matrix, EigenvalueDecomposition } from "ml-matrix";

import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Arc } from "../../models/segments/Arc.js";
import { Vector } from "../../definitions.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";
import { solveGenericPolynomial } from "../solvers/solvePolynomials.js";

// inspired by https://gist.github.com/drawable/92792f59b6ff8869d8b1

export function ellipseEllipseIntersection(
  arc1: EllipseArc | Arc,
  arc2: EllipseArc
): Vector[] {
  const epsilon = Math.max(arc1.precision, arc2.precision);

  const el1 = arc1.coefficients;
  const a1 = el1.x2;
  const b1 = el1.xy;
  const c1 = el1.y2;
  const d1 = el1.x;
  const e1 = el1.y;
  const f1 = el1.c;

  const el2 = arc2.coefficients;

  const a2 = el2.x2;
  const b2 = el2.xy;
  const c2 = el2.y2;
  const d2 = el2.x;
  const e2 = el2.y;
  const f2 = el2.c;

  const polynomial = {
    z0:
      f1 * a1 * d2 * d2 +
      a1 * a1 * f2 * f2 -
      d1 * a1 * d2 * f2 +
      a2 * a2 * f1 * f1 -
      2 * a1 * f2 * a2 * f1 -
      d1 * d2 * a2 * f1 +
      a2 * d1 * d1 * f2,

    z1:
      e2 * d1 * d1 * a2 -
      f2 * d2 * a1 * b1 -
      2 * a1 * f2 * a2 * e1 -
      f1 * a2 * b2 * d1 +
      2 * d2 * b2 * a1 * f1 +
      2 * e2 * f2 * a1 * a1 +
      d2 * d2 * a1 * e1 -
      e2 * d2 * a1 * d1 -
      2 * a1 * e2 * a2 * f1 -
      f1 * a2 * d2 * b1 +
      2 * f1 * e1 * a2 * a2 -
      f2 * b2 * a1 * d1 -
      e1 * a2 * d2 * d1 +
      2 * f2 * b1 * a2 * d1,

    z2:
      e2 * e2 * a1 * a1 +
      2 * c2 * f2 * a1 * a1 -
      e1 * a2 * d2 * b1 +
      f2 * a2 * b1 * b1 -
      e1 * a2 * b2 * d1 -
      f2 * b2 * a1 * b1 -
      2 * a1 * e2 * a2 * e1 +
      2 * d2 * b2 * a1 * e1 -
      c2 * d2 * a1 * d1 -
      2 * a1 * c2 * a2 * f1 +
      b2 * b2 * a1 * f1 +
      2 * e2 * b1 * a2 * d1 +
      e1 * e1 * a2 * a2 -
      c1 * a2 * d2 * d1 -
      e2 * b2 * a1 * d1 +
      2 * f1 * c1 * a2 * a2 -
      f1 * a2 * b2 * b1 +
      c2 * d1 * d1 * a2 +
      d2 * d2 * a1 * c1 -
      e2 * d2 * a1 * b1 -
      2 * a1 * f2 * a2 * c1,

    z3:
      -2 * a1 * a2 * c1 * e2 +
      e2 * a2 * b1 * b1 +
      2 * c2 * b1 * a2 * d1 -
      c1 * a2 * b2 * d1 +
      b2 * b2 * a1 * e1 -
      e2 * b2 * a1 * b1 -
      2 * a1 * c2 * a2 * e1 -
      e1 * a2 * b2 * b1 -
      c2 * b2 * a1 * d1 +
      2 * e2 * c2 * a1 * a1 +
      2 * e1 * c1 * a2 * a2 -
      c1 * a2 * d2 * b1 +
      2 * d2 * b2 * a1 * c1 -
      c2 * d2 * a1 * b1,

    z4:
      a1 * a1 * c2 * c2 -
      2 * a1 * c2 * a2 * c1 +
      a2 * a2 * c1 * c1 -
      b1 * a1 * b2 * c2 -
      b1 * b2 * a2 * c1 +
      b1 * b1 * a2 * c2 +
      c1 * a1 * b2 * b2,
  };

  const yValues = solveGenericPolynomial(
    [polynomial.z0, polynomial.z1, polynomial.z2, polynomial.z3, polynomial.z4],
    epsilon
  );

  const points = yValues.flatMap((y) => {
    const denom = a1 * b2 * y + a1 * d2 - a2 * b1 * y - a2 * d1;

    if (denom) {
      const x =
        -(
          a1 * f2 +
          a1 * c2 * y * y -
          a2 * c1 * y * y +
          a1 * e2 * y -
          a2 * e1 * y -
          a2 * f1
        ) / denom;
      return [[x, y] as Vector];
    }

    const bb = b1 * y + d1;
    const v = -bb / (2 * a1);

    const cc = c1 * y * y + e1 * y + f1;
    const discriminant = (bb * bb) / (4 * a1 * a1) - cc / a1;

    if (Math.abs(discriminant) < epsilon) {
      return [[v, y] as Vector];
    }
    if (discriminant > 0) {
      const sqrt = Math.sqrt(discriminant);
      return [[v + sqrt, y] as Vector, [v - sqrt, y] as Vector];
    }

    return [];
  });

  return removeDuplicatePoints(points, epsilon);
}
