export const supplyLines = [];

export function createSupplyLine(from, to, amount = 50) {
    const existing = supplyLines.find(s => (s.from === from && s.to === to) || (s.from === to && s.to === from));
    if (existing) return false;
    supplyLines.push({ id: `supply_${Date.now()}_${Math.random()}`, from, to, amount, status: 'ACTIVE', efficiency: 100, created: Date.now() });
    return true;
}

export function updateSupplyLines(dt) {
    for (const line of supplyLines) {
        if (line.status === 'DESTROYED') continue;
        if (Math.random() < 0.001 * dt) { line.efficiency = Math.max(50, line.efficiency - Math.random() * 5); }
        if (Math.random() < 0.0005 * dt) { line.efficiency = Math.min(100, line.efficiency + Math.random() * 3); }
        line.status = line.efficiency < 30 ? 'DEGRADED' : 'ACTIVE';
    }
}

export function getSupplyStatus(from, to) {
    const line = supplyLines.find(s => (s.from === from && s.to === to) || (s.from === to && s.to === from));
    if (!line) return null;
    return { status: line.status, efficiency: line.efficiency, amount: line.amount };
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
    return { total, active, degraded, destroyed, efficiency: active / total * 100 || 0 };
}