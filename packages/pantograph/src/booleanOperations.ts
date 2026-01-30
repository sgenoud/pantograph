import {
  cutFiguresLists,
  fuseFiguresLists,
  intersectFiguresLists,
} from "./algorithms/boolean/figureBooleans";
import { Strand } from "./models/Strand";
import { Diagram } from "./models/Diagram";
import { Figure } from "./models/Figure";
import { Loop } from "./models/Loop";
import { listOfFigures } from "./utils/listOfFigures";
import {
  eraseStrandOutsideFigure,
  eraseStrandOutsideLoop,
  eraseStrandWithinFigure,
  eraseStrandWithinLoop,
} from "./algorithms/boolean/strandBoolean";
import { Stroke } from "./main";

export function fuse(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop,
): Diagram {
  return new Diagram(
    fuseFiguresLists(listOfFigures(first), listOfFigures(second)),
  );
}

export function fuseAll(shapes: (Diagram | Figure | Loop)[]): Diagram {
  return shapes.reduce(
    (acc: Diagram, shape: Diagram | Figure | Loop) => fuse(acc, shape),
    new Diagram(),
  );
}

export function cut(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop,
): Diagram {
  return new Diagram(
    cutFiguresLists(listOfFigures(first), listOfFigures(second)),
  );
}

export function intersect(
  first: Diagram | Figure | Loop,
  second: Diagram | Figure | Loop,
): Diagram {
  return new Diagram(
    intersectFiguresLists(listOfFigures(first), listOfFigures(second)),
  );
}

export function eraseStrand(
  strand: Stroke,
  diagram: Diagram | Figure | Loop,
  eraseOnBorder = true,
): Strand[] {
  if (Loop.isInstance(diagram)) {
    return eraseStrandWithinLoop(strand, diagram, eraseOnBorder);
  }

  if (Figure.isInstance(diagram)) {
    return eraseStrandWithinFigure(strand, diagram, eraseOnBorder);
  }

  let outStrands: Strand[] = [new Strand([...strand.segments])];
  diagram.figures.forEach((figure: Figure) => {
    outStrands = outStrands.flatMap((strand: Strand) => {
      return eraseStrandWithinFigure(strand, figure, eraseOnBorder);
    });
  });

  return outStrands;
}

export function confineStrand(
  strand: Stroke,
  diagram: Diagram | Figure | Loop,
  eraseOnBorder = false,
): Strand[] {
  if (Loop.isInstance(diagram)) {
    return eraseStrandOutsideLoop(strand, diagram, eraseOnBorder);
  }

  if (Figure.isInstance(diagram)) {
    return eraseStrandOutsideFigure(strand, diagram, eraseOnBorder);
  }

  let outStrands: Strand[] = [new Strand([...strand.segments])];
  diagram.figures.forEach((figure: Figure) => {
    outStrands = outStrands.flatMap((strand: Strand) => {
      return eraseStrandOutsideFigure(strand, figure, eraseOnBorder);
    });
  });

  return outStrands;
}
