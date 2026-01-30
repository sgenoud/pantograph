import { Line } from "../../models/segments/Line.js";
import { Arc } from "../../models/segments/Arc.js";
import { lineLineDistance } from "./lineLineDistance.js";
import { lineArcDistance } from "./lineArcDistance.js";
import { arcArcDistance } from "./arcArcDistance.js";
import type { Segment } from "../../models/segments/Segment.js";
import { genericDistance } from "./genericDistance.js";

export function distance(segment1: Segment, segment2: Segment): number {
  if (Line.isInstance(segment1) && Line.isInstance(segment2)) {
    return lineLineDistance(segment1, segment2);
  }

  if (Line.isInstance(segment1) && Arc.isInstance(segment2)) {
    return lineArcDistance(segment1, segment2);
  }

  if (Arc.isInstance(segment1) && Line.isInstance(segment2)) {
    return lineArcDistance(segment2, segment1);
  }

  if (Arc.isInstance(segment1) && Arc.isInstance(segment2)) {
    return arcArcDistance(segment1, segment2);
  }

  return genericDistance(segment1, segment2);
}
