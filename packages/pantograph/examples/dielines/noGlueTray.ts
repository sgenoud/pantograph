import { drawRect } from "../../src/drawShape";
import { Dieline } from "./Dieline";
import { drawFlaps } from "./drawFlaps";
import { FoldLockBump } from "./FoldLockBump";
import { linearDistribution } from "./linearDistribution";

export function noGlueTray(
  width: number,
  height: number,
  depth: number,
  { paperThickness = 0.2 } = {}
) {
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

  const bumpWidth = Math.min(10, width / 5);
  const bump = new FoldLockBump(bumpWidth, paperThickness).translateY(
    height / 2
  );
  const bumps = linearDistribution(width, bumpWidth, 1.5, 4).distribute(bump);
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
  bumps.forEach((bump) => {
    bump.makeCut(shape);
    bump.mirror("x").makeCut(shape);
  });
  return shape;
}
