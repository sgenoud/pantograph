import type { Loop } from "../../models/Loop";
import { jsonSegment } from "./jsonSegment";

export function jsonLoop(loop: Loop) {
  return {
    type: "LOOP",
    segments: loop.segments.map(jsonSegment),
  };
}
