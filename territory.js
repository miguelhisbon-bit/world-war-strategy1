// City/territory ownership and control layer.
export const territoryState = {};

export function initializeTerritories(cityManager) {
  for (const [id, city] of Object.entries(cityManager)) {
    territoryState[id] ||= { owner: city.country, controller: city.country, control: 100, contested: false };
  }
}

export function getTerritoryStats(cityManager, countryId) {
  const entries = Object.entries(cityManager).filter(([, c]) => c.country === countryId);
  const controlled = entries.filter(([id]) => territoryState[id]?.controller === countryId).length;
  const contested = entries.filter(([id]) => territoryState[id]?.contested).length;
  return { total: entries.length, controlled, contested };
}

export function processTerritoryControl(cityManager, units, nation) {
  initializeTerritories(cityManager);
  const captures = [];
  for (const [id, city] of Object.entries(cityManager)) {
    const defenders = units.filter(u => u.state !== 'DESTROYED' && u.country === city.country && u.object?.position && u.object.position.distanceTo(nation[city.country]?._position || u.object.position) < 0.55);
    const attackers = units.filter(u => u.state !== 'DESTROYED' && u.country !== city.country && u.object?.position && u.object.position.distanceTo(nation[city.country]?._position || u.object.position) < 0.55);
    const state = territoryState[id];
    if (attackers.length && !defenders.length) {
      state.contested = true;
      state.control = Math.max(0, state.control - attackers.length * 2);
      if (state.control <= 0) {
        const newOwner = attackers[0].country;
        const oldOwner = city.country;
        city.country = newOwner;
        city.fortification = Math.max(0, (city.fortification || 0) - 20);
        city.supply = Math.max(20, (city.supply || 100) - 30);
        state.owner = newOwner;
        state.controller = newOwner;
        state.control = 100;
        state.contested = false;
        captures.push({ cityId: id, cityName: city.name, oldOwner, newOwner });
      }
    } else if (!attackers.length && defenders.length) {
      state.contested = false;
      state.control = Math.min(100, state.control + defenders.length);
      state.controller = city.country;
    }
  }
  return captures;
}
