// ---------------------------------------------------------------------------
// 3D scene schema for the three.js chalkboard mode.
//
// The 3D mode lives in a parallel universe to the 2D Blueprint pipeline — it
// has its own API route (/api/generate-3d), its own renderer (ChalkBoard3D),
// and its own page (/canvas-3d).  We keep the types isolated so the 2D schema
// in types.ts stays focused on chalkboard drawings.
// ---------------------------------------------------------------------------

/** Cartesian 3-vector. Unit-less in the scene graph; the renderer frames it. */
export type Vec3 = [number, number, number];

export interface Point3D {
  pos: Vec3;
  label?: string;
  color?: string;
}

export interface Line3D {
  from: Vec3;
  to: Vec3;
  color?: string;
}

export interface Vector3D {
  origin: Vec3;
  direction: Vec3;
  color?: string;
  label?: string;
}

export interface Surface3D {
  /** JS expression in (x, y) — evaluated against a sandboxed function. */
  fn: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  resolution: number;
  color?: string;
}

export interface Scene3D {
  title: string;
  axes: { range: number; step: number };
  points?: Point3D[];
  lines?: Line3D[];
  vectors?: Vector3D[];
  surfaces?: Surface3D[];
}
