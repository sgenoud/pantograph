import {
  offsetFigures,
  outlineStrokeFigures,
} from "./algorithms/offsets/offsetFigure";
import { outlineStrand } from "./algorithms/offsets/offsetStroke.js";
import { Strand } from "./models/Strand.js";
import { Diagram } from "./models/Diagram.js";
import { Figure } from "./models/Figure.js";
import { Loop } from "./models/Loop.js";
import { listOfFigures } from "./utils/listOfFigures.js";

export function offset(
  shape: Diagram | Figure | Loop,
  offsetDistance: number
): Diagram {
  return offsetFigures(listOfFigures(shape), offsetDistance);
}

export function outlineStroke(
  shape: Diagram | Figure | Loop | Strand,
  outlineDistance: number,
  { endCap = "round" }: { endCap?: "butt" | "round" } = {}
): Diagram {
  if (shape instanceof Strand) {
    return outlineStrand(shape, outlineDistance, endCap);
  }
  return outlineStrokeFigures(listOfFigures(shape), outlineDistance);
}
