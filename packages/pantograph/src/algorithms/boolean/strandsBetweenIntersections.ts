import { Vector } from "../../definitions";
import { Segment } from "../../models/segments/Segment";
import { Strand } from "../../models/Strand";
import { sameVector } from "../../vectorOperations";

export function* strandsBetweenIntersections(
  segments: Segment[],
  allIntersections: Vector[],
  allCommonSegments: Segment[],
): Generator<Strand> {
  const endsAtIntersection = (segment: Segment) => {
    return allIntersections.some((intersection) => {
      return sameVector(intersection, segment.lastPoint);
    });
  };

  const isSegmentWithinCommonSegment = (
    segment: Segment,
    commonSegment: Segment,
  ) => {
    if (segment.segmentType !== commonSegment.segmentType) return false;
    if (!commonSegment.isOnSegment(segment.firstPoint)) return false;
    if (!commonSegment.isOnSegment(segment.lastPoint)) return false;
    if (segment.segmentType !== "LINE") {
      return commonSegment.isOnSegment(segment.midPoint);
    }
    return true;
  };

  const isCommonSegment = (segment: Segment) => {
    return allCommonSegments.some((commonSegment) => {
      return (
        segment.isSame(commonSegment) ||
        isSegmentWithinCommonSegment(segment, commonSegment)
      );
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
