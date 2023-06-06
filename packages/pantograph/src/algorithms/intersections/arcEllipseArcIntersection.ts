import type { EllipseArc } from "../../models/segments/EllipseArc.js";
import type { Arc } from "../../models/segments/Arc.js";
import { ellipseEllipseIntersection } from "./ellipseEllipseIntersection.js";

export function arcEllipseArcIntersection(arc: Arc, ellipseArc: EllipseArc) {
  const points = ellipseEllipseIntersection(arc, ellipseArc);
  return points.filter((p) => arc.isOnSegment(p) && ellipseArc.isOnSegment(p));
}
