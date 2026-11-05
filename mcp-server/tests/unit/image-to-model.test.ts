import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { ImageToModel } from '../../src/core/voxel/image-to-model.js';

describe('ImageToModel 3D Relief Pipeline', () => {
  it('converts an image with stepped 3D relief based on pixel luminance', async () => {
    // 8x8 image with gradient (dark to light)
    const width = 8;
    const height = 8;
    const buffer = Buffer.alloc(width * height * 4, 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = Math.round((x / (width - 1)) * 255);
        buffer[idx] = brightness;     // R
        buffer[idx + 1] = brightness; // G
        buffer[idx + 2] = brightness; // B
        buffer[idx + 3] = 255;        // A
      }
    }

    const pngBuffer = await sharp(buffer, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    const result = await ImageToModel.convert(pngBuffer, {
      name: 'relief_statue',
      reliefDepth: 4, // 4 stepped depth layers
      maxDimension: 8,
      cullFaces: true,
    });

    const model = result.builder.getModel();
    expect(model.name).toBe('relief_statue');
    expect(result.stats.meshedCubes).toBeGreaterThan(0);
    expect(model.elements.length).toBe(result.stats.meshedCubes);

    // Relief should create cubes with varying depths
    const zDepths = new Set<number>();
    for (const el of model.elements) {
      zDepths.add(el.to[2] - el.from[2]);
    }
    expect(zDepths.size).toBeGreaterThanOrEqual(1);
  });
});
