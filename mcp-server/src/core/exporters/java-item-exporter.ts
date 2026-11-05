import { ModelBuilder } from '../ast/model-builder.js';
import { JavaItemModel, JavaElement, JavaElementRotation } from '../types/java-item.types.js';
import { Math3D } from '../utils/math3d.js';
import { FaceDirection, UV4 } from '../types/bbmodel.types.js';

export interface JavaItemExportOptions {
  modId?: string;
  texturePath?: string; // e.g. "item/ruby_sword" -> becomes "<modId>:item/ruby_sword"
  parent?: string; // e.g. "item/handheld" or "minecraft:item/generated"
  centerInBlock?: boolean; // Shifts coordinates into standard 0..16 Minecraft block box
}

export class JavaItemExporter {
  /**
   * Snaps an angle to the closest allowed Minecraft Java element rotation angle:
   * -45, -22.5, 0, 22.5, 45.
   */
  static snapJavaAngle(angle: number): -45 | -22.5 | 0 | 22.5 | 45 {
    type JavaAngle = -45 | -22.5 | 0 | 22.5 | 45;
    const allowed: readonly JavaAngle[] = [-45, -22.5, 0, 22.5, 45];
    let closest: JavaAngle = allowed[0];
    let minDiff = Math.abs(angle - closest);

    for (const a of allowed) {
      const diff = Math.abs(angle - a);
      if (diff < minDiff) {
        minDiff = diff;
        closest = a;
      }
    }
    return closest;
  }

  /**
   * Converts a BBModel in ModelBuilder into standard Minecraft Java Item Model JSON.
   */
  static exportToJSON(
    builder: ModelBuilder,
    options: JavaItemExportOptions = {}
  ): JavaItemModel {
    const model = builder.getModel();
    const modId = options.modId ?? 'mymod';
    const texturePath = options.texturePath ?? `item/${model.name}`;
    const fullTextureIdentifier = `${modId}:${texturePath}`;

    // Textures record
    const textures: Record<string, string> = {
      '0': fullTextureIdentifier,
      layer0: fullTextureIdentifier,
    };

    const elements: JavaElement[] = [];

    // Optional centering shift: shift bounds so model fits inside [0..16]
    let shiftX = 0;
    let shiftY = 0;
    let shiftZ = 0;

    if (options.centerInBlock) {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      for (const el of model.elements) {
        minX = Math.min(minX, el.from[0], el.to[0]);
        minY = Math.min(minY, el.from[1], el.to[1]);
        minZ = Math.min(minZ, el.from[2], el.to[2]);

        maxX = Math.max(maxX, el.from[0], el.to[0]);
        maxY = Math.max(maxY, el.from[1], el.to[1]);
        maxZ = Math.max(maxZ, el.from[2], el.to[2]);
      }

      if (minX !== Infinity) {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        shiftX = 8 - centerX;
        shiftY = 8 - centerY;
        shiftZ = 8 - centerZ;
      }
    }

    const directions: FaceDirection[] = ['north', 'south', 'east', 'west', 'up', 'down'];

    for (const el of model.elements) {
      const from: [number, number, number] = [
        el.from[0] + shiftX,
        el.from[1] + shiftY,
        el.from[2] + shiftZ,
      ];
      const to: [number, number, number] = [
        el.to[0] + shiftX,
        el.to[1] + shiftY,
        el.to[2] + shiftZ,
      ];

      // Convert faces
      const faces: JavaElement['faces'] = {};

      for (const dir of directions) {
        const face = el.faces[dir];
        if (!face || face.enabled === false) continue;

        // In Java JSON format, UV coordinates are normalized or 0..16
        const uv: UV4 = face.uv ? [...face.uv] : [0, 0, 16, 16];

        faces[dir] = {
          uv,
          texture: '#0',
          cullface: face.cullface,
          rotation: face.rotation,
          tintindex: face.tintindex,
        };
      }

      // If all faces were culled, skip element
      if (Object.keys(faces).length === 0) continue;

      const javaEl: JavaElement = {
        name: el.name,
        from,
        to,
        faces,
      };

      // Process rotation (Java only supports 1 axis of rotation per element)
      if (el.rotation) {
        const [rx, ry, rz] = el.rotation;
        const absX = Math.abs(rx);
        const absY = Math.abs(ry);
        const absZ = Math.abs(rz);

        let axis: 'x' | 'y' | 'z' = 'y';
        let rawAngle = 0;

        if (absX >= absY && absX >= absZ && absX > Math3D.EPSILON) {
          axis = 'x';
          rawAngle = rx;
        } else if (absY >= absX && absY >= absZ && absY > Math3D.EPSILON) {
          axis = 'y';
          rawAngle = ry;
        } else if (absZ > Math3D.EPSILON) {
          axis = 'z';
          rawAngle = rz;
        }

        if (Math.abs(rawAngle) > Math3D.EPSILON) {
          const snappedAngle = this.snapJavaAngle(rawAngle);
          const origin: [number, number, number] = [
            el.origin[0] + shiftX,
            el.origin[1] + shiftY,
            el.origin[2] + shiftZ,
          ];

          const rotationDef: JavaElementRotation = {
            origin,
            axis,
            angle: snappedAngle,
          };

          javaEl.rotation = rotationDef;
        }
      }

      elements.push(javaEl);
    }

    const javaItem: JavaItemModel = {
      parent: options.parent,
      textures,
      elements,
      display: model.display,
    };

    return javaItem;
  }
}
