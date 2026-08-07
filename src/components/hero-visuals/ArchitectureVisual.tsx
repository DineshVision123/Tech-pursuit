'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Cloud } from 'lucide-react';
import { FaAws } from 'react-icons/fa6';
import {
  SiGooglecloud,
  SiKubernetes,
  SiDocker,
  SiTypescript,
  SiApachekafka,
  SiTerraform,
  SiPostgresql,
  SiReact,
  SiNodedotjs,
  SiGraphql,
  SiRedis,
  SiMongodb,
  SiAnthropic,
} from 'react-icons/si';
import type { IconType } from 'react-icons';
import type { LucideIcon } from 'lucide-react';

type Node = {
  readonly id: string;
  readonly label: string;
  readonly icon: IconType | LucideIcon;
  readonly color: string;
  readonly angle: number;
  readonly radius: number;
  readonly tile: number;
  readonly ringIndex: number;
};

type RingDef = {
  readonly radius: number;
  readonly tile: number;
  readonly startOffset: number;
  readonly direction: 1 | -1;
  readonly duration: number;
  readonly techs: ReadonlyArray<{ readonly id: string; readonly label: string; readonly icon: IconType | LucideIcon; readonly color: string }>;
};

// Reference geometry solved against a 460px container (this hero's actual
// desktop panel width). Gaps between ring radii are ~80px — 20px past the
// previous ~60px — with tile sizes sized down just enough to make that fit
// without anything overlapping. Each ring gets its own start-angle offset
// (0° / 35° / 20°) so icons never line up across rings, and its own
// rotation direction + duration ("slightly different speeds").
const rings: readonly RingDef[] = [
  {
    radius: 15.2, // 70px @ 460px reference
    tile: 40,
    startOffset: 0,
    direction: 1, // clockwise
    duration: 77,
    techs: [
      { id: 'cloud', label: 'Cloud', icon: Cloud, color: '#6da3f7' },
      { id: 'k8s', label: 'Kubernetes', icon: SiKubernetes, color: '#326CE5' },
      { id: 'docker', label: 'Docker', icon: SiDocker, color: '#2496ED' },
    ],
  },
  {
    radius: 29.3, // 135px @ 460px reference — 65px past the inner ring
    tile: 38,
    startOffset: 35,
    direction: -1, // counter-clockwise
    duration: 100,
    techs: [
      { id: 'aws', label: 'AWS', icon: FaAws, color: '#FF9900' },
      { id: 'gcloud', label: 'Google Cloud', icon: SiGooglecloud, color: '#4285F4' },
      { id: 'node', label: 'Node.js', icon: SiNodedotjs, color: '#3C873A' },
      { id: 'postgresql', label: 'PostgreSQL', icon: SiPostgresql, color: '#4169E1' },
      { id: 'kafka', label: 'Kafka', icon: SiApachekafka, color: '#E8EAED' },
    ],
  },
  {
    radius: 45.7, // 210px @ 460px reference — 75px past the middle ring
    tile: 32,
    startOffset: 20,
    direction: 1, // clockwise
    duration: 88,
    techs: [
      { id: 'react', label: 'React', icon: SiReact, color: '#61DAFB' },
      { id: 'typescript', label: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
      { id: 'graphql', label: 'GraphQL', icon: SiGraphql, color: '#E10098' },
      { id: 'redis', label: 'Redis', icon: SiRedis, color: '#DC382D' },
      { id: 'mongodb', label: 'MongoDB', icon: SiMongodb, color: '#47A248' },
      { id: 'terraform', label: 'Terraform', icon: SiTerraform, color: '#844FBA' },
      { id: 'anthropic', label: 'Anthropic', icon: SiAnthropic, color: '#F2F0EA' },
    ],
  },
];

const nodes: readonly Node[] = rings.flatMap((ring, ringIndex) =>
  ring.techs.map((t, i) => ({
    ...t,
    angle: ring.startOffset + i * (360 / ring.techs.length),
    radius: ring.radius,
    tile: ring.tile,
    ringIndex,
  })),
);

const innerNodes = nodes.filter((n) => n.ringIndex === 0);
const middleNodes = nodes.filter((n) => n.ringIndex === 1);
const outerNodes = nodes.filter((n) => n.ringIndex === 2);

function angleDelta(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function nearest(node: Node, candidates: readonly Node[]): Node {
  return candidates.reduce((best, c) => (angleDelta(node.angle, c.angle) < angleDelta(node.angle, best.angle) ? c : best));
}

// Strict hierarchy, fixed once at the (offset) resting angles: outer →
// nearest middle → nearest inner → center. Which pairs connect never
// changes — only where those pairs visually sit, as each ring spins at its
// own rate.
const edges: ReadonlyArray<[string, string]> = [
  ...innerNodes.map((n): [string, string] => ['core', n.id]),
  ...middleNodes.map((n): [string, string] => [nearest(n, innerNodes).id, n.id]),
  ...outerNodes.map((n): [string, string] => [nearest(n, middleNodes).id, n.id]),
];

// Rounded before it ever reaches a template string / SVG attribute — raw
// Math.cos/Math.sin floats can stringify with a different trailing digit
// between the server's V8 build and the browser's, which fails hydration
// even though the values are numerically identical.
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function positionOf(n: Node, liveRotationDeg: number) {
  const angle = n.angle + liveRotationDeg;
  const rad = (angle * Math.PI) / 180;
  return { x: round(50 + Math.cos(rad) * n.radius), y: round(50 + Math.sin(rad) * n.radius) };
}

/** Resting (rotation = 0) position — used for first paint, before the client-side rotation loop takes over. */
function staticPosition(id: string) {
  if (id === 'core') return { x: 50, y: 50 };
  const n = nodes.find((node) => node.id === id)!;
  return positionOf(n, 0);
}

const PACKET_COLORS = ['#f8a13f', '#6da3f7'];
const PACKET_DURATION = 2.6; // seconds per single travel along its edge

/**
 * SERVICES — three concentric rings around the Tech Pursuit mark, each
 * rotating independently (alternating clockwise/counter-clockwise, each at
 * its own slow speed) so the ecosystem never reads as one flat spinning
 * disc. Icons stay upright via an opposite counter-rotation. Because the
 * rings move at different rates, the outer→middle→inner→center connectors
 * and their traveling packets are driven by a single lightweight
 * requestAnimationFrame loop (direct DOM writes via refs, no React
 * re-renders) so every line stays correctly attached to both of its
 * moving endpoints. No enclosing panel.
 */
export function ArchitectureVisual() {
  const nodeElRefs = useRef(new Map<string, HTMLDivElement>());
  const spinElRefs = useRef(new Map<string, HTMLDivElement>());
  const lineElRefs = useRef(new Map<string, SVGLineElement>());
  const packetElRefs = useRef(new Map<string, SVGCircleElement>());

  const rotInner = useMotionValue(0);
  const rotMiddle = useMotionValue(0);
  const rotOuter = useMotionValue(0);
  const ringRotations = [rotInner, rotMiddle, rotOuter];

  // Each ring's own continuous rotation — alternating direction, its own duration.
  useEffect(() => {
    const controls = rings.map((ring, i) =>
      animate(ringRotations[i]!, 360 * ring.direction, {
        duration: ring.duration,
        repeat: Infinity,
        ease: 'linear',
      }),
    );
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reads the three rings' current rotation every frame and writes node
  // positions, icon counter-rotation, connector endpoints and packet
  // progress directly to the DOM — kept out of React state entirely so
  // this stays a single cheap loop instead of 45+ re-renders a second.
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    function frame(now: number) {
      const elapsed = (now - start) / 1000;
      const live = new Map<string, { x: number; y: number }>();
      live.set('core', { x: 50, y: 50 });

      for (const n of nodes) {
        const rot = ringRotations[n.ringIndex]!.get();
        const pos = positionOf(n, rot);
        live.set(n.id, pos);

        const outerEl = nodeElRefs.current.get(n.id);
        if (outerEl) {
          outerEl.style.left = `${pos.x}%`;
          outerEl.style.top = `${pos.y}%`;
        }
        const spinEl = spinElRefs.current.get(n.id);
        if (spinEl) {
          spinEl.style.transform = `translate(-50%, -50%) rotate(${-rot}deg)`;
        }
      }

      edges.forEach(([a, b], i) => {
        const pa = live.get(a)!;
        const pb = live.get(b)!;

        const line = lineElRefs.current.get(`${a}-${b}`);
        if (line) {
          line.setAttribute('x1', String(pa.x));
          line.setAttribute('y1', String(pa.y));
          line.setAttribute('x2', String(pb.x));
          line.setAttribute('y2', String(pb.y));
        }

        const packet = packetElRefs.current.get(`${a}-${b}`);
        if (packet) {
          const phase = (i / edges.length) * PACKET_DURATION;
          const t = ((elapsed + phase) % PACKET_DURATION) / PACKET_DURATION;
          const eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
          const x = pa.x + (pb.x - pa.x) * eased;
          const y = pa.y + (pb.y - pa.y) * eased;
          packet.setAttribute('cx', String(round(x)));
          packet.setAttribute('cy', String(round(y)));
          packet.style.opacity = String(Math.sin(t * Math.PI));
        }
      });

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute left-[8%] top-[6%] h-64 w-64 rounded-full bg-brand-500/12 blur-3xl" />
      <div className="absolute bottom-[4%] right-[4%] h-56 w-56 rounded-full bg-gold-500/12 blur-3xl" />

      <div className="relative aspect-square w-full max-w-[460px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="svc-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b7cf0" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f8a13f" stopOpacity="0.16" />
            </linearGradient>
          </defs>

          {/* The three concentric rings themselves — visible blueprint circles. */}
          {rings.map((r) => (
            <circle
              key={r.radius}
              cx={50}
              cy={50}
              r={r.radius}
              fill="none"
              stroke="rgba(109,163,247,0.26)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {edges.map(([a, b]) => {
            const pa = staticPosition(a);
            const pb = staticPosition(b);
            return (
              <line
                key={`${a}-${b}`}
                ref={(el) => {
                  if (el) lineElRefs.current.set(`${a}-${b}`, el);
                }}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="url(#svc-line)"
                strokeWidth={0.35}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {edges.map(([a, b], i) => {
            const pa = staticPosition(a);
            return (
              <circle
                key={`packet-${a}-${b}`}
                ref={(el) => {
                  if (el) packetElRefs.current.set(`${a}-${b}`, el);
                }}
                cx={pa.x}
                cy={pa.y}
                r={0.9}
                fill={PACKET_COLORS[i % 2]}
                opacity={0}
              />
            );
          })}
        </svg>

        {nodes.map((n) => {
          const p = staticPosition(n.id);
          const iconPx = Math.round(n.tile * 0.76); // +~23% over the previous 0.62 ratio — glyph only, tile/position unchanged
          return (
            <div
              key={n.id}
              ref={(el) => {
                if (el) nodeElRefs.current.set(n.id, el);
              }}
              className="absolute"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              title={n.label}
            >
              <div
                ref={(el) => {
                  if (el) spinElRefs.current.set(n.id, el);
                }}
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 5 + (n.tile % 7),
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: (n.angle % 5) * 0.2,
                  }}
                  style={{ height: n.tile, width: n.tile }}
                  className="flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] shadow-glow backdrop-blur-md"
                >
                  <n.icon size={iconPx} color={n.color} />
                </motion.div>
              </div>
            </div>
          );
        })}

        {/* Tech Pursuit mark — dead center, static, nothing overlapping it. */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white shadow-glow"
          >
            <Image
              src="/logo-mark.png"
              alt="Tech Pursuit Systems"
              width={34}
              height={28}
              className="object-contain"
              priority
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
