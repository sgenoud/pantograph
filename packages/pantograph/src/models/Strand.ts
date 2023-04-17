import { AbstractStroke } from "./Stroke";

import { TransformationMatrix } from "./TransformationMatrix";
import { sameVector } from "../vectorOperations";
import { simplifySegments } from "../algorithms/simplify";

export class Strand extends AbstractStroke<Strand> {
  strokeType = "STRAND";
  reverse(): Strand {
    const reversedSegments = this.segments.map((segment) => segment.reverse());
    reversedSegments.reverse();
    return new Strand(reversedSegments, { ignoreChecks: true });
  }

  clone(): Strand {
    return new Strand(
      this.segments.map((segment) => segment.clone()),
      { ignoreChecks: true }
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
      { ignoreChecks: true }
    );
  }
}
