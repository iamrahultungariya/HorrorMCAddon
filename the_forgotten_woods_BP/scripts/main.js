/**
 * The Forgotten Woods — Master Script Entry Point
 * 
 * Orchestrates:
 * 1. Noise Engine (Creaking Doors, Rusted Chests, Sneak Silence)
 * 2. Shotgun Engine (Double-Barrel Raycast, 25 DMG, 60-Block Forest Alert)
 * 3. Throwable Distraction Engine (Glass Bottles, Pebbles)
 * 4. Bear Trap Snare Engine (Immobilization & Clamping)
 */

import { world, system } from '@minecraft/server';
import { initializeNoiseEngine } from './noise_engine.js';
import { initializeShotgunEngine } from './shotgun_engine.js';
import { initializeThrowableDistractionEngine } from './throwable_engine.js';
import { initializeBearTrapEngine } from './bear_trap_engine.js';

system.run(() => {
  console.warn('[The Forgotten Woods] Initializing Survival & Horror Script Engine...');
  
  initializeNoiseEngine();
  initializeShotgunEngine();
  initializeThrowableDistractionEngine();
  initializeBearTrapEngine();

  console.warn('[The Forgotten Woods] Script Engine successfully initialized and listening for survival horror events.');
});
