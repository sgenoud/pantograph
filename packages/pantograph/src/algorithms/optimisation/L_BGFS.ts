// Adapted from
// https://github.com/optimization-js/optimization-js

export function LBGFS(
  fnc: (x: number[]) => number,
  grd: (x: number[]) => number[],
  x0: number[],
  eps = 1e-8,
  initialStepSize = 1e-3,
) {
  let x = x0.slice();

  let alpha = initialStepSize
  const m = 5; // history size to keep for Hessian approximation

  let pfx = fnc(x);
  let fx = pfx;
  const s = []; // this is needed for lbfgs procedure
  const y = [];
  const ro = [];

  let g = grd(x);
  let direction = g.slice();
  const convergence = false;
  let iter = 0;
  while (!convergence) {
    const xn = x.slice();
    vect_x_pluseq_ag(xn, alpha, direction); // perform step
    fx = fnc(xn);
    alpha = pfx < fx ? alpha * 0.5 : alpha * 1.2; // magic!

    //  < ================= apply limited memory BFGS procedure ================= >
    const gn = grd(xn);

    if (vect_max_abs_x_less_eps(gn, eps)) {
      break;
    }

    const dx = vect_a_minus_b(xn, x);
    const dg = vect_a_minus_b(gn, g);

    s.unshift(dx);
    y.unshift(dg);
    const tmp = 1 / dot(dx, dg);
    ro.unshift(tmp);

    if (s.length > m) {
      s.pop();
      y.pop();
      ro.pop();
    }

    const r = g.slice();
    const a = new Array(s.length);

    for (let i = 0; i < s.length; i++) {
      const pi = 1 / dot(s[i], y[i]);
      a[i] = pi * dot(s[i], r);
      vect_x_pluseq_ag(r, -a[i], y[i]);
    }

    // perform Hessian scaling
    const scale = dot(dx, dg) / dot(dg, dg);
    for (let i = 0; i < r.length; i++) {
      r[i] = r[i] * scale;
    }

    for (let i = 0; i < s.length; i++) {
      const j = s.length - i - 1;
      const pj = 1 / dot(s[j], y[j]);
      const beta = pj * dot(y[j], r);
      vect_x_pluseq_ag(r, a[j] - beta, s[j]);
    }
    direction = r.slice();

    //  < ================= apply limited memory BFGS procedure ================= >

    for (let i = 0; i < direction.length; i++) {
      direction[i] = -direction[i];
    }

    pfx = fx;
    x = xn;
    g = gn;

    console.log(pfx, g, x, iter);

    iter++;
  }

  return {
    fMin: fx,
    argMin: x,
    iterations: iter,
  };
}

function dot(a: number[], b: number[]) {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result += a[i] * b[i];
  }
  return result;
}

/**
 * Substracts vectors.
 * @ignore
 * @param {Array} a First vector argument.
 * @param {Array} b Second vector argument.
 */
function vect_a_minus_b(a: number[], b: number[]) {
  const result = new Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] - b[i];
  }
  return result;
}

/**
 * Fixed step size updating value of x.
 * @ignore
 * @param {Array} x First vector argument.
 * @param {Number} a Step size.
 * @param {Array} g Gradient.
 */
function vect_x_pluseq_ag(x: number[], a: number, g: number[]) {
  for (let i = 0; i < x.length; i++) {
    x[i] = x[i] + a * g[i];
  }

  return x;
}

/**
 * Checks whether absolute values in a vector are greater than
 * some threshold.
 * @ignore
 * @param {Array} x Vector that is checked.
 * @param {Number} eps Threshold.
 */
function vect_max_abs_x_less_eps(x: number[], eps: number) {
  // this procedure is used for stopping criterion check
  for (let i = 0; i < x.length; i++) {
    if (Math.abs(x[i]) >= eps) {
      return false;
    }
  }
  return true;
}
