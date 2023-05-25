import { describe, it, expect } from "vitest";

import { lineArcIntersection } from "../../../src/algorithms/intersections/lineArcIntersection";
import { Line } from "../../../src/models/segments/Line";
import { Arc } from "../../../src/models/segments/Arc";

describe("lineArcIntersections", () => {
  it("should return the intersection point of a line and an arc", () => {
    const line = new Line([-1, -1], [1, 1]);
    const arc = new Arc([-1, 1], [1, -1], [-1, -1], true);

    const intersections = lineArcIntersection(line, arc);
    expect(intersections.length).toBe(1);

    const d = Math.sqrt(2) - 1;
    expect(intersections[0]).toBeVector([d, d]);
  });

  it("should return multiple intersections of a line and an arc", () => {
    const line = new Line([-5, -5], [1, 1]);
    const arc = new Arc([-1, 1], [-3, -1], [-1, -1], true);

    const intersections = lineArcIntersection(line, arc);
    expect(intersections.length).toBe(2);

    const d1 = Math.sqrt(2) - 1;
    const d2 = -1 - Math.sqrt(2);
    expect(intersections[0]).toBeVector([d1, d1]);
    expect(intersections[1]).toBeVector([d2, d2]);
  });

  describe("should return the intersection point of a line and an arc when the line does not go through the center", () => {
    it("finds the intersection point when the line is under the center", () => {
      const line = new Line([-1, -1], [1, 1]).translateX(0.5);
      const arc = new Arc([-1, 1], [1, -1], [-1, -1], true);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(1);
      expect(arc.isOnSegment(intersections[0])).toBe(true);
      expect(line.isOnSegment(intersections[0])).toBe(true);
    });

    it("finds the intersection point when the line is above the center", () => {
      const line = new Line([-1, -1], [1, 1]).translateX(-0.5);
      const arc = new Arc([-1, 1], [1, -1], [-1, -1], true);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(1);
      expect(arc.isOnSegment(intersections[0])).toBe(true);
      expect(line.isOnSegment(intersections[0])).toBe(true);
    });

    it("finds the intersection point when the line crosses the full circle twice", () => {
      const line = new Line([-5, -5], [1, 1]).translateX(0.5);
      const arc = new Arc([-1, 1], [1, -1], [-1, -1], true);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(1);
      expect(arc.isOnSegment(intersections[0])).toBe(true);
      expect(line.isOnSegment(intersections[0])).toBe(true);
    });

    it("finds the intersection point when the circle crosses the full line twice", () => {
      const line = new Line([-1, -1], [1, 1]).translateX(0.5);
      const arc = new Arc([-1, 1], [-3, -1], [-1, -1], true);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(1);
      expect(arc.isOnSegment(intersections[0])).toBe(true);
      expect(line.isOnSegment(intersections[0])).toBe(true);
    });

    it("finds the two intersection points when it has two", () => {
      const line = new Line([-4, -4], [1, 1]).translateX(0.5);
      const arc = new Arc([-1, 1], [-3, -1], [-1, -1], true);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(2);
      expect(arc.isOnSegment(intersections[0])).toBe(true);
      expect(line.isOnSegment(intersections[0])).toBe(true);
      expect(arc.isOnSegment(intersections[1])).toBe(true);
      expect(line.isOnSegment(intersections[1])).toBe(true);
    });

    it("finds no intersection when the line crosses outside of the arc", () => {
      const line = new Line([-1, -1], [1, 1]).translateX(0.5);
      const arc = new Arc([-1, 1], [1, -1], [-1, -1], false);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(0);
    });
  });

  describe("should handle tangent lines to the arc", () => {
    it("works in an exact case", () => {
      const line = new Line([-1, -1], [1, 1]);
      const arc = new Arc([-1, 1], [1, 1], [0, 1], false)
        .rotate(45)
        .translate(0.5, 0.5);

      const intersections = lineArcIntersection(line, arc);
      expect(intersections.length).toBe(1);
      expect(intersections[0]).toBeVector([0.5, 0.5]);
    });

    it("works in the very close case", () => {
      const line = new Line([-1, -1], [1, 1]);
      const arc1 = new Arc([-1, 1], [1, 1], [0, 1], false)
        .rotate(45)
        .translate(0.5 + line.precision / 10, 0.5);

      const intersections1 = lineArcIntersection(line, arc1);
      expect(intersections1.length).toBe(1);
      expect(intersections1[0]).toBeVector([0.5 + line.precision / 10, 0.5]);

      const arc2 = arc1.translateX(-line.precision / 5);

      const intersections2 = lineArcIntersection(line, arc2);
      expect(intersections2.length).toBe(1);
      expect(intersections2[0]).toBeVector([0.5 - line.precision / 10, 0.5]);
    });
  });

  it("should return nothing when there is not intersection", () => {
    const line = new Line([-5, -5], [1, 1]);
    const arc = new Arc([3, 2], [2, 3], [3, 3], true);

    const intersections = lineArcIntersection(line, arc);
    expect(intersections.length).toBe(0);
  });
});
