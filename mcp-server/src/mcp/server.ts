import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ModelBuilder } from '../core/ast/model-builder.js';
import { Math3D } from '../core/utils/math3d.js';
import { SpriteExtruder } from '../core/voxel/sprite-extruder.js';
import { ImageToModel } from '../core/voxel/image-to-model.js';
import { DisplayPresets, DisplayPresetName } from '../core/display/display-presets.js';
import { WeaponAligner, GripPosition } from '../core/display/weapon-aligner.js';
import { JavaItemExporter } from '../core/exporters/java-item-exporter.js';
import { RigTemplates, RigType } from '../core/rigging/rig-templates.js';
import { ProceduralAnimator, AnimationType, GeckoLibAnimation } from '../core/animation/procedural-animator.js';
import { GeckoLibExporter } from '../core/exporters/geckolib-exporter.js';
import { BedrockAddonGenerator, GenerateAddonOptions } from '../core/bedrock/bedrock-addon-generator.js';
import { BedrockClientEntityBuilder } from '../core/bedrock/bedrock-client-entity.js';
import { BedrockBehaviorEntityBuilder, BehaviorPreset } from '../core/bedrock/bedrock-behavior-entity.js';
import * as fs from 'fs';
import * as path from 'path';

export class BlockbenchMCPServer {
  private server: McpServer;
  private activeBuilder: ModelBuilder;
  private geckolibAnimations: Record<string, GeckoLibAnimation> = {};

  constructor() {
    this.server = new McpServer({
      name: 'blockbench-mcp-server',
      version: '1.0.0',
    });

    this.activeBuilder = ModelBuilder.create({
      name: 'default_model',
      format: 'bedrock',
      resolution: { width: 64, height: 64 },
    });

    this.registerTools();
  }

  private registerTools() {
    // 1. bb_create_model
    this.server.tool(
      'bb_create_model',
      'Initializes a new Blockbench 3D model project with specified format and resolution',
      {
        name: z.string().describe('Name of the model (e.g. ruby_boss, fire_sword)'),
        format: z
          .enum(['bedrock', 'modded_entity', 'java_block', 'generic_model'])
          .default('bedrock')
          .describe('Target model format (bedrock for MCPE/GeckoLib, modded_entity for Java)'),
        resolutionWidth: z.number().default(64).describe('Texture canvas width (power of 2: 16, 32, 64, 128)'),
        resolutionHeight: z.number().default(64).describe('Texture canvas height (power of 2: 16, 32, 64, 128)'),
        boxUv: z.boolean().default(false).describe('Whether to use Box UV mode'),
      },
      async ({ name, format, resolutionWidth, resolutionHeight, boxUv }) => {
        this.activeBuilder = ModelBuilder.create({
          name,
          format,
          resolution: { width: resolutionWidth, height: resolutionHeight },
          box_uv: boxUv,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully initialized model "${name}" [format: ${format}, resolution: ${resolutionWidth}x${resolutionHeight}]. Active in session memory.`,
            },
          ],
        };
      }
    );

    // 2. bb_add_bone
    this.server.tool(
      'bb_add_bone',
      'Adds a bone (group) to the model hierarchy for animation and rigging',
      {
        name: z.string().describe('Name of the bone (e.g. head, torso, arm_right, leg_left)'),
        origin: z
          .tuple([z.number(), z.number(), z.number()])
          .default([0, 0, 0])
          .describe('Pivot origin [x, y, z] around which the bone rotates'),
        rotation: z
          .tuple([z.number(), z.number(), z.number()])
          .optional()
          .describe('Initial Euler rotation [x, y, z] in degrees'),
        parentBone: z.string().optional().describe('Parent bone name or UUID (omit for root level)'),
      },
      async ({ name, origin, rotation, parentBone }) => {
        const bone = this.activeBuilder.addBone(
          {
            name,
            origin,
            rotation,
          },
          parentBone
        );

        return {
          content: [
            {
              type: 'text',
              text: `Added bone "${bone.name}" (UUID: ${bone.uuid}) with pivot [${bone.origin.join(', ')}]${
                parentBone ? ` parented under "${parentBone}"` : ' at root level'
              }.`,
            },
          ],
        };
      }
    );

    // 3. bb_add_cube
    this.server.tool(
      'bb_add_cube',
      'Adds a 3D box (cube) element with coordinates, integer UVs, and optional parent bone',
      {
        name: z.string().default('cube').describe('Name of the cube (e.g. head_base, hilt, blade)'),
        from: z.tuple([z.number(), z.number(), z.number()]).describe('Lower bounding corner [x, y, z]'),
        to: z.tuple([z.number(), z.number(), z.number()]).describe('Upper bounding corner [x, y, z]'),
        origin: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Pivot origin [x, y, z]'),
        rotation: z
          .tuple([z.number(), z.number(), z.number()])
          .optional()
          .describe('Rotation angles in degrees (Note: In Bedrock, max 1 axis on a cube)'),
        uvOffset: z
          .tuple([z.number(), z.number()])
          .default([0, 0])
          .describe('Starting [u, v] coordinate on texture atlas (snapped to integer)'),
        parentBone: z.string().optional().describe('Name or UUID of the bone to parent this cube into'),
      },
      async ({ name, from, to, origin, rotation, uvOffset, parentBone }) => {
        const cube = this.activeBuilder.addCube(
          {
            name,
            from,
            to,
            origin,
            rotation,
            uvOffset,
            snapToGrid: true,
          },
          parentBone
        );

        const size = Math3D.getSize(cube.from, cube.to);

        return {
          content: [
            {
              type: 'text',
              text: `Created cube "${cube.name}" (UUID: ${cube.uuid}) [size: ${size[0]}x${size[1]}x${size[2]}] at from:[${cube.from.join(', ')}] to:[${cube.to.join(', ')}]${
                parentBone ? ` inside bone "${parentBone}"` : ''
              }.`,
            },
          ],
        };
      }
    );

    // 4. bb_transform_element
    this.server.tool(
      'bb_transform_element',
      'Transforms (translates, rotates, scales, or shifts origin) of an existing cube or bone',
      {
        identifier: z.string().describe('UUID or name of the cube to transform'),
        translation: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Shift [dx, dy, dz]'),
        rotation: z.tuple([z.number(), z.number(), z.number()]).optional().describe('New rotation [rx, ry, rz] in degrees'),
        scale: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Scale factors [sx, sy, sz]'),
        origin: z.tuple([z.number(), z.number(), z.number()]).optional().describe('New pivot origin [ox, oy, oz]'),
      },
      async ({ identifier, translation, rotation, scale, origin }) => {
        const cube = this.activeBuilder.transformElement(identifier, {
          translation,
          rotation,
          scale,
          origin,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Transformed element "${cube.name}": from:[${cube.from.join(', ')}] to:[${cube.to.join(', ')}] origin:[${cube.origin.join(', ')}]`,
            },
          ],
        };
      }
    );

    // 5. bb_mirror_element
    this.server.tool(
      'bb_mirror_element',
      'Mirrors a cube across the X, Y, or Z axis with automatic UV face flipping',
      {
        identifier: z.string().describe('UUID or name of the cube to mirror'),
        axis: z.enum(['x', 'y', 'z']).default('x').describe('Mirror axis (typically x for bilateral symmetry)'),
        pivot: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]).describe('Pivot point to mirror across'),
        newName: z.string().optional().describe('Optional name for the mirrored cube'),
      },
      async ({ identifier, axis, pivot, newName }) => {
        const mirrored = this.activeBuilder.mirrorCube(identifier, axis, pivot, newName);
        return {
          content: [
            {
              type: 'text',
              text: `Mirrored cube "${mirrored.name}" created along ${axis.toUpperCase()} axis: from:[${mirrored.from.join(', ')}] to:[${mirrored.to.join(', ')}].`,
            },
          ],
        };
      }
    );

    // 6. bb_reparent
    this.server.tool(
      'bb_reparent',
      'Moves a cube or child bone into another parent bone',
      {
        childIdentifier: z.string().describe('UUID or name of the cube or bone to move'),
        parentBoneIdentifier: z.string().describe('UUID or name of the target parent bone'),
      },
      async ({ childIdentifier, parentBoneIdentifier }) => {
        this.activeBuilder.reparent(childIdentifier, parentBoneIdentifier);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully reparented "${childIdentifier}" into bone "${parentBoneIdentifier}".`,
            },
          ],
        };
      }
    );

    // 7. bb_cull_hidden_faces
    this.server.tool(
      'bb_cull_hidden_faces',
      'High-FPS Optimizer: Scans touching cubes and culls occluded internal faces to reduce draw calls and VRAM in Minecraft',
      {},
      async () => {
        const stats = this.activeBuilder.cullHiddenFaces();
        return {
          content: [
            {
              type: 'text',
              text: `Optimization complete! Culled ${stats.facesCulled} / ${stats.totalFacesChecked} hidden faces (${stats.culledFacesPercentage}% geometry reduction) across ${stats.elementsModified} elements.`,
            },
          ],
        };
      }
    );

    // 8. bb_validate_model
    this.server.tool(
      'bb_validate_model',
      'Runs Minecraft Bedrock and Java engine rule checks (zero-volume, rotation constraints, z-fighting, integer UVs)',
      {},
      async () => {
        const report = this.activeBuilder.validate();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }
    );

    // 9. bb_auto_fix
    this.server.tool(
      'bb_auto_fix',
      'Automatically resolves Minecraft engine rule issues (removes zero-volume cubes, snaps UVs, wraps multi-axis rotations into bones)',
      {},
      async () => {
        const result = this.activeBuilder.autoFix();
        return {
          content: [
            {
              type: 'text',
              text: `Auto-fix completed! Fixed ${result.fixedIssuesCount} issue(s):\n- ${result.fixesApplied.join('\n- ')}`,
            },
          ],
        };
      }
    );

    // 10. bb_read_model
    this.server.tool(
      'bb_read_model',
      'Inspects an existing .bbmodel file from disk or current memory state',
      {
        filePath: z.string().optional().describe('Absolute or relative path to a .bbmodel file. If omitted, inspects active session model.'),
      },
      async ({ filePath }) => {
        let builder = this.activeBuilder;
        if (filePath) {
          const resolvedPath = path.resolve(filePath);
          if (!fs.existsSync(resolvedPath)) {
            throw new Error(`File not found: ${resolvedPath}`);
          }
          const raw = fs.readFileSync(resolvedPath, 'utf-8');
          builder = ModelBuilder.fromJSON(raw);
          this.activeBuilder = builder; // load into session
        }

        const model = builder.getModel();
        const stats = {
          name: model.name,
          format: model.meta.model_format,
          resolution: model.resolution,
          totalCubes: model.elements.length,
          totalBones: model.outliner.filter((n) => typeof n !== 'string').length,
          totalTextures: model.textures.length,
          totalAnimations: model.animations.length,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }
    );

    // 11. bb_save_model
    this.server.tool(
      'bb_save_model',
      'Saves the current active model state to a .bbmodel file on disk',
      {
        filePath: z.string().describe('Target file path (e.g. ./models/boss.bbmodel)'),
      },
      async ({ filePath }) => {
        const resolvedPath = path.resolve(filePath);
        fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
        fs.writeFileSync(resolvedPath, this.activeBuilder.toJSON(true), 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Model successfully saved to disk at: ${resolvedPath}`,
            },
          ],
        };
      }
    );

    // 12. bb_sprite_extrude
    this.server.tool(
      'bb_sprite_extrude',
      'Extrudes 2D pixel-art sprite (sword, tool, armor, item) into an optimized 3D .bbmodel with Greedy Meshing',
      {
        filePath: z.string().describe('Path to the sprite image file (PNG, WebP, etc.)'),
        name: z.string().optional().describe('Name of the extruded item (default: derived from file or "item")'),
        depth: z.number().default(1).describe('Extrusion thickness in block units (default: 1)'),
        maxDimension: z.number().optional().describe('Target pixel art size (e.g. 16, 32, 64)'),
        center: z.boolean().default(true).describe('Center the model at [0, 0, 0]'),
        cullFaces: z.boolean().default(true).describe('Cull hidden interior faces for high FPS'),
        outputBbmodelPath: z.string().optional().describe('Optional path to write the resulting .bbmodel to disk'),
      },
      async ({ filePath, name, depth, maxDimension, center, cullFaces, outputBbmodelPath }) => {
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Sprite file not found: ${resolvedPath}`);
        }

        const itemName = name ?? path.basename(resolvedPath, path.extname(resolvedPath));
        const result = await SpriteExtruder.extrude(resolvedPath, {
          name: itemName,
          depth,
          maxDimension,
          center,
          cullFaces,
        });

        this.activeBuilder = result.builder;

        let outputMsg = `Extruded "${itemName}" successfully!\n` +
          `- Original Pixels: ${result.stats.originalPixels}\n` +
          `- Optimized Cuboids: ${result.stats.meshedCubes}\n` +
          `- Optimization Ratio: ${result.stats.optimizationRatio}% geometry reduction\n` +
          `- Palette Colors: ${result.stats.paletteColorsCount}\n` +
          `- Model Dimensions: ${result.stats.dimensions.join('x')}`;

        if (outputBbmodelPath) {
          const outPath = path.resolve(outputBbmodelPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, result.builder.toJSON(true), 'utf-8');
          outputMsg += `\n- Saved to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 13. bb_image_to_model
    this.server.tool(
      'bb_image_to_model',
      'Converts an image or concept art into an optimized low-poly 3D model with optional stepped depth relief',
      {
        filePath: z.string().describe('Path to reference image'),
        name: z.string().optional().describe('Name of the model'),
        reliefDepth: z.number().default(1).describe('Stepped relief depth based on luminance (1 for flat extrusion, >1 for 3D relief)'),
        maxDimension: z.number().default(32).describe('Maximum pixel grid resolution (e.g. 16, 32, 64)'),
        cullFaces: z.boolean().default(true).describe('Run hidden face culler'),
        outputBbmodelPath: z.string().optional().describe('Optional path to write .bbmodel to disk'),
      },
      async ({ filePath, name, reliefDepth, maxDimension, cullFaces, outputBbmodelPath }) => {
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) {
          throw new Error(`Image file not found: ${resolvedPath}`);
        }

        const modelName = name ?? path.basename(resolvedPath, path.extname(resolvedPath));
        const result = await ImageToModel.convert(resolvedPath, {
          name: modelName,
          reliefDepth,
          maxDimension,
          cullFaces,
        });

        this.activeBuilder = result.builder;

        let outputMsg = `Converted image "${modelName}" to 3D model!\n` +
          `- Original Pixels: ${result.stats.originalPixels}\n` +
          `- Optimized Cuboids: ${result.stats.meshedCubes}\n` +
          `- Optimization Ratio: ${result.stats.optimizationRatio}% reduction\n` +
          `- Dimensions: ${result.stats.dimensions.join('x')}`;

        if (outputBbmodelPath) {
          const outPath = path.resolve(outputBbmodelPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, result.builder.toJSON(true), 'utf-8');
          outputMsg += `\n- Saved to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 14. bb_apply_display_transforms
    this.server.tool(
      'bb_apply_display_transforms',
      'Applies Minecraft display transformation matrix presets (thirdperson, firstperson, gui, ground) for weapons/items',
      {
        preset: z
          .enum(['sword', 'axe', 'tool', 'staff', 'gun', 'shield', 'bow', 'block'])
          .default('sword')
          .describe('Display transformation preset'),
      },
      async ({ preset }) => {
        const displayRecord = DisplayPresets.getPreset(preset);
        this.activeBuilder.getModel().display = displayRecord;

        return {
          content: [
            {
              type: 'text',
              text: `Applied "${preset}" display transformation matrix to active model. Configured 8 view contexts (thirdperson_righthand, firstperson_righthand, gui, ground, fixed, head).`,
            },
          ],
        };
      }
    );

    // 15. bb_align_weapon_grip
    this.server.tool(
      'bb_align_weapon_grip',
      'Shifts weapon coordinates so that its handle/grip rests at player hand origin, and sets display transforms',
      {
        grip: z
          .enum(['bottom_left', 'bottom_center', 'center', 'top_center'])
          .default('bottom_left')
          .describe('Grip pivot location on weapon model (default: bottom_left for diagonal swords)'),
        preset: z
          .enum(['sword', 'axe', 'tool', 'staff', 'gun', 'shield', 'bow', 'block'])
          .default('sword')
          .describe('Display preset to apply simultaneously'),
      },
      async ({ grip, preset }) => {
        const result = WeaponAligner.alignAndPreset(this.activeBuilder, {
          grip,
          preset,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Weapon aligned successfully!\n` +
                `- Shifted bounds by: [${result.shiftedOffset.map((v) => Math.round(v * 10) / 10).join(', ')}]\n` +
                `- Hand grip locked to: ${grip}\n` +
                `- Display preset: ${result.presetApplied}`,
            },
          ],
        };
      }
    );

    // 16. bb_export_java_item
    this.server.tool(
      'bb_export_java_item',
      'Exports active model as a production Minecraft Java Item JSON model (with textures and display matrix)',
      {
        modId: z.string().default('mymod').describe('Your Minecraft Mod ID (e.g. "epicfight", "aether", "mymod")'),
        texturePath: z.string().optional().describe('Texture relative path (e.g. "item/ruby_sword")'),
        outputPath: z.string().optional().describe('Target JSON file path (e.g. "assets/mymod/models/item/ruby_sword.json")'),
        centerInBlock: z.boolean().default(true).describe('Center item inside standard 0..16 block coordinate box'),
      },
      async ({ modId, texturePath, outputPath, centerInBlock }) => {
        const javaJson = JavaItemExporter.exportToJSON(this.activeBuilder, {
          modId,
          texturePath,
          centerInBlock,
        });

        const jsonStr = JSON.stringify(javaJson, null, 2);

        let outputMsg = `Exported Java Item Model for mod "${modId}"!\n` +
          `- Elements count: ${javaJson.elements.length}\n` +
          `- Textures: ${JSON.stringify(javaJson.textures)}\n` +
          `- Display contexts: ${Object.keys(javaJson.display || {}).join(', ')}`;

        if (outputPath) {
          const outPath = path.resolve(outputPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, jsonStr, 'utf-8');
          outputMsg += `\n- Saved to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 17. bb_apply_rig_template
    this.server.tool(
      'bb_apply_rig_template',
      'Applies an industry-standard bone skeleton rig (biped/humanoid, quadruped/animal) to the model',
      {
        rigType: z.enum(['biped', 'quadruped']).default('biped').describe('Rig skeleton type'),
        slimArms: z.boolean().default(false).describe('Use Alex 3px arms instead of Steve 4px arms (biped only)'),
        includeSampleCubes: z.boolean().default(false).describe('Populate default placeholder geometry inside bones'),
      },
      async ({ rigType, slimArms, includeSampleCubes }) => {
        let resultBones;
        if (rigType === 'biped') {
          resultBones = RigTemplates.applyBipedRig(this.activeBuilder, {
            slimArms,
            includeSampleCubes,
          });
        } else {
          resultBones = RigTemplates.applyQuadrupedRig(this.activeBuilder, {
            includeSampleCubes,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: `Applied "${rigType}" rig template successfully! Created ${resultBones.bones.length} bones: ${resultBones.bones.map((b) => b.name).join(', ')}.`,
            },
          ],
        };
      }
    );

    // 18. bb_geckolib_create_armor_rig
    this.server.tool(
      'bb_geckolib_create_armor_rig',
      'Creates a 3D animated player armor set rig compliant with GeckoLib (armorHead, armorBody, arms, legs, boots)',
      {
        armorParts: z
          .array(z.enum(['helmet', 'chestplate', 'leggings', 'boots']))
          .default(['helmet', 'chestplate', 'leggings', 'boots'])
          .describe('Armor pieces to generate'),
        inflate: z.number().default(0.5).describe('Layer inflation offset to prevent skin clipping (default: 0.5)'),
      },
      async ({ armorParts, inflate }) => {
        const result = RigTemplates.applyArmorRig(this.activeBuilder, {
          armorParts,
          inflate,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Generated GeckoLib 3D player armor rig!\n` +
                `- Parts included: ${armorParts.join(', ')}\n` +
                `- Bones created: ${result.bones.map((b) => b.name).join(', ')}\n` +
                `- Layer inflation: +${inflate}`,
            },
          ],
        };
      }
    );

    // 19. bb_generate_procedural_anim
    this.server.tool(
      'bb_generate_procedural_anim',
      'Procedurally synthesizes organic keyframe animation loops (walk, run, idle, attack, death) with sine kinematics',
      {
        animationType: z.enum(['walk', 'run', 'idle', 'attack', 'death']).default('walk').describe('Type of animation to synthesize'),
        speedMultiplier: z.number().default(1.0).describe('Playback speed factor (e.g. 1.2 for faster, 0.8 for slower)'),
        amplitudeMultiplier: z.number().default(1.0).describe('Motion intensity factor'),
        outputAnimPath: z.string().optional().describe('Optional path to export GeckoLib .animation.json to disk'),
      },
      async ({ animationType, speedMultiplier, amplitudeMultiplier, outputAnimPath }) => {
        const modelName = this.activeBuilder.getModel().name;
        const { bbmodelAnim, geckolibAnim } = ProceduralAnimator.generateBipedAnimation(
          modelName,
          animationType,
          {
            speedMultiplier,
            amplitudeMultiplier,
          }
        );

        // Attach to active BBModel
        this.activeBuilder.getModel().animations.push(bbmodelAnim);
        // Cache for GeckoLib export
        this.geckolibAnimations[bbmodelAnim.name] = geckolibAnim;

        let outputMsg = `Synthesized animation "${bbmodelAnim.name}" successfully!\n` +
          `- Duration: ${bbmodelAnim.length}s\n` +
          `- Loop: ${bbmodelAnim.loop}\n` +
          `- Animated bones: ${Object.keys(geckolibAnim.bones).join(', ')}`;

        if (outputAnimPath) {
          const outPath = path.resolve(outputAnimPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          const animFile = GeckoLibExporter.exportAnimationJSON({
            [bbmodelAnim.name]: geckolibAnim,
          });
          fs.writeFileSync(outPath, JSON.stringify(animFile, null, 2), 'utf-8');
          outputMsg += `\n- Exported GeckoLib animation to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 20. bb_geckolib_export_geo
    this.server.tool(
      'bb_geckolib_export_geo',
      'Exports active model as production GeckoLib 1.12.0 .geo.json geometry file',
      {
        identifier: z.string().optional().describe('Geometry identifier (e.g. "geometry.ruby_boss")'),
        outputPath: z.string().optional().describe('Target file path (e.g. "assets/mymod/geo/boss.geo.json")'),
      },
      async ({ identifier, outputPath }) => {
        const geoJson = GeckoLibExporter.exportGeoJSON(this.activeBuilder, identifier);
        const jsonStr = JSON.stringify(geoJson, null, 2);

        let outputMsg = `Exported GeckoLib geometry!\n` +
          `- Format version: ${geoJson.format_version}\n` +
          `- Identifier: ${geoJson['minecraft:geometry']?.[0]?.description?.identifier}\n` +
          `- Bones: ${geoJson['minecraft:geometry']?.[0]?.bones?.length}`;

        if (outputPath) {
          const outPath = path.resolve(outputPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, jsonStr, 'utf-8');
          outputMsg += `\n- Saved to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 21. bb_geckolib_export_anim
    this.server.tool(
      'bb_geckolib_export_anim',
      'Exports all generated or active animations into a standard GeckoLib .animation.json file',
      {
        outputPath: z.string().optional().describe('Target file path (e.g. "assets/mymod/animations/boss.animation.json")'),
      },
      async ({ outputPath }) => {
        const animFile = GeckoLibExporter.exportAnimationJSON(this.geckolibAnimations);
        const jsonStr = JSON.stringify(animFile, null, 2);

        let outputMsg = `Exported GeckoLib animations!\n` +
          `- Total animation tracks: ${Object.keys(animFile.animations).length}\n` +
          `- Tracks: ${Object.keys(animFile.animations).join(', ')}`;

        if (outputPath) {
          const outPath = path.resolve(outputPath);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, jsonStr, 'utf-8');
          outputMsg += `\n- Saved to: ${outPath}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 22. bb_bedrock_generate_addon
    this.server.tool(
      'bb_bedrock_generate_addon',
      'One-Click MCPE Generator: Builds complete Bedrock Add-on (RP + BP) and packs into ready-to-play .mcaddon file',
      {
        outputDirectory: z.string().describe('Target folder to generate the Add-on (e.g. "./mcpe_addons")'),
        entityName: z.string().optional().describe('Entity name (defaults to active model name)'),
        namespace: z.string().default('custom').describe('Add-on namespace prefix (e.g. "custom", "mythic")'),
        behaviorPreset: z
          .enum(['hostile_mob', 'boss', 'passive_animal', 'tameable_pet'])
          .default('hostile_mob')
          .describe('AI and component behavior preset'),
        health: z.number().optional().describe('Entity health points (e.g. 40 for mob, 300 for boss)'),
        attackDamage: z.number().optional().describe('Attack damage points (e.g. 6 for mob, 14 for boss)'),
        movementSpeed: z.number().optional().describe('Movement speed (default: 0.25)'),
        bundleMcaddon: z.boolean().default(true).describe('Bundle into a double-clickable .mcaddon file'),
      },
      async ({
        outputDirectory,
        entityName,
        namespace,
        behaviorPreset,
        health,
        attackDamage,
        movementSpeed,
        bundleMcaddon,
      }) => {
        const result = await BedrockAddonGenerator.generateAddon(this.activeBuilder, {
          outputDirectory,
          entityName,
          namespace,
          behaviorPreset,
          health,
          attackDamage,
          movementSpeed,
          bundleMcaddon,
          animations: this.geckolibAnimations,
        });

        let outputMsg = `Generated complete Bedrock / MCPE Add-on for "${result.entityName}"!\n` +
          `- Identifier: ${result.identifier}\n` +
          `- Resource Pack: ${result.rpDirectory}\n` +
          `- Behavior Pack: ${result.bpDirectory}\n` +
          `- Total files created: ${result.filesGenerated.length}`;

        if (result.mcaddonFilePath) {
          outputMsg += `\n- One-Click .mcaddon Bundle: ${result.mcaddonFilePath}\n` +
            `👉 (Double-click this .mcaddon file to install directly into Minecraft Bedrock / MCPE!)`;
        }

        return {
          content: [
            {
              type: 'text',
              text: outputMsg,
            },
          ],
        };
      }
    );

    // 23. bb_bedrock_export_client_entity
    this.server.tool(
      'bb_bedrock_export_client_entity',
      'Exports Bedrock Client Entity definition (entity/<name>.entity.json) linking materials, textures, and geometry',
      {
        entityName: z.string().describe('Entity name'),
        namespace: z.string().default('custom').describe('Namespace prefix'),
        outputPath: z.string().describe('Target JSON file path'),
      },
      async ({ entityName, namespace, outputPath }) => {
        const clientEntity = BedrockClientEntityBuilder.buildClientEntity(entityName, { namespace });
        const jsonStr = JSON.stringify(clientEntity, null, 2);

        const outPath = path.resolve(outputPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, jsonStr, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Exported Bedrock Client Entity definition to: ${outPath}`,
            },
          ],
        };
      }
    );

    // 24. bb_bedrock_export_behavior_entity
    this.server.tool(
      'bb_bedrock_export_behavior_entity',
      'Exports Bedrock Server Behavior Entity definition (entities/<name>.json) with health, attack, and AI components',
      {
        entityName: z.string().describe('Entity name'),
        namespace: z.string().default('custom').describe('Namespace prefix'),
        preset: z.enum(['hostile_mob', 'boss', 'passive_animal', 'tameable_pet']).default('hostile_mob').describe('AI Preset'),
        health: z.number().optional().describe('Health points'),
        attackDamage: z.number().optional().describe('Attack damage'),
        outputPath: z.string().describe('Target JSON file path'),
      },
      async ({ entityName, namespace, preset, health, attackDamage, outputPath }) => {
        const behaviorEntity = BedrockBehaviorEntityBuilder.buildBehaviorEntity(entityName, {
          namespace,
          preset,
          health,
          attackDamage,
        });
        const jsonStr = JSON.stringify(behaviorEntity, null, 2);

        const outPath = path.resolve(outputPath);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, jsonStr, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Exported Bedrock Behavior Entity definition to: ${outPath}`,
            },
          ],
        };
      }
    );
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Blockbench MCP Server running on stdio');
  }
}
