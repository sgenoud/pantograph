import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { Arc } from "../../models/segments/Arc.js";
import { Vector } from "../../definitions.js";
import removeDuplicateValues from "../../utils/removeDuplicateValues.js";
import { solveQuartic } from "../solvers/solvePolynomials.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";

/*
 * We use wolfram alpha to do the analitical resolution of the intersection
 * Collect[ Eliminate[{a*x^2+b*x*y+c*y^2+d * x + e * y + f == 0, p2 * t^2  + p1 * t +p0 == x,q2*t^2+q1*t+q0==y}, {x,y}], t ]
 * */

const intersectionsPolynomial = (
  arc: EllipseArc | Arc,
  curve: QuadraticBezier
): [number, number, number, number, number] => {
  const [[p0, p1, p2], [q0, q1, q2]] = curve.polynomialCoefficients;

  const el1 = arc.coefficients;
  const a = el1.x2;
  const b = el1.xy;
  const c = el1.y2;
  const d = el1.x;
  const e = el1.y;
  const f = el1.c;

  const p02 = p0 * p0;
  const p12 = p1 * p1;
  const p22 = p2 * p2;
  const q02 = q0 * q0;
  const q12 = q1 * q1;
  const q22 = q2 * q2;

  const z0 = a * p02 + b * p0 * q0 + c * q02 + d * p0 + e * q0 + f;
  const z1 =
    2 * a * p0 * p1 +
    b * p0 * q1 +
    b * p1 * q0 +
    2 * c * q0 * q1 +
    d * p1 +
    e * q1;
  const z2 =
    2 * a * p0 * p2 +
    a * p12 +
    b * p0 * q2 +
    b * p1 * q1 +
    b * p2 * q0 +
    2 * c * q0 * q2 +
    c * q12 +
    d * p2 +
    e * q2;

  const z3 = 2 * a * p1 * p2 + b * p1 * q2 + b * p2 * q1 + 2 * c * q1 * q2;
  const z4 = a * p22 + b * p2 * q2 + c * q22;

  return [z0, z1, z2, z3, z4];
};

export function arcsQuadraticBezierIntersection(
  arc: EllipseArc | Arc,
  curve: QuadraticBezier
): Vector[] {
  const epsilon = Math.max(arc.precision, curve.precision);

  const polynomial = intersectionsPolynomial(arc, curve);
  const solutions = solveQuartic(...polynomial).filter((t) => {
    return t >= -curve.precision && t <= 1 + curve.precision;
  });

  return removeDuplicateValues(solutions, epsilon)
    .map((t) => {
      return curve.paramPoint(t);
    })
    .filter((p) => {
      return arc.isOnSegment(p);
    });
}
