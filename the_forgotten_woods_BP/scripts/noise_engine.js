/**
 * The Forgotten Woods — Deterministic Noise & Sound Propagation Engine
 * 
 * Features:
 * - Un-sneaked door, chest, trapdoor opening triggers door_creak sound (25 block radius)
 * - Alerts all nearby predators (The Woods Stalker, Crypt Crawler) to investigate player position
 * - Crouching (Sneaking) allows 100% silent interaction!
 */

import { world, system } from '@minecraft/server';

const NOISY_BLOCKS = [
  'door',
  'chest',
  'trapdoor',
  'barrel',
  'gate'
];

export function initializeNoiseEngine() {
  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    if (!player || !block) return;

    const blockType = block.typeId.toLowerCase();
    const isNoisy = NOISY_BLOCKS.some((n) => blockType.includes(n));

    if (!isNoisy) return;

    // Silent crouching check
    if (player.isSneaking) {
      player.onScreenDisplay.setActionBar('§7[Silent Action]');
      return;
    }

    // Loud noise triggered!
    const dim = player.dimension;
    const loc = player.location;

    // Play creaking audio at block location
    if (blockType.includes('chest') || blockType.includes('barrel')) {
      dim.runCommand(`playsound forgotten_woods.chest_creak @a[x=${loc.x},y=${loc.y},z=${loc.z},r=25] ${loc.x} ${loc.y} ${loc.z} 1.0 0.9`);
      player.onScreenDisplay.setActionBar('§c⚠️ CREAK! The rusted hinges echoed through the trees...');
    } else {
      dim.runCommand(`playsound forgotten_woods.door_creak @a[x=${loc.x},y=${loc.y},z=${loc.z},r=25] ${loc.x} ${loc.y} ${loc.z} 1.0 0.85`);
      player.onScreenDisplay.setActionBar('§c⚠️ CREAK! You opened it too fast! Something heard that...');
    }

    // Alert nearby monsters within 25 blocks to investigate noise source
    alertMonstersToLocation(dim, loc, 25);
  });
}

/**
 * Alerts forest predators to sprint toward the sound epicenter
 */
export function alertMonstersToLocation(dim, loc, radius) {
  try {
    const entities = dim.getEntities({
      location: loc,
      maxDistance: radius,
      families: ['horror', 'monster'],
    });

    for (const mob of entities) {
      dim.runCommand(`damage @e[type=forgotten_woods:the_woods_stalker,c=1,r=${radius}] 0 entity_attack entity @p`);
      dim.runCommand(`execute as @e[family=horror,r=${radius}] at @s run playsound forgotten_woods.monster_alert @a[r=20] ~ ~ ~ 1.2 0.7`);
    }
  } catch (e) {
    // Fail-safe graceful pass
  }
}
