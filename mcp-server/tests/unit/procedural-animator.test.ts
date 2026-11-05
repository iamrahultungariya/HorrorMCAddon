import { describe, it, expect } from 'vitest';
import { ProceduralAnimator } from '../../src/core/animation/procedural-animator.js';

describe('ProceduralAnimator (Kinematic Keyframe Synthesizer)', () => {
  it('generates walk animation with alternating limb curves', () => {
    const { bbmodelAnim, geckolibAnim } = ProceduralAnimator.generateBipedAnimation(
      'zombie',
      'walk',
      { speedMultiplier: 1.0, amplitudeMultiplier: 1.0 }
    );

    expect(bbmodelAnim.name).toBe('animation.zombie.walk');
    expect(bbmodelAnim.loop).toBe('loop');
    expect(geckolibAnim.loop).toBe(true);
    expect(geckolibAnim.animation_length).toBe(1.0);

    // Verify keyframes on right_leg and left_leg
    expect(geckolibAnim.bones['right_leg']).toBeDefined();
    expect(geckolibAnim.bones['left_leg']).toBeDefined();
    expect(geckolibAnim.bones['right_arm']).toBeDefined();
    expect(geckolibAnim.bones['left_arm']).toBeDefined();

    // Check that right_leg and left_leg have opposite rotational directions
    const rightLegRot = geckolibAnim.bones['right_leg'].rotation!['0.25'];
    const leftLegRot = geckolibAnim.bones['left_leg'].rotation!['0.25'];
    expect(rightLegRot[0]).toBeCloseTo(-leftLegRot[0], 0);
  });

  it('generates idle breathing animation with subtle curves', () => {
    const { bbmodelAnim, geckolibAnim } = ProceduralAnimator.generateBipedAnimation(
      'steve',
      'idle'
    );

    expect(bbmodelAnim.name).toBe('animation.steve.idle');
    expect(geckolibAnim.animation_length).toBe(2.0);

    // Torso breathing position Y should be subtle (< 1 unit)
    const bodyPos = geckolibAnim.bones['body'].position!['0.50'];
    expect(Math.abs(bodyPos[1])).toBeLessThan(1.0);
  });

  it('generates attack animation with non-looping slash trajectory', () => {
    const { bbmodelAnim, geckolibAnim } = ProceduralAnimator.generateBipedAnimation(
      'warrior',
      'attack'
    );

    expect(bbmodelAnim.loop).toBe('once');
    expect(geckolibAnim.loop).toBe(false);

    // Right arm should have strong downward slash rotation at mid-strike
    const armRotStrike = geckolibAnim.bones['right_arm'].rotation!['0.40'];
    expect(armRotStrike).toBeDefined();
    expect(armRotStrike[0]).toBeGreaterThan(30); // downward pitch
  });

  it('generates death animation with hold_on_last_frame', () => {
    const { bbmodelAnim, geckolibAnim } = ProceduralAnimator.generateBipedAnimation(
      'boss',
      'death'
    );

    expect(bbmodelAnim.loop).toBe('hold');
    expect(geckolibAnim.loop).toBe('hold_on_last_frame');

    // Final keyframe on root should have fallen over
    const rootRotLast = geckolibAnim.bones['root'].rotation!['1.00'];
    expect(rootRotLast[2]).toBeCloseTo(-90, 0); // rotated sideways to floor
  });
});
