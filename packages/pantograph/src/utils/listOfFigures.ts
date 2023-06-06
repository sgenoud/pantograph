import { Diagram } from "../models/Diagram.js";
import { Figure } from "../models/Figure.js";
import { Loop } from "../models/Loop.js";

export function listOfFigures(shape: Diagram | Figure | Loop): Figure[] {
  if (shape instanceof Figure) {
    return [shape];
  } else if (shape instanceof Loop) {
    return [new Figure(shape)];
  } else if (shape instanceof Diagram) {
    return shape.figures;
  }
  throw new Error("Unknown shape");
}
