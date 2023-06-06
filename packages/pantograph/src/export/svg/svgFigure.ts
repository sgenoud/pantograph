import type { Figure } from "../../models/Figure.js";
import { svgLoop } from "./svgLoop.js";

export function svgFigure(figure: Figure) {
  const path = figure.allLoops.map(svgLoop).join(" ");
  return `<path d="${path}" />`;
}
