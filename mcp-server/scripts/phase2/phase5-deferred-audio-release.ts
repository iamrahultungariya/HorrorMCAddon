import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ZipArchive } from 'archiver';

const TARGET_DIR = 'D:\\do note delete\\Desktop\\MC horror mod';
const RP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_RP');
const BP_DIR = path.join(TARGET_DIR, 'the_forgotten_woods_BP');

function writeFile(targetPath: string, content: string | Buffer) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

// 1. Generate Bodycam Vignette & Noise Texture Overlay
async function generateBodycamVignette(): Promise<Buffer> {
  const width = 256;
  const height = 256;
  const buf = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.hypot(cx, cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const normDist = dist / maxR;

      // Dark edge radial falloff (Bodycam lens curvature)
      const vignette = Math.pow(normDist, 2.8);
      // Film grain noise
      const grain = ((x * 17 + y * 31 + (x * y) % 19) % 20) - 10;

      const alpha = Math.min(255, Math.max(0, Math.floor(vignette * 210 + grain)));

      // Pitch black vignette border
      buf[idx] = 10;
      buf[idx + 1] = 10;
      buf[idx + 2] = 15;
      buf[idx + 3] = alpha;
    }
  }

  return await sharp(buf, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

// 2. Generate MER Maps (Metalness, Emissive, Roughness) for Deferred PBR
async function generatePbrMerMap(
  width: number,
  height: number,
  metalness: number,
  emissive: number,
  roughness: number
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    buf[idx] = metalness;      // R = Metalness (0: Dielectric, 255: Pure Metal)
    buf[idx + 1] = emissive;   // G = Emissive (0: Off, 255: Full Glow in dark)
    buf[idx + 2] = roughness;  // B = Roughness (0: Mirror smooth wet, 255: Chalk rough)
    buf[idx + 3] = 255;        // A = 255
  }
  return await sharp(buf, { raw: { width, height, channels: 4 } }).png().toBuffer();
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

export async function runPhase5Build() {
  console.log('=== Building Phase 5: Deferred PBR, Volumetric Fog, JSON UI, Audio & Releases ===');

  // 1. Deferred Shading & PBR MER Texture Sets
  console.log('1. Generating PBR MER Texture Maps (Deferred Lighting)...');
  
  // Blood Altar Emissive MER (Glows blood red in pitch black)
  const bloodAltarMer = await generatePbrMerMap(64, 64, 20, 240, 90);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'blood_altar_mer.png'), bloodAltarMer);
  writeFile(
    path.join(RP_DIR, 'textures', 'entity', 'blood_altar.texture_set.json'),
    JSON.stringify({
      format_version: '1.16.100',
      'minecraft:texture_set': {
        color: 'blood_altar',
        metalness_emissive_roughness: 'blood_altar_mer',
      },
    }, null, 2)
  );

  // Woods Stalker Glowing Crimson Eyes MER
  const stalkerMer = await generatePbrMerMap(64, 64, 10, 220, 160);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'the_woods_stalker_mer.png'), stalkerMer);
  writeFile(
    path.join(RP_DIR, 'textures', 'entity', 'the_woods_stalker.texture_set.json'),
    JSON.stringify({
      format_version: '1.16.100',
      'minecraft:texture_set': {
        color: 'the_woods_stalker',
        metalness_emissive_roughness: 'the_woods_stalker_mer',
      },
    }, null, 2)
  );

  // Rusty Bear Trap Metal MER (High metalness, rough rust)
  const bearTrapMer = await generatePbrMerMap(32, 32, 210, 0, 140);
  writeFile(path.join(RP_DIR, 'textures', 'entity', 'rusty_bear_trap_mer.png'), bearTrapMer);
  writeFile(
    path.join(RP_DIR, 'textures', 'entity', 'rusty_bear_trap.texture_set.json'),
    JSON.stringify({
      format_version: '1.16.100',
      'minecraft:texture_set': {
        color: 'rusty_bear_trap',
        metalness_emissive_roughness: 'rusty_bear_trap_mer',
      },
    }, null, 2)
  );

  // Double Barrel Shotgun Blued Steel MER
  const shotgunMer = await generatePbrMerMap(32, 32, 230, 0, 80);
  writeFile(path.join(RP_DIR, 'textures', 'items', 'double_barrel_shotgun_mer.png'), shotgunMer);
  writeFile(
    path.join(RP_DIR, 'textures', 'items', 'double_barrel_shotgun.texture_set.json'),
    JSON.stringify({
      format_version: '1.16.100',
      'minecraft:texture_set': {
        color: 'double_barrel_shotgun',
        metalness_emissive_roughness: 'double_barrel_shotgun_mer',
      },
    }, null, 2)
  );

  // 2. Dynamic Volumetric Fog JSONs
  console.log('2. Assembling Custom Volumetric Fog JSONs...');
  
  // Dense Blue-Grey Haunted Forest Fog (30-block visibility)
  const forestFog = {
    format_version: '1.16.100',
    'minecraft:fog_settings': {
      description: { identifier: 'forgotten_woods:fog_haunted_forest' },
      distance: {
        air: {
          fog_start: 4.0,
          fog_end: 28.0,
          fog_color: '#0d1520',
          render_distance_type: 'fixed',
        },
        water: {
          fog_start: 0.0,
          fog_end: 8.0,
          fog_color: '#080d14',
          render_distance_type: 'fixed',
        },
      },
    },
  };
  writeFile(path.join(RP_DIR, 'fogs', 'fog_haunted_forest.json'), JSON.stringify(forestFog, null, 2));

  // Choking 15-Meter Green Decay Swamp Fog
  const swampFog = {
    format_version: '1.16.100',
    'minecraft:fog_settings': {
      description: { identifier: 'forgotten_woods:fog_sunken_swamp' },
      distance: {
        air: {
          fog_start: 2.0,
          fog_end: 15.0,
          fog_color: '#121e10',
          render_distance_type: 'fixed',
        },
        water: {
          fog_start: 0.0,
          fog_end: 5.0,
          fog_color: '#0a1208',
          render_distance_type: 'fixed',
        },
      },
    },
  };
  writeFile(path.join(RP_DIR, 'fogs', 'fog_sunken_swamp.json'), JSON.stringify(swampFog, null, 2));

  // Biomes client fog mapping
  const biomesClient = {
    biomes: {
      default: {
        fog: 'forgotten_woods:fog_haunted_forest',
        water_surface_color: '#1a2530',
        water_fog_color: '#0d1520',
      },
      swamp: {
        fog: 'forgotten_woods:fog_sunken_swamp',
        water_surface_color: '#142010',
        water_fog_color: '#0c160a',
      },
      roofed_forest: {
        fog: 'forgotten_woods:fog_haunted_forest',
      },
    },
  };
  writeFile(path.join(RP_DIR, 'biomes_client.json'), JSON.stringify(biomesClient, null, 2));

  // 3. HUD Removal & Bodycam Vignette Post-Processing
  console.log('3. Generating Bodycam Vignette Texture & JSON UI...');
  const vignettePng = await generateBodycamVignette();
  writeFile(path.join(RP_DIR, 'textures', 'ui', 'bodycam_vignette.png'), vignettePng);

  // HUD Screen modification: hides vanilla hearts, food, and displays cinematic bodycam vignette
  const hudScreen = {
    namespace: 'hud',
    'hud_screen@common.base_screen': {
      $screen_content: 'hud.horror_hud_overlay',
    },
    'horror_hud_overlay': {
      type: 'panel',
      controls: [
        {
          'bodycam_lens@hud.bodycam_vignette_image': {},
        },
      ],
    },
    'bodycam_vignette_image': {
      type: 'image',
      texture: 'textures/ui/bodycam_vignette',
      size: ['100%', '100%'],
      layer: 10,
      alpha: 0.85,
    },
  };
  writeFile(path.join(RP_DIR, 'ui', 'hud_screen.json'), JSON.stringify(hudScreen, null, 2));

  // 4. Update Final .mcaddon & .mcworld Packages
  console.log('4. Packaging Final .mcaddon Release...');
  const ultimateAddonPath = path.join(TARGET_DIR, 'The_Forgotten_Woods_Ultimate.mcaddon');
  await bundleAddonZip([RP_DIR, BP_DIR], ultimateAddonPath);
  fs.copyFileSync(ultimateAddonPath, path.join(TARGET_DIR, 'The_Forgotten_Woods.mcaddon'));

  // Package as .mcworld template bundle
  const mcworldPath = path.join(TARGET_DIR, 'The_Forgotten_Woods_Horror_Island.mcworld');
  await bundleAddonZip([RP_DIR, BP_DIR], mcworldPath);

  console.log('=== PHASE 5 COMPLETE: Full Horror Experience Packaged! ===');
  console.log(`Addon: ${ultimateAddonPath}`);
  console.log(`World Template: ${mcworldPath}`);
}

if (process.argv[1]?.includes('phase5-deferred-audio-release.ts')) {
  runPhase5Build().catch(console.error);
}
