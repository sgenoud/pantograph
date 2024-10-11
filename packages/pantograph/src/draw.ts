import {
  chamferSegments,
  filletSegments,
} from "./algorithms/filletSegments.js";
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
  normalize,
} from "./vectorOperations.js";
import { svgEllipse } from "./models/segments/EllipseArc.js";
import { QuadraticBezier } from "./models/segments/QuadraticBezier.js";
import { CubicBezier } from "./models/segments/CubicBezier.js";
import { stitchAsLoops } from "./algorithms/stitchSegments.js";
import { splitAtSelfIntersections } from "./models/segments/utils/selfIntersections.js";
import { organiseLoops } from "./algorithms/organiseLoops.js";

const parseSmoothCurveConfig = (
  config?:
    | number
    | Vector
    | {
        endTangent?: number | Vector;
        startTangent?: number | Vector;
        startFactor?: number;
        endFactor?: number;
      }
) => {
  let conf: {
    endTangent: number | Vector;
    startFactor?: number;
    endFactor?: number;
    startTangent?: number | Vector;
  };

  if (!config) conf = { endTangent: [1, 0] };
  else if (
    typeof config === "number" ||
    (Array.isArray(config) && config.length === 2)
  ) {
    conf = { endTangent: config };
  } else {
    conf = { endTangent: 0, ...config };
  }
  const {
    endTangent: endTgt,
    startFactor = 1,
    endFactor = 1,
    startTangent: startTgt,
  } = conf;

  let endTangent: Vector;
  if (typeof endTgt === "number") {
    endTangent = polarToCartesian(1, endTgt * DEG2RAD);
  } else {
    endTangent = endTgt;
  }

  let startTangent: Vector | undefined;
  if (typeof startTgt === "number") {
    startTangent = polarToCartesian(1, startTgt * DEG2RAD);
  } else {
    startTangent = startTgt;
  }

  return { endTangent, startFactor, endFactor, startTangent };
};

function loopySegmentsToDiagram(segments: Segment[], precision?: number) {
  // Here we will need to do our best to fix cases where the drawing is
  // broken in some way (i.e. self-intersecting loops)

  // If there are any self intersection we split the loop there and build
  // multiple loop
  const loops = stitchAsLoops(splitAtSelfIntersections(segments), precision);

  return new Diagram(organiseLoops(loops));
}

export class DrawingPen {
  pointer: Vector;
  protected precision?: number;
  protected firstPoint: Vector;
  protected pendingSegments: Segment[];

  protected _nextCorner: { radius: number; mode: "fillet" | "chamfer" } | null;

  constructor(origin: Vector = [0, 0], precision?: number) {
    this.pointer = origin;
    this.firstPoint = origin;
    this.precision = precision;

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
    const segment = new Line(this.pointer, point, this.precision);
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
    this.saveSegment(
      threePointsArc(this.pointer, midPoint, end, this.precision)
    );
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
    const chord = new Line(this.pointer, end, this.precision);
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
        tangentAtStart ?? previousCurve.tangentAtLastPoint,
        this.precision
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

  cubicBezierCurveTo(
    end: Vector,
    startControlPoint: Vector,
    endControlPoint: Vector
  ): this {
    this.saveSegment(
      new CubicBezier(
        this.pointer,
        end,
        startControlPoint,
        endControlPoint,
        this.precision
      )
    );
    this.pointer = end;
    return this;
  }

  quadraticBezierCurveTo(end: Vector, controlPoint: Vector): this {
    this.saveSegment(
      new QuadraticBezier(this.pointer, end, controlPoint, this.precision)
    );
    this.pointer = end;
    return this;
  }

  smoothCurveTo(
    end: Vector,
    config?:
      | number
      | Vector
      | {
          endTangent?: number | Vector;
          startTangent?: number | Vector;
          startFactor?: number;
          endFactor?: number;
        }
  ): this {
    const { endTangent, startTangent, startFactor, endFactor } =
      parseSmoothCurveConfig(config);

    const previousCurve = this.pendingSegments.length
      ? this.pendingSegments[this.pendingSegments.length - 1]
      : null;

    const defaultDistance = distance(this.pointer, end) / 3;

    let startPoleDirection: Vector;
    if (startTangent) {
      startPoleDirection = startTangent;
    } else if (!previousCurve) {
      startPoleDirection = [1, 0];
    } else {
      startPoleDirection = previousCurve.tangentAtLastPoint;
    }

    startPoleDirection = normalize(startPoleDirection);
    const startControl: Vector = [
      this.pointer[0] + startPoleDirection[0] * startFactor * defaultDistance,
      this.pointer[1] + startPoleDirection[1] * startFactor * defaultDistance,
    ];

    let endPoleDirection = endTangent;

    endPoleDirection = normalize(endPoleDirection);
    const endControl: Vector = [
      end[0] - endPoleDirection[0] * endFactor * defaultDistance,
      end[1] - endPoleDirection[1] * endFactor * defaultDistance,
    ];

    return this.cubicBezierCurveTo(end, startControl, endControl);
  }

  smoothCurve(
    xDist: number,
    yDist: number,
    config?:
      | number
      | Vector
      | {
          endTangent?: number | Vector;
          startTangent?: number | Vector;
          startFactor?: number;
          endFactor?: number;
        }
  ) {
    return this.smoothCurveTo(
      [xDist + this.pointer[0], yDist + this.pointer[1]],
      config
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

  close(): Diagram {
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

    return loopySegmentsToDiagram(this.pendingSegments, this.precision);
  }

  closeWithMirror(): Diagram {
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

    return loopySegmentsToDiagram([
      ...this.pendingSegments,
      ...mirroredSegments,
    ]);
  }

  asStrand(): Strand {
    return new Strand([...this.pendingSegments]);
  }

  get isClosed(): boolean {
    return sameVector(this.pointer, this.pendingSegments[0]?.firstPoint);
  }
}

export function draw(origin: Vector = [0, 0], precision?: number): DrawingPen {
  return new DrawingPen(origin, precision);
}
