import { draw } from "../draw.js";
import type { Diagram } from "../models/Diagram.js";

export function drawCircle(radius: number): Diagram {
  return draw([-radius, 0])
    .sagittaArc(2 * radius, 0, radius)
    .sagittaArc(-2 * radius, 0, radius)
    .close();
}
