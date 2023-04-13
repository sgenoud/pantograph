import type { Vector } from "../definitions";
import type { Line } from "../models/segments/Line";

import { dotProduct, subtract } from "../vectorOperations";

export function projectPointOnLine(line: Line, point: Vector): Vector {
  const delta = subtract(point, line.firstPoint);
  const u = dotProduct(delta, line.V) / line.squareLength;
  return line.paramPoint(u);
}
