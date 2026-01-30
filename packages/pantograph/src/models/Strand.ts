import { AbstractStroke } from "./Stroke.js";

import { TransformationMatrix } from "./TransformationMatrix.js";
import { sameVector } from "../vectorOperations.js";
import { simplifySegments } from "../algorithms/simplify.js";
import type { Segment } from "./segments/Segment.js";

const STRAND_INSTANCE = Symbol.for("pantograph:Strand");

export class Strand extends AbstractStroke<Strand> {
  strokeType = "STRAND";

  static isInstance(value: unknown): value is Strand {
    return (
      !!value &&
      (value as { [STRAND_INSTANCE]?: boolean })[STRAND_INSTANCE] === true
    );
  }

  constructor(segments: Segment[], { ignoreChecks = false } = {}) {
    super(segments, { ignoreChecks });
    Object.defineProperty(this, STRAND_INSTANCE, { value: true });
  }
  reverse(): Strand {
    const reversedSegments = this.segments.map((segment) => segment.reverse());
    reversedSegments.reverse();
    return new Strand(reversedSegments, { ignoreChecks: true });
  }

  clone(): Strand {
    return new Strand(
      this.segments.map((segment) => segment.clone()),
      { ignoreChecks: true },
    );
  }

  extend(strand: Strand): Strand {
    if (!sameVector(this.lastPoint, strand.firstPoint)) {
      console.error(this.repr, strand.repr);
      throw new Error("Cannot extend strand: connection point is not the same");
    }
    return new Strand([...this.segments, ...strand.segments]);
  }

  simplify(): Strand {
    const newSegments = simplifySegments(this);
    if (!newSegments) return this;
    return new Strand(newSegments, { ignoreChecks: true });
  }

  transform(matrix: TransformationMatrix): Strand {
    return new Strand(
      this.segments.map((segment) => segment.transform(matrix)),
      { ignoreChecks: true },
    );
  }
}
