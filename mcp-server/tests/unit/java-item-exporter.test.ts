import { describe, it, expect } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { JavaItemExporter } from '../../src/core/exporters/java-item-exporter.js';
import { DisplayPresets } from '../../src/core/display/display-presets.js';

describe('JavaItemExporter', () => {
  it('exports a BBModel into production-ready Minecraft Java Item JSON model', () => {
    const builder = ModelBuilder.create({ name: 'fire_axe' });
    builder.getModel().display = DisplayPresets.getPreset('axe');

    // Add handle cube
    builder.addCube({
      name: 'handle',
      from: [7, 0, 7],
      to: [9, 14, 9],
      origin: [8, 0, 8],
    });

    // Add axe head cube with 22.5 deg rotation
    builder.addCube({
      name: 'head',
      from: [5, 12, 6],
      to: [11, 16, 10],
      origin: [8, 14, 8],
      rotation: [0, 22.5, 0],
    });

    const json = JavaItemExporter.exportToJSON(builder, {
      modId: 'elemental_weapons',
      texturePath: 'item/fire_axe',
      centerInBlock: true,
    });

    expect(json.textures['0']).toBe('elemental_weapons:item/fire_axe');
    expect(json.textures['layer0']).toBe('elemental_weapons:item/fire_axe');
    expect(json.elements.length).toBe(2);
    expect(json.display).toBeDefined();
    expect(json.display?.thirdperson_righthand).toBeDefined();

    // Check rotation definition on rotated cube
    const rotatedCube = json.elements.find((el) => el.name === 'head');
    expect(rotatedCube).toBeDefined();
    expect(rotatedCube?.rotation).toBeDefined();
    expect(rotatedCube?.rotation?.axis).toBe('y');
    expect(rotatedCube?.rotation?.angle).toBe(22.5);

    // Check face UVs
    expect(rotatedCube?.faces.north).toBeDefined();
    expect(rotatedCube?.faces.north.texture).toBe('#0');
  });

  it('snaps arbitrary rotation angles to allowed Java angles (-45, -22.5, 0, 22.5, 45)', () => {
    expect(JavaItemExporter.snapJavaAngle(20)).toBe(22.5);
    expect(JavaItemExporter.snapJavaAngle(43)).toBe(45);
    expect(JavaItemExporter.snapJavaAngle(-10)).toBe(0);
    expect(JavaItemExporter.snapJavaAngle(-25)).toBe(-22.5);
    expect(JavaItemExporter.snapJavaAngle(-48)).toBe(-45);
  });
});
