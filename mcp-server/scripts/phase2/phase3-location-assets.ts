import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ZipArchive } from 'archiver';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import { BBModel, Element } from '../../src/core/types/bbmodel.types.js';

const TARGET_DIR = 'D:\\do note delete\\Desktop\\MC horror mod';
const RP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_RP');
const BP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_BP');

function writeFile(targetPath: string, content: string | Buffer) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

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

function exportToBedrockGeometry(model: BBModel, geometryIdentifier: string) {
  const rootBone = {
    name: 'root',
    pivot: [0, 0, 0],
    cubes: [] as any[],
  };

  model.elements.forEach(el => {
    const cube = {
      origin: [el.from[0], el.from[1], el.from[2]],
      size: [
        Math.abs(el.to[0] - el.from[0]),
        Math.abs(el.to[1] - el.from[1]),
        Math.abs(el.to[2] - el.from[2]),
      ],
      uv: [el.faces.north?.uv?.[0] || 0, el.faces.north?.uv?.[1] || 0],
    };
    rootBone.cubes.push(cube);
  });

  return {
    format_version: '1.12.0',
    [`minecraft:geometry`]: [
      {
        description: {
          identifier: geometryIdentifier,
          texture_width: model.resolution.width,
          texture_height: model.resolution.height,
          visible_bounds_width: 2,
          visible_bounds_height: 3,
          visible_bounds_offset: [0, 1, 0],
        },
        bones: [rootBone],
      },
    ],
  };
}

// 1. The Weeping Wraith (Angel of Death / Graveyard Weeping Statue)
export async function createWeepingWraithModel() {
  const builder = ModelBuilder.create({
    name: 'weeping_wraith',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
  });

  // Weathered mossy tombstone granite with cracked stone crevices
  const texture = await makePaletteTexture(64, 64, (x, y) => {
    const stoneBase = 110 + ((x * 17 + y * 23) % 25);
    // Moss stains (greenish patches)
    if ((x + y) % 13 === 0 || (x * y) % 29 === 0) {
      return [stoneBase - 25, stoneBase + 10, stoneBase - 30, 255];
    }
    // Deep black weeping tear streaks running down face
    if (x >= 20 && x <= 22 && y >= 14 && y <= 24) {
      return [20, 20, 25, 255]; // Black liquid tears
    }
    if (x >= 26 && x <= 28 && y >= 14 && y <= 24) {
      return [20, 20, 25, 255];
    }
    return [stoneBase, stoneBase, stoneBase, 255];
  });

  const root = builder.addBone({ name: 'wraith', origin: [0, 0, 0] });

  // Stone Pedestal / Coffin Base
  builder.addCube({
    name: 'pedestal',
    from: [-6, 0, -6],
    to: [6, 2, 6],
    origin: [0, 1, 0],
    uvOffset: [0, 0],
  }, root.name);

  // Flowing Stone Shroud / Skirt
  builder.addCube({
    name: 'stone_robe_lower',
    from: [-4.5, 2, -4],
    to: [4.5, 14, 4],
    origin: [0, 8, 0],
    uvOffset: [0, 16],
  }, root.name);

  // Slender Torso
  builder.addCube({
    name: 'torso',
    from: [-3.5, 14, -2.5],
    to: [3.5, 24, 2.5],
    origin: [0, 19, 0],
    uvOffset: [20, 16],
  }, root.name);

  // Head bowed down in weeping pose
  builder.addCube({
    name: 'head',
    from: [-3, 23.5, -4.5],
    to: [3, 29.5, 1.5],
    origin: [0, 26.5, -1.5],
    uvOffset: [0, 36],
  }, root.name);

  // Arms shielding face / clutching head in grief
  builder.addCube({
    name: 'left_arm',
    from: [-5, 16, -5.5],
    to: [-2.5, 26, -2.5],
    origin: [-3.75, 21, -4],
    uvOffset: [36, 0],
  }, root.name);
  builder.addCube({
    name: 'right_arm',
    from: [2.5, 16, -5.5],
    to: [5, 26, -2.5],
    origin: [3.75, 21, -4],
    uvOffset: [36, 0],
  }, root.name);

  // Broken Decaying Stone Angel Wings
  builder.addCube({
    name: 'wing_left',
    from: [-12, 16, 2],
    to: [-3, 30, 3.5],
    origin: [-7.5, 23, 2.75],
    uvOffset: [0, 48],
  }, root.name);
  builder.addCube({
    name: 'wing_right',
    from: [3, 16, 2],
    to: [12, 30, 3.5],
    origin: [7.5, 23, 2.75],
    uvOffset: [0, 48],
  }, root.name);

  bindTextureToModel(builder, 'weeping_wraith.png', texture);
  return { builder, texture };
}

// 2. The Headless Shifting Mannequin (Cabin Horror Prop)
export async function createMannequinModel() {
  const builder = ModelBuilder.create({
    name: 'headless_mannequin',
    format: 'bedrock',
    resolution: { width: 32, height: 32 },
  });

  // Rotting aged wood and cracked tailor fabric
  const texture = await makePaletteTexture(32, 32, (x, y) => {
    const grain = (x * 9 + y * 13) % 20;
    return [130 + grain, 95 + grain / 2, 60, 255];
  });

  const root = builder.addBone({ name: 'mannequin', origin: [0, 0, 0] });

  // Tripod Stand Base
  builder.addCube({
    name: 'base_pole',
    from: [-1, 0, -1],
    to: [1, 10, 1],
    origin: [0, 5, 0],
    uvOffset: [0, 0],
  }, root.name);
  builder.addCube({
    name: 'stand_leg1',
    from: [-4, 0, -4],
    to: [4, 1, 4],
    origin: [0, 0.5, 0],
    uvOffset: [0, 4],
  }, root.name);

  // Mannequin Wooden Pelvis & Torso (headless, cloth stuffed)
  builder.addCube({
    name: 'lower_body',
    from: [-3, 10, -2],
    to: [3, 17, 2],
    origin: [0, 13.5, 0],
    uvOffset: [0, 10],
  }, root.name);
  builder.addCube({
    name: 'chest_torso',
    from: [-4, 17, -2.5],
    to: [4, 25, 2.5],
    origin: [0, 21, 0],
    uvOffset: [12, 10],
  }, root.name);

  // Severed Neck Stump with rusty brass screw
  builder.addCube({
    name: 'neck_stump',
    from: [-1.2, 25, -1.2],
    to: [1.2, 27, 1.2],
    origin: [0, 26, 0],
    uvOffset: [0, 24],
  }, root.name);

  bindTextureToModel(builder, 'headless_mannequin.png', texture);
  return { builder, texture };
}

// 3. Cabin Hiding Wardrobe (Interactable Furniture Model)
export async function createWardrobeModel() {
  const builder = ModelBuilder.create({
    name: 'cabin_wardrobe',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
  });

  // Dark decaying antique mahogany wood with metal handles
  const texture = await makePaletteTexture(64, 64, (x, y) => {
    if (x >= 30 && x <= 34 && y >= 30 && y <= 34) {
      return [180, 160, 60, 255]; // Brass keyhole & handle
    }
    const wood = (x * 7 + y * 19) % 24;
    return [55 + wood, 32 + Math.floor(wood * 0.6), 20, 255];
  });

  const root = builder.addBone({ name: 'wardrobe', origin: [0, 0, 0] });

  // Outer Cabinet Frame
  builder.addCube({
    name: 'cabinet_base',
    from: [-8, 0, -8],
    to: [8, 3, 8],
    origin: [0, 1.5, 0],
    uvOffset: [0, 0],
  }, root.name);
  builder.addCube({
    name: 'cabinet_body',
    from: [-8, 3, -7],
    to: [8, 31, 8],
    origin: [0, 17, 0.5],
    uvOffset: [0, 16],
  }, root.name);

  // Double Doors with Eye-slit gap
  builder.addCube({
    name: 'door_left',
    from: [-7.5, 3, -8],
    to: [-0.5, 30, -7],
    origin: [-4, 16.5, -7.5],
    uvOffset: [36, 0],
  }, root.name);
  builder.addCube({
    name: 'door_right',
    from: [0.5, 3, -8],
    to: [7.5, 30, -7],
    origin: [4, 16.5, -7.5],
    uvOffset: [36, 0],
  }, root.name);

  bindTextureToModel(builder, 'cabin_wardrobe.png', texture);
  return { builder, texture };
}

// Zip bundle helper
function bundleAddonZip(sourceDirs: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = new (ZipArchive as any)({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));
    archive.pipe(output);

    sourceDirs.forEach((dir) => {
      const folderName = path.basename(dir);
      archive.directory(dir, folderName);
    });

    archive.finalize();
  });
}

export async function runPhase3AssetsBuild() {
  console.log('=== Building Phase 3 3D Assets: Weeping Wraith, Mannequin, Wardrobe ===');

  // 1. Weeping Wraith
  console.log('1. Building Weeping Wraith Model...');
  const wraith = await createWeepingWraithModel();
  writeFile(path.join(TARGET_DIR, 'weeping_wraith.bbmodel'), JSON.stringify(wraith.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'weeping_wraith.geo.json'), JSON.stringify(exportToBedrockGeometry(wraith.builder.getModel(), 'geometry.weeping_wraith'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'weeping_wraith.png'), wraith.texture);

  // 2. Headless Mannequin
  console.log('2. Building Headless Mannequin Model...');
  const mannequin = await createMannequinModel();
  writeFile(path.join(TARGET_DIR, 'headless_mannequin.bbmodel'), JSON.stringify(mannequin.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'headless_mannequin.geo.json'), JSON.stringify(exportToBedrockGeometry(mannequin.builder.getModel(), 'geometry.headless_mannequin'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'headless_mannequin.png'), mannequin.texture);

  // 3. Cabin Wardrobe
  console.log('3. Building Cabin Wardrobe Model...');
  const wardrobe = await createWardrobeModel();
  writeFile(path.join(TARGET_DIR, 'cabin_wardrobe.bbmodel'), JSON.stringify(wardrobe.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'cabin_wardrobe.geo.json'), JSON.stringify(exportToBedrockGeometry(wardrobe.builder.getModel(), 'geometry.cabin_wardrobe'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'cabin_wardrobe.png'), wardrobe.texture);

  // 4. Client Entity Definitions
  const makeClientEntity = (id: string, geo: string, tex: string) => ({
    format_version: '1.10.0',
    'minecraft:client_entity': {
      description: {
        identifier: `forgotten_woods:${id}`,
        materials: { default: 'entity_alphatest' },
        textures: { default: `textures/entity/${tex}` },
        geometry: { default: `geometry.${geo}` },
        render_controllers: ['controller.render.default'],
      },
    },
  });

  writeFile(path.join(RP_DIR, 'entity', 'weeping_wraith.entity.json'), JSON.stringify(makeClientEntity('weeping_wraith', 'weeping_wraith', 'weeping_wraith'), null, 2));
  writeFile(path.join(RP_DIR, 'entity', 'headless_mannequin.entity.json'), JSON.stringify(makeClientEntity('headless_mannequin', 'headless_mannequin', 'headless_mannequin'), null, 2));
  writeFile(path.join(RP_DIR, 'entity', 'cabin_wardrobe.entity.json'), JSON.stringify(makeClientEntity('cabin_wardrobe', 'cabin_wardrobe', 'cabin_wardrobe'), null, 2));

  // 5. Behavior Entity Definitions
  const makeStaticEntity = (id: string, health: number = 50) => ({
    format_version: '1.16.0',
    'minecraft:entity': {
      description: {
        identifier: `forgotten_woods:${id}`,
        is_spawnable: true,
        is_summonable: true,
        is_experimental: false,
      },
      components: {
        'minecraft:type_family': { family: ['horror', 'prop'] },
        'minecraft:health': { value: health, max: health },
        'minecraft:collision_box': { width: 0.8, height: 1.9 },
        'minecraft:physics': {},
        'minecraft:pushable': { is_pushable: false },
      },
    },
  });

  const makeWraithEntity = () => ({
    format_version: '1.16.0',
    'minecraft:entity': {
      description: {
        identifier: 'forgotten_woods:weeping_wraith',
        is_spawnable: true,
        is_summonable: true,
        is_experimental: false,
      },
      components: {
        'minecraft:type_family': { family: ['horror', 'monster', 'wraith'] },
        'minecraft:health': { value: 60, max: 60 },
        'minecraft:collision_box': { width: 0.7, height: 1.9 },
        'minecraft:movement': { value: 0.55 },
        'minecraft:attack': { damage: 18 },
        'minecraft:physics': {},
        'minecraft:pushable': { is_pushable: false },
      },
    },
  });

  writeFile(path.join(BP_DIR, 'entities', 'weeping_wraith.json'), JSON.stringify(makeWraithEntity(), null, 2));
  writeFile(path.join(BP_DIR, 'entities', 'headless_mannequin.json'), JSON.stringify(makeStaticEntity('headless_mannequin', 30), null, 2));
  writeFile(path.join(BP_DIR, 'entities', 'cabin_wardrobe.json'), JSON.stringify(makeStaticEntity('cabin_wardrobe', 100), null, 2));

  // 6. Sound Definitions update
  const soundDefsPath = path.join(RP_DIR, 'sounds', 'sound_definitions.json');
  let soundDefs: any = {};
  if (fs.existsSync(soundDefsPath)) {
    soundDefs = JSON.parse(fs.readFileSync(soundDefsPath, 'utf8'));
  }
  soundDefs.sound_definitions = soundDefs.sound_definitions || {};
  soundDefs.sound_definitions['forgotten_woods.stone_slide'] = {
    category: 'hostile',
    sounds: [{ name: 'sounds/horror/stone_slide', volume: 1.2, pitch: 0.8 }],
  };
  soundDefs.sound_definitions['forgotten_woods.clock_chime'] = {
    category: 'ambient',
    sounds: [{ name: 'sounds/horror/clock_chime', volume: 1.5, pitch: 0.75 }],
  };
  soundDefs.sound_definitions['forgotten_woods.jumpscare_screech'] = {
    category: 'hostile',
    sounds: [{ name: 'sounds/horror/jumpscare_screech', volume: 1.8, pitch: 1.0 }],
  };
  soundDefs.sound_definitions['forgotten_woods.heartbeat_fast'] = {
    category: 'player',
    sounds: [{ name: 'sounds/horror/heartbeat_fast', volume: 1.2, pitch: 1.0 }],
  };
  writeFile(soundDefsPath, JSON.stringify(soundDefs, null, 2));

  // 7. Update en_US.lang
  const langAppend = [
    '',
    '## Phase 3 Location Horrors',
    'entity.forgotten_woods:weeping_wraith.name=The Weeping Wraith (Statue)',
    'item.spawn_egg.entity.forgotten_woods:weeping_wraith.name=Place Weeping Wraith Statue',
    'entity.forgotten_woods:headless_mannequin.name=Headless Cabin Mannequin',
    'item.spawn_egg.entity.forgotten_woods:headless_mannequin.name=Place Headless Mannequin',
    'entity.forgotten_woods:cabin_wardrobe.name=Decaying Safehouse Wardrobe',
    'item.spawn_egg.entity.forgotten_woods:cabin_wardrobe.name=Place Hiding Wardrobe',
  ].join('\n');
  const curLang = fs.readFileSync(path.join(RP_DIR, 'texts', 'en_US.lang'), 'utf8');
  if (!curLang.includes('weeping_wraith')) {
    writeFile(path.join(RP_DIR, 'texts', 'en_US.lang'), curLang + '\n' + langAppend);
  }

  // 8. Bundle Addon
  console.log('8. Re-packaging The_Forgotten_Woods_Ultimate.mcaddon...');
  const ultimateAddonPath = path.join(TARGET_DIR, 'The_Forgotten_Woods_Ultimate.mcaddon');
  await bundleAddonZip([RP_DIR, BP_DIR], ultimateAddonPath);
  fs.copyFileSync(ultimateAddonPath, path.join(TARGET_DIR, 'The_Forgotten_Woods.mcaddon'));

  console.log('=== Phase 3 3D Assets & Client Entities Built! ===');
}

if (process.argv[1]?.includes('phase3-location-assets.ts')) {
  runPhase3AssetsBuild().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
