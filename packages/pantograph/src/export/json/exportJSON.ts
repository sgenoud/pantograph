import { Diagram } from "../../models/Diagram";
import { Figure } from "../../models/Figure";
import { Loop } from "../../models/Loop";
import { Arc } from "../../models/segments/Arc";
import { Line } from "../../models/segments/Line";
import { jsonDiagram } from "./jsonDiagram";
import { jsonFigure } from "./jsonFigure";
import { jsonLoop } from "./jsonLoop";
import { jsonSegment } from "./jsonSegment";

type Shape = Loop | Figure | Diagram | Arc | Line;

export function exportJSON(shape: Shape) {
  if (shape instanceof Diagram) {
    return jsonDiagram(shape);
  } else if (shape instanceof Figure) {
    return jsonFigure(shape);
  } else if (shape instanceof Loop) {
    return jsonLoop(shape);
  } else if (shape instanceof Arc || shape instanceof Line) {
    return jsonSegment(shape);
  } else {
    throw new Error("Unknown shape type");
  }
}
