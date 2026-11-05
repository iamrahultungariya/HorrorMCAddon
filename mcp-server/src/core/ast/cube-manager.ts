import { v4 as uuidv4 } from 'uuid';
import { Element, Vector3, FacesRecord, FaceDirection, UV4 } from '../types/bbmodel.types.js';
import { Math3D } from '../utils/math3d.js';

export interface CreateCubeOptions {
  name?: string;
  from: Vector3;
  to: Vector3;
  origin?: Vector3;
  rotation?: Vector3;
  color?: number;
  box_uv?: boolean;
  inflate?: number;
  textureId?: number | string | null;
  uvOffset?: [number, number]; // [u, v] starting offset on texture
  snapToGrid?: boolean;
}

export class CubeManager {
  /**
   * Generates default cube faces with standard Minecraft integer Box UV unwrapping.
   * Standard Minecraft Box UV layout:
   * Width = size.x, Height = size.y, Depth = size.z
   * North: [u + d, v + d, u + d + w, v + d + h]
   * South: [u + 2d + w, v + d, u + 2d + 2w, v + d + h]
   * East:  [u, v + d, u + d, v + d + h]
   * West:  [u + d + w, v + d, u + 2d + w, v + d + h]
   * Up:    [u + d, v, u + d + w, v + d]
   * Down:  [u + d + w, v, u + d + 2w, v + d]
   */
  static generateDefaultFaces(
    from: Vector3,
    to: Vector3,
    uvOffset: [number, number] = [0, 0],
    textureId: number | string | null = null,
    snapInteger = true
  ): FacesRecord {
    const [u, v] = uvOffset;
    const [w, h, d] = Math3D.getSize(from, to);

    const makeUV = (u1: number, v1: number, u2: number, v2: number): UV4 => {
      const raw: UV4 = [u1, v1, u2, v2];
      return snapInteger ? Math3D.snapUV(raw, 1) : raw;
    };

    return {
      up: {
        uv: makeUV(u + d, v, u + d + w, v + d),
        texture: textureId,
      },
      down: {
        uv: makeUV(u + d + w, v, u + d + 2 * w, v + d),
        texture: textureId,
      },
      east: {
        uv: makeUV(u, v + d, u + d, v + d + h),
        texture: textureId,
      },
      north: {
        uv: makeUV(u + d, v + d, u + d + w, v + d + h),
        texture: textureId,
      },
      west: {
        uv: makeUV(u + d + w, v + d, u + 2 * d + w, v + d + h),
        texture: textureId,
      },
      south: {
        uv: makeUV(u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h),
        texture: textureId,
      },
    };
  }

  /**
   * Creates a new Element (Cube) with valid normalized bounds, integer UVs, and UUID.
   */
  static createCube(options: CreateCubeOptions): Element {
    const { from, to } = Math3D.normalizeBounds(options.from, options.to);
    const snap = options.snapToGrid ?? true;

    const snappedFrom = snap ? Math3D.snapVector3(from, 0.5) : from;
    const snappedTo = snap ? Math3D.snapVector3(to, 0.5) : to;
    const origin = options.origin ?? Math3D.getCenter(snappedFrom, snappedTo);

    const faces = CubeManager.generateDefaultFaces(
      snappedFrom,
      snappedTo,
      options.uvOffset ?? [0, 0],
      options.textureId ?? null,
      true
    );

    const element: Element = {
      name: options.name ?? 'cube',
      type: 'cube',
      uuid: uuidv4(),
      from: snappedFrom,
      to: snappedTo,
      origin: snap ? Math3D.snapVector3(origin, 0.5) : origin,
      faces,
      box_uv: options.box_uv ?? false,
    };

    if (options.rotation) {
      element.rotation = options.rotation;
    }
    if (options.color !== undefined) {
      element.color = options.color;
    }
    if (options.inflate !== undefined) {
      element.inflate = options.inflate;
    }

    return element;
  }

  /**
   * Mirrors an existing cube along the X, Y, or Z axis around a pivot point.
   * Correctly mirrors bounds, origin, and swaps opposite face orientations (e.g., East <-> West on X axis).
   */
  static mirrorCube(
    cube: Element,
    axis: 'x' | 'y' | 'z',
    pivot: Vector3 = [0, 0, 0],
    newName?: string
  ): Element {
    const { from: newFrom, to: newTo } = Math3D.mirrorBox(cube.from, cube.to, axis, pivot);

    // Mirror origin
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const newOrigin: Vector3 = [...cube.origin];
    newOrigin[axisIndex] = 2 * pivot[axisIndex] - cube.origin[axisIndex];

    // Invert rotation on mirrored axes
    let newRotation: Vector3 | undefined = undefined;
    if (cube.rotation) {
      newRotation = [...cube.rotation];
      if (axis === 'x') {
        newRotation[1] = -newRotation[1]; // Invert Y rot
        newRotation[2] = -newRotation[2]; // Invert Z rot
      } else if (axis === 'y') {
        newRotation[0] = -newRotation[0];
        newRotation[2] = -newRotation[2];
      } else if (axis === 'z') {
        newRotation[0] = -newRotation[0];
        newRotation[1] = -newRotation[1];
      }
    }

    // Mirror faces: swap opposite faces if mirroring along that axis
    const oldFaces = cube.faces;
    const newFaces: FacesRecord = { ...oldFaces };

    if (axis === 'x') {
      // East and West swap
      newFaces.east = oldFaces.west ? { ...oldFaces.west } : undefined;
      newFaces.west = oldFaces.east ? { ...oldFaces.east } : undefined;
      // Invert horizontal UV on North, South, Up, Down
      const invertU = (uv: UV4): UV4 => [uv[2], uv[1], uv[0], uv[3]];
      if (newFaces.north) newFaces.north.uv = invertU(newFaces.north.uv);
      if (newFaces.south) newFaces.south.uv = invertU(newFaces.south.uv);
      if (newFaces.up) newFaces.up.uv = invertU(newFaces.up.uv);
      if (newFaces.down) newFaces.down.uv = invertU(newFaces.down.uv);
    }

    return {
      ...cube,
      uuid: uuidv4(),
      name: newName ?? `${cube.name}_mirrored`,
      from: newFrom,
      to: newTo,
      origin: newOrigin,
      rotation: newRotation,
      faces: newFaces,
    };
  }
}
