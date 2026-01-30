import { describe, it, expect } from "vitest";

import { tesselateSegment } from "../../../src/algorithms/tesselate/tesselateSegment";
import { Strand } from "../../../src/models/Strand";
import { Line } from "../../../src/models/segments/Line";
import { Arc } from "../../../src/models/segments/Arc";
import { CubicBezier } from "../../../src/models/segments/CubicBezier";
//import { debugImg, dpnt } from "../../debug";
import { linesFromPoints } from "../../quickShapes";

describe("tesselateSegment", () => {
  it("returns endpoints for a line", () => {
    const line = new Line([0, 0], [10, 0]);
    const points = tesselateSegment(line, { maxAngle: Math.PI / 180 });

    expect(points.length).toBe(2);
    expect(points[0]).toBeVector(line.firstPoint);
    expect(points[1]).toBeVector(line.lastPoint);
    points.forEach((point) => {
      expect(line.isOnSegment(point)).toBe(true);
    });
  });

  it("subdivides an arc when tolerance is tight", () => {
    const arc = new Arc([1, 0], [0, 1], [0, 0], false);
    const loose = tesselateSegment(arc, { maxAngle: Math.PI });
    const tight = tesselateSegment(arc, { maxAngle: Math.PI / 90 });

    expect(loose.length).toBe(2);
    expect(tight.length).toBeGreaterThan(2);
    tight.forEach((point) => {
      expect(arc.isOnSegment(point)).toBe(true);
    });
    expect(tight).toMatchSnapshot();

    const polyline = new Strand(linesFromPoints(tight), { ignoreChecks: true });
    /*
    debugImg(
      [
        { shape: arc, color: "blue" },
        { shape: polyline, color: "red" },
        ...tight.map((point) => dpnt(point)),
      ],
      "tesselate-arc-tight",
    );
    */
  });

  it("uses tighter angular tolerance to increase samples on a curve", () => {
    const curve = new CubicBezier([0, 0], [0, 1], [1, 1], [1, 0]);
    const loose = tesselateSegment(curve, { maxAngle: Math.PI / 9 });
    const tight = tesselateSegment(curve, { maxAngle: Math.PI / 72 });

    expect(loose[0]).toBeVector(curve.firstPoint);
    expect(loose[loose.length - 1]).toBeVector(curve.lastPoint);
    expect(tight[0]).toBeVector(curve.firstPoint);
    expect(tight[tight.length - 1]).toBeVector(curve.lastPoint);
    expect(tight.length).toBeGreaterThan(loose.length);
    expect(tight).toMatchSnapshot();

    const polyline = new Strand(linesFromPoints(tight), { ignoreChecks: true });
    /*
    debugImg(
      [
        { shape: curve, color: "blue" },
        { shape: polyline, color: "red" },
        ...tight.map((point) => dpnt(point, 0.025)),
      ],
      "tesselate-cubic-tight",
    );
    */
  });
});
