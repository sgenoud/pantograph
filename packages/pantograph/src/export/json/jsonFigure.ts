import type { Figure } from "../../models/Figure.js";
import { jsonLoop } from "./jsonLoop.js";

export function jsonFigure(figure: Figure) {
  return {
    type: "FIGURE",
    contour: jsonLoop(figure.contour),
    holes: figure.holes.map(jsonLoop),
  };
}
