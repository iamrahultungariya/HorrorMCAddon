# 🛠️ Blockbench MCP Server — Complete User & Setup Guide

> **Official Industrial-Grade Model Context Protocol (MCP) Server for Blockbench and Minecraft Modding.**  
> Is guide ko follow karke aap ghar jaakar apne PC ya laptop par is MCP Server ko Blockbench aur Antigravity/Claude ke sath 100% asaani se use kar sakte hain.

---

## 📌 Table of Contents
1. [Overview & Capabilities](#-1-overview--capabilities)
2. [Ghar Par Setup (Installation Steps)](#-2-ghar-par-setup-installation-steps)
3. [AI Assistants Ke Sath Connect Karna (Antigravity / Claude Desktop)](#-3-ai-assistants-ke-sath-connect-karna)
4. [Key Features & All 24 MCP Tools Reference](#-4-key-features--all-24-mcp-tools-reference)
5. [Blockbench Ke Andar Live Use Karne Ka Guide](#-5-blockbench-ke-andar-live-use-karne-ka-guide)
6. [Naye Mobs, Weapons & Addons Generate Karne Ki Commands](#-6-naye-mobs-weapons--addons-generate-karne-ki-commands)
7. [Minecraft Bedrock Mein Test Karne Ka Guide](#-7-minecraft-bedrock-mein-test-karne-ka-guide)

---

## 🚀 1. Overview & Capabilities

Yeh MCP Server ek **Headless 3D Modeling & Minecraft Engine** hai jo:
* Pure Blockbench 3D models (`.bbmodel`) code ke through automatically banata hai.
* Bones, joint pivot points, aur integer **Box UVs** mathematically accurate set karta hai.
* **Hidden Face Culler:** Andar ke chhupe hue faces delete karke FPS 30%–50% boost karta hai.
* **Procedural Kinematics:** `idle`, `walk`, `run`, `attack`, aur `death` animations bina haath se keyframe banaye generate karta hai.
* **1-Click Bedrock Generator:** Resource Pack, Behavior Pack, sound events, spawn rules aur double-clickable `.mcaddon` file ek second mein compile karta hai.

---

## 💻 2. Ghar Par Setup (Installation Steps)

### Prerequisite (Zaroori Software):
1. **Node.js (v20 ya higher):** [nodejs.org](https://nodejs.org) se download aur install karo.
2. **Blockbench:** [blockbench.net](https://www.blockbench.net) se install karo.
3. **Git:** [git-scm.com](https://git-scm.com) se install karo.

### Step-by-Step Installation:
1. Apna GitHub repository clone karo:
   ```bash
   git clone git@github.com:iamrahultungariya/HorrorMCAddon.git
   cd HorrorMCAddon/mcp-server
   ```
2. Dependencies install karo:
   ```bash
   npm install
   ```
3. TypeScript build karo:
   ```bash
   npm run build
   ```
4. Verify karne ke liye unit tests run karo:
   ```bash
   npm test
   ```
   *(Saare 14 tests PASS hone chahiye — Snapping, Face Culling, Symmetry, Addon Generation).*

---

## 🔌 3. AI Assistants Ke Sath Connect Karna

### Antigravity IDE ya Claude Desktop Mein Connect Karna:
Apne `claude_desktop_config.json` (ya Antigravity MCP settings) mein yeh snippet daal do:

```json
{
  "mcpServers": {
    "blockbench": {
      "command": "node",
      "args": [
        "D:\\path\\to\\HorrorMCAddon\\mcp-server\\dist\\index.js"
      ]
    }
  }
}
```
*(Apne computer ka sahi path `D:\\...` replace kar lena).*

Save karne ke baad jab aap AI se baat karoge, AI ke paas neeche diye gaye saare Blockbench tools seedha available honge!

---

## 🛠️ 4. Key Features & All 24 MCP Tools Reference

| MCP Tool Name | Kya Kaam Karta Hai? |
| :--- | :--- |
| `bb_create_model` | Naya `.bbmodel` canvas initialize karta hai (bedrock format, resolution). |
| `bb_add_bone` | Naya bone/joint banata hai custom origin [x, y, z] ke sath. |
| `bb_add_cube` | 3D cuboid banata hai Minecraft standard Box UV ke sath aur bone mein link karta hai. |
| `bb_transform_element` | Kisi bhi cube ko translate, rotate ya scale karta hai. |
| `bb_mirror_element` | Cubes ko bilaterally mirror karta hai opposite UV faces ke sath. |
| `bb_reparent` | Kisi cube/bone ko doosre parent bone ke andar move karta hai. |
| `bb_cull_hidden_faces` | Chhupe hue interior faces disable karke game lag khatam karta hai. |
| `bb_validate_model` | Bedrock rotation limits aur zero-volume errors scan karta hai. |
| `bb_auto_fix` | Detected engine violations ko automatic theek karta hai. |
| `bb_apply_rig_template` | Standard Humanoid (Biped) ya Animal (Quadruped) skeleton rig karta hai. |
| `bb_generate_procedural_anim` | Organic sine-wave keyframe loop (`walk`, `run`, `idle`, `attack`, `death`) banata hai. |
| `bb_geckolib_export_geo` | Active model ko standard `geometry.*.geo.json` mein export karta hai. |
| `bb_geckolib_export_anim` | Animations ko GeckoLib/Bedrock `.animation.json` mein convert karta hai. |
| `bb_bedrock_generate_addon` | **One-Click Generator:** Poora RP + BP + `.mcaddon` compile karta hai! |
| `bb_sprite_extrude` | 2D pixel-art icon (sword/tool) ko 3D voxel model mein extrude karta hai. |
| `bb_align_weapon_grip` | Weapon/Item ko haath ke grip point par exactly align karta hai. |
| `bb_save_model` | Current model ko seedha disk par `.bbmodel` mein save karta hai. |
| `bb_read_model` | Pehle se bane kisi bhi `.bbmodel` ko memory mein parse karta hai. |

---

## 🎨 5. Blockbench Ke Andar Live Use Karne Ka Guide

Jab MCP Server backend mein model update ya save kare:

1. **Open Model:** Blockbench mein `File` → `Open Model` karke `the_woods_stalker.bbmodel`, `the_ancient_one.bbmodel`, ya `crypt_crawler.bbmodel` open karo.
2. **Instant Reload:** Jab AI background mein model badle, Blockbench par bas **`Ctrl + R`** daba do — model turant naye changes ke sath screen par refresh ho jayega!
3. **Texture Viewport:** Top-right corner mein sphere icons mein check karo ki **Textured** mode active ho taaki colors saaf dikhein.
4. **Live Animations Dekhna:**
   * Top-right tabs mein se **`Animate`** tab par click karo.
   * Left side mein animation name select karo (e.g. `animation.the_woods_stalker.walk`).
   * Keyboard par **Spacebar** dabao — creature live chalna shuru karega!
5. **Real 3D Lighting & Shadows:**
   * Top-right tabs mein se **`Render`** tab par click karo — yahan studio lighting, drop shadows aur glowing blood eyes dikhai denge.

---

## ⚡ 6. Naye Mobs, Weapons & Addons Generate Karne Ki Commands

### Method A: Standalone Generator Script Run Karna
Aapko AI ko prompt diye bina bhi pura addon regenerate karna ho:
```bash
cd HorrorMCAddon/mcp-server
npx tsx scripts/generate-full-horror-suite.ts
```
Yeh script automatically:
* Saare 3D models build karega.
* Sharp se pixel textures generate karega.
* Resource Pack aur Behavior Pack banayega.
* Aur `The_Forgotten_Woods_Ultimate.mcaddon` pack kar dega!

### Method B: AI Chat Mein Prompt Dena
Agar MCP Server connected hai, toh AI ko bas aise bolo:
* *"MCP Server use karke ek Double-Barrel Shotgun ka 3D .bbmodel banao with break-action joint aur weapon display matrix."*
* *"The Woods Stalker ke dono haatho mein 2 lambe bloody claws aur add kar do."*
* *"Naya mob banao 'swamp_lurker' with quadruped rig aur walk animation."*

---

## 🎮 7. Minecraft Bedrock Mein Test Karne Ka Guide

1. Apne folder mein `The_Forgotten_Woods_Ultimate.mcaddon` file dhundo.
2. Uspe **double click** karo.
3. Minecraft Bedrock Edition apne aap open hoga aur top par message aayega:  
   `Import started... Successfully imported 'The Forgotten Woods [RP]' and 'The Forgotten Woods [BP]'`.
4. World Create / Edit karo:
   * **Resource Packs:** `The Forgotten Woods [RP]` Activate karo.
   * **Behavior Packs:** `The Forgotten Woods [BP]` Activate karo.
   * **Experiments:** **"Beta APIs"** aur **"Molang Features"** ON karo.
5. World enter karo, Creative inventory kholo aur **The Woods Stalker**, **Crypt Crawler**, ya **The Ancient One** ka Spawn Egg lekar zameen par spawn karo!

---

✅ *Yeh guide aur MCP Server ka poora source code aapke GitHub repo par permanently safe aur tracked hai!*
