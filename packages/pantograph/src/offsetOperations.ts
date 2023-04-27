import {
  offsetFigures,
  outlineStrokeFigures,
} from "./algorithms/offsets/offsetFigure";
import { outlineStrand } from "./algorithms/offsets/offsetStroke";
import { Strand } from "./models/Strand";
import { Diagram } from "./models/Diagram";
import { Figure } from "./models/Figure";
import { Loop } from "./models/Loop";
import { listOfFigures } from "./utils/listOfFigures";

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
