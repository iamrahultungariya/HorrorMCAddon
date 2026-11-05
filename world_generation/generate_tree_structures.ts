/**
 * Procedural Tree & Structure Placement Script for The Forgotten Woods
 * Generates MCSTRUCTURE-compatible structure definitions and structure loads.
 */

import * as fs from 'fs';
import * as path from 'path';

const STRUCTURES_DIR = 'D:\\do note delete\\Desktop\\MC horror mod\\world_generation\\structures';

export interface StructureBlock {
  pos: [number, number, number];
  name: string;
  states?: Record<string, any>;
}

export function generateCustomDeadTree(height: number = 32): StructureBlock[] {
  const blocks: StructureBlock[] = [];

  // Trunk (Dark Oak Log)
  for (let y = 0; y < height; y++) {
    blocks.push({
      pos: [0, y, 0],
      name: 'minecraft:dark_oak_log',
    });

    // Thicker roots near base
    if (y < 4) {
      blocks.push({ pos: [1, y, 0], name: 'minecraft:dark_oak_log' });
      blocks.push({ pos: [-1, y, 0], name: 'minecraft:dark_oak_log' });
      blocks.push({ pos: [0, y, 1], name: 'minecraft:dark_oak_log' });
      blocks.push({ pos: [0, y, -1], name: 'minecraft:dark_oak_log' });
    }
  }

  // Gnarled Dead Branches (Horizontal reach)
  const branches = [
    { startY: height - 12, dir: [1, 0] },
    { startY: height - 9, dir: [-1, 0] },
    { startY: height - 6, dir: [0, 1] },
    { startY: height - 4, dir: [0, -1] },
    { startY: height - 2, dir: [1, 1] },
  ];

  branches.forEach(b => {
    for (let d = 1; d <= 5; d++) {
      blocks.push({
        pos: [b.dir[0] * d, b.startY + Math.floor(d * 0.4), b.dir[1] * d],
        name: 'minecraft:dark_oak_wood',
      });
      // Sparse decaying leaves/vines
      if (d >= 3) {
        blocks.push({
          pos: [b.dir[0] * d, b.startY + Math.floor(d * 0.4) - 1, b.dir[1] * d],
          name: 'minecraft:weeping_vines',
        });
      }
    }
  });

  return blocks;
}

export function generateStructures() {
  fs.mkdirSync(STRUCTURES_DIR, { recursive: true });

  // 1. Dead Canopy Pine (35 Blocks High)
  const tallDeadPine = generateCustomDeadTree(35);
  fs.writeFileSync(
    path.join(STRUCTURES_DIR, 'tall_dead_pine_35m.json'),
    JSON.stringify({ name: 'tall_dead_pine_35m', blocks: tallDeadPine }, null, 2)
  );

  // 2. Colossal Dead Redwood (42 Blocks High)
  const colossalPine = generateCustomDeadTree(42);
  fs.writeFileSync(
    path.join(STRUCTURES_DIR, 'colossal_dead_redwood_42m.json'),
    JSON.stringify({ name: 'colossal_dead_redwood_42m', blocks: colossalPine }, null, 2)
  );

  console.log('Custom Tree & Structure definitions generated in:', STRUCTURES_DIR);
}

generateStructures();
