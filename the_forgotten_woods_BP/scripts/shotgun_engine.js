/**
 * The Forgotten Woods — Break-Action Double-Barrel Shotgun & Ammo Engine
 * 
 * Mechanics:
 * - 2-Shot burst capacity before reload
 * - High damage (25 HP) + heavy impulse knockback on close targets
 * - Deafening Muzzle Blast: 60-block sonic alert radius that wakes the entire forest!
 */

import { world, system, EntityDamageCause } from '@minecraft/server';
import { alertMonstersToLocation } from './noise_engine.js';

// Track shotgun ammo in chambers per player
const playerAmmoMap = new Map();

export function initializeShotgunEngine() {
  world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const itemStack = event.itemStack;
    if (!player || !itemStack || itemStack.typeId !== 'forgotten_woods:double_barrel_shotgun') return;

    const playerId = player.id;
    const currentAmmo = playerAmmoMap.get(playerId) ?? 2;

    if (currentAmmo <= 0) {
      attemptReload(player);
      return;
    }

    fireShotgun(player, currentAmmo - 1);
  });
}

function fireShotgun(player, remainingAmmo) {
  const dim = player.dimension;
  const loc = player.location;
  const viewDir = player.getViewDirection();
  const playerId = player.id;

  playerAmmoMap.set(playerId, remainingAmmo);

  // 1. Deafening blast audio & particle effects
  dim.runCommand(`playsound forgotten_woods.shotgun_blast @a[x=${loc.x},y=${loc.y},z=${loc.z},r=60] ${loc.x} ${loc.y} ${loc.z} 2.0 0.95`);
  dim.runCommand(`particle minecraft:huge_explosion_emitter ${loc.x + viewDir.x * 1.5} ${loc.y + 1.2 + viewDir.y * 1.5} ${loc.z + viewDir.z * 1.5}`);
  dim.runCommand(`particle minecraft:smoke_particle ${loc.x + viewDir.x * 1.2} ${loc.y + 1.2 + viewDir.y * 1.2} ${loc.z + viewDir.z * 1.2}`);

  // 2. Heavy Recoil Camera Kickback
  try {
    player.applyKnockback(-viewDir.x, -viewDir.z, 0.4, 0.1);
  } catch (e) {}

  // 3. Raycast Pellet Spread Damage (16 block effective range)
  try {
    const raycastEntities = dim.getEntitiesFromRay(
      { x: loc.x, y: loc.y + 1.4, z: loc.z },
      viewDir,
      { maxDistance: 16 }
    );

    for (const hit of raycastEntities) {
      const entity = hit.entity;
      if (entity.id === player.id) continue;

      try {
        entity.applyDamage(25, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
        entity.applyKnockback(viewDir.x, viewDir.z, 1.8, 0.4);
      } catch (err) {}
    }
  } catch (rayErr) {}

  // 4. Action bar display
  if (remainingAmmo === 1) {
    player.onScreenDisplay.setActionBar('§e💥 BLAM! [Shells: 1/2]');
  } else {
    player.onScreenDisplay.setActionBar('§c💥 BLAM! [EMPTY - Click again with shells to Reload!]');
  }

  // 5. Ultrasonic Forest Alert (60 block radius)
  alertMonstersToLocation(dim, loc, 60);
  dim.runCommand(`tellraw @a[r=60] {"rawtext":[{"text":"§4[!] The deafening blast reverberated across the island... Monsters are incoming!"}]}`);
}

function attemptReload(player) {
  const container = player.getComponent('minecraft:inventory')?.container;
  if (!container) return;

  let foundShell = false;
  let shellSlot = -1;

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId === 'forgotten_woods:shotgun_shell') {
      foundShell = true;
      shellSlot = i;
      break;
    }
  }

  if (!foundShell) {
    player.onScreenDisplay.setActionBar('§c*CLICK* Empty! You need 12-Gauge Shotgun Shells to reload.');
    player.dimension.runCommand(`playsound random.click @s ~ ~ ~ 0.8 1.5`);
    return;
  }

  // Reload: Consume 1 or 2 shells depending on inventory
  const shellItem = container.getItem(shellSlot);
  if (shellItem.amount > 2) {
    shellItem.amount -= 2;
    container.setItem(shellSlot, shellItem);
    playerAmmoMap.set(player.id, 2);
  } else if (shellItem.amount === 2) {
    container.setItem(shellSlot, undefined);
    playerAmmoMap.set(player.id, 2);
  } else {
    // Only 1 shell available
    container.setItem(shellSlot, undefined);
    playerAmmoMap.set(player.id, 1);
  }

  player.dimension.runCommand(`playsound forgotten_woods.shotgun_reload @s ~ ~ ~ 1.2 1.0`);
  player.onScreenDisplay.setActionBar(`§a🔄 Clack-Clack! Reloaded [Shells: ${playerAmmoMap.get(player.id)}/2]`);
}
