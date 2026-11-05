import { describe, it, expect } from 'vitest';
import { DisplayPresets, DisplayPresetName } from '../../src/core/display/display-presets.js';

describe('DisplayPresets', () => {
  const presets: DisplayPresetName[] = [
    'sword',
    'axe',
    'tool',
    'staff',
    'gun',
    'shield',
    'bow',
    'block',
  ];

  for (const preset of presets) {
    it(`generates valid display record for preset "${preset}"`, () => {
      const record = DisplayPresets.getPreset(preset);

      expect(record.thirdperson_righthand).toBeDefined();
      expect(record.firstperson_righthand).toBeDefined();
      expect(record.gui).toBeDefined();
      expect(record.ground).toBeDefined();
      expect(record.fixed).toBeDefined();

      // Check vector shapes
      expect(record.thirdperson_righthand?.rotation.length).toBe(3);
      expect(record.thirdperson_righthand?.translation.length).toBe(3);
      expect(record.thirdperson_righthand?.scale.length).toBe(3);
    });
  }

  it('configures distinct angles for sword vs gun', () => {
    const sword = DisplayPresets.getPreset('sword');
    const gun = DisplayPresets.getPreset('gun');

    // Sword has tilted forward thirdperson rotation, gun is oriented forward
    expect(sword.thirdperson_righthand?.rotation).not.toEqual(
      gun.thirdperson_righthand?.rotation
    );
  });
});
