import { Arc } from "../Arc.js";
import { CubicBezier } from "../CubicBezier.js";
import { EllipseArc } from "../EllipseArc.js";
import { Line } from "../Line.js";
import { QuadraticBezier } from "../QuadraticBezier.js";
import { Segment } from "../Segment.js";

export const ALL_SEGMENT_CLASSES = [
  Line,
  Arc,
  EllipseArc,
  QuadraticBezier,
  CubicBezier,
];

export function isSegment(s: unknown): s is Segment {
  return ALL_SEGMENT_CLASSES.some((cls) => cls.isInstance(s));
}
