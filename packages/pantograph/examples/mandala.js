import {
  draw,
  cut,
  fuseAll,
  offset,
  outlineStroke,
  polarToCartesian,
} from "../src/main";

const drawPolygon = (radius, sides, { bulge = 0, fillet = 0 } = {}) => {
  const angle = 360 / sides;
  const pen = draw([radius, 0]);
  for (let i = 1; i <= sides; i++) {
    pen.bulgeArcTo(polarToCartesian(radius, angle * i), bulge);
    if (fillet) pen.customCorner(fillet);
  }
  return pen.close().rotate(90);
};

const polarCopy = (drawing, radius, count) => {
  const angle = 360 / count;

  const copies = [];
  for (let i = 0; i < count; i++) {
    copies.push(drawing.translateY(radius).rotate(angle * i));
  }
  return copies;
};

export default () => {
  const shape = drawPolygon(50, 6, {
    fillet: 10,
    bulge: -0.2,
  }).rotate(45);
  const stroked = outlineStroke(shape, 3);
  const copies = polarCopy(stroked, 80, 17);

  return fuseAll(copies.slice());
};
