import { describe, it, expect } from "vitest";

import {
  DegenerateSegment,
  offsetArc,
  offsetLine,
} from "../../../src/algorithms/offsets/offsetSegment";
import { Arc, tangentArc } from "../../../src/models/segments/Arc";
import { Line } from "../../../src/models/segments/Line";
import { distance } from "../../../src/vectorOperations";
import { debugImg } from "../../debug";

describe("offsetSegments", () => {
  describe("offsetLine", () => {
    it("offsets a vertical line and its reverse", () => {
      const line = new Line([0, -1], [0, 1]);
      const offset = offsetLine(line, 0.5);

      expect(offset.firstPoint).toEqual([-0.5, -1]);
      expect(offset.lastPoint).toEqual([-0.5, 1]);

      const offset2 = offsetLine(line.reverse(), 0.5);

      expect(offset2.firstPoint).toEqual([0.5, 1]);
      expect(offset2.lastPoint).toEqual([0.5, -1]);
    });

    it("offsets an horizontal line and its reverse", () => {
      const line = new Line([-1, 0], [1, 0]);
      const offset = offsetLine(line, 0.5);

      expect(offset.firstPoint).toEqual([-1, 0.5]);
      expect(offset.lastPoint).toEqual([1, 0.5]);

      const offset2 = offsetLine(line.reverse(), 0.5);

      expect(offset2.firstPoint).toEqual([1, -0.5]);
      expect(offset2.lastPoint).toEqual([-1, -0.5]);
    });

    it("offsets an angled line and its reverse", () => {
      const line = new Line([-1, 2], [1, 3]);
      const offset = offsetLine(line, 1);

      expect(distance(offset.firstPoint, line.firstPoint)).toBeCloseTo(1);
      expect(distance(offset.lastPoint, line.lastPoint)).toBeCloseTo(1);

      const line2 = line.reverse();
      const offset2 = offsetLine(line2, 1.5);

      expect(distance(offset2.firstPoint, line2.firstPoint)).toBeCloseTo(1.5);
      expect(distance(offset2.lastPoint, line2.lastPoint)).toBeCloseTo(1.5);

      expect(distance(offset2.firstPoint, offset.lastPoint)).toBeCloseTo(2.5);
      expect(distance(offset2.lastPoint, offset.firstPoint)).toBeCloseTo(2.5);
    });
  });

  describe("offsetArc", () => {
    it("offsets a counter clockwise arc", () => {
      const arc = new Arc([0, -1], [0, 1], [0, 0]).rotate(5);
      const offset = offsetArc(arc, 0.5) as Arc;

      expect(offset.center).toEqual(arc.center);
      expect(offset.radius).toEqual(arc.radius - 0.5);

      expect(offset.firstAngle).toEqual(arc.firstAngle);
      expect(offset.lastAngle).toEqual(arc.lastAngle);

      expect(offsetArc(arc, -0.5).radius).toBeCloseTo(arc.radius + 0.5);
    });

    it("offsets a clockwise arc", () => {
      const arc = new Arc([0, -1], [0, 1], [0, 0]).reverse().rotate(5);
      const offset = offsetArc(arc, 0.5) as Arc;

      expect(offset.center).toEqual(arc.center);
      expect(offset.radius).toEqual(arc.radius + 0.5);

      expect(offset.firstAngle).toEqual(arc.firstAngle);
      expect(offset.lastAngle).toEqual(arc.lastAngle);

      expect(offsetArc(arc, -0.5).radius).toBeCloseTo(arc.radius - 0.5);
    });

    it("returns the degenerate case", () => {
      const arc = new Arc([0, 1], [1, 0], [0, 0]);
      const offset = offsetArc(arc, 1.5) as Line;

      debugImg([arc, new Line(offset.firstPoint, offset.lastPoint)]);

      expect(offset).toBeInstanceOf(DegenerateSegment);

      expect(offset.firstPoint).toBeVector([0, -0.5]);
      expect(offset.lastPoint).toBeVector([-0.5, 0]);
    });
  });
});
