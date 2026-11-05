/**
 * The Forgotten Woods — Throwable Distraction & Vibration System
 * 
 * Mechanics:
 * - Players throw Glass Bottles or Stone Pebbles to lure monsters away.
 * - On block impact:
 *   - Glass Bottle: Plays loud shattering sound (glass_break.ogg), attracts mobs in 35 blocks.
 *   - Stone Pebble: Plays subtle clatter (pebble_clatter.ogg), attracts mobs in 18 blocks.
 * - Essential survival evasion tool when sneaking past Wendigo stalkers!
 */

import { world, system } from '@minecraft/server';
import { alertMonstersToLocation } from './noise_engine.js';

export function initializeThrowableDistractionEngine() {
  world.afterEvents.projectileHitBlock.subscribe((event) => {
    const projectile = event.projectile;
    const blockHit = event.blockHit;
    if (!projectile || !blockHit) return;

    const projType = projectile.typeId;
    const blockLoc = blockHit.block.location;
    const dim = projectile.dimension;

    if (projType === 'forgotten_woods:glass_bottle_projectile' || projType.includes('glass_bottle')) {
      dim.runCommand(`playsound forgotten_woods.glass_break @a[x=${blockLoc.x},y=${blockLoc.y},z=${blockLoc.z},r=35] ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} 1.4 1.0`);
      dim.runCommand(`particle minecraft:crit_particle ${blockLoc.x + 0.5} ${blockLoc.y + 1} ${blockLoc.z + 0.5}`);
      alertMonstersToLocation(dim, blockLoc, 35);
    } else if (projType === 'forgotten_woods:stone_pebble_projectile' || projType.includes('stone_pebble')) {
      dim.runCommand(`playsound forgotten_woods.pebble_clatter @a[x=${blockLoc.x},y=${blockLoc.y},z=${blockLoc.z},r=18] ${blockLoc.x} ${blockLoc.y} ${blockLoc.z} 0.9 1.1`);
      alertMonstersToLocation(dim, blockLoc, 18);
    }
  });

  world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const itemStack = event.itemStack;
    if (!player || !itemStack) return;

    const id = itemStack.typeId;
    if (id !== 'forgotten_woods:glass_bottle' && id !== 'forgotten_woods:stone_pebble') return;

    const dim = player.dimension;
    const loc = player.location;
    const view = player.getViewDirection();

    const spawnLoc = {
      x: loc.x + view.x * 0.8,
      y: loc.y + 1.4 + view.y * 0.8,
      z: loc.z + view.z * 0.8,
    };

    try {
      const projId = id === 'forgotten_woods:glass_bottle'
        ? 'forgotten_woods:glass_bottle_projectile'
        : 'forgotten_woods:stone_pebble_projectile';

      const proj = dim.spawnEntity(projId, spawnLoc);
      const projectileComp = proj.getComponent('minecraft:projectile');
      if (projectileComp) {
        projectileComp.shoot({
          x: view.x * 1.5,
          y: view.y * 1.5 + 0.1,
          z: view.z * 1.5,
        });
      }

      player.dimension.runCommand(`playsound random.bow @s ~ ~ ~ 0.5 1.2`);
    } catch (e) {}
  });
}
