import { describe, it, expect } from "vitest";
import { angularDistance } from "../../src/utils/angularDistance";

const DEG2RAD = Math.PI / 180;

const _45 = 45 * DEG2RAD;
const _90 = 90 * DEG2RAD;
const _135 = 135 * DEG2RAD;
const _180 = 180 * DEG2RAD;
const _225 = 225 * DEG2RAD;
const _270 = 270 * DEG2RAD;
const _315 = 315 * DEG2RAD;

describe("angularDistance", () => {
  it("handles the case where angle1 is less than angle2 in counter clockwise", () => {
    expect(angularDistance(_45, _90, false)).toEqual(_45);
    expect(angularDistance(_135, _180, false)).toEqual(_45);
    expect(angularDistance(_225, _270, false)).toEqual(_45);
  });

  it("handles the case where angle1 is greater than angle2 in counter clockwise", () => {
    expect(angularDistance(_90, _45, false)).toEqual(_315);
    expect(angularDistance(_180, _135, false)).toEqual(_315);
    expect(angularDistance(_270, _225, false)).toEqual(_315);
    expect(angularDistance(_315, 0, false)).toEqual(_45);
  });

  it("handles the case where angle2 is less than angle1 in clockwise", () => {
    expect(angularDistance(_90, _45, true)).toEqual(_45);
    expect(angularDistance(_180, _135, true)).toEqual(_45);
    expect(angularDistance(_270, _225, true)).toEqual(_45);
  });

  it("handles the case where angle2 is greater than angle1 in clockwise", () => {
    expect(angularDistance(_45, _90, true)).toEqual(_315);
    expect(angularDistance(_135, _180, true)).toEqual(_315);
    expect(angularDistance(_225, _270, true)).toEqual(_315);
    expect(angularDistance(0, _315, true)).toEqual(_45);
  });
});
