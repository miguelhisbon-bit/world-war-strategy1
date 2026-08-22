import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   Main Game Engine
========================================================= */

const canvas = document.getElementById("gameCanvas");

/* =========================================================
   GAME STATE
========================================================= */

const game = {
    running: true,
    speed: 1,
    day: 1,
    month: 1,
    year: 1940,

    country: "USA",

    resources: {
        money: 12500,
        oil: 850,
        steel: 1250,
        food: 1600,
        manpower: 85000
    },

    income: {
        money: 55,
        oil: 8,
        steel: 12,
        food: 18,
        manpower: 120
    },

    selectedUnit: null,
    movingUnit: null,

    cameraStart: {
        x: 0,
        y: 42,
        z: 48
    },

    research: {
        infantry: 0,
        armor: 0,
        air: 0,
        naval: 0,
        industry: 0
    },

    production: {
        queue: []
    },

    diplomacy: {
        USA: 70,
        GERMANY: -30,
        UK: 65,
        JAPAN: -20,
        USSR: 20,
        FRANCE: 55
    },

    tutorialStep: 0
};


/* =========================================================
   COUNTRY DATA
========================================================= */

const countries = {

    USA: {
        name: "United States",
        flag: "🇺🇸",
        color: 0x3d73a8,
        money: 12500,
        oil: 850,
        steel: 1250,
        food: 1600,
        manpower: 85000
    },

    GERMANY: {
        name: "Germany",
        flag: "🇩🇪",
        color: 0x555555,
        money: 10500,
        oil: 620,
        steel: 1100,
        food: 1150,
        manpower: 92000
    },

    UK: {
        name: "United Kingdom",
        flag: "🇬🇧",
        color: 0x315b9b,
        money: 11200,
        oil: 700,
        steel: 1050,
        food: 1200,
        manpower: 76000
    },

    JAPAN: {
        name: "Japan",
        flag: "🇯🇵",
        color: 0xa53b3b,
        money: 9000,
        oil: 430,
        steel: 850,
        food: 980,
        manpower: 81000
    },

    USSR: {
        name: "Soviet Union",
        flag: "☭",
        color: 0x9b3434,
        money: 9800,
        oil: 760,
        steel: 1400,
        food: 1300,
        manpower: 130000
    },

    FRANCE: {
        name: "France",
        flag: "🇫🇷",
        color: 0x4d69a5,
        money: 8500,
        oil: 450,
        steel: 900,
        food: 1150,
        manpower: 72000
    }
};


/* =========================================================
   THREE.JS SETUP
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x071017);

scene.fog = new THREE.FogExp2(
    0x071017,
    0.012
);

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(
    game.cameraStart.x,
    game.cameraStart.y,
    game.cameraStart.z
);

const renderer = new THREE.WebGLRenderer({
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
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight = new THREE.HemisphereLight(
    0xa9b6b0,
    0x151b1e,
    2
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
    0xffe0a3,
    2.2
);

sun.position.set(
    -30,
    80,
    30
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);


/* =========================================================
   CAMERA CONTROLS
========================================================= */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.minDistance = 12;
controls.maxDistance = 110;

controls.maxPolarAngle = Math.PI / 2.15;
controls.minPolarAngle = 0.35;

controls.target.set(0, 0, 0);


/* =========================================================
   TERRAIN
========================================================= */

const terrainGroup = new THREE.Group();

scene.add(terrainGroup);

const terrainSize = 100;

const terrainGeometry = new THREE.PlaneGeometry(
    terrainSize,
    terrainSize,
    50,
    50
);

const terrainMaterial = new THREE.MeshStandardMaterial({
    color: 0x27382e,
    roughness: 0.95,
    metalness: 0.05
});

const terrain = new THREE.Mesh(
    terrainGeometry,
    terrainMaterial
);

terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;

terrainGroup.add(terrain);


/* =========================================================
   TERRAIN DETAIL
========================================================= */

function createTerrainDetails() {

    const detailGroup = new THREE.Group();

    for (let i = 0; i < 100; i++) {

        const size = Math.random() * 1.5 + 0.3;

        const geo = new THREE.ConeGeometry(
            size,
            size * 2.5,
            5
        );

        const mat = new THREE.MeshStandardMaterial({
            color:
                Math.random() > 0.5
                    ? 0x314834
                    : 0x40553d
        });

        const tree = new THREE.Mesh(
            geo,
            mat
        );

        tree.position.set(
            (Math.random() - 0.5) * 90,
            size,
            (Math.random() - 0.5) * 90
        );

        tree.castShadow = true;

        detailGroup.add(tree);
    }

    terrainGroup.add(detailGroup);
}

createTerrainDetails();


/* =========================================================
   ROADS
========================================================= */

function createRoad(x, z, length, rotation = 0) {

    const geo = new THREE.PlaneGeometry(
        2.2,
        length
    );

    const mat = new THREE.MeshStandardMaterial({
        color: 0x3b3931,
        roughness: 1
    });

    const road = new THREE.Mesh(
        geo,
        mat
    );

    road.rotation.x = -Math.PI / 2;

    road.rotation.z = rotation;

    road.position.set(
        x,
        0.025,
        z
    );

    terrainGroup.add(road);
}

createRoad(0, 0, 85, 0);
createRoad(-22, 5, 65, Math.PI / 2);
createRoad(23, -8, 60, Math.PI / 2);


/* =========================================================
   BORDERS
========================================================= */

function createBorder(x, z, width, depth) {

    const geo = new THREE.BoxGeometry(
        width,
        0.05,
        depth
    );

    const mat = new THREE.MeshBasicMaterial({
        color: 0x9f8a4a,
        transparent: true,
        opacity: 0.5
    });

    const border = new THREE.Mesh(
        geo,
        mat
    );

    border.position.set(
        x,
        0.08,
        z
    );

    terrainGroup.add(border);
}

createBorder(0, -20, 90, 0.25);
createBorder(0, 20, 90, 0.25);


/* =========================================================
   UNIT SYSTEM
========================================================= */

const units = [];
const unitGroup = new THREE.Group();

scene.add(unitGroup);

let unitCounter = 1;

const unitTypes = {

    infantry: {
        name: "Infantry Division",
        icon: "🪖",
        color: 0x6f826a,
        hp: 100,
        attack: 35,
        defense: 45,
        speed: 0.045,
        manpower: 10000
    },

    tank: {
        name: "Armored Division",
        icon: "🛡️",
        color: 0x4c5543,
        hp: 130,
        attack: 70,
        defense: 55,
        speed: 0.07,
        manpower: 5000
    },

    artillery: {
        name: "Artillery Division",
        icon: "💥",
        color: 0x6c6653,
        hp: 90,
        attack: 80,
        defense: 25,
        speed: 0.035,
        manpower: 3000
    },

    aircraft: {
        name: "Air Wing",
        icon: "✈️",
        color: 0x71818a,
        hp: 80,
        attack: 95,
        defense: 20,
        speed: 0.12,
        manpower: 1500
    }
};


/* =========================================================
   CREATE UNIT
========================================================= */

function createUnit(type, x, z, owner = game.country) {

    const data = unitTypes[type];

    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(
        type === "tank" ? 1.8 : 1.3,
        0.7,
        type === "tank" ? 1.9 : 1.1
    );

    const bodyMat = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.8
    });

    const body = new THREE.Mesh(
        bodyGeo,
        bodyMat
    );

    body.position.y = 0.45;

    body.castShadow = true;

    group.add(body);

    if (type === "tank") {

        const turretGeo =
            new THREE.CylinderGeometry(
                0.55,
                0.65,
                0.35,
                12
            );

        const turret =
            new THREE.Mesh(
                turretGeo,
                bodyMat
            );

        turret.position.y = 0.9;

        turret.castShadow = true;

        group.add(turret);

        const barrel =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.18,
                    0.18,
                    1.5
                ),
                bodyMat
            );

        barrel.position.set(
            0,
            0.92,
            -0.85
        );

        group.add(barrel);
    }

    if (type === "aircraft") {

        body.scale.set(
            1.7,
            0.35,
            2.5
        );

        const wing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.2,
                    0.12,
                    0.45
                ),
                bodyMat
            );

        wing.position.y = 0.55;

        group.add(wing);
    }

    const ownerData = countries[owner];

    const ringGeo =
        new THREE.RingGeometry(
            1.1,
            1.25,
            32
        );

    const ringMat =
        new THREE.MeshBasicMaterial({
            color: ownerData.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

    const ring =
        new THREE.Mesh(
            ringGeo,
            ringMat
        );

    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;

    group.add(ring);

    group.position.set(
        x,
        0,
        z
    );

    unitGroup.add(group);

    const unit = {

        id: unitCounter++,

        type,

        owner,

        name:
            data.name +
            " " +
            String(unitCounter).padStart(2, "0"),

        mesh: group,

        hp: data.hp,
        maxHp: data.hp,

        morale: 100,

        experience:
            Math.floor(Math.random() * 25),

        attack: data.attack,
        defense: data.defense,

        speed: data.speed,

        manpower: data.manpower,

        status: "READY",

        target: null,

        selected: false,

        destination: null
    };

    units.push(unit);

    return unit;
}


/* =========================================================
   INITIAL ARMIES
========================================================= */

function createInitialArmy() {

    const armyPositions = [
        ["infantry", -20, -5],
        ["infantry", -15, 0],
        ["tank", -10, -7],
        ["artillery", -5, 2],
        ["infantry", 5, -5],
        ["tank", 10, 3],
        ["aircraft", 15, -2]
    ];

    armyPositions.forEach(
        ([type, x, z]) => {
            createUnit(
                type,
                x,
                z,
                game.country
            );
        }
    );

    /* enemy */
    createUnit(
        "infantry",
        28,
        12,
        "GERMANY"
    );

    createUnit(
        "tank",
        33,
        8,
        "GERMANY"
    );

    createUnit(
        "artillery",
        38,
        15,
        "GERMANY"
    );
}

createInitialArmy();


/* =========================================================
   SELECTION SYSTEM
========================================================= */

const raycaster = new THREE.Raycaster();

const pointer = new THREE.Vector2();

function updatePointer(event) {

    const rect =
        renderer.domElement.getBoundingClientRect();

    pointer.x =
        ((event.clientX - rect.left) /
            rect.width) *
            2 -
        1;

    pointer.y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) *
            2 +
        1;
}

renderer.domElement.addEventListener(
    "pointerdown",
    handlePointerDown
);

function handlePointerDown(event) {

    if (
        event.target !==
        renderer.domElement
    ) return;

    updatePointer(event);

    raycaster.setFromCamera(
        pointer,
        camera
    );

    const objects = [];

    units.forEach(unit => {

        unit.mesh.traverse(
            child => {

                if (child.isMesh)
                    objects.push(child);

            }
        );

    });

    const hits =
        raycaster.intersectObjects(
            objects,
            true
        );

    if (hits.length) {

        let selected = null;

        for (const unit of units) {

            let found = false;

            unit.mesh.traverse(
                child => {

                    if (
                        child ===
                        hits[0].object
                    ) found = true;

                }
            );

            if (found) {
                selected = unit;
                break;
            }
        }

        if (selected) {

            if (
                selected.owner ===
                game.country
            ) {

                selectUnit(selected);

            } else if (
                game.selectedUnit
            ) {

                attackUnit(selected);
            }

            return;
        }
    }

    /* terrain click = move */

    if (game.selectedUnit) {

        const terrainHit =
            raycaster.intersectObject(
                terrain
            );

        if (terrainHit.length) {

            const point =
                terrainHit[0].point;

            moveSelectedUnit(
                point.x,
                point.z
            );
        }
    }
}


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(unit) {

    if (game.selectedUnit) {

        game.selectedUnit.selected = false;

        setUnitHighlight(
            game.selectedUnit,
            false
        );
    }

    game.selectedUnit = unit;

    unit.selected = true;

    setUnitHighlight(
        unit,
        true
    );

    showUnitPanel(unit);

    showToast(
        `${unit.name} selected`
    );
}


/* =========================================================
   UNIT HIGHLIGHT
========================================================= */

function setUnitHighlight(
    unit,
    active
) {

    unit.mesh.traverse(
        object => {

            if (
                object.isMesh &&
                object.material
            ) {

                if (
                    active
                ) {

                    object.material.emissive =
                        new THREE.Color(
                            0x8f7430
                        );

                    object.material.emissiveIntensity =
                        0.7;

                } else {

                    object.material.emissive =
                        new THREE.Color(
                            0x000000
                        );

                    object.material.emissiveIntensity =
                        0;

                }
            }

        }
    );
}


/* =========================================================
   MOVE SYSTEM
========================================================= */

function moveSelectedUnit(
    x,
    z
) {

    const unit =
        game.selectedUnit;

    if (!unit) return;

    unit.destination =
        new THREE.Vector3(
            x,
            0,
            z
        );

    unit.status = "MOVING";

    game.movingUnit = unit;

    showToast(
        `${unit.name} moving`
    );

    updateUnitPanel();
}


/* =========================================================
   ATTACK SYSTEM
========================================================= */

function attackUnit(enemy) {

    const attacker =
        game.selectedUnit;

    if (!attacker) return;

    if (
        enemy.owner ===
        attacker.owner
    ) return;

    const distance =
        attacker.mesh.position.distanceTo(
            enemy.mesh.position
        );

    if (distance > 7) {

        attacker.destination =
            enemy.mesh.position.clone();

        attacker.target = enemy;

        attacker.status =
            "ADVANCING";

        showToast(
            "Unit advancing toward enemy..."
        );

        return;
    }

    performCombat(
        attacker,
        enemy
    );
}


/* =========================================================
   COMBAT
========================================================= */

function performCombat(
    attacker,
    defender
) {

    if (
        attacker.hp <= 0 ||
        defender.hp <= 0
    ) return;

    const attackPower =
        attacker.attack *
        (0.7 + Math.random() * 0.6);

    const defensePower =
        defender.defense *
        (0.7 + Math.random() * 0.5);

    const damage =
        Math.max(
            5,
            attackPower -
            defensePower * 0.45
        );

    defender.hp -= damage;

    attacker.morale =
        Math.max(
            0,
            attacker.morale -
            Math.random() * 4
        );

    defender.morale =
        Math.max(
            0,
            defender.morale -
            Math.random() * 7
        );

    createExplosion(
        defender.mesh.position
    );

    game.resources.oil =
        Math.max(
            0,
            game.resources.oil - 2
        );

    game.resources.manpower =
        Math.max(
            0,
            game.resources.manpower -
            Math.floor(Math.random() * 50)
        );

    if (defender.hp <= 0) {

        destroyUnit(defender);

        showToast(
            `${attacker.name} destroyed enemy unit`
        );

        return;
    }

    updateUnitPanel();

    document.getElementById(
        "battleStatus"
    ).textContent =
        "ACTIVE COMBAT";
}


/* =========================================================
   DESTROY UNIT
========================================================= */

function destroyUnit(unit) {

    unitGroup.remove(
        unit.mesh
    );

    const index =
        units.indexOf(unit);

    if (index !== -1)
        units.splice(index, 1);

    if (
        game.selectedUnit ===
        unit
    ) {

        game.selectedUnit = null;

        closeUnitPanel();
    }
}


/* =========================================================
   COMMANDS
========================================================= */

function commandMove() {

    if (!game.selectedUnit) {

        showToast(
            "Select a unit first"
        );

        return;
    }

    showToast(
        "Tap the battlefield to choose destination"
    );
}

function commandAttack() {

    if (!game.selectedUnit) {

        showToast(
            "Select a unit first"
        );

        return;
    }

    game.selectedUnit.status =
        "ATTACKING";

    showToast(
        "Select an enemy unit"
    );

    updateUnitPanel();
}

function commandDefend() {

    const unit =
        game.selectedUnit;

    if (!unit) return;

    unit.status =
        "DEFENDING";

    unit.morale =
        Math.min(
            100,
            unit.morale + 5
        );

    showToast(
        `${unit.name} is defending`
    );

    updateUnitPanel();
}

function commandHold() {

    const unit =
        game.selectedUnit;

    if (!unit) return;

    unit.status =
        "HOLD";

    unit.destination = null;

    showToast(
        `${unit.name} holding position`
    );

    updateUnitPanel();
}

function commandRetreat() {

    const unit =
        game.selectedUnit;

    if (!unit) return;

    unit.status =
        "RETREATING";

    unit.destination =
        new THREE.Vector3(
            unit.mesh.position.x - 10,
            0,
            unit.mesh.position.z + 10
        );

    showToast(
        `${unit.name} retreating`
    );

    updateUnitPanel();
}

function commandAirstrike() {

    const aircraft =
        units.find(
            u =>
                u.owner === game.country &&
                u.type === "aircraft"
        );

    if (!aircraft) {

        showToast(
            "No aircraft available"
        );

        return;
    }

    const enemy =
        units.find(
            u =>
                u.owner !== game.country
        );

    if (!enemy) {

        showToast(
            "No enemy target"
        );

        return;
    }

    if (
        game.resources.oil < 20
    ) {

        showToast(
            "Not enough oil"
        );

        return;
    }

    game.resources.oil -= 20;

    enemy.hp -= 35;

    createExplosion(
        enemy.mesh.position
    );

    showToast(
        "AIRSTRIKE INCOMING!"
    );

    if (enemy.hp <= 0)
        destroyUnit(enemy);
}


/* =========================================================
   UNIT PANEL
========================================================= */

function showUnitPanel(unit) {

    const panel =
        document.getElementById(
            "unitPanel"
        );

    panel.classList.add("open");

    updateUnitPanel();
}

function updateUnitPanel() {

    const unit =
        game.selectedUnit;

    if (!unit) return;

    document.getElementById(
        "selectedUnitType"
    ).textContent =
        unitTypes[
            unit.type
        ].name.toUpperCase();

    document.getElementById(
        "selectedUnitName"
    ).textContent =
        unit.name;

    const hpPercent =
        Math.max(
            0,
            unit.hp /
                unit.maxHp *
                100
        );

    document.getElementById(
        "unitStats"
    ).innerHTML = `

        <div class="unit-stat">
            <span>Health</span>
            <div class="progress">
                <i style="width:${hpPercent}%"></i>
            </div>
            <b>${Math.round(unit.hp)}</b>
        </div>

        <div class="unit-stat">
            <span>Morale</span>
            <div class="progress">
                <i style="width:${unit.morale}%"></i>
            </div>
            <b>${Math.round(unit.morale)}</b>
        </div>

        <div class="stat-row">
            <span>Attack</span>
            <b>${unit.attack}</b>
        </div>

        <div class="stat-row">
            <span>Defense</span>
            <b>${unit.defense}</b>
        </div>

        <div class="stat-row">
            <span>Experience</span>
            <b>${unit.experience}</b>
        </div>

        <div class="stat-row">
            <span>Status</span>
            <b>${unit.status}</b>
        </div>
    `;
}

function closeUnitPanel() {

    document
        .getElementById("unitPanel")
        .classList.remove("open");
}


/* =========================================================
   EXPLOSION
========================================================= */

const effects = [];

function createExplosion(position) {

    const geometry =
        new THREE.SphereGeometry(
            0.35,
            12,
            12
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xff7a21,
            transparent: true,
            opacity: 1
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.copy(position);

    scene.add(mesh);

    effects.push({
        mesh,
        life: 0,
        maxLife: 0.55
    });
}


/* =========================================================
   ECONOMY
========================================================= */

function collectIncome() {

    game.resources.money +=
        game.income.money;

    game.resources.oil +=
        game.income.oil;

    game.resources.steel +=
        game.income.steel;

    game.resources.food +=
        game.income.food;

    game.resources.manpower +=
        game.income.manpower;

    /* army maintenance */

    const army =
        units.filter(
            u =>
                u.owner ===
                game.country
        );

    game.resources.money -=
        army.length * 2;

    game.resources.food -=
        army.length * 1;

    game.resources.oil -=
        army.filter(
            u =>
                u.type === "tank" ||
                u.type === "aircraft"
        ).length;

    clampResources();

    updateResourceUI();
}


/* =========================================================
   RESOURCE UI
========================================================= */

function clampResources() {

    Object.keys(
        game.resources
    ).forEach(key => {

        game.resources[key] =
            Math.max(
                0,
                Math.floor(
                    game.resources[key]
                )
            );

    });
}

function updateResourceUI() {

    document.getElementById(
        "money"
    ).textContent =
        formatNumber(
            game.resources.money
        );

    document.getElementById(
        "oil"
    ).textContent =
        formatNumber(
            game.resources.oil
        );

    document.getElementById(
        "steel"
    ).textContent =
        formatNumber(
            game.resources.steel
        );

    document.getElementById(
        "food"
    ).textContent =
        formatNumber(
            game.resources.food
        );

    document.getElementById(
        "manpower"
    ).textContent =
        formatNumber(
            game.resources.manpower
        );
}

function formatNumber(number) {

    return Math.floor(
        number
    ).toLocaleString();
}


/* =========================================================
   DATE SYSTEM
========================================================= */

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

function advanceDate() {

    game.day++;

    if (game.day > 30) {

        game.day = 1;
        game.month++;

    }

    if (game.month > 12) {

        game.month = 1;
        game.year++;

    }

    document.getElementById(
        "gameDate"
    ).textContent =
        `${game.year} • ${months[game.month - 1]} ${String(game.day).padStart(2, "0")}`;

    collectIncome();

    processProduction();
}


/* =========================================================
   SPEED
========================================================= */

function changeSpeed() {

    const speeds = [
        1,
        2,
        4,
        8
    ];

    const index =
        speeds.indexOf(
            game.speed
        );

    game.speed =
        speeds[
            (index + 1) %
            speeds.length
        ];

    document.getElementById(
        "speedBtn"
    ).textContent =
        `${game.speed}×`;

    showToast(
        `Game speed: ${game.speed}×`
    );
}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    game.running =
        !game.running;

    const button =
        document.getElementById(
            "pauseBtn"
        );

    button.textContent =
        game.running
            ? "Ⅱ"
            : "▶";

    showToast(
        game.running
            ? "Game resumed"
            : "Game paused"
    );
}


/* =========================================================
   PRODUCTION
========================================================= */

const productionItems = {

    infantry: {
        name: "Infantry Division",
        steel: 80,
        manpower: 10000,
        time: 5
    },

    tank: {
        name: "Armored Division",
        steel: 220,
        oil: 100,
        manpower: 5000,
        time: 8
    },

    artillery: {
        name: "Artillery Division",
        steel: 180,
        manpower: 3000,
        time: 7
    },

    aircraft: {
        name: "Air Wing",
        steel: 260,
        oil: 150,
        manpower: 1500,
        time: 10
    }
};

function addProduction(
    type
) {

    const item =
        productionItems[type];

    if (!item) return;

    if (
        game.resources.steel <
        item.steel
    ) {

        showToast(
            "Not enough steel"
        );

        return;
    }

    if (
        item.oil &&
        game.resources.oil <
        item.oil
    ) {

        showToast(
            "Not enough oil"
        );

        return;
    }

    if (
        game.resources.manpower <
        item.manpower
    ) {

        showToast(
            "Not enough manpower"
        );

        return;
    }

    game.resources.steel -=
        item.steel;

    if (item.oil)
        game.resources.oil -=
            item.oil;

    game.resources.manpower -=
        item.manpower;

    game.production.queue.push({
        type,
        remaining:
            item.time
    });

    showToast(
        `${item.name} added to production`
    );

    updateResourceUI();
}

function processProduction() {

    if (
        !game.production.queue.length
    ) return;

    const item =
        game.production.queue[0];

    item.remaining--;

    if (item.remaining <= 0) {

        const spawnX =
            -20 +
            Math.random() * 12;

        const spawnZ =
            10 +
            Math.random() * 10;

        createUnit(
            item.type,
            spawnX,
            spawnZ,
            game.country
        );

        game.production.queue.shift();

        showToast(
            `${productionItems[item.type].name} ready`
        );
    }
}


/* =========================================================
   RESEARCH
========================================================= */

const researchNames = {
    infantry: "Infantry Weapons",
    armor: "Advanced Armor",
    air: "Air Technology",
    naval: "Naval Technology",
    industry: "Industrial Engineering"
};

function researchTechnology(type) {

    if (
        game.research[type] === undefined
    ) return;

    const cost = 500;

    if (
        game.resources.money <
        cost
    ) {

        showToast(
            "Not enough money"
        );

        return;
    }

    if (
        game.research[type] >=
        100
    ) {

        showToast(
            "Technology already completed"
        );

        return;
    }

    game.resources.money -=
        cost;

    game.research[type] +=
        10;

    showToast(
        `${researchNames[type]} ${game.research[type]}%`
    );

    updateResourceUI();
}


/* =========================================================
   DIPLOMACY
========================================================= */

function improveRelations(country) {

    if (
        country ===
        game.country
    ) return;

    if (
        game.resources.money <
        300
    ) {

        showToast(
            "Need $300"
        );

        return;
    }

    game.resources.money -=
        300;

    game.diplomacy[country] =
        Math.min(
            100,
            game.diplomacy[country] +
            10
        );

    showToast(
        `Relations with ${countries[country].name} improved`
    );

    updateResourceUI();
}


/* =========================================================
   PANEL SYSTEM
========================================================= */

const panelData = {

    overview: {
        kicker: "STRATEGIC COMMAND",
        title: "World Overview"
    },

    army: {
        kicker: "MILITARY COMMAND",
        title: "Army"
    },

    economy: {
        kicker: "NATIONAL ECONOMY",
        title: "Economy"
    },

    production: {
        kicker: "WAR INDUSTRY",
        title: "Production"
    },

    research: {
        kicker: "MILITARY SCIENCE",
        title: "Research"
    },

    diplomacy: {
        kicker: "FOREIGN AFFAIRS",
        title: "Diplomacy"
    },

    intel: {
        kicker: "INTELLIGENCE",
        title: "Intelligence"
    },

    settings: {
        kicker: "SYSTEM",
        title: "Settings"
    }
};

function openPanel(
    panelName
) {

    const data =
        panelData[panelName];

    if (!data) return;

    document.getElementById(
        "panelKicker"
    ).textContent =
        data.kicker;

    document.getElementById(
        "panelTitle"
    ).textContent =
        data.title;

    document.getElementById(
        "mainPanel"
    ).classList.add("open");

    renderPanel(
        panelName
    );
}


/* =========================================================
   RENDER PANELS
========================================================= */

function renderPanel(
    panel
) {

    const content =
        document.getElementById(
            "panelContent"
        );

    if (panel === "overview") {

        content.innerHTML = `

            <div class="info-card">
                <h3>National Situation</h3>

                <div class="stat-row">
                    <span>Country</span>
                    <b>${countries[game.country].name}</b>
                </div>

                <div class="stat-row">
                    <span>Year</span>
                    <b>${game.year}</b>
                </div>

                <div class="stat-row">
                    <span>Army Units</span>
                    <b>${units.filter(u => u.owner === game.country).length}</b>
                </div>
            </div>

            <div class="info-card">
                <h3>Production</h3>

                <p>
                    Manage factories, military
                    production and resources.
                </p>

                <button class="action-btn"
                    data-action="production">
                    OPEN PRODUCTION
                </button>
            </div>

            <div class="info-card">
                <h3>War Status</h3>

                <p>
                    Monitor enemy movements and
                    prepare your frontline.
                </p>
            </div>
        `;
    }


    if (panel === "army") {

        const army =
            units.filter(
                u =>
                    u.owner ===
                    game.country
            );

        content.innerHTML =
            army.map(
                unit => `

                <div class="info-card">

                    <h3>
                        ${unitTypes[unit.type].icon}
                        ${unit.name}
                    </h3>

                    <div class="stat-row">
                        <span>Health</span>
                        <b>${Math.round(unit.hp)}%</b>
                    </div>

                    <div class="stat-row">
                        <span>Morale</span>
                        <b>${Math.round(unit.morale)}%</b>
                    </div>

                    <button
                        class="action-btn"
                        data-select-unit="${unit.id}">
                        SELECT UNIT
                    </button>

                </div>
            `
            ).join("");
    }


    if (panel === "economy") {

        content.innerHTML = `

            <div class="info-card">

                <h3>National Economy</h3>

                <div class="stat-row">
                    <span>Money</span>
                    <b>$${formatNumber(game.resources.money)}</b>
                </div>

                <div class="stat-row">
                    <span>Oil</span>
                    <b>${formatNumber(game.resources.oil)}</b>
                </div>

                <div class="stat-row">
                    <span>Steel</span>
                    <b>${formatNumber(game.resources.steel)}</b>
                </div>

                <div class="stat-row">
                    <span>Food</span>
                    <b>${formatNumber(game.resources.food)}</b>
                </div>

                <div class="stat-row">
                    <span>Manpower</span>
                    <b>${formatNumber(game.resources.manpower)}</b>
                </div>

            </div>

            <div class="info-card">

                <h3>Daily Income</h3>

                <p>
                    Money +${game.income.money}
                    <br>
                    Oil +${game.income.oil}
                    <br>
                    Steel +${game.income.steel}
                    <br>
                    Food +${game.income.food}
                    <br>
                    Manpower +${game.income.manpower}
                </p>

            </div>
        `;
    }


    if (panel === "production") {

        content.innerHTML = `

            <div class="info-card">

                <h3>Military Production</h3>

                <button
                    class="action-btn"
                    data-production="infantry">
                    🪖 Produce Infantry
                </button>

                <button
                    class="action-btn"
                    data-production="tank">
                    🛡️ Produce Tank
                </button>

                <button
                    class="action-btn"
                    data-production="artillery">
                    💥 Produce Artillery
                </button>

                <button
                    class="action-btn"
                    data-production="aircraft">
                    ✈️ Produce Aircraft
                </button>

            </div>

            <div class="info-card">

                <h3>Queue</h3>

                <p>
                    ${
                        game.production.queue.length
                            ? game.production.queue
                                .map(
                                    q =>
                                        `${productionItems[q.type].name} — ${q.remaining} days`
                                )
                                .join("<br>")
                            : "Production queue empty."
                    }
                </p>

            </div>
        `;
    }


    if (panel === "research") {

        content.innerHTML = `

            <div class="info-card">

                <h3>Technology</h3>

                ${Object.keys(
                    game.research
                ).map(
                    type => `

                    <div class="stat-row">

                        <span>
                            ${researchNames[type]}
                        </span>

                        <b>
                            ${game.research[type]}%
                        </b>

                    </div>

                    <button
                        class="action-btn"
                        data-research="${type}">
                        RESEARCH — $500
                    </button>
                `
                ).join("")}

            </div>
        `;
    }


    if (panel === "diplomacy") {

        content.innerHTML = `

            <div class="info-card">

                <h3>Foreign Relations</h3>

                ${Object.keys(countries)
                    .filter(
                        c =>
                            c !==
                            game.country
                    )
                    .map(
                        c => `

                        <div class="stat-row">

                            <span>
                                ${countries[c].flag}
                                ${countries[c].name}
                            </span>

                            <b>
                                ${game.diplomacy[c]}
                            </b>

                        </div>

                        <button
                            class="action-btn"
                            data-diplomacy="${c}">
                            IMPROVE RELATIONS
                        </button>
                    `
                    )
                    .join("")}

            </div>
        `;
    }


    if (panel === "intel") {

        const enemies =
            units.filter(
                u =>
                    u.owner !==
                    game.country
            );

        content.innerHTML = `

            <div class="info-card">

                <h3>Enemy Intelligence</h3>

                <div class="stat-row">
                    <span>Detected Units</span>
                    <b>${enemies.length}</b>
                </div>

                <div class="stat-row">
                    <span>Threat Level</span>
                    <b>
                        ${
                            enemies.length > 5
                                ? "HIGH"
                                : "MODERATE"
                        }
                    </b>
                </div>

            </div>

            <div class="info-card">

                <h3>Recon Report</h3>

                <p>
                    Enemy formations detected
                    near the eastern frontline.
                </p>

            </div>
        `;
    }


    if (panel === "settings") {

        content.innerHTML = `

            <div class="info-card">

                <h3>Game Settings</h3>

                <button
                    class="action-btn"
                    data-action="save">
                    💾 SAVE GAME
                </button>

                <button
                    class="action-btn"
                    data-action="load">
                    📂 LOAD GAME
                </button>

                <button
                    class="action-btn"
                    data-action="reset">
                    🔄 RESET GAME
                </button>

            </div>

        `;
    }
}


/* =========================================================
   PANEL CLICK HANDLER
========================================================= */

document.addEventListener(
    "click",
    event => {

        const panelButton =
            event.target.closest(
                ".panel-button"
            );

        if (panelButton) {

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

            panelButton.classList.add(
                "active"
            );

            openPanel(
                panelButton.dataset.panel
            );
        }


        const selectButton =
            event.target.closest(
                "[data-select-unit]"
            );

        if (selectButton) {

            const unit =
                units.find(
                    u =>
                        u.id ==
                        selectButton.dataset.selectUnit
                );

            if (unit) {

                selectUnit(unit);
            }
        }


        const productionButton =
            event.target.closest(
                "[data-production]"
            );

        if (productionButton) {

            addProduction(
                productionButton.dataset.production
            );

            renderPanel(
                "production"
            );
        }


        const researchButton =
            event.target.closest(
                "[data-research]"
            );

        if (researchButton) {

            researchTechnology(
                researchButton.dataset.research
            );

            renderPanel(
                "research"
            );
        }


        const diplomacyButton =
            event.target.closest(
                "[data-diplomacy]"
            );

        if (diplomacyButton) {

            improveRelations(
                diplomacyButton.dataset.diplomacy
            );

            renderPanel(
                "diplomacy"
            );
        }


        const action =
            event.target.closest(
                "[data-action]"
            );

        if (action) {

            const type =
                action.dataset.action;

            if (
                type ===
                "production"
            ) {

                openPanel(
                    "production"
                );
            }

            if (
                type ===
                "save"
            ) {

                saveGame();
            }

            if (
                type ===
                "load"
            ) {

                loadGame();
            }

            if (
                type ===
                "reset"
            ) {

                resetGame();
            }
        }
    }
);


/* =========================================================
   COUNTRY SELECTION
========================================================= */

function openCountryModal() {

    document
        .getElementById(
            "countryModal"
        )
        .classList.add(
            "open"
        );
}

function selectCountry(
    country
) {

    const data =
        countries[country];

    if (!data) return;

    game.country =
        country;

    game.resources.money =
        data.money;

    game.resources.oil =
        data.oil;

    game.resources.steel =
        data.steel;

    game.resources.food =
        data.food;

    game.resources.manpower =
        data.manpower;

    document.getElementById(
        "countryFlag"
    ).textContent =
        data.flag;

    document.getElementById(
        "countryName"
    ).textContent =
        data.name;

    document
        .getElementById(
            "countryModal"
        )
        .classList.remove(
            "open"
        );

    updateResourceUI();

    showToast(
        `You are now commanding ${data.name}`
    );
}

document.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                ".country-card"
            );

        if (!card) return;

        selectCountry(
            card.dataset.country
        );
    }
);


/* =========================================================
   CAMERA
========================================================= */

function zoomCamera(
    amount
) {

    const direction =
        new THREE.Vector3();

    camera.getWorldDirection(
        direction
    );

    camera.position.addScaledVector(
        direction,
        amount
    );
}

function resetCamera() {

    camera.position.set(
        game.cameraStart.x,
        game.cameraStart.y,
        game.cameraStart.z
    );

    controls.target.set(
        0,
        0,
        0
    );

    controls.update();

    showToast(
        "Camera reset"
    );
}

document.getElementById(
    "zoomIn"
).addEventListener(
    "click",
    () =>
        zoomCamera(6)
);

document.getElementById(
    "zoomOut"
).addEventListener(
    "click",
    () =>
        zoomCamera(-6)
);

document.getElementById(
    "resetCamera"
).addEventListener(
    "click",
    resetCamera
);


/* =========================================================
   COMMAND BUTTONS
========================================================= */

document.getElementById(
    "moveCommand"
).addEventListener(
    "click",
    commandMove
);

document.getElementById(
    "attackCommand"
).addEventListener(
    "click",
    commandAttack
);

document.getElementById(
    "defendCommand"
).addEventListener(
    "click",
    commandDefend
);

document.getElementById(
    "holdCommand"
).addEventListener(
    "click",
    commandHold
);

document.getElementById(
    "retreatCommand"
).addEventListener(
    "click",
    commandRetreat
);

document.getElementById(
    "airstrikeCommand"
).addEventListener(
    "click",
    commandAirstrike
);


/* =========================================================
   TOP BUTTONS
========================================================= */

document.getElementById(
    "pauseBtn"
).addEventListener(
    "click",
    togglePause
);

document.getElementById(
    "speedBtn"
).addEventListener(
    "click",
    changeSpeed
);

document.getElementById(
    "closePanel"
).addEventListener(
    "click",
    () =>
        document
            .getElementById(
                "mainPanel"
            )
            .classList.remove(
                "open"
            )
);

document.getElementById(
    "closeUnit"
).addEventListener(
    "click",
    closeUnitPanel
);

document.getElementById(
    "closeCountryModal"
).addEventListener(
    "click",
    () =>
        document
            .getElementById(
                "countryModal"
            )
            .classList.remove(
                "open"
            )
);


/* =========================================================
   COUNTRY DISPLAY
========================================================= */

document.getElementById(
    "countryFlag"
).addEventListener(
    "click",
    openCountryModal
);

document.getElementById(
    "countryName"
).addEventListener(
    "click",
    openCountryModal
);


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );

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
   UNIT MOVEMENT UPDATE
========================================================= */

function updateUnits(delta) {

    units.forEach(
        unit => {

            if (
                !unit.destination
            ) return;

            const current =
                unit.mesh.position;

            const target =
                unit.destination;

            const distance =
                current.distanceTo(
                    target
                );

            if (
                distance < 0.15
            ) {

                unit.destination =
                    null;

                if (
                    unit.status ===
                    "MOVING"
                )
                    unit.status =
                        "READY";

                return;
            }

            const direction =
                target
                    .clone()
                    .sub(current)
                    .normalize();

            const speed =
                unit.speed *
                delta *
                60 *
                game.speed;

            unit.mesh.position.add(
                direction.multiplyScalar(
                    Math.min(
                        speed,
                        distance
                    )
                )
            );

            unit.mesh.lookAt(
                target.x,
                unit.mesh.position.y,
                target.z
            );
        }
    );
}


/* =========================================================
   AUTOMATIC COMBAT
========================================================= */

function automaticCombat() {

    const friendly =
        units.filter(
            u =>
                u.owner ===
                game.country
        );

    friendly.forEach(
        unit => {

            if (
                unit.status !==
                    "ATTACKING" &&
                unit.status !==
                    "ADVANCING"
            ) return;

            let nearest = null;
            let nearestDistance =
                Infinity;

            units.forEach(
                enemy => {

                    if (
                        enemy.owner ===
                        unit.owner
                    ) return;

                    const distance =
                        unit.mesh.position.distanceTo(
                            enemy.mesh.position
                        );

                    if (
                        distance <
                        nearestDistance
                    ) {

                        nearest =
                            enemy;

                        nearestDistance =
                            distance;
                    }
                }
            );

            if (
                nearest &&
                nearestDistance <
                    6
            ) {

                performCombat(
                    unit,
                    nearest
                );
            }
        }
    );
}


/* =========================================================
   MINIMAP
========================================================= */

function updateMiniMap() {

    const container =
        document.getElementById(
            "miniUnits"
        );

    if (!container)
        return;

    container.innerHTML = "";

    units.forEach(
        unit => {

            const dot =
                document.createElement(
                    "div"
                );

            const x =
                ((unit.mesh.position.x + 50) /
                    100) *
                100;

            const y =
                ((unit.mesh.position.z + 50) /
                    100) *
                100;

            dot.style.position =
                "absolute";

            dot.style.width =
                "5px";

            dot.style.height =
                "5px";

            dot.style.borderRadius =
                "50%";

            dot.style.left =
                `${Math.max(0, Math.min(100, x))}%`;

            dot.style.top =
                `${Math.max(0, Math.min(100, y))}%`;

            dot.style.background =
                unit.owner ===
                game.country
                    ? "#58a6ff"
                    : "#e45d5d";

            container.appendChild(
                dot
            );
        }
    );
}


/* =========================================================
   SAVE / LOAD
========================================================= */

function saveGame() {

    const save = {

        game: {
            ...game,

            selectedUnit: null,
            movingUnit: null
        },

        units:
            units.map(
                unit => ({
                    id: unit.id,
                    type: unit.type,
                    owner: unit.owner,
                    name: unit.name,
                    x:
                        unit.mesh.position.x,
                    z:
                        unit.mesh.position.z,
                    hp: unit.hp,
                    morale:
                        unit.morale,
                    experience:
                        unit.experience,
                    status:
                        unit.status
                })
            )
    };

    localStorage.setItem(
        "worldWarSave",
        JSON.stringify(save)
    );

    showToast(
        "Game saved"
    );
}

function loadGame() {

    const raw =
        localStorage.getItem(
            "worldWarSave"
        );

    if (!raw) {

        showToast(
            "No saved game found"
        );

        return;
    }

    try {

        const save =
            JSON.parse(raw);

        Object.assign(
            game,
            save.game
        );

        units.forEach(
            unit =>
                unitGroup.remove(
                    unit.mesh
                )
        );

        units.length = 0;

        save.units.forEach(
            saved => {

                const unit =
                    createUnit(
                        saved.type,
                        saved.x,
                        saved.z,
                        saved.owner
                    );

                unit.id =
                    saved.id;

                unit.name =
                    saved.name;

                unit.hp =
                    saved.hp;

                unit.morale =
                    saved.morale;

                unit.experience =
                    saved.experience;

                unit.status =
                    saved.status;
            }
        );

        updateResourceUI();

        showToast(
            "Game loaded"
        );

    } catch {

        showToast(
            "Save file corrupted"
        );
    }
}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    localStorage.removeItem(
        "worldWarSave"
    );

    location.reload();
}


/* =========================================================
   TUTORIAL
========================================================= */

const tutorialSteps = [

    {
        title:
            "Welcome, Commander",

        text:
            "Select a military unit on the battlefield to open its command panel."
    },

    {
        title:
            "Move Your Army",

        text:
            "Select a unit, then tap any terrain location to move it."
    },

    {
        title:
            "Attack",

        text:
            "Select your unit and tap an enemy unit to start combat."
    },

    {
        title:
            "Build Your Army",

        text:
            "Use Production to create infantry, tanks, artillery and aircraft."
    },

    {
        title:
            "Control the Nation",

        text:
            "Economy, Research, Diplomacy and Intelligence help you win the war."
    }
];

function updateTutorial() {

    const step =
        tutorialSteps[
            game.tutorialStep
        ];

    if (!step) {

        document.getElementById(
            "tutorial"
        ).style.display =
            "none";

        return;
    }

    document.getElementById(
        "tutorialTitle"
    ).textContent =
        step.title;

    document.getElementById(
        "tutorialText"
    ).textContent =
        step.text;
}

document.getElementById(
    "tutorialNext"
).addEventListener(
    "click",
    () => {

        game.tutorialStep++;

        if (
            game.tutorialStep >=
            tutorialSteps.length
        ) {

            document.getElementById(
                "tutorial"
            ).style.display =
                "none";

            return;
        }

        updateTutorial();
    }
);

updateTutorial();


/* =========================================================
   GAME CLOCK
========================================================= */

let lastGameTick =
    performance.now();

let gameAccumulator = 0;

function updateGameClock(
    delta
) {

    if (!game.running)
        return;

    gameAccumulator +=
        delta *
        game.speed;

    if (
        gameAccumulator >=
        3
    ) {

        gameAccumulator = 0;

        advanceDate();
    }
}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(
    delta
) {

    for (
        let i = effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];

        effect.life +=
            delta;

        const progress =
            effect.life /
            effect.maxLife;

        effect.mesh.scale.setScalar(
            1 +
            progress * 4
        );

        effect.mesh.material.opacity =
            1 - progress;

        if (
            effect.life >=
            effect.maxLife
        ) {

            scene.remove(
                effect.mesh
            );

            effects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* =========================================================
   LOADING SCREEN
========================================================= */

const loadingProgress =
    document.getElementById(
        "loadingProgress"
    );

const loadingStatus =
    document.getElementById(
        "loadingStatus"
    );

const loadingTips = [
    "TIP: Use the strategy camera to monitor your entire frontline.",
    "TIP: Tanks consume oil but are powerful against enemy formations.",
    "TIP: Research increases your military capabilities.",
    "TIP: Keep food and manpower reserves high.",
    "TIP: Airstrikes are powerful but expensive."
];

let loadProgress = 0;

const loadingInterval =
    setInterval(
        () => {

            loadProgress +=
                Math.random() * 12 + 5;

            if (
                loadProgress >=
                100
            ) {

                loadProgress =
                    100;

                clearInterval(
                    loadingInterval
                );

                loadingStatus.textContent =
                    "Battlefield ready.";

                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "loadingScreen"
                            )
                            .classList.add(
                                "hidden"
                            );

                    },
                    600
                );
            } else {

                const messages = [
                    "Preparing battlefield...",
                    "Deploying armies...",
                    "Loading strategic intelligence...",
                    "Establishing supply network...",
                    "Initializing command system..."
                ];

                loadingStatus.textContent =
                    messages[
                        Math.floor(
                            Math.random() *
                            messages.length
                        )
                    ];
            }

            loadingProgress.style.width =
                `${loadProgress}%`;

            document.getElementById(
                "loadingTip"
            ).textContent =
                loadingTips[
                    Math.floor(
                        Math.random() *
                        loadingTips.length
                    )
                ];

        },
        350
    );


/* =========================================================
   GAME LOOP
========================================================= */

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updateGameClock(
        delta
    );

    updateUnits(
        delta
    );

    automaticCombat();

    updateEffects(
        delta
    );

    updateMiniMap();

    if (
        game.selectedUnit
    ) {

        updateUnitPanel();
    }

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();


/* =========================================================
   INITIAL UI
========================================================= */

document.getElementById(
    "countryFlag"
).textContent =
    countries[
        game.country
    ].flag;

document.getElementById(
    "countryName"
).textContent =
    countries[
        game.country
    ].name;

updateResourceUI();

openPanel(
    "overview"
);

console.log(
    "WORLD WAR — 3D GRAND STRATEGY initialized."
);