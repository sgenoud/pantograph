import { describe, it, expect } from "vitest";
import { Figure } from "../../../src/models/Figure";
import {
  cutFigures,
} from "../../../src/algorithms/boolean/figureBooleans";
import { polygon } from "../../quickShapes";
import { Loop } from "../../../src/models/Loop";

function chamferedRect(
  width: number,
  height: number,
  chamferSize: number,
  ox = 0,
  oy = 0,
): Loop {
  const c = chamferSize;
  return polygon([
    [ox, oy + c],
    [ox + c, oy],
    [ox + width - c, oy],
    [ox + width, oy + c],
    [ox + width, oy + height - c],
    [ox + width - c, oy + height],
    [ox + c, oy + height],
    [ox, oy + height - c],
  ]);
}

function drawRectangleLoop(w: number, h: number, x = 0, y = 0): Loop {
  return polygon([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
}

describe("cutting a rect by a chamfered frame", () => {
  it("should not produce overlapping figures", () => {
    // A rectangle whose edges coincide with a chamfered rectangle's edges
    // is cut by a frame (chamfered outer rect with chamfered inner hole).
    // The inner chamfered rect shares edges with the rectangle on all 4 sides
    // but differs at the corners due to chamfers.
    // Before the fix, intersectLoops incorrectly returned the full rectangle
    // instead of the chamfered inner rect, because it only checked segment
    // midpoints (which all fell on shared edges) and missed the vertices
    // (which fall outside the chamfered corners).
    const wall = 1.2;
    const rPer = 4;

    const boundsLoop = drawRectangleLoop(78, 74, wall, wall);
    const outerLoop = chamferedRect(78 + 2 * wall, 74 + 2 * wall, rPer, 0, 0);
    const innerLoop = chamferedRect(
      78,
      74,
      Math.max(rPer - wall, 0),
      wall,
      wall,
    );

    const result = cutFigures(new Figure(boundsLoop), new Figure(outerLoop, [innerLoop]));

    // Should have 5 figures: 4 corner triangles + inner chamfered rect
    expect(result.length).toBe(5);

    // The inner chamfered rect should have 8 segments (not 4 like the bounds rect)
    const innerFig = result.find((f) => f.contour.segmentsCount === 8);
    expect(innerFig).toBeDefined();

    // No result figures should overlap
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        expect(result[i].intersects(result[j])).toBe(false);
      }
    }
  });
});
