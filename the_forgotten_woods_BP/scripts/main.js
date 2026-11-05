/**
 * The Forgotten Woods — Master Script Entry Point (Pure JavaScript)
 */

import { world, system } from '@minecraft/server';
import { initializeNoiseEngine } from './noise_engine.js';
import { initializeShotgunEngine } from './shotgun_engine.js';
import { initializeThrowableDistractionEngine } from './throwable_engine.js';
import { initializeBearTrapEngine } from './bear_trap_engine.js';
import { initializeWeepingWraithEngine } from './wraith_sight_engine.js';
import { initializeCabinAndTrapsEngine } from './cabin_traps_engine.js';
import { initializeHidingAndBarricadeEngine } from './evasion_engine.js';
import { initializeGodmodeEngine } from './godmode_engine.js';
import { initializeFlashlightEngine } from './flashlight_engine.js';
import { initializeSanityEngine } from './sanity_engine.js';

system.run(() => {
  console.warn('[The Forgotten Woods] Initializing Complete Horror & Survival Suite...');

  try {
    initializeNoiseEngine();
    initializeShotgunEngine();
    initializeThrowableDistractionEngine();
    initializeBearTrapEngine();
    initializeWeepingWraithEngine();
    initializeCabinAndTrapsEngine();
    initializeHidingAndBarricadeEngine();
    initializeGodmodeEngine();
    initializeFlashlightEngine();
    initializeSanityEngine();
    console.warn('[The Forgotten Woods] All Survival, Sanity, Godmode & Tactical Engines Active.');
  } catch (err) {
    console.error('[The Forgotten Woods] Script Initialization Error:', err);
  }
});
