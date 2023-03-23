import { Diagram } from "../../models/Diagram";
import { svgFigure } from "./svgFigure";

export function svgDiagram(diagram: Diagram) {
  return `<g>
  ${diagram.figures.map(svgFigure).join("\n")}
</g>`;
}
