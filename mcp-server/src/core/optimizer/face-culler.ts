import { Element, FaceDirection } from '../types/bbmodel.types.js';
import { Math3D } from '../utils/math3d.js';

export interface CullingResult {
  totalFacesChecked: number;
  facesCulled: number;
  culledFacesPercentage: number;
  elementsModified: number;
}

export class FaceCuller {
  /**
   * Scans a list of elements/cubes and culls (disables) internal/hidden faces
   * that are fully occluded by adjacent touching cubes.
   *
   * Crucial for Minecraft mod performance: prevents rendering faces that players will never see.
   */
  static cullHiddenFaces(elements: Element[]): CullingResult {
    let totalFacesChecked = 0;
    let facesCulled = 0;
    const modifiedElementUuids = new Set<string>();

    const directions: FaceDirection[] = ['north', 'south', 'east', 'west', 'up', 'down'];

    for (let i = 0; i < elements.length; i++) {
      const cubeA = elements[i];
      if (!cubeA.faces) continue;

      for (const dir of directions) {
        const face = cubeA.faces[dir];
        if (!face || face.enabled === false) continue;

        totalFacesChecked++;

        // Check if any other cubeB completely covers this face of cubeA
        for (let j = 0; j < elements.length; j++) {
          if (i === j) continue;
          const cubeB = elements[j];

          // Face touching check
          const touch = Math3D.checkFaceTouch(
            { from: cubeA.from, to: cubeA.to },
            { from: cubeB.from, to: cubeB.to },
            dir
          );

          if (touch.touches && touch.fullCover) {
            // Face is completely occluded from the outside
            face.enabled = false;
            facesCulled++;
            modifiedElementUuids.add(cubeA.uuid);
            break; // No need to check other cubes for this face
          }
        }
      }
    }

    const percentage = totalFacesChecked > 0 ? (facesCulled / totalFacesChecked) * 100 : 0;

    return {
      totalFacesChecked,
      facesCulled,
      culledFacesPercentage: Math.round(percentage * 10) / 10,
      elementsModified: modifiedElementUuids.size,
    };
  }

  /**
   * Re-enables all faces across all elements (undo culling).
   */
  static restoreAllFaces(elements: Element[]): number {
    let restored = 0;
    const directions: FaceDirection[] = ['north', 'south', 'east', 'west', 'up', 'down'];
    for (const el of elements) {
      if (!el.faces) continue;
      for (const dir of directions) {
        const f = el.faces[dir];
        if (f && f.enabled === false) {
          f.enabled = true;
          restored++;
        }
      }
    }
    return restored;
  }
}
