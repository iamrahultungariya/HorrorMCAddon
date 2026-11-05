import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { GeckoLibExporter } from '../../src/core/exporters/geckolib-exporter.js';
import { ProceduralAnimator } from '../../src/core/animation/procedural-animator.js';

describe('GeckoLibExporter', () => {
  it('exports a model into GeckoLib 1.12.0 .geo.json with visible bounds', () => {
    const builder = ModelBuilder.create({ name: 'fire_demon' });
    const torso = builder.addBone({ name: 'torso', origin: [0, 12, 0] });
    builder.addCube(
      {
        name: 'torso_cube',
        from: [-4, 12, -2],
        to: [4, 24, 2],
        origin: [0, 12, 0],
      },
      torso.name
    );

    const geo = GeckoLibExporter.exportGeoJSON(builder, 'geometry.fire_demon');

    expect(geo.format_version).toBe('1.12.0');
    expect(geo['minecraft:geometry']).toBeDefined();
    const entry = geo['minecraft:geometry']![0];
    expect(entry.description.identifier).toBe('geometry.fire_demon');
    expect(entry.description.visible_bounds_width).toBe(3.0);
    expect(entry.bones.length).toBe(1);
    expect(entry.bones[0].name).toBe('torso');
    expect(entry.bones[0].cubes.length).toBe(1);
  });

  it('exports animations into GeckoLib format 1.8.0 .animation.json', () => {
    const { geckolibAnim: walkAnim } = ProceduralAnimator.generateBipedAnimation('demon', 'walk');
    const { geckolibAnim: idleAnim } = ProceduralAnimator.generateBipedAnimation('demon', 'idle');

    const file = GeckoLibExporter.exportAnimationJSON({
      'animation.demon.walk': walkAnim,
      'animation.demon.idle': idleAnim,
    });

    expect(file.format_version).toBe('1.8.0');
    expect(Object.keys(file.animations).length).toBe(2);
    expect(file.animations['animation.demon.walk']).toBeDefined();
    expect(file.animations['animation.demon.walk'].bones['right_leg']).toBeDefined();
    expect(file.animations['animation.demon.idle'].loop).toBe(true);
  });
});
