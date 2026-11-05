import { describe, it, expect } from 'vitest';
import { BedrockBehaviorEntityBuilder } from '../../src/core/bedrock/bedrock-behavior-entity.js';

describe('BedrockBehaviorEntityBuilder', () => {
  it('builds hostile mob behavior with attack goals and physics', () => {
    const entity = BedrockBehaviorEntityBuilder.buildBehaviorEntity('ice_wraith', {
      namespace: 'custom',
      preset: 'hostile_mob',
      health: 45,
      attackDamage: 7,
    });

    const comps = entity['minecraft:entity'].components;
    expect(comps['minecraft:type_family'].family).toContain('monster');
    expect(comps['minecraft:health'].value).toBe(45);
    expect(comps['minecraft:attack'].damage).toBe(7);
    expect(comps['minecraft:behavior.melee_attack']).toBeDefined();
    expect(comps['minecraft:behavior.nearest_attackable_target']).toBeDefined();
  });

  it('builds boss behavior with boss bar and knockback resistance', () => {
    const boss = BedrockBehaviorEntityBuilder.buildBehaviorEntity('ender_titan', {
      preset: 'boss',
      health: 500,
      attackDamage: 20,
    });

    const comps = boss['minecraft:entity'].components;
    expect(comps['minecraft:type_family'].family).toContain('boss');
    expect(comps['minecraft:health'].value).toBe(500);
    expect(comps['minecraft:boss']).toBeDefined();
    expect(comps['minecraft:boss'].name).toBe('ENDER_TITAN');
    expect(comps['minecraft:knockback_resistance'].value).toBe(0.8);
  });
});
