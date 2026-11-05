import sharp from 'sharp';
import { ModelBuilder } from '../ast/model-builder.js';
import { ColorQuantizer, RGBA } from './color-quantizer.js';
import { GreedyMesher, VoxelGrid2D } from './greedy-mesher.js';
import { Math3D } from '../utils/math3d.js';
import { v4 as uuidv4 } from 'uuid';
import { Texture } from '../types/bbmodel.types.js';

export interface ExtrudeSpriteOptions {
  name?: string;
  depth?: number; // Extrusion depth (thickness), default: 1
  maxDimension?: number; // Optional resize to standard 16, 32, 64
  alphaThreshold?: number; // Alpha cutoff for transparency, default: 128
  center?: boolean; // Center model at [0, 0, 0], default: true
  cullFaces?: boolean; // Run hidden face culler, default: true
  format?: 'bedrock' | 'modded_entity' | 'java_block';
  embedTexture?: boolean; // Embed original sprite as base64 texture, default: true
}

export interface ExtrusionResult {
  builder: ModelBuilder;
  stats: {
    originalPixels: number;
    meshedCubes: number;
    optimizationRatio: number; // e.g. 85.5% reduction
    paletteColorsCount: number;
    dimensions: [number, number, number];
  };
}

export class SpriteExtruder {
  /**
   * Reads an image from file path or Buffer, processes pixel art,
   * performs greedy meshing, and returns a fully optimized ModelBuilder instance.
   */
  static async extrude(
    input: string | Buffer | Uint8Array,
    options: ExtrudeSpriteOptions = {}
  ): Promise<ExtrusionResult> {
    const depth = options.depth ?? 1;
    const alphaThreshold = options.alphaThreshold ?? 128;
    const center = options.center ?? true;
    const cullFaces = options.cullFaces ?? true;
    const format = options.format ?? 'bedrock';
    const embedTexture = options.embedTexture ?? true;
    const name = options.name ?? 'extruded_item';

    // 1. Process image using Sharp
    let pipeline = sharp(input);
    const metadata = await pipeline.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: unable to determine width and height.');
    }

    let targetWidth = metadata.width;
    let targetHeight = metadata.height;

    if (options.maxDimension && (targetWidth > options.maxDimension || targetHeight > options.maxDimension)) {
      pipeline = pipeline.resize(options.maxDimension, options.maxDimension, {
        fit: 'inside',
        kernel: sharp.kernel.nearest, // nearest neighbor preserves pixel art crispness
      });
      const resizedMeta = await pipeline.metadata();
      targetWidth = resizedMeta.width || targetWidth;
      targetHeight = resizedMeta.height || targetHeight;
    }

    // Ensure raw uncompressed RGBA channels
    const { data: rawBuffer, info } = await pipeline
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;

    // 2. Extract Palette & build 2D grid
    const palette = ColorQuantizer.extractPalette(rawBuffer, alphaThreshold);
    const cells = new Int32Array(width * height);
    let originalPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = rawBuffer[idx];
        const g = rawBuffer[idx + 1];
        const b = rawBuffer[idx + 2];
        const a = rawBuffer[idx + 3];

        if (a < alphaThreshold) {
          cells[y * width + x] = -1; // Transparent
        } else {
          const color: RGBA = { r, g, b, a };
          const pIndex = ColorQuantizer.findNearestColorIndex(color, palette);
          cells[y * width + x] = pIndex;
          originalPixels++;
        }
      }
    }

    // 3. Perform 2D Greedy Meshing
    const grid: VoxelGrid2D = { width, height, cells };
    // We pass flipY = true so top of sprite corresponds to higher 3D Y coordinate
    const boxes = GreedyMesher.mesh2D(grid, depth, 0, true);

    // 4. Initialize ModelBuilder
    // Resolution rounded up to power of 2
    const resWidth = Math.max(16, Math.pow(2, Math.ceil(Math.log2(width))));
    const resHeight = Math.max(16, Math.pow(2, Math.ceil(Math.log2(height))));

    const builder = ModelBuilder.create({
      name,
      format,
      resolution: { width: resWidth, height: resHeight },
    });

    // 5. Optionally embed sprite texture as PNG base64
    let textureUuid: string | null = null;
    if (embedTexture) {
      // Re-encode sprite as PNG
      const pngBuffer = await sharp(rawBuffer, {
        raw: {
          width,
          height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();

      const base64Data = `data:image/png;base64,${pngBuffer.toString('base64')}`;
      textureUuid = uuidv4();

      const textureObj: Texture = {
        name: `${name}_texture`,
        uuid: textureUuid,
        folder: 'item',
        width: resWidth,
        height: resHeight,
        source: base64Data,
      };

      builder.getModel().textures.push(textureObj);
    }

    // 6. Calculate centering offset
    const xOffset = center ? -width / 2 : 0;
    const yOffset = center ? -height / 2 : 0;
    const zOffset = center ? -depth / 2 : 0;

    // Create root bone
    const rootBone = builder.addBone({
      name: 'root',
      origin: [0, 0, 0],
    });

    // 7. Inject meshed boxes as Cubes
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const color = palette[b.colorIndex];
      const hexColor = color ? ColorQuantizer.rgbaToInt(color) : 0xffffff;

      const from: [number, number, number] = [
        b.from[0] + xOffset,
        b.from[1] + yOffset,
        b.from[2] + zOffset,
      ];
      const to: [number, number, number] = [
        b.to[0] + xOffset,
        b.to[1] + yOffset,
        b.to[2] + zOffset,
      ];

      // Exact pixel UVs mapping to sprite coordinates
      const origX = b.from[0];
      const origW = b.to[0] - b.from[0];
      const origYInverted = height - b.to[1];
      const origH = b.to[1] - b.from[1];

      const cube = builder.addCube(
        {
          name: `${name}_box_${i}`,
          from,
          to,
          origin: Math3D.getCenter(from, to),
          color: hexColor,
          textureId: textureUuid,
          uvOffset: [origX, origYInverted],
          snapToGrid: true,
        },
        rootBone.uuid
      );

      // Map North and South faces to direct pixel coordinates
      if (cube.faces.north) {
        cube.faces.north.uv = [origX, origYInverted, origX + origW, origYInverted + origH];
        cube.faces.north.texture = textureUuid;
      }
      if (cube.faces.south) {
        cube.faces.south.uv = [origX + origW, origYInverted, origX, origYInverted + origH];
        cube.faces.south.texture = textureUuid;
      }
    }

    // 8. Run high-FPS hidden face culling
    if (cullFaces) {
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
