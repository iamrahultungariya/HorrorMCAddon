/**
 * The Forgotten Woods — Throwable Distraction & Vibration System
 * 
 * Mechanics:
 * - Players throw Glass Bottles or Stone Pebbles to lure monsters away.
 * - On block impact:
 *   - Glass Bottle: Plays loud shattering sound (`glass_break.ogg`), attracts mobs in 35 blocks.
 *   - Stone Pebble: Plays subtle clatter (`pebble_clatter.ogg`), attracts mobs in 18 blocks.
 * - Essential survival evasion tool when sneaking past Wendigo stalkers!
 */

import { world, system, Vector3, Dimension } from '@minecraft/server';
import { alertMonstersToLocation } from './noise_engine.js';

export function initializeThrowableDistractionEngine() {
  // Listen for throwable projectile impacts
  world.afterEvents.projectileHitBlock.subscribe((event) => {
    const { projectile, blockHit } = event;
    if (!projectile || !blockHit) return;

    const projType = projectile.typeId;
    const blockLoc = blockHit.block.location;
    const dim: Dimension = projectile.dimension;

    if (projType === 'forgotten_woods:glass_bottle_projectile' || projType.includes('glass_bottle')) {
      // 1. Glass Shatter Impact
      dim.runCommand(`playsound forgotten_woods.glass_break @a[x=${blockLoc.x},y=${blockLoc.y},z=${blockLoc.z},r=35] ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} 1.4 1.0`);
      dim.runCommand(`particle minecraft:crit_particle ${blockLoc.x + 0.5} ${blockLoc.y + 1} ${blockLoc.z + 0.5}`);

      // Lure all monsters within 35 blocks toward impact point!
      alertMonstersToLocation(dim, blockLoc, 35);
    } else if (projType === 'forgotten_woods:stone_pebble_projectile' || projType.includes('stone_pebble')) {
      // 2. Pebble Clatter Impact
      dim.runCommand(`playsound forgotten_woods.pebble_clatter @a[x=${blockLoc.x},y=${blockLoc.y},z=${blockLoc.z},r=18] ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} 0.9 1.1`);
      
      // Lure monsters within 18 blocks
      alertMonstersToLocation(dim, blockLoc, 18);
    }
  });

  // Throw trigger from item use
  world.afterEvents.itemUse.subscribe((event) => {
    const { source: player, itemStack } = event;
    if (!player) return;

    const id = itemStack.typeId;
    if (id !== 'forgotten_woods:glass_bottle' && id !== 'forgotten_woods:stone_pebble') return;

    const dim = player.dimension;
    const loc = player.location;
    const viewDir = player.getViewDirection();

    // Spawn projectile moving in view direction
    const projId = id === 'forgotten_woods:glass_bottle' 
      ? 'forgotten_woods:glass_bottle_projectile' 
      : 'forgotten_woods:stone_pebble_projectile';

    try {
      const spawnPos = {
        x: loc.x + viewDir.x * 0.8,
        y: loc.y + 1.5 + viewDir.y * 0.8,
        z: loc.z + viewDir.z * 0.8
      };
      
      dim.spawnEntity(projId, spawnPos);
      dim.runCommand(`playsound random.bow @s ~ ~ ~ 0.6 1.3`);
      player.onScreenDisplay.setActionBar('§7*Tossed distraction item*');
    } catch (e) {
      // Fallback command
      dim.runCommand(`summon ${projId} ^ ^1.5 ^1`);
    }
  });
}
