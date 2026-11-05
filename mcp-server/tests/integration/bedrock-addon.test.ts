import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { RigTemplates } from '../../src/core/rigging/rig-templates.js';
import { ProceduralAnimator } from '../../src/core/animation/procedural-animator.js';
import { BedrockAddonGenerator } from '../../src/core/bedrock/bedrock-addon-generator.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Bedrock Addon Full End-to-End Pipeline', () => {
  const testOutputDir = path.resolve('./tests/temp_addon');

  it('generates a complete MCPE Addon with RP, BP, textures, animations, and bundles into .mcaddon', async () => {
    // 1. Create Model with Biped Rig
    const builder = ModelBuilder.create({
      name: 'crystal_warrior',
      format: 'bedrock',
      resolution: { width: 64, height: 64 },
    });

    RigTemplates.applyBipedRig(builder, {
      slimArms: false,
      includeSampleCubes: true,
    });

    // 2. Synthesize walk and idle animations
    const { geckolibAnim: walkAnim } = ProceduralAnimator.generateBipedAnimation('crystal_warrior', 'walk');
    const { geckolibAnim: idleAnim } = ProceduralAnimator.generateBipedAnimation('crystal_warrior', 'idle');

    // 3. Generate Complete Addon
    const result = await BedrockAddonGenerator.generateAddon(builder, {
      outputDirectory: testOutputDir,
      entityName: 'crystal_warrior',
      namespace: 'crystal_mod',
      behaviorPreset: 'hostile_mob',
      health: 60,
      attackDamage: 9,
      bundleMcaddon: true,
      animations: {
        'animation.crystal_warrior.walk': walkAnim,
        'animation.crystal_warrior.idle': idleAnim,
      },
    });

    expect(result.identifier).toBe('crystal_mod:crystal_warrior');
    expect(result.filesGenerated.length).toBeGreaterThan(6);

    // Verify RP files exist
    expect(fs.existsSync(path.join(result.rpDirectory, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'models', 'entity', 'crystal_warrior.geo.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'animations', 'crystal_warrior.animation.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'entity', 'crystal_warrior.entity.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'render_controllers', 'crystal_warrior.render_controllers.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'animation_controllers', 'crystal_warrior.animation_controllers.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.rpDirectory, 'texts', 'en_US.lang'))).toBe(true);

    // Verify BP files exist
    expect(fs.existsSync(path.join(result.bpDirectory, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.bpDirectory, 'entities', 'crystal_warrior.json'))).toBe(true);

    // Verify .mcaddon file exists and has non-zero bytes
    expect(result.mcaddonFilePath).toBeDefined();
    expect(fs.existsSync(result.mcaddonFilePath!)).toBe(true);
    const stats = fs.statSync(result.mcaddonFilePath!);
    expect(stats.size).toBeGreaterThan(500); // contains compressed zip data!
  });
});
