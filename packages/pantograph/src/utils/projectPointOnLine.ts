import type { Vector } from "../definitions.js";
import type { Line } from "../models/segments/Line.js";

import { dotProduct, subtract } from "../vectorOperations.js";

export function projectPointOnLine(line: Line, point: Vector): Vector {
  const delta = subtract(point, line.firstPoint);
  const u = dotProduct(delta, line.V) / line.squareLength;
  return line.paramPoint(u);
}
