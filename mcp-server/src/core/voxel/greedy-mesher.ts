import { Vector3 } from '../types/bbmodel.types.js';

export interface VoxelBox {
  from: Vector3;
  to: Vector3;
  colorIndex: number;
}

export interface VoxelGrid2D {
  width: number;
  height: number;
  // -1 represents transparent / empty, >= 0 is palette index
  cells: Int32Array;
}

export interface VoxelGrid3D {
  width: number;
  height: number;
  depth: number;
  // 1D array of size width * height * depth
  cells: Int32Array;
}

export class GreedyMesher {
  /**
   * Performs 2D Greedy Meshing across a pixel/voxel grid and extrudes along Z.
   * Collapses contiguous pixels of the same color into minimal rectangular boxes.
   *
   * @param grid 2D grid with palette indices
   * @param depth Extrusion thickness along Z (default 1)
   * @param zOffset Starting Z offset (default 0)
   * @param flipY Flip Y-axis so pixel art top corresponds to top of 3D model
   */
  static mesh2D(
    grid: VoxelGrid2D,
    depth = 1,
    zOffset = 0,
    flipY = true
  ): VoxelBox[] {
    const { width, height, cells } = grid;
    const visited = new Uint8Array(width * height);
    const boxes: VoxelBox[] = [];

    const getCell = (x: number, y: number) => cells[y * width + x];
    const isVisited = (x: number, y: number) => visited[y * width + x] === 1;
    const markVisited = (x: number, y: number) => {
      visited[y * width + x] = 1;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isVisited(x, y)) continue;

        const colorIndex = getCell(x, y);
        if (colorIndex < 0) {
          // Transparent / empty
          markVisited(x, y);
          continue;
        }

        // 1. Expand horizontally (find width W)
        let w = 1;
        while (x + w < width && !isVisited(x + w, y) && getCell(x + w, y) === colorIndex) {
          w++;
        }

        // 2. Expand vertically (find height H)
        let h = 1;
        while (y + h < height) {
          let canExpandRow = true;
          for (let k = 0; k < w; k++) {
            if (isVisited(x + k, y + h) || getCell(x + k, y + h) !== colorIndex) {
              canExpandRow = false;
              break;
            }
          }
          if (!canExpandRow) break;
          h++;
        }

        // 3. Mark all covered cells as visited
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            markVisited(x + dx, y + dy);
          }
        }

        // 4. Calculate 3D coordinates
        // If flipY is true, y=0 (top of image) maps to highest 3D Y coordinate
        const yStart = flipY ? height - (y + h) : y;
        const yEnd = flipY ? height - y : y + h;

        boxes.push({
          from: [x, yStart, zOffset],
          to: [x + w, yEnd, zOffset + depth],
          colorIndex,
        });
      }
    }

    return boxes;
  }

  /**
   * Performs full 3D Greedy Meshing across a 3D voxel grid.
   * Iterates layer by layer along Z and merges boxes.
   */
  static mesh3D(grid: VoxelGrid3D): VoxelBox[] {
    const { width, height, depth, cells } = grid;
    const boxes: VoxelBox[] = [];

    // Slice along Z-axis
    for (let z = 0; z < depth; z++) {
      const slice2D: VoxelGrid2D = {
        width,
        height,
        cells: new Int32Array(width * height),
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx3D = z * (width * height) + y * width + x;
          slice2D.cells[y * width + x] = cells[idx3D];
        }
      }

      // Run 2D mesher on this slice
      const layerBoxes = this.mesh2D(slice2D, 1, z, false);
      boxes.push(...layerBoxes);
    }

    // Now merge adjacent identical boxes along Z
    return this.mergeAlongZ(boxes);
  }

  /**
   * Merges boxes that share identical X and Y bounds and color across consecutive Z layers.
   */
  private static mergeAlongZ(boxes: VoxelBox[]): VoxelBox[] {
    const merged: VoxelBox[] = [];
    const used = new Uint8Array(boxes.length);

    for (let i = 0; i < boxes.length; i++) {
      if (used[i]) continue;
      const current = { ...boxes[i] };
      used[i] = 1;

      // Look for a box directly adjacent in +Z with identical X, Y and color
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < boxes.length; j++) {
          if (used[j]) continue;
          const candidate = boxes[j];

          if (
            candidate.colorIndex === current.colorIndex &&
            candidate.from[0] === current.from[0] &&
            candidate.to[0] === current.to[0] &&
            candidate.from[1] === current.from[1] &&
            candidate.to[1] === current.to[1] &&
            candidate.from[2] === current.to[2] // Touches on Z
          ) {
            current.to[2] = candidate.to[2]; // Extend Z
            used[j] = 1;
            changed = true;
            break;
          }
        }
      }

      merged.push(current);
    }

    return merged;
  }
}
