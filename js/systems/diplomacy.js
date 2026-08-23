// =========================================================
// DIPLOMACY SYSTEM
// =========================================================

export const DIPLOMACY_STATES = {
    ALLIED: { name: 'Allied', color: '#55d18a', value: 75 },
    FRIENDLY: { name: 'Friendly', color: '#58a6ff', value: 25 },
    NEUTRAL: { name: 'Neutral', color: '#8997a3', value: 0 },
    UNFRIENDLY: { name: 'Unfriendly', color: '#e45d5d', value: -25 },
    HOSTILE: { name: 'Hostile', color: '#cc2222', value: -50 },
    AT_WAR: { name: 'At War', color: '#ff0000', value: -100 }
};

export const diplomacy = {};
export const alliances = {};
export const wars = [];

export function getDiplomacyState(value) {
    if (value >= 75) return DIPLOMACY_STATES.ALLIED;
    if (value >= 25) return DIPLOMACY_STATES.FRIENDLY;
    if (value >= -25) return DIPLOMACY_STATES.NEUTRAL;
    if (value >= -50) return DIPLOMACY_STATES.UNFRIENDLY;
    if (value >= -100) return DIPLOMACY_STATES.HOSTILE;
    return DIPLOMACY_STATES.AT_WAR;
}

export function formAlliance(country1, country2) {
    if (country1 === country2) return false;
    
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    
    if (alliances[key1] || alliances[key2]) return false;
    
    alliances[key1] = {
        countries: [country1, country2],
        formed: Date.now(),
        mutualDefense: true
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

export function declareWar(declarer, target) {
    if (declarer === target) return false;
    
    const existingWar = wars.find(w => 
        (w.country1 === declarer && w.country2 === target) ||
        (w.country1 === target && w.country2 === declarer)
    );
    if (existingWar) return false;
    
    wars.push({
        country1: declarer,
        country2: target,
        started: Date.now(),
        score1: 0,
        score2: 0,
        casualties1: 0,
        casualties2: 0
    });
    
    diplomacy[declarer] = -100;
    diplomacy[target] = -100;
    
    return true;
}

export function proposePeace(warId) {
    const war = wars[warId];
    if (!war) return false;
    
    const scoreDiff = war.score1 - war.score2;
    const warDuration = (Date.now() - war.started) / (1000 * 60 * 60 * 24);
    
    const peaceChance = Math.min(0.8, (Math.abs(scoreDiff) / 100) + (warDuration / 100));
    
    if (Math.random() < peaceChance) {
        wars.splice(warId, 1);
        diplomacy[war.country1] = Math.max(-50, (diplomacy[war.country1] || 0) + 40);
        diplomacy[war.country2] = Math.max(-50, (diplomacy[war.country2] || 0) + 40);
        return true;
    }
    
    return false;
}

export const tradeRoutes = [];

export function establishTradeRoute(country1, country2, resource, amount) {
    if (country1 === country2) return false;
    
    const state = getDiplomacyState(diplomacy[country2] || 0);
    if (state.value < -25) return false;
    
    tradeRoutes.push({
        country1,
        country2,
        resource,
        amount,
        established: Date.now(),
        active: true
    });
    
    return true;
}

export function generateIncident(country1, country2) {
    const incidents = [
        'Border dispute',
        'Spy caught',
        'Trade embargo',
        'Military exercise near border',
        'Diplomatic insult'
    ];
    
    const incident = incidents[Math.floor(Math.random() * incidents.length)];
    const severity = Math.random() * 20 - 10;
    
    diplomacy[country2] = Math.max(-100, Math.min(100, (diplomacy[country2] || 0) + severity));
    
    return {
        incident,
        severity,
        newRelation: diplomacy[country2]
    };
}