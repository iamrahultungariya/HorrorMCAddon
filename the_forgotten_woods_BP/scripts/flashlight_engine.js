/**
 * The Forgotten Woods — Flashlight & Battery Engine
 * 
 * Mechanics:
 * 1. Flashlight On/Off Toggle on right-click / item use.
 * 2. Real-time battery drain (100% to 0%).
 * 3. Dynamic illumination while held & active (using night_vision or sight illumination).
 * 4. High-Beam Stun (Sneak + Use):
 *    - Consumes 20% battery.
 *    - Blinds and immobilizes monsters for 3.0 seconds!
 * 5. Battery Reload:
 *    - Holding AA Battery and using Flashlight recharges +50% battery.
 */

import { world, system } from '@minecraft/server';

const batteryState = new Map();
const flashlightActive = new Map();

export function initializeFlashlightEngine() {
  world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (!player || !item) return;

    if (item.typeId === 'forgotten_woods:flashlight' || item.typeId === 'horror:flashlight') {
      const pId = player.id;
      let charge = batteryState.get(pId) ?? 100;
      const isSneaking = player.isSneaking;

      // Check offhand for AA battery to reload
      const equippable = player.getComponent('minecraft:equippable');
      const offhandItem = equippable?.getEquipment('Offhand');

      if (
        offhandItem &&
        (offhandItem.typeId === 'forgotten_woods:aa_battery' || offhandItem.typeId === 'horror:aa_battery')
      ) {
        if (charge >= 100) {
          player.sendMessage('§e[FLASHLIGHT] Battery is already full! (100%)');
          return;
        }
        charge = Math.min(100, charge + 50);
        batteryState.set(pId, charge);

        if (offhandItem.amount > 1) {
          offhandItem.amount -= 1;
          equippable.setEquipment('Offhand', offhandItem);
        } else {
          equippable.setEquipment('Offhand', undefined);
        }

        player.dimension.runCommand(`playsound random.anvil_land @s ~ ~ ~ 0.8 1.8`);
        player.sendMessage(`§a[FLASHLIGHT RELOADED] §7Battery at §e${Math.round(charge)}%§7.`);
        return;
      }

      if (isSneaking) {
        // High-Beam Stun Flash
        if (charge < 20) {
          player.sendMessage('§c[FLASHLIGHT] Insufficient battery for High-Beam! (Needs 20%)');
          player.dimension.runCommand(`playsound random.click @s ~ ~ ~ 0.8 0.6`);
          return;
        }

        charge -= 20;
        batteryState.set(pId, charge);

        player.dimension.runCommand(`playsound random.explode @s ~ ~ ~ 0.5 2.0`);
        player.dimension.runCommand(`playsound beacon.activate @s ~ ~ ~ 1.0 1.5`);

        // Stun raycast: 16 blocks ahead
        const viewDir = player.getViewDirection();
        const headLoc = player.getHeadLocation();

        try {
          const hit = player.dimension.getEntitiesFromRay(headLoc, viewDir, {
            maxDistance: 16,
            excludeTypes: ['minecraft:player'],
          });

          let stunnedCount = 0;
          for (const rayHit of hit) {
            const entity = rayHit.entity;
            if (
              entity.typeId.includes('stalker') ||
              entity.typeId.includes('crawler') ||
              entity.typeId.includes('ancient') ||
              entity.typeId.includes('wraith') ||
              entity.typeId.includes('horror')
            ) {
              entity.addEffect('slowness', 60, { amplifier: 255, showParticles: true });
              entity.addEffect('weakness', 60, { amplifier: 10, showParticles: false });
              entity.dimension.spawnParticle('minecraft:critical_hit_emitter', entity.location);
              stunnedCount++;
            }
          }

          if (stunnedCount > 0) {
            player.sendMessage(`§e[HIGH-BEAM STUN] §fStunned ${stunnedCount} monster(s) in your beam!`);
          }
        } catch (e) {}

        return;
      }

      // Normal Click: Toggle Flashlight ON / OFF
      const isActive = flashlightActive.get(pId) ?? false;
      const newState = !isActive;

      if (newState && charge <= 0) {
        player.sendMessage('§c[FLASHLIGHT] Battery dead! Hold an AA Battery in your off-hand to reload.');
        player.dimension.runCommand(`playsound random.click @s ~ ~ ~ 0.8 0.5`);
        return;
      }

      flashlightActive.set(pId, newState);
      player.dimension.runCommand(`playsound forgotten_woods.flashlight_click @s ~ ~ ~ 0.9 1.0`);

      if (newState) {
        player.onScreenDisplay.setActionBar(`§e💡 Flashlight ON [Battery: ${Math.round(charge)}%]`);
      } else {
        player.onScreenDisplay.setActionBar('§7💡 Flashlight OFF');
        player.removeEffect('night_vision');
      }
    }
  });

  // Passive Ticking Flashlight Loop (Runs every 10 ticks = 0.5s)
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const pId = player.id;
      const isActive = flashlightActive.get(pId) ?? false;

      if (!isActive) continue;

      let charge = batteryState.get(pId) ?? 100;

      // Check if player still holding flashlight
      const equippable = player.getComponent('minecraft:equippable');
      const mainhand = equippable?.getEquipment('Mainhand');
      const isHoldingFlashlight =
        mainhand &&
        (mainhand.typeId === 'forgotten_woods:flashlight' || mainhand.typeId === 'horror:flashlight');

      if (!isHoldingFlashlight) {
        flashlightActive.set(pId, false);
        player.removeEffect('night_vision');
        continue;
      }

      // Drain 0.25% battery every 0.5s (~200 seconds total battery life)
      charge = Math.max(0, charge - 0.25);
      batteryState.set(pId, charge);

      if (charge <= 0) {
        flashlightActive.set(pId, false);
        player.removeEffect('night_vision');
        player.dimension.runCommand(`playsound random.click @s ~ ~ ~ 0.8 0.5`);
        player.onScreenDisplay.setActionBar('§c⚠️ FLASHLIGHT DIED! Battery Depleted.');
        continue;
      }

      // Apply clear night illumination while active
      player.addEffect('night_vision', 30, { amplifier: 0, showParticles: false });

      if (Math.round(charge) % 10 === 0) {
        player.onScreenDisplay.setActionBar(`§e💡 Flashlight ON [Battery: ${Math.round(charge)}%]`);
      }
    }
  }, 10);
}
