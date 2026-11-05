import { DisplayRecord } from '../types/bbmodel.types.js';

export type DisplayPresetName =
  | 'sword'
  | 'axe'
  | 'tool'
  | 'staff'
  | 'gun'
  | 'shield'
  | 'bow'
  | 'block';

export class DisplayPresets {
  static getPreset(preset: DisplayPresetName): DisplayRecord {
    switch (preset) {
      case 'sword':
        return {
          thirdperson_righthand: {
            rotation: [0, -90, 55],
            translation: [0, 3.5, 0.5],
            scale: [0.85, 0.85, 0.85],
          },
          thirdperson_lefthand: {
            rotation: [0, 90, -55],
            translation: [0, 3.5, 0.5],
            scale: [0.85, 0.85, 0.85],
          },
          firstperson_righthand: {
            rotation: [0, -90, 25],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          firstperson_lefthand: {
            rotation: [0, 90, -25],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          gui: {
            rotation: [0, 0, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 2, 0],
            scale: [0.5, 0.5, 0.5],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          head: {
            rotation: [0, 180, 0],
            translation: [0, 13, 7],
            scale: [1, 1, 1],
          },
        };

      case 'axe':
      case 'tool':
        return {
          thirdperson_righthand: {
            rotation: [0, -90, 55],
            translation: [0, 3.0, 1.0],
            scale: [0.85, 0.85, 0.85],
          },
          thirdperson_lefthand: {
            rotation: [0, 90, -55],
            translation: [0, 3.0, 1.0],
            scale: [0.85, 0.85, 0.85],
          },
          firstperson_righthand: {
            rotation: [0, -90, 25],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          firstperson_lefthand: {
            rotation: [0, 90, -25],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          gui: {
            rotation: [0, 0, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 2, 0],
            scale: [0.5, 0.5, 0.5],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        };

      case 'staff':
        return {
          thirdperson_righthand: {
            rotation: [0, -90, 45],
            translation: [0, 6.0, 0],
            scale: [1, 1, 1],
          },
          thirdperson_lefthand: {
            rotation: [0, 90, -45],
            translation: [0, 6.0, 0],
            scale: [1, 1, 1],
          },
          firstperson_righthand: {
            rotation: [0, -90, 25],
            translation: [1.5, 4.0, 1.0],
            scale: [0.75, 0.75, 0.75],
          },
          firstperson_lefthand: {
            rotation: [0, 90, -25],
            translation: [1.5, 4.0, 1.0],
            scale: [0.75, 0.75, 0.75],
          },
          gui: {
            rotation: [0, 0, -45],
            translation: [0, 0, 0],
            scale: [0.85, 0.85, 0.85],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 3, 0],
            scale: [0.6, 0.6, 0.6],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        };

      case 'gun':
        return {
          thirdperson_righthand: {
            rotation: [-90, 0, 0],
            translation: [0, 1.0, -3.0],
            scale: [0.75, 0.75, 0.75],
          },
          thirdperson_lefthand: {
            rotation: [-90, 0, 0],
            translation: [0, 1.0, -3.0],
            scale: [0.75, 0.75, 0.75],
          },
          firstperson_righthand: {
            rotation: [0, -90, 0],
            translation: [2.0, 2.5, -2.0],
            scale: [0.65, 0.65, 0.65],
          },
          firstperson_lefthand: {
            rotation: [0, 90, 0],
            translation: [-2.0, 2.5, -2.0],
            scale: [0.65, 0.65, 0.65],
          },
          gui: {
            rotation: [0, 0, 0],
            translation: [0, 0, 0],
            scale: [0.9, 0.9, 0.9],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 2, 0],
            scale: [0.5, 0.5, 0.5],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        };

      case 'shield':
        return {
          thirdperson_righthand: {
            rotation: [0, 90, 0],
            translation: [0, 4.0, 1.5],
            scale: [1, 1, 1],
          },
          thirdperson_lefthand: {
            rotation: [0, -90, 0],
            translation: [0, 4.0, 1.5],
            scale: [1, 1, 1],
          },
          firstperson_righthand: {
            rotation: [0, 180, 5],
            translation: [-1.0, 2.0, 2.0],
            scale: [1.25, 1.25, 1.25],
          },
          firstperson_lefthand: {
            rotation: [0, 180, -5],
            translation: [1.0, 2.0, 2.0],
            scale: [1.25, 1.25, 1.25],
          },
          gui: {
            rotation: [15, -25, -5],
            translation: [1.0, 1.0, 0],
            scale: [0.8, 0.8, 0.8],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 2, 0],
            scale: [0.5, 0.5, 0.5],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        };

      case 'bow':
        return {
          thirdperson_righthand: {
            rotation: [-80, 260, -40],
            translation: [-1, -2, 2.5],
            scale: [0.9, 0.9, 0.9],
          },
          thirdperson_lefthand: {
            rotation: [-80, -280, 40],
            translation: [-1, -2, 2.5],
            scale: [0.9, 0.9, 0.9],
          },
          firstperson_righthand: {
            rotation: [-10, -20, 2],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          firstperson_lefthand: {
            rotation: [-10, 20, -2],
            translation: [1.13, 3.2, 1.13],
            scale: [0.68, 0.68, 0.68],
          },
          gui: {
            rotation: [0, 0, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 2, 0],
            scale: [0.5, 0.5, 0.5],
          },
          fixed: {
            rotation: [0, 180, 0],
            translation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        };

      case 'block':
      default:
        return {
          thirdperson_righthand: {
            rotation: [75, 45, 0],
            translation: [0, 2.5, 0],
            scale: [0.375, 0.375, 0.375],
          },
          thirdperson_lefthand: {
            rotation: [75, 45, 0],
            translation: [0, 2.5, 0],
            scale: [0.375, 0.375, 0.375],
          },
          firstperson_righthand: {
            rotation: [0, 45, 0],
            translation: [0, 0, 0],
            scale: [0.4, 0.4, 0.4],
          },
          firstperson_lefthand: {
            rotation: [0, 225, 0],
            translation: [0, 0, 0],
            scale: [0.4, 0.4, 0.4],
          },
          gui: {
            rotation: [30, 225, 0],
            translation: [0, 0, 0],
            scale: [0.625, 0.625, 0.625],
          },
          ground: {
            rotation: [0, 0, 0],
            translation: [0, 3, 0],
            scale: [0.25, 0.25, 0.25],
          },
          fixed: {
            rotation: [0, 0, 0],
            translation: [0, 0, 0],
            scale: [0.5, 0.5, 0.5],
          },
        };
    }
  }
}
