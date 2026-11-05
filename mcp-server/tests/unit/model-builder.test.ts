import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';

describe('ModelBuilder AST Engine', () => {
  it('creates a new model with specified configuration', () => {
    const builder = ModelBuilder.create({
      name: 'test_golem',
      format: 'bedrock',
      resolution: { width: 128, height: 128 },
    });

    const model = builder.getModel();
    expect(model.name).toBe('test_golem');
    expect(model.meta.model_format).toBe('bedrock');
    expect(model.resolution).toEqual({ width: 128, height: 128 });
    expect(model.elements.length).toBe(0);
    expect(model.outliner.length).toBe(0);
  });

  it('adds bones and cubes with hierarchical parenting', () => {
    const builder = ModelBuilder.create({ name: 'steve' });

    // Add torso bone
    const torsoBone = builder.addBone({
      name: 'torso',
      origin: [0, 12, 0],
    });

    // Add torso cube parented to torso bone
    const torsoCube = builder.addCube(
      {
        name: 'torso_mesh',
        from: [-4, 12, -2],
        to: [4, 24, 2],
        origin: [0, 12, 0],
      },
      'torso'
    );

    const model = builder.getModel();
    expect(model.elements.length).toBe(1);
    expect(model.outliner.length).toBe(1);

    const rootBone = model.outliner[0];
    expect(typeof rootBone !== 'string').toBe(true);
    if (typeof rootBone !== 'string') {
      expect(rootBone.name).toBe('torso');
      expect(rootBone.children).toContain(torsoCube.uuid);
    }
  });

  it('mirrors a cube along X axis with inverted UV and swapped faces', () => {
    const builder = ModelBuilder.create({ name: 'mob' });

    // Add left arm
    const leftArm = builder.addCube({
      name: 'left_arm',
      from: [4, 12, -2],
      to: [8, 24, 2],
      origin: [4, 24, 0],
    });

    // Mirror to right arm across X=0
    const rightArm = builder.mirrorCube(leftArm.uuid, 'x', [0, 0, 0], 'right_arm');

    expect(rightArm.name).toBe('right_arm');
    expect(rightArm.from).toEqual([-8, 12, -2]);
    expect(rightArm.to).toEqual([-4, 24, 2]);

    // East and West faces should be swapped
    expect(rightArm.faces.east?.uv).toBeDefined();
    expect(rightArm.faces.west?.uv).toBeDefined();
  });

  it('serializes to JSON and parses back cleanly', () => {
    const builder = ModelBuilder.create({ name: 'sword' });
    builder.addCube({
      name: 'blade',
      from: [-1, 0, -1],
      to: [1, 16, 1],
    });

    const json = builder.toJSON();
    const loaded = ModelBuilder.fromJSON(json);

    expect(loaded.getModel().name).toBe('sword');
    expect(loaded.getModel().elements.length).toBe(1);
    expect(loaded.getModel().elements[0].name).toBe('blade');
  });

  it('exports to Bedrock 1.12.0 Geometry object', () => {
    const builder = ModelBuilder.create({ name: 'custom_zombie' });
    builder.addBone({ name: 'head', origin: [0, 24, 0] });
    builder.addCube(
      {
        name: 'head_cube',
        from: [-4, 24, -4],
        to: [4, 32, 4],
        origin: [0, 24, 0],
      },
      'head'
    );

    const geo = builder.toBedrockGeometry('geometry.custom_zombie');
    expect(geo.format_version).toBe('1.12.0');
    expect(geo['minecraft:geometry']).toBeDefined();
    expect(geo['minecraft:geometry']![0].description.identifier).toBe('geometry.custom_zombie');
    expect(geo['minecraft:geometry']![0].bones.length).toBe(1);
    expect(geo['minecraft:geometry']![0].bones[0].name).toBe('head');
    expect(geo['minecraft:geometry']![0].bones[0].cubes.length).toBe(1);
  });
});
