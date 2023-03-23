import { Figure } from "../../models/Figure";
import { organiseLoops } from "../organiseLoops";
import { allPairs } from "../../utils/allPairs";
import { cutLoops, fuseLoops, intersectLoops } from "./loopBooleans";

export function fuseIntersectingFigures(figures: Figure[]) {
  const fused = new Map();

  const output: { current: Figure[] }[] = [];

  figures.forEach((inputFigure, i) => {
    let savedFigures: {
      current: Figure[];
      fusedWith: Set<number>;
    };

    if (fused.has(i)) {
      savedFigures = fused.get(i);
    } else {
      savedFigures = { current: [inputFigure], fusedWith: new Set([i]) };
      output.push(savedFigures);
    }

    figures.slice(i + 1).forEach((inputOtherFigure, j) => {
      const figure = savedFigures.current;

      const currentIndex = i + j + 1;

      if (savedFigures.fusedWith.has(currentIndex)) return;

      let otherFigure = [inputOtherFigure];
      let otherIsFused = false;

      if (fused.has(currentIndex)) {
        otherFigure = fused.get(currentIndex).current;
        otherIsFused = true;
      }

      const doListIntersect = figure.some((f) =>
        otherFigure.some((s) => f.intersects(s))
      );
      if (!doListIntersect) return;

      let newFused: Figure[];
      if (figure.length > 1 || otherFigure.length > 1) {
        newFused = fuseFiguresLists(figure, otherFigure);
      } else {
        newFused = fuseFigures(figure[0], otherFigure[0]);
      }

      savedFigures.fusedWith.add(currentIndex);
      savedFigures.current = newFused;
      if (!otherIsFused) fused.set(currentIndex, savedFigures);
    });
  });

  return output.flatMap(({ current }) => current);
}

export function fuseFigures(first: Figure, second: Figure) {
  const outerFused = fuseLoops(first.contour, second.contour);

  const inner1Fused = second.holes.flatMap((c) => cutLoops(c, first.contour));
  const inner2Fused = first.holes.flatMap((c) => cutLoops(c, second.contour));

  const innerIntersections = allPairs(first.holes, second.holes).flatMap(
    ([first, second]) => intersectLoops(first, second)
  );

  return organiseLoops([
    ...outerFused,
    ...inner1Fused,
    ...inner2Fused,
    ...innerIntersections,
  ]);
}

export function cutFigures(first: Figure, second: Figure): Figure[] {
  if (first.isFull && second.isFull) {
    return organiseLoops(cutLoops(first.contour, second.contour));
  }

  if (first.isFull) {
    const cutContour = cutLoops(first.contour, second.contour);
    const cutHoles = second.holes.flatMap((c) =>
      intersectLoops(c, first.contour)
    );
    // We might be able to assume that the contour and the holes are already
    // distinct figures.
    return organiseLoops([...cutContour, ...cutHoles]);
  } else if (second.isFull) {
    if (!first.contour.intersects(second.contour)) {
      if (!first.contour.contains(second.contour.firstPoint)) {
        // nothing to do here, the second figure is outside the first
        return [first];
      } else {
        const fusedCuts = fuseFiguresLists(
          first.holes.map((h) => new Figure(h)),
          [second]
        );

        return organiseLoops([
          first.contour,
          ...fusedCuts.flatMap((f) => f.allLoops),
        ]);
      }
    }
  }

  // We turn the last case in one where the second is full
  let newFigures = cutFigures(new Figure(first.contour), second);
  first.holes.forEach((cut) => {
    newFigures = newFigures.flatMap((c) => cutFigures(c, new Figure(cut)));
  });

  return newFigures;
}

export function intersectFigures(first: Figure, second: Figure): Figure[] {
  const outerIntersection = intersectLoops(first.contour, second.contour);
  if (!outerIntersection.length) return [];

  let out = organiseLoops(outerIntersection);
  out = cutFiguresLists(
    out,
    first.holes.map((h) => new Figure(h))
  );

  // Here we need to do the cut in two steps, because the holes might intersect
  return cutFiguresLists(
    out,
    second.holes.map((h) => new Figure(h))
  );
}

export function fuseFiguresLists(first: Figure[], second: Figure[]): Figure[] {
  if (!first.length) return second;
  if (!second.length) return first;

  if (
    (first.length === 1 && second.length > 1) ||
    (second.length === 1 && first.length > 1)
  ) {
    return fuseIntersectingFigures([...first, ...second]);
  }

  if (first.length > 1 && second.length > 1) {
    let out = fuseFiguresLists([first[0]], second);

    first.slice(1).forEach((fig) => {
      out = fuseFiguresLists([fig], out);
    });
    return out;
  }

  if (first.length === 1 && second.length === 1) {
    return fuseFigures(first[0], second[0]);
  }

  return [];
}

export function cutFiguresLists(first: Figure[], second: Figure[]): Figure[] {
  if (!first.length) return [];
  if (!second.length) return first;

  // The easy case
  if (first.length === 1 && second.length === 1) {
    return cutFigures(first[0], second[0]);
  }

  if (first.length > 1) {
    // All the figures here are independant, so we can cut them independently
    return first.flatMap((fig) => cutFiguresLists([fig], second));
  }

  // We are now in the case where there is only one figure in the first list
  // and multiple figures in the second list
  //
  // We turn it in the case with (potentially) multiple figures in the first list
  // and one figure in the second list

  let out = cutFigures(first[0], second[0]);
  second.slice(1).forEach((fig) => {
    out = cutFiguresLists(out, [fig]);
  });
  return out;
}

export function intersectFiguresLists(
  first: Figure[],
  second: Figure[]
): Figure[] {
  if (!first.length || !second.length) {
    return [];
  }

  if (first.length === 1 && second.length === 1) {
    return intersectFigures(first[0], second[0]);
  }

  if (first.length > 1) {
    return first.flatMap((fig) => intersectFiguresLists([fig], second));
  }

  return second.flatMap((fig) => intersectFiguresLists(first, [fig]));
}
