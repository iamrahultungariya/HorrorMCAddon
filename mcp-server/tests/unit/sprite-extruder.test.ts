import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { SpriteExtruder } from '../../src/core/voxel/sprite-extruder.js';

describe('SpriteExtruder Pipeline', () => {
  it('extrudes a synthetic 16x16 pixel-art sword with high optimization ratio', async () => {
    // Generate a 16x16 raw image buffer representing a sword
    const width = 16;
    const height = 16;
    const buffer = Buffer.alloc(width * height * 4, 0); // initialize transparent

    const setPixel = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
      const idx = (y * width + x) * 4;
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    };

    // Draw a 3-pixel brown handle at [2, 13], [3, 12], [4, 11]
    setPixel(2, 13, 100, 60, 30);
    setPixel(3, 12, 100, 60, 30);
    setPixel(4, 11, 100, 60, 30);

    // Draw a 4-pixel gold crossguard at [3, 10], [4, 10], [5, 11], [5, 10]
    setPixel(3, 10, 255, 215, 0);
    setPixel(4, 10, 255, 215, 0);
    setPixel(5, 11, 255, 215, 0);
    setPixel(5, 10, 255, 215, 0);

    // Draw a cyan diamond blade (a 4x4 solid square for testing meshing)
    for (let by = 4; by <= 7; by++) {
      for (let bx = 6; bx <= 9; bx++) {
        setPixel(bx, by, 0, 255, 255);
      }
    }

    // Convert raw to PNG buffer
    const pngBuffer = await sharp(buffer, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    // Run extrusion
    const result = await SpriteExtruder.extrude(pngBuffer, {
      name: 'diamond_sword',
      depth: 1,
      center: true,
      cullFaces: true,
    });

    const model = result.builder.getModel();

    expect(model.name).toBe('diamond_sword');
    expect(result.stats.originalPixels).toBe(3 + 4 + 16); // 23 pixels
    // The 16 blade pixels (4x4) will collapse into 1 cube!
    expect(result.stats.meshedCubes).toBeLessThan(result.stats.originalPixels);
    expect(result.stats.optimizationRatio).toBeGreaterThan(50); // >50% reduction!

    // Verify texture was embedded
    expect(model.textures.length).toBe(1);
    expect(model.textures[0].source.startsWith('data:image/png;base64,')).toBe(true);

    // Verify elements have names and faces
    expect(model.elements.length).toBe(result.stats.meshedCubes);
    for (const el of model.elements) {
      expect(el.type).toBe('cube');
      expect(el.faces.north?.uv).toBeDefined();
      expect(el.faces.south?.uv).toBeDefined();
    }
  });
});
