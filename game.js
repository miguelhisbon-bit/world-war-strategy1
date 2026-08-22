/* =========================================================
   WARFRONT - 3D LOOKING BATTLEFIELD
   Complete browser game controller
========================================================= */

const state = {
  money: 5000,
  fuel: 1000,
  metal: 2000,
  level: 1,

  allyScore: 50,
  enemyScore: 50,

  victories: 0,

  zoom: 1,
  selectedUnit: "tank1",

  units: {
    tank1: { hp: 100, attack: 35, alive: true },
    tank2: { hp: 100, attack: 35, alive: true },
    infantry1: { hp: 80, attack: 20, alive: true },
    infantry2: { hp: 80, attack: 20, alive: true },
    aircraft1: { hp: 90, attack: 45, alive: true }
  },

  enemies: {
    enemyTank1: { hp: 100, attack: 30, alive: true },
    enemyInfantry1: { hp: 80, attack: 20, alive: true },
    enemyAircraft1: { hp: 90, attack: 40, alive: true }
  }
};

const $ = id => document.getElementById(id);

const battlefield = $("battlefield");
const terrain = document.querySelector(".terrain");
const effects = $("effects");
const notification = $("notification");

/* =========================================================
   LOADING SCREEN
========================================================= */

let loading = 0;

const loadingMessages = [
  "Initializing battlefield...",
  "Loading tactical systems...",
  "Deploying units...",
  "Connecting command center...",
  "Preparing AI commanders...",
  "Battlefield ready."
];

const loadingInterval = setInterval(() => {

  loading += 10;

  $("loadingProgress").style.width = loading + "%";

  const index = Math.min(
    Math.floor(loading / 20),
    loadingMessages.length - 1
  );

  $("loadingText").textContent = loadingMessages[index];

  if (loading >= 100) {

    clearInterval(loadingInterval);

    setTimeout(() => {
      $("loadingScreen").style.opacity = "0";
      $("loadingScreen").style.transition = "opacity .7s";

      setTimeout(() => {
        $("loadingScreen").style.display = "none";
      }, 700);

    }, 300);
  }

}, 180);


/* =========================================================
   NOTIFICATION
========================================================= */

function notify(message) {

  notification.textContent = message;

  notification.animate(
    [
      { opacity: 0.3 },
      { opacity: 1 }
    ],
    {
      duration: 300
    }
  );
}


/* =========================================================
   RESOURCE UI
========================================================= */

function updateUI() {

  $("money").textContent = Math.max(0, Math.floor(state.money));
  $("fuel").textContent = Math.max(0, Math.floor(state.fuel));
  $("metal").textContent = Math.max(0, Math.floor(state.metal));

  $("level").textContent = state.level;

  $("allyScore").textContent = state.allyScore;
  $("enemyScore").textContent = state.enemyScore;

  $("allyBar").style.width =
    state.allyScore + "%";

  const aliveUnits =
    Object.values(state.units)
      .filter(unit => unit.alive)
      .length;

  const aliveEnemies =
    Object.values(state.enemies)
      .filter(unit => unit.alive)
      .length;

  $("unitCount").textContent = aliveUnits;
  $("enemyCount").textContent = aliveEnemies;

  $("victories").textContent = state.victories;
}


/* =========================================================
   UNIT SELECTION
========================================================= */

document.querySelectorAll(".unit-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      document
        .querySelectorAll(".unit-card")
        .forEach(c => c.classList.remove("selected"));

      card.classList.add("selected");

      state.selectedUnit =
        card.dataset.unit;

      notify(
        "Selected unit: " +
        card.querySelector("b").textContent
      );

    });

  });


/* =========================================================
   EXPLOSION
========================================================= */

function explosion(x, y) {

  const boom = document.createElement("div");

  boom.className = "explosion";

  boom.style.left = x + "px";
  boom.style.top = y + "px";

  effects.appendChild(boom);

  setTimeout(() => {
    boom.remove();
  }, 800);


  const smoke = document.createElement("div");

  smoke.className = "smoke";

  smoke.style.left = x + 10 + "px";
  smoke.style.top = y + 20 + "px";

  effects.appendChild(smoke);

  setTimeout(() => {
    smoke.remove();
  }, 2200);
}


/* =========================================================
   ATTACK
========================================================= */

$("attackBtn").addEventListener("click", () => {

  const unit = state.units[state.selectedUnit];

  if (!unit || !unit.alive) {
    notify("Selected unit is unavailable.");
    return;
  }

  if (state.fuel < 20) {
    notify("Not enough fuel.");
    return;
  }

  state.fuel -= 20;

  const enemyKeys =
    Object.keys(state.enemies)
      .filter(key => state.enemies[key].alive);

  if (!enemyKeys.length) {
    winBattle();
    return;
  }

  const target =
    enemyKeys[
      Math.floor(Math.random() * enemyKeys.length)
    ];

  const enemy = state.enemies[target];

  const damage =
    unit.attack +
    Math.floor(Math.random() * 15);

  enemy.hp -= damage;

  const enemyElement = $(target);

  if (enemyElement) {

    const rect =
      enemyElement.getBoundingClientRect();

    const battlefieldRect =
      battlefield.getBoundingClientRect();

    explosion(
      rect.left -
      battlefieldRect.left,

      rect.top -
      battlefieldRect.top
    );
  }

  notify(
    "Attack successful! " +
    damage +
    " damage dealt."
  );

  if (enemy.hp <= 0) {

    enemy.hp = 0;
    enemy.alive = false;

    if (enemyElement) {
      enemyElement.style.opacity = "0";
      enemyElement.style.transform = "scale(.3)";
    }

    state.allyScore =
      Math.min(100, state.allyScore + 8);

    state.enemyScore =
      Math.max(0, state.enemyScore - 8);

    notify("Enemy unit destroyed!");

  }

  updateUI();

  checkBattleEnd();
});


/* =========================================================
   DEFEND
========================================================= */

$("defendBtn").addEventListener("click", () => {

  state.allyScore =
    Math.min(100, state.allyScore + 4);

  state.money += 150;

  notify(
    "Defensive formation activated. +4 control."
  );

  updateUI();
});


/* =========================================================
   AIR STRIKE
========================================================= */

$("airStrikeBtn").addEventListener("click", () => {

  if (state.fuel < 120) {
    notify("Air strike requires 120 fuel.");
    return;
  }

  state.fuel -= 120;

  const enemies =
    Object.keys(state.enemies)
      .filter(key => state.enemies[key].alive);

  if (!enemies.length) {
    winBattle();
    return;
  }

  enemies.forEach(key => {

    const enemy = state.enemies[key];

    enemy.hp -= 35;

    const element = $(key);

    if (element) {

      const rect =
        element.getBoundingClientRect();

      const battleRect =
        battlefield.getBoundingClientRect();

      explosion(
        rect.left - battleRect.left,
        rect.top - battleRect.top
      );
    }

    if (enemy.hp <= 0) {

      enemy.hp = 0;
      enemy.alive = false;

      if (element) {
        element.style.opacity = "0";
      }

    }

  });

  state.allyScore =
    Math.min(100, state.allyScore + 10);

  state.enemyScore =
    Math.max(0, state.enemyScore - 10);

  notify("AIR STRIKE COMPLETE!");

  updateUI();

  checkBattleEnd();
});


/* =========================================================
   SCOUT
========================================================= */

$("scoutBtn").addEventListener("click", () => {

  if (state.fuel < 30) {
    notify("Not enough fuel for reconnaissance.");
    return;
  }

  state.fuel -= 30;

  notify(
    "Recon complete. Enemy positions revealed."
  );

  document.querySelectorAll(".enemy")
    .forEach(unit => {

      unit.animate(
        [
          { opacity: .25 },
          { opacity: 1 },
          { opacity: .25 },
          { opacity: 1 }
        ],
        {
          duration: 1200
        }
      );

    });

  updateUI();
});


/* =========================================================
   REINFORCE
========================================================= */

$("reinforceBtn").addEventListener("click", () => {

  if (state.money < 500) {
    notify("Need $500 for reinforcements.");
    return;
  }

  state.money -= 500;

  state.allyScore =
    Math.min(100, state.allyScore + 6);

  state.metal += 150;

  notify(
    "Reinforcements deployed."
  );

  updateUI();
});


/* =========================================================
   REPAIR
========================================================= */

$("repairBtn").addEventListener("click", () => {

  if (state.metal < 100) {
    notify("Need 100 metal for repairs.");
    return;
  }

  const unit = state.units[state.selectedUnit];

  if (!unit || !unit.alive) {
    notify("Unit unavailable.");
    return;
  }

  state.metal -= 100;

  unit.hp =
    Math.min(100, unit.hp + 25);

  notify(
    "Unit repaired by 25 HP."
  );

  updateUI();
});


/* =========================================================
   AI BATTLE
========================================================= */

function enemyTurn() {

  const aliveEnemies =
    Object.values(state.enemies)
      .filter(enemy => enemy.alive);

  if (!aliveEnemies.length) {
    return;
  }

  const aliveUnits =
    Object.keys(state.units)
      .filter(key => state.units[key].alive);

  if (!aliveUnits.length) {
    loseBattle();
    return;
  }

  const target =
    aliveUnits[
      Math.floor(Math.random() * aliveUnits.length)
    ];

  const unit = state.units[target];

  const damage =
    8 + Math.floor(Math.random() * 15);

  unit.hp -= damage;

  notify(
    "Enemy attack! Your unit took " +
    damage +
    " damage."
  );

  if (unit.hp <= 0) {

    unit.hp = 0;
    unit.alive = false;

    const element = $(target);

    if (element) {
      element.style.opacity = "0";
    }

    state.enemyScore =
      Math.min(100, state.enemyScore + 7);

  }

  updateUI();

  if (
    Object.values(state.units)
      .every(unit => !unit.alive)
  ) {
    loseBattle();
  }
}


/* =========================================================
   AI TIMER
========================================================= */

setInterval(() => {

  if (
    $("loadingScreen").style.display === "none" ||
    !$("loadingScreen").style.display
  ) {
    enemyTurn();
  }

}, 7000);


/* =========================================================
   BATTLE END
========================================================= */

function checkBattleEnd() {

  const enemiesAlive =
    Object.values(state.enemies)
      .some(enemy => enemy.alive);

  if (!enemiesAlive) {
    winBattle();
  }
}


function winBattle() {

  state.victories++;

  state.level++;

  state.money += 1500;
  state.metal += 500;
  state.fuel += 300;

  notify(
    "🏆 VICTORY! Enemy headquarters captured."
  );

  $("missionText").textContent =
    "Victory achieved — new mission unlocked.";

  updateUI();
}


function loseBattle() {

  notify(
    "⚠️ DEFEAT — Your forces have been destroyed."
  );

  $("missionText").textContent =
    "Mission failed. Reorganize your forces.";
}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

  terrain.style.transform =
    `
      rotateX(55deg)
      rotateZ(-3deg)
      scale(${state.zoom})
      translateY(-4%)
    `;
}


$("zoomIn").addEventListener("click", () => {

  state.zoom =
    Math.min(1.45, state.zoom + .1);

  updateCamera();

});


$("zoomOut").addEventListener("click", () => {

  state.zoom =
    Math.max(.75, state.zoom - .1);

  updateCamera();

});


$("resetCamera").addEventListener("click", () => {

  state.zoom = 1;

  updateCamera();

  notify("Camera position reset.");

});


/* =========================================================
   TOUCH CAMERA
========================================================= */

let startX = 0;
let startY = 0;

battlefield.addEventListener(
  "touchstart",
  event => {

    const touch = event.touches[0];

    startX = touch.clientX;
    startY = touch.clientY;

  },
  { passive: true }
);

battlefield.addEventListener(
  "touchmove",
  event => {

    const touch = event.touches[0];

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) > 10) {

      terrain.style.marginLeft =
        Math.max(
          -100,
          Math.min(100, dx / 3)
        ) + "px";
    }

    if (Math.abs(dy) > 10) {

      terrain.style.marginTop =
        Math.max(
          -50,
          Math.min(50, dy / 4)
        ) + "px";
    }

  },
  { passive: true }
);


/* =========================================================
   RESEARCH
========================================================= */

$("researchBtn").addEventListener("click", () => {

  $("modalTitle").textContent =
    "🔬 TECHNOLOGY RESEARCH";

  $("modalContent").innerHTML = `
    <div class="research-item">
      <h3>Advanced Armor</h3>
      <p>Increase tank durability.</p>
      <button onclick="research('armor')">Research — $700</button>
    </div>

    <br>

    <div class="research-item">
      <h3>Air Superiority</h3>
      <p>Increase aircraft attack power.</p>
      <button onclick="research('air')">Research — $900</button>
    </div>

    <br>

    <div class="research-item">
      <h3>Logistics</h3>
      <p>Increase fuel efficiency.</p>
      <button onclick="research('logistics')">Research — $600</button>
    </div>
  `;

  $("modal").classList.remove("hidden");
});


function research(type) {

  const costs = {
    armor: 700,
    air: 900,
    logistics: 600
  };

  if (state.money < costs[type]) {

    notify("Not enough money.");

    return;
  }

  state.money -= costs[type];

  if (type === "armor") {

    Object.values(state.units)
      .forEach(unit => unit.hp += 10);

  }

  if (type === "air") {

    state.units.aircraft1.attack += 15;

  }

  if (type === "logistics") {

    state.fuel += 250;

  }

  notify(
    "Research completed: " +
    type.toUpperCase()
  );

  $("modal").classList.add("hidden");

  updateUI();
}


/* =========================================================
   MISSIONS
========================================================= */

$("missionBtn").addEventListener("click", () => {

  $("modalTitle").textContent =
    "🎯 ACTIVE MISSIONS";

  $("modalContent").innerHTML = `
    <p>🏰 Capture enemy headquarters</p>
    <br>
    <p>⚔️ Destroy 3 enemy units</p>
    <br>
    <p>🔭 Complete reconnaissance</p>
    <br>
    <p>🏆 Current level: ${state.level}</p>
  `;

  $("modal").classList.remove("hidden");
});


/* =========================================================
   SAVE GAME
========================================================= */

$("saveBtn").addEventListener("click", () => {

  localStorage.setItem(
    "warfront_save",
    JSON.stringify(state)
  );

  notify("💾 Game saved successfully.");
});


/* =========================================================
   LOAD GAME
========================================================= */

function loadGame() {

  const saved =
    localStorage.getItem("warfront_save");

  if (!saved) {
    return;
  }

  try {

    const data =
      JSON.parse(saved);

    Object.assign(state, data);

    notify("Saved game loaded.");

  } catch (error) {

    console.log("Save data error:", error);

  }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

$("closeModal").addEventListener(
  "click",
  () => {
    $("modal").classList.add("hidden");
  }
);

$("modal").addEventListener(
  "click",
  event => {

    if (event.target === $("modal")) {
      $("modal").classList.add("hidden");
    }

  }
);


/* =========================================================
   PASSIVE ECONOMY
========================================================= */

setInterval(() => {

  state.money += 50;
  state.metal += 20;

  updateUI();

}, 10000);


/* =========================================================
   RANDOM BATTLE EFFECTS
========================================================= */

setInterval(() => {

  if (Math.random() > .55) {

    const x =
      Math.random() *
      battlefield.clientWidth;

    const y =
      Math.random() *
      battlefield.clientHeight *
      .6;

    explosion(x, y);

  }

}, 4500);


/* =========================================================
   INITIALIZE
========================================================= */

loadGame();

updateUI();

updateCamera();

console.log(
  "WARFRONT Tactical Command initialized."
);