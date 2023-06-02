import { Line } from "../../models/segments/Line";
import { Arc } from "../../models/segments/Arc";
import { lineLineDistance } from "./lineLineDistance";
import { lineArcDistance } from "./lineArcDistance";
import { arcArcDistance } from "./arcArcDistance";
import type { Segment } from "../../models/segments/Segment";
import { genericDistance } from "./genericDistance";

export function distance(segment1: Segment, segment2: Segment): number {
  if (segment1 instanceof Line && segment2 instanceof Line) {
    return lineLineDistance(segment1, segment2);
  }

  if (segment1 instanceof Line && segment2 instanceof Arc) {
    return lineArcDistance(segment1, segment2);
  }

  if (segment1 instanceof Arc && segment2 instanceof Line) {
    return lineArcDistance(segment2, segment1);
  }

  if (segment1 instanceof Arc && segment2 instanceof Arc) {
    return arcArcDistance(segment1, segment2);
  }

  return genericDistance(segment1, segment2);
}
