// =========================================================
// AI SYSTEM
// =========================================================

let aiDifficulty = 'MEDIUM';

const AI_DIFFICULTIES = {
    EASY: { aggression: 0.3, economyBonus: 1.0, attackBonus: 0.8, defenseBonus: 0.8 },
    MEDIUM: { aggression: 0.5, economyBonus: 1.2, attackBonus: 1.0, defenseBonus: 1.0 },
    HARD: { aggression: 0.7, economyBonus: 1.5, attackBonus: 1.2, defenseBonus: 1.2 },
    IMPOSSIBLE: { aggression: 0.9, economyBonus: 2.0, attackBonus: 1.5, defenseBonus: 1.5 }
};

export function setAIDifficulty(difficulty) {
    if (AI_DIFFICULTIES[difficulty]) {
        aiDifficulty = difficulty;
        return true;
    }
    return false;
}

export function getAIDifficulty() {
    return aiDifficulty;
}

export function processAI(dt, units, nation, diplomacy) {
    const aiUnits = units.filter(u => !u.friendly && u.state !== 'DESTROYED');
    const playerUnits = units.filter(u => u.friendly && u.state !== 'DESTROYED');
    
    if (aiUnits.length === 0) return;
    if (playerUnits.length === 0) return;
    
    const difficulty = AI_DIFFICULTIES[aiDifficulty] || AI_DIFFICULTIES.MEDIUM;
    
    if (Math.random() < 0.01 * dt * difficulty.aggression) {
        buildAIUnit(aiUnits, playerUnits, difficulty, units);
    }
    
    for (const unit of aiUnits) {
        if (unit.state === 'DESTROYED') continue;
        
        let nearest = null;
        let minDist = Infinity;
        for (const player of playerUnits) {
            const dist = unit.object.position.distanceTo(player.object.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = player;
            }
        }
        
        if (!nearest) continue;
        
        const attackRange = unit.type === 'ARTILLERY' ? 60 : unit.type === 'AIR' ? 80 : 30;
        
        if (minDist < attackRange) {
            if (Math.random() < 0.03 * dt * difficulty.aggression) {
                unit.state = 'ATTACKING';
                executeAIAttack(unit, nearest, difficulty);
            }
        } else if (minDist < 150) {
            unit.destination = nearest.object.position.clone();
            unit.state = 'MOVING';
        } else {
            if (!unit.destination || Math.random() < 0.01 * dt) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 30 + Math.random() * 50;
                unit.destination = new THREE.Vector3(
                    unit.object.position.x + Math.cos(angle) * dist,
                    unit.type === 'AIR' ? 8 : 0,
                    unit.object.position.z + Math.sin(angle) * dist
                );
                unit.state = 'PATROLLING';
            }
        }
    }
}

function buildAIUnit(aiUnits, playerUnits, difficulty, units) {
    const unitTypes = ['INFANTRY', 'TANK', 'ARTILLERY', 'AIR'];
    const weights = [0.4, 0.25, 0.2, 0.15];
    
    if (difficulty.aggression > 0.7) {
        weights[1] = 0.35;
        weights[0] = 0.25;
    }
    
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let selectedType = unitTypes[0];
    
    for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            selectedType = unitTypes[i];
            break;
        }
    }
    
    // Use globally exposed create3DUnit
    const spawnUnit = window.create3DUnit;
    if (spawnUnit) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        );
        
        const unit = spawnUnit(
            `AI ${selectedType} ${Math.floor(Math.random() * 100)}`,
            selectedType,
            pos,
            false,
            'ENEMY'
        );
        
        if (unit) {
            unit.attack *= difficulty.attackBonus;
            unit.defense *= difficulty.defenseBonus;
            unit.hp *= difficulty.defenseBonus;
            unit.maxHp = unit.hp;
            if (window.updateUnitHPBar) window.updateUnitHPBar(unit);
            units.push(unit);
        }
    }
}

function executeAIAttack(attacker, defender, difficulty) {
    let damage = attacker.attack * (0.5 + Math.random() * 0.5);
    damage *= difficulty.attackBonus;
    
    defender.hp = Math.max(0, defender.hp - damage);
    defender.organization = Math.max(0, defender.organization - damage * 0.3);
    
    if (window.updateUnitHPBar) window.updateUnitHPBar(defender);
    if (window.updateUnitHPBar) window.updateUnitHPBar(attacker);
    
    if (defender.hp <= 0 || defender.organization <= 0) {
        if (window.destroyUnit) window.destroyUnit(defender, attacker);
    } else {
        if (window.toast) window.toast(`AI ${attacker.name} attacked!`);
    }
}