import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   Main Game Controller
========================================================= */

const $ = (id) => document.getElementById(id);

let scene;
let camera;
let renderer;
let controls;
let clock;

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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let ground;
let worldGroup;
let unitGroup;
let effectsGroup;


/* =========================================================
   COUNTRY DATA
========================================================= */

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
   INIT
========================================================= */

async function init() {

    try {

        updateLoading(10, "Initializing command system...");

        await sleep(150);

        updateLoading(25, "Creating battlefield...");

        createScene();

        await sleep(150);

        updateLoading(45, "Deploying terrain...");

        createTerrain();

        await sleep(150);

        updateLoading(65, "Deploying military forces...");

        createUnits();

        await sleep(150);

        updateLoading(80, "Preparing tactical interface...");

        setupUI();

        await sleep(150);

        updateLoading(95, "Finalizing battlefield...");

        startGameLoop();

        updateLoading(100, "Battlefield ready.");

        setTimeout(hideLoading, 450);

    } catch (error) {

        console.error("GAME INIT ERROR:", error);

        /*
         * Important:
         * Even if something fails, do not leave
         * the player permanently stuck on loading.
         */

        updateLoading(100, "Recovery mode activated.");

        setTimeout(() => {

            hideLoading();

            showToast(
                "Some battlefield systems failed to initialize."
            );

        }, 700);
    }
}


/* =========================================================
   THREE.JS SCENE
========================================================= */

function createScene() {

    const canvas = $("gameCanvas");

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x081016);

    scene.fog = new THREE.Fog(
        0x081016,
        80,
        450
    );


    /* CAMERA */

    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(
        0,
        85,
        85
    );


    /* RENDERER */

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    /* LIGHTING */

    const ambient = new THREE.HemisphereLight(
        0xb9c6c8,
        0x182018,
        1.6
    );

    scene.add(ambient);


    const sun = new THREE.DirectionalLight(
        0xffe3b0,
        2.2
    );

    sun.position.set(
        -80,
        140,
        70
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;

    scene.add(sun);


    /* GROUPS */

    worldGroup = new THREE.Group();
    unitGroup = new THREE.Group();
    effectsGroup = new THREE.Group();

    scene.add(worldGroup);
    scene.add(unitGroup);
    scene.add(effectsGroup);


    /* CONTROLS */

    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;

    controls.dampingFactor = 0.08;

    controls.minDistance = 25;
    controls.maxDistance = 240;

    controls.maxPolarAngle =
        Math.PI * 0.47;

    controls.minPolarAngle =
        0.18;

    controls.target.set(
        0,
        0,
        0
    );


    clock = new THREE.Clock();


    /* RESIZE */

    window.addEventListener(
        "resize",
        onResize
    );


    /* POINTER */

    renderer.domElement.addEventListener(
        "pointerdown",
        handleWorldClick
    );


    /* TOUCH */

    renderer.domElement.addEventListener(
        "touchstart",
        () => {},
        { passive: true }
    );
}


/* =========================================================
   TERRAIN
========================================================= */

function createTerrain() {

    const groundGeometry =
        new THREE.PlaneGeometry(
            360,
            360,
            90,
            90
        );

    const vertices =
        groundGeometry.attributes.position;

    for (
        let i = 0;
        i < vertices.count;
        i++
    ) {

        const x =
            vertices.getX(i);

        const y =
            vertices.getY(i);

        const height =
            Math.sin(x * 0.06) * 1.7 +
            Math.cos(y * 0.05) * 1.5 +
            Math.sin((x + y) * 0.025) * 3;

        vertices.setZ(
            i,
            height
        );
    }

    groundGeometry.computeVertexNormals();


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x39483b,
            roughness: 0.96,
            metalness: 0.02
        });


    ground =
        new THREE.Mesh(
            groundGeometry,
            material
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    ground.userData.isGround = true;

    worldGroup.add(ground);


    /* GRID */

    const grid =
        new THREE.GridHelper(
            360,
            90,
            0x5c674e,
            0x263229
        );

    grid.position.y = 0.2;

    grid.material.opacity = 0.22;
    grid.material.transparent = true;

    worldGroup.add(grid);


    /* WATER */

    const waterGeometry =
        new THREE.PlaneGeometry(
            500,
            500
        );

    const waterMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x102c39,
            transparent: true,
            opacity: 0.45,
            roughness: 0.2,
            metalness: 0.1
        });

    const water =
        new THREE.Mesh(
            waterGeometry,
            waterMaterial
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y = -4;

    worldGroup.add(water);


    createMountains();

    createRoads();

    createBattleMarkers();
}


/* =========================================================
   MOUNTAINS
========================================================= */

function createMountains() {

    for (let i = 0; i < 24; i++) {

        const geometry =
            new THREE.ConeGeometry(
                4 + Math.random() * 7,
                10 + Math.random() * 18,
                7
            );

        const material =
            new THREE.MeshStandardMaterial({
                color:
                    0x303a31 +
                    Math.floor(
                        Math.random() * 10
                    ),
                roughness: 1
            });

        const mountain =
            new THREE.Mesh(
                geometry,
                material
            );

        mountain.position.set(
            (Math.random() - 0.5) * 300,
            5,
            (Math.random() - 0.5) * 300
        );

        mountain.rotation.y =
            Math.random() * Math.PI;

        mountain.castShadow = true;

        worldGroup.add(mountain);
    }
}


/* =========================================================
   ROADS
========================================================= */

function createRoads() {

    for (let i = 0; i < 10; i++) {

        const geometry =
            new THREE.BoxGeometry(
                100,
                0.08,
                2.5
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x252724,
                roughness: 1
            });

        const road =
            new THREE.Mesh(
                geometry,
                material
            );

        road.position.set(
            (Math.random() - 0.5) * 180,
            0.3,
            (Math.random() - 0.5) * 180
        );

        road.rotation.y =
            Math.random() * Math.PI;

        worldGroup.add(road);
    }
}


/* =========================================================
   BATTLE MARKERS
========================================================= */

function createBattleMarkers() {

    for (let i = 0; i < 15; i++) {

        const geometry =
            new THREE.RingGeometry(
                0.7,
                1.0,
                16
            );

        const material =
            new THREE.MeshBasicMaterial({
                color: 0x8b3d32,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });

        const marker =
            new THREE.Mesh(
                geometry,
                material
            );

        marker.rotation.x =
            -Math.PI / 2;

        marker.position.set(
            (Math.random() - 0.5) * 280,
            0.4,
            (Math.random() - 0.5) * 280
        );

        worldGroup.add(marker);
    }
}


/* =========================================================
   UNITS
========================================================= */

function createUnits() {

    units = [];

    createMilitaryUnit(
        "1st Armored Division",
        "TANK",
        -30,
        4,
        12,
        true
    );

    createMilitaryUnit(
        "2nd Infantry Division",
        "INFANTRY",
        -18,
        4,
        20,
        true
    );

    createMilitaryUnit(
        "3rd Infantry Division",
        "INFANTRY",
        -5,
        4,
        28,
        true
    );

    createMilitaryUnit(
        "Air Wing Alpha",
        "AIR",
        15,
        8,
        12,
        true
    );

    createMilitaryUnit(
        "Enemy Armor Group",
        "TANK",
        45,
        4,
        -20,
        false
    );

    createMilitaryUnit(
        "Enemy Infantry Corps",
        "INFANTRY",
        35,
        4,
        -5,
        false
    );

    createMilitaryUnit(
        "Enemy Defense Force",
        "INFANTRY",
        55,
        4,
        12,
        false
    );

    createMilitaryUnit(
        "Enemy Air Wing",
        "AIR",
        65,
        8,
        -18,
        false
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
    y,
    z,
    friendly
) {

    const group =
        new THREE.Group();

    let mesh;


    /* TANK */

    if (type === "TANK") {

        const body =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    5,
                    1.8,
                    3.2
                ),
                new THREE.MeshStandardMaterial({
                    color: friendly
                        ? 0x566b4f
                        : 0x633b36,
                    roughness: 0.9,
                    metalness: 0.2
                })
            );

        body.position.y = 1.2;

        body.castShadow = true;

        group.add(body);


        const turret =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    1.25,
                    1.35,
                    0.8,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: friendly
                        ? 0x465b42
                        : 0x55332f
                })
            );

        turret.position.y = 2.25;

        turret.castShadow = true;

        group.add(turret);


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

        group.add(cannon);

        mesh = group;
    }


    /* INFANTRY */

    else if (type === "INFANTRY") {

        const body =
            new THREE.Mesh(
                new THREE.CapsuleGeometry(
                    0.65,
                    1.4,
                    5,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: friendly
                        ? 0x60715a
                        : 0x68453f
                })
            );

        body.position.y = 1.5;

        body.castShadow = true;

        group.add(body);


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

        head.position.y = 2.8;

        group.add(head);


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

        group.add(rifle);

        mesh = group;
    }


    /* AIRCRAFT */

    else {

        const fuselage =
            new THREE.Mesh(
                new THREE.CapsuleGeometry(
                    0.7,
                    4,
                    5,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: friendly
                        ? 0x5c6970
                        : 0x704842,
                    metalness: 0.4,
                    roughness: 0.5
                })
            );

        fuselage.rotation.x =
            Math.PI / 2;

        fuselage.castShadow = true;

        group.add(fuselage);


        const wing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    5,
                    0.2,
                    1.3
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x394449
                })
            );

        group.add(wing);

        mesh = group;
    }


    group.position.set(
        x,
        y,
        z
    );


    /* LABEL */

    const label =
        createUnitLabel(
            name,
            friendly
        );

    label.position.y =
        type === "AIR"
            ? 5
            : 4.2;

    group.add(label);


    /* UNIT DATA */

    const unit = {

        id:
            crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36),

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

        destination: null,

        state: "READY"
    };


    group.userData.unit =
        unit;

    unitGroup.add(group);

    units.push(unit);
}


/* =========================================================
   UNIT LABEL
========================================================= */

function createUnitLabel(
    text,
    friendly
) {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = 512;
    canvas.height = 80;

    const ctx =
        canvas.getContext("2d");

    ctx.fillStyle =
        "rgba(5,8,10,.85)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.font =
        "bold 25px Arial";

    ctx.fillStyle =
        friendly
            ? "#d5ad55"
            : "#e45d5d";

    ctx.textAlign =
        "center";

    ctx.fillText(
        text,
        256,
        48
    );

    const texture =
        new THREE.CanvasTexture(
            canvas
        );

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

    const sprite =
        new THREE.Sprite(
            material
        );

    sprite.scale.set(
        8,
        1.25,
        1
    );

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
   LEFT PANEL
========================================================= */

function setupPanelButtons() {

    document
        .querySelectorAll(".panel-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".panel-button"
                        )
                        .forEach(b =>
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
   PANELS
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

    panel.classList.add("open");


    const data = {

        overview: [
            "World Overview",
            "STRATEGIC COMMAND",
            `
            <div class="info-card">
                <h3>Global Situation</h3>
                <p>
                    Monitor your territory, armies,
                    resources and active fronts.
                </p>
            </div>

            <div class="info-card">
                <h3>Military Strength</h3>
                ${stat("Army Strength", "78%")}
                ${stat("Air Power", "64%")}
                ${stat("Logistics", "81%")}
                ${stat("Morale", "86%")}
            </div>

            <div class="info-card">
                <h3>War Status</h3>
                ${stat("Active Fronts", "2")}
                ${stat("Battles", "1")}
                ${stat("Enemy Threat", "HIGH")}
            </div>
            `
        ],

        army: [
            "Army Command",
            "MILITARY COMMAND",
            `
            <div class="info-card">
                <h3>Available Forces</h3>
                ${units
                    .filter(u => u.friendly)
                    .map(u =>
                        `
                        <button
                            class="action-btn unit-select"
                            data-unit="${u.id}">
                            ${u.name}
                            • ${u.type}
                        </button>
                        `
                    )
                    .join("")}
            </div>
            `
        ],

        economy: [
            "National Economy",
            "ECONOMIC COMMAND",
            `
            <div class="info-card">
                <h3>National Production</h3>
                ${stat("Treasury", money)}
                ${stat("Oil", oil)}
                ${stat("Steel", steel)}
                ${stat("Food", food)}
                ${stat("Manpower", manpower)}
            </div>

            <button class="action-btn"
                    id="economyBoost">
                INVEST IN INDUSTRY
            </button>
            `
        ],

        production: [
            "Military Production",
            "INDUSTRIAL COMMAND",
            `
            <div class="info-card">
                <h3>Production Queue</h3>
                ${stat("Infantry Equipment", "42%")}
                ${stat("Tank Production", "67%")}
                ${stat("Aircraft", "31%")}
            </div>

            <button class="action-btn">
                START TANK PRODUCTION
            </button>
            `
        ],

        research: [
            "Technology",
            "RESEARCH COMMAND",
            `
            <div class="info-card">
                <h3>Research Projects</h3>
                <p>
                    Armored Warfare Doctrine
                </p>

                <div class="progress"
                     style="margin-top:8px">
                    <i style="width:64%"></i>
                </div>
            </div>

            <button class="action-btn">
                RESEARCH NEW TECHNOLOGY
            </button>
            `
        ],

        diplomacy: [
            "Diplomacy",
            "FOREIGN AFFAIRS",
            `
            <div class="info-card">
                <h3>International Relations</h3>
                ${stat("Germany", "HOSTILE")}
                ${stat("United Kingdom", "NEUTRAL")}
                ${stat("USSR", "CAUTIOUS")}
                ${stat("Japan", "TENSE")}
            </div>
            `
        ],

        intel: [
            "Intelligence",
            "INTELLIGENCE COMMAND",
            `
            <div class="info-card">
                <h3>Enemy Intelligence</h3>
                ${stat("Enemy Army", "MEDIUM")}
                ${stat("Enemy Armor", "HIGH")}
                ${stat("Enemy Air Force", "MEDIUM")}
                ${stat("Threat Level", "HIGH")}
            </div>
            `
        ],

        settings: [
            "Game Settings",
            "SYSTEM CONTROL",
            `
            <div class="info-card">
                <h3>Graphics</h3>
                <button class="action-btn"
                        id="toggleFog">
                    TOGGLE BATTLEFIELD FOG
                </button>

                <button class="action-btn"
                        id="resetBtn">
                    RESET CAMERA
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


    document
        .querySelectorAll(".unit-select")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    const unit =
                        units.find(
                            u =>
                                u.id ===
                                btn.dataset.unit
                        );

                    if (unit) {
                        selectUnit(unit);
                    }
                }
            );
        });


    const economyBoost =
        $("economyBoost");

    if (economyBoost) {

        economyBoost.onclick =
            () => {

                if (money >= 1000) {

                    money -= 1000;
                    steel += 150;

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


    const toggleFog =
        $("toggleFog");

    if (toggleFog) {

        toggleFog.onclick =
            () => {

                if (scene.fog) {

                    scene.fog = null;

                    showToast(
                        "Battlefield fog disabled."
                    );

                } else {

                    scene.fog =
                        new THREE.Fog(
                            0x081016,
                            80,
                            450
                        );

                    showToast(
                        "Battlefield fog enabled."
                    );
                }
            };
    }


    const reset =
        $("resetBtn");

    if (reset) {

        reset.onclick =
            resetCamera;
    }
}


function stat(label, value) {

    return `
        <div class="stat-row">
            <span>${label}</span>
            <b>${value}</b>
        </div>
    `;
}


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(unit) {

    selectedUnit =
        unit;

    $("unitPanel")
        .classList.add("open");

    $("selectedUnitType")
        .textContent =
        `${unit.type} • ${unit.state}`;

    $("selectedUnitName")
        .textContent =
        unit.name;

    updateUnitStats();

    showToast(
        `${unit.name} selected`
    );
}


/* =========================================================
   UNIT STATS
========================================================= */

function updateUnitStats() {

    if (!selectedUnit)
        return;

    const u =
        selectedUnit;

    $("unitStats").innerHTML = `

        <div class="unit-stat">
            <span>Strength</span>
            <div class="progress">
                <i style="width:${u.strength}%"></i>
            </div>
            <b>${Math.round(u.strength)}</b>
        </div>

        <div class="unit-stat">
            <span>Organization</span>
            <div class="progress">
                <i style="width:${u.organization}%"></i>
            </div>
            <b>${Math.round(u.organization)}</b>
        </div>

        <div class="unit-stat">
            <span>Morale</span>
            <div class="progress">
                <i style="width:${u.morale}%"></i>
            </div>
            <b>${Math.round(u.morale)}</b>
        </div>

        <div class="unit-stat">
            <span>Health</span>
            <div class="progress">
                <i style="width:${u.hp}%"></i>
            </div>
            <b>${Math.round(u.hp)}</b>
        </div>

        <div class="stat-row">
            <span>Speed</span>
            <b>${u.speed} km/h</b>
        </div>

        <div class="stat-row">
            <span>Status</span>
            <b>${u.state}</b>
        </div>
    `;
}


/* =========================================================
   UNIT COMMANDS
========================================================= */

function setupUnitCommands() {

    $("moveCommand").onclick =
        () => {

            if (!selectedUnit)
                return showToast(
                    "Select a unit first."
                );

            moveMode = true;
            attackMode = false;

            showToast(
                "Tap battlefield to select destination."
            );
        };


    $("attackCommand").onclick =
        () => {

            if (!selectedUnit)
                return showToast(
                    "Select a unit first."
                );

            attackMode = true;
            moveMode = false;

            showToast(
                "Select an enemy unit to attack."
            );
        };


    $("defendCommand").onclick =
        () => {

            if (!selectedUnit)
                return;

            selectedUnit.state =
                "DEFENDING";

            selectedUnit.organization =
                Math.min(
                    100,
                    selectedUnit.organization + 5
                );

            updateUnitStats();

            showToast(
                `${selectedUnit.name} is defending.`
            );
        };


    $("holdCommand").onclick =
        () => {

            if (!selectedUnit)
                return;

            selectedUnit.destination =
                null;

            selectedUnit.state =
                "HOLDING";

            showToast(
                `${selectedUnit.name} holding position.`
            );
        };


    $("retreatCommand").onclick =
        () => {

            if (!selectedUnit)
                return;

            selectedUnit.state =
                "RETREATING";

            selectedUnit.destination =
                new THREE.Vector3(
                    selectedUnit.object.position.x - 20,
                    selectedUnit.object.position.y,
                    selectedUnit.object.position.z + 20
                );

            showToast(
                `${selectedUnit.name} retreating.`
            );
        };


    $("airstrikeCommand").onclick =
        () => {

            if (!selectedUnit)
                return;

            if (
                selectedUnit.type !==
                "AIR"
            ) {

                return showToast(
                    "Only aircraft can perform airstrikes."
                );
            }

            performAirstrike();
        };
}


/* =========================================================
   WORLD CLICK
========================================================= */

function handleWorldClick(event) {

    if (!renderer)
        return;

    const rect =
        renderer.domElement
            .getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const objects = [];

    units.forEach(u => {

        u.object.traverse(
            child => {

                if (
                    child.isMesh ||
                    child.isSprite
                ) {

                    objects.push(child);
                }
            }
        );
    });


    const hits =
        raycaster.intersectObjects(
            objects,
            true
        );


    if (hits.length > 0) {

        let obj =
            hits[0].object;

        while (
            obj &&
            !obj.userData.unit
        ) {

            obj = obj.parent;
        }


        if (
            obj &&
            obj.userData.unit
        ) {

            const unit =
                obj.userData.unit;


            if (
                attackMode &&
                selectedUnit &&
                !unit.friendly
            ) {

                attackUnit(
                    selectedUnit,
                    unit
                );

                attackMode =
                    false;

                return;
            }


            selectUnit(unit);

            return;
        }
    }


    /* MOVE */

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

            selectedUnit.destination =
                new THREE.Vector3(
                    point.x,
                    selectedUnit.object.position.y,
                    point.z
                );

            selectedUnit.state =
                "MOVING";

            moveMode =
                false;

            showToast(
                `${selectedUnit.name} moving.`
            );
        }
    }
}


/* =========================================================
   ATTACK
========================================================= */

function attackUnit(
    attacker,
    target
) {

    if (!attacker || !target)
        return;

    if (!attacker.friendly)
        return;

    const distance =
        attacker.object.position.distanceTo(
            target.object.position
        );


    if (distance > 35) {

        showToast(
            "Target is out of attack range."
        );

        return;
    }


    attacker.state =
        "ATTACKING";


    target.state =
        "UNDER ATTACK";


    const damage =
        8 +
        Math.random() * 17;


    target.hp =
        Math.max(
            0,
            target.hp - damage
        );


    target.organization =
        Math.max(
            0,
            target.organization - damage * 0.7
        );


    createExplosion(
        target.object.position.clone()
    );


    updateUnitStats();


    $("battleStatus")
        .textContent =
        `BATTLE: ${attacker.name} vs ${target.name}`;


    showToast(
        `${attacker.name} attacked ${target.name}`
    );


    if (target.hp <= 0) {

        destroyUnit(target);

        $("battleStatus")
            .textContent =
            "ENEMY UNIT DESTROYED";
    }
}


/* =========================================================
   AIRSTRIKE
========================================================= */

function performAirstrike() {

    const enemies =
        units.filter(
            u => !u.friendly
        );

    if (!enemies.length)
        return;


    let target =
        enemies[
            Math.floor(
                Math.random() *
                enemies.length
            )
        ];


    const pos =
        target.object.position.clone();

    pos.y = 1;

    createExplosion(pos);

    target.hp =
        Math.max(
            0,
            target.hp - 25
        );

    target.organization =
        Math.max(
            0,
            target.organization - 20
        );


    showToast(
        `Airstrike hit ${target.name}`
    );


    if (target.hp <= 0)
        destroyUnit(target);
}


/* =========================================================
   EXPLOSION
========================================================= */

function createExplosion(position) {

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


    function animateExplosion(now) {

        const elapsed =
            now - start;

        const p =
            Math.min(
                elapsed / 600,
                1
            );

        explosion.scale.setScalar(
            1 + p * 5
        );

        material.opacity =
            0.9 * (1 - p);


        if (p < 1) {

            requestAnimationFrame(
                animateExplosion
            );

        } else {

            effectsGroup.remove(
                explosion
            );

            geometry.dispose();
            material.dispose();
        }
    }


    requestAnimationFrame(
        animateExplosion
    );
}


/* =========================================================
   DESTROY UNIT
========================================================= */

function destroyUnit(unit) {

    if (!unit)
        return;

    unit.state =
        "DESTROYED";

    unit.object.visible =
        false;

    if (
        selectedUnit === unit
    ) {

        selectedUnit =
            null;

        $("unitPanel")
            .classList.remove(
                "open"
            );
    }

    refreshMiniMap();

    showToast(
        `${unit.name} destroyed.`
    );
}


/* =========================================================
   GAME UPDATE
========================================================= */

function updateGame(delta) {

    if (!gameRunning)
        return;


    const scaledDelta =
        delta * gameSpeed;


    /* MOVE UNITS */

    units.forEach(unit => {

        if (
            !unit.destination ||
            unit.state ===
            "DESTROYED"
        ) {
            return;
        }


        const object =
            unit.object;


        const target =
            unit.destination;


        const distance =
            object.position.distanceTo(
                target
            );


        if (distance < 1) {

            unit.destination =
                null;

            unit.state =
                "READY";

            return;
        }


        const direction =
            new THREE.Vector3()
                .subVectors(
                    target,
                    object.position
                )
                .normalize();


        const speed =
            unit.speed *
            0.12 *
            scaledDelta;


        object.position.add(
            direction.multiplyScalar(
                speed
            )
        );


        object.lookAt(
            target.x,
            object.position.y,
            target.z
        );


        unit.organization =
            Math.max(
                0,
                unit.organization -
                0.003 *
                scaledDelta
            );
    });


    /* RESOURCE INCOME */

    money +=
        2 *
        scaledDelta;

    oil +=
        0.3 *
        scaledDelta;

    steel +=
        0.7 *
        scaledDelta;

    food +=
        0.5 *
        scaledDelta;


    updateResources();
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


        if (controls)
            controls.update();


        renderer.render(
            scene,
            camera
        );
    }


    animate();
}


/* =========================================================
   DATE
========================================================= */

function advanceDate() {

    gameDay++;

    const daysInMonth =
        30;

    if (
        gameDay >
        daysInMonth
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

    $("gameDate")
        .textContent =
        `${gameYear} • ${months[gameMonth - 1]} ${String(gameDay).padStart(2, "0")}`;
}


/* =========================================================
   RESOURCES
========================================================= */

function updateResources() {

    $("money").textContent =
        Math.floor(money).toLocaleString();

    $("oil").textContent =
        Math.floor(oil).toLocaleString();

    $("steel").textContent =
        Math.floor(steel).toLocaleString();

    $("food").textContent =
        Math.floor(food).toLocaleString();

    $("manpower").textContent =
        Math.floor(manpower).toLocaleString();
}


/* =========================================================
   SPEED
========================================================= */

function setupSpeed() {

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

            $("speedBtn")
                .textContent =
                `${gameSpeed}×`;
        };
}


/* =========================================================
   PAUSE
========================================================= */

function setupPause() {

    $("pauseBtn").onclick =
        () => {

            gameRunning =
                !gameRunning;

            $("pauseBtn")
                .textContent =
                gameRunning
                    ? "Ⅱ"
                    : "▶";

            $("statusText")
                .textContent =
                gameRunning
                    ? "All systems operational"
                    : "GAME PAUSED";
        };
}


/* =========================================================
   CAMERA
========================================================= */

function setupCamera() {

    $("zoomIn").onclick =
        () => {

            camera.position.multiplyScalar(
                0.85
            );
        };


    $("zoomOut").onclick =
        () => {

            camera.position.multiplyScalar(
                1.15
            );
        };


    $("resetCamera").onclick =
        resetCamera;
}


function resetCamera() {

    camera.position.set(
        0,
        85,
        85
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
        .querySelectorAll(
            ".country-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset.country;

                    selectCountry(id);
                }
            );
        });


    $("closeCountryModal")
        .onclick =
        () => {

            $("countryModal")
                .classList.remove(
                    "open"
                );
        };
}


function selectCountry(id) {

    const country =
        countries[id];

    if (!country)
        return;

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


    $("countryFlag")
        .textContent =
        country.flag;

    $("countryName")
        .textContent =
        country.name;


    updateResources();

    $("countryModal")
        .classList.remove(
            "open"
        );


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


    const pages = [

        [
            "Welcome, Commander",
            "Select a military unit and command it across the battlefield."
        ],

        [
            "Move Your Army",
            "Select MOVE and then tap any terrain location."
        ],

        [
            "Engage Enemy Forces",
            "Select ATTACK and then select an enemy unit."
        ],

        [
            "Manage Your Nation",
            "Use Economy, Production and Research to strengthen your war machine."
        ],

        [
            "Good Luck",
            "Your campaign begins now. Build your army and control the battlefield."
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

    $("closePanel").onclick =
        () => {

            $("mainPanel")
                .classList.remove(
                    "open"
                );
        };


    $("closeUnit").onclick =
        () => {

            $("unitPanel")
                .classList.remove(
                    "open"
                );

            selectedUnit =
                null;
        };
}


/* =========================================================
   MINIMAP
========================================================= */

function refreshMiniMap() {

    const container =
        $("miniUnits");

    if (!container)
        return;

    container.innerHTML = "";


    units.forEach(unit => {

        if (
            unit.state ===
            "DESTROYED"
        )
            return;


        const dot =
            document.createElement(
                "div"
            );


        const x =
            Math.max(
                5,
                Math.min(
                    95,
                    50 +
                    unit.object.position.x /
                    3
                )
            );


        const y =
            Math.max(
                5,
                Math.min(
                    95,
                    50 +
                    unit.object.position.z /
                    3
                )
            );


        dot.style.position =
            "absolute";

        dot.style.width =
            "5px";

        dot.style.height =
            "5px";

        dot.style.borderRadius =
            "50%";

        dot.style.left =
            `${x}%`;

        dot.style.top =
            `${y}%`;

        dot.style.background =
            unit.friendly
                ? "#55d18a"
                : "#e45d5d";


        container.appendChild(
            dot
        );
    });
}


/* =========================================================
   LOADING
========================================================= */

function updateLoading(
    progress,
    status
) {

    const bar =
        $("loadingProgress");

    const text =
        $("loadingStatus");


    if (bar) {

        bar.style.width =
            `${Math.min(
                100,
                progress
            )}%`;
    }


    if (text) {

        text.textContent =
            status;
    }
}


function hideLoading() {

    const loading =
        $("loadingScreen");

    if (!loading)
        return;

    loading.classList.add(
        "hidden"
    );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message) {

    const toast =
        $("toast");

    if (!toast)
        return;


    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );
}


/* =========================================================
   RESIZE
========================================================= */

function onResize() {

    if (!camera ||
        !renderer)
        return;


    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}


/* =========================================================
   UTILITY
========================================================= */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================================
   START
========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "Runtime error:",
            event.error
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Promise error:",
            event.reason
        );
    }
);


/*
 * Emergency loading timeout.
 * If something external takes too long,
 * the loading screen will not permanently
 * block the player.
 */

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

            console.warn(
                "Loading timeout — forcing game screen."
            );

            hideLoading();

            showToast(
                "Battlefield loaded in recovery mode."
            );
        }

    },
    10000
);


init();