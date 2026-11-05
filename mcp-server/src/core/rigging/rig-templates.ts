import { ModelBuilder } from '../ast/model-builder.js';
import { Group } from '../types/bbmodel.types.js';

export type RigType = 'biped' | 'quadruped' | 'winged' | 'armor';

export interface RigOptions {
  slimArms?: boolean; // Alex model (3px arms) vs Steve (4px arms)
  scale?: number;
  includeSampleCubes?: boolean; // Populate default cubes inside bones
}

export class RigTemplates {
  /**
   * Builds a standard Minecraft Humanoid (Biped) skeleton rig.
   * Bones: root -> body -> head, right_arm, left_arm, right_leg, left_leg.
   */
  static applyBipedRig(builder: ModelBuilder, options: RigOptions = {}): { bones: Group[] } {
    const slim = options.slimArms ?? false;
    const armWidth = slim ? 3 : 4;
    const armX = slim ? 4.5 : 5;
    const bones: Group[] = [];

    // Root bone
    const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
    bones.push(root);

    // Body (Torso)
    const body = builder.addBone({ name: 'body', origin: [0, 12, 0] }, root.name);
    bones.push(body);

    // Head
    const head = builder.addBone({ name: 'head', origin: [0, 24, 0] }, body.name);
    bones.push(head);

    // Right Arm
    const rightArm = builder.addBone({ name: 'right_arm', origin: [-armX, 22, 0] }, body.name);
    bones.push(rightArm);

    // Left Arm
    const leftArm = builder.addBone({ name: 'left_arm', origin: [armX, 22, 0] }, body.name);
    bones.push(leftArm);

    // Right Leg
    const rightLeg = builder.addBone({ name: 'right_leg', origin: [-1.9, 12, 0] }, root.name);
    bones.push(rightLeg);

    // Left Leg
    const leftLeg = builder.addBone({ name: 'left_leg', origin: [1.9, 12, 0] }, root.name);
    bones.push(leftLeg);

    // Optional sample cubes
    if (options.includeSampleCubes) {
      // Head cube
      builder.addCube(
        {
          name: 'head_cube',
          from: [-4, 24, -4],
          to: [4, 32, 4],
          origin: [0, 24, 0],
          uvOffset: [0, 0],
        },
        head.name
      );

      // Body cube
      builder.addCube(
        {
          name: 'body_cube',
          from: [-4, 12, -2],
          to: [4, 24, 2],
          origin: [0, 12, 0],
          uvOffset: [16, 16],
        },
        body.name
      );

      // Right arm cube
      builder.addCube(
        {
          name: 'right_arm_cube',
          from: [-armX - armWidth / 2, 12, -2],
          to: [-armX + armWidth / 2, 24, 2],
          origin: [-armX, 22, 0],
          uvOffset: [40, 16],
        },
        rightArm.name
      );

      // Left arm cube
      builder.addCube(
        {
          name: 'left_arm_cube',
          from: [armX - armWidth / 2, 12, -2],
          to: [armX + armWidth / 2, 24, 2],
          origin: [armX, 22, 0],
          uvOffset: [32, 48],
        },
        leftArm.name
      );

      // Right leg cube
      builder.addCube(
        {
          name: 'right_leg_cube',
          from: [-3.9, 0, -2],
          to: [0.1, 12, 2],
          origin: [-1.9, 12, 0],
          uvOffset: [0, 16],
        },
        rightLeg.name
      );

      // Left leg cube
      builder.addCube(
        {
          name: 'left_leg_cube',
          from: [-0.1, 0, -2],
          to: [3.9, 12, 2],
          origin: [1.9, 12, 0],
          uvOffset: [16, 48],
        },
        leftLeg.name
      );
    }

    return { bones };
  }

  /**
   * Builds a standard Quadruped (Animal / Wolf / Cow / Pig) skeleton rig.
   * Bones: root -> body -> head, leg1 (back right), leg2 (back left), leg3 (front right), leg4 (front left).
   */
  static applyQuadrupedRig(builder: ModelBuilder, options: RigOptions = {}): { bones: Group[] } {
    const bones: Group[] = [];

    const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
    bones.push(root);

    const body = builder.addBone({ name: 'body', origin: [0, 10, 2] }, root.name);
    bones.push(body);

    const head = builder.addBone({ name: 'head', origin: [0, 12, -6] }, root.name);
    bones.push(head);

    // 4 legs with pivots at hip joints
    const leg1 = builder.addBone({ name: 'leg1', origin: [-3, 10, 6] }, root.name); // Back Right
    const leg2 = builder.addBone({ name: 'leg2', origin: [3, 10, 6] }, root.name);  // Back Left
    const leg3 = builder.addBone({ name: 'leg3', origin: [-3, 10, -4] }, root.name); // Front Right
    const leg4 = builder.addBone({ name: 'leg4', origin: [3, 10, -4] }, root.name);  // Front Left
    bones.push(leg1, leg2, leg3, leg4);

    if (options.includeSampleCubes) {
      // Body horizontal box
      builder.addCube(
        {
          name: 'body_cube',
          from: [-4, 6, -6],
          to: [4, 14, 8],
          origin: [0, 10, 2],
        },
        body.name
      );

      // Head
      builder.addCube(
        {
          name: 'head_cube',
          from: [-3, 8, -12],
          to: [3, 16, -6],
          origin: [0, 12, -6],
        },
        head.name
      );

      // 4 Leg cubes
      const addLegCube = (bone: Group, fromX: number, toX: number, fromZ: number, toZ: number) => {
        builder.addCube(
          {
            name: `${bone.name}_cube`,
            from: [fromX, 0, fromZ],
            to: [toX, 10, toZ],
            origin: bone.origin,
          },
          bone.name
        );
      };

      addLegCube(leg1, -5, -1, 4, 8);
      addLegCube(leg2, 1, 5, 4, 8);
      addLegCube(leg3, -5, -1, -6, -2);
      addLegCube(leg4, 1, 5, -6, -2);
    }

    return { bones };
  }

  /**
   * Builds an Animated Player Armor Set rig compliant with GeckoLib & Minecraft specifications.
   * Standard bones: armorHead, armorBody, armorRightArm, armorLeftArm,
   * armorRightLeg, armorLeftLeg, armorRightBoot, armorLeftBoot.
   */
  static applyArmorRig(
    builder: ModelBuilder,
    options: {
      armorParts?: Array<'helmet' | 'chestplate' | 'leggings' | 'boots'>;
      inflate?: number;
    } = {}
  ): { bones: Group[] } {
    const parts = options.armorParts ?? ['helmet', 'chestplate', 'leggings', 'boots'];
    const inflate = options.inflate ?? 0.5;
    const bones: Group[] = [];

    const root = builder.addBone({ name: 'root', origin: [0, 0, 0] });
    bones.push(root);

    // Helmet
    if (parts.includes('helmet')) {
      const armorHead = builder.addBone({ name: 'armorHead', origin: [0, 24, 0] }, root.name);
      bones.push(armorHead);

      builder.addCube(
        {
          name: 'helmet_cube',
          from: [-4, 24, -4],
          to: [4, 32, 4],
          origin: [0, 24, 0],
          inflate: inflate + 0.5,
          uvOffset: [0, 0],
        },
        armorHead.name
      );
    }

    // Chestplate
    if (parts.includes('chestplate')) {
      const armorBody = builder.addBone({ name: 'armorBody', origin: [0, 12, 0] }, root.name);
      const armorRightArm = builder.addBone({ name: 'armorRightArm', origin: [-5, 22, 0] }, root.name);
      const armorLeftArm = builder.addBone({ name: 'armorLeftArm', origin: [5, 22, 0] }, root.name);
      bones.push(armorBody, armorRightArm, armorLeftArm);

      // Body armor
      builder.addCube(
        {
          name: 'chestplate_body_cube',
          from: [-4, 12, -2],
          to: [4, 24, 2],
          origin: [0, 12, 0],
          inflate: inflate + 0.3,
          uvOffset: [16, 16],
        },
        armorBody.name
      );

      // Right arm pauldron
      builder.addCube(
        {
          name: 'chestplate_right_arm_cube',
          from: [-7, 12, -2],
          to: [-3, 24, 2],
          origin: [-5, 22, 0],
          inflate: inflate + 0.3,
          uvOffset: [40, 16],
        },
        armorRightArm.name
      );

      // Left arm pauldron
      builder.addCube(
        {
          name: 'chestplate_left_arm_cube',
          from: [3, 12, -2],
          to: [7, 24, 2],
          origin: [5, 22, 0],
          inflate: inflate + 0.3,
          uvOffset: [40, 16],
        },
        armorLeftArm.name
      );
    }

    // Leggings
    if (parts.includes('leggings')) {
      const armorRightLeg = builder.addBone({ name: 'armorRightLeg', origin: [-1.9, 12, 0] }, root.name);
      const armorLeftLeg = builder.addBone({ name: 'armorLeftLeg', origin: [1.9, 12, 0] }, root.name);
      bones.push(armorRightLeg, armorLeftLeg);

      builder.addCube(
        {
          name: 'leggings_right_leg_cube',
          from: [-3.9, 0, -2],
          to: [0.1, 12, 2],
          origin: [-1.9, 12, 0],
          inflate: inflate,
          uvOffset: [0, 16],
        },
        armorRightLeg.name
      );

      builder.addCube(
        {
          name: 'leggings_left_leg_cube',
          from: [-0.1, 0, -2],
          to: [3.9, 12, 2],
          origin: [1.9, 12, 0],
          inflate: inflate,
          uvOffset: [0, 16],
        },
        armorLeftLeg.name
      );
    }

    // Boots
    if (parts.includes('boots')) {
      const armorRightBoot = builder.addBone({ name: 'armorRightBoot', origin: [-1.9, 12, 0] }, root.name);
      const armorLeftBoot = builder.addBone({ name: 'armorLeftBoot', origin: [1.9, 12, 0] }, root.name);
      bones.push(armorRightBoot, armorLeftBoot);

      builder.addCube(
        {
          name: 'boots_right_cube',
          from: [-3.9, 0, -2],
          to: [0.1, 5, 2],
          origin: [-1.9, 12, 0],
          inflate: inflate + 0.2,
          uvOffset: [0, 16],
        },
        armorRightBoot.name
      );

      builder.addCube(
        {
          name: 'boots_left_cube',
          from: [-0.1, 0, -2],
          to: [3.9, 5, 2],
          origin: [1.9, 12, 0],
          inflate: inflate + 0.2,
          uvOffset: [0, 16],
        },
        armorLeftBoot.name
      );
    }

    return { bones };
  }
}
