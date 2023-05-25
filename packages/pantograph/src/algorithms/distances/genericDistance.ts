import { Vector } from "../../definitions";
import { squareDistance } from "../../vectorOperations";
import { findGlobalMinimum } from "../optimisation/DiRect";

interface WithParamPoint {
  paramPoint(t: number): Vector;
}

export function genericDistance(
  segment1: WithParamPoint,
  segment2: WithParamPoint,
  precision = 1e-9
): number {
  const result = findGlobalMinimum((t) => {
    const p1 = segment1.paramPoint(t[0]);
    const p2 = segment2.paramPoint(t[1]);
    return squareDistance(p1, p2);
  }, precision);
  return Math.sqrt(result.fMin);
}
