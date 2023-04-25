import { describe, it, expect } from "vitest";

import { draw } from "../../../src/draw";
import { drawRect } from "../../../src/drawShape";

import { debugImg } from "../../debug";

import {
  eraseStrandWithinLoop,
  eraseStrandOutsideLoop,
} from "../../../src/algorithms/boolean/strandBoolean";

// Note: all the tests are checked visually by using `debugImg`. Please do so
// as well when you add new tests or have some failures.

describe("eraseStrandWithinLoop", () => {
  it("should erase the parts of a strand within a loop", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    expect(eraseStrandWithinLoop(s, r)).toMatchSnapshot();
  });

  it("should not erase the parts of on the border when configured that way", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1.5])
      .lineTo([-1, -1.5])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    expect(eraseStrandWithinLoop(s, r)).toMatchSnapshot();
  });

  it("should erase the parts of on the border when configured that way", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1.5])
      .lineTo([-1, -1.5])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    expect(eraseStrandWithinLoop(s, r, true)).toMatchSnapshot();
  });
});

describe("eraseStrandOutsideLoop", () => {
  it("should erase the parts of a strand within a loop", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    expect(eraseStrandOutsideLoop(s, r)).toMatchSnapshot();
  });

  it("should not erase the parts of on the border when configured that way", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1.5])
      .lineTo([-1, -1.5])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    expect(eraseStrandOutsideLoop(s, r)).toMatchSnapshot();
  });

  it("should erase the parts of on the border when configured that way", () => {
    const r = drawRect(5, 3).figures[0].contour;
    const s = draw([-3, -3])
      .lineTo([1, -1.5])
      .lineTo([-1, -1.5])
      .lineTo([0.5, 1])
      .lineTo([3, 3])
      .asStrand();

    debugImg([r, s]);
    debugImg(eraseStrandOutsideLoop(s, r, true), "erased");

    expect(eraseStrandOutsideLoop(s, r, true)).toMatchSnapshot();
  });
});
