import { Vector } from "../../src/definitions";
import { Transformable, TransformationMatrix } from "../../src/models/exports";

interface Clonable {
  clone(): this;
}

interface Translatable {
  translateTo(point: Vector): this;
}

class PointsDistribution extends Transformable<PointsDistribution> {
  constructor(public points: Vector[]) {
    super();
    this.points = points;
  }

  transform(matrix: TransformationMatrix) {
    return new PointsDistribution(this.points.map(matrix.transform));
  }

  distribute<T extends Translatable>(s: T): T[] {
    return this.points.map((p) => s.translateTo(p));
  }

  cloneDistribute<T extends Translatable & Clonable>(s: T): T[] {
    return this.points.map((p) => s.clone().translateTo(p));
  }
}

export function linearDistribution(
  totalWidth: number,
  objectWidth: number,
  gapShare = 3,
  margin = 0
) {
  if (totalWidth <= objectWidth * 2) {
    throw new Error("totalWidth must be greater than twice the objectWidth");
  }

  const objectsCount = Math.max(
    Math.floor((totalWidth - 2 * margin) / (objectWidth * (gapShare + 1))),
    2
  );
  const freeSpace = totalWidth - 2 * margin - objectsCount * objectWidth;
  const gapSize = freeSpace / (objectsCount - 1);
  const points: number[] = [];
  for (let i = 0; i < objectsCount; i++) {
    points.push(
      margin + i * (objectWidth + gapSize) - totalWidth / 2 + objectWidth / 2
    );
  }
  return new PointsDistribution(points.map((p) => [p, 0]));
}

export function linearSpread(
  gap: number,
  count: number,
  direction: "x" | "y" = "x"
) {
  const totalLength = gap * (count - 1);
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    points.push(i * gap - totalLength / 2);
  }
  return new PointsDistribution(
    points.map((p) => (direction.toLowerCase() === "x" ? [p, 0] : [0, p]))
  );
}
