import { describe, it, expect } from "vitest";
import { checkValidLoop } from "../../src/models/Loop";

import { rect, polygon } from "../quickShapes";

export default describe("Loop", () => {
  describe("inclusion", () => {
    it("detects when a point is inside a loop", () => {
      const loop = rect(2, 2);

      expect(loop.contains([0, 0])).toBe(true);
    });

    it("detects when a point is outside of a loop", () => {
      const loop = rect(2, 2);

      expect(loop.contains([-2, 0])).toBe(false);
    });

    it("handles points on the border of the loop as outside", () => {
      const loop = rect(2, 2);

      expect(loop.contains([0, 1])).toBe(false);
      expect(loop.contains([1, 0])).toBe(false);
      expect(loop.contains([0, -1])).toBe(false);
      expect(loop.contains([-1, 0])).toBe(false);
    });

    it("handles points on the corner of the loop as outside", () => {
      const loop = rect(2, 2);

      expect(loop.contains([1, 1])).toBe(false);
      expect(loop.contains([-1, -1])).toBe(false);
      expect(loop.contains([1, -1])).toBe(false);
      expect(loop.contains([-1, 1])).toBe(false);
    });

    it("handles outside points aligned with the box", () => {
      // We rely on the fact that we know the ray is in direction [1, 0] to
      // make sure it handles the case where the ray is aligned with the box
      const loop = rect(2, 2);

      expect(loop.contains([-2, 1])).toBe(false);
      expect(loop.contains([-2, -1])).toBe(false);
    });

    it("handles points on a corner of a triangle", () => {
      // We rely on the fact that we know the ray is in direction [1, 0] to
      // make sure it handles the case where the ray only touches a single
      // corner of a shape
      const triangle = polygon([
        [1, 0],
        [2, 0],
        [2, 1],
      ]);
      expect(triangle.contains([0, 1])).toBe(false);

      const triangle2 = polygon([
        [0, 0],
        [2, 1.5],
        [0, 3],
      ]);
      expect(triangle2.contains([1, 1.5])).toBe(true);
    });
  });

  describe("checkValidLoop", () => {
    it("detects when a loop is valid", () => {
      const loop = rect(2, 2);
      expect(() => checkValidLoop(loop.segments)).not.toThrow();
    });

    it("detects when a loop is not open", () => {
      const loop = rect(2, 2);
      expect(() => checkValidLoop(loop.segments.slice(0, -1))).toThrow();
    });
  });
});
