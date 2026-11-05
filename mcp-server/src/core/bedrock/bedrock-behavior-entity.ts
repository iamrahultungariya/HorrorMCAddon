export type BehaviorPreset = 'hostile_mob' | 'boss' | 'passive_animal' | 'tameable_pet';

export interface BehaviorEntityOptions {
  namespace?: string;
  preset?: BehaviorPreset;
  health?: number;
  attackDamage?: number;
  movementSpeed?: number;
  collisionBox?: { width: number; height: number };
}

export class BedrockBehaviorEntityBuilder {
  /**
   * Generates a fully functional Minecraft Bedrock Server Behavior Entity definition
   * (entities/<name>.json in Behavior Pack).
   */
  static buildBehaviorEntity(entityName: string, options: BehaviorEntityOptions = {}) {
    const namespace = options.namespace ?? 'custom';
    const identifier = `${namespace}:${entityName}`;
    const preset = options.preset ?? 'hostile_mob';

    const width = options.collisionBox?.width ?? 0.8;
    const height = options.collisionBox?.height ?? 2.0;

    const baseComponents: Record<string, any> = {
      'minecraft:is_hidden_when_invisible': {},
      'minecraft:physics': {},
      'minecraft:pushable': {
        is_pushable: true,
        is_pushable_by_piston: true,
      },
      'minecraft:collision_box': {
        width,
        height,
      },
      'minecraft:movement.basic': {},
      'minecraft:navigation.walk': {
        can_path_over_water: true,
        avoid_damage_blocks: true,
      },
      'minecraft:jump.static': {},
      'minecraft:can_climb': {},
    };

    switch (preset) {
      case 'boss': {
        const hp = options.health ?? 300;
        const dmg = options.attackDamage ?? 14;
        const spd = options.movementSpeed ?? 0.3;

        Object.assign(baseComponents, {
          'minecraft:type_family': {
            family: ['monster', 'mob', 'boss'],
          },
          'minecraft:health': {
            value: hp,
            max: hp,
          },
          'minecraft:movement': {
            value: spd,
          },
          'minecraft:attack': {
            damage: dmg,
          },
          'minecraft:knockback_resistance': {
            value: 0.8,
          },
          'minecraft:boss': {
            name: entityName.toUpperCase(),
            should_darken_sky: true,
            hud_range: 30,
          },
          'minecraft:behavior.melee_attack': {
            priority: 1,
            speed_multiplier: 1.25,
            track_target: true,
          },
          'minecraft:behavior.nearest_attackable_target': {
            priority: 2,
            entity_types: [
              {
                filters: { test: 'is_family', subject: 'other', value: 'player' },
                max_dist: 24,
              },
            ],
          },
          'minecraft:behavior.random_stroll': {
            priority: 3,
            speed_multiplier: 0.8,
          },
          'minecraft:behavior.random_look_around': {
            priority: 4,
          },
        });
        break;
      }

      case 'passive_animal': {
        const hp = options.health ?? 20;
        const spd = options.movementSpeed ?? 0.2;

        Object.assign(baseComponents, {
          'minecraft:type_family': {
            family: ['animal', 'mob'],
          },
          'minecraft:health': {
            value: hp,
            max: hp,
          },
          'minecraft:movement': {
            value: spd,
          },
          'minecraft:behavior.panic': {
            priority: 1,
            speed_multiplier: 1.5,
          },
          'minecraft:behavior.random_stroll': {
            priority: 2,
            speed_multiplier: 0.8,
          },
          'minecraft:behavior.look_at_player': {
            priority: 3,
            look_distance: 6.0,
          },
        });
        break;
      }

      case 'tameable_pet': {
        const hp = options.health ?? 35;
        const dmg = options.attackDamage ?? 6;
        const spd = options.movementSpeed ?? 0.3;

        Object.assign(baseComponents, {
          'minecraft:type_family': {
            family: ['pet', 'mob'],
          },
          'minecraft:health': {
            value: hp,
            max: hp,
          },
          'minecraft:movement': {
            value: spd,
          },
          'minecraft:attack': {
            damage: dmg,
          },
          'minecraft:tameable': {
            probability: 0.33,
            tame_items: ['bone', 'meat'],
          },
          'minecraft:behavior.follow_owner': {
            priority: 2,
            speed_multiplier: 1.25,
            start_distance: 5,
            stop_distance: 2,
          },
          'minecraft:behavior.owner_hurt_by_target': {
            priority: 1,
          },
          'minecraft:behavior.owner_hurt_target': {
            priority: 1,
          },
          'minecraft:behavior.random_stroll': {
            priority: 4,
            speed_multiplier: 0.8,
          },
        });
        break;
      }

      case 'hostile_mob':
      default: {
        const hp = options.health ?? 40;
        const dmg = options.attackDamage ?? 6;
        const spd = options.movementSpeed ?? 0.25;

        Object.assign(baseComponents, {
          'minecraft:type_family': {
            family: ['monster', 'mob'],
          },
          'minecraft:health': {
            value: hp,
            max: hp,
          },
          'minecraft:movement': {
            value: spd,
          },
          'minecraft:attack': {
            damage: dmg,
          },
          'minecraft:behavior.melee_attack': {
            priority: 1,
            speed_multiplier: 1.2,
            track_target: true,
          },
          'minecraft:behavior.nearest_attackable_target': {
            priority: 2,
            entity_types: [
              {
                filters: { test: 'is_family', subject: 'other', value: 'player' },
                max_dist: 16,
              },
            ],
          },
          'minecraft:behavior.random_stroll': {
            priority: 3,
            speed_multiplier: 0.8,
          },
          'minecraft:behavior.random_look_around': {
            priority: 4,
          },
        });
        break;
      }
    }

    return {
      format_version: '1.16.0',
      'minecraft:entity': {
        description: {
          identifier,
          is_spawnable: true,
          is_summonable: true,
          is_experimental: false,
        },
        components: baseComponents,
      },
    };
  }
}
