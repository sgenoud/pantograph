import { describe, it, expect } from "vitest";

import { arcArcIntersection } from "../../../src/algorithms/intersections/arcArcIntersection";
import type { Vector } from "../../../src/definitions";
import { Arc } from "../../../src/models/segments/Arc";

const halfCircle = (radius: number, left = true) =>
  new Arc([0, radius], [0, -radius], [0, 0], !left);

const quarterCircle = (radius: number) =>
  new Arc([0, radius], [radius, 0], [0, 0], true);

const threeQuarterCircle = (radius: number) =>
  new Arc([0, radius], [-radius, 0], [0, 0], true);

describe("arcArcIntersections", () => {
  it("should return the intersection point of two arcs", () => {
    const arc1 = halfCircle(3).translateX(-1);
    const arc2 = halfCircle(4).translateX(1);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(2);

    expect(arc1.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc1.isOnSegment(intersections[1] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[1] as Vector)).toBe(true);
  });

  it("should return the intersection point of two arcs with opposite orientation", () => {
    const arc1 = halfCircle(3, false).translateX(-1);
    const arc2 = halfCircle(4).translateX(2);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(2);

    expect(arc1.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc1.isOnSegment(intersections[1] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[1] as Vector)).toBe(true);
  });

  it("should return the intersection point if there is only one", () => {
    const arc1 = halfCircle(3, false).translateX(-1);
    const arc2 = halfCircle(4).translate(2, 3);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(1);

    expect(arc1.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[0] as Vector)).toBe(true);
  });

  it("should return the intersection point if the circles are tangent on the outside", () => {
    const arc1 = halfCircle(3, false);
    const arc2 = halfCircle(4).translateX(7).rotate(25);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(1);

    expect(arc1.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[0] as Vector)).toBe(true);
  });

  it("should return the intersection point if the circles are tangent on the inside", () => {
    const arc1 = halfCircle(3);
    const arc2 = halfCircle(4).translateX(1).rotate(25);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(1);

    expect(arc1.isOnSegment(intersections[0] as Vector)).toBe(true);
    expect(arc2.isOnSegment(intersections[0] as Vector)).toBe(true);

    // We go with all the orientation combinations
    expect(arcArcIntersection(arc1, arc2.reverse(), false)[0]).toBeVector(
      intersections[0]
    );
    expect(arcArcIntersection(arc1.reverse(), arc2, false)[0]).toBeVector(
      intersections[0]
    );
    expect(
      arcArcIntersection(arc1.reverse(), arc2.reverse(), false)[0]
    ).toBeVector(intersections[0]);

    expect(arcArcIntersection(arc2, arc1, false)[0]).toBeVector(
      intersections[0]
    );
    expect(arcArcIntersection(arc2, arc1.reverse(), false)[0]).toBeVector(
      intersections[0]
    );
    expect(arcArcIntersection(arc2.reverse(), arc1, false)[0]).toBeVector(
      intersections[0]
    );
    expect(
      arcArcIntersection(arc2.reverse(), arc1.reverse(), false)[0]
    ).toBeVector(intersections[0]);
  });

  it("should return nothing if the circles are concentric", () => {
    const arc1 = halfCircle(3);
    const arc2 = halfCircle(1).translateX(-1);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(0);
  });

  it("should return nothing if the circles are not intersecting", () => {
    const arc1 = halfCircle(3, false);
    const arc2 = halfCircle(1).translateX(5);

    const intersections = arcArcIntersection(arc1, arc2, false);
    expect(intersections.length).toBe(0);
  });

  describe("with overlapping circles", () => {
    it("should return a simple intersection", () => {
      const arc1 = halfCircle(3, false);
      const arc2 = arc1.rotate(90);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(1);

      expect(
        (intersections[0] as Arc).isSame(new Arc([3, 0], [0, 3], [0, 0]))
      ).toBe(true);
    });

    it("should return a simple intersection with opposite orientations", () => {
      const arc1 = halfCircle(3, false);
      const arc2 = arc1.reverse().rotate(90);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(1);

      expect(
        (intersections[0] as Arc).isSame(new Arc([3, 0], [0, 3], [0, 0]))
      ).toBe(true);
    });

    it("should return no intersection for complement arcs", () => {
      const arc1 = halfCircle(3, false);
      const arc2 = arc1.reverse().rotate(180);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(0);
    });

    it("should return no intersection non overlapping arcs", () => {
      const arc1 = halfCircle(3, false);
      const arc2 = quarterCircle(3).rotate(150);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(0);
    });

    it("should return no intersection with single point overlapping arcs", () => {
      const arc1 = halfCircle(3, false);
      const arc2 = quarterCircle(3).rotate(180);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(0);
    });

    it("should return two intersection with double overlapping arcs", () => {
      const arc1 = threeQuarterCircle(3);
      const arc2 = arc1.rotate(120);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(2);
    });

    it("should return one intersection with overlapping arcs with a point", () => {
      const arc1 = threeQuarterCircle(3);
      const arc2 = halfCircle(3).rotate(-90);

      const intersections = arcArcIntersection(arc1, arc2, true);
      expect(intersections.length).toBe(1);

      const intersections2 = arcArcIntersection(arc2, arc1, true);
      expect(intersections2.length).toBe(1);
    });
  });
});
