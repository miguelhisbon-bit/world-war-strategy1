// =========================================================
// WORLD WAR V3 — SAFE SAVE / LOAD SYSTEM
// =========================================================

export const SAVE_KEY = 'worldWarSaveV3';
export const SAVE_VERSION = '3.0.0';
export const AUTOSAVE_INTERVAL = 30000;

function parseSave(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Save is not an object');
    }
    if (data.version && data.version !== SAVE_VERSION) {
        throw new Error(`Unsupported save version: ${data.version}`);
    }
    if (data.units !== undefined && !Array.isArray(data.units)) {
        throw new Error('Invalid units data');
    }
    if (data.cityManager !== undefined && (typeof data.cityManager !== 'object' || Array.isArray(data.cityManager))) {
        throw new Error('Invalid city data');
    }
    if (data.territoryState !== undefined && (typeof data.territoryState !== 'object' || Array.isArray(data.territoryState))) {
        throw new Error('Invalid territory data');
    }
    return data;
}

export function saveGame(gameData) {
    try {
        const saveData = {
            ...gameData,
            savedAt: Date.now(),
            version: SAVE_VERSION
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.error('Save failed:', error);
        return false;
    }
}

export function loadGame() {
    try {
        return parseSave(localStorage.getItem(SAVE_KEY));
    } catch (error) {
        console.warn('Invalid save detected:', error);
        return null;
    }
}

export function recoverCorruptSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        localStorage.setItem(`${SAVE_KEY}:corruptBackup:${Date.now()}`, raw);
        localStorage.removeItem(SAVE_KEY);
        return true;
    } catch (error) {
        console.error('Save recovery failed:', error);
        return false;
    }
}

export function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log('🗑️ Save deleted');
        return true;
    } catch (error) {
        console.error('Delete save failed:', error);
        return false;
    }
}

export function hasSave() {
    try {
        return !!localStorage.getItem(SAVE_KEY);
    } catch {
        return false;
    }
}

export function getSaveInfo() {
    try {
        const data = parseSave(localStorage.getItem(SAVE_KEY));
        if (!data) return null;
        return {
            savedAt: data.savedAt ? new Date(data.savedAt).toLocaleString() : 'Unknown',
            version: data.version || 'legacy',
            units: Array.isArray(data.units) ? data.units.length : 0,
            country: data.currentCountry || 'Unknown',
            year: Number.isFinite(data.year) ? data.year : 1940
        };
    } catch {
        return null;
    }
}

export function autoSaveLoop(dt, saveFunction) {
    let timer = 0;
    timer += dt;
    if (timer >= AUTOSAVE_INTERVAL / 1000) {
        timer = 0;
        saveFunction();
    }
    return timer;
}

export function exportSave() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return false;
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `worldWarSaveV3_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        return false;
    }
}

export function importSave(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(false);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = parseSave(e.target.result);
                if (!data) throw new Error('Empty save');
                localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
                console.log('✅ Save imported successfully!');
                resolve(true);
            } catch (error) {
                console.error('Import failed:', error);
                resolve(false);
            }
        };
        reader.onerror = () => resolve(false);
        reader.readAsText(file);
    });
}
