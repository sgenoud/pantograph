import { Vector } from "../definitions.js";
import { TransformationMatrix } from "./TransformationMatrix.js";
import type { BoundingBox } from "./BoundingBox.js";
import { Loop } from "./Loop.js";
import { Strand } from "./Strand.js";
import type { Stroke } from "./Stroke.js";
import { combineDifferentValues } from "../utils/allCombinations.js";
import { Transformable } from "./utils/Transformable.js";
import { exportJSON } from "../export/json/exportJSON.js";
import { stitchSegments } from "../algorithms/stitchSegments.js";

export class Figure extends Transformable<Figure> {
  readonly contour: Loop;
  readonly holes: Loop[];

  constructor(
    contour: Loop,
    holes: Loop[] = [],
    { ignoreChecks = false } = {},
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
      this.holes.map((hole) => hole.clone()),
    );
  }

  transform(matrix: TransformationMatrix): Figure {
    return new Figure(
      this.contour.transform(matrix),
      this.holes.map((hole) => hole.transform(matrix)),
    );
  }

  contains(
    point: Vector,
    { strokeIsInside = false }: { strokeIsInside?: boolean } = {},
  ): boolean {
    return (
      this.contour.contains(point, { strokeIsInside }) &&
      !this.holes.some((hole) => hole.contains(point, { strokeIsInside }))
    );
  }

  intersects(other: Figure): boolean {
    return this.allLoops.some((loop) =>
      other.allLoops.some((otherLoop) => loop.intersects(otherLoop)),
    );
  }

  overlappingStrands(other: Figure | Stroke): Strand[] {
    const otherStrokes = other instanceof Figure ? other.allLoops : [other];
    const overlappingSegments = this.allLoops.flatMap((loop) => {
      return otherStrokes.flatMap((otherLoop) => {
        return loop.overlappingSegments(otherLoop);
      });
    });

    return stitchSegments(overlappingSegments).map((segments) => {
      return new Strand(segments);
    });
  }
}

export function checkIsValidFigure(contour?: Loop, holes: Loop[] = []): void {
  if (!contour) throw new Error("Figure must have a contour");
  for (const [loop1, loop2] of combineDifferentValues([contour, ...holes])) {
    if (loop1.intersects(loop2)) {
      throw new Error("Loops in a figure must not intersect");
    }
  }

  if (
    holes.some(
      (hole) =>
        !contour.contains(hole.firstPoint) &&
        !contour.onStroke(hole.firstPoint),
    )
  ) {
    throw new Error("Holes must be inside the contour");
  }

  for (const [hole1, hole2] of combineDifferentValues(holes)) {
    if (hole1.contains(hole2.firstPoint)) {
      console.error(exportJSON(hole1), exportJSON(hole2));
      throw new Error("Holes must not be inside other holes");
    }
  }
}
