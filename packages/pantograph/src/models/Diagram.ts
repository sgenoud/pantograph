import type { Vector } from "../definitions";
import { BoundingBox } from "./BoundingBox";
import type { Figure } from "./Figure";
import type { TransformationMatrix } from "./TransformationMatrix";

import {
  cutFiguresLists,
  fuseFiguresLists,
  intersectFiguresLists,
} from "../algorithms/boolean/figureBooleans";
import { combineDifferentValues } from "../utils/allCombinations";
import { Transformable } from "./utils/Transformable";

export class Diagram extends Transformable<Diagram> {
  figures: Figure[];

  constructor(figures: Figure[] = [], { ignoreChecks = false } = {}) {
    super();
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

  contains(point: Vector): boolean {
    return this.figures.some((figure) => figure.contains(point));
  }

  intersects(other: Diagram): boolean {
    return this.figures.some((figure) =>
      other.figures.some((otherFigure) => figure.intersects(otherFigure))
    );
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
