import { BUILDINGS } from '../data/buildings.js';

export const cityManager = {};

export function getCity(cityId) { return cityManager[cityId] || null; }

export function updateCity(cityId, updates) {
    if (!cityManager[cityId]) return false;
    Object.assign(cityManager[cityId], updates);
    return true;
}

export function initializeCity(cityId, data) {
    if (cityManager[cityId]) return false;
    cityManager[cityId] = {
        name: data.name || cityId,
        country: data.country || 'UNKNOWN',
        population: data.population || 1000000,
        industry: data.industry || 3,
        agriculture: data.agriculture || 2,
        buildings: [],
        garrison: null,
        fortification: 0,
        supply: 100,
        production: { money: 10, food: 5 },
        happiness: 80,
        unemployment: 10,
        trainingQueue: []
    };
    return true;
}

export function buildInCity(cityId, buildingId) {
    const city = cityManager[cityId];
    if (!city) return false;
    const building = BUILDINGS[buildingId];
    if (!building) return false;
    if (city.buildings.includes(buildingId)) return false;
    city.buildings.push(buildingId);
    city.production.money += building.production.money || 0;
    city.production.food += building.production.food || 0;
    return true;
}

export function trainUnitInCity(cityId, unitType) {
    const city = cityManager[cityId];
    if (!city) return false;
    if (!city.trainingQueue) city.trainingQueue = [];
    city.trainingQueue.push({ type: unitType, progress: 0, timeRemaining: 10 });
    return true;
}

export function processCityTraining(dt) {
    for (const [cityId, city] of Object.entries(cityManager)) {
        if (!city.trainingQueue || city.trainingQueue.length === 0) continue;
        const item = city.trainingQueue[0];
        item.progress += dt;
        item.timeRemaining -= dt;
        if (item.timeRemaining <= 0) {
            city.trainingQueue.shift();
            if (window.spawnUnitAtCity) window.spawnUnitAtCity(cityId, item.type);
        }
    }
}

export function getCityProduction(cityId) { const city = cityManager[cityId]; if (!city) return null; return city.production; }
export function getCityGarrison(cityId) { const city = cityManager[cityId]; if (!city) return null; return city.garrison; }
export function setCityGarrison(cityId, unitId) { const city = cityManager[cityId]; if (!city) return false; city.garrison = unitId; return true; }
export function improveCityFortification(cityId, amount = 5) { const city = cityManager[cityId]; if (!city) return false; city.fortification = Math.min(100, city.fortification + amount); return true; }

export function getCityStats(cityId) {
    const city = cityManager[cityId];
    if (!city) return null;
    return { population: city.population, industry: city.industry, agriculture: city.agriculture, fortification: city.fortification, supply: city.supply, happiness: city.happiness, unemployment: city.unemployment, buildings: city.buildings.length, hasGarrison: !!city.garrison };
}

export function getAllCities() { return Object.entries(cityManager).map(([id, data]) => ({ id, ...data })); }

export function getCitiesByCountry(countryId) {
    const cities = [];
    for (const [id, data] of Object.entries(cityManager)) {
        if (data.country === countryId) cities.push({ id, ...data });
    }
    return cities;
}