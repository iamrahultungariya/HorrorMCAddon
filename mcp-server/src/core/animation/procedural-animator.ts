import { v4 as uuidv4 } from 'uuid';
import { Animation, Animator, Keyframe } from '../types/bbmodel.types.js';

export type AnimationType = 'walk' | 'run' | 'idle' | 'attack' | 'death';

export interface GeckoLibBoneKeyframes {
  rotation?: Record<string, [number, number, number]>;
  position?: Record<string, [number, number, number]>;
  scale?: Record<string, [number, number, number]>;
}

export interface GeckoLibAnimation {
  loop?: boolean | 'hold_on_last_frame';
  animation_length: number;
  bones: Record<string, GeckoLibBoneKeyframes>;
}

export interface GeckoLibAnimationFile {
  format_version: '1.8.0';
  animations: Record<string, GeckoLibAnimation>;
}

export class ProceduralAnimator {
  /**
   * Generates a procedural animation for a model (Biped / Humanoid standard).
   */
  static generateBipedAnimation(
    modelName: string,
    type: AnimationType,
    options: {
      speedMultiplier?: number;
      amplitudeMultiplier?: number;
      steps?: number; // Number of keyframe samples across the loop
    } = {}
  ): { bbmodelAnim: Animation; geckolibAnim: GeckoLibAnimation } {
    const speed = options.speedMultiplier ?? 1.0;
    const amp = options.amplitudeMultiplier ?? 1.0;

    let length = 1.0;
    let isLoop: 'loop' | 'hold' | 'once' = 'loop';
    let steps = options.steps ?? 8;

    switch (type) {
      case 'idle':
        length = 2.0 / speed;
        steps = 8;
        break;
      case 'walk':
        length = 1.0 / speed;
        steps = 8;
        break;
      case 'run':
        length = 0.6 / speed;
        steps = 8;
        break;
      case 'attack':
        length = 0.8 / speed;
        isLoop = 'once';
        steps = 8;
        break;
      case 'death':
        length = 1.0 / speed;
        isLoop = 'hold';
        steps = 6;
        break;
    }

    const animName = `animation.${modelName}.${type}`;
    const geckolibBones: Record<string, GeckoLibBoneKeyframes> = {};
    const animators: Record<string, Animator> = {};

    // Helper to add rotation keyframe
    const addRotation = (boneName: string, time: number, rot: [number, number, number]) => {
      const timeStr = time.toFixed(2);
      if (!geckolibBones[boneName]) geckolibBones[boneName] = {};
      if (!geckolibBones[boneName].rotation) geckolibBones[boneName].rotation = {};
      geckolibBones[boneName].rotation![timeStr] = [
        Math.round(rot[0] * 100) / 100,
        Math.round(rot[1] * 100) / 100,
        Math.round(rot[2] * 100) / 100,
      ];

      // BBModel animator
      if (!animators[boneName]) {
        animators[boneName] = { name: boneName, type: 'bone', keyframes: [] };
      }
      animators[boneName].keyframes.push({
        channel: 'rotation',
        time,
        data_points: [{ x: rot[0], y: rot[1], z: rot[2] }],
        interpolation: 'linear',
        uuid: uuidv4(),
      });
    };

    // Helper to add position keyframe
    const addPosition = (boneName: string, time: number, pos: [number, number, number]) => {
      const timeStr = time.toFixed(2);
      if (!geckolibBones[boneName]) geckolibBones[boneName] = {};
      if (!geckolibBones[boneName].position) geckolibBones[boneName].position = {};
      geckolibBones[boneName].position![timeStr] = [
        Math.round(pos[0] * 100) / 100,
        Math.round(pos[1] * 100) / 100,
        Math.round(pos[2] * 100) / 100,
      ];

      if (!animators[boneName]) {
        animators[boneName] = { name: boneName, type: 'bone', keyframes: [] };
      }
      animators[boneName].keyframes.push({
        channel: 'position',
        time,
        data_points: [{ x: pos[0], y: pos[1], z: pos[2] }],
        interpolation: 'linear',
        uuid: uuidv4(),
      });
    };

    // Generate kinematic curves based on animation type
    for (let i = 0; i <= steps; i++) {
      const tNorm = i / steps; // 0 to 1
      const time = tNorm * length;
      const phase = 2 * Math.PI * tNorm;

      switch (type) {
        case 'walk': {
          const legAmp = 35 * amp;
          const armAmp = 25 * amp;

          // Alternating legs and arms (Sine kinematics)
          addRotation('right_leg', time, [-Math.sin(phase) * legAmp, 0, 0]);
          addRotation('left_leg', time, [Math.sin(phase) * legAmp, 0, 0]);
          addRotation('right_arm', time, [Math.sin(phase) * armAmp, 0, 0]);
          addRotation('left_arm', time, [-Math.sin(phase) * armAmp, 0, 0]);

          // Subtle torso bobbing (2 bobs per full stride cycle)
          addPosition('body', time, [0, -Math.abs(Math.sin(phase)) * 0.4 * amp, 0]);
          addRotation('head', time, [0, Math.sin(phase) * 2, 0]);
          break;
        }

        case 'run': {
          const legAmp = 55 * amp;
          const armAmp = 45 * amp;

          // Running has faster alternating legs with forward body tilt
          addRotation('right_leg', time, [-Math.sin(phase) * legAmp, 0, 0]);
          addRotation('left_leg', time, [Math.sin(phase) * legAmp, 0, 0]);
          addRotation('right_arm', time, [Math.sin(phase) * armAmp, 0, 0]);
          addRotation('left_arm', time, [-Math.sin(phase) * armAmp, 0, 0]);

          // Forward body tilt
          addRotation('body', time, [12, Math.sin(phase) * 3, 0]);
          addPosition('body', time, [0, -Math.abs(Math.sin(phase)) * 0.8 * amp, 0]);
          addRotation('head', time, [-8, 0, 0]);
          break;
        }

        case 'idle': {
          // Organic breathing
          const breathPhase = 2 * Math.PI * tNorm;
          addRotation('body', time, [Math.sin(breathPhase) * 1.5 * amp, 0, 0]);
          addPosition('body', time, [0, Math.sin(breathPhase) * 0.25 * amp, 0]);
          addRotation('head', time, [
            -Math.sin(breathPhase) * 1.0,
            Math.sin(Math.PI * tNorm) * 2.5 * amp,
            Math.cos(Math.PI * tNorm) * 1.5 * amp,
          ]);
          addRotation('right_arm', time, [0, 0, Math.sin(breathPhase) * 2.0 * amp]);
          addRotation('left_arm', time, [0, 0, -Math.sin(breathPhase) * 2.0 * amp]);
          break;
        }

        case 'attack': {
          // Key stages of slash attack:
          // 0.0 - 0.2: Windup (raise arm back)
          // 0.2 - 0.4: Forward slash strike
          // 0.4 - 0.6: Overshoot / follow-through
          // 0.6 - 1.0: Return to neutral
          let armRotX = 0;
          let armRotY = 0;
          let bodyRotY = 0;

          if (tNorm < 0.2) {
            const p = tNorm / 0.2;
            armRotX = -50 * p;
            armRotY = 20 * p;
            bodyRotY = -15 * p;
          } else if (tNorm < 0.45) {
            const p = (tNorm - 0.2) / 0.25;
            armRotX = -50 + (75 - -50) * p; // Downward swing
            armRotY = 20 + (-35 - 20) * p;
            bodyRotY = -15 + (25 - -15) * p;
          } else if (tNorm < 0.7) {
            const p = (tNorm - 0.45) / 0.25;
            armRotX = 75 - 35 * p;
            armRotY = -35 + 20 * p;
            bodyRotY = 25 - 15 * p;
          } else {
            const p = (tNorm - 0.7) / 0.3;
            armRotX = 40 * (1 - p);
            armRotY = -15 * (1 - p);
            bodyRotY = 10 * (1 - p);
          }

          addRotation('right_arm', time, [armRotX * amp, armRotY * amp, 0]);
          addRotation('body', time, [0, bodyRotY * amp, 0]);
          addRotation('head', time, [0, -bodyRotY * 0.5 * amp, 0]);
          break;
        }

        case 'death': {
          // Sideways or backward fall
          const p = Math.min(1.0, tNorm * 1.2);
          const fallAngle = -90 * p;
          const dropY = -12 * p;

          addRotation('root', time, [0, 0, fallAngle]);
          addPosition('root', time, [0, dropY, 0]);
          addRotation('head', time, [0, 20 * p, 0]);
          addRotation('right_arm', time, [25 * p, 0, 30 * p]);
          addRotation('left_arm', time, [-25 * p, 0, -30 * p]);
          break;
        }
      }
    }

    const bbmodelAnim: Animation = {
      uuid: uuidv4(),
      name: animName,
      loop: isLoop,
      length,
      snapping: 24,
      animators,
    };

    const geckolibAnim: GeckoLibAnimation = {
      loop: isLoop === 'loop' ? true : isLoop === 'hold' ? 'hold_on_last_frame' : false,
      animation_length: length,
      bones: geckolibBones,
    };

    return { bbmodelAnim, geckolibAnim };
  }
}
