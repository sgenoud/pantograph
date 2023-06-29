import { draw } from "../draw.js";
import type { Diagram } from "../main.js";

export function drawEllipse(rx: number, ry: number): Diagram {
  const pen = draw([-rx, 0]);
  pen.halfEllipse(2 * rx, 0, ry);
  pen.halfEllipse(-2 * rx, 0, ry);
  return pen.close();
}
