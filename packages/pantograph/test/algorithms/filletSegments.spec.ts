import { describe, it, expect } from "vitest";

import { filletSegments } from "../../src/algorithms/filletSegments";

import { Line } from "../../src/models/segments/Line";
import { Arc } from "../../src/models/segments/Arc";

import { debugImg } from "../debug";

function checkFillet(filleted: any[], radius: number) {
  expect(filleted.length).toBe(3);

  expect(filleted[1]).toBeInstanceOf(Arc);
  expect(filleted[1].radius).toBeCloseTo(radius);

  expect(filleted[0].lastPoint).toBeVector(filleted[1].firstPoint);
  expect(filleted[1].lastPoint).toBeVector(filleted[2].firstPoint);

  // Note that I visually check the snapshots with `debugImg` to make sure that
  // the original snapshots are correct.
  expect(filleted).toMatchSnapshot();
}

describe("filletSegments", () => {
  it("should fillet two lines at right angle", () => {
    const f1 = filletSegments(
      new Line([0, 0], [1, 0]),
      new Line([1, 0], [1, 1]),
      0.5
    );
    checkFillet(f1, 0.5);

    const f2 = filletSegments(
      new Line([1, 1], [1, 0]),
      new Line([1, 0], [0, 0]),
      0.5
    );
    checkFillet(f2, 0.5);

    const f3 = filletSegments(
      new Line([0, 0], [-1, 0]),
      new Line([-1, 0], [-1, 1]),
      0.5
    );
    checkFillet(f3, 0.5);

    const f4 = filletSegments(
      new Line([0, 0], [-1, 0]),
      new Line([-1, 0], [-1, -1]),
      0.5
    );
    checkFillet(f4, 0.5);

    const f5 = filletSegments(
      new Line([0, 0], [1, 0]),
      new Line([1, 0], [1, -1]),
      0.5
    );
    checkFillet(f5, 0.5);
  });

  it("should fillet two lines with a small angle", () => {
    const f1 = filletSegments(
      new Line([0, 0.2], [1, 1]),
      new Line([1, 1], [0, 0]),
      0.05
    );
    checkFillet(f1, 0.05);

    const f2 = filletSegments(
      new Line([0, -0.2], [1, 1]),
      new Line([1, 1], [0, 0]),
      0.05
    );
    checkFillet(f2, 0.05);

    const f3 = filletSegments(
      new Line([0, 0.2], [-1, 1]),
      new Line([-1, 1], [0, 0]),
      0.05
    );
    checkFillet(f3, 0.05);

    const f4 = filletSegments(
      new Line([0, -0.2], [-1, 1]),
      new Line([-1, 1], [0, 0]),
      0.05
    );
    checkFillet(f4, 0.05);

    const f5 = filletSegments(
      new Line([0, -0.2], [-1, -1]),
      new Line([-1, -1], [0, 0]),
      0.05
    );
    checkFillet(f5, 0.05);

    const f6 = filletSegments(
      new Line([0, 0.2], [-1, -1]),
      new Line([-1, -1], [0, 0]),
      0.05
    );
    checkFillet(f6, 0.05);

    const f7 = filletSegments(
      new Line([0, 0.2], [1, -1]),
      new Line([1, -1], [0, 0]),
      0.05
    );
    checkFillet(f7, 0.05);

    const f8 = filletSegments(
      new Line([0, 0.2], [1, -1]),
      new Line([1, -1], [0, 0]),
      0.05
    );
    checkFillet(f8, 0.05);
  });

  it("should fillet two lines with a big angle", () => {
    const f1 = filletSegments(
      new Line([0, 3], [1, 1]),
      new Line([1, 1], [0, 0]),
      0.5
    );
    checkFillet(f1, 0.5);

    const f2 = filletSegments(
      new Line([0, -3], [1, -1]),
      new Line([1, -1], [0, 0]),
      0.5
    );
    checkFillet(f2, 0.5);

    const f3 = filletSegments(
      new Line([0, 3], [-1, 1]),
      new Line([-1, 1], [0, 0]),
      0.5
    );
    checkFillet(f3, 0.5);

    const f4 = filletSegments(
      new Line([0, -3], [-1, -1]),
      new Line([-1, -1], [0, 0]),
      0.5
    );
    checkFillet(f4, 0.5);
  });

  it("should fillet arcs", () => {
    const a1 = new Arc(
      [53, 0],
      [26.5, 45.89934640057525],
      [153.3508823414237, 88.53717320028758],
      true
    );
    const a2 = new Arc(
      [26.5, 45.89934640057525],
      [-26.5, 45.899346400575254],
      [0, 177.07434640057548],
      true
    );

    const f1 = filletSegments(a1, a2, 10);
    checkFillet(f1, 10);
  });
});
