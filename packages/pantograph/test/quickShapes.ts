import type { Vector } from "../src/definitions";
import { Loop } from "../src/models/Loop";
import { Line } from "../src/models/segments/Line";
import { TransformationMatrix } from "../src/models/TransformationMatrix";
import zip from "../src/utils/zip";
import { sameVector } from "../src/vectorOperations";

export const rect = (width: number, height: number) =>
  new Loop([
    new Line([width / 2, height / 2], [-width / 2, height / 2]),
    new Line([-width / 2, height / 2], [-width / 2, -height / 2]),
    new Line([-width / 2, -height / 2], [width / 2, -height / 2]),
    new Line([width / 2, -height / 2], [width / 2, height / 2]),
  ]);

export const polygon = (sortedPoints: Vector[]) => {
  const shape = linesFromPoints(sortedPoints);
  if (!sameVector(sortedPoints[0], sortedPoints[sortedPoints.length - 1])) {
    shape.push(
      new Line(sortedPoints[sortedPoints.length - 1], sortedPoints[0]),
    );
  }
  return new Loop(shape);
};

export function linesFromPoints(points: Vector[]) {
  return zip([points, points.slice(1)]).map(([a, b]) => new Line(a, b));
}

export const translation = ({
  x = 0,
  y = 0,
}: { x?: number; y?: number } = {}) =>
  new TransformationMatrix().translate(x, y);

export const rotation = (angle: number) =>
  new TransformationMatrix().rotate(angle * (Math.PI / 180));

export const radRotation = (radAngle: number) =>
  new TransformationMatrix().rotate(radAngle);
