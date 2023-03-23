import { describe, it, expect } from "vitest";

import { BoundingBox } from "../../src/models/BoundingBox";

describe("BoundingBox", () => {
  it("detects when a point is inside a bounding box", () => {
    const box = new BoundingBox(-1, -1, 1, 1);
    expect(box.contains([0, 0])).toBe(true);
  });

  it("detects when a point is outside a bounding box", () => {
    const box = new BoundingBox(-1, -1, 1, 1);
    expect(box.contains([2, 0])).toBe(false);
  });

  it("detects when bounding boxes overlap correctly", () => {
    const box1 = new BoundingBox(-1, -1, 1, 1);
    const box2 = new BoundingBox(0, 0, 1, 2);

    expect(box1.overlaps(box2)).toBe(true);
    expect(box1.overlaps(new BoundingBox(2, 2, 3, 3))).toBe(false);
  });

  it("considers two bounding boxes touching one point to overlap", () => {
    const box1 = new BoundingBox(-1, -1, 1, 1);
    const box2 = new BoundingBox(1, 1, 2, 2);

    expect(box1.overlaps(box2)).toBe(true);
  });

  it("merges two bounding boxes correctly", () => {
    const box1 = new BoundingBox(-1, -1, 1, 1);
    const box2 = new BoundingBox(3, 4, 5, 5);
    const box3 = new BoundingBox(-0.5, -0.5, 0.5, 0.5);

    expect(box1.merge(box2)).toEqual(new BoundingBox(-1, -1, 5, 5));
    expect(box1.merge(box3)).toEqual(box1);
  });

  it("merges a bounding box with a point correctly", () => {
    const box = new BoundingBox(-1, -1, 1, 1);
    expect(box.addPoint([2, 2])).toEqual(new BoundingBox(-1, -1, 2, 2));
    expect(box.addPoint([0, 0])).toEqual(box);
  });
});
