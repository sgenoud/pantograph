import { describe, it, expect } from "vitest";

import { TransformationMatrix } from "../../src/models/TransformationMatrix";

describe("TransformationMatrix", () => {
  describe("translations", () => {
    it("does basic translations correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.translate(1, 2);

      expect(matrix.transform([0, 0])).toBeVector([1, 2]);
      expect(matrix.transform([1, 2])).toBeVector([2, 4]);
      expect(matrix.transform([2, 4])).toBeVector([3, 6]);
    });
  });

  describe("scaling", () => {
    it("does basic scaling correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.scale(2, [0, 0]);

      expect(matrix.transform([0, 0])).toBeVector([0, 0]);
      expect(matrix.transform([1, 2])).toBeVector([2, 4]);
      expect(matrix.transform([2, 4])).toBeVector([4, 8]);
    });

    it("does scaling around a point correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.scale(2, [1, 1]);

      expect(matrix.transform([0, 0])).toBeVector([-1, -1]);
      expect(matrix.transform([1, 2])).toBeVector([1, 3]);
      expect(matrix.transform([2, 4])).toBeVector([3, 7]);
    });
  });

  describe("rotations", () => {
    it("does basic rotations correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.rotate(Math.PI / 2, [0, 0]);

      expect(matrix.transform([0, 0])).toBeVector([0, 0]);
      expect(matrix.transform([1, 0])).toBeVector([0, 1]);
      expect(matrix.transform([0, 1])).toBeVector([-1, 0]);
    });

    it("does rotations around a specific point correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.rotate(Math.PI / 2, [1, 1]);

      expect(matrix.transform([1, 1])).toBeVector([1, 1]);
      expect(matrix.transform([2, 1])).toBeVector([1, 2]);
      expect(matrix.transform([1, 2])).toBeVector([0, 1]);
    });
  });

  describe("mirror", () => {
    it("does basic x mirroring correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.mirrorX();

      expect(matrix.transform([0, 0])).toBeVector([0, 0]);
      expect(matrix.transform([3, -1])).toBeVector([3, 1]);
      expect(matrix.transform([2, 12])).toBeVector([2, -12]);
    });

    it("does basic y mirroring correctly", () => {
      const matrix = new TransformationMatrix();
      matrix.mirrorY();

      expect(matrix.transform([0, 0])).toBeVector([0, 0]);
      expect(matrix.transform([1, 0])).toBeVector([-1, 0]);
      expect(matrix.transform([-2, 0])).toBeVector([2, 0]);
    });
  });
});
