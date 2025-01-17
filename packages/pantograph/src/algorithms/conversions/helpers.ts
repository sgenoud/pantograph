import { Figure } from "../../models/Figure";
import { Strand } from "../../models/Strand";
import { Loop } from "../../models/Loop";
import { Diagram } from "../../models/Diagram";
import type { Segment } from "../../models/segments/Segment";
import { isSegment } from "../../models/segments/utils/isSegment";

type SegmentsMap = (s: Segment) => Segment[];

export function convertDiagramTo(diagram: Diagram, segmentsMap: SegmentsMap) {
  return new Diagram(
    diagram.figures.map((figure) => convertFigureTo(figure, segmentsMap)),
  );
}

export function convertFigureTo(
  figure: Figure,
  segmentsMap: SegmentsMap,
): Figure {
  return new Figure(
    convertLoopTo(figure.contour, segmentsMap),
    figure.holes.map((l) => convertLoopTo(l, segmentsMap)),
  );
}

export function convertLoopTo(loop: Loop, segmentsMap: SegmentsMap): Loop {
  return new Loop(convertSegmentsTo(loop.segments, segmentsMap));
}

export function converStrandTo(
  strand: Strand,
  segmentsMap: SegmentsMap,
): Strand {
  return new Strand(convertSegmentsTo(strand.segments, segmentsMap));
}

export function convertSegmentsTo(
  segments: Segment[],
  segmentsMap: SegmentsMap,
): Segment[] {
  return segments.flatMap(segmentsMap);
}

function genericConversion(
  shape: Diagram | Figure | Loop | Strand | Segment,
  segmentsMap: SegmentsMap,
): Diagram | Figure | Loop | Strand | Segment[] {
  if (shape instanceof Diagram) {
    return convertDiagramTo(shape, segmentsMap);
  }
  if (shape instanceof Figure) {
    return convertFigureTo(shape, segmentsMap);
  }

  if (shape instanceof Loop) {
    return convertLoopTo(shape, segmentsMap);
  }

  if (shape instanceof Strand) {
    return converStrandTo(shape, segmentsMap);
  }

  if (isSegment(shape)) {
    return convertSegmentsTo([shape], segmentsMap);
  }

  throw new Error("Unsupported shape type");
}

export { genericConversion };
