// Lightweight random world events. Returns effects so main.js owns the actual resources.
const EVENT_POOL = [
  { id: 'industrial_boom', title: '🏭 Industrial Boom', text: 'Factories exceed expectations.', effects: { money: 450, steel: 90 }, weight: 1 },
  { id: 'food_shortage', title: '🌾 Food Shortage', text: 'Poor harvest reduces food reserves.', effects: { food: -260, stability: -3 }, weight: 1 },
  { id: 'volunteers', title: '🪖 Volunteer Surge', text: 'Citizens enlist for the war effort.', effects: { manpower: 1800, political: 4 }, weight: 1 },
  { id: 'oil_discovery', title: '🛢️ Oil Discovery', text: 'A new field improves fuel reserves.', effects: { oil: 180, money: 150 }, weight: 0.8 },
  { id: 'protest', title: '⚠️ Civil Unrest', text: 'Public confidence falls.', effects: { stability: -5, political: -4 }, weight: 0.6 }
];

let cooldown = 45;
let timer = 0;
export const activeEvents = [];

export function processWorldEvents(dt, state) {
  timer += dt * (state.speed || 1);
  if (timer < cooldown || state.paused) return null;
  timer = 0;
  const total = EVENT_POOL.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  let event = EVENT_POOL[0];
  for (const e of EVENT_POOL) { roll -= e.weight; if (roll <= 0) { event = e; break; } }
  activeEvents.unshift({ ...event, at: Date.now() });
  activeEvents.splice(5);
  return event;
}
