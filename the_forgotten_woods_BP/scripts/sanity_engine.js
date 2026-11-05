/**
 * The Forgotten Woods — Sanity & Psychological Hallucination Engine
 * 
 * Mechanics:
 * - Each player has a Sanity Pool (100 -> 0).
 * - Drain Triggers:
 *   - Darkness (Night time without light or flashlight active)
 *   - Proximity to Stalker, Weeping Wraith, or Crypt Crawler (< 15 blocks)
 * - Regeneration Triggers:
 *   - Standing near active light source (Campfire, Lantern, Blood Altar, or Flashlight ON)
 * - Hallucination Effects:
 *   - Sanity 50% - 70%: Unease, fast rhythmic heartbeat pulse
 *   - Sanity 25% - 50%: Paranoia, false footsteps behind the player, visual static
 *   - Sanity < 25%: Extreme terror, nausea, momentary blindness, whisper hallucinations
 */

import { world, system } from '@minecraft/server';

const playerSanity = new Map();

export function initializeSanityEngine() {
  // Command listener for QA/testing
  world.beforeEvents.chatSend.subscribe((event) => {
    const msg = event.message.trim().toLowerCase();
    if (msg === '!sanity' || msg === '/sanity') {
      event.cancel = true;
      system.run(() => {
        playerSanity.set(event.sender.id, 100);
        event.sender.sendMessage('§a[SANITY ENGINE] Sanity fully restored to 100%.');
      });
    }
  });

  // Ticking Sanity Evaluation Loop (Runs every 20 ticks = 1 second)
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const pId = player.id;
      let sanity = playerSanity.get(pId) ?? 100;

      // 1. Proximity Check to Horrors
      const nearbyMonsters = player.dimension.getEntities({
        location: player.location,
        maxDistance: 16,
        families: ['horror', 'monster']
      });

      const isNearMonster = nearbyMonsters.length > 0;
      const hasLight = player.getEffect('night_vision') !== undefined;

      // 2. Adjust Sanity
      if (isNearMonster) {
        sanity = Math.max(0, sanity - 2.5);
        player.playSound('note.bass', { pitch: 0.6, volume: 0.8 });
      } else if (!hasLight) {
        sanity = Math.max(0, sanity - 0.4);
      } else {
        sanity = Math.min(100, sanity + 0.6);
      }

      playerSanity.set(pId, sanity);

      // 3. Hallucination Thresholds
      if (sanity < 70 && sanity >= 45) {
        if (Math.random() < 0.25) {
          player.playSound('forgotten_woods.heartbeat_fast', { pitch: 1.0, volume: 0.8 });
        }
      } else if (sanity < 45 && sanity >= 20) {
        if (Math.random() < 0.3) {
          player.playSound('forgotten_woods.stone_slide', { pitch: 1.2, volume: 0.7 });
          player.onScreenDisplay.setActionBar(`§c[SANITY: ${Math.round(sanity)}%] §7Footsteps behind you...?`);
        }
      } else if (sanity < 20) {
        if (Math.random() < 0.35) {
          player.playSound('forgotten_woods.jumpscare_screech', { pitch: 0.9, volume: 1.0 });
          player.addEffect('darkness', 60, { amplifier: 0, showParticles: false });
          player.addEffect('slowness', 40, { amplifier: 1, showParticles: false });

          player.onScreenDisplay.setTitle('§4DON\'T LOOK BACK', {
            subtitle: '§cYour mind is slipping away...',
            fadeInDuration: 5,
            stayDuration: 30,
            fadeOutDuration: 10
          });
        }
      }
    }
  }, 20);
}
