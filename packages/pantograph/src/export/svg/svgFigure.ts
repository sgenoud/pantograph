import type { Figure } from "../../models/Figure";
import { svgLoop } from "./svgLoop";

export function svgFigure(figure: Figure) {
  const path = figure.allLoops.map(svgLoop).join(" ");
  return `<path d="${path}" />`;
}
