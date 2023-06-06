import { draw } from "../draw.js";
import type { Diagram } from "../models/Diagram.js";

export function drawRect(
  width: number,
  height: number,
  r: number | { rx?: number; ry?: number } = 0
): Diagram {
  const { rx: inputRx = 0, ry: inputRy = 0 } =
    typeof r === "number" ? { ry: r, rx: r } : r;
  let rx = Math.min(inputRx ?? r ?? 0, width / 2);
  let ry = Math.min(inputRy ?? r ?? 0, height / 2);

  const withRadius = rx && ry;
  if (!withRadius) {
    rx = 0;
    ry = 0;
  }
  const symmetricRadius = rx === ry;

  const sk = draw([Math.min(0, -(width / 2 - rx)), -height / 2]);

  const addFillet = (xDist: number, yDist: number) => {
    if (withRadius) {
      if (symmetricRadius) sk.tangentArc(xDist, yDist);
      else {
        sk.ellipse(xDist, yDist, rx, ry, 0, false, false);
      }
    }
  };

  if (rx < width / 2) {
    sk.hLine(width - 2 * rx);
  }
  addFillet(rx, ry);
  if (ry < height / 2) {
    sk.vLine(height - 2 * ry);
  }
  addFillet(-rx, ry);
  if (rx < width / 2) {
    sk.hLine(-(width - 2 * rx));
  }
  addFillet(-rx, -ry);
  if (ry < height / 2) {
    sk.vLine(-(height - 2 * ry));
  }
  addFillet(rx, -ry);
  return sk.close();
}
