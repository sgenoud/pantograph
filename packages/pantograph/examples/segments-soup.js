import { Line, Arc } from "../src/models/exports";
import { stitchAsLoops, segmentsGraph } from "../src/main";

const shuffleArray = (input) => {
  const array = input.slice();

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

const drawLines = () => {
  const lines = [
    new Line([0.1, 0.2], [0, 0.1]),
    new Line([-1, 0], [0, 0.1]),
    new Line([0, 0.1], [1, 0]),
    new Line([-0.1, 0.2], [0.1, 0.2]),
    new Line([1, 0], [1, 1]),
    new Line([-1, 1], [1, 1]),
    new Line([0, 0.1], [-0.1, 0.2]),
    new Line([-1, 1], [-1, 0]),

    new Arc([-1, 5], [1, 5], [0, 5], true),
    new Arc([1, 5], [-1, 5], [0, 5], true),
  ];

  const graph = segmentsGraph(lines);
  console.log(graph);

  console.log(graph.graph.neighbors(4));

  return stitchAsLoops(lines, 1e-6, true);
};

export default () => {
  const lines = drawLines();
  console.log(lines);
  return lines.loops;
};
