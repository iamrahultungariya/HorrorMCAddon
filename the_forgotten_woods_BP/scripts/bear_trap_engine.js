/**
 * The Forgotten Woods — Rusty Bear Trap Snare Engine
 * 
 * Mechanics:
 * - Players place bear traps on ground.
 * - When monsters walk over the trap:
 *   - Deals 12 bleed damage
 *   - Clamps shut with loud mechanical metallic snap (bear_trap_snap.ogg)
 *   - Applies Slowness 255 (Immobilized) for 5 seconds (100 ticks)
 *   - Emits blood particles
 */

import { world, system } from '@minecraft/server';

export function initializeBearTrapEngine() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const dim = player.dimension;

      // Find nearby monsters around player
      const mobs = dim.getEntities({
        location: player.location,
        maxDistance: 32,
        families: ['horror', 'monster'],
      });

      for (const mob of mobs) {
        const mobLoc = mob.location;
        const blockBelow = dim.getBlock({
          x: Math.floor(mobLoc.x),
          y: Math.floor(mobLoc.y),
          z: Math.floor(mobLoc.z)
        });

        if (blockBelow && (blockBelow.typeId.includes('bear_trap') || blockBelow.typeId.includes('pressure_plate'))) {
          snapTrapOnEntity(dim, mob);
        }
      }
    }
  }, 5);
}

function snapTrapOnEntity(dim, mob) {
  const loc = mob.location;

  // Audio & blood particles
  dim.runCommand(`playsound forgotten_woods.bear_trap_snap @a[x=${loc.x},y=${loc.y},z=${loc.z},r=30] ${loc.x} ${loc.y} ${loc.z} 1.5 0.85`);
  dim.runCommand(`particle minecraft:redstone_wire_dust_particle ${loc.x} ${loc.y + 0.2} ${loc.z}`);

  // Immobilize for 5 seconds (100 ticks)
  try {
    mob.addEffect('slowness', 100, { amplifier: 255, showParticles: false });
    mob.addEffect('weakness', 100, { amplifier: 5, showParticles: false });
    mob.applyDamage(12);
  } catch (e) {}

  dim.runCommand(`tellraw @a[r=25] {"rawtext":[{"text":"§6[CLANG!] A monster stepped right into a bear trap!"}]}`);
}
