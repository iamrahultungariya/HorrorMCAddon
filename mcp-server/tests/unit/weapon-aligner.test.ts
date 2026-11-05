import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { WeaponAligner } from '../../src/core/display/weapon-aligner.js';

describe('WeaponAligner (Hand Grip Calibration)', () => {
  it('aligns a sword with bottom-left grip and applies sword display preset', () => {
    const builder = ModelBuilder.create({ name: 'ruby_sword' });

    // Handle at [0, 0, 0] to [2, 4, 1]
    builder.addCube({
      name: 'handle',
      from: [0, 0, 0],
      to: [2, 4, 1],
    });

    // Blade extending up to [10, 16, 1]
    builder.addCube({
      name: 'blade',
      from: [2, 4, 0],
      to: [10, 16, 1],
    });

    const result = WeaponAligner.alignAndPreset(builder, {
      preset: 'sword',
      grip: 'bottom_left',
    });

    expect(result.presetApplied).toBe('sword');
    expect(builder.getModel().display).toBeDefined();
    expect(builder.getModel().display?.firstperson_righthand).toBeDefined();

    // Verify coordinates shifted so handle is at origin
    const handle = builder.findCube('handle');
    expect(handle).toBeDefined();
    expect(handle!.from[0]).toBeLessThanOrEqual(0);
  });

  it('aligns a vertical staff with bottom-center grip', () => {
    const builder = ModelBuilder.create({ name: 'mage_staff' });

    // Vertical shaft from [-1, 0, -1] to [1, 24, 1]
    builder.addCube({
      name: 'shaft',
      from: [-1, 0, -1],
      to: [1, 24, 1],
    });

    const result = WeaponAligner.alignAndPreset(builder, {
      preset: 'staff',
      grip: 'bottom_center',
    });

    expect(result.presetApplied).toBe('staff');
    const shaft = builder.findCube('shaft');
    expect(shaft).toBeDefined();
    expect(shaft!.from[1]).toBe(0); // lowest Y at 0
  });
});
