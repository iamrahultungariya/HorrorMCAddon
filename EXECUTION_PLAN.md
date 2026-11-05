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

### 🟡 PHASE 3: Location Horrors, Traps & Jumpscares (🔄 CURRENT ACTIVE PHASE)
*Goal: Build intense psychological fear and signature mechanics for each of the 7 POIs.*

#### Tasks & Mechanics:
1. **Graveyard Mechanics:**
   * **The Weeping Wraith (Statue AI):**
     * Checks vector dot product between player view direction and statue position (`FOV check`).
     * When player looks at it: Freezes solid (unmoving stone).
     * When player turns back (`dot < 0`): Teleports/glides silently behind player with grinding stone sound (`stone_slide.ogg`).
   * **Collapsing Grave Block:**
     * Custom block: `forgotten_woods:collapsing_dirt`. Stepping on it instantly destroys block and drops player into a dark crypt coffin with an audio screech.
2. **Abandoned Cabin (Mansion) Mechanics:**
   * **The Shifting Mannequin:** Script moves mannequin entity to the hallway doorway as soon as player exits the bedroom.
   * **Grandfather Clock Chime:** Clock entity triggers loud chime and shatters glass when player walks past coordinates `(X, Y, Z)`.
   * **Window Peeker Event:** Lightning flash event flashes monster face against window glass for 0.5s.
   * **Flooded Basement:** Water floor applies `slowness` while player hunts for 2 electrical fuses to restore power.
3. **Evasion Systems:**
   * **Wardrobe Hiding:** Interacting with wardrobe block hides player (`invisibility`), locks camera to eye-slit perspective, and reduces monster detection radius to 1 block.
   * **Plank Barricading:** Right-clicking door with `wooden_plank` creates barricade; monster must execute 3 claw-attack cycles before breaking through.

---

### 🔵 PHASE 4: World Construction (1,000 x 1,000 Island) (PLANNED)
*Goal: Generate the exact physical terrain from the minimap image.*

#### Tasks & Tools:
1. **WorldPainter Island Heightmap:**
   * Create `1000 x 1000` canvas surrounded by deep ocean border.
   * North: Sculpt towering rocky mountain for **Dark Cave**.
   * Center: Carve winding river and lower elevation for **Swamp**.
   * Surface: Cover with custom dead pine / dark oak 35–45 block tall tree schematics (blocking sky view).
2. **Amulet Editor POI Placement:**
   * Place pre-built medieval/horror structures at exact minimap coordinates:
     * `(X: 500, Z: 850)` → Spawning Point & River Bridge
     * `(X: 750, Z: 750)` → Ruined Village
     * `(X: 300, Z: 650)` → Graveyard & Crypts
     * `(X: 500, Z: 500)` → Abandoned Cabin
     * `(X: 700, Z: 500)` → Swamp & Sunken Witch Hut
     * `(X: 850, Z: 250)` → Watchtower
     * `(X: 350, Z: 250)` → Cursed Ruins
     * `(X: 500, Z: 100)` → Dark Cave (Skull Entrance)
     * `(X: 850, Z: 500)` → Ritual Site (Blood Pentagram)

---

### 🟣 PHASE 5: Deferred Shading, Audio & Final Release (PLANNED)
*Goal: Turn standard Minecraft into a cinematic AA/AAA bodycam horror experience.*

#### Tasks:
1. **Deferred Shading & PBR Textures:**
   * Add `texture_set.json` with MER maps (Metalness, Emissive, Roughness):
     * Wet mud puddles reflect moonlight.
     * Blood pentagram circle has `emissive: 1.0` (glows in pitch black).
2. **Dynamic Volumetric Fog:**
   * Create `biomes_client.json` with custom fog definitions:
     * Forest: Cold desaturated blue/grey fog (`#111822`, 30-block distance).
     * Swamp: Heavy decaying green mist (`#152012`, 15-block distance).
3. **HUD Removal & Bodycam Post-Processing:**
   * JSON UI modification hiding vanilla hearts, armor, and hunger bars.
   * Dark vignette overlay + slight film grain texture.
4. **3D Positional Audio Suite:**
   * Custom `.ogg` files: creaking floorboards, distant screams, heartbeat pulses, deafening shotgun blasts, and static radio chatter.
5. **Final Bundling:**
   * Package everything into a single `.mcworld` file containing the 1000x1000 island + both RP & BP pre-installed for 1-click mobile/PC launch.

---

## 💻 Essential Developer Commands

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
