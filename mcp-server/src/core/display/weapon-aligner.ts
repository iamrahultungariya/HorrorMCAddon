import { ModelBuilder } from '../ast/model-builder.js';
import { Vector3 } from '../types/bbmodel.types.js';
import { DisplayPresets, DisplayPresetName } from './display-presets.js';
import { Math3D } from '../utils/math3d.js';

export type GripPosition = 'bottom_left' | 'bottom_center' | 'center' | 'top_center';

export class WeaponAligner {
  /**
   * Aligns the weapon model so that its grip position (hilt/handle)
   * rests at the specified pivot origin, and applies standard Minecraft display transformations.
   */
  static alignAndPreset(
    builder: ModelBuilder,
    options: {
      preset?: DisplayPresetName;
      grip?: GripPosition;
      customGripPoint?: Vector3;
    } = {}
  ): { shiftedOffset: Vector3; presetApplied: DisplayPresetName } {
    const model = builder.getModel();
    const preset = options.preset ?? 'sword';

    // 1. Calculate the overall bounding box of the model
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

    if (minX === Infinity) {
      // Model is empty
      return { shiftedOffset: [0, 0, 0], presetApplied: preset };
    }

    // 2. Determine target grip point
    let gripX = (minX + maxX) / 2;
    let gripY = minY;
    let gripZ = (minZ + maxZ) / 2;

    if (options.customGripPoint) {
      [gripX, gripY, gripZ] = options.customGripPoint;
    } else {
      switch (options.grip ?? 'bottom_left') {
        case 'bottom_left':
          // Standard diagonal Minecraft sword: handle is at lower-left
          gripX = minX + (maxX - minX) * 0.15;
          gripY = minY + (maxY - minY) * 0.15;
          break;
        case 'bottom_center':
          gripX = (minX + maxX) / 2;
          gripY = minY;
          break;
        case 'center':
          gripX = (minX + maxX) / 2;
          gripY = (minY + maxY) / 2;
          break;
        case 'top_center':
          gripX = (minX + maxX) / 2;
          gripY = maxY;
          break;
      }
    }

    // Shift offset to move grip to origin [0, 0, 0]
    const shiftX = -gripX;
    const shiftY = -gripY;
    const shiftZ = -gripZ;
    const shiftedOffset: Vector3 = [shiftX, shiftY, shiftZ];

    // 3. Shift all elements and origins
    for (const el of model.elements) {
      el.from = [el.from[0] + shiftX, el.from[1] + shiftY, el.from[2] + shiftZ];
      el.to = [el.to[0] + shiftX, el.to[1] + shiftY, el.to[2] + shiftZ];
      el.origin = [el.origin[0] + shiftX, el.origin[1] + shiftY, el.origin[2] + shiftZ];
    }

    // 4. Apply display preset to the model
    model.display = DisplayPresets.getPreset(preset);

    return { shiftedOffset, presetApplied: preset };
  }
}
