import { Vector } from "../definitions.js";

function overlap1D(
  min1: number,
  max1: number,
  min2: number,
  max2: number,
): boolean {
  return min1 <= max2 && max1 >= min2;
}

export class BoundingBox {
  readonly xMin: number;
  readonly yMin: number;

  readonly xMax: number;
  readonly yMax: number;

  constructor(
    xMin = Infinity,
    yMin = Infinity,
    xMax = -Infinity,
    yMax = -Infinity,
  ) {
    this.xMin = xMin;
    this.yMin = yMin;
    this.xMax = xMax;
    this.yMax = yMax;
  }

  get width(): number {
    return this.xMax - this.xMin;
  }

  get height(): number {
    return this.yMax - this.yMin;
  }

  get center(): Vector {
    return [(this.xMin + this.xMax) / 2, (this.yMin + this.yMax) / 2];
  }

  grow(amount: number): BoundingBox {
    return new BoundingBox(
      this.xMin - amount,
      this.yMin - amount,
      this.xMax + amount,
      this.yMax + amount,
    );
  }

  contains(point: Vector): boolean {
    const [x, y] = point;
    return (
      overlap1D(this.xMin, this.xMax, x, x) &&
      overlap1D(this.yMin, this.yMax, y, y)
    );
  }

  overlaps(other: BoundingBox): boolean {
    return (
      overlap1D(this.xMin, this.xMax, other.xMin, other.xMax) &&
      overlap1D(this.yMin, this.yMax, other.yMin, other.yMax)
    );
  }

  addPoint(point: Vector): BoundingBox {
    const [x, y] = point;
    return new BoundingBox(
      Math.min(this.xMin, x),
      Math.min(this.yMin, y),

      Math.max(this.xMax, x),
      Math.max(this.yMax, y),
    );
  }

  merge(other: BoundingBox): BoundingBox {
    return new BoundingBox(
      Math.min(this.xMin, other.xMin),
      Math.min(this.yMin, other.yMin),
      Math.max(this.xMax, other.xMax),
      Math.max(this.yMax, other.yMax),
    );
  }

  intersection(other: BoundingBox): BoundingBox {
    return new BoundingBox(
      Math.max(this.xMin, other.xMin),
      Math.max(this.yMin, other.yMin),
      Math.min(this.xMax, other.xMax),
      Math.min(this.yMax, other.yMax),
    );
  }
}

export function pointsBoundingBox(points: Vector[]): BoundingBox {
  return points.reduce((box, point) => box.addPoint(point), new BoundingBox());
}
