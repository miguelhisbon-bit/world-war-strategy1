// Army command layer: formations, readiness, supply attrition and reinforcement.
export const armyOrders = new Map();

export function getArmyStats(units, countryId) {
  const active = units.filter(u => u.country === countryId && u.state !== 'DESTROYED');
  const byType = {};
  let strength = 0, org = 0, morale = 0, supply = 0;
  active.forEach(u => {
    byType[u.type] = (byType[u.type] || 0) + 1;
    strength += u.strength || 0;
    org += u.organization || 0;
    morale += u.morale || 0;
    supply += u.supply || 0;
  });
  return {
    count: active.length, byType, strength,
    organization: active.length ? org / active.length : 0,
    morale: active.length ? morale / active.length : 0,
    supply: active.length ? supply / active.length : 0
  };
}

export function issueArmyOrder(unitIds, order, destination = null) {
  unitIds.forEach(id => armyOrders.set(id, { order, destination, issuedAt: Date.now() }));
}

export function processArmy(units, dt, speed = 1) {
  for (const unit of units) {
    if (!unit || unit.state === 'DESTROYED') continue;
    const order = armyOrders.get(unit.id);
    if (order?.order) unit.order = order.order;

    const moving = !!unit.destination && unit.state === 'MOVING';
    if (moving) {
      unit.readiness = Math.max(35, (unit.readiness ?? 100) - 1.2 * dt * speed);
      unit.entrenchment = Math.max(0, (unit.entrenchment ?? 0) - 2 * dt * speed);
    } else if (unit.state === 'HOLDING' || unit.state === 'DEFENDING') {
      unit.readiness = Math.min(100, (unit.readiness ?? 100) + 2 * dt * speed);
      unit.entrenchment = Math.min(100, (unit.entrenchment ?? 0) + 1.2 * dt * speed);
      unit.organization = Math.min(unit.maxOrganization || 100, (unit.organization ?? 0) + 0.8 * dt * speed);
    }

    if ((unit.supply ?? 100) < 30) {
      unit.morale = Math.max(15, (unit.morale ?? 50) - 1.5 * dt * speed);
      unit.organization = Math.max(0, (unit.organization ?? 50) - 1.2 * dt * speed);
      unit.hp = Math.max(1, (unit.hp ?? 1) - 0.15 * dt * speed);
      unit.state = unit.state === 'ATTACKING' ? 'RETREATING' : unit.state;
    }
  }
}

export function reinforceUnit(unit, manpower, steel, money, amount = 20) {
  if (!unit || unit.state === 'DESTROYED') return { ok: false, reason: 'Invalid unit' };
  const hpGap = Math.max(0, unit.maxHp - unit.hp);
  const restore = Math.min(amount, hpGap);
  if (!restore) return { ok: false, reason: 'Unit already full strength' };
  const costs = { manpower: Math.ceil(restore * 0.6), steel: Math.ceil(restore * 0.3), money: Math.ceil(restore * 3) };
  if (manpower < costs.manpower || steel < costs.steel || money < costs.money) return { ok: false, reason: 'Not enough resources' };
  unit.hp += restore;
  unit.organization = Math.min(unit.maxOrganization || 100, unit.organization + restore * 0.25);
  unit.supply = Math.min(100, (unit.supply || 0) + restore * 0.3);
  return { ok: true, costs, restored: restore };
}
