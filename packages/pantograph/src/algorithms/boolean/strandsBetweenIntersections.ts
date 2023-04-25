import { Vector } from "../../definitions";
import { Segment } from "../../models/segments/Segment";
import { Strand } from "../../models/Strand";
import { sameVector } from "../../vectorOperations";

export function* strandsBetweenIntersections(
  segments: Segment[],
  allIntersections: Vector[],
  allCommonSegments: Segment[]
): Generator<Strand> {
  const endsAtIntersection = (segment: Segment) => {
    return allIntersections.some((intersection) => {
      return sameVector(intersection, segment.lastPoint);
    });
  };

  const isCommonSegment = (commonSegment: Segment) => {
    return allCommonSegments.some((segment) => {
      return commonSegment.isSame(segment);
    });
  };

  let currentCurves: Segment[] = [];
  for (const segment of segments) {
    // We ignore the checks at strand creation as these strands are part of
    // a loop and can be trusted to be valid
    if (endsAtIntersection(segment)) {
      currentCurves.push(segment);
      yield new Strand(currentCurves, { ignoreChecks: true });
      currentCurves = [];
    } else if (isCommonSegment(segment)) {
      if (currentCurves.length) {
        yield new Strand(currentCurves, { ignoreChecks: true });
        currentCurves = [];
      }
      yield new Strand([segment], { ignoreChecks: true });
    } else {
      currentCurves.push(segment);
    }
  }
  if (currentCurves.length) {
    yield new Strand(currentCurves, { ignoreChecks: true });
  }
}
