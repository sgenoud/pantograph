import type { Vector } from "../definitions.js";
import { BoundingBox } from "./BoundingBox.js";
import type { Figure } from "./Figure.js";
import type { TransformationMatrix } from "./TransformationMatrix.js";

import {
  cutFiguresLists,
  fuseFiguresLists,
  intersectFiguresLists,
} from "../algorithms/boolean/figureBooleans";
import { combineDifferentValues } from "../utils/allCombinations.js";
import { Transformable } from "./utils/Transformable.js";
import { Strand } from "./Strand.js";
import type { Stroke } from "./Stroke.js";

const DIAGRAM_INSTANCE = Symbol.for("pantograph:Diagram");

export class Diagram extends Transformable<Diagram> {
  static isInstance(value: unknown): value is Diagram {
    return (
      !!value &&
      (value as { [DIAGRAM_INSTANCE]?: boolean })[DIAGRAM_INSTANCE] === true
    );
  }

  figures: Figure[];

  constructor(figures: Figure[] = [], { ignoreChecks = false } = {}) {
    super();
    Object.defineProperty(this, DIAGRAM_INSTANCE, { value: true });
    if (!ignoreChecks) checkIsValidDiagram(figures);
    this.figures = figures;
  }

  private _boundingBox: BoundingBox | null = null;

  get isEmpty(): boolean {
    return this.figures.length === 0;
  }

  get boundingBox(): BoundingBox {
    if (this.isEmpty) return new BoundingBox();
    if (this._boundingBox === null) {
      let boundingBox = this.figures[0].boundingBox;
      for (const figure of this.figures.slice(1)) {
        boundingBox = boundingBox.merge(figure.boundingBox);
      }
      this._boundingBox = boundingBox;
    }
    return this._boundingBox;
  }

  clone(): Diagram {
    return new Diagram(this.figures.map((figure) => figure.clone()));
  }

  transform(matrix: TransformationMatrix): Diagram {
    return new Diagram(this.figures.map((figure) => figure.transform(matrix)));
  }

  contains(
    point: Vector,
    { strokeIsInside = false }: { strokeIsInside?: boolean } = {},
  ): boolean {
    return this.figures.some((figure) =>
      figure.contains(point, { strokeIsInside }),
    );
  }

  intersects(other: Diagram): boolean {
    return this.figures.some((figure) =>
      other.figures.some((otherFigure) => figure.intersects(otherFigure)),
    );
  }

  overlappingStrands(other: Diagram | Figure | Stroke): Strand[] {
    return this.figures.flatMap((figure) => {
      if (!Diagram.isInstance(other)) {
        return figure.overlappingStrands(other);
      }

      return other.figures.flatMap((otherFigure) =>
        figure.overlappingStrands(otherFigure),
      );
    });
  }

  fuse(other: Diagram): Diagram {
    return new Diagram(fuseFiguresLists(this.figures, other.figures));
  }

  cut(other: Diagram): Diagram {
    return new Diagram(cutFiguresLists(this.figures, other.figures));
  }

  intersect(other: Diagram): Diagram {
    return new Diagram(intersectFiguresLists(this.figures, other.figures));
  }
}

export function checkIsValidDiagram(figures: Figure[]): void {
  for (const [figure, otherFigure] of combineDifferentValues(figures)) {
    if (figure.intersects(otherFigure)) {
      throw new Error("Diagram figures must not intersect");
    }
  }
}
