import { Vector3, UV4, FaceDirection } from '../types/bbmodel.types.js';

export interface BoundingBox3D {
  from: Vector3;
  to: Vector3;
}

export const EPSILON = 0.0001;

export class Math3D {
  static readonly EPSILON = 0.0001;
  /**
   * Snaps a floating point number to the nearest multiple of step.
   * Default step is 1 (for integer UV and pixel snapping).
   */
  static snap(value: number, step = 1): number {
    return Math.round(value / step) * step;
  }

  /**
   * Snaps a 3-element vector.
   */
  static snapVector3(v: Vector3, step = 1): Vector3 {
    return [this.snap(v[0], step), this.snap(v[1], step), this.snap(v[2], step)];
  }

  /**
   * Snaps a 4-element UV tuple [u1, v1, u2, v2].
   */
  static snapUV(uv: UV4, step = 1): UV4 {
    return [this.snap(uv[0], step), this.snap(uv[1], step), this.snap(uv[2], step), this.snap(uv[3], step)];
  }

  /**
   * Computes dimensions [width, height, depth] from [from, to] vectors.
   */
  static getSize(from: Vector3, to: Vector3): Vector3 {
    return [Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]), Math.abs(to[2] - from[2])];
  }

  /**
   * Computes the center point of a bounding box.
   */
  static getCenter(from: Vector3, to: Vector3): Vector3 {
    return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  }

  /**
   * Computes volume of a bounding box.
   */
  static getVolume(from: Vector3, to: Vector3): number {
    const [w, h, d] = this.getSize(from, to);
    return w * h * d;
  }

  /**
   * Normalizes min and max coordinates so that from <= to on all axes.
   */
  static normalizeBounds(from: Vector3, to: Vector3): { from: Vector3; to: Vector3 } {
    return {
      from: [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.min(from[2], to[2])],
      to: [Math.max(from[0], to[0]), Math.max(from[1], to[1]), Math.max(from[2], to[2])],
    };
  }

  /**
   * Checks if two numbers are approximately equal within epsilon.
   */
  static approxEquals(a: number, b: number, eps = EPSILON): boolean {
    return Math.abs(a - b) <= eps;
  }

  /**
   * Checks if two vectors are approximately equal.
   */
  static approxEqualsVector3(a: Vector3, b: Vector3, eps = EPSILON): boolean {
    return this.approxEquals(a[0], b[0], eps) && this.approxEquals(a[1], b[1], eps) && this.approxEquals(a[2], b[2], eps);
  }

  /**
   * Detects if faceA of boxA is coplanar and fully/partially covered by faceB of boxB.
   * Useful for internal face culling and z-fighting detection.
   */
  static checkFaceTouch(
    boxA: BoundingBox3D,
    boxB: BoundingBox3D,
    direction: FaceDirection
  ): { touches: boolean; overlapArea: number; fullCover: boolean } {
    const a = this.normalizeBounds(boxA.from, boxA.to);
    const b = this.normalizeBounds(boxB.from, boxB.to);

    let isCoplanar = false;
    let overlapArea = 0;
    let fullCover = false;

    // Check plane collision based on direction
    switch (direction) {
      case 'east': // positive X (+X of boxA touches -X of boxB)
        if (this.approxEquals(a.to[0], b.from[0])) {
          isCoplanar = true;
          const yOverlap = Math.max(0, Math.min(a.to[1], b.to[1]) - Math.max(a.from[1], b.from[1]));
          const zOverlap = Math.max(0, Math.min(a.to[2], b.to[2]) - Math.max(a.from[2], b.from[2]));
          overlapArea = yOverlap * zOverlap;
          const faceAreaA = (a.to[1] - a.from[1]) * (a.to[2] - a.from[2]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;

      case 'west': // negative X (-X of boxA touches +X of boxB)
        if (this.approxEquals(a.from[0], b.to[0])) {
          isCoplanar = true;
          const yOverlap = Math.max(0, Math.min(a.to[1], b.to[1]) - Math.max(a.from[1], b.from[1]));
          const zOverlap = Math.max(0, Math.min(a.to[2], b.to[2]) - Math.max(a.from[2], b.from[2]));
          overlapArea = yOverlap * zOverlap;
          const faceAreaA = (a.to[1] - a.from[1]) * (a.to[2] - a.from[2]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;

      case 'up': // positive Y (+Y of boxA touches -Y of boxB)
        if (this.approxEquals(a.to[1], b.from[1])) {
          isCoplanar = true;
          const xOverlap = Math.max(0, Math.min(a.to[0], b.to[0]) - Math.max(a.from[0], b.from[0]));
          const zOverlap = Math.max(0, Math.min(a.to[2], b.to[2]) - Math.max(a.from[2], b.from[2]));
          overlapArea = xOverlap * zOverlap;
          const faceAreaA = (a.to[0] - a.from[0]) * (a.to[2] - a.from[2]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;

      case 'down': // negative Y (-Y of boxA touches +Y of boxB)
        if (this.approxEquals(a.from[1], b.to[1])) {
          isCoplanar = true;
          const xOverlap = Math.max(0, Math.min(a.to[0], b.to[0]) - Math.max(a.from[0], b.from[0]));
          const zOverlap = Math.max(0, Math.min(a.to[2], b.to[2]) - Math.max(a.from[2], b.from[2]));
          overlapArea = xOverlap * zOverlap;
          const faceAreaA = (a.to[0] - a.from[0]) * (a.to[2] - a.from[2]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;

      case 'south': // positive Z (+Z of boxA touches -Z of boxB)
        if (this.approxEquals(a.to[2], b.from[2])) {
          isCoplanar = true;
          const xOverlap = Math.max(0, Math.min(a.to[0], b.to[0]) - Math.max(a.from[0], b.from[0]));
          const yOverlap = Math.max(0, Math.min(a.to[1], b.to[1]) - Math.max(a.from[1], b.from[1]));
          overlapArea = xOverlap * yOverlap;
          const faceAreaA = (a.to[0] - a.from[0]) * (a.to[1] - a.from[1]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;

      case 'north': // negative Z (-Z of boxA touches +Z of boxB)
        if (this.approxEquals(a.from[2], b.to[2])) {
          isCoplanar = true;
          const xOverlap = Math.max(0, Math.min(a.to[0], b.to[0]) - Math.max(a.from[0], b.from[0]));
          const yOverlap = Math.max(0, Math.min(a.to[1], b.to[1]) - Math.max(a.from[1], b.from[1]));
          overlapArea = xOverlap * yOverlap;
          const faceAreaA = (a.to[0] - a.from[0]) * (a.to[1] - a.from[1]);
          fullCover = this.approxEquals(overlapArea, faceAreaA) && overlapArea > 0;
        }
        break;
    }

    return {
      touches: isCoplanar && overlapArea > 0,
      overlapArea,
      fullCover,
    };
  }

  /**
   * Mirrors a 3D box along specified axis around a pivot point.
   */
  static mirrorBox(
    from: Vector3,
    to: Vector3,
    axis: 'x' | 'y' | 'z',
    pivot: Vector3 = [0, 0, 0]
  ): { from: Vector3; to: Vector3 } {
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const p = pivot[axisIndex];

    const newFrom: Vector3 = [...from];
    const newTo: Vector3 = [...to];

    // Mirror formula: x' = 2*p - x
    const mirroredFrom = 2 * p - from[axisIndex];
    const mirroredTo = 2 * p - to[axisIndex];

    newFrom[axisIndex] = mirroredFrom;
    newTo[axisIndex] = mirroredTo;

    return this.normalizeBounds(newFrom, newTo);
  }
}
