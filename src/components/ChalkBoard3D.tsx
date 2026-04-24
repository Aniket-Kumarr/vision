'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Scene3D, Surface3D, Vec3 } from '@/lib/types3d';

// ---------------------------------------------------------------------------
// Color palette — matches the 2D chalk palette in types.ts so the two modes
// feel like siblings.  Strings are parsed by three.js Color.
// ---------------------------------------------------------------------------
const CHALK_WHITE = '#F5F0E8';
const CHALK_YELLOW = '#FFE066';
const CHALK_GREEN = '#7FD97F';
const CHALK_BLUE = '#6BBFFF';
const CHALK_RED = '#FF7F7F';
const CHALK_ORANGE = '#FFB347';
const CHALK_CYAN = '#7FFFEF';

const NAMED_COLORS: Record<string, string> = {
  white: CHALK_WHITE,
  yellow: CHALK_YELLOW,
  green: CHALK_GREEN,
  blue: CHALK_BLUE,
  red: CHALK_RED,
  orange: CHALK_ORANGE,
  cyan: CHALK_CYAN,
};

function resolveColor(name: string | undefined, fallback = CHALK_WHITE): string {
  if (!name) return fallback;
  const lower = name.toLowerCase();
  return NAMED_COLORS[lower] ?? name;
}

// ---------------------------------------------------------------------------
// Surface helper — compile f(x,y) into a real function.
//
// SECURITY: the `fn` string comes from Anthropic's response (validated server-
// side for length, but still untrusted expression).  We use the Function
// constructor which runs in the global scope and cannot touch component
// closures.  We ONLY invoke the function client-side, where the only thing it
// can access is the browser sandbox (no process/fs/etc).  It's a calculator
// input, not an eval of arbitrary source.
// ---------------------------------------------------------------------------
function compileSurfaceFn(expr: string): (x: number, y: number) => number {
  try {
    const fn = new Function('x', 'y', 'Math', `return (${expr});`) as (
      x: number,
      y: number,
      m: typeof Math,
    ) => number;
    return (x, y) => {
      const v = fn(x, y, Math);
      return Number.isFinite(v) ? v : 0;
    };
  } catch {
    return () => 0;
  }
}

// ---------------------------------------------------------------------------
// Axes — three coloured chalk segments with step-spaced tick marks.  Kept as a
// ghostly off-white so it reads as a chalkboard reference grid, not decoration.
// ---------------------------------------------------------------------------
function Axes({ range, step }: { range: number; step: number }) {
  const tickPoints = useMemo(() => {
    const ticks: Vec3[] = [];
    const clampStep = Math.max(step, range / 40); // avoid runaway loops
    for (let v = -range; v <= range; v += clampStep) {
      if (Math.abs(v) < 1e-6) continue;
      ticks.push([v, 0, 0], [v, 0.08, 0]);
      ticks.push([0, v, 0], [0.08, v, 0]);
      ticks.push([0, 0, v], [0, 0.08, v]);
    }
    return ticks;
  }, [range, step]);

  return (
    <group>
      <Line
        points={[
          [-range, 0, 0],
          [range, 0, 0],
        ]}
        color={CHALK_RED}
        lineWidth={1.6}
      />
      <Line
        points={[
          [0, -range, 0],
          [0, range, 0],
        ]}
        color={CHALK_GREEN}
        lineWidth={1.6}
      />
      <Line
        points={[
          [0, 0, -range],
          [0, 0, range],
        ]}
        color={CHALK_BLUE}
        lineWidth={1.6}
      />
      {tickPoints.length > 0 ? (
        <Line points={tickPoints} color={CHALK_WHITE} lineWidth={0.8} segments transparent opacity={0.5} />
      ) : null}

      <Html position={[range + 0.3, 0, 0]} center>
        <span style={labelStyle(CHALK_RED)}>x</span>
      </Html>
      <Html position={[0, range + 0.3, 0]} center>
        <span style={labelStyle(CHALK_GREEN)}>y</span>
      </Html>
      <Html position={[0, 0, range + 0.3]} center>
        <span style={labelStyle(CHALK_BLUE)}>z</span>
      </Html>
    </group>
  );
}

function labelStyle(color: string): React.CSSProperties {
  return {
    color,
    fontFamily: "'Caveat', cursive",
    fontSize: 20,
    letterSpacing: '0.04em',
    textShadow: '0 0 6px rgba(0,0,0,0.6)',
    userSelect: 'none',
    pointerEvents: 'none',
  };
}

// ---------------------------------------------------------------------------
// Ground grid — a faint chalk-white grid in the xz-plane, to anchor the scene.
// ---------------------------------------------------------------------------
function GroundGrid({ range }: { range: number }) {
  return (
    <gridHelper
      args={[range * 2, Math.max(10, Math.round(range * 2)), CHALK_WHITE, CHALK_WHITE]}
      position={[0, 0, 0]}
    />
  );
}

// ---------------------------------------------------------------------------
// Point — small sphere with an optional Html label floating beside it.
// ---------------------------------------------------------------------------
function PointMark({ pos, color, label }: { pos: Vec3; color?: string; label?: string }) {
  const c = resolveColor(color, CHALK_YELLOW);
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={c} />
      </mesh>
      {label ? (
        <Html position={[0.15, 0.15, 0]} center>
          <span style={labelStyle(c)}>{label}</span>
        </Html>
      ) : null}
    </group>
  );
}

function LineSegment({ from, to, color }: { from: Vec3; to: Vec3; color?: string }) {
  const c = resolveColor(color, CHALK_WHITE);
  return <Line points={[from, to]} color={c} lineWidth={1.4} />;
}

// ---------------------------------------------------------------------------
// Vector — line + cone arrow head.  Uses three's built-in ArrowHelper so we
// don't have to hand-roll quaternion math for the cone.
// ---------------------------------------------------------------------------
function VectorArrow({
  origin,
  direction,
  color,
  label,
}: {
  origin: Vec3;
  direction: Vec3;
  color?: string;
  label?: string;
}) {
  const c = resolveColor(color, CHALK_YELLOW);
  const arrow = useMemo(() => {
    const dir = new THREE.Vector3(direction[0], direction[1], direction[2]);
    const length = dir.length();
    const origin3 = new THREE.Vector3(origin[0], origin[1], origin[2]);
    if (length === 0) return null;
    const helper = new THREE.ArrowHelper(
      dir.clone().normalize(),
      origin3,
      length,
      new THREE.Color(c).getHex(),
      Math.min(0.3, length * 0.2),
      Math.min(0.15, length * 0.12),
    );
    return helper;
  }, [origin, direction, c]);

  const tip: Vec3 = [
    origin[0] + direction[0],
    origin[1] + direction[1],
    origin[2] + direction[2],
  ];

  return (
    <group>
      {arrow ? <primitive object={arrow} /> : null}
      {label ? (
        <Html position={[tip[0] + 0.1, tip[1] + 0.1, tip[2]]} center>
          <span style={labelStyle(c)}>{label}</span>
        </Html>
      ) : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Surface — wireframe mesh built from a grid of (x, y, f(x,y)) samples.
// We render both a translucent fill and an overlaid wireframe so the shape
// reads well even when the camera looks edge-on.
// ---------------------------------------------------------------------------
function Surface({ surface }: { surface: Surface3D }) {
  const geometry = useMemo(() => {
    const {
      fn,
      xMin,
      xMax,
      yMin,
      yMax,
      resolution,
    } = surface;
    const res = Math.max(4, Math.min(80, Math.round(resolution)));
    const compiled = compileSurfaceFn(fn);
    const geom = new THREE.PlaneGeometry(xMax - xMin, yMax - yMin, res, res);
    // Orient the plane so its normal points +z (matching our z = f(x,y) convention).
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const cx = (xMin + xMax) / 2;
    const cz = (yMin + yMax) / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx;
      const z = pos.getZ(i) + cz;
      // We treat y as the mathematical "y" (the plane's z axis after rotation),
      // and render the function value as world-y (vertical).
      const worldY = compiled(x, z);
      pos.setX(i, x);
      pos.setZ(i, z);
      pos.setY(i, worldY);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [surface]);

  const color = resolveColor(surface.color, CHALK_CYAN);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main component.
// ---------------------------------------------------------------------------
export default function ChalkBoard3D({ scene }: { scene: Scene3D }) {
  const range = scene.axes?.range ?? 5;
  const step = scene.axes?.step ?? 1;
  const cameraDist = Math.max(6, range * 2.2);

  return (
    <Canvas
      camera={{ position: [cameraDist, cameraDist * 0.8, cameraDist], fov: 45 }}
      style={{ background: '#0a0a0a', width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      {/* Soft ambient + a cool rim light — just enough to give surfaces shape
          without overpowering the chalky wireframe aesthetic. */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.4} />

      <GroundGrid range={range} />
      <Axes range={range} step={step} />

      {scene.points?.map((p, i) => (
        <PointMark key={`p-${i}`} pos={p.pos} color={p.color} label={p.label} />
      ))}
      {scene.lines?.map((l, i) => (
        <LineSegment key={`l-${i}`} from={l.from} to={l.to} color={l.color} />
      ))}
      {scene.vectors?.map((v, i) => (
        <VectorArrow
          key={`v-${i}`}
          origin={v.origin}
          direction={v.direction}
          color={v.color}
          label={v.label}
        />
      ))}
      {scene.surfaces?.map((s, i) => (
        <Surface key={`s-${i}`} surface={s} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
