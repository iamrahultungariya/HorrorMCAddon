import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';

const MC_MOD_DIR = 'D:\\do note delete\\Desktop\\MC horror mod';
const RP_ITEMS_TEX = path.join(MC_MOD_DIR, 'the_forgotten_woods_RP', 'textures', 'items');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function createNoiseTexture(width: number, height: number, r: number, g: number, b: number): Promise<Buffer> {
  const channels = 4;
  const rawData = Buffer.alloc(width * height * channels);
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const noise = Math.floor((Math.random() - 0.5) * 30);
    rawData[idx] = Math.max(0, Math.min(255, r + noise));
    rawData[idx + 1] = Math.max(0, Math.min(255, g + noise));
    rawData[idx + 2] = Math.max(0, Math.min(255, b + noise));
    rawData[idx + 3] = 255;
  }
  return await sharp(rawData, { raw: { width, height, channels } }).png().toBuffer();
}

async function buildFlashlightModel() {
  const mb = ModelBuilder.create({
    name: 'flashlight',
    format: 'bedrock',
    resolution: { width: 32, height: 32 }
  });

  // Cylindrical body (handle)
  mb.addCube({
    name: 'handle',
    from: [-1.5, 0, -1.5],
    to: [1.5, 8, 1.5]
  });

  // Head cone & lens
  mb.addCube({
    name: 'head',
    from: [-2.5, 8, -2.5],
    to: [2.5, 12, 2.5]
  });

  // Glass lens face
  mb.addCube({
    name: 'lens',
    from: [-2, 12, -2],
    to: [2, 12.5, 2]
  });

  // Switch button
  mb.addCube({
    name: 'switch',
    from: [-0.5, 5, 1.5],
    to: [0.5, 6, 2.2]
  });

  const model = mb.getModel();
  fs.writeFileSync(path.join(MC_MOD_DIR, 'flashlight.bbmodel'), JSON.stringify(model, null, 2));
  console.log('Created flashlight.bbmodel');

  // Flashlight texture
  const tex = await createNoiseTexture(32, 32, 45, 50, 55);
  ensureDir(RP_ITEMS_TEX);
  fs.writeFileSync(path.join(RP_ITEMS_TEX, 'flashlight.png'), tex);
  console.log('Created textures/items/flashlight.png');
}

async function buildAABatteryModel() {
  const mb = ModelBuilder.create({
    name: 'aa_battery',
    format: 'bedrock',
    resolution: { width: 16, height: 16 }
  });

  // Battery cylindrical body
  mb.addCube({
    name: 'cell',
    from: [-1, 0, -1],
    to: [1, 5, 1]
  });

  // Positive terminal nub
  mb.addCube({
    name: 'terminal',
    from: [-0.4, 5, -0.4],
    to: [0.4, 5.6, 0.4]
  });

  const model = mb.getModel();
  fs.writeFileSync(path.join(MC_MOD_DIR, 'aa_battery.bbmodel'), JSON.stringify(model, null, 2));
  console.log('Created aa_battery.bbmodel');

  // Battery texture
  const tex = await createNoiseTexture(16, 16, 190, 110, 30);
  ensureDir(RP_ITEMS_TEX);
  fs.writeFileSync(path.join(RP_ITEMS_TEX, 'aa_battery.png'), tex);
  console.log('Created textures/items/aa_battery.png');
}

async function main() {
  await buildFlashlightModel();
  await buildAABatteryModel();
  console.log('Flashlight and Battery assets generated successfully.');
}

main().catch(console.error);
