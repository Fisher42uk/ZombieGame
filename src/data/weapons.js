export const WEAPONS = {
    m1911: { name: 'M1911 Starting Pistol', packedName: 'Mustang & Sally', ammo: 8, reserve: 64, maxAmmo: 8, damage: 110, fireRate: 210, type: 'm1911', desc: 'Classic sidearm. Pack-a-Punch upgrades it into explosive shells!' },
    raygun: { name: 'Ray Gun', packedName: "Porter's X2 Ray Gun", ammo: 20, reserve: 160, maxAmmo: 20, damage: 950, fireRate: 260, type: 'raygun', desc: 'Iconic atomic plasma blaster with splash damage.' },
    raygun_mk2: { name: 'Ray Gun Mark II', packedName: "Porter's Mark II Ray Gun", ammo: 21, reserve: 168, maxAmmo: 21, damage: 1250, fireRate: 190, type: 'raygun_mk2', desc: 'High-velocity 3-round laser burst Wonder Weapon.' },
    thundergun: { name: 'Thundergun', packedName: 'Zeus Cannon', ammo: 4, reserve: 24, maxAmmo: 4, damage: 2800, fireRate: 750, type: 'thundergun', desc: 'Blasts a massive shockwave cone that ragdolls every zombie in front of you.' },
    wunderwaffe: { name: 'Wunderwaffe DG-2', packedName: 'Wunderwaffe DG-3 JZ', ammo: 3, reserve: 24, maxAmmo: 3, damage: 2400, fireRate: 680, type: 'wunderwaffe', desc: 'Fires high-voltage Tesla arcs that chain between nearby zombies.' },
    apothicon: { name: 'Apothicon Servant', packedName: 'Estoom-Oth', ammo: 2, reserve: 14, maxAmmo: 2, damage: 3000, fireRate: 900, type: 'apothicon', desc: 'Spawns a roaming purple black-hole vortex that devours hordes.' },
    blundergat: { name: 'Blundergat', packedName: 'The Sweeper', ammo: 2, reserve: 40, maxAmmo: 2, damage: 1950, fireRate: 420, type: 'blundergat', desc: 'Quad-barrel rotary blunderbuss with devastating pellet spread.' },
    sliquifier: { name: 'Sliquifier', packedName: 'Slurper 9000', ammo: 10, reserve: 50, maxAmmo: 10, damage: 1450, fireRate: 330, type: 'sliquifier', desc: 'Bio-sludge launcher that triggers chain-reaction purple goo pops.' },
    winter: { name: "Winter's Howl", packedName: "Winter's Fury", ammo: 6, reserve: 36, maxAmmo: 6, damage: 1350, fireRate: 340, type: 'winter', desc: 'Sub-zero cryo whirlwind pistol that freezes and shatters zombies.' },
    babygun: { name: '31-79 JGb215 (Baby Gun)', packedName: 'The Fractalizer', ammo: 5, reserve: 25, maxAmmo: 5, damage: 1650, fireRate: 520, type: 'babygun', desc: 'Shrinks derpy zombies into tiny squeaky mini-zombies!' },
    wavegun: { name: 'Wave Gun', packedName: 'Max Wave Gun', ammo: 12, reserve: 60, maxAmmo: 12, damage: 1850, fireRate: 350, type: 'wavegun', desc: 'Microwave beam that inflates zombies like balloons until they pop!' },
    staff_ice: { name: 'Staff of Ice (Ull’s Arrow)', packedName: 'Kimất’s Bite', ammo: 9, reserve: 54, maxAmmo: 9, damage: 2100, fireRate: 400, type: 'staff_ice', desc: 'Ancient elemental staff that summons freezing glacial storms.' },
    scavenger: { name: 'The Scavenger', packedName: 'Hyena Infra-Dead', ammo: 6, reserve: 36, maxAmmo: 6, damage: 2600, fireRate: 550, type: 'scavenger', desc: 'Thermite sniper rifle that detonates with a massive fiery shockwave.' },

    // 17 Map Secret Weapons
    sandwich: { name: 'The Sandwich 🥪', packedName: 'Footlong Club Sub 🥪', ammo: 10, reserve: 90, maxAmmo: 10, damage: 100, fireRate: 240, type: 'sandwich', isSecretWeapon: true, secretMap: 'bunker', desc: '🥪 SECRET (1. Nacht Der Derp): Find in Bunker & defeat The Sandwich Guard (1,000 HP)! Pack-a-Punch boosts damage!' },
    secret_popcorn: { name: 'Butter-Blast Popcorn Cannon 🍿', packedName: 'IMAX Caramel Corn Howitzer 🍿', ammo: 16, reserve: 112, maxAmmo: 16, damage: 2150, fireRate: 220, type: 'secret_popcorn', isSecretWeapon: true, secretMap: 'theater', spreadCount: 4, projColor: 0xfef08a, desc: '🍿 SECRET (2. Kino Der Goofy): Hidden behind the Concession Nook! Fires a 4-way barrage of exploding buttered popcorn kernels!' },
    secret_snowball: { name: 'Yellow-Snow Slingshot ☃️', packedName: 'Abominable Blizzard Catapult ❄️', ammo: 12, reserve: 84, maxAmmo: 12, damage: 2250, fireRate: 260, type: 'secret_snowball', isSecretWeapon: true, secretMap: 'castle', projColor: 0x67e8f9, desc: '☃️ SECRET (3. Derp Eisendrache): Hidden in the Frost Alcove! Launches high-velocity cryo-snowballs that freeze & shatter zombies!' },
    secret_cheese: { name: 'Moon-Cheese Fondue Blaster 🧀', packedName: 'Apollo Cheddar Super-Melter 🧀', ammo: 18, reserve: 108, maxAmmo: 18, damage: 2300, fireRate: 210, type: 'secret_cheese', isSecretWeapon: true, secretMap: 'moon', spreadCount: 3, projColor: 0xfacc15, desc: '🧀 SECRET (4. Moon Base Alpha): Hidden in the Lunar Crater Nook! Fires molten anti-gravity Swiss cheese globs!' },
    secret_hot_sauce: { name: 'Ghost-Pepper Scoville Sprayer 🌶️', packedName: 'Carolina Reaper Magma-Jet 🔥', ammo: 20, reserve: 120, maxAmmo: 20, damage: 2350, fireRate: 185, type: 'secret_hot_sauce', isSecretWeapon: true, secretMap: 'lava', spreadCount: 3, projColor: 0xff3300, desc: '🌶️ SECRET (5. Lava Core Facility): Hidden in the Geothermal Alcove! Sprays 5,000,000-Scoville incendiary pepper blasts!' },
    secret_banjo: { name: 'Bayou Electric Banjo-Blaster 🪕', packedName: 'Swamp-Shredder 9000 🎶', ammo: 14, reserve: 98, maxAmmo: 14, damage: 2400, fireRate: 240, type: 'secret_banjo', isSecretWeapon: true, secretMap: 'swamp', projColor: 0x4ade80, desc: '🪕 SECRET (6. Shi No Goof): Hidden in the Bog Shanty Nook! Strums supersonic twang shockwaves that shred swamp hordes!' },
    secret_soap: { name: 'Prisoner’s Slip-Soap Launcher 🧼', packedName: 'Maximum Security Suds-Cannon 🫧', ammo: 14, reserve: 84, maxAmmo: 14, damage: 2300, fireRate: 250, type: 'secret_soap', isSecretWeapon: true, secretMap: 'prison', spreadCount: 3, projColor: 0x93c5fd, desc: '🧼 SECRET (7. Mob of the Derp): Hidden in the Cellblock Shower Nook! Fires explosive sudsy soap bars!' },
    secret_shovel: { name: 'Golden Dig-Site Shovel Launcher ⛏️', packedName: 'Excavator Prime Trench-Spade 💎', ammo: 10, reserve: 70, maxAmmo: 10, damage: 2650, fireRate: 320, type: 'secret_shovel', isSecretWeapon: true, secretMap: 'trenches', projColor: 0x60a5fa, desc: '⛏️ SECRET (8. Origins of Derp): Hidden in the Muddy Trench Nook! Hurls spinning golden excavation spades!' },
    chocolate_gun: { name: 'Wonka Fudge-Blaster 3000 🍫', packedName: 'Golden Ticket Cocoa-Nuke', ammo: 15, reserve: 90, maxAmmo: 15, damage: 2750, fireRate: 250, type: 'chocolate_gun', isSecretWeapon: true, secretMap: 'jungle', spreadCount: 3, projColor: 0xd97706, desc: '🍫 SECRET (9. Shangri-La-La): Defeat The Grand Fudge-Golem in the Hidden Cocoa Arena! Fires 3-way exploding fudge truffles!' },
    secret_pufferfish: { name: 'Spiky Pufferfish Launcher 🐡', packedName: 'Mariana Trench Blowfish-Bomb 🌊', ammo: 12, reserve: 72, maxAmmo: 12, damage: 2550, fireRate: 280, type: 'secret_pufferfish', isSecretWeapon: true, secretMap: 'atlantis', spreadCount: 3, projColor: 0x2dd4bf, desc: '🐡 SECRET (10. Sunken Atlantis): Hidden in the Coral Reef Nook! Launches inflating bio-electric pufferfish!' },
    secret_floppy: { name: '5.25" Floppy-Disk Shredder 💾', packedName: 'Y2K Malware Overdrive Disc 💻', ammo: 20, reserve: 140, maxAmmo: 20, damage: 2450, fireRate: 190, type: 'secret_floppy', isSecretWeapon: true, secretMap: 'cyber', spreadCount: 3, projColor: 0xf43f5e, desc: '💾 SECRET (11. Neon Cyber-Grid): Hidden in the Server Backdoor Nook! Rapid-fires razor-sharp neon floppy disks!' },
    secret_scarab: { name: 'Golden Scarab Swarm-Hive 🪲', packedName: 'Plague of the Ten Dynasty ⚱️', ammo: 15, reserve: 90, maxAmmo: 15, damage: 2500, fireRate: 230, type: 'secret_scarab', isSecretWeapon: true, secretMap: 'egypt', spreadCount: 4, projColor: 0xfacc15, desc: '🪲 SECRET (12. Cursed Pyramid): Hidden in the Sarcophagus Nook! Unleashes a 4-way swarm of devouring golden scarabs!' },
    secret_balloon: { name: 'Twisted Balloon-Poodle Bazooka 🎈', packedName: 'Helium Carnival Mega-Popper 🎉', ammo: 10, reserve: 60, maxAmmo: 10, damage: 2700, fireRate: 340, type: 'secret_balloon', isSecretWeapon: true, secretMap: 'carnival', projColor: 0xf472b6, desc: '🎈 SECRET (13. Clown Carnival): Hidden behind the Freakshow Tent! Fires volatile helium balloon poodles that pop with confetti shockwaves!' },
    secret_cactus: { name: 'Prickly Saguaro Needle-Gatling 🌵', packedName: 'Mojave Desert Spike-Storm 🤠', ammo: 24, reserve: 144, maxAmmo: 24, damage: 2150, fireRate: 160, type: 'secret_cactus', isSecretWeapon: true, secretMap: 'western', spreadCount: 4, projColor: 0x22c55e, desc: '🌵 SECRET (14. Buried Ghost Town): Hidden behind the Saloon Outhouse! Fires a 4-way volley of explosive cactus needles!' },
    secret_tentacle: { name: 'Eldritch Tickle-Tentacle Whip 🐙', packedName: 'Cthulhu’s Astral Slap-Cannon 👁️', ammo: 12, reserve: 84, maxAmmo: 12, damage: 2850, fireRate: 260, type: 'secret_tentacle', isSecretWeapon: true, secretMap: 'aether', spreadCount: 3, projColor: 0xc084fc, desc: '🐙 SECRET (15. Dark Aether Void): Hidden in the Void Rift Nook! Lashes cosmic Aether bolts that implode on contact!' },
    secret_holy_grenade: { name: 'Holy Hand-Grenade Slingshot 💣✨', packedName: 'Sacred Lobber of Antioch 👑', ammo: 8, reserve: 56, maxAmmo: 8, damage: 3100, fireRate: 420, type: 'secret_holy_grenade', isSecretWeapon: true, secretMap: 'medieval_castle', projColor: 0xfde047, desc: '💣✨ SECRET (16. Camelot Keep): Hidden in the Royal Armory Nook! Counts to Three and lobs divine golden hand-grenades!' },
    secret_rudolph_laser: { name: 'Rudolph the Red-Nose Gun 🦌🔴', packedName: "Santa's Guiding Mega-Laser 🦌✨", ammo: 40, reserve: 240, maxAmmo: 40, damage: 2000, fireRate: 95, type: 'secret_rudolph_laser', isSecretWeapon: true, secretMap: 'christmas', projColor: 0xff0000, desc: "🦌🔴 SECRET (17. Santa's Slay-Workshop): Shoots a consistent crimson red laser beam from Rudolph's glowing nose that melts straight through enemies!" },

    // 17 Mythic Boss Special Weapons
    boss_siren: { name: 'Siren Shock-Cannon', packedName: 'Goof-mergency Broadcast System', ammo: 8, reserve: 48, maxAmmo: 8, damage: 2400, fireRate: 420, type: 'boss_siren', isBossWeapon: true, bossMap: 'bunker', desc: 'Fires oscillating red/blue sonic siren shockwaves.' },
    boss_reel: { name: "Director's Reel Cannon", packedName: "Director's Final Cut 4K", ammo: 10, reserve: 60, maxAmmo: 10, damage: 2350, fireRate: 310, type: 'boss_reel', isBossWeapon: true, bossMap: 'theater', desc: 'Launches spinning golden razor film reels.' },
    boss_cryo: { name: 'Panzer Cryo-Hammer', packedName: 'Absolute Zero Juggernaut', ammo: 6, reserve: 36, maxAmmo: 6, damage: 2650, fireRate: 520, type: 'boss_cryo', isBossWeapon: true, bossMap: 'castle', desc: 'Hurls heavy cryo-hammers that erupt into Frost Nova rings.' },
    boss_cosmic: { name: 'Cosmic Ring Disruptor', packedName: 'Big Bang Supernova Core', ammo: 7, reserve: 42, maxAmmo: 7, damage: 2750, fireRate: 460, type: 'boss_cosmic', isBossWeapon: true, bossMap: 'moon', desc: 'Fires orbital plasma rings that pull zombies into zero-G singularities.' },
    boss_meteor: { name: 'Ignis Meteor Launcher', packedName: 'Cataclysmic Tectonic Eruptor', ammo: 6, reserve: 36, maxAmmo: 6, damage: 2900, fireRate: 560, type: 'boss_meteor', isBossWeapon: true, bossMap: 'lava', desc: 'Unleashes a volcanic meteor swarm that scorches the battlefield.' },
    boss_swamp: { name: 'Croco Sludge-Belcher', packedName: 'Bio-Swamp Leviathan Maw', ammo: 10, reserve: 60, maxAmmo: 10, damage: 2450, fireRate: 330, type: 'boss_swamp', isBossWeapon: true, bossMap: 'swamp', desc: 'Spits radioactive bog sludge that melts entire zombie packs.' },
    boss_prison: { name: "Warden's Hell-Key Gatling", packedName: 'Alcatraz Soul-Reaper', ammo: 24, reserve: 144, maxAmmo: 24, damage: 1950, fireRate: 165, type: 'boss_prison', isBossWeapon: true, bossMap: 'prison', desc: 'Rapid-fire flaming Hell-Key rotary cannon.' },
    boss_trenches: { name: "Odin's Siege Fist", packedName: 'Thor’s Mjolnir Buster', ammo: 5, reserve: 30, maxAmmo: 5, damage: 3100, fireRate: 620, type: 'boss_trenches', isBossWeapon: true, bossMap: 'trenches', desc: 'Launches giant mechanical titan fists with seismic shockwaves.' },
    boss_jungle: { name: 'Totem Sun-Blowgun', packedName: 'Eclipse of Shangri-La', ammo: 14, reserve: 84, maxAmmo: 14, damage: 2300, fireRate: 240, type: 'boss_jungle', isBossWeapon: true, bossMap: 'jungle', desc: 'Fires solar-charged emerald darts that detonate in golden light.' },
    boss_atlantis: { name: 'Poseidon Trident Cannon', packedName: 'Kraken Maelstrom Sovereign', ammo: 8, reserve: 48, maxAmmo: 8, damage: 2650, fireRate: 380, type: 'boss_atlantis', isBossWeapon: true, bossMap: 'atlantis', desc: 'Shoots abyssal plasma tridents that summon tidal whirlpools.' },
    boss_cyber: { name: 'Glitch-Matrix Railgun', packedName: 'Root-Access Overclock 9999', ammo: 9, reserve: 54, maxAmmo: 9, damage: 2800, fireRate: 340, type: 'boss_cyber', isBossWeapon: true, bossMap: 'cyber', desc: 'Deletes zombies with synthwave neon rail-beams.' },
    boss_egypt: { name: 'Ankh of Ra Staff', packedName: 'Scepter of Osiris', ammo: 8, reserve: 48, maxAmmo: 8, damage: 2700, fireRate: 410, type: 'boss_egypt', isBossWeapon: true, bossMap: 'egypt', desc: 'Calls down golden solar beams of Ra.' },
    boss_carnival: { name: 'Bozo Pie-Zooka', packedName: 'Three-Ring Circus Nuclear Pie', ammo: 6, reserve: 36, maxAmmo: 6, damage: 2600, fireRate: 480, type: 'boss_carnival', isBossWeapon: true, bossMap: 'carnival', desc: 'Fires volatile custard pies that explode into rainbow confetti.' },
    boss_western: { name: 'Dead-Eye Peacemaker', packedName: 'High-Noon Ghost Rider', ammo: 6, reserve: 48, maxAmmo: 6, damage: 2550, fireRate: 260, type: 'boss_western', isBossWeapon: true, bossMap: 'western', desc: '6-shot explosive dynamite revolver.' },
    boss_aether: { name: 'Harbinger Void-Scythe', packedName: 'Apothicon Omni-Reaper', ammo: 6, reserve: 36, maxAmmo: 6, damage: 3250, fireRate: 600, type: 'boss_aether', isBossWeapon: true, bossMap: 'aether', desc: 'Slashes dimensional Dark Aether rifts.' },
    boss_knight_sword: {
        name: 'Dragon-Slayer Greatsword ⚔️',
        packedName: 'Excalibur of the Dragon-Lord 🐉',
        ammo: 12,
        reserve: 72,
        maxAmmo: 12,
        damage: 2950,
        fireRate: 330,
        type: 'boss_knight_sword',
        isBossWeapon: true,
        bossMap: 'medieval_castle',
        desc: '⚔️🐉 CAMELOT KEEP MYTHIC SWORD: Fires a piercing Straight-Cut energy wave [FIRE] & summons a Fire-Breathing Dragon on Secondary Ability [C / Right-Click / 🐉 Button]!'
    },
    boss_candy_cane: {
        name: 'Peppermint Candy-Cane Gun 🍬',
        packedName: "St. Nick's North-Pole Mint-Shredder 🎄",
        ammo: 16,
        reserve: 112,
        maxAmmo: 16,
        damage: 2850,
        fireRate: 240,
        type: 'boss_candy_cane',
        isBossWeapon: true,
        bossMap: 'christmas',
        projColor: 0xef4444,
        desc: "🍬🎄 CHRISTMAS BOSS WEAPON: Shoots spinning red-and-white striped 3D Candy Canes that impale zombies and shatter into festive peppermint explosions!"
    },

    // Transcendent Achievement Special Weapon
    ach_highland_bfg: {
        name: 'Golden Highland BFG-9999 🐮🏆',
        packedName: 'Omnipotent Jeff Supernova Cannon',
        ammo: 10,
        reserve: 80,
        maxAmmo: 10,
        damage: 5000,
        fireRate: 380,
        type: 'ach_highland_bfg',
        isAchievementWeapon: true,
        desc: '🏆 5/5 ACHIEVEMENT REWARD: Fires Golden Supernova Orbs, chains emerald lightning to all nearby zombies, and unleashes a mighty Highland MOO!'
    }
};

export const WONDER_KEYS = [
    'm1911', 'raygun', 'raygun_mk2', 'thundergun', 'wunderwaffe',
    'apothicon', 'blundergat', 'sliquifier', 'winter', 'babygun', 'wavegun',
    'staff_ice', 'scavenger'
];

export const SECRET_WEAPON_KEYS = [
    'sandwich', 'secret_popcorn', 'secret_snowball', 'secret_cheese',
    'secret_hot_sauce', 'secret_banjo', 'secret_soap', 'secret_shovel',
    'chocolate_gun', 'secret_pufferfish', 'secret_floppy', 'secret_scarab',
    'secret_balloon', 'secret_cactus', 'secret_tentacle', 'secret_holy_grenade',
    'secret_rudolph_laser'
];

export const BOSS_WEAPON_KEYS = [
    'boss_siren', 'boss_reel', 'boss_cryo', 'boss_cosmic', 'boss_meteor',
    'boss_swamp', 'boss_prison', 'boss_trenches', 'boss_jungle', 'boss_atlantis',
    'boss_cyber', 'boss_egypt', 'boss_carnival', 'boss_western', 'boss_aether',
    'boss_knight_sword', 'boss_candy_cane'
];
