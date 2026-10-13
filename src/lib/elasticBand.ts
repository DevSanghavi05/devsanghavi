/**
 * A closed loop of springy points, used to draw the blue page frame as a rubber band.
 * Pure maths (no DOM) so it can be exercised in isolation.
 */

type Segment = { length: number; at: (s: number) => [number, number] };

/** Points spaced about `spacing` apart around a rounded rectangle, in clockwise order. */
export function loopPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  spacing: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const sw = width - 2 * r;
  const sh = height - 2 * r;
  const arc = (Math.PI / 2) * r;

  const segments: Segment[] = [
    { length: sw, at: (s) => [x + r + s, y] },
    { length: arc, at: (s) => [x + width - r + r * Math.sin(s / r), y + r - r * Math.cos(s / r)] },
    { length: sh, at: (s) => [x + width, y + r + s] },
    {
      length: arc,
      at: (s) => [x + width - r + r * Math.cos(s / r), y + height - r + r * Math.sin(s / r)],
    },
    { length: sw, at: (s) => [x + width - r - s, y + height] },
    { length: arc, at: (s) => [x + r - r * Math.sin(s / r), y + height - r + r * Math.cos(s / r)] },
    { length: sh, at: (s) => [x, y + height - r - s] },
    { length: arc, at: (s) => [x + r - r * Math.cos(s / r), y + r - r * Math.sin(s / r)] },
  ];

  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const count = Math.max(24, Math.round(total / spacing));
  const xs = new Float32Array(count);
  const ys = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    let s = (i / count) * total;
    for (const segment of segments) {
      if (s < segment.length) {
        [xs[i], ys[i]] = segment.at(s);
        break;
      }
      s -= segment.length;
    }
  }
  return { xs, ys };
}

export type BandTuning = {
  /** Pull of each point back to its resting place. */
  stiffness: number;
  /** How strongly neighbours drag on each other; sets how wide a bulge is. */
  spread: number;
  /** Damping between neighbours; smooths out fine ripples. */
  viscosity: number;
  /** Damping against each point's own motion; how quickly it stops wobbling. */
  damping: number;
};

/** Wobbly (under-damped) by default; `calm` damps the wobble out for reduced motion. */
export function bandTuning(calm: boolean): BandTuning {
  return {
    stiffness: 120,
    spread: 17000,
    viscosity: 25,
    damping: calm ? 2 * Math.sqrt(120) : 5.5,
  };
}

/** Points either side of the grabbed one that the grab also pulls on, and how hard. */
const HELD_REACH = 5;
const HELD_STIFFNESS = 20000;
const HELD_DAMPING = 120;

/** Largest time step the default tuning stays stable at. */
export const BAND_STEP = 1 / 240;

export function createBand(restX: Float32Array, restY: Float32Array, tuning: BandTuning) {
  const n = restX.length;
  const dx = new Float32Array(n);
  const dy = new Float32Array(n);
  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  const ax = new Float32Array(n);
  const ay = new Float32Array(n);
  let held = -1;
  let heldX = 0;
  let heldY = 0;

  const maxAbs = (a: Float32Array, b: Float32Array) => {
    let max = 0;
    for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(a[i]), Math.abs(b[i]));
    return max;
  };

  return {
    count: n,
    restX,
    restY,
    dx,
    dy,

    /** Pull a point (and softly its neighbours) towards a displacement from rest until `release`. */
    hold(index: number, x: number, y: number) {
      held = index;
      heldX = x;
      heldY = y;
    },

    release() {
      held = -1;
    },

    step(dt: number) {
      const { stiffness, spread, viscosity, damping } = tuning;
      for (let i = 0; i < n; i++) {
        const a = i === 0 ? n - 1 : i - 1;
        const b = i === n - 1 ? 0 : i + 1;
        ax[i] =
          -stiffness * dx[i] +
          spread * (dx[a] + dx[b] - 2 * dx[i]) +
          viscosity * (vx[a] + vx[b] - 2 * vx[i]) -
          damping * vx[i];
        ay[i] =
          -stiffness * dy[i] +
          spread * (dy[a] + dy[b] - 2 * dy[i]) +
          viscosity * (vy[a] + vy[b] - 2 * vy[i]) -
          damping * vy[i];
      }
      if (held >= 0) {
        // The grab is a soft, cosine-weighted patch of springs rather than a single pin, so
        // the tip of the bulge is rounded instead of a spike.
        for (let j = -HELD_REACH; j <= HELD_REACH; j++) {
          const i = (held + j + n) % n;
          const weight = Math.cos((Math.PI / 2) * (j / (HELD_REACH + 1))) ** 2;
          ax[i] += weight * (HELD_STIFFNESS * (heldX - dx[i]) - HELD_DAMPING * vx[i]);
          ay[i] += weight * (HELD_STIFFNESS * (heldY - dy[i]) - HELD_DAMPING * vy[i]);
        }
      }
      for (let i = 0; i < n; i++) {
        vx[i] += ax[i] * dt;
        vy[i] += ay[i] * dt;
        dx[i] += vx[i] * dt;
        dy[i] += vy[i] * dt;
      }
    },

    /** True once nothing is held and every point is back at rest to within a fraction of a pixel. */
    settled() {
      return held < 0 && maxAbs(dx, dy) < 0.25 && maxAbs(vx, vy) < 3;
    },

    /** Closed, smoothed SVG path through the points, shifted by (offsetX, offsetY). */
    path(offsetX: number, offsetY: number) {
      const px = (i: number) => restX[i] + dx[i] + offsetX;
      const py = (i: number) => restY[i] + dy[i] + offsetY;
      const mid = (i: number, j: number) =>
        `${((px(i) + px(j)) / 2).toFixed(1)} ${((py(i) + py(j)) / 2).toFixed(1)}`;
      let d = `M${mid(n - 1, 0)}`;
      for (let i = 0; i < n; i++) {
        d += `Q${px(i).toFixed(1)} ${py(i).toFixed(1)} ${mid(i, i === n - 1 ? 0 : i + 1)}`;
      }
      return `${d}Z`;
    },
  };
}

export type Band = ReturnType<typeof createBand>;
