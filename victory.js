import { cityManager } from './cityManager.js';
import { economyState } from './economy.js';

export const victoryConditions = {
    military: { name: 'Military Victory', description: 'Control 60% of all cities', achieved: false },
    economic: { name: 'Economic Victory', description: 'Reach $1,000,000 GDP', achieved: false },
    diplomatic: { name: 'Diplomatic Victory', description: 'Form alliances with 80% of countries', achieved: false },
    research: { name: 'Research Victory', description: 'Complete all technologies', achieved: false }
};

export function checkVictoryConditions(units, nation, diplomacy, wars) {
    const results = {};
    let victory = null;
    const totalCities = Object.keys(cityManager || {}).length;
    const controlledCities = units.filter(u => u.friendly && u.state !== 'DESTROYED').length * 2;
    const militaryProgress = Math.min(100, (controlledCities / Math.max(1, totalCities)) * 100);
    victoryConditions.military.achieved = militaryProgress >= 60;
    results.military = { achieved: victoryConditions.military.achieved, progress: militaryProgress };
    const gdp = economyState?.money || 0;
    const economicProgress = Math.min(100, (gdp / 1000000) * 100);
    victoryConditions.economic.achieved = economicProgress >= 100;
    results.economic = { achieved: victoryConditions.economic.achieved, progress: economicProgress };
    const allCountries = Object.keys(nation || {});
    const alliedCountries = allCountries.filter(c => { const val = diplomacy[c] || 0; return val >= 75; });
    const diplomaticProgress = Math.min(100, (alliedCountries.length / Math.max(1, allCountries.length)) * 100);
    victoryConditions.diplomatic.achieved = diplomaticProgress >= 80;
    results.diplomatic = { achieved: victoryConditions.diplomatic.achieved, progress: diplomaticProgress };
    const techKeys = Object.keys(window.tech || {});
    const completedTechs = techKeys.filter(key => window.tech[key]?.completed);
    const researchProgress = Math.min(100, (completedTechs.length / Math.max(1, techKeys.length)) * 100);
    victoryConditions.research.achieved = researchProgress >= 100;
    results.research = { achieved: victoryConditions.research.achieved, progress: researchProgress };
    for (const [key, value] of Object.entries(results)) {
        if (value.achieved) {
            victory = { type: key, title: `${key.charAt(0).toUpperCase() + key.slice(1)} Victory!`, message: victoryConditions[key]?.description || 'You have achieved victory!', icon: getVictoryIcon(key) };
            break;
        }
    }
    return victory;
}

function getVictoryIcon(type) {
    const icons = { military: '⚔️', economic: '💰', diplomatic: '🤝', research: '🔬' };
    return icons[type] || '🏆';
}

export function getVictoryStatus() {
    return { conditions: victoryConditions, summary: Object.entries(victoryConditions).map(([key, value]) => ({ type: key, name: value.name, description: value.description, achieved: value.achieved })) };
}