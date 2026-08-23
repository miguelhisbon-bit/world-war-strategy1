// =========================================================
// DIPLOMACY SYSTEM (Enhanced for V2)
// =========================================================

export const DIPLOMACY_STATES = {
    ALLIED: { name: 'Allied', color: '#55d18a', value: 75, emoji: '🤝' },
    FRIENDLY: { name: 'Friendly', color: '#58a6ff', value: 25, emoji: '😊' },
    NEUTRAL: { name: 'Neutral', color: '#8997a3', value: 0, emoji: '😐' },
    UNFRIENDLY: { name: 'Unfriendly', color: '#e45d5d', value: -25, emoji: '😠' },
    HOSTILE: { name: 'Hostile', color: '#cc2222', value: -50, emoji: '😡' },
    AT_WAR: { name: 'At War', color: '#ff0000', value: -100, emoji: '⚔️' }
};

export const diplomacy = {};
export const alliances = {};
export const wars = [];
export const peaceTreaties = [];

export function getDiplomacyState(value) {
    if (value >= 75) return DIPLOMACY_STATES.ALLIED;
    if (value >= 25) return DIPLOMACY_STATES.FRIENDLY;
    if (value >= -25) return DIPLOMACY_STATES.NEUTRAL;
    if (value >= -50) return DIPLOMACY_STATES.UNFRIENDLY;
    if (value >= -100) return DIPLOMACY_STATES.HOSTILE;
    return DIPLOMACY_STATES.AT_WAR;
}

export function initDiplomacy(countryIds) {
    countryIds.forEach(id => {
        diplomacy[id] = id === 'BANGLADESH' ? 0 : Math.random() * 60 - 30;
    });
}

export function formAlliance(country1, country2) {
    if (country1 === country2) return false;
    if (!diplomacy[country1] || !diplomacy[country2]) return false;
    
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    
    if (alliances[key1] || alliances[key2]) return false;
    
    alliances[key1] = {
        countries: [country1, country2],
        formed: Date.now(),
        mutualDefense: true,
        active: true
    };
    
    diplomacy[country1] = Math.min(100, (diplomacy[country1] || 0) + 30);
    diplomacy[country2] = Math.min(100, (diplomacy[country2] || 0) + 30);
    
    return true;
}

export function breakAlliance(country1, country2) {
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    
    if (alliances[key1]) {
        delete alliances[key1];
        diplomacy[country1] = Math.max(-50, (diplomacy[country1] || 0) - 20);
        diplomacy[country2] = Math.max(-50, (diplomacy[country2] || 0) - 20);
        return true;
    }
    
    if (alliances[key2]) {
        delete alliances[key2];
        diplomacy[country1] = Math.max(-50, (diplomacy[country1] || 0) - 20);
        diplomacy[country2] = Math.max(-50, (diplomacy[country2] || 0) - 20);
        return true;
    }
    
    return false;
}

export function isAllied(country1, country2) {
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    return !!(alliances[key1] || alliances[key2]);
}

export function declareWar(declarer, target, reason = 'Territorial dispute') {
    if (declarer === target) return false;
    if (!diplomacy[declarer] || !diplomacy[target]) return false;
    
    const existingWar = wars.find(w => 
        (w.country1 === declarer && w.country2 === target) ||
        (w.country1 === target && w.country2 === declarer)
    );
    if (existingWar) return false;
    
    const war = {
        country1: declarer,
        country2: target,
        started: Date.now(),
        reason: reason,
        score1: 0,
        score2: 0,
        casualties1: 0,
        casualties2: 0,
        battlesWon1: 0,
        battlesWon2: 0,
        active: true
    };
    
    wars.push(war);
    
    diplomacy[declarer] = -100;
    diplomacy[target] = -100;
    
    // Allies join the war
    for (const [key, alliance] of Object.entries(alliances)) {
        if (alliance.countries.includes(target)) {
            const ally = alliance.countries.find(c => c !== target);
            if (ally && ally !== declarer && diplomacy[ally] > -50) {
                wars.push({
                    country1: declarer,
                    country2: ally,
                    started: Date.now(),
                    reason: 'Alliance obligation',
                    score1: 0,
                    score2: 0,
                    casualties1: 0,
                    casualties2: 0,
                    battlesWon1: 0,
                    battlesWon2: 0,
                    active: true
                });
                diplomacy[ally] = Math.min(diplomacy[ally] || 0, -50);
            }
        }
    }
    
    return war;
}

export function proposePeace(warId, terms = {}) {
    const war = wars[warId];
    if (!war || !war.active) return false;
    
    const scoreDiff = war.score1 - war.score2;
    const warDuration = (Date.now() - war.started) / (1000 * 60 * 60 * 24);
    
    let peaceChance = Math.min(0.8, (Math.abs(scoreDiff) / 100) + (warDuration / 100));
    
    // If one side has overwhelming advantage, peace is less likely
    if (Math.abs(scoreDiff) > 80) peaceChance *= 0.3;
    
    if (Math.random() < peaceChance) {
        war.active = false;
        peaceTreaties.push({
            warId: warId,
            country1: war.country1,
            country2: war.country2,
            signed: Date.now(),
            terms: terms
        });
        
        diplomacy[war.country1] = Math.max(-50, (diplomacy[war.country1] || 0) + 40);
        diplomacy[war.country2] = Math.max(-50, (diplomacy[war.country2] || 0) + 40);
        
        return true;
    }
    
    return false;
}

export function getActiveWars() {
    return wars.filter(w => w.active);
}

export function isAtWar(country1, country2) {
    return wars.some(w => 
        w.active &&
        ((w.country1 === country1 && w.country2 === country2) ||
         (w.country1 === country2 && w.country2 === country1))
    );
}

export function getWarById(warId) {
    return wars[warId];
}

export function getWarScore(warId) {
    const war = wars[warId];
    if (!war) return null;
    return {
        country1: war.score1,
        country2: war.score2,
        diff: war.score1 - war.score2,
        total: war.score1 + war.score2
    };
}

export function getDiplomaticStatus(countryId) {
    const status = {};
    for (const [key, value] of Object.entries(diplomacy)) {
        if (key !== countryId) {
            status[key] = {
                value: value,
                state: getDiplomacyState(value),
                isAllied: isAllied(countryId, key),
                isAtWar: isAtWar(countryId, key)
            };
        }
    }
    return status;
}