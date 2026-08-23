// =========================================================
// BATTLE SYSTEM (Enhanced for V2)
// =========================================================

import { UNITS_DATA } from '../data/units.js';
import { TERRAIN_EFFECTS, WEATHER_EFFECTS } from './terrain.js';

export function getTerrainModifier(unit, terrain = 'PLAIN') {
    let modifier = 1;
    if (unit.state === 'DEFENDING') modifier += 0.18 + unit.entrenchment / 500;
    if (terrain === 'FOREST') modifier *= 0.9;
    if (terrain === 'MOUNTAIN') modifier *= 0.8;
    if (terrain === 'CITY') modifier *= 1.1;
    if (terrain === 'RIVER') modifier *= 0.85;
    if (unit.supply < 30) modifier *= 0.72;
    if (unit.organization < 30) modifier *= 0.75;
    return modifier;
}

export function getCounterBonus(attackerType, defenderType) {
    const attackerData = UNITS_DATA[attackerType];
    if (!attackerData) return 1.0;
    return attackerData.counters[defenderType] || 1.0;
}

export function calculateBattleDamage(attacker, defender, terrain = 'PLAIN', weather = 'CLEAR') {
    let attackPower = attacker.attack * (attacker.strength / 100) * (attacker.organization / 100);
    attackPower *= (attacker.morale / 100);
    
    const terrainEffect = TERRAIN_EFFECTS[terrain] || TERRAIN_EFFECTS.PLAIN;
    attackPower *= terrainEffect.attackModifier;
    
    const weatherEffect = WEATHER_EFFECTS[weather] || WEATHER_EFFECTS.CLEAR;
    attackPower *= weatherEffect.attackModifier;
    
    const counterBonus = getCounterBonus(attacker.type, defender.type);
    attackPower *= counterBonus;
    
    let defensePower = defender.defense * (defender.strength / 100) * (defender.organization / 100);
    defensePower *= (defender.morale / 100);
    defensePower *= terrainEffect.defenseModifier;
    defensePower *= weatherEffect.defenseModifier;
    
    if (defender.state === 'DEFENDING') {
        defensePower *= (1 + defender.entrenchment / 200);
    }
    
    let damage = Math.max(1, attackPower - defensePower * 0.4);
    damage += Math.random() * 5;
    
    let orgDamage = damage * 0.5;
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

export function findEnemiesInRange(unit, enemyUnits, range = 50) {
    const enemies = [];
    for (const enemy of enemyUnits) {
        if (enemy.state === 'DESTROYED') continue;
        const dist = unit.object.position.distanceTo(enemy.object.position);
        if (dist <= range) {
            enemies.push({ unit: enemy, distance: dist });
        }
    }
    return enemies.sort((a, b) => a.distance - b.distance);
}