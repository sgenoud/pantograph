import {
  cutFiguresLists,
  fuseFiguresLists,
  intersectFiguresLists,
} from "./algorithms/boolean/figureBooleans";
import { Diagram } from "./models/Diagram";
import { Figure } from "./models/Figure";
import { Loop } from "./models/Loop";
import { listOfFigures } from "./utils/listOfFigures";

export function fuse(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop
): Diagram {
  return new Diagram(
    fuseFiguresLists(listOfFigures(first), listOfFigures(second))
  );
}

export function fuseAll(shapes: (Diagram | Figure | Loop)[]): Diagram {
  return shapes.reduce(
    (acc: Diagram, shape: Diagram | Figure | Loop) => fuse(acc, shape),
    new Diagram()
  );
}

export function cut(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop
): Diagram {
  return new Diagram(
    cutFiguresLists(listOfFigures(first), listOfFigures(second))
  );
}

export function intersect(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop
): Diagram {
  return new Diagram(
    intersectFiguresLists(listOfFigures(first), listOfFigures(second))
  );
}
