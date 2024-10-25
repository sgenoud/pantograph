import { Figure } from "../../models/Figure";
import { Diagram } from "../../models/Diagram";
import { cut, fuseAll } from "../../booleanOperations";
import { offsetLoop } from "./offsetStroke";

export function offsetFigures(
  figures: Figure[],
  offsetDistance: number,
): Diagram {
  const offsetFigures = figures.map((figure) => {
    const innerShape = fuseAll(
      figure.holes.map((l) => offsetLoop(l, offsetDistance)),
    );
    return cut(offsetLoop(figure.contour, offsetDistance), innerShape);
  });

  return fuseAll(offsetFigures);
}

export function outlineStrokeFigures(
  figures: Figure[],
  width: number,
): Diagram {
  const absOffset = Math.abs(width / 2);

  const offsetFigures = figures.map((figure) =>
    fuseAll(
      figure.allLoops.map((l) => {
        return cut(offsetLoop(l, absOffset), offsetLoop(l, -absOffset));
      }),
    ),
  );

  return fuseAll(offsetFigures);
}
