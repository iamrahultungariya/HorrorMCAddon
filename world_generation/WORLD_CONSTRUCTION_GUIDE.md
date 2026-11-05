# 🗺️ WorldPainter & Amulet Editor Island Setup Guide (1,000 x 1,000 Island)

Ye guide follow karke aap 5 minute mein exact minimap terrain create karke Minecraft Bedrock mein load kar sakte ho:

---

## 🛠️ Step 1: WorldPainter Heightmap Import

1. **WorldPainter Download & Open:**
   * Open WorldPainter.
   * Menu mein jao: `File` ➔ `Import` ➔ `Height map...`.
2. **Select Heightmap File:**
   * File path choose karo:  
     `D:\do note delete\Desktop\MC horror mod\world_generation\island_heightmap_16bit.png`
3. **Heightmap Import Settings:**
   * **Scale:** `100%` (1 pixel = 1 block).
   * **Dimensions:** `1000 x 1000`.
   * **Water Level:** Set to `62` (Standard Minecraft Sea Level).
   * **Lower / Upper Limits:** Min height `38` (Deep surrounding ocean), Max height `160` (North Skull Mountain peak).
   * Click **OK**.

---

## 🌲 Step 2: Custom Canopy Trees & Forest Brushes

1. **Add Custom Tree Objects:**
   * WorldPainter ke **Custom Layers** panel mein `+` click karo ➔ `Add a custom object layer`.
   * Select schematics/objects from:  
     `D:\do note delete\Desktop\MC horror mod\world_generation\structures\`
     * `tall_dead_pine_35m`
     * `colossal_dead_redwood_42m`
2. **Paint Forest Density:**
   * Center island area (`X: 150..850, Z: 150..850`) par paint karo taaki sky view completely block ho jaye aur permanent horror shade ban jaye.

---

## 📍 Step 3: Exact POI Placement Coordinates (Amulet / In-Game)

Neeche diye exact coordinates par pre-built horror structures spawn/place honge:

| POI # | Name | Coordinates (X, Y, Z) | Key Horror Trigger |
| :--- | :--- | :--- | :--- |
| **1** | **Spawning Point & Bridge** | `(500, 68, 850)` | Starter Soul Lantern & Warning Totem |
| **2** | **Abandoned Cabin (Safehouse)** | `(500, 72, 500)` | Clock Chime, Shifting Mannequin, Hiding Wardrobe |
| **3** | **Ruined Village** | `(750, 69, 750)` | Cursed Church Bell, Collapsed Cottages |
| **4** | **Graveyard & Catacombs** | `(300, 69, 650)` | Weeping Wraith AI & Collapsing Grave Trap |
| **5** | **Sunken Swamp** | `(700, 63, 500)` | Submerged Witch Hut & Water splash noise lure |
| **6** | **Watchtower** | `(850, 88, 250)` | Break-Action Shotgun & 12-Gauge Shells |
| **7** | **Cursed Ruins** | `(350, 76, 250)` | Ancient Relic Pedestal & Gargoyles |
| **8** | **Dark Cave (Skull Mountain)** | `(500, 95, 100)` | 45m Skull Cliff Entrance & The Ancient One Boss Lair |
| **9** | **Ritual Site** | `(850, 70, 500)` | Blood Altar & Emissive Pentagram |
| **10** | **Haunted Woods Canopy** | `(500, 70, 500)` | 35-45m Dead Pines (The Woods Stalker Hunting Grounds) |

---

## 🎮 Step 4: Export to Minecraft Bedrock

1. WorldPainter mein `File` ➔ `Export` ➔ `Export as Minecraft map`.
2. Format choose karo: **Bedrock Edition**.
3. Target folder choose karo aur export kar do.
4. Export hone ke baad world folder ke andar addon packs (`the_forgotten_woods_RP` aur `the_forgotten_woods_BP`) link ho jayenge!
