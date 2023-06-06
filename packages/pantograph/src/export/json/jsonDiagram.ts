import { Diagram } from "../../models/Diagram.js";
import { jsonFigure } from "./jsonFigure.js";

export function jsonDiagram(diagram: Diagram) {
  return {
    type: "DIAGRAM",
    figures: diagram.figures.map(jsonFigure),
  };
}
