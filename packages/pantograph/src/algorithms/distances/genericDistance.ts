import { Vector } from "../../definitions";
import { squareDistance } from "../../vectorOperations";
import { findGlobalMinimum } from "../optimisation/DiRect";
import { LBGFS } from "../optimisation/L_BGFS";

interface WithParamPoint {
  paramPoint(t: number): Vector;
  gradientAt(t: number): Vector;
}

export function genericDistance(
  segment1: WithParamPoint,
  segment2: WithParamPoint
): number {
  const distanceFcn = (t: number[]) => {
    const p1 = segment1.paramPoint(t[0]);
    const p2 = segment2.paramPoint(t[1]);
    return squareDistance(p1, p2);
  };
  const gradDistanceFcn = (t: number[]) => {
    const [p1x, p1y] = segment1.paramPoint(t[0]);
    const [p2x, p2y] = segment2.paramPoint(t[1]);

    const [dp1x, dp1y] = segment1.gradientAt(t[0]);
    const [dp2x, dp2y] = segment1.gradientAt(t[1]);

    return [
      2 * (p1x - p2x) * dp1x + 2 * (p1y - p2y) * dp1y,
      2 * (p2x - p1x) * dp2x + 2 * (p2y - p1y) * dp2y,
    ];
  };
  const roughResult = findGlobalMinimum(distanceFcn, 1e-4);
  const refinedResult = LBGFS(
    distanceFcn,
    gradDistanceFcn,
    roughResult.argMin,
    1e-6,
    roughResult.tol * 1.5
  );
  return Math.sqrt(refinedResult.fMin);
}
