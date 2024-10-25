import { Line } from "../../models/segments/Line.js";

import type { Vector } from "../../definitions.js";
import { Segment } from "../../models/segments/Segment.js";
import { Arc } from "../../models/segments/Arc.js";
import { CubicBezier } from "../../models/segments/CubicBezier.js";
import { lineArcIntersection } from "./lineArcIntersection.js";
import { lineLineIntersection } from "./lineLineIntersection.js";
import { arcArcIntersection } from "./arcArcIntersection.js";
import { EllipseArc } from "../../models/segments/EllipseArc.js";
import { lineEllipseArcIntersection } from "./lineEllipseArcIntersection.js";
import { arcEllipseArcIntersection } from "./arcEllipseArcIntersection.js";
import { ellipseArcEllipseArcIntersection } from "./ellipseArcEllipseArcIntersection.js";
import { lineBezierIntersection } from "./lineBezierIntersection.js";
import { arcsCubicBezierIntersection } from "./arcsCubicBezierIntersection.js";
import { QuadraticBezier } from "../../models/segments/QuadraticBezier.js";
import { arcsQuadraticBezierIntersection } from "./arcsQuadraticBezierIntersection.js";
import { bezierClip } from "./bezierClip.js";
import { cubicBezierCubicBezierIntersection } from "./cubicBezierCubicBezierIntersection.js";
import { quadraticBezierQuadraticBezierIntersection } from "./quadraticBezierQuadraticBezierIntersection.js";

export function findIntersections(
  segment1: Segment,
  segment2: Segment,
  precision?: number,
): Vector[] {
  if (segment1 instanceof Line && segment2 instanceof Line) {
    const intersection = lineLineIntersection(
      segment1,
      segment2,
      false,
      precision,
    );
    if (intersection === null) return [];
    return [intersection as Vector];
  }
  if (segment1 instanceof Line && segment2 instanceof Arc) {
    return lineArcIntersection(segment1, segment2, precision);
  }
  if (segment1 instanceof Arc && segment2 instanceof Line) {
    return lineArcIntersection(segment2, segment1, precision);
  }
  if (segment1 instanceof Arc && segment2 instanceof Arc) {
    return arcArcIntersection(segment1, segment2, false, precision) as Vector[];
  }

  throw new Error("Not implemented");
}

export function findIntersectionsAndOverlaps(
  segment1: Segment,
  segment2: Segment,
  precision?: number,
): { intersections: Vector[]; overlaps: Segment[]; count: number } {
  // If we have two lines, checks are fast enough to not use bounding boxes
  if (segment1 instanceof Line && segment2 instanceof Line) {
    const intersection = lineLineIntersection(
      segment1,
      segment2,
      true,
      precision,
    );
    if (intersection === null)
      return { intersections: [], overlaps: [], count: 0 };
    if (intersection instanceof Line)
      return { intersections: [], overlaps: [intersection], count: 1 };
    return { intersections: [intersection], overlaps: [], count: 1 };
  }

  if (!segment1.boundingBox.overlaps(segment2.boundingBox)) {
    return { intersections: [], overlaps: [], count: 0 };
  }

  if (segment1 instanceof Line && segment2 instanceof Arc) {
    const intersections = lineArcIntersection(segment1, segment2, precision);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment1 instanceof Arc && segment2 instanceof Line) {
    const intersections = lineArcIntersection(segment2, segment1, precision);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment1 instanceof Arc && segment2 instanceof Arc) {
    const intersections = arcArcIntersection(
      segment1,
      segment2,
      true,
      precision,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (intersections[0] instanceof Arc)
      return {
        intersections: [],
        overlaps: intersections as Arc[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (segment1 instanceof Line && segment2 instanceof EllipseArc) {
    const intersections = lineEllipseArcIntersection(
      segment1,
      segment2,
      precision,
    );
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment2 instanceof Line && segment1 instanceof EllipseArc) {
    const intersections = lineEllipseArcIntersection(
      segment2,
      segment1,
      precision,
    );
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment1 instanceof Arc && segment2 instanceof EllipseArc) {
    const intersections = arcEllipseArcIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment2 instanceof Arc && segment1 instanceof EllipseArc) {
    const intersections = arcEllipseArcIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment1 instanceof EllipseArc && segment2 instanceof EllipseArc) {
    const intersections = ellipseArcEllipseArcIntersection(
      segment1,
      segment2,
      true,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (intersections[0] instanceof EllipseArc)
      return {
        intersections: [],
        overlaps: intersections as EllipseArc[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (
    segment1 instanceof Line &&
    (segment2 instanceof CubicBezier || segment2 instanceof QuadraticBezier)
  ) {
    const intersections = lineBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    segment2 instanceof Line &&
    (segment1 instanceof CubicBezier || segment1 instanceof QuadraticBezier)
  ) {
    const intersections = lineBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (segment1 instanceof Arc || segment1 instanceof EllipseArc) &&
    segment2 instanceof QuadraticBezier
  ) {
    const intersections = arcsQuadraticBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (segment2 instanceof Arc || segment2 instanceof EllipseArc) &&
    segment1 instanceof QuadraticBezier
  ) {
    const intersections = arcsQuadraticBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (segment1 instanceof Arc || segment1 instanceof EllipseArc) &&
    segment2 instanceof CubicBezier
  ) {
    const intersections = arcsCubicBezierIntersection(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    (segment2 instanceof Arc || segment2 instanceof EllipseArc) &&
    segment1 instanceof CubicBezier
  ) {
    const intersections = arcsCubicBezierIntersection(segment2, segment1);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (
    segment1 instanceof QuadraticBezier &&
    segment2 instanceof QuadraticBezier
  ) {
    const intersections = quadraticBezierQuadraticBezierIntersection(
      segment1,
      segment2,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (intersections[0] instanceof QuadraticBezier)
      return {
        intersections: [],
        overlaps: intersections as QuadraticBezier[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  if (
    (segment1 instanceof QuadraticBezier && segment2 instanceof CubicBezier) ||
    (segment2 instanceof QuadraticBezier && segment1 instanceof CubicBezier)
  ) {
    const intersections = bezierClip(segment1, segment2);
    return { intersections, overlaps: [], count: intersections.length };
  }

  if (segment1 instanceof CubicBezier && segment2 instanceof CubicBezier) {
    const intersections = cubicBezierCubicBezierIntersection(
      segment1,
      segment2,
    );
    if (!intersections.length)
      return { intersections: [], overlaps: [], count: 0 };
    if (intersections[0] instanceof CubicBezier)
      return {
        intersections: [],
        overlaps: intersections as CubicBezier[],
        count: intersections.length,
      };
    return {
      intersections: intersections as Vector[],
      overlaps: [],
      count: intersections.length,
    };
  }

  throw new Error("Not implemented");
}
