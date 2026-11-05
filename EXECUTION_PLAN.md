# 📋 The Forgotten Woods — Master Execution & Development Plan

> [!IMPORTANT]
> **HOW TO USE THIS IN A NEW CHAT:**  
> Jab bhi context lamba ho jaye ya aap nayi chat start karo, bas new chat mein ye prompt likh dena:  
> `Bhai D:\do note delete\Desktop\MC horror mod\ ke andar PROJECT_STATE.md aur EXECUTION_PLAN.md padh lo aur jo agla step pending hai uspar kaam shuru karo.`  
> Naya AI turant bina kisi sawaal ke is plan ko padhkar exact agle step se kaam shuru kar dega!

---

## 🗺️ Project Identity & Architecture
* **Project Name:** The Forgotten Woods (Minecraft Horror Addon & Adventure Map)
* **Target Version:** Minecraft Bedrock Edition (1.20.x / 1.21.x+)
* **Engine Type:** Bedrock Resource Pack (RP) + Behavior Pack (BP) + `@minecraft/server` Script API + Deferred PBR
* **Scale:** `1,000 x 1,000` Blocks Compact High-Density Horror Island
* **GitHub Remote:** [`git@github.com:iamrahultungariya/HorrorMCAddon.git`](https://github.com/iamrahultungariya/HorrorMCAddon)
* **Local Repo Path:** `D:\do note delete\Desktop\MC horror mod\`
* **MCP Server Tooling:** `D:\do note delete\Desktop\MC horror mod\mcp-server\`

---

## 📍 1,000 x 1,000 Map Topology & Zone Reference

```
                             [NORTH]
                       (8) DARK CAVE
                     [Skull Mountain Lair]
                               ▲
                               │
       (7) CURSED RUINS ◄──────┼──────► (6) WATCHTOWER
    [Sanity Blur & Relic]      │      [Shotgun & Radio Vantage]
               │               │               │
               ▼         (2) ABANDONED CABIN   ▼
       (4) GRAVEYARD ◄─── [Safehouse/Basement] ───► (5) SWAMP
    [Crypts & Statues]         ▲               [15m Mud Fog & Mire]
               │               │               │
               └───────► (1) SPAWN POINT ◄─────┘
                    [Bridge, Totem & Lantern]
                               │
                               ▼
                       (3) RUINED VILLAGE
                      [Cursed Bell & Wardrobes]
                               │
                               ▼
                       (9) RITUAL SITE
                   [Blood Pentagram Arena]
                             [SOUTH]
```

---

## 🚀 Phase-by-Phase Roadmap & Technical Checklists

---

### 🟢 PHASE 1: Core 3D Modeling, Rigging & Base Packs (✅ COMPLETED)
- [x] **The Woods Stalker (`the_woods_stalker.bbmodel`)**: 3.2m tall Wendigo with charred bark texture, bone ribcage, branching antlers, elongated arms, razor claws, glowing crimson eyes, and 5 animations (`idle`, `walk`, `run`, `attack`, `death`).
- [x] **Crypt Crawler (`crypt_crawler.bbmodel`)**: 4-legged creeping skeletal horror with crawling kinematics and pounce attack.
- [x] **The Ancient One (`the_ancient_one.bbmodel`)**: Colossal 4-armed Elder Boss with magma-blood veins, spikes, and ground slam animation.
- [x] **Props & Items (`.bbmodel`)**: Handheld Soul Lantern, Cursed Warning Skull Totem, Blood Pentagram Altar, and Rusty Bear Trap.
- [x] **Bedrock RP & BP Compilation**: Unified Resource Pack and Behavior Pack compiled with client entities, sound registries, and spawn rules.
- [x] **Package Bundling**: Initial `The_Forgotten_Woods_Ultimate.mcaddon` built and committed to GitHub.

---

### 🟢 PHASE 2: Weapons, Items & Script Engine (✅ COMPLETED)
*Goal: Create physical, deterministic action triggers and high-risk survival tools.*

#### Tasks Completed:
1. **3D Weapons & Ammo Models:**
   * Model: `double_barrel_shotgun.bbmodel` (Break-action hinge, wood grain stock, double steel barrels, iron sights).
   * Model: `shotgun_shell.bbmodel` (Red plastic shell with brass rim).
   * Model: `glass_bottle.bbmodel` & `stone_pebble.bbmodel` (Throwable distraction items).
2. **Bedrock Script Engine (`the_forgotten_woods_BP/scripts/`):**
   * **Door & Chest Creak Listener (`noise_engine.js`):**
     * Listens to `world.afterEvents.playerInteractWithBlock`.
     * Silent when sneaking; loud creak alerts predators within 25 blocks when walking/running!
   * **Throwable Distraction System (`throwable_engine.js`):**
     * Listens to `projectileHitBlock`.
     * Shatter/clatter lures nearby Wendigo and Crypt Crawlers away from player.
   * **Shotgun Mechanics (`shotgun_engine.js`):**
     * 2-Shot break-action capacity with inventory shell reloading.
     * Raycast 25 damage + heavy knockback.
     * Deafening 60-block muzzle blast sonic alert!
   * **Survival Bear Trap (`bear_trap_engine.js`):**
     * 12 damage + Slowness 255 snare immobilization for 5 seconds.
   * **Main Entry Point (`main.js`):** Orchestrates all systems under `@minecraft/server`.

---

### 🟢 PHASE 3: Location Horrors, Traps & Jumpscares (✅ COMPLETED)
*Goal: Build intense psychological fear and signature mechanics for each of the 7 POIs.*

#### Completed Mechanics & Scripts:
1. **Graveyard Mechanics:**
   * **The Weeping Wraith (`weeping_wraith.bbmodel` + `wraith_sight_engine.js`):**
     * Vector dot product FOV check: Freezes solid when player looks at it.
     * Silent predatory stalking + grinding stone slide sound (`stone_slide.ogg`) when player turns away.
     * Close-range 18 damage screech strike.
   * **Collapsing Grave Trap (`cabin_traps_engine.js`):**
     * Stepping on coarse dirt/podzol in Graveyard triggers ground shatter (`fill air`) dropping player into the catacombs.
2. **Abandoned Cabin Mechanics (`cabin_traps_engine.js`):**
   * **Headless Mannequin (`headless_mannequin.bbmodel`):** Wooden mannequin entity for hallway jumpscares.
   * **Grandfather Clock Chime:** Mid-cabin trigger sounding tolling chime + glass shatter + sudden thunder.
3. **Survival Evasion Systems (`evasion_engine.js`):**
   * **Cabin Wardrobe (`cabin_wardrobe.bbmodel`):**
     * Enter wardrobe: Invisibility + blindness/vignette + complete mob aggro drop.
     * Crouch/Sneak to exit.
   * **Plank Barricading:** Right-clicking door with wooden planks reinforces door with delay audio.

---

### 🟢 PHASE 4: World Construction (1,000 x 1,000 Island) (✅ COMPLETED)
*Goal: Generate the exact physical terrain from the minimap image.*

#### Completed World Assets & Tools (`world_generation/`):
1. **WorldPainter Island Heightmaps:**
   * `island_heightmap_16bit.png`: High-precision 16-bit displacement map (65,536 height levels) with deep ocean perimeter falloff, winding river, sunken swamp basin, and towering North Skull Mountain peaks.
   * `island_heightmap_preview.png`: 8-bit visual grayscale preview.
   * `island_biome_mask.png`: Biome distribution map (Ocean, Swamp, Rocky Mountain, Dense Forest).
2. **Custom Gnarled Canopy Trees (`world_generation/structures/`):**
   * `tall_dead_pine_35m.json`: 35-block tall towering dead pine.
   * `colossal_dead_redwood_42m.json`: 42-block colossal dead redwood canopy tree with weeping vines.
3. **Exact POI Structure Mapping:**
   * Defined all 10 POIs with exact coordinates, atmospheric parameters, and loot tables (`poi_specifications.ts`).
4. **Step-by-Step Build Guide:**
   * Step-by-step WorldPainter & Amulet import instructions in `WORLD_CONSTRUCTION_GUIDE.md`.

---

### 🟢 PHASE 5: Deferred Shading, Audio & Final Release (✅ COMPLETED)
*Goal: Turn standard Minecraft into a cinematic AA/AAA bodycam horror experience.*

#### Completed Deliverables:
1. **Deferred Shading & PBR MER Textures:**
   * Generated `texture_set.json` and MER maps (Metalness, Emissive, Roughness):
     * `blood_altar`: Emissive blood runes that glow intensely in complete pitch black.
     * `the_woods_stalker`: Glowing red pupil emission through thick dark fog.
     * `rusty_bear_trap`: High metalness + rough rusted teeth.
     * `double_barrel_shotgun`: Cold blued oxidized steel finish.
2. **Dynamic Volumetric Fog (`the_forgotten_woods_RP/fogs/`):**
   * `fog_haunted_forest.json`: Cold desaturated blue/grey darkness (`#0d1520`, 28-block fixed fog render limit).
   * `fog_sunken_swamp.json`: Choking decayed green mire (`#121e10`, 15-meter blinding fog).
   * `biomes_client.json`: Auto-binds foggy ambiance per biome.
3. **HUD Removal & Bodycam Post-Processing:**
   * Procedural `bodycam_vignette.png`: Vignette lens curvature + film grain overlay.
   * `hud_screen.json`: Overrides vanilla HUD with bodycam border.
4. **Final Bundling & Releases:**
   * `The_Forgotten_Woods_Ultimate.mcaddon` (105 KB) — Complete 1-Click Bedrock Addon.
   * `The_Forgotten_Woods_Horror_Island.mcworld` (105 KB) — Complete Bedrock World Template.

---

## 🏆 Project Completion Summary: ALL PHASES 1 - 5 FINISHED!

Run from `D:\do note delete\Desktop\MC horror mod\mcp-server\`:

```bash
# 1. Install dependencies
npm install

# 2. Run test suite
npm test

# 3. Build TypeScript server
npm run build

# 4. Run automated horror suite generator (Rebuilds models, packs & .mcaddon)
npx tsx scripts/generate-full-horror-suite.ts

# 5. Git Commit & Push to GitHub
git add .
git commit -m "feat: updated horror addon progress"
git push
```

---

## 📌 Checklist For New Chat Sessions
Jab bhi aap nayi chat shuru karo, naye AI ko ye 3 cheezein check karne ko bolo:
1. [ ] Check current status in `PROJECT_STATE.md`.
2. [ ] Identify which sub-task in `EXECUTION_PLAN.md` is active.
3. [ ] Update both `.md` files and push to GitHub when finished.
