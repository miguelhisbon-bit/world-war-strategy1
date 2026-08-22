import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   ENHANCED MAIN.JS
   World Overview + Military + Economy + Intelligence
   Drop-in replacement for js/main.js
========================================================= */

const $ = id => document.getElementById(id);

let scene, camera, renderer, controls, clock;
let ground, worldGroup, unitGroup, effectsGroup;
let units = [];
let selectedUnit = null;

let gameRunning = true;
let gameSpeed = 1;

let gameDay = 1;
let gameMonth = 1;
let gameYear = 1940;

let money = 12500;
let oil = 850;
let steel = 1250;
let food = 1600;
let manpower = 85000;

let moveMode = false;
let attackMode = false;

let lastIncomeTick = 0;
let lastAiTick = 0;
let lastMiniTick = 0;
let lastProductionTick = 0;
let lastResearchTick = 0;

let battleLog = [];
let globalEvents = [];

let fogEnabled = true;
let saveKey = "world_war_strategy_save_v4";

let currentCountry = "USA";

let warSupport = 82;
let nationalStability = 76;
let supplyEfficiency = 88;
let industrialEfficiency = 91;

let researchProgress = {
  armored: 64,
  logistics: 42,
  air: 28,
  naval: 18,
  intelligence: 35,
  nuclear: 5
};

let productionProgress = {
  tanks: 67,
  aircraft: 31,
  infantry: 42,
  ships: 18,
  artillery: 54
};

let casualties = {
  friendly: 0,
  enemy: 0
};

let territoryControl = 58;
let mapLayer = "MILITARY";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const countries = {
  USA: {
    name: "United States",
    flag: "🇺🇸",
    money: 12500,
    oil: 850,
    steel: 1250,
    food: 1600,
    manpower: 85000
  },
  GERMANY: {
    name: "Germany",
    flag: "🇩🇪",
    money: 10000,
    oil: 650,
    steel: 1100,
    food: 1200,
    manpower: 95000
  },
  UK: {
    name: "United Kingdom",
    flag: "🇬🇧",
    money: 11000,
    oil: 700,
    steel: 950,
    food: 1300,
    manpower: 70000
  },
  JAPAN: {
    name: "Japan",
    flag: "🇯🇵",
    money: 9500,
    oil: 500,
    steel: 850,
    food: 1000,
    manpower: 80000
  },
  USSR: {
    name: "Soviet Union",
    flag: "☭",
    money: 9000,
    oil: 900,
    steel: 1400,
    food: 1800,
    manpower: 130000
  },
  FRANCE: {
    name: "France",
    flag: "🇫🇷",
    money: 9500,
    oil: 600,
    steel: 1000,
    food: 1400,
    manpower: 75000
  }
};

async function init() {
  try {
    updateLoading(10, "Initializing command system...");
    createScene();

    updateLoading(28, "Generating strategic terrain...");
    createTerrain();

    updateLoading(50, "Deploying military forces...");
    createUnits();

    updateLoading(68, "Preparing command interface...");
    setupUI();

    updateLoading(82, "Loading campaign systems...");
    loadGame();

    updateLoading(95, "Finalizing battlefield...");
    startGameLoop();

    updateLoading(100, "Battlefield ready.");

    setTimeout(hideLoading, 350);
  } catch (e) {
    console.error(e);
    hideLoading();
    showToast("Recovery mode: battlefield initialized with limited systems.");
  }
}

function updateLoading(progress, text) {
  if ($("loadingProgress")) {
    $("loadingProgress").style.width = `${Math.min(100, progress)}%`;
  }

  if ($("loadingStatus")) {
    $("loadingStatus").textContent = text;
  }
}

/* =========================================================
   SCENE
========================================================= */

function createScene() {
  const canvas = $("gameCanvas");

  if (!canvas) {
    throw new Error("gameCanvas not found");
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081016);
  scene.fog = new THREE.Fog(0x081016, 75, 430);

  camera = new THREE.PerspectiveCamera(
    55,
    innerWidth / innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 82, 86);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(
    0xb9c6c8,
    0x182018,
    1.45
  );

  scene.add(hemi);

  const sun = new THREE.DirectionalLight(
    0xffe3b0,
    2.15
  );

  sun.position.set(-80, 140, 70);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);

  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 180;
  sun.shadow.camera.bottom = -180;

  scene.add(sun);

  worldGroup = new THREE.Group();
  unitGroup = new THREE.Group();
  effectsGroup = new THREE.Group();

  scene.add(
    worldGroup,
    unitGroup,
    effectsGroup
  );

  controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  controls.minDistance = 22;
  controls.maxDistance = 245;

  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minPolarAngle = 0.16;

  controls.target.set(0, 0, 0);

  clock = new THREE.Clock();

  addEventListener("resize", onResize);

  renderer.domElement.addEventListener(
    "pointerdown",
    handleWorldClick
  );
}

/* =========================================================
   TERRAIN
========================================================= */

function createTerrain() {
  const geo = new THREE.PlaneGeometry(
    360,
    360,
    90,
    90
  );

  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const h =
      Math.sin(x * 0.06) * 1.7 +
      Math.cos(y * 0.05) * 1.5 +
      Math.sin((x + y) * 0.025) * 3;

    pos.setZ(i, h);
  }

  geo.computeVertexNormals();

  ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: 0x39483b,
      roughness: 0.96,
      metalness: 0.02
    })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.isGround = true;

  worldGroup.add(ground);

  const grid = new THREE.GridHelper(
    360,
    90,
    0x5c674e,
    0x263229
  );

  grid.position.y = 0.2;
  grid.material.opacity = 0.16;
  grid.material.transparent = true;

  worldGroup.add(grid);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
      color: 0x102c39,
      transparent: true,
      opacity: 0.42,
      roughness: 0.2
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.y = -4;

  worldGroup.add(water);

  createMountains();
  createRoads();
  createBattleMarkers();
  createStrategicMarkers();
}

/* =========================================================
   MOUNTAINS
========================================================= */

function createMountains() {
  for (let i = 0; i < 28; i++) {
    const m = new THREE.Mesh(
      new THREE.ConeGeometry(
        4 + Math.random() * 7,
        10 + Math.random() * 18,
        7
      ),
      new THREE.MeshStandardMaterial({
        color: 0x303a31,
        roughness: 1
      })
    );

    m.position.set(
      (Math.random() - 0.5) * 300,
      5,
      (Math.random() - 0.5) * 300
    );

    m.rotation.y = Math.random() * Math.PI;
    m.castShadow = true;

    worldGroup.add(m);
  }
}

/* =========================================================
   ROADS
========================================================= */

function createRoads() {
  for (let i = 0; i < 12; i++) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.08, 2.5),
      new THREE.MeshStandardMaterial({
        color: 0x252724,
        roughness: 1
      })
    );

    road.position.set(
      (Math.random() - 0.5) * 180,
      0.3,
      (Math.random() - 0.5) * 180
    );

    road.rotation.y = Math.random() * Math.PI;

    worldGroup.add(road);
  }
}

/* =========================================================
   BATTLE MARKERS
========================================================= */

function createBattleMarkers() {
  for (let i = 0; i < 18; i++) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1, 16),
      new THREE.MeshBasicMaterial({
        color: 0x8b3d32,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      })
    );

    ring.rotation.x = -Math.PI / 2;

    ring.position.set(
      (Math.random() - 0.5) * 280,
      0.4,
      (Math.random() - 0.5) * 280
    );

    ring.userData.battleMarker = true;

    worldGroup.add(ring);
  }
}

/* =========================================================
   STRATEGIC MAP MARKERS
========================================================= */

let strategicMarkers = [];

function createStrategicMarkers() {
  strategicMarkers = [];

  const data = [
    ["Oil Field", "OIL", -85, -65],
    ["Industrial Zone", "FACTORY", 75, -55],
    ["Food Region", "FOOD", -65, 65],
    ["Steel Works", "STEEL", 70, 65],
    ["Command HQ", "HQ", 0, 0],
    ["Port", "PORT", 105, 20],
    ["Air Base", "AIRBASE", -105, 15]
  ];

  data.forEach(item => {
    const marker = createStrategicMarker(
      item[0],
      item[1],
      item[2],
      item[3]
    );

    strategicMarkers.push(marker);
    worldGroup.add(marker);
  });
}

function createStrategicMarker(name, type, x, z) {
  const group = new THREE.Group();

  const colors = {
    OIL: 0xd5ad55,
    FACTORY: 0x9b9b9b,
    FOOD: 0x6e9d55,
    STEEL: 0x77828b,
    HQ: 0xd5ad55,
    PORT: 0x4e9ab0,
    AIRBASE: 0x7895b8
  };

  const color = colors[type] || 0xd5ad55;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.15, 18),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    })
  );

  ring.rotation.x = -Math.PI / 2;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
    new THREE.MeshBasicMaterial({
      color
    })
  );

  pole.position.y = 1.5;

  group.add(ring, pole);

  group.position.set(x, 0.45, z);

  group.userData = {
    strategicMarker: true,
    markerType: type,
    markerName: name
  };

  return group;
}

/* =========================================================
   UNITS
========================================================= */

function createUnits() {
  units = [];

  const data = [
    ["1st Armored Division", "TANK", -30, 12, true],
    ["2nd Infantry Division", "INFANTRY", -18, 20, true],
    ["3rd Infantry Division", "INFANTRY", -5, 28, true],
    ["Air Wing Alpha", "AIR", 15, 12, true],

    ["Enemy Armor Group", "TANK", 45, -20, false],
    ["Enemy Infantry Corps", "INFANTRY", 35, -5, false],
    ["Enemy Defense Force", "INFANTRY", 55, 12, false],
    ["Enemy Air Wing", "AIR", 65, -18, false]
  ];

  data.forEach(d => {
    createMilitaryUnit(
      d[0],
      d[1],
      d[2],
      d[3],
      d[4]
    );
  });

  refreshMiniMap();
}

function createMilitaryUnit(
  name,
  type,
  x,
  z,
  friendly
) {
  const group = new THREE.Group();

  const mainMat =
    new THREE.MeshStandardMaterial({
      color: friendly
        ? (
          type === "AIR"
            ? 0x65737a
            : type === "TANK"
              ? 0x566b4f
              : 0x60715a
        )
        : (
          type === "AIR"
            ? 0x704842
            : type === "TANK"
              ? 0x633b36
              : 0x68453f
        ),
      roughness: 0.72,
      metalness: type === "TANK" ? 0.2 : 0.08
    });

  if (type === "TANK") {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.8, 3.2),
      mainMat
    );

    body.position.y = 1.2;
    body.castShadow = true;

    group.add(body);

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.25,
        1.35,
        0.8,
        12
      ),
      mainMat
    );

    turret.position.y = 2.25;
    turret.castShadow = true;

    group.add(turret);

    const cannon = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0x202521,
        metalness: 0.6,
        roughness: 0.4
      })
    );

    cannon.position.set(
      0,
      2.35,
      2.1
    );

    group.add(cannon);

  } else if (type === "INFANTRY") {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.65,
        1.4,
        5,
        8
      ),
      mainMat
    );

    body.position.y = 1.5;
    body.castShadow = true;

    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.48,
        12,
        12
      ),
      new THREE.MeshStandardMaterial({
        color: 0x8c6c50
      })
    );

    head.position.y = 2.8;
    head.castShadow = true;

    group.add(head);

    const rifle = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        0.18,
        2.2
      ),
      new THREE.MeshStandardMaterial({
        color: 0x151817
      })
    );

    rifle.position.set(
      0.5,
      1.5,
      0.5
    );

    rifle.rotation.x = -0.2;

    group.add(rifle);

  } else {
    const fuselage = new THREE.Mesh(
      new THREE.CapsuleGeometry(
        0.7,
        4,
        5,
        10
      ),
      mainMat
    );

    fuselage.rotation.x = Math.PI / 2;
    fuselage.castShadow = true;

    group.add(fuselage);

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        0.2,
        1.3
      ),
      mainMat
    );

    group.add(wing);

    group.position.y = 8;
  }

  group.position.set(
    x,
    type === "AIR" ? 8 : 0.5,
    z
  );

  const unit = {
    id:
      globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(36).slice(2),

    name,
    type,
    friendly,
    object: group,

    hp: 100,
    maxHp: 100,

    organization: 100,
    morale: 85,

    strength:
      type === "TANK"
        ? 85
        : type === "AIR"
          ? 75
          : 70,

    speed:
      type === "TANK"
        ? 18
        : type === "AIR"
          ? 35
          : 12,

    attack:
      type === "TANK"
        ? 24
        : type === "AIR"
          ? 30
          : 16,

    range:
      type === "TANK"
        ? 22
        : type === "AIR"
          ? 55
          : 16,

    destination: null,
    state: "READY",
    cooldown: 0,
    experience: 0
  };

  group.userData.unit = unit;

  group.add(
    createUnitLabel(
      name,
      friendly
    )
  );

  unitGroup.add(group);
  units.push(unit);
}

function createUnitLabel(
  text,
  friendly
) {
  const c =
    document.createElement("canvas");

  c.width = 512;
  c.height = 80;

  const ctx = c.getContext("2d");

  ctx.fillStyle =
    "rgba(5,8,10,.85)";

  ctx.fillRect(
    0,
    0,
    512,
    80
  );

  ctx.font =
    "bold 25px Arial";

  ctx.textAlign = "center";

  ctx.fillStyle =
    friendly
      ? "#d5ad55"
      : "#e45d5d";

  ctx.fillText(
    text,
    256,
    48
  );

  const sprite =
    new THREE.Sprite(
      new THREE.SpriteMaterial({
        map:
          new THREE.CanvasTexture(c),
        transparent: true
      })
    );

  sprite.scale.set(
    8,
    1.25,
    1
  );

  sprite.position.y = 5;

  return sprite;
}

/* =========================================================
   UI
========================================================= */

function setupUI() {
  setupPanelButtons();
  setupUnitCommands();
  setupCountrySelection();
  setupSpeed();
  setupPause();
  setupCamera();
  setupTutorial();
  setupCloseButtons();

  updateResources();
  updateDate();

  openPanel("overview");
}

function setupPanelButtons() {
  document
    .querySelectorAll(".panel-button")
    .forEach(btn => {
      btn.addEventListener(
        "click",
        () => {
          document
            .querySelectorAll(".panel-button")
            .forEach(b =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

          openPanel(
            btn.dataset.panel
          );
        }
      );
    });
}

function stat(label, value) {
  return `
    <div class="stat-row">
      <span>${label}</span>
      <b>${value}</b>
    </div>
  `;
}

function progressStat(
  label,
  value
) {
  const v = Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0
    )
  );

  return `
    <div class="unit-stat">
      <span>${label}</span>
      <div class="progress">
        <i style="width:${v}%"></i>
      </div>
      <b>${Math.round(v)}%</b>
    </div>
  `;
}

function panelButton(
  label,
  panel
) {
  return `
    <button
      class="action-btn overview-nav"
      data-panel="${panel}">
      ${label}
    </button>
  `;
}

/* =========================================================
   MAIN PANELS
========================================================= */

function openPanel(type) {
  const panel = $("mainPanel");
  const title = $("panelTitle");
  const kicker = $("panelKicker");
  const content = $("panelContent");

  if (
    !panel ||
    !title ||
    !kicker ||
    !content
  ) {
    return;
  }

  panel.classList.add("open");

  const friendly =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );

  const enemy =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );

  const data = {

    /* =====================================================
       WORLD OVERVIEW
    ===================================================== */

    overview: [
      "World Overview",
      "STRATEGIC COMMAND",

      `
      <div class="info-card">
        <h3>Global Situation</h3>

        <p>
          Command your army, manage logistics,
          control territory and shape the course
          of the global war.
        </p>

        ${stat(
          "Campaign Date",
          `${gameYear} • ${monthName()} ${String(gameDay).padStart(2, "0")}`
        )}

        ${stat(
          "Controlled Territory",
          `${territoryControl}%`
        )}

        ${stat(
          "Active Wars",
          activeWars()
        )}

        ${stat(
          "Active Fronts",
          countBattles()
        )}

        ${stat(
          "Global Threat",
          enemyThreat()
        )}

        ${stat(
          "World Stability",
          `${nationalStability}%`
        )}
      </div>

      <div class="info-card">
        <h3>Military Strength</h3>

        ${stat(
          "Friendly Units",
          friendly.length
        )}

        ${stat(
          "Enemy Units",
          enemy.length
        )}

        ${stat(
          "Total Manpower",
          Math.floor(manpower).toLocaleString()
        )}

        ${stat(
          "Combat Power",
          `${calculateCombatPower()}`
        )}

        ${progressStat(
          "Army Readiness",
          calculateReadiness()
        )}

        ${progressStat(
          "Average Morale",
          avg("morale")
        )}

        ${progressStat(
          "Organization",
          avg("organization")
        )}
      </div>

      <div class="info-card">
        <h3>War Status</h3>

        ${stat(
          "War Support",
          `${warSupport}%`
        )}

        ${stat(
          "Supply Efficiency",
          `${supplyEfficiency}%`
        )}

        ${stat(
          "Friendly Casualties",
          casualties.friendly.toLocaleString()
        )}

        ${stat(
          "Enemy Casualties",
          casualties.enemy.toLocaleString()
        )}

        ${stat(
          "Territory Gained",
          `${Math.max(0, territoryControl - 50)}%`
        )}

        ${stat(
          "Front Situation",
          frontSituation()
        )}
      </div>

      <div class="info-card">
        <h3>National Economy</h3>

        ${stat(
          "Treasury",
          `$${Math.floor(money).toLocaleString()}`
        )}

        ${stat(
          "Daily Income",
          `+$${dailyIncome()}`
        )}

        ${stat(
          "GDP",
          `$${calculateGDP().toLocaleString()}M`
        )}

        ${stat(
          "Industrial Capacity",
          `${industrialEfficiency}%`
        )}

        ${stat(
          "Oil",
          Math.floor(oil).toLocaleString()
        )}

        ${stat(
          "Steel",
          Math.floor(steel).toLocaleString()
        )}

        ${stat(
          "Food",
          Math.floor(food).toLocaleString()
        )}
      </div>

      <div class="info-card">
        <h3>Military Production</h3>

        ${progressStat(
          "Tank Production",
          productionProgress.tanks
        )}

        ${progressStat(
          "Aircraft Production",
          productionProgress.aircraft
        )}

        ${progressStat(
          "Infantry Equipment",
          productionProgress.infantry
        )}

        ${progressStat(
          "Artillery",
          productionProgress.artillery
        )}

        ${progressStat(
          "Naval Construction",
          productionProgress.ships
        )}

        ${panelButton(
          "OPEN PRODUCTION",
          "production"
        )}
      </div>

      <div class="info-card">
        <h3>Research & Technology</h3>

        ${progressStat(
          "Armored Warfare",
          researchProgress.armored
        )}

        ${progressStat(
          "Logistics",
          researchProgress.logistics
        )}

        ${progressStat(
          "Air Doctrine",
          researchProgress.air
        )}

        ${progressStat(
          "Naval Technology",
          researchProgress.naval
        )}

        ${progressStat(
          "Intelligence",
          researchProgress.intelligence
        )}

        ${progressStat(
          "Nuclear Program",
          researchProgress.nuclear
        )}

        ${panelButton(
          "OPEN RESEARCH",
          "research"
        )}
      </div>

      <div class="info-card">
        <h3>Diplomatic Situation</h3>

        ${stat(
          "Germany",
          "HOSTILE"
        )}

        ${stat(
          "United Kingdom",
          "NEUTRAL"
        )}

        ${stat(
          "USSR",
          "CAUTIOUS"
        )}

        ${stat(
          "Japan",
          "TENSE"
        )}

        ${stat(
          "Allied Relations",
          "STABLE"
        )}

        ${panelButton(
          "OPEN DIPLOMACY",
          "diplomacy"
        )}
      </div>

      <div class="info-card">
        <h3>Intelligence Report</h3>

        ${stat(
          "Enemy Army",
          enemy.length
        )}

        ${stat(
          "Enemy Armor",
          enemyArmor()
        )}

        ${stat(
          "Enemy Air Power",
          enemyAirPower()
        )}

        ${stat(
          "Recon Confidence",
          `${intelConfidence()}%`
        )}

        ${stat(
          "Threat Level",
          enemyThreat()
        )}

        ${panelButton(
          "OPEN INTELLIGENCE",
          "intel"
        )}
      </div>

      <div class="info-card">
        <h3>Global Events</h3>

        ${renderGlobalEvents()}

        <button
          class="action-btn"
          id="generateEventBtn">
          CHECK GLOBAL INTELLIGENCE
        </button>
      </div>

      <div class="info-card">
        <h3>Strategic Map Layer</h3>

        ${stat(
          "Current Layer",
          mapLayer
        )}

        <button
          class="action-btn map-layer-btn"
          data-layer="MILITARY">
          MILITARY MAP
        </button>

        <button
          class="action-btn map-layer-btn"
          data-layer="ECONOMIC">
          ECONOMIC MAP
        </button>

        <button
          class="action-btn map-layer-btn"
          data-layer="RESOURCE">
          RESOURCE MAP
        </button>

        <button
          class="action-btn map-layer-btn"
          data-layer="INTELLIGENCE">
          INTELLIGENCE MAP
        </button>

        <button
          class="action-btn map-layer-btn"
          data-layer="FRONT">
          FRONT-LINE MAP
        </button>
      </div>

      <div class="info-card">
        <h3>Command Shortcuts</h3>

        ${panelButton(
          "ARMY COMMAND",
          "army"
        )}

        ${panelButton(
          "ECONOMY",
          "economy"
        )}

        ${panelButton(
          "PRODUCTION",
          "production"
        )}

        ${panelButton(
          "RESEARCH",
          "research"
        )}

        ${panelButton(
          "DIPLOMACY",
          "diplomacy"
        )}

        ${panelButton(
          "INTELLIGENCE",
          "intel"
        )}
      </div>
      `
    ],

    /* =====================================================
       ARMY
    ===================================================== */

    army: [
      "Army Command",
      "MILITARY COMMAND",

      `
      <div class="info-card">
        <h3>Available Forces</h3>

        ${friendly.length
          ? friendly.map(u => `
            <button
              class="action-btn unit-select"
              data-unit="${u.id}">
              ${u.name}
              • ${u.type}
              • ${u.state}
            </button>
          `).join("")
          : "<p>No active friendly forces.</p>"
        }
      </div>

      <div class="info-card">
        <h3>Army Statistics</h3>

        ${stat(
          "Army Strength",
          `${Math.round(avg("strength"))}%`
        )}

        ${stat(
          "Organization",
          `${Math.round(avg("organization"))}%`
        )}

        ${stat(
          "Morale",
          `${Math.round(avg("morale"))}%`
        )}

        ${stat(
          "Readiness",
          `${calculateReadiness()}%`
        )}

        ${stat(
          "Manpower",
          manpower.toLocaleString()
        )}
      </div>
      `
    ],

    /* =====================================================
       ECONOMY
    ===================================================== */

    economy: [
      "National Economy",
      "ECONOMIC COMMAND",

      `
      <div class="info-card">
        <h3>National Production</h3>

        ${stat(
          "Treasury",
          `$${Math.floor(money).toLocaleString()}`
        )}

        ${stat(
          "Daily Income",
          `$${dailyIncome()}`
        )}

        ${stat(
          "GDP",
          `$${calculateGDP().toLocaleString()}M`
        )}

        ${stat(
          "Oil",
          Math.floor(oil)
        )}

        ${stat(
          "Steel",
          Math.floor(steel)
        )}

        ${stat(
          "Food",
          Math.floor(food)
        )}

        ${stat(
          "Manpower",
          Math.floor(manpower).toLocaleString()
        )}
      </div>

      <div class="info-card">
        <h3>Economic Health</h3>

        ${progressStat(
          "Industrial Efficiency",
          industrialEfficiency
        )}

        ${progressStat(
          "National Stability",
          nationalStability
        )}

        ${progressStat(
          "Supply Efficiency",
          supplyEfficiency
        )}
      </div>

      <button
        class="action-btn"
        id="economyBoost">
        INVEST IN INDUSTRY — $1000
      </button>
      `
    ],

    /* =====================================================
       PRODUCTION
    ===================================================== */

    production: [
      "Military Production",
      "INDUSTRIAL COMMAND",

      `
      <div class="info-card">
        <h3>Production Queue</h3>

        ${progressStat(
          "Tank Production",
          productionProgress.tanks
        )}

        ${progressStat(
          "Aircraft Production",
          productionProgress.aircraft
        )}

        ${progressStat(
          "Infantry Equipment",
          productionProgress.infantry
        )}

        ${progressStat(
          "Artillery",
          productionProgress.artillery
        )}

        ${progressStat(
          "Naval Construction",
          productionProgress.ships
        )}
      </div>

      <button
        class="action-btn"
        id="produceTank">
        PRODUCE TANK — $800 / 80 STEEL
      </button>

      <button
        class="action-btn"
        id="reinforce">
        REINFORCE ARMY — 500 MANPOWER
      </button>
      `
    ],

    /* =====================================================
       RESEARCH
    ===================================================== */

    research: [
      "Technology",
      "RESEARCH COMMAND",

      `
      <div class="info-card">
        <h3>Research Program</h3>

        ${progressStat(
          "Armored Warfare",
          researchProgress.armored
        )}

        ${progressStat(
          "Logistics",
          researchProgress.logistics
        )}

        ${progressStat(
          "Air Doctrine",
          researchProgress.air
        )}

        ${progressStat(
          "Naval Technology",
          researchProgress.naval
        )}

        ${progressStat(
          "Intelligence",
          researchProgress.intelligence
        )}

        ${progressStat(
          "Nuclear Program",
          researchProgress.nuclear
        )}
      </div>

      <button
        class="action-btn"
        id="researchBtn">
        ADVANCE RESEARCH — $1200
      </button>
      `
    ],

    /* =====================================================
       DIPLOMACY
    ===================================================== */

    diplomacy: [
      "Diplomacy",
      "FOREIGN AFFAIRS",

      `
      <div class="info-card">
        <h3>International Relations</h3>

        ${stat(
          "Germany",
          "HOSTILE"
        )}

        ${stat(
          "United Kingdom",
          "NEUTRAL"
        )}

        ${stat(
          "USSR",
          "CAUTIOUS"
        )}

        ${stat(
          "Japan",
          "TENSE"
        )}

        ${stat(
          "France",
          "NEUTRAL"
        )}
      </div>

      <div class="info-card">
        <h3>Strategic Diplomacy</h3>

        ${stat(
          "Trade Status",
          "ACTIVE"
        )}

        ${stat(
          "Military Treaties",
          "1 ACTIVE"
        )}

        ${stat(
          "Sanctions",
          "NONE"
        )}

        ${stat(
          "Alliance Stability",
          "STABLE"
        )}
      </div>
      `
    ],

    /* =====================================================
       INTELLIGENCE
    ===================================================== */

    intel: [
      "Intelligence",
      "INTELLIGENCE COMMAND",

      `
      <div class="info-card">
        <h3>Enemy Intelligence</h3>

        ${stat(
          "Enemy Army",
          enemy.length
        )}

        ${stat(
          "Enemy Armor",
          enemyArmor()
        )}

        ${stat(
          "Enemy Air Power",
          enemyAirPower()
        )}

        ${stat(
          "Threat Level",
          enemyThreat()
        )}

        ${stat(
          "Recon Confidence",
          `${intelConfidence()}%`
        )}

        ${stat(
          "Enemy Activity",
          enemyActivity()
        )}
      </div>

      <div class="info-card">
        <h3>Strategic Intelligence</h3>

        ${stat(
          "Enemy Movement",
          "MONITORED"
        )}

        ${stat(
          "Enemy Production",
          "ESTIMATED"
        )}

        ${stat(
          "Spy Network",
          "OPERATIONAL"
        )}

        ${stat(
          "Satellite Recon",
          "LIMITED"
        )}
      </div>

      <button
        class="action-btn"
        id="intelBtn">
        RUN RECON — $250
      </button>
      `
    ],

    /* =====================================================
       SETTINGS
    ===================================================== */

    settings: [
      "Game Settings",
      "SYSTEM CONTROL",

      `
      <div class="info-card">
        <h3>Graphics</h3>

        <button
          class="action-btn"
          id="toggleFog">
          TOGGLE BATTLEFIELD FOG
        </button>

        <button
          class="action-btn"
          id="resetBtn">
          RESET CAMERA
        </button>

        <button
          class="action-btn"
          id="saveBtn">
          SAVE CAMPAIGN
        </button>

        <button
          class="action-btn"
          id="loadBtn">
          LOAD CAMPAIGN
        </button>
      </div>
      `
    ]
  };

  const d =
    data[type] ||
    data.overview;

  title.textContent = d[0];
  kicker.textContent = d[1];
  content.innerHTML = d[2];

  bindPanelActions();
}

/* =========================================================
   PANEL ACTION BINDING
========================================================= */

function bindPanelActions() {

  document
    .querySelectorAll(".unit-select")
    .forEach(button => {
      button.onclick = () => {
        const unit =
          units.find(
            x =>
              x.id ===
              button.dataset.unit
          );

        if (unit) {
          selectUnit(unit);
        }
      };
    });

  document
    .querySelectorAll(".overview-nav")
    .forEach(button => {
      button.onclick = () => {
        const target =
          button.dataset.panel;

        activatePanelButton(target);
        openPanel(target);
      };
    });

  document
    .querySelectorAll(".map-layer-btn")
    .forEach(button => {
      button.onclick = () => {
        setMapLayer(
          button.dataset.layer
        );
      };
    });

  if ($("economyBoost")) {
    $("economyBoost").onclick = () => {

      if (money >= 1000) {
        money -= 1000;
        steel += 150;

        industrialEfficiency =
          Math.min(
            100,
            industrialEfficiency + 2
          );

        nationalStability =
          Math.min(
            100,
            nationalStability + 1
          );

        addGlobalEvent(
          "Industrial investment completed."
        );

        saveGame();
        updateResources();

        showToast(
          "Industrial investment completed."
        );

        refreshCurrentPanel();
      } else {
        showToast(
          "Insufficient funds."
        );
      }
    };
  }

  if ($("produceTank")) {
    $("produceTank").onclick =
      produceTank;
  }

  if ($("reinforce")) {
    $("reinforce").onclick =
      reinforceArmy;
  }

  if ($("researchBtn")) {
    $("researchBtn").onclick =
      advanceResearch;
  }

  if ($("intelBtn")) {
    $("intelBtn").onclick =
      runRecon;
  }

  if ($("generateEventBtn")) {
    $("generateEventBtn").onclick =
      generateGlobalEvent;
  }

  if ($("toggleFog")) {
    $("toggleFog").onclick = () => {

      fogEnabled = !fogEnabled;

      scene.fog =
        fogEnabled
          ? new THREE.Fog(
            0x081016,
            75,
            430
          )
          : null;

      showToast(
        fogEnabled
          ? "Fog enabled."
          : "Fog disabled."
      );
    };
  }

  if ($("resetBtn")) {
    $("resetBtn").onclick =
      resetCamera;
  }

  if ($("saveBtn")) {
    $("saveBtn").onclick = () => {
      saveGame();
      showToast(
        "Campaign saved."
      );
    };
  }

  if ($("loadBtn")) {
    $("loadBtn").onclick = () => {
      loadGame();
      showToast(
        "Campaign loaded."
      );
    };
  }
}

function activatePanelButton(
  panel
) {
  document
    .querySelectorAll(".panel-button")
    .forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.panel === panel
      );
    });
}

function refreshCurrentPanel() {
  const active =
    document.querySelector(
      ".panel-button.active"
    );

  openPanel(
    active?.dataset.panel ||
    "overview"
  );
}

/* =========================================================
   WORLD OVERVIEW DATA
========================================================= */

function activeWars() {
  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );

  return enemies.length
    ? 1
    : 0;
}

function avg(key) {
  const list =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );

  if (!list.length) {
    return 0;
  }

  return (
    list.reduce(
      (sum, unit) =>
        sum + Number(unit[key] || 0),
      0
    ) / list.length
  );
}

function calculateReadiness() {
  const strength = avg("strength");
  const morale = avg("morale");
  const organization =
    avg("organization");

  return Math.round(
    strength * 0.4 +
    morale * 0.3 +
    organization * 0.3
  );
}

function calculateCombatPower() {
  const friendly =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );

  return Math.round(
    friendly.reduce(
      (sum, u) =>
        sum +
        u.strength *
        (u.organization / 100) *
        (u.morale / 100),
      0
    )
  );
}

function enemyThreat() {
  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );

  if (
    enemies.length >= 4 ||
    supplyEfficiency < 45
  ) {
    return "HIGH";
  }

  if (enemies.length >= 2) {
    return "MEDIUM";
  }

  return "LOW";
}

function enemyArmor() {
  return units.filter(
    u =>
      !u.friendly &&
      u.type === "TANK" &&
      u.state !== "DESTROYED"
  ).length;
}

function enemyAirPower() {
  return units.filter(
    u =>
      !u.friendly &&
      u.type === "AIR" &&
      u.state !== "DESTROYED"
  ).length;
}

function enemyActivity() {
  const active =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED" &&
        (
          u.state === "ADVANCING" ||
          u.state === "ATTACKING"
        )
    ).length;

  if (active >= 3) {
    return "VERY HIGH";
  }

  if (active === 2) {
    return "HIGH";
  }

  if (active === 1) {
    return "MODERATE";
  }

  return "LOW";
}

function intelConfidence() {
  let value = 62;

  if (mapLayer === "INTELLIGENCE") {
    value += 15;
  }

  return Math.min(
    99,
    Math.round(value)
  );
}

function countBattles() {
  const enemy =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );

  const friendly =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );

  let fronts = 0;

  enemy.forEach(e => {
    const nearby =
      friendly.some(
        f =>
          e.object.position.distanceTo(
            f.object.position
          ) <
          e.range + f.range + 8
      );

    if (nearby) {
      fronts++;
    }
  });

  return fronts;
}

function frontSituation() {
  const fronts =
    countBattles();

  if (fronts >= 3) {
    return "CRITICAL";
  }

  if (fronts === 2) {
    return "ACTIVE";
  }

  if (fronts === 1) {
    return "LIMITED";
  }

  return "QUIET";
}

function dailyIncome() {
  return Math.round(
    1.8 +
    industrialEfficiency * 0.04
  );
}

function calculateGDP() {
  return Math.round(
    money * 1.8 +
    industrialEfficiency * 95 +
    steel * 0.45 +
    food * 0.25
  );
}

function monthName() {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
  ];

  return months[
    Math.max(
      0,
      Math.min(
        11,
        gameMonth - 1
      )
    )
  ];
}

/* =========================================================
   GLOBAL EVENTS
========================================================= */

function addGlobalEvent(text) {
  globalEvents.unshift({
    date:
      `${gameYear}-${String(gameMonth).padStart(2, "0")}-${String(gameDay).padStart(2, "0")}`,
    text
  });

  globalEvents =
    globalEvents.slice(0, 8);
}

function renderGlobalEvents() {
  if (!globalEvents.length) {
    return `
      <p>
        No major global events recorded.
      </p>
    `;
  }

  return globalEvents
    .slice(0, 5)
    .map(
      event => `
        <div class="stat-row">
          <span>
            ${event.date}
          </span>
          <b>
            ${event.text}
          </b>
        </div>
      `
    )
    .join("");
}

function generateGlobalEvent() {
  const events = [
    "Enemy forces increased activity near the front.",
    "Industrial output has increased.",
    "Military intelligence detected enemy movement.",
    "Logistics command reports stable supply lines.",
    "Army morale remains under observation.",
    "Strategic reserves are being prepared.",
    "Foreign diplomats requested new negotiations.",
    "Enemy production facilities may be expanding."
  ];

  const event =
    events[
      Math.floor(
        Math.random() *
        events.length
      )
    ];

  addGlobalEvent(event);

  showToast(
    "Global intelligence updated."
  );

  refreshCurrentPanel();
}

/* =========================================================
   MAP LAYERS
========================================================= */

function setMapLayer(layer) {
  mapLayer = layer;

  strategicMarkers.forEach(
    marker => {
      const type =
        marker.userData.markerType;

      if (layer === "MILITARY") {
        marker.visible =
          type === "HQ";
      }

      else if (layer === "ECONOMIC") {
        marker.visible =
          type === "FACTORY" ||
          type === "PORT";
      }

      else if (layer === "RESOURCE") {
        marker.visible =
          type === "OIL" ||
          type === "FOOD" ||
          type === "STEEL";
      }

      else if (layer === "INTELLIGENCE") {
        marker.visible =
          true;
      }

      else if (layer === "FRONT") {
        marker.visible =
          type === "HQ";
      }
    }
  );

  worldGroup.traverse(
    object => {
      if (
        object.userData?.battleMarker
      ) {
        object.visible =
          layer === "MILITARY" ||
          layer === "FRONT" ||
          layer === "INTELLIGENCE";
      }
    }
  );

  showToast(
    `${layer} map layer activated.`
  );

  refreshCurrentPanel();
}

/* =========================================================
   UNIT SELECTION
========================================================= */

function selectUnit(unit) {
  selectedUnit = unit;

  if ($("unitPanel")) {
    $("unitPanel").classList.add(
      "open"
    );
  }

  if ($("selectedUnitType")) {
    $("selectedUnitType").textContent =
      `${unit.type} • ${unit.state}`;
  }

  if ($("selectedUnitName")) {
    $("selectedUnitName").textContent =
      unit.name;
  }

  updateUnitStats();

  showToast(
    `${unit.name} selected`
  );
}

function updateUnitStats() {
  if (
    !selectedUnit ||
    !$("unitStats")
  ) {
    return;
  }

  const u = selectedUnit;

  $("unitStats").innerHTML = `
    ${progressStat(
      "Strength",
      u.strength
    )}

    ${progressStat(
      "Organization",
      u.organization
    )}

    ${progressStat(
      "Morale",
      u.morale
    )}

    ${progressStat(
      "Health",
      u.hp
    )}

    ${stat(
      "Speed",
      `${u.speed} km/h`
    )}

    ${stat(
      "Attack",
      u.attack
    )}

    ${stat(
      "Range",
      u.range
    )}

    ${stat(
      "Experience",
      Math.round(u.experience)
    )}

    ${stat(
      "Status",
      u.state
    )}
  `;
}

/* =========================================================
   UNIT COMMANDS
========================================================= */

function setupUnitCommands() {
  const on = (
    id,
    fn
  ) => {
    if ($(id)) {
      $(id).onclick = fn;
    }
  };

  on(
    "moveCommand",
    () => {
      if (!selectedUnit) {
        return showToast(
          "Select a unit first."
        );
      }

      moveMode = true;
      attackMode = false;

      showToast(
        "Tap battlefield for destination."
      );
    }
  );

  on(
    "attackCommand",
    () => {
      if (!selectedUnit) {
        return showToast(
          "Select a unit first."
        );
      }

      attackMode = true;
      moveMode = false;

      showToast(
        "Select an enemy target."
      );
    }
  );

  on(
    "defendCommand",
    () => {
      if (!selectedUnit) {
        return;
      }

      selectedUnit.state =
        "DEFENDING";

      selectedUnit.destination =
        null;

      selectedUnit.organization =
        Math.min(
          100,
          selectedUnit.organization + 8
        );

      warSupport =
        Math.min(
          100,
          warSupport + 0.2
        );

      showToast(
        `${selectedUnit.name} is defending.`
      );

      updateUnitStats();
    }
  );

  on(
    "holdCommand",
    () => {
      if (!selectedUnit) {
        return;
      }

      selectedUnit.destination =
        null;

      selectedUnit.state =
        "HOLDING";

      showToast(
        `${selectedUnit.name} holding.`
      );
    }
  );

  on(
    "retreatCommand",
    () => {
      if (!selectedUnit) {
        return;
      }

      selectedUnit.state =
        "RETREATING";

      selectedUnit.destination =
        new THREE.Vector3(
          selectedUnit.object.position.x - 25,
          selectedUnit.object.position.y,
          selectedUnit.object.position.z + 25
        );

      showToast(
        `${selectedUnit.name} retreating.`
      );
    }
  );

  on(
    "airstrikeCommand",
    () => {
      if (!selectedUnit) {
        return showToast(
          "Select an aircraft."
        );
      }

      if (
        selectedUnit.type !== "AIR"
      ) {
        return showToast(
          "Only aircraft can perform airstrikes."
        );
      }

      if (
        selectedUnit.cooldown > 0
      ) {
        return showToast(
          `Airstrike ready in ${Math.ceil(selectedUnit.cooldown)}s.`
        );
      }

      performAirstrike();
    }
  );
}

/* =========================================================
   WORLD CLICK
========================================================= */

function handleWorldClick(e) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  mouse.x =
    ((e.clientX - rect.left) /
      rect.width) *
      2 -
    1;

  mouse.y =
    -(
      (e.clientY - rect.top) /
      rect.height
    ) *
      2 +
    1;

  raycaster.setFromCamera(
    mouse,
    camera
  );

  const objects = [];

  units.forEach(
    unit => {
      unit.object.traverse(
        object => {
          if (
            object.isMesh ||
            object.isSprite
          ) {
            objects.push(object);
          }
        }
      );
    }
  );

  const hits =
    raycaster.intersectObjects(
      objects,
      true
    );

  if (hits.length) {
    let object =
      hits[0].object;

    while (
      object &&
      !object.userData.unit
    ) {
      object = object.parent;
    }

    if (
      object?.userData?.unit
    ) {
      const unit =
        object.userData.unit;

      if (
        attackMode &&
        selectedUnit &&
        !unit.friendly
      ) {
        attackUnit(
          selectedUnit,
          unit
        );

        attackMode = false;
        return;
      }

      selectUnit(unit);
      return;
    }
  }

  if (
    moveMode &&
    selectedUnit
  ) {
    const hits2 =
      raycaster.intersectObject(
        ground
      );

    if (hits2.length) {
      const p =
        hits2[0].point;

      setDestination(
        selectedUnit,
        p
      );

      moveMode = false;
    }
  }
}

/* =========================================================
   MOVEMENT
========================================================= */

function setDestination(
  unit,
  point
) {
  unit.destination =
    new THREE.Vector3(
      point.x,
      unit.object.position.y,
      point.z
    );

  unit.state =
    "MOVING";

  createDestinationMarker(
    point
  );

  showToast(
    `${unit.name} moving to new position.`
  );
}

function createDestinationMarker(
  point
) {
  const ring =
    new THREE.Mesh(
      new THREE.RingGeometry(
        1.1,
        1.35,
        24
      ),
      new THREE.MeshBasicMaterial({
        color: 0xd5ad55,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );

  ring.rotation.x =
    -Math.PI / 2;

  ring.position.set(
    point.x,
    0.45,
    point.z
  );

  effectsGroup.add(ring);

  const start =
    performance.now();

  const animate =
    now => {
      const q =
        Math.min(
          (now - start) /
            1200,
          1
        );

      ring.scale.setScalar(
        1 + q * 2
      );

      ring.material.opacity =
        0.8 * (1 - q);

      if (q < 1) {
        requestAnimationFrame(
          animate
        );
      } else {
        effectsGroup.remove(
          ring
        );

        ring.geometry.dispose();
        ring.material.dispose();
      }
    };

  requestAnimationFrame(
    animate
  );
}

/* =========================================================
   COMBAT
========================================================= */

function attackUnit(
  attacker,
  target
) {
  if (
    !attacker ||
    !target ||
    !attacker.friendly ||
    target.friendly
  ) {
    return;
  }

  const distance =
    attacker.object.position.distanceTo(
      target.object.position
    );

  if (
    distance >
    attacker.range + 5
  ) {
    setDestination(
      attacker,
      target.object.position
    );

    attacker.state =
      "ATTACKING";

    showToast(
      "Target out of range — unit advancing."
    );

    return;
  }

  if (
    attacker.cooldown > 0
  ) {
    return showToast(
      `Weapon reload: ${attacker.cooldown.toFixed(1)}s`
    );
  }

  const targetWasDefending =
    target.state ===
    "DEFENDING";

  attacker.cooldown =
    attacker.type === "AIR"
      ? 8
      : attacker.type === "TANK"
        ? 2.2
        : 3;

  attacker.state =
    "ATTACKING";

  target.state =
    "UNDER ATTACK";

  const terrainBonus =
    targetWasDefending
      ? 0.8
      : 1;

  const damage =
    Math.max(
      2,
      attacker.attack *
        (0.65 +
          Math.random() * 0.7) *
        (attacker.organization /
          100) *
        (attacker.morale /
          100) *
        terrainBonus
    );

  target.hp =
    Math.max(
      0,
      target.hp - damage
    );

  target.organization =
    Math.max(
      0,
      target.organization -
        damage * 0.8
    );

  target.morale =
    Math.max(
      0,
      target.morale -
        damage * 0.25
    );

  attacker.experience =
    Math.min(
      100,
      attacker.experience + 1.2
    );

  attacker.strength =
    Math.min(
      100,
      attacker.strength + 0.05
    );

  createExplosion(
    target.object.position.clone()
  );

  addBattleLog(
    `${attacker.name} hit ${target.name} for ${Math.round(damage)} damage.`
  );

  if ($("battleStatus")) {
    $("battleStatus").textContent =
      `BATTLE: ${attacker.name} vs ${target.name}`;
  }

  showToast(
    `${attacker.name} attacked ${target.name}`
  );

  if (target.hp <= 0) {
    casualties.enemy++;
    territoryControl =
      Math.min(
        100,
        territoryControl + 0.5
      );

    destroyUnit(
      target
    );
  }

  updateUnitStats();
}

function performAirstrike() {
  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );

  if (!enemies.length) {
    return showToast(
      "No enemy targets."
    );
  }

  const target =
    enemies.reduce(
      (best, unit) =>
        unit.hp < best.hp
          ? unit
          : best,
      enemies[0]
    );

  selectedUnit.cooldown = 8;

  const p =
    target.object.position.clone();

  p.y = 1;

  createExplosion(p);

  createExplosion(
    p.clone().add(
      new THREE.Vector3(
        3,
        0,
        2
      )
    )
  );

  target.hp =
    Math.max(
      0,
      target.hp -
        28 -
        Math.random() * 14
    );

  target.organization =
    Math.max(
      0,
      target.organization - 24
    );

  target.morale =
    Math.max(
      0,
      target.morale - 12
    );

  addBattleLog(
    `Airstrike hit ${target.name}.`
  );

  showToast(
    `Airstrike hit ${target.name}`
  );

  if (target.hp <= 0) {
    casualties.enemy++;
    destroyUnit(target);
  }
}

/* =========================================================
   EFFECTS
========================================================= */

function createExplosion(
  position
) {
  const geometry =
    new THREE.SphereGeometry(
      1,
      16,
      16
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: 0xff8a27,
      transparent: true,
      opacity: 0.9
    });

  const explosion =
    new THREE.Mesh(
      geometry,
      material
    );

  explosion.position.copy(
    position
  );

  effectsGroup.add(
    explosion
  );

  const start =
    performance.now();

  const animate =
    now => {
      const progress =
        Math.min(
          (now - start) /
            650,
          1
        );

      explosion.scale.setScalar(
        1 + progress * 5
      );

      material.opacity =
        0.9 *
        (1 - progress);

      if (
        progress < 1
      ) {
        requestAnimationFrame(
          animate
        );
      } else {
        effectsGroup.remove(
          explosion
        );

        geometry.dispose();
        material.dispose();
      }
    };

  requestAnimationFrame(
    animate
  );

  createSmoke(position);
}

function createSmoke(
  position
) {
  const geometry =
    new THREE.SphereGeometry(
      0.7,
      10,
      10
    );

  const material =
    new THREE.MeshBasicMaterial({
      color: 0x3b3b35,
      transparent: true,
      opacity: 0.5
    });

  const smoke =
    new THREE.Mesh(
      geometry,
      material
    );

  smoke.position.copy(
    position
  );

  smoke.position.y += 1;

  effectsGroup.add(
    smoke
  );

  const start =
    performance.now();

  const animate =
    now => {
      const progress =
        Math.min(
          (now - start) /
            1400,
          1
        );

      smoke.position.y +=
        0.012;

      smoke.scale.setScalar(
        1 + progress * 3
      );

      material.opacity =
        0.5 *
        (1 - progress);

      if (
        progress < 1
      ) {
        requestAnimationFrame(
          animate
        );
      } else {
        effectsGroup.remove(
          smoke
        );

        geometry.dispose();
        material.dispose();
      }
    };

  requestAnimationFrame(
    animate
  );
}

/* =========================================================
   DESTROY UNIT
========================================================= */

function destroyUnit(unit) {
  unit.state =
    "DESTROYED";

  unit.object.visible =
    false;

  unit.destination =
    null;

  createExplosion(
    unit.object.position.clone()
  );

  if (
    selectedUnit === unit
  ) {
    selectedUnit = null;

    if ($("unitPanel")) {
      $("unitPanel").classList.remove(
        "open"
      );
    }
  }

  addBattleLog(
    `${unit.name} was destroyed.`
  );

  addGlobalEvent(
    `${unit.name} was destroyed in combat.`
  );

  refreshMiniMap();

  checkVictory();

  showToast(
    `${unit.name} destroyed.`
  );
}

/* =========================================================
   GAME UPDATE
========================================================= */

function updateGame(dt) {
  if (!gameRunning) {
    return;
  }

  const delta =
    dt * gameSpeed;

  units.forEach(
    unit => {
      if (
        unit.state ===
        "DESTROYED"
      ) {
        return;
      }

      unit.cooldown =
        Math.max(
          0,
          unit.cooldown - delta
        );

      if (unit.destination) {
        const target =
          unit.destination;

        const distance =
          unit.object.position.distanceTo(
            target
          );

        if (distance < 1) {
          unit.destination =
            null;

          if (
            unit.state ===
              "MOVING" ||
            unit.state ===
              "RETREATING" ||
            unit.state ===
              "ADVANCING"
          ) {
            unit.state =
              "READY";
          }
        } else {
          const direction =
            new THREE.Vector3()
              .subVectors(
                target,
                unit.object.position
              )
              .normalize();

          const speed =
            unit.speed *
            0.055 *
            delta;

          unit.object.position.add(
            direction.multiplyScalar(
              Math.min(
                speed,
                distance
              )
            )
          );

          unit.object.lookAt(
            target.x,
            unit.object.position.y,
            target.z
          );

          unit.organization =
            Math.max(
              0,
              unit.organization -
                0.004 * delta
            );

          if (
            unit.type ===
            "TANK"
          ) {
            oil =
              Math.max(
                0,
                oil -
                  0.006 *
                    delta
              );
          }
        }
      }

      if (
        unit.state ===
        "DEFENDING"
      ) {
        unit.organization =
          Math.min(
            100,
            unit.organization +
              0.012 * delta
          );
      }

      if (
        unit.state ===
        "HOLDING"
      ) {
        unit.morale =
          Math.min(
            100,
            unit.morale +
              0.006 * delta
          );
      }
    }
  );

  /* Income */

  lastIncomeTick += dt;

  if (
    lastIncomeTick >= 1
  ) {
    const income =
      lastIncomeTick *
      gameSpeed;

    const efficiency =
      industrialEfficiency /
      100;

    money +=
      1.8 *
      income *
      efficiency;

    steel +=
      0.55 *
      income *
      efficiency;

    food +=
      0.4 *
      income;

    oil +=
      0.18 *
      income;

    lastIncomeTick = 0;

    updateResources();
  }

  /* Production */

  lastProductionTick += dt;

  if (
    lastProductionTick >=
    2
  ) {
    advanceProduction(
      lastProductionTick *
        gameSpeed
    );

    lastProductionTick = 0;
  }

  /* Research */

  lastResearchTick += dt;

  if (
    lastResearchTick >=
    3
  ) {
    advanceResearchPassive(
      lastResearchTick *
        gameSpeed
    );

    lastResearchTick = 0;
  }

  /* Enemy AI */

  lastAiTick += dt;

  if (
    lastAiTick >
    2 / gameSpeed
  ) {
    enemyAI();

    lastAiTick = 0;
  }

  if (
    performance.now() -
      lastMiniTick >
    700
  ) {
    refreshMiniMap();

    lastMiniTick =
      performance.now();
  }

  if (selectedUnit) {
    updateUnitStats();
  }
}

/* =========================================================
   PRODUCTION
========================================================= */

function advanceProduction(
  amount
) {
  productionProgress.tanks =
    Math.min(
      100,
      productionProgress.tanks +
        amount * 0.5
    );

  productionProgress.aircraft =
    Math.min(
      100,
      productionProgress.aircraft +
        amount * 0.25
    );

  productionProgress.infantry =
    Math.min(
      100,
      productionProgress.infantry +
        amount * 0.4
    );

  productionProgress.artillery =
    Math.min(
      100,
      productionProgress.artillery +
        amount * 0.32
    );

  productionProgress.ships =
    Math.min(
      100,
      productionProgress.ships +
        amount * 0.12
    );
}

function produceTank() {
  if (
    money < 800 ||
    steel < 80
  ) {
    return showToast(
      "Need $800 and 80 steel."
    );
  }

  money -= 800;
  steel -= 80;

  const base =
    units.find(
      u =>
        u.friendly &&
        u.type === "TANK" &&
        u.state !==
          "DESTROYED"
    );

  const x =
    base
      ? base.object.position.x -
        7
      : -35;

  const z =
    base
      ? base.object.position.z +
        5
      : 15;

  createMilitaryUnit(
    `Reserve Tank ${
      units.filter(
        u =>
          u.friendly &&
          u.type === "TANK"
      ).length + 1
    }`,
    "TANK",
    x,
    z,
    true
  );

  productionProgress.tanks =
    0;

  updateResources();
  refreshMiniMap();

  addGlobalEvent(
    "A new armored reserve unit has entered production."
  );

  showToast(
    "New tank deployed."
  );
}

/* =========================================================
   REINFORCEMENTS
========================================================= */

function reinforceArmy() {
  if (
    manpower < 500 ||
    food < 100
  ) {
    return showToast(
      "Need 500 manpower and 100 food."
    );
  }

  manpower -= 500;
  food -= 100;

  units
    .filter(
      u =>
        u.friendly &&
        u.state !==
          "DESTROYED"
    )
    .forEach(
      unit => {
        unit.hp =
          Math.min(
            100,
            unit.hp + 12
          );

        unit.organization =
          Math.min(
            100,
            unit.organization +
              15
          );
      }
    );

  warSupport =
    Math.min(
      100,
      warSupport + 1
    );

  updateResources();

  addGlobalEvent(
    "Army reinforcements arrived at the front."
  );

  showToast(
    "Reinforcements arrived."
  );
}

/* =========================================================
   RESEARCH
========================================================= */

function advanceResearch() {
  if (
    money < 1200
  ) {
    return showToast(
      "Insufficient funds."
    );
  }

  money -= 1200;

  researchProgress.armored =
    Math.min(
      100,
      researchProgress.armored + 8
    );

  researchProgress.logistics =
    Math.min(
      100,
      researchProgress.logistics + 7
    );

  researchProgress.air =
    Math.min(
      100,
      researchProgress.air + 5
    );

  researchProgress.naval =
    Math.min(
      100,
      researchProgress.naval + 3
    );

  researchProgress.intelligence =
    Math.min(
      100,
      researchProgress.intelligence + 5
    );

  researchProgress.nuclear =
    Math.min(
      100,
      researchProgress.nuclear + 1
    );

  units
    .filter(
      u =>
        u.friendly
    )
    .forEach(
      unit => {
        unit.strength =
          Math.min(
            100,
            unit.strength + 3
          );
      }
    );

  updateResources();

  addGlobalEvent(
    "Research command reports a major technological breakthrough."
  );

  showToast(
    "Research breakthrough completed."
  );

  refreshCurrentPanel();
}

function advanceResearchPassive(
  amount
) {
  researchProgress.armored =
    Math.min(
      100,
      researchProgress.armored +
        amount * 0.015
    );

  researchProgress.logistics =
    Math.min(
      100,
      researchProgress.logistics +
        amount * 0.012
    );

  researchProgress.air =
    Math.min(
      100,
      researchProgress.air +
        amount * 0.008
    );

  researchProgress.intelligence =
    Math.min(
      100,
      researchProgress.intelligence +
        amount * 0.01
    );
}

/* =========================================================
   INTELLIGENCE
========================================================= */

function runRecon() {
  if (
    money < 250
  ) {
    return showToast(
      "Insufficient funds."
    );
  }

  money -= 250;

  researchProgress.intelligence =
    Math.min(
      100,
      researchProgress.intelligence +
        2
    );

  addGlobalEvent(
    "Recon operation completed. Enemy positions updated."
  );

  updateResources();

  showToast(
    "Recon report updated."
  );

  refreshCurrentPanel();
}

/* =========================================================
   ENEMY AI
========================================================= */

function enemyAI() {
  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !==
          "DESTROYED"
    );

  const friendlies =
    units.filter(
      u =>
        u.friendly &&
        u.state !==
          "DESTROYED"
    );

  if (
    !friendlies.length ||
    !enemies.length
  ) {
    return;
  }

  enemies.forEach(
    enemy => {
      const target =
        friendlies.reduce(
          (best, unit) => {
            const bestDistance =
              best.object.position.distanceTo(
                enemy.object.position
              );

            const distance =
              unit.object.position.distanceTo(
                enemy.object.position
              );

            return distance <
              bestDistance
              ? unit
              : best;
          },
          friendlies[0]
        );

      const distance =
        enemy.object.position.distanceTo(
          target.object.position
        );

      if (
        distance <=
        enemy.range + 2
      ) {
        enemy.state =
          "ATTACKING";

        if (
          enemy.cooldown <= 0
        ) {
          attackEnemy(
            enemy,
            target
          );
        }

      } else if (
        !enemy.destination ||
        Math.random() <
          0.025
      ) {
        const p =
          target.object.position.clone();

        p.x +=
          (Math.random() - 0.5) *
          8;

        p.z +=
          (Math.random() - 0.5) *
          8;

        enemy.destination =
          new THREE.Vector3(
            p.x,
            enemy.object.position.y,
            p.z
          );

        enemy.state =
          "ADVANCING";
      }
    }
  );
}

function attackEnemy(
  attacker,
  target
) {
  if (
    attacker.cooldown > 0
  ) {
    return;
  }

  attacker.cooldown =
    attacker.type === "TANK"
      ? 2.6
      : attacker.type === "AIR"
        ? 7
        : 3.4;

  const damage =
    Math.max(
      2,
      attacker.attack *
        (0.5 +
          Math.random() *
            0.55) *
        (attacker.organization /
          100) *
        (attacker.morale /
          100)
    );

  target.hp =
    Math.max(
      0,
      target.hp - damage
    );

  target.organization =
    Math.max(
      0,
      target.organization -
        damage * 0.65
    );

  target.morale =
    Math.max(
      0,
      target.morale -
        damage * 0.18
    );

  attacker.experience =
    Math.min(
      100,
      attacker.experience + 0.8
    );

  createExplosion(
    target.object.position.clone()
  );

  addBattleLog(
    `${attacker.name} attacked ${target.name}.`
  );

  addGlobalEvent(
    `${attacker.name} engaged ${target.name}.`
  );

  if (
    target.hp <= 0
  ) {
    casualties.friendly++;

    territoryControl =
      Math.max(
        0,
        territoryControl - 0.7
      );

    destroyUnit(
      target
    );
  }
}

/* =========================================================
   VICTORY / DEFEAT
========================================================= */

function checkVictory() {
  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !==
          "DESTROYED"
    );

  const friends =
    units.filter(
      u =>
        u.friendly &&
        u.state !==
          "DESTROYED"
    );

  if (!enemies.length) {
    gameRunning = false;

    warSupport =
      Math.min(
        100,
        warSupport + 15
      );

    showToast(
      "VICTORY — Enemy forces eliminated."
    );

    if ($("statusText")) {
      $("statusText").textContent =
        "VICTORY";
    }

    addGlobalEvent(
      "Victory achieved. Enemy forces have been eliminated."
    );

  } else if (!friends.length) {
    gameRunning = false;

    warSupport =
      Math.max(
        0,
        warSupport - 20
      );

    showToast(
      "DEFEAT — All friendly forces destroyed."
    );

    if ($("statusText")) {
      $("statusText").textContent =
        "DEFEAT";
    }

    addGlobalEvent(
      "Defeat declared. All friendly forces have been destroyed."
    );
  }
}

/* =========================================================
   SPEED / PAUSE
========================================================= */

function setupSpeed() {
  if (!$("speedBtn")) {
    return;
  }

  $("speedBtn").onclick =
    () => {
      const speeds =
        [1, 2, 4, 8];

      const index =
        speeds.indexOf(
          gameSpeed
        );

      gameSpeed =
        speeds[
          (index + 1) %
            speeds.length
        ];

      $("speedBtn").textContent =
        `${gameSpeed}×`;

      showToast(
        `Game speed ${gameSpeed}×`
      );
    };
}

function setupPause() {
  if (!$("pauseBtn")) {
    return;
  }

  $("pauseBtn").onclick =
    () => {
      gameRunning =
        !gameRunning;

      $("pauseBtn").textContent =
        gameRunning
          ? "Ⅱ"
          : "▶";

      if ($("statusText")) {
        $("statusText").textContent =
          gameRunning
            ? "All systems operational"
            : "GAME PAUSED";
      }
    };
}

/* =========================================================
   CAMERA
========================================================= */

function setupCamera() {
  if ($("zoomIn")) {
    $("zoomIn").onclick =
      () => {
        camera.position.multiplyScalar(
          0.85
        );
      };
  }

  if ($("zoomOut")) {
    $("zoomOut").onclick =
      () => {
        camera.position.multiplyScalar(
          1.15
        );
      };
  }

  if ($("resetCamera")) {
    $("resetCamera").onclick =
      resetCamera;
  }
}

function resetCamera() {
  camera.position.set(
    0,
    82,
    86
  );

  controls.target.set(
    0,
    0,
    0
  );

  controls.update();

  showToast(
    "Strategic camera reset."
  );
}

/* =========================================================
   COUNTRY
========================================================= */

function setupCountrySelection() {
  document
    .querySelectorAll(".country-card")
    .forEach(card => {
      card.addEventListener(
        "click",
        () =>
          selectCountry(
            card.dataset.country
          )
      );
    });

  if (
    $("closeCountryModal")
  ) {
    $("closeCountryModal").onclick =
      () => {
        if ($("countryModal")) {
          $("countryModal").classList.remove(
            "open"
          );
        }
      };
  }
}

function selectCountry(
  id
) {
  const country =
    countries[id];

  if (!country) {
    return;
  }

  currentCountry = id;

  money =
    country.money;

  oil =
    country.oil;

  steel =
    country.steel;

  food =
    country.food;

  manpower =
    country.manpower;

  if ($("countryFlag")) {
    $("countryFlag").textContent =
      country.flag;
  }

  if ($("countryName")) {
    $("countryName").textContent =
      country.name;
  }

  updateResources();

  if ($("countryModal")) {
    $("countryModal").classList.remove(
      "open"
    );
  }

  addGlobalEvent(
    `Now commanding ${country.name}.`
  );

  saveGame();

  showToast(
    `Now commanding ${country.name}`
  );

  refreshCurrentPanel();
}

/* =========================================================
   TUTORIAL
========================================================= */

function setupTutorial() {
  const tutorial =
    $("tutorial");

  const title =
    $("tutorialTitle");

  const text =
    $("tutorialText");

  const button =
    $("tutorialNext");

  if (
    !tutorial ||
    !title ||
    !text ||
    !button
  ) {
    return;
  }

  const pages = [
    [
      "Welcome, Commander",
      "Select a unit and use MOVE, ATTACK, DEFEND or HOLD."
    ],
    [
      "Realistic Combat",
      "Units have health, organization, morale, range, reload and experience."
    ],
    [
      "Logistics",
      "Tanks consume oil. Food and manpower support your army."
    ],
    [
      "World Overview",
      "Monitor military strength, economy, fronts, intelligence, diplomacy and global events."
    ],
    [
      "Strategic Map",
      "Use Military, Economic, Resource, Intelligence and Front-Line map layers."
    ],
    [
      "Enemy AI",
      "Enemy forces advance, select targets and attack automatically."
    ],
    [
      "Campaign",
      "Use Economy, Production, Research and Intelligence to win the war."
    ]
  ];

  let page = 0;

  button.onclick =
    () => {
      page++;

      if (
        page >=
        pages.length
      ) {
        tutorial.style.display =
          "none";

        return;
      }

      title.textContent =
        pages[page][0];

      text.textContent =
        pages[page][1];
    };
}

/* =========================================================
   CLOSE BUTTONS
========================================================= */

function setupCloseButtons() {
  if ($("closePanel")) {
    $("closePanel").onclick =
      () => {
        $("mainPanel")
          ?.classList.remove(
            "open"
          );
      };
  }

  if ($("closeUnit")) {
    $("closeUnit").onclick =
      () => {
        $("unitPanel")
          ?.classList.remove(
            "open"
          );

        selectedUnit =
          null;
      };
  }
}

/* =========================================================
   MINIMAP
========================================================= */

function refreshMiniMap() {
  const container =
    $("miniUnits");

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  units.forEach(
    unit => {
      if (
        unit.state ===
        "DESTROYED"
      ) {
        return;
      }

      const dot =
        document.createElement(
          "div"
        );

      const left =
        Math.max(
          3,
          Math.min(
            97,
            50 +
              unit.object.position.x /
                3
          )
        );

      const top =
        Math.max(
          3,
          Math.min(
            97,
            50 +
              unit.object.position.z /
                3
          )
        );

      dot.style.cssText = `
        position:absolute;
        width:6px;
        height:6px;
        border-radius:50%;
        left:${left}%;
        top:${top}%;
        background:${
          unit.friendly
            ? "#55d18a"
            : "#e45d5d"
        };
        box-shadow:
          0 0 5px currentColor;
      `;

      container.appendChild(
        dot
      );
    }
  );
}

/* =========================================================
   DATE
========================================================= */

function advanceDate() {
  gameDay++;

  if (
    gameDay > 30
  ) {
    gameDay = 1;
    gameMonth++;

    if (
      gameMonth > 12
    ) {
      gameMonth = 1;
      gameYear++;
    }
  }

  /* World simulation */

  if (
    gameDay % 5 === 0
  ) {
    warSupport =
      Math.max(
        0,
        Math.min(
          100,
          warSupport +
            (Math.random() - 0.5) *
              2
        )
      );

    nationalStability =
      Math.max(
        0,
        Math.min(
          100,
          nationalStability +
            (Math.random() - 0.5) *
              1.5
        )
      );
  }

  updateDate();

  saveGame();
}

function updateDate() {
  if ($("gameDate")) {
    $("gameDate").textContent =
      `${gameYear} • ${monthName()} ${String(gameDay).padStart(2, "0")}`;
  }
}

/* =========================================================
   RESOURCES
========================================================= */

function updateResources() {
  const set =
    (id, value) => {
      if ($(id)) {
        $(id).textContent =
          Math.floor(
            value
          ).toLocaleString();
      }
    };

  set(
    "money",
    money
  );

  set(
    "oil",
    oil
  );

  set(
    "steel",
    steel
  );

  set(
    "food",
    food
  );

  set(
    "manpower",
    manpower
  );
}

/* =========================================================
   BATTLE LOG
========================================================= */

function addBattleLog(
  text
) {
  battleLog.unshift(
    `[${gameYear}-${String(gameMonth).padStart(2, "0")}-${String(gameDay).padStart(2, "0")}] ${text}`
  );

  battleLog =
    battleLog.slice(
      0,
      20
    );

  const element =
    $("battleLog");

  if (element) {
    element.innerHTML =
      battleLog
        .map(
          entry =>
            `<div>${entry}</div>`
        )
        .join("");
  }
}

/* =========================================================
   SAVE
========================================================= */

function saveGame() {
  try {
    const data = {
      version: 4,

      currentCountry,

      money,
      oil,
      steel,
      food,
      manpower,

      gameDay,
      gameMonth,
      gameYear,

      warSupport,
      nationalStability,
      supplyEfficiency,
      industrialEfficiency,

      territoryControl,

      researchProgress,
      productionProgress,

      casualties,

      mapLayer,

      globalEvents,
      battleLog,

      units:
        units.map(
          unit => ({
            id: unit.id,
            name: unit.name,
            type: unit.type,
            friendly:
              unit.friendly,

            hp: unit.hp,
            organization:
              unit.organization,
            morale:
              unit.morale,
            strength:
              unit.strength,

            experience:
              unit.experience,

            state:
              unit.state,

            x:
              unit.object.position.x,

            y:
              unit.object.position.y,

            z:
              unit.object.position.z
          })
        )
    };

    localStorage.setItem(
      saveKey,
      JSON.stringify(data)
    );

  } catch (error) {
    console.warn(
      "Save failed:",
      error
    );
  }
}

/* =========================================================
   LOAD
========================================================= */

function loadGame() {
  try {
    const raw =
      localStorage.getItem(
        saveKey
      );

    if (!raw) {
      return;
    }

    const data =
      JSON.parse(raw);

    if (
      data.currentCountry &&
      countries[
        data.currentCountry
      ]
    ) {
      currentCountry =
        data.currentCountry;
    }

    if (
      Number.isFinite(
        data.money
      )
    ) {
      money =
        data.money;
    }

    if (
      Number.isFinite(
        data.oil
      )
    ) {
      oil =
        data.oil;
    }

    if (
      Number.isFinite(
        data.steel
      )
    ) {
      steel =
        data.steel;
    }

    if (
      Number.isFinite(
        data.food
      )
    ) {
      food =
        data.food;
    }

    if (
      Number.isFinite(
        data.manpower
      )
    ) {
      manpower =
        data.manpower;
    }

    if (
      Number.isFinite(
        data.gameDay
      )
    ) {
      gameDay =
        data.gameDay;
    }

    if (
      Number.isFinite(
        data.gameMonth
      )
    ) {
      gameMonth =
        data.gameMonth;
    }

    if (
      Number.isFinite(
        data.gameYear
      )
    ) {
      gameYear =
        data.gameYear;
    }

    if (
      Number.isFinite(
        data.warSupport
      )
    ) {
      warSupport =
        data.warSupport;
    }

    if (
      Number.isFinite(
        data.nationalStability
      )
    ) {
      nationalStability =
        data.nationalStability;
    }

    if (
      Number.isFinite(
        data.supplyEfficiency
      )
    ) {
      supplyEfficiency =
        data.supplyEfficiency;
    }

    if (
      Number.isFinite(
        data.industrialEfficiency
      )
    ) {
      industrialEfficiency =
        data.industrialEfficiency;
    }

    if (
      Number.isFinite(
        data.territoryControl
      )
    ) {
      territoryControl =
        data.territoryControl;
    }

    if (
      data.researchProgress
    ) {
      researchProgress = {
        ...researchProgress,
        ...data.researchProgress
      };
    }

    if (
      data.productionProgress
    ) {
      productionProgress = {
        ...productionProgress,
        ...data.productionProgress
      };
    }

    if (
      data.casualties
    ) {
      casualties = {
        ...casualties,
        ...data.casualties
      };
    }

    if (
      Array.isArray(
        data.globalEvents
      )
    ) {
      globalEvents =
        data.globalEvents;
    }

    if (
      Array.isArray(
        data.battleLog
      )
    ) {
      battleLog =
        data.battleLog;
    }

    if (
      data.mapLayer
    ) {
      mapLayer =
        data.mapLayer;
    }

    if (
      Array.isArray(
        data.units
      )
    ) {
      data.units.forEach(
        saved => {
          const unit =
            units.find(
              current =>
                current.id ===
                  saved.id ||
                current.name ===
                  saved.name
            );

          if (!unit) {
            return;
          }

          const numericFields = [
            "hp",
            "organization",
            "morale",
            "strength",
            "experience"
          ];

          numericFields.forEach(
            field => {
              if (
                Number.isFinite(
                  saved[field]
                )
              ) {
                unit[field] =
                  saved[field];
              }
            }
          );

          if (
            saved.state
          ) {
            unit.state =
              saved.state;
          }

          if (
            Number.isFinite(
              saved.x
            ) &&
            Number.isFinite(
              saved.z
            )
          ) {
            unit.object.position.set(
              saved.x,
              Number.isFinite(
                saved.y
              )
                ? saved.y
                : unit.object
                    .position.y,
              saved.z
            );
          }

          unit.object.visible =
            unit.state !==
            "DESTROYED";
        }
      );
    }

    updateResources();
    updateDate();
    refreshMiniMap();
    setMapLayer(
      mapLayer
    );

  } catch (error) {
    console.warn(
      "Load failed:",
      error
    );
  }
}

/* =========================================================
   GAME LOOP
========================================================= */

function startGameLoop() {
  let lastDateTick =
    performance.now();

  function animate() {
    requestAnimationFrame(
      animate
    );

    const delta =
      Math.min(
        clock.getDelta(),
        0.1
      );

    updateGame(delta);

    if (
      performance.now() -
        lastDateTick >
      4000 / gameSpeed
    ) {
      advanceDate();

      lastDateTick =
        performance.now();
    }

    controls.update();

    renderer.render(
      scene,
      camera
    );
  }

  animate();
}

/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {
  const toast =
    $("toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2200
    );
}

/* =========================================================
   LOADING
========================================================= */

function hideLoading() {
  $("loadingScreen")
    ?.classList.add(
      "hidden"
    );
}

/* =========================================================
   RESIZE
========================================================= */

function onResize() {
  if (
    !camera ||
    !renderer
  ) {
    return;
  }

  camera.aspect =
    innerWidth /
    innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );
}

/* =========================================================
   ERROR RECOVERY
========================================================= */

addEventListener(
  "error",
  event =>
    console.error(
      "Runtime error:",
      event.error
    )
);

addEventListener(
  "unhandledrejection",
  event =>
    console.error(
      "Promise error:",
      event.reason
    )
);

setTimeout(
  () => {
    const loading =
      $("loadingScreen");

    if (
      loading &&
      !loading.classList.contains(
        "hidden"
      )
    ) {
      hideLoading();

      showToast(
        "Battlefield loaded in recovery mode."
      );
    }
  },
  10000
);

/* =========================================================
   START
========================================================= */

init();