import { noGlueTray } from "./dielines/noGlueTray";
import {
  rectangularBodyWithEndTabs,
  basicRectangularBody,
} from "./dielines/framePieces";

export default function drawDieline() {
  return basicRectangularBody(20, 100, 10, 5, 10);
  return noGlueTray(300, 80, 30, { paperThickness: 0.2 });
}
