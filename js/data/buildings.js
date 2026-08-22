// =========================================================
// BUILDINGS DATA
// =========================================================

export const BUILDINGS = {
    FARM: {
        id: 'FARM',
        name: 'Farm',
        icon: '🌾',
        cost: { money: 200, steel: 50 },
        buildTime: 10,
        production: { food: 5 },
        description: 'Produces food for your population'
    },
    MINE: {
        id: 'MINE',
        name: 'Mine',
        icon: '⛏️',
        cost: { money: 300, steel: 100 },
        buildTime: 12,
        production: { steel: 3 },
        description: 'Extracts steel from the earth'
    },
    OIL_RIG: {
        id: 'OIL_RIG',
        name: 'Oil Rig',
        icon: '🛢️',
        cost: { money: 400, steel: 150 },
        buildTime: 15,
        production: { oil: 2 },
        description: 'Pumps oil for your war machine'
    },
    FACTORY: {
        id: 'FACTORY',
        name: 'Factory',
        icon: '🏭',
        cost: { money: 500, steel: 200 },
        buildTime: 20,
        production: { money: 10 },
        description: 'Produces money and goods'
    },
    BARRACKS: {
        id: 'BARRACKS',
        name: 'Barracks',
        icon: '🪖',
        cost: { money: 600, steel: 250 },
        buildTime: 18,
        production: { manpower: 20 },
        description: 'Trains and houses soldiers'
    },
    FORT: {
        id: 'FORT',
        name: 'Fort',
        icon: '🏰',
        cost: { money: 700, steel: 300 },
        buildTime: 25,
        production: { defense: 15 },
        description: 'Provides defensive bonus to the state'
    },
    AIRFIELD: {
        id: 'AIRFIELD',
        name: 'Airfield',
        icon: '✈️',
        cost: { money: 800, steel: 350 },
        buildTime: 22,
        production: { air: 2 },
        description: 'Allows aircraft to operate from this state'
    }
};

export const BUILDING_LEVELS = {
    LEVEL_1: { multiplier: 1, costMultiplier: 1 },
    LEVEL_2: { multiplier: 1.5, costMultiplier: 1.5 },
    LEVEL_3: { multiplier: 2.5, costMultiplier: 2.5 },
    LEVEL_4: { multiplier: 4, costMultiplier: 4 },
    LEVEL_5: { multiplier: 6, costMultiplier: 6 }
};

export function getBuildingCost(buildingId, level = 1) {
    const building = BUILDINGS[buildingId];
    if (!building) return null;
    
    const levelMultiplier = BUILDING_LEVELS[`LEVEL_${level}`]?.costMultiplier || 1;
    const cost = {};
    
    for (const [key, value] of Object.entries(building.cost)) {
        cost[key] = Math.round(value * levelMultiplier);
    }
    
    return cost;
}

export function getBuildingProduction(buildingId, level = 1) {
    const building = BUILDINGS[buildingId];
    if (!building) return null;
    
    const levelMultiplier = BUILDING_LEVELS[`LEVEL_${level}`]?.multiplier || 1;
    const production = {};
    
    for (const [key, value] of Object.entries(building.production)) {
        production[key] = Math.round(value * levelMultiplier);
    }
    
    return production;
}