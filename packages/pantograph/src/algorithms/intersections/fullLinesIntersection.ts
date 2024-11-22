import { Vector } from "../../definitions";
import {
  add,
  crossProduct,
  scalarMultiply,
  subtract,
} from "../../vectorOperations";

/**
 * Returns the intersection point between two full lines
 *
 * Note that collinear lines are not considered to intersect at all.
 *
 * Lines are represented by a vector V with **unit length** and a point on the line.
 *
 */
export const fullLineIntersection = (
  line1: { V: Vector; firstPoint: Vector; precision: number },
  line2: { V: Vector; firstPoint: Vector; precision: number },
  precision?: number,
): "parallel" | Vector => {
  const V1xV2 = crossProduct(line1.V, line2.V);

  /*
  const xLength = squareLength(line1.V);
  const yLength = squareLength(line2.V);
  */

  const squarePrecision = precision
    ? precision * precision
    : line1.precision * line2.precision;

  if (V1xV2 * V1xV2 < squarePrecision) {
    return "parallel";
  }

  const diffPoint = subtract(line2.firstPoint, line1.firstPoint);
  const intersectionParam = crossProduct(diffPoint, line2.V) / V1xV2;

  return add(line1.firstPoint, scalarMultiply(line1.V, intersectionParam));
};
