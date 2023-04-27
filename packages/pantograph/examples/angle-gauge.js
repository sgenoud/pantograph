import { draw, outlineStroke } from "../src/main";

export default function angleGauge(angle = 45, thickness = 2, armLength = 10) {
  const strand = draw([armLength, 0])
    .hLine(-armLength)
    .polarLine(armLength, angle)
    .asStrand();

  return outlineStroke(strand, thickness / 2);
}
