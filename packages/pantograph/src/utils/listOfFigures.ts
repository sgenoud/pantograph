import { Diagram } from "../models/Diagram.js";
import { Figure } from "../models/Figure.js";
import { Loop } from "../models/Loop.js";

export function listOfFigures(shape: Diagram | Figure | Loop): Figure[] {
  if (Figure.isInstance(shape)) {
    return [shape];
  } else if (Loop.isInstance(shape)) {
    return [new Figure(shape)];
  } else if (Diagram.isInstance(shape)) {
    return shape.figures;
  }
  throw new Error("Unknown shape");
}
