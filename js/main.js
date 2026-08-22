import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   Full client-side game controller
========================================================= */

const $ = (id) => document.getElementById(id);

const canvas = $("gameCanvas");

let scene;
let camera;
let renderer;
let controls;
let raycaster;
let mouse;

let selectedUnit = null;
let moveMode = false;
let paused = false;
let gameSpeed = 1;

let gameYear = 1940;
let gameMonth = 0;
let gameDay = 1;

let gameTimer = 0;
let lastFrame = performance.now();

let worldGroup;
let terrainGroup;
let unitGroup;
let effectGroup;

let selectedCountry = "USA";

const resources = {
    money: 12500,
    oil: 850,
    steel: 1250,
    food: 1600,
    manpower: 85000
};

const countries = {
    USA: {
        name: "United States",
        flag: "🇺🇸",
        color: 0x4f78a8,
        money: 12500,
        oil: 850,
        steel: 1250,
        food: 1600,
        manpower: 85000,
        income: 185
    },

    GERMANY: {
        name: "Germany",
        flag: "🇩🇪",
        color: 0x6b6259,
        money: 11000,
        oil: 620,
        steel: 1450,
        food: 1300,
        manpower: 95000,
        income: 170
    },

    UK: {
        name: "United Kingdom",
        flag: "🇬🇧",
        color: 0x536b92,
        money: 10500,
        oil: 760,
        steel: 1180,
        food: 1450,
        manpower: 68000,
        income: 165
    },

    JAPAN: {
        name: "Japan",
        flag: "🇯🇵",
        color: 0x9c554d,
        money: 9200,
        oil: 480,
        steel: 930,
        food: 1200,
        manpower: 72000,
        income: 145
    },

    USSR: {
        name: "Soviet Union",
        flag: "☭",
        color: 0x8b4d4d,
        money: 9800,
        oil: 900,
        steel: 1600,
        food: 1700,
        manpower: 120000,
        income: 150
    },

    FRANCE: {
        name: "France",
        flag: "🇫🇷",
        color: 0x526d8e,
        money: 8700,
        oil: 500,
        steel: 980,
        food: 1250,
        manpower: 65000,
        income: 135
    }
};

const units = [];

const unitTypes = {
    infantry: {
        name: "Infantry Division",
        icon: "🪖",
        hp: 100,
        attack: 22,
        defense: 28,
        speed: 0.035,
        range: 1.8,
        manpower: 10000,
        steel: 35,
        oil: 2
    },

    tank: {
        name: "Armored Division",
        icon: "🛡️",
        hp: 130,
        attack: 42,
        defense: 35,
        speed: 0.065,
        range: 2.2,
        manpower: 4500,
        steel: 90,
        oil: 16
    },

    artillery: {
        name: "Artillery Division",
        icon: "💥",
        hp: 90,
        attack: 52,
        defense: 18,
        speed: 0.025,
        range: 4.5,
        manpower: 3500,
        steel: 100,
        oil: 5
    },

    recon: {
        name: "Recon Division",
        icon: "🔭",
        hp: 75,
        attack: 16,
        defense: 15,
        speed: 0.085,
        range: 2.5,
        manpower: 2200,
        steel: 30,
        oil: 8
    }
};

const territories = [
    { name: "North America", x: -11, z: -1, sx: 5.5, sz: 3.7 },
    { name: "South America", x: -7, z: 7, sx: 2.6, sz: 4.5 },
    { name: "Europe", x: 1, z: -1, sx: 3.6, sz: 2.8 },
    { name: "Africa", x: 2, z: 5, sx: 3.8, sz: 4.6 },
    { name: "Asia", x: 8, z: 1, sx: 7.0, sz: 4.2 },
    { name: "Australia", x: 11, z: 8, sx: 3.0, sz: 2.0 }
];

const tips = [
    "TIP: Select a unit and tap MOVE to reposition it.",
    "TIP: Tanks are fast and powerful but consume more oil.",
    "TIP: Artillery can attack from long range.",
    "TIP: Keep manpower and food reserves high.",
    "TIP: Research upgrades improve your military.",
    "TIP: Production factories create new divisions.",
    "TIP: Use diplomacy before opening another front.",
    "TIP: Recon units move quickly and provide intelligence."
];

/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    startLoading();
    setupGame();
});

/* =========================================================
   LOADING
========================================================= */

function startLoading() {
    const progress = $("loadingProgress");
    const status = $("loadingStatus");
    const tip = $("loadingTip");

    let value = 0;

    const messages = [
        "Initializing command system...",
        "Loading world map...",
        "Preparing military units...",
        "Connecting strategic systems...",
        "Calibrating battlefield...",
        "Deploying forces...",
        "Command system ready."
    ];

    const interval = setInterval(() => {
        value += Math.random() * 12 + 5;

        if (value >= 100) {
            value = 100;
            clearInterval(interval);

            progress.style.width = "100%";
            status.textContent = messages[messages.length - 1];

            setTimeout(() => {
                $("loadingScreen")?.classList.add("hidden");
            }, 700);

            return;
        }

        progress.style.width = `${value}%`;

        const index = Math.min(
            messages.length - 2,
            Math.floor(value / 16)
        );

        status.textContent = messages[index];
        tip.textContent = tips[Math.floor(Math.random() * tips.length)];
    }, 250);
}

/* =========================================================
   THREE.JS SETUP
========================================================= */

function setupGame() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x071016);

    scene.fog = new THREE.Fog(
        0x071016,
        25,
        75
    );

    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        200
    );

    camera.position.set(
        0,
        25,
        25
    );

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

    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.minDistance = 8;
    controls.maxDistance = 55;

    controls.maxPolarAngle =
        Math.PI / 2.05;

    controls.target.set(
        0,
        0,
        0
    );

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    worldGroup = new THREE.Group();
    terrainGroup = new THREE.Group();
    unitGroup = new THREE.Group();
    effectGroup = new THREE.Group();

    scene.add(worldGroup);
    scene.add(terrainGroup);
    scene.add(unitGroup);
    scene.add(effectGroup);

    createLighting();
    createOcean();
    createTerrain();
    createBorders();
    createDecorations();
    createUnits();
    createEvents();

    setupUI();
    updateResourceUI();
    updateDateUI();

    window.addEventListener(
        "resize",
        onResize
    );

    canvas.addEventListener(
        "pointerdown",
        onCanvasPointerDown
    );

    requestAnimationFrame(animate);

    setTimeout(() => {
        showTutorial();
    }, 1000);
}

/* =========================================================
   LIGHTING
========================================================= */

function createLighting() {
    const ambient = new THREE.HemisphereLight(
        0x9db3bf,
        0x182016,
        2
    );

    scene.add(ambient);

    const sun = new THREE.DirectionalLight(
        0xffe4bd,
        3
    );

    sun.position.set(
        -10,
        30,
        10
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    scene.add(sun);
}

/* =========================================================
   OCEAN
========================================================= */

function createOcean() {
    const geometry =
        new THREE.PlaneGeometry(
            55,
            45,
            20,
            20
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x0b2028,
            roughness: 0.85,
            metalness: 0.05
        });

    const ocean =
        new THREE.Mesh(
            geometry,
            material
        );

    ocean.rotation.x =
        -Math.PI / 2;

    ocean.position.y = -0.35;

    ocean.receiveShadow = true;

    worldGroup.add(ocean);
}

/* =========================================================
   TERRAIN
========================================================= */

function createTerrain() {
    territories.forEach((land, index) => {
        const geometry =
            new THREE.CylinderGeometry(
                1,
                1.12,
                0.45,
                32
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: [
                    0x435345,
                    0x52634b,
                    0x4b5945,
                    0x5a5a49,
                    0x485b50,
                    0x59634e
                ][index],
                roughness: 1
            });

        const mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        mesh.scale.set(
            land.sx,
            1,
            land.sz
        );

        mesh.position.set(
            land.x,
            0,
            land.z
        );

        mesh.rotation.y =
            (index * 0.35);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            type: "territory",
            name: land.name
        };

        terrainGroup.add(mesh);

        addTerrainDetails(
            land.x,
            land.z,
            land.sx,
            land.sz
        );
    });
}

function addTerrainDetails(
    x,
    z,
    sx,
    sz
) {
    for (let i = 0; i < 12; i++) {
        const tree =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.12,
                    0.55,
                    6
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x25392a
                })
            );

        tree.position.set(
            x +
                (Math.random() - 0.5) *
                    sx *
                    1.5,
            0.4,
            z +
                (Math.random() - 0.5) *
                    sz *
                    1.5
        );

        tree.scale.y =
            0.7 + Math.random();

        terrainGroup.add(tree);
    }
}

/* =========================================================
   BORDERS
========================================================= */

function createBorders() {
    const material =
        new THREE.LineBasicMaterial({
            color: 0xc8a95e,
            transparent: true,
            opacity: 0.28
        });

    territories.forEach((land) => {
        const points = [];

        const segments = 32;

        for (let i = 0; i <= segments; i++) {
            const a =
                (i / segments) *
                Math.PI *
                2;

            points.push(
                new THREE.Vector3(
                    land.x +
                        Math.cos(a) *
                            land.sx,
                    0.28,
                    land.z +
                        Math.sin(a) *
                            land.sz
                )
            );
        }

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(points);

        const line =
            new THREE.Line(
                geometry,
                material
            );

        worldGroup.add(line);
    });
}

/* =========================================================
   DECORATIONS
========================================================= */

function createDecorations() {
    for (let i = 0; i < 30; i++) {
        const road =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.05,
                    0.02,
                    3
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x6c6250,
                    transparent: true,
                    opacity: 0.25
                })
            );

        road.position.set(
            (Math.random() - 0.5) * 35,
            0.27,
            (Math.random() - 0.5) * 22
        );

        road.rotation.y =
            Math.random() * Math.PI;

        worldGroup.add(road);
    }
}

/* =========================================================
   UNITS
========================================================= */

function createUnits() {
    units.length = 0;

    createUnit(
        "USA-1",
        "USA",
        "infantry",
        -11,
        -1
    );

    createUnit(
        "USA-2",
        "USA",
        "tank",
        -9.5,
        0.5
    );

    createUnit(
        "USA-3",
        "USA",
        "artillery",
        -12,
        1.2
    );

    createUnit(
        "GER-1",
        "GERMANY",
        "infantry",
        0.5,
        -1.5
    );

    createUnit(
        "GER-2",
        "GERMANY",
        "tank",
        1.7,
        -0.2
    );

    createUnit(
        "UK-1",
        "UK",
        "infantry",
        -0.3,
        -2.8
    );

    createUnit(
        "JPN-1",
        "JAPAN",
        "infantry",
        10,
        0
    );

    createUnit(
        "JPN-2",
        "JAPAN",
        "tank",
        11.5,
        1
    );

    createUnit(
        "USSR-1",
        "USSR",
        "infantry",
        5,
        -1
    );

    createUnit(
        "FRA-1",
        "FRANCE",
        "infantry",
        -1,
        -0.8
    );
}

function createUnit(
    id,
    country,
    type,
    x,
    z
) {
    const data =
        unitTypes[type];

    const color =
        countries[country].color;

    const group =
        new THREE.Group();

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.65,
                0.35,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color,
                roughness: 0.8
            })
        );

    body.position.y = 0.5;
    body.castShadow = true;

    group.add(body);

    if (type === "tank") {
        const turret =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.27,
                    0.27,
                    0.18,
                    12
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x222b25
                })
            );

        turret.position.y = 0.75;

        group.add(turret);

        const cannon =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.08,
                    0.08,
                    0.65
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x1a1f20
                })
            );

        cannon.position.set(
            0,
            0.75,
            -0.35
        );

        group.add(cannon);
    }

    if (type === "artillery") {
        const barrel =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.09,
                    0.09,
                    0.65
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x242927
                })
            );

        barrel.position.y = 0.75;

        barrel.rotation.x =
            -0.2;

        group.add(barrel);
    }

    const ring =
        new THREE.Mesh(
            new THREE.RingGeometry(
                0.55,
                0.65,
                24
            ),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide
            })
        );

    ring.rotation.x =
        -Math.PI / 2;

    ring.position.y = 0.06;

    group.add(ring);

    group.position.set(
        x,
        0,
        z
    );

    group.userData = {
        unitId: id
    };

    unitGroup.add(group);

    const unit = {
        id,
        country,
        type,
        name: data.name,
        mesh: group,

        x,
        z,

        hp: data.hp,
        maxHp: data.hp,

        morale: 75 + Math.random() * 25,

        organization:
            65 + Math.random() * 35,

        targetX: null,
        targetZ: null,

        state: "READY",

        kills: 0,

        experience: 0,

        ring
    };

    units.push(unit);
}

/* =========================================================
   EVENTS
========================================================= */

function createEvents() {
    setTimeout(() => {
        showToast(
            "COMMAND SYSTEM ONLINE"
        );
    }, 1800);

    setTimeout(() => {
        showToast(
            "Select a military unit to begin."
        );
    }, 3500);
}

/* =========================================================
   UI SETUP
========================================================= */

function setupUI() {
    document
        .querySelectorAll(".panel-button")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    document
                        .querySelectorAll(
                            ".panel-button"
                        )
                        .forEach((b) =>
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

    $("closePanel")
        ?.addEventListener(
            "click",
            closeMainPanel
        );

    $("closeUnit")
        ?.addEventListener(
            "click",
            deselectUnit
        );

    $("pauseBtn")
        ?.addEventListener(
            "click",
            togglePause
        );

    $("speedBtn")
        ?.addEventListener(
            "click",
            changeSpeed
        );

    $("zoomIn")
        ?.addEventListener(
            "click",
            () =>
                zoomCamera(-3)
        );

    $("zoomOut")
        ?.addEventListener(
            "click",
            () =>
                zoomCamera(3)
        );

    $("resetCamera")
        ?.addEventListener(
            "click",
            resetCamera
        );

    $("moveCommand")
        ?.addEventListener(
            "click",
            startMoveMode
        );

    $("attackCommand")
        ?.addEventListener(
            "click",
            attackSelected
        );

    $("defendCommand")
        ?.addEventListener(
            "click",
            defendSelected
        );

    $("holdCommand")
        ?.addEventListener(
            "click",
            holdSelected
        );

    $("retreatCommand")
        ?.addEventListener(
            "click",
            retreatSelected
        );

    $("airstrikeCommand")
        ?.addEventListener(
            "click",
            airstrikeSelected
        );

    $("closeCountryModal")
        ?.addEventListener(
            "click",
            closeCountryModal
        );

    document
        .querySelectorAll(".country-card")
        .forEach((card) => {
            card.addEventListener(
                "click",
                () => {
                    selectCountry(
                        card.dataset.country
                    );
                }
            );
        });

    $("tutorialNext")
        ?.addEventListener(
            "click",
            nextTutorial
        );
}

/* =========================================================
   PANEL SYSTEM
========================================================= */

function openPanel(panel) {
    const mainPanel =
        $("mainPanel");

    mainPanel.classList.add(
        "open"
    );

    const title =
        $("panelTitle");

    const kicker =
        $("panelKicker");

    const content =
        $("panelContent");

    const panels = {
        overview: {
            kicker: "STRATEGIC COMMAND",
            title: "World Overview",
            html: overviewHTML()
        },

        army: {
            kicker: "MILITARY COMMAND",
            title: "Army",
            html: armyHTML()
        },

        economy: {
            kicker: "NATIONAL ECONOMY",
            title: "Economy",
            html: economyHTML()
        },

        production: {
            kicker: "INDUSTRIAL COMMAND",
            title: "Production",
            html: productionHTML()
        },

        research: {
            kicker: "TECHNOLOGY",
            title: "Research",
            html: researchHTML()
        },

        diplomacy: {
            kicker: "FOREIGN AFFAIRS",
            title: "Diplomacy",
            html: diplomacyHTML()
        },

        intel: {
            kicker: "INTELLIGENCE",
            title: "Intelligence",
            html: intelHTML()
        },

        settings: {
            kicker: "SYSTEM",
            title: "Settings",
            html: settingsHTML()
        }
    };

    const data =
        panels[panel] ||
        panels.overview;

    kicker.textContent =
        data.kicker;

    title.textContent =
        data.title;

    content.innerHTML =
        data.html;

    bindPanelActions(panel);
}

function closeMainPanel() {
    $("mainPanel")
        ?.classList.remove("open");
}

function overviewHTML() {
    const country =
        countries[selectedCountry];

    return `
        <div class="info-card">
            <h3>${country.flag} ${country.name}</h3>

            <p>
                Command your nation, manage resources,
                build armies and control the battlefield.
            </p>
        </div>

        <div class="info-card">
            <div class="stat-row">
                <span>Military Units</span>
                <b>${units.filter(u =>
                    u.country === selectedCountry
                ).length}</b>
            </div>

            <div class="stat-row">
                <span>Income / day</span>
                <b>+${
                    country.income
                }</b>
            </div>

            <div class="stat-row">
                <span>Active Fronts</span>
                <b>${
                    units.filter(
                        u =>
                            u.country ===
                            selectedCountry &&
                            u.state === "ATTACKING"
                    ).length
                }</b>
            </div>
        </div>

        <div class="info-card">
            <h3>Quick Command</h3>

            <button
                class="action-btn"
                data-action="country"
            >
                CHANGE COUNTRY
            </button>

            <button
                class="action-btn"
                data-action="save"
            >
                SAVE GAME
            </button>
        </div>
    `;
}

function armyHTML() {
    const ownUnits =
        units.filter(
            u =>
                u.country ===
                selectedCountry
        );

    return `
        ${ownUnits.map(u => `
            <div class="info-card">
                <h3>
                    ${unitTypes[u.type].icon}
                    ${u.name}
                </h3>

                <div class="stat-row">
                    <span>Strength</span>
                    <b>${Math.round(
                        u.hp
                    )}%</b>
                </div>

                <div class="stat-row">
                    <span>Morale</span>
                    <b>${Math.round(
                        u.morale
                    )}%</b>
                </div>

                <div class="stat-row">
                    <span>Status</span>
                    <b>${u.state}</b>
                </div>

                <button
                    class="action-btn select-unit"
                    data-id="${u.id}"
                >
                    SELECT UNIT
                </button>
            </div>
        `).join("")}

        <button
            class="action-btn"
            data-action="recruit"
        >
            + RECRUIT DIVISION
        </button>
    `;
}

function economyHTML() {
    return `
        <div class="info-card">
            <h3>National Economy</h3>

            <div class="stat-row">
                <span>Treasury</span>
                <b>$${formatNumber(
                    resources.money
                )}</b>
            </div>

            <div class="stat-row">
                <span>Daily Income</span>
                <b>+${
                    countries[
                        selectedCountry
                    ].income
                }</b>
            </div>

            <div class="stat-row">
                <span>Oil</span>
                <b>${formatNumber(
                    resources.oil
                )}</b>
            </div>

            <div class="stat-row">
                <span>Steel</span>
                <b>${formatNumber(
                    resources.steel
                )}</b>
            </div>

            <div class="stat-row">
                <span>Food</span>
                <b>${formatNumber(
                    resources.food
                )}</b>
            </div>

            <div class="stat-row">
                <span>Manpower</span>
                <b>${formatNumber(
                    resources.manpower
                )}</b>
            </div>
        </div>

        <div class="info-card">
            <h3>Economic Actions</h3>

            <button
                class="action-btn"
                data-action="investment"
            >
                INVEST IN INDUSTRY — $1000
            </button>

            <button
                class="action-btn"
                data-action="food"
            >
                BUY FOOD — $500
            </button>
        </div>
    `;
}

function productionHTML() {
    return `
        <div class="info-card">
            <h3>Military Production</h3>

            <p>
                Queue new divisions using your
                industrial resources.
            </p>

            <button
                class="action-btn"
                data-production="infantry"
            >
                🪖 INFANTRY — $800
            </button>

            <button
                class="action-btn"
                data-production="tank"
            >
                🛡️ TANK — $1800
            </button>

            <button
                class="action-btn"
                data-production="artillery"
            >
                💥 ARTILLERY — $1600
            </button>

            <button
                class="action-btn"
                data-production="recon"
            >
                🔭 RECON — $700
            </button>
        </div>

        <div class="info-card">
            <h3>Factories</h3>

            <div class="stat-row">
                <span>Military Factories</span>
                <b>12</b>
            </div>

            <div class="stat-row">
                <span>Civilian Factories</span>
                <b>18</b>
            </div>
        </div>
    `;
}

function researchHTML() {
    return `
        <div class="info-card">
            <h3>Research Tree</h3>

            <div class="stat-row">
                <span>Infantry Weapons</span>
                <b>Lv. 1</b>
            </div>

            <button
                class="action-btn"
                data-research="infantry"
            >
                RESEARCH — $1200
            </button>

            <div class="stat-row">
                <span>Armored Technology</span>
                <b>Lv. 1</b>
            </div>

            <button
                class="action-btn"
                data-research="tank"
            >
                RESEARCH — $1800
            </button>

            <div class="stat-row">
                <span>Air Doctrine</span>
                <b>Lv. 1</b>
            </div>

            <button
                class="action-btn"
                data-research="air"
            >
                RESEARCH — $1500
            </button>
        </div>
    `;
}

function diplomacyHTML() {
    const others =
        Object.keys(countries)
            .filter(
                key =>
                    key !== selectedCountry
            );

    return `
        ${others.map(key => `
            <div class="info-card">
                <h3>
                    ${countries[key].flag}
                    ${countries[key].name}
                </h3>

                <div class="stat-row">
                    <span>Relations</span>
                    <b>NEUTRAL</b>
                </div>

                <button
                    class="action-btn diplomacy-action"
                    data-country="${key}"
                >
                    OPEN DIPLOMACY
                </button>
            </div>
        `).join("")}
    `;
}

function intelHTML() {
    return `
        <div class="info-card">
            <h3>Intelligence Network</h3>

            <div class="stat-row">
                <span>Recon Level</span>
                <b>42%</b>
            </div>

            <div class="stat-row">
                <span>Enemy Visibility</span>
                <b>HIGH</b>
            </div>

            <button
                class="action-btn"
                data-action="spy"
            >
                DEPLOY SPY NETWORK — $750
            </button>
        </div>

        <div class="info-card">
            <h3>Battlefield Reports</h3>
            <p>
                Enemy movements are being monitored.
                Recon divisions improve battlefield visibility.
            </p>
        </div>
    `;
}

function settingsHTML() {
    return `
        <div class="info-card">
            <h3>Game Settings</h3>

            <button
                class="action-btn"
                data-action="save"
            >
                SAVE GAME
            </button>

            <button
                class="action-btn"
                data-action="load"
            >
                LOAD GAME
            </button>

            <button
                class="action-btn"
                data-action="reset"
            >
                RESET GAME
            </button>
        </div>
    `;
}

/* =========================================================
   PANEL ACTIONS
========================================================= */

function bindPanelActions(panel) {
    document
        .querySelectorAll(".select-unit")
        .forEach(btn => {
            btn.addEventListener(
                "click",
                () => {
                    const unit =
                        units.find(
                            u =>
                                u.id ===
                                btn.dataset.id
                        );

                    if (unit) {
                        selectUnit(unit);
                    }
                }
            );
        });

    document
        .querySelectorAll(
            "[data-production]"
        )
        .forEach(btn => {
            btn.addEventListener(
                "click",
                () =>
                    produceUnit(
                        btn.dataset.production
                    )
            );
        });

    document
        .querySelectorAll(
            "[data-research]"
        )
        .forEach(btn => {
            btn.addEventListener(
                "click",
                () =>
                    research(
                        btn.dataset.research
                    )
            );
        });

    document
        .querySelectorAll(
            ".diplomacy-action"
        )
        .forEach(btn => {
            btn.addEventListener(
                "click",
                () =>
                    diplomaticAction(
                        btn.dataset.country
                    )
            );
        });

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(btn => {
            btn.addEventListener(
                "click",
                () =>
                    handleAction(
                        btn.dataset.action
                    )
            );
        });
}

function handleAction(action) {
    if (action === "country") {
        $("countryModal")
            .classList.add("open");
    }

    if (action === "save") {
        saveGame();
    }

    if (action === "load") {
        loadGame();
    }

    if (action === "reset") {
        location.reload();
    }

    if (action === "recruit") {
        produceUnit("infantry");
    }

    if (action === "investment") {
        if (resources.money >= 1000) {
            resources.money -= 1000;
            countries[
                selectedCountry
            ].income += 20;

            updateResourceUI();

            showToast(
                "Industrial capacity increased."
            );
        } else {
            showToast(
                "Not enough money."
            );
        }
    }

    if (action === "food") {
        if (resources.money >= 500) {
            resources.money -= 500;
            resources.food += 400;

            updateResourceUI();

            showToast(
                "Food reserves increased."
            );
        } else {
            showToast(
                "Not enough money."
            );
        }
    }

    if (action === "spy") {
        if (resources.money >= 750) {
            resources.money -= 750;

            updateResourceUI();

            showToast(
                "Spy network deployed."
            );
        } else {
            showToast(
                "Not enough money."
            );
        }
    }
}

/* =========================================================
   COUNTRY
========================================================= */

function selectCountry(countryKey) {
    if (!countries[countryKey]) {
        return;
    }

    selectedCountry =
        countryKey;

    const country =
        countries[countryKey];

    resources.money =
        country.money;

    resources.oil =
        country.oil;

    resources.steel =
        country.steel;

    resources.food =
        country.food;

    resources.manpower =
        country.manpower;

    $("countryFlag").textContent =
        country.flag;

    $("countryName").textContent =
        country.name;

    updateResourceUI();

    $("countryModal")
        .classList.remove("open");

    deselectUnit();

    showToast(
        `Now commanding ${country.name}.`
    );

    openPanel("overview");
}

function closeCountryModal() {
    $("countryModal")
        .classList.remove("open");
}

/* =========================================================
   UNIT SELECT
========================================================= */

function selectUnit(unit) {
    if (!unit) return;

    selectedUnit = unit;

    $("unitPanel")
        .classList.add("open");

    updateUnitPanel();

    controls.target.set(
        unit.mesh.position.x,
        0,
        unit.mesh.position.z
    );

    showToast(
        `${unit.name} selected`
    );
}

function deselectUnit() {
    selectedUnit = null;

    moveMode = false;

    $("unitPanel")
        ?.classList.remove("open");

    units.forEach(
        unit => {
            unit.ring.scale.set(
                1,
                1,
                1
            );
        }
    );
}

function updateUnitPanel() {
    if (!selectedUnit) return;

    const u =
        selectedUnit;

    const data =
        unitTypes[u.type];

    $("selectedUnitType")
        .textContent =
        `${data.icon} ${u.type.toUpperCase()} • ${u.state}`;

    $("selectedUnitName")
        .textContent =
        u.name;

    $("unitStats").innerHTML = `
        <div class="unit-stat">
            <span>Strength</span>
            <div class="progress">
                <i style="width:${u.hp}%"></i>
            </div>
            <b>${Math.round(u.hp)}</b>
        </div>

        <div class="unit-stat">
            <span>Morale</span>
            <div class="progress">
                <i style="width:${u.morale}%"></i>
            </div>
            <b>${Math.round(u.morale)}</b>
        </div>

        <div class="unit-stat">
            <span>Organization</span>
            <div class="progress">
                <i style="width:${u.organization}%"></i>
            </div>
            <b>${Math.round(
                u.organization
            )}</b>
        </div>

        <div class="stat-row">
            <span>Attack</span>
            <b>${data.attack}</b>
        </div>

        <div class="stat-row">
            <span>Defense</span>
            <b>${data.defense}</b>
        </div>

        <div class="stat-row">
            <span>Kills</span>
            <b>${u.kills}</b>
        </div>

        <div class="stat-row">
            <span>Experience</span>
            <b>${Math.round(
                u.experience
            )}</b>
        </div>
    `;
}

/* =========================================================
   CANVAS INPUT
========================================================= */

function onCanvasPointerDown(event) {
    if (
        event.target !== canvas
    ) {
        return;
    }

    const rect =
        canvas.getBoundingClientRect();

    mouse.x =
        ((event.clientX -
            rect.left) /
            rect.width) *
            2 -
        1;

    mouse.y =
        -(
            (event.clientY -
                rect.top) /
            rect.height
        ) *
            2 +
        1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const meshes =
        unitGroup.children;

    const hits =
        raycaster.intersectObjects(
            meshes,
            true
        );

    if (hits.length) {
        let object =
            hits[0].object;

        while (
            object &&
            !object.userData.unitId
        ) {
            object =
                object.parent;
        }

        if (
            object &&
            object.userData.unitId
        ) {
            const unit =
                units.find(
                    u =>
                        u.id ===
                        object.userData
                            .unitId
                );

            if (unit) {
                if (
                    moveMode &&
                    selectedUnit &&
                    unit !== selectedUnit
                ) {
                    showToast(
                        "Enemy unit detected."
                    );
                    return;
                }

                selectUnit(unit);
                return;
            }
        }
    }

    if (
        selectedUnit &&
        moveMode
    ) {
        const plane =
            new THREE.Plane(
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),
                0
            );

        const point =
            new THREE.Vector3();

        raycaster.ray.intersectPlane(
            plane,
            point
        );

        if (point) {
            moveUnitTo(
                selectedUnit,
                point.x,
                point.z
            );
        }
    }
}

/* =========================================================
   MOVEMENT
========================================================= */

function startMoveMode() {
    if (!selectedUnit) {
        showToast(
            "Select a unit first."
        );
        return;
    }

    moveMode = true;

    selectedUnit.state =
        "MOVING";

    showToast(
        "Tap the battlefield to move."
    );

    updateUnitPanel();
}

function moveUnitTo(
    unit,
    x,
    z
) {
    if (!unit) return;

    unit.targetX = THREE.MathUtils.clamp(
        x,
        -18,
        18
    );

    unit.targetZ = THREE.MathUtils.clamp(
        z,
        -13,
        13
    );

    unit.state = "MOVING";

    moveMode = false;

    showToast(
        `${unit.name} moving to new position.`
    );
}

function updateUnitMovement(delta) {
    units.forEach(unit => {
        if (
            unit.targetX === null ||
            unit.targetZ === null
        ) {
            return;
        }

        const dx =
            unit.targetX -
            unit.mesh.position.x;

        const dz =
            unit.targetZ -
            unit.mesh.position.z;

        const distance =
            Math.sqrt(
                dx * dx +
                    dz * dz
            );

        if (distance < 0.08) {
            unit.mesh.position.x =
                unit.targetX;

            unit.mesh.position.z =
                unit.targetZ;

            unit.x =
                unit.targetX;

            unit.z =
                unit.targetZ;

            unit.targetX = null;
            unit.targetZ = null;

            if (
                unit.state ===
                "MOVING"
            ) {
                unit.state =
                    "READY";
            }

            return;
        }

        const data =
            unitTypes[
                unit.type
            ];

        const speed =
            data.speed *
            delta *
            60;

        unit.mesh.position.x +=
            (dx / distance) *
            speed;

        unit.mesh.position.z +=
            (dz / distance) *
            speed;

        unit.mesh.rotation.y =
            Math.atan2(
                dx,
                dz
            );
    });
}

/* =========================================================
   COMMANDS
========================================================= */

function attackSelected() {
    if (!selectedUnit) {
        showToast(
            "Select a unit first."
        );
        return;
    }

    const enemy =
        findNearestEnemy(
            selectedUnit
        );

    if (!enemy) {
        showToast(
            "No enemy target nearby."
        );
        return;
    }

    selectedUnit.state =
        "ATTACKING";

    showToast(
        `${selectedUnit.name} engaging ${enemy.name}.`
    );

    createAttackEffect(
        selectedUnit,
        enemy
    );
}

function defendSelected() {
    if (!selectedUnit) return;

    selectedUnit.state =
        "DEFENDING";

    selectedUnit.organization =
        Math.min(
            100,
            selectedUnit.organization +
                8
        );

    showToast(
        `${selectedUnit.name} is defending.`
    );

    updateUnitPanel();
}

function holdSelected() {
    if (!selectedUnit) return;

    selectedUnit.state =
        "HOLD";

    selectedUnit.targetX = null;
    selectedUnit.targetZ = null;

    showToast(
        `${selectedUnit.name} ordered to HOLD.`
    );

    updateUnitPanel();
}

function retreatSelected() {
    if (!selectedUnit) return;

    selectedUnit.state =
        "RETREATING";

    selectedUnit.morale =
        Math.max(
            0,
            selectedUnit.morale - 5
        );

    const direction =
        selectedUnit.country ===
        selectedCountry
            ? -1
            : 1;

    moveUnitTo(
        selectedUnit,
        selectedUnit.mesh.position.x +
            direction * 3,
        selectedUnit.mesh.position.z +
            2
    );

    showToast(
        "Retreat order issued."
    );
}

function airstrikeSelected() {
    if (!selectedUnit) {
        showToast(
            "Select a unit first."
        );
        return;
    }

    if (
        resources.oil < 30 ||
        resources.money < 250
    ) {
        showToast(
            "Insufficient airstrike resources."
        );
        return;
    }

    const enemy =
        findNearestEnemy(
            selectedUnit
        );

    if (!enemy) {
        showToast(
            "No enemy target found."
        );
        return;
    }

    resources.oil -= 30;
    resources.money -= 250;

    enemy.hp =
        Math.max(
            0,
            enemy.hp - 25
        );

    enemy.morale =
        Math.max(
            0,
            enemy.morale - 18
        );

    createExplosion(
        enemy.mesh.position
    );

    updateResourceUI();

    showToast(
        "AIRSTRIKE SUCCESSFUL"
    );

    if (enemy.hp <= 0) {
        destroyUnit(enemy);
    }

    updateUnitPanel();
}

/* =========================================================
   COMBAT
========================================================= */

function findNearestEnemy(unit) {
    let nearest = null;
    let nearestDistance =
        Infinity;

    units.forEach(other => {
        if (
            other === unit ||
            other.country ===
                unit.country ||
            other.hp <= 0
        ) {
            return;
        }

        const dx =
            other.mesh.position.x -
            unit.mesh.position.x;

        const dz =
            other.mesh.position.z -
            unit.mesh.position.z;

        const distance =
            Math.sqrt(
                dx * dx +
                    dz * dz
            );

        if (
            distance <
                nearestDistance
        ) {
            nearestDistance =
                distance;

            nearest = other;
        }
    });

    return nearest;
}

function simulateCombat(delta) {
    units.forEach(unit => {
        if (
            unit.state !==
            "ATTACKING"
        ) {
            return;
        }

        const enemy =
            findNearestEnemy(
                unit
            );

        if (!enemy) {
            unit.state =
                "READY";
            return;
        }

        const dx =
            enemy.mesh.position.x -
            unit.mesh.position.x;

        const dz =
            enemy.mesh.position.z -
            unit.mesh.position.z;

        const distance =
            Math.sqrt(
                dx * dx +
                    dz * dz
            );

        const data =
            unitTypes[
                unit.type
            ];

        if (
            distance >
            data.range
        ) {
            moveUnitTo(
                unit,
                enemy.mesh.position.x,
                enemy.mesh.position.z
            );

            unit.state =
                "ATTACKING";

            return;
        }

        const damage =
            (
                data.attack *
                (0.45 +
                    Math.random() *
                        0.65)
            ) *
            delta;

        enemy.hp =
            Math.max(
                0,
                enemy.hp -
                    damage
            );

        enemy.morale =
            Math.max(
                0,
                enemy.morale -
                    damage *
                    0.25
            );

        unit.experience +=
            damage * 0.08;

        if (
            Math.random() <
            delta * 0.7
        ) {
            createAttackEffect(
                unit,
                enemy
            );
        }

        if (
            enemy.hp <= 0
        ) {
            unit.kills++;

            unit.experience +=
                20;

            destroyUnit(
                enemy
            );

            unit.state =
                "READY";

            if (
                unit.country ===
                selectedCountry
            ) {
                showToast(
                    `${unit.name} destroyed an enemy division.`
                );
            }
        }
    });
}

function createAttackEffect(
    attacker,
    target
) {
    if (!attacker || !target) {
        return;
    }

    const start =
        attacker.mesh.position
            .clone();

    start.y += 0.7;

    const end =
        target.mesh.position
            .clone();

    end.y += 0.5;

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                start,
                end
            ]);

    const material =
        new THREE.LineBasicMaterial({
            color: 0xffb347,
            transparent: true,
            opacity: 0.8
        });

    const line =
        new THREE.Line(
            geometry,
            material
        );

    effectGroup.add(line);

    setTimeout(() => {
        effectGroup.remove(line);

        geometry.dispose();
        material.dispose();
    }, 120);
}

function createExplosion(position) {
    const geometry =
        new THREE.SphereGeometry(
            0.18,
            12,
            12
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xff762e,
            transparent: true,
            opacity: 1
        });

    const explosion =
        new THREE.Mesh(
            geometry,
            material
        );

    explosion.position.copy(
        position
    );

    effectGroup.add(
        explosion
    );

    let scale = 0.4;

    const timer =
        setInterval(() => {
            scale += 0.25;

            explosion.scale.setScalar(
                scale
            );

            material.opacity -=
                0.1;

            if (
                material.opacity <=
                0
            ) {
                clearInterval(timer);

                effectGroup.remove(
                    explosion
                );

                geometry.dispose();
                material.dispose();
            }
        }, 40);
}

/* =========================================================
   DESTROY UNIT
========================================================= */

function destroyUnit(unit) {
    if (!unit) return;

    createExplosion(
        unit.mesh.position
    );

    unitGroup.remove(
        unit.mesh
    );

    const index =
        units.indexOf(unit);

    if (index !== -1) {
        units.splice(
            index,
            1
        );
    }

    if (
        selectedUnit === unit
    ) {
        deselectUnit();
    }

    updateMiniMap();

    showToast(
        `${unit.name} has been destroyed.`
    );
}

/* =========================================================
   PRODUCTION
========================================================= */

function produceUnit(type) {
    const costs = {
        infantry: 800,
        tank: 1800,
        artillery: 1600,
        recon: 700
    };

    const cost =
        costs[type];

    if (
        resources.money <
        cost
    ) {
        showToast(
            "Not enough money."
        );
        return;
    }

    resources.money -=
        cost;

    resources.steel -=
        Math.min(
            resources.steel,
            unitTypes[type].steel
        );

    const base =
        territories.find(
            t =>
                t.name ===
                "North America"
        );

    const ownUnits =
        units.filter(
            u =>
                u.country ===
                selectedCountry
        );

    const angle =
        ownUnits.length *
        1.7;

    const x =
        base.x +
        Math.cos(angle) *
            2;

    const z =
        base.z +
        Math.sin(angle) *
            2;

    const id =
        `${selectedCountry}-${Date.now()}`;

    createUnit(
        id,
        selectedCountry,
        type,
        x,
        z
    );

    updateResourceUI();
    updateMiniMap();

    showToast(
        `${unitTypes[type].name} deployed.`
    );

    openPanel("army");
}

/* =========================================================
   RESEARCH
========================================================= */

function research(type) {
    const cost =
        type === "tank"
            ? 1800
            : type === "air"
            ? 1500
            : 1200;

    if (
        resources.money <
        cost
    ) {
        showToast(
            "Not enough money."
        );
        return;
    }

    resources.money -=
        cost;

    units
        .filter(
            u =>
                u.country ===
                selectedCountry
        )
        .forEach(
            u => {
                if (
                    type ===
                    "infantry" &&
                    u.type ===
                        "infantry"
                ) {
                    u.experience +=
                        25;
                }

                if (
                    type ===
                    "tank" &&
                    u.type ===
                        "tank"
                ) {
                    u.experience +=
                        30;
                }
            }
        );

    updateResourceUI();

    showToast(
        "Research completed."
    );
}

/* =========================================================
   DIPLOMACY
========================================================= */

function diplomaticAction(
    country
) {
    if (
        resources.money <
        500
    ) {
        showToast(
            "Need $500 for diplomatic mission."
        );
        return;
    }

    resources.money -=
        500;

    updateResourceUI();

    showToast(
        `Diplomatic mission sent to ${countries[country].name}.`
    );
}

/* =========================================================
   PAUSE / SPEED
========================================================= */

function togglePause() {
    paused = !paused;

    $("pauseBtn")
        .textContent =
        paused
            ? "▶"
            : "Ⅱ";

    showToast(
        paused
            ? "GAME PAUSED"
            : "GAME RESUMED"
    );
}

function changeSpeed() {
    const speeds = [
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

    $("speedBtn")
        .textContent =
        `${gameSpeed}×`;

    showToast(
        `Game speed: ${gameSpeed}×`
    );
}

/* =========================================================
   CAMERA
========================================================= */

function zoomCamera(amount) {
    const direction =
        camera.position
            .clone()
            .sub(
                controls.target
            )
            .normalize();

    camera.position.add(
        direction.multiplyScalar(
            amount
        )
    );
}

function resetCamera() {
    camera.position.set(
        0,
        25,
        25
    );

    controls.target.set(
        0,
        0,
        0
    );

    controls.update();

    showToast(
        "Camera reset."
    );
}

/* =========================================================
   RESOURCES
========================================================= */

function updateResourceUI() {
    $("money").textContent =
        formatNumber(
            resources.money
        );

    $("oil").textContent =
        formatNumber(
            resources.oil
        );

    $("steel").textContent =
        formatNumber(
            resources.steel
        );

    $("food").textContent =
        formatNumber(
            resources.food
        );

    $("manpower").textContent =
        formatNumber(
            resources.manpower
        );
}

function formatNumber(num) {
    return Math.round(num)
        .toLocaleString();
}

/* =========================================================
   DATE
========================================================= */

function updateGameDate(delta) {
    if (paused) return;

    gameTimer +=
        delta *
        gameSpeed;

    if (
        gameTimer >=
        5
    ) {
        gameTimer = 0;

        gameDay++;

        dailyEconomy();

        if (
            gameDay >
            30
        ) {
            gameDay = 1;
            gameMonth++;

            if (
                gameMonth >
                11
            ) {
                gameMonth = 0;
                gameYear++;
            }
        }

        updateDateUI();
    }
}

function updateDateUI() {
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
        `${gameYear} • ${
            months[gameMonth]
        } ${String(
            gameDay
        ).padStart(2, "0")}`;
}

function dailyEconomy() {
    const income =
        countries[
            selectedCountry
        ].income;

    resources.money +=
        income;

    resources.food =
        Math.max(
            0,
            resources.food -
                18
        );

    resources.oil =
        Math.max(
            0,
            resources.oil -
                units.filter(
                    u =>
                        u.country ===
                        selectedCountry
                ).length *
                    2
        );

    resources.manpower =
        Math.max(
            0,
            resources.manpower -
                80
        );

    updateResourceUI();

    if (
        resources.food < 300
    ) {
        showToast(
            "WARNING: Food reserves are low."
        );
    }
}

/* =========================================================
   MINIMAP
========================================================= */

function updateMiniMap() {
    const container =
        $("miniUnits");

    if (!container) return;

    container.innerHTML = "";

    units.forEach(unit => {
        const dot =
            document.createElement(
                "div"
            );

        dot.style.position =
            "absolute";

        dot.style.width =
            "5px";

        dot.style.height =
            "5px";

        dot.style.borderRadius =
            "50%";

        dot.style.background =
            unit.country ===
            selectedCountry
                ? "#55d18a"
                : "#e45d5d";

        const left =
            ((unit.mesh.position.x +
                20) /
                40) *
                100;

        const top =
            ((unit.mesh.position.z +
                15) /
                30) *
                100;

        dot.style.left =
            `${left}%`;

        dot.style.top =
            `${top}%`;

        container.appendChild(
            dot
        );
    });
}

/* =========================================================
   SELECTED UNIT HIGHLIGHT
========================================================= */

function updateSelectionVisual() {
    units.forEach(unit => {
        if (
            unit ===
            selectedUnit
        ) {
            unit.ring.scale.set(
                1.35,
                1.35,
                1.35
            );

            unit.ring.material.opacity =
                0.8;
        } else {
            unit.ring.scale.set(
                1,
                1,
                1
            );

            unit.ring.material.opacity =
                0.35;
        }
    });
}

/* =========================================================
   BATTLE STATUS
========================================================= */

function updateBattleStatus() {
    const battles =
        units.filter(
            u =>
                u.state ===
                    "ATTACKING" ||
                u.state ===
                    "DEFENDING"
        );

    if (!battles.length) {
        $("battleStatus")
            .textContent =
            "NO ACTIVE BATTLE";

        return;
    }

    $("battleStatus")
        .textContent =
        `ACTIVE FRONT • ${battles.length} UNITS`;
}

/* =========================================================
   TUTORIAL
========================================================= */

let tutorialStep = 0;

const tutorialSteps = [
    {
        title: "Welcome, Commander",
        text:
            "Select a military unit and command it across the battlefield."
    },

    {
        title: "Select Units",
        text:
            "Tap an army, tank or artillery unit to open its command panel."
    },

    {
        title: "Move",
        text:
            "Press MOVE, then tap any battlefield position to send your unit."
    },

    {
        title: "Attack",
        text:
            "Use ATTACK to engage nearby enemy forces."
    },

    {
        title: "Manage Your Nation",
        text:
            "Economy, Production and Research allow your nation to become stronger."
    }
];

function showTutorial() {
    tutorialStep = 0;

    $("tutorial")
        .style.display =
        "grid";

    updateTutorial();
}

function updateTutorial() {
    const step =
        tutorialSteps[
            tutorialStep
        ];

    $("tutorialTitle")
        .textContent =
        step.title;

    $("tutorialText")
        .textContent =
        step.text;

    $("tutorialNext")
        .textContent =
        tutorialStep ===
        tutorialSteps.length - 1
            ? "START"
            : "NEXT";
}

function nextTutorial() {
    tutorialStep++;

    if (
        tutorialStep >=
        tutorialSteps.length
    ) {
        $("tutorial")
            .style.display =
            "none";

        showToast(
            "FIELD MANUAL COMPLETE"
        );

        return;
    }

    updateTutorial();
}

/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {
    const toast =
        $("toast");

    if (!toast) return;

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(() => {
            toast.classList.remove(
                "show"
            );
        }, 2400);
}

/* =========================================================
   SAVE / LOAD
========================================================= */

function saveGame() {
    const data = {
        selectedCountry,

        resources: {
            ...resources
        },

        gameYear,
        gameMonth,
        gameDay,

        units: units.map(
            u => ({
                id: u.id,
                country: u.country,
                type: u.type,
                x: u.mesh.position.x,
                z: u.mesh.position.z,
                hp: u.hp,
                morale: u.morale,
                organization:
                    u.organization,
                state: u.state,
                kills: u.kills,
                experience:
                    u.experience
            })
        )
    };

    localStorage.setItem(
        "worldWarSave",
        JSON.stringify(data)
    );

    showToast(
        "GAME SAVED"
    );
}

function loadGame() {
    const raw =
        localStorage.getItem(
            "worldWarSave"
        );

    if (!raw) {
        showToast(
            "No saved game found."
        );
        return;
    }

    try {
        const data =
            JSON.parse(raw);

        selectedCountry =
            data.selectedCountry ||
            "USA";

        Object.assign(
            resources,
            data.resources
        );

        gameYear =
            data.gameYear ||
            1940;

        gameMonth =
            data.gameMonth ||
            0;

        gameDay =
            data.gameDay ||
            1;

        unitGroup.clear();

        units.length = 0;

        (data.units || [])
            .forEach(saved => {
                createUnit(
                    saved.id,
                    saved.country,
                    saved.type,
                    saved.x,
                    saved.z
                );

                const unit =
                    units[
                        units.length -
                            1
                    ];

                unit.hp =
                    saved.hp;

                unit.morale =
                    saved.morale;

                unit.organization =
                    saved.organization;

                unit.state =
                    saved.state;

                unit.kills =
                    saved.kills;

                unit.experience =
                    saved.experience;
            });

        const country =
            countries[
                selectedCountry
            ];

        $("countryFlag")
            .textContent =
            country.flag;

        $("countryName")
            .textContent =
            country.name;

        updateResourceUI();
        updateDateUI();
        updateMiniMap();

        showToast(
            "GAME LOADED"
        );
    } catch (error) {
        console.error(error);

        showToast(
            "Save file is corrupted."
        );
    }
}

/* =========================================================
   GAME LOOP
========================================================= */

function animate(now) {
    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            (now -
                lastFrame) /
                1000,
            0.1
        );

    lastFrame = now;

    controls.update();

    if (!paused) {
        updateUnitMovement(
            delta *
                gameSpeed
        );

        simulateCombat(
            delta *
                gameSpeed
        );

        updateGameDate(
            delta
        );
    }

    updateSelectionVisual();
    updateBattleStatus();

    updateMiniMap();

    renderer.render(
        scene,
        camera
    );
}

/* =========================================================
   RESIZE
========================================================= */

function onResize() {
    if (!camera || !renderer) {
        return;
    }

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );
}

/* =========================================================
   KEYBOARD COMMANDS
========================================================= */

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key ===
            "Escape"
        ) {
            moveMode = false;
            closeMainPanel();
            closeCountryModal();
        }

        if (
            event.code ===
            "Space"
        ) {
            event.preventDefault();
            togglePause();
        }

        if (
            event.key ===
            "1"
        ) {
            gameSpeed = 1;
            $("speedBtn")
                .textContent =
                "1×";
        }

        if (
            event.key ===
            "2"
        ) {
            gameSpeed = 2;
            $("speedBtn")
                .textContent =
                "2×";
        }

        if (
            event.key ===
            "4"
        ) {
            gameSpeed = 4;
            $("speedBtn")
                .textContent =
                "4×";
        }

        if (
            event.key ===
            "m"
        ) {
            startMoveMode();
        }

        if (
            event.key ===
            "a"
        ) {
            attackSelected();
        }

        if (
            event.key ===
            "d"
        ) {
            defendSelected();
        }

        if (
            event.key ===
            "h"
        ) {
            holdSelected();
        }
    }
);

/* =========================================================
   CONTINUOUS UNIT CAMERA FOCUS
========================================================= */

setInterval(() => {
    if (selectedUnit) {
        updateUnitPanel();
    }
}, 500);