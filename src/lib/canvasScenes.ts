/**
 * Procedural canvas hero backgrounds — one distinct scene per page, all
 * self-contained (no images/video assets, no external requests). Each
 * factory returns a stateful draw closure: (ctx, width, height, t) => void.
 * State (particles, nodes, etc.) lives inside the closure and lazily
 * initializes/reinitializes when canvas dimensions change.
 */

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, t: number) => void;

// Brand palette (kept in sync with tailwind.config.ts brand/gold scales)
const BRAND = { r: 61, g: 124, b: 240 }; // brand-400
const BRAND_DIM = { r: 29, g: 91, b: 214 }; // brand-500
const GOLD = { r: 244, g: 132, b: 26 }; // gold-500
const rgba = (c: { r: number; g: number; b: number }, a: number) => `rgba(${c.r},${c.g},${c.b},${a})`;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** HOME — vertical streams of glyphs drifting down, like data/code flowing through a system. */
export function createCodeStreamScene(): DrawFn {
  const glyphs = '01{}<>/;=+-*#$%&[]'.split('');
  let cols: { x: number; y: number; speed: number; len: number; hue: 'brand' | 'gold' }[] | null = null;
  let cw = 0;
  let ch = 0;

  return (ctx, w, h, t) => {
    if (!cols || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      const rand = seededRandom(41);
      const count = Math.max(14, Math.floor(w / 70));
      cols = Array.from({ length: count }, (_, i) => ({
        x: (w / count) * i + rand() * 20,
        y: rand() * h,
        speed: 26 + rand() * 40,
        len: 4 + Math.floor(rand() * 6),
        hue: rand() > 0.85 ? 'gold' : 'brand',
      }));
    }

    ctx.fillStyle = 'rgba(5,7,13,0.16)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'top';

    for (const col of cols) {
      col.y += col.speed * 0.016;
      if (col.y > h + col.len * 18) col.y = -col.len * 18;
      for (let i = 0; i < col.len; i++) {
        const y = col.y - i * 18;
        if (y < -18 || y > h) continue;
        const alpha = (1 - i / col.len) * 0.55;
        const glyph = glyphs[Math.floor((t * 6 + i + col.x) % glyphs.length)];
        ctx.fillStyle = rgba(col.hue === 'gold' ? GOLD : BRAND, i === 0 ? alpha + 0.25 : alpha);
        ctx.fillText(glyph!, col.x, y);
      }
    }
  };
}

/** SERVICES — a slowly drifting node network with data pulses along edges: architecture / integrations. */
export function createNetworkGraphScene(): DrawFn {
  type Node = { x: number; y: number; vx: number; vy: number };
  let nodes: Node[] | null = null;
  let edges: [number, number][] = [];
  let cw = 0;
  let ch = 0;

  return (ctx, w, h, t) => {
    if (!nodes || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      const rand = seededRandom(17);
      const count = Math.max(12, Math.floor((w * h) / 42000));
      nodes = Array.from({ length: count }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 8,
        vy: (rand() - 0.5) * 8,
      }));
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        const dists = nodes
          .map((n, j) => ({ j, d: j === i ? Infinity : Math.hypot(n.x - nodes![i]!.x, n.y - nodes![i]!.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);
        for (const { j } of dists) edges.push([i, j]);
      }
    }

    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      n.x += n.vx * 0.016;
      n.y += n.vy * 0.016;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      n.x = Math.min(Math.max(n.x, 0), w);
      n.y = Math.min(Math.max(n.y, 0), h);
    }

    ctx.lineWidth = 1;
    edges.forEach(([a, b], idx) => {
      const na = nodes![a]!;
      const nb = nodes![b]!;
      const pulse = (Math.sin(t * 1.2 + idx * 0.7) + 1) / 2;
      ctx.strokeStyle = rgba(BRAND, 0.08 + pulse * 0.12);
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();

      // traveling pulse dot along the edge
      const p = (t * 0.25 + idx * 0.13) % 1;
      const px = na.x + (nb.x - na.x) * p;
      const py = na.y + (nb.y - na.y) * p;
      ctx.fillStyle = rgba(idx % 5 === 0 ? GOLD : BRAND, 0.55);
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    for (const n of nodes) {
      ctx.fillStyle = rgba(BRAND, 0.35);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

/** PORTFOLIO — floating product/dashboard cards with animated bar & line charts inside. */
export function createDashboardPulseScene(): DrawFn {
  type Card = { x: number; y: number; w: number; h: number; drift: number; phase: number; bars: number };
  let cards: Card[] | null = null;
  let cw = 0;
  let ch = 0;

  return (ctx, w, h, t) => {
    if (!cards || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      const rand = seededRandom(73);
      const count = w < 640 ? 2 : 4;
      cards = Array.from({ length: count }, (_, i) => ({
        x: w * (0.12 + (i * 0.72) / Math.max(1, count - 1)),
        y: h * (0.22 + rand() * 0.5),
        w: 150 + rand() * 70,
        h: 90 + rand() * 40,
        drift: 6 + rand() * 8,
        phase: rand() * Math.PI * 2,
        bars: 4 + Math.floor(rand() * 3),
      }));
    }

    ctx.clearRect(0, 0, w, h);

    for (const card of cards) {
      const dy = Math.sin(t * 0.5 + card.phase) * card.drift;
      const x = card.x - card.w / 2;
      const y = card.y - card.h / 2 + dy;
      const r = 14;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + card.w, y, x + card.w, y + card.h, r);
      ctx.arcTo(x + card.w, y + card.h, x, y + card.h, r);
      ctx.arcTo(x, y + card.h, x, y, r);
      ctx.arcTo(x, y, x + card.w, y, r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.clip();

      const pad = 16;
      const barW = (card.w - pad * 2) / (card.bars * 1.6);
      for (let i = 0; i < card.bars; i++) {
        const bh = (card.h - pad * 2) * (0.35 + 0.55 * ((Math.sin(t * 1.4 + i + card.phase) + 1) / 2));
        const bx = x + pad + i * barW * 1.6;
        const by = y + card.h - pad - bh;
        ctx.fillStyle = i % 3 === 0 ? rgba(GOLD, 0.5) : rgba(BRAND, 0.45);
        ctx.fillRect(bx, by, barW, bh);
      }
      ctx.restore();
    }
  };
}

/** INDUSTRIES — a hex grid with traveling light pulses across cells: connected systems, IoT, manufacturing. */
export function createHexGridScene(): DrawFn {
  type Cell = { cx: number; cy: number };
  let cells: Cell[] | null = null;
  let cw = 0;
  let ch = 0;
  const size = 34;

  function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + s * Math.cos(angle);
      const y = cy + s * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  return (ctx, w, h, t) => {
    if (!cells || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      cells = [];
      const hStep = size * 1.5;
      const vStep = size * Math.sqrt(3);
      let row = 0;
      for (let y = -vStep; y < h + vStep; y += vStep / 2) {
        const offset = row % 2 === 0 ? 0 : hStep / 2;
        for (let x = -hStep; x < w + hStep; x += hStep) {
          cells.push({ cx: x + offset, cy: y });
        }
        row++;
      }
    }

    ctx.clearRect(0, 0, w, h);
    const rand = seededRandom(Math.floor(t * 0.6));

    cells.forEach((cell, i) => {
      hexPath(ctx, cell.cx, cell.cy, size * 0.94);
      const pulse = Math.sin(t * 0.8 + i * 0.35) * 0.5 + 0.5;
      const lit = pulse > 0.93;
      ctx.strokeStyle = lit ? rgba(GOLD, 0.5) : rgba(BRAND, 0.1 + pulse * 0.08);
      ctx.lineWidth = lit ? 1.4 : 1;
      ctx.stroke();
      if (lit) {
        ctx.fillStyle = rgba(GOLD, 0.06);
        ctx.fill();
      }
    });
    void rand;
  };
}

/** ABOUT — soft drifting orbs that connect with faint lines when close: ideas, culture, collaboration. */
export function createOrbFieldScene(): DrawFn {
  type Orb = { x: number; y: number; vx: number; vy: number; r: number };
  let orbs: Orb[] | null = null;
  let cw = 0;
  let ch = 0;

  return (ctx, w, h, t) => {
    if (!orbs || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      const rand = seededRandom(29);
      const count = Math.max(14, Math.floor((w * h) / 55000));
      orbs = Array.from({ length: count }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 6,
        vy: (rand() - 0.5) * 6,
        r: 1.4 + rand() * 2.6,
      }));
    }

    ctx.clearRect(0, 0, w, h);

    for (const o of orbs) {
      o.x += o.vx * 0.016;
      o.y += o.vy * 0.016;
      if (o.x < -20) o.x = w + 20;
      if (o.x > w + 20) o.x = -20;
      if (o.y < -20) o.y = h + 20;
      if (o.y > h + 20) o.y = -20;
    }

    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const a = orbs[i]!;
        const b = orbs[j]!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) {
          ctx.strokeStyle = rgba(BRAND, 0.14 * (1 - d / 140));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    orbs.forEach((o, i) => {
      const glow = 0.35 + Math.sin(t * 1.1 + i) * 0.15;
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 5);
      const c = i % 6 === 0 ? GOLD : BRAND;
      grad.addColorStop(0, rgba(c, glow));
      grad.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(c, 0.8);
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}

/** CAREERS — flowing aurora-like ribbons with light sparkle: energetic, premium, creative atmosphere. */
export function createAuroraWaveScene(): DrawFn {
  let sparkles: { x: number; y: number; phase: number }[] | null = null;
  let cw = 0;
  let ch = 0;

  return (ctx, w, h, t) => {
    if (!sparkles || w !== cw || h !== ch) {
      cw = w;
      ch = h;
      const rand = seededRandom(53);
      sparkles = Array.from({ length: 40 }, () => ({ x: rand() * w, y: rand() * h, phase: rand() * Math.PI * 2 }));
    }

    ctx.clearRect(0, 0, w, h);

    const ribbons = [
      { amp: h * 0.09, freq: 1.3, base: h * 0.35, speed: 0.35, color: BRAND, alpha: 0.16 },
      { amp: h * 0.07, freq: 1.7, base: h * 0.52, speed: -0.28, color: GOLD, alpha: 0.12 },
      { amp: h * 0.1, freq: 0.9, base: h * 0.68, speed: 0.22, color: BRAND_DIM, alpha: 0.14 },
    ];

    for (const r of ribbons) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 12) {
        const y = r.base + Math.sin(x * 0.006 * r.freq + t * r.speed) * r.amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, r.base - r.amp, 0, h);
      grad.addColorStop(0, rgba(r.color, r.alpha));
      grad.addColorStop(1, rgba(r.color, 0));
      ctx.fillStyle = grad;
      ctx.fill();
    }

    for (const s of sparkles) {
      const tw = (Math.sin(t * 2 + s.phase) + 1) / 2;
      ctx.fillStyle = rgba(GOLD, tw * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1 + tw, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

/**
 * CONTACT — a slowly rotating wireframe globe with pulsing connection arcs:
 * global reach, connectivity. Lives inside the bounded hero visual panel
 * (centered, not right-biased like the old full-bleed version) with a soft
 * ambient glow, depth-faded lat/long lines, gradient arcs of varied height,
 * and glow halos on front-facing points for a more dimensional, premium
 * feel than the original flat wireframe.
 */
export function createGlobeNetworkScene(): DrawFn {
  type Point = { lat: number; lon: number };
  const points: Point[] = Array.from({ length: 13 }, (_, i) => ({
    lat: (Math.sin(i * 12.9) * 0.5) * Math.PI * 0.7,
    lon: (i / 13) * Math.PI * 2 + i * 0.35,
  }));
  const links: [number, number, number][] = [
    [0, 4, 1],
    [1, 6, 1.4],
    [2, 8, 0.8],
    [3, 10, 1.2],
    [5, 11, 1],
    [0, 7, 1.3],
    [4, 9, 0.9],
    [2, 12, 1.1],
  ];

  function project(lat: number, lon: number, radius: number, rotY: number, cx: number, cy: number) {
    const x0 = radius * Math.cos(lat) * Math.cos(lon + rotY);
    const z0 = radius * Math.cos(lat) * Math.sin(lon + rotY);
    const y0 = radius * Math.sin(lat);
    const scale = 1 / (1 + z0 / (radius * 2.6));
    return { x: cx + x0 * scale, y: cy - y0 * scale, z: z0, scale };
  }

  return (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radius = Math.min(w, h) * 0.36;
    const rotY = t * 0.14;

    // ambient glow behind the globe — premium lighting cue
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.9);
    glow.addColorStop(0, rgba(BRAND, 0.16));
    glow.addColorStop(1, rgba(BRAND, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // latitude rings — alpha faded by depth (front bright, back dim)
    for (let lat = -60; lat <= 60; lat += 20) {
      ctx.beginPath();
      let started = false;
      let lastDepth = 0.5;
      for (let i = 0; i <= 64; i++) {
        const lon = (i / 64) * Math.PI * 2;
        const p = project((lat * Math.PI) / 180, lon, radius, rotY, cx, cy);
        lastDepth = (p.z + radius) / (radius * 2);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba(BRAND, 0.08 + lastDepth * 0.14);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // longitude meridians
    for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 6) {
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const lat = -Math.PI / 2 + (i / 64) * Math.PI;
        const p = project(lat, lon, radius, rotY, cx, cy);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = rgba(BRAND, 0.12);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // connection arcs (drawn before dots so dots sit on top) — gradient
    // stroke + per-link arc height for a less uniform, more organic web
    links.forEach(([a, b, archHeight], idx) => {
      const pa = points[a]!;
      const pb = points[b]!;
      const A = project(pa.lat, pa.lon, radius, rotY, cx, cy);
      const B = project(pb.lat, pb.lon, radius, rotY, cx, cy);
      if (A.z > radius * 0.3 && B.z > radius * 0.3) return; // hide arcs mostly on the far side
      const midX = (A.x + B.x) / 2;
      const midY = (A.y + B.y) / 2 - radius * 0.32 * archHeight;
      const progress = (t * 0.26 + idx * 0.19) % 1.5;

      const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      grad.addColorStop(0, rgba(GOLD, 0.04));
      grad.addColorStop(0.5, rgba(GOLD, 0.3));
      grad.addColorStop(1, rgba(GOLD, 0.04));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.quadraticCurveTo(midX, midY, B.x, B.y);
      ctx.stroke();

      if (progress <= 1) {
        const ix = (1 - progress) ** 2 * A.x + 2 * (1 - progress) * progress * midX + progress ** 2 * B.x;
        const iy = (1 - progress) ** 2 * A.y + 2 * (1 - progress) * progress * midY + progress ** 2 * B.y;
        ctx.fillStyle = rgba(GOLD, 0.25);
        ctx.beginPath();
        ctx.arc(ix, iy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(ix, iy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    points.forEach((pt) => {
      const p = project(pt.lat, pt.lon, radius, rotY, cx, cy);
      const front = p.z < 0;
      if (front) {
        ctx.fillStyle = rgba(BRAND, 0.18);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = front ? rgba(BRAND, 0.95) : rgba(BRAND, 0.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, front ? 2.8 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  };
}
