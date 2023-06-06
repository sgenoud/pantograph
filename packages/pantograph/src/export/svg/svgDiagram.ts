import { Diagram } from "../../models/Diagram.js";
import { svgFigure } from "./svgFigure.js";

export function svgDiagram(diagram: Diagram) {
  return `<g>
  ${diagram.figures.map(svgFigure).join("\n")}
</g>`;
}
