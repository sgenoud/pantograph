import type { Figure } from "../../models/Figure";
import { jsonLoop } from "./jsonLoop";

export function jsonFigure(figure: Figure) {
  return {
    type: "FIGURE",
    contour: jsonLoop(figure.contour),
    holes: figure.holes.map(jsonLoop),
  };
}
