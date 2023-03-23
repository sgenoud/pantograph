import {
  cutFiguresLists,
  fuseFiguresLists,
  intersectFiguresLists,
} from "./algorithms/boolean/figureBooleans";
import { Diagram } from "./models/Diagram";
import { Figure } from "./models/Figure";
import { Loop } from "./models/Loop";

function listOfFigures(shape: Diagram | Figure | Loop): Figure[] {
  if (shape instanceof Figure) {
    return [shape];
  } else if (shape instanceof Loop) {
    return [new Figure(shape)];
  } else if (shape instanceof Diagram) {
    return shape.figures;
  }
  throw new Error("Unknown shape");
}

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
