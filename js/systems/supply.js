// =========================================================
// SUPPLY SYSTEM — V2
// =========================================================

export const supplyLines = [];

export function createSupplyLine(from, to, amount = 50) {
    // Check if supply line already exists
    const existing = supplyLines.find(s => 
        (s.from === from && s.to === to) || 
        (s.from === to && s.to === from)
    );
    if (existing) return false;
    
    supplyLines.push({
        id: `supply_${Date.now()}_${Math.random()}`,
        from: from,
        to: to,
        amount: amount,
        status: 'ACTIVE',
        efficiency: 100,
        created: Date.now()
    });
    
    return true;
}

export function updateSupplyLines(dt) {
    for (const line of supplyLines) {
        if (line.status === 'DESTROYED') continue;
        
        // Check if supply line is still valid
        // In real implementation, would check if cities are connected
        // For now, random degradation
        if (Math.random() < 0.001 * dt) {
            line.efficiency = Math.max(50, line.efficiency - Math.random() * 5);
        }
        
        if (Math.random() < 0.0005 * dt) {
            line.efficiency = Math.min(100, line.efficiency + Math.random() * 3);
        }
        
        if (line.efficiency < 30) {
            line.status = 'DEGRADED';
        } else {
            line.status = 'ACTIVE';
        }
    }
}

export function getSupplyStatus(from, to) {
    const line = supplyLines.find(s => 
        (s.from === from && s.to === to) || 
        (s.from === to && s.to === from)
    );
    if (!line) return null;
    return {
        status: line.status,
        efficiency: line.efficiency,
        amount: line.amount
    };
}

export function getUnitsInSupply(cityId) {
    // Find all units connected to this city via supply lines
    const connectedUnits = [];
    for (const unit of window.units || []) {
        if (unit.state === 'DESTROYED') continue;
        // Check if unit is near supply line
        // Simplified: check if unit's city matches
        if (unit.city === cityId) {
            connectedUnits.push(unit);
        }
    }
    return connectedUnits;
}

export function destroySupplyLine(lineId) {
    const index = supplyLines.findIndex(s => s.id === lineId);
    if (index === -1) return false;
    supplyLines[index].status = 'DESTROYED';
    return true;
}

export function repairSupplyLine(lineId) {
    const index = supplyLines.findIndex(s => s.id === lineId);
    if (index === -1) return false;
    supplyLines[index].status = 'ACTIVE';
    supplyLines[index].efficiency = 80;
    return true;
}

export function getSupplyNetworkStats() {
    const total = supplyLines.length;
    const active = supplyLines.filter(s => s.status === 'ACTIVE').length;
    const degraded = supplyLines.filter(s => s.status === 'DEGRADED').length;
    const destroyed = supplyLines.filter(s => s.status === 'DESTROYED').length;
    
    return {
        total,
        active,
        degraded,
        destroyed,
        efficiency: active / total * 100 || 0
    };
}

export function getSupplyForUnit(unit) {
    if (!unit || !unit.city) return 0;
    // Get all supply lines connected to this unit's city
    const lines = supplyLines.filter(s => 
        s.from === unit.city || s.to === unit.city
    );
    if (lines.length === 0) return 0;
    
    let totalSupply = 0;
    for (const line of lines) {
        if (line.status === 'ACTIVE') {
            totalSupply += line.amount * (line.efficiency / 100);
        }
    }
    return Math.min(100, totalSupply);
}
