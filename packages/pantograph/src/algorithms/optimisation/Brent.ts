// This is a js port of the Brent algorithm implemented in python here:
// https://github.com/scipy/scipy/blob/v0.19.0/scipy/optimize/optimize.py#L1762

const VERY_SMALL_NUM = 1e-21;
const GOLD = 1.618034;

function bracket(
  func: (x: number) => number,
  xa = 0.0,
  xb = 1.0,
  grow_limit = 110.0,
  maxiter = 1000
) {
  let denom, fa, fb, fc, funcalls, fw, iter, tmp1, tmp2, val, w, wlim, xc;

  fa = func(xa);
  fb = func(xb);

  if (fa < fb) {
    [xa, xb] = [xb, xa];
    [fa, fb] = [fb, fa];
  }

  xc = xb + GOLD * (xb - xa);
  fc = func(xc);
  funcalls = 3;
  iter = 0;

  while (fc < fb) {
    tmp1 = (xb - xa) * (fb - fc);
    tmp2 = (xb - xc) * (fb - fa);
    val = tmp2 - tmp1;

    if (Math.abs(val) < VERY_SMALL_NUM) {
      denom = 2.0 * VERY_SMALL_NUM;
    } else {
      denom = 2.0 * val;
    }

    w = xb - ((xb - xc) * tmp2 - (xb - xa) * tmp1) / denom;
    wlim = xb + grow_limit * (xc - xb);

    if (iter > maxiter) {
      throw new Error("Too many iterations.");
    }

    iter += 1;

    if ((w - xc) * (xb - w) > 0.0) {
      fw = func(w);
      funcalls += 1;

      if (fw < fc) {
        xa = xb;
        xb = w;
        fa = fb;
        fb = fw;
        return [xa, xb, xc, fa, fb, fc, funcalls];
      } else {
        if (fw > fb) {
          xc = w;
          fc = fw;
          return [xa, xb, xc, fa, fb, fc, funcalls];
        }
      }

      w = xc + GOLD * (xc - xb);
      fw = func(w);
      funcalls += 1;
    } else {
      if ((w - wlim) * (wlim - xc) >= 0.0) {
        w = wlim;
        fw = func(w);
        funcalls += 1;
      } else {
        if ((w - wlim) * (xc - w) > 0.0) {
          fw = func(w);
          funcalls += 1;

          if (fw < fc) {
            xb = xc;
            xc = w;
            w = xc + GOLD * (xc - xb);
            fb = fc;
            fc = fw;
            fw = func(w);
            funcalls += 1;
          }
        } else {
          w = xc + GOLD * (xc - xb);
          fw = func(w);
          funcalls += 1;
        }
      }
    }

    xa = xb;
    xb = xc;
    xc = w;
    fa = fb;
    fb = fc;
    fc = fw;
  }

  return [xa, xb, xc, fa, fb, fc, funcalls];
}

const CG = 0.381966;
const MIN_TOL = 1e-11;

class BrentOptimization {
  private xmin: number;
  private fval: number;
  private iter: number;
  private funcalls: number;

  private brack: number[] | null;

  constructor(
    public readonly func: (x: number) => number,
    public readonly tol = 1.48e-8,
    public readonly maxiter = 500
  ) {
    this.func = func;
    this.tol = tol;
    this.maxiter = maxiter;
    this.xmin = Infinity;
    this.fval = Infinity;
    this.iter = 0;
    this.funcalls = 0;

    this.brack = null;
  }

  setBracket(brack: null | number[] = null) {
    this.brack = brack;
  }

  getBracketInfo() {
    let fa, fb, fc, funcalls, xa, xb, xc;
    const func = this.func;
    const brack = this.brack;

    if (brack === null) {
      [xa, xb, xc, fa, fb, fc, funcalls] = bracket(func);
    } else {
      if (brack.length === 2) {
        [xa, xb, xc, fa, fb, fc, funcalls] = bracket(func, brack[0], brack[1]);
      } else {
        if (brack.length === 3) {
          [xa, xb, xc] = brack;

          if (xa > xc) {
            [xc, xa] = [xa, xc];
          }

          if (!(xa < xb && xb < xc)) {
            throw new Error("Not a bracketing interval.");
          }

          fa = func(xa);
          fb = func(xb);
          fc = func(xc);

          if (!(fb < fa && fb < fc)) {
            throw new Error("Not a bracketing interval.");
          }

          funcalls = 3;
        } else {
          throw new Error(
            "Bracketing interval must be length 2 or 3 sequence."
          );
        }
      }
    }

    return [xa, xb, xc, fa, fb, fc, funcalls];
  }

  optimize() {
    const func = this.func;
    let [xa, xb, xc, , , , funcalls] = this.getBracketInfo();

    let x = xb;
    let w = xb;
    let v = xb;

    let fw = func(x);
    let fv = fw;
    let fx = fw;

    let a, b;

    if (xa < xc) {
      a = xa;
      b = xc;
    } else {
      a = xc;
      b = xa;
    }

    let deltax = 0.0;
    funcalls = 1;
    let iter = 0;
    let rat = 0.0;

    let u;

    while (iter < this.maxiter) {
      const tol1 = this.tol * Math.abs(x) + MIN_TOL;
      const tol2 = 2.0 * tol1;
      const xmid = 0.5 * (a + b);

      if (Math.abs(x - xmid) < tol2 - 0.5 * (b - a)) {
        break;
      }

      if (Math.abs(deltax) <= tol1) {
        if (x >= xmid) {
          deltax = a - x;
        } else {
          deltax = b - x;
        }

        rat = CG * deltax;
      } else {
        const tmp1 = (x - w) * (fx - fv);
        let tmp2 = (x - v) * (fx - fw);
        let p = (x - v) * tmp2 - (x - w) * tmp1;
        tmp2 = 2.0 * (tmp2 - tmp1);

        if (tmp2 > 0.0) {
          p = -p;
        }

        tmp2 = Math.abs(tmp2);
        const dx_temp = deltax;
        deltax = rat;

        if (
          p > tmp2 * (a - x) &&
          p < tmp2 * (b - x) &&
          Math.abs(p) < Math.abs(0.5 * tmp2 * dx_temp)
        ) {
          rat = (p * 1.0) / tmp2;
          u = x + rat;

          if (u - a < tol2 || b - u < tol2) {
            if (xmid - x >= 0) {
              rat = tol1;
            } else {
              rat = -tol1;
            }
          }
        } else {
          if (x >= xmid) {
            deltax = a - x;
          } else {
            deltax = b - x;
          }

          rat = CG * deltax;
        }
      }

      if (Math.abs(rat) < tol1) {
        if (rat >= 0) {
          u = x + tol1;
        } else {
          u = x - tol1;
        }
      } else {
        u = x + rat;
      }

      const fu = func(u);
      funcalls += 1;

      if (fu > fx) {
        if (u < x) {
          a = u;
        } else {
          b = u;
        }

        if (fu <= fw || w === x) {
          v = w;
          w = u;
          fv = fw;
          fw = fu;
        } else {
          if (fu <= fv || v === x || v === w) {
            v = u;
            fv = fu;
          }
        }
      } else {
        if (u >= x) {
          a = x;
        } else {
          b = x;
        }

        v = w;
        w = x;
        x = u;
        fv = fw;
        fw = fx;
        fx = fu;
      }

      iter += 1;
    }

    this.xmin = x;
    this.fval = fx;
    this.iter = iter;
    this.funcalls = funcalls;
  }

  results() {
    return {
      argMin: this.xmin,
      fMin: this.fval,
      iterations: this.iter,
      funcCalls: this.funcalls,
    };
  }

  run() {
    this.optimize();
    return this.results();
  }
}

export function findScalarMinimum(
  fun: (x: number) => number,
  tolerance = 1e-8,
  maxIterations = 1000
) {
  const optimiser = new BrentOptimization(fun, tolerance, maxIterations);
  optimiser.setBracket([0, 1]);
  return optimiser.run();
}
