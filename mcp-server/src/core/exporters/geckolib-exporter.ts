import { ModelBuilder } from '../ast/model-builder.js';
import { BedrockGeometryFile } from '../types/bedrock.types.js';
import { GeckoLibAnimation, GeckoLibAnimationFile } from '../animation/procedural-animator.js';

export class GeckoLibExporter {
  /**
   * Exports a ModelBuilder model into a GeckoLib-compliant .geo.json file (format 1.12.0).
   */
  static exportGeoJSON(builder: ModelBuilder, identifier?: string): BedrockGeometryFile {
    const geo = builder.toBedrockGeometry(identifier);

    // Ensure GeckoLib visible bounds are set
    if (geo['minecraft:geometry'] && geo['minecraft:geometry'].length > 0) {
      const entry = geo['minecraft:geometry'][0];
      if (!entry.description.visible_bounds_width) {
        entry.description.visible_bounds_width = 3.0;
        entry.description.visible_bounds_height = 3.0;
        entry.description.visible_bounds_offset = [0, 1.5, 0];
      }
    }

    return geo;
  }

  /**
   * Packages multiple GeckoLib animations into a standard .animation.json file (format 1.8.0).
   */
  static exportAnimationJSON(
    animations: Record<string, GeckoLibAnimation>
  ): GeckoLibAnimationFile {
    return {
      format_version: '1.8.0',
      animations,
    };
  }
}
