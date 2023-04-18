import offsetFigures from "./algorithms/offsets/offsetFigure";
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
