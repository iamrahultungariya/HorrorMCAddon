import { describe, it, expect, beforeEach } from 'vitest';
import { ModelBuilder } from '../../src/core/ast/model-builder.js';
import * as fs from 'fs';
import * as path from 'path';

describe('MCP Server End-to-End Workflow', () => {
  const testDir = path.resolve('./tests/temp');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  it('builds a full Minecraft mob (custom golem) with bones, mirrored limbs, face culling, and saves to .bbmodel', () => {
    // 1. Initialize model
    const builder = ModelBuilder.create({
      name: 'crystal_golem',
      format: 'bedrock',
      resolution: { width: 64, height: 64 },
    });

    // 2. Add skeleton hierarchy (Root -> Torso -> Head / Arms / Legs)
    const torsoBone = builder.addBone({ name: 'torso', origin: [0, 12, 0] });
    const headBone = builder.addBone({ name: 'head', origin: [0, 24, 0] }, 'torso');
    const leftArmBone = builder.addBone({ name: 'left_arm', origin: [5, 22, 0] }, 'torso');
    const leftLegBone = builder.addBone({ name: 'left_leg', origin: [2, 12, 0] });

    // 3. Add geometry cubes
    // Torso: [-4, 12, -3] to [4, 24, 3]
    builder.addCube(
      {
        name: 'torso_cube',
        from: [-4, 12, -3],
        to: [4, 24, 3],
        origin: [0, 12, 0],
      },
      'torso'
    );

    // Head: [-3, 24, -3] to [3, 30, 3] (Touches top of torso)
    builder.addCube(
      {
        name: 'head_cube',
        from: [-3, 24, -3],
        to: [3, 30, 3],
        origin: [0, 24, 0],
      },
      'head'
    );

    // Left Arm: [4, 10, -2] to [8, 22, 2]
    const leftArmCube = builder.addCube(
      {
        name: 'left_arm_cube',
        from: [4, 10, -2],
        to: [8, 22, 2],
        origin: [5, 22, 0],
      },
      'left_arm'
    );

    // Mirror to right arm across X=0
    const rightArmCube = builder.mirrorCube(leftArmCube.uuid, 'x', [0, 0, 0], 'right_arm_cube');
    const rightArmBone = builder.addBone({ name: 'right_arm', origin: [-5, 22, 0] }, 'torso');
    builder.reparent(rightArmCube.uuid, rightArmBone.uuid);

    // 4. Verify Culling on touching head and torso
    const cullingResult = builder.cullHiddenFaces();
    expect(cullingResult.totalFacesChecked).toBeGreaterThan(0);
    expect(cullingResult.elementsModified).toBeGreaterThan(0);

    // 5. Validate Bedrock Compliance
    const validation = builder.validate();
    expect(validation.isValid).toBe(true);
    expect(validation.errorsCount).toBe(0);

    // 6. Save to disk and re-read
    const filePath = path.join(testDir, 'crystal_golem.bbmodel');
    fs.writeFileSync(filePath, builder.toJSON(true), 'utf-8');

    expect(fs.existsSync(filePath)).toBe(true);

    const reloaded = ModelBuilder.fromJSON(fs.readFileSync(filePath, 'utf-8'));
    expect(reloaded.getModel().name).toBe('crystal_golem');
    expect(reloaded.getModel().elements.length).toBe(4); // Torso, Head, Left Arm, Right Arm
    expect(reloaded.getModel().elements.find((e) => e.name === 'right_arm_cube')).toBeDefined();
  });
});
