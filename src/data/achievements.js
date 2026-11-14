export const ACHIEVEMENTS = {
    slayer25: { title: '💀 Derp Exterminator', desc: 'Eliminate 25 Derpy Zombies', target: 25, progress: 0 },
    jeff3: { title: '🐮 Highland Best Friend', desc: 'Pet Jeff the Highland Cow 3 times on Kino Der Goofy', target: 3, progress: 0 },
    pap1: { title: '⚡ Pack-a-Punch Prodigy', desc: 'Upgrade any weapon at the Pack-a-Punch Machine', target: 1, progress: 0 },
    wave5: { title: '🛡️ Wave 5 Veteran', desc: 'Survive until Wave 5 on any map', target: 5, progress: 1 },
    boss1: { title: '👑 Mythic Titan Slayer', desc: 'Defeat any Map Boss in combat', target: 1, progress: 0 }
};

const ACH_PROGRESS_KEY = 'cod_zombies_ach_progress_v3';

export function loadAchievementProgress(unlockedAchievements) {
    try {
        const saved = JSON.parse(localStorage.getItem(ACH_PROGRESS_KEY) || '{}');
        Object.entries(ACHIEVEMENTS).forEach(([k, a]) => {
            if (unlockedAchievements[k]) {
                a.progress = a.target;
            } else if (typeof saved[k] === 'number' && Number.isFinite(saved[k])) {
                const floor = k === 'wave5' ? 1 : 0;
                a.progress = Math.max(floor, Math.min(a.target, saved[k]));
            }
        });
    } catch (e) {}
}

export function saveAchievementProgress() {
    try {
        const out = {};
        Object.entries(ACHIEVEMENTS).forEach(([k, a]) => {
            out[k] = a.progress;
        });
        localStorage.setItem(ACH_PROGRESS_KEY, JSON.stringify(out));
    } catch (e) {}
}

export function resetAchievementProgress(onlyWave5 = false) {
    Object.entries(ACHIEVEMENTS).forEach(([k, a]) => {
        if (onlyWave5) {
            if (k === 'wave5') a.progress = 1;
        } else {
            a.progress = k === 'wave5' ? 1 : 0;
        }
    });
    if (onlyWave5) {
        saveAchievementProgress();
    } else {
        try { localStorage.removeItem(ACH_PROGRESS_KEY); } catch (e) {}
    }
}
