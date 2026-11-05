/**
 * The Forgotten Woods — Developer Secret Godmode & QA Command Engine
 * 
 * Supports:
 * - Native Bedrock Script Events: /scriptevent horror:gear, /scriptevent horror:godmode, etc.
 * - Chat message commands: /gear, !gear, /godmode, !godmode, /immortal, !immortal, /heal, !heal
 */

import { world, system } from '@minecraft/server';

const GODMODE_TAG = 'dev_immortal_mode';

export function initializeGodmodeEngine() {
  // 1. Support Bedrock /scriptevent horror:<action>
  system.afterEvents.scriptEventReceive.subscribe((event) => {
    const { id, message, sourceEntity } = event;
    if (!id.startsWith('horror:')) return;

    const action = id.replace('horror:', '').toLowerCase();
    const player = sourceEntity ?? world.getAllPlayers()[0];
    if (!player) return;

    handleCommand(action, player);
  });

  // 2. Support Chat Commands (both / and ! prefixes)
  world.beforeEvents.chatSend.subscribe((event) => {
    const player = event.sender;
    const raw = event.message.trim().toLowerCase();

    // Check if message is a command
    if (raw.startsWith('/') || raw.startsWith('!')) {
      const cmd = raw.substring(1).trim();

      if (['immortal', 'godmode', 'gear', 'heal', 'sanity', 'night', 'fog', 'help'].includes(cmd)) {
        event.cancel = true; // Prevent leaking to public chat
        system.run(() => {
          handleCommand(cmd, player);
        });
      }
    }
  });

  // Passive Watcher: Ensure immortal players do not lose effects
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (player.hasTag(GODMODE_TAG)) {
        if (!player.getEffect('resistance')) {
          player.addEffect('resistance', 20000000, { amplifier: 255, showParticles: false });
          player.addEffect('regeneration', 20000000, { amplifier: 255, showParticles: false });
          player.addEffect('fire_resistance', 20000000, { amplifier: 255, showParticles: false });
          player.addEffect('speed', 20000000, { amplifier: 3, showParticles: false });
          player.addEffect('night_vision', 20000000, { amplifier: 1, showParticles: false });
        }
      }
    }
  }, 40);

  console.warn('[The Forgotten Woods] Godmode & Slash Command Engine Registered.');
}

function handleCommand(cmd, player) {
  if (cmd === 'immortal' || cmd === 'godmode') {
    if (player.hasTag(GODMODE_TAG)) {
      player.removeTag(GODMODE_TAG);
      player.removeEffect('resistance');
      player.removeEffect('regeneration');
      player.removeEffect('fire_resistance');
      player.removeEffect('speed');
      player.removeEffect('night_vision');
      player.removeEffect('saturation');

      player.sendMessage('§c[GODMODE] Immortality & Fast Travel DEACTIVATED.');
      player.onScreenDisplay.setTitle('§cIMMORTALITY OFF', {
        subtitle: '§7Vulnerability Restored',
        fadeInDuration: 5,
        stayDuration: 40,
        fadeOutDuration: 10
      });
    } else {
      player.addTag(GODMODE_TAG);
      player.addEffect('resistance', 20000000, { amplifier: 255, showParticles: false });
      player.addEffect('regeneration', 20000000, { amplifier: 255, showParticles: false });
      player.addEffect('fire_resistance', 20000000, { amplifier: 255, showParticles: false });
      player.addEffect('speed', 20000000, { amplifier: 3, showParticles: false });
      player.addEffect('night_vision', 20000000, { amplifier: 1, showParticles: false });
      player.addEffect('saturation', 20000000, { amplifier: 255, showParticles: false });

      player.sendMessage('§a§l[GODMODE ACTIVATED]§r §eYou are now IMMORTAL! (Resistance 255, Speed III, Night Vision)');
      player.onScreenDisplay.setTitle('§a§lIMMORTAL ACTIVE', {
        subtitle: '§eGodmode & Speed III Engaged',
        fadeInDuration: 5,
        stayDuration: 50,
        fadeOutDuration: 10
      });
    }
    return;
  }

  if (cmd === 'gear') {
    try {
      player.runCommandAsync('give @s forgotten_woods:double_barrel_shotgun 1');
      player.runCommandAsync('give @s forgotten_woods:shotgun_shell 32');
      player.runCommandAsync('give @s forgotten_woods:flashlight 1');
      player.runCommandAsync('give @s forgotten_woods:aa_battery 16');
      player.runCommandAsync('give @s forgotten_woods:forgotten_lantern 1');
      player.runCommandAsync('give @s forgotten_woods:glass_bottle 8');
      player.runCommandAsync('give @s forgotten_woods:stone_pebble 16');
      player.runCommandAsync('give @s forgotten_woods:rusty_bear_trap 4');
      player.sendMessage('§6[DEV ARSENAL] Complete Horror Survival Kit Delivered to Inventory.');
    } catch (err) {
      player.sendMessage(`§c[DEV ERROR] Could not grant items: ${err}`);
    }
    return;
  }

  if (cmd === 'heal') {
    player.addEffect('instant_health', 1, { amplifier: 255, showParticles: false });
    player.addEffect('saturation', 10, { amplifier: 255, showParticles: false });
    player.sendMessage('§a[DEV HEAL] Health and Hunger Fully Restored.');
    return;
  }

  if (cmd === 'night') {
    player.dimension.runCommand('time set midnight');
    player.dimension.runCommand('weather thunder');
    player.dimension.runCommand('gamerule dodaylightcycle false');
    player.dimension.runCommand('fog @a push forgotten_woods:fog_haunted_forest horror_fog');
    player.sendMessage('§4[HORROR NIGHT] Midnight locked & dense horror fog pushed.');
    return;
  }

  if (cmd === 'fog') {
    player.dimension.runCommand('fog @a push forgotten_woods:fog_haunted_forest horror_fog');
    player.sendMessage('§2[FOG] Dense haunted forest fog applied.');
    return;
  }
}
