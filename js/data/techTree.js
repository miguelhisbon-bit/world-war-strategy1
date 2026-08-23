// =========================================================
// TECHNOLOGY TREE DATA (Expanded for V2)
// =========================================================

export const TECH_TREE = {
    MILITARY: {
        id: 'MILITARY',
        name: 'Military Technologies',
        icon: '⚔️',
        techs: {
            INFANTRY_WEAPONS_1: {
                id: 'INFANTRY_WEAPONS_1',
                name: 'Infantry Weapons I',
                icon: '🔫',
                cost: { political: 50, money: 200 },
                researchTime: 30,
                bonus: { infantryAttack: 5 },
                description: 'Improves infantry attack by 5%',
                requires: []
            },
            INFANTRY_WEAPONS_2: {
                id: 'INFANTRY_WEAPONS_2',
                name: 'Infantry Weapons II',
                icon: '🔫',
                cost: { political: 100, money: 400 },
                researchTime: 45,
                bonus: { infantryAttack: 10 },
                description: 'Improves infantry attack by 10%',
                requires: ['INFANTRY_WEAPONS_1']
            },
            INFANTRY_WEAPONS_3: {
                id: 'INFANTRY_WEAPONS_3',
                name: 'Infantry Weapons III',
                icon: '🔫',
                cost: { political: 200, money: 800 },
                researchTime: 60,
                bonus: { infantryAttack: 15 },
                description: 'Improves infantry attack by 15%',
                requires: ['INFANTRY_WEAPONS_2']
            },
            ARMOR_1: {
                id: 'ARMOR_1',
                name: 'Advanced Armor I',
                icon: '🛡️',
                cost: { political: 75, money: 300 },
                researchTime: 35,
                bonus: { tankDefense: 8 },
                description: 'Improves tank defense by 8%',
                requires: []
            },
            ARMOR_2: {
                id: 'ARMOR_2',
                name: 'Advanced Armor II',
                icon: '🛡️',
                cost: { political: 150, money: 600 },
                researchTime: 50,
                bonus: { tankDefense: 15 },
                description: 'Improves tank defense by 15%',
                requires: ['ARMOR_1']
            },
            ARMOR_3: {
                id: 'ARMOR_3',
                name: 'Advanced Armor III',
                icon: '🛡️',
                cost: { political: 300, money: 1200 },
                researchTime: 70,
                bonus: { tankDefense: 25 },
                description: 'Improves tank defense by 25%',
                requires: ['ARMOR_2']
            },
            ARTILLERY_1: {
                id: 'ARTILLERY_1',
                name: 'Artillery Range I',
                icon: '💥',
                cost: { political: 60, money: 250 },
                researchTime: 30,
                bonus: { artilleryRange: 10 },
                description: 'Increases artillery range by 10%',
                requires: []
            },
            ARTILLERY_2: {
                id: 'ARTILLERY_2',
                name: 'Artillery Range II',
                icon: '💥',
                cost: { political: 120, money: 500 },
                researchTime: 45,
                bonus: { artilleryRange: 20 },
                description: 'Increases artillery range by 20%',
                requires: ['ARTILLERY_1']
            },
            AIR_1: {
                id: 'AIR_1',
                name: 'Air Superiority I',
                icon: '✈️',
                cost: { political: 80, money: 350 },
                researchTime: 35,
                bonus: { airAttack: 12 },
                description: 'Improves air attack by 12%',
                requires: []
            },
            AIR_2: {
                id: 'AIR_2',
                name: 'Air Superiority II',
                icon: '✈️',
                cost: { political: 160, money: 700 },
                researchTime: 50,
                bonus: { airAttack: 25 },
                description: 'Improves air attack by 25%',
                requires: ['AIR_1']
            },
            AIR_3: {
                id: 'AIR_3',
                name: 'Air Superiority III',
                icon: '✈️',
                cost: { political: 320, money: 1400 },
                researchTime: 70,
                bonus: { airAttack: 40 },
                description: 'Improves air attack by 40%',
                requires: ['AIR_2']
            }
        }
    },
    
    ECONOMIC: {
        id: 'ECONOMIC',
        name: 'Economic Technologies',
        icon: '💰',
        techs: {
            INDUSTRY_1: {
                id: 'INDUSTRY_1',
                name: 'Industrialization I',
                icon: '🏭',
                cost: { political: 100, money: 500 },
                researchTime: 40,
                bonus: { factories: 1 },
                description: 'Adds +1 factory',
                requires: []
            },
            INDUSTRY_2: {
                id: 'INDUSTRY_2',
                name: 'Industrialization II',
                icon: '🏭',
                cost: { political: 200, money: 1000 },
                researchTime: 60,
                bonus: { factories: 2 },
                description: 'Adds +2 factories',
                requires: ['INDUSTRY_1']
            },
            INDUSTRY_3: {
                id: 'INDUSTRY_3',
                name: 'Industrialization III',
                icon: '🏭',
                cost: { political: 400, money: 2000 },
                researchTime: 80,
                bonus: { factories: 3 },
                description: 'Adds +3 factories',
                requires: ['INDUSTRY_2']
            },
            AGRICULTURE_1: {
                id: 'AGRICULTURE_1',
                name: 'Agriculture I',
                icon: '🌾',
                cost: { political: 80, money: 300 },
                researchTime: 30,
                bonus: { foodProduction: 20 },
                description: 'Increases food production by 20%',
                requires: []
            },
            AGRICULTURE_2: {
                id: 'AGRICULTURE_2',
                name: 'Agriculture II',
                icon: '🌾',
                cost: { political: 160, money: 600 },
                researchTime: 45,
                bonus: { foodProduction: 40 },
                description: 'Increases food production by 40%',
                requires: ['AGRICULTURE_1']
            },
            TRADE_1: {
                id: 'TRADE_1',
                name: 'Trade I',
                icon: '📦',
                cost: { political: 90, money: 400 },
                researchTime: 35,
                bonus: { moneyIncome: 15 },
                description: 'Increases money income by 15%',
                requires: []
            },
            TRADE_2: {
                id: 'TRADE_2',
                name: 'Trade II',
                icon: '📦',
                cost: { political: 180, money: 800 },
                researchTime: 50,
                bonus: { moneyIncome: 30 },
                description: 'Increases money income by 30%',
                requires: ['TRADE_1']
            },
            LOGISTICS_1: {
                id: 'LOGISTICS_1',
                name: 'Logistics I',
                icon: '🚚',
                cost: { political: 70, money: 300 },
                researchTime: 30,
                bonus: { supply: 10 },
                description: 'Improves supply efficiency by 10%',
                requires: []
            },
            LOGISTICS_2: {
                id: 'LOGISTICS_2',
                name: 'Logistics II',
                icon: '🚚',
                cost: { political: 140, money: 600 },
                researchTime: 45,
                bonus: { supply: 20 },
                description: 'Improves supply efficiency by 20%',
                requires: ['LOGISTICS_1']
            }
        }
    },
    
    INTELLIGENCE: {
        id: 'INTELLIGENCE',
        name: 'Intelligence Technologies',
        icon: '🕵️',
        techs: {
            ESPIONAGE_1: {
                id: 'ESPIONAGE_1',
                name: 'Espionage I',
                icon: '👁️',
                cost: { political: 70, money: 250 },
                researchTime: 25,
                bonus: { intel: 10 },
                description: 'Increases intelligence by 10',
                requires: []
            },
            ESPIONAGE_2: {
                id: 'ESPIONAGE_2',
                name: 'Espionage II',
                icon: '👁️',
                cost: { political: 140, money: 500 },
                researchTime: 40,
                bonus: { intel: 25 },
                description: 'Increases intelligence by 25',
                requires: ['ESPIONAGE_1']
            },
            ESPIONAGE_3: {
                id: 'ESPIONAGE_3',
                name: 'Espionage III',
                icon: '👁️',
                cost: { political: 280, money: 1000 },
                researchTime: 60,
                bonus: { intel: 50 },
                description: 'Increases intelligence by 50',
                requires: ['ESPIONAGE_2']
            },
            COUNTER_INTEL_1: {
                id: 'COUNTER_INTEL_1',
                name: 'Counter-Intelligence I',
                icon: '🛡️',
                cost: { political: 60, money: 200 },
                researchTime: 25,
                bonus: { counterIntel: 15 },
                description: 'Increases counter-intelligence by 15',
                requires: []
            },
            COUNTER_INTEL_2: {
                id: 'COUNTER_INTEL_2',
                name: 'Counter-Intelligence II',
                icon: '🛡️',
                cost: { political: 120, money: 400 },
                researchTime: 40,
                bonus: { counterIntel: 35 },
                description: 'Increases counter-intelligence by 35',
                requires: ['COUNTER_INTEL_1']
            },
            SABOTAGE_1: {
                id: 'SABOTAGE_1',
                name: 'Sabotage I',
                icon: '💣',
                cost: { political: 80, money: 300 },
                researchTime: 30,
                bonus: { sabotage: 10 },
                description: 'Allows sabotage operations',
                requires: []
            },
            SABOTAGE_2: {
                id: 'SABOTAGE_2',
                name: 'Sabotage II',
                icon: '💣',
                cost: { political: 160, money: 600 },
                researchTime: 45,
                bonus: { sabotage: 25 },
                description: 'Improves sabotage effectiveness',
                requires: ['SABOTAGE_1']
            }
        }
    },
    
    NAVAL: {
        id: 'NAVAL',
        name: 'Naval Technologies',
        icon: '⛵',
        techs: {
            SHIPBUILDING_1: {
                id: 'SHIPBUILDING_1',
                name: 'Shipbuilding I',
                icon: '🚢',
                cost: { political: 60, money: 300 },
                researchTime: 30,
                bonus: { naval: 5 },
                description: 'Improves naval production by 5%',
                requires: []
            },
            SHIPBUILDING_2: {
                id: 'SHIPBUILDING_2',
                name: 'Shipbuilding II',
                icon: '🚢',
                cost: { political: 120, money: 600 },
                researchTime: 45,
                bonus: { naval: 12 },
                description: 'Improves naval production by 12%',
                requires: ['SHIPBUILDING_1']
            },
            NAVAL_ARTILLERY: {
                id: 'NAVAL_ARTILLERY',
                name: 'Naval Artillery',
                icon: '💥',
                cost: { political: 100, money: 500 },
                researchTime: 40,
                bonus: { navalAttack: 15 },
                description: 'Improves naval attack by 15%',
                requires: ['SHIPBUILDING_1']
            }
        }
    }
};

export function getAllTechs() {
    const allTechs = {};
    for (const category of Object.values(TECH_TREE)) {
        for (const [key, tech] of Object.entries(category.techs)) {
            allTechs[key] = tech;
        }
    }
    return allTechs;
}

export function isTechAvailable(techId, researchedTechs) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return false;
    if (researchedTechs[techId]) return false;
    return tech.requires.every(req => researchedTechs[req]);
}

export function getTechCost(techId) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return null;
    return tech.cost;
}

export function getTechBonus(techId) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return null;
    return tech.bonus;
}

export function getTechDescription(techId) {
    const allTechs = getAllTechs();
    const tech = allTechs[techId];
    if (!tech) return null;
    return tech.description;
}