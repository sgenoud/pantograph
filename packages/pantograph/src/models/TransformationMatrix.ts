import { Vector } from "../definitions";

type Matrix = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

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

export class TransformationMatrix {
  private _matrix: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  translate(x: number, y: number): TransformationMatrix {
    this._matrix = matMult(this._matrix, [1, 0, x, 0, 1, y, 0, 0, 1]);
    return this;
  }

  rotate(angle: number, center?: Vector): TransformationMatrix {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotationMatrix: Matrix = [cos, -sin, 0, sin, cos, 0, 0, 0, 1];

    if (center) this.translate(center[0], center[1]);
    this._matrix = matMult(this._matrix, rotationMatrix);
    if (center) this.translate(-center[0], -center[1]);

    return this;
  }

  mirrorX(): TransformationMatrix {
    this._matrix = matMult(this._matrix, [1, 0, 0, 0, -1, 0, 0, 0, 1]);
    return this;
  }

  mirrorY(): TransformationMatrix {
    this._matrix = matMult(this._matrix, [-1, 0, 0, 0, 1, 0, 0, 0, 1]);
    return this;
  }

  mirrorLine(normal: Vector, point?: Vector): TransformationMatrix {
    const [a, b] = normal;

    const angle = Math.atan2(b, a);

    if (point) this.translate(point[0], point[1]);
    this.rotate(angle);
    this.mirrorX();
    this.rotate(-angle);
    if (point) this.translate(-point[0], -point[1]);
    return this;
  }

  mirrorCenter(center?: Vector): TransformationMatrix {
    if (center) this.translate(center[0], center[1]);
    this._matrix = matMult(this._matrix, [-1, 0, 0, 0, -1, 0, 0, 0, 1]);
    if (center) this.translate(-center[0], -center[1]);
    return this;
  }

  scale(scalar: number, center?: Vector): TransformationMatrix {
    if (center) this.translate(center[0], center[1]);
    this._matrix = matMult(this._matrix, [scalar, 0, 0, 0, scalar, 0, 0, 0, 1]);
    if (center) this.translate(-center[0], -center[1]);

    return this;
  }

  transform(point: Vector): Vector {
    const [x, y] = point;
    const [a, b, c, d, e, f] = this._matrix;
    return [a * x + b * y + c, d * x + e * y + f];
  }

  keepsOrientation(): boolean {
    const [a, , , , e] = this._matrix;
    return a * e > 0;
  }
}
