import { describe, it, expect } from "vitest";
import {
  offsetStrand,
  outlineStrand,
} from "../../../src/algorithms/offsets/offsetStroke";

import { draw } from "../../../src/draw";

describe("offsetStrand", () => {
  it("should offset a basic strand", () => {
    const strand = draw()
      .lineTo([1, 1])
      .lineTo([2, 0])
      .lineTo([3, 1])
      .asStrand();

    expect(offsetStrand(strand, 0.5)).toMatchSnapshot();
  });

  it("should offset a strand that create a loop", () => {
    const strand = draw()
      .lineTo([1, 1])
      .lineTo([2, 0])
      .lineTo([1, -1])
      .lineTo([-0.1, 0])
      .asStrand();

    expect(offsetStrand(strand, -0.5)).toMatchSnapshot();
  });

  it("should create an outline that intersects itself", () => {
    const strand = draw()
      .lineTo([5, 0])
      .lineTo([5, -2])
      .lineTo([3, -0.2])
      .lineTo([0, -2])
      .asStrand();

    const offset = offsetStrand(strand, -0.5);

    expect(offset.length).toBe(2);
    expect(offset).toMatchSnapshot();
  });
});

describe("outlineStrand", () => {
  it("should outline a basic strand", () => {
    const strand = draw()
      .lineTo([1, 1])
      .lineTo([2, 0])
      .lineTo([3, 1])
      .asStrand();

    expect(outlineStrand(strand, 1)).toMatchSnapshot();
  });

  it("should outline a basic strand with butt end", () => {
    const strand = draw()
      .lineTo([1, 1])
      .lineTo([2, 0])
      .lineTo([3, 1])
      .asStrand();

    const outline = outlineStrand(strand, 1, "butt");

    expect(outline).toMatchSnapshot();
  });

  it("should outline a strand that create a loop", () => {
    const strand = draw()
      .lineTo([1, 1])
      .lineTo([2, 0])
      .lineTo([1, -1])
      .lineTo([-0.1, 0])
      .asStrand();

    expect(outlineStrand(strand, -1)).toMatchSnapshot();
  });

  it("should create an outline that intersects itself", () => {
    const strand = draw()
      .lineTo([5, 0])
      .lineTo([5, -2])
      .lineTo([3, -0.2])
      .lineTo([0, -2])
      .asStrand();

    expect(outlineStrand(strand, -1)).toMatchSnapshot();
  });
});
