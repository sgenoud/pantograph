import { Diagram } from "../../models/Diagram";
import { jsonFigure } from "./jsonFigure";

export function jsonDiagram(diagram: Diagram) {
  return {
    type: "DIAGRAM",
    figures: diagram.figures.map(jsonFigure),
  };
}
