import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';

describe('Bedrock Engine Rules Validator & Auto-Fixer', () => {
  it('detects Bedrock multi-axis rotation errors on individual cubes', () => {
    const builder = ModelBuilder.create({ name: 'illegal_cube' });

    builder.addCube({
      name: 'broken_rot_cube',
      from: [0, 0, 0],
      to: [4, 4, 4],
      rotation: [15, 22.5, 0], // Illegal on single cube in Bedrock!
    });

    const report = builder.validate();
    expect(report.isValid).toBe(false);
    expect(report.errorsCount).toBe(1);
    expect(report.issues[0].code).toBe('BEDROCK_MULTI_AXIS_CUBE_ROTATION');
  });

  it('auto-fixes multi-axis rotations by isolating cube into dedicated parent bone', () => {
    const builder = ModelBuilder.create({ name: 'fixable_model' });

    const cube = builder.addCube({
      name: 'tilted_horn',
      from: [0, 0, 0],
      to: [2, 6, 2],
      rotation: [22.5, 45, 0],
      origin: [0, 0, 0],
    });

    // Auto-fix
    const fixResult = builder.autoFix();
    expect(fixResult.fixedIssuesCount).toBeGreaterThan(0);

    // Cube rotation should now be cleared
    expect(cube.rotation).toBeUndefined();

    // Model must now be valid!
    const reportAfter = builder.validate();
    expect(reportAfter.isValid).toBe(true);
    expect(reportAfter.errorsCount).toBe(0);

    // The bone created should hold the rotation
    const bone = builder.findBone('tilted_horn_pivot');
    expect(bone).toBeDefined();
    expect(bone?.rotation).toEqual([22.5, 45, 0]);
  });

  it('detects and removes zero-volume elements', () => {
    const builder = ModelBuilder.create({ name: 'zero_vol' });

    builder.addCube({
      name: 'flat_sheet',
      from: [0, 0, 0],
      to: [4, 0, 4], // height = 0!
    });

    const report = builder.validate();
    expect(report.errorsCount).toBe(1);
    expect(report.issues[0].code).toBe('ZERO_VOLUME_ELEMENT');

    builder.autoFix();
    expect(builder.getModel().elements.length).toBe(0);
  });
});
