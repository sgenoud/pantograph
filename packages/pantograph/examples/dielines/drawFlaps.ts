import { draw } from "../../src/main";

export type FlapContractionMode = "rounded" | "sharp";
export type HorizontalFlapOptions = {
  fillet?: number;
  contraction?: number;
  contractionMode?: FlapContractionMode;
  contractionLeft?: number;
  contractionRight?: number;
  leftContractionMode?: FlapContractionMode;
  rightContractionMode?: FlapContractionMode;
};
export type VerticalFlapTopOptions = HorizontalFlapOptions & {
  contractionTop?: number;
  contractionBottom?: number;
  topContractionMode?: FlapContractionMode;
  bottomContractionMode?: FlapContractionMode;
};

function drawFlap(
  width: number,
  height: number,
  {
    fillet = 1,
    contraction = 1,
    contractionMode = "rounded",
    contractionLeft: contractionLeftInput,
    contractionRight: contractionRightInput,
    leftContractionMode,
    rightContractionMode,
  }: HorizontalFlapOptions = {}
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

export function topFlap(
  width: number,
  height: number,
  options: HorizontalFlapOptions = {}
) {
  return drawFlap(width, height, options);
}

export function bottomFlap(
  width: number,
  height: number,
  options: HorizontalFlapOptions = {}
) {
  return drawFlap(width, height, options).mirror("x");
}

export function leftFlap(
  width: number,
  height: number,
  {
    contractionTop,
    contractionBottom,
    topContractionMode,
    bottomContractionMode,
    ...options
  }: VerticalFlapTopOptions = {}
) {
  return drawFlap(width, height, {
    contractionLeft: contractionTop,
    contractionRight: contractionBottom,
    leftContractionMode: topContractionMode,
    rightContractionMode: bottomContractionMode,
    ...options,
  }).rotate(90);
}

export function rightFlap(
  width: number,
  height: number,
  options: VerticalFlapTopOptions = {}
) {
  return leftFlap(width, height, options).mirror("y");
}

export const drawFlaps = {
  right: rightFlap,
  left: leftFlap,
  top: topFlap,
  bottom: bottomFlap,
};
