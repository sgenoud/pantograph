import { Figure } from "../../models/Figure";
import { Diagram } from "../../models/Diagram";
import { cut, fuseAll } from "../../booleanOperations";
import { offsetLoop } from "./offsetLoop";

export default function offsetFigures(
  figures: Figure[],
  offsetDistance: number
): Diagram {
  const offsetFigures = figures.map((figure) => {
    const innerShape = fuseAll(
      figure.holes.map((l) => offsetLoop(l, offsetDistance))
    );
    return cut(offsetLoop(figure.contour, offsetDistance), innerShape);
  });

  return fuseAll(offsetFigures);
}
