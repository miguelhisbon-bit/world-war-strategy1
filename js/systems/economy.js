// =========================================================
// ECONOMY SYSTEM
// =========================================================

import { BUILDINGS } from '../data/buildings.js';
import { TECH_TREE } from '../data/techTree.js';

// Player economy state
export const economyState = {
    money: 12500,
    oil: 850,
    steel: 1250,
    food: 1600,
    manpower: 85000,
    political: 120,
    stability: 78,
    tax: 22,
    construction: 6,
    debt: 0,
    inflation: 0
};

// Production multipliers
export const productionMultipliers = {
    food: 1.0,
    steel: 1.0,
    oil: 1.0,
    money: 1.0,
    manpower: 1.0
};

// Building queue
export const buildingQueue = [];

export function addBuildingToQueue(stateId, buildingId, level = 1) {
    const building = BUILDINGS[buildingId];
    if (!building) return false;
    
    // Check if can afford
    const cost = getBuildingCost(buildingId, level);
    for (const [resource, amount] of Object.entries(cost)) {
        if (economyState[resource] < amount) {
            return false;
        }
    }
    
    // Deduct resources
    for (const [resource, amount] of Object.entries(cost)) {
        economyState[resource] -= amount;
    }
    
    // Add to queue
    buildingQueue.push({
        stateId,
        buildingId,
        level,
        progress: 0,
        totalTime: building.buildTime
    });
    
    return true;
}

export function processBuildingQueue(dt) {
    for (let i = buildingQueue.length - 1; i >= 0; i--) {
        const item = buildingQueue[i];
        item.progress += dt;
        
        if (item.progress >= item.totalTime) {
            // Building complete
            completeBuilding(item);
            buildingQueue.splice(i, 1);
        }
    }
}

function completeBuilding(item) {
    const building = BUILDINGS[item.buildingId];
    if (!building) return;
    
    // Add production
    const production = getBuildingProduction(item.buildingId, item.level);
    for (const [resource, amount] of Object.entries(production)) {
        economyState[resource] += amount * 10; // Initial production bonus
    }
    
    // Apply bonus
    if (building.bonus) {
        // Apply special bonuses
    }
    
    // Notify
    console.log(`✅ ${building.name} Level ${item.level} completed in ${item.stateId}`);
}

// Technology research
export const researchQueue = [];

export function addResearchToQueue(techId) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return false;
    
    // Check if can afford
    for (const [resource, amount] of Object.entries(tech.cost)) {
        if (economyState[resource] < amount) {
            return false;
        }
    }
    
    // Deduct resources
    for (const [resource, amount] of Object.entries(tech.cost)) {
        economyState[resource] -= amount;
    }
    
    // Add to queue
    researchQueue.push({
        techId,
        progress: 0,
        totalTime: tech.researchTime
    });
    
    return true;
}

export function processResearchQueue(dt) {
    for (let i = researchQueue.length - 1; i >= 0; i--) {
        const item = researchQueue[i];
        item.progress += dt;
        
        if (item.progress >= item.totalTime) {
            // Research complete
            completeResearch(item);
            researchQueue.splice(i, 1);
        }
    }
}

function completeResearch(item) {
    const allTechs = getAllTechs();
    const tech = allTechs[item.techId];
    if (!tech) return;
    
    // Apply bonus
    for (const [bonusType, value] of Object.entries(tech.bonus)) {
        if (bonusType === 'factories') {
            factories.military += value;
        } else if (bonusType === 'foodProduction') {
            productionMultipliers.food += value / 100;
        } else if (bonusType === 'moneyIncome') {
            productionMultipliers.money += value / 100;
        } else if (bonusType === 'intel') {
            intel = Math.min(100, intel + value);
        } else if (bonusType === 'counterIntel') {
            counterIntel = Math.min(100, counterIntel + value);
        } else if (bonusType === 'infantryAttack') {
            // Add to tech bonus
        }
    }
    
    console.log(`🔬 Research complete: ${tech.name}`);
}

// Process economy each tick
export function processEconomy(dt) {
    // Base income
    const baseIncome = 10 * dt;
    economyState.money += baseIncome * productionMultipliers.money;
    
    // Building production
    // This would check all buildings and add production
    
    // Tax income
    const taxIncome = (economyState.money * economyState.tax / 100) * dt;
    economyState.money += taxIncome;
    
    // Stability affects production
    const stabilityBonus = economyState.stability / 100;
    economyState.money *= (1 + stabilityBonus * 0.1);
    
    // Debt interest
    if (economyState.debt > 0) {
        const interest = economyState.debt * 0.05 * dt;
        economyState.money -= interest;
    }
}

// Trade
export function tradeResource(resource, amount, price) {
    if (economyState[resource] < amount) return false;
    economyState[resource] -= amount;
    economyState.money += amount * price;
    return true;
}

// Emergency loan
export function takeLoan(amount) {
    economyState.money += amount;
    economyState.debt += amount;
    return true;
}