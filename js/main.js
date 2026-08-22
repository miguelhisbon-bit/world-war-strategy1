import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   FULL UPDATED MAIN.JS
========================================================= */

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

const SAVE_KEY = "world_war_strategy_save_v4";

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

function updateLoading(progress, text) {
    const bar = $("loadingProgress");
    const status = $("loadingStatus");

    if (bar) {
        bar.style.width = `${Math.min(100, progress)}%`;
    }

    if (status) {
        status.textContent = text;
    }
}

function hideLoading() {
    const loading = $("loadingScreen");

    if (loading) {
        loading.classList.add("hidden");
    }
}


/* =========================================================
   INIT
========================================================= */

async function init() {
    try {
        updateLoading(10, "Initializing command system...");
        await sleep(120);

        createScene();

        updateLoading(28, "Generating battlefield...");
        await sleep(120);

        createTerrain();

        updateLoading(50, "Deploying military forces...");
        await sleep(120);

        createUnits();

        updateLoading(68, "Preparing command interface...");
        await sleep(120);

        setupUI();

        updateLoading(82, "Loading campaign systems...");

        loadGame();

        updateLoading(95, "Finalizing battlefield...");
        await sleep(120);

        startGameLoop();

        updateLoading(100, "Battlefield ready.");

        setTimeout(hideLoading, 400);

    } catch (error) {
        console.error("GAME INIT ERROR:", error);

        hideLoading();

        showToast(
            "Recovery mode activated."
        );
    }
}


/* =========================================================
   THREE.JS SCENE
========================================================= */

function createScene() {

    const canvas = $("gameCanvas");

    if (!canvas) {
        throw new Error(
            "gameCanvas element not found."
        );
    }

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x081016);

    scene.fog =
        new THREE.Fog(
            0x081016,
            75,
            430
        );


    camera =
        new THREE.PerspectiveCamera(
            55,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1000
        );

    camera.position.set(
        0,
        82,
        86
    );


    renderer =
        new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            1.8
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    const hemisphere =
        new THREE.HemisphereLight(
            0xb9c6c8,
            0x182018,
            1.45
        );

    scene.add(hemisphere);


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

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;

    scene.add(sun);


    worldGroup =
        new THREE.Group();

    unitGroup =
        new THREE.Group();

    effectsGroup =
        new THREE.Group();


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

    controls.minPolarAngle =
        0.16;

    controls.target.set(
        0,
        0,
        0
    );


    clock =
        new THREE.Clock();


    window.addEventListener(
        "resize",
        onResize
    );


    renderer.domElement.addEventListener(
        "pointerdown",
        handleWorldClick
    );
}


/* =========================================================
   TERRAIN
========================================================= */

function createTerrain() {

    const geometry =
        new THREE.PlaneGeometry(
            360,
            360,
            90,
            90
        );

    const vertices =
        geometry.attributes.position;


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


    geometry.computeVertexNormals();


    ground =
        new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: 0x39483b,
                roughness: 0.96,
                metalness: 0.02
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
            0x5c674e,
            0x263229
        );

    grid.position.y = 0.2;

    grid.material.opacity = 0.16;

    grid.material.transparent = true;

    worldGroup.add(grid);


    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                500,
                500
            ),
            new THREE.MeshStandardMaterial({
                color: 0x102c39,
                transparent: true,
                opacity: 0.42,
                roughness: 0.2,
                metalness: 0.1
            })
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

    for (
        let i = 0;
        i < 28;
        i++
    ) {

        const mountain =
            new THREE.Mesh(
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


        mountain.position.set(
            (Math.random() - 0.5) * 300,
            5,
            (Math.random() - 0.5) * 300
        );


        mountain.rotation.y =
            Math.random() * Math.PI;


        mountain.castShadow = true;

        worldGroup.add(
            mountain
        );
    }
}


/* =========================================================
   ROADS
========================================================= */

function createRoads() {

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const road =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    100,
                    0.08,
                    2.5
                ),
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


        road.rotation.y =
            Math.random() * Math.PI;


        worldGroup.add(
            road
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

        const marker =
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


        marker.rotation.x =
            -Math.PI / 2;

        marker.position.set(
            (Math.random() - 0.5) * 280,
            0.4,
            (Math.random() - 0.5) * 280
        );


        worldGroup.add(
            marker
        );
    }
}


/* =========================================================
   UNITS
========================================================= */

function createUnits() {

    units = [];

    const initialUnits = [

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


    initialUnits.forEach(
        data => {

            createMilitaryUnit(
                data[0],
                data[1],
                data[2],
                data[3],
                data[4]
            );
        }
    );


    refreshMiniMap();
}


/* =========================================================
   MILITARY UNIT
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


    const color =
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
            );


    const material =
        new THREE.MeshStandardMaterial({
            color,
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
                material
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


    } else if (
        type === "INFANTRY"
    ) {

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

        head.castShadow = true;

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


    } else {

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

        group.add(fuselage);


        const wing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    5,
                    0.2,
                    1.3
                ),
                material
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

        cooldown: 0,

        experience: 0,

        destination: null,

        state: "READY"
    };


    group.userData.unit =
        unit;


    const label =
        createUnitLabel(
            name,
            friendly
        );


    group.add(label);

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


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    const sprite =
        new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: texture,
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


/* =========================================================
   PANELS
========================================================= */

function setupPanelButtons() {

    document
        .querySelectorAll(
            ".panel-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".panel-button"
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


                    openPanel(
                        button.dataset.panel
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


function openPanel(type) {

    const panel =
        $("mainPanel");

    const title =
        $("panelTitle");

    const kicker =
        $("panelKicker");

    const content =
        $("panelContent");


    if (!panel ||
        !title ||
        !kicker ||
        !content) {
        return;
    }


    panel.classList.add(
        "open"
    );


    const data = {

        overview: [
            "World Overview",
            "STRATEGIC COMMAND",
            `
            <div class="info-card">
                <h3>Global Situation</h3>
                <p>
                    Command your army,
                    manage logistics and
                    destroy enemy forces.
                </p>
            </div>

            <div class="info-card">
                <h3>Military Strength</h3>

                ${stat(
                    "Friendly Units",
                    units.filter(
                        u =>
                            u.friendly &&
                            u.state !==
                            "DESTROYED"
                    ).length
                )}

                ${stat(
                    "Enemy Units",
                    units.filter(
                        u =>
                            !u.friendly &&
                            u.state !==
                            "DESTROYED"
                    ).length
                )}

                ${stat(
                    "Active Fronts",
                    units.filter(
                        u =>
                            u.state ===
                            "ATTACKING"
                    ).length
                )}
            </div>

            <div class="info-card">
                <h3>War Status</h3>

                ${stat(
                    "Threat",
                    "HIGH"
                )}

                ${stat(
                    "Campaign Year",
                    gameYear
                )}
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
                    .filter(
                        u =>
                            u.friendly &&
                            u.state !==
                            "DESTROYED"
                    )
                    .map(
                        u =>
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

            <button
                class="action-btn"
                id="reinforceArmy">
                REQUEST REINFORCEMENTS
            </button>
            `
        ],


        economy: [
            "National Economy",
            "ECONOMIC COMMAND",
            `
            <div class="info-card">

                <h3>National Resources</h3>

                ${stat(
                    "Treasury",
                    Math.floor(money)
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
                    Math.floor(manpower)
                )}

            </div>

            <button
                class="action-btn"
                id="economyBoost">
                INVEST IN INDUSTRY — $1000
            </button>
            `
        ],


        production: [
            "Military Production",
            "INDUSTRIAL COMMAND",
            `
            <div class="info-card">

                <h3>Production</h3>

                ${stat(
                    "Tank Program",
                    "ACTIVE"
                )}

                ${stat(
                    "Aircraft Program",
                    "STANDBY"
                )}

                ${stat(
                    "Infantry Equipment",
                    "ACTIVE"
                )}

            </div>

            <button
                class="action-btn"
                id="produceTank">
                BUILD TANK — $800 / 80 STEEL
            </button>
            `
        ],


        research: [
            "Technology",
            "RESEARCH COMMAND",
            `
            <div class="info-card">

                <h3>Armored Warfare Doctrine</h3>

                <div
                    class="progress"
                    style="margin-top:8px">
                    <i style="width:72%"></i>
                </div>

                <p>
                    Improved armor and battlefield
                    organization.
                </p>

            </div>

            <button
                class="action-btn"
                id="researchBtn">
                RESEARCH TECHNOLOGY — $1500
            </button>
            `
        ],


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

            </div>
            `
        ],


        intel: [
            "Intelligence",
            "INTELLIGENCE COMMAND",
            `
            <div class="info-card">

                <h3>Enemy Intelligence</h3>

                ${stat(
                    "Enemy Army",
                    "MEDIUM"
                )}

                ${stat(
                    "Enemy Armor",
                    "HIGH"
                )}

                ${stat(
                    "Enemy Air Force",
                    "MEDIUM"
                )}

                ${stat(
                    "Threat Level",
                    "HIGH"
                )}

            </div>

            <button
                class="action-btn"
                id="intelBtn">
                SCAN ENEMY POSITIONS
            </button>
            `
        ],


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
        .querySelectorAll(
            ".unit-select"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
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
                    }
                );
            }
        );


    const economyBoost =
        $("economyBoost");


    if (economyBoost) {

        economyBoost.onclick =
            () => {

                if (money < 1000) {

                    showToast(
                        "Insufficient funds."
                    );

                    return;
                }


                money -= 1000;

                steel += 150;

                updateResources();

                saveGame();

                showToast(
                    "Industrial investment completed."
                );
            };
    }


    const produceTankButton =
        $("produceTank");


    if (produceTankButton) {

        produceTankButton.onclick =
            produceTank;
    }


    const reinforceButton =
        $("reinforceArmy");


    if (reinforceButton) {

        reinforceButton.onclick =
            reinforceArmy;
    }


    const researchButton =
        $("researchBtn");


    if (researchButton) {

        researchButton.onclick =
            () => {

                if (money < 1500) {

                    showToast(
                        "Insufficient funds."
                    );

                    return;
                }


                money -= 1500;


                units.forEach(
                    unit => {

                        if (unit.friendly) {

                            unit.strength =
                                Math.min(
                                    100,
                                    unit.strength + 4
                                );

                            unit.experience += 5;
                        }
                    }
                );


                updateResources();

                saveGame();

                showToast(
                    "New military technology researched."
                );
            };
    }


    const intelButton =
        $("intelBtn");


    if (intelButton) {

        intelButton.onclick =
            () => {

                const enemies =
                    units.filter(
                        u =>
                            !u.friendly &&
                            u.state !==
                            "DESTROYED"
                    );


                if (!enemies.length) {

                    showToast(
                        "No enemy forces detected."
                    );

                    return;
                }


                showToast(
                    `${enemies.length} enemy units detected.`
                );

                addBattleLog(
                    "Intelligence scan completed."
                );
            };
    }


    const toggleFog =
        $("toggleFog");


    if (toggleFog) {

        toggleFog.onclick =
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
                        ? "Battlefield fog enabled."
                        : "Battlefield fog disabled."
                );
            };
    }


    const reset =
        $("resetBtn");


    if (reset) {
        reset.onclick =
            resetCamera;
    }


    const save =
        $("saveBtn");


    if (save) {

        save.onclick =
            () => {

                saveGame();

                showToast(
                    "Campaign saved."
                );
            };
    }
}


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(unit) {

    if (
        !unit ||
        unit.state ===
        "DESTROYED"
    ) {
        return;
    }


    selectedUnit =
        unit;


    const panel =
        $("unitPanel");


    if (panel) {
        panel.classList.add(
            "open"
        );
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

    if (!selectedUnit)
        return;


    const u =
        selectedUnit;


    const stats =
        $("unitStats");


    if (!stats)
        return;


    stats.innerHTML = `

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
            <span>Attack</span>
            <b>${u.attack}</b>
        </div>


        <div class="stat-row">
            <span>Range</span>
            <b>${u.range}</b>
        </div>


        <div class="stat-row">
            <span>Speed</span>
            <b>${u.speed} km/h</b>
        </div>


        <div class="stat-row">
            <span>Experience</span>
            <b>${Math.round(u.experience)}</b>
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

    if ($("moveCommand")) {

        $("moveCommand").onclick =
            () => {

                if (!selectedUnit) {

                    showToast(
                        "Select a unit first."
                    );

                    return;
                }


                if (
                    selectedUnit.state ===
                    "DESTROYED"
                ) {
                    return;
                }


                moveMode = true;

                attackMode = false;


                showToast(
                    "Tap battlefield to select destination."
                );
            };
    }


    if ($("attackCommand")) {

        $("attackCommand").onclick =
            () => {

                if (!selectedUnit) {

                    showToast(
                        "Select a unit first."
                    );

                    return;
                }


                attackMode = true;

                moveMode = false;


                showToast(
                    "Select an enemy unit."
                );
            };
    }


    if ($("defendCommand")) {

        $("defendCommand").onclick =
            () => {

                if (!selectedUnit)
                    return;


                selectedUnit.destination =
                    null;

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
    }


    if ($("holdCommand")) {

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
    }


    if ($("retreatCommand")) {

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
    }


    if ($("airstrikeCommand")) {

        $("airstrikeCommand").onclick =
            () => {

                if (!selectedUnit)
                    return;


                if (
                    selectedUnit.type !==
                    "AIR"
                ) {

                    showToast(
                        "Only aircraft can perform airstrikes."
                    );

                    return;
                }


                performAirstrike();
            };
    }
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
        unit => {

            if (
                unit.state ===
                "DESTROYED"
            ) {
                return;
            }


            unit.object.traverse(
                child => {

                    if (
                        child.isMesh ||
                        child.isSprite
                    ) {

                        objects.push(
                            child
                        );
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

            object =
                object.parent;
        }


        if (
            object &&
            object.userData.unit
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


                attackMode =
                    false;


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


        if (groundHits.length) {

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


            moveMode = false;


            createDestinationMarker(
                point
            );


            showToast(
                `${selectedUnit.name} moving.`
            );
        }
    }
}


/* =========================================================
   DESTINATION MARKER
========================================================= */

function createDestinationMarker(
    position
) {

    const marker =
        new THREE.Mesh(
            new THREE.RingGeometry(
                1.2,
                1.6,
                24
            ),
            new THREE.MeshBasicMaterial({
                color: 0xd5ad55,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            })
        );


    marker.rotation.x =
        -Math.PI / 2;


    marker.position.copy(
        position
    );


    marker.position.y += 0.6;


    effectsGroup.add(
        marker
    );


    setTimeout(
        () => {

            effectsGroup.remove(
                marker
            );

            marker.geometry.dispose();

            marker.material.dispose();

        },
        1800
    );
}


/* =========================================================
   ATTACK
========================================================= */

function attackUnit(
    attacker,
    target
) {

    if (
        !attacker ||
        !target ||
        target.state ===
        "DESTROYED"
    ) {
        return;
    }


    if (
        attacker.friendly ===
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
        attacker.range
    ) {

        showToast(
            `Target out of range (${Math.round(distance)}).`
        );


        attacker.destination =
            new THREE.Vector3(
                target.object.position.x,
                attacker.object.position.y,
                target.object.position.z
            );


        attacker.state =
            "ADVANCING";


        return;
    }


    if (
        attacker.cooldown >
        0
    ) {

        showToast(
            "Weapon reloading..."
        );

        return;
    }


    attacker.state =
        "ATTACKING";


    target.state =
        "UNDER ATTACK";


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
                Math.random() *
                0.55
            ) *
            (attacker.organization / 100) *
            (attacker.morale / 100)
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


    attacker.experience +=
        damage * 0.12;


    createExplosion(
        target.object.position.clone()
    );


    addBattleLog(
        `${attacker.name} attacked ${target.name}.`
    );


    if (
        selectedUnit === attacker
    ) {
        updateUnitStats();
    }


    const status =
        $("battleStatus");


    if (status) {

        status.textContent =
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


    checkVictory();
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

        showToast(
            "No enemy targets."
        );

        return;
    }


    if (
        selectedUnit.cooldown >
        0
    ) {

        showToast(
            "Aircraft reloading..."
        );

        return;
    }


    const target =
        enemies[
            Math.floor(
                Math.random() *
                enemies.length
            )
        ];


    selectedUnit.cooldown =
        7;


    const position =
        target.object.position.clone();


    position.y = 1;


    createExplosion(
        position
    );


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


    target.morale =
        Math.max(
            0,
            target.morale - 12
        );


    selectedUnit.experience +=
        8;


    addBattleLog(
        `${selectedUnit.name} launched an airstrike on ${target.name}.`
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


    checkVictory();
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


    function animateExplosion(
        now
    ) {

        const elapsed =
            now - start;


        const progress =
            Math.min(
                elapsed / 600,
                1
            );


        explosion.scale.setScalar(
            1 +
            progress * 5
        );


        material.opacity =
            0.9 *
            (1 - progress);


        if (
            progress < 1
        ) {

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

function destroyUnit(
    unit
) {

    if (!unit)
        return;


    unit.state =
        "DESTROYED";


    unit.destination =
        null;


    unit.object.visible =
        false;


    addBattleLog(
        `${unit.name} has been destroyed.`
    );


    if (
        selectedUnit === unit
    ) {

        selectedUnit =
            null;


        if ($("unitPanel")) {

            $("unitPanel")
                .classList.remove(
                    "open"
                );
        }
    }


    refreshMiniMap();

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

    if (!gameRunning)
        return;


    const scaledDelta =
        delta *
        gameSpeed;


    units.forEach(
        unit => {

            if (
                unit.state ===
                "DESTROYED"
            ) {
                return;
            }


            if (
                unit.cooldown >
                0
            ) {

                unit.cooldown =
                    Math.max(
                        0,
                        unit.cooldown -
                        scaledDelta
                    );
            }


            if (
                unit.destination
            ) {

                const object =
                    unit.object;


                const target =
                    unit.destination;


                const distance =
                    object.position.distanceTo(
                        target
                    );


                if (
                    distance <
                    0.8
                ) {

                    unit.destination =
                        null;


                    unit.state =
                        "READY";

                } else {

                    const direction =
                        new THREE.Vector3()
                            .subVectors(
                                target,
                                object.position
                            )
                            .normalize();


                    const speed =
                        unit.speed *
                        0.055 *
                        scaledDelta;


                    object.position.add(
                        direction.multiplyScalar(
                            Math.min(
                                speed,
                                distance
                            )
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
                            0.004 *
                            scaledDelta
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
        }
    );


    lastIncomeTick += delta;


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


    lastAiTick += delta;


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
                enemy.range
            ) {

                enemy.state =
                    "ATTACKING";


                if (
                    enemy.cooldown <=
                    0
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

                const point =
                    target.object.position
                        .clone();


                point.x +=
                    (Math.random() - 0.5) * 8;


                point.z +=
                    (Math.random() - 0.5) * 8;


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
        attacker.cooldown >
        0
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
                Math.random() *
                0.55
            ) *
            (attacker.organization / 100) *
            (attacker.morale / 100)
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


    createExplosion(
        target.object.position.clone()
    );


    addBattleLog(
        `${attacker.name} attacked ${target.name}.`
    );


    if (
        target.hp <=
        0
    ) {

        destroyUnit(
            target
        );
    }


    checkVictory();
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


    const friendlies =
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


        if ($("statusText")) {

            $("statusText")
                .textContent =
                "VICTORY";
        }


        showToast(
            "VICTORY — Enemy forces eliminated."
        );


    } else if (
        !friendlies.length
    ) {

        gameRunning =
            false;


        if ($("statusText")) {

            $("statusText")
                .textContent =
                "DEFEAT";
        }


        showToast(
            "DEFEAT — All friendly forces destroyed."
        );
    }
}


/* =========================================================
   PRODUCTION
========================================================= */

function produceTank() {

    if (
        money < 800 ||
        steel < 80
    ) {

        showToast(
            "Need $800 and 80 steel."
        );

        return;
    }


    money -= 800;

    steel -= 80;


    const existing =
        units.filter(
            unit =>
                unit.friendly &&
                unit.type === "TANK"
        );


    const base =
        existing.find(
            unit =>
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
        `Reserve Tank ${existing.length + 1}`,
        "TANK",
        x,
        z,
        true
    );


    updateResources();

    refreshMiniMap();

    saveGame();


    showToast(
        "New tank deployed."
    );
}


/* =========================================================
   REINFORCEMENT
========================================================= */

function reinforceArmy() {

    if (
        manpower < 500 ||
        food < 100
    ) {

        showToast(
            "Need 500 manpower and 100 food."
        );

        return;
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

    saveGame();


    showToast(
        "Reinforcements arrived."
    );
}


/* =========================================================
   SPEED
========================================================= */

function setupSpeed() {

    const button =
        $("speedBtn");


    if (!button)
        return;


    button.onclick =
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


            button.textContent =
                `${gameSpeed}×`;
        };
}


/* =========================================================
   PAUSE
========================================================= */

function setupPause() {

    const button =
        $("pauseBtn");


    if (!button)
        return;


    button.onclick =
        () => {

            gameRunning =
                !gameRunning;


            button.textContent =
                gameRunning
                    ? "Ⅱ"
                    : "▶";


            if ($("statusText")) {

                $("statusText")
                    .textContent =
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
        .querySelectorAll(
            ".country-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        selectCountry(
                            card.dataset.country
                        );
                    }
                );
            }
        );


    if ($("closeCountryModal")) {

        $("closeCountryModal")
            .onclick =
            () => {

                if ($("countryModal")) {

                    $("countryModal")
                        .classList.remove(
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


    if ($("countryFlag")) {

        $("countryFlag")
            .textContent =
            country.flag;
    }


    if ($("countryName")) {

        $("countryName")
            .textContent =
            country.name;
    }


    updateResources();


    if ($("countryModal")) {

        $("countryModal")
            .classList.remove(
                "open"
            );
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
            "Enemy forces automatically advance, choose targets and attack."
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

                if ($("mainPanel")) {

                    $("mainPanel")
                        .classList.remove(
                            "open"
                        );
                }
            };
    }


    if ($("closeUnit")) {

        $("closeUnit").onclick =
            () => {

                if ($("unitPanel")) {

                    $("unitPanel")
                        .classList.remove(
                            "open"
                        );
                }


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


    if (!container)
        return;


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


            const x =
                Math.max(
                    3,
                    Math.min(
                        97,
                        50 +
                        unit.object.position.x /
                        3
                    )
                );


            const y =
                Math.max(
                    3,
                    Math.min(
                        97,
                        50 +
                        unit.object.position.z /
                        3
                    )
                );


            dot.style.cssText =
                `
                position:absolute;
                width:6px;
                height:6px;
                border-radius:50%;
                left:${x}%;
                top:${y}%;
                background:${unit.friendly
                    ? "#55d18a"
                    : "#e45d5d"};
                box-shadow:0 0 5px currentColor;
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
        gameDay >
        30
    ) {

        gameDay = 1;

        gameMonth++;


        if (
            gameMonth >
            12
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

        $("gameDate")
            .textContent =
            `${gameYear} • ${
                months[gameMonth - 1]
            } ${String(gameDay).padStart(2, "0")}`;
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


    set("money", money);

    set("oil", oil);

    set("steel", steel);

    set("food", food);

    set("manpower", manpower);
}


/* =========================================================
   BATTLE LOG
========================================================= */

function addBattleLog(
    message
) {

    battleLog.unshift(
        `[${gameYear}-${
            String(gameMonth).padStart(2, "0")
        }-${
            String(gameDay).padStart(2, "0")
        }] ${message}`
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
                    line =>
                        `<div>${line}</div>`
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
            SAVE_KEY,
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
   LOAD GAME
========================================================= */

function loadGame() {

    try {

        const raw =
            localStorage.getItem(
                SAVE_KEY
            );


        if (!raw)
            return;


        const data =
            JSON.parse(raw);


        if (
            data.currentCountry &&
            countries[data.currentCountry]
        ) {

            currentCountry =
                data.currentCountry;
        }


        const resources = [
            "money",
            "oil",
            "steel",
            "food",
            "manpower",
            "gameDay",
            "gameMonth",
            "gameYear"
        ];


        resources.forEach(
            key => {

                if (
                    Number.isFinite(
                        data[key]
                    )
                ) {

                    if (key === "money")
                        money = data[key];

                    if (key === "oil")
                        oil = data[key];

                    if (key === "steel")
                        steel = data[key];

                    if (key === "food")
                        food = data[key];

                    if (key === "manpower")
                        manpower = data[key];

                    if (key === "gameDay")
                        gameDay = data[key];

                    if (key === "gameMonth")
                        gameMonth = data[key];

                    if (key === "gameYear")
                        gameYear = data[key];
                }
            }
        );


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


                    if (!unit)
                        return;


                    [
                        "hp",
                        "organization",
                        "morale",
                        "strength",
                        "experience"
                    ].forEach(
                        key => {

                            if (
                                Number.isFinite(
                                    saved[key]
                                )
                            ) {

                                unit[key] =
                                    saved[key];
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
                                : unit.object.position.y,
                            saved.z
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


        if (
            Array.isArray(
                data.battleLog
            )
        ) {

            battleLog =
                data.battleLog;
        }


        updateResources();

        updateDate();

        refreshMiniMap();

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


        if (controls) {
            controls.update();
        }


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


    if (!toast)
        return;


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

    if (
        !camera ||
        !renderer
    ) {
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
}


/* =========================================================
   ERROR PROTECTION
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


/* =========================================================
   LOADING RECOVERY
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

            console.warn(
                "Loading timeout — recovery mode."
            );


            hideLoading();


            showToast(
                "Battlefield loaded in recovery mode."
            );
        }

    },
    10000
);


/* =========================================================
   START GAME
========================================================= */

init();