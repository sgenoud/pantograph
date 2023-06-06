import { chamferSegments, filletSegments } from "./algorithms/filletSegments.js";
import { Vector } from "./definitions.js";
import { Strand } from "./models/Strand.js";
import { Diagram } from "./models/Diagram.js";
import { Figure } from "./models/Figure.js";
import { Loop } from "./models/Loop.js";
import { tangentArc, threePointsArc } from "./models/segments/Arc.js";
import { Line } from "./models/segments/Line.js";
import { Segment } from "./models/segments/Segment.js";
import { TransformationMatrix } from "./models/TransformationMatrix.js";
import {
  polarToCartesian,
  DEG2RAD,
  subtract,
  sameVector,
  perpendicular,
  add,
  scalarMultiply,
  distance,
  cartesianToPolar,
  RAD2DEG,
} from "./vectorOperations";
import { svgEllipse } from "./models/segments/EllipseArc.js";

function loopySegmentsToDiagram(
  segments: Segment[],
  { ignoreChecks = false } = {}
) {
  // Here we will need to do our best to fix cases where the drawing is
  // broken in some way (i.e. self-intersecting loops)

  return new Diagram([new Figure(new Loop([...segments], { ignoreChecks }))]);
}

export class DrawingPen {
  pointer: Vector;
  protected firstPoint: Vector;
  protected pendingSegments: Segment[];

  protected _nextCorner: { radius: number; mode: "fillet" | "chamfer" } | null;

  constructor(origin: Vector = [0, 0]) {
    this.pointer = origin;
    this.firstPoint = origin;

    this.pendingSegments = [];
    this._nextCorner = null;
  }

  movePointerTo(point: Vector): this {
    if (this.pendingSegments.length)
      throw new Error(
        "You can only move the pointer if there is no segment defined"
      );

    this.pointer = point;
    this.firstPoint = point;
    return this;
  }

  protected saveSegment(segment: Segment) {
    if (sameVector(segment.firstPoint, segment.lastPoint)) {
      throw new Error(`Segment has no length, ${segment.repr}`);
    }

    if (!this._nextCorner) {
      this.pendingSegments.push(segment);
      return this;
    }

    const previousSegment = this.pendingSegments.pop();
    if (!previousSegment) throw new Error("bug in the custom corner algorithm");

    const makeCorner =
      this._nextCorner.mode === "chamfer" ? chamferSegments : filletSegments;

    this.pendingSegments.push(
      ...makeCorner(previousSegment, segment, this._nextCorner.radius)
    );
    this._nextCorner = null;
    return this;
  }

  lineTo(point: Vector): this {
    const segment = new Line(this.pointer, point);
    this.pointer = point;
    return this.saveSegment(segment);
  }

  line(xDist: number, yDist: number): this {
    return this.lineTo([this.pointer[0] + xDist, this.pointer[1] + yDist]);
  }

  vLine(distance: number): this {
    return this.line(0, distance);
  }

  hLine(distance: number): this {
    return this.line(distance, 0);
  }

  vLineTo(yPos: number): this {
    return this.lineTo([this.pointer[0], yPos]);
  }

  hLineTo(xPos: number): this {
    return this.lineTo([xPos, this.pointer[1]]);
  }

  polarLineTo([r, theta]: Vector): this {
    const angleInRads = theta * DEG2RAD;
    const point = polarToCartesian(r, angleInRads);
    return this.lineTo(point);
  }

  polarLine(distance: number, angle: number): this {
    const angleInRads = angle * DEG2RAD;
    const [x, y] = polarToCartesian(distance, angleInRads);
    return this.line(x, y);
  }

  tangentLine(distance: number): this {
    const previousCurve = this.pendingSegments.at(-1);

    if (!previousCurve)
      throw new Error("You need a previous segment to sketch a tangent line");

    const [xDir, yDir] = previousCurve.tangentAtLastPoint;
    return this.line(xDir * distance, yDir * distance);
  }

  threePointsArcTo(end: Vector, midPoint: Vector): this {
    this.saveSegment(threePointsArc(this.pointer, midPoint, end));
    this.pointer = end;
    return this;
  }

  threePointsArc(
    xDist: number,
    yDist: number,
    viaXDist: number,
    viaYDist: number
  ): this {
    const [x0, y0] = this.pointer;
    return this.threePointsArcTo(
      [x0 + xDist, y0 + yDist],
      [x0 + viaXDist, y0 + viaYDist]
    );
  }

  sagittaArcTo(end: Vector, sagitta: number): this {
    if (!sagitta) return this.lineTo(end);
    const chord = new Line(this.pointer, end);
    const norm = perpendicular(chord.tangentAtFirstPoint);

    const sagPoint: Vector = add(chord.midPoint, scalarMultiply(norm, sagitta));

    return this.threePointsArcTo(end, sagPoint);
  }

  sagittaArc(xDist: number, yDist: number, sagitta: number): this {
    return this.sagittaArcTo(
      [xDist + this.pointer[0], yDist + this.pointer[1]],
      sagitta
    );
  }

  vSagittaArc(distance: number, sagitta: number): this {
    return this.sagittaArc(0, distance, sagitta);
  }

  hSagittaArc(distance: number, sagitta: number): this {
    return this.sagittaArc(distance, 0, sagitta);
  }

  bulgeArcTo(end: Vector, bulge: number): this {
    if (!bulge) return this.lineTo(end);
    const halfChord = distance(this.pointer, end) / 2;
    const bulgeAsSagitta = -bulge * halfChord;

    return this.sagittaArcTo(end, bulgeAsSagitta);
  }

  bulgeArc(xDist: number, yDist: number, bulge: number): this {
    return this.bulgeArcTo(
      [xDist + this.pointer[0], yDist + this.pointer[1]],
      bulge
    );
  }

  vBulgeArc(distance: number, bulge: number): this {
    return this.bulgeArc(0, distance, bulge);
  }

  hBulgeArc(distance: number, bulge: number): this {
    return this.bulgeArc(distance, 0, bulge);
  }

  tangentArcTo(end: Vector, tangentAtStart?: Vector): this {
    const previousCurve = this.pendingSegments.at(-1);

    if (!previousCurve)
      throw new Error("You need a previous curve to sketch a tangent arc");

    this.saveSegment(
      tangentArc(
        this.pointer,
        end,
        tangentAtStart ?? previousCurve.tangentAtLastPoint
      )
    );

    this.pointer = end;
    return this;
  }

  tangentArc(xDist: number, yDist: number, tangentAtStart?: Vector): this {
    const [x0, y0] = this.pointer;
    return this.tangentArcTo([xDist + x0, yDist + y0], tangentAtStart);
  }

  ellipseTo(
    end: Vector,
    r0: number,
    r1: number,
    xAxisRotation: number,
    longArc: boolean,
    sweepFlag: boolean
  ): this {
    this.saveSegment(
      svgEllipse(this.pointer, end, r0, r1, xAxisRotation, longArc, sweepFlag)
    );
    this.pointer = end;
    return this;
  }

  ellipse(
    xDist: number,
    yDist: number,
    r0: number,
    r1: number,
    xAxisRotation: number,
    longArc: boolean,
    sweepFlag: boolean
  ): this {
    return this.ellipseTo(
      [xDist + this.pointer[0], yDist + this.pointer[1]],
      r0,
      r1,
      xAxisRotation,
      longArc,
      sweepFlag
    );
  }

  halfEllipseTo(end: Vector, sagitta: number): this {
    const [distance, angle] = cartesianToPolar(subtract(end, this.pointer));

    return this.ellipseTo(
      end,
      distance / 2,
      Math.abs(sagitta),
      angle * RAD2DEG,
      true,
      sagitta > 0
    );
  }

  halfEllipse(xDist: number, yDist: number, sagitta: number): this {
    return this.halfEllipseTo(
      [xDist + this.pointer[0], yDist + this.pointer[1]],
      sagitta
    );
  }

  customCorner(radius: number, mode: "fillet" | "chamfer" = "fillet") {
    if (!this.pendingSegments.length)
      throw new Error("You need a segment defined to fillet the angle");

    if (!radius) return this;

    this._nextCorner = { mode, radius };
    return this;
  }

  protected _customCornerLastWithFirst(
    radius: number,
    mode: "fillet" | "chamfer" = "fillet"
  ) {
    if (!radius) return;

    const lastSegment = this.pendingSegments.pop();
    const firstSegment = this.pendingSegments.shift();

    if (!lastSegment || !firstSegment)
      throw new Error("Not enough curves to close and fillet");

    const makeCorner = mode === "chamfer" ? chamferSegments : filletSegments;

    this.pendingSegments.push(...makeCorner(lastSegment, firstSegment, radius));
  }

  close(ignoreChecks = false): Diagram {
    if (!this.pendingSegments.length) throw new Error("No segments to close");
    const firstSegment = this.pendingSegments[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastSegment = this.pendingSegments.at(-1)!;

    if (!sameVector(firstSegment.firstPoint, lastSegment.lastPoint)) {
      this.lineTo(firstSegment.firstPoint);
    }

    if (this._nextCorner !== null) {
      this._customCornerLastWithFirst(
        this._nextCorner.radius,
        this._nextCorner.mode
      );
      this._nextCorner = null;
    }

    return loopySegmentsToDiagram(this.pendingSegments, { ignoreChecks });
  }

  closeWithMirror(ignoreChecks = false): Diagram {
    if (!this.pendingSegments.length) throw new Error("No segments to close");

    const firstSegment = this.pendingSegments[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastSegment = this.pendingSegments.at(-1)!;

    const mirrorVector = subtract(
      lastSegment.lastPoint,
      firstSegment.firstPoint
    );
    const mirrorTranform = new TransformationMatrix().mirrorLine(
      mirrorVector,
      firstSegment.firstPoint
    );

    const mirroredSegments = this.pendingSegments.map((segment) =>
      segment.transform(mirrorTranform).reverse()
    );
    mirroredSegments.reverse();

    return loopySegmentsToDiagram(
      [...this.pendingSegments, ...mirroredSegments],
      { ignoreChecks }
    );
  }

  asStrand(): Strand {
    return new Strand([...this.pendingSegments]);
  }
}

export function draw(origin: Vector = [0, 0]): DrawingPen {
  return new DrawingPen(origin);
}
