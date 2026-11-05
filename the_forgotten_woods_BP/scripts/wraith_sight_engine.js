/**
 * The Forgotten Woods — Graveyard Weeping Wraith AI Engine
 * 
 * Mechanics (Weeping Angels style):
 * - Checks player gaze direction (Vector Dot Product / FOV check).
 * - When player is looking at the Wraith:
 *   - The statue FREEZES completely solid (immobile stone).
 * - When player turns away or blinks:
 *   - The statue stalks forward at terrifying speed with grinding stone audio (stone_slide).
 *   - Closes distance silently, freezing again if player snaps back around.
 */

import { world, system } from '@minecraft/server';

function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function initializeWeepingWraithEngine() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const dim = player.dimension;
      const pLoc = player.location;
      const pView = player.getViewDirection();

      // Find nearby Weeping Wraiths within 32 blocks
      const wraiths = dim.getEntities({
        type: 'forgotten_woods:weeping_wraith',
        location: pLoc,
        maxDistance: 32,
      });

      for (const wraith of wraiths) {
        const wLoc = wraith.location;
        const dirToWraith = {
          x: wLoc.x - pLoc.x,
          y: (wLoc.y + 1.2) - (pLoc.y + 1.6),
          z: wLoc.z - pLoc.z,
        };

        const dist = Math.sqrt(dirToWraith.x ** 2 + dirToWraith.y ** 2 + dirToWraith.z ** 2);
        if (dist === 0) continue;

        const normDir = normalize(dirToWraith);
        const normView = normalize(pView);
        const dot = dotProduct(normDir, normView);

        // Field of View Check (dot > 0.4 means wraith is inside player's ~70-degree vision cone)
        const isBeingObserved = dot > 0.4;

        if (isBeingObserved) {
          // FREEZE SOLID: Apply maximum slowness, weakness, resistance
          wraith.addEffect('slowness', 10, { amplifier: 255, showParticles: false });
          wraith.addEffect('weakness', 10, { amplifier: 10, showParticles: false });
          wraith.addEffect('resistance', 10, { amplifier: 10, showParticles: false });
        } else {
          // UNSEEN: Stalk toward player rapidly!
          wraith.removeEffect('slowness');
          wraith.removeEffect('weakness');

          // Rush toward player position
          const stepSpeed = 0.5;
          const stalkVector = {
            x: -normDir.x * stepSpeed,
            y: 0,
            z: -normDir.z * stepSpeed,
          };

          try {
            wraith.applyKnockback(stalkVector.x, stalkVector.z, 0.4, 0.0);
          } catch (e) {}

          // Play chilling stone grinding sound if close
          if (dist < 12 && Math.random() < 0.25) {
            dim.runCommand(`playsound forgotten_woods.stone_slide @a[r=15] ${wLoc.x} ${wLoc.y} ${wLoc.z} 0.9 0.85`);
          }

          // Kill / attack player if within reach
          if (dist < 2.0) {
            try {
              player.applyDamage(18);
              dim.runCommand(`playsound forgotten_woods.jumpscare_screech @a[r=10] ${pLoc.x} ${pLoc.y} ${pLoc.z} 1.8 1.0`);
            } catch (dmgErr) {}
          }
        }
      }
    }
  }, 4);
}
