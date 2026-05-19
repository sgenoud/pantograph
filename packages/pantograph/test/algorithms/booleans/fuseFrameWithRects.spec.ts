import { describe, it, expect } from "vitest";
import { draw } from "../../../src/draw";
import {
  cut,
  fuse,
  fuseAll,
  offset,
  selectCorners,
} from "../../../src/operations";
import { Diagram } from "../../../src/models/Diagram";
import type { Vector } from "../../../src/definitions";

function roundNumber(value: number) {
  let v = Math.round((value + Number.EPSILON) * 1000) / 1000;
  if (Object.is(v, -0)) v = 0;
  return v;
}

function drawRectDiagram(
  width: number,
  depth: number,
  options?: { x?: number; y?: number; fillet?: number; chamfer?: number },
): Diagram {
  let drawing = draw([options?.x ?? 0, options?.y ?? 0])
    .hLine(width)
    .vLine(depth)
    .hLine(-width)
    .close();

  if (options?.fillet !== undefined) {
    drawing = selectCorners(drawing).fillet(options.fillet);
  }
  if (options?.chamfer !== undefined) {
    drawing = selectCorners(drawing).chamfer(options.chamfer);
  }
  return drawing;
}

function fuseAllDiagrams(drawings: Diagram[]): Diagram {
  const filtered = drawings.filter((s) => s !== undefined);
  if (filtered.length === 0) return new Diagram([]);
  if (filtered.length === 1) return filtered[0];
  return fuseAll(filtered);
}

describe("fuse frame with overlapping solid rects", () => {
  it("should produce union, not intersection, when fusing a frame with two adjacent filleted rects", () => {
    const width = 40;
    const depth = 60;
    const wall = 1.2;
    const rPer = 4;

    // Build pocket preserves: solid filleted rects
    const pocketPreserve1 = drawRectDiagram(
      roundNumber(width + 2 * wall),
      roundNumber(depth + 2 * wall),
      { x: -wall, y: -wall, fillet: rPer },
    ).translate(wall, wall);

    const pocketPreserve2 = drawRectDiagram(
      roundNumber(width + 2 * wall),
      roundNumber(depth + 2 * wall),
      { x: -wall, y: -wall, fillet: rPer },
    ).translate(width + 2 * wall, wall);

    // Build tray bounds and frame
    const pocketBounds1 = drawRectDiagram(
      roundNumber(width + 2 * wall),
      roundNumber(depth + 2 * wall),
      { x: -wall, y: -wall },
    ).translate(wall, wall);

    const pocketBounds2 = drawRectDiagram(
      roundNumber(width + 2 * wall),
      roundNumber(depth + 2 * wall),
      { x: -wall, y: -wall },
    ).translate(width + 2 * wall, wall);

    let trayBounds = fuseAllDiagrams([pocketBounds1, pocketBounds2]);
    trayBounds = selectCorners(trayBounds).fillet(rPer);
    const perimeterPreserve = cut(trayBounds, offset(trayBounds, -wall));

    // The critical operation: fuse all three
    const preserve = fuseAllDiagrams([
      perimeterPreserve,
      pocketPreserve1,
      pocketPreserve2,
    ]);

    // Points that are clearly inside the union
    const center1: Vector = [21, 31];
    const center2: Vector = [62, 31];
    const middle: Vector = [42, 31];

    // If fuse works correctly (union), all these interior points should be inside
    expect(
      preserve.contains(center1),
      "center of pocketPreserve1 should be inside the fused result",
    ).toBe(true);
    expect(
      preserve.contains(center2),
      "center of pocketPreserve2 should be inside the fused result",
    ).toBe(true);
    expect(
      preserve.contains(middle),
      "overlap region should be inside the fused result",
    ).toBe(true);

    // A proper union should produce a small number of figures
    expect(preserve.figures.length).toBeLessThanOrEqual(2);
  });

  it("should produce union when fusing a frame with a single solid rect sharing edges", () => {
    const wall = 1.2;
    const rPer = 4;

    // Solid filleted rect from (0,0) to (42.4, 62.4)
    const solidRect = drawRectDiagram(42.4, 62.4, { fillet: rPer });

    // Larger frame around it
    const outerRect = drawRectDiagram(42.4 + 2 * wall, 62.4 + 2 * wall, {
      x: -wall,
      y: -wall,
      fillet: rPer + wall,
    });
    const frame = cut(outerRect, offset(outerRect, -wall));

    // Fuse frame with solid rect
    const result = fuse(frame, solidRect);

    // The center of the solid rect should be inside the union
    expect(
      result.contains([21.2, 31.2]),
      "center of solid rect should be inside fused result",
    ).toBe(true);

    // A point in the frame but outside the solid rect
    expect(
      result.contains([-0.5, 31.2]),
      "point in frame outside solid rect should be inside fused result",
    ).toBe(true);

    // Should produce 1 figure
    expect(result.figures.length).toBe(1);
  });
});
