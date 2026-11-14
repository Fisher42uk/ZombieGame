import * as THREE from 'three';
import { WEAPONS } from '../data/weapons.js';
import { createBillboardLabel } from './threeUtils.js';

export function buildJeffHighlandCow() {
    const cow = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.9 });
    const fringeMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.95 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3, metalness: 0.2 });
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 2.5), coatMat);
    body.position.y = 1.25;
    cow.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 1.15), coatMat);
    head.position.set(0, 1.65, 1.45);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.55, 0.65), fringeMat);
    fringe.position.set(0, 1.9, 1.75);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.45), snoutMat);
    snout.position.set(0, 1.42, 2.08);

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 10), hornMat);
    hornL.position.set(-0.75, 2.1, 1.45);
    hornL.rotation.z = Math.PI / 3;
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 10), hornMat);
    hornR.position.set(0.75, 2.1, 1.45);
    hornR.rotation.z = -Math.PI / 3;

    [[-0.55, -0.8], [0.55, -0.8], [-0.55, 0.8], [0.55, 0.8]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.9, 10), coatMat);
        leg.position.set(lx, 0.45, lz);
        cow.add(leg);
    });

    const lbl = createBillboardLabel('🐮 JEFF THE HIGHLAND COW [PET: F]', '#451a03', '#fbbf24');
    lbl.position.set(0, 3.1, 0);

    cow.add(head, fringe, snout, hornL, hornR, lbl);
    cow.userData = { lastDefense: 0 };
    return cow;
}

export function build3DDragonMesh(isPlayerDragon) {
    const dGroup = new THREE.Group();
    const scaleColor = isPlayerDragon ? 0xdc2626 : 0x7c2d12;
    const bellyColor = isPlayerDragon ? 0xfbbf24 : 0xf97316;

    const scaleMat = new THREE.MeshStandardMaterial({ color: scaleColor, roughness: 0.4, metalness: 0.45 });
    const goldMat = new THREE.MeshStandardMaterial({ color: bellyColor, emissive: bellyColor, emissiveIntensity: 0.6 });
    const wingMat = new THREE.MeshStandardMaterial({
        color: isPlayerDragon ? 0xf97316 : 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 3.6), scaleMat);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.2, 8), scaleMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 0, -3.1);
    dGroup.add(body, tail);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.55, 2.3);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 1.25), scaleMat);
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 8), goldMat);
    hornL.position.set(-0.42, 0.65, -0.2);
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 8), goldMat);
    hornR.position.set(0.42, 0.65, -0.2);

    const fireBreath = new THREE.Mesh(
        new THREE.ConeGeometry(1.35, 6.5, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    fireBreath.rotation.x = Math.PI / 2 + 0.35;
    fireBreath.position.set(0, -1.2, 3.8);
    headGroup.add(skull, hornL, hornR, fireBreath);
    dGroup.add(headGroup);

    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-0.7, 0.35, 0.3);
    const leftWingMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.4), wingMat);
    leftWingMesh.position.set(-2.1, 0, -0.2);
    leftWingPivot.add(leftWingMesh);

    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(0.7, 0.35, 0.3);
    const rightWingMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 2.4), wingMat);
    rightWingMesh.position.set(2.1, 0, -0.2);
    rightWingPivot.add(rightWingMesh);

    dGroup.add(leftWingPivot, rightWingPivot);
    return { group: dGroup, leftWingPivot, rightWingPivot, fireBreath };
}

export function buildWeaponModel(wKey, isPacked) {
    const wObj = WEAPONS[wKey] || WEAPONS.m1911;
    const animParts = [];

    let glowHex = isPacked ? 0xe879f9 : (wObj.projColor || 0x22c55e);
    if (wKey === 'raygun_mk2') glowHex = 0xef4444;
    else if (wKey === 'thundergun') glowHex = 0x38bdf8;
    else if (wKey === 'wunderwaffe') glowHex = 0xfacc15;
    else if (wKey === 'apothicon') glowHex = 0xa855f7;
    else if (wKey === 'winter' || wKey === 'staff_ice') glowHex = 0x67e8f9;
    else if (wKey === 'boss_knight_sword' || wKey === 'ach_highland_bfg') glowHex = 0xf59e0b;

    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.92, roughness: 0.15 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.35, metalness: 0.9, roughness: 0.2 });
    const glowMat = new THREE.MeshStandardMaterial({ color: glowHex, emissive: glowHex, emissiveIntensity: 0.95, roughness: 0.1 });

    const g = new THREE.Group();

    if (wKey === 'sandwich') {
        const sGroup = new THREE.Group();
        sGroup.position.set(0.04, -0.04, -0.15);
        sGroup.rotation.set(0.18, -0.35, 0);

        const breadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
        const crumbMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9 });
        const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
        const hamMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
        const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });

        const botBread = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.24), crumbMat);
        const lettuce = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.26), lettuceMat);
        lettuce.position.y = 0.03;
        const ham = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.028, 0.23), hamMat);
        ham.position.y = 0.055;
        const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.018, 0.25), cheeseMat);
        cheese.position.y = 0.075;
        cheese.rotation.y = 0.22;
        const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), tomatoMat);
        tomato.position.y = 0.095;
        const topBread = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.24), breadMat);
        topBread.position.y = 0.125;

        const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6), crumbMat);
        pick.position.y = 0.17;
        const olive = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), lettuceMat);
        olive.position.y = 0.22;

        sGroup.add(botBread, lettuce, ham, cheese, tomato, topBread, pick, olive);
        g.add(sGroup);
        animParts.push({ mesh: olive, pulse: true });
    } else if (wKey === 'boss_knight_sword') {
        const swordHolder = new THREE.Group();
        swordHolder.position.set(0.08, -0.08, -0.22);
        swordHolder.rotation.set(0.32, -0.22, -0.15);

        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
        const rubyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.9 });
        const bladeSteelMat = new THREE.MeshStandardMaterial({
            color: isPacked ? 0xfef08a : 0xe2e8f0,
            emissive: isPacked ? 0xf59e0b : 0x38bdf8,
            emissiveIntensity: isPacked ? 0.55 : 0.22,
            metalness: 0.96,
            roughness: 0.1
        });

        const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), goldMat);
        pommel.position.set(0, -0.26, 0.12);
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.28, 12), leatherMat);
        hilt.position.set(0, -0.11, 0.06);
        hilt.rotation.x = -0.35;
        const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.042, 0.065), goldMat);
        crossguard.position.set(0, 0.02, 0);
        const centerRuby = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), rubyMat);
        centerRuby.position.set(0, 0.02, 0.035);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.88, 0.018), bladeSteelMat);
        blade.position.set(0, 0.46, -0.16);
        blade.rotation.x = -0.35;
        const fullerRune = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.78, 0.024), glowMat);
        fullerRune.position.set(0, 0.44, -0.155);
        fullerRune.rotation.x = -0.35;
        const dragonAura = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 20), glowMat);
        dragonAura.position.set(0, 0.42, -0.15);
        dragonAura.rotation.x = Math.PI / 2 - 0.35;

        swordHolder.add(pommel, hilt, crossguard, centerRuby, blade, fullerRune, dragonAura);
        g.add(swordHolder);
        animParts.push({ mesh: dragonAura, rotZ: 5.5, pulse: true });
    } else if (wKey === 'boss_candy_cane') {
        const whiteCandyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.2 });
        const redCandyMat = new THREE.MeshStandardMaterial({ color: isPacked ? 0xe879f9 : 0xef4444, emissive: isPacked ? 0xc026d3 : 0x991b1b, emissiveIntensity: 0.45, roughness: 0.2 });
        const mintGreenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.5 });

        const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.24, 12), whiteCandyMat);
        grip.position.set(0, -0.14, 0.08);
        grip.rotation.x = 0.28;

        const candyBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.62, 14), whiteCandyMat);
        candyBarrel.rotation.x = Math.PI / 2;
        candyBarrel.position.set(0, 0.02, -0.28);
        g.add(grip, candyBarrel);

        for (let s = 0; s < 6; s++) {
            const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.012, 8, 18), redCandyMat);
            stripe.position.set(0, 0.02, -0.04 - s * 0.095);
            stripe.rotation.y = 0.35;
            g.add(stripe);
        }

        const caneHook = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.036, 10, 20, Math.PI), redCandyMat);
        caneHook.position.set(0, 0.11, -0.58);
        caneHook.rotation.y = Math.PI / 2;

        const peppermintWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 16), redCandyMat);
        peppermintWheel.rotation.x = Math.PI / 2;
        peppermintWheel.position.set(0, 0.09, -0.22);
        const mintCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), mintGreenMat);
        mintCore.position.set(0, 0.14, -0.22);

        g.add(caneHook, peppermintWheel, mintCore);
        animParts.push({ mesh: peppermintWheel, rotZ: 6 }, { mesh: mintCore, rotY: 5, pulse: true });
    } else if (wKey === 'secret_rudolph_laser') {
        const furMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
        const antlerMat = new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.65, roughness: 0.3 });
        const redNoseMat = new THREE.MeshBasicMaterial({ color: isPacked ? 0xff00ff : 0xff0000 });

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.22, 0.1), furMat);
        grip.position.set(0, -0.14, 0.08);
        grip.rotation.x = 0.28;

        const reindeerBody = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.44), furMat);
        reindeerBody.position.set(0, 0.01, -0.12);
        const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.062, 0.28, 12), furMat);
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, 0.01, -0.44);

        const redNose = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 16), redNoseMat);
        redNose.position.set(0, 0.02, -0.60);
        const noseHalo = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.01, 8, 20), redNoseMat);
        noseHalo.position.set(0, 0.02, -0.60);

        const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.26, 8), antlerMat);
        antlerL.position.set(-0.09, 0.16, -0.18);
        antlerL.rotation.z = 0.45;
        const antlerR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.26, 8), antlerMat);
        antlerR.position.set(0.09, 0.16, -0.18);
        antlerR.rotation.z = -0.45;

        g.add(grip, reindeerBody, snout, redNose, noseHalo, antlerL, antlerR);
        animParts.push({ mesh: noseHalo, rotZ: 8, pulse: true }, { mesh: redNose, pulse: true });
    } else {
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.22, 0.1), darkSteelMat);
        grip.position.set(0, -0.14, 0.08);
        grip.rotation.x = 0.28;
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.46), darkSteelMat);
        receiver.position.set(0, 0, -0.08);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.042, 0.48, 14), chromeMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.42);

        const sightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.065, 0.08), goldMat);
        sightFrame.position.set(0, 0.095, -0.05);
        const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), glowMat);
        reticleDot.position.set(0, 0.098, -0.05);

        for (let r = 0; r < 3; r++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.058 + r * 0.008, 0.007, 8, 20), glowMat);
            ring.position.set(0, 0.02, -0.28 - r * 0.11);
            g.add(ring);
            animParts.push({ mesh: ring, rotZ: (r % 2 === 0 ? 4 : -4) });
        }

        const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), glowMat);
        coreCrystal.position.set(0, 0.08, -0.22);
        g.add(grip, receiver, barrel, sightFrame, reticleDot, coreCrystal);
        animParts.push({ mesh: coreCrystal, rotY: 5, pulse: true });

        if (wKey === 'secret_holy_grenade') {
            const orb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), goldMat);
            orb.position.set(0, 0.08, -0.36);
            const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.11, 0.025), goldMat);
            crossV.position.set(0, 0.2, -0.36);
            const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.025), goldMat);
            crossH.position.set(0, 0.21, -0.36);
            g.add(orb, crossV, crossH);
        } else if (wKey === 'secret_popcorn') {
            const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
            bucket.position.set(0, 0.13, -0.22);
            const kernel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.065, 0), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
            kernel.position.set(0, 0.22, -0.22);
            g.add(bucket, kernel);
            animParts.push({ mesh: kernel, rotY: 6, pulse: true });
        } else if (wKey === 'secret_pufferfish' || wKey === 'secret_balloon' || wKey === 'secret_scarab') {
            const spiky = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 0), glowMat);
            spiky.position.set(0, 0.06, -0.44);
            g.add(spiky);
            animParts.push({ mesh: spiky, rotY: 7, rotZ: 5, pulse: true });
        }

        if (wKey === 'ach_highland_bfg') {
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.25 });
            const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.24, 10), hornMat);
            hornL.position.set(-0.14, 0.06, -0.35);
            hornL.rotation.z = Math.PI / 3;
            const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.24, 10), hornMat);
            hornR.position.set(0.14, 0.06, -0.35);
            hornR.rotation.z = -Math.PI / 3;
            g.add(hornL, hornR);
        }
    }

    const muzzleFlashMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09, 0),
        new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0 })
    );
    muzzleFlashMesh.position.set(0, 0.02, -0.72);
    const muzzleLight = new THREE.PointLight(glowHex, 0, 6);
    muzzleLight.position.set(0, 0.02, -0.72);
    g.add(muzzleFlashMesh, muzzleLight);

    g.position.set(0.27, -0.24, -0.45);
    return { group: g, animParts, muzzleFlashMesh, muzzleLight };
}

export function buildZombieMesh(scale) {
    const zGroup = new THREE.Group();
    const shirtColors = [0x16a34a, 0x2563eb, 0x9333ea, 0xd97706, 0xdc2626];
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: shirtColors[Math.floor(Math.random() * shirtColors.length)], roughness: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.45), clothesMat);
    torso.position.y = 1.1;
    zGroup.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.95, 0);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.78, 0.78), skinMat);
    const whiteEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), whiteEyeMat);
    eyeL.position.set(-0.2, 0.08, 0.38);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pupilMat);
    pupilL.position.set(-0.22, 0.12, 0.51);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), whiteEyeMat);
    eyeR.position.set(0.2, 0.05, 0.38);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pupilMat);
    pupilR.position.set(0.23, 0.01, 0.53);

    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.35), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    tongue.position.set(0.08, -0.28, 0.44);
    tongue.rotation.z = 0.25;

    headGroup.add(skull, eyeL, pupilL, eyeR, pupilR, tongue);
    zGroup.add(headGroup);

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), skinMat);
    armL.position.set(-0.55, 1.35, 0.3);
    armL.rotation.x = -Math.PI / 2.3;
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), skinMat);
    armR.position.set(0.55, 1.35, 0.3);
    armR.rotation.x = -Math.PI / 2.3;
    zGroup.add(armL, armR);

    zGroup.scale.setScalar(scale);
    return { zGroup, headGroup, armL, armR };
}

export function buildBossMesh(bKey, cfg) {
    const bossGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyColor, roughness: 0.4, metalness: 0.6 });
    const accentMat = new THREE.MeshStandardMaterial({ color: cfg.accentColor, emissive: cfg.accentColor, emissiveIntensity: 0.65 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.9), bodyMat);
    torso.position.y = 1.5;
    bossGroup.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.85, 0);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), bodyMat);
    headGroup.add(headMesh);

    let specialProp = null;
    if (bKey === 'secret_boss_rudolph') {
        bossGroup.remove(torso);
        headGroup.remove(headMesh);
        torso.geometry.dispose();
        headMesh.geometry.dispose();

        const furMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.8 });
        const hoofMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.5 });
        const collarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
        const goldBellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.15 });
        const antlerMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xa16207, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.5 });
        const redNoseMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const deerBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 2.5), furMat);
        deerBody.position.set(0, 1.55, 0);
        const deerBelly = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.3, 2.3), bellyMat);
        deerBelly.position.set(0, 1.02, 0);
        bossGroup.add(deerBody, deerBelly);

        [[-0.46, -0.88], [0.46, -0.88], [-0.46, 0.88], [0.46, 0.88]].forEach(([lx, lz]) => {
            const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 1.05, 10), furMat);
            upperLeg.position.set(lx, 0.62, lz);
            const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.26, 10), hoofMat);
            hoof.position.set(lx, 0.13, lz);
            bossGroup.add(upperLeg, hoof);
        });

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 8), bellyMat);
        tail.position.set(0, 1.95, -1.32);
        tail.rotation.x = -0.55;
        bossGroup.add(tail);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.15, 12), furMat);
        neck.position.set(0, 2.25, 0.95);
        neck.rotation.x = 0.32;
        const sleighCollar = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 10, 20), collarMat);
        sleighCollar.position.set(0, 2.08, 0.92);
        sleighCollar.rotation.x = Math.PI / 2 + 0.32;
        bossGroup.add(neck, sleighCollar);

        for (let bIdx = -2; bIdx <= 2; bIdx++) {
            const bell = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), goldBellMat);
            bell.position.set(bIdx * 0.2, 1.98, 1.25 - Math.abs(bIdx) * 0.08);
            bossGroup.add(bell);
        }

        headGroup.position.set(0, 2.85, 1.28);
        const stagSkull = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.76, 0.92), furMat);
        const stagSnout = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.48, 0.78), furMat);
        stagSnout.position.set(0, -0.1, 0.68);

        const redNose = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), redNoseMat);
        redNose.position.set(0, -0.02, 1.12);
        const noseGlowRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 20), redNoseMat);
        noseGlowRing.position.set(0, -0.02, 1.12);
        const noseLight = new THREE.PointLight(0xff0000, 2.4, 9);
        noseLight.position.set(0, -0.02, 1.25);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
        eyeL.position.set(-0.36, 0.12, 0.36);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
        eyeR.position.set(0.36, 0.12, 0.36);

        const earL = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 8), furMat);
        earL.position.set(-0.52, 0.28, -0.1);
        earL.rotation.z = 0.85;
        const earR = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 8), furMat);
        earR.position.set(0.52, 0.28, -0.1);
        earR.rotation.z = -0.85;

        [-1, 1].forEach(side => {
            const antlerRack = new THREE.Group();
            antlerRack.position.set(side * 0.28, 0.42, -0.05);

            const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.35, 8), antlerMat);
            mainBeam.position.set(side * 0.26, 0.55, -0.1);
            mainBeam.rotation.z = -side * 0.42;
            mainBeam.rotation.x = -0.18;

            const browTine = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.52, 8), antlerMat);
            browTine.position.set(side * 0.18, 0.32, 0.22);
            browTine.rotation.x = 0.75;
            browTine.rotation.z = -side * 0.25;

            const midTine = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.58, 8), antlerMat);
            midTine.position.set(side * 0.42, 0.72, 0.1);
            midTine.rotation.x = 0.45;
            midTine.rotation.z = -side * 0.65;

            const crownTine = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.52, 8), antlerMat);
            crownTine.position.set(side * 0.52, 1.05, -0.18);
            crownTine.rotation.z = -side * 0.22;

            antlerRack.add(mainBeam, browTine, midTine, crownTine);
            headGroup.add(antlerRack);
        });

        headGroup.add(stagSkull, stagSnout, redNose, noseGlowRing, noseLight, eyeL, eyeR, earL, earR);
        specialProp = noseGlowRing;
    } else if (bKey === 'sandwich_guard') {
        const chefHat = new THREE.Mesh(
            new THREE.CylinderGeometry(0.58, 0.48, 0.95, 14),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        chefHat.position.set(0, 0.9, 0);
        headGroup.add(chefHat);

        const sandwichShield = new THREE.Mesh(
            new THREE.BoxGeometry(1.1, 1.1, 0.35),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 })
        );
        sandwichShield.position.set(-0.9, 1.45, 0.55);
        bossGroup.add(sandwichShield);
        specialProp = chefHat;
    } else if (bKey === 'medieval_castle') {
        const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.1), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        visorSlit.position.set(0, 0.14, 0.48);
        const crimsonPlume = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b }));
        crimsonPlume.position.set(0, 1.0, -0.15);
        headGroup.add(visorSlit, crimsonPlume);

        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.16), new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.6 }));
        shield.position.set(-0.95, 1.45, 0.55);
        bossGroup.add(shield);

        specialProp = new THREE.Group();
        const bossBlade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.5, 0.08), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        bossBlade.position.y = 1.1;
        const bossGuard = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.2), accentMat);
        specialProp.add(bossBlade, bossGuard);
        specialProp.position.set(0.95, 1.4, 0.65);
        specialProp.rotation.x = 0.45;
        bossGroup.add(specialProp);
    } else {
        const crown = new THREE.Mesh(new THREE.TorusKnotGeometry(0.38, 0.1, 32, 8), accentMat);
        crown.position.set(0, 0.85, 0);
        headGroup.add(crown);
        specialProp = crown;
    }

    bossGroup.add(headGroup);
    bossGroup.scale.setScalar(cfg.scale);
    return { bossGroup, headGroup, specialProp };
}

export function buildMiniBossMesh(cfg) {
    const mbGroup = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.35, metalness: 0.75 });
    const glowMat = new THREE.MeshStandardMaterial({ color: cfg.accent, emissive: cfg.accent, emissiveIntensity: 0.8 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.75), armorMat);
    torso.position.y = 1.25;
    mbGroup.add(torso);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), glowMat);
    core.position.set(0, 1.3, 0.42);
    mbGroup.add(core);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.82), armorMat);
    head.position.set(0, 2.35, 0);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.12), glowMat);
    visor.position.set(0, 2.38, 0.4);

    const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.85, 10), glowMat);
    cannonL.rotation.x = Math.PI / 2;
    cannonL.position.set(-0.8, 1.85, 0.25);
    const cannonR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.85, 10), glowMat);
    cannonR.rotation.x = Math.PI / 2;
    cannonR.position.set(0.8, 1.85, 0.25);

    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 20), glowMat);
    haloRing.rotation.x = Math.PI / 2;
    haloRing.position.y = 0.2;

    const lbl = createBillboardLabel(`${cfg.icon} MINI-BOSS: ${cfg.name}`, '#0f172a', '#22d3ee');
    lbl.position.set(0, 3.4, 0);

    mbGroup.add(head, visor, cannonL, cannonR, haloRing, lbl);
    mbGroup.scale.setScalar(1.65);
    return { mbGroup, core };
}
