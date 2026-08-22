import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   UPGRADED MAIN.JS
   Army Command + Realistic Battlefield
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

let battleLog = [];
let fogEnabled = true;

const saveKey = "world_war_strategy_save_v3";

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

let currentCountry = "USA";


/* =========================================================
   LOADING
========================================================= */

function updateLoading(percent, text) {
  if ($("loadingProgress")) {
    $("loadingProgress").style.width = `${Math.min(100, percent)}%`;
  }

  if ($("loadingStatus")) {
    $("loadingStatus").textContent = text;
  }
}


/* =========================================================
   INIT
========================================================= */

async function init() {
  try {
    updateLoading(10, "Initializing command system...");

    createScene();

    updateLoading(28, "Generating realistic terrain...");
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

  } catch (error) {
    console.error(error);

    hideLoading();

    showToast(
      "Recovery mode: battlefield initialized with limited systems."
    );
  }
}


/* =========================================================
   THREE.JS SCENE
========================================================= */

function createScene() {

  const canvas = $("gameCanvas");

  if (!canvas) {
    throw new Error("gameCanvas not found");
  }

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x081016);

  scene.fog = new THREE.Fog(
    0x081016,
    75,
    430
  );


  camera = new THREE.PerspectiveCamera(
    55,
    innerWidth / innerHeight,
    0.1,
    1000
  );

  camera.position.set(
    0,
    82,
    86
  );


  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, 1.8)
  );

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  const hemi =
    new THREE.HemisphereLight(
      0xb9c6c8,
      0x182018,
      1.45
    );

  scene.add(hemi);


  const sun =
    new THREE.DirectionalLight(
      0xffe3b0,
      2.15
    );

  sun.position.set(
    -80,
    140,
    70
  );

  sun.castShadow = true;

  sun.shadow.mapSize.set(
    2048,
    2048
  );

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


  controls =
    new OrbitControls(
      camera,
      renderer.domElement
    );

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  controls.minDistance = 22;
  controls.maxDistance = 245;

  controls.maxPolarAngle =
    Math.PI * 0.47;

  controls.minPolarAngle = 0.16;

  controls.target.set(
    0,
    0,
    0
  );

  clock = new THREE.Clock();


  addEventListener(
    "resize",
    onResize
  );

  renderer.domElement.addEventListener(
    "pointerdown",
    handleWorldClick
  );
}


/* =========================================================
   REALISTIC TERRAIN
========================================================= */

function createTerrain() {

  const size = 360;
  const segments = 120;

  const geometry =
    new THREE.PlaneGeometry(
      size,
      size,
      segments,
      segments
    );

  const position =
    geometry.attributes.position;


  for (
    let i = 0;
    i < position.count;
    i++
  ) {

    const x = position.getX(i);
    const y = position.getY(i);

    const height =
      Math.sin(x * 0.055) * 1.8 +
      Math.cos(y * 0.045) * 1.5 +
      Math.sin((x + y) * 0.022) * 3.2 +
      Math.sin(x * 0.14 + y * 0.08) * 0.65;

    position.setZ(
      i,
      height
    );
  }


  geometry.computeVertexNormals();


  const texture =
    createTerrainTexture();

  texture.wrapS =
    THREE.RepeatWrapping;

  texture.wrapT =
    THREE.RepeatWrapping;

  texture.repeat.set(
    9,
    9
  );

  texture.colorSpace =
    THREE.SRGBColorSpace;


  ground =
    new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.97,
        metalness: 0.015
      })
    );


  ground.rotation.x =
    -Math.PI / 2;

  ground.receiveShadow = true;

  ground.userData.isGround = true;

  worldGroup.add(
    ground
  );


  const grid =
    new THREE.GridHelper(
      360,
      90,
      0x69715f,
      0x30392f
    );

  grid.position.y = 0.18;

  grid.material.opacity = 0.09;

  grid.material.transparent = true;

  worldGroup.add(grid);


  const water =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        520,
        520
      ),
      new THREE.MeshStandardMaterial({
        color: 0x174354,
        transparent: true,
        opacity: 0.58,
        roughness: 0.18,
        metalness: 0.08
      })
    );

  water.rotation.x =
    -Math.PI / 2;

  water.position.y = -4.2;

  worldGroup.add(
    water
  );


  createRivers();
  createForests();
  createMountains();
  createRoads();
  createSettlements();
  createBattleMarkers();
}


/* =========================================================
   TERRAIN TEXTURE
========================================================= */

function createTerrainTexture() {

  const canvas =
    document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 512;

  const ctx =
    canvas.getContext("2d");

  const image =
    ctx.createImageData(
      512,
      512
    );


  for (
    let y = 0;
    y < 512;
    y++
  ) {

    for (
      let x = 0;
      x < 512;
      x++
    ) {

      const noise =
        (
          Math.sin(x * 0.12) +
          Math.sin(y * 0.16) +
          Math.sin((x + y) * 0.055)
        ) * 3;

      const r =
        47 + noise;

      const g =
        63 + noise * 0.8;

      const b =
        45 + noise * 0.45;


      const index =
        (y * 512 + x) * 4;

      image.data[index] =
        r;

      image.data[index + 1] =
        g;

      image.data[index + 2] =
        b;

      image.data[index + 3] =
        255;
    }
  }


  ctx.putImageData(
    image,
    0,
    0
  );


  ctx.globalAlpha = 0.18;

  ctx.strokeStyle =
    "#d4c89d";

  ctx.lineWidth = 1;


  for (
    let i = 0;
    i < 80;
    i++
  ) {

    const x =
      Math.random() * 512;

    const y =
      Math.random() * 512;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      Math.random() * 2 + 0.5,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }


  return new THREE.CanvasTexture(
    canvas
  );
}


/* =========================================================
   RIVERS
========================================================= */

function createRivers() {

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x245a70,
      roughness: 0.16,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9
    });


  for (
    let river = 0;
    river < 3;
    river++
  ) {

    const points = [];

    const base =
      -150 + river * 95;


    for (
      let i = 0;
      i <= 14;
      i++
    ) {

      const x =
        base + i * 22;

      const z =
        Math.sin(i * 0.8 + river) * 12 +
        river * 12;


      points.push(
        new THREE.Vector3(
          x,
          0.12,
          z
        )
      );
    }


    const curve =
      new THREE.CatmullRomCurve3(
        points
      );


    const riverMesh =
      new THREE.Mesh(
        new THREE.TubeGeometry(
          curve,
          80,
          1.15,
          8,
          false
        ),
        material.clone()
      );


    worldGroup.add(
      riverMesh
    );
  }
}


/* =========================================================
   FORESTS
========================================================= */

function createForests() {

  const foliageMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x263d28,
      roughness: 1
    });


  for (
    let i = 0;
    i < 110;
    i++
  ) {

    const tree =
      new THREE.Group();


    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.12,
          0.18,
          1.3,
          5
        ),
        new THREE.MeshStandardMaterial({
          color: 0x493a2a,
          roughness: 1
        })
      );


    trunk.position.y =
      0.65;


    const crown =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          0.75 + Math.random() * 0.35,
          2.2 + Math.random() * 1.5,
          7
        ),
        foliageMaterial.clone()
      );


    crown.position.y =
      2;


    tree.add(
      trunk,
      crown
    );


    tree.position.set(
      (Math.random() - 0.5) * 330,
      0.25,
      (Math.random() - 0.5) * 330
    );


    tree.scale.setScalar(
      0.7 + Math.random() * 0.8
    );

    tree.rotation.y =
      Math.random() * Math.PI;

    tree.castShadow = true;

    worldGroup.add(
      tree
    );
  }
}


/* =========================================================
   SETTLEMENTS
========================================================= */

function createSettlements() {

  for (
    let i = 0;
    i < 22;
    i++
  ) {

    const settlement =
      new THREE.Group();


    for (
      let b = 0;
      b < 3;
      b++
    ) {

      const house =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.4,
            1 + Math.random(),
            1.2
          ),
          new THREE.MeshStandardMaterial({
            color: 0x77715f,
            roughness: 0.9
          })
        );


      house.position.set(
        (b - 1) * 1.6,
        0.5,
        (Math.random() - 0.5) * 2
      );


      house.castShadow = true;

      settlement.add(
        house
      );
    }


    settlement.position.set(
      (Math.random() - 0.5) * 300,
      0.25,
      (Math.random() - 0.5) * 300
    );


    worldGroup.add(
      settlement
    );
  }
}


/* =========================================================
   MOUNTAINS
========================================================= */

function createMountains() {

  for (
    let i = 0;
    i < 34;
    i++
  ) {

    const height =
      10 + Math.random() * 22;

    const width =
      4 + Math.random() * 9;


    const mountain =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          width,
          height,
          8
        ),
        new THREE.MeshStandardMaterial({
          color: 0x394039,
          roughness: 1
        })
      );


    mountain.position.set(
      (Math.random() - 0.5) * 320,
      height / 2,
      (Math.random() - 0.5) * 320
    );


    mountain.rotation.y =
      Math.random() * Math.PI;

    mountain.castShadow = true;

    worldGroup.add(
      mountain
    );


    if (height > 20) {

      const snow =
        new THREE.Mesh(
          new THREE.ConeGeometry(
            width * 0.48,
            height * 0.3,
            8
          ),
          new THREE.MeshStandardMaterial({
            color: 0xb9b8aa,
            roughness: 0.95
          })
        );


      snow.position.set(
        mountain.position.x,
        height * 0.82,
        mountain.position.z
      );


      snow.castShadow = true;

      worldGroup.add(
        snow
      );
    }
  }
}


/* =========================================================
   ROADS
========================================================= */

function createRoads() {

  const roadMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x33332f,
      roughness: 0.96
    });


  for (
    let i = 0;
    i < 16;
    i++
  ) {

    const road =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          115,
          0.09,
          1.7
        ),
        roadMaterial.clone()
      );


    road.position.set(
      (Math.random() - 0.5) * 190,
      0.3,
      (Math.random() - 0.5) * 190
    );


    road.rotation.y =
      Math.random() * Math.PI;


    worldGroup.add(
      road
    );


    const centerLine =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          115,
          0.012,
          0.08
        ),
        new THREE.MeshBasicMaterial({
          color: 0xc6b98a,
          transparent: true,
          opacity: 0.35
        })
      );


    centerLine.position.copy(
      road.position
    );

    centerLine.position.y =
      0.36;

    centerLine.rotation.y =
      road.rotation.y;


    worldGroup.add(
      centerLine
    );
  }
}


/* =========================================================
   BATTLE MARKERS
========================================================= */

function createBattleMarkers() {

  for (
    let i = 0;
    i < 18;
    i++
  ) {

    const ring =
      new THREE.Mesh(
        new THREE.RingGeometry(
          0.7,
          1,
          16
        ),
        new THREE.MeshBasicMaterial({
          color: 0x8b3d32,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
      );


    ring.rotation.x =
      -Math.PI / 2;


    ring.position.set(
      (Math.random() - 0.5) * 280,
      0.4,
      (Math.random() - 0.5) * 280
    );


    worldGroup.add(
      ring
    );
  }
}


/* =========================================================
   MILITARY UNITS
========================================================= */

function createUnits() {

  units = [];


  const data = [

    [
      "1st Armored Division",
      "TANK",
      -30,
      12,
      true
    ],

    [
      "2nd Infantry Division",
      "INFANTRY",
      -18,
      20,
      true
    ],

    [
      "3rd Infantry Division",
      "INFANTRY",
      -5,
      28,
      true
    ],

    [
      "Air Wing Alpha",
      "AIR",
      15,
      12,
      true
    ],

    [
      "Enemy Armor Group",
      "TANK",
      45,
      -20,
      false
    ],

    [
      "Enemy Infantry Corps",
      "INFANTRY",
      35,
      -5,
      false
    ],

    [
      "Enemy Defense Force",
      "INFANTRY",
      55,
      12,
      false
    ],

    [
      "Enemy Air Wing",
      "AIR",
      65,
      -18,
      false
    ]
  ];


  data.forEach(
    unit =>
      createMilitaryUnit(
        unit[0],
        unit[1],
        unit[2],
        unit[3],
        unit[4]
      )
  );


  refreshMiniMap();
}


/* =========================================================
   CREATE MILITARY UNIT
========================================================= */

function createMilitaryUnit(
  name,
  type,
  x,
  z,
  friendly
) {

  const group =
    new THREE.Group();


  const material =
    new THREE.MeshStandardMaterial({

      color:
        friendly
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

      metalness:
        type === "TANK"
          ? 0.2
          : 0.08
    });


  if (type === "TANK") {

    const body =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          5,
          1.8,
          3.2
        ),
        material
      );

    body.position.y =
      1.2;

    body.castShadow = true;

    group.add(
      body
    );


    const turret =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          1.25,
          1.35,
          0.8,
          12
        ),
        material
      );

    turret.position.y =
      2.25;

    turret.castShadow = true;

    group.add(
      turret
    );


    const cannon =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.35,
          0.35,
          3.8
        ),
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


    group.add(
      cannon
    );

  }

  else if (type === "INFANTRY") {

    const body =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.65,
          1.4,
          5,
          8
        ),
        material
      );


    body.position.y =
      1.5;

    body.castShadow = true;

    group.add(
      body
    );


    const head =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.48,
          12,
          12
        ),
        new THREE.MeshStandardMaterial({
          color: 0x8c6c50
        })
      );


    head.position.y =
      2.8;

    head.castShadow = true;

    group.add(
      head
    );


    const rifle =
      new THREE.Mesh(
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

    rifle.rotation.x =
      -0.2;

    group.add(
      rifle
    );

  }

  else {

    const fuselage =
      new THREE.Mesh(
        new THREE.CapsuleGeometry(
          0.7,
          4,
          5,
          10
        ),
        material
      );


    fuselage.rotation.x =
      Math.PI / 2;

    fuselage.castShadow = true;

    group.add(
      fuselage
    );


    const wing =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          5,
          0.2,
          1.3
        ),
        material
      );


    group.add(
      wing
    );


    group.position.y =
      8;
  }


  group.position.set(
    x,
    type === "AIR" ? 8 : 0.5,
    z
  );


  const unit = {

    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random()
            .toString(36)
            .slice(2),

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

    experience: 0,

    maxOrganization: 100,

    maxMorale: 100,

    manpowerCost:
      type === "TANK"
        ? 2400
        : type === "AIR"
          ? 1800
          : 18000,

    equipment:
      type === "TANK"
        ? 85
        : type === "AIR"
          ? 90
          : 100,

    fuelPerHour:
      type === "TANK"
        ? 18
        : type === "AIR"
          ? 34
          : 7,

    supply: 92,

    entrenchment: 0,

    readiness: 100,

    orders: [],

    template:
      type === "TANK"
        ? "Armored Breakthrough"
        : type === "AIR"
          ? "Air Superiority"
          : "Line Infantry",

    doctrine:
      type === "TANK"
        ? "Mobile Warfare"
        : "Combined Arms",

    experienceLevel: 1,

    losses: 0
  };


  group.userData.unit =
    unit;


  group.add(
    createUnitLabel(
      name,
      friendly
    )
  );


  unitGroup.add(
    group
  );

  units.push(
    unit
  );
}


/* =========================================================
   UNIT LABEL
========================================================= */

function createUnitLabel(
  text,
  friendly
) {

  const canvas =
    document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 80;

  const ctx =
    canvas.getContext("2d");


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

  ctx.textAlign =
    "center";


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
          new THREE.CanvasTexture(
            canvas
          ),
        transparent: true
      })
    );


  sprite.scale.set(
    8,
    1.25,
    1
  );


  sprite.position.y =
    5;


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


/* =========================================================
   PANEL BUTTONS
========================================================= */

function setupPanelButtons() {

  document
    .querySelectorAll(".panel-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".panel-button")
            .forEach(
              b =>
                b.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          openPanel(
            button.dataset.panel
          );
        }
      );
    });
}


/* =========================================================
   BASIC STAT
========================================================= */

function stat(
  label,
  value
) {

  return `
    <div class="stat-row">
      <span>${label}</span>
      <b>${value}</b>
    </div>
  `;
}


/* =========================================================
   OPEN PANELS
========================================================= */

function openPanel(type) {

  const panel =
    $("mainPanel");

  const title =
    $("panelTitle");

  const kicker =
    $("panelKicker");

  const content =
    $("panelContent");


  if (
    !panel ||
    !title ||
    !kicker ||
    !content
  ) {
    return;
  }


  panel.classList.add(
    "open"
  );


  const friendly =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );


  const data = {

    overview: [
      "World Overview",
      "STRATEGIC COMMAND",

      `
        <div class="info-card">

          <h3>
            Global Situation
          </h3>

          <p>
            Command your army,
            manage resources and
            defeat enemy forces.
          </p>

          ${stat(
            "Active Fronts",
            countBattles()
          )}

          ${stat(
            "Army Units",
            friendly.length
          )}

          ${stat(
            "Threat Level",
            enemyThreat()
          )}

        </div>


        <div class="info-card">

          <h3>
            Military Readiness
          </h3>

          ${stat(
            "Army Strength",
            Math.round(
              avg("strength")
            ) + "%"
          )}

          ${stat(
            "Morale",
            Math.round(
              avg("morale")
            ) + "%"
          )}

          ${stat(
            "Organization",
            Math.round(
              avg("organization")
            ) + "%"
          )}

        </div>
      `
    ],


    army: [
      "Army Command",
      "MILITARY COMMAND",
      armyCommandHTML(
        friendly
      )
    ],


    economy: [
      "National Economy",
      "ECONOMIC COMMAND",

      `
        <div class="info-card">

          <h3>
            National Production
          </h3>

          ${stat(
            "Treasury",
            money.toLocaleString()
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
            Math.floor(
              manpower
            ).toLocaleString()
          )}

        </div>

        <button
          class="action-btn"
          id="economyBoost"
        >
          INVEST IN INDUSTRY — $1000
        </button>
      `
    ],


    production: [
      "Military Production",
      "INDUSTRIAL COMMAND",

      `
        <div class="info-card">

          <h3>
            Production Queue
          </h3>

          ${stat(
            "Tank production",
            "67%"
          )}

          ${stat(
            "Aircraft",
            "31%"
          )}

          ${stat(
            "Infantry equipment",
            "42%"
          )}

        </div>

        <button
          class="action-btn"
          id="produceTank"
        >
          PRODUCE TANK — $800 / 80 STEEL
        </button>

        <button
          class="action-btn"
          id="reinforce"
        >
          REINFORCE ARMY — 500 MANPOWER
        </button>
      `
    ],


    research: [
      "Technology",
      "RESEARCH COMMAND",

      `
        <div class="info-card">

          <h3>
            Research
          </h3>

          ${stat(
            "Armored Warfare",
            "64%"
          )}

          ${stat(
            "Logistics",
            "42%"
          )}

          ${stat(
            "Air Doctrine",
            "28%"
          )}

        </div>

        <button
          class="action-btn"
          id="researchBtn"
        >
          ADVANCE RESEARCH — $1200
        </button>
      `
    ],


    diplomacy: [
      "Diplomacy",
      "FOREIGN AFFAIRS",

      `
        <div class="info-card">

          <h3>
            International Relations
          </h3>

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

        </div>
      `
    ],


    intel: [
      "Intelligence",
      "INTELLIGENCE COMMAND",

      `
        <div class="info-card">

          <h3>
            Enemy Intelligence
          </h3>

          ${stat(
            "Enemy Army",
            enemyThreat()
          )}

          ${stat(
            "Enemy Armor",
            enemyArmor()
          )}

          ${stat(
            "Threat Level",
            enemyThreat()
          )}

        </div>

        <button
          class="action-btn"
          id="intelBtn"
        >
          RUN RECON — $250
        </button>
      `
    ],


    settings: [
      "Game Settings",
      "SYSTEM CONTROL",

      `
        <div class="info-card">

          <h3>
            Graphics
          </h3>

          <button
            class="action-btn"
            id="toggleFog"
          >
            TOGGLE BATTLEFIELD FOG
          </button>

          <button
            class="action-btn"
            id="resetBtn"
          >
            RESET CAMERA
          </button>

          <button
            class="action-btn"
            id="saveBtn"
          >
            SAVE CAMPAIGN
          </button>

          <button
            class="action-btn"
            id="loadBtn"
          >
            LOAD CAMPAIGN
          </button>

        </div>
      `
    ]

  };


  const selected =
    data[type] ||
    data.overview;


  title.textContent =
    selected[0];

  kicker.textContent =
    selected[1];

  content.innerHTML =
    selected[2];


  bindUnitButtons();


  if (type === "army") {

    bindArmyPanel();

    if ($("armyNewOrder")) {

      $("armyNewOrder").onclick =
        () =>
          showToast(
            "Select a unit, then use MOVE or ATTACK to issue an order."
          );
    }


    if ($("armyMerge")) {

      $("armyMerge").onclick =
        () =>
          showToast(
            "Select two compatible units to merge."
          );
    }


    if ($("armySplit")) {

      $("armySplit").onclick =
        () =>
          showToast(
            "Select a unit to split its formation."
          );
    }


    if ($("armyDisband")) {

      $("armyDisband").onclick =
        () =>
          showToast(
            "Select a unit before disbanding."
          );
    }
  }


  if ($("economyBoost")) {

    $("economyBoost").onclick =
      () => {

        if (money >= 1000) {

          money -= 1000;

          steel += 150;

          saveGame();

          updateResources();

          showToast(
            "Industrial investment completed."
          );

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
      () => {

        if (money >= 1200) {

          money -= 1200;

          units
            .filter(
              u => u.friendly
            )
            .forEach(
              u =>
                u.strength =
                  Math.min(
                    100,
                    u.strength + 3
                  )
            );

          updateResources();

          showToast(
            "Research breakthrough completed."
          );

        } else {

          showToast(
            "Insufficient funds."
          );
        }
      };
  }


  if ($("intelBtn")) {

    $("intelBtn").onclick =
      () => {

        if (money >= 250) {

          money -= 250;

          updateResources();

          showToast(
            "Recon report updated: enemy positions revealed."
          );

        } else {

          showToast(
            "Insufficient funds."
          );
        }
      };
  }


  if ($("supplyArmy")) {

    $("supplyArmy").onclick =
      () => {

        if (oil < 120) {

          return showToast(
            "Insufficient fuel reserve."
          );
        }


        oil -= 120;


        units
          .filter(
            u =>
              u.friendly &&
              u.state !== "DESTROYED"
          )
          .forEach(
            u => {

              u.supply =
                Math.min(
                  100,
                  u.supply + 15
                );

              u.readiness =
                Math.min(
                  100,
                  u.readiness + 8
                );
            }
          );


        updateResources();

        showToast(
          "Army supply priority activated."
        );
      };
  }


  if ($("upgradeDoctrine")) {

    $("upgradeDoctrine").onclick =
      () => {

        if (money < 900) {

          return showToast(
            "Need $900 for doctrine research."
          );
        }


        money -= 900;


        units
          .filter(
            u => u.friendly
          )
          .forEach(
            u =>
              u.strength =
                Math.min(
                  100,
                  u.strength + 2
                )
          );


        updateResources();

        showToast(
          "Doctrine upgraded."
        );
      };
  }


  if ($("createTemplate")) {

    $("createTemplate").onclick =
      () =>
        showToast(
          "Template editor ready for future expansion."
        );
  }


  if ($("toggleFog")) {

    $("toggleFog").onclick =
      () => {

        fogEnabled =
          !fogEnabled;


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

    $("saveBtn").onclick =
      saveGame;
  }


  if ($("loadBtn")) {

    $("loadBtn").onclick =
      () => {

        loadGame();

        showToast(
          "Campaign loaded."
        );
      };
  }
}


/* =========================================================
   ARMY COMMAND
========================================================= */

function armyCommandHTML(
  friendly
) {

  const averageStrength =
    Math.round(
      avg("strength")
    );

  const averageOrganization =
    Math.round(
      avg("organization")
    );

  const averageMorale =
    Math.round(
      avg("morale")
    );


  const ready =
    friendly.filter(
      u =>
        u.readiness >= 75 &&
        u.hp > 35
    ).length;


  const tanks =
    friendly.filter(
      u =>
        u.type === "TANK"
    ).length * 8;


  const infantry =
    friendly.filter(
      u =>
        u.type === "INFANTRY"
    ).length * 12;


  const air =
    friendly.filter(
      u =>
        u.type === "AIR"
    ).length * 6;


  const artillery =
    friendly.filter(
      u =>
        u.type === "ARTILLERY"
    ).length * 6;


  return `

    <div
      class="army-tabs"
      style="
        display:flex;
        gap:6px;
        flex-wrap:wrap;
        margin-bottom:12px
      "
    >

      <button
        class="action-btn army-tab active"
        data-tab="overview"
      >
        OVERVIEW
      </button>

      <button
        class="action-btn army-tab"
        data-tab="units"
      >
        UNITS
      </button>

      <button
        class="action-btn army-tab"
        data-tab="templates"
      >
        TEMPLATES
      </button>

      <button
        class="action-btn army-tab"
        data-tab="doctrine"
      >
        DOCTRINE
      </button>

      <button
        class="action-btn army-tab"
        data-tab="logistics"
      >
        LOGISTICS
      </button>

    </div>


    <div id="armyTabContent">

      <div class="info-card">

        <h3>
          Available Forces

          <span style="float:right">
            ${ready}/${friendly.length}
            READY
          </span>
        </h3>


        ${
          friendly
            .slice(0, 8)
            .map(
              u => `

                <button
                  class="action-btn unit-select"
                  data-unit="${u.id}"
                  style="
                    text-align:left;
                    margin:5px 0;
                    width:100%
                  "
                >

                  <b>
                    ${unitIcon(u.type)}
                    ${u.name}
                  </b>

                  <br>

                  <small>
                    ${u.type}
                    •
                    ${Math.round(u.hp)}% HP
                    •
                    ${Math.round(u.readiness)}% READY
                  </small>

                </button>

              `
            )
            .join("")
        }

      </div>


      <div class="info-card">

        <h3>
          Army Statistics
        </h3>

        ${barStat(
          "Army Strength",
          averageStrength
        )}

        ${barStat(
          "Organization",
          averageOrganization
        )}

        ${barStat(
          "Morale",
          averageMorale
        )}

        ${barStat(
          "Readiness",
          Math.round(
            avg("readiness")
          )
        )}

        ${stat(
          "Manpower",
          Math.floor(
            manpower
          ).toLocaleString()
        )}

      </div>


      <div class="info-card">

        <h3>
          Composition
        </h3>

        <div
          style="
            display:grid;
            grid-template-columns:
              repeat(4,1fr);
            gap:4px
          "
        >

          ${stat(
            "Tanks",
            tanks
          )}

          ${stat(
            "Infantry",
            infantry
          )}

          ${stat(
            "Artillery",
            artillery
          )}

          ${stat(
            "Aircraft",
            air
          )}

        </div>

      </div>


      <div class="info-card">

        <h3>

          Active Orders

          <span style="float:right">

            ${
              friendly.filter(
                u =>
                  u.destination ||
                  [
                    "ATTACKING",
                    "DEFENDING",
                    "HOLDING",
                    "ADVANCING"
                  ].includes(u.state)
              ).length
            }

            /

            ${Math.max(
              5,
              friendly.length
            )}

          </span>

        </h3>


        ${
          friendly
            .filter(
              u =>
                u.destination ||
                u.state !== "READY"
            )
            .slice(0, 5)
            .map(
              u => `

                <div
                  class="stat-row"
                >

                  <span>

                    ${unitIcon(
                      u.type
                    )}

                    ${u.name}

                    <small
                      style="
                        display:block;
                        opacity:.65
                      "
                    >

                      ${
                        u.destination
                          ? "Moving to objective"
                          : "Holding / combat posture"
                      }

                    </small>

                  </span>

                  <b>
                    ${u.state}
                  </b>

                </div>

              `
            )
            .join("")
        }

        ${
          friendly.filter(
            u =>
              u.destination ||
              u.state !== "READY"
          ).length === 0
            ? "<p>No active orders.</p>"
            : ""
        }

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(4,1fr);
          gap:6px
        "
      >

        <button
          class="action-btn"
          id="armyNewOrder"
        >
          NEW ORDER
        </button>

        <button
          class="action-btn"
          id="armyMerge"
        >
          MERGE
        </button>

        <button
          class="action-btn"
          id="armySplit"
        >
          SPLIT
        </button>

        <button
          class="action-btn"
          id="armyDisband"
        >
          DISBAND
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   ICONS
========================================================= */

function unitIcon(type) {

  if (type === "TANK") {
    return "🛡️";
  }

  if (type === "AIR") {
    return "✈️";
  }

  if (type === "ARTILLERY") {
    return "🎯";
  }

  return "🪖";
}


/* =========================================================
   BAR STAT
========================================================= */

function barStat(
  label,
  value
) {

  return `

    <div class="unit-stat">

      <span>
        ${label}
      </span>

      <div class="progress">

        <i
          style="
            width:
            ${Math.max(
              0,
              Math.min(
                100,
                value
              )
            )}%
          "
        ></i>

      </div>

      <b>
        ${value}%
      </b>

    </div>

  `;
}


/* =========================================================
   ARMY TABS
========================================================= */

function bindArmyPanel() {

  document
    .querySelectorAll(
      ".army-tab"
    )
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(
            ".army-tab"
          )
          .forEach(
            b =>
              b.classList.remove(
                "active"
              )
          );


        button.classList.add(
          "active"
        );


        const box =
          $("armyTabContent");


        if (!box) {
          return;
        }


        const tab =
          button.dataset.tab;


        if (tab === "units") {

          box.innerHTML =
            units
              .filter(
                u =>
                  u.friendly &&
                  u.state !==
                    "DESTROYED"
              )
              .map(
                u => `

                  <button
                    class="action-btn unit-select"
                    data-unit="${u.id}"
                    style="
                      width:100%;
                      text-align:left;
                      margin:4px 0
                    "
                  >

                    ${unitIcon(
                      u.type
                    )}

                    <b>
                      ${u.name}
                    </b>

                    —

                    ${u.type}

                    —

                    HP
                    ${Math.round(
                      u.hp
                    )}%

                    —

                    ORG
                    ${Math.round(
                      u.organization
                    )}%

                    —

                    XP
                    ${Math.round(
                      u.experience
                    )}

                  </button>

                `
              )
              .join("")
            ||
            "<p>No active units.</p>";
        }


        else if (
          tab === "templates"
        ) {

          box.innerHTML = `

            <div class="info-card">

              <h3>
                Division Templates
              </h3>

              ${
                [
                  "Armored Breakthrough",
                  "Mechanized Infantry",
                  "Line Infantry",
                  "Air Assault"
                ]
                  .map(
                    (name, index) => `

                      <div
                        class="stat-row"
                      >

                        <span>

                          ${name}

                          <small
                            style="
                              display:block;
                              opacity:.6
                            "
                          >

                            ${
                              index === 0
                                ? "High armor / breakthrough"
                                : index === 1
                                  ? "Fast combined arms"
                                  : "Balanced frontline formation"
                            }

                          </small>

                        </span>

                        <b>
                          EDIT
                        </b>

                      </div>

                    `
                  )
                  .join("")
              }


              <button
                class="action-btn"
                id="createTemplate"
              >
                CREATE TEMPLATE
              </button>

            </div>

          `;
        }


        else if (
          tab === "doctrine"
        ) {

          box.innerHTML = `

            <div class="info-card">

              <h3>
                Army Doctrine
              </h3>

              ${stat(
                "Current Doctrine",
                "Combined Arms"
              )}

              ${stat(
                "Armored Warfare",
                "LEVEL II"
              )}

              ${stat(
                "Air Support",
                "LEVEL I"
              )}

              ${stat(
                "Entrenchment",
                "LEVEL II"
              )}

              <button
                class="action-btn"
                id="upgradeDoctrine"
              >
                RESEARCH DOCTRINE — $900
              </button>

            </div>

          `;
        }


        else if (
          tab === "logistics"
        ) {

          box.innerHTML = `

            <div class="info-card">

              <h3>
                Army Logistics
              </h3>

              ${barStat(
                "Supply Coverage",
                Math.round(
                  avg("supply")
                )
              )}

              ${stat(
                "Fuel Demand",
                Math.round(
                  units
                    .filter(
                      u => u.friendly
                    )
                    .reduce(
                      (sum, u) =>
                        sum +
                        u.fuelPerHour,
                      0
                    )
                ) + " / h"
              )}

              ${stat(
                "Equipment",
                Math.round(
                  units
                    .filter(
                      u => u.friendly
                    )
                    .reduce(
                      (sum, u) =>
                        sum +
                        u.equipment,
                      0
                    ) /
                    Math.max(
                      1,
                      units.filter(
                        u => u.friendly
                      ).length
                    )
                ) + "%"
              )}

              ${stat(
                "Fuel Reserve",
                Math.floor(oil)
              )}

              <button
                class="action-btn"
                id="supplyArmy"
              >
                PRIORITIZE SUPPLY — 120 OIL
              </button>

            </div>

          `;
        }


        else {

          box.innerHTML =
            armyCommandHTML(
              units.filter(
                u =>
                  u.friendly &&
                  u.state !==
                    "DESTROYED"
              )
            )
            .replace(
              /^.*?<div id="armyTabContent">/s,
              ""
            )
            .replace(
              /<\/div>\s*$/s,
              ""
            );
        }


        bindArmyPanel();

        bindUnitButtons();
      };
    });
}


/* =========================================================
   UNIT SELECTION
========================================================= */

function bindUnitButtons() {

  document
    .querySelectorAll(
      ".unit-select"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            const unit =
              units.find(
                u =>
                  u.id ===
                  button.dataset.unit
              );


            if (unit) {
              selectUnit(unit);
            }
          };
      }
    );
}


/* =========================================================
   AVERAGES
========================================================= */

function avg(key) {

  const active =
    units.filter(
      u =>
        u.friendly &&
        u.state !== "DESTROYED"
    );


  if (!active.length) {
    return 0;
  }


  return (
    active.reduce(
      (sum, unit) =>
        sum + unit[key],
      0
    ) /
    active.length
  );
}


/* =========================================================
   ENEMY STATUS
========================================================= */

function enemyThreat() {

  const enemies =
    units.filter(
      u =>
        !u.friendly &&
        u.state !== "DESTROYED"
    );


  if (enemies.length >= 4) {
    return "HIGH";
  }

  if (enemies.length >= 2) {
    return "MEDIUM";
  }

  return "LOW";
}


function enemyArmor() {

  const tanks =
    units.filter(
      u =>
        !u.friendly &&
        u.type === "TANK" &&
        u.state !== "DESTROYED"
    );


  return tanks.length
    ? "HIGH"
    : "LOW";
}


function countBattles() {

  return units.filter(
    u =>
      u.state === "ATTACKING" ||
      u.state === "UNDER ATTACK"
  ).length;
}


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(unit) {

  selectedUnit =
    unit;


  if ($("unitPanel")) {

    $("unitPanel")
      .classList
      .add("open");
  }


  if ($("selectedUnitType")) {

    $("selectedUnitType")
      .textContent =
      `${unit.type} • ${unit.state}`;
  }


  if ($("selectedUnitName")) {

    $("selectedUnitName")
      .textContent =
      unit.name;
  }


  updateUnitStats();

  showToast(
    `${unit.name} selected`
  );
}


/* =========================================================
   UNIT STATS
========================================================= */

function updateUnitStats() {

  if (
    !selectedUnit ||
    !$("unitStats")
  ) {
    return;
  }


  const unit =
    selectedUnit;


  $("unitStats").innerHTML = `

    <div class="unit-stat">

      <span>
        Strength
      </span>

      <div class="progress">
        <i
          style="
            width:${unit.strength}%
          "
        ></i>
      </div>

      <b>
        ${Math.round(
          unit.strength
        )}
      </b>

    </div>


    <div class="unit-stat">

      <span>
        Organization
      </span>

      <div class="progress">
        <i
          style="
            width:${unit.organization}%
          "
        ></i>
      </div>

      <b>
        ${Math.round(
          unit.organization
        )}
      </b>

    </div>


    <div class="unit-stat">

      <span>
        Morale
      </span>

      <div class="progress">
        <i
          style="
            width:${unit.morale}%
          "
        ></i>
      </div>

      <b>
        ${Math.round(
          unit.morale
        )}
      </b>

    </div>


    <div class="unit-stat">

      <span>
        Health
      </span>

      <div class="progress">
        <i
          style="
            width:${unit.hp}%
          "
        ></i>
      </div>

      <b>
        ${Math.round(
          unit.hp
        )}
      </b>

    </div>


    ${stat(
      "Speed",
      unit.speed + " km/h"
    )}

    ${stat(
      "Experience",
      Math.round(
        unit.experience
      )
    )}

    ${stat(
      "Status",
      unit.state
    )}

  `;
}


/* =========================================================
   UNIT COMMANDS
========================================================= */

function setupUnitCommands() {

  const on =
    (id, fn) => {

      if ($(id)) {
        $(id).onclick =
          fn;
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
          selectedUnit.organization +
            8
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
        selectedUnit.type !==
        "AIR"
      ) {

        return showToast(
          "Only aircraft can perform airstrikes."
        );
      }


      if (
        selectedUnit.cooldown > 0
      ) {

        return showToast(
          `Airstrike ready in ${Math.ceil(
            selectedUnit.cooldown
          )}s.`
        );
      }


      performAirstrike();
    }
  );
}


/* =========================================================
   WORLD CLICK
========================================================= */

function handleWorldClick(event) {

  const rect =
    renderer.domElement
      .getBoundingClientRect();


  mouse.x =
    (
      (event.clientX - rect.left) /
      rect.width
    ) * 2 - 1;


  mouse.y =
    -(
      (event.clientY - rect.top) /
      rect.height
    ) * 2 + 1;


  raycaster.setFromCamera(
    mouse,
    camera
  );


  const objects = [];


  units.forEach(
    unit =>
      unit.object.traverse(
        object => {

          if (
            object.isMesh ||
            object.isSprite
          ) {
            objects.push(
              object
            );
          }
        }
      )
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

      object =
        object.parent;
    }


    if (
      object?.userData.unit
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


      selectUnit(
        unit
      );

      return;
    }
  }


  if (
    moveMode &&
    selectedUnit
  ) {

    const groundHits =
      raycaster.intersectObject(
        ground
      );


    if (
      groundHits.length
    ) {

      const point =
        groundHits[0].point;


      setDestination(
        selectedUnit,
        point
      );


      moveMode = false;
    }
  }
}


/* =========================================================
   MOVE UNIT
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


/* =========================================================
   DESTINATION MARKER
========================================================= */

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


  effectsGroup.add(
    ring
  );


  const start =
    performance.now();


  const animate =
    now => {

      const progress =
        Math.min(
          (now - start) /
            1200,
          1
        );


      ring.scale.setScalar(
        1 + progress * 2
      );


      ring.material.opacity =
        0.8 *
        (1 - progress);


      if (
        progress < 1
      ) {

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
   ATTACK UNIT
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
    attacker.object.position
      .distanceTo(
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
      `Weapon reload: ${attacker.cooldown.toFixed(
        1
      )}s`
    );
  }


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
    target.state === "DEFENDING"
      ? 0.8
      : 1;


  const damage =
    Math.max(
      2,
      attacker.attack *
        (
          0.65 +
          Math.random() * 0.7
        ) *
        (attacker.organization / 100) *
        (attacker.morale / 100) *
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
    `${attacker.name} hit ${target.name} for ${Math.round(
      damage
    )} damage.`
  );


  if ($("battleStatus")) {

    $("battleStatus").textContent =
      `BATTLE: ${attacker.name} vs ${target.name}`;
  }


  showToast(
    `${attacker.name} attacked ${target.name}`
  );


  if (
    target.hp <= 0
  ) {

    destroyUnit(
      target
    );
  }


  updateUnitStats();
}


/* =========================================================
   AIRSTRIKE
========================================================= */

function performAirstrike() {

  const enemies =
    units.filter(
      unit =>
        !unit.friendly &&
        unit.state !==
          "DESTROYED"
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


  selectedUnit.cooldown =
    8;


  const position =
    target.object.position.clone();


  position.y = 1;


  createExplosion(
    position
  );


  createExplosion(
    position.clone().add(
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


  if (
    target.hp <= 0
  ) {

    destroyUnit(
      target
    );
  }
}


/* =========================================================
   EXPLOSION
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


  createSmoke(
    position
  );
}


/* =========================================================
   SMOKE
========================================================= */

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

function destroyUnit(
  unit
) {

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

    selectedUnit =
      null;


    if ($("unitPanel")) {

      $("unitPanel")
        .classList
        .remove("open");
    }
  }


  addBattleLog(
    `${unit.name} was destroyed.`
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

function updateGame(
  delta
) {

  if (!gameRunning) {
    return;
  }


  const scaledDelta =
    delta * gameSpeed;


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
          unit.cooldown -
            scaledDelta
        );


      if (
        unit.destination
      ) {

        const target =
          unit.destination;


        const distance =
          unit.object.position
            .distanceTo(
              target
            );


        if (
          distance < 1
        ) {

          unit.destination =
            null;


          if (
            unit.state === "MOVING" ||
            unit.state === "RETREATING"
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
            scaledDelta;


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
                0.004 *
                scaledDelta
            );


          if (
            unit.type === "TANK"
          ) {

            oil =
              Math.max(
                0,
                oil -
                  0.006 *
                  scaledDelta
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
              0.012 *
              scaledDelta
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
              0.006 *
              scaledDelta
          );
      }


      unit.supply =
        Math.max(
          0,
          Math.min(
            100,
            unit.supply -
              (
                unit.destination
                  ? 0.018
                  : 0.006
              ) *
              scaledDelta
          )
        );


      unit.readiness =
        Math.max(
          0,
          Math.min(
            100,
            unit.readiness +
              (
                unit.supply > 45
                  ? 0.012
                  : -0.035
              ) *
              scaledDelta
          )
        );


      if (
        unit.type === "AIR"
      ) {

        oil =
          Math.max(
            0,
            oil -
              0.01 *
              scaledDelta
          );
      }
    }
  );


  lastIncomeTick +=
    delta;


  if (
    lastIncomeTick >= 1
  ) {

    const income =
      lastIncomeTick *
      gameSpeed;


    money +=
      1.8 *
      income;


    steel +=
      0.55 *
      income;


    food +=
      0.4 *
      income;


    oil +=
      0.18 *
      income;


    lastIncomeTick = 0;


    updateResources();
  }


  lastAiTick +=
    delta;


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


  if (
    selectedUnit
  ) {

    updateUnitStats();
  }
}


/* =========================================================
   ENEMY AI
========================================================= */

function enemyAI() {

  const enemies =
    units.filter(
      unit =>
        !unit.friendly &&
        unit.state !==
          "DESTROYED"
    );


  const friendlies =
    units.filter(
      unit =>
        unit.friendly &&
        unit.state !==
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
              best.object.position
                .distanceTo(
                  enemy.object.position
                );


            const distance =
              unit.object.position
                .distanceTo(
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
        enemy.object.position
          .distanceTo(
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

      }

      else if (
        !enemy.destination ||
        Math.random() < 0.025
      ) {

        const point =
          target.object.position
            .clone();


        point.x +=
          (Math.random() - 0.5) *
          8;


        point.z +=
          (Math.random() - 0.5) *
          8;


        enemy.destination =
          new THREE.Vector3(
            point.x,
            enemy.object.position.y,
            point.z
          );


        enemy.state =
          "ADVANCING";
      }
    }
  );
}


/* =========================================================
   ENEMY ATTACK
========================================================= */

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
        (
          0.5 +
          Math.random() * 0.55
        ) *
        (attacker.organization / 100) *
        (attacker.morale / 100)
    );


  target.hp =
    Math.max(
      0,
      target.hp -
        damage
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


  createExplosion(
    target.object.position.clone()
  );


  addBattleLog(
    `${attacker.name} attacked ${target.name}.`
  );


  if (
    target.hp <= 0
  ) {

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
      unit =>
        !unit.friendly &&
        unit.state !==
          "DESTROYED"
    );


  const friends =
    units.filter(
      unit =>
        unit.friendly &&
        unit.state !==
          "DESTROYED"
    );


  if (
    !enemies.length
  ) {

    gameRunning =
      false;


    showToast(
      "VICTORY — Enemy forces eliminated."
    );


    if ($("statusText")) {

      $("statusText").textContent =
        "VICTORY";
    }

  }

  else if (
    !friends.length
  ) {

    gameRunning =
      false;


    showToast(
      "DEFEAT — All friendly forces destroyed."
    );


    if ($("statusText")) {

      $("statusText").textContent =
        "DEFEAT";
    }
  }
}


/* =========================================================
   PRODUCE TANK
========================================================= */

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
      unit =>
        unit.friendly &&
        unit.type === "TANK" &&
        unit.state !==
          "DESTROYED"
    );


  const x =
    base
      ? base.object.position.x - 7
      : -35;


  const z =
    base
      ? base.object.position.z + 5
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


  updateResources();

  refreshMiniMap();


  showToast(
    "New tank deployed."
  );
}


/* =========================================================
   REINFORCE
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
      unit =>
        unit.friendly &&
        unit.state !==
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
            unit.organization + 15
          );
      }
    );


  updateResources();


  showToast(
    "Reinforcements arrived."
  );
}


/* =========================================================
   SPEED
========================================================= */

function setupSpeed() {

  if (!$("speedBtn")) {
    return;
  }


  $("speedBtn").onclick =
    () => {

      const speeds =
        [
          1,
          2,
          4,
          8
        ];


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
    };
}


/* =========================================================
   PAUSE
========================================================= */

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
   COUNTRY SELECTION
========================================================= */

function setupCountrySelection() {

  document
    .querySelectorAll(
      ".country-card"
    )
    .forEach(
      card =>
        card.addEventListener(
          "click",
          () =>
            selectCountry(
              card.dataset.country
            )
        )
    );


  if (
    $("closeCountryModal")
  ) {

    $("closeCountryModal").onclick =
      () => {

        if ($("countryModal")) {

          $("countryModal")
            .classList
            .remove("open");
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


  currentCountry =
    id;


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

    $("countryModal")
      .classList
      .remove("open");
  }


  saveGame();


  showToast(
    `Now commanding ${country.name}`
  );
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
      "Enemy AI",
      "Enemy forces will advance, select targets and attack automatically."
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
      () =>
        $("mainPanel")
          ?.classList
          .remove("open");
  }


  if ($("closeUnit")) {

    $("closeUnit").onclick =
      () => {

        $("unitPanel")
          ?.classList
          .remove("open");


        selectedUnit =
          null;
      };
  }
}


/* =========================================================
   MINI MAP
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


      dot.style.cssText = `

        position:absolute;

        width:6px;

        height:6px;

        border-radius:50%;

        left:${Math.max(
          3,
          Math.min(
            97,
            50 +
              unit.object.position.x /
                3
          )
        )}%;

        top:${Math.max(
          3,
          Math.min(
            97,
            50 +
              unit.object.position.z /
                3
          )
        )}%;

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


  updateDate();

  saveGame();
}


function updateDate() {

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


  if ($("gameDate")) {

    $("gameDate").textContent =
      `${gameYear} • ${
        months[gameMonth - 1]
      } • ${String(
        gameDay
      ).padStart(2, "0")}`;
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
    `[${gameYear}-${
      String(gameMonth)
        .padStart(2, "0")
    }-${
      String(gameDay)
        .padStart(2, "0")
    }] ${text}`
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
   SAVE GAME
========================================================= */

function saveGame() {

  try {

    const data = {

      currentCountry,

      money,

      oil,

      steel,

      food,

      manpower,

      gameDay,

      gameMonth,

      gameYear,

      units:
        units.map(
          unit => ({

            id:
              unit.id,

            name:
              unit.name,

            type:
              unit.type,

            friendly:
              unit.friendly,

            hp:
              unit.hp,

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

            supply:
              unit.supply,

            readiness:
              unit.readiness,

            losses:
              unit.losses,

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
      "Save failed",
      error
    );
  }
}


/* =========================================================
   LOAD GAME
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
      JSON.parse(
        raw
      );


    if (
      data.currentCountry
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
      Array.isArray(
        data.units
      )
    ) {

      data.units.forEach(
        savedUnit => {

          const unit =
            units.find(
              existing =>
                existing.id ===
                  savedUnit.id ||
                existing.name ===
                  savedUnit.name
            );


          if (!unit) {
            return;
          }


          const fields = [
            "hp",
            "organization",
            "morale",
            "strength",
            "experience",
            "supply",
            "readiness",
            "losses"
          ];


          fields.forEach(
            field => {

              if (
                Number.isFinite(
                  savedUnit[field]
                )
              ) {

                unit[field] =
                  savedUnit[field];
              }
            }
          );


          if (
            savedUnit.state
          ) {

            unit.state =
              savedUnit.state;
          }


          if (
            Number.isFinite(
              savedUnit.x
            )
          ) {

            unit.object.position.set(
              savedUnit.x,
              Number.isFinite(
                savedUnit.y
              )
                ? savedUnit.y
                : unit.object.position.y,
              Number.isFinite(
                savedUnit.z
              )
                ? savedUnit.z
                : unit.object.position.z
            );
          }


          if (
            unit.state ===
            "DESTROYED"
          ) {

            unit.object.visible =
              false;
          }
        }
      );
    }


    updateResources();

    updateDate();

    refreshMiniMap();

  } catch (error) {

    console.warn(
      "Load failed",
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


    updateGame(
      delta
    );


    if (
      performance.now() -
        lastDateTick >
      4000 /
        gameSpeed
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
   LOADING HIDE
========================================================= */

function hideLoading() {

  $("loadingScreen")
    ?.classList
    .add("hidden");
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
   ERROR HANDLING
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


/* =========================================================
   RECOVERY
========================================================= */

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