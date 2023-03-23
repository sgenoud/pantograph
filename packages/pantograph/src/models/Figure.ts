import { Vector } from "../definitions";
import { TransformationMatrix } from "./TransformationMatrix";
import type { BoundingBox } from "./BoundingBox";
import { Loop } from "./Loop";
import { combineDifferentValues } from "../utils/allCombinations";
import { Transformable } from "./utils/Transformable";

export class Figure extends Transformable<Figure> {
  readonly contour: Loop;
  readonly holes: Loop[];

  constructor(
    contour: Loop,
    holes: Loop[] = [],
    { ignoreChecks = false } = {}
  ) {
    super();
    if (!ignoreChecks) checkIsValidFigure(contour, holes);
    this.contour = contour;
    this.holes = holes;
  }

  get boundingBox(): BoundingBox {
    return this.contour.boundingBox;
  }

  get isFull(): boolean {
    return this.holes.length === 0;
  }

  get allLoops(): Loop[] {
    return [this.contour, ...this.holes];
  }

  clone(): Figure {
    return new Figure(
      this.contour.clone(),
      this.holes.map((hole) => hole.clone())
    );
  }

  transform(matrix: TransformationMatrix): Figure {
    return new Figure(
      this.contour.transform(matrix),
      this.holes.map((hole) => hole.transform(matrix))
    );
  }

  contains(point: Vector): boolean {
    return (
      this.contour.contains(point) &&
      !this.holes.some((hole) => hole.contains(point))
    );
  }

  intersects(other: Figure): boolean {
    return this.allLoops.some((loop) =>
      other.allLoops.some((otherLoop) => loop.intersects(otherLoop))
    );
  }
}

export function checkIsValidFigure(contour?: Loop, holes: Loop[] = []): void {
  if (!contour) throw new Error("Figure must have a contour");
  for (const [loop1, loop2] of combineDifferentValues([contour, ...holes])) {
    if (loop1.intersects(loop2)) {
      throw new Error("Loops in a figure must not intersect");
    }
  }

  if (holes.some((hole) => !contour.contains(hole.firstPoint))) {
    throw new Error("Holes must be inside the contour");
  }

  for (const [hole1, hole2] of combineDifferentValues(holes)) {
    if (hole1.contains(hole2.firstPoint)) {
      throw new Error("Holes must not be inside other holes");
    }
  }
}
