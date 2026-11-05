import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';

describe('FaceCuller (High-FPS Mod Optimization)', () => {
  it('culls touching faces between two adjacent voxels', () => {
    const builder = ModelBuilder.create({ name: 'voxel_pair' });

    // Voxel 1: [0, 0, 0] to [2, 2, 2]
    const v1 = builder.addCube({
      name: 'voxel_1',
      from: [0, 0, 0],
      to: [2, 2, 2],
    });

    // Voxel 2: [2, 0, 0] to [4, 2, 2] (touches east face of voxel 1)
    const v2 = builder.addCube({
      name: 'voxel_2',
      from: [2, 0, 0],
      to: [4, 2, 2],
    });

    // Before culling, both east and west faces are active
    expect(v1.faces.east?.enabled).not.toBe(false);
    expect(v2.faces.west?.enabled).not.toBe(false);

    // Run face culling
    const result = builder.cullHiddenFaces();

    expect(result.facesCulled).toBe(2); // Voxel 1 east face + Voxel 2 west face
    expect(v1.faces.east?.enabled).toBe(false);
    expect(v2.faces.west?.enabled).toBe(false);

    // Exterior faces (e.g. up, down, north, south) must stay active!
    expect(v1.faces.up?.enabled).not.toBe(false);
    expect(v2.faces.up?.enabled).not.toBe(false);
  });
});
