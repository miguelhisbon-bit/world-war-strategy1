// =========================================================
// DIPLOMACY SYSTEM
// =========================================================

import { nation } from '../main.js';

// Diplomacy states
export const DIPLOMACY_STATES = {
    ALLIED: { name: 'Allied', color: '#55d18a', value: 75 },
    FRIENDLY: { name: 'Friendly', color: '#58a6ff', value: 25 },
    NEUTRAL: { name: 'Neutral', color: '#8997a3', value: 0 },
    UNFRIENDLY: { name: 'Unfriendly', color: '#e45d5d', value: -25 },
    HOSTILE: { name: 'Hostile', color: '#cc2222', value: -50 },
    AT_WAR: { name: 'At War', color: '#ff0000', value: -100 }
};

// Get diplomacy state based on value
export function getDiplomacyState(value) {
    if (value >= 75) return DIPLOMACY_STATES.ALLIED;
    if (value >= 25) return DIPLOMACY_STATES.FRIENDLY;
    if (value >= -25) return DIPLOMACY_STATES.NEUTRAL;
    if (value >= -50) return DIPLOMACY_STATES.UNFRIENDLY;
    if (value >= -100) return DIPLOMACY_STATES.HOSTILE;
    return DIPLOMACY_STATES.AT_WAR;
}

// Alliance system
export const alliances = {};

export function formAlliance(country1, country2) {
    if (!nation[country1] || !nation[country2]) return false;
    if (country1 === country2) return false;
    
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    
    if (alliances[key1] || alliances[key2]) {
        return false; // Already allied
    }
    
    alliances[key1] = {
        countries: [country1, country2],
        formed: Date.now(),
        mutualDefense: true
    };
    
    // Improve relations
    diplomacy[country1] = Math.min(100, (diplomacy[country1] || 0) + 30);
    diplomacy[country2] = Math.min(100, (diplomacy[country2] || 0) + 30);
    
    return true;
}

export function breakAlliance(country1, country2) {
    const key1 = `${country1}_${country2}`;
    const key2 = `${country2}_${country1}`;
    
    if (alliances[key1]) {
        delete alliances[key1];
        // Worsen relations
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

// War system
export const wars = [];

export function declareWar(declarer, target) {
    if (!nation[declarer] || !nation[target]) return false;
    if (declarer === target) return false;
    
    // Check if already at war
    const existingWar = wars.find(w => 
        (w.country1 === declarer && w.country2 === target) ||
        (w.country1 === target && w.country2 === declarer)
    );
    if (existingWar) return false;
    
    // Add war
    wars.push({
        country1: declarer,
        country2: target,
        started: Date.now(),
        score1: 0,
        score2: 0,
        casualties1: 0,
        casualties2: 0
    });
    
    // Set relations to war
    diplomacy[declarer] = -100;
    diplomacy[target] = -100;
    
    // Also declare war on allies
    for (const [key, alliance] of Object.entries(alliances)) {
        if (alliance.countries.includes(target)) {
            const ally = alliance.countries.find(c => c !== target);
            if (ally && ally !== declarer) {
                // Ally joins the war
                wars.push({
                    country1: declarer,
                    country2: ally,
                    started: Date.now(),
                    score1: 0,
                    score2: 0,
                    casualties1: 0,
                    casualties2: 0
                });
                diplomacy[ally] = -100;
            }
        }
    }
    
    return true;
}

export function proposePeace(warId) {
    const war = wars[warId];
    if (!war) return false;
    
    // Calculate war score difference
    const scoreDiff = war.score1 - war.score2;
    const warDuration = (Date.now() - war.started) / (1000 * 60 * 60 * 24); // Days
    
    // Peace is more likely if:
    // 1. One side has clear advantage (>30 score difference)
    // 2. War has been going on for long (>30 days)
    // 3. Relations are not -100
    
    const peaceChance = Math.min(0.8, 
        (Math.abs(scoreDiff) / 100) + (warDuration / 100)
    );
    
    if (Math.random() < peaceChance) {
        // Peace accepted
        wars.splice(warId, 1);
        // Improve relations
        diplomacy[war.country1] = Math.max(-50, (diplomacy[war.country1] || 0) + 40);
        diplomacy[war.country2] = Math.max(-50, (diplomacy[war.country2] || 0) + 40);
        return true;
    }
    
    return false;
}

// Trade system
export const tradeRoutes = [];

export function establishTradeRoute(country1, country2, resource, amount) {
    if (!nation[country1] || !nation[country2]) return false;
    if (country1 === country2) return false;
    
    // Check diplomacy
    const state = getDiplomacyState(diplomacy[country2] || 0);
    if (state.value < -25) return false; // Can't trade with hostile countries
    
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

export function processTrade() {
    for (const route of tradeRoutes) {
        if (!route.active) continue;
        
        // Simple trade: exchange resources
        // In real implementation, would check resource availability
    }
}

// Diplomatic incident
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