import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — V3
   HTML/CSS compatible build
   ========================================================= */

const $ = id => document.getElementById(id);

let scene, camera, renderer, controls, clock;
let ground, unitGroup, fxGroup;

let selectedUnit = null;
let moveMode = false;
let attackMode = false;

let paused = false;
let speed = 1;

let day = 1;
let month = 1;
let year = 1940;

let currentCountry = "USA";
let weather = "CLEAR";
let mapLayer = "MILITARY";

let money = 12500;
let oil = 850;
let steel = 1250;
let food = 1600;
let manpower = 85000;

let political = 120;
let stability = 78;
let tax = 22;
let construction = 6;

let intel = 48;
let spy = 24;
let counterIntel = 42;

let lastSimulation = 0;
let lastDateTick = 0;
let autosaveTimer = 0;

const units = [];

const nation = {
    USA: ["🇺🇸", "United States"],
    GERMANY: ["🇩🇪", "Germany"],
    UK: ["🇬🇧", "United Kingdom"],
    JAPAN: ["🇯🇵", "Japan"],
    USSR: ["☭", "Soviet Union"],
    FRANCE: ["🇫🇷", "France"]
};

const mapColors = {
    MILITARY: 0x596b58,
    POLITICAL: 0x58667d,
    TERRAIN: 0x52634d,
    SUPPLY: 0x4e6e5a,
    RESOURCES: 0x75633c,
    INTEL: 0x5d4c6b
};

const diplomacy = {
    GERMANY: -65,
    UK: 18,
    JAPAN: -42,
    USSR: -8,
    FRANCE: 35
};

const factories = {
    civilian: 18,
    military: 14,
    naval: 5
};

const production = {
    TANK: {
        name: "Tank",
        factories: 4,
        progress: 67,
        efficiency: 74,
        cost: 800,
        steel: 80,
        output: 0
    },
    INFANTRY: {
        name: "Infantry Equipment",
        factories: 5,
        progress: 42,
        efficiency: 82,
        cost: 350,
        steel: 35,
        output: 0
    },
    ARTILLERY: {
        name: "Artillery",
        factories: 3,
        progress: 55,
        efficiency: 68,
        cost: 600,
        steel: 65,
        output: 0
    },
    AIR: {
        name: "Aircraft",
        factories: 2,
        progress: 31,
        efficiency: 59,
        cost: 1100,
        steel: 90,
        output: 0
    }
};

const tech = {
    INFANTRY: {
        name: "Infantry Weapons",
        progress: 54,
        active: false,
        bonus: "+8% infantry attack",
        completed: false
    },
    ARMOR: {
        name: "Advanced Armor",
        progress: 32,
        active: false,
        bonus: "+10% tank attack",
        completed: false
    },
    ARTILLERY: {
        name: "Modern Artillery",
        progress: 48,
        active: false,
        bonus: "+8% artillery damage",
        completed: false
    },
    AIR: {
        name: "Fighter Interceptors",
        progress: 28,
        active: false,
        bonus: "+12% air defense",
        completed: false
    },
    INDUSTRY: {
        name: "Industrial Methods",
        progress: 71,
        active: false,
        bonus: "+1 civilian factory",
        completed: false
    },
    LOGISTICS: {
        name: "Motorized Logistics",
        progress: 42,
        active: false,
        bonus: "-10% supply use",
        completed: false
    },
    ELECTRONICS: {
        name: "Field Electronics",
        progress: 18,
        active: false,
        bonus: "+10 intelligence",
        completed: false
    }
};

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function init() {

    loading(10, "Initializing command system...");

    setup3D();

    loading(25, "Generating strategic terrain...");

    createTerrain();

    loading(45, "Deploying military forces...");

    deployInitialForces();

    loading(65, "Connecting economy and production...");

    loadCampaign();

    loading(80, "Initializing intelligence network...");

    setupUI();

    loading(95, "Preparing battlefield...");

    updateAllUI();

    loading(100, "Battlefield ready.");

    setTimeout(() => {
        $("loadingScreen")?.classList.add("hidden");
    }, 650);

    requestAnimationFrame(loop);
}

function loading(progress, text) {

    const bar = $("loadingProgress");
    const status = $("loadingStatus");

    if (bar) {
        bar.style.width = `${progress}%`;
    }

    if (status) {
        status.textContent = text;
    }
}

/* =========================================================
   THREE.JS
   ========================================================= */

function setup3D() {

    const canvas = $("gameCanvas");

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x071015);

    scene.fog = new THREE.Fog(
        0x071015,
        80,
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
        Math.min(devicePixelRatio, 1.7)
    );

    renderer.setSize(
        innerWidth,
        innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight(
        0xc8d2d5,
        0x162017,
        1.45
    );

    scene.add(hemi);

    const sun = new THREE.DirectionalLight(
        0xffdfad,
        2
    );

    sun.position.set(
        -100,
        150,
        80
    );

    sun.castShadow = true;

    scene.add(sun);

    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;

    controls.dampingFactor = 0.08;

    controls.minDistance = 18;

    controls.maxDistance = 260;

    controls.maxPolarAngle =
        Math.PI * 0.47;

    controls.target.set(
        0,
        0,
        0
    );

    clock = new THREE.Clock();

    unitGroup = new THREE.Group();

    fxGroup = new THREE.Group();

    scene.add(unitGroup);
    scene.add(fxGroup);

    canvas.addEventListener(
        "pointerdown",
        handleWorldClick
    );

    window.addEventListener(
        "resize",
        resizeRenderer
    );
}

function resizeRenderer() {

    if (!camera || !renderer) {
        return;
    }

    camera.aspect =
        innerWidth / innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        innerWidth,
        innerHeight
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
            100,
            100
        );

    const positions =
        geometry.attributes.position;

    for (
        let i = 0;
        i < positions.count;
        i++
    ) {

        const x =
            positions.getX(i);

        const y =
            positions.getY(i);

        const height =
            Math.sin(x * 0.05) * 2 +
            Math.cos(y * 0.06) * 1.7 +
            Math.sin((x + y) * 0.025) * 3;

        positions.setZ(
            i,
            height
        );
    }

    geometry.computeVertexNormals();

    ground =
        new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: mapColors[mapLayer],
                roughness: 0.96,
                metalness: 0
            })
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    ground.userData.isGround = true;

    scene.add(ground);

    const grid =
        new THREE.GridHelper(
            360,
            72,
            0x68715f,
            0x30382f
        );

    grid.material.transparent = true;

    grid.material.opacity = 0.08;

    scene.add(grid);

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                520,
                520
            ),
            new THREE.MeshStandardMaterial({
                color: 0x164659,
                transparent: true,
                opacity: 0.52,
                roughness: 0.2
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.y = -4;

    scene.add(water);

    createMountains();

    createForest();

    createFrontLines();
}

function createMountains() {

    for (let i = 0; i < 65; i++) {

        const mountain =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    3 + Math.random() * 6,
                    9 + Math.random() * 18,
                    7
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x394039,
                    roughness: 1
                })
            );

        mountain.position.set(
            (Math.random() - 0.5) * 320,
            5 + Math.random() * 7,
            (Math.random() - 0.5) * 320
        );

        mountain.castShadow = true;

        scene.add(mountain);
    }
}

function createForest() {

    for (let i = 0; i < 150; i++) {

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
                    color: 0x493a2a
                })
            );

        const crown =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.7,
                    2.5,
                    7
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x263d28
                })
            );

        trunk.position.y = 0.65;

        crown.position.y = 2;

        tree.add(
            trunk,
            crown
        );

        tree.position.set(
            (Math.random() - 0.5) * 330,
            0.3,
            (Math.random() - 0.5) * 330
        );

        tree.scale.setScalar(
            0.7 + Math.random() * 0.8
        );

        scene.add(tree);
    }
}

function createFrontLines() {

    createLine(
        0xb0a66f,
        [
            [-150, -90],
            [-70, -125],
            [10, -100],
            [60, -60],
            [-10, -20],
            [-150, -90]
        ]
    );

    createLine(
        0xb0a66f,
        [
            [-100, 35],
            [-40, 10],
            [20, 55],
            [-30, 120],
            [-120, 95],
            [-100, 35]
        ]
    );

    createLine(
        0xb33f3f,
        [
            [15, -40],
            [45, -32],
            [75, -38],
            [105, -28],
            [135, -35]
        ]
    );
}

function createLine(color, points) {

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                points.map(
                    p =>
                        new THREE.Vector3(
                            p[0],
                            0.4,
                            p[1]
                        )
                )
            );

    const line =
        new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity: 0.45
            })
        );

    scene.add(line);
}

/* =========================================================
   UNIT SYSTEM
   ========================================================= */

function createUnit(
    name,
    type,
    x,
    z,
    friendly = true
) {

    const group =
        new THREE.Group();

    const color =
        friendly
            ? (
                type === "TANK"
                    ? 0x566b4f
                    : 0x60715a
            )
            : (
                type === "TANK"
                    ? 0x633b36
                    : 0x68453f
            );

    const material =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.75
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

        const barrel =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.35,
                    0.35,
                    3.8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x202521,
                    metalness: 0.5
                })
            );

        body.position.y = 1.1;

        turret.position.y = 2.2;

        barrel.position.set(
            0,
            2.3,
            2
        );

        group.add(
            body,
            turret,
            barrel
        );

    } else if (type === "AIR") {

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

        const wings =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    5,
                    0.2,
                    1.3
                ),
                material
            );

        fuselage.rotation.x =
            Math.PI / 2;

        group.add(
            fuselage,
            wings
        );

        group.position.y = 8;

    } else {

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

        const head =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.48,
                    10,
                    10
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x8c6c50
                })
            );

        body.position.y = 1.4;

        head.position.y = 2.7;

        group.add(
            body,
            head
        );
    }

    group.position.set(
        x,
        type === "AIR" ? 8 : 0,
        z
    );

    group.castShadow = true;

    unitGroup.add(group);

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

        organization:
            type === "AIR"
                ? 88
                : 100,

        morale:
            type === "TANK"
                ? 82
                : 85,

        strength:
            type === "TANK"
                ? 85
                : type === "AIR"
                    ? 75
                    : 70,

        readiness: 96,

        supply: 92,

        attack:
            type === "TANK"
                ? 24
                : type === "AIR"
                    ? 30
                    : 16,

        defense:
            type === "TANK"
                ? 20
                : 17,

        speed:
            type === "TANK"
                ? 18
                : type === "AIR"
                    ? 35
                    : 12,

        state: "READY",

        destination: null,

        kills: 0,

        experience: 0,

        entrenchment: 0,

        selected: false
    };

    group.userData.unit = unit;

    units.push(unit);

    return unit;
}

function deployInitialForces() {

    units.length = 0;

    createUnit(
        "1st Armored Division",
        "TANK",
        -30,
        12
    );

    createUnit(
        "2nd Infantry Division",
        "INFANTRY",
        -18,
        20
    );

    createUnit(
        "3rd Infantry Division",
        "INFANTRY",
        -5,
        28
    );

    createUnit(
        "Air Wing Alpha",
        "AIR",
        15,
        12
    );

    createUnit(
        "Enemy Armor Group",
        "TANK",
        45,
        -20,
        false
    );

    createUnit(
        "Enemy Infantry Corps",
        "INFANTRY",
        35,
        -5,
        false
    );

    createUnit(
        "Enemy Defense Force",
        "INFANTRY",
        55,
        12,
        false
    );

    createUnit(
        "Enemy Air Wing",
        "AIR",
        65,
        -18,
        false
    );
}

/* =========================================================
   SELECTION / COMMAND
   ========================================================= */

function selectUnit(unit) {

    if (!unit ||
        unit.state === "DESTROYED") {
        return;
    }

    if (selectedUnit) {
        selectedUnit.selected = false;
        clearSelectionVisual(selectedUnit);
    }

    selectedUnit = unit;

    unit.selected = true;

    createSelectionVisual(unit);

    updateUnitPanel();

    $("unitPanel")?.classList.add("open");
}

function createSelectionVisual(unit) {

    clearSelectionVisual(unit);

    const ring =
        new THREE.Mesh(
            new THREE.RingGeometry(
                3,
                3.35,
                32
            ),
            new THREE.MeshBasicMaterial({
                color:
                    unit.friendly
                        ? 0xd5ad55
                        : 0xe45d5d,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
        );

    ring.rotation.x =
        -Math.PI / 2;

    ring.position.y =
        unit.type === "AIR"
            ? -7.7
            : 0.05;

    ring.userData.selectionRing = true;

    unit.object.add(ring);

    unit.selectionRing = ring;
}

function clearSelectionVisual(unit) {

    if (!unit?.selectionRing) {
        return;
    }

    unit.object.remove(
        unit.selectionRing
    );

    unit.selectionRing.geometry.dispose();

    unit.selectionRing.material.dispose();

    unit.selectionRing = null;
}

function updateUnitPanel() {

    if (!selectedUnit) {
        return;
    }

    const u = selectedUnit;

    const type =
        $("selectedUnitType");

    const name =
        $("selectedUnitName");

    const stats =
        $("unitStats");

    if (type) {

        type.textContent =
            `${u.type} • ${
                u.friendly
                    ? "FRIENDLY"
                    : "HOSTILE"
            }`;
    }

    if (name) {
        name.textContent =
            u.name;
    }

    if (stats) {

        stats.innerHTML =

            progressRow(
                "Strength",
                u.strength
            ) +

            progressRow(
                "Organization",
                u.organization
            ) +

            progressRow(
                "Morale",
                u.morale
            ) +

            progressRow(
                "Readiness",
                u.readiness
            ) +

            progressRow(
                "Supply",
                u.supply
            ) +

            statRow(
                "State",
                u.state
            ) +

            statRow(
                "Experience",
                Math.round(u.experience)
            ) +

            statRow(
                "Kills",
                u.kills
            );
    }
}

function progressRow(label, value) {

    const safe =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );

    return `
        <div class="unit-stat">
            <span>${label}</span>

            <div class="progress">
                <i style="width:${safe}%"></i>
            </div>

            <b>${Math.round(safe)}%</b>
        </div>
    `;
}

function statRow(label, value) {

    return `
        <div class="stat-row">
            <span>${label}</span>
            <b>${value}</b>
        </div>
    `;
}

/* =========================================================
   WORLD INPUT
   ========================================================= */

const raycaster =
    new THREE.Raycaster();

const pointer =
    new THREE.Vector2();

function handleWorldClick(event) {

    if (!renderer) {
        return;
    }

    const rect =
        renderer.domElement
            .getBoundingClientRect();

    pointer.x =
        (
            (event.clientX - rect.left)
            / rect.width
        ) * 2 - 1;

    pointer.y =
        -(
            (event.clientY - rect.top)
            / rect.height
        ) * 2 + 1;

    raycaster.setFromCamera(
        pointer,
        camera
    );

    const unitHits =
        raycaster.intersectObjects(
            unitGroup.children,
            true
        );

    if (unitHits.length) {

        let object =
            unitHits[0].object;

        while (
            object.parent &&
            !object.userData.unit
        ) {
            object =
                object.parent;
        }

        const target =
            object.userData.unit;

        if (target) {

            if (
                attackMode &&
                selectedUnit &&
                target !== selectedUnit &&
                !target.friendly
            ) {

                executeAttack(
                    selectedUnit,
                    target
                );

                attackMode = false;

                return;
            }

            selectUnit(target);

            return;
        }
    }

    if (
        selectedUnit &&
        moveMode
    ) {

        const groundHits =
            raycaster.intersectObject(
                ground
            );

        if (groundHits.length) {

            const point =
                groundHits[0].point;

            setUnitDestination(
                selectedUnit,
                point
            );

            moveMode = false;

            toast(
                `${selectedUnit.name} moving`
            );
        }
    }
}

function setUnitDestination(
    unit,
    point
) {

    if (
        !unit ||
        unit.state === "DESTROYED"
    ) {
        return;
    }

    unit.destination =
        new THREE.Vector3(
            point.x,
            unit.type === "AIR"
                ? 8
                : 0,
            point.z
        );

    unit.state = "MOVING";

    unit.entrenchment = 0;
}

/* =========================================================
   COMMANDS
   ========================================================= */

function commandMove() {

    if (!selectedUnit) {

        toast(
            "Select a friendly unit first"
        );

        return;
    }

    if (!selectedUnit.friendly) {

        toast(
            "Enemy units cannot be commanded"
        );

        return;
    }

    moveMode = true;
    attackMode = false;

    toast(
        "Tap terrain to set destination"
    );
}

function commandAttack() {

    if (!selectedUnit) {

        toast(
            "Select a friendly unit first"
        );

        return;
    }

    if (!selectedUnit.friendly) {

        toast(
            "Enemy units cannot be commanded"
        );

        return;
    }

    attackMode = true;
    moveMode = false;

    toast(
        "Tap an enemy unit to attack"
    );
}

function commandDefend() {

    if (!selectedUnit) {
        return;
    }

    selectedUnit.state =
        "DEFENDING";

    selectedUnit.entrenchment =
        Math.min(
            100,
            selectedUnit.entrenchment + 25
        );

    selectedUnit.organization =
        Math.min(
            100,
            selectedUnit.organization + 5
        );

    selectedUnit.morale =
        Math.min(
            100,
            selectedUnit.morale + 4
        );

    selectedUnit.destination =
        null;

    toast(
        `${selectedUnit.name} taking defensive position`
    );

    updateUnitPanel();
}

function commandHold() {

    if (!selectedUnit) {
        return;
    }

    selectedUnit.state =
        "HOLDING";

    selectedUnit.destination =
        null;

    toast(
        `${selectedUnit.name} ordered to hold`
    );

    updateUnitPanel();
}

function commandRetreat() {

    if (!selectedUnit) {
        return;
    }

    const u =
        selectedUnit;

    const retreatPoint =
        u.object.position.clone();

    retreatPoint.x -=
        u.friendly
            ? 28
            : -28;

    setUnitDestination(
        u,
        retreatPoint
    );

    u.state =
        "RETREATING";

    u.morale =
        Math.min(
            100,
            u.morale + 3
        );

    toast(
        `${u.name} retreating`
    );

    updateUnitPanel();
}

function commandAirstrike() {

    if (!selectedUnit) {
        return;
    }

    if (
        selectedUnit.type !== "AIR"
    ) {

        toast(
            "Select an air unit"
        );

        return;
    }

    const targets =
        units.filter(
            u =>
                !u.friendly &&
                u.state !== "DESTROYED"
        );

    if (!targets.length) {

        toast(
            "No enemy targets"
        );

        return;
    }

    let target =
        targets.sort(
            (a, b) =>
                selectedUnit.object.position
                    .distanceTo(a.object.position)
                -
                selectedUnit.object.position
                    .distanceTo(b.object.position)
        )[0];

    if (
        selectedUnit.object.position
            .distanceTo(target.object.position)
        > 100
    ) {

        toast(
            "Target outside airstrike range"
        );

        return;
    }

    executeAirstrike(
        selectedUnit,
        target
    );
}

/* =========================================================
   COMBAT
   ========================================================= */

function getTerrainModifier(unit) {

    let modifier = 1;

    if (
        unit.state === "DEFENDING"
    ) {
        modifier +=
            0.18 +
            unit.entrenchment / 500;
    }

    if (
        weather === "RAIN"
    ) {
        modifier *= 0.9;
    }

    if (
        weather === "SNOW"
    ) {
        modifier *= 0.78;
    }

    if (
        unit.supply < 30
    ) {
        modifier *= 0.72;
    }

    if (
        unit.organization < 30
    ) {
        modifier *= 0.75;
    }

    return modifier;
}

function getTechAttackBonus(unit) {

    let bonus = 1;

    if (
        unit.type === "INFANTRY" &&
        tech.INFANTRY.completed
    ) {
        bonus *= 1.08;
    }

    if (
        unit.type === "TANK" &&
        tech.ARMOR.completed
    ) {
        bonus *= 1.10;
    }

    if (
        unit.type === "AIR" &&
        tech.AIR.completed
    ) {
        bonus *= 1.12;
    }

    if (
        unit.type === "ARTILLERY" &&
        tech.ARTILLERY.completed
    ) {
        bonus *= 1.08;
    }

    return bonus;
}

function executeAttack(
    attacker,
    defender
) {

    if (
        !attacker ||
        !defender ||
        defender.state === "DESTROYED"
    ) {
        return;
    }

    if (
        !attacker.friendly
    ) {
        return;
    }

    const distance =
        attacker.object.position
            .distanceTo(
                defender.object.position
            );

    if (
        distance > 35 &&
        attacker.type !== "AIR"
    ) {

        toast(
            "Target is too far away"
        );

        return;
    }

    if (
        attacker.supply < 15
    ) {

        toast(
            "Insufficient supply"
        );

        return;
    }

    attacker.supply =
        Math.max(
            0,
            attacker.supply - 6
        );

    const attackPower =
        (
            attacker.attack *
            (attacker.strength / 100) *
            (attacker.organization / 100) *
            (attacker.morale / 100) *
            getTerrainModifier(attacker) *
            getTechAttackBonus(attacker)
        ) +
        Math.random() * 8;

    const defensePower =
        (
            defender.defense *
            (defender.strength / 100) *
            (defender.organization / 100) *
            (defender.morale / 100) *
            getTerrainModifier(defender)
        ) +
        Math.random() * 7;

    let damage =
        Math.max(
            3,
            attackPower -
            defensePower * 0.55
        );

    if (
        weather === "SNOW"
    ) {
        damage *= 0.82;
    }

    defender.hp =
        Math.max(
            0,
            defender.hp - damage
        );

    defender.organization =
        Math.max(
            0,
            defender.organization -
            damage * 0.48
        );

    defender.morale =
        Math.max(
            0,
            defender.morale -
            damage * 0.22
        );

    attacker.organization =
        Math.max(
            0,
            attacker.organization -
            Math.max(
                1,
                damage * 0.12
            )
        );

    attacker.experience =
        Math.min(
            100,
            attacker.experience +
            damage * 0.08
        );

    if (
        defender.hp <= 0 ||
        defender.organization <= 0
    ) {

        destroyUnit(
            defender,
            attacker
        );

    } else {

        defender.state =
            "UNDER_ATTACK";

        attacker.state =
            "ATTACKING";

        createExplosion(
            defender.object.position
        );

        toast(
            `${attacker.name} dealt ${Math.round(damage)} damage`
        );
    }

    updateUnitPanel();

    updateAllUI();
}

function executeAirstrike(
    aircraft,
    target
) {

    if (
        aircraft.supply < 20
    ) {

        toast(
            "Air unit needs supply"
        );

        return;
    }

    aircraft.supply -= 20;

    let damage =
        18 +
        Math.random() * 18;

    damage *=
        aircraft.readiness / 100;

    damage *=
        getTechAttackBonus(
            aircraft
        );

    if (
        weather === "RAIN"
    ) {
        damage *= 0.72;
    }

    if (
        weather === "SNOW"
    ) {
        damage *= 0.55;
    }

    target.hp =
        Math.max(
            0,
            target.hp - damage
        );

    target.organization =
        Math.max(
            0,
            target.organization -
            damage * 0.7
        );

    target.morale =
        Math.max(
            0,
            target.morale -
            damage * 0.35
        );

    aircraft.experience =
        Math.min(
            100,
            aircraft.experience + 1
        );

    createExplosion(
        target.object.position
    );

    toast(
        `Airstrike hit ${target.name}`
    );

    if (
        target.hp <= 0 ||
        target.organization <= 0
    ) {

        destroyUnit(
            target,
            aircraft
        );
    }

    updateUnitPanel();

    updateAllUI();
}

function destroyUnit(
    unit,
    killer = null
) {

    unit.state =
        "DESTROYED";

    unit.hp = 0;

    unit.organization = 0;

    unit.object.visible = false;

    if (killer) {
        killer.kills++;
        killer.experience =
            Math.min(
                100,
                killer.experience + 8
            );
    }

    createExplosion(
        unit.object.position
    );

    toast(
        `${unit.name} destroyed`
    );

    if (
        selectedUnit === unit
    ) {

        selectedUnit = null;

        $("unitPanel")
            ?.classList.remove(
                "open"
            );
    }
}

/* =========================================================
   EFFECTS
   ========================================================= */

function createExplosion(position) {

    const mesh =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.2,
                12,
                12
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff6a1f,
                transparent: true,
                opacity: 0.95
            })
        );

    mesh.position.copy(
        position
    );

    mesh.position.y += 1;

    mesh.userData.life = 0.55;

    fxGroup.add(mesh);
}

function updateEffects(dt) {

    for (
        let i = fxGroup.children.length - 1;
        i >= 0;
        i--
    ) {

        const fx =
            fxGroup.children[i];

        fx.userData.life -= dt;

        fx.scale.multiplyScalar(
            1 + dt * 5
        );

        fx.material.opacity =
            Math.max(
                0,
                fx.userData.life / 0.55
            );

        if (
            fx.userData.life <= 0
        ) {

            fxGroup.remove(fx);

            fx.geometry.dispose();

            fx.material.dispose();
        }
    }
}
/* =========================================================
   MOVEMENT / AI
   ========================================================= */

function updateUnitMovement(dt) {

    for (const unit of units) {

        if (
            unit.state === "DESTROYED" ||
            !unit.destination
        ) {
            continue;
        }

        const position =
            unit.object.position;

        const target =
            unit.destination;

        const distance =
            position.distanceTo(
                target
            );

        if (
            distance < 1.5
        ) {

            unit.destination =
                null;

            if (
                unit.state === "RETREATING"
            ) {

                unit.state =
                    "HOLDING";

            } else {

                unit.state =
                    "HOLDING";
            }

            unit.entrenchment =
                Math.min(
                    100,
                    unit.entrenchment + 5
                );

            continue;
        }

        let movement =
            unit.speed *
            dt *
            0.045 *
            speed;

        if (
            weather === "RAIN"
        ) {
            movement *= 0.82;
        }

        if (
            weather === "SNOW"
        ) {
            movement *= 0.62;
        }

        if (
            unit.supply < 25
        ) {
            movement *= 0.65;
        }

        const direction =
            new THREE.Vector3()
                .subVectors(
                    target,
                    position
                )
                .normalize();

        position.addScaledVector(
            direction,
            movement
        );

        if (
            unit.type === "AIR"
        ) {
            position.y = 8;
        } else {
            position.y = 0;
        }

        unit.entrenchment =
            Math.max(
                0,
                unit.entrenchment -
                dt * 2
            );
    }
}

function updateSupply(dt) {

    for (const unit of units) {

        if (
            unit.state === "DESTROYED"
        ) {
            continue;
        }

        let consumption =
            unit.type === "AIR"
                ? 0.9
                : unit.type === "TANK"
                    ? 0.65
                    : 0.35;

        if (
            tech.LOGISTICS.completed
        ) {
            consumption *= 0.9;
        }

        if (
            unit.state === "MOVING" ||
            unit.state === "ATTACKING"
        ) {
            consumption *= 1.7;
        }

        unit.supply =
            Math.max(
                0,
                unit.supply -
                consumption *
                dt *
                speed
            );

        if (
            unit.supply < 20
        ) {

            unit.readiness =
                Math.max(
                    20,
                    unit.readiness -
                    dt * 1.5
                );

            unit.morale =
                Math.max(
                    20,
                    unit.morale -
                    dt * 0.7
                );

        } else {

            unit.readiness =
                Math.min(
                    100,
                    unit.readiness +
                    dt * 0.12
                );
        }
    }
}

function updateRecovery(dt) {

    for (const unit of units) {

        if (
            unit.state === "DESTROYED"
        ) {
            continue;
        }

        if (
            unit.state === "HOLDING" ||
            unit.state === "DEFENDING"
        ) {

            unit.organization =
                Math.min(
                    100,
                    unit.organization +
                    dt *
                    (
                        unit.supply > 40
                            ? 1.2
                            : 0.35
                    )
                );

            unit.morale =
                Math.min(
                    100,
                    unit.morale +
                    dt * 0.35
                );

            unit.entrenchment =
                Math.min(
                    100,
                    unit.entrenchment +
                    dt * 0.8
                );
        }
    }
}

function enemyAI(dt) {

    if (
        paused
    ) {
        return;
    }

    const enemies =
        units.filter(
            u =>
                !u.friendly &&
                u.state !== "DESTROYED"
        );

    const friends =
        units.filter(
            u =>
                u.friendly &&
                u.state !== "DESTROYED"
        );

    if (
        !friends.length
    ) {
        return;
    }

    for (const enemy of enemies) {

        if (
            enemy.type === "AIR"
        ) {
            enemyAirAI(enemy);
            continue;
        }

        let closest =
            null;

        let distance =
            Infinity;

        for (const friend of friends) {

            const d =
                enemy.object.position
                    .distanceTo(
                        friend.object.position
                    );

            if (
                d < distance
            ) {

                distance = d;

                closest = friend;
            }
        }

        if (!closest) {
            continue;
        }

        if (
            distance <= 28
        ) {

            enemy.state =
                "ATTACKING";

            enemyAICombat(
                enemy,
                closest
            );

        } else {

            enemy.destination =
                closest.object.position.clone();

            enemy.state =
                "MOVING";
        }
    }
}

function enemyAirAI(enemy) {

    const targets =
        units.filter(
            u =>
                u.friendly &&
                u.state !== "DESTROYED"
        );

    if (!targets.length) {
        return;
    }

    const target =
        targets.sort(
            (a, b) =>
                enemy.object.position
                    .distanceTo(a.object.position)
                -
                enemy.object.position
                    .distanceTo(b.object.position)
        )[0];

    if (
        enemy.object.position
            .distanceTo(target.object.position)
        < 80
    ) {

        if (
            Math.random() < 0.03 * speed
        ) {

            enemyAirstrike(
                enemy,
                target
            );
        }

    } else {

        enemy.destination =
            new THREE.Vector3(
                target.object.position.x,
                8,
                target.object.position.z
            );

        enemy.state =
            "MOVING";
    }
}

function enemyAICombat(
    attacker,
    defender
) {

    if (
        Math.random() >
        0.025 * speed
    ) {
        return;
    }

    const attack =
        attacker.attack *
        (attacker.strength / 100) *
        (attacker.organization / 100);

    const defense =
        defender.defense *
        (defender.organization / 100);

    let damage =
        Math.max(
            2,
            attack -
            defense * 0.45 +
            Math.random() * 5
        );

    if (
        weather === "RAIN"
    ) {
        damage *= 0.9;
    }

    if (
        weather === "SNOW"
    ) {
        damage *= 0.75;
    }

    defender.hp =
        Math.max(
            0,
            defender.hp - damage
        );

    defender.organization =
        Math.max(
            0,
            defender.organization -
            damage * 0.45
        );

    defender.morale =
        Math.max(
            0,
            defender.morale -
            damage * 0.18
        );

    createExplosion(
        defender.object.position
    );

    if (
        defender.hp <= 0 ||
        defender.organization <= 0
    ) {

        destroyUnit(
            defender,
            attacker
        );
    }
}

function enemyAirstrike(
    aircraft,
    target
) {

    let damage =
        10 +
        Math.random() * 15;

    if (
        weather === "RAIN"
    ) {
        damage *= 0.7;
    }

    if (
        weather === "SNOW"
    ) {
        damage *= 0.55;
    }

    target.hp =
        Math.max(
            0,
            target.hp - damage
        );

    target.organization =
        Math.max(
            0,
            target.organization -
            damage * 0.6
        );

    createExplosion(
        target.object.position
    );

    if (
        target.hp <= 0 ||
        target.organization <= 0
    ) {

        destroyUnit(
            target,
            aircraft
        );
    }
}

/* =========================================================
   ECONOMY
   ========================================================= */

function updateEconomy(dt) {

    if (paused) {
        return;
    }

    const civilianIncome =
        factories.civilian *
        0.22 *
        dt *
        speed;

    const taxIncome =
        civilianIncome *
        (tax / 20);

    money +=
        taxIncome;

    oil +=
        factories.military *
        0.012 *
        dt *
        speed;

    steel +=
        factories.military *
        0.018 *
        dt *
        speed;

    food +=
        0.15 *
        dt *
        speed;

    manpower +=
        0.8 *
        dt *
        speed;

    if (
        tax > 35
    ) {

        stability =
            Math.max(
                0,
                stability -
                dt * 0.025
            );

    } else if (
        tax < 18
    ) {

        stability =
            Math.min(
                100,
                stability +
                dt * 0.01
            );
    }

    if (
        stability < 35
    ) {

        political =
            Math.max(
                0,
                political -
                dt * 0.08
            );
    } else {

        political =
            Math.min(
                999,
                political +
                dt * 0.035
            );
    }

    construction =
        Math.min(
            20,
            construction +
            factories.civilian *
            0.001 *
            dt *
            speed
        );
}

/* =========================================================
   PRODUCTION
   ========================================================= */

function updateProduction(dt) {

    if (paused) {
        return;
    }

    for (
        const key of Object.keys(
            production
        )
    ) {

        const p =
            production[key];

        if (
            p.factories <= 0
        ) {
            continue;
        }

        let progress =
            p.factories *
            p.efficiency *
            0.004 *
            dt *
            speed;

        if (
            tech.INDUSTRY.completed
        ) {
            progress *= 1.12;
        }

        p.progress +=
            progress;

        if (
            p.progress >= 100
        ) {

            p.progress -= 100;

            p.output +=
                Math.max(
                    1,
                    Math.floor(
                        p.factories *
                        p.efficiency /
                        55
                    )
                );

            applyProductionOutput(
                key,
                p.output
            );

            p.output = 0;

            p.efficiency =
                Math.min(
                    100,
                    p.efficiency + 0.15
                );
        }
    }
}

function applyProductionOutput(
    type,
    amount
) {

    if (
        type === "INFANTRY"
    ) {

        manpower +=
            amount * 12;

    } else if (
        type === "TANK"
    ) {

        for (
            const unit of units
        ) {

            if (
                unit.friendly &&
                unit.type === "TANK" &&
                unit.state !== "DESTROYED"
            ) {

                unit.strength =
                    Math.min(
                        100,
                        unit.strength +
                        amount * 0.7
                    );

                break;
            }
        }

    } else if (
        type === "AIR"
    ) {

        for (
            const unit of units
        ) {

            if (
                unit.friendly &&
                unit.type === "AIR" &&
                unit.state !== "DESTROYED"
            ) {

                unit.readiness =
                    Math.min(
                        100,
                        unit.readiness +
                        amount * 1.2
                    );

                break;
            }
        }
    }
}

function assignFactory(type) {

    const used =
        Object.values(
            production
        )
        .reduce(
            (sum, item) =>
                sum + item.factories,
            0
        );

    if (
        used >=
        factories.military
    ) {

        toast(
            "No free military factories"
        );

        return;
    }

    production[type].factories++;

    toast(
        `${type} factory assigned`
    );

    openPanel("production");
}

/* =========================================================
   RESEARCH
   ========================================================= */

function updateResearch(dt) {

    if (paused) {
        return;
    }

    for (
        const key of Object.keys(
            tech
        )
    ) {

        const t =
            tech[key];

        if (
            !t.active ||
            t.completed
        ) {
            continue;
        }

        t.progress +=
            0.18 *
            dt *
            speed;

        if (
            t.progress >= 100
        ) {

            t.progress = 100;

            t.completed =
                true;

            t.active =
                false;

            applyTechnology(
                key
            );

            toast(
                `${t.name} completed`
            );
        }
    }
}

function startResearch(key) {

    const t =
        tech[key];

    if (
        t.completed
    ) {

        toast(
            "Technology already completed"
        );

        return;
    }

    const active =
        Object.values(
            tech
        )
        .filter(
            x =>
                x.active
        )
        .length;

    if (
        !t.active &&
        active >= 3
    ) {

        toast(
            "All research slots are occupied"
        );

        return;
    }

    if (
        political < 10
    ) {

        toast(
            "Need 10 political power"
        );

        return;
    }

    political -= 10;

    t.active = true;

    toast(
        `Research started: ${t.name}`
    );

    openPanel("research");
}

function applyTechnology(key) {

    if (
        key === "INDUSTRY"
    ) {

        factories.civilian++;

    }

    if (
        key === "ELECTRONICS"
    ) {

        intel =
            Math.min(
                100,
                intel + 10
            );
    }

    if (
        key === "LOGISTICS"
    ) {

        for (
            const unit of units
        ) {

            unit.supply =
                Math.min(
                    100,
                    unit.supply + 10
                );
        }
    }
}

/* =========================================================
   DIPLOMACY
   ========================================================= */

function improveDiplomacy(country) {

    if (
        political < 15
    ) {

        toast(
            "Need political power"
        );

        return;
    }

    political -= 15;

    diplomacy[country] =
        Math.min(
            100,
            diplomacy[country] + 8
        );

    toast(
        `Relations improved with ${nation[country][1]}`
    );

    openPanel("diplomacy");
}

function diplomaticAction(country) {

    const value =
        diplomacy[country];

    if (
        value <= -50
    ) {

        diplomacy[country] =
            -100;

        stability =
            Math.max(
                0,
                stability - 2
            );

        toast(
            `War declared on ${nation[country][1]}`
        );

    } else {

        diplomacy[country] =
            Math.min(
                100,
                value + 12
            );

        political =
            Math.max(
                0,
                political - 8
            );

        toast(
            `Diplomatic pact proposed to ${nation[country][1]}`
        );
    }

    openPanel("diplomacy");
}

/* =========================================================
   INTELLIGENCE
   ========================================================= */

function runRecon() {

    if (
        money < 250
    ) {

        toast(
            "Not enough money"
        );

        return;
    }

    money -= 250;

    intel =
        Math.min(
            100,
            intel + 10
        );

    for (
        const unit of units
    ) {

        if (
            !unit.friendly
        ) {

            unit.readiness =
                Math.max(
                    0,
                    unit.readiness - 2
                );
        }
    }

    toast(
        "Recon completed"
    );

    updateAllUI();
}

function expandSpyNetwork() {

    if (
        money < 400
    ) {

        toast(
            "Not enough money"
        );

        return;
    }

    money -= 400;

    spy =
        Math.min(
            100,
            spy + 12
        );

    intel =
        Math.min(
            100,
            intel + 4
        );

    toast(
        "Spy network expanded"
    );

    updateAllUI();
}

function improveCounterIntel() {

    if (
        money < 350
    ) {

        toast(
            "Not enough money"
        );

        return;
    }

    money -= 350;

    counterIntel =
        Math.min(
            100,
            counterIntel + 12
        );

    toast(
        "Counter-intelligence improved"
    );

    updateAllUI();
}

/* =========================================================
   WEATHER / MAP
   ========================================================= */

function changeWeather() {

    if (
        weather === "CLEAR"
    ) {

        weather = "RAIN";

    } else if (
        weather === "RAIN"
    ) {

        weather = "SNOW";

    } else {

        weather = "CLEAR";
    }

    toast(
        `Weather: ${weather}`
    );
}

function setMapLayer(layer) {

    mapLayer = layer;

    if (ground) {

        ground.material.color.setHex(
            mapColors[layer]
        );
    }

    toast(
        `Map layer: ${layer}`
    );
}

/* =========================================================
   PANELS
   ========================================================= */

function averageStat(key) {

    const list =
        units.filter(
            u =>
                u.friendly &&
                u.state !== "DESTROYED"
        );

    if (!list.length) {
        return 0;
    }

    return Math.round(
        list.reduce(
            (sum, u) =>
                sum +
                (u[key] || 0),
            0
        ) / list.length
    );
}

function threatLevel() {

    const friendly =
        units
            .filter(
                u =>
                    u.friendly &&
                    u.state !== "DESTROYED"
            )
            .reduce(
                (s, u) =>
                    s + u.strength,
                0
            );

    const enemy =
        units
            .filter(
                u =>
                    !u.friendly &&
                    u.state !== "DESTROYED"
            )
            .reduce(
                (s, u) =>
                    s + u.strength,
                0
            );

    if (
        enemy > friendly
    ) {
        return "HIGH";
    }

    if (
        enemy > friendly * 0.75
    ) {
        return "MEDIUM";
    }

    return "LOW";
}

function infoCard(title, content) {

    return `
        <div class="info-card">
            <h3>${title}</h3>
            ${content}
        </div>
    `;
}

function actionButton(
    id,
    text,
    cls = ""
) {

    return `
        <button
            class="action-btn ${cls}"
            id="${id}">
            ${text}
        </button>
    `;
}

const panels = {

    overview: {
        title: "World Overview",
        kicker: "STRATEGIC COMMAND",

        html: () =>

            infoCard(
                "Global Situation",

                statRow(
                    "Active Forces",
                    units.filter(
                        u =>
                            u.friendly &&
                            u.state !== "DESTROYED"
                    ).length
                ) +

                statRow(
                    "Enemy Forces",
                    units.filter(
                        u =>
                            !u.friendly &&
                            u.state !== "DESTROYED"
                    ).length
                ) +

                statRow(
                    "Threat Level",
                    threatLevel()
                ) +

                statRow(
                    "Weather",
                    weather
                ) +

                statRow(
                    "Map Layer",
                    mapLayer
                )
            )

            +

            infoCard(
                "Map Layers",

                [
                    "MILITARY",
                    "POLITICAL",
                    "TERRAIN",
                    "SUPPLY",
                    "RESOURCES",
                    "INTEL"
                ]
                .map(
                    layer =>
                        actionButton(
                            "",
                            layer,
                            `layer-btn`
                        )
                        .replace(
                            "<button ",
                            `<button data-layer="${layer}" `
                        )
                )
                .join("")
            )

            +

            infoCard(
                "Army Readiness",

                progressRow(
                    "Strength",
                    averageStat(
                        "strength"
                    )
                ) +

                progressRow(
                    "Organization",
                    averageStat(
                        "organization"
                    )
                ) +

                progressRow(
                    "Morale",
                    averageStat(
                        "morale"
                    )
                ) +

                progressRow(
                    "Readiness",
                    averageStat(
                        "readiness"
                    )
                )
            )
    },

    army: {
        title: "Army Command",
        kicker: "MILITARY COMMAND",

        html: () => {

            const friendly =
                units.filter(
                    u =>
                        u.friendly &&
                        u.state !== "DESTROYED"
                );

            return (

                infoCard(
                    "Available Forces",

                    friendly
                        .map(
                            u => `
                                <button
                                    class="action-btn select-unit"
                                    data-id="${u.id}"
                                    style="text-align:left">
                                    ${
                                        u.type === "TANK"
                                            ? "🛡️"
                                            : u.type === "AIR"
                                                ? "✈️"
                                                : "🪖"
                                    }
                                    ${u.name}
                                    — ${u.state}
                                </button>
                            `
                        )
                        .join("")
                )

                +

                infoCard(
                    "Army Statistics",

                    progressRow(
                        "Strength",
                        averageStat(
                            "strength"
                        )
                    ) +

                    progressRow(
                        "Organization",
                        averageStat(
                            "organization"
                        )
                    ) +

                    progressRow(
                        "Morale",
                        averageStat(
                            "morale"
                        )
                    ) +

                    statRow(
                        "Manpower",
                        Math.floor(
                            manpower
                        ).toLocaleString()
                    )
                )
            );
        }
    },

    economy: {
        title: "Economy",
        kicker: "NATIONAL ECONOMY",

        html: () =>

            infoCard(
                "Resources",

                statRow(
                    "Money",
                    Math.floor(
                        money
                    ).toLocaleString()
                ) +

                statRow(
                    "Oil",
                    Math.floor(
                        oil
                    ).toLocaleString()
                ) +

                statRow(
                    "Steel",
                    Math.floor(
                        steel
                    ).toLocaleString()
                ) +

                statRow(
                    "Food",
                    Math.floor(
                        food
                    ).toLocaleString()
                ) +

                statRow(
                    "Manpower",
                    Math.floor(
                        manpower
                    ).toLocaleString()
                )
            )

            +

            infoCard(
                "National Stability",

                progressRow(
                    "Stability",
                    stability
                ) +

                statRow(
                    "Tax Rate",
                    `${tax}%`
                ) +

                statRow(
                    "Political Power",
                    Math.floor(
                        political
                    )
                ) +

                statRow(
                    "Construction",
                    construction.toFixed(1)
                )
            )

            +

            actionButton(
                "tax-down",
                "LOWER TAX — 2%"
            )

            +

            actionButton(
                "tax-up",
                "RAISE TAX — 2%"
            )

            +

            actionButton(
                "invest-industry",
                "INVEST IN INDUSTRY — $1000"
            )

            +

            actionButton(
                "build-factory",
                "BUILD MILITARY FACTORY — 4 CONSTRUCTION"
            )
    },

    production: {
        title: "Military Production",
        kicker: "INDUSTRIAL COMMAND",

        html: () =>

            infoCard(
                "Factories",

                statRow(
                    "Civilian",
                    factories.civilian
                ) +

                statRow(
                    "Military",
                    factories.military
                ) +

                statRow(
                    "Naval",
                    factories.naval
                )
            )

            +

            infoCard(
                "Production Lines",

                Object.entries(
                    production
                )
                .map(
                    ([key, p]) =>

                        `<div>
                            ${statRow(
                                p.name,
                                `${p.factories} factories`
                            )}

                            ${progressRow(
                                "Progress",
                                p.progress
                            )}

                            ${actionButton(
                                `factory-${key}`,
                                `ASSIGN +1 ${key} FACTORY`
                            )}
                        </div>`
                )
                .join("")
            )

            +

            actionButton(
                "buy-tank",
                "BUY TANK — $800 / 80 STEEL"
            )

            +

            actionButton(
                "buy-infantry",
                "BUY INFANTRY EQUIPMENT — $350 / 35 STEEL"
            )

            +

            actionButton(
                "buy-artillery",
                "BUY ARTILLERY — $600 / 65 STEEL"
            )

            +

            actionButton(
                "buy-air",
                "BUY AIRCRAFT — $1100 / 90 STEEL"
            )
    },

    research: {
        title: "Technology",
        kicker: "RESEARCH COMMAND",

        html: () =>

            infoCard(
                "Research",

                Object.entries(
                    tech
                )
                .map(
                    ([key, t]) =>

                        `<div>
                            ${statRow(
                                t.name,
                                t.completed
                                    ? "COMPLETED"
                                    : t.active
                                        ? `${Math.round(t.progress)}%`
                                        : "AVAILABLE"
                            )}

                            ${progressRow(
                                "Research",
                                t.progress
                            )}

                            ${actionButton(
                                `research-${key}`,
                                t.completed
                                    ? "COMPLETED"
                                    : t.active
                                        ? "RESEARCHING"
                                        : "START RESEARCH"
                            )}
                        </div>`
                )
                .join("")
            )
    },

    diplomacy: {
        title: "Diplomacy",
        kicker: "FOREIGN AFFAIRS",

        html: () =>

            infoCard(
                "International Relations",

                Object.entries(
                    diplomacy
                )
                .map(
                    ([key, value]) =>

                        `<div>
                            ${statRow(
                                `${nation[key][0]} ${nation[key][1]}`,
                                value
                            )}

                            ${actionButton(
                                `dip-${key}`,
                                "IMPROVE RELATIONS"
                            )}

                            ${actionButton(
                                `diplomatic-${key}`,
                                value < -50
                                    ? "DECLARE WAR"
                                    : "PROPOSE PACT"
                            )}
                        </div>`
                )
                .join("")
            )
    },

    intel: {
        title: "Intelligence",
        kicker: "INTELLIGENCE COMMAND",

        html: () =>

            infoCard(
                "Intelligence Network",

                progressRow(
                    "Intel Level",
                    intel
                ) +

                progressRow(
                    "Spy Network",
                    spy
                ) +

                progressRow(
                    "Counter Intel",
                    counterIntel
                ) +

                statRow(
                    "Enemy Armor",
                    units.filter(
                        u =>
                            !u.friendly &&
                            u.type === "TANK" &&
                            u.state !== "DESTROYED"
                    ).length
                ) +

                statRow(
                    "Enemy Air",
                    units.filter(
                        u =>
                            !u.friendly &&
                            u.type === "AIR" &&
                            u.state !== "DESTROYED"
                    ).length
                )
            )

            +

            actionButton(
                "run-recon",
                "RUN RECON — $250"
            )

            +

            actionButton(
                "expand-spy",
                "EXPAND SPY NETWORK — $400"
            )

            +

            actionButton(
                "counter-intel",
                "COUNTER-INTELLIGENCE — $350"
            )
    },

    settings: {
        title: "Settings",
        kicker: "SYSTEM CONTROL",

        html: () =>

            infoCard(
                "Campaign Settings",

                statRow(
                    "Weather",
                    weather
                ) +

                statRow(
                    "Map Layer",
                    mapLayer
                ) +

                statRow(
                    "Game Speed",
                    `${speed}×`
                )
            )

            +

            actionButton(
                "change-weather",
                "CHANGE WEATHER"
            )

            +

            actionButton(
                "save-campaign",
                "SAVE CAMPAIGN"
            )

            +

            actionButton(
                "load-campaign",
                "LOAD CAMPAIGN"
            )

            +

            actionButton(
                "reset-camera",
                "RESET CAMERA"
            )
    }
};

/* =========================================================
   PANEL CONTROL
   ========================================================= */

function openPanel(type) {

    const panel =
        $("mainPanel");

    const content =
        $("panelContent");

    const definition =
        panels[type] ||
        panels.overview;

    if (!panel || !content) {
        return;
    }

    panel.classList.add(
        "open"
    );

    $("panelTitle").textContent =
        definition.title;

    $("panelKicker").textContent =
        definition.kicker;

    content.innerHTML =
        definition.html();

    bindPanelActions();
}

function bindPanelActions() {

    document
        .querySelectorAll(
            ".layer-btn"
        )
        .forEach(
            button => {

                button.onclick =
                    () =>
                        setMapLayer(
                            button.dataset.layer
                        );
            }
        );

    document
        .querySelectorAll(
            ".select-unit"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        const unit =
                            units.find(
                                u =>
                                    u.id ===
                                    button.dataset.id
                            );

                        if (unit) {
                            selectUnit(
                                unit
                            );
                        }
                    };
            }
        );

    $("tax-down")?.addEventListener(
        "click",
        () => {

            tax =
                Math.max(
                    5,
                    tax - 2
                );

            toast(
                "Tax reduced"
            );

            openPanel(
                "economy"
            );
        }
    );

    $("tax-up")?.addEventListener(
        "click",
        () => {

            tax =
                Math.min(
                    50,
                    tax + 2
                );

            toast(
                "Tax increased"
            );

            openPanel(
                "economy"
            );
        }
    );

    $("invest-industry")?.addEventListener(
        "click",
        investIndustry
    );

    $("build-factory")?.addEventListener(
        "click",
        buildFactory
    );

    for (
        const key of Object.keys(
            production
        )
    ) {

        $(`factory-${key}`)?.addEventListener(
            "click",
            () =>
                assignFactory(
                    key
                )
        );
    }

    $("buy-tank")?.addEventListener(
        "click",
        () =>
            directProduction(
                "TANK"
            )
    );

    $("buy-infantry")?.addEventListener(
        "click",
        () =>
            directProduction(
                "INFANTRY"
            )
    );

    $("buy-artillery")?.addEventListener(
        "click",
        () =>
            directProduction(
                "ARTILLERY"
            )
    );

    $("buy-air")?.addEventListener(
        "click",
        () =>
            directProduction(
                "AIR"
            )
    );

    for (
        const key of Object.keys(
            tech
        )
    ) {

        $(`research-${key}`)?.addEventListener(
            "click",
            () =>
                startResearch(
                    key
                )
        );
    }

    for (
        const key of Object.keys(
            diplomacy
        )
    ) {

        $(`dip-${key}`)?.addEventListener(
            "click",
            () =>
                improveDiplomacy(
                    key
                )
        );

        $(`diplomatic-${key}`)?.addEventListener(
            "click",
            () =>
                diplomaticAction(
                    key
                )
        );
    }

    $("run-recon")?.addEventListener(
        "click",
        runRecon
    );

    $("expand-spy")?.addEventListener(
        "click",
        expandSpyNetwork
    );

    $("counter-intel")?.addEventListener(
        "click",
        improveCounterIntel
    );

    $("change-weather")?.addEventListener(
        "click",
        changeWeather
    );

    $("save-campaign")?.addEventListener(
        "click",
        saveCampaign
    );

    $("load-campaign")?.addEventListener(
        "click",
        () => {

            loadCampaign();

            updateAllUI();

            toast(
                "Campaign loaded"
            );
        }
    );

    $("reset-camera")?.addEventListener(
        "click",
        resetCamera
    );
}

function investIndustry() {

    if (
        money < 1000
    ) {

        toast(
            "Not enough money"
        );

        return;
    }

    money -= 1000;

    factories.civilian++;

    stability =
        Math.min(
            100,
            stability + 2
        );

    toast(
        "Industrial investment complete"
    );

    openPanel(
        "economy"
    );
}

function buildFactory() {

    if (
        construction < 4
    ) {

        toast(
            "Need 4 construction points"
        );

        return;
    }

    construction -= 4;

    factories.military++;

    toast(
        "Military factory constructed"
    );

    openPanel(
        "economy"
    );
}

function directProduction(type) {

    const p =
        production[type];

    if (
        money < p.cost ||
        steel < p.steel
    ) {

        toast(
            "Insufficient resources"
        );

        return;
    }

    money -=
        p.cost;

    steel -=
        p.steel;

    p.progress =
        Math.min(
            100,
            p.progress + 20
        );

    applyProductionOutput(
        type,
        1
    );

    toast(
        `${p.name} produced`
    );

    openPanel(
        "production"
    );
}

/* =========================================================
   SAVE / LOAD
   ========================================================= */

function serializeCampaign() {

    return {

        version: 3,

        currentCountry,

        weather,

        mapLayer,

        paused,

        speed,

        day,
        month,
        year,

        money,
        oil,
        steel,
        food,
        manpower,

        political,
        stability,
        tax,
        construction,

        intel,
        spy,
        counterIntel,

        factories,

        production,

        tech,

        diplomacy,

        units: units.map(
            u => ({
                id: u.id,
                name: u.name,
                type: u.type,
                friendly: u.friendly,

                x:
                    u.object.position.x,

                y:
                    u.object.position.y,

                z:
                    u.object.position.z,

                hp: u.hp,
                organization:
                    u.organization,

                morale:
                    u.morale,

                strength:
                    u.strength,

                readiness:
                    u.readiness,

                supply:
                    u.supply,

                state:
                    u.state,

                kills:
                    u.kills,

                experience:
                    u.experience,

                entrenchment:
                    u.entrenchment
            })
        )
    };
}

function saveCampaign() {

    try {

        localStorage.setItem(
            "WORLD_WAR_V3_SAVE",
            JSON.stringify(
                serializeCampaign()
            )
        );

        toast(
            "Campaign saved successfully"
        );

    } catch (error) {

        console.error(error);

        toast(
            "Save failed"
        );
    }
}

function loadCampaign() {

    try {

        const raw =
            localStorage.getItem(
                "WORLD_WAR_V3_SAVE"
            );

        if (!raw) {
            return;
        }

        const data =
            JSON.parse(raw);

        currentCountry =
            data.currentCountry ||
            currentCountry;

        weather =
            data.weather ||
            weather;

        mapLayer =
            data.mapLayer ||
            mapLayer;

        speed =
            data.speed ||
            1;

        day =
            data.day ||
            1;

        month =
            data.month ||
            1;

        year =
            data.year ||
            1940;

        money =
            data.money ??
            money;

        oil =
            data.oil ??
            oil;

        steel =
            data.steel ??
            steel;

        food =
            data.food ??
            food;

        manpower =
            data.manpower ??
            manpower;

        political =
            data.political ??
            political;

        stability =
            data.stability ??
            stability;

        tax =
            data.tax ??
            tax;

        construction =
            data.construction ??
            construction;

        intel =
            data.intel ??
            intel;

        spy =
            data.spy ??
            spy;

        counterIntel =
            data.counterIntel ??
            counterIntel;

        if (data.factories) {
            Object.assign(
                factories,
                data.factories
            );
        }

        if (data.production) {

            for (
                const key of Object.keys(
                    production
                )
            ) {

                if (
                    data.production[key]
                ) {

                    Object.assign(
                        production[key],
                        data.production[key]
                    );
                }
            }
        }

        if (data.tech) {

            for (
                const key of Object.keys(
                    tech
                )
            ) {

                if (
                    data.tech[key]
                ) {

                    Object.assign(
                        tech[key],
                        data.tech[key]
                    );
                }
            }
        }

        if (data.diplomacy) {

            Object.assign(
                diplomacy,
                data.diplomacy
            );
        }

        if (
            Array.isArray(
                data.units
            )
        ) {

            restoreUnits(
                data.units
            );
        }

        if (ground) {

            ground.material.color.setHex(
                mapColors[
                    mapLayer
                ] ||
                mapColors.MILITARY
            );
        }

    } catch (error) {

        console.error(error);

        toast(
            "Could not load campaign"
        );
    }
}

function restoreUnits(saved) {

    for (
        const unit of units
    ) {

        unit.object.removeFromParent();
    }

    units.length = 0;

    for (
        const data of saved
    ) {

        const unit =
            createUnit(
                data.name,
                data.type,
                data.x,
                data.z,
                data.friendly
            );

        unit.id =
            data.id;

        unit.object.position.y =
            data.y ??
            (
                data.type === "AIR"
                    ? 8
                    : 0
            );

        unit.hp =
            data.hp;

        unit.organization =
            data.organization;

        unit.morale =
            data.morale;

        unit.strength =
            data.strength;

        unit.readiness =
            data.readiness;

        unit.supply =
            data.supply;

        unit.state =
            data.state;

        unit.kills =
            data.kills;

        unit.experience =
            data.experience;

        unit.entrenchment =
            data.entrenchment;

        if (
            unit.state === "DESTROYED"
        ) {

            unit.object.visible =
                false;
        }
    }
}

/* =========================================================
   UI
   ========================================================= */

function setupUI() {

    document
        .querySelectorAll(
            ".panel-button"
        )
        .forEach(
            button => {

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
            }
        );

    $("closePanel")?.addEventListener(
        "click",
        () =>
            $("mainPanel")
                ?.classList.remove(
                    "open"
                )
    );

    $("closeUnit")?.addEventListener(
        "click",
        () => {

            if (selectedUnit) {

                selectedUnit.selected =
                    false;

                clearSelectionVisual(
                    selectedUnit
                );
            }

            selectedUnit =
                null;

            $("unitPanel")
                ?.classList.remove(
                    "open"
                );
        }
    );

    $("pauseBtn")?.addEventListener(
        "click",
        () => {

            paused =
                !paused;

            $("pauseBtn").textContent =
                paused
                    ? "▶"
                    : "Ⅱ";

            toast(
                paused
                    ? "Game paused"
                    : "Game resumed"
            );
        }
    );

    $("speedBtn")?.addEventListener(
        "click",
        () => {

            speed =
                speed === 1
                    ? 2
                    : speed === 2
                        ? 4
                        : 1;

            $("speedBtn").textContent =
                `${speed}×`;

            toast(
                `Game speed ${speed}×`
            );
        }
    );

    $("zoomIn")?.addEventListener(
        "click",
        () =>
            camera.position.multiplyScalar(
                0.85
            )
    );

    $("zoomOut")?.addEventListener(
        "click",
        () =>
            camera.position.multiplyScalar(
                1.15
            )
    );

    $("resetCamera")?.addEventListener(
        "click",
        resetCamera
    );

    $("moveCommand")?.addEventListener(
        "click",
        commandMove
    );

    $("attackCommand")?.addEventListener(
        "click",
        commandAttack
    );

    $("defendCommand")?.addEventListener(
        "click",
        commandDefend
    );

    $("holdCommand")?.addEventListener(
        "click",
        commandHold
    );

    $("retreatCommand")?.addEventListener(
        "click",
        commandRetreat
    );

    $("airstrikeCommand")?.addEventListener(
        "click",
        commandAirstrike
    );

    document
        .querySelectorAll(
            ".country-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        currentCountry =
                            card.dataset.country;

                        $("countryModal")
                            ?.classList.remove(
                                "open"
                            );

                        updateCountryUI();

                        toast(
                            `Nation selected: ${nation[currentCountry][1]}`
                        );
                    }
                );
            }
        );

    $("closeCountryModal")
        ?.addEventListener(
            "click",
            () =>
                $("countryModal")
                    ?.classList.remove(
                        "open"
                    )
        );

    $("tutorialNext")
        ?.addEventListener(
            "click",
            () =>
                $("tutorial")
                    ?.remove()
        );

    updateCountryUI();
}

function updateCountryUI() {

    if (
        $("countryFlag")
    ) {

        $("countryFlag")
            .textContent =
            nation[
                currentCountry
            ][0];
    }

    if (
        $("countryName")
    ) {

        $("countryName")
            .textContent =
            nation[
                currentCountry
            ][1];
    }
}

/* =========================================================
   TOP BAR / STATUS
   ========================================================= */

function updateAllUI() {

    updateCountryUI();

    if ($("money")) {
        $("money").textContent =
            Math.floor(
                money
            ).toLocaleString();
    }

    if ($("oil")) {
        $("oil").textContent =
            Math.floor(
                oil
            ).toLocaleString();
    }

    if ($("steel")) {
        $("steel").textContent =
            Math.floor(
                steel
            ).toLocaleString();
    }

    if ($("food")) {
        $("food").textContent =
            Math.floor(
                food
            ).toLocaleString();
    }

    if ($("manpower")) {
        $("manpower").textContent =
            Math.floor(
                manpower
            ).toLocaleString();
    }

    if ($("gameDate")) {

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

        $("gameDate").textContent =
            `${year} • ${
                months[month - 1]
            } ${
                String(day)
                    .padStart(
                        2,
                        "0"
                    )
            }`;
    }

    if ($("statusText")) {

        $("statusText")
            .textContent =
            paused
                ? "Simulation paused"
                : weather === "CLEAR"
                    ? "All systems operational"
                    : `${weather} conditions active`;
    }

    if ($("battleStatus")) {

        $("battleStatus")
            .textContent =
            threatLevel() === "HIGH"
                ? "ACTIVE FRONTLINE"
                : "FRONTLINE STABLE";
    }

    updateUnitPanel();

    updateMiniMap();
}

function updateMiniMap() {

    const container =
        $("miniUnits");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const active =
        units.filter(
            u =>
                u.state !== "DESTROYED"
        );

    for (
        const unit of active
    ) {

        const marker =
            document.createElement(
                "i"
            );

        marker.style.position =
            "absolute";

        marker.style.width =
            "5px";

        marker.style.height =
            "5px";

        marker.style.borderRadius =
            "50%";

        marker.style.background =
            unit.friendly
                ? "#55d18a"
                : "#e45d5d";

        marker.style.left =
            `${
                50 +
                unit.object.position.x /
                3.8
            }%`;

        marker.style.top =
            `${
                50 +
                unit.object.position.z /
                3.8
            }%`;

        marker.title =
            unit.name;

        container.appendChild(
            marker
        );
    }
}

/* =========================================================
   DATE / SIMULATION
   ========================================================= */

function advanceDate() {

    if (paused) {
        return;
    }

    day++;

    if (
        day > 30
    ) {

        day = 1;

        month++;

        if (
            month > 12
        ) {

            month = 1;

            year++;
        }
    }
}

function simulationStep(dt) {

    if (paused) {
        return;
    }

    updateEconomy(dt);

    updateProduction(dt);

    updateResearch(dt);

    updateSupply(dt);

    updateRecovery(dt);

    updateUnitMovement(dt);

    enemyAI(dt);

    autosaveTimer += dt * speed;

    if (
        autosaveTimer >= 30
    ) {

        autosaveTimer = 0;

        saveCampaign();
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

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

    toast(
        "Camera reset"
    );
}

/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

    const element =
        $("toast");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.classList.add(
        "show"
    );

    clearTimeout(
        window.__wwToast
    );

    window.__wwToast =
        setTimeout(
            () =>
                element.classList.remove(
                    "show"
                ),
            1800
        );
}

/* =========================================================
   MAIN LOOP
   ========================================================= */

function loop(time) {

    requestAnimationFrame(
        loop
    );

    const dt =
        Math.min(
            0.05,
            clock.getDelta()
        );

    if (
        time - lastSimulation >
        50
    ) {

        simulationStep(
            dt
        );

        lastSimulation =
            time;
    }

    if (
        time - lastDateTick >
        2500 / speed
    ) {

        advanceDate();

        lastDateTick =
            time;

        updateAllUI();
    }

    updateEffects(
        dt
    );

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

/* =========================================================
   START
   ========================================================= */

init();
