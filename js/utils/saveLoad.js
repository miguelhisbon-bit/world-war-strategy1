// =========================================================
// SAVE / LOAD SYSTEM
// =========================================================

import { economyState, buildingQueue, researchQueue } from '../systems/economy.js';
import { alliances, wars, tradeRoutes } from '../systems/diplomacy.js';

const SAVE_KEY = 'worldWarSave';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// Save game data
export function saveGame() {
    try {
        const saveData = {
            // Economy
            economy: economyState,
            
            // Buildings
            buildings: buildingQueue,
            
            // Research
            research: researchQueue,
            
            // Diplomacy
            diplomacy: diplomacy,
            alliances: alliances,
            wars: wars,
            tradeRoutes: tradeRoutes,
            
            // Production
            factories: factories,
            production: production,
            
            // Technologies
            tech: tech,
            
            // Date
            year: year,
            month: month,
            day: day,
            
            // Units
            units: units.map(u => ({
                id: u.id,
                name: u.name,
                type: u.type,
                friendly: u.friendly,
                country: u.country,
                hp: u.hp,
                organization: u.organization,
                morale: u.morale,
                strength: u.strength,
                readiness: u.readiness,
                supply: u.supply,
                attack: u.attack,
                defense: u.defense,
                speed: u.speed,
                state: u.state,
                kills: u.kills,
                experience: u.experience,
                entrenchment: u.entrenchment,
                pos: u.object.position.toArray()
            })),
            
            // Save timestamp
            savedAt: Date.now(),
            version: '1.0'
        };
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        return true;
    } catch (error) {
        console.error('Save failed:', error);
        return false;
    }
}

// Load game data
export function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        
        const data = JSON.parse(raw);
        
        // Check version compatibility
        if (data.version !== '1.0') {
            console.warn('Save version mismatch');
        }
        
        // Load economy
        if (data.economy) {
            Object.assign(economyState, data.economy);
        }
        
        // Load buildings
        if (data.buildings) {
            buildingQueue.length = 0;
            buildingQueue.push(...data.buildings);
        }
        
        // Load research
        if (data.research) {
            researchQueue.length = 0;
            researchQueue.push(...data.research);
        }
        
        // Load diplomacy
        if (data.diplomacy) {
            Object.assign(diplomacy, data.diplomacy);
        }
        
        if (data.alliances) {
            Object.assign(alliances, data.alliances);
        }
        
        if (data.wars) {
            wars.length = 0;
            wars.push(...data.wars);
        }
        
        if (data.tradeRoutes) {
            tradeRoutes.length = 0;
            tradeRoutes.push(...data.tradeRoutes);
        }
        
        // Load factories
        if (data.factories) {
            Object.assign(factories, data.factories);
        }
        
        // Load production
        if (data.production) {
            Object.assign(production, data.production);
        }
        
        // Load tech
        if (data.tech) {
            Object.assign(tech, data.tech);
        }
        
        // Load date
        if (data.year) year = data.year;
        if (data.month) month = data.month;
        if (data.day) day = data.day;
        
        // Load units
        if (data.units) {
            for (let i = 0; i < data.units.length && i < units.length; i++) {
                const d = data.units[i];
                const u = units[i];
                if (u && d.pos) {
                    u.object.position.fromArray(d.pos);
                    // Also load other properties
                    u.hp = d.hp || u.hp;
                    u.organization = d.organization || u.organization;
                    u.morale = d.morale || u.morale;
                    u.strength = d.strength || u.strength;
                    u.readiness = d.readiness || u.readiness;
                    u.supply = d.supply || u.supply;
                    u.state = d.state || u.state;
                    u.kills = d.kills || u.kills;
                    u.experience = d.experience || u.experience;
                    u.entrenchment = d.entrenchment || u.entrenchment;
                }
            }
        }
        
        console.log(`✅ Game loaded! (${new Date(data.savedAt).toLocaleString()})`);
        return true;
    } catch (error) {
        console.error('Load failed:', error);
        return false;
    }
}

// Delete save
export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    console.log('🗑️ Save deleted');
}

// Check if save exists
export function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
}

// Get save info
export function getSaveInfo() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        
        const data = JSON.parse(raw);
        return {
            savedAt: new Date(data.savedAt).toLocaleString(),
            version: data.version,
            units: data.units?.length || 0,
            country: data.country || 'Unknown'
        };
    } catch {
        return null;
    }
}

// Auto-save
let autosaveTimer = 0;

export function autoSaveLoop(dt) {
    autosaveTimer += dt;
    if (autosaveTimer >= AUTOSAVE_INTERVAL) {
        autosaveTimer = 0;
        saveGame();
    }
}

// Export save data as JSON (for manual backup)
export function exportSave() {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldWarSave_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import save from JSON file
export function importSave(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            // Validate JSON
            JSON.parse(data);
            localStorage.setItem(SAVE_KEY, data);
            console.log('✅ Save imported successfully!');
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    };
    reader.readAsText(file);
}