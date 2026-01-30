import { Vector } from "../definitions.js";

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const TRANSFORMATION_MATRIX_INSTANCE = Symbol.for(
  "pantograph:TransformationMatrix",
);

const matMult = (m1: Matrix, m2: Matrix): Matrix => {
  const [a, b, c, d, e, f, g, h, i] = m1;
  const [j, k, l, m, n, o, p, q, r] = m2;
  return [
    a * j + b * m + c * p,
    a * k + b * n + c * q,
    a * l + b * o + c * r,
    d * j + e * m + f * p,
    d * k + e * n + f * q,
    d * l + e * o + f * r,
    g * j + h * m + i * p,
    g * k + h * n + i * q,
    g * l + h * o + i * r,
  ];
};

const inverse = (m: Matrix): Matrix => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [
    (e * i - f * h) / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    (f * g - d * i) / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    (d * h - e * g) / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
};

const transpose = (m: Matrix): Matrix => {
  const [a, b, c, d, e, f, g, h, i] = m;
  return [a, d, g, b, e, h, c, f, i];
};

export class TransformationMatrix {
  static isInstance(value: unknown): value is TransformationMatrix {
    return (
      !!value &&
      (value as { [TRANSFORMATION_MATRIX_INSTANCE]?: boolean })[
        TRANSFORMATION_MATRIX_INSTANCE
      ] === true
    );
  }

  private _matrix: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  constructor(matrix?: Matrix) {
    Object.defineProperty(this, TRANSFORMATION_MATRIX_INSTANCE, {
      value: true,
    });
    if (matrix) this._matrix = [...matrix];
  }

  clone(): TransformationMatrix {
    return new TransformationMatrix(this._matrix);
  }

  transpose(): TransformationMatrix {
    this._matrix = transpose(this._matrix);
    return this;
  }

  inverse(): TransformationMatrix {
    this._matrix = inverse(this._matrix);
    return this;
  }

  translate(x: number, y: number): TransformationMatrix {
    this._matrix = matMult([1, 0, x, 0, 1, y, 0, 0, 1], this._matrix);
    return this;
  }

  rotate(angle: number, center?: Vector): TransformationMatrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotationMatrix: Matrix = [cos, -sin, 0, sin, cos, 0, 0, 0, 1];

    if (center) this.translate(-center[0], -center[1]);
    this._matrix = matMult(rotationMatrix, this._matrix);
    if (center) this.translate(center[0], center[1]);

    return this;
  }

  mirrorX(): TransformationMatrix {
    this._matrix = matMult([1, 0, 0, 0, -1, 0, 0, 0, 1], this._matrix);
    return this;
  }

  mirrorY(): TransformationMatrix {
    this._matrix = matMult([-1, 0, 0, 0, 1, 0, 0, 0, 1], this._matrix);
    return this;
  }

  mirrorLine(normal: Vector, point?: Vector): TransformationMatrix {
    const [a, b] = normal;

    const angle = Math.atan2(b, a);

    if (point) this.translate(-point[0], -point[1]);
    this.rotate(-angle);
    this.mirrorX();
    this.rotate(angle);
    if (point) this.translate(point[0], point[1]);
    return this;
  }

  mirrorCenter(center?: Vector): TransformationMatrix {
    if (center) this.translate(-center[0], -center[1]);
    this._matrix = matMult([-1, 0, 0, 0, -1, 0, 0, 0, 1], this._matrix);
    if (center) this.translate(center[0], center[1]);
    return this;
  }

  scale(scalar: number, center?: Vector): TransformationMatrix {
    if (center) this.translate(-center[0], -center[1]);
    this._matrix = matMult([scalar, 0, 0, 0, scalar, 0, 0, 0, 1], this._matrix);
    if (center) this.translate(center[0], center[1]);

    return this;
  }

  transform(point: Vector): Vector {
    const [x, y] = point;
    const [a, b, c, d, e, f] = this._matrix;
    return [a * x + b * y + c, d * x + e * y + f];
  }

  transformAngle(angle: number): number {
    const [a, b] = this.transform([Math.cos(angle), Math.sin(angle)]);
    const [originA, originB] = this.transform([0, 0]);
    return Math.atan2(b - originB, a - originA);
  }

  keepsOrientation(): boolean {
    const [a, , , , e] = this._matrix;
    return a * e > 0;
  }

  scaleFactor(): number {
    const [a, , , d] = this._matrix;
    return Math.sqrt(a * a + d * d);
  }
}
