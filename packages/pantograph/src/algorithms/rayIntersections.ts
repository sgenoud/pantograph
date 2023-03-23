import { Line } from "../models/segments/Line";
import { lineLineParams } from "./intersections";
import type { Vector } from "../definitions";
import { Segment } from "../models/segments/Segment";

const rayLineIntersectionsCount = (point: Vector, line: Line) => {
  const intersectionParams = lineLineParams(line, {
    V: [1, 0],
    firstPoint: point,
    precision: line.precision,
  });
  if (intersectionParams === "parallel") {
    // When the ray is parallel with the line, we can ignore its extremities.
    // They will be handled by the segments getting into and out of this one.
    return 0;
  }

  const { intersectionParam1, intersectionParam2 } = intersectionParams;

  if (!line.isValidParameter(intersectionParam1)) return 0;
  // With the ray we only check one side of the parameter
  if (intersectionParam2 <= -line.precision) return 0;

  // We need to check if the ray intersects the line segment at the extremities
  // In that case we considers that it crosses the segment if its midpoint is
  // above the line.

  if (
    Math.abs(intersectionParam1) < line.precision ||
    Math.abs(intersectionParam1 - 1) < line.precision
  ) {
    const [, y] = line.midPoint;
    return point[1] - y < 0 ? 1 : 0;
  }

  return 1;
};

export function rayIntersectionsCount(point: Vector, segment: Segment): number {
  if (segment instanceof Line) {
    return rayLineIntersectionsCount(point, segment);
  }

  throw new Error("Not implemented");
}
