// =========================================================
// AI SYSTEM — V2 (Enhanced Intelligence)
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
    
    // AI Economy (simplified)
    if (Math.random() < 0.01 * dt * difficulty.aggression) {
        // AI builds units
        buildAIUnit(aiUnits, playerUnits, difficulty);
    }
    
    // AI Movement
    for (const unit of aiUnits) {
        if (unit.state === 'DESTROYED') continue;
        
        // Find nearest player unit
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
        
        // AI Decision making
        const attackRange = unit.type === 'ARTILLERY' ? 60 : unit.type === 'AIR' ? 80 : 30;
        
        if (minDist < attackRange) {
            // Attack
            if (Math.random() < 0.03 * dt * difficulty.aggression) {
                unit.state = 'ATTACKING';
                // Execute attack
                executeAIAttack(unit, nearest, difficulty);
            }
        } else if (minDist < 150) {
            // Move towards enemy
            unit.destination = nearest.object.position.clone();
            unit.state = 'MOVING';
        } else {
            // Patrol
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

function buildAIUnit(aiUnits, playerUnits, difficulty) {
    // AI builds units based on difficulty
    const unitTypes = ['INFANTRY', 'TANK', 'ARTILLERY', 'AIR'];
    const weights = [0.4, 0.25, 0.2, 0.15];
    
    // Adjust weights based on difficulty
    if (difficulty.aggression > 0.7) {
        weights[1] = 0.35; // More tanks
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
    
    // Find a place to spawn
    const spawnUnit = window.create3DUnit;
    if (spawnUnit) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 100;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        // Spawn enemy unit
        const unit = spawnUnit(
            `AI ${selectedType} ${Math.floor(Math.random() * 100)}`,
            selectedType,
            x,
            z,
            false,
            'ENEMY'
        );
        
        if (unit) {
            // Boost stats based on difficulty
            unit.attack *= difficulty.attackBonus;
            unit.defense *= difficulty.defenseBonus;
            unit.hp *= difficulty.defenseBonus;
            unit.maxHp = unit.hp;
            updateUnitHPBar(unit);
        }
    }
}

function executeAIAttack(attacker, defender, difficulty) {
    // Calculate damage with difficulty bonuses
    let damage = attacker.attack * (0.5 + Math.random() * 0.5);
    damage *= difficulty.attackBonus;
    
    defender.hp = Math.max(0, defender.hp - damage);
    defender.organization = Math.max(0, defender.organization - damage * 0.3);
    
    if (defender.hp <= 0 || defender.organization <= 0) {
        // Destroy defender
        if (window.destroyUnit) window.destroyUnit(defender, attacker);
    } else {
        // Damage feedback
        if (window.toast) window.toast(`AI ${attacker.name} attacked!`);
    }
}

function updateUnitHPBar(unit) {
    // Helper function to update HP bar
    if (window.updateUnitHPBar) window.updateUnitHPBar(unit);
}

// Export AI functions
export const AI = {
    setDifficulty: setAIDifficulty,
    getDifficulty: getAIDifficulty,
    process: processAI
};
