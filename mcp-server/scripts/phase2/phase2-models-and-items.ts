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
    folder: 'item',
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

// Convert BBModel elements to Bedrock Geometry format (format_version: "1.12.0")
function exportToBedrockGeometry(model: BBModel, geometryIdentifier: string) {
  const bones: any[] = [];
  
  // Group elements by group/bone or create a root bone
  const boneMap = new Map<string, any>();
  const rootBone = {
    name: 'root',
    pivot: [0, 0, 0],
    cubes: [] as any[],
  };
  boneMap.set('root', rootBone);

  model.elements.forEach(el => {
    // Bedrock cube format
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

  bones.push(rootBone);

  return {
    format_version: '1.12.0',
    [`minecraft:geometry`]: [
      {
        description: {
          identifier: geometryIdentifier,
          texture_width: model.resolution.width,
          texture_height: model.resolution.height,
          visible_bounds_width: 2,
          visible_bounds_height: 2,
          visible_bounds_offset: [0, 0.5, 0],
        },
        bones,
      },
    ],
  };
}

// 1. Break-Action Double Barrel Shotgun Model
export async function createShotgunModel() {
  const builder = ModelBuilder.create({
    name: 'double_barrel_shotgun',
    format: 'bedrock',
    resolution: { width: 32, height: 32 },
  });

  // Dark weathered walnut wood stock & grip with oxidized blued gunmetal
  const texture = await makePaletteTexture(32, 32, (x, y) => {
    // Stock area (wood grain)
    if (x < 16 && y < 16) {
      const grain = (x * 7 + y * 13) % 17;
      return [70 + grain, 40 + Math.floor(grain * 0.6), 25 + Math.floor(grain * 0.4), 255]; // Aged walnut
    }
    // Metal barrels & receiver (oxidized blued steel with scratches)
    const steel = (x * 11 + y * 19) % 20;
    return [45 + steel, 48 + steel, 54 + steel, 255]; // Cold gunmetal
  });

  const root = builder.addBone({ name: 'shotgun', origin: [0, 4, 0] });

  // Wooden Stock & Buttpad
  builder.addCube({
    name: 'buttpad',
    from: [-1, 2, -10],
    to: [1, 6, -7],
    origin: [0, 4, -8.5],
    uvOffset: [0, 0],
  }, root.name);
  builder.addCube({
    name: 'stock_body',
    from: [-0.9, 2.5, -7],
    to: [0.9, 5.2, -2],
    origin: [0, 3.8, -4.5],
    uvOffset: [4, 0],
  }, root.name);
  builder.addCube({
    name: 'pistol_grip',
    from: [-0.8, 1, -2],
    to: [0.8, 3.5, 0],
    origin: [0, 2.2, -1],
    uvOffset: [0, 8],
  }, root.name);

  // Steel Receiver & Trigger Guard
  builder.addCube({
    name: 'receiver',
    from: [-1.1, 2.8, 0],
    to: [1.1, 5.5, 4],
    origin: [0, 4.1, 2],
    uvOffset: [16, 0],
  }, root.name);
  builder.addCube({
    name: 'trigger_guard',
    from: [-0.4, 1.8, 0.5],
    to: [0.4, 2.8, 2.5],
    origin: [0, 2.3, 1.5],
    uvOffset: [24, 0],
  }, root.name);
  builder.addCube({
    name: 'break_hinge',
    from: [-1.2, 3, 3.8],
    to: [1.2, 4.2, 4.8],
    origin: [0, 3.6, 4.3],
    uvOffset: [16, 8],
  }, root.name);

  // Double Barrels (Side by Side)
  builder.addCube({
    name: 'barrel_left',
    from: [-1.0, 3.6, 4.8],
    to: [-0.1, 5.0, 18],
    origin: [-0.55, 4.3, 11.4],
    uvOffset: [16, 12],
  }, root.name);
  builder.addCube({
    name: 'barrel_right',
    from: [0.1, 3.6, 4.8],
    to: [1.0, 5.0, 18],
    origin: [0.55, 4.3, 11.4],
    uvOffset: [16, 12],
  }, root.name);

  // Fore-end (Wooden grip under barrels)
  builder.addCube({
    name: 'fore_end',
    from: [-0.9, 2.7, 4.8],
    to: [0.9, 3.8, 10],
    origin: [0, 3.25, 7.4],
    uvOffset: [0, 16],
  }, root.name);

  // Front Sight Bead
  builder.addCube({
    name: 'front_sight',
    from: [-0.2, 5.0, 17.2],
    to: [0.2, 5.4, 17.8],
    origin: [0, 5.2, 17.5],
    uvOffset: [28, 0],
  }, root.name);

  bindTextureToModel(builder, 'double_barrel_shotgun.png', texture);
  return { builder, texture };
}

// 2. 12-Gauge Shotgun Shell Model
export async function createShotgunShellModel() {
  const builder = ModelBuilder.create({
    name: 'shotgun_shell',
    format: 'bedrock',
    resolution: { width: 16, height: 16 },
  });

  // Red plastic hull with brass metallic rim
  const texture = await makePaletteTexture(16, 16, (x, y) => {
    if (y < 5) {
      // Brass rim / primer base
      const brass = (x * 7 + y * 13) % 15;
      return [210 + brass, 170 + brass, 45, 255];
    }
    // Crimson red ribbed casing
    const red = (x * 11 + y * 7) % 25;
    return [180 + red, 20 + red, 15, 255];
  });

  const root = builder.addBone({ name: 'shell', origin: [0, 0, 0] });

  // Brass Rim / Extractor Rim
  builder.addCube({
    name: 'brass_base',
    from: [-0.9, 0, -0.9],
    to: [0.9, 1.2, 0.9],
    origin: [0, 0.6, 0],
    uvOffset: [0, 0],
  }, root.name);

  // Red Plastic Body
  builder.addCube({
    name: 'plastic_casing',
    from: [-0.75, 1.2, -0.75],
    to: [0.75, 4.2, 0.75],
    origin: [0, 2.7, 0],
    uvOffset: [0, 6],
  }, root.name);

  // Crimped Star Crimp Top
  builder.addCube({
    name: 'crimp_tip',
    from: [-0.7, 4.2, -0.7],
    to: [0.7, 4.5, 0.7],
    origin: [0, 4.35, 0],
    uvOffset: [8, 0],
  }, root.name);

  bindTextureToModel(builder, 'shotgun_shell.png', texture);
  return { builder, texture };
}

// 3. Throwable Glass Bottle Model (Distraction Item)
export async function createGlassBottleModel() {
  const builder = ModelBuilder.create({
    name: 'glass_bottle',
    format: 'bedrock',
    resolution: { width: 16, height: 16 },
  });

  // Semi-translucent murky forest green dirty glass
  const texture = await makePaletteTexture(16, 16, (x, y) => {
    if (y < 3) {
      // Cork stopper
      return [140, 100, 60, 255];
    }
    // Weathered green glass with grunge
    const gNoise = (x * 9 + y * 13) % 30;
    return [30 + gNoise, 80 + gNoise, 55 + gNoise, 220];
  });

  const root = builder.addBone({ name: 'bottle', origin: [0, 0, 0] });

  // Bottle Base & Lower Body
  builder.addCube({
    name: 'bottle_base',
    from: [-1.5, 0, -1.5],
    to: [1.5, 4.5, 1.5],
    origin: [0, 2.25, 0],
    uvOffset: [0, 0],
  }, root.name);

  // Sloped Shoulder
  builder.addCube({
    name: 'bottle_shoulder',
    from: [-1.1, 4.5, -1.1],
    to: [1.1, 5.5, 1.1],
    origin: [0, 5, 0],
    uvOffset: [0, 8],
  }, root.name);

  // Bottle Neck
  builder.addCube({
    name: 'bottle_neck',
    from: [-0.6, 5.5, -0.6],
    to: [0.6, 7.5, 0.6],
    origin: [0, 6.5, 0],
    uvOffset: [8, 0],
  }, root.name);

  // Cork Stopper
  builder.addCube({
    name: 'cork',
    from: [-0.5, 7.5, -0.5],
    to: [0.5, 8.5, 0.5],
    origin: [0, 8, 0],
    uvOffset: [10, 8],
  }, root.name);

  bindTextureToModel(builder, 'glass_bottle.png', texture);
  return { builder, texture };
}

// 4. Throwable Stone Pebble Model (Distraction Item)
export async function createStonePebbleModel() {
  const builder = ModelBuilder.create({
    name: 'stone_pebble',
    format: 'bedrock',
    resolution: { width: 16, height: 16 },
  });

  // Weathered granite pebble texture
  const texture = await makePaletteTexture(16, 16, (x, y) => {
    const grey = (x * 13 + y * 17) % 40;
    return [90 + grey, 88 + grey, 85 + grey, 255];
  });

  const root = builder.addBone({ name: 'pebble', origin: [0, 0, 0] });

  // Rough irregular stone block
  builder.addCube({
    name: 'rock_core',
    from: [-1.2, 0, -1.0],
    to: [1.2, 1.8, 1.0],
    origin: [0, 0.9, 0],
    uvOffset: [0, 0],
  }, root.name);
  builder.addCube({
    name: 'rock_facet1',
    from: [-0.8, 1.8, -0.8],
    to: [0.8, 2.3, 0.7],
    origin: [0, 2.05, -0.05],
    uvOffset: [0, 6],
  }, root.name);
  builder.addCube({
    name: 'rock_facet2',
    from: [-1.0, 0.3, -1.2],
    to: [0.7, 1.5, 1.2],
    origin: [-0.15, 0.9, 0],
    uvOffset: [6, 0],
  }, root.name);

  bindTextureToModel(builder, 'stone_pebble.png', texture);
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

export async function runPhase2Build() {
  console.log('=== Building Phase 2: Weapons, Items & Script Engine ===');

  // 1. Build Models
  console.log('1. Building Double Barrel Shotgun Model...');
  const shotgun = await createShotgunModel();
  writeFile(path.join(TARGET_DIR, 'double_barrel_shotgun.bbmodel'), JSON.stringify(shotgun.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'double_barrel_shotgun.geo.json'), JSON.stringify(exportToBedrockGeometry(shotgun.builder.getModel(), 'geometry.double_barrel_shotgun'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'items', 'double_barrel_shotgun.png'), shotgun.texture);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'double_barrel_shotgun.png'), shotgun.texture);

  console.log('2. Building Shotgun Shell Model...');
  const shell = await createShotgunShellModel();
  writeFile(path.join(TARGET_DIR, 'shotgun_shell.bbmodel'), JSON.stringify(shell.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'shotgun_shell.geo.json'), JSON.stringify(exportToBedrockGeometry(shell.builder.getModel(), 'geometry.shotgun_shell'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'items', 'shotgun_shell.png'), shell.texture);

  console.log('3. Building Glass Bottle Model...');
  const bottle = await createGlassBottleModel();
  writeFile(path.join(TARGET_DIR, 'glass_bottle.bbmodel'), JSON.stringify(bottle.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'glass_bottle.geo.json'), JSON.stringify(exportToBedrockGeometry(bottle.builder.getModel(), 'geometry.glass_bottle'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'items', 'glass_bottle.png'), bottle.texture);

  console.log('4. Building Stone Pebble Model...');
  const pebble = await createStonePebbleModel();
  writeFile(path.join(TARGET_DIR, 'stone_pebble.bbmodel'), JSON.stringify(pebble.builder.getModel(), null, 2));
  writeFile(path.join(RP_DIR, 'models', 'entity', 'stone_pebble.geo.json'), JSON.stringify(exportToBedrockGeometry(pebble.builder.getModel(), 'geometry.stone_pebble'), null, 2));
  writeFile(path.join(RP_DIR, 'textures', 'items', 'stone_pebble.png'), pebble.texture);

  console.log('5. Configuring Bedrock Item JSONs & Item Texture Definitions...');
  // item_texture.json
  const itemTexture = {
    resource_pack_name: 'the_forgotten_woods',
    texture_name: 'atlas.items',
    texture_data: {
      'forgotten_woods:double_barrel_shotgun': { textures: 'textures/items/double_barrel_shotgun' },
      'forgotten_woods:shotgun_shell': { textures: 'textures/items/shotgun_shell' },
      'forgotten_woods:glass_bottle': { textures: 'textures/items/glass_bottle' },
      'forgotten_woods:stone_pebble': { textures: 'textures/items/stone_pebble' },
      'forgotten_woods:rusty_bear_trap': { textures: 'textures/entity/rusty_bear_trap' },
    },
  };
  writeFile(path.join(RP_DIR, 'textures', 'item_texture.json'), JSON.stringify(itemTexture, null, 2));

  // Bedrock BP Items
  const makeItemDefinition = (id: string, icon: string, maxStack: number = 64, isWeapon: boolean = false) => ({
    format_version: '1.20.10',
    'minecraft:item': {
      description: {
        identifier: `forgotten_woods:${id}`,
        category: isWeapon ? 'Equipment' : 'Items',
      },
      components: {
        'minecraft:icon': { texture: `forgotten_woods:${id}` },
        'minecraft:max_stack_size': maxStack,
        'minecraft:hand_equipped': isWeapon,
        'minecraft:can_destroy_in_creative': false,
        ...(isWeapon ? {
          'minecraft:damage': 25,
          'minecraft:durability': { max_durability: 100 },
          'minecraft:cooldown': { category: 'shotgun', duration: 1.5 },
        } : {}),
      },
    },
  });

  writeFile(path.join(BP_DIR, 'items', 'double_barrel_shotgun.json'), JSON.stringify(makeItemDefinition('double_barrel_shotgun', 'double_barrel_shotgun', 1, true), null, 2));
  writeFile(path.join(BP_DIR, 'items', 'shotgun_shell.json'), JSON.stringify(makeItemDefinition('shotgun_shell', 'shotgun_shell', 16, false), null, 2));
  writeFile(path.join(BP_DIR, 'items', 'glass_bottle.json'), JSON.stringify(makeItemDefinition('glass_bottle', 'glass_bottle', 16, false), null, 2));
  writeFile(path.join(BP_DIR, 'items', 'stone_pebble.json'), JSON.stringify(makeItemDefinition('stone_pebble', 'stone_pebble', 32, false), null, 2));
  writeFile(path.join(BP_DIR, 'items', 'rusty_bear_trap.json'), JSON.stringify(makeItemDefinition('rusty_bear_trap', 'rusty_bear_trap', 4, false), null, 2));

  // Projectile Entities for Throwables
  const makeThrowableEntity = (id: string, gravity: number = 0.04) => ({
    format_version: '1.16.0',
    'minecraft:entity': {
      description: {
        identifier: `forgotten_woods:${id}_projectile`,
        is_spawnable: false,
        is_summonable: true,
        is_experimental: false,
      },
      components: {
        'minecraft:collision_box': { width: 0.25, height: 0.25 },
        'minecraft:projectile': {
          on_hit: {
            impact_damage: { damage: 1, knockback: true },
            stick_in_ground: false,
          },
          power: 1.5,
          gravity,
          inertia: 0.99,
          liquid_inertia: 0.6,
        },
        'minecraft:physics': {},
      },
    },
  });
  writeFile(path.join(BP_DIR, 'entities', 'glass_bottle_projectile.json'), JSON.stringify(makeThrowableEntity('glass_bottle', 0.05), null, 2));
  writeFile(path.join(BP_DIR, 'entities', 'stone_pebble_projectile.json'), JSON.stringify(makeThrowableEntity('stone_pebble', 0.06), null, 2));

  // Sound definitions for horror audio triggers
  const soundDefinitions = {
    format_version: '1.14.0',
    sound_definitions: {
      'forgotten_woods.door_creak': {
        category: 'ambient',
        sounds: [{ name: 'sounds/horror/door_creak', volume: 1.0, pitch: 0.85 }],
      },
      'forgotten_woods.chest_creak': {
        category: 'ambient',
        sounds: [{ name: 'sounds/horror/chest_creak', volume: 0.9, pitch: 0.9 }],
      },
      'forgotten_woods.shotgun_blast': {
        category: 'player',
        sounds: [{ name: 'sounds/weapons/shotgun_blast', volume: 1.8, pitch: 0.95 }],
      },
      'forgotten_woods.glass_break': {
        category: 'ambient',
        sounds: [{ name: 'sounds/horror/glass_break', volume: 1.2, pitch: 1.0 }],
      },
      'forgotten_woods.pebble_clatter': {
        category: 'ambient',
        sounds: [{ name: 'sounds/horror/pebble_clatter', volume: 0.8, pitch: 1.1 }],
      },
      'forgotten_woods.bear_trap_snap': {
        category: 'ambient',
        sounds: [{ name: 'sounds/horror/bear_trap_snap', volume: 1.5, pitch: 0.8 }],
      },
      'forgotten_woods.monster_alert': {
        category: 'hostile',
        sounds: [{ name: 'sounds/horror/monster_snarl', volume: 1.3, pitch: 0.7 }],
      },
    },
  };
  writeFile(path.join(RP_DIR, 'sounds', 'sound_definitions.json'), JSON.stringify(soundDefinitions, null, 2));

  // Update localization texts
  const langAppend = [
    '',
    '## Phase 2 Survival Equipment',
    'item.forgotten_woods:double_barrel_shotgun.name=Break-Action Double-Barrel Shotgun',
    'item.forgotten_woods:shotgun_shell.name=12-Gauge Shotgun Shell',
    'item.forgotten_woods:glass_bottle.name=Throwable Glass Bottle (Distraction)',
    'item.forgotten_woods:stone_pebble.name=Throwable Stone Pebble (Distraction)',
    'item.forgotten_woods:rusty_bear_trap.name=Rusty Snapping Bear Trap',
  ].join('\n');

  const curLang = fs.readFileSync(path.join(RP_DIR, 'texts', 'en_US.lang'), 'utf8');
  if (!curLang.includes('double_barrel_shotgun')) {
    writeFile(path.join(RP_DIR, 'texts', 'en_US.lang'), curLang + '\n' + langAppend);
  }

  // 6. Update Manifests for Script API (@minecraft/server & @minecraft/server-ui)
  console.log('6. Enabling Bedrock Script API in BP manifest...');
  const bpManifestPath = path.join(BP_DIR, 'manifest.json');
  const bpManifest = JSON.parse(fs.readFileSync(bpManifestPath, 'utf8'));

  // Ensure client script module exists
  const hasScriptModule = bpManifest.modules.some((m: any) => m.type === 'script');
  if (!hasScriptModule) {
    bpManifest.modules.push({
      type: 'script',
      language: 'javascript',
      uuid: uuidv4(),
      version: [1, 0, 0],
      entry: 'scripts/main.js',
    });
  }

  // Add @minecraft/server dependency if missing
  const hasServerDep = bpManifest.dependencies.some((d: any) => d.module_name === '@minecraft/server');
  if (!hasServerDep) {
    bpManifest.dependencies.push({
      module_name: '@minecraft/server',
      version: '1.8.0',
    });
  }

  writeFile(bpManifestPath, JSON.stringify(bpManifest, null, 2));

  console.log('7. Re-packaging Final .mcaddon...');
  const ultimateAddonPath = path.join(TARGET_DIR, 'The_Forgotten_Woods_Ultimate.mcaddon');
  await bundleAddonZip([RP_DIR, BP_DIR], ultimateAddonPath);
  fs.copyFileSync(ultimateAddonPath, path.join(TARGET_DIR, 'The_Forgotten_Woods.mcaddon'));

  console.log('=== Phase 2 Models, Items, Audio & Pack Manifest Updated Successfully! ===');
}

if (process.argv[1]?.includes('phase2-models-and-items.ts')) {
  runPhase2Build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
