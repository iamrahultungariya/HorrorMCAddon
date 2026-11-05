# 🌲 The Forgotten Woods — Minecraft Bedrock Horror Addon

A psychological survival horror addon for **Minecraft Bedrock Edition** (Mobile, Windows 10/11, iOS, Android, Consoles).

---

## 🚀 How to Install & Play (1-Click)

1. Double-click or tap **`The_Forgotten_Woods_Ultimate.mcaddon`**.
2. Minecraft Bedrock will automatically import:
   - `The Forgotten Woods [RP]` (Resource Pack)
   - `The Forgotten Woods [BP]` (Behavior Pack)
3. Create a New World (or edit an existing world):
   - Under **Resource Packs**, activate **The Forgotten Woods [RP]**.
   - Under **Behavior Packs**, activate **The Forgotten Woods [BP]**.
   - Under **Experiments**, toggle **Beta APIs** to **ON** (required for dynamic scripting).
   - Ensure **Cheats** are enabled to use slash commands.
4. Launch the world!

---

## 🎮 Slash Commands (`/function`)

All commands use standard Minecraft Bedrock slash commands with tab auto-completion:

| Command | Action |
| :--- | :--- |
| **`/function setup`** | **Instant 1-Click Game Start:** Sets midnight, locks daylight cycle, summons atmospheric thunder & dense horror fog, and delivers survival gear to your inventory. |
| **`/function gear`** | Grants the Break-Action Shotgun, 12-Gauge Shells, Tactical UV Flashlight, AA Lithium Batteries, Soul Lantern, Glass Bottles, Pebbles, and Bear Traps. |
| **`/function godmode`** | Toggles developer immortality (Resistance 255, Regeneration, Speed III, Night Vision, Saturation). |
| **`/function mortal`** | Deactivates godmode and restores vulnerability. |
| **`/function horror_night`** | Locks time to midnight, starts thunder, and pushes the custom volumetric horror fog. |
| **`/function day`** | Clears the fog and restores peaceful sunny daylight. |
| **`/function fog`** | Pushes `forgotten_woods:fog_haunted_forest` (dense 28m horror fog). |
| **`/function fog_off`** | Clears custom fog. |
| **`/function summon_stalker`** | Summons **The Woods Stalker** (Wendigo forest predator). |
| **`/function summon_crawler`** | Summons the **Crypt Crawler** (creeping skeleton). |
| **`/function summon_boss`** | Awakens **The Ancient One** (Colossal 4-armed Elder Boss). |
| **`/function summon_wraith`** | Places **The Weeping Wraith** (Weeping Angel statue AI). |
| **`/function help`** | Displays the command menu in chat. |

---

## 🕹️ Survival Mechanics

1. **Deterministic Noise Engine:**
   - Opening doors, chests, or trapdoors while standing makes a loud creak (`door_creak.ogg`), alerting nearby monsters within 25 blocks!
   - **Sneak (Crouch)** to open doors and chests in 100% silence.
2. **Break-Action Shotgun:**
   - Holds 2 shells. Deals 25 devastating close-range damage with heavy knockback.
   - **Deafening Blast:** Creates a 60-block sonic shockwave that alerts every predator in the vicinity.
   - Right-click with 12-gauge shells in your inventory to reload.
3. **Tactical UV Flashlight & AA Batteries:**
   - Right-click to toggle flashlight illumination.
   - **High-Beam Stun (Sneak + Right-Click):** Consumes 20% battery to emit a high-intensity beam that blinds and immobilizes monsters for 3 seconds.
   - Put an **AA Lithium Battery** in your offhand and right-click with the flashlight to recharge (+50%).
4. **Throwable Distractions:**
   - Throw **Glass Bottles** (shatters on impact, lures monsters within 35 blocks) or **Stone Pebbles** (subtle clatter, lures monsters within 18 blocks) to sneak past predators.
5. **Weeping Wraith (Graveyard AI):**
   - Freezes solid as long as you maintain eye contact in your field of view.
   - The instant you turn your back, it stalks forward at frightening speed!
6. **Wardrobe Hiding & Barricades:**
   - Right-click **Cabin Wardrobes** to hide inside (gives concealment vignette and reduces monster aggro to zero; sneak to exit).
   - Right-click doors with wooden planks to nail barricades.
7. **Psychological Sanity Engine:**
   - Sanity drains in total darkness and when near monsters.
   - Low sanity causes rhythmic heartbeats, false footsteps behind you, and horrifying auditory hallucinations.
   - Restore sanity with active light sources (Flashlight, Soul Lantern, Campfire).
