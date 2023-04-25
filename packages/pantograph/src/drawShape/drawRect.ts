import { draw } from "../draw";
import type { Diagram } from "../models/Diagram";

export function drawRect(width: number, height: number, r?: number): Diagram {
  // This will be changed once we support arc of ellipses
  const { rx: inputRx = 0, ry: inputRy = 0 } = { ry: r, rx: r };

  let rx = Math.min(inputRx, width / 2);
  let ry = Math.min(inputRy, height / 2);

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
        throw new Error("disymmetric radius not implemented yet");
        //sk.ellipse(xDist, yDist, rx, ry, 0, false, true);
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
