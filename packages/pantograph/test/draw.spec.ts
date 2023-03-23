import { describe, it, expect } from "vitest";
import { Vector } from "../src/definitions";
import { draw } from "../src/draw";

import { rect, polygon } from "./quickShapes";

const POLYGON: Vector[] = [
  [-2, 3],
  [-1, -3],
  [2, -2],
  [3, 2],
];

describe("draw", () => {
  it("should work with absolute coordinates", () => {
    const fig = draw(POLYGON[0])
      .lineTo(POLYGON[1])
      .lineTo(POLYGON[2])
      .lineTo(POLYGON[3])
      .lineTo(POLYGON[0])
      .close();

    expect(fig.figures[0].contour).toBeLoop(polygon(POLYGON));
  });

  it("should work horizonal and vertical relative coordinates", () => {
    const fig = draw([-2, -2]).hLine(4).vLine(4).hLine(-4).vLine(-4).close();
    expect(fig.figures[0].contour).toBeLoop(rect(4, 4));
  });

  it("should close when missing a last link", () => {
    const fig = draw(POLYGON[0])
      .lineTo(POLYGON[1])
      .lineTo(POLYGON[2])
      .lineTo(POLYGON[3])
      .close();

    expect(fig.figures[0].contour).toBeLoop(polygon(POLYGON));
  });

  it("should close with a mirror", () => {
    const fig = draw(POLYGON[0])
      .lineTo(POLYGON[1])
      .lineTo(POLYGON[2])
      .closeWithMirror();

    expect(fig.figures[0].contour).toBeLoop(
      polygon([
        [-2, 3],
        [-1, -3],
        [2, -2],
        [3.6341463414634148, 0.7073170731707324],
      ])
    );
  });
});
