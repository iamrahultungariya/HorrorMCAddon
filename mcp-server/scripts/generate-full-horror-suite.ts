import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ModelBuilder } from '../src/core/ast/model-builder.js';
import { GeckoLibExporter } from '../src/core/exporters/geckolib-exporter.js';
import { GeckoLibAnimation } from '../src/core/animation/procedural-animator.js';
import { BBModel, Animation, Animator, Element } from '../src/core/types/bbmodel.types.js';
import { ZipArchive } from 'archiver';

const TARGET_DIR = 'D:\\do note delete\\Desktop\\MC horror mod';
const RP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_RP');
const BP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_BP');

// Helper to write files safely
function writeFile(targetPath: string, content: string | Buffer) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

// Helper to create pixel texture
async function makePaletteTexture(
  width: number,
  height: number,
  painter: (x: number, y: number) => [number, number, number, number]
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = painter(x, y);
      const idx = (y * width + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return await sharp(buf, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

// Helper to bind texture UUID to all faces of a model
function bindTextureToModel(builder: ModelBuilder, texName: string, texBuffer: Buffer): string {
  const texUuid = uuidv4();
  const base64 = `data:image/png;base64,${texBuffer.toString('base64')}`;

  builder.getModel().textures.push({
    name: texName,
    folder: 'entity',
    id: '0',
    uuid: texUuid,
    source: base64,
    width: builder.getModel().resolution.width,
    height: builder.getModel().resolution.height,
    saved: true,
    visible: true,
    render_mode: 'default',
  });

  builder.getModel().elements.forEach((el: Element) => {
    ['up', 'down', 'north', 'south', 'east', 'west'].forEach((f) => {
      if ((el.faces as any)[f]) {
        (el.faces as any)[f].texture = texUuid;
      }
    });
  });

  return texUuid;
}

// 1. THE WOODS STALKER (Spawn Point / Forest Predator)
async function createWoodsStalker(): Promise<{ builder: ModelBuilder; animations: Record<string, GeckoLibAnimation>; texture: Buffer }> {
  const texture = await makePaletteTexture(64, 64, (x, y) => {
    // Charcoal charred bark with green moss
    const noise = ((x * 19 + y * 23) % 21) - 10;
    if (x < 32 && y < 24) {
      // Skull & bone
      const bVar = (x * 7 + y * 11) % 18;
      // Glowing blood eyes
      if ((x >= 6 && x <= 8 && y >= 7 && y <= 8) || (x >= 12 && x <= 14 && y >= 7 && y <= 8)) {
        return [255, 10, 10, 255]; // neon red eye
      }
      return [210 - bVar, 200 - bVar, 180 - bVar, 255];
    }
    if (x >= 32 && y < 32) {
      // Ribcage
      if (y % 4 < 2) return [200, 190, 175, 255]; // bone
      return [18, 14, 16, 255]; // cavity
    }
    if (y >= 54) {
      // Bloody claws
      return [180, 25, 25, 255];
    }
    // Mossy dark wood body
    const moss = (x + y) % 9 === 0 ? 30 : 0;
    return [Math.max(10, 28 + noise), Math.max(15, 34 + noise + moss), Math.max(10, 26 + noise), 255];
  });

  const builder = ModelBuilder.create({
    name: 'the_woods_stalker',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  const body = builder.addBone({ name: 'body', origin: [0, 18, 0] }, root.name);
  builder.addCube({ name: 'pelvis', from: [-3, 16, -1.5], to: [3, 20, 1.5], origin: [0, 18, 0], uvOffset: [16, 20] }, body.name);
  builder.addCube({ name: 'spine', from: [-1.5, 20, -1], to: [1.5, 30, 1], origin: [0, 24, 0], uvOffset: [20, 16] }, body.name);
  builder.addCube({ name: 'ribcage', from: [-4, 23, -2.5], to: [4, 30, 2.5], origin: [0, 26, 0], uvOffset: [32, 0] }, body.name);
  builder.addCube({ name: 'ribs_upper', from: [-4.5, 27, -3.2], to: [4.5, 28.5, 2.8], origin: [0, 27, 0], uvOffset: [32, 16] }, body.name);

  const head = builder.addBone({ name: 'head', origin: [0, 31, 0] }, body.name);
  builder.addCube({ name: 'skull', from: [-3.5, 31, -3.5], to: [3.5, 39, 3.5], origin: [0, 31, 0], uvOffset: [0, 0] }, head.name);
  builder.addCube({ name: 'snout', from: [-2, 32, -5.5], to: [2, 36, -3.5], origin: [0, 34, -4.5], uvOffset: [24, 0] }, head.name);
  builder.addCube({ name: 'lower_jaw', from: [-2.5, 29, -5], to: [2.5, 32, 1], origin: [0, 30, -2], uvOffset: [0, 16] }, head.name);

  // Antlers
  const lHorn = builder.addBone({ name: 'horns_left', origin: [3, 38, 0] }, head.name);
  builder.addCube({ name: 'horn_l_base', from: [2.5, 38, -0.5], to: [4.5, 43, 1], origin: [3.5, 38, 0], uvOffset: [48, 0] }, lHorn.name);
  builder.addCube({ name: 'horn_l_branch', from: [3.5, 42, -1], to: [6.5, 48, 1.5], origin: [4.5, 42, 0], uvOffset: [48, 8] }, lHorn.name);
  const rHorn = builder.addBone({ name: 'horns_right', origin: [-3, 38, 0] }, head.name);
  builder.addCube({ name: 'horn_r_base', from: [-4.5, 38, -0.5], to: [-2.5, 43, 1], origin: [-3.5, 38, 0], uvOffset: [48, 0] }, rHorn.name);
  builder.addCube({ name: 'horn_r_branch', from: [-6.5, 42, -1], to: [-3.5, 48, 1.5], origin: [-4.5, 42, 0], uvOffset: [48, 8] }, rHorn.name);

  // Arms
  const rArm = builder.addBone({ name: 'right_arm', origin: [-4.5, 30, 0] }, body.name);
  builder.addCube({ name: 'right_upper_arm', from: [-6, 20, -1.5], to: [-4.5, 30, 1.5], origin: [-5, 30, 0], uvOffset: [0, 32] }, rArm.name);
  builder.addCube({ name: 'right_forearm', from: [-6, 8, -1.5], to: [-4.5, 20, 1.5], origin: [-5, 20, 0], uvOffset: [8, 32] }, rArm.name);
  builder.addCube({ name: 'right_claws', from: [-6.2, 3, -2], to: [-4.3, 8, 2], origin: [-5, 8, 0], uvOffset: [16, 32] }, rArm.name);

  const lArm = builder.addBone({ name: 'left_arm', origin: [4.5, 30, 0] }, body.name);
  builder.addCube({ name: 'left_upper_arm', from: [4.5, 20, -1.5], to: [6, 30, 1.5], origin: [5, 30, 0], uvOffset: [0, 32] }, lArm.name);
  builder.addCube({ name: 'left_forearm', from: [4.5, 8, -1.5], to: [6, 20, 1.5], origin: [5, 20, 0], uvOffset: [8, 32] }, lArm.name);
  builder.addCube({ name: 'left_claws', from: [4.3, 3, -2], to: [6.2, 8, 2], origin: [5, 8, 0], uvOffset: [16, 32] }, lArm.name);

  // Legs
  const rLeg = builder.addBone({ name: 'right_leg', origin: [-2.5, 16, 0] }, root.name);
  builder.addCube({ name: 'right_thigh', from: [-3.5, 8, -1.5], to: [-1.5, 16, 1.5], origin: [-2.5, 16, 0], uvOffset: [24, 32] }, rLeg.name);
  builder.addCube({ name: 'right_shin', from: [-3.5, 0, -1.5], to: [-1.5, 8, 1.5], origin: [-2.5, 4, 0], uvOffset: [32, 32] }, rLeg.name);

  const lLeg = builder.addBone({ name: 'left_leg', origin: [2.5, 16, 0] }, root.name);
  builder.addCube({ name: 'left_thigh', from: [1.5, 8, -1.5], to: [3.5, 16, 1.5], origin: [2.5, 16, 0], uvOffset: [24, 32] }, lLeg.name);
  builder.addCube({ name: 'left_shin', from: [1.5, 0, -1.5], to: [3.5, 8, 1.5], origin: [2.5, 4, 0], uvOffset: [32, 32] }, lLeg.name);

  bindTextureToModel(builder, 'the_woods_stalker.png', texture);

  const animations: Record<string, GeckoLibAnimation> = {
    'animation.the_woods_stalker.idle': {
      loop: true,
      animation_length: 2.0,
      bones: {
        body: { rotation: { '0.00': [0, 0, 0], '1.00': [2, 0, 0], '2.00': [0, 0, 0] } },
        head: { rotation: { '0.00': [0, 0, 0], '0.70': [3, 8, 4], '1.40': [-2, -6, -2], '2.00': [0, 0, 0] } },
        right_arm: { rotation: { '0.00': [0, 0, -5], '1.00': [8, 0, -8], '2.00': [0, 0, -5] } },
        left_arm: { rotation: { '0.00': [0, 0, 5], '1.00': [8, 0, 8], '2.00': [0, 0, 5] } },
      },
    },
    'animation.the_woods_stalker.walk': {
      loop: true,
      animation_length: 1.0,
      bones: {
        body: { rotation: { '0.00': [8, 0, 0], '0.50': [10, 0, 0], '1.00': [8, 0, 0] } },
        right_leg: { rotation: { '0.00': [-30, 0, 0], '0.50': [30, 0, 0], '1.00': [-30, 0, 0] } },
        left_leg: { rotation: { '0.00': [30, 0, 0], '0.50': [-30, 0, 0], '1.00': [30, 0, 0] } },
        right_arm: { rotation: { '0.00': [25, 0, -5], '0.50': [-25, 0, -5], '1.00': [25, 0, -5] } },
        left_arm: { rotation: { '0.00': [-25, 0, 5], '0.50': [25, 0, 5], '1.00': [-25, 0, 5] } },
      },
    },
    'animation.the_woods_stalker.attack': {
      loop: false,
      animation_length: 0.8,
      bones: {
        right_arm: { rotation: { '0.00': [0, 0, -5], '0.30': [-110, 20, -10], '0.50': [45, -10, 0], '0.80': [0, 0, -5] } },
        left_arm: { rotation: { '0.00': [0, 0, 5], '0.30': [-110, -20, 10], '0.50': [45, 10, 0], '0.80': [0, 0, 5] } },
      },
    },
  };

  return { builder, animations, texture };
}

// 2. CRYPT CRAWLER (Graveyard 4-legged creeping horror skeleton)
async function createCryptCrawler(): Promise<{ builder: ModelBuilder; animations: Record<string, GeckoLibAnimation>; texture: Buffer }> {
  const texture = await makePaletteTexture(64, 64, (x, y) => {
    const dirt = (x * 13 + y * 17) % 25;
    if (x < 16 && y < 16) {
      // Sunken dead white skull
      if ((x === 5 || x === 10) && y === 6) return [255, 255, 255, 255]; // pinprick white dead eyes
      return [180 - dirt, 175 - dirt, 160 - dirt, 255];
    }
    // Soil-stained decayed bones
    return [140 - dirt, 130 - dirt, 110 - dirt, 255];
  });

  const builder = ModelBuilder.create({
    name: 'crypt_crawler',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  const spine = builder.addBone({ name: 'spine', origin: [0, 6, 0] }, root.name);
  builder.addCube({ name: 'spine_bar', from: [-2, 4, -8], to: [2, 7, 8], origin: [0, 5.5, 0], uvOffset: [0, 0] }, spine.name);
  builder.addCube({ name: 'ribs_spread', from: [-5, 5, -5], to: [5, 8, 3], origin: [0, 6.5, -1], uvOffset: [20, 0] }, spine.name);

  // Skull looking up while crawling
  const skull = builder.addBone({ name: 'head', origin: [0, 7, -8], rotation: [-25, 0, 0] }, spine.name);
  builder.addCube({ name: 'skull_head', from: [-3, 6, -14], to: [3, 12, -8], origin: [0, 9, -11], uvOffset: [0, 20] }, skull.name);

  // 4 Creepy bent crawler legs
  const fLeftLeg = builder.addBone({ name: 'leg_front_left', origin: [3, 6, -6] }, root.name);
  builder.addCube({ name: 'f_l_limb', from: [2, 0, -7], to: [5, 10, -5], origin: [3.5, 6, -6], uvOffset: [36, 0] }, fLeftLeg.name);

  const fRightLeg = builder.addBone({ name: 'leg_front_right', origin: [-3, 6, -6] }, root.name);
  builder.addCube({ name: 'f_r_limb', from: [-5, 0, -7], to: [-2, 10, -5], origin: [-3.5, 6, -6], uvOffset: [36, 0] }, fRightLeg.name);

  const bLeftLeg = builder.addBone({ name: 'leg_back_left', origin: [3, 6, 6] }, root.name);
  builder.addCube({ name: 'b_l_limb', from: [2, 0, 5], to: [5, 9, 7], origin: [3.5, 5, 6], uvOffset: [36, 16] }, bLeftLeg.name);

  const bRightLeg = builder.addBone({ name: 'leg_back_right', origin: [-3, 6, 6] }, root.name);
  builder.addCube({ name: 'b_r_limb', from: [-5, 0, 5], to: [-2, 9, 7], origin: [-3.5, 5, 6], uvOffset: [36, 16] }, bRightLeg.name);

  bindTextureToModel(builder, 'crypt_crawler.png', texture);

  const animations: Record<string, GeckoLibAnimation> = {
    'animation.crypt_crawler.crawl': {
      loop: true,
      animation_length: 0.8,
      bones: {
        leg_front_left: { rotation: { '0.00': [-35, 0, 0], '0.40': [35, 0, 0], '0.80': [-35, 0, 0] } },
        leg_front_right: { rotation: { '0.00': [35, 0, 0], '0.40': [-35, 0, 0], '0.80': [35, 0, 0] } },
        leg_back_left: { rotation: { '0.00': [30, 0, 0], '0.40': [-30, 0, 0], '0.80': [30, 0, 0] } },
        leg_back_right: { rotation: { '0.00': [-30, 0, 0], '0.40': [30, 0, 0], '0.80': [-30, 0, 0] } },
        spine: { position: { '0.00': [0, 0, 0], '0.20': [0, 0.8, 0], '0.40': [0, 0, 0], '0.60': [0, 0.8, 0], '0.80': [0, 0, 0] } },
      },
    },
    'animation.crypt_crawler.attack': {
      loop: false,
      animation_length: 0.6,
      bones: {
        spine: { position: { '0.00': [0, 0, 0], '0.25': [0, 4, -4], '0.60': [0, 0, 0] } },
        head: { rotation: { '0.00': [-25, 0, 0], '0.25': [20, 0, 0], '0.60': [-25, 0, 0] } },
      },
    },
  };

  return { builder, animations, texture };
}

// 3. THE ANCIENT ONE (Ritual Site & Dark Cave - Giant Eldritch Beast Boss)
async function createAncientOneBoss(): Promise<{ builder: ModelBuilder; animations: Record<string, GeckoLibAnimation>; texture: Buffer }> {
  const texture = await makePaletteTexture(128, 128, (x, y) => {
    const v = (x * 23 + y * 29) % 30;
    // Massive fiery magma & blood cracks
    if ((x + y * 2) % 17 === 0 || (x * 3 + y) % 23 === 0) {
      return [255, 40, 20, 255]; // burning lava blood veins
    }
    // Obsidian dark demon hide
    return [20 + v / 2, 16 + v / 2, 22 + v / 2, 255];
  });

  const builder = ModelBuilder.create({
    name: 'the_ancient_one',
    format: 'bedrock',
    resolution: { width: 128, height: 128 },
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  const torso = builder.addBone({ name: 'torso', origin: [0, 24, 0] }, root.name);
  builder.addCube({ name: 'colossal_chest', from: [-9, 20, -6], to: [9, 38, 6], origin: [0, 29, 0], uvOffset: [0, 0] }, torso.name);
  builder.addCube({ name: 'back_spikes', from: [-2, 24, 6], to: [2, 42, 9], origin: [0, 33, 7.5], uvOffset: [60, 0] }, torso.name);

  // 4 Giant Horned Head
  const head = builder.addBone({ name: 'head', origin: [0, 38, -2] }, torso.name);
  builder.addCube({ name: 'demon_skull', from: [-5, 38, -8], to: [5, 48, 2], origin: [0, 43, -3], uvOffset: [0, 36] }, head.name);
  builder.addCube({ name: 'demon_horn_l', from: [5, 46, -4], to: [12, 58, 0], origin: [8.5, 52, -2], uvOffset: [40, 36] }, head.name);
  builder.addCube({ name: 'demon_horn_r', from: [-12, 46, -4], to: [-5, 58, 0], origin: [-8.5, 52, -2], uvOffset: [40, 36] }, head.name);

  // Quad Arms (4 arms!)
  const rArmUpper = builder.addBone({ name: 'arm_right_upper', origin: [-9, 36, 0] }, torso.name);
  builder.addCube({ name: 'r_u_arm', from: [-14, 22, -3], to: [-9, 36, 3], origin: [-11.5, 29, 0], uvOffset: [68, 36] }, rArmUpper.name);

  const lArmUpper = builder.addBone({ name: 'arm_left_upper', origin: [9, 36, 0] }, torso.name);
  builder.addCube({ name: 'l_u_arm', from: [9, 22, -3], to: [14, 36, 3], origin: [11.5, 29, 0], uvOffset: [68, 36] }, lArmUpper.name);

  const rArmLower = builder.addBone({ name: 'arm_right_lower', origin: [-9, 26, 0] }, torso.name);
  builder.addCube({ name: 'r_l_arm', from: [-13, 14, -2.5], to: [-9, 26, 2.5], origin: [-11, 20, 0], uvOffset: [88, 36] }, rArmLower.name);

  const lArmLower = builder.addBone({ name: 'arm_left_lower', origin: [9, 26, 0] }, torso.name);
  builder.addCube({ name: 'l_l_arm', from: [9, 14, -2.5], to: [13, 26, 2.5], origin: [11, 20, 0], uvOffset: [88, 36] }, lArmLower.name);

  // Massive Pillar Legs
  const rLeg = builder.addBone({ name: 'leg_right', origin: [-5, 20, 0] }, root.name);
  builder.addCube({ name: 'r_leg_cube', from: [-8, 0, -4], to: [-2, 20, 4], origin: [-5, 10, 0], uvOffset: [0, 60] }, rLeg.name);

  const lLeg = builder.addBone({ name: 'leg_left', origin: [5, 20, 0] }, root.name);
  builder.addCube({ name: 'l_leg_cube', from: [2, 0, -4], to: [8, 20, 4], origin: [5, 10, 0], uvOffset: [0, 60] }, lLeg.name);

  bindTextureToModel(builder, 'the_ancient_one.png', texture);

  const animations: Record<string, GeckoLibAnimation> = {
    'animation.the_ancient_one.idle': {
      loop: true,
      animation_length: 3.0,
      bones: {
        torso: { position: { '0.00': [0, 0, 0], '1.50': [0, 0.7, 0], '3.00': [0, 0, 0] } },
        arm_right_upper: { rotation: { '0.00': [0, 0, 0], '1.50': [10, 0, -10], '3.00': [0, 0, 0] } },
        arm_left_upper: { rotation: { '0.00': [0, 0, 0], '1.50': [10, 0, 10], '3.00': [0, 0, 0] } },
        arm_right_lower: { rotation: { '0.00': [0, 0, 0], '1.50': [-10, 0, -10], '3.00': [0, 0, 0] } },
        arm_left_lower: { rotation: { '0.00': [0, 0, 0], '1.50': [-10, 0, 10], '3.00': [0, 0, 0] } },
      },
    },
    'animation.the_ancient_one.walk': {
      loop: true,
      animation_length: 1.4,
      bones: {
        leg_right: { rotation: { '0.00': [-25, 0, 0], '0.70': [25, 0, 0], '1.40': [-25, 0, 0] } },
        leg_left: { rotation: { '0.00': [25, 0, 0], '0.70': [-25, 0, 0], '1.40': [25, 0, 0] } },
        torso: { position: { '0.00': [0, 0, 0], '0.35': [0, 1, 0], '0.70': [0, 0, 0], '1.05': [0, 1, 0], '1.40': [0, 0, 0] } },
      },
    },
    'animation.the_ancient_one.ground_slam': {
      loop: false,
      animation_length: 1.2,
      bones: {
        torso: { rotation: { '0.00': [0, 0, 0], '0.50': [-20, 0, 0], '0.75': [30, 0, 0], '1.20': [0, 0, 0] } },
        arm_right_upper: { rotation: { '0.00': [0, 0, 0], '0.50': [-120, 0, 0], '0.75': [50, 0, 0], '1.20': [0, 0, 0] } },
        arm_left_upper: { rotation: { '0.00': [0, 0, 0], '0.50': [-120, 0, 0], '0.75': [50, 0, 0], '1.20': [0, 0, 0] } },
      },
    },
  };

  return { builder, animations, texture };
}

// 4. PROPS & ITEMS
async function createBloodAltar(): Promise<{ builder: ModelBuilder; texture: Buffer }> {
  const texture = await makePaletteTexture(64, 64, (x, y) => {
    // Carved black stone with crimson blood runes
    const isRune = (x >= 20 && x <= 44 && y >= 20 && y <= 44) && ((x === y) || (x + y === 64) || (x === 32) || (y === 32));
    if (isRune) return [255, 0, 0, 255]; // glowing blood rune
    const stoneNoise = (x * 11 + y * 13) % 20;
    return [30 + stoneNoise, 30 + stoneNoise, 35 + stoneNoise, 255];
  });

  const builder = ModelBuilder.create({
    name: 'blood_altar',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  builder.addCube({ name: 'altar_slab', from: [-12, 0, -12], to: [12, 4, 12], origin: [0, 2, 0], uvOffset: [0, 0] }, root.name);
  builder.addCube({ name: 'altar_pillar', from: [-6, 4, -6], to: [6, 14, 6], origin: [0, 9, 0], uvOffset: [0, 28] }, root.name);
  builder.addCube({ name: 'ritual_basin', from: [-8, 14, -8], to: [8, 17, 8], origin: [0, 15.5, 0], uvOffset: [24, 28] }, root.name);

  bindTextureToModel(builder, 'blood_altar.png', texture);
  return { builder, texture };
}

async function createBearTrap(): Promise<{ builder: ModelBuilder; texture: Buffer }> {
  const texture = await makePaletteTexture(32, 32, (x, y) => {
    const rust = (x * 7 + y * 11) % 25;
    return [110 + rust, 60 + rust / 2, 40, 255]; // rusted iron
  });

  const builder = ModelBuilder.create({
    name: 'rusty_bear_trap',
    format: 'bedrock',
    resolution: { width: 32, height: 32 },
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  builder.addCube({ name: 'base_plate', from: [-6, 0, -6], to: [6, 1, 6], origin: [0, 0.5, 0], uvOffset: [0, 0] }, root.name);
  builder.addCube({ name: 'jaw_left', from: [-6, 1, -5], to: [-5, 4, 5], origin: [-5.5, 2.5, 0], uvOffset: [0, 14] }, root.name);
  builder.addCube({ name: 'jaw_right', from: [5, 1, -5], to: [6, 4, 5], origin: [5.5, 2.5, 0], uvOffset: [0, 14] }, root.name);

  bindTextureToModel(builder, 'rusty_bear_trap.png', texture);
  return { builder, texture };
}

async function bundleAddonZip(sourceDirs: string[], destZip: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destZip);
    const archive = new (ZipArchive as any)({ zlib: { level: 9 } });
    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));
    archive.pipe(output);

    for (const dir of sourceDirs) {
      archive.directory(dir, path.basename(dir));
    }
    archive.finalize();
  });
}

async function main() {
  console.log('=== Building The Forgotten Woods Full Suite ===');

  // 1. Build All 3D Models
  console.log('1. Building Stalker...');
  const stalker = await createWoodsStalker();
  writeFile(path.join(TARGET_DIR, 'model.bbmodel'), stalker.builder.toJSON());
  writeFile(path.join(TARGET_DIR, 'the_woods_stalker.bbmodel'), stalker.builder.toJSON());

  console.log('2. Building Crypt Crawler...');
  const crawler = await createCryptCrawler();
  writeFile(path.join(TARGET_DIR, 'crypt_crawler.bbmodel'), crawler.builder.toJSON());

  console.log('3. Building The Ancient One (Boss)...');
  const ancientOne = await createAncientOneBoss();
  writeFile(path.join(TARGET_DIR, 'the_ancient_one.bbmodel'), ancientOne.builder.toJSON());

  console.log('4. Building Props (Blood Altar & Bear Trap)...');
  const altar = await createBloodAltar();
  writeFile(path.join(TARGET_DIR, 'blood_altar.bbmodel'), altar.builder.toJSON());

  const trap = await createBearTrap();
  writeFile(path.join(TARGET_DIR, 'rusty_bear_trap.bbmodel'), trap.builder.toJSON());

  // 2. Export Bedrock Resource Pack (RP)
  console.log('5. Assembling Unified Resource Pack...');
  // Manifest
  const rpManifest = {
    format_version: 2,
    header: {
      name: 'The Forgotten Woods [RP]',
      description: 'Official Resource Pack for The Forgotten Woods Minecraft Horror Addon',
      uuid: uuidv4(),
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [{ type: 'resources', uuid: uuidv4(), version: [1, 0, 0] }],
  };
  writeFile(path.join(RP_DIR, 'manifest.json'), JSON.stringify(rpManifest, null, 2));

  // Geometries
  writeFile(
    path.join(RP_DIR, 'models', 'entity', 'the_woods_stalker.geo.json'),
    JSON.stringify(GeckoLibExporter.exportGeoJSON(stalker.builder, 'geometry.the_woods_stalker'), null, 2)
  );
  writeFile(
    path.join(RP_DIR, 'models', 'entity', 'crypt_crawler.geo.json'),
    JSON.stringify(GeckoLibExporter.exportGeoJSON(crawler.builder, 'geometry.crypt_crawler'), null, 2)
  );
  writeFile(
    path.join(RP_DIR, 'models', 'entity', 'the_ancient_one.geo.json'),
    JSON.stringify(GeckoLibExporter.exportGeoJSON(ancientOne.builder, 'geometry.the_ancient_one'), null, 2)
  );
  writeFile(
    path.join(RP_DIR, 'models', 'entity', 'blood_altar.geo.json'),
    JSON.stringify(GeckoLibExporter.exportGeoJSON(altar.builder, 'geometry.blood_altar'), null, 2)
  );

  // Animations
  writeFile(
    path.join(RP_DIR, 'animations', 'the_woods_stalker.animation.json'),
    JSON.stringify(GeckoLibExporter.exportAnimationJSON(stalker.animations), null, 2)
  );
  writeFile(
    path.join(RP_DIR, 'animations', 'crypt_crawler.animation.json'),
    JSON.stringify(GeckoLibExporter.exportAnimationJSON(crawler.animations), null, 2)
  );
  writeFile(
    path.join(RP_DIR, 'animations', 'the_ancient_one.animation.json'),
    JSON.stringify(GeckoLibExporter.exportAnimationJSON(ancientOne.animations), null, 2)
  );

  // Textures
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'the_woods_stalker.png'), stalker.texture);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'crypt_crawler.png'), crawler.texture);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'the_ancient_one.png'), ancientOne.texture);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'blood_altar.png'), altar.texture);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'rusty_bear_trap.png'), trap.texture);

  // Client Entities
  const makeClientEntity = (id: string, geo: string, tex: string, anims: Record<string, string>) => ({
    format_version: '1.10.0',
    'minecraft:client_entity': {
      description: {
        identifier: `forgotten_woods:${id}`,
        materials: { default: 'entity_alphatest' },
        textures: { default: `textures/entity/${tex}` },
        geometry: { default: `geometry.${geo}` },
        animations: anims,
        scripts: { animate: Object.keys(anims) },
        render_controllers: ['controller.render.default'],
        spawn_egg: { base_color: '#1a1a1a', overlay_color: '#cc0000' },
      },
    },
  });

  writeFile(
    path.join(RP_DIR, 'entity', 'the_woods_stalker.entity.json'),
    JSON.stringify(makeClientEntity('the_woods_stalker', 'the_woods_stalker', 'the_woods_stalker', {
      idle: 'animation.the_woods_stalker.idle',
      walk: 'animation.the_woods_stalker.walk',
      attack: 'animation.the_woods_stalker.attack',
    }), null, 2)
  );

  writeFile(
    path.join(RP_DIR, 'entity', 'crypt_crawler.entity.json'),
    JSON.stringify(makeClientEntity('crypt_crawler', 'crypt_crawler', 'crypt_crawler', {
      crawl: 'animation.crypt_crawler.crawl',
      attack: 'animation.crypt_crawler.attack',
    }), null, 2)
  );

  writeFile(
    path.join(RP_DIR, 'entity', 'the_ancient_one.entity.json'),
    JSON.stringify(makeClientEntity('the_ancient_one', 'the_ancient_one', 'the_ancient_one', {
      idle: 'animation.the_ancient_one.idle',
      walk: 'animation.the_ancient_one.walk',
      slam: 'animation.the_ancient_one.ground_slam',
    }), null, 2)
  );

  // Render Controller
  const renderController = {
    format_version: '1.8.0',
    render_controllers: {
      'controller.render.default': {
        geometry: 'Geometry.default',
        materials: [{ '*': 'Material.default' }],
        textures: ['Texture.default'],
      },
    },
  };
  writeFile(path.join(RP_DIR, 'render_controllers', 'entity.render_controllers.json'), JSON.stringify(renderController, null, 2));

  // Localization
  const lang = [
    'entity.forgotten_woods:the_woods_stalker.name=The Woods Stalker',
    'item.spawn_egg.entity.forgotten_woods:the_woods_stalker.name=Spawn The Woods Stalker',
    'entity.forgotten_woods:crypt_crawler.name=Crypt Crawler',
    'item.spawn_egg.entity.forgotten_woods:crypt_crawler.name=Spawn Crypt Crawler',
    'entity.forgotten_woods:the_ancient_one.name=The Ancient One (Elder Boss)',
    'item.spawn_egg.entity.forgotten_woods:the_ancient_one.name=Awaken The Ancient One',
    'item.forgotten_woods:forgotten_lantern.name=Survivor\'s Soul Lantern',
    'item.forgotten_woods:sacrificial_dagger.name=Cursed Sacrificial Dagger',
  ].join('\n');
  writeFile(path.join(RP_DIR, 'texts', 'en_US.lang'), lang);

  // 3. Export Bedrock Behavior Pack (BP)
  console.log('6. Assembling Unified Behavior Pack...');
  const bpManifest = {
    format_version: 2,
    header: {
      name: 'The Forgotten Woods [BP]',
      description: 'Official Behavior Pack for The Forgotten Woods Minecraft Horror Addon',
      uuid: uuidv4(),
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0],
    },
    modules: [{ type: 'data', uuid: uuidv4(), version: [1, 0, 0] }],
    dependencies: [{ uuid: rpManifest.header.uuid, version: [1, 0, 0] }],
  };
  writeFile(path.join(BP_DIR, 'manifest.json'), JSON.stringify(bpManifest, null, 2));

  // Entity Behaviors
  const makeBehaviorEntity = (id: string, health: number, dmg: number, speed: number, scale: number = 1.0) => ({
    format_version: '1.16.0',
    'minecraft:entity': {
      description: {
        identifier: `forgotten_woods:${id}`,
        is_spawnable: true,
        is_summonable: true,
        is_experimental: false,
      },
      component_groups: {},
      components: {
        'minecraft:type_family': { family: ['monster', 'mob', 'horror'] },
        'minecraft:health': { value: health, max: health },
        'minecraft:damage_sensor': { triggers: { cause: 'all', deals_damage: true } },
        'minecraft:collision_box': { width: 0.8 * scale, height: 2.2 * scale },
        'minecraft:scale': { value: scale },
        'minecraft:movement': { value: speed },
        'minecraft:navigation.walk': { can_path_over_water: true, avoid_water: true },
        'minecraft:movement.basic': {},
        'minecraft:jump.static': {},
        'minecraft:can_climb': {},
        'minecraft:attack': { damage: dmg },
        'minecraft:behavior.melee_attack': { priority: 1, speed_multiplier: 1.3, track_target: true },
        'minecraft:behavior.nearest_attackable_target': {
          priority: 2,
          entity_types: [{ filters: { test: 'is_family', subject: 'other', value: 'player' }, max_dist: 40 }],
          must_see: false,
        },
        'minecraft:behavior.random_stroll': { priority: 4, speed_multiplier: 0.8 },
        'minecraft:behavior.look_at_player': { priority: 5, look_distance: 12 },
        'minecraft:behavior.random_look_around': { priority: 6 },
        'minecraft:physics': {},
        'minecraft:pushable': { is_pushable: false },
      },
    },
  });

  writeFile(path.join(BP_DIR, 'entities', 'the_woods_stalker.json'), JSON.stringify(makeBehaviorEntity('the_woods_stalker', 75, 14, 0.38, 1.2), null, 2));
  writeFile(path.join(BP_DIR, 'entities', 'crypt_crawler.json'), JSON.stringify(makeBehaviorEntity('crypt_crawler', 40, 10, 0.45, 0.9), null, 2));
  writeFile(path.join(BP_DIR, 'entities', 'the_ancient_one.json'), JSON.stringify(makeBehaviorEntity('the_ancient_one', 350, 24, 0.32, 2.0), null, 2));

  // Spawn Rules
  const makeSpawnRule = (id: string, biomes: string[], weight: number) => ({
    format_version: '1.8.0',
    'minecraft:spawn_rules': {
      description: { identifier: `forgotten_woods:${id}`, population_control: 'monster' },
      conditions: [{
        'minecraft:spawns_on_surface': {},
        'minecraft:brightness_filter': { min: 0, max: 6, adjust_for_weather: true },
        'minecraft:weight': { default: weight },
        'minecraft:biome_filter': biomes.map(b => ({ test: 'has_biome_tag', operator: '==', value: b })),
      }],
    },
  });

  writeFile(path.join(BP_DIR, 'spawn_rules', 'the_woods_stalker.json'), JSON.stringify(makeSpawnRule('the_woods_stalker', ['forest'], 50), null, 2));
  writeFile(path.join(BP_DIR, 'spawn_rules', 'crypt_crawler.json'), JSON.stringify(makeSpawnRule('crypt_crawler', ['plains', 'forest'], 40), null, 2));

  // 4. Bundle into Final .mcaddon
  console.log('7. Compiling The_Forgotten_Woods_Ultimate.mcaddon...');
  const ultimateAddonPath = path.join(TARGET_DIR, 'The_Forgotten_Woods_Ultimate.mcaddon');
  await bundleAddonZip([RP_DIR, BP_DIR], ultimateAddonPath);

  // Sync to standard The_Forgotten_Woods.mcaddon as well
  fs.copyFileSync(ultimateAddonPath, path.join(TARGET_DIR, 'The_Forgotten_Woods.mcaddon'));

  console.log('=== COMPLETE! All models & unified addon built successfully! ===');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
