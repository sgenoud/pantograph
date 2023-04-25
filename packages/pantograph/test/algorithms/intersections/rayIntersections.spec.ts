import { describe, it, expect } from "vitest";

import { rayIntersectionsCount } from "../../../src/algorithms/intersections/rayIntersections";
import { Arc } from "../../../src/models/segments/Arc";

const threeQuarterCircle = (r: number) =>
  new Arc([0, r], [-r, 0], [0, 0], true);

describe("rayIntersectionsCount", () => {
  describe("arc", () => {
    // Note that we assume that we know that the ray is going in the
    // X direction from the defined point

    it("should return 0 if the ray is above or below the circle", () => {
      const arc = threeQuarterCircle(4);
      expect(rayIntersectionsCount([0, 10], arc)).toBe(0);
      expect(rayIntersectionsCount([0, -10], arc)).toBe(0);
    });

    it("should return 1 if the ray is inside the circle that crosses the arc", () => {
      const arc = threeQuarterCircle(4);
      expect(rayIntersectionsCount([0, -1], arc)).toBe(1);
    });

    it("should return 2 if the ray is outside at the right of the circle that crosses the arc twicej", () => {
      const arc = threeQuarterCircle(4);
      expect(rayIntersectionsCount([-5, -1], arc)).toBe(2);
    });

    it("should return 2 if the ray is outside at the right of the circle that crosses the circle, but crosses the arc once", () => {
      const arc = threeQuarterCircle(4);
      expect(rayIntersectionsCount([-5, 1], arc)).toBe(1);
    });

    it("should return 0 if the ray start at the right of the arc", () => {
      const arc = threeQuarterCircle(4);
      expect(rayIntersectionsCount([5, 1], arc)).toBe(0);
    });

    it("should return 1 for this arc that was buggy", () => {
      const arc = new Arc(
        [-7.421792193014102, 39.703081476706785],
        [53.26056233274296, 29.249999999999968],
        [-7.721149961268838e-14, -98.57534959858313],
        true
      );

      expect(
        rayIntersectionsCount([-45.281051156689436, 32.28959569290916], arc)
      ).toBe(1);
    });

    it("should return 1 for this other arc that was buggy", () => {
      const arc = new Arc(
        [38.52710211020566, 42.26221778725147],
        [34.48816871800838, 46.554145764976006],
        [137.3302811663715, 139.2876747992915],
        true
      );

      const point: [number, number] = [-38.52710211020651, 42.262217787250734];

      expect(rayIntersectionsCount(point, arc)).toBe(1);
    });
  });
});
