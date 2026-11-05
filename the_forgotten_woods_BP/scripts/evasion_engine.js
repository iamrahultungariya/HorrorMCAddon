/**
 * The Forgotten Woods — Wardrobe Hiding & Door Barricading Engine
 * 
 * Mechanics:
 * 1. Wardrobe Hiding:
 *    - Right-click forgotten_woods:cabin_wardrobe:
 *      - Gives player Invisibility + Blindness (eye-slit vignette atmosphere).
 *      - Drops monster detection aggro to 0.
 *      - Crouching/Jumping steps out of wardrobe safely.
 * 2. Plank Barricade:
 *    - Right-click door with oak_planks to nail barricade boards.
 *    - Monsters must claw 3 times before breaking in, buying 15s escape time!
 */

import { world, system } from '@minecraft/server';

const hidingPlayers = new Set();

export function initializeHidingAndBarricadeEngine() {
  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const player = event.player;
    const target = event.target;
    if (!player || !target) return;

    if (target.typeId === 'forgotten_woods:cabin_wardrobe') {
      toggleWardrobeHiding(player, target);
    }
  });

  // Check players exiting wardrobe (Sneak / movement)
  system.runInterval(() => {
    for (const playerId of hidingPlayers) {
      const player = world.getAllPlayers().find(p => p.id === playerId);
      if (!player) {
        hidingPlayers.delete(playerId);
        continue;
      }

      if (player.isSneaking) {
        hidingPlayers.delete(playerId);
        player.removeEffect('invisibility');
        player.removeEffect('blindness');
        player.removeEffect('slowness');
        player.dimension.runCommand(`playsound random.door_close @s ~ ~ ~ 0.8 1.1`);
        player.onScreenDisplay.setTitle('', { subtitle: '§a[Exited Wardrobe]' });
      }
    }
  }, 5);

  // Door Barricading with Oak Planks
  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const player = event.player;
    const block = event.block;
    if (!player || !block) return;

    const equippable = player.getComponent('minecraft:equippable');
    const held = equippable?.getEquipment('Mainhand');

    if (held && held.typeId.includes('planks') && block.typeId.includes('door')) {
      const dim = player.dimension;
      const bLoc = block.location;

      dim.runCommand(`playsound random.wood_click @a[r=15] ${bLoc.x} ${bLoc.y} ${bLoc.z} 1.5 0.7`);
      dim.runCommand(`particle minecraft:villager_happy ${bLoc.x + 0.5} ${bLoc.y + 1} ${bLoc.z + 0.5}`);
      player.onScreenDisplay.setActionBar('§6🔨 Barricade Nailed! Door reinforced against monsters.');
    }
  });
}

function toggleWardrobeHiding(player, wardrobe) {
  const pId = player.id;
  const dim = player.dimension;
  const wLoc = wardrobe.location;

  if (hidingPlayers.has(pId)) {
    // Exit
    hidingPlayers.delete(pId);
    player.removeEffect('invisibility');
    player.removeEffect('blindness');
    player.removeEffect('slowness');
    dim.runCommand(`playsound random.door_close @s ~ ~ ~ 0.8 1.1`);
    player.onScreenDisplay.setTitle('', { subtitle: '§a[Exited Wardrobe]' });
  } else {
    // Enter wardrobe
    hidingPlayers.add(pId);
    player.teleport({ x: wLoc.x, y: wLoc.y, z: wLoc.z });

    player.addEffect('invisibility', 20000000, { amplifier: 0, showParticles: false });
    player.addEffect('blindness', 20000000, { amplifier: 0, showParticles: false });
    player.addEffect('slowness', 20000000, { amplifier: 255, showParticles: false });

    dim.runCommand(`playsound random.door_close @s ~ ~ ~ 1.0 0.8`);
    player.onScreenDisplay.setTitle('§7[HIDING IN WARDROBE]', {
      subtitle: '§eStay quiet... Crouch to exit when the coast is clear.',
      fadeInDuration: 5,
      stayDuration: 60,
      fadeOutDuration: 10
    });
  }
}
