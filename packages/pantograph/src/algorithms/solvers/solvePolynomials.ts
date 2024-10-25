import { Matrix, EigenvalueDecomposition } from "ml-matrix";

// Adapted from https://raw.githubusercontent.com/raphlinus/raphlinus.github.io/master/_posts/2022-09-02-parallel-beziers.md

export function solveQuadratic(c0: number, c1: number, c2: number) {
  const sc0 = c0 / c2;
  const sc1 = c1 / c2;
  if (!(isFinite(sc0) && isFinite(sc1))) {
    const root = -c0 / c1;
    if (isFinite(root)) {
      return [root];
    } else if (c0 == 0 && c1 == 0) {
      return [0];
    } else {
      return [];
    }
  }
  const arg = sc1 * sc1 - 4 * sc0;
  let root1 = 0;
  if (isFinite(arg)) {
    if (arg < 0) {
      return [];
    } else if (arg == 0) {
      return [-0.5 * sc1];
    }
    root1 = -0.5 * (sc1 + copysign(Math.sqrt(arg), sc1));
  } else {
    root1 = -sc1;
  }
  const root2 = sc0 / root1;
  if (isFinite(root2)) {
    if (root2 > root1) {
      return [root1, root2];
    } else {
      return [root2, root1];
    }
  }
  return [root1];
}

// See kurbo common.rs
export function solveCubic(
  in_c0: number,
  in_c1: number,
  in_c2: number,
  in_c3: number,
) {
  const c2 = in_c2 / (3 * in_c3);
  const c1 = in_c1 / (3 * in_c3);
  const c0 = in_c0 / in_c3;
  if (!(isFinite(c0) && isFinite(c1) && isFinite(c2))) {
    return solveQuadratic(in_c0, in_c1, in_c2);
  }
  const d0 = -c2 * c2 + c1;
  const d1 = -c1 * c2 + c0;
  const d2 = c2 * c0 - c1 * c1;
  const d = 4 * d0 * d2 - d1 * d1;
  const de = -2 * c2 * d0 + d1;
  if (d < 0) {
    const sq = Math.sqrt(-0.25 * d);
    const r = -0.5 * de;
    const t1 = Math.cbrt(r + sq) + Math.cbrt(r - sq);
    return [t1 - c2];
  } else if (d == 0) {
    const t1 = copysign(Math.sqrt(-d0), de);
    return [t1 - c2, -2 * t1 - c2];
  } else {
    const th = Math.atan2(Math.sqrt(d), -de) / 3;
    const r0 = Math.cos(th);
    const ss3 = Math.sin(th) * Math.sqrt(3);
    const r1 = 0.5 * (-r0 + ss3);
    const r2 = 0.5 * (-r0 - ss3);
    const t = 2 * Math.sqrt(-d0);
    return [t * r0 - c2, t * r1 - c2, t * r2 - c2];
  }
}

// Factor a quartic polynomial into two quadratics. Based on Orellana and De Michele
// and very similar to the version in kurbo.
export function solveQuartic(
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  c4: number,
) {
  // This doesn't special-case c0 = 0.
  if (c4 == 0) {
    return solveCubic(c0, c1, c2, c3);
  }
  const a = c3 / c4;
  const b = c2 / c4;
  const c = c1 / c4;
  const d = c0 / c4;
  let result = solve_quartic_inner(a, b, c, d, false);
  if (result !== null) {
    return result;
  }
  const K_Q = 7.16e76;
  for (let i = 0; i < 2; i++) {
    result = solve_quartic_inner(
      a / K_Q,
      b / (K_Q * K_Q),
      c / (K_Q * K_Q * K_Q),
      d / (K_Q * K_Q * K_Q * K_Q),
      i != 0,
    );
    if (result !== null) {
      for (let j = 0; j < result.length; j++) {
        result[j] *= K_Q;
      }
      return result;
    }
  }
  // Really bad overflow happened.
  return [];
}

function eps_rel(raw: number, a: number) {
  return a == 0 ? Math.abs(raw) : Math.abs((raw - a) / a);
}

function solve_quartic_inner(
  a: number,
  b: number,
  c: number,
  d: number,
  rescale: boolean,
) {
  const result = factor_quartic_inner(a, b, c, d, rescale);
  if (result !== null && result.length == 4) {
    let roots: number[] = [];
    for (let i = 0; i < 2; i++) {
      const a = result[i * 2];
      const b = result[i * 2 + 1];
      roots = roots.concat(solveQuadratic(b, a, 1));
    }
    return roots;
  }
  return null;
}

function factor_quartic_inner(
  a: number,
  b: number,
  c: number,
  d: number,
  rescale: boolean,
) {
  function calc_eps_q(a1: number, b1: number, a2: number, b2: number) {
    const eps_a = eps_rel(a1 + a2, a);
    const eps_b = eps_rel(b1 + a1 * a2 + b2, b);
    const eps_c = eps_rel(b1 * a2 + a1 * b2, c);
    return eps_a + eps_b + eps_c;
  }
  function calc_eps_t(a1: number, b1: number, a2: number, b2: number) {
    return calc_eps_q(a1, b1, a2, b2) + eps_rel(b1 * b2, d);
  }
  const disc = 9 * a * a - 24 * b;
  const s =
    disc >= 0 ? (-2 * b) / (3 * a + copysign(Math.sqrt(disc), a)) : -0.25 * a;
  const a_prime = a + 4 * s;
  const b_prime = b + 3 * s * (a + 2 * s);
  const c_prime = c + s * (2 * b + s * (3 * a + 4 * s));
  const d_prime = d + s * (c + s * (b + s * (a + s)));
  let g_prime = 0;
  let h_prime = 0;
  const K_C = 3.49e102;
  if (rescale) {
    const a_prime_s = a_prime / K_C;
    const b_prime_s = b_prime / K_C;
    const c_prime_s = c_prime / K_C;
    const d_prime_s = d_prime / K_C;
    g_prime =
      a_prime_s * c_prime_s -
      (4 / K_C) * d_prime_s -
      (1 / 3) * b_prime_s * b_prime_s;
    h_prime =
      (a_prime_s * c_prime_s -
        (8 / K_C) * d_prime_s -
        (2 / 9) * b_prime_s * b_prime_s) *
        (1 / 3) *
        b_prime_s -
      c_prime_s * (c_prime_s / K_C) -
      a_prime_s * a_prime_s * d_prime_s;
  } else {
    g_prime = a_prime * c_prime - 4 * d_prime - (1 / 3) * b_prime * b_prime;
    h_prime =
      (a_prime * c_prime + 8 * d_prime - (2 / 9) * b_prime * b_prime) *
        (1 / 3) *
        b_prime -
      c_prime * c_prime -
      a_prime * a_prime * d_prime;
  }
  if (!isFinite(g_prime) && isFinite(h_prime)) {
    return null;
  }
  let phi = depressed_cubic_dominant(g_prime, h_prime);
  if (rescale) {
    phi *= K_C;
  }
  const l_1 = a * 0.5;
  const l_3 = (1 / 6) * b + 0.5 * phi;
  const delt_2 = c - a * l_3;
  const d_2_cand_1 = (2 / 3) * b - phi - l_1 * l_1;
  const l_2_cand_1 = (0.5 * delt_2) / d_2_cand_1;
  const l_2_cand_2 = (2 * (d - l_3 * l_3)) / delt_2;
  const d_2_cand_2 = (0.5 * delt_2) / l_2_cand_2;
  let d_2_best = 0;
  let l_2_best = 0;
  let eps_l_best = 0;
  for (let i = 0; i < 3; i++) {
    const d_2 = i == 1 ? d_2_cand_2 : d_2_cand_1;
    const l_2 = i == 0 ? l_2_cand_1 : l_2_cand_2;
    const eps_0 = eps_rel(d_2 + l_1 * l_1 + 2 * l_3, b);
    const eps_1 = eps_rel(2 * (d_2 * l_2 + l_1 * l_3), c);
    const eps_2 = eps_rel(d_2 * l_2 * l_2 + l_3 * l_3, d);
    const eps_l = eps_0 + eps_1 + eps_2;
    if (i == 0 || eps_l < eps_l_best) {
      d_2_best = d_2;
      l_2_best = l_2;
      eps_l_best = eps_l;
    }
  }
  const d_2 = d_2_best;
  const l_2 = l_2_best;
  let alpha_1 = 0;
  let beta_1 = 0;
  let alpha_2 = 0;
  let beta_2 = 0;
  if (d_2 < 0.0) {
    const sq = Math.sqrt(-d_2);
    alpha_1 = l_1 + sq;
    beta_1 = l_3 + sq * l_2;
    alpha_2 = l_1 - sq;
    beta_2 = l_3 - sq * l_2;
    if (Math.abs(beta_2) < Math.abs(beta_1)) {
      beta_2 = d / beta_1;
    } else if (Math.abs(beta_2) > Math.abs(beta_1)) {
      beta_1 = d / beta_2;
    }
    if (Math.abs(alpha_1) != Math.abs(alpha_2)) {
      let a1_cands = null;
      let a2_cands = null;
      if (Math.abs(alpha_1) < Math.abs(alpha_2)) {
        const a1_cand_1 = (c - beta_1 * alpha_2) / beta_2;
        const a1_cand_2 = (b - beta_2 - beta_1) / alpha_2;
        const a1_cand_3 = a - alpha_2;
        a1_cands = [a1_cand_3, a1_cand_1, a1_cand_2];
        a2_cands = [alpha_2, alpha_2, alpha_2];
      } else {
        const a2_cand_1 = (c - alpha_1 * beta_2) / beta_1;
        const a2_cand_2 = (b - beta_2 - beta_1) / alpha_1;
        const a2_cand_3 = a - alpha_1;
        a1_cands = [alpha_1, alpha_1, alpha_1];
        a2_cands = [a2_cand_3, a2_cand_1, a2_cand_2];
      }
      let eps_q_best = 0;
      for (let i = 0; i < 3; i++) {
        const a1 = a1_cands[i];
        const a2 = a2_cands[i];
        if (isFinite(a1) && isFinite(a2)) {
          const eps_q = calc_eps_q(a1, beta_1, a2, beta_2);
          if (i == 0 || eps_q < eps_q_best) {
            alpha_1 = a1;
            alpha_2 = a2;
            eps_q_best = eps_q;
          }
        }
      }
    }
  } else if (d_2 == 0) {
    const d_3 = d - l_3 * l_3;
    alpha_1 = l_1;
    beta_1 = l_3 + Math.sqrt(-d_3);
    alpha_2 = l_1;
    beta_2 = l_3 - Math.sqrt(-d_3);
    if (Math.abs(beta_1) > Math.abs(beta_2)) {
      beta_2 = d / beta_1;
    } else if (Math.abs(beta_2) > Math.abs(beta_1)) {
      beta_1 = d / beta_2;
    }
  } else {
    // No real solutions
    return [];
  }
  let eps_t = calc_eps_t(alpha_1, beta_1, alpha_2, beta_2);
  for (let i = 0; i < 8; i++) {
    if (eps_t == 0) {
      break;
    }
    const f_0 = beta_1 * beta_2 - d;
    const f_1 = beta_1 * alpha_2 + alpha_1 * beta_2 - c;
    const f_2 = beta_1 + alpha_1 * alpha_2 + beta_2 - b;
    const f_3 = alpha_1 + alpha_2 - a;
    const c_1 = alpha_1 - alpha_2;
    const det_j =
      beta_1 * beta_1 -
      beta_1 * (alpha_2 * c_1 + 2 * beta_2) +
      beta_2 * (alpha_1 * c_1 + beta_2);
    if (det_j == 0) {
      break;
    }
    const inv = 1 / det_j;
    const c_2 = beta_2 - beta_1;
    const c_3 = beta_1 * alpha_2 - alpha_1 * beta_2;
    const dz_0 =
      c_1 * f_0 + c_2 * f_1 + c_3 * f_2 - (beta_1 * c_2 + alpha_1 * c_3) * f_3;
    const dz_1 =
      (alpha_1 * c_1 + c_2) * f_0 -
      beta_1 * (c_1 * f_1 + c_2 * f_2 + c_3 * f_3);
    const dz_2 =
      -c_1 * f_0 - c_2 * f_1 - c_3 * f_2 + (alpha_2 * c_3 + beta_2 * c_2) * f_3;
    const dz_3 =
      -(alpha_2 * c_1 + c_2) * f_0 +
      beta_2 * (c_1 * f_1 + c_2 * f_2 + c_3 * f_3);
    const a1 = alpha_1 - inv * dz_0;
    const b1 = beta_1 - inv * dz_1;
    const a2 = alpha_2 - inv * dz_2;
    const b2 = beta_2 - inv * dz_3;
    const new_eps_t = calc_eps_t(a1, b1, a2, b2);
    if (new_eps_t < eps_t) {
      alpha_1 = a1;
      beta_1 = b1;
      alpha_2 = a2;
      beta_2 = b2;
      eps_t = new_eps_t;
    } else {
      break;
    }
  }
  return [alpha_1, beta_1, alpha_2, beta_2];
}

function depressed_cubic_dominant(g: number, h: number) {
  const q = (-1 / 3) * g;
  const r = 0.5 * h;
  let phi_0;
  let k = null;
  if (Math.abs(q) >= 1e102 || Math.abs(r) >= 1e164) {
    if (Math.abs(q) < Math.abs(r)) {
      k = 1 - q * (q / r) * (q / r);
    } else {
      k = Math.sign(q) * (((r / q) * (r / q)) / q - 1);
    }
  }
  if (k !== null && r == 0) {
    if (g > 0) {
      phi_0 = 0;
    } else {
      phi_0 = Math.sqrt(-g);
    }
  } else if (k !== null ? k < 0 : r * r < q * q * q) {
    const t = k !== null ? r / q / Math.sqrt(q) : r / Math.sqrt(q * q * q);
    phi_0 =
      -2 *
      Math.sqrt(q) *
      copysign(Math.cos(Math.acos(Math.abs(t)) * (1 / 3)), t);
  } else {
    let a;
    if (k !== null) {
      if (Math.abs(q) < Math.abs(r)) {
        a = -r * (1 + Math.sqrt(k));
      } else {
        a = -r - copysign(Math.sqrt(Math.abs(q)) * q * Math.sqrt(k), r);
      }
    } else {
      a = Math.cbrt(-r - copysign(Math.sqrt(r * r - q * q * q), r));
    }
    const b = a == 0 ? 0 : q / a;
    phi_0 = a + b;
  }
  let x = phi_0;
  let f = (x * x + g) * x + h;
  const EPS_M = 2.22045e-16;
  if (Math.abs(f) < EPS_M * Math.max(x * x * x, g * x, h)) {
    return x;
  }
  for (let i = 0; i < 8; i++) {
    const delt_f = 3 * x * x + g;
    if (delt_f == 0) {
      break;
    }
    const new_x = x - f / delt_f;
    const new_f = (new_x * new_x + g) * new_x + h;
    if (new_f == 0) {
      return new_x;
    }
    if (Math.abs(new_f) >= Math.abs(f)) {
      break;
    }
    x = new_x;
    f = new_f;
  }
  return x;
}

function copysign(x: number, y: number) {
  const a = Math.abs(x);
  return y < 0 ? -a : a;
}

export function solveGenericPolynomial(
  coefficients: number[],
  epsilon = 1e-9,
): number[] {
  if (coefficients[coefficients.length - 1] == 0) {
    return solveGenericPolynomial(coefficients.slice(0, -1), epsilon);
  }

  const polynomialMatrix = new Matrix([
    coefficients
      .slice(0, -1)
      .reverse()
      .map((c) => -c / coefficients[coefficients.length - 1]),
    ...Array.from({ length: coefficients.length - 2 }, (_, i) => {
      const row = new Array(coefficients.length - 1).fill(0);
      row[i] = 1;
      return row;
    }),
  ]);

  const eigenValues = new EigenvalueDecomposition(polynomialMatrix);

  return eigenValues.realEigenvalues.filter(
    (_, i) => Math.abs(eigenValues.imaginaryEigenvalues[i]) < epsilon,
  );
}
