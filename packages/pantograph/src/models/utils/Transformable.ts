import { Vector } from "../../definitions";
import { DEG2RAD } from "../../vectorOperations";
import { TransformationMatrix } from "../TransformationMatrix";

export abstract class Transformable<T> {
  abstract transform(matrix: TransformationMatrix): T;
  translateX(x: number): T {
    const transform = new TransformationMatrix().translate(x, 0);
    return this.transform(transform);
  }

  translateY(y: number): T {
    const transform = new TransformationMatrix().translate(0, y);
    return this.transform(transform);
  }

  translate(x: number, y: number): T {
    const transform = new TransformationMatrix().translate(x, y);
    return this.transform(transform);
  }

  translateTo([x, y]: Vector): T {
    const transform = new TransformationMatrix().translate(x, y);
    return this.transform(transform);
  }

  rotate(angle: number, center?: Vector): T {
    const transform = new TransformationMatrix().rotate(
      angle * DEG2RAD,
      center
    );
    return this.transform(transform);
  }

  scale(factor: number, center?: Vector): T {
    const transform = new TransformationMatrix().scale(factor, center);
    return this.transform(transform);
  }

  mirrorCenter(center?: Vector): T {
    const transform = new TransformationMatrix().mirrorCenter(center);
    return this.transform(transform);
  }

  mirror(axis?: "x" | "y"): T;
  mirror(direction: Vector, center?: Vector): T;
  mirror(axisOrDirection: "x" | "y" | Vector = "x", center?: Vector): T {
    const transform = new TransformationMatrix();
    if (axisOrDirection === "x") {
      transform.mirrorX();
    } else if (axisOrDirection === "y") {
      transform.mirrorY();
    } else {
      transform.mirrorLine(axisOrDirection, center);
    }
    return this.transform(transform);
  }
}
