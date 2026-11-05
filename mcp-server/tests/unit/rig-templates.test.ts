import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { RigTemplates } from '../../src/core/rigging/rig-templates.js';

describe('RigTemplates (Skeletons & Rigs)', () => {
  it('builds standard Humanoid (Biped) rig with correct bone hierarchy', () => {
    const builder = ModelBuilder.create({ name: 'biped_mob' });
    const { bones } = RigTemplates.applyBipedRig(builder, {
      slimArms: false,
      includeSampleCubes: true,
    });

    const boneNames = bones.map((b) => b.name);
    expect(boneNames).toContain('root');
    expect(boneNames).toContain('body');
    expect(boneNames).toContain('head');
    expect(boneNames).toContain('right_arm');
    expect(boneNames).toContain('left_arm');
    expect(boneNames).toContain('right_leg');
    expect(boneNames).toContain('left_leg');

    // Verify sample cubes were placed inside bones
    expect(builder.getModel().elements.length).toBe(6);
    expect(builder.findCube('head_cube')).toBeDefined();
    expect(builder.findCube('body_cube')).toBeDefined();
  });

  it('builds Quadruped rig with 4 leg joints and body', () => {
    const builder = ModelBuilder.create({ name: 'wolf_mob' });
    const { bones } = RigTemplates.applyQuadrupedRig(builder, {
      includeSampleCubes: true,
    });

    const boneNames = bones.map((b) => b.name);
    expect(boneNames).toContain('leg1');
    expect(boneNames).toContain('leg2');
    expect(boneNames).toContain('leg3');
    expect(boneNames).toContain('leg4');

    expect(builder.getModel().elements.length).toBe(6);
  });

  it('builds GeckoLib 3D player armor set with standard bone names and inflation', () => {
    const builder = ModelBuilder.create({ name: 'ruby_armor' });
    const { bones } = RigTemplates.applyArmorRig(builder, {
      armorParts: ['helmet', 'chestplate', 'leggings', 'boots'],
      inflate: 0.5,
    });

    const boneNames = bones.map((b) => b.name);
    expect(boneNames).toContain('armorHead');
    expect(boneNames).toContain('armorBody');
    expect(boneNames).toContain('armorRightArm');
    expect(boneNames).toContain('armorLeftArm');
    expect(boneNames).toContain('armorRightLeg');
    expect(boneNames).toContain('armorLeftLeg');
    expect(boneNames).toContain('armorRightBoot');
    expect(boneNames).toContain('armorLeftBoot');

    // Verify inflation parameter on helmet
    const helmetCube = builder.findCube('helmet_cube');
    expect(helmetCube).toBeDefined();
    expect(helmetCube?.inflate).toBeGreaterThanOrEqual(0.5);
  });
});
