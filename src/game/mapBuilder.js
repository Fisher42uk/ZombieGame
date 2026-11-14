import * as THREE from 'three';
import { MAPS, MAP_SECRET_CONFIG } from '../data/maps.js';
import { state, mysteryBoxPos, papPos, perkStations } from './state.js';
import { createFloorTexture, createBillboardLabel, disposeObject3D } from './threeUtils.js';
import { buildJeffHighlandCow } from './models.js';

export function buildMapEnvironment(mapKey, { scene, mapGroup, ambientLight, centerPointLight }) {
    while (mapGroup.children.length > 0) {
        const child = mapGroup.children[0];
        mapGroup.remove(child);
        disposeObject3D(child);
    }
    state.jeffCow = null;
    state.hiddenMapSecretPassage = null;
    state.returnPortalMesh = null;
    state.mapColliders = [];

    let cfg = MAPS[mapKey] || MAPS.medieval_castle;
    if (mapKey === 'secret_boss_arena' && state.activeSecretArenaConfig) {
        cfg = {
            ...MAPS.secret_boss_arena,
            floorColor: state.activeSecretArenaConfig.arenaFloor || '#1e1b4b',
            floorAccent: '#' + state.activeSecretArenaConfig.color.toString(16).padStart(6, '0'),
            wallColor: state.activeSecretArenaConfig.arenaWall || 0x311042,
            pillarColor: state.activeSecretArenaConfig.color,
            pointLightColor: state.activeSecretArenaConfig.color
        };
    }
    scene.background = new THREE.Color(cfg.skyColor);
    scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);
    ambientLight.color.setHex(cfg.ambientColor);
    centerPointLight.color.setHex(cfg.pointLightColor);

    // Floor
    const floorTex = createFloorTexture(cfg.floorColor, cfg.floorAccent);
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(76, 76),
        new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    mapGroup.add(floor);

    // Perimeter Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.8, metalness: 0.2 });
    const wallSpecs = [
        [0, 6, -37, 76, 12, 2],
        [0, 6, 37, 76, 12, 2],
        [-37, 6, 0, 2, 12, 76],
        [37, 6, 0, 2, 12, 76]
    ];
    wallSpecs.forEach(([x, y, z, w, h, d]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        wall.position.set(x, y, z);
        wall.receiveShadow = true;
        mapGroup.add(wall);
    });

    // 6 Tactical Pillars + Colliders
    const pillarMat = new THREE.MeshStandardMaterial({ color: cfg.pillarColor, roughness: 0.6, metalness: 0.3 });
    const pillarCoords = [[-14, -18], [14, -18], [-14, 0], [14, 0], [-14, 18], [14, 18]];
    pillarCoords.forEach(([px, pz]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 12, 12), pillarMat);
        p.position.set(px, 6, pz);
        p.castShadow = true;
        mapGroup.add(p);
        state.mapColliders.push({ x: px, z: pz, radius: 1.8 });
    });

    // Mystery Box Station
    const boxBase = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 1.1, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.5, roughness: 0.4 })
    );
    boxBase.position.copy(mysteryBoxPos).add(new THREE.Vector3(0, 0.55, 0));
    const boxCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
    );
    boxCrystal.position.copy(mysteryBoxPos).add(new THREE.Vector3(0, 1.9, 0));
    const boxLabel = createBillboardLabel('🎁 MYSTERY BOX [£950]', '#0f172a', '#38bdf8');
    boxLabel.position.copy(mysteryBoxPos).add(new THREE.Vector3(0, 3.1, 0));
    mapGroup.add(boxBase, boxCrystal, boxLabel);
    state.mapColliders.push({ x: mysteryBoxPos.x, z: mysteryBoxPos.z, radius: 1.7 });

    // Pack-a-Punch Station
    const papBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 3.2, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x3b0764, emissive: 0x7e22ce, emissiveIntensity: 0.45, metalness: 0.7 })
    );
    papBody.position.copy(papPos).add(new THREE.Vector3(0, 1.6, 0));
    const papLabel = createBillboardLabel('⚡ PACK-A-PUNCH [£5000]', '#2e1065', '#e879f9');
    papLabel.position.copy(papPos).add(new THREE.Vector3(0, 3.9, 0));
    mapGroup.add(papBody, papLabel);
    state.mapColliders.push({ x: papPos.x, z: papPos.z, radius: 1.8 });

    // 4 Perk-a-Cola Machines
    perkStations.forEach(ps => {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 2.8, 1.4),
            new THREE.MeshStandardMaterial({ color: ps.color, emissive: ps.color, emissiveIntensity: 0.35 })
        );
        m.position.copy(ps.pos).add(new THREE.Vector3(0, 1.4, 0));
        const lbl = createBillboardLabel(`${ps.name} [£${ps.cost}]`, '#18181b', '#fbbf24');
        lbl.position.copy(ps.pos).add(new THREE.Vector3(0, 3.4, 0));
        mapGroup.add(m, lbl);
        state.mapColliders.push({ x: ps.pos.x, z: ps.pos.z, radius: 1.3 });
    });

    // Map-Specific Landmarks
    if (mapKey === 'theater') {
        const stage = new THREE.Mesh(
            new THREE.BoxGeometry(22, 1.2, 10),
            new THREE.MeshStandardMaterial({ color: 0x451a03 })
        );
        stage.position.set(0, 0.6, -26);
        mapGroup.add(stage);

        state.jeffCow = buildJeffHighlandCow();
        state.jeffCow.position.set(0, 0, -14);
        mapGroup.add(state.jeffCow);
        state.mapColliders.push({ x: 0, z: -14, radius: 1.6 });
    } else if (mapKey === 'jungle') {
        const temple = new THREE.Mesh(
            new THREE.ConeGeometry(9, 10, 4),
            new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
        );
        temple.position.set(0, 5, -24);
        temple.rotation.y = Math.PI / 4;
        mapGroup.add(temple);
        state.mapColliders.push({ x: 0, z: -24, radius: 6.5 });
    } else if (mapKey === 'chocolate_arena' || mapKey === 'secret_boss_arena') {
        const returnMapName = (MAPS[state.previousMapBeforeSecretArena] || MAPS.jungle).name;
        const portal = new THREE.Mesh(
            new THREE.TorusGeometry(2.2, 0.25, 12, 28),
            new THREE.MeshBasicMaterial({ color: 0x10b981 })
        );
        portal.position.set(0, 2.5, 26);
        const portalLbl = createBillboardLabel(`🌀 EXIT PORTAL TO ${returnMapName.toUpperCase()} [F]`, '#064e3b', '#34d399');
        portalLbl.position.set(0, 5.2, 26);
        mapGroup.add(portal, portalLbl);
        state.returnPortalMesh = portal;
    } else if (mapKey === 'medieval_castle') {
        const stoneLightMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.85, metalness: 0.15 });
        const stoneDarkMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9, metalness: 0.2 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.2 });
        const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.2 });
        const bannerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0x7f1d1d, emissiveIntensity: 0.3, side: THREE.DoubleSide });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.25 });

        for (let m = -32; m <= 32; m += 4) {
            const merlonN = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.4), stoneLightMat);
            merlonN.position.set(m, 13.1, -36);
            const merlonS = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.4), stoneLightMat);
            merlonS.position.set(m, 13.1, 36);
            const merlonW = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), stoneLightMat);
            merlonW.position.set(-36, 13.1, m);
            const merlonE = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), stoneLightMat);
            merlonE.position.set(36, 13.1, m);
            mapGroup.add(merlonN, merlonS, merlonW, merlonE);
        }

        const turretCorners = [[-33, -33], [33, -33], [-33, 33], [33, 33]];
        turretCorners.forEach(([tx, tz]) => {
            const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 18, 16), stoneDarkMat);
            towerBody.position.set(tx, 9, tz);
            const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 7.5, 16), roofMat);
            spireRoof.position.set(tx, 21.8, tz);
            const flagpole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8), goldTrimMat);
            flagpole.position.set(tx, 26.8, tz);
            const pennant = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), bannerMat);
            pennant.position.set(tx + 1.1, 27.6, tz);
            mapGroup.add(towerBody, spireRoof, flagpole, pennant);
        });

        const keepBuilding = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 10), stoneDarkMat);
        keepBuilding.position.set(0, 8, -31);
        const roseWindow = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.28, 12, 24), goldTrimMat);
        roseWindow.position.set(0, 11.5, -25.8);
        mapGroup.add(keepBuilding, roseWindow);

        [-7, 7].forEach(bx => {
            const banner = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.5, 0.15), bannerMat);
            banner.position.set(bx, 9.5, -25.8);
            mapGroup.add(banner);
        });

        const royalCarpet = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.06, 56),
            new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 })
        );
        royalCarpet.position.set(0, 0.03, 0);
        const dais = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 5), stoneLightMat);
        dais.position.set(0, 0.6, -23.5);
        const throneBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, 0.4), goldTrimMat);
        throneBack.position.set(0, 2.8, -24.8);
        mapGroup.add(royalCarpet, dais, throneBack);

        const gateArchL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 13, 4.5), stoneDarkMat);
        gateArchL.position.set(-6.5, 6.5, 33.5);
        const gateArchR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 13, 4.5), stoneDarkMat);
        gateArchR.position.set(6.5, 6.5, 33.5);
        const gateHeader = new THREE.Mesh(new THREE.BoxGeometry(17.5, 4.0, 4.8), stoneLightMat);
        gateHeader.position.set(0, 11.5, 33.5);
        mapGroup.add(gateArchL, gateArchR, gateHeader);
        state.mapColliders.push({ x: -6.5, z: 33.5, radius: 2.8 }, { x: 6.5, z: 33.5, radius: 2.8 });

        for (let gx = -3.6; gx <= 3.6; gx += 0.9) {
            const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 9.5, 8), ironMat);
            bar.position.set(gx, 4.75, 33.5);
            mapGroup.add(bar);
        }

        [[-6, -16], [6, -16], [-6, 0], [6, 0], [-6, 16], [6, 16]].forEach(([bx, bz]) => {
            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.6, 10), ironMat);
            stand.position.set(bx, 0.8, bz);
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 10), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            flame.position.set(bx, 1.95, bz);
            mapGroup.add(stand, flame);
            state.mapColliders.push({ x: bx, z: bz, radius: 0.9 });
        });
    } else if (mapKey === 'christmas') {
        const pineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
        const starMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 3.2, 12), trunkMat);
        trunk.position.set(0, 1.6, -24);
        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(6.5, 6.5, 16), pineMat);
        tier1.position.set(0, 5.5, -24);
        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(5.0, 5.8, 16), pineMat);
        tier2.position.set(0, 9.2, -24);
        const tier3 = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5.0, 16), pineMat);
        tier3.position.set(0, 12.6, -24);
        const starTop = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), starMat);
        starTop.position.set(0, 15.6, -24);
        mapGroup.add(trunk, tier1, tier2, tier3, starTop);
        state.mapColliders.push({ x: 0, z: -24, radius: 4.2 });

        const giftColors = [0xef4444, 0x22c55e, 0x3b82f6, 0xfbbf24, 0xa855f7];
        for (let gIdx = 0; gIdx < 8; gIdx++) {
            const ang = (gIdx / 8) * Math.PI * 2;
            const gift = new THREE.Mesh(
                new THREE.BoxGeometry(1.3, 1.1, 1.3),
                new THREE.MeshStandardMaterial({ color: giftColors[gIdx % giftColors.length], roughness: 0.4 })
            );
            gift.position.set(Math.cos(ang) * 4.5, 0.55, -24 + Math.sin(ang) * 4.5);
            mapGroup.add(gift);
        }

        const redCandyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3 });
        [[-10, -14], [10, -14], [-10, 4], [10, 4], [-10, 20], [10, 20]].forEach(([cx, cz]) => {
            const caneGroup = new THREE.Group();
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 5.2, 12), snowMat);
            shaft.position.y = 2.6;
            caneGroup.add(shaft);
            for (let s = 0; s < 5; s++) {
                const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.08, 8, 16), redCandyMat);
                band.rotation.x = Math.PI / 2 + 0.25;
                band.position.y = 0.8 + s * 0.95;
                caneGroup.add(band);
            }
            const hook = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.3, 10, 18, Math.PI), redCandyMat);
            hook.position.set(0.75, 5.2, 0);
            caneGroup.add(hook);
            caneGroup.position.set(cx, 0, cz);
            mapGroup.add(caneGroup);
            state.mapColliders.push({ x: cx, z: cz, radius: 0.8 });
        });

        [-22, 22].forEach(sx => {
            const snowman = new THREE.Group();
            const bot = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), snowMat);
            bot.position.y = 1.1;
            const mid = new THREE.Mesh(new THREE.SphereGeometry(0.88, 12, 12), snowMat);
            mid.position.y = 2.65;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), snowMat);
            head.position.y = 3.8;
            const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
            nose.rotation.x = Math.PI / 2;
            nose.position.set(0, 3.8, 0.65);
            snowman.add(bot, mid, head, nose);
            snowman.position.set(sx, 0, -4);
            mapGroup.add(snowman);
            state.mapColliders.push({ x: sx, z: -4, radius: 1.5 });
        });
    }

    // Disguised Secret Passage on all 17 Maps
    if (MAP_SECRET_CONFIG[mapKey]) {
        const sCfg = MAP_SECRET_CONFIG[mapKey];
        const passageGroup = new THREE.Group();

        if (sCfg.hideType === 'fake_wall') {
            const wallDisguise = new THREE.Mesh(
                new THREE.BoxGeometry(2.6, 3.4, 0.45),
                new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.75 })
            );
            wallDisguise.position.y = 1.7;
            const crackGlow = new THREE.Mesh(
                new THREE.RingGeometry(0.45, 0.65, 16),
                new THREE.MeshBasicMaterial({ color: sCfg.color, side: THREE.DoubleSide })
            );
            crackGlow.position.set(0, 1.7, 0.28);
            passageGroup.add(wallDisguise, crackGlow);
            passageGroup.userData = { ...sCfg, animPart: crackGlow };
        } else if (sCfg.hideType === 'fake_floor') {
            const trapdoor = new THREE.Mesh(
                new THREE.BoxGeometry(2.4, 0.14, 2.4),
                new THREE.MeshStandardMaterial({ color: cfg.pillarColor, roughness: 0.65 })
            );
            trapdoor.position.y = 0.08;
            const runeRing = new THREE.Mesh(
                new THREE.RingGeometry(0.55, 0.85, 20),
                new THREE.MeshBasicMaterial({ color: sCfg.color, side: THREE.DoubleSide })
            );
            runeRing.rotation.x = -Math.PI / 2;
            runeRing.position.y = 0.18;
            passageGroup.add(trapdoor, runeRing);
            passageGroup.userData = { ...sCfg, animPart: runeRing };
        } else {
            const shieldWall = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 2.8, 0.4),
                new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.8 })
            );
            shieldWall.position.set(0, 1.4, -0.5);
            const miniRift = new THREE.Mesh(
                new THREE.TorusGeometry(0.85, 0.12, 10, 24),
                new THREE.MeshBasicMaterial({ color: sCfg.color })
            );
            miniRift.position.y = 1.15;
            const innerVortex = new THREE.Mesh(
                new THREE.CircleGeometry(0.75, 20),
                new THREE.MeshBasicMaterial({ color: sCfg.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
            );
            innerVortex.position.y = 1.15;

            passageGroup.add(shieldWall, miniRift, innerVortex);
            passageGroup.userData = { ...sCfg, animPart: miniRift };
        }

        passageGroup.position.copy(sCfg.pos);
        mapGroup.add(passageGroup);
        state.hiddenMapSecretPassage = passageGroup;
    }
}
