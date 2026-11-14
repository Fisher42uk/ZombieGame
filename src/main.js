import * as THREE from 'three';
import { soundMgr } from './audio/soundManager.js';
import { MAPS, MAP_BOSSES, MINI_BOSS_TYPES } from './data/maps.js';
import { WEAPONS, WONDER_KEYS, SECRET_WEAPON_KEYS, BOSS_WEAPON_KEYS } from './data/weapons.js';
import { ACHIEVEMENTS, saveAchievementProgress, resetAchievementProgress } from './data/achievements.js';
import { disposeObject3D, sharedGeometries, createBillboardLabel } from './game/threeUtils.js';
import { buildMapEnvironment } from './game/mapBuilder.js';
import {
    build3DDragonMesh,
    buildWeaponModel,
    buildZombieMesh,
    buildBossMesh,
    buildMiniBossMesh
} from './game/models.js';
import {
    state,
    mysteryBoxPos,
    papPos,
    perkStations,
    loadPersistedProgress,
    syncWeaponUnlocks,
    clearAllPersistedUnlocks,
    resetInputState
} from './game/state.js';

loadPersistedProgress();

// =========================================================================
// THREE.JS SCENE, CAMERA & LIGHTING
// =========================================================================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 250);
const mapGroup = new THREE.Group();
scene.add(mapGroup);

const weaponGroup = new THREE.Group();
camera.add(weaponGroup);
scene.add(camera);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(18, 35, 22);
dirLight.castShadow = true;
scene.add(dirLight);

const centerPointLight = new THREE.PointLight(0xf97316, 1.4, 55);
centerPointLight.position.set(0, 8, 0);
scene.add(centerPointLight);

let prevTime = performance.now();
let lastZombieSpawn = 0;

function rebuildWeaponModel() {
    while (weaponGroup.children.length > 0) {
        const child = weaponGroup.children[0];
        weaponGroup.remove(child);
        disposeObject3D(child);
    }
    const built = buildWeaponModel(state.activeWeaponKey, !!state.packedWeapons[state.activeWeaponKey]);
    state.weaponAnimParts = built.animParts;
    state.muzzleFlashMesh = built.muzzleFlashMesh;
    state.muzzleLight = built.muzzleLight;
    weaponGroup.add(built.group);
}

// =========================================================================
// SPAWNING & AI
// =========================================================================
function spawnDerpyZombie() {
    const isBrute = Math.random() < 0.2;
    const isSprinter = !isBrute && Math.random() < 0.35;
    const scale = isBrute ? 1.35 : 1.0;

    const { zGroup, headGroup, armL, armR } = buildZombieMesh(scale);
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 8;
    zGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
    scene.add(zGroup);

    const baseHp = (120 + state.wave * 65) * (isBrute ? 2.1 : 1.0);
    const speed = (isSprinter ? 5.6 : isBrute ? 2.9 : 3.9) + Math.min(state.wave * 0.14, 2.2);

    state.zombies.push({
        mesh: zGroup,
        headGroup,
        armL,
        armR,
        hp: baseHp,
        maxHp: baseHp,
        speed,
        shrunk: false,
        wobbleSeed: Math.random() * 10
    });
}

function spawnMapBoss(manualSummon = false, overrideBossKey = null, spawnPos = null) {
    if (state.activeBoss && !state.activeBoss.dead) {
        if (manualSummon) {
            showBossBanner(`⚠️ ${state.activeBoss.cfg.name} IS ALREADY ACTIVE!`, 'Defeat the current boss first!');
        }
        return;
    }
    const bKey = overrideBossKey || state.currentMapKey;
    const cfg = MAP_BOSSES[bKey] || MAP_BOSSES.medieval_castle;
    const { bossGroup, headGroup, specialProp } = buildBossMesh(bKey, cfg);

    if (spawnPos) {
        bossGroup.position.copy(spawnPos);
    } else {
        bossGroup.position.set(0, 0, -20);
    }
    scene.add(bossGroup);

    const scaledHp = cfg.fixedHp ? cfg.hp : Math.round(cfg.hp * (1 + (state.wave - 1) * 0.15));
    state.activeBoss = {
        mapKey: bKey,
        cfg,
        mesh: bossGroup,
        headGroup,
        specialProp,
        hp: scaledHp,
        maxHp: scaledHp,
        lastAttack: performance.now(),
        comboToggle: false,
        dead: false
    };

    document.getElementById('boss-hud').classList.remove('hidden');
    updateBossHUD();
    soundMgr.playBell();
    showBossBanner(`${cfg.icon} BOSS APPROACHING: ${cfg.name.toUpperCase()}`, cfg.title);
}

function updateBossHUD() {
    if (!state.activeBoss || state.activeBoss.dead) {
        document.getElementById('boss-hud').classList.add('hidden');
        return;
    }
    document.getElementById('boss-name-text').innerText = `${state.activeBoss.cfg.icon} ${state.activeBoss.cfg.name}`;
    document.getElementById('boss-hp-text').innerText = `${Math.max(0, Math.ceil(state.activeBoss.hp))} / ${state.activeBoss.maxHp} HP`;
    const pct = Math.max(0, Math.min(100, (state.activeBoss.hp / state.activeBoss.maxHp) * 100));
    document.getElementById('boss-hp-bar').style.width = `${pct}%`;
    document.getElementById('boss-ability-text').innerText = `ABILITY: ${state.activeBoss.cfg.abilityName}`;
}

function spawnMiniBoss() {
    if (state.activeMiniBoss && !state.activeMiniBoss.dead) return;
    const mbIndex = Math.floor(Math.max(0, (state.wave / 5) - 1)) % MINI_BOSS_TYPES.length;
    const cfg = MINI_BOSS_TYPES[mbIndex];
    const { mbGroup, core } = buildMiniBossMesh(cfg);

    const angle = Math.random() * Math.PI * 2;
    mbGroup.position.set(Math.cos(angle) * 20, 0, Math.sin(angle) * 20);
    scene.add(mbGroup);

    const scaledHp = Math.round(cfg.baseHp * (1 + (state.wave - 5) * 0.12));
    state.activeMiniBoss = {
        cfg,
        mesh: mbGroup,
        core,
        hp: scaledHp,
        maxHp: scaledHp,
        speed: cfg.speed,
        lastAttack: performance.now(),
        dead: false
    };

    document.getElementById('miniboss-hud').classList.remove('hidden');
    updateMiniBossHUD();
    soundMgr.playBell();
    showBossBanner(`${cfg.icon} WAVE ${state.wave} MINI-BOSS: ${cfg.name.toUpperCase()}!`, 'Spawns every 5 rounds! Defeat for MAX AMMO + £1,500 Essence!');
}

function updateMiniBossHUD() {
    if (!state.activeMiniBoss || state.activeMiniBoss.dead) {
        document.getElementById('miniboss-hud').classList.add('hidden');
        return;
    }
    document.getElementById('miniboss-name-text').innerText = `${state.activeMiniBoss.cfg.icon} ${state.activeMiniBoss.cfg.name}`;
    document.getElementById('miniboss-hp-text').innerText = `${Math.max(0, Math.ceil(state.activeMiniBoss.hp))} / ${state.activeMiniBoss.maxHp} HP`;
    const pct = Math.max(0, Math.min(100, (state.activeMiniBoss.hp / state.activeMiniBoss.maxHp) * 100));
    document.getElementById('miniboss-hp-bar').style.width = `${pct}%`;
}

function damageMiniBoss(dmg) {
    if (!state.activeMiniBoss || state.activeMiniBoss.dead) return;
    state.activeMiniBoss.hp -= dmg;
    addScore(15);
    updateMiniBossHUD();

    if (state.activeMiniBoss.hp <= 0) {
        const mbCfg = state.activeMiniBoss.cfg;
        const dropPos = state.activeMiniBoss.mesh.position.clone();
        state.activeMiniBoss.dead = true;
        scene.remove(state.activeMiniBoss.mesh);
        disposeObject3D(state.activeMiniBoss.mesh);
        state.activeMiniBoss = null;
        updateMiniBossHUD();

        createShockwaveRing(dropPos, mbCfg.accent, 9);
        soundMgr.playBell();
        addScore(1500);

        const w = WEAPONS[state.activeWeaponKey];
        state.currentAmmo = w.maxAmmo;
        state.reserveAmmo = w.reserve;
        updateHUD();

        showBossBanner(`⚡ MINI-BOSS SLAIN: ${mbCfg.name.toUpperCase()}!`, '🎁 MAX AMMO REFILLED + £1,500 ESSENCE BONUS!');
        checkWaveProgress();
    }
}

function performBossAttack(boss) {
    if (!boss || boss.dead) return;
    const bPos = boss.mesh.position.clone().add(new THREE.Vector3(0, 2.2, 0));
    const toPlayer = state.playerPos.clone().sub(bPos).normalize();
    const type = boss.cfg.attackType;

    if (type === 'knight_combo') {
        boss.comboToggle = !boss.comboToggle;
        if (boss.comboToggle) {
            soundMgr.playShoot('boss_knight_sword');
            const slashGroup = new THREE.Group();
            const crescent = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 0.9), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
            const coreEdge = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.08, 0.45), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            slashGroup.add(crescent, coreEdge);
            slashGroup.position.copy(bPos);
            slashGroup.lookAt(state.playerPos);
            scene.add(slashGroup);
            state.bossProjectiles.push({
                mesh: slashGroup,
                vel: toPlayer.multiplyScalar(25),
                dmg: 22,
                life: 3.5,
                isStraightCut: true
            });
        } else {
            spawnDragonStrike(false, bPos, toPlayer);
        }
    } else {
        // Compute local right vector perpendicular to aim direction so spread works in all 360° directions
        const rightVec = new THREE.Vector3().crossVectors(toPlayer, new THREE.Vector3(0, 1, 0)).normalize();
        for (let i = -1; i <= 1; i++) {
            const mMesh = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.45, 0),
                new THREE.MeshBasicMaterial({ color: boss.cfg.accentColor })
            );
            mMesh.position.copy(bPos);
            const spreadDir = toPlayer.clone().addScaledVector(rightVec, i * 0.16).normalize();
            scene.add(mMesh);
            state.bossProjectiles.push({ mesh: mMesh, vel: spreadDir.multiplyScalar(19), dmg: 16, life: 3.5 });
        }
    }
}

// =========================================================================
// SUMMONED 3D FIRE-BREATHING DRAGON
// =========================================================================
function spawnDragonStrike(isPlayerDragon = true, originPos = null, dirVec = null) {
    const now = performance.now();
    if (isPlayerDragon) {
        if (!state.isPlaying) return;
        if (state.activeWeaponKey !== 'boss_knight_sword') {
            showBossBanner('🐉 EQUIP DRAGON-SLAYER GREATSWORD FIRST!', 'Unlock or equip the Camelot Keep Boss Sword to summon a Dragon!');
            return;
        }
        if (now - state.lastDragonSummonTime < 6500) {
            const rem = ((6500 - (now - state.lastDragonSummonTime)) / 1000).toFixed(1);
            showBossBanner(`🐉 DRAGON RECHARGING (${rem}s)`, 'Wait for your Ancient Dragon to finish its strafing run!');
            return;
        }
        state.lastDragonSummonTime = now;
        soundMgr.playDerpySound('moo');
        soundMgr.playBell();
        showBossBanner('🐉 ANCIENT CRIMSON DRAGON SUMMONED!', 'Scorching all zombies & bosses in its flight path!');
    }

    const dragonObj = build3DDragonMesh(isPlayerDragon);
    const forward = dirVec
        ? dirVec.clone().setY(0).normalize()
        : new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw)).normalize();

    const startPos = originPos
        ? originPos.clone().add(new THREE.Vector3(0, 4.2, 0))
        : state.playerPos.clone().add(forward.clone().multiplyScalar(-4)).add(new THREE.Vector3(0, 4.2, 0));

    dragonObj.group.position.copy(startPos);
    dragonObj.group.lookAt(startPos.clone().add(forward));
    scene.add(dragonObj.group);

    state.summonedDragons.push({
        ...dragonObj,
        isPlayerDragon,
        vel: forward.multiplyScalar(isPlayerDragon ? 20 : 17),
        life: 3.4,
        lastTick: 0
    });
}

// =========================================================================
// SHOOTING, RELOAD, DAMAGE & ACHIEVEMENTS
// =========================================================================
function shoot() {
    if (!state.isPlaying || state.isPaused || state.isReloading) return;
    const now = performance.now();
    const w = WEAPONS[state.activeWeaponKey];
    const rate = state.perks.doubletap ? w.fireRate * 0.72 : w.fireRate;
    if (now - state.lastShotTime < rate) return;

    if (state.currentAmmo <= 0) {
        reloadWeapon();
        return;
    }

    state.lastShotTime = now;
    state.currentAmmo--;
    updateHUD();
    soundMgr.playShoot(w.type);

    weaponGroup.position.z = 0.14;
    weaponGroup.rotation.x = 0.14;
    if (w.type === 'boss_knight_sword') {
        weaponGroup.rotation.z = -0.65;
        weaponGroup.rotation.y = 0.45;
    }
    if (state.muzzleFlashMesh && state.muzzleLight) {
        state.muzzleFlashMesh.material.opacity = 1;
        state.muzzleLight.intensity = 4;
    }

    const isPacked = !!state.packedWeapons[state.activeWeaponKey];
    const totalDamage = w.damage * (isPacked ? 2.2 : 1.0) * (state.perks.doubletap ? 1.5 : 1.0);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const muzzlePos = camera.position.clone().add(forward.clone().multiplyScalar(0.8));

    if (w.type === 'secret_rudolph_laser') {
        const beamLength = 46;
        const beamGeom = new THREE.CylinderGeometry(0.09, 0.09, beamLength, 10);
        beamGeom.rotateX(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: isPacked ? 0xff00ff : 0xff0000,
            transparent: true,
            opacity: 0.92
        });
        const beamMesh = new THREE.Mesh(beamGeom, beamMat);
        const beamCenter = muzzlePos.clone().add(forward.clone().multiplyScalar(beamLength / 2));
        beamMesh.position.copy(beamCenter);
        beamMesh.quaternion.copy(camera.quaternion);
        scene.add(beamMesh);
        state.laserBeams.push({ mesh: beamMesh, life: 0.11, maxLife: 0.11 });

        const rayOrigin = camera.position.clone();
        for (let i = state.zombies.length - 1; i >= 0; i--) {
            const z = state.zombies[i];
            const zCenter = z.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
            const toZ = zCenter.clone().sub(rayOrigin);
            const projDist = toZ.dot(forward);
            if (projDist > 0 && projDist < beamLength) {
                const perpSq = toZ.lengthSq() - projDist * projDist;
                if (perpSq < 1.6 * 1.6) {
                    createShockwaveRing(zCenter, 0xff0000, 3.0);
                    damageZombie(z, totalDamage, 'secret_rudolph_laser');
                }
            }
        }
        if (state.activeBoss && !state.activeBoss.dead) {
            const bCenter = state.activeBoss.mesh.position.clone().add(new THREE.Vector3(0, 2.2, 0));
            const toB = bCenter.clone().sub(rayOrigin);
            const projDist = toB.dot(forward);
            if (projDist > 0 && projDist < beamLength) {
                const perpSq = toB.lengthSq() - projDist * projDist;
                if (perpSq < 2.6 * 2.6) {
                    createShockwaveRing(bCenter, 0xff0000, 4.5);
                    damageBoss(totalDamage);
                }
            }
        }
        if (state.activeMiniBoss && !state.activeMiniBoss.dead) {
            const mbCenter = state.activeMiniBoss.mesh.position.clone().add(new THREE.Vector3(0, 1.7, 0));
            const toMB = mbCenter.clone().sub(rayOrigin);
            const projDist = toMB.dot(forward);
            if (projDist > 0 && projDist < beamLength) {
                const perpSq = toMB.lengthSq() - projDist * projDist;
                if (perpSq < 2.2 * 2.2) {
                    createShockwaveRing(mbCenter, 0xff0000, 4.0);
                    damageMiniBoss(totalDamage);
                }
            }
        }
    } else if (w.type === 'boss_candy_cane') {
        const caneProj = new THREE.Group();
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const redMat = new THREE.MeshBasicMaterial({ color: isPacked ? 0xe879f9 : 0xef4444 });
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 8), whiteMat);
        const stripe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 8), redMat);
        stripe1.position.y = 0.15;
        const stripe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 8), redMat);
        stripe2.position.y = -0.15;
        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 8, 14, Math.PI), redMat);
        hook.position.set(0.14, 0.32, 0);
        caneProj.add(stem, stripe1, stripe2, hook);
        caneProj.position.copy(muzzlePos);
        scene.add(caneProj);

        state.projectiles.push({
            mesh: caneProj,
            vel: forward.clone().multiplyScalar(40),
            type: 'boss_candy_cane',
            damage: totalDamage,
            life: 2.6,
            aoeRadius: 4.2
        });
    } else if (w.type === 'boss_knight_sword') {
        const slashGroup = new THREE.Group();
        const outerWave = new THREE.Mesh(
            new THREE.BoxGeometry(3.4, 0.14, 0.75),
            new THREE.MeshBasicMaterial({ color: isPacked ? 0xe879f9 : 0xf59e0b })
        );
        const innerEdge = new THREE.Mesh(
            new THREE.BoxGeometry(3.7, 0.06, 0.35),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        slashGroup.add(outerWave, innerEdge);
        slashGroup.position.copy(muzzlePos);
        slashGroup.quaternion.copy(camera.quaternion);
        scene.add(slashGroup);

        state.projectiles.push({
            mesh: slashGroup,
            vel: forward.clone().multiplyScalar(38),
            type: 'straight_sword_cut',
            damage: totalDamage,
            life: 2.6,
            hitSet: new Set()
        });
    } else if (w.type === 'sandwich') {
        const sProj = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.16, 0.32),
            new THREE.MeshStandardMaterial({ color: 0xfacc15 })
        );
        sProj.position.copy(muzzlePos);
        scene.add(sProj);
        state.projectiles.push({
            mesh: sProj,
            vel: forward.clone().multiplyScalar(34),
            type: 'sandwich',
            damage: totalDamage,
            life: 2.5
        });
    } else if (w.type === 'thundergun') {
        createShockwaveRing(state.playerPos.clone().add(forward.clone().multiplyScalar(3)), 0x38bdf8, 10);
        for (let i = state.zombies.length - 1; i >= 0; i--) {
            const z = state.zombies[i];
            if (z.mesh.position.distanceTo(state.playerPos) < 15) {
                damageZombie(z, totalDamage, 'thundergun');
            }
        }
        if (state.activeBoss && !state.activeBoss.dead && state.activeBoss.mesh.position.distanceTo(state.playerPos) < 16) {
            damageBoss(totalDamage * 0.7);
        }
        if (state.activeMiniBoss && !state.activeMiniBoss.dead && state.activeMiniBoss.mesh.position.distanceTo(state.playerPos) < 16) {
            damageMiniBoss(totalDamage * 0.85);
        }
    } else if (w.type === 'ach_highland_bfg') {
        soundMgr.playDerpySound('moo');
        createShockwaveRing(state.playerPos.clone(), 0xfbbf24, 14);
        for (let i = state.zombies.length - 1; i >= 0; i--) {
            if (state.zombies[i].mesh.position.distanceTo(state.playerPos) < 18) {
                damageZombie(state.zombies[i], totalDamage, 'ach_highland_bfg');
            }
        }
        const orb = new THREE.Mesh(sharedGeometries.sphereLarge, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        orb.position.copy(muzzlePos);
        scene.add(orb);
        state.projectiles.push({ mesh: orb, vel: forward.clone().multiplyScalar(36), type: w.type, damage: totalDamage, life: 2.8 });
    } else {
        const count = w.spreadCount || (w.type === 'chocolate_gun' ? 3 : 1);
        const projColor = w.projColor || (w.type === 'chocolate_gun' ? 0xd97706 : isPacked ? 0xe879f9 : 0x22c55e);
        const geom = w.type === 'secret_holy_grenade' ? sharedGeometries.sphereMedium : sharedGeometries.sphereSmall;
        for (let c = 0; c < count; c++) {
            const pMesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: projColor }));
            pMesh.position.copy(muzzlePos);
            const dir = forward.clone();
            if (count > 1) {
                const offset = (c - (count - 1) / 2) * 0.075;
                dir.addScaledVector(rightVec, offset).normalize();
            }
            scene.add(pMesh);
            state.projectiles.push({
                mesh: pMesh,
                vel: dir.multiplyScalar(42),
                type: w.type,
                damage: totalDamage,
                life: 2.4,
                aoeRadius: w.type === 'secret_holy_grenade' ? 5.5 : 0
            });
        }
    }
}

function reloadWeapon() {
    const w = WEAPONS[state.activeWeaponKey];
    if (state.isReloading || state.currentAmmo === w.maxAmmo || state.reserveAmmo <= 0) return;
    state.isReloading = true;
    state.reloadDuration = state.perks.speedcola ? 0.65 : 1.2;
    state.reloadTimer = state.reloadDuration;
    weaponGroup.rotation.x = -0.55;
}

function finishReload() {
    const w = WEAPONS[state.activeWeaponKey];
    const needed = w.maxAmmo - state.currentAmmo;
    const take = Math.min(needed, state.reserveAmmo);
    state.currentAmmo += take;
    state.reserveAmmo -= take;
    state.isReloading = false;
    state.reloadTimer = 0;
    updateHUD();
}

function damageZombie(z, dmg, weaponType) {
    const idx = state.zombies.indexOf(z);
    if (idx === -1) return;

    if (weaponType === 'babygun' && !z.shrunk) {
        z.shrunk = true;
        z.mesh.scale.setScalar(0.42);
        z.hp = Math.min(z.hp, 50);
        soundMgr.playDerpySound('pop');
    }

    z.hp -= dmg;
    addScore(10);

    if (z.hp <= 0) {
        createShockwaveRing(z.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x22c55e, 3.2);
        scene.remove(z.mesh);
        disposeObject3D(z.mesh);
        state.zombies.splice(idx, 1);
        addScore(100);
        soundMgr.playDerpySound('pop');
        incrementAchievement('slayer25', 1);
        checkWaveProgress();
    }
}

function triggerAoEDamage(center, aoeRadius, damage, type, excludeZombie = null) {
    if (!aoeRadius) return;
    createShockwaveRing(center, 0xfde047, aoeRadius);
    for (let k = state.zombies.length - 1; k >= 0; k--) {
        const candidate = state.zombies[k];
        if (candidate && candidate !== excludeZombie && candidate.mesh.position.distanceTo(center) < aoeRadius) {
            damageZombie(candidate, damage * 0.75, type);
        }
    }
}

function damageBoss(dmg) {
    if (!state.activeBoss || state.activeBoss.dead) return;
    state.activeBoss.hp -= dmg;
    addScore(25);
    updateBossHUD();

    if (state.activeBoss.hp <= 0) {
        const bCfg = state.activeBoss.cfg;
        const bKey = state.activeBoss.mapKey;
        const dropPos = state.activeBoss.mesh.position.clone();
        state.activeBoss.dead = true;
        scene.remove(state.activeBoss.mesh);
        disposeObject3D(state.activeBoss.mesh);
        state.activeBoss = null;
        updateBossHUD();

        createShockwaveRing(dropPos, bCfg.accentColor, 12);
        soundMgr.playBell();
        addScore(bKey === 'sandwich_guard' ? 1500 : 5000);
        incrementAchievement('boss1', 1);

        if (SECRET_WEAPON_KEYS.includes(bCfg.weaponKey)) {
            const sKey = bCfg.weaponKey;
            if (sKey === 'sandwich') {
                state.sandwichUnlocked = true;
                try { localStorage.setItem('cod_zombies_sandwich_v3', 'true'); } catch (e) {}
            } else if (sKey === 'chocolate_gun') {
                state.chocolateGunUnlocked = true;
                try { localStorage.setItem('cod_zombies_choc_v3', 'true'); } catch (e) {}
            } else {
                state.mapSecretUnlocks[sKey] = true;
                try { localStorage.setItem('cod_zombies_secrets_v3', JSON.stringify(state.mapSecretUnlocks)); } catch (e) {}
            }
            syncWeaponUnlocks();
            updateArmoryBadge();
            equipWeapon(sKey);
            spawnBossLootCrate(dropPos, sKey);
            showBossBanner(
                `🕵️ SECRET GUARDIAN SLAIN: ${bCfg.name.toUpperCase()}!`,
                `Unlocked & Equipped ${WEAPONS[sKey].name}! Collect the crate or take the Exit Portal [F] back!`
            );
            return;
        }

        state.defeatedBosses[state.currentMapKey] = true;
        try {
            localStorage.setItem('cod_zombies_bosses_v3', JSON.stringify(state.defeatedBosses));
        } catch (e) {}
        syncWeaponUnlocks();
        updateArmoryBadge();

        spawnBossLootCrate(dropPos, bCfg.weaponKey);
        showBossBanner(`🏆 ${bCfg.name.toUpperCase()} DEFEATED!`, `Unlocked ${WEAPONS[bCfg.weaponKey].name} in Armory [V] & dropped Loot Crate!`);
    }
}

function spawnBossLootCrate(pos, weaponKey) {
    const crateGroup = new THREE.Group();
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.1, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.6, metalness: 0.85 })
    );
    box.position.y = 0.65;
    const lbl = createBillboardLabel(`👑 CLAIM ${WEAPONS[weaponKey].name} [F]`, '#451a03', '#fde047');
    lbl.position.y = 2.1;
    crateGroup.add(box, lbl);
    crateGroup.position.set(pos.x, 0, pos.z);
    scene.add(crateGroup);
    state.bossLootCrates.push({ mesh: crateGroup, weaponKey });
}

function createShockwaveRing(pos, hexColor, maxRadius = 6) {
    const ring = new THREE.Mesh(
        sharedGeometries.shockwaveRing,
        new THREE.MeshBasicMaterial({ color: hexColor, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, Math.max(0.15, pos.y), pos.z);
    scene.add(ring);
    state.shockwaveRings.push({ mesh: ring, maxRadius, life: 0.45, maxLife: 0.45 });
}

function incrementAchievement(achKey, amount = 1) {
    const a = ACHIEVEMENTS[achKey];
    if (!a) return;
    a.progress = Math.min(a.target, a.progress + amount);
    saveAchievementProgress();

    if (a.progress >= a.target && !state.unlockedAchievements[achKey]) {
        state.unlockedAchievements[achKey] = true;
        try {
            localStorage.setItem('cod_zombies_ach_v3', JSON.stringify(state.unlockedAchievements));
        } catch (e) {}
        addScore(1500);
        soundMgr.playBell();
        syncWeaponUnlocks();
        updateArmoryBadge();

        const doneCount = Object.keys(ACHIEVEMENTS).filter(k => state.unlockedAchievements[k]).length;
        if (doneCount === 5) {
            equipWeapon('ach_highland_bfg');
            showBossBanner('🏆 ALL 5/5 ACHIEVEMENTS COMPLETED!', 'Golden Highland BFG-9999 Unlocked & Equipped!');
        } else {
            showBossBanner(`🏆 ACHIEVEMENT UNLOCKED (${doneCount}/5): ${a.title}`, '+£1,500 Essence Bonus! Complete all 5 for the Golden Highland BFG!');
        }
    }
}

function checkWaveProgress() {
    if (state.zombies.length === 0 && state.zombiesRemainingToSpawn <= 0 && (!state.activeMiniBoss || state.activeMiniBoss.dead)) {
        state.wave++;
        state.zombiesRemainingToSpawn = 5 + state.wave * 3;
        incrementAchievement('wave5', 1);
        soundMgr.playBell();
        showBossBanner(`🌊 WAVE ${state.wave} STARTING!`, 'Prepare for more Derpy Zombies!');

        const inSecretArena = state.currentMapKey === 'secret_boss_arena' || state.currentMapKey === 'chocolate_arena';
        if (!inSecretArena) {
            if (state.wave % 5 === 0) {
                spawnMiniBoss();
            } else if (state.wave % 3 === 0) {
                spawnMapBoss(false);
            }
        }
        updateHUD();
    }
}

// =========================================================================
// HUD, INTERACTIONS, ARMORY & MAP MODALS
// =========================================================================
function addScore(pts) {
    state.score += pts;
    updateHUD();
}

function equipWeapon(wKey) {
    if (!WEAPONS[wKey]) return;
    state.activeWeaponKey = wKey;
    const w = WEAPONS[wKey];
    state.currentAmmo = w.maxAmmo;
    state.reserveAmmo = w.reserve;
    state.isReloading = false;
    state.reloadTimer = 0;
    rebuildWeaponModel();
    updateHUD();
}

function cycleNextWeapon(dir = 1) {
    const allKeys = [...WONDER_KEYS, ...SECRET_WEAPON_KEYS, ...BOSS_WEAPON_KEYS, 'ach_highland_bfg'].filter(k => state.unlockedWeapons[k]);
    if (allKeys.length === 0) return;
    const idx = allKeys.indexOf(state.activeWeaponKey);
    const nextIdx = (idx + dir + allKeys.length) % allKeys.length;
    equipWeapon(allKeys[nextIdx]);
}

function updateHUD() {
    const w = WEAPONS[state.activeWeaponKey];
    const isPacked = !!state.packedWeapons[state.activeWeaponKey];
    document.getElementById('wave-num').innerText = state.wave;
    document.getElementById('zombies-left').innerText = state.zombies.length + state.zombiesRemainingToSpawn;
    document.getElementById('score-val').innerText = state.score;
    document.getElementById('weapon-name').innerText = isPacked ? w.packedName : w.name;
    document.getElementById('pap-badge').classList.toggle('hidden', !isPacked);
    document.getElementById('ammo-current').innerText = state.currentAmmo;
    document.getElementById('ammo-reserve').innerText = state.reserveAmmo;

    const isKnightSword = state.activeWeaponKey === 'boss_knight_sword';
    document.getElementById('dragon-ability-badge').classList.toggle('hidden', !isKnightSword);
    document.getElementById('touch-dragon').classList.toggle('hidden', !isKnightSword);

    const hpPct = Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100));
    document.getElementById('hp-bar').style.width = `${hpPct}%`;
    document.getElementById('hp-text').innerText = `${Math.max(0, Math.ceil(state.health))} / ${state.maxHealth}`;
}

function showBossBanner(title, sub) {
    const b = document.getElementById('boss-banner');
    document.getElementById('boss-banner-title').innerText = title;
    document.getElementById('boss-banner-sub').innerText = sub;
    b.classList.remove('hidden');
    clearTimeout(b._timer);
    b._timer = setTimeout(() => b.classList.add('hidden'), 4200);
}

function triggerDamageFlash() {
    const el = document.getElementById('damage-flash');
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 180);
}

function getNearbyInteraction() {
    for (let i = 0; i < state.bossLootCrates.length; i++) {
        if (state.playerPos.distanceTo(state.bossLootCrates[i].mesh.position) < 4.8) {
            const wName = WEAPONS[state.bossLootCrates[i].weaponKey].name;
            return {
                type: 'crate',
                index: i,
                shortLabel: `👑 CLAIM ${wName.toUpperCase()}`,
                label: `👑 Press [F] or TAP BUTTON to Claim ${wName}`
            };
        }
    }
    if (state.jeffCow && state.playerPos.distanceTo(state.jeffCow.position) < 5.0) {
        return {
            type: 'jeff',
            shortLabel: '🐮 PET JEFF (+£250 & HEAL)',
            label: '🐮 Press [F] or TAP BUTTON to Pet Jeff the Highland Cow (+£250 & Heal!)'
        };
    }
    if (state.hiddenMapSecretPassage && state.playerPos.distanceTo(state.hiddenMapSecretPassage.position) < 4.4) {
        const sData = state.hiddenMapSecretPassage.userData;
        const wName = WEAPONS[sData.weaponKey].name;
        return {
            type: 'secret_arena_portal',
            config: sData,
            shortLabel: sData.label,
            label: `🕵️ Press [F] or TAP BUTTON: ${sData.label} (Boss Trial for ${wName}!)`
        };
    }
    if (state.returnPortalMesh && state.playerPos.distanceTo(state.returnPortalMesh.position) < 5.0) {
        const returnMapName = (MAPS[state.previousMapBeforeSecretArena] || MAPS.jungle).name;
        return {
            type: 'return_portal',
            shortLabel: `🌀 EXIT TO ${returnMapName.split('.')[1] || returnMapName}`,
            label: `🌀 Press [F] or TAP BUTTON to Return to ${returnMapName}`
        };
    }
    if (state.playerPos.distanceTo(mysteryBoxPos) < 4.8) {
        return {
            type: 'box',
            shortLabel: '🎁MYSTERY BOX (£950)',
            label: '🎁 Press [F] or TAP BUTTON to Spin Mystery Box [£950]'
        };
    }
    if (state.playerPos.distanceTo(papPos) < 4.8) {
        return {
            type: 'pap',
            shortLabel: '⚡ PACK-A-PUNCH (£5000)',
            label: '⚡ Press [F] or TAP BUTTON to Pack-a-Punch Weapon [£5000]'
        };
    }
    for (const ps of perkStations) {
        if (!state.perks[ps.key] && state.playerPos.distanceTo(ps.pos) < 4.6) {
            return {
                type: 'perk',
                perk: ps,
                shortLabel: `🥤 BUY ${ps.name.split(' ')[0].toUpperCase()} (£${ps.cost})`,
                label: `🥤 Press [F] or TAP BUTTON to Buy ${ps.name} [£${ps.cost}]`
            };
        }
    }
    return null;
}

function triggerInteraction() {
    if (!state.isPlaying || state.isPaused) return;
    const inter = getNearbyInteraction();
    if (!inter) {
        showBossBanner('✋ NO STATION IN RANGE', 'Walk closer to the Mystery Box, Pack-a-Punch, Perk Machine, or Weapon Crate!');
        return;
    }

    if (inter.type === 'crate') {
        const c = state.bossLootCrates[inter.index];
        scene.remove(c.mesh);
        disposeObject3D(c.mesh);
        state.bossLootCrates.splice(inter.index, 1);
        state.unlockedWeapons[c.weaponKey] = true;
        equipWeapon(c.weaponKey);
        soundMgr.playBell();
        showBossBanner(`👑 EQUIPPED: ${WEAPONS[c.weaponKey].name}`, WEAPONS[c.weaponKey].desc);
    } else if (inter.type === 'jeff') {
        soundMgr.playDerpySound('moo');
        addScore(250);
        state.health = state.maxHealth;
        updateHUD();
        incrementAchievement('jeff3', 1);
        createShockwaveRing(state.jeffCow.position.clone(), 0xfbbf24, 6);
        showBossBanner('🐮 JEFF SAYS MOOOO!', '+£250 Essence & Full Health Restored!');
    } else if (inter.type === 'secret_arena_portal') {
        const sCfg = inter.config;
        state.previousMapBeforeSecretArena = state.currentMapKey;
        state.activeSecretArenaConfig = sCfg;
        soundMgr.playBell();
        if (sCfg.bossKey === 'chocolate_arena') {
            switchMap('chocolate_arena');
            state.pendingBossTimer = setTimeout(() => spawnMapBoss(true, 'chocolate_arena', new THREE.Vector3(0, 0, -18)), 350);
        } else {
            switchMap('secret_boss_arena');
            const bossInfo = MAP_BOSSES[sCfg.bossKey];
            showBossBanner(
                `🌀 TELEPORTED TO SECRET ARENA!`,
                `Defeat ${bossInfo.icon} ${bossInfo.name} to collect ${WEAPONS[sCfg.weaponKey].name}!`
            );
            state.pendingBossTimer = setTimeout(() => spawnMapBoss(true, sCfg.bossKey, new THREE.Vector3(0, 0, -18)), 350);
        }
    } else if (inter.type === 'return_portal') {
        const targetMap = state.previousMapBeforeSecretArena || 'medieval_castle';
        state.activeSecretArenaConfig = null;
        switchMap(targetMap);
    } else if (inter.type === 'box') {
        if (state.score < 950) {
            showBossBanner('❌ NEED £950 FOR MYSTERY BOX!', 'Eliminate more zombies for Essence!');
            return;
        }
        state.score -= 950;
        const pool = WONDER_KEYS.filter(k => k !== 'm1911');
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const wasNewUnlock = !state.mysteryBoxUnlocks[pick];
        state.mysteryBoxUnlocks[pick] = true;
        try {
            localStorage.setItem('cod_zombies_box_v3', JSON.stringify(state.mysteryBoxUnlocks));
        } catch (e) {}
        syncWeaponUnlocks();
        updateArmoryBadge();
        equipWeapon(pick);
        soundMgr.playBell();
        if (wasNewUnlock) {
            showBossBanner(`🎁 NEW WONDER WEAPON UNLOCKED: ${WEAPONS[pick].name}!`, 'Now permanently unlocked in your Direct Weapon Armory [V]!');
        } else {
            showBossBanner(`🎁 MYSTERY BOX AWARDED: ${WEAPONS[pick].name}`, WEAPONS[pick].desc);
        }
    } else if (inter.type === 'pap') {
        if (state.packedWeapons[state.activeWeaponKey]) {
            showBossBanner('⚡ WEAPON ALREADY PACK-A-PUNCHED!', 'Switch to another gun to upgrade it!');
            return;
        }
        if (state.score < 5000) {
            showBossBanner('❌ NEED £5,000 TO PACK-A-PUNCH!', 'Keep slaying zombies or bosses!');
            return;
        }
        state.score -= 5000;
        state.packedWeapons[state.activeWeaponKey] = true;
        incrementAchievement('pap1', 1);
        equipWeapon(state.activeWeaponKey);
        soundMgr.playBell();
        showBossBanner(`⚡ PACK-A-PUNCHED: ${WEAPONS[state.activeWeaponKey].packedName}!`, 'Damage & visual aura upgraded!');
    } else if (inter.type === 'perk') {
        const ps = inter.perk;
        if (state.score < ps.cost) {
            showBossBanner(`❌ NEED £${ps.cost} FOR ${ps.name.toUpperCase()}`, 'Not enough Essence!');
            return;
        }
        state.score -= ps.cost;
        state.perks[ps.key] = true;
        if (ps.key === 'juggernog') {
            state.maxHealth = 250;
            state.health = 250;
        }
        soundMgr.playBell();
        renderPerksHUD();
        updateHUD();
    }
}

function renderPerksHUD() {
    const row = document.getElementById('perks-row');
    row.innerHTML = '';
    perkStations.forEach(ps => {
        if (state.perks[ps.key]) {
            const badge = document.createElement('div');
            badge.className = 'px-2 py-0.5 rounded bg-zinc-900 border border-amber-400 text-[10px] font-black text-amber-300';
            badge.innerText = ps.name.split(' ')[0];
            row.appendChild(badge);
        }
    });
}

function updateArmoryBadge() {
    const wonderCount = WONDER_KEYS.filter(k => state.unlockedWeapons[k]).length;
    const secretCount = SECRET_WEAPON_KEYS.filter(k => state.unlockedWeapons[k]).length;
    const count = BOSS_WEAPON_KEYS.filter(k => state.unlockedWeapons[k]).length;
    const achCount = Object.keys(ACHIEVEMENTS).filter(k => state.unlockedAchievements[k]).length;
    const badgeEl = document.getElementById('armory-unlock-badge');
    if (badgeEl) badgeEl.innerText = `[V] ${wonderCount}/${WONDER_KEYS.length} BOX • ${secretCount}/${SECRET_WEAPON_KEYS.length} SECRET • ${count}/${BOSS_WEAPON_KEYS.length} BOSS`;
    const wProgEl = document.getElementById('armory-wonder-progress');
    if (wProgEl) wProgEl.innerText = `${wonderCount} / ${WONDER_KEYS.length} Wonder Weapons Unlocked`;
    const sProgEl = document.getElementById('armory-secret-progress');
    if (sProgEl) sProgEl.innerText = `${secretCount} / ${SECRET_WEAPON_KEYS.length} Secret Weapons Found`;
    const progEl = document.getElementById('armory-boss-progress');
    if (progEl) progEl.innerText = `${count} / ${BOSS_WEAPON_KEYS.length} Boss Weapons Unlocked`;
    const achProgEl = document.getElementById('armory-ach-progress');
    if (achProgEl) achProgEl.innerText = `${achCount} / 5 Trophies Unlocked`;
}

function renderArmoryModal() {
    syncWeaponUnlocks();
    updateArmoryBadge();

    const wGrid = document.getElementById('armory-wonder-grid');
    if (wGrid) {
        wGrid.innerHTML = '';
        WONDER_KEYS.forEach(k => {
            const w = WEAPONS[k];
            const isUnlocked = !!state.unlockedWeapons[k];
            const isEquipped = state.activeWeaponKey === k;
            const card = document.createElement('div');
            card.className = `rounded-xl p-3 border transition flex flex-col justify-between ${
                isEquipped
                    ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : isUnlocked
                    ? 'bg-zinc-800/80 border-zinc-700 hover:border-emerald-400/60'
                    : 'bg-zinc-950/70 border-zinc-800 opacity-75'
            }`;
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between gap-1">
                        <span class="font-orbitron font-bold text-xs text-white">${w.name}</span>
                        <span class="text-[10px] font-black px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
                            ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-1">${w.desc}</p>
                </div>
                <div class="mt-2.5 flex items-center justify-between">
                    <span class="text-[10px] text-amber-300 font-bold">DMG: ${w.damage}</span>
                    ${
                        isUnlocked
                            ? `<button data-equip="${k}" class="px-3 py-1 rounded-lg text-[10px] font-black ${
                                  isEquipped ? 'bg-emerald-400 text-zinc-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }">${isEquipped ? '✓ EQUIPPED' : 'EQUIP'}</button>`
                            : `<span class="text-[10px] text-red-400 font-bold">🔒 Pull from Mystery Box [£950] First</span>`
                    }
                </div>
            `;
            wGrid.appendChild(card);
        });
    }

    const sGrid = document.getElementById('armory-secret-grid');
    if (sGrid) {
        sGrid.innerHTML = '';
        SECRET_WEAPON_KEYS.forEach(k => {
            const w = WEAPONS[k];
            const mapInfo = MAPS[w.secretMap] || MAPS.bunker;
            const sCfg = MAP_SECRET_CONFIG[w.secretMap];
            const bossInfo = sCfg ? MAP_BOSSES[sCfg.bossKey] : null;
            const isUnlocked = !!state.unlockedWeapons[k];
            const isEquipped = state.activeWeaponKey === k;

            const card = document.createElement('div');
            card.className = `rounded-xl p-3 border transition flex flex-col justify-between ${
                isEquipped
                    ? 'bg-pink-950/70 border-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.35)]'
                    : isUnlocked
                    ? 'bg-zinc-800/85 border-pink-500/50 hover:border-pink-400'
                    : 'bg-zinc-950/75 border-zinc-800 opacity-80'
            }`;
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between gap-1">
                        <span class="font-orbitron font-bold text-xs text-pink-300">${w.name}</span>
                        <span class="text-[10px] font-black px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
                            ${isUnlocked ? '🕵️ UNLOCKED' : '🔒 BOSS LOCKED'}
                        </span>
                    </div>
                    <div class="text-[10px] text-amber-300 font-semibold mt-0.5">📍 ${mapInfo.name} • ${sCfg ? sCfg.hint : 'Hidden Passage'}</div>
                    ${bossInfo ? `<div class="text-[10px] text-purple-300 font-bold mt-0.5">⚔️ Arena Boss: ${bossInfo.icon} ${bossInfo.name}</div>` : ''}
                    <p class="text-[11px] text-zinc-400 mt-1">${w.desc}</p>
                </div>
                <div class="mt-2.5 flex items-center justify-between gap-1">
                    <span class="text-[10px] text-amber-300 font-bold">DMG: ${w.damage}</span>
                    ${
                        isUnlocked
                            ? `<button data-equip="${k}" class="px-3 py-1 rounded-lg text-[10px] font-black ${
                                  isEquipped ? 'bg-pink-400 text-zinc-950' : 'bg-pink-600 hover:bg-pink-500 text-white'
                              }">${isEquipped ? '✓ EQUIPPED' : '🕵️ EQUIP'}</button>`
                            : `<span class="text-[10px] text-pink-400 font-bold">🔒 Find Secret Portal & Slay Boss</span>`
                    }
                </div>
            `;
            sGrid.appendChild(card);
        });
    }

    const bGrid = document.getElementById('armory-boss-grid');
    if (bGrid) {
        bGrid.innerHTML = '';
        BOSS_WEAPON_KEYS.forEach(k => {
            const w = WEAPONS[k];
            const boss = MAP_BOSSES[w.bossMap];
            const mapInfo = MAPS[w.bossMap];
            const isUnlocked = !!state.unlockedWeapons[k];
            const isEquipped = state.activeWeaponKey === k;

            const card = document.createElement('div');
            card.className = `rounded-xl p-3 border transition flex flex-col justify-between ${
                isEquipped
                    ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                    : isUnlocked
                    ? 'bg-zinc-800/85 border-amber-500/50 hover:border-amber-400'
                    : 'bg-zinc-950/80 border-zinc-800'
            }`;
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between gap-1">
                        <span class="font-orbitron font-bold text-xs text-amber-300">${w.name}</span>
                        <span class="text-[10px] font-black px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
                            ${isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                        </span>
                    </div>
                    <div class="text-[10px] text-purple-300 font-semibold mt-0.5">${boss.icon} ${boss.name} (${mapInfo.name})</div>
                    <p class="text-[11px] text-zinc-400 mt-1">${w.desc}</p>
                </div>
                <div class="mt-2.5 flex items-center justify-between gap-2">
                    <span class="text-[10px] text-amber-300 font-bold">DMG: ${w.damage}</span>
                    ${
                        isUnlocked
                            ? `<button data-equip="${k}" class="px-3 py-1 rounded-lg text-[10px] font-black ${
                                  isEquipped ? 'bg-amber-400 text-zinc-950' : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                              }">${isEquipped ? '✓ EQUIPPED' : '👑 EQUIP'}</button>`
                            : `<button data-hunt="${w.bossMap}" class="px-2.5 py-1 rounded-lg bg-red-900/80 hover:bg-red-700 border border-red-400/50 text-[10px] font-extrabold text-red-100">⚡ HUNT BOSS</button>`
                    }
                </div>
            `;
            bGrid.appendChild(card);
        });
    }

    const achWeaponDiv = document.getElementById('armory-ach-weapon');
    if (achWeaponDiv) {
        const aw = WEAPONS.ach_highland_bfg;
        const isAchUnlocked = !!state.unlockedWeapons.ach_highland_bfg;
        const isAchEquipped = state.activeWeaponKey === 'ach_highland_bfg';
        achWeaponDiv.innerHTML = `
            <div class="rounded-xl p-3 border ${isAchUnlocked ? 'bg-amber-950/60 border-yellow-400' : 'bg-zinc-900 border-zinc-800'} flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div class="font-orbitron font-black text-sm text-yellow-300">${aw.name}</div>
                    <div class="text-xs text-zinc-300">${aw.desc}</div>
                </div>
                ${
                    isAchUnlocked
                        ? `<button data-equip="ach_highland_bfg" class="px-4 py-2 rounded-xl font-orbitron font-black text-xs bg-yellow-400 hover:bg-yellow-300 text-zinc-950">${
                              isAchEquipped ? '✓ EQUIPPED' : '🏆 EQUIP BFG-9999'
                          }</button>`
                        : `<span class="px-3 py-1.5 rounded-lg bg-zinc-800 text-amber-300 text-xs font-bold">🔒 Complete All 5/5 Trophies Below</span>`
                }
            </div>
        `;
    }

    const achListDiv = document.getElementById('armory-ach-list');
    if (achListDiv) {
        achListDiv.innerHTML = '';
        Object.entries(ACHIEVEMENTS).forEach(([k, a]) => {
            const done = !!state.unlockedAchievements[k];
            const item = document.createElement('div');
            item.className = `rounded-lg p-2.5 border ${done ? 'bg-emerald-950/60 border-emerald-400/70' : 'bg-zinc-900 border-zinc-800'}`;
            item.innerHTML = `
                <div class="text-xs font-bold ${done ? 'text-emerald-300' : 'text-zinc-200'}">${a.title}</div>
                <div class="text-[10px] text-zinc-400 mt-0.5">${a.desc}</div>
                <div class="text-[10px] font-black mt-1 ${done ? 'text-emerald-400' : 'text-amber-400'}">
                    ${done ? '✓ COMPLETED' : `${a.progress} / ${a.target}`}
                </div>
            `;
            achListDiv.appendChild(item);
        });
    }
}

function updatePauseState() {
    const armoryOpen = !document.getElementById('armory-modal').classList.contains('hidden');
    const mapModalOpen = !document.getElementById('map-select-modal').classList.contains('hidden');
    const shouldPause = armoryOpen || mapModalOpen;

    if (shouldPause && !state.isPaused) {
        state.isPaused = true;
        state.pauseStartTime = performance.now();
        resetInputState();
        if (document.pointerLockElement && document.exitPointerLock) {
            try { document.exitPointerLock(); } catch (e) {}
        }
    } else if (!shouldPause && state.isPaused) {
        const pausedDuration = performance.now() - state.pauseStartTime;
        state.lastShotTime += pausedDuration;
        state.lastDamageTime += pausedDuration;
        state.lastDragonSummonTime += pausedDuration;
        if (state.activeBoss) state.activeBoss.lastAttack += pausedDuration;
        if (state.activeMiniBoss) state.activeMiniBoss.lastAttack += pausedDuration;
        if (state.jeffCow && state.jeffCow.userData) state.jeffCow.userData.lastDefense += pausedDuration;
        state.isPaused = false;
        prevTime = performance.now();
    }
}

function renderPauseMapModal() {
    const grid = document.getElementById('pause-map-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!state.pendingMapSelection || state.pendingMapSelection === 'chocolate_arena' || state.pendingMapSelection === 'secret_boss_arena') {
        state.pendingMapSelection = (state.currentMapKey === 'chocolate_arena' || state.currentMapKey === 'secret_boss_arena')
            ? state.previousMapBeforeSecretArena
            : state.currentMapKey;
    }
    const badge = document.getElementById('modal-selected-map-badge');
    if (badge && MAPS[state.pendingMapSelection]) {
        badge.innerText = `Selected: ${MAPS[state.pendingMapSelection].name}`;
    }

    Object.entries(MAPS).forEach(([k, m]) => {
        if (k === 'chocolate_arena' || k === 'secret_boss_arena') return;
        const boss = MAP_BOSSES[k];
        const isBossSlain = !!state.defeatedBosses[k];
        const isSelected = k === state.pendingMapSelection;
        const isCurrent = k === state.currentMapKey;

        const card = document.createElement('div');
        card.className = `map-card cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 text-left transition ${isSelected ? 'selected' : 'hover:border-zinc-500'}`;
        card.innerHTML = `
            <div class="flex items-center justify-between gap-1">
                <span class="text-emerald-400 font-bold text-xs">${m.name}</span>
                ${isCurrent ? '<span class="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[9px] font-black text-emerald-300">ACTIVE</span>' : ''}
            </div>
            <div class="text-[10px] text-zinc-300 truncate mt-0.5">${m.subtitle}</div>
            <div class="text-[9px] text-amber-300 mt-1">Boss: ${boss.icon} ${boss.name}</div>
            <div class="text-[9px] font-bold mt-0.5 ${isBossSlain ? 'text-emerald-400' : 'text-zinc-400'}">
                ${isBossSlain ? '✓ Boss Defeated (Weapon Unlocked)' : '⚔️ Boss Undefeated'}
            </div>
        `;
        card.addEventListener('click', () => {
            state.pendingMapSelection = k;
            renderPauseMapModal();
        });
        card.addEventListener('dblclick', () => {
            state.pendingMapSelection = k;
            deployFromMapModal();
        });
        grid.appendChild(card);
    });
}

function toggleMapSelectModal() {
    const modal = document.getElementById('map-select-modal');
    const armoryModal = document.getElementById('armory-modal');
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
        armoryModal.classList.add('hidden');
        state.pendingMapSelection = (state.currentMapKey === 'chocolate_arena' || state.currentMapKey === 'secret_boss_arena')
            ? state.previousMapBeforeSecretArena
            : state.currentMapKey;
        renderPauseMapModal();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
    updatePauseState();
}

function deployFromMapModal() {
    const modal = document.getElementById('map-select-modal');
    modal.classList.add('hidden');
    updatePauseState();
    if (state.pendingMapSelection && MAPS[state.pendingMapSelection]) {
        state.activeSecretArenaConfig = null;
        switchMap(state.pendingMapSelection);
    }
}

function toggleArmoryModal() {
    const modal = document.getElementById('armory-modal');
    const mapModal = document.getElementById('map-select-modal');
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
        mapModal.classList.add('hidden');
        renderArmoryModal();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
    updatePauseState();
}

function equipWeaponFromArmory(wKey) {
    if (!state.unlockedWeapons[wKey]) return;
    equipWeapon(wKey);
    document.getElementById('armory-modal').classList.add('hidden');
    updatePauseState();
    showBossBanner(`🔫 EQUIPPED: ${WEAPONS[wKey].name}`, WEAPONS[wKey].desc);
}

function spawnMapBossFromArmory(mapKey) {
    document.getElementById('armory-modal').classList.add('hidden');
    updatePauseState();
    if (state.currentMapKey !== mapKey) {
        state.activeSecretArenaConfig = null;
        switchMap(mapKey);
    }
    state.pendingBossTimer = setTimeout(() => spawnMapBoss(true), 250);
}

function resetBossUnlocks() {
    clearAllPersistedUnlocks();
    equipWeapon('m1911');
    renderArmoryModal();
}

function clearDynamicEntities() {
    state.zombies.forEach(z => { scene.remove(z.mesh); disposeObject3D(z.mesh); });
    state.zombies = [];
    state.projectiles.forEach(p => { scene.remove(p.mesh); disposeObject3D(p.mesh); });
    state.projectiles = [];
    state.bossProjectiles.forEach(bp => { scene.remove(bp.mesh); disposeObject3D(bp.mesh); });
    state.bossProjectiles = [];
    state.bossLootCrates.forEach(c => { scene.remove(c.mesh); disposeObject3D(c.mesh); });
    state.bossLootCrates = [];
    state.summonedDragons.forEach(d => { scene.remove(d.group); disposeObject3D(d.group); });
    state.summonedDragons = [];
    state.shockwaveRings.forEach(r => { scene.remove(r.mesh); disposeObject3D(r.mesh); });
    state.shockwaveRings = [];
    state.laserBeams.forEach(lb => { scene.remove(lb.mesh); disposeObject3D(lb.mesh); });
    state.laserBeams = [];

    if (state.activeBoss) {
        scene.remove(state.activeBoss.mesh);
        disposeObject3D(state.activeBoss.mesh);
        state.activeBoss = null;
        updateBossHUD();
    }
    if (state.activeMiniBoss) {
        scene.remove(state.activeMiniBoss.mesh);
        disposeObject3D(state.activeMiniBoss.mesh);
        state.activeMiniBoss = null;
        updateMiniBossHUD();
    }
}

function switchMap(mapKey) {
    if (!MAPS[mapKey]) return;
    if (state.pendingBossTimer) {
        clearTimeout(state.pendingBossTimer);
        state.pendingBossTimer = null;
    }
    state.currentMapKey = mapKey;
    const sel = document.getElementById('hud-map-select');
    if (sel && mapKey !== 'chocolate_arena' && mapKey !== 'secret_boss_arena') sel.value = mapKey;

    clearDynamicEntities();

    state.playerPos.set(0, 1.7, 14);
    state.playerVel.set(0, 0, 0);
    buildMapEnvironment(mapKey, { scene, mapGroup, ambientLight, centerPointLight });
    state.zombiesRemainingToSpawn = 5 + state.wave * 2;
    updateHUD();
    showBossBanner(`🗺️ DEPLOYED TO: ${MAPS[mapKey].name.toUpperCase()}`, MAPS[mapKey].subtitle);
}

function toggleTouchControls() {
    state.touchHudVisible = !state.touchHudVisible;
    document.getElementById('touch-controls').classList.toggle('hidden', !state.touchHudVisible);
    document.getElementById('hud-touch-toggle').innerText = `📱 TOUCH HUD: ${state.touchHudVisible ? 'ON' : 'OFF'} [T]`;
}

function gameOver() {
    state.isPlaying = false;
    state.isReloading = false;
    state.reloadTimer = 0;
    resetInputState();
    if (document.pointerLockElement && document.exitPointerLock) {
        try { document.exitPointerLock(); } catch (e) {}
    }
    document.getElementById('game-over-stats').innerText = `Survived to Wave ${state.wave} on ${MAPS[state.currentMapKey].name} • Essence: £${state.score}`;
    document.getElementById('game-over-modal').classList.remove('hidden');
}

// =========================================================================
// UI INITIALIZATION & EVENT LISTENERS
// =========================================================================
function initMenusAndEvents() {
    const mapGrid = document.getElementById('menu-map-grid');
    const hudSelect = document.getElementById('hud-map-select');
    mapGrid.innerHTML = '';
    hudSelect.innerHTML = '';

    Object.entries(MAPS).forEach(([k, m]) => {
        if (k === 'chocolate_arena' || k === 'secret_boss_arena') return;
        const boss = MAP_BOSSES[k];
        const card = document.createElement('div');
        card.className = `map-card cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900/90 p-2.5 text-left ${k === state.currentMapKey ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="text-emerald-400 font-bold text-xs">${m.name}</div>
            <div class="text-[10px] text-zinc-300 truncate">${m.subtitle}</div>
            <div class="text-[9px] text-amber-300 mt-0.5">Boss: ${boss.icon} ${boss.name}</div>
        `;
        card.addEventListener('click', () => {
            state.currentMapKey = k;
            document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('selected-map-badge').innerText = `Selected: ${m.name}`;
            hudSelect.value = k;
        });
        mapGrid.appendChild(card);

        const opt = document.createElement('option');
        opt.value = k;
        opt.innerText = m.name;
        hudSelect.appendChild(opt);
    });
    hudSelect.value = state.currentMapKey;
    hudSelect.addEventListener('change', (e) => {
        state.activeSecretArenaConfig = null;
        switchMap(e.target.value);
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
        soundMgr.init();
        document.getElementById('start-menu').classList.add('hidden');
        state.isPlaying = true;
        state.packedWeapons = {};
        switchMap(state.currentMapKey);
        equipWeapon('m1911');
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.add('hidden');
        state.score = 1500;
        state.health = 100;
        state.maxHealth = 100;
        state.wave = 1;
        state.packedWeapons = {};
        state.activeSecretArenaConfig = null;
        Object.keys(state.perks).forEach(k => { state.perks[k] = false; });
        if (!state.unlockedAchievements.wave5) {
            resetAchievementProgress(true);
        }
        renderPerksHUD();
        state.isPlaying = true;
        switchMap(state.currentMapKey);
        equipWeapon('m1911');
    });

    // Event delegation for Armory buttons
    document.getElementById('armory-modal').addEventListener('click', (e) => {
        const equipBtn = e.target.closest('[data-equip]');
        if (equipBtn) {
            equipWeaponFromArmory(equipBtn.dataset.equip);
            return;
        }
        const huntBtn = e.target.closest('[data-hunt]');
        if (huntBtn) {
            spawnMapBossFromArmory(huntBtn.dataset.hunt);
        }
    });

    document.getElementById('hud-armory-btn').addEventListener('click', toggleArmoryModal);
    document.getElementById('close-armory-btn').addEventListener('click', toggleArmoryModal);
    document.getElementById('reset-unlocks-btn').addEventListener('click', resetBossUnlocks);
    document.getElementById('hud-maps-btn').addEventListener('click', toggleMapSelectModal);
    document.getElementById('resume-map-modal-btn').addEventListener('click', toggleMapSelectModal);
    document.getElementById('deploy-selected-map-btn').addEventListener('click', deployFromMapModal);
    document.getElementById('hud-boss-btn').addEventListener('click', () => spawnMapBoss(true));
    document.getElementById('hud-touch-toggle').addEventListener('click', toggleTouchControls);

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyV') {
            toggleArmoryModal();
            return;
        }
        if (e.code === 'KeyM') {
            toggleMapSelectModal();
            return;
        }
        if (state.isPaused) return;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') state.moveState.forward = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') state.moveState.backward = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') state.moveState.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') state.moveState.right = true;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.moveState.sprint = true;
        if (e.code === 'Space' && state.canJump && state.isPlaying) {
            state.playerVel.y = 9.5;
            state.canJump = false;
        }
        if (e.code === 'KeyR') reloadWeapon();
        if (e.code === 'KeyF') triggerInteraction();
        if (e.code === 'KeyB') spawnMapBoss(true);
        if (e.code === 'KeyT') toggleTouchControls();
        if (e.code === 'KeyC') spawnDragonStrike(true);
        if (e.code === 'KeyQ') cycleNextWeapon(-1);
        if (e.code === 'KeyE') cycleNextWeapon(1);
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') state.moveState.forward = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') state.moveState.backward = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') state.moveState.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') state.moveState.right = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.moveState.sprint = false;
    });

    window.addEventListener('blur', resetInputState);

    // Desktop Pointer Lock & Mouse Shooting
    canvas.addEventListener('mousedown', (e) => {
        if (!state.isPlaying || state.isPaused) return;
        if (document.pointerLockElement !== canvas && canvas.requestPointerLock) {
            try { canvas.requestPointerLock(); } catch (err) {}
        }
        if (e.button === 0) shoot();
        if (e.button === 2 && state.activeWeaponKey === 'boss_knight_sword') {
            e.preventDefault();
            spawnDragonStrike(true);
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (state.isPlaying) e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === canvas && state.isPlaying && !state.isPaused) {
            state.yaw -= e.movementX * 0.0022;
            state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch - e.movementY * 0.0022));
        }
    });

    // Touchscreen Dual Thumbsticks & Swipe Look
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    let moveTouchId = null;

    joyZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (moveTouchId === null) {
            moveTouchId = e.changedTouches[0].identifier;
        }
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === moveTouchId) {
                const rect = joyZone.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const maxR = rect.width / 2 - 12;
                let dx = t.clientX - cx;
                let dy = t.clientY - cy;
                const dist = Math.hypot(dx, dy);
                if (dist > maxR) {
                    dx = (dx / dist) * maxR;
                    dy = (dy / dist) * maxR;
                }
                joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
                state.joyVec.x = dx / maxR;
                state.joyVec.y = dy / maxR;
                state.moveState.sprint = (dist / maxR) > 0.8;
            }
        }
    }, { passive: false });

    const resetMoveJoy = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === moveTouchId) {
                moveTouchId = null;
                joyKnob.style.transform = 'translate(0px, 0px)';
                state.joyVec.x = 0;
                state.joyVec.y = 0;
                state.moveState.sprint = false;
            }
        }
    };
    joyZone.addEventListener('touchend', resetMoveJoy);
    joyZone.addEventListener('touchcancel', resetMoveJoy);

    const lookZone = document.getElementById('look-joystick-zone');
    const lookKnob = document.getElementById('look-joystick-knob');
    let lookJoyTouchId = null;

    lookZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (lookJoyTouchId === null) {
            lookJoyTouchId = e.changedTouches[0].identifier;
        }
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier === lookJoyTouchId) {
                const rect = lookZone.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const maxR = rect.width / 2 - 10;
                let dx = t.clientX - cx;
                let dy = t.clientY - cy;
                const dist = Math.hypot(dx, dy);
                if (dist > maxR) {
                    dx = (dx / dist) * maxR;
                    dy = (dy / dist) * maxR;
                }
                lookKnob.style.transform = `translate(${dx}px, ${dy}px)`;
                state.lookJoyVec.x = dx / maxR;
                state.lookJoyVec.y = dy / maxR;
            }
        }
    }, { passive: false });

    const resetLookJoy = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === lookJoyTouchId) {
                lookJoyTouchId = null;
                lookKnob.style.transform = 'translate(0px, 0px)';
                state.lookJoyVec.x = 0;
                state.lookJoyVec.y = 0;
            }
        }
    };
    lookZone.addEventListener('touchend', resetLookJoy);
    lookZone.addEventListener('touchcancel', resetLookJoy);

    let canvasTouchId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (!state.isPlaying || state.isPaused) return;
        if (canvasTouchId === null) {
            const t = e.changedTouches[0];
            canvasTouchId = t.identifier;
            lastTouchX = t.clientX;
            lastTouchY = t.clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (!state.isPlaying || state.isPaused) return;
        for (const t of e.changedTouches) {
            if (t.identifier === canvasTouchId) {
                const dx = t.clientX - lastTouchX;
                const dy = t.clientY - lastTouchY;
                lastTouchX = t.clientX;
                lastTouchY = t.clientY;
                state.yaw -= dx * 0.0055;
                state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch - dy * 0.0055));
            }
        }
    }, { passive: true });

    const resetCanvasTouch = (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === canvasTouchId) {
                canvasTouchId = null;
            }
        }
    };
    canvas.addEventListener('touchend', resetCanvasTouch);
    canvas.addEventListener('touchcancel', resetCanvasTouch);

    const bindTouchAction = (id, fn) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
        btn.addEventListener('click', fn);
    };

    const fireBtn = document.getElementById('touch-fire');
    const lfireBtn = document.getElementById('touch-lfire');
    [fireBtn, lfireBtn].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); state.touchFireHeld = true; shoot(); }, { passive: false });
        btn.addEventListener('touchend', () => { state.touchFireHeld = false; });
        btn.addEventListener('touchcancel', () => { state.touchFireHeld = false; });
        btn.addEventListener('mousedown', () => shoot());
    });

    bindTouchAction('touch-autofire', () => {
        state.autoFireEnabled = !state.autoFireEnabled;
        document.getElementById('touch-autofire').innerText = `⚡ AUTO: ${state.autoFireEnabled ? 'ON' : 'OFF'}`;
    });
    bindTouchAction('touch-reload', reloadWeapon);
    bindTouchAction('touch-switch', () => cycleNextWeapon(1));
    bindTouchAction('touch-jump', () => {
        if (state.canJump && state.isPlaying && !state.isPaused) { state.playerVel.y = 9.5; state.canJump = false; }
    });
    bindTouchAction('touch-armory', toggleArmoryModal);
    bindTouchAction('touch-maps', toggleMapSelectModal);
    bindTouchAction('touch-dragon', () => spawnDragonStrike(true));
    bindTouchAction('touch-interact', triggerInteraction);
    bindTouchAction('context-interact-btn', triggerInteraction);
    bindTouchAction('interact-prompt', triggerInteraction);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// =========================================================================
// MAIN ANIMATION & PHYSICS LOOP
// =========================================================================
function resolveObstacleCollisions() {
    const playerRadius = 0.75;
    for (const col of state.mapColliders) {
        const dx = state.playerPos.x - col.x;
        const dz = state.playerPos.z - col.z;
        const minDist = col.radius + playerRadius;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const push = (minDist - dist) / dist;
            state.playerPos.x += dx * push;
            state.playerPos.z += dz * push;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.1);
    prevTime = now;
    const time = now * 0.001;

    if (state.isPlaying && !state.isPaused) {
        if (state.isReloading) {
            state.reloadTimer -= dt;
            if (state.reloadTimer <= 0) {
                finishReload();
            }
        }

        if (state.touchFireHeld || state.autoFireEnabled) {
            shoot();
        }

        if (Math.abs(state.lookJoyVec.x) > 0.05 || Math.abs(state.lookJoyVec.y) > 0.05) {
            state.yaw -= state.lookJoyVec.x * 2.6 * dt;
            state.pitch = Math.max(-1.35, Math.min(1.35, state.pitch - state.lookJoyVec.y * 2.0 * dt));
        }

        camera.rotation.order = 'YXZ';
        camera.rotation.y = state.yaw;
        camera.rotation.x = state.pitch;

        const mCfg = MAPS[state.currentMapKey] || MAPS.medieval_castle;
        const baseSpeed = (state.moveState.sprint ? 10.5 : 7.2) * (state.perks.staminup ? 1.28 : 1.0);
        const forwardDir = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw)).normalize();
        const rightDir = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw)).normalize();

        const moveVec = new THREE.Vector3();
        if (state.moveState.forward) moveVec.add(forwardDir);
        if (state.moveState.backward) moveVec.sub(forwardDir);
        if (state.moveState.right) moveVec.add(rightDir);
        if (state.moveState.left) moveVec.sub(rightDir);
        if (Math.abs(state.joyVec.x) > 0.05 || Math.abs(state.joyVec.y) > 0.05) {
            moveVec.addScaledVector(forwardDir, -state.joyVec.y);
            moveVec.addScaledVector(rightDir, state.joyVec.x);
        }
        if (moveVec.lengthSq() > 0) moveVec.normalize();

        state.playerVel.x = THREE.MathUtils.lerp(state.playerVel.x, moveVec.x * baseSpeed, dt * mCfg.friction);
        state.playerVel.z = THREE.MathUtils.lerp(state.playerVel.z, moveVec.z * baseSpeed, dt * mCfg.friction);
        state.playerVel.y -= mCfg.gravity * dt;

        state.playerPos.addScaledVector(state.playerVel, dt);
        resolveObstacleCollisions();
        state.playerPos.x = Math.max(-34, Math.min(34, state.playerPos.x));
        state.playerPos.z = Math.max(-34, Math.min(34, state.playerPos.z));

        if (state.playerPos.y <= 1.7) {
            state.playerPos.y = 1.7;
            state.playerVel.y = 0;
            state.canJump = true;
        }
        camera.position.copy(state.playerPos);

        // First-Person Weapon Sway & Animated Moving Parts
        weaponGroup.position.z = THREE.MathUtils.lerp(weaponGroup.position.z, 0, dt * 10);
        weaponGroup.rotation.z = THREE.MathUtils.lerp(weaponGroup.rotation.z, 0, dt * 10);
        weaponGroup.rotation.y = THREE.MathUtils.lerp(weaponGroup.rotation.y, 0, dt * 10);
        if (!state.isReloading) {
            weaponGroup.rotation.x = THREE.MathUtils.lerp(weaponGroup.rotation.x, Math.sin(time * 6) * 0.02, dt * 10);
        }
        if (state.muzzleFlashMesh && state.muzzleLight) {
            state.muzzleFlashMesh.material.opacity = THREE.MathUtils.lerp(state.muzzleFlashMesh.material.opacity, 0, dt * 18);
            state.muzzleLight.intensity = THREE.MathUtils.lerp(state.muzzleLight.intensity, 0, dt * 18);
        }
        state.weaponAnimParts.forEach(part => {
            if (part.rotZ) part.mesh.rotation.z += part.rotZ * dt;
            if (part.rotY) part.mesh.rotation.y += part.rotY * dt;
            if (part.pulse) {
                const s = 1 + Math.sin(time * 8) * 0.14;
                part.mesh.scale.setScalar(s);
            }
        });

        // Dragon Cooldown HUD Text
        if (state.activeWeaponKey === 'boss_knight_sword') {
            const cdEl = document.getElementById('dragon-cooldown-text');
            const elapsed = now - state.lastDragonSummonTime;
            if (elapsed >= 6500) {
                cdEl.innerText = 'READY [PRESS C / RMB]';
                cdEl.className = 'text-emerald-400';
            } else {
                cdEl.innerText = `${((6500 - elapsed) / 1000).toFixed(1)}s`;
                cdEl.className = 'text-amber-400';
            }
        }

        // Update Summoned 3D Dragons
        for (let i = state.summonedDragons.length - 1; i >= 0; i--) {
            const dr = state.summonedDragons[i];
            dr.group.position.addScaledVector(dr.vel, dt);
            dr.life -= dt;
            const flap = Math.sin(time * 14) * 0.55;
            dr.leftWingPivot.rotation.z = flap;
            dr.rightWingPivot.rotation.z = -flap;

            const groundSpot = new THREE.Vector3(dr.group.position.x, 0.5, dr.group.position.z);
            if (now - dr.lastTick > 180) {
                dr.lastTick = now;
                createShockwaveRing(groundSpot, 0xff5500, 6.5);
                if (dr.isPlayerDragon) {
                    for (let j = state.zombies.length - 1; j >= 0; j--) {
                        if (state.zombies[j].mesh.position.distanceTo(groundSpot) < 7.5) {
                            damageZombie(state.zombies[j], 950, 'scavenger');
                        }
                    }
                    if (state.activeBoss && !state.activeBoss.dead && state.activeBoss.mesh.position.distanceTo(groundSpot) < 8.5) {
                        damageBoss(650);
                    }
                    if (state.activeMiniBoss && !state.activeMiniBoss.dead && state.activeMiniBoss.mesh.position.distanceTo(groundSpot) < 8.0) {
                        damageMiniBoss(750);
                    }
                } else if (state.playerPos.distanceTo(groundSpot) < 5.2 && now - state.lastDamageTime > 650) {
                    state.lastDamageTime = now;
                    state.health -= 20;
                    triggerDamageFlash();
                    updateHUD();
                    if (state.health <= 0) gameOver();
                }
            }
            if (dr.life <= 0) {
                scene.remove(dr.group);
                disposeObject3D(dr.group);
                state.summonedDragons.splice(i, 1);
            }
        }

        // Jeff the Highland Cow Automated Ally Defense
        if (state.jeffCow) {
            state.jeffCow.rotation.y = Math.sin(time * 1.5) * 0.35;
            if (now - state.jeffCow.userData.lastDefense > 2200) {
                for (let i = state.zombies.length - 1; i >= 0; i--) {
                    if (state.zombies[i].mesh.position.distanceTo(state.jeffCow.position) < 5.5) {
                        state.jeffCow.userData.lastDefense = now;
                        soundMgr.playDerpySound('moo');
                        createShockwaveRing(state.jeffCow.position.clone(), 0xfbbf24, 6);
                        damageZombie(state.zombies[i], 9999, 'thundergun');
                        break;
                    }
                }
            }
        }

        // Spawn Derpy Zombies
        if (state.zombiesRemainingToSpawn > 0 && state.zombies.length < 18 && now - lastZombieSpawn > 1400) {
            lastZombieSpawn = now;
            state.zombiesRemainingToSpawn--;
            spawnDerpyZombie();
            updateHUD();
        }

        // Update Derpy Zombies AI & Waddling Animation
        for (let i = state.zombies.length - 1; i >= 0; i--) {
            const z = state.zombies[i];
            const toPlayer = new THREE.Vector3(state.playerPos.x - z.mesh.position.x, 0, state.playerPos.z - z.mesh.position.z);
            const dist = toPlayer.length();
            if (dist > 0.1) {
                toPlayer.normalize();
                z.mesh.position.addScaledVector(toPlayer, z.speed * dt);
                z.mesh.lookAt(state.playerPos.x, z.mesh.position.y, state.playerPos.z);
            }
            z.mesh.rotation.z = Math.sin(time * 9 + z.wobbleSeed) * 0.14;
            z.headGroup.rotation.z = Math.cos(time * 11 + z.wobbleSeed) * 0.25;
            z.armL.rotation.x = -Math.PI / 2.3 + Math.sin(time * 12 + z.wobbleSeed) * 0.45;
            z.armR.rotation.x = -Math.PI / 2.3 - Math.sin(time * 12 + z.wobbleSeed) * 0.45;

            if (dist < 1.75 && now - state.lastDamageTime > 700) {
                state.lastDamageTime = now;
                state.health -= 18;
                triggerDamageFlash();
                updateHUD();
                if (state.health <= 0) gameOver();
            }
        }

        // Update Active Map Boss
        if (state.activeBoss && !state.activeBoss.dead) {
            const b = state.activeBoss;
            const toPlayer = new THREE.Vector3(state.playerPos.x - b.mesh.position.x, 0, state.playerPos.z - b.mesh.position.z);
            const dist = toPlayer.length();
            if (dist > 3.2) {
                toPlayer.normalize();
                b.mesh.position.addScaledVector(toPlayer, b.cfg.speed * dt);
            }
            b.mesh.lookAt(state.playerPos.x, b.mesh.position.y, state.playerPos.z);
            if (now - b.lastAttack > 3200) {
                b.lastAttack = now;
                performBossAttack(b);
            }
            if (dist < 2.8 && now - state.lastDamageTime > 750) {
                state.lastDamageTime = now;
                state.health -= 26;
                triggerDamageFlash();
                updateHUD();
                if (state.health <= 0) gameOver();
            }
        }

        // Update Active Mini-Boss
        if (state.activeMiniBoss && !state.activeMiniBoss.dead) {
            const mb = state.activeMiniBoss;
            mb.core.rotation.y += dt * 5;
            const toPlayer = new THREE.Vector3(state.playerPos.x - mb.mesh.position.x, 0, state.playerPos.z - mb.mesh.position.z);
            const dist = toPlayer.length();
            if (dist > 2.4) {
                toPlayer.normalize();
                mb.mesh.position.addScaledVector(toPlayer, mb.speed * dt);
            }
            mb.mesh.lookAt(state.playerPos.x, mb.mesh.position.y, state.playerPos.z);

            if (now - mb.lastAttack > 2600) {
                mb.lastAttack = now;
                const mbPos = mb.mesh.position.clone().add(new THREE.Vector3(0, 1.8, 0));
                const dir = state.playerPos.clone().sub(mbPos).normalize();
                const orb = new THREE.Mesh(
                    new THREE.SphereGeometry(0.32, 10, 10),
                    new THREE.MeshBasicMaterial({ color: mb.cfg.accent })
                );
                orb.position.copy(mbPos);
                scene.add(orb);
                state.bossProjectiles.push({ mesh: orb, vel: dir.multiplyScalar(21), dmg: 14, life: 3.0 });
                createShockwaveRing(mb.mesh.position.clone(), mb.cfg.accent, 4.5);
            }

            if (dist < 2.2 && now - state.lastDamageTime > 700) {
                state.lastDamageTime = now;
                state.health -= 20;
                triggerDamageFlash();
                updateHUD();
                if (state.health <= 0) gameOver();
            }
        }

        // Update Player Projectiles
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
            const p = state.projectiles[i];
            p.mesh.position.addScaledVector(p.vel, dt);
            p.life -= dt;
            if (p.type === 'sandwich' || p.type === 'boss_candy_cane') {
                p.mesh.rotation.y += dt * 12;
                p.mesh.rotation.x += dt * 9;
            }

            let hit = false;
            for (let j = state.zombies.length - 1; j >= 0; j--) {
                const z = state.zombies[j];
                const zCenter = z.mesh.position.clone().add(new THREE.Vector3(0, 1.1, 0));
                const hitRadius = p.type === 'straight_sword_cut' ? 2.6 : 1.35;
                if (p.mesh.position.distanceTo(zCenter) < hitRadius) {
                    if (p.type === 'straight_sword_cut') {
                        if (!p.hitSet.has(z)) {
                            p.hitSet.add(z);
                            createShockwaveRing(zCenter, 0xf59e0b, 4.2);
                            damageZombie(z, p.damage, 'boss_knight_sword');
                        }
                        continue;
                    } else {
                        createShockwaveRing(zCenter, 0x22c55e, 3.5);
                        damageZombie(z, p.damage, p.type);
                        triggerAoEDamage(zCenter, p.aoeRadius, p.damage, p.type, z);
                        hit = true;
                        break;
                    }
                }
            }

            if (!hit && state.activeBoss && !state.activeBoss.dead) {
                const bossCenter = state.activeBoss.mesh.position.clone().add(new THREE.Vector3(0, 2.2, 0));
                const bossHitRadius = p.type === 'straight_sword_cut' ? 3.2 : 2.3;
                if (p.mesh.position.distanceTo(bossCenter) < bossHitRadius) {
                    const bossAccentColor = state.activeBoss.cfg ? state.activeBoss.cfg.accentColor : 0xfbbf24;
                    if (p.type === 'straight_sword_cut') {
                        if (!p.hitSet.has('boss')) {
                            p.hitSet.add('boss');
                            damageBoss(p.damage);
                            createShockwaveRing(p.mesh.position.clone(), bossAccentColor, 5.5);
                        }
                    } else {
                        damageBoss(p.damage);
                        createShockwaveRing(p.mesh.position.clone(), bossAccentColor, 5);
                        triggerAoEDamage(p.mesh.position.clone(), p.aoeRadius, p.damage, p.type);
                        hit = true;
                    }
                }
            }

            if (!hit && state.activeMiniBoss && !state.activeMiniBoss.dead) {
                const mbCenter = state.activeMiniBoss.mesh.position.clone().add(new THREE.Vector3(0, 1.7, 0));
                const mbHitRadius = p.type === 'straight_sword_cut' ? 2.8 : 1.9;
                if (p.mesh.position.distanceTo(mbCenter) < mbHitRadius) {
                    const mbAccent = state.activeMiniBoss.cfg ? state.activeMiniBoss.cfg.accent : 0x38bdf8;
                    if (p.type === 'straight_sword_cut') {
                        if (!p.hitSet.has('miniboss')) {
                            p.hitSet.add('miniboss');
                            damageMiniBoss(p.damage);
                            createShockwaveRing(p.mesh.position.clone(), mbAccent, 4.5);
                        }
                    } else {
                        damageMiniBoss(p.damage);
                        createShockwaveRing(p.mesh.position.clone(), mbAccent, 4.2);
                        triggerAoEDamage(p.mesh.position.clone(), p.aoeRadius, p.damage, p.type);
                        hit = true;
                    }
                }
            }

            if (hit || p.life <= 0) {
                scene.remove(p.mesh);
                disposeObject3D(p.mesh);
                state.projectiles.splice(i, 1);
            }
        }

        // Update Boss Projectiles
        for (let i = state.bossProjectiles.length - 1; i >= 0; i--) {
            const bp = state.bossProjectiles[i];
            bp.mesh.position.addScaledVector(bp.vel, dt);
            if (!bp.isStraightCut) {
                bp.mesh.rotation.x += dt * 5;
                bp.mesh.rotation.y += dt * 5;
            }
            bp.life -= dt;

            if (bp.mesh.position.distanceTo(state.playerPos) < (bp.isStraightCut ? 2.3 : 1.6)) {
                state.health -= bp.dmg;
                triggerDamageFlash();
                updateHUD();
                scene.remove(bp.mesh);
                disposeObject3D(bp.mesh);
                state.bossProjectiles.splice(i, 1);
                if (state.health <= 0) gameOver();
                continue;
            }
            if (bp.life <= 0) {
                scene.remove(bp.mesh);
                disposeObject3D(bp.mesh);
                state.bossProjectiles.splice(i, 1);
            }
        }

        // Update Expanding Shockwave Rings
        for (let i = state.shockwaveRings.length - 1; i >= 0; i--) {
            const r = state.shockwaveRings[i];
            r.life -= dt;
            const progress = 1 - r.life / r.maxLife;
            const s = 1 + progress * r.maxRadius;
            r.mesh.scale.set(s, s, 1);
            r.mesh.material.opacity = Math.max(0, 1 - progress);
            if (r.life <= 0) {
                scene.remove(r.mesh);
                disposeObject3D(r.mesh);
                state.shockwaveRings.splice(i, 1);
            }
        }

        // Update Rudolph Red-Nose Laser Beams
        for (let i = state.laserBeams.length - 1; i >= 0; i--) {
            const lb = state.laserBeams[i];
            lb.life -= dt;
            lb.mesh.material.opacity = Math.max(0, lb.life / lb.maxLife);
            if (lb.life <= 0) {
                scene.remove(lb.mesh);
                disposeObject3D(lb.mesh);
                state.laserBeams.splice(i, 1);
            }
        }

        // Spin Boss Loot Crates & Secret Passage Indicators
        state.bossLootCrates.forEach(c => {
            c.mesh.rotation.y += dt * 2.2;
        });
        if (state.hiddenMapSecretPassage && state.hiddenMapSecretPassage.userData && state.hiddenMapSecretPassage.userData.animPart) {
            state.hiddenMapSecretPassage.userData.animPart.rotation.z += dt * 1.2;
        }

        // Update Center Interaction Prompt & Dedicated Touchscreen Interact Buttons
        const inter = getNearbyInteraction();
        const promptEl = document.getElementById('interact-prompt');
        const contextBtn = document.getElementById('context-interact-btn');
        const touchInteractBtn = document.getElementById('touch-interact');
        const touchInteractSub = document.getElementById('touch-interact-sub');

        if (inter) {
            promptEl.innerText = inter.label;
            promptEl.classList.remove('hidden');

            if (contextBtn) {
                contextBtn.innerText = `✋ ${inter.shortLabel}`;
                contextBtn.classList.remove('hidden');
            }
            if (touchInteractSub) {
                touchInteractSub.innerText = inter.shortLabel;
            }
            if (touchInteractBtn) {
                touchInteractBtn.classList.add('border-emerald-400', 'bg-emerald-950/95');
                touchInteractBtn.classList.remove('border-amber-400', 'bg-amber-950/95');
            }
        } else {
            promptEl.classList.add('hidden');
            if (contextBtn) contextBtn.classList.add('hidden');
            if (touchInteractSub) {
                touchInteractSub.innerText = 'Box • PaP • Crates';
            }
            if (touchInteractBtn) {
                touchInteractBtn.classList.remove('border-emerald-400', 'bg-emerald-950/95');
                touchInteractBtn.classList.add('border-amber-400', 'bg-amber-950/95');
            }
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', () => {
    initMenusAndEvents();
    buildMapEnvironment(state.currentMapKey, { scene, mapGroup, ambientLight, centerPointLight });
    rebuildWeaponModel();
    updateArmoryBadge();
    animate();
});
