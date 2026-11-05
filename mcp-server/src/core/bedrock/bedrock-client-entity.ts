export interface ClientEntityOptions {
  namespace?: string;
  spawnEggColors?: { base: string; overlay: string };
  availableAnimations?: string[]; // e.g. ['walk', 'idle', 'attack', 'death']
}

export class BedrockClientEntityBuilder {
  /**
   * Generates Bedrock Client Entity JSON definition (entity/<name>.entity.json).
   */
  static buildClientEntity(entityName: string, options: ClientEntityOptions = {}) {
    const namespace = options.namespace ?? 'custom';
    const identifier = `${namespace}:${entityName}`;
    const anims = options.availableAnimations ?? ['walk', 'idle', 'attack'];

    const animationsRecord: Record<string, string> = {};
    for (const a of anims) {
      animationsRecord[a] = `animation.${entityName}.${a}`;
    }
    animationsRecord['controller'] = `controller.animation.${entityName}`;

    const eggBase = options.spawnEggColors?.base ?? '#8B0000';
    const eggOverlay = options.spawnEggColors?.overlay ?? '#FFD700';

    return {
      format_version: '1.10.0',
      'minecraft:client_entity': {
        description: {
          identifier,
          materials: {
            default: 'entity_alphatest',
          },
          textures: {
            default: `textures/entity/${entityName}`,
          },
          geometry: {
            default: `geometry.${entityName}`,
          },
          animations: animationsRecord,
          scripts: {
            animate: ['controller'],
          },
          render_controllers: [`controller.render.${entityName}`],
          spawn_egg: {
            base_color: eggBase,
            overlay_color: eggOverlay,
          },
        },
      },
    };
  }

  /**
   * Generates Bedrock Render Controller JSON (render_controllers/<name>.render_controllers.json).
   */
  static buildRenderController(entityName: string) {
    return {
      format_version: '1.8.0',
      render_controllers: {
        [`controller.render.${entityName}`]: {
          geometry: 'Geometry.default',
          materials: [{ '*': 'Material.default' }],
          textures: ['Texture.default'],
        },
      },
    };
  }

  /**
   * Generates Bedrock State-Machine Animation Controller JSON
   * (animation_controllers/<name>.animation_controllers.json).
   */
  static buildAnimationController(entityName: string) {
    return {
      format_version: '1.10.0',
      animation_controllers: {
        [`controller.animation.${entityName}`]: {
          initial_state: 'default',
          states: {
            default: {
              animations: ['idle'],
              transitions: [
                {
                  moving: 'query.modified_move_speed > 0.1',
                },
              ],
            },
            moving: {
              animations: ['walk'],
              transitions: [
                {
                  default: 'query.modified_move_speed <= 0.1',
                },
              ],
            },
          },
        },
      },
    };
  }
}
