import { draw, cut, fuseAll, offset, polarToCartesian } from "../src/main";

const drawStar = (radius, innerRadius, sides, fillet = 0) => {
  const angle = 360 / sides;
  const pen = draw([radius, 0]);
  for (let i = 1; i <= sides; i++) {
    pen.lineTo(polarToCartesian(innerRadius, angle * (i - 0.5)));
    if (fillet) pen.customCorner(fillet);
    pen.lineTo(polarToCartesian(radius, angle * i));
    if (fillet) pen.customCorner(fillet);
  }
  return pen.close().rotate(90);
};

export default (sides = 5, thickness = 5) => {
  const innerStar = drawStar(50, 20, sides, 1);
  return cut(offset(innerStar, thickness), innerStar);
};
