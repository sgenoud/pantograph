import { describe, it, expect } from "vitest";
import { Loop } from "../../../src/models/Loop";
import { Figure } from "../../../src/models/Figure";
import { TransformationMatrix } from "../../../src/models/TransformationMatrix";
import { Diagram } from "../../../src/models/Diagram";
import {
  cutFigures,
  cutFiguresLists,
} from "../../../src/algorithms/boolean/figureBooleans";
import { polygon } from "../../quickShapes";
import type { Vector } from "../../../src/definitions";
import {
  cut,
  fuse,
  fuseAll,
  intersect,
  offset,
  selectCorners,
} from "../../../src/operations";
import { draw } from "../../../src/draw";

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

function drawPolysides(radius: number, sidesCount: number): Diagram {
  const points: Vector[] = [];
  for (let i = 0; i < sidesCount; i++) {
    const theta = -((Math.PI * 2) / sidesCount) * i;
    points.push([radius * Math.sin(theta), radius * Math.cos(theta)]);
  }
  let drawing = draw(points[points.length - 1]);
  for (const point of points) {
    drawing = drawing.lineTo(point);
  }
  return drawing.close();
}

function drawRectDiagram(
  width: number,
  depth: number,
  options?: { x?: number; y?: number; chamfer?: number },
): Diagram {
  let drawing = draw([options?.x ?? 0, options?.y ?? 0])
    .hLine(width)
    .vLine(depth)
    .hLine(-width)
    .close();

  if (options?.chamfer !== undefined) {
    drawing = selectCorners(drawing).chamfer(options.chamfer);
  }
  return drawing;
}

function hexGridPattern(polygonRadius: number, polygonWall: number) {
  const dx =
    polygonRadius / 2 + Math.sin(Math.PI / 3) * polygonWall + polygonRadius;
  const dy = Math.sqrt(3) * polygonRadius + polygonWall;
  return { dx, dy };
}

function hexGridSize(
  polygonRadius: number,
  dx: number,
  dy: number,
  width: number,
  depth: number,
) {
  return {
    cx: Math.ceil((width - polygonRadius) / dx / 2),
    cy: Math.ceil((depth / dy - 1) / 2),
  };
}

function fuseAllDiagrams(drawings: (Diagram | undefined)[]): Diagram {
  const filtered = drawings.filter((s): s is Diagram => s !== undefined);
  if (filtered.length === 0) return new Diagram([]);
  if (filtered.length === 1) return filtered[0];
  return fuseAll(filtered);
}

function hexGrid(
  polygonRadius: number,
  polygonWall: number,
  width: number,
  depth: number,
): Diagram {
  const { dx, dy } = hexGridPattern(polygonRadius, polygonWall);
  const { cx, cy } = hexGridSize(polygonRadius, dx, dy, width, depth);

  let poly = drawPolysides(polygonRadius, 6);
  poly = poly.transform(
    new TransformationMatrix().rotate((30 * Math.PI) / 180),
  );

  const shortColumnDrawings: Diagram[] = [];
  for (let y = -cy; y <= cy; y++) {
    shortColumnDrawings.push(
      poly.transform(new TransformationMatrix().translate(0, dy * y)),
    );
  }
  const shortColumn = fuseAllDiagrams(shortColumnDrawings);
  const longColumn = fuse(
    shortColumn,
    poly.transform(new TransformationMatrix().translate(0, dy * (cy + 1))),
  );

  const gridDrawings: Diagram[] = [];
  for (let x = -cx; x <= cx; x++) {
    const col = Math.abs(x) % 2 ? longColumn : shortColumn;
    gridDrawings.push(
      col.transform(
        new TransformationMatrix().translate(
          x * dx,
          (Math.abs(x) % 2) * (-dy / 2),
        ),
      ),
    );
  }
  return fuseAllDiagrams(gridDrawings);
}

function getPolygonBounds(radius: number, sides: number, angle: number) {
  const x: number[] = [];
  const y: number[] = [];
  const angleRad = ((angle + 90) * 2 * Math.PI) / 360;
  for (let i = 0; i < sides; i++) {
    const cx = radius * Math.cos((2 * Math.PI * i) / sides);
    const cy = radius * Math.sin((2 * Math.PI * i) / sides);
    x.push(cx * Math.cos(angleRad) - cy * Math.sin(angleRad));
    y.push(cx * Math.sin(angleRad) - cy * Math.cos(angleRad));
  }
  return {
    xMin: Math.min(...x),
    xMax: Math.max(...x),
    yMin: Math.min(...y),
    yMax: Math.max(...y),
  };
}

function roundNumber(value: number) {
  let v = Math.round((value + Number.EPSILON) * 1000) / 1000;
  if (Object.is(v, -0)) v = 0;
  return v;
}

describe("cutting shapes with shared edges and chamfered corners", () => {
  it("should not produce overlapping figures when cutting a rect by a chamfered frame", () => {
    // A rectangle whose edges coincide with a chamfered rectangle's edges
    // is cut by a frame (chamfered outer rect with chamfered inner hole).
    // Before the fix, intersectLoops incorrectly returned the full rectangle
    // instead of the chamfered inner rect, because loopInsideOrOnBoundary
    // only checked segment midpoints (which all fell on shared edges) and
    // missed the vertices (which fall outside the chamfered corners).
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

    const result = cutFigures(
      new Figure(boundsLoop),
      new Figure(outerLoop, [innerLoop]),
    );

    expect(result.length).toBe(5);
    expect(result.find((f) => f.contour.segmentsCount === 8)).toBeDefined();

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        expect(result[i].intersects(result[j])).toBe(false);
      }
    }
  });

  it("should correctly cut a hex grid by a preserve shape (full user scenario)", () => {
    // Reproduces the user's exact bug: hex grid cut by a fused frame + pocket
    // preserve. The preserve has shared edges with the hex bounds rectangle.
    const radius = 40;
    const wiggle = 1;
    const bounds = getPolygonBounds(radius, 5, 0);
    const width = bounds.xMax - bounds.xMin + 2 * wiggle;
    const depth = bounds.yMax - bounds.yMin + 2 * wiggle;
    const wall = 1.2;
    const rPer = 4;

    // Build pocket preserve
    const pocket1 = offset(
      selectCorners(
        drawPolysides(radius, 5).transform(
          new TransformationMatrix().translate(
            -bounds.xMin + wall + wiggle,
            -bounds.yMin + wall + wiggle,
          ),
        ),
      ).fillet(2),
      wiggle,
    );
    const pocketPreserve1 = offset(pocket1, wall);

    // Build tray bounds and frame
    const pocketBounds1 = drawRectDiagram(
      roundNumber(width + 2 * wall),
      roundNumber(depth + 2 * wall),
      { x: -wall, y: -wall },
    ).transform(new TransformationMatrix().translate(wall, wall));

    let trayBounds = fuseAllDiagrams([pocketBounds1]);
    trayBounds = selectCorners(trayBounds).chamfer(rPer);
    const perimeterPreserve = cut(trayBounds, offset(trayBounds, -wall));
    const preserve = fuseAllDiagrams([perimeterPreserve, pocketPreserve1]);

    // Build and mask hex grid
    const hexBounds = drawRectDiagram(width, depth).transform(
      new TransformationMatrix().translate(wall, wall),
    );
    const reduce = hexGrid(8, 1.2, width, depth).transform(
      new TransformationMatrix().translate(width / 2 + wall, depth / 2 + wall),
    );
    const maskedReduce = intersect(reduce, hexBounds);

    // Cut hex grid by preserve
    const resultFigures = cutFiguresLists(
      maskedReduce.figures,
      preserve.figures,
    );

    // Validate: no result figure should have its interior inside the preserve
    const pf = preserve.figures[0];
    for (let figIdx = 0; figIdx < resultFigures.length; figIdx++) {
      const fig = resultFigures[figIdx];
      // Approximate centroid from contour vertices
      const verts = fig.contour.segments.map((s) => s.firstPoint);
      const cx = verts.reduce((a, v) => a + v[0], 0) / verts.length;
      const cy = verts.reduce((a, v) => a + v[1], 0) / verts.length;
      const centroid: Vector = [cx, cy];
      const insideContour = pf.contour.contains(centroid);
      const insideAnyHole = pf.holes.some((h) => h.contains(centroid));
      expect(
        insideContour && !insideAnyHole,
        `Figure ${figIdx} centroid [${cx.toFixed(1)},${cy.toFixed(1)}] is inside the preserve`,
      ).toBe(false);
    }
  });
});
