import type { EllipseArc } from "../../models/segments/EllipseArc";
import type { Arc } from "../../models/segments/Arc";
import { ellipseEllipseIntersection } from "./ellipseEllipseIntersection";

export function arcEllipseArcIntersection(arc: Arc, ellipseArc: EllipseArc) {
  const points = ellipseEllipseIntersection(arc, ellipseArc);
  return points.filter((p) => arc.isOnSegment(p) && ellipseArc.isOnSegment(p));
}
