/**
 * The Forgotten Woods — Rusty Bear Trap Snare Engine
 * 
 * Mechanics:
 * - Players place bear traps on ground.
 * - When monsters walk over the trap:
 *   - Deals 12 bleed damage
 *   - Clamps shut with loud mechanical metallic snap (`bear_trap_snap.ogg`)
 *   - Applies Slowness 255 (Immobilized) for 5 seconds (100 ticks)
 *   - Emits blood particles
 */

import { world, system, Vector3, Dimension } from '@minecraft/server';

export function initializeBearTrapEngine() {
  // Check for mobs stepping onto active bear traps every 5 ticks
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

        // If stepping on custom bear trap or trap indicator
        if (blockBelow && (blockBelow.typeId.includes('bear_trap') || blockBelow.typeId.includes('pressure_plate'))) {
          snapTrapOnEntity(dim, mob);
        }
      }
    }
  }, 5);
}

function snapTrapOnEntity(dim: Dimension, mob: any) {
  const loc = mob.location;

  // Audio & blood particles
  dim.runCommand(`playsound forgotten_woods.bear_trap_snap @a[x=${loc.x},y=${loc.y},z=${loc.z},r=30] ${loc.x} ${loc.y} ${loc.z} 1.5 0.85`);
  dim.runCommand(`particle minecraft:redstone_wire_dust_particle ${loc.x} ${loc.y + 0.2} ${loc.z}`);

  // Apply immobilization slowness + damage
  try {
    mob.applyDamage(12);
    dim.runCommand(`effect "${mob.id}" slowness 5 255 true`);
  } catch (e) {
    dim.runCommand(`effect @e[type=forgotten_woods:the_woods_stalker,c=1,r=2] slowness 5 255 true`);
    dim.runCommand(`effect @e[type=forgotten_woods:crypt_crawler,c=1,r=2] slowness 5 255 true`);
  }
}
