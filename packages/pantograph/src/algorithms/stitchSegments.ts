import Flatbush from "flatbush";
import { Segment } from "../models/segments/Segment";

export function stitchSegments(
  segments: Segment[],
  precision = 1e-7
): Segment[][] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return [segments];

  // We create a spacial index of the startpoints
  const startPoints = new Flatbush(segments.length);
  segments.forEach((c) => {
    const [x, y] = c.firstPoint;
    startPoints.add(x - precision, y - precision, x + precision, y + precision);
  });
  startPoints.finish();

  const stitchedSegments: Segment[][] = [];
  const visited = new Set<number>();

  segments.forEach((segment, index) => {
    if (visited.has(index)) return;

    const connectedSegments: Segment[] = [segment];
    let currentIndex = index;

    visited.add(index);

    // Once we have started a connected segment segment, we look for the next

    let maxLoops = segments.length;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (maxLoops-- < 0) {
        throw new Error("Infinite loop detected");
      }

      const lastPoint =
        connectedSegments[connectedSegments.length - 1].lastPoint;

      const [x, y] = lastPoint;
      const neighbors = startPoints.search(
        x - precision,
        y - precision,
        x + precision,
        y + precision
      );

      const indexDistance = (otherIndex: number) =>
        Math.abs((currentIndex - otherIndex) % segments.length);
      const potentialNextSegments = neighbors
        .filter((neighborIndex) => !visited.has(neighborIndex))
        .map((neighborIndex): [Segment, number, number] => [
          segments[neighborIndex],
          neighborIndex,
          indexDistance(neighborIndex),
        ])
        .sort(([, , a], [, , b]) => indexDistance(a) - indexDistance(b));

      if (potentialNextSegments.length === 0) {
        // No more segments to connect we should have wrapped
        stitchedSegments.push(connectedSegments);
        break;
      }

      const [nextSegment, nextSegmentIndex] = potentialNextSegments[0];

      connectedSegments.push(nextSegment);
      visited.add(nextSegmentIndex);
      currentIndex = nextSegmentIndex;
    }
  });

  return stitchedSegments;
}
