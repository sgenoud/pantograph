import { cut, eraseStrand, exportSVG } from "../../src/main";
import {
  Transformable,
  Diagram,
  Strand,
  TransformationMatrix,
  Stroke,
} from "../../src/models/exports";

export class Dieline extends Transformable<Dieline> {
  public body: Diagram;
  public cutLines: Stroke[];
  public foldLinesBackwards: Stroke[];
  public foldLinesForwards: Stroke[];

  constructor(
    body: Diagram,
    {
      cutLines = [],
      foldLines = [],
      foldLinesForwards = [],
      foldLinesBackwards = [],
    }: {
      cutLines?: Stroke[];
      foldLines?: Stroke[];
      foldLinesBackwards?: Stroke[];
      foldLinesForwards?: Stroke[];
    } = {}
  ) {
    super();
    this.body = body;
    this.cutLines = [...cutLines];
    this.foldLinesBackwards = [...foldLines, ...foldLinesBackwards];
    this.foldLinesForwards = [...foldLinesForwards];
  }

  get foldLines() {
    return [...this.foldLinesForwards, ...this.foldLinesBackwards];
  }

  clone() {
    return new Dieline(this.body, {
      cutLines: [...this.cutLines],
      foldLinesForwards: [...this.foldLinesForwards],
      foldLinesBackwards: [...this.foldLinesBackwards],
    });
  }

  addCutLine(cut: Strand) {
    this.cutLines.push(cut);
    return this;
  }

  addFoldLine(fold: Strand, direction: "forwards" | "backwards" = "backwards") {
    if (direction === "forwards") {
      this.foldLinesForwards.push(fold);
    } else {
      this.foldLinesBackwards.push(fold);
    }
  }

  fuseFold(
    fold: Diagram | Dieline,
    direction: "forwards" | "backwards" = "backwards"
  ) {
    const otherBody: Diagram = fold instanceof Dieline ? fold.body : fold;

    const commonLines = this.body.overlappingStrands(otherBody);
    if (direction === "forwards") {
      this.foldLinesForwards.push(...commonLines);
    } else {
      this.foldLinesBackwards.push(...commonLines);
    }

    this.fuseBody(fold);
    return this;
  }

  fuseBody(other: Dieline | Diagram) {
    let otherBody: Diagram;

    if (other instanceof Dieline) {
      otherBody = other.body;
      this.cutLines.push(...other.cutLines);
      this.foldLinesForwards.push(...other.foldLinesForwards);
      this.foldLinesBackwards.push(...other.foldLinesBackwards);
    } else {
      otherBody = other;
    }

    this.body = this.body.fuse(otherBody);
    return this;
  }

  cutShape(shape: Diagram) {
    this.body = cut(this.body, shape);
    this.cutLines = this.cutLines.flatMap((cut) =>
      eraseStrand(cut, shape, true)
    );
    this.eraseFolds(shape);
    return this;
  }

  eraseFolds(shape: Diagram) {
    this.foldLinesBackwards = this.foldLinesBackwards.flatMap((fold) =>
      eraseStrand(fold, shape, true)
    );
    this.foldLinesForwards = this.foldLinesForwards.flatMap((fold) =>
      eraseStrand(fold, shape, true)
    );
  }

  transform(matrix: TransformationMatrix) {
    const newDieline = new Dieline(this.body.transform(matrix), {
      cutLines: this.cutLines.map((cut) => cut.transform(matrix)),
      foldLinesForwards: this.foldLinesForwards.map((fold) =>
        fold.transform(matrix)
      ),
      foldLinesBackwards: this.foldLinesBackwards.map((fold) =>
        fold.transform(matrix)
      ),
    });

    return newDieline;
  }

  asSVG() {
    const shapes: { shape: Diagram | Stroke; color: string }[] = [];
    if (this.body) {
      shapes.push({ shape: this.body, color: "red" });
    }
    if (this.cutLines.length) {
      this.cutLines.map((shape) => shapes.push({ shape, color: "red" }));
    }

    if (this.foldLinesBackwards.length) {
      this.foldLinesBackwards.map((shape) =>
        shapes.push({ shape, color: "green" })
      );
    }

    if (this.foldLinesForwards.length) {
      this.foldLinesForwards.map((shape) =>
        shapes.push({ shape, color: "blue" })
      );
    }

    return exportSVG(shapes, { unit: "mm" });
  }
}
