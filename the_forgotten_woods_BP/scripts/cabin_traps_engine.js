/**
 * The Forgotten Woods — Abandoned Cabin Jumpscares & Traps Engine
 * 
 * Mechanics:
 * 1. Shifting Mannequin:
 *    - When player enters Cabin bedroom and leaves, the headless mannequin teleports into doorway.
 * 2. Grandfather Clock Chime:
 *    - Walking past clock room plays chilling bell chime and shatters nearby glass.
 * 3. Collapsing Grave (Graveyard):
 *    - Stepping on marked mossy graves breaks ground and plunges player into dark crypt.
 */

import { world, system } from '@minecraft/server';

const triggeredGraves = new Set();
let lastClockChime = 0;

export function initializeCabinAndTrapsEngine() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const dim = player.dimension;
      const loc = player.location;

      // 1. Graveyard Collapsing Grave Trap: Check block beneath player
      const blockBelow = dim.getBlock({
        x: Math.floor(loc.x),
        y: Math.floor(loc.y - 0.2),
        z: Math.floor(loc.z)
      });

      if (blockBelow && (blockBelow.typeId.includes('coarse_dirt') || blockBelow.typeId.includes('podzol') || blockBelow.typeId.includes('mossy'))) {
        // Graveyard zone check (Around X: 250..350, Z: 600..700)
        if (loc.x >= 250 && loc.x <= 350 && loc.z >= 600 && loc.z <= 700) {
          triggerCollapsingGrave(dim, loc, player);
        }
      }

      // 2. Cabin Hallway Grandfather Clock Trigger (Around X: 495..505, Z: 495..505)
      if (loc.x >= 495 && loc.x <= 505 && loc.z >= 495 && loc.z <= 505) {
        triggerCabinClockBeat(dim, loc, player);
      }
    }
  }, 10);
}

function triggerCollapsingGrave(dim, loc, player) {
  const key = `${Math.floor(loc.x)}_${Math.floor(loc.y)}_${Math.floor(loc.z)}`;
  if (triggeredGraves.has(key)) return;
  triggeredGraves.add(key);

  dim.runCommand(`playsound forgotten_woods.jumpscare_screech @a[r=15] ~ ~ ~ 1.5 0.9`);
  dim.runCommand(`particle minecraft:huge_explosion_emitter ${loc.x} ${loc.y} ${loc.z}`);
  dim.runCommand(`fill ${Math.floor(loc.x - 1)} ${Math.floor(loc.y - 3)} ${Math.floor(loc.z - 1)} ${Math.floor(loc.x + 1)} ${Math.floor(loc.y)} ${Math.floor(loc.z + 1)} air`);
  
  player.onScreenDisplay.setTitle('§4GRAVE COLLAPSE', { subtitle: '§7You plummeted into the catacombs...' });
}

function triggerCabinClockBeat(dim, loc, player) {
  const now = Date.now();
  if (now - lastClockChime < 60000) return; // 1 min cooldown
  lastClockChime = now;

  dim.runCommand(`playsound forgotten_woods.clock_chime @a[r=25] ~ ~ ~ 1.5 0.75`);
  player.onScreenDisplay.setActionBar('§4⏰ GONG... GONG... The grandfather clock tolls midnight.');

  // Jumpscare: Spawn/Shift Mannequin behind player
  const view = player.getViewDirection();
  const spawnBehind = {
    x: loc.x - view.x * 2.5,
    y: loc.y,
    z: loc.z - view.z * 2.5
  };

  try {
    dim.spawnEntity('forgotten_woods:headless_mannequin', spawnBehind);
    dim.runCommand(`playsound forgotten_woods.stone_slide @a[r=15] ~ ~ ~ 1.2 0.7`);
  } catch (e) {}
}
