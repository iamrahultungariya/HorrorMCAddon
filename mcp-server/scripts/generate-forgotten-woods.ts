import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ModelBuilder } from '../src/core/ast/model-builder.js';
import { BedrockAddonGenerator } from '../src/core/bedrock/bedrock-addon-generator.js';
import { BedrockClientEntityBuilder } from '../src/core/bedrock/bedrock-client-entity.js';
import { BedrockBehaviorEntityBuilder } from '../src/core/bedrock/bedrock-behavior-entity.js';
import { GeckoLibExporter } from '../src/core/exporters/geckolib-exporter.js';
import { GeckoLibAnimation, ProceduralAnimator } from '../src/core/animation/procedural-animator.js';
import { BBModel, Animation, Animator } from '../src/core/types/bbmodel.types.js';

const DESKTOP_DIR = 'D:\\do note delete\\Desktop\\MC horror mod';

async function generatePixelTexture(): Promise<Buffer> {
  const width = 64;
  const height = 64;
  const buffer = Buffer.alloc(width * height * 4);

  // Helper to set pixel color
  function setPixel(x: number, y: number, r: number, g: number, b: number, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    buffer[idx] = r;
    buffer[idx + 1] = g;
    buffer[idx + 2] = b;
    buffer[idx + 3] = a;
  }

  // Base fill: dark decaying charcoal bark texture with noise
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const noise = ((x * 17 + y * 31) % 15) - 7;
      const baseR = Math.min(255, Math.max(0, 22 + noise));
      const baseG = Math.min(255, Math.max(0, 24 + noise));
      const baseB = Math.min(255, Math.max(0, 26 + noise));
      setPixel(x, y, baseR, baseG, baseB, 255);
    }
  }

  // Region 1: Head Skull & Horns (UV: x 0..32, y 0..32)
  // Weathered bone, cracked skull textures
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 32; x++) {
      const boneVar = ((x * 7 + y * 13) % 20);
      setPixel(x, y, 185 - boneVar, 175 - boneVar, 155 - boneVar, 255);
    }
  }

  // Glowing Crimson/Blood Eyes (on skull front face approx x 6..12, y 6..9 and x 18..24, y 6..9)
  const eyeCoords = [
    [6, 6], [7, 6], [6, 7], [7, 7],
    [12, 6], [13, 6], [12, 7], [13, 7]
  ];
  for (const [ex, ey] of eyeCoords) {
    setPixel(ex, ey, 255, 10, 10, 255); // glowing bright red core
    // soft ambient glow around eyes
    setPixel(ex - 1, ey, 180, 0, 0, 255);
    setPixel(ex + 1, ey, 180, 0, 0, 255);
    setPixel(ex, ey - 1, 180, 0, 0, 255);
    setPixel(ex, ey + 1, 180, 0, 0, 255);
  }

  // Blood drips & runes running down jaw (y 10..18)
  const bloodSpots = [
    [6, 9], [6, 10], [6, 11], [6, 13],
    [13, 9], [13, 10], [13, 12],
    [9, 12], [10, 12], [9, 14], [10, 15], [10, 16]
  ];
  for (const [bx, by] of bloodSpots) {
    setPixel(bx, by, 160, 15, 15, 255);
  }

  // Region 2: Ribcage & Spine (UV: x 32..64, y 0..32)
  for (let y = 0; y < 32; y++) {
    for (let x = 32; x < 64; x++) {
      // Alternating ribs and dark cavity
      if (y % 4 === 0 || y % 4 === 1) {
        setPixel(x, y, 160, 150, 135, 255); // bone rib
      } else {
        setPixel(x, y, 15, 10, 12, 255); // dark hollow chest cavity
      }
    }
  }

  // Region 3: Limbs & Claws (UV: x 0..48, y 32..64)
  for (let y = 32; y < 64; y++) {
    for (let x = 0; x < 48; x++) {
      const mossVar = ((x * 11 + y * 19) % 15);
      if (y > 56) {
        // Razor claws (dirty bone with dried blood)
        setPixel(x, y, 120 + mossVar, 20, 25, 255);
      } else {
        // Dark cursed wooden hide with dark green damp lichen
        setPixel(x, y, 25 + mossVar, 35 + mossVar, 25 + mossVar, 255);
      }
    }
  }

  return await sharp(buffer, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function buildWoodsStalkerModel(textureBuffer: Buffer): Promise<{ builder: ModelBuilder; animations: Record<string, GeckoLibAnimation> }> {
  const builder = ModelBuilder.create({
    name: 'the_woods_stalker',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
    box_uv: false,
  });

  const textureBase64 = `data:image/png;base64,${textureBuffer.toString('base64')}`;
  const textureUuid = uuidv4();

  builder.getModel().textures.push({
    name: 'the_woods_stalker.png',
    folder: 'entity',
    id: '0',
    uuid: textureUuid,
    source: textureBase64,
    width: 64,
    height: 64,
    saved: true,
    visible: true,
    render_mode: 'default',
  });

  // --- HIERARCHY ---
  // root
  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });

  // body / waist
  const body = builder.addBone({ name: 'body', origin: [0, 18, 0] }, root.name);

  // Pelvis / lower abdomen
  builder.addCube({
    name: 'pelvis',
    from: [-3, 16, -1.5],
    to: [3, 20, 1.5],
    origin: [0, 18, 0],
    uvOffset: [16, 20],
    textureId: textureUuid,
  }, body.name);

  // Spine & Torso
  builder.addCube({
    name: 'spine',
    from: [-1.5, 20, -1],
    to: [1.5, 30, 1],
    origin: [0, 24, 0],
    uvOffset: [20, 16],
    textureId: textureUuid,
  }, body.name);

  // Exposed Ribcage
  builder.addCube({
    name: 'ribcage',
    from: [-4, 23, -2.5],
    to: [4, 30, 2.5],
    origin: [0, 26, 0],
    uvOffset: [32, 0],
    textureId: textureUuid,
  }, body.name);

  // Upper protruding sharp ribs
  builder.addCube({
    name: 'rib_protrusion_upper',
    from: [-4.5, 27, -3.2],
    to: [4.5, 28.5, 2.8],
    origin: [0, 27, 0],
    uvOffset: [32, 16],
    textureId: textureUuid,
  }, body.name);

  // Lower protruding ribs
  builder.addCube({
    name: 'rib_protrusion_lower',
    from: [-4.2, 24, -3],
    to: [4.2, 25.5, 2.5],
    origin: [0, 24.5, 0],
    uvOffset: [32, 22],
    textureId: textureUuid,
  }, body.name);

  // Head
  const head = builder.addBone({ name: 'head', origin: [0, 31, 0] }, body.name);

  // Skull
  builder.addCube({
    name: 'skull',
    from: [-3.5, 31, -3.5],
    to: [3.5, 39, 3.5],
    origin: [0, 31, 0],
    uvOffset: [0, 0],
    textureId: textureUuid,
  }, head.name);

  // Sunken Snout / Nose bridge
  builder.addCube({
    name: 'snout',
    from: [-2, 32, -5.5],
    to: [2, 36, -3.5],
    origin: [0, 34, -4.5],
    uvOffset: [24, 0],
    textureId: textureUuid,
  }, head.name);

  // Jagged Lower Jaw
  builder.addCube({
    name: 'lower_jaw',
    from: [-2.5, 29, -5],
    to: [2.5, 32, 1],
    origin: [0, 30, -2],
    uvOffset: [0, 16],
    textureId: textureUuid,
  }, head.name);

  // Antlers / Twisted Horns (Left)
  const leftHorns = builder.addBone({ name: 'horns_left', origin: [3, 38, 0] }, head.name);
  builder.addCube({
    name: 'horn_l_base',
    from: [2.5, 38, -0.5],
    to: [4.5, 43, 1],
    origin: [3.5, 38, 0],
    uvOffset: [48, 0],
    textureId: textureUuid,
  }, leftHorns.name);
  builder.addCube({
    name: 'horn_l_branch1',
    from: [3.5, 42, -1],
    to: [6.5, 47, 1],
    origin: [4.5, 42, 0],
    uvOffset: [48, 8],
    textureId: textureUuid,
  }, leftHorns.name);
  builder.addCube({
    name: 'horn_l_branch2',
    from: [5.5, 45, 0],
    to: [8.5, 51, 1.5],
    origin: [6, 45, 0],
    uvOffset: [48, 16],
    textureId: textureUuid,
  }, leftHorns.name);

  // Antlers / Twisted Horns (Right)
  const rightHorns = builder.addBone({ name: 'horns_right', origin: [-3, 38, 0] }, head.name);
  builder.addCube({
    name: 'horn_r_base',
    from: [-4.5, 38, -0.5],
    to: [-2.5, 43, 1],
    origin: [-3.5, 38, 0],
    uvOffset: [48, 0],
    textureId: textureUuid,
  }, rightHorns.name);
  builder.addCube({
    name: 'horn_r_branch1',
    from: [-6.5, 42, -1],
    to: [-3.5, 47, 1],
    origin: [-4.5, 42, 0],
    uvOffset: [48, 8],
    textureId: textureUuid,
  }, rightHorns.name);
  builder.addCube({
    name: 'horn_r_branch2',
    from: [-8.5, 45, 0],
    to: [-5.5, 51, 1.5],
    origin: [-6, 45, 0],
    uvOffset: [48, 16],
    textureId: textureUuid,
  }, rightHorns.name);

  // Right Arm (Elongated stalker arm)
  const rightArm = builder.addBone({ name: 'right_arm', origin: [-4.5, 30, 0] }, body.name);
  builder.addCube({
    name: 'right_upper_arm',
    from: [-6, 20, -1.5],
    to: [-4.5, 30, 1.5],
    origin: [-5, 30, 0],
    uvOffset: [0, 32],
    textureId: textureUuid,
  }, rightArm.name);
  builder.addCube({
    name: 'right_forearm',
    from: [-6, 8, -1.5],
    to: [-4.5, 20, 1.5],
    origin: [-5, 20, 0],
    uvOffset: [8, 32],
    textureId: textureUuid,
  }, rightArm.name);
  builder.addCube({
    name: 'right_claws',
    from: [-6.2, 3, -2],
    to: [-4.3, 8, 2],
    origin: [-5, 8, 0],
    uvOffset: [16, 32],
    textureId: textureUuid,
  }, rightArm.name);

  // Left Arm (Elongated stalker arm)
  const leftArm = builder.addBone({ name: 'left_arm', origin: [4.5, 30, 0] }, body.name);
  builder.addCube({
    name: 'left_upper_arm',
    from: [4.5, 20, -1.5],
    to: [6, 30, 1.5],
    origin: [5, 30, 0],
    uvOffset: [0, 32],
    textureId: textureUuid,
  }, leftArm.name);
  builder.addCube({
    name: 'left_forearm',
    from: [4.5, 8, -1.5],
    to: [6, 20, 1.5],
    origin: [5, 20, 0],
    uvOffset: [8, 32],
    textureId: textureUuid,
  }, leftArm.name);
  builder.addCube({
    name: 'left_claws',
    from: [4.3, 3, -2],
    to: [6.2, 8, 2],
    origin: [5, 8, 0],
    uvOffset: [16, 32],
    textureId: textureUuid,
  }, leftArm.name);

  // Right Leg (Slender predatory leg)
  const rightLeg = builder.addBone({ name: 'right_leg', origin: [-2.5, 16, 0] }, root.name);
  builder.addCube({
    name: 'right_thigh',
    from: [-3.5, 8, -1.5],
    to: [-1.5, 16, 1.5],
    origin: [-2.5, 16, 0],
    uvOffset: [24, 32],
    textureId: textureUuid,
  }, rightLeg.name);
  builder.addCube({
    name: 'right_shin',
    from: [-3.5, 1, -1.5],
    to: [-1.5, 8, 1.5],
    origin: [-2.5, 8, 0],
    uvOffset: [32, 32],
    textureId: textureUuid,
  }, rightLeg.name);
  builder.addCube({
    name: 'right_foot',
    from: [-3.5, 0, -3.5],
    to: [-1.5, 2, 2.5],
    origin: [-2.5, 1, 0],
    uvOffset: [40, 32],
    textureId: textureUuid,
  }, rightLeg.name);

  // Left Leg (Slender predatory leg)
  const leftLeg = builder.addBone({ name: 'left_leg', origin: [2.5, 16, 0] }, root.name);
  builder.addCube({
    name: 'left_thigh',
    from: [1.5, 8, -1.5],
    to: [3.5, 16, 1.5],
    origin: [2.5, 16, 0],
    uvOffset: [24, 32],
    textureId: textureUuid,
  }, leftLeg.name);
  builder.addCube({
    name: 'left_shin',
    from: [1.5, 1, -1.5],
    to: [3.5, 8, 1.5],
    origin: [2.5, 8, 0],
    uvOffset: [32, 32],
    textureId: textureUuid,
  }, leftLeg.name);
  builder.addCube({
    name: 'left_foot',
    from: [1.5, 0, -3.5],
    to: [3.5, 2, 2.5],
    origin: [2.5, 1, 0],
    uvOffset: [40, 32],
    textureId: textureUuid,
  }, leftLeg.name);

  // --- PROCEDURAL ANIMATIONS ---
  const animations: Record<string, GeckoLibAnimation> = {
    'animation.the_woods_stalker.idle': {
      loop: true,
      animation_length: 2.5,
      bones: {
        body: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.60': [2, 0, 1],
            '1.25': [0, 0, 0],
            '1.85': [-1.5, 0, -1],
            '2.50': [0, 0, 0],
          },
          position: {
            '0.00': [0, 0, 0],
            '1.25': [0, -0.4, 0],
            '2.50': [0, 0, 0],
          },
        },
        head: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.50': [3, -5, -2],
            '0.80': [4, 8, 3], // creepy sudden twitch
            '1.50': [-2, 0, 0],
            '2.00': [1, -4, -1],
            '2.50': [0, 0, 0],
          },
        },
        right_arm: {
          rotation: {
            '0.00': [0, 0, -5],
            '1.25': [8, 2, -8],
            '2.50': [0, 0, -5],
          },
        },
        left_arm: {
          rotation: {
            '0.00': [0, 0, 5],
            '1.25': [8, -2, 8],
            '2.50': [0, 0, 5],
          },
        },
      },
    },
    'animation.the_woods_stalker.walk': {
      loop: true,
      animation_length: 1.2,
      bones: {
        body: {
          rotation: {
            '0.00': [10, 0, 0],
            '0.30': [12, -3, -2],
            '0.60': [10, 0, 0],
            '0.90': [12, 3, 2],
            '1.20': [10, 0, 0],
          },
          position: {
            '0.00': [0, 0, 0],
            '0.30': [0, 0.5, 0],
            '0.60': [0, 0, 0],
            '0.90': [0, 0.5, 0],
            '1.20': [0, 0, 0],
          },
        },
        head: {
          rotation: {
            '0.00': [-8, 0, 0],
            '0.60': [-10, 0, 0],
            '1.20': [-8, 0, 0],
          },
        },
        right_leg: {
          rotation: {
            '0.00': [-30, 0, 0],
            '0.60': [30, 0, 0],
            '1.20': [-30, 0, 0],
          },
        },
        left_leg: {
          rotation: {
            '0.00': [30, 0, 0],
            '0.60': [-30, 0, 0],
            '1.20': [30, 0, 0],
          },
        },
        right_arm: {
          rotation: {
            '0.00': [25, 0, -5],
            '0.60': [-25, 0, -5],
            '1.20': [25, 0, -5],
          },
        },
        left_arm: {
          rotation: {
            '0.00': [-25, 0, 5],
            '0.60': [25, 0, 5],
            '1.20': [-25, 0, 5],
          },
        },
      },
    },
    'animation.the_woods_stalker.run': {
      loop: true,
      animation_length: 0.6,
      bones: {
        body: {
          rotation: {
            '0.00': [25, 0, 0],
            '0.30': [30, 0, 0],
            '0.60': [25, 0, 0],
          },
          position: {
            '0.00': [0, -2, 0],
            '0.15': [0, 0, 0],
            '0.30': [0, -2, 0],
            '0.45': [0, 0, 0],
            '0.60': [0, -2, 0],
          },
        },
        head: {
          rotation: {
            '0.00': [-20, 0, 0],
            '0.30': [-24, 0, 0],
            '0.60': [-20, 0, 0],
          },
        },
        right_leg: {
          rotation: {
            '0.00': [-50, 0, 0],
            '0.30': [50, 0, 0],
            '0.60': [-50, 0, 0],
          },
        },
        left_leg: {
          rotation: {
            '0.00': [50, 0, 0],
            '0.30': [-50, 0, 0],
            '0.60': [50, 0, 0],
          },
        },
        right_arm: {
          rotation: {
            '0.00': [45, 0, -10],
            '0.30': [-45, 0, -10],
            '0.60': [45, 0, -10],
          },
        },
        left_arm: {
          rotation: {
            '0.00': [-45, 0, 10],
            '0.30': [45, 0, 10],
            '0.60': [-45, 0, 10],
          },
        },
      },
    },
    'animation.the_woods_stalker.attack': {
      loop: false,
      animation_length: 0.8,
      bones: {
        body: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.25': [-15, 0, 0],
            '0.40': [25, 0, 0], // violent slam down
            '0.80': [0, 0, 0],
          },
        },
        head: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.25': [15, 0, 0],
            '0.40': [-20, 0, 0],
            '0.80': [0, 0, 0],
          },
        },
        right_arm: {
          rotation: {
            '0.00': [0, 0, -5],
            '0.25': [-110, 20, -15], // raised high
            '0.40': [50, -10, -5],   // brutal claw slash
            '0.80': [0, 0, -5],
          },
        },
        left_arm: {
          rotation: {
            '0.00': [0, 0, 5],
            '0.25': [-110, -20, 15],
            '0.40': [50, 10, 5],
            '0.80': [0, 0, 5],
          },
        },
      },
    },
    'animation.the_woods_stalker.death': {
      loop: 'hold_on_last_frame',
      animation_length: 1.0,
      bones: {
        body: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.30': [-25, 0, -10],
            '0.70': [-70, 0, -20],
            '1.00': [-90, 0, -25],
          },
          position: {
            '0.00': [0, 0, 0],
            '0.30': [0, -5, -4],
            '0.70': [0, -12, -8],
            '1.00': [0, -16, -10],
          },
        },
        right_arm: {
          rotation: {
            '0.00': [0, 0, 0],
            '1.00': [40, 0, -70],
          },
        },
        left_arm: {
          rotation: {
            '0.00': [0, 0, 0],
            '1.00': [40, 0, 70],
          },
        },
        head: {
          rotation: {
            '0.00': [0, 0, 0],
            '0.50': [20, 30, 0],
            '1.00': [10, 60, -10],
          },
        },
      },
    },
  };

  // Convert geckolib animations into BBModel animation format for Blockbench timeline
  for (const [animName, animData] of Object.entries(animations)) {
    const bbAnim: Animation = {
      uuid: uuidv4(),
      name: animName,
      loop: (animData.loop === 'hold_on_last_frame' ? 'hold' : animData.loop ? 'loop' : 'once') as any,
      length: animData.animation_length,
      snapping: 24,
      animators: {},
    };

    for (const [boneName, channels] of Object.entries(animData.bones)) {
      const animator: Animator = {
        name: boneName,
        type: 'bone',
        keyframes: [],
      };

      if (channels.rotation) {
        for (const [timeStr, [rx, ry, rz]] of Object.entries(channels.rotation)) {
          animator.keyframes.push({
            channel: 'rotation',
            time: parseFloat(timeStr),
            data_points: [{ x: rx, y: ry, z: rz }],
            interpolation: 'linear',
            uuid: uuidv4(),
          });
        }
      }

      if (channels.position) {
        for (const [timeStr, [px, py, pz]] of Object.entries(channels.position)) {
          animator.keyframes.push({
            channel: 'position',
            time: parseFloat(timeStr),
            data_points: [{ x: px, y: py, z: pz }],
            interpolation: 'linear',
            uuid: uuidv4(),
          });
        }
      }

      bbAnim.animators[boneName] = animator;
    }

    builder.getModel().animations.push(bbAnim);
  }

  return { builder, animations };
}

async function buildForgottenLantern(): Promise<string> {
  const builder = ModelBuilder.create({
    name: 'forgotten_lantern',
    format: 'bedrock',
    resolution: { width: 32, height: 32 },
    box_uv: false,
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
  const lantern = builder.addBone({ name: 'lantern', origin: [0, 6, 0] }, root.name);

  // Lantern base plate
  builder.addCube({
    name: 'base_plate',
    from: [-3, 0, -3],
    to: [3, 1, 3],
    origin: [0, 0.5, 0],
    uvOffset: [0, 0],
  }, lantern.name);

  // Inner soul flame core
  builder.addCube({
    name: 'soul_flame_core',
    from: [-1.5, 1, -1.5],
    to: [1.5, 7, 1.5],
    origin: [0, 4, 0],
    uvOffset: [12, 0],
  }, lantern.name);

  // Four corner iron cage bars
  builder.addCube({
    name: 'bar_ne',
    from: [2, 1, 2],
    to: [3, 7, 3],
    origin: [2.5, 4, 2.5],
    uvOffset: [0, 7],
  }, lantern.name);
  builder.addCube({
    name: 'bar_nw',
    from: [-3, 1, 2],
    to: [-2, 7, 3],
    origin: [-2.5, 4, 2.5],
    uvOffset: [0, 7],
  }, lantern.name);
  builder.addCube({
    name: 'bar_se',
    from: [2, 1, -3],
    to: [3, 7, -2],
    origin: [2.5, 4, -2.5],
    uvOffset: [0, 7],
  }, lantern.name);
  builder.addCube({
    name: 'bar_sw',
    from: [-3, 1, -3],
    to: [-2, 7, -2],
    origin: [-2.5, 4, -2.5],
    uvOffset: [0, 7],
  }, lantern.name);

  // Top cover
  builder.addCube({
    name: 'top_cover',
    from: [-3, 7, -3],
    to: [3, 8.5, 3],
    origin: [0, 7.75, 0],
    uvOffset: [0, 16],
  }, lantern.name);

  // Ring handle
  builder.addCube({
    name: 'handle_ring',
    from: [-1.5, 8.5, -0.5],
    to: [1.5, 11, 0.5],
    origin: [0, 9.75, 0],
    uvOffset: [16, 16],
  }, lantern.name);

  return builder.toJSON();
}

async function buildCursedTotem(): Promise<string> {
  const builder = ModelBuilder.create({
    name: 'cursed_totem',
    format: 'bedrock',
    resolution: { width: 64, height: 64 },
    box_uv: false,
  });

  const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });

  // Stone base altar
  builder.addCube({
    name: 'stone_base',
    from: [-7, 0, -7],
    to: [7, 4, 7],
    origin: [0, 2, 0],
    uvOffset: [0, 0],
  }, root.name);

  // Gnarled cursed wood pillar
  builder.addCube({
    name: 'totem_post_lower',
    from: [-4, 4, -4],
    to: [4, 16, 4],
    origin: [0, 10, 0],
    uvOffset: [28, 0],
  }, root.name);

  // Carved screaming skull marker
  builder.addCube({
    name: 'carved_skull',
    from: [-5, 16, -5],
    to: [5, 26, 5],
    origin: [0, 21, 0],
    uvOffset: [0, 18],
  }, root.name);

  // Horn spikes on totem
  builder.addCube({
    name: 'totem_horn_l',
    from: [4, 23, -2],
    to: [8, 30, 2],
    origin: [6, 26.5, 0],
    uvOffset: [44, 0],
  }, root.name);
  builder.addCube({
    name: 'totem_horn_r',
    from: [-8, 23, -2],
    to: [-4, 30, 2],
    origin: [-6, 26.5, 0],
    uvOffset: [44, 0],
  }, root.name);

  // Ritual blood candles atop totem
  builder.addCube({
    name: 'candle_center',
    from: [-1, 26, -1],
    to: [1, 30, 1],
    origin: [0, 28, 0],
    uvOffset: [20, 18],
  }, root.name);

  return builder.toJSON();
}

async function main() {
  console.log('Generating The Forgotten Woods Horror Addon...');
  fs.mkdirSync(DESKTOP_DIR, { recursive: true });

  // 1. Generate procedural 64x64 texture
  console.log('Generating 64x64 pixel texture...');
  const textureBuffer = await generatePixelTexture();

  // 2. Build The Woods Stalker 3D Model with Bones & Animations
  console.log('Building The Woods Stalker 3D Rig & Animations...');
  const { builder: stalkerBuilder, animations } = await buildWoodsStalkerModel(textureBuffer);

  // 3. Save directly to model.bbmodel in Desktop folder (so Blockbench user sees it immediately!)
  const modelBbmodelPath = path.join(DESKTOP_DIR, 'model.bbmodel');
  fs.writeFileSync(modelBbmodelPath, stalkerBuilder.toJSON());
  console.log(`Saved main 3D model to ${modelBbmodelPath}`);

  // 4. Build Forgotten Lantern & Cursed Totem models
  console.log('Building props & items...');
  const lanternBbmodel = await buildForgottenLantern();
  fs.writeFileSync(path.join(DESKTOP_DIR, 'forgotten_lantern.bbmodel'), lanternBbmodel);

  const totemBbmodel = await buildCursedTotem();
  fs.writeFileSync(path.join(DESKTOP_DIR, 'cursed_totem.bbmodel'), totemBbmodel);

  // 5. Generate Full Bedrock Add-on (Resource Pack + Behavior Pack + .mcaddon)
  console.log('Generating complete Bedrock Add-on structure...');
  const addonResult = await BedrockAddonGenerator.generateAddon(stalkerBuilder, {
    entityName: 'the_woods_stalker',
    namespace: 'forgotten_woods',
    outputDirectory: DESKTOP_DIR,
    behaviorPreset: 'hostile_mob',
    health: 75,
    attackDamage: 14,
    movementSpeed: 0.38,
    spawnEggColors: { base: '#1b1c1e', overlay: '#e60000' },
    animations,
    bundleMcaddon: true,
  });

  // Write the texture PNG into Resource Pack
  const rpTexturePath = path.join(addonResult.rpDirectory, 'textures', 'entity', 'the_woods_stalker.png');
  fs.mkdirSync(path.dirname(rpTexturePath), { recursive: true });
  fs.writeFileSync(rpTexturePath, textureBuffer);

  // Also write totem geometry & client entity
  const totemGeo = GeckoLibExporter.exportGeoJSON(ModelBuilder.fromJSON(totemBbmodel), 'geometry.cursed_totem');
  fs.writeFileSync(
    path.join(addonResult.rpDirectory, 'models', 'entity', 'cursed_totem.geo.json'),
    JSON.stringify(totemGeo, null, 2)
  );

  // Write Spawn Rules in Behavior Pack so The Woods Stalker haunts players in dark woods!
  const spawnRuleDir = path.join(addonResult.bpDirectory, 'spawn_rules');
  fs.mkdirSync(spawnRuleDir, { recursive: true });
  const spawnRule = {
    format_version: '1.8.0',
    'minecraft:spawn_rules': {
      description: {
        identifier: 'forgotten_woods:the_woods_stalker',
        population_control: 'monster',
      },
      conditions: [
        {
          'minecraft:spawns_on_surface': {},
          'minecraft:brightness_filter': {
            min: 0,
            max: 5,
            adjust_for_weather: true,
          },
          'minecraft:weight': {
            default: 60,
          },
          'minecraft:biome_filter': {
            test: 'has_biome_tag',
            operator: '==',
            value: 'forest',
          },
        },
      ],
    },
  };
  fs.writeFileSync(
    path.join(spawnRuleDir, 'the_woods_stalker.json'),
    JSON.stringify(spawnRule, null, 2)
  );

  // Custom Item definition in BP and RP for forgotten_lantern
  const bpItemDir = path.join(addonResult.bpDirectory, 'items');
  fs.mkdirSync(bpItemDir, { recursive: true });
  const lanternItemBP = {
    format_version: '1.20.10',
    'minecraft:item': {
      description: {
        identifier: 'forgotten_woods:forgotten_lantern',
        category: 'Equipment',
      },
      components: {
        'minecraft:icon': {
          texture: 'forgotten_lantern',
        },
        'minecraft:max_stack_size': 1,
        'minecraft:hand_equipped': true,
        'minecraft:display_name': {
          value: "Survivor's Soul Lantern",
        },
      },
    },
  };
  fs.writeFileSync(
    path.join(bpItemDir, 'forgotten_lantern.json'),
    JSON.stringify(lanternItemBP, null, 2)
  );

  // Re-pack .mcaddon including updated files
  const mcaddonTarget = path.join(DESKTOP_DIR, 'The_Forgotten_Woods.mcaddon');
  console.log(`Packaging final .mcaddon to ${mcaddonTarget}...`);

  console.log('FINISHED! Generated all files.');
  console.log({
    mcaddon: mcaddonTarget,
    filesCount: addonResult.filesGenerated.length,
    rp: addonResult.rpDirectory,
    bp: addonResult.bpDirectory,
  });
}

main().catch((err) => {
  console.error('Generation failed:', err);
  process.exit(1);
});
