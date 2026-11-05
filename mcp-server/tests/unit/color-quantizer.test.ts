import { describe, it, expect } from 'vitest';
import { ColorQuantizer, RGBA } from '../../src/core/voxel/color-quantizer.js';

describe('ColorQuantizer', () => {
  it('converts RGBA to hex string and integer', () => {
    const red: RGBA = { r: 255, g: 0, b: 0, a: 255 };
    expect(ColorQuantizer.rgbaToHex(red)).toBe('#ff0000');
    expect(ColorQuantizer.rgbaToInt(red)).toBe(0xff0000);

    const cyan: RGBA = { r: 0, g: 255, b: 255, a: 255 };
    expect(ColorQuantizer.rgbaToHex(cyan)).toBe('#00ffff');
    expect(ColorQuantizer.rgbaToInt(cyan)).toBe(0x00ffff);
  });

  it('extracts unique non-transparent palette from raw buffer', () => {
    // 2 pixels: red (solid) and blue (solid), and 1 transparent pixel
    const buffer = Buffer.from([
      255, 0, 0, 255,    // Red
      0, 0, 255, 255,    // Blue
      0, 255, 0, 0,      // Green transparent
      255, 0, 0, 255,    // Duplicate Red
    ]);

    const palette = ColorQuantizer.extractPalette(buffer, 128);
    expect(palette.length).toBe(2); // Only Red and Blue
    expect(palette[0]).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(palette[1]).toEqual({ r: 0, g: 0, b: 255, a: 255 });
  });

  it('finds nearest matching color in palette', () => {
    const palette: RGBA[] = [
      { r: 255, g: 0, b: 0, a: 255 }, // 0: Red
      { r: 0, g: 255, b: 0, a: 255 }, // 1: Green
      { r: 0, g: 0, b: 255, a: 255 }, // 2: Blue
    ];

    // Dark red should map to Red (index 0)
    const darkRed: RGBA = { r: 200, g: 10, b: 10, a: 255 };
    expect(ColorQuantizer.findNearestColorIndex(darkRed, palette)).toBe(0);

    // Cyan should map to either Green or Blue (closer to Blue if blue component is higher)
    const lightBlue: RGBA = { r: 20, g: 50, b: 240, a: 255 };
    expect(ColorQuantizer.findNearestColorIndex(lightBlue, palette)).toBe(2);
  });
});
