import { Vector } from "../definitions";
import { Line } from "../models/segments/Line";
import { tangentArc } from "../models/segments/Arc";
import type { Segment } from "../models/segments/Segment";
import {
  add,
  crossProduct,
  perpendicular,
  perpendicularClockwise,
  scalarMultiply,
} from "../vectorOperations";
import { findIntersections } from "./intersections";
import { DegenerateSegment, offsetSegment } from "./offsets/offsetSegment";
import { exportJSON } from "../main";

function removeCorner(
  firstSegment: Segment,
  secondSegment: Segment,
  radius: number
) {
  const sinAngle = crossProduct(
    firstSegment.tangentAtLastPoint,
    secondSegment.tangentAtFirstPoint
  );

  // This cover the case when the segments are colinear
  if (Math.abs(sinAngle) < 1e-10) return null;

  const orientationCorrection = sinAngle > 0 ? 1 : -1;
  const offset = Math.abs(radius) * orientationCorrection;

  const firstOffset = offsetSegment(firstSegment, offset);
  const secondOffset = offsetSegment(secondSegment, offset);

  if (
    firstOffset instanceof DegenerateSegment ||
    secondOffset instanceof DegenerateSegment
  ) {
    return null;
  }

  let potentialCenter: Vector | undefined;
  try {
    const intersections = findIntersections(firstOffset, secondOffset, 1e-9);

    // We need to work on the case where there are more than one intersections
    potentialCenter = intersections.at(-1);
  } catch (e) {
    return null;
  }

  if (!potentialCenter) {
    return null;
  }
  const center = potentialCenter;

  const splitForFillet = (segment: Segment, offsetSegment: Segment) => {
    const tgt = offsetSegment.tangentAt(center);
    const normal = perpendicularClockwise(tgt);
    const splitPoint = add(center, scalarMultiply(normal, offset));
    return segment.splitAt(splitPoint);
  };

  const [first] = splitForFillet(firstSegment, firstOffset);
  const [, second] = splitForFillet(secondSegment, secondOffset);

  return { first, second, center };
}

export function filletSegments(
  firstSegment: Segment,
  secondSegment: Segment,
  radius: number
) {
  const cornerRemoved = removeCorner(firstSegment, secondSegment, radius);
  if (!cornerRemoved) {
    console.warn(
      "Cannot fillet between segments",
      firstSegment.repr,
      secondSegment.repr
    );
    return [firstSegment, secondSegment];
  }

  const { first, second } = cornerRemoved;

  return [
    first,
    tangentArc(first.lastPoint, second.firstPoint, first.tangentAtLastPoint),
    second,
  ];
}

export function chamferSegments(
  firstSegment: Segment,
  secondSegment: Segment,
  radius: number
) {
  const cornerRemoved = removeCorner(firstSegment, secondSegment, radius);
  if (!cornerRemoved) {
    console.warn(
      "Cannot chamfer between segments",
      firstSegment.repr,
      secondSegment.repr
    );
    return [firstSegment, secondSegment];
  }

  const { first, second } = cornerRemoved;

  return [first, new Line(first.lastPoint, second.firstPoint), second];
}
