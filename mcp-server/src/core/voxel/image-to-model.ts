import sharp from 'sharp';
import { ModelBuilder } from '../ast/model-builder.js';
import { SpriteExtruder, ExtrudeSpriteOptions, ExtrusionResult } from './sprite-extruder.js';
import { GreedyMesher, VoxelGrid3D } from './greedy-mesher.js';
import { ColorQuantizer } from './color-quantizer.js';
import { Math3D } from '../utils/math3d.js';

export interface ImageToModelOptions extends ExtrudeSpriteOptions {
  reliefDepth?: number; // Generates stepped depth based on pixel luminance
  thresholdBackground?: boolean; // Automatically detects corner background color and removes it
}

export class ImageToModel {
  /**
   * Main entry point for converting an image to a 3D Blockbench model.
   * If reliefDepth > 1, generates multi-layer stepped 3D relief based on brightness/luminance.
   * Otherwise uses fast greedy 2D extrusion.
   */
  static async convert(
    input: string | Buffer | Uint8Array,
    options: ImageToModelOptions = {}
  ): Promise<ExtrusionResult> {
    const reliefDepth = options.reliefDepth ?? 1;

    // If simple 2D extrusion with constant depth
    if (reliefDepth <= 1) {
      return SpriteExtruder.extrude(input, options);
    }

    // Advanced 3D relief voxelization
    const pipeline = sharp(input);
    const metadata = await pipeline.metadata();
    const maxDim = options.maxDimension ?? 32;

    const resized = pipeline.resize(maxDim, maxDim, {
      fit: 'inside',
      kernel: sharp.kernel.nearest,
    });

    const { data: rawBuffer, info } = await resized
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const depth = reliefDepth;

    const palette = ColorQuantizer.extractPalette(rawBuffer, options.alphaThreshold ?? 128);
    const cells3D = new Int32Array(width * height * depth);
    cells3D.fill(-1); // default empty

    let originalPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = rawBuffer[idx];
        const g = rawBuffer[idx + 1];
        const b = rawBuffer[idx + 2];
        const a = rawBuffer[idx + 3];

        if (a < (options.alphaThreshold ?? 128)) continue;

        // Calculate luminance (0 to 1)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Map luminance to stepped layers along Z
        const layers = Math.max(1, Math.round(luminance * depth));

        const colorIndex = ColorQuantizer.findNearestColorIndex({ r, g, b, a }, palette);

        for (let z = 0; z < layers; z++) {
          const idx3D = z * (width * height) + y * width + x;
          cells3D[idx3D] = colorIndex;
          originalPixels++;
        }
      }
    }

    // Run 3D Greedy Meshing
    const grid3D: VoxelGrid3D = { width, height, depth, cells: cells3D };
    const boxes = GreedyMesher.mesh3D(grid3D);

    const builder = ModelBuilder.create({
      name: options.name ?? 'relief_model',
      format: options.format ?? 'bedrock',
      resolution: { width: 64, height: 64 },
    });

    const rootBone = builder.addBone({ name: 'root', origin: [0, 0, 0] });
    const xOffset = options.center !== false ? -width / 2 : 0;
    const yOffset = options.center !== false ? -height / 2 : 0;
    const zOffset = options.center !== false ? -depth / 2 : 0;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const color = palette[b.colorIndex];
      const hexColor = color ? ColorQuantizer.rgbaToInt(color) : 0xffffff;

      const from: [number, number, number] = [
        b.from[0] + xOffset,
        height - b.to[1] + yOffset, // Flip Y
        b.from[2] + zOffset,
      ];
      const to: [number, number, number] = [
        b.to[0] + xOffset,
        height - b.from[1] + yOffset, // Flip Y
        b.to[2] + zOffset,
      ];

      builder.addCube(
        {
          name: `relief_box_${i}`,
          from,
          to,
          origin: Math3D.getCenter(from, to),
          color: hexColor,
          snapToGrid: true,
        },
        rootBone.uuid
      );
    }

    if (options.cullFaces !== false) {
      builder.cullHiddenFaces();
    }

    const optimizationRatio =
      originalPixels > 0
        ? Math.round((1 - boxes.length / originalPixels) * 1000) / 10
        : 0;

    return {
      builder,
      stats: {
        originalPixels,
        meshedCubes: boxes.length,
        optimizationRatio,
        paletteColorsCount: palette.length,
        dimensions: [width, height, depth],
      },
    };
  }
}
