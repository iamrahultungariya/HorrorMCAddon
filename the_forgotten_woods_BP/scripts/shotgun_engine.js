/**
 * The Forgotten Woods — Break-Action Double-Barrel Shotgun & Ammo Engine
 * 
 * Mechanics:
 * - 2-Shot burst capacity before reload
 * - High damage (25 HP) + heavy impulse knockback on close targets
 * - Deafening Muzzle Blast: 60-block sonic alert radius that wakes the entire forest!
 */

import { world, system, Player, Vector3, Dimension, EntityDamageCause } from '@minecraft/server';
import { alertMonstersToLocation } from './noise_engine.js';

// Track shotgun ammo in chambers per player
const playerAmmoMap = new Map<string, number>();

export function initializeShotgunEngine() {
  world.afterEvents.itemUse.subscribe((event) => {
    const { source: player, itemStack } = event;
    if (!player || itemStack.typeId !== 'forgotten_woods:double_barrel_shotgun') return;

    const playerId = player.id;
    const currentAmmo = playerAmmoMap.get(playerId) ?? 2;

    if (currentAmmo <= 0) {
      // Out of chambered shells -> Attempt reload from inventory
      attemptReload(player);
      return;
    }

    // Fire Shotgun!
    fireShotgun(player, currentAmmo - 1);
  });
}

function fireShotgun(player: Player, remainingAmmo: number) {
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
  player.applyKnockback(-viewDir.x, -viewDir.z, 0.4, 0.1);

  // 3. Raycast Pellet Spread Damage (15 block effective range)
  const raycastEntities = dim.getEntitiesFromRay(
    { x: loc.x, y: loc.y + 1.4, z: loc.z },
    viewDir,
    { maxDistance: 16 }
  );

  let hitTarget = false;
  for (const hit of raycastEntities) {
    const entity = hit.entity;
    if (entity.id === player.id) continue;

    // Deal 25 devastating close-range buckshot damage + pushback
    try {
      entity.applyDamage(25, { cause: EntityDamageCause.entityAttack, damagingEntity: player });
      entity.applyKnockback(viewDir.x, viewDir.z, 1.8, 0.4);
      hitTarget = true;
    } catch (e) {}
  }

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

function attemptReload(player: Player) {
  const container = (player as any).getComponent('minecraft:inventory')?.container;
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
    player.dimension.runCommand(`playsound random.click @s ~ ~ ~ 0.8 1.4`);
    return;
  }

  // Consume 1 shell and load 2 chambers
  const item = container.getItem(shellSlot);
  if (item) {
    if (item.amount > 1) {
      item.amount -= 1;
      container.setItem(shellSlot, item);
    } else {
      container.setItem(shellSlot, undefined);
    }
  }

  playerAmmoMap.set(player.id, 2);
  player.dimension.runCommand(`playsound random.door_close @s ~ ~ ~ 1.0 1.6`);
  player.onScreenDisplay.setActionBar('§a🔄 Reloaded: 2 Shells chambered.');
}
