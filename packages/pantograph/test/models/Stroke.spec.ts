import { describe, it, expect } from "vitest";
import {
  checkValidStroke,
  checkSelfIntersections,
} from "../../src/models/Stroke";

import { linesFromPoints } from "../quickShapes";

describe("checkValidStroke", () => {
  it("should not throw for a valid stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(() => checkValidStroke(stroke)).not.toThrow();
  });

  it("should throw for an empty stroke", () => {
    expect(() => checkValidStroke([])).toThrow();
  });

  it("should throw for a disjointed stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    stroke.splice(1, 1);
    expect(() => checkValidStroke(stroke)).toThrow();
  });
});

describe("checkSelfIntersections", () => {
  it("should not throw for a valid stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(() => checkSelfIntersections(stroke)).not.toThrow();
  });

  it("should not throw for a looped stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]);
    expect(() => checkSelfIntersections(stroke)).not.toThrow();
  });

  it("should throw for a stroke with self-intersections", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [0, 2],
      [1, 2],
      [1, 1],
      [-1, 1],
    ]);
    expect(() => checkSelfIntersections(stroke)).toThrow();
  });

  it("should throw for a stroke with self-intersections on the end of the stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [0, 2],
      [1, 2],
      [1, 1],
      [0, 1],
    ]);
    expect(() => checkSelfIntersections(stroke)).toThrow();
  });

  it("should throw for a stroke with self-intersections at the start of the stroke", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [0, 2],
      [1, 2],
      [1, 0],
      [-1, 0],
    ]);
    expect(() => checkSelfIntersections(stroke)).toThrow();
  });

  it("should throw for a stroke with self-intersections on a joint", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [-1, 1],
    ]);
    expect(() => checkSelfIntersections(stroke)).toThrow();
  });

  it("should throw for a stroke with self-intersections of a joint on a joint", () => {
    const stroke = linesFromPoints([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [0, 1],
      [-1, 1],
    ]);
    expect(() => checkSelfIntersections(stroke)).toThrow();
  });
});
