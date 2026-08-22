// =========================================================
// UNITS DATA
// =========================================================

export const UNITS_DATA = {
    INFANTRY: {
        id: 'INFANTRY',
        name: 'Infantry',
        icon: '🚶',
        type: 'INFANTRY',
        cost: { money: 350, steel: 35, manpower: 100 },
        buildTime: 15,
        stats: {
            attack: 16,
            defense: 12,
            speed: 12,
            hp: 100,
            organization: 100,
            morale: 85,
            strength: 70,
            supply: 0.35
        },
        description: 'Basic ground troops, versatile in all terrain',
        counters: { TANK: 0.5, ARTILLERY: 1.2, AIR: 0.7 }
    },
    
    TANK: {
        id: 'TANK',
        name: 'Tank',
        icon: '🔩',
        type: 'TANK',
        cost: { money: 800, steel: 80, manpower: 50 },
        buildTime: 25,
        stats: {
            attack: 24,
            defense: 20,
            speed: 18,
            hp: 120,
            organization: 95,
            morale: 82,
            strength: 85,
            supply: 0.65
        },
        description: 'Heavy armor with powerful attack',
        counters: { INFANTRY: 1.5, ARTILLERY: 0.8, AIR: 1.2 }
    },
    
    ARTILLERY: {
        id: 'ARTILLERY',
        name: 'Artillery',
        icon: '💥',
        type: 'ARTILLERY',
        cost: { money: 600, steel: 65, manpower: 75 },
        buildTime: 20,
        stats: {
            attack: 28,
            defense: 12,
            speed: 8,
            hp: 90,
            organization: 90,
            morale: 78,
            strength: 75,
            supply: 0.5
        },
        description: 'Long-range fire support',
        counters: { INFANTRY: 0.6, TANK: 1.3, AIR: 0.9 }
    },
    
    AIR: {
        id: 'AIR',
        name: 'Aircraft',
        icon: '✈️',
        type: 'AIR',
        cost: { money: 1100, steel: 90, manpower: 25 },
        buildTime: 30,
        stats: {
            attack: 30,
            defense: 17,
            speed: 35,
            hp: 80,
            organization: 88,
            morale: 80,
            strength: 75,
            supply: 0.9
        },
        description: 'Air superiority and ground attack',
        counters: { INFANTRY: 1.4, TANK: 0.7, ARTILLERY: 1.1 }
    },
    
    MECHANIZED: {
        id: 'MECHANIZED',
        name: 'Mechanized Infantry',
        icon: '🚛',
        type: 'MECHANIZED',
        cost: { money: 600, steel: 60, manpower: 80 },
        buildTime: 22,
        stats: {
            attack: 20,
            defense: 16,
            speed: 20,
            hp: 110,
            organization: 92,
            morale: 80,
            strength: 80,
            supply: 0.55
        },
        description: 'Fast-moving infantry with armor support',
        counters: { INFANTRY: 1.2, TANK: 0.6, ARTILLERY: 0.9 }
    }
};

// Unit upgrade paths
export const UNIT_UPGRADES = {
    INFANTRY: [
        { level: 1, cost: { money: 200, steel: 20 }, bonus: { attack: 2, defense: 2 } },
        { level: 2, cost: { money: 400, steel: 40 }, bonus: { attack: 4, defense: 4 } },
        { level: 3, cost: { money: 800, steel: 80 }, bonus: { attack: 8, defense: 8 } }
    ],
    TANK: [
        { level: 1, cost: { money: 300, steel: 30 }, bonus: { attack: 4, defense: 3 } },
        { level: 2, cost: { money: 600, steel: 60 }, bonus: { attack: 8, defense: 6 } },
        { level: 3, cost: { money: 1200, steel: 120 }, bonus: { attack: 15, defense: 12 } }
    ],
    ARTILLERY: [
        { level: 1, cost: { money: 250, steel: 25 }, bonus: { attack: 5, range: 10 } },
        { level: 2, cost: { money: 500, steel: 50 }, bonus: { attack: 10, range: 20 } },
        { level: 3, cost: { money: 1000, steel: 100 }, bonus: { attack: 18, range: 35 } }
    ],
    AIR: [
        { level: 1, cost: { money: 350, steel: 35 }, bonus: { attack: 5, speed: 5 } },
        { level: 2, cost: { money: 700, steel: 70 }, bonus: { attack: 10, speed: 10 } },
        { level: 3, cost: { money: 1400, steel: 140 }, bonus: { attack: 20, speed: 15 } }
    ]
};

// Helper function to get unit stats
export function getUnitStats(unitId) {
    return UNITS_DATA[unitId]?.stats || null;
}

// Helper function to get unit cost
export function getUnitCost(unitId) {
    return UNITS_DATA[unitId]?.cost || null;
}

// Helper function to get upgrade cost
export function getUpgradeCost(unitId, level) {
    const upgrades = UNIT_UPGRADES[unitId];
    if (!upgrades || level < 1 || level > upgrades.length) return null;
    return upgrades[level - 1].cost;
}