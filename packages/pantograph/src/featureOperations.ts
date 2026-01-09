import { filletSegments } from "./algorithms/filletSegments";
import { Vector } from "./definitions";
import { Diagram, Figure, Loop, Segment, Strand } from "./models/exports";
import { angle, DEG2RAD, distance, sameVector } from "./vectorOperations";

export type FilterFcn<Type> = {
  element: Type;
};

export abstract class FilterList<Type> {
  protected filters: (({ element }: FilterFcn<Type>) => boolean)[];

  abstract shouldKeep(t: Type): boolean;

  constructor() {
    this.filters = [];
  }

  delete() {
    this.filters = [];
  }

  /**
   * Combine logically a set of filter with an AND operation.
   *
   */
  and(findersList: ((f: this) => this)[]): this {
    findersList.forEach((f) => f(this));
    return this;
  }

  /**
   * Invert the result of a particular filter
   *
   */
  not(finderFun: (f: this) => this): this {
    const finder = new (<any>this.constructor)() as this;
    finderFun(finder);

    const notFilter = ({ element }: { element: Type }) =>
      !finder.shouldKeep(element);
    this.filters.push(notFilter);

    return this;
  }

  /**
   * Combine logically a set of filter with an OR operation.
   *
   */
  either(findersList: ((f: this) => this)[]): this {
    const builtFinders = findersList.map((finderFunction) => {
      const finder = new (<any>this.constructor)() as this;
      finderFunction(finder);
      return finder;
    });

    const eitherFilter = ({ element }: { element: Type }) =>
      builtFinders.some((finder) => finder.shouldKeep(element));
    this.filters.push(eitherFilter);

    return this;
  }
}

export type Corner = {
  firstCurve: Segment;
  secondCurve: Segment;
  point: Vector;
};

const PI_2 = 2 * Math.PI;
const positiveHalfAngle = (angle: number) => {
  const limitedAngle = angle % PI_2;

  const coterminalAngle = limitedAngle < 0 ? limitedAngle + PI_2 : limitedAngle;
  if (coterminalAngle < Math.PI) return coterminalAngle;
  if (coterminalAngle === Math.PI) return 0;
  return Math.abs(coterminalAngle - PI_2);
};

export class CornerFilter extends FilterList<Corner> {
  clone(): CornerFilter {
    const ef = new CornerFilter();
    ef.filters = [...this.filters];
    return ef;
  }

  /**
   * Filter to find corner that have their point are in the list.
   *
   */
  inList(elementList: Vector[]): this {
    const elementInList = ({ element }: { element: Corner }) => {
      return !!elementList.find((e) => sameVector(e, element.point));
    };
    this.filters.push(elementInList);
    return this;
  }

  /**
   * Filter to find elements that are at a specified distance from a point.
   *
   */
  atDistance(dist: number, point: Vector = [0, 0]): this {
    function elementAtDistance({ element }: { element: Corner }) {
      return Math.abs(distance(point, element.point) - dist) < 1e-9;
    }
    this.filters.push(elementAtDistance);
    return this;
  }

  /**
   * Filter to find elements that contain a certain point
   *
   * @category Filter
   */
  atPoint(point: Vector): this {
    function elementAtPoint({ element }: { element: Corner }) {
      return sameVector(point, element.point);
    }
    this.filters.push(elementAtPoint);
    return this;
  }

  /**
   * Filter to find elements that are within a box
   *
   * @category Filter
   */
  inBox(corner1: Vector, corner2: Vector) {
    const [x1, y1] = corner1;
    const [x2, y2] = corner2;

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    function elementInBox({ element }: { element: Corner }) {
      const [x, y] = element.point;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    this.filters.push(elementInBox);
    return this;
  }

  /**
   * Filter to find corner that a certain angle between them - only between
   * 0 and 180.
   *
   */
  ofAngle(theta: number) {
    function elementOfAngle({ element }: { element: Corner }) {
      const tgt1 = element.firstCurve.tangentAtLastPoint;
      const tgt2 = element.secondCurve.tangentAtFirstPoint;

      return (
        Math.abs(
          positiveHalfAngle(angle(tgt1, tgt2)) -
            positiveHalfAngle(DEG2RAD * theta),
        ) < 1e-9
      );
    }

    this.filters.push(elementOfAngle);
    return this;
  }

  above(yValue = 0) {
    function elementAbove({ element }: { element: Corner }) {
      return element.point[1] > yValue;
    }
    this.filters.push(elementAbove);
    return this;
  }

  below(yValue = 0) {
    function elementBelow({ element }: { element: Corner }) {
      return element.point[1] < yValue;
    }
    this.filters.push(elementBelow);
    return this;
  }

  leftOf(xValue = 0) {
    function elementLeftOf({ element }: { element: Corner }) {
      return element.point[0] < xValue;
    }
    this.filters.push(elementLeftOf);
    return this;
  }

  rightOf(xValue = 0) {
    function elementRightOf({ element }: { element: Corner }) {
      return element.point[0] > xValue;
    }
    this.filters.push(elementRightOf);
    return this;
  }

  shouldKeep(element: Corner): boolean {
    const shouldKeep = this.filters.every((filter) => filter({ element }));
    return shouldKeep;
  }

  asFilterFun() {
    return this.shouldKeep.bind(this);
  }
}

type CornerMaker = (seg1: Segment, seg2: Segment, radius: number) => Segment[];

function modifyStroke(
  makeCorner: CornerMaker,
  stroke: Loop | Strand,
  radius: number,
  filter: (c: Corner) => boolean = () => true,
): Loop | Strand {
  const segments = [stroke.segments[0]];

  const addModifiedCorner = (firstCurve: Segment, secondCurve: Segment) => {
    if (filter({ firstCurve, secondCurve, point: firstCurve.lastPoint })) {
      segments.push(...makeCorner(firstCurve, secondCurve, radius));
    } else {
      segments.push(firstCurve, secondCurve);
    }
  };

  stroke.segments.slice(1).forEach((secondCurve) => {
    const firstCurve = segments.pop();
    if (!firstCurve) throw new Error("Bug in the stroke filletting algo");
    addModifiedCorner(firstCurve, secondCurve);
  });

  const lastCurve = segments.at(-1);
  if (!lastCurve) throw new Error("Bug in the stroke corner algo");

  if (stroke instanceof Loop) {
    const firstCurve = segments.pop();
    const secondCurve = segments.shift();
    if (!firstCurve || !secondCurve)
      throw new Error("Bug in the filletting algo");
    addModifiedCorner(firstCurve, secondCurve);

    return new Loop(segments, { ignoreChecks: true });
  } else {
    return new Strand(segments, { ignoreChecks: true });
  }
}

export type Shape = Loop | Strand | Figure | Diagram;
export type FilterArg = CornerFilter | ((c: CornerFilter) => CornerFilter);

function fillet<T extends Shape>(
  shape: T,
  radius: number,
  filter?: FilterArg,
): T;
function fillet(shape: Loop, radius: number, filter?: FilterArg): Loop;
function fillet(shape: Strand, radius: number, filter?: FilterArg): Strand;
function fillet(shape: Figure, radius: number, filter?: FilterArg): Figure;
function fillet(shape: Diagram, radius: number, filter?: FilterArg): Diagram;

function fillet(
  shape: Shape,
  radius: number,
  filter?: CornerFilter | ((c: CornerFilter) => CornerFilter),
): Shape {
  const filterObj =
    typeof filter === "function" ? filter(new CornerFilter()) : filter;
  const filterFcn = filterObj && filterObj.asFilterFun();

  if (shape instanceof Loop || shape instanceof Strand) {
    return modifyStroke(filletSegments, shape, radius, filterFcn);
  }

  if (shape instanceof Figure) {
    const newContour = fillet(shape.contour, radius, filterObj);
    const newHoles = shape.holes.map((l) => fillet(l, radius, filterObj));

    return new Figure(newContour, newHoles, { ignoreChecks: true });
  }

  if (shape instanceof Diagram) {
    const newFigs = shape.figures.map((f) => fillet(f, radius, filterObj));
    return new Diagram(newFigs, { ignoreChecks: true });
  }

  throw new Error("invalid shape to fillet");
}

function chamfer<T extends Shape>(
  shape: T,
  radius: number,
  filter?: FilterArg,
): T;
function chamfer(shape: Loop, radius: number, filter?: FilterArg): Loop;
function chamfer(shape: Strand, radius: number, filter?: FilterArg): Strand;
function chamfer(shape: Figure, radius: number, filter?: FilterArg): Figure;
function chamfer(shape: Diagram, radius: number, filter?: FilterArg): Diagram;

function chamfer(shape: Shape, radius: number, filter?: FilterArg): Shape {
  const filterObj =
    typeof filter === "function" ? filter(new CornerFilter()) : filter;
  const filterFcn = filterObj && filterObj.asFilterFun();

  if (shape instanceof Loop || shape instanceof Strand) {
    return modifyStroke(filletSegments, shape, radius, filterFcn);
  }

  if (shape instanceof Figure) {
    const newContour = chamfer(shape.contour, radius, filterObj);
    const newHoles = shape.holes.map((l) => chamfer(l, radius, filterObj));

    return new Figure(newContour, newHoles, { ignoreChecks: true });
  }

  if (shape instanceof Diagram) {
    const newFigs = shape.figures.map((f) => chamfer(f, radius, filterObj));
    return new Diagram(newFigs, { ignoreChecks: true });
  }
  throw new Error("invalid shape to chamfer");
}

class CornerSelector<T extends Shape> extends CornerFilter {
  constructor(private readonly shape: T) {
    super();
  }

  fillet(radius: number): T {
    return fillet<T>(this.shape, radius, this.clone());
  }

  chamfer(radius: number): T {
    return chamfer<T>(this.shape, radius, this.clone());
  }
}

function selectCorners<T extends Shape>(s: T) {
  return new CornerSelector<T>(s);
}

export { fillet, chamfer, selectCorners };
