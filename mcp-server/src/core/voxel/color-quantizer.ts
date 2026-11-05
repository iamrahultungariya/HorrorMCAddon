export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class ColorQuantizer {
  /**
   * Converts RGBA color to 32-bit integer or hex string.
   */
  static rgbaToHex(color: RGBA): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Converts RGBA to integer color format used by Blockbench.
   */
  static rgbaToInt(color: RGBA): number {
    return (color.r << 16) + (color.g << 8) + color.b;
  }

  /**
   * Computes Euclidean color distance in RGB space.
   */
  static colorDistance(c1: RGBA, c2: RGBA): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * Checks if a pixel should be considered transparent.
   */
  static isTransparent(color: RGBA, alphaThreshold = 128): boolean {
    return color.a < alphaThreshold;
  }

  /**
   * Extracts unique non-transparent color palette from an RGBA buffer.
   */
  static extractPalette(
    buffer: Uint8Array | Buffer,
    alphaThreshold = 128
  ): RGBA[] {
    const paletteMap = new Map<string, RGBA>();

    for (let i = 0; i < buffer.length; i += 4) {
      const a = buffer[i + 3];
      if (a < alphaThreshold) continue;

      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];

      const key = `${r},${g},${b}`;
      if (!paletteMap.has(key)) {
        paletteMap.set(key, { r, g, b, a: 255 });
      }
    }

    return Array.from(paletteMap.values());
  }

  /**
   * Maps an RGBA color to its closest match in a given palette.
   */
  static findNearestColorIndex(color: RGBA, palette: RGBA[]): number {
    if (palette.length === 0) return -1;

    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < palette.length; i++) {
      const dist = this.colorDistance(color, palette[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return closestIndex;
  }
}
