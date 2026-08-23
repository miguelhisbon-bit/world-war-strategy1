export const SAVE_KEY = 'worldWarSaveV3';
export const AUTOSAVE_INTERVAL = 30000;

export function saveGame(gameData) {
    try {
        const saveData = { ...gameData, savedAt: Date.now(), version: '3.0.0' };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) { console.error('Save failed:', error); return false; }
}

export function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.version !== '3.0.0') console.warn('Save version mismatch. Expected 3.0.0, got', data.version);
        return data;
    } catch (error) { console.error('Load failed:', error); return null; }
}

export function deleteSave() { localStorage.removeItem(SAVE_KEY); console.log('🗑️ Save deleted'); }
export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

export function getSaveInfo() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return { savedAt: new Date(data.savedAt).toLocaleString(), version: data.version, units: data.units?.length || 0, country: data.currentCountry || 'Unknown', year: data.year || 1940 };
    } catch { return null; }
}

export function autoSaveLoop(dt, saveFunction) {
    let timer = 0;
    timer += dt;
    if (timer >= AUTOSAVE_INTERVAL / 1000) { timer = 0; saveFunction(); }
    return timer;
}

export function exportSave() {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldWarSaveV3_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            JSON.parse(data);
            localStorage.setItem(SAVE_KEY, data);
            console.log('✅ Save imported successfully!');
            return true;
        } catch (error) { console.error('Import failed:', error); return false; }
    };
    reader.readAsText(file);
}