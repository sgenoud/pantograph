import { draw } from "../../src/main";
import {
  Diagram,
  Strand,
  Transformable,
  TransformationMatrix,
} from "../../src/models/exports";
import { Dieline } from "./Dieline";

const drawBump = (width: number, height: number) => {
  return draw([-width / 2, 0])
    .line(height, -height)
    .hLine(width - 2 * height)
    .line(height, height);
};

// A helper class to create bumps for locking parts together without glue
export class FoldLockBump extends Transformable<FoldLockBump> {
  cut: Strand;
  unfold: Diagram;
  bump: Diagram;
  constructor(
    width: number | { cut: Strand; unfold: Diagram; bump: Diagram },
    paperThickness = 0.2
  ) {
    super();

    if (typeof width !== "number") {
      this.cut = width.cut;
      this.unfold = width.unfold;
      this.bump = width.bump;
      return;
    }

    const pen = drawBump(width, paperThickness * 2.5);

    this.cut = pen.asStrand();
    this.unfold = pen.close();

    this.bump = drawBump(width - 5 * paperThickness, 5 * paperThickness)
      .close()
      .mirror("x");
  }

  clone() {
    return new FoldLockBump(this);
  }

  transform(matrix: TransformationMatrix) {
    return new FoldLockBump({
      cut: this.cut.transform(matrix),
      unfold: this.unfold.transform(matrix),
      bump: this.bump.transform(matrix),
    });
  }

  makeCut(dieline: Dieline) {
    dieline.eraseFolds(this.unfold);
    dieline.addCutLine(this.cut);
  }

  fuseBump(dieline: Dieline) {
    dieline.fuseBody(this.bump);
  }
}
