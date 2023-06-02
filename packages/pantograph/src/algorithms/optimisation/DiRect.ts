// An implementation of the direct algorithm for computing the global minimum of
// a funciton defined between 0 and 1. The algorithm is described in:
//  Jones, D.R., Perttunen, C.D. and Stuckman, B.E., 1993. Lipschitzian
//  optimization without the Lipschitz constant. Journal of Optimization Theory
//  and Applications, 79(1), pp.157-181.
//
//  Also inspired by the implementation in the Direct package for rust
//  https://gitlab.com/blei42/direct

function binarySearch<T>(
  array: T[],
  value: T,
  comparator: (a: T, b: T) => number
): number {
  let low = 0;
  let high = array.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cmp = comparator(array[mid], value);
    if (cmp < 0) {
      low = mid + 1;
    } else if (cmp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -(low + 1);
}

function binaryInsert<T>(
  array: T[],
  value: T,
  comparator: (a: T, b: T) => number
) {
  const index = binarySearch(array, value, comparator);
  if (index < 0) {
    array.splice(-(index + 1), 0, value);
  } else {
    array.splice(index, 0, value);
  }
}

class DiagonalBuckets {
  public readonly buckets: Interval[][];
  constructor() {
    this.buckets = [];
  }

  addInterval(interval: Interval) {
    const bucket = this.buckets[interval.rectangle.diagonalBucketIndex];
    if (bucket === undefined) {
      this.buckets[interval.rectangle.diagonalBucketIndex] = [interval];
    } else {
      binaryInsert(bucket, interval, (a, b) => a.value - b.value);
    }
  }

  removeInterval(interval: Interval) {
    const bucket = this.buckets[interval.rectangle.diagonalBucketIndex];
    if (bucket === undefined) {
      throw new Error("Interval not found");
    }
    bucket.shift();
  }

  getBottomRightHullIntervals(): Interval[] {
    const intervals: Interval[] = [];
    for (let i = this.buckets.length - 1; i >= 0; i--) {
      const bucket = this.buckets[i];

      if (!bucket === undefined) continue;
      const interval = bucket[0];
      if (interval === undefined) continue;

      if (!intervals.length) {
        intervals.push(interval);
        continue;
      }

      // We want to keep only the right bottom hull of the intervals

      // First, we remove intervals with a bigger value
      while (
        intervals.length &&
        intervals[intervals.length - 1].value >= interval.value
      ) {
        intervals.pop();
      }

      // Then, we remove intervals that are covered by the previous interval
      // and the last updated
      while (intervals.length >= 2) {
        const lastInterval = intervals[intervals.length - 1];
        const secondToLastInterval = intervals[intervals.length - 2];

        const slope =
          (interval.value - secondToLastInterval.value) /
          ((interval.rectangle.diagonal -
            secondToLastInterval.rectangle.diagonal) *
            2);
        const comparison =
          secondToLastInterval.value +
          ((lastInterval.rectangle.diagonal -
            secondToLastInterval.rectangle.diagonal) /
            2.0) *
            slope;

        if (comparison < lastInterval.value) {
          intervals.pop();
        } else {
          break;
        }
      }

      intervals.push(interval);
    }

    return intervals;
  }
}

class DivisionRectangle {
  public diagonal: number;
  public diagonalBucketIndex: number;

  public xLength: number;
  public yLength: number;

  public index: string;

  constructor(public x: number, public y: number) {
    this.xLength = Math.pow(3, -x);
    this.yLength = Math.pow(3, -y);

    this.diagonal = Math.sqrt(
      this.xLength * this.xLength + this.yLength * this.yLength
    );
    this.diagonalBucketIndex = x + y;

    this.index = `${x},${y}`;
  }
}

export class DiRectOptimisation {
  private rectangles: Map<string, DivisionRectangle>;
  private buckets: DiagonalBuckets;

  public fMin;
  public argMin;
  public tol;

  constructor(
    public fcn: ([x, y]: [number, number]) => number,
    public endTolerance = 1e-8,
    public maxIterations = 1000,
    public epsilon = 1e-6
  ) {
    this.fcn = fcn;
    this.epsilon = epsilon;
    this.endTolerance = endTolerance;
    this.maxIterations = maxIterations;

    this.rectangles = new Map();
    this.buckets = new DiagonalBuckets();

    const center: [number, number] = [0.5, 0.5];
    const rect = this.rect(0, 0);
    const value = this.fcn(center);

    this.buckets.addInterval(new Interval(center, value, rect));
    this.fMin = value;
    this.argMin = center;
    this.tol = rect.diagonal;
  }

  registerInterval(interval: Interval) {
    this.buckets.addInterval(interval);
    if (interval.value <= this.fMin) {
      this.fMin = interval.value;
      this.argMin = interval.center;
      this.tol = interval.rectangle.diagonal;
    }
  }

  rect(x: number, y: number): DivisionRectangle {
    const index = `${x},${y}`;
    if (!this.rectangles.has(index)) {
      this.rectangles.set(index, new DivisionRectangle(x, y));
    }
    return this.rectangles.get(index)!;
  }

  splitInterval(interval: Interval): [Interval, Interval, Interval] {
    let rect: DivisionRectangle;
    let leftCenter: [number, number], rightCenter: [number, number];

    const [x, y] = interval.center;

    if (interval.rectangle.x <= interval.rectangle.y) {
      rect = this.rect(interval.rectangle.x + 1, interval.rectangle.y);
      leftCenter = [x - rect.xLength, y];
      rightCenter = [x + rect.xLength, y];
    } else {
      rect = this.rect(interval.rectangle.x, interval.rectangle.y + 1);
      leftCenter = [x, y - rect.yLength];
      rightCenter = [x, y + rect.yLength];
    }

    return [
      new Interval(leftCenter, this.fcn(leftCenter), rect),
      new Interval(interval.center, interval.value, rect),
      new Interval(rightCenter, this.fcn(rightCenter), rect),
    ];
  }

  single_iteration() {
    const intervals = this.buckets.getBottomRightHullIntervals();

    // We want to only keep the intervals that can significantly improve the
    // minimum

    while (intervals.length >= 2) {
      // Look at the left-most point, it's most heavily constrained by both slope and
      // possible distance.
      const i1 = intervals[0];
      const i2 = intervals[1];

      const k =
        (i2.value - i1.value) /
        ((i2.rectangle.diagonal - i1.rectangle.diagonal) / 2.0);
      const potentialFMin = i1.value - (k * i2.value) / 2.0;
      if ((this.fMin - potentialFMin) / Math.abs(this.fMin) < this.epsilon) {
        intervals.shift();
      } else {
        // The points to the right are even better than this one, bail out.
        break;
      }
    }

    intervals.forEach((interval) => {
      this.buckets.removeInterval(interval);
    });

    for (const interval of intervals) {
      const [left, middle, right] = this.splitInterval(interval);

      this.registerInterval(left);
      this.registerInterval(middle);
      this.registerInterval(right);
    }
  }

  run() {
    let i = 0;
    while (this.tol > this.endTolerance / 2) {
      this.single_iteration();
      i++;
      if (i > this.maxIterations) {
        break;
      }
    }
    return {
      fMin: this.fMin,
      argMin: this.argMin,
      tol: this.tol,
      iterations: i,
    };
  }
}

class Interval {
  constructor(
    public center: [number, number],
    public value: number,
    public rectangle: DivisionRectangle
  ) {}
}

export function findGlobalMinimum(
  fun: (x: [number, number]) => number,
  tolerance = 1e-8,
  maxIterations = 1000,
  epsilon = 1e-6
) {
  const optimiser = new DiRectOptimisation(
    fun,
    tolerance,
    maxIterations,
    epsilon
  );
  return optimiser.run();
}
