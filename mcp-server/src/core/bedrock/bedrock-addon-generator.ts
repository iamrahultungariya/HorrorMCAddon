import * as fs from 'fs';
import * as path from 'path';
import { ZipArchive } from 'archiver';
import { ModelBuilder } from '../ast/model-builder.js';
import { BedrockManifestBuilder, BedrockManifestOptions } from './bedrock-manifest.js';
import { BedrockClientEntityBuilder, ClientEntityOptions } from './bedrock-client-entity.js';
import { BedrockBehaviorEntityBuilder, BehaviorEntityOptions } from './bedrock-behavior-entity.js';
import { GeckoLibExporter } from '../exporters/geckolib-exporter.js';
import { GeckoLibAnimation } from '../animation/procedural-animator.js';

export interface GenerateAddonOptions {
  entityName?: string;
  namespace?: string;
  outputDirectory: string;
  behaviorPreset?: 'hostile_mob' | 'boss' | 'passive_animal' | 'tameable_pet';
  health?: number;
  attackDamage?: number;
  movementSpeed?: number;
  spawnEggColors?: { base: string; overlay: string };
  animations?: Record<string, GeckoLibAnimation>;
  bundleMcaddon?: boolean; // Create .mcaddon zip file, default: true
}

export interface AddonGenerationResult {
  entityName: string;
  identifier: string;
  rpDirectory: string;
  bpDirectory: string;
  mcaddonFilePath?: string;
  filesGenerated: string[];
}

export class BedrockAddonGenerator {
  /**
   * Generates a complete, ready-to-play Minecraft Bedrock / MCPE Add-on (Resource Pack + Behavior Pack)
   * and optionally bundles it into a one-click .mcaddon package.
   */
  static async generateAddon(
    builder: ModelBuilder,
    options: GenerateAddonOptions
  ): Promise<AddonGenerationResult> {
    const model = builder.getModel();
    const entityName = options.entityName ?? model.name;
    const namespace = options.namespace ?? 'custom';
    const identifier = `${namespace}:${entityName}`;
    const baseDir = path.resolve(options.outputDirectory);
    const bundle = options.bundleMcaddon ?? true;

    const rpDir = path.join(baseDir, `${entityName}_RP`);
    const bpDir = path.join(baseDir, `${entityName}_BP`);

    const filesGenerated: string[] = [];

    const writeFile = (targetPath: string, content: string | Buffer) => {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content);
      filesGenerated.push(targetPath);
    };

    // 1. Paired Manifests
    const manifests = BedrockManifestBuilder.buildPairedManifests({
      name: entityName,
    });
    writeFile(path.join(rpDir, 'manifest.json'), JSON.stringify(manifests.resourcePack, null, 2));
    writeFile(path.join(bpDir, 'manifest.json'), JSON.stringify(manifests.behaviorPack, null, 2));

    // 2. Resource Pack: Geometry (.geo.json)
    const geoJson = GeckoLibExporter.exportGeoJSON(builder, `geometry.${entityName}`);
    writeFile(
      path.join(rpDir, 'models', 'entity', `${entityName}.geo.json`),
      JSON.stringify(geoJson, null, 2)
    );

    // 3. Resource Pack: Animations
    const animations = options.animations ?? {};
    if (Object.keys(animations).length > 0) {
      const animFile = GeckoLibExporter.exportAnimationJSON(animations);
      writeFile(
        path.join(rpDir, 'animations', `${entityName}.animation.json`),
        JSON.stringify(animFile, null, 2)
      );
    }

    // 4. Resource Pack: Render Controller & Animation Controller
    const renderController = BedrockClientEntityBuilder.buildRenderController(entityName);
    writeFile(
      path.join(rpDir, 'render_controllers', `${entityName}.render_controllers.json`),
      JSON.stringify(renderController, null, 2)
    );

    const animController = BedrockClientEntityBuilder.buildAnimationController(entityName);
    writeFile(
      path.join(rpDir, 'animation_controllers', `${entityName}.animation_controllers.json`),
      JSON.stringify(animController, null, 2)
    );

    // 5. Resource Pack: Client Entity
    const availableAnims = Object.keys(animations).map((a) => a.replace(`animation.${entityName}.`, ''));
    const clientEntity = BedrockClientEntityBuilder.buildClientEntity(entityName, {
      namespace,
      spawnEggColors: options.spawnEggColors,
      availableAnimations: availableAnims.length > 0 ? availableAnims : ['walk', 'idle', 'attack'],
    });
    writeFile(
      path.join(rpDir, 'entity', `${entityName}.entity.json`),
      JSON.stringify(clientEntity, null, 2)
    );

    // 6. Resource Pack: Texture (.png)
    // Extract embedded texture if available, or write a fallback 16x16 PNG
    const texturePath = path.join(rpDir, 'textures', 'entity', `${entityName}.png`);
    if (model.textures.length > 0 && model.textures[0].source) {
      const src = model.textures[0].source;
      const base64Match = src.match(/^data:image\/png;base64,(.+)$/);
      if (base64Match) {
        writeFile(texturePath, Buffer.from(base64Match[1], 'base64'));
      }
    }

    // 7. Resource Pack: Texts (Localization)
    const langContent = `entity.${namespace}:${entityName}.name=${entityName.replace(/_/g, ' ')}\nitem.spawn_egg.entity.${namespace}:${entityName}.name=Spawn ${entityName.replace(/_/g, ' ')}\n`;
    writeFile(path.join(rpDir, 'texts', 'en_US.lang'), langContent);

    // 8. Behavior Pack: Entity Behavior (entities/<name>.json)
    const behaviorEntity = BedrockBehaviorEntityBuilder.buildBehaviorEntity(entityName, {
      namespace,
      preset: options.behaviorPreset ?? 'hostile_mob',
      health: options.health,
      attackDamage: options.attackDamage,
      movementSpeed: options.movementSpeed,
    });
    writeFile(
      path.join(bpDir, 'entities', `${entityName}.json`),
      JSON.stringify(behaviorEntity, null, 2)
    );

    // 9. One-Click .mcaddon Archive Bundle
    let mcaddonFilePath: string | undefined = undefined;
    if (bundle) {
      mcaddonFilePath = path.join(baseDir, `${entityName}.mcaddon`);
      await this.createMcaddonZip([rpDir, bpDir], mcaddonFilePath);
      filesGenerated.push(mcaddonFilePath);
    }

    return {
      entityName,
      identifier,
      rpDirectory: rpDir,
      bpDirectory: bpDir,
      mcaddonFilePath,
      filesGenerated,
    };
  }

  /**
   * Zips Resource Pack and Behavior Pack directories into a single .mcaddon file.
   */
  private static createMcaddonZip(directories: string[], targetFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetFile);
      const archive = new (ZipArchive as any)({ zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));

      archive.pipe(output);

      for (const dir of directories) {
        const folderName = path.basename(dir);
        archive.directory(dir, folderName);
      }

      archive.finalize();
    });
  }
}
