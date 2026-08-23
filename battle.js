import { UNITS_DATA } from '../data/units.js';

export const TERRAIN_EFFECTS = {
    PLAIN: { attackModifier: 1.0, defenseModifier: 1.0 },
    FOREST: { attackModifier: 0.8, defenseModifier: 1.2 },
    MOUNTAIN: { attackModifier: 0.6, defenseModifier: 1.4 },
    CITY: { attackModifier: 0.7, defenseModifier: 1.5 },
    RIVER: { attackModifier: 0.5, defenseModifier: 1.3 },
    DESERT: { attackModifier: 0.9, defenseModifier: 0.9 },
    SNOW: { attackModifier: 0.7, defenseModifier: 0.8 }
};

export const WEATHER_EFFECTS = {
    CLEAR: { attackModifier: 1.0, defenseModifier: 1.0 },
    RAIN: { attackModifier: 0.85, defenseModifier: 0.9 },
    SNOW: { attackModifier: 0.7, defenseModifier: 0.75 },
    FOG: { attackModifier: 0.6, defenseModifier: 0.8 },
    STORM: { attackModifier: 0.5, defenseModifier: 0.6 }
};

export function getCounterBonus(attackerType, defenderType) {
    const attackerData = UNITS_DATA[attackerType];
    if (!attackerData) return 1.0;
    return attackerData.counters[defenderType] || 1.0;
}

export function calculateBattleDamage(attacker, defender, terrain = 'PLAIN', weather = 'CLEAR') {
    let attackPower = attacker.attack * (attacker.strength / 100) * (attacker.organization / 100) * (attacker.morale / 100);
    const terrainEffect = TERRAIN_EFFECTS[terrain] || TERRAIN_EFFECTS.PLAIN;
    attackPower *= terrainEffect.attackModifier;
    const weatherEffect = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS.CLEAR;
    attackPower *= weatherEffect.attackModifier;
    const counterBonus = getCounterBonus(attacker.type, defender.type);
    attackPower *= counterBonus;
    let defensePower = defender.defense * (defender.strength / 100) * (defender.organization / 100) * (defender.morale / 100);
    defensePower *= terrainEffect.defenseModifier;
    defensePower *= weatherEffect.defenseModifier;
    if (defender.state === 'DEFENDING') { defensePower *= (1 + defender.entrenchment / 200); }
    let damage = Math.max(1, attackPower - defensePower * 0.4) + Math.random() * 5;
    let orgDamage = damage * 0.5;
    let moraleDamage = damage * 0.2;
    return { damage: Math.round(damage), orgDamage: Math.round(orgDamage), moraleDamage: Math.round(moraleDamage), attackPower: Math.round(attackPower), defensePower: Math.round(defensePower), terrainEffect: terrain, weatherEffect: weather, counterBonus: counterBonus };
}

export function executeBattle(attacker, defender, terrain = 'PLAIN', weather = 'CLEAR') {
    if (!attacker || !defender || defender.state === 'DESTROYED') return null;
    if (attacker.supply < 15) return { error: 'Insufficient supply' };
    const result = calculateBattleDamage(attacker, defender, terrain, weather);
    defender.hp = Math.max(0, defender.hp - result.damage);
    defender.organization = Math.max(0, defender.organization - result.orgDamage);
    defender.morale = Math.max(0, defender.morale - result.moraleDamage);
    attacker.organization = Math.max(0, attacker.organization - Math.round(result.damage * 0.15));
    attacker.supply = Math.max(0, attacker.supply - 5);
    attacker.experience = Math.min(100, attacker.experience + result.damage * 0.1);
    const destroyed = defender.hp <= 0 || defender.organization <= 0;
    return { ...result, destroyed, defenderHp: defender.hp, defenderOrg: defender.organization, defenderMorale: defender.morale, attackerOrg: attacker.organization, attackerExp: attacker.experience };
}

export function generateBattleReport(attacker, defender, result, terrain, weather) {
    if (!result) return null;
    let report = `⚔️ BATTLE REPORT\n━━━━━━━━━━━━━━━━━━━\nAttacker: ${attacker.name} (${attacker.type})\nDefender: ${defender.name} (${defender.type})\n━━━━━━━━━━━━━━━━━━━\nTerrain: ${terrain}\nWeather: ${weather}\n━━━━━━━━━━━━━━━━━━━\nAttack Power: ${result.attackPower}\nDefense Power: ${result.defensePower}\nDamage Dealt: ${result.damage}\nOrganization Loss: ${result.orgDamage}\nMorale Loss: ${result.moraleDamage}\n━━━━━━━━━━━━━━━━━━━\nCounter Bonus: ${result.counterBonus.toFixed(2)}x\n${result.destroyed ? `💀 ${defender.name} DESTROYED!\n` : `Defender HP: ${Math.round(result.defenderHp)}%\nDefender Org: ${Math.round(result.defenderOrg)}%\n`}━━━━━━━━━━━━━━━━━━━\nAttacker Org: ${Math.round(result.attackerOrg)}%\nAttacker Exp: ${Math.round(result.attackerExp)}%`;
    return report;
}

export function findNearestEnemy(unit, enemyUnits, maxRange = 100) {
    let nearest = null; let minDist = Infinity;
    for (const enemy of enemyUnits) {
        if (enemy.state === 'DESTROYED') continue;
        const dist = unit.object.position.distanceTo(enemy.object.position);
        if (dist < minDist && dist <= maxRange) { minDist = dist; nearest = enemy; }
    }
    return nearest;
}