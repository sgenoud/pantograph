import Flatbush from "flatbush";
import { KdTreeMap } from "@thi.ng/geom-accel";
import { AdjacencyList } from "@thi.ng/adjacency";
import { EquivMap, SortedSet } from "@thi.ng/associative";
import { equiv } from "@thi.ng/equiv";

import { Vector } from "../definitions.js";
import { Loop } from "../models/Loop.js";
import { Strand } from "../models/Strand.js";
import { Segment } from "../models/segments/Segment.js";
import { sameVector } from "../vectorOperations.js";

class PointsIndex<T> {
  private pointIndex: Flatbush;
  constructor(
    readonly elements: T[],
    pointKey: (s: T) => Vector,
    readonly precision = 1e-7
  ) {
    this.elements = elements;

    this.pointIndex = new Flatbush(elements.length);
    elements.forEach((c) => {
      const [x, y] = pointKey(c);
      this.pointIndex.add(
        x - precision,
        y - precision,
        x + precision,
        y + precision
      );
    });
    this.pointIndex.finish();
  }

  findIndex(point: Vector): number[] {
    const [x, y] = point;
    return this.pointIndex.search(
      x - this.precision,
      y - this.precision,
      x + this.precision,
      y + this.precision
    );
  }

  findNearbyWithIndex(point: Vector): [T, number][] {
    const nearby = this.findIndex(point);
    return nearby.map((i) => [this.elements[i], i]);
  }

  findNearby(point: Vector): T[] {
    const nearby = this.findIndex(point);
    return nearby.map((i) => this.elements[i]);
  }
}

class UnorderedGraph {
  graph: Map<number, SortedSet<number>>;
  constructor() {
    this.graph = new Map();
  }

  addEdge(a: number, b: number) {
    if (!this.graph.has(a)) {
      this.graph.set(a, new SortedSet());
    }
    this.graph.get(a)!.add(b);

    if (!this.graph.has(b)) {
      this.graph.set(b, new SortedSet());
    }
    this.graph.get(b)!.add(a);
  }

  neighbors(a: number) {
    return this.graph.get(a) || [];
  }

  removeEdge(a: number, b: number) {
    this.graph.get(a)?.delete(b);
    this.graph.get(b)?.delete(a);
  }

  removePath(indices: number[]) {
    for (let i = 0; i < indices.length - 1; i++) {
      this.removeEdge(indices[i], indices[i + 1]);
    }
  }
}

const findCycles = (graph: UnorderedGraph) => {
  const cycles: number[][] = [];
  const visited = new Set<number>();
  const stack: number[] = [];

  const dfs = (node: number, parent: number) => {
    visited.add(node);
    stack.push(node);

    graph.neighbors(node).forEach((neighbor) => {
      if (neighbor === parent) return;
      if (visited.has(neighbor)) {
        const cycleStart = stack.indexOf(neighbor);
        if (cycleStart >= 0) {
          cycles.push(stack.slice(cycleStart));
        }
        return;
      }

      dfs(neighbor, node);
    });

    stack.pop();
  };

  graph.graph.forEach((_, node) => {
    if (visited.has(node)) return;
    dfs(node, -1);
  });

  return cycles;
};

const unorderedArrayEquiv = (a: Vector, b: Vector) => equiv(a.sort(), b.sort());

export function segmentsGraph(segments: Segment[], precision = 1e-7) {
  const pointsMap = new KdTreeMap<Vector, number>(2);
  const graph = new UnorderedGraph();

  const pointIndexToSegment = new EquivMap<Vector, number>([], {
    equiv: unorderedArrayEquiv,
  });

  const getPointIndex = (point: Vector) => {
    const existingPoint = pointsMap.get(point, precision);
    if (existingPoint !== undefined) {
      return existingPoint;
    }

    const index = pointsMap.size;
    pointsMap.set(point, index, precision);
    return index;
  };

  segments.forEach((segment, index) => {
    const firstPointIndex = getPointIndex(segment.firstPoint);
    const lastPointIndex = getPointIndex(segment.lastPoint);

    graph.addEdge(firstPointIndex, lastPointIndex);

    pointIndexToSegment.set([firstPointIndex, lastPointIndex], index);
  });

  return { graph, pointIndexToSegment, cycles: findCycles(graph) };
}

export function stitchSegments(
  segments: Segment[],
  precision = 1e-7
): Segment[][] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return [segments];

  // We create a spacial index of the startpoints
  const startPointIndex = new PointsIndex(
    segments,
    (s) => s.firstPoint,
    precision
  );

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

      const neighbors = startPointIndex.findNearbyWithIndex(lastPoint);

      const indexDistance = (otherIndex: number) =>
        Math.abs((currentIndex - otherIndex) % segments.length);
      const potentialNextSegments = neighbors
        .filter(([, neighborIndex]) => !visited.has(neighborIndex))
        .map(([neighbor, neighborIndex]): [Segment, number, number] => [
          neighbor,
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

export function nonIntersectingSegmentGroups(
  segments: Segment[][],
  precision = 1e-7
): Segment[][] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return segments;

  // We create a spacial index of the startpoints
  const startPoints = new PointsIndex(
    segments,
    (s) => s[0].firstPoint,
    precision
  );

  const strokes: Segment[][] = [];
  const visited = new Set<number>();

  segments.forEach((segment, index) => {
    if (visited.has(index)) return;

    const connectedSegments: Segment[] = [...segment];
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

      const neighbors = startPoints.findNearbyWithIndex(lastPoint);

      const potentialNextSegments = neighbors.filter(
        ([, neighborIndex]) => !visited.has(neighborIndex)
      );

      if (potentialNextSegments.length === 1) {
        // There is only one possible segment, we add it and continue building
        // strokes
        const [nextSegment, nextSegmentIndex] = potentialNextSegments[0];
        connectedSegments.push(...nextSegment);
        visited.add(nextSegmentIndex);
        continue;
      }

      strokes.push(connectedSegments);
      break;
    }
  });

  return strokes;
}

function filterBranch<T>(array: T[], filter: (t: T) => boolean) {
  const withFilterVal = array.map((t) => [t, filter(t)] as [T, boolean]);
  return [
    withFilterVal.filter(([, f]) => f).map(([t]) => t),
    withFilterVal.filter(([, f]) => !f).map(([t]) => t),
  ];
}

export function stitchSegmentGroups(groups: Segment[][], precision = 1e-7) {
  const loops: Loop[] = [];

  const [singleLoops, rest] = filterBranch(
    groups,
    (group) =>
      group.length > 1 &&
      sameVector(group[0].firstPoint, group[group.length - 1].lastPoint)
  );
  loops.push(...singleLoops.map((group) => new Loop(group)));

  if (rest.length === 0) return [loops, []];

  const startPoints = new PointsIndex(rest, (s) => s[0].firstPoint, precision);

  // We close simple direct cycles

  const used = new Set<number>();
  const noSimpleCycle: Segment[][] = [];

  rest.forEach((group, index) => {
    if (used.has(index)) return;

    const potentialReturnSegments = startPoints
      .findNearbyWithIndex(group[0].lastPoint)
      .filter(([, index]) => !used.has(index))
      .filter(([segments]) =>
        sameVector(segments[segments.length - 1].lastPoint, group[0].firstPoint)
      );

    if (potentialReturnSegments.length === 1) {
      const [returnSegments, returnIndex] = potentialReturnSegments[0];
      used.add(index);
      used.add(returnIndex);
      loops.push(new Loop([...group, ...returnSegments]));
      return;
    }

    noSimpleCycle.push(group);
  });

  return [loops, noSimpleCycle] as const;
}

function stitchAsLoops(
  segments: Segment[],
  precision?: number,
  returnAll?: undefined | false
): Loop[];
function stitchAsLoops(
  segments: Segment[],
  precision: number,
  returnAll: true
): { loops: Loop[]; strands: Strand[] };
function stitchAsLoops(
  segments: Segment[],
  precision = 1e-7,
  returnAll = false
) {
  let loops: Loop[] = [];
  let rest = segments.map((s) => [s]);

  while (true) {
    const groups = nonIntersectingSegmentGroups(rest, precision);
    const [newLoops, newRest] = stitchSegmentGroups(groups, precision);
    if (!newLoops.length) break;
    loops.push(...newLoops);
    rest = newRest;
  }

  if (returnAll) {
    return { loops, strands: rest.map((s) => new Strand(s)) };
  }
  return loops;
}

export { stitchAsLoops };
