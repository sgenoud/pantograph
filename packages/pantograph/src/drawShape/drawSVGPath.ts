import { parsePath, absolutize } from "path-data-parser";

import { draw, DrawingPen } from "../draw.js";
import { Vector } from "../definitions.js";

const parseArgs = (
  command: { key: string; data: number[] },
  previousPoint: null | Vector,
  previousControls: {
    control1?: null | Vector;
    control2?: null | Vector;
  }
):
  | { p: Vector; control1: Vector; control2: Vector }
  | { p: Vector }
  | { p: Vector; arcConfig: [number, number, number, boolean, boolean] } => {
  let p: Vector;
  let control1: null | Vector = null;
  let control2: null | Vector = null;

  if (command.key === "M") {
    const [x, y] = command.data;
    p = [x, y];
    return { p };
  }

  if (command.key === "H") {
    const [x] = command.data;
    p = [x, previousPoint?.[1] || 0];
    return { p };
  }

  if (command.key === "V") {
    const [y] = command.data;
    p = [previousPoint?.[0] || 0, y];
    return { p };
  }

  if (command.key === "L") {
    const [x, y] = command.data;
    p = [x, y];
    return { p };
  }

  if (command.key === "C") {
    const [x1, y1, x2, y2, x, y] = command.data;
    p = [x, y];
    control1 = [x1, y1];
    control2 = [x2, y2];

    return {
      p,
      control1,
      control2,
    };
  }

  if (command.key === "S") {
    const [x1, y1, x, y] = command.data;
    p = [x, y];
    control2 = [x1, y1];

    if (!previousPoint) {
      throw new Error("S command without previous point");
    }

    control1 = previousPoint;
    if (previousControls.control2) {
      const pp = previousPoint;
      control1 = [
        pp[0] + (pp[0] - previousControls.control2[0]),
        pp[1] + (pp[1] - previousControls.control2[1]),
      ];
    }

    return {
      p,
      control1,
      control2,
    };
  }

  if (command.key === "Q") {
    const [x1, y1, x, y] = command.data;
    p = [x, y];
    control1 = [x1, y1];

    return {
      p,
      control1,
    };
  }

  if (command.key === "T") {
    const [x, y] = command.data;
    p = [x, y];

    if (!previousPoint) {
      throw new Error("T command without previous point");
    }

    control1 = previousPoint;
    if (previousControls.control1 && !previousControls.control2) {
      const pp = previousPoint;
      control1 = [
        pp[0] + (pp[0] - previousControls.control1[0]),
        pp[1] + (pp[1] - previousControls.control1[1]),
      ];
    }
  }

  if (command.key === "A") {
    const [rx, ry, xAxisRotation = 0, largeArc = 0, sweepFlag = 0, x, y] =
      command.data;
    p = [x, y];

    if (!previousPoint) {
      throw new Error("A command without previous point");
    }

    // The radius can be defined as smaller than what is needed. We need to fix
    // it in that case.
    const distance = Math.sqrt(
      (previousPoint[0] - x) ** 2 + (previousPoint[1] - y) ** 2
    );
    const bigRadius = Math.max(rx, ry);
    let a = rx;
    let b = ry;

    if (bigRadius < distance / 2) {
      const ratio = distance / 2 / bigRadius;
      a = rx * ratio;
      b = ry * ratio;
    }

    return {
      p,
      arcConfig: [a, b, xAxisRotation, !!largeArc, !!sweepFlag],
    };
  }

  throw new Error(`Unknown command ${command.key}`);
};

export function* drawSVGPathGenerator(SVGPath: string) {
  const commands = absolutize(parsePath(SVGPath));

  let pen: null | DrawingPen = null;
  let lastPoint: null | Vector = null;
  let lastControls: {
    control1: null | Vector;
    control2: null | Vector;
  } = { control1: null, control2: null };

  for (const command of commands) {
    if (command.key === "Z") {
      if (pen) yield pen.close();
      pen = null;
      continue;
    }

    const args = parseArgs(command, lastPoint, lastControls);
    const p = args.p;
    const control1 = "control1" in args ? args.control1 : null;
    const control2 = "control1" in args ? args.control2 : null;
    const arcConfig = "arcConfig" in args ? args.arcConfig : null;

    if (command.key === "M") {
      if (pen) {
        yield pen.isClosed ? pen.close() : pen.asStrand();
      }

      pen = draw(p, 1e-6);
      lastPoint = p;
      continue;
    }

    // We do not draw line of length 0
    if (
      lastPoint &&
      Math.abs(p[0] - lastPoint[0]) < 1e-9 &&
      Math.abs(p[1] - lastPoint[1]) < 1e-9
    ) {
      lastPoint = p;
      lastControls = { control1, control2 };
      continue;
    }

    if (command.key === "L" || command.key === "H" || command.key === "V") {
      pen?.lineTo(p);
    }

    if (command.key === "C" || command.key === "S") {
      pen?.cubicBezierCurveTo(p, control1!, control2!);
    }

    if (command.key === "Q" || command.key === "T") {
      pen?.quadraticBezierCurveTo(p, control1!);
    }

    if (command.key === "A") {
      pen?.ellipseTo(p, ...arcConfig!);
    }

    lastPoint = p;
    lastControls = { control1, control2 };
  }

  if (pen) yield pen.isClosed ? pen.close() : pen.asStrand();
}

export function drawSVGPath(SVGPath: string) {
  return Array.from(drawSVGPathGenerator(SVGPath));
}
