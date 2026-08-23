// Dynamic frontline detection. Frontlines are lightweight state objects used by UI and AI.
export const frontlines = [];

function distance(a, b) { return a?.object?.position?.distanceTo(b?.object?.position) ?? Infinity; }

export function updateFrontlines(units, dt = 0.016) {
  const active = units.filter(u => u.state !== 'DESTROYED');
  const contacts = [];
  const seen = new Set();
  for (const a of active) {
    for (const b of active) {
      if (a === b || a.country === b.country || a.friendly === b.friendly) continue;
      const key = [a.id, b.id].sort().join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      const d = distance(a, b);
      if (d < 0.85) contacts.push({ a, b, d });
    }
  }
  frontlines.length = 0;
  const grouped = new Map();
  contacts.forEach(c => {
    const key = [c.a.country, c.b.country].sort().join('-');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(c);
  });
  for (const [key, list] of grouped) {
    const [countryA, countryB] = key.split('-');
    const center = list[0].a.object.position.clone().add(list[0].b.object.position).multiplyScalar(0.5);
    frontlines.push({ id: key, countryA, countryB, center, contacts: list.length, intensity: Math.min(100, list.length * 18) });
  }
  return frontlines;
}

export function getFrontlineForUnit(unit) {
  if (!unit) return null;
  return frontlines.find(f => f.countryA === unit.country || f.countryB === unit.country) || null;
}
