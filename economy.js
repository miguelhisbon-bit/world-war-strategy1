import { BUILDINGS } from '../data/buildings.js';
import { getAllTechs } from '../data/techTree.js';

export const economyState = { money: 12500, oil: 850, steel: 1250, food: 1600, manpower: 85000, political: 120, stability: 78, tax: 22, construction: 6, debt: 0, inflation: 0 };
export const productionMultipliers = { food: 1.0, steel: 1.0, oil: 1.0, money: 1.0, manpower: 1.0 };
export const buildingQueue = [];
export const researchQueue = [];
export const factories = { civilian: 18, military: 14, naval: 5 };

export function addBuildingToQueue(stateId, buildingId, level = 1) {
    const building = BUILDINGS[buildingId];
    if (!building) return false;
    const cost = getBuildingCost(buildingId, level);
    for (const [resource, amount] of Object.entries(cost)) {
        if (economyState[resource] < amount) return false;
    }
    for (const [resource, amount] of Object.entries(cost)) { economyState[resource] -= amount; }
    buildingQueue.push({ stateId, buildingId, level, progress: 0, totalTime: building.buildTime });
    return true;
}

function getBuildingCost(buildingId, level) {
    const building = BUILDINGS[buildingId];
    if (!building) return null;
    const cost = {};
    for (const [key, value] of Object.entries(building.cost)) { cost[key] = Math.round(value * level); }
    return cost;
}

export function processBuildingQueue(dt) {
    for (let i = buildingQueue.length - 1; i >= 0; i--) {
        const item = buildingQueue[i];
        item.progress += dt;
        if (item.progress >= item.totalTime) { completeBuilding(item); buildingQueue.splice(i, 1); }
    }
}

function completeBuilding(item) {
    const building = BUILDINGS[item.buildingId];
    if (!building) return;
    const production = getBuildingProduction(item.buildingId, item.level);
    for (const [resource, amount] of Object.entries(production)) { economyState[resource] += amount * 10; }
}

function getBuildingProduction(buildingId, level) {
    const building = BUILDINGS[buildingId];
    if (!building) return null;
    const production = {};
    for (const [key, value] of Object.entries(building.production)) { production[key] = Math.round(value * level); }
    return production;
}

export function addResearchToQueue(techId) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return false;
    for (const [resource, amount] of Object.entries(tech.cost)) {
        if (economyState[resource] < amount) return false;
    }
    for (const [resource, amount] of Object.entries(tech.cost)) { economyState[resource] -= amount; }
    researchQueue.push({ techId, progress: 0, totalTime: tech.researchTime });
    return true;
}

export function processResearchQueue(dt) {
    for (let i = researchQueue.length - 1; i >= 0; i--) {
        const item = researchQueue[i];
        item.progress += dt;
        if (item.progress >= item.totalTime) { completeResearch(item); researchQueue.splice(i, 1); }
    }
}

function completeResearch(item) {
    const allTechs = getAllTechs();
    const tech = allTechs[item.techId];
    if (!tech) return;
    for (const [bonusType, value] of Object.entries(tech.bonus)) {
        if (bonusType === 'factories') { factories.military += value; }
        else if (bonusType === 'foodProduction') { productionMultipliers.food += value / 100; }
        else if (bonusType === 'moneyIncome') { productionMultipliers.money += value / 100; }
        else if (bonusType === 'intel') { economyState.intel = Math.min(100, (economyState.intel || 0) + value); }
        else if (bonusType === 'counterIntel') { economyState.counterIntel = Math.min(100, (economyState.counterIntel || 0) + value); }
    }
}

export function processEconomy(dt) {
    const baseIncome = 10 * dt;
    economyState.money += baseIncome * productionMultipliers.money;
    const taxIncome = (economyState.money * economyState.tax / 100) * dt;
    economyState.money += taxIncome;
    const stabilityBonus = economyState.stability / 100;
    economyState.money *= (1 + stabilityBonus * 0.1);
    if (economyState.debt > 0) { const interest = economyState.debt * 0.05 * dt; economyState.money -= interest; }
}

export function tradeResource(resource, amount, price) {
    if (economyState[resource] < amount) return false;
    economyState[resource] -= amount;
    economyState.money += amount * price;
    return true;
}

export function takeLoan(amount) { economyState.money += amount; economyState.debt += amount; return true; }