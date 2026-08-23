export const wars = [];

export function calculateWarScore(warId, units) {
    const war = wars[warId];
    if (!war) return null;
    const casualties1 = war.casualties1 || 0;
    const casualties2 = war.casualties2 || 0;
    const battlesWon1 = war.battlesWon1 || 0;
    const battlesWon2 = war.battlesWon2 || 0;
    let score1 = 0, score2 = 0;
    score1 += battlesWon1 * 10; score2 += battlesWon2 * 10;
    score1 += casualties2 * 0.1; score2 += casualties1 * 0.1;
    return { score1: Math.round(score1), score2: Math.round(score2), diff: Math.round(score1 - score2), casualties1, casualties2, battlesWon1, battlesWon2 };
}

export function updateWarScore(warId, units) {
    const war = wars[warId];
    if (!war) return;
    const scores = calculateWarScore(warId, units);
    if (scores) { war.score1 = scores.score1; war.score2 = scores.score2; }
}

export function getWarStatus(warId) {
    const war = wars[warId];
    if (!war) return null;
    const scores = calculateWarScore(warId, []);
    if (!scores) return null;
    let status = 'STALEMATE', advantage = 'NONE';
    if (scores.diff > 30) { status = 'DECISIVE_ADVANTAGE'; advantage = war.country1; }
    else if (scores.diff > 10) { status = 'ADVANTAGE'; advantage = war.country1; }
    else if (scores.diff < -30) { status = 'DECISIVE_ADVANTAGE'; advantage = war.country2; }
    else if (scores.diff < -10) { status = 'ADVANTAGE'; advantage = war.country2; }
    return { warId, country1: war.country1, country2: war.country2, status, advantage, scores, duration: (Date.now() - war.started) / (1000 * 60 * 60 * 24), active: war.active !== false };
}

export function getAllWars() { return wars.filter(w => w.active !== false); }
export function isCountryAtWar(countryId) { return wars.some(w => w.active !== false && (w.country1 === countryId || w.country2 === countryId)); }