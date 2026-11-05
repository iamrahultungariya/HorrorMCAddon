import { describe, it, expect } from 'vitest';
import { BedrockClientEntityBuilder } from '../../src/core/bedrock/bedrock-client-entity.js';

describe('BedrockClientEntityBuilder', () => {
  it('builds Client Entity definition with linked geometry, textures, and animations', () => {
    const clientEntity = BedrockClientEntityBuilder.buildClientEntity('fire_demon', {
      namespace: 'mythic',
      availableAnimations: ['walk', 'idle', 'attack'],
    });

    const desc = clientEntity['minecraft:client_entity'].description;
    expect(desc.identifier).toBe('mythic:fire_demon');
    expect(desc.materials.default).toBe('entity_alphatest');
    expect(desc.textures.default).toBe('textures/entity/fire_demon');
    expect(desc.geometry.default).toBe('geometry.fire_demon');

    expect(desc.animations.walk).toBe('animation.fire_demon.walk');
    expect(desc.animations.controller).toBe('controller.animation.fire_demon');
    expect(desc.scripts.animate).toContain('controller');
  });

  it('builds Render Controller and Animation Controller with state transitions', () => {
    const rc = BedrockClientEntityBuilder.buildRenderController('fire_demon');
    expect(rc.render_controllers['controller.render.fire_demon']).toBeDefined();

    const ac = BedrockClientEntityBuilder.buildAnimationController('fire_demon');
    const controller = ac.animation_controllers['controller.animation.fire_demon'];
    expect(controller.initial_state).toBe('default');
    expect(controller.states.default.transitions[0].moving).toBe('query.modified_move_speed > 0.1');
    expect(controller.states.moving.transitions[0].default).toBe('query.modified_move_speed <= 0.1');
  });
});
