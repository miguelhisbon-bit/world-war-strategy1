// =========================================================
// BATTLE SYSTEM
// =========================================================

import { UNITS_DATA } from '../data/units.js';

// Terrain effects on combat
export const TERRAIN_EFFECTS = {
    PLAIN: { attackModifier: 1.0, defenseModifier: 1.0 },
    FOREST: { attackModifier: 0.8, defenseModifier: 1.2 },
    MOUNTAIN: { attackModifier: 0.6, defenseModifier: 1.4 },
    CITY: { attackModifier: 0.7, defenseModifier: 1.5 },
    RIVER: { attackModifier: 0.5, defenseModifier: 1.3 },
    DESERT: { attackModifier: 0.9, defenseModifier: 0.9 },
    SNOW: { attackModifier: 0.7, defenseModifier: 0.8 }
};

// Weather effects on combat
export const WEATHER_EFFECTS = {
    CLEAR: { attackModifier: 1.0, defenseModifier: 1.0 },
    RAIN: { attackModifier: 0.85, defenseModifier: 0.9 },
    SNOW: { attackModifier: 0.7, defenseModifier: 0.75 },
    FOG: { attackModifier: 0.6, defenseModifier: 0.8 },
    STORM: { attackModifier: 0.5, defenseModifier: 0.6 }
};

// Unit counter system
export function getCounterBonus(attackerType, defenderType) {
    const attackerData = UNITS_DATA[attackerType];
    if (!attackerData) return 1.0;
    return attackerData.counters[defenderType] || 1.0;
}

// Calculate battle damage
export function calculateBattleDamage(attacker, defender, terrain = 'PLAIN', weather = 'CLEAR') {
    // Base attack power
    let attackPower = attacker.attack * (attacker.strength / 100) * (attacker.organization / 100);
    attackPower *= (attacker.morale / 100);
    
    // Terrain effects
    const terrainEffect = TERRAIN_EFFECTS[terrain] || TERRAIN_EFFECTS.PLAIN;
    attackPower *= terrainEffect.attackModifier;
    
    // Weather effects
    const weatherEffect = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS.CLEAR;
    attackPower *= weatherEffect.attackModifier;
    
    // Counter bonus
    const counterBonus = getCounterBonus(attacker.type, defender.type);
    attackPower *= counterBonus;
    
    // Base defense
    let defensePower = defender.defense * (defender.strength / 100) * (defender.organization / 100);
    defensePower *= (defender.morale / 100);
    defensePower *= terrainEffect.defenseModifier;
    defensePower *= weatherEffect.defenseModifier;
    
    // Entrenchment bonus
    if (defender.state === 'DEFENDING') {
        defensePower *= (1 + defender.entrenchment / 200);
    }
    
    // Calculate damage
    let damage = Math.max(1, attackPower - defensePower * 0.4);
    damage += Math.random() * 5; // Random variance
    
    // Organization damage
    let orgDamage = damage * 0.5;
    
    // Morale damage
    let moraleDamage = damage * 0.2;
    
    return {
        damage: Math.round(damage),
        orgDamage: Math.round(orgDamage),
        moraleDamage: Math.round(moraleDamage),
        attackPower: Math.round(attackPower),
        defensePower: Math.round(defensePower),
        terrainEffect: terrain,
        weatherEffect: weather,
        counterBonus: counterBonus
    };
}

// Execute a battle
export function executeBattle(attacker, defender, terrain = 'PLAIN', weather = 'CLEAR') {
    if (!attacker || !defender || defender.state === 'DESTROYED') return null;
    if (attacker.supply < 15) return { error: 'Insufficient supply' };
    
    // Calculate damage
    const result = calculateBattleDamage(attacker, defender, terrain, weather);
    
    // Apply damage
    defender.hp = Math.max(0, defender.hp - result.damage);
    defender.organization = Math.max(0, defender.organization - result.orgDamage);
    defender.morale = Math.max(0, defender.morale - result.moraleDamage);
    
    // Attacker loses some organization
    attacker.organization = Math.max(0, attacker.organization - Math.round(result.damage * 0.15));
    attacker.supply = Math.max(0, attacker.supply - 5);
    
    // Experience gain
    attacker.experience = Math.min(100, attacker.experience + result.damage * 0.1);
    
    // Check if defender is destroyed
    const destroyed = defender.hp <= 0 || defender.organization <= 0;
    
    return {
        ...result,
        destroyed,
        defenderHp: defender.hp,
        defenderOrg: defender.organization,
        defenderMorale: defender.morale,
        attackerOrg: attacker.organization,
        attackerExp: attacker.experience
    };
}

// Generate battle report
export function generateBattleReport(attacker, defender, result, terrain, weather) {
    if (!result) return null;
    
    let report = `⚔️ BATTLE REPORT\n`;
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `Attacker: ${attacker.name} (${attacker.type})\n`;
    report += `Defender: ${defender.name} (${defender.type})\n`;
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `Terrain: ${terrain}\n`;
    report += `Weather: ${weather}\n`;
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `Attack Power: ${result.attackPower}\n`;
    report += `Defense Power: ${result.defensePower}\n`;
    report += `Damage Dealt: ${result.damage}\n`;
    report += `Organization Loss: ${result.orgDamage}\n`;
    report += `Morale Loss: ${result.moraleDamage}\n`;
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `Counter Bonus: ${result.counterBonus.toFixed(2)}x\n`;
    
    if (result.destroyed) {
        report += `💀 ${defender.name} DESTROYED!\n`;
    } else {
        report += `Defender HP: ${Math.round(result.defenderHp)}%\n`;
        report += `Defender Org: ${Math.round(result.defenderOrg)}%\n`;
    }
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `Attacker Org: ${Math.round(result.attackerOrg)}%\n`;
    report += `Attacker Exp: ${Math.round(result.attackerExp)}%\n`;
    
    return report;
}

// Find nearest enemy
export function findNearestEnemy(unit, enemyUnits, maxRange = 100) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const enemy of enemyUnits) {
        if (enemy.state === 'DESTROYED') continue;
        const dist = unit.object.position.distanceTo(enemy.object.position);
        if (dist < minDist && dist <= maxRange) {
            minDist = dist;
            nearest = enemy;
        }
    }
    
    return nearest;
}