import { draw, cut, eraseStrand, exportSVG } from "../src/main";
import { drawRect } from "../src/drawShape";
import { Transformable } from "../src/models/exports";

function drawFlap(
  width,
  height,
  {
    fillet = 1,
    contraction = 1,
    contractionMode = "rounded",
    contractionLeft: contractionLeftInput,
    contractionRight: contractionRightInput,
    leftContractionMode,
    rightContractionMode,
  } = {}
) {
  const contractionLeft = contractionLeftInput ?? contraction;
  const contractionRight = contractionRightInput ?? contraction;

  const flapMaker = draw([-width / 2, 0]).hLine(width);

  if (contractionRight) {
    if ((rightContractionMode ?? contractionMode) === "rounded") {
      flapMaker.tangentArc(-contractionRight, contractionRight, [-1, 0]);
      flapMaker.vLine(height - contractionRight);
    } else {
      flapMaker.line(-contractionRight, height);
    }
  } else {
    flapMaker.vLine(height);
  }

  flapMaker.customCorner(fillet);
  flapMaker.hLine(-width + contractionLeft + contractionRight);
  flapMaker.customCorner(fillet);

  if (contractionLeft) {
    if ((leftContractionMode ?? contractionMode) === "rounded") {
      flapMaker.vLine(-height + contractionLeft);
      flapMaker.tangentArcTo([-width / 2, 0]);
    } else {
      flapMaker.lineTo([-width / 2, 0]);
    }
  } else {
    flapMaker.vLine(-height);
  }

  return flapMaker.close();
}

function topFlap(width, height, options) {
  return drawFlap(width, height, options);
}

function bottomFlap(width, height, options) {
  return drawFlap(width, height, options).mirror("x");
}

function leftFlap(
  width,
  height,
  {
    contractionTop,
    contractionBottom,
    topContractionMode,
    bottomContractionMode,
    ...options
  }
) {
  return drawFlap(width, height, {
    contractionLeft: contractionTop,
    contractionRight: contractionBottom,
    leftContractionMode: topContractionMode,
    rightContractionMode: bottomContractionMode,
    ...options,
  }).rotate(90);
}

function rightFlap(width, height, options) {
  return leftFlap(width, height, options).mirror("y");
}

const drawFlaps = {
  right: rightFlap,
  left: leftFlap,
  top: topFlap,
  bottom: bottomFlap,
};

// An experimental class that should make it easy to manager the different
// parts of a dieline based on pantograph.
class Dieline extends Transformable {
  constructor(body, cuts = [], folds = []) {
    super();
    this.body = body;
    this.cuts = [...cuts];
    this.folds = [...folds];
  }

  addCut(cut) {
    this.cuts.push(cut);
    return this;
  }

  addFoldLine(fold) {
    this.folds.push(fold);
    return this;
  }

  fuseFold(fold) {
    let otherBody = fold;

    if (fold instanceof Dieline) {
      otherBody = fold.body;
      this.cuts.push(...fold.cuts);
      this.folds.push(...fold.folds);
    }

    const commonLines = this.body.overlappingStrands(otherBody);
    this.folds.push(...commonLines);

    this.body = this.body.fuse(otherBody);

    return this;
  }

  fuseBody(other) {
    let otherBody = other;
    if (other instanceof Dieline) {
      otherBody = other.body;
    }

    this.body = this.body.fuse(otherBody);
    return this;
  }

  cutShape(shape) {
    this.body = cut(this.body, shape);
    this.cuts = this.cuts.flatMap((cut) => eraseStrand(cut, shape, true));
    this.folds = this.folds.flatMap((fold) => eraseStrand(fold, shape, true));
    return this;
  }

  eraseFolds(shape) {
    this.folds = this.folds.flatMap((fold) => eraseStrand(fold, shape, true));
  }

  transform(matrix) {
    const newDieline = new Dieline(
      this.body.transform(matrix),
      this.cuts.map((cut) => cut.transform(matrix)),
      this.folds.map((fold) => fold.transform(matrix))
    );

    return newDieline;
  }

  asSVG() {
    const shapes = [];
    if (this.body) {
      shapes.push({ shape: this.body, color: "red" });
    }
    if (this.cuts) {
      this.cuts.map((shape) => shapes.push({ shape, color: "red" }));
    }

    if (this.folds) {
      this.folds.map((shape) => shapes.push({ shape, color: "green" }));
    }

    return exportSVG(shapes);
  }
}

const drawBump = (width, height) => {
  return draw([-width / 2, 0])
    .line(height, -height)
    .hLine(width - 2 * height)
    .line(height, height);
};

// A helper class to create bumps for locking parts together without glue
class FoldBump extends Transformable {
  constructor(width, paperThickness = 0.1) {
    super();

    if (typeof width !== "number") {
      this.cut = width.cut;
      this.unfold = width.unfold;
      this.bump = width.bump;
      return;
    }

    const pen = drawBump(width, paperThickness * 2);

    this.cut = pen.asStrand();
    this.unfold = pen.close();

    this.bump = drawBump(width - 2 * paperThickness, 3 * paperThickness)
      .close()
      .mirror("x");
  }

  transform(matrix) {
    return new FoldBump({
      cut: this.cut.transform(matrix),
      unfold: this.unfold.transform(matrix),
      bump: this.bump.transform(matrix),
    });
  }

  makeCut(dieline) {
    dieline.eraseFolds(this.unfold);
    dieline.addCut(this.cut);
  }

  fuseBump(dieline) {
    dieline.fuseBody(this.bump);
  }
}

function basicTray(width, height, depth, { paperThickness = 0.1 } = {}) {
  // The back and front sides are composed of two layers (inside and outside)
  // that fold on top of each other. The inside layer will lock into some fold
  // bumps
  const backSide = new Dieline(
    // The back side of the tray
    drawRect(width - 2 * paperThickness, depth).translateY(depth / 2)
  )
    .fuseFold(
      // the inner side of the back side of the tray (that folds on top of the
      // flaps from the sides
      drawFlaps
        .top(width, depth, {
          contraction: 3 * paperThickness,
          fillet: 0,
        })
        .translateY(depth)
    )
    .translateY(height / 2);

  // These correspond to the small bumps that lock the flaps without a need for glue
  const bump = new FoldBump(5, paperThickness).translateY(height / 2);
  const bumps = [
    bump,
    bump.translateX((-3 * width) / 8),
    bump.translateX((3 * width) / 8),
  ];
  bumps.forEach((bump) => bump.translateY(2 * depth).fuseBump(backSide));

  // The left and right sides are composed of a single rectangle for the side
  // itself and two flaps that will be locked in by the two parts of the back
  // / front
  const innerFlapHeight = Math.min(2 * depth, width / 2 - 1);
  const leftSide = new Dieline(drawRect(depth, height))
    .fuseFold(
      drawFlaps
        .top(depth, innerFlapHeight, {
          contractionLeft: 2 * paperThickness,
        })
        .translateY(height / 2)
    )
    .fuseFold(
      drawFlaps
        .bottom(depth, innerFlapHeight, {
          contractionLeft: 2 * paperThickness,
        })
        .translateY(-height / 2)
    )
    .translateX(-width / 2 - depth / 2);

  // We put it all together by fusing it with the bottom
  const shape = new Dieline(drawRect(width, height))
    .fuseFold(backSide)
    .fuseFold(backSide.mirror("x")) // the front sidej
    .fuseFold(leftSide)
    .fuseFold(leftSide.mirror("y")); // the right side

  // We need to cut in the bottom - and could not merge it before.
  bumps.forEach((bump) => bump.makeCut(shape));
  return shape;
}

export default function drawDieline() {
  return basicTray(86, 63, 10, { paperThickness: 0.1 });
}
