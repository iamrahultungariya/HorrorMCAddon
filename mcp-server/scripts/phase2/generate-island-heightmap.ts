import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const OUTPUT_DIR = 'D:\\do note delete\\Desktop\\MC horror mod\\world_generation';

// Generates smooth procedural Simplex/Perlin-like noise
function pseudoNoise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number, seed: number = 42): number {
  const sampleX = x / scale;
  const sampleY = y / scale;

  const x0 = Math.floor(sampleX);
  const x1 = x0 + 1;
  const y0 = Math.floor(sampleY);
  const y1 = y0 + 1;

  const sx = sampleX - x0;
  const sy = sampleY - y0;

  // Cubic Hermite spline interpolation
  const u = sx * sx * (3 - 2 * sx);
  const v = sy * sy * (3 - 2 * sy);

  const n00 = pseudoNoise(x0, y0, seed);
  const n10 = pseudoNoise(x1, y0, seed);
  const n01 = pseudoNoise(x0, y1, seed);
  const n11 = pseudoNoise(x1, y1, seed);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;

  return nx0 * (1 - v) + nx1 * v;
}

function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let scale = 120;

  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x, y, scale, 1337 + i * 101) * amplitude;
    scale /= 2;
    amplitude *= 0.5;
  }
  return value;
}

export async function generateIslandHeightmap() {
  console.log('Generating 1,000 x 1,000 Island Heightmap for WorldPainter...');
  const width = 1000;
  const height = 1000;
  const centerX = 500;
  const centerZ = 500;

  // 16-bit grayscale buffer for high-precision heightmaps (65,536 height levels)
  const buf16 = Buffer.alloc(width * height * 2);
  // 8-bit preview buffer for direct visualization
  const buf8 = Buffer.alloc(width * height);
  // RGB biome mask buffer
  const biomeRgb = Buffer.alloc(width * height * 3);

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const idx = z * width + x;

      // 1. Distance from center to create isolated island falloff
      const dx = (x - centerX) / 450;
      const dz = (z - centerZ) / 450;
      const distFromCenter = Math.sqrt(dx * dx + dz * dz);

      // Island radial mask (1.0 in center, drops smoothly to 0.0 at ocean coast)
      let islandMask = Math.max(0, 1.0 - Math.pow(distFromCenter, 2.2));

      // 2. Base rolling terrain elevation (62 is sea level, island base ~70)
      let elevation = 62 + fbm(x, z, 5) * 20;

      // 3. North: Skull Mountain Range for Dark Cave (Z: 50..220, X: 350..650)
      const distToCave = Math.hypot(x - 500, z - 100);
      if (distToCave < 180) {
        const mountainFactor = Math.cos((distToCave / 180) * (Math.PI / 2));
        elevation += Math.pow(mountainFactor, 1.8) * 65; // Peaks reach Y: 135+
      }

      // 4. Center-East: Lower Sunken Swamp Basin (Z: 420..580, X: 620..780)
      const distToSwamp = Math.hypot(x - 700, z - 500);
      if (distToSwamp < 130) {
        const swampFactor = Math.cos((distToSwamp / 130) * (Math.PI / 2));
        elevation -= swampFactor * 10; // Dips right to water level Y: 62-63
      }

      // 5. Winding River carving from North Cave to South Coast
      const riverCenterX = 500 + Math.sin(z / 60) * 45;
      const distToRiver = Math.abs(x - riverCenterX);
      if (distToRiver < 16 && z > 150 && z < 900) {
        const riverTrench = Math.cos((distToRiver / 16) * (Math.PI / 2));
        elevation -= riverTrench * 8;
      }

      // Multiply by island mask to ensure surrounded by deep ocean (Y: 35-50)
      let finalElevation = 38 + (elevation - 38) * islandMask;
      if (finalElevation < 38) finalElevation = 38;

      // Map Y: 0..255 to 16-bit (0..65535) and 8-bit (0..255)
      const val8 = Math.min(255, Math.max(0, Math.floor(finalElevation)));
      const val16 = Math.min(65535, Math.max(0, Math.floor((finalElevation / 256) * 65535)));

      buf8[idx] = val8;
      buf16.writeUInt16LE(val16, idx * 2);

      // 6. Biome Mask Generation
      // Ocean = Deep Blue, Mountain = Grey/White, Swamp = Dark Muck Green, Forest = Dark Pine
      const rgbIdx = idx * 3;
      if (finalElevation <= 62) {
        // Ocean / Water
        biomeRgb[rgbIdx] = 15;
        biomeRgb[rgbIdx + 1] = 25;
        biomeRgb[rgbIdx + 2] = 55;
      } else if (distToSwamp < 110) {
        // Swamp Basin
        biomeRgb[rgbIdx] = 30;
        biomeRgb[rgbIdx + 1] = 45;
        biomeRgb[rgbIdx + 2] = 25;
      } else if (distToCave < 140) {
        // Rocky Skull Mountain
        biomeRgb[rgbIdx] = 110;
        biomeRgb[rgbIdx + 1] = 105;
        biomeRgb[rgbIdx + 2] = 100;
      } else {
        // Dense Dark Pine Canopy Forest
        biomeRgb[rgbIdx] = 20;
        biomeRgb[rgbIdx + 1] = 35;
        biomeRgb[rgbIdx + 2] = 20;
      }
    }
  }

  // Write heightmaps
  const heightmap16Path = path.join(OUTPUT_DIR, 'island_heightmap_16bit.png');
  const heightmap8Path = path.join(OUTPUT_DIR, 'island_heightmap_preview.png');
  const biomeMaskPath = path.join(OUTPUT_DIR, 'island_biome_mask.png');

  await sharp(buf16, { raw: { width, height, channels: 1, depth: 'ushort' } })
    .png()
    .toFile(heightmap16Path);

  await sharp(buf8, { raw: { width, height, channels: 1 } })
    .png()
    .toFile(heightmap8Path);

  await sharp(biomeRgb, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(biomeMaskPath);

  console.log(`Heightmaps successfully written to ${OUTPUT_DIR}:`);
  console.log(`- 16-bit Heightmap: ${heightmap16Path}`);
  console.log(`- 8-bit Preview: ${heightmap8Path}`);
  console.log(`- Biome Color Mask: ${biomeMaskPath}`);
}

if (process.argv[1]?.includes('generate-island-heightmap.ts')) {
  generateIslandHeightmap().catch(console.error);
}
