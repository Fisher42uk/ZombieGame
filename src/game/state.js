import * as THREE from 'three';
import { WEAPONS, WONDER_KEYS, SECRET_WEAPON_KEYS, BOSS_WEAPON_KEYS } from '../data/weapons.js';
import { ACHIEVEMENTS, loadAchievementProgress, resetAchievementProgress } from '../data/achievements.js';

export const mysteryBoxPos = new THREE.Vector3(-9, 0, -6);
export const papPos = new THREE.Vector3(9, 0, -6);
export const perkStations = [
    { key: 'juggernog', name: 'Juggernog (250 HP)', cost: 2500, color: 0xef4444, pos: new THREE.Vector3(-18, 0, -14) },
    { key: 'speedcola', name: 'Speed Cola (Fast Reload)', cost: 3000, color: 0x22c55e, pos: new THREE.Vector3(18, 0, -14) },
    { key: 'doubletap', name: 'Double Tap (1.5x DMG)', cost: 2000, color: 0xf59e0b, pos: new THREE.Vector3(-18, 0, 14) },
    { key: 'staminup', name: 'Stamin-Up (Fast Sprint)', cost: 2000, color: 0x38bdf8, pos: new THREE.Vector3(18, 0, 14) }
];

export const state = {
    defeatedBosses: {},
    unlockedAchievements: {},
    mysteryBoxUnlocks: {},
    mapSecretUnlocks: {},
    chocolateGunUnlocked: false,
    sandwichUnlocked: false,

    currentMapKey: 'christmas',
    activeWeaponKey: 'm1911',
    unlockedWeapons: {},
    packedWeapons: {},

    score: 1500,
    health: 100,
    maxHealth: 100,
    wave: 1,
    zombiesRemainingToSpawn: 6,
    zombies: [],
    projectiles: [],
    bossProjectiles: [],
    shockwaveRings: [],
    bossLootCrates: [],
    summonedDragons: [],
    laserBeams: [],
    mapColliders: [],

    activeBoss: null,
    activeMiniBoss: null,
    jeffCow: null,
    hiddenMapSecretPassage: null,
    returnPortalMesh: null,
    previousMapBeforeSecretArena: 'medieval_castle',
    activeSecretArenaConfig: null,
    pendingBossTimer: null,

    currentAmmo: 8,
    reserveAmmo: 64,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 1.2,
    lastShotTime: 0,
    lastDamageTime: 0,
    lastDragonSummonTime: -10000,
    isPlaying: false,
    isPaused: false,
    pauseStartTime: 0,
    pendingMapSelection: 'christmas',
    autoFireEnabled: false,
    touchFireHeld: false,
    touchHudVisible: true,

    perks: {
        juggernog: false,
        speedcola: false,
        doubletap: false,
        staminup: false
    },

    playerPos: new THREE.Vector3(0, 1.7, 14),
    playerVel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    canJump: true,
    moveState: { forward: false, backward: false, left: false, right: false, sprint: false },
    joyVec: { x: 0, y: 0 },
    lookJoyVec: { x: 0, y: 0 },

    weaponAnimParts: [],
    muzzleFlashMesh: null,
    muzzleLight: null
};

export function loadPersistedProgress() {
    try {
        state.defeatedBosses = JSON.parse(localStorage.getItem('cod_zombies_bosses_v3') || '{}');
        state.unlockedAchievements = JSON.parse(localStorage.getItem('cod_zombies_ach_v3') || '{}');
        state.mysteryBoxUnlocks = JSON.parse(localStorage.getItem('cod_zombies_box_v3') || '{}');
        state.mapSecretUnlocks = JSON.parse(localStorage.getItem('cod_zombies_secrets_v3') || '{}');
        state.chocolateGunUnlocked = localStorage.getItem('cod_zombies_choc_v3') === 'true';
        state.sandwichUnlocked = localStorage.getItem('cod_zombies_sandwich_v3') === 'true';
    } catch (e) {}
    loadAchievementProgress(state.unlockedAchievements);
    syncWeaponUnlocks();
}

export function syncWeaponUnlocks() {
    WONDER_KEYS.forEach(k => {
        state.unlockedWeapons[k] = k === 'm1911' ? true : !!state.mysteryBoxUnlocks[k];
    });
    SECRET_WEAPON_KEYS.forEach(k => {
        if (k === 'chocolate_gun') {
            state.unlockedWeapons[k] = state.chocolateGunUnlocked;
        } else if (k === 'sandwich') {
            state.unlockedWeapons[k] = state.sandwichUnlocked;
        } else {
            state.unlockedWeapons[k] = !!state.mapSecretUnlocks[k];
        }
    });
    BOSS_WEAPON_KEYS.forEach(k => {
        const bMap = WEAPONS[k].bossMap;
        state.unlockedWeapons[k] = !!state.defeatedBosses[bMap];
    });
    state.unlockedWeapons.ach_highland_bfg = Object.keys(ACHIEVEMENTS).every(k => state.unlockedAchievements[k]);
}

export function clearAllPersistedUnlocks() {
    state.defeatedBosses = {};
    state.unlockedAchievements = {};
    state.mysteryBoxUnlocks = {};
    state.mapSecretUnlocks = {};
    state.chocolateGunUnlocked = false;
    state.sandwichUnlocked = false;
    resetAchievementProgress(false);
    try {
        localStorage.removeItem('cod_zombies_bosses_v3');
        localStorage.removeItem('cod_zombies_ach_v3');
        localStorage.removeItem('cod_zombies_box_v3');
        localStorage.removeItem('cod_zombies_secrets_v3');
        localStorage.removeItem('cod_zombies_choc_v3');
        localStorage.removeItem('cod_zombies_sandwich_v3');
    } catch (e) {}
    syncWeaponUnlocks();
}

export function resetInputState() {
    state.touchFireHeld = false;
    state.moveState.forward = false;
    state.moveState.backward = false;
    state.moveState.left = false;
    state.moveState.right = false;
    state.moveState.sprint = false;
    state.joyVec.x = 0;
    state.joyVec.y = 0;
    state.lookJoyVec.x = 0;
    state.lookJoyVec.y = 0;
}
