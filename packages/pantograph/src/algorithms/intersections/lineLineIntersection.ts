import {
  crossProduct,
  squareLength,
  subtract,
} from "../../vectorOperations.js";
import { Line } from "../../models/segments/Line.js";
import { Vector } from "../../definitions.js";
import removeDuplicatePoints from "../../utils/removeDuplicatePoints.js";

export const lineLineParams = (
  line1: { V: Vector; firstPoint: Vector; precision: number },
  line2: { V: Vector; firstPoint: Vector; precision: number },
  precision?: number
):
  | "parallel"
  | {
      intersectionParam1: number;
      intersectionParam2: number;
    } => {
  const V1xV2 = crossProduct(line1.V, line2.V);

  const xLength = squareLength(line1.V);
  const yLength = squareLength(line2.V);

  const squarePrecision = precision
    ? precision * precision
    : line1.precision * line2.precision;

  if (V1xV2 * V1xV2 < xLength * yLength * squarePrecision) {
    return "parallel";
  }

  const diffPoint = subtract(line2.firstPoint, line1.firstPoint);

  const intersectionParam1 = crossProduct(diffPoint, line2.V) / V1xV2;
  const intersectionParam2 = crossProduct(diffPoint, line1.V) / V1xV2;

  return {
    intersectionParam1,
    intersectionParam2,
  };
};
/**
 * Returns the intersection point between two segment of lines
 *
 * Note that collinear segments are not considered to intersect at all.
 * Additionally, if the segments intersect at a start or end point of one of the
 * segments, the intersection point is considered to be an intersection.
 *
 * @param line1
 * @param line2
 * @returns {Vector} the intersection point or null if the segments do not
 * intersect
 *
 **/

export function lineLineIntersection(
  line1: Line,
  line2: Line,
  includeOverlaps = false,
  precision?: number
): null | Vector | Line {
  const intersectionParams = lineLineParams(line1, line2, precision);
  if (intersectionParams === "parallel") {
    if (!includeOverlaps) return null;
    if (line1.isSame(line2)) return line1;

    const points = removeDuplicatePoints(
      [
        line2.isOnSegment(line1.firstPoint) ? line1.firstPoint : null,
        line2.isOnSegment(line1.lastPoint) ? line1.lastPoint : null,
        line1.isOnSegment(line2.firstPoint) ? line2.firstPoint : null,
        line1.isOnSegment(line2.lastPoint) ? line2.lastPoint : null,
      ].filter((p) => p !== null) as Vector[]
    ).sort((a, b) => a[0] - b[0]);

    if (points.length === 0) return null;
    // We consider the case when the lines are collinear and touch only on
    // the last point. We consider that they do not overlap there
    // We might want to revisit this choice
    else if (points.length === 1) return null;
    else if (points.length === 2) return new Line(points[0], points[1]);
    else {
      console.error(points);
      throw new Error(
        "Unexpected number of points while intersecting parallel lines"
      );
    }
  }

  const { intersectionParam1, intersectionParam2 } = intersectionParams;
  if (!line1.isValidParameter(intersectionParam1)) return null;
  if (!line2.isValidParameter(intersectionParam2)) return null;

  return line1.paramPoint(intersectionParam1);
}
