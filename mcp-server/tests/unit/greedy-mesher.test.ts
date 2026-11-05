import { describe, it, expect } from 'vitest';
import { GreedyMesher, VoxelGrid2D, VoxelGrid3D } from '../../src/core/voxel/greedy-mesher.js';

describe('GreedyMesher Optimization Algorithm', () => {
  it('collapses a 4x4 solid square into exactly 1 cuboid', () => {
    // 4x4 solid square of color index 0
    const cells = new Int32Array(16);
    cells.fill(0);

    const grid: VoxelGrid2D = {
      width: 4,
      height: 4,
      cells,
    };

    const boxes = GreedyMesher.mesh2D(grid, 1, 0, false);

    // Instead of 16 cubes, greedy meshing must compress it into 1 single box!
    expect(boxes.length).toBe(1);
    expect(boxes[0].from).toEqual([0, 0, 0]);
    expect(boxes[0].to).toEqual([4, 4, 1]);
    expect(boxes[0].colorIndex).toBe(0);
  });

  it('handles transparent pixels and distinct color regions correctly', () => {
    // 3x3 grid:
    // [0, 0, -1]  <- -1 is transparent
    // [0, 0,  1]  <- 1 is another color
    // [1, 1,  1]
    const cells = new Int32Array([
      0, 0, -1,
      0, 0,  1,
      1, 1,  1,
    ]);

    const grid: VoxelGrid2D = {
      width: 3,
      height: 3,
      cells,
    };

    const boxes = GreedyMesher.mesh2D(grid, 2, 0, false);

    // Color 0 should form a 2x2 box: [0, 0] to [2, 2]
    const color0Boxes = boxes.filter((b) => b.colorIndex === 0);
    expect(color0Boxes.length).toBe(1);
    expect(color0Boxes[0].from).toEqual([0, 0, 0]);
    expect(color0Boxes[0].to).toEqual([2, 2, 2]);

    // Total non-transparent pixels = 8. Meshed boxes should be 3 (one 2x2, one 3x1, one 1x1).
    expect(boxes.length).toBeLessThan(8);
  });

  it('performs 3D greedy meshing across Z layers', () => {
    // 2x2x2 solid cube of color 0
    const cells = new Int32Array(8);
    cells.fill(0);

    const grid3D: VoxelGrid3D = {
      width: 2,
      height: 2,
      depth: 2,
      cells,
    };

    const boxes = GreedyMesher.mesh3D(grid3D);

    // 8 voxels should collapse into 1 cube [0,0,0] to [2,2,2]
    expect(boxes.length).toBe(1);
    expect(boxes[0].from).toEqual([0, 0, 0]);
    expect(boxes[0].to).toEqual([2, 2, 2]);
  });
});
