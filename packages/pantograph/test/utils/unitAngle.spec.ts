import { describe, it, expect } from "vitest";
import { unitAngle } from "../../src/utils/unitAngle";

const DEG2RAD = Math.PI / 180;

describe("unitAngle", () => {
  it("handles the case where angle is less than 0", () => {
    expect(unitAngle(-45 * DEG2RAD)).toEqual(315 * DEG2RAD);
  });

  it("handles the case where angle is greater than 2 * Math.PI", () => {
    expect(unitAngle(405 * DEG2RAD)).toEqual(45 * DEG2RAD);
  });

  it("handles the case where angle is between 0 and 2 * Math.PI", () => {
    expect(unitAngle(45 * DEG2RAD)).toEqual(45 * DEG2RAD);
  });

  it("handles the case where angle is 0", () => {
    expect(unitAngle(0)).toEqual(0);
  });

  it("handles the case where angle is 2 * Math.PI", () => {
    expect(unitAngle(2 * Math.PI)).toEqual(0);
  });
});
