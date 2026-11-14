import * as THREE from 'three';

const SHARED_FLAG = 'isSharedResource';

export function markSharedGeometry(geom) {
    geom.userData[SHARED_FLAG] = true;
    return geom;
}

export const sharedGeometries = {
    sphereSmall: markSharedGeometry(new THREE.SphereGeometry(0.18, 10, 10)),
    sphereMedium: markSharedGeometry(new THREE.SphereGeometry(0.28, 10, 10)),
    sphereLarge: markSharedGeometry(new THREE.SphereGeometry(0.45, 12, 12)),
    shockwaveRing: markSharedGeometry(new THREE.RingGeometry(0.3, 0.65, 24))
};

export function disposeObject3D(root) {
    if (!root) return;
    root.traverse((obj) => {
        if (obj.geometry && !obj.geometry.userData?.[SHARED_FLAG]) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const mat of mats) {
                if (!mat || mat.userData?.[SHARED_FLAG]) continue;
                if (mat.map && typeof mat.map.dispose === 'function') {
                    mat.map.dispose();
                }
                mat.dispose();
            }
        }
    });
}

export function createFloorTexture(baseHex, accentHex) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 248);
    ctx.beginPath();
    ctx.moveTo(0, 128);
    ctx.lineTo(256, 128);
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
}

export function createBillboardLabel(text, bgColor = '#18181b', borderColor = '#fbbf24') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(8, 8, 496, 112);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4.5, 1.15, 1);
    return sprite;
}
