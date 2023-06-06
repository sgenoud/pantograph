import type { Loop } from "../../models/Loop.js";
import { jsonSegment } from "./jsonSegment.js";

export function jsonLoop(loop: Loop) {
  return {
    type: "LOOP",
    segments: loop.segments.map(jsonSegment),
  };
}
