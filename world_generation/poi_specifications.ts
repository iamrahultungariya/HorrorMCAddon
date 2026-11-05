/**
 * The Forgotten Woods — 10 POI Structure & World Placement Specification
 * 
 * Target Canvas: 1,000 x 1,000 Blocks
 * Ocean Boundary: X: 0..100, X: 900..1000, Z: 0..100, Z: 900..1000
 * Coordinates are 1-based Minecraft World X, Y, Z coordinates.
 */

export interface PointOfInterest {
  id: string;
  name: string;
  coords: { x: number; y: number; z: number };
  radius: number;
  biome: string;
  atmosphere: string;
  coreElements: string[];
  lootTable: string[];
}

export const FORGOTTEN_WOODS_POIS: PointOfInterest[] = [
  {
    id: 'spawn_bridge',
    name: '1. Spawning Point & River Bridge',
    coords: { x: 500, y: 68, z: 850 },
    radius: 35,
    biome: 'haunted_forest',
    atmosphere: 'Faint soul lanterns flickering in dense blue mist; distant howling',
    coreElements: [
      'Weathered Cobblestone Bridge across dark river',
      'Blood Skull Warning Totem at trail entrance',
      'Soul Lantern on rusted chain',
      'Old wooden crate with Starter Note & Walkie-Talkie item'
    ],
    lootTable: ['forgotten_woods:stone_pebble', 'minecraft:torch', 'forgotten_woods:forgotten_lantern']
  },
  {
    id: 'abandoned_cabin',
    name: '2. Abandoned Cabin (Safehouse)',
    coords: { x: 500, y: 72, z: 500 },
    radius: 40,
    biome: 'dense_dark_forest',
    atmosphere: 'Wind howling through shattered windows; creaking floorboards; oppressive silence',
    coreElements: [
      '2-Story Decayed Wooden Lodge with Boarded-up Windows',
      'Flooded Basement with 2 Electrical Fuse Boxes (Slowness water)',
      'Grandfather Clock chime trigger in central foyer',
      'Headless Shifting Mannequin in upper hallway',
      'Safehouse Hiding Wardrobe in master bedroom',
      'Worktable to craft shotgun shells'
    ],
    lootTable: ['forgotten_woods:glass_bottle', 'forgotten_woods:shotgun_shell', 'minecraft:iron_ingot']
  },
  {
    id: 'ruined_village',
    name: '3. Ruined Village',
    coords: { x: 750, y: 69, z: 750 },
    radius: 55,
    biome: 'decayed_plains',
    atmosphere: 'Torn curtains flapping; rusted iron hinges squeaking; bloodstains on cobblestone',
    coreElements: [
      '5 Collapsed Timber Cottages with rusted chests',
      'Cursed Church Belfry with swinging brass bell',
      'Desiccated villager remains with notes',
      'Hiding Wardrobes inside 2 cottages'
    ],
    lootTable: ['forgotten_woods:stone_pebble', 'forgotten_woods:glass_bottle', 'minecraft:bread']
  },
  {
    id: 'graveyard_crypts',
    name: '4. Graveyard & Catacombs',
    coords: { x: 300, y: 69, z: 650 },
    radius: 50,
    biome: 'mossy_graveyard',
    atmosphere: 'Thick choking ground fog; crows taking flight; stone statues that freeze when watched',
    coreElements: [
      '18 Weathered Granite Tombstones & Broken Mausoleums',
      'The Weeping Wraith (Statue AI freezes in sight angle, stalks when back is turned)',
      'Collapsing Grave trapdoor block dropping player into submerged coffin crypt',
      'Underground Catacombs leading to Cursed Ruins'
    ],
    lootTable: ['minecraft:bone', 'forgotten_woods:stone_pebble', 'minecraft:iron_sword']
  },
  {
    id: 'sunken_swamp',
    name: '5. Sunken Swamp & Witch Lair',
    coords: { x: 700, y: 63, z: 500 },
    radius: 60,
    biome: 'murky_swamp',
    atmosphere: '15-meter thick green volumetric fog; squelching mud; bubbling toxic waters',
    coreElements: [
      'Submerged Decayed Witch Stilt Hut',
      'Waist-deep muck water that alerts Crypt Crawlers on splashing',
      'Sunken rowboat holding rusted chest with Bear Traps',
      'Cypress weeping trees draped in heavy moss'
    ],
    lootTable: ['forgotten_woods:rusty_bear_trap', 'minecraft:potion', 'forgotten_woods:glass_bottle']
  },
  {
    id: 'watchtower',
    name: '6. North-East Forest Watchtower',
    coords: { x: 850, y: 88, z: 250 },
    radius: 35,
    biome: 'elevated_ridge',
    atmosphere: 'Gale force winds whistling; vantage view over the tree canopy',
    coreElements: [
      '4-Story Weathered Stone & Iron Watchtower',
      'Radio Transmitter beacon equipment',
      'Gun Locker holding Break-Action Double-Barrel Shotgun + 4 12-Gauge Shells',
      'Rotatable Searchlight looking into dark canopy'
    ],
    lootTable: ['forgotten_woods:double_barrel_shotgun', 'forgotten_woods:shotgun_shell']
  },
  {
    id: 'cursed_ruins',
    name: '7. Cursed Ruins',
    coords: { x: 350, y: 76, z: 250 },
    radius: 45,
    biome: 'haunted_forest',
    atmosphere: 'Psychological sanity distortion; whispering stone statues; cold breeze',
    coreElements: [
      'Ancient Crumbling Stone Colonnade and Arcades',
      '1st Relic Pedestal (Ancient Moon Emblem)',
      'Stone Gargoyles guarding arched doorway',
      'Secret stone stairs descending to Dark Cave'
    ],
    lootTable: ['minecraft:golden_apple', 'forgotten_woods:glass_bottle']
  },
  {
    id: 'dark_cave_mountain',
    name: '8. Dark Cave (The Roaring Skull Mountain)',
    coords: { x: 500, y: 95, z: 100 },
    radius: 70,
    biome: 'rocky_peaks',
    atmosphere: 'Oppressive darkness; echoing sub-bass rumbling; dripping subterranean pools',
    coreElements: [
      'Towering 45-block high rocky skull facade carved into cliff face',
      'Massive Cavern Lair for The Ancient One (Colossal Elder Boss)',
      'Stalactites, magma vents and glowing red subterranean veins',
      'Final Boss Chamber triggering arena lock'
    ],
    lootTable: ['minecraft:diamond', 'forgotten_woods:shotgun_shell', 'minecraft:totem_of_undying']
  },
  {
    id: 'ritual_site',
    name: '9. Ritual Site (East Pentagram Arena)',
    coords: { x: 850, y: 70, z: 500 },
    radius: 40,
    biome: 'dark_forest',
    atmosphere: 'Pitch black sky; glowing crimson emissive ground runes; chanting whispers',
    coreElements: [
      'Emissive Blood Altar with pentagram carvings',
      'Ring of charred stone pillars with soul fire braziers',
      'Summoning pedestal requiring 3 Relics to banish the Stalker'
    ],
    lootTable: ['forgotten_woods:forgotten_lantern', 'minecraft:enchanted_golden_apple']
  },
  {
    id: 'haunted_canopy_forest',
    name: '10. The Haunted Woods (Surrounding Island Canopy)',
    coords: { x: 500, y: 70, z: 500 },
    radius: 450,
    biome: 'dense_canopy',
    atmosphere: 'Sky completely blotted out by 35-45 block tall dead pines; predator stalking behind trees',
    coreElements: [
      'Custom Tall Pine & Dead Redwood Schematics',
      'Overgrown underbrush with mud puddles and fallen logs',
      'Active hunting grounds for The Woods Stalker (Wendigo)'
    ],
    lootTable: ['forgotten_woods:stone_pebble', 'minecraft:stick']
  }
];
