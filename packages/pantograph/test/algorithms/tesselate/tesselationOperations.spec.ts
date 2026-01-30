import { describe, it, expect } from "vitest";

import { drawRect } from "../../../src/drawShape/drawRect";
import { tesselatePoints } from "../../../src/tesselationOperations";
import { sameVector } from "../../../src/vectorOperations";
import type { Vector } from "../../../src/definitions";

function isClockwise(points: Vector[]): boolean {
  if (points.length < 3) return false;
  const area = points
    .map((v1, i) => {
      const v2 = points[(i + 1) % points.length];
      return (v2[0] - v1[0]) * (v2[1] + v1[1]);
    })
    .reduce((a, b) => a + b, 0);
  return area > 0;
}

describe("tesselatePoints", () => {
  it("tesselates a drawRect diagram into ccw contour points", () => {
    const diagram = drawRect(10, 6);
    const polygons = tesselatePoints(diagram, { maxAngle: Math.PI / 45 });

    expect(polygons.length).toBe(1);

    const contour = polygons[0];
    expect(contour.length).toBeGreaterThan(2);
    expect(isClockwise(contour)).toBe(false);

    const lastIndex = contour.length - 1;
    expect(sameVector(contour[0], contour[lastIndex])).toBe(false);
  });
});
