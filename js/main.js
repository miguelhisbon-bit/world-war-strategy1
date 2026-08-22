import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   Complete browser/mobile prototype
========================================================= */


/* ================= GAME STATE ================= */

const state = {

    country: {
        id: "USA",
        name: "United States",
        flag: "🇺🇸"
    },

    money: 12500,
    oil: 850,
    steel: 1250,
    food: 1600,
    manpower: 85000,

    date: new Date(1940, 0, 1),

    paused: false,
    speed: 1,

    selectedUnit: null,
    units: [],

    battles: [],

    technology: {
        infantry: 0,
        armor: 0,
        aviation: 0,
        naval: 0,
        logistics: 0
    },

    production: [],

    diplomacy: {
        Germany: -20,
        UK: 55,
        Japan: -15,
        USSR: 10,
        France: 45
    },

    settings: {
        graphics: "High",
        fps: 60,
        cameraSensitivity: 1,
        vibration: true,
        cinematic: true,
        autoCombat: false
    }

};


/* ================= THREE.JS ================= */

let scene;
let camera;
let renderer;
let controls;

let raycaster;
let pointer;

let clock;

let terrain;

let unitsGroup;
let effectsGroup;
let projectileGroup;
let cityGroup;

let selectedMarker;

let battlefieldMode = false;

let groundObjects = [];

let dragStart = null;


/* ================= DOM ================= */

const $ = id => document.getElementById(id);


/* ================= INITIALIZATION ================= */

async function boot() {

    await loadingSequence();

    setupThree();

    createWorld();

    createUnits();

    setupEvents();

    updateUI();

    animate();

    startTutorial();

}


async function loadingSequence() {

    const progress = $("loadingProgress");
    const status = $("loadingStatus");
    const tip = $("loadingTip");

    const steps = [
        ["Initializing command system...", 12],
        ["Loading world map...", 27],
        ["Building terrain...", 42],
        ["Deploying armies...", 58],
        ["Preparing battlefield...", 72],
        ["Loading combat systems...", 86],
        ["Synchronizing campaign...", 100]
    ];

    const tips = [
        "TIP: Supply lines are essential for long campaigns.",
        "TIP: Terrain affects movement and combat.",
        "TIP: Use airstrikes to weaken enemy formations.",
        "TIP: Research can unlock stronger military units.",
        "TIP: Diplomacy can prevent wars on multiple fronts."
    ];

    for (let i = 0; i < steps.length; i++) {

        await wait(350);

        status.textContent = steps[i][0];
        progress.style.width = steps[i][1] + "%";

        tip.textContent =
            tips[i % tips.length];

    }

    await wait(700);

    $("loadingScreen").classList.add("hidden");

}


function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/* ================= THREE SETUP ================= */

function setupThree() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x78919a);

    scene.fog = new THREE.Fog(
        0x78919a,
        80,
        320
    );


    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(
        0,
        70,
        75
    );


    renderer = new THREE.WebGLRenderer({
        canvas: $("gameCanvas"),
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 1.8)
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

    controls.minDistance = 18;

    controls.maxDistance = 180;

    controls.maxPolarAngle =
        Math.PI / 2.12;

    controls.target.set(0,0,0);


    raycaster = new THREE.Raycaster();

    pointer = new THREE.Vector2();

    clock = new THREE.Clock();


    unitsGroup = new THREE.Group();
    effectsGroup = new THREE.Group();
    projectileGroup = new THREE.Group();
    cityGroup = new THREE.Group();

    scene.add(unitsGroup);
    scene.add(effectsGroup);
    scene.add(projectileGroup);
    scene.add(cityGroup);


    /* LIGHTING */

    const hemi =
        new THREE.HemisphereLight(
            0xdde9ed,
            0x243029,
            2.1
        );

    scene.add(hemi);


    const sun =
        new THREE.DirectionalLight(
            0xfff0d0,
            3
        );

    sun.position.set(
        50,
        100,
        30
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;

    scene.add(sun);


    window.addEventListener(
        "resize",
        onResize
    );


    renderer.domElement.addEventListener(
        "pointerdown",
        onPointerDown
    );

    renderer.domElement.addEventListener(
        "pointerup",
        onPointerUp
    );

}


/* ================= WORLD ================= */

function createWorld() {

    createTerrain();

    createRoads();

    createRivers();

    createMountains();

    createForest();

    createCities();

    createStrategicBorders();

    createOceanDecoration();

}


function createTerrain() {

    const geometry =
        new THREE.PlaneGeometry(
            240,
            180,
            80,
            60
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x4f654e,
            roughness: .95,
            metalness: 0
        });


    terrain =
        new THREE.Mesh(
            geometry,
            material
        );

    terrain.rotation.x =
        -Math.PI / 2;

    terrain.receiveShadow = true;

    scene.add(terrain);


    const pos =
        geometry.attributes.position;

    for (
        let i = 0;
        i < pos.count;
        i++
    ) {

        const x = pos.getX(i);
        const z = pos.getZ(i);

        const h =
            Math.sin(x * .055) * 1.4 +
            Math.cos(z * .07) * 1.2 +
            Math.sin((x + z) * .025) * 2;

        pos.setY(i, h);

    }

    geometry.computeVertexNormals();


    /* GRID */

    const grid =
        new THREE.GridHelper(
            240,
            24,
            0x788d72,
            0x62755f
        );

    grid.position.y = .05;

    grid.material.opacity = .18;
    grid.material.transparent = true;

    scene.add(grid);

    groundObjects.push(terrain);

}


function createRoads() {

    const roadMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x343c39,
            roughness: 1
        });


    const roads = [
        [0,0,100,.8],
        [-30,5,65,.5],
        [35,-20,75,.55],
        [10,30,50,.45]
    ];


    roads.forEach(r => {

        const g =
            new THREE.PlaneGeometry(
                r[3] * 2,
                r[2]
            );

        const m =
            new THREE.Mesh(
                g,
                roadMaterial
            );

        m.rotation.x =
            -Math.PI / 2;

        m.rotation.z =
            r[1] * .02;

        m.position.set(
            r[0],
            .08,
            r[1]
        );

        scene.add(m);

    });

}


function createRivers() {

    const riverMat =
        new THREE.MeshStandardMaterial({
            color: 0x315d76,
            roughness: .2,
            metalness: .1,
            transparent: true,
            opacity: .9
        });


    const river =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                14,
                180,
                20,
                20
            ),
            riverMat
        );

    river.rotation.x =
        -Math.PI / 2;

    river.rotation.z =
        -.15;

    river.position.set(
        -27,
        .11,
        0
    );

    scene.add(river);

}


function createMountains() {

    const mountainMat =
        new THREE.MeshStandardMaterial({
            color: 0x4a504b,
            roughness: 1
        });


    for (let i = 0; i < 28; i++) {

        const height =
            4 + Math.random() * 13;

        const mountain =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    4 + Math.random() * 5,
                    height,
                    7
                ),
                mountainMat
            );

        mountain.position.set(
            -75 + Math.random() * 45,
            height / 2,
            -55 + Math.random() * 110
        );

        mountain.rotation.y =
            Math.random() * Math.PI;

        mountain.castShadow = true;

        scene.add(mountain);

    }

}


function createForest() {

    const trunkMat =
        new THREE.MeshStandardMaterial({
            color: 0x493b2a
        });

    const leafMat =
        new THREE.MeshStandardMaterial({
            color: 0x1e3b29
        });


    for (let i = 0; i < 70; i++) {

        const group =
            new THREE.Group();

        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .18,
                    .28,
                    2.2,
                    6
                ),
                trunkMat
            );

        trunk.position.y = 1.1;

        const leaves =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    1.3,
                    3.4,
                    7
                ),
                leafMat
            );

        leaves.position.y = 3;

        group.add(trunk);
        group.add(leaves);

        group.position.set(
            35 + Math.random() * 55,
            0,
            -55 + Math.random() * 110
        );

        group.scale.setScalar(
            .65 + Math.random() * .7
        );

        group.traverse(
            o => o.castShadow = true
        );

        scene.add(group);

    }

}


function createCities() {

    const cities = [
        ["CAPITAL", -5, 10],
        ["NORTH CITY", -38, -28],
        ["EAST CITY", 48, 17],
        ["SOUTH CITY", 20, 53],
        ["PORT", -45, 47],
        ["INDUSTRIAL", 42, -42]
    ];


    const buildingMat =
        new THREE.MeshStandardMaterial({
            color: 0x77736a,
            roughness: .9
        });


    cities.forEach(city => {

        const group =
            new THREE.Group();

        for (let i = 0; i < 7; i++) {

            const height =
                2 + Math.random() * 6;

            const building =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        2 + Math.random() * 2,
                        height,
                        2 + Math.random() * 2
                    ),
                    buildingMat
                );

            building.position.set(
                (Math.random() - .5) * 10,
                height / 2,
                (Math.random() - .5) * 10
            );

            building.castShadow = true;

            group.add(building);

        }

        group.position.set(
            city[1],
            0,
            city[2]
        );

        cityGroup.add(group);

        addCityLabel(
            city[0],
            city[1],
            city[2]
        );

    });

}


function addCityLabel(name,x,z) {

    const canvas =
        document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx =
        canvas.getContext("2d");

    ctx.fillStyle =
        "rgba(0,0,0,.6)";

    ctx.fillRect(
        0,25,512,78
    );

    ctx.font =
        "bold 42px Arial";

    ctx.fillStyle =
        "#e8edf0";

    ctx.textAlign =
        "center";

    ctx.fillText(
        name,
        256,
        77
    );


    const texture =
        new THREE.CanvasTexture(canvas);

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

    const sprite =
        new THREE.Sprite(material);

    sprite.scale.set(
        10,
        2.5,
        1
    );

    sprite.position.set(
        x,
        9,
        z
    );

    scene.add(sprite);

}


function createStrategicBorders() {

    const borderMaterial =
        new THREE.LineBasicMaterial({
            color: 0xd4ae5c,
            transparent: true,
            opacity: .45
        });


    const shapes = [

        [
            [-65,-55],
            [-15,-55],
            [-15,-5],
            [-65,-5],
            [-65,-55]
        ],

        [
            [10,-55],
            [65,-55],
            [65,-5],
            [10,-5],
            [10,-55]
        ],

        [
            [-65,8],
            [-8,8],
            [-8,55],
            [-65,55],
            [-65,8]
        ]

    ];


    shapes.forEach(points => {

        const geometry =
            new THREE.BufferGeometry();

        const vertices = [];

        points.forEach(p => {

            vertices.push(
                p[0],
                .15,
                p[1]
            );

        });

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                vertices,
                3
            )
        );

        const line =
            new THREE.Line(
                geometry,
                borderMaterial
            );

        scene.add(line);

    });

}


function createOceanDecoration() {

    const ocean =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                500,
                500
            ),
            new THREE.MeshStandardMaterial({
                color: 0x244a60,
                roughness: .7
            })
        );

    ocean.rotation.x =
        -Math.PI / 2;

    ocean.position.y =
        -2;

    scene.add(ocean);

}


/* ================= UNIT SYSTEM ================= */

const UNIT_TYPES = {

    infantry: {
        name: "Infantry Division",
        icon: "🪖",
        color: 0x3e6b47,
        hp: 100,
        attack: 25,
        defense: 45,
        speed: .08,
        cost: 100
    },

    tank: {
        name: "Armored Division",
        icon: "🛡️",
        color: 0x4c5650,
        hp: 180,
        attack: 70,
        defense: 80,
        speed: .13,
        cost: 250
    },

    artillery: {
        name: "Artillery Regiment",
        icon: "💥",
        color: 0x5b5548,
        hp: 110,
        attack: 85,
        defense: 30,
        speed: .055,
        cost: 180
    },

    aircraft: {
        name: "Air Wing",
        icon: "✈️",
        color: 0x59676d,
        hp: 80,
        attack: 95,
        defense: 40,
        speed: .25,
        cost: 350
    },

    enemy: {
        name: "Enemy Army",
        icon: "⚔️",
        color: 0x7d3030,
        hp: 120,
        attack: 40,
        defense: 35,
        speed: .07,
        cost: 0
    }

};


function createUnits() {

    const friendly = [

        ["infantry","1st Infantry", -30, 18],
        ["infantry","2nd Infantry", -21, 12],
        ["tank","1st Armored", -22, 25],
        ["tank","2nd Armored", -12, 22],
        ["artillery","1st Artillery", -30, 28],
        ["aircraft","Air Wing Alpha", -4, 32]

    ];


    friendly.forEach(
        data =>
            createUnit(
                data[0],
                data[1],
                data[2],
                data[3],
                "friendly"
            )
    );


    const enemies = [

        ["enemy","Enemy Army Alpha", 25, 18],
        ["enemy","Enemy Army Bravo", 34, 25],
        ["enemy","Enemy Armor", 40, 10],
        ["enemy","Enemy Infantry", 47, 30]

    ];


    enemies.forEach(
        data =>
            createUnit(
                data[0],
                data[1],
                data[2],
                data[3],
                "enemy"
            )
    );

}


function createUnit(
    type,
    name,
    x,
    z,
    faction
) {

    const data =
        UNIT_TYPES[type];

    const group =
        new THREE.Group();

    group.userData = {

        isUnit: true,

        id:
            crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(36),

        type,

        name,

        faction,

        hp: data.hp,

        maxHp: data.hp,

        attack: data.attack,

        defense: data.defense,

        speed: data.speed,

        target: null,

        state: "idle",

        fireCooldown: 0,

        selected: false

    };


    buildUnitModel(
        group,
        type,
        faction
    );


    group.position.set(
        x,
        1,
        z
    );


    group.traverse(
        obj => {

            obj.castShadow = true;

            obj.userData.unitRoot =
                group;

        }
    );


    unitsGroup.add(group);

    state.units.push(group);

    return group;

}


/* ================= 3D UNIT MODELS ================= */

function buildUnitModel(
    group,
    type,
    faction
) {

    const data =
        UNIT_TYPES[type];


    const color =
        faction === "enemy"
            ? 0x8b3434
            : data.color;


    const bodyMat =
        new THREE.MeshStandardMaterial({
            color,
            roughness: .85
        });


    const darkMat =
        new THREE.MeshStandardMaterial({
            color: 0x171b1c,
            roughness: .9
        });


    if (type === "infantry" ||
        type === "enemy") {

        for (let i = 0; i < 5; i++) {

            const soldier =
                new THREE.Group();

            const body =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        .55,
                        1.35,
                        .38
                    ),
                    bodyMat
                );

            body.position.y = 1.25;

            const head =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        .27,
                        10,
                        8
                    ),
                    darkMat
                );

            head.position.y = 2.12;

            const rifle =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        .1,
                        .1,
                        1.1
                    ),
                    darkMat
                );

            rifle.position.set(
                .28,
                1.45,
                -.25
            );

            rifle.rotation.x =
                -.15;

            soldier.add(
                body,
                head,
                rifle
            );

            soldier.position.x =
                (i - 2) * .7;

            soldier.position.z =
                (i % 2) * .7;

            soldier.userData.walkOffset =
                i * .4;

            group.add(soldier);

        }

        return;

    }


    if (type === "tank") {

        const body =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    3.4,
                    1.1,
                    2.1
                ),
                bodyMat
            );

        body.position.y = 1;

        group.add(body);


        const turret =
            new THREE.Group();

        const top =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .95,
                    1.05,
                    .65,
                    12
                ),
                bodyMat
            );

        top.position.y = 1.8;

        turret.add(top);


        const cannon =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .15,
                    .18,
                    3.4,
                    10
                ),
                darkMat
            );

        cannon.rotation.z =
            Math.PI / 2;

        cannon.position.set(
            1.8,
            1.8,
            0
        );

        turret.add(cannon);

        turret.userData.isTurret = true;

        group.add(turret);


        for (
            let side = -1;
            side <= 1;
            side += 2
        ) {

            for (let i = -1; i <= 1; i++) {

                const wheel =
                    new THREE.Mesh(
                        new THREE.CylinderGeometry(
                            .48,
                            .48,
                            .32,
                            12
                        ),
                        darkMat
                    );

                wheel.rotation.z =
                    Math.PI / 2;

                wheel.position.set(
                    i * 1.1,
                    .45,
                    side * 1.1
                );

                group.add(wheel);

            }

        }

        return;

    }


    if (type === "artillery") {

        const base =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.5,
                    .7,
                    1.8
                ),
                bodyMat
            );

        base.position.y = .6;

        group.add(base);


        const gun =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .14,
                    .18,
                    3.5,
                    10
                ),
                darkMat
            );

        gun.rotation.z =
            Math.PI / 2;

        gun.position.set(
            1.4,
            1.35,
            0
        );

        group.add(gun);

        return;

    }


    if (type === "aircraft") {

        const fuselage =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .38,
                    .5,
                    4.2,
                    12
                ),
                bodyMat
            );

        fuselage.rotation.z =
            Math.PI / 2;

        fuselage.position.y = 7;

        group.add(fuselage);


        const wing =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1,
                    .12,
                    6
                ),
                bodyMat
            );

        wing.position.y = 7;

        group.add(wing);


        const tail =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    .8,
                    1.1,
                    .12
                ),
                bodyMat
            );

        tail.position.set(
            -1.7,
            7.5,
            0
        );

        group.add(tail);

        return;

    }

}


/* ================= POINTER / TOUCH ================= */

function onPointerDown(event) {

    dragStart = {
        x: event.clientX,
        y: event.clientY
    };

}


function onPointerUp(event) {

    if (!dragStart) return;

    const dx =
        event.clientX -
        dragStart.x;

    const dy =
        event.clientY -
        dragStart.y;

    const distance =
        Math.sqrt(dx * dx + dy * dy);

    dragStart = null;

    if (distance > 12) return;

    selectFromScreen(
        event.clientX,
        event.clientY
    );

}


function selectFromScreen(x,y) {

    pointer.x =
        (x / window.innerWidth) * 2 - 1;

    pointer.y =
        -(y / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(
        pointer,
        camera
    );


    const objects =
        raycaster.intersectObjects(
            unitsGroup.children,
            true
        );


    if (objects.length) {

        let root =
            objects[0].object;

        while (
            root &&
            !root.userData.isUnit
        ) {
            root = root.parent;
        }

        if (root) {

            selectUnit(root);

            return;

        }

    }


    /* Terrain command */

    const groundHits =
        raycaster.intersectObject(
            terrain
        );


    if (
        groundHits.length &&
        state.selectedUnit
    ) {

        const point =
            groundHits[0].point;

        commandMove(
            state.selectedUnit,
            point
        );

    }

}


/* ================= UNIT SELECTION ================= */

function selectUnit(unit) {

    if (
        state.selectedUnit &&
        state.selectedUnit !== unit
    ) {
        deselectUnit(
            state.selectedUnit
        );
    }


    state.selectedUnit = unit;

    unit.userData.selected =
        true;


    createSelectionMarker(
        unit
    );


    updateUnitPanel();

    showToast(
        `${UNIT_TYPES[unit.userData.type].icon} ${unit.userData.name} selected`
    );

}


function deselectUnit(unit) {

    if (!unit) return;

    unit.userData.selected =
        false;

    if (selectedMarker) {

        scene.remove(
            selectedMarker
        );

        selectedMarker = null;

    }

}


function createSelectionMarker(unit) {

    if (selectedMarker) {

        scene.remove(
            selectedMarker
        );

    }


    selectedMarker =
        new THREE.Mesh(
            new THREE.RingGeometry(
                2.5,
                2.8,
                40
            ),
            new THREE.MeshBasicMaterial({
                color: 0xd5ad55,
                transparent: true,
                opacity: .8,
                side: THREE.DoubleSide
            })
        );


    selectedMarker.rotation.x =
        -Math.PI / 2;

    selectedMarker.position.copy(
        unit.position
    );

    selectedMarker.position.y =
        .15;

    scene.add(
        selectedMarker
    );

}


/* ================= MOVEMENT ================= */

function commandMove(
    unit,
    target
) {

    if (
        unit.userData.faction !==
        "friendly"
    ) {

        showToast(
            "Enemy units cannot be directly commanded."
        );

        return;

    }


    unit.userData.target =
        target.clone();

    unit.userData.state =
        "moving";


    showToast(
        `Moving ${unit.userData.name}`
    );

    updateBattleStatus(
        "ARMY MOVING"
    );

}


function updateUnitMovement(delta) {

    state.units.forEach(unit => {

        const data =
            unit.userData;

        if (
            data.state !== "moving" ||
            !data.target
        ) return;


        const target =
            data.target;


        const direction =
            target.clone()
                .sub(unit.position);

        direction.y = 0;


        const distance =
            direction.length();


        if (distance < .6) {

            data.target = null;

            data.state = "idle";

            showToast(
                `${data.name} reached destination`
            );

            return;

        }


        direction.normalize();


        const movement =
            data.speed *
            state.speed *
            delta *
            60;


        unit.position.add(
            direction.multiplyScalar(
                movement
            )
        );


        const targetRotation =
            Math.atan2(
                direction.x,
                direction.z
            );


        unit.rotation.y +=
            normalizeAngle(
                targetRotation -
                unit.rotation.y
            ) * .12;


        animateUnit(
            unit,
            delta
        );


        if (
            data.type === "aircraft"
        ) {

            unit.position.y =
                7 +
                Math.sin(
                    performance.now() * .002
                ) * .3;

        }

    });

}


function normalizeAngle(angle) {

    while (angle > Math.PI)
        angle -= Math.PI * 2;

    while (angle < -Math.PI)
        angle += Math.PI * 2;

    return angle;

}


function animateUnit(unit,delta) {

    const data =
        unit.userData;

    if (
        data.type === "infantry" ||
        data.type === "enemy"
    ) {

        unit.children.forEach(
            (child,index) => {

                if (
                    child.userData.walkOffset ===
                    undefined
                ) return;

                child.position.y =
                    Math.sin(
                        performance.now() * .012 +
                        child.userData.walkOffset
                    ) * .08;

            }
        );

    }

}


/* ================= COMBAT ================= */

function commandAttack() {

    const attacker =
        state.selectedUnit;

    if (!attacker) {

        showToast(
            "Select a friendly unit first."
        );

        return;

    }


    const enemy =
        findNearestEnemy(
            attacker
        );


    if (!enemy) {

        showToast(
            "No enemy detected nearby."
        );

        return;

    }


    attacker.userData.target =
        enemy.position.clone();

    attacker.userData.combatTarget =
        enemy;

    attacker.userData.state =
        "combat";


    showToast(
        `${attacker.userData.name} engaging enemy`
    );

    updateBattleStatus(
        "COMBAT ACTIVE"
    );

}


function findNearestEnemy(unit) {

    let nearest = null;
    let distance = Infinity;


    state.units.forEach(other => {

        if (
            other.userData.faction ===
            unit.userData.faction
        ) return;


        if (
            other.userData.hp <= 0
        ) return;


        const d =
            unit.position.distanceTo(
                other.position
            );


        if (d < distance) {

            distance = d;
            nearest = other;

        }

    });


    return nearest;

}


function updateCombat(delta) {

    state.units.forEach(unit => {

        const data =
            unit.userData;


        if (
            data.state !== "combat"
        ) return;


        const target =
            data.combatTarget;


        if (
            !target ||
            target.userData.hp <= 0
        ) {

            data.state = "idle";
            data.combatTarget = null;

            return;

        }


        const distance =
            unit.position.distanceTo(
                target.position
            );


        /* Move into combat range */

        if (
            distance >
            getAttackRange(data.type)
        ) {

            const direction =
                target.position.clone()
                    .sub(unit.position);

            direction.y = 0;

            direction.normalize();


            unit.position.add(
                direction.multiplyScalar(
                    data.speed *
                    state.speed *
                    delta *
                    60
                )
            );


            unit.rotation.y =
                Math.atan2(
                    direction.x,
                    direction.z
                );


            return;

        }


        data.fireCooldown -=
            delta *
            state.speed;


        if (
            data.fireCooldown <= 0
        ) {

            fireAt(
                unit,
                target
            );

            data.fireCooldown =
                getFireRate(
                    data.type
                );

        }

    });

}


function getAttackRange(type) {

    if (type === "artillery")
        return 22;

    if (type === "aircraft")
        return 45;

    if (type === "tank")
        return 15;

    return 10;

}


function getFireRate(type) {

    if (type === "artillery")
        return 2.8;

    if (type === "aircraft")
        return 2;

    if (type === "tank")
        return 1.6;

    return 1.1;

}


/* ================= FIRING ================= */

function fireAt(attacker,target) {

    const type =
        attacker.userData.type;


    const start =
        attacker.position.clone();

    start.y +=
        type === "aircraft"
            ? 7
            : 2;


    const end =
        target.position.clone();

    end.y += 1;


    createProjectile(
        start,
        end,
        type
    );


    createMuzzleFlash(
        attacker
    );


    const damage =
        attacker.userData.attack *
        (.75 + Math.random() * .5);


    setTimeout(() => {

        if (
            !target ||
            target.userData.hp <= 0
        ) return;


        target.userData.hp -=
            damage;


        createHitEffect(
            target.position
        );


        if (
            target.userData.hp <= 0
        ) {

            destroyUnit(
                target
            );

        }

        updateUnitPanel();

    }, 400);

}


function createProjectile(
    start,
    end,
    type
) {

    const color =
        type === "aircraft"
            ? 0xffd56a
            : 0xff8b42;


    const mesh =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                type === "artillery"
                    ? .22
                    : .12,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color
            })
        );


    mesh.position.copy(start);

    projectileGroup.add(mesh);


    const velocity =
        end.clone()
            .sub(start)
            .normalize();


    const distance =
        start.distanceTo(end);


    const duration =
        type === "artillery"
            ? 650
            : 350;


    const startTime =
        performance.now();


    function fly() {

        const t =
            Math.min(
                (performance.now() -
                    startTime) /
                duration,
                1
            );


        mesh.position.lerpVectors(
            start,
            end,
            t
        );


        if (
            type === "artillery"
        ) {

            mesh.position.y +=
                Math.sin(t * Math.PI) *
                Math.min(
                    distance * .25,
                    8
                );

        }


        if (t < 1) {

            requestAnimationFrame(
                fly
            );

        } else {

            projectileGroup.remove(
                mesh
            );

        }

    }


    fly();

}


/* ================= MUZZLE ================= */

function createMuzzleFlash(unit) {

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .45,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffc15a
            })
        );


    flash.position.copy(
        unit.position
    );

    flash.position.y += 2;


    effectsGroup.add(
        flash
    );


    setTimeout(() => {

        effectsGroup.remove(
            flash
        );

    }, 100);

}


/* ================= EXPLOSION ================= */

function createHitEffect(position) {

    const group =
        new THREE.Group();


    const core =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .6,
                10,
                10
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff9e39
            })
        );


    const smoke =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .75,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0x3a3731,
                transparent: true,
                opacity: .7
            })
        );


    group.add(
        core,
        smoke
    );


    group.position.copy(
        position
    );

    group.position.y += .7;


    effectsGroup.add(
        group
    );


    const start =
        performance.now();


    function animateExplosion() {

        const t =
            (performance.now() -
                start) /
            650;


        if (t >= 1) {

            effectsGroup.remove(
                group
            );

            return;

        }


        const scale =
            1 + t * 4;


        core.scale.setScalar(
            scale
        );

        smoke.scale.setScalar(
            1 + t * 2
        );

        core.material.opacity =
            1 - t;

        smoke.material.opacity =
            .7 * (1 - t);


        requestAnimationFrame(
            animateExplosion
        );

    }


    animateExplosion();

}


function destroyUnit(unit) {

    createLargeExplosion(
        unit.position
    );


    showToast(
        `${unit.userData.name} destroyed`
    );


    if (
        state.selectedUnit === unit
    ) {

        state.selectedUnit = null;

        $("unitPanel")
            .classList.remove("open");

    }


    unitsGroup.remove(
        unit
    );


    const index =
        state.units.indexOf(
            unit
        );


    if (index !== -1) {

        state.units.splice(
            index,
            1
        );

    }

}


function createLargeExplosion(position) {

    for (let i = 0; i < 5; i++) {

        setTimeout(() => {

            const offset =
                new THREE.Vector3(
                    (Math.random()-.5)*3,
                    0,
                    (Math.random()-.5)*3
                );

            createHitEffect(
                position.clone()
                    .add(offset)
            );

        }, i * 120);

    }

}


/* ================= AIRSTRIKE ================= */

function launchAirstrike() {

    if (
        state.oil < 50
    ) {

        showToast(
            "Not enough oil for airstrike."
        );

        return;

    }


    state.oil -= 50;

    updateUI();


    const target =
        state.selectedUnit
            ? findNearestEnemy(
                state.selectedUnit
            )
            : null;


    if (!target) {

        showToast(
            "No enemy target available."
        );

        return;

    }


    showToast(
        "✈️ Airstrike inbound!"
    );


    const plane =
        createUnit(
            "aircraft",
            "Airstrike",
            -80,
            target.position.z - 25,
            "friendly"
        );


    plane.position.y =
        12;


    plane.userData.target =
        target.position.clone();


    plane.userData.state =
        "airstrike";

}


function updateAirstrikes(delta) {

    state.units.forEach(unit => {

        if (
            unit.userData.state !==
            "airstrike"
        ) return;


        const target =
            unit.userData.target;


        const direction =
            target.clone()
                .sub(unit.position);

        direction.y = 0;


        if (
            direction.length() < 4
        ) {

            createAirBomb(
                target
            );


            unit.userData.state =
                "retreat";

            unit.userData.target =
                new THREE.Vector3(
                    -100,
                    12,
                    target.z
                );

            return;

        }


        direction.normalize();


        unit.position.add(
            direction.multiplyScalar(
                .45 *
                delta *
                60
            )
        );


        unit.position.y =
            12 +
            Math.sin(
                performance.now()*.004
            ) * .4;


        unit.rotation.y =
            Math.atan2(
                direction.x,
                direction.z
            );

    });

}


function createAirBomb(target) {

    showToast(
        "💥 AIRSTRIKE IMPACT!"
    );


    createLargeExplosion(
        target.clone()
    );


    state.units.forEach(unit => {

        if (
            unit.userData.faction !==
            "enemy"
        ) return;


        if (
            unit.position.distanceTo(
                target
            ) < 18
        ) {

            unit.userData.hp -=
                65;

            if (
                unit.userData.hp <= 0
            ) {

                destroyUnit(
                    unit
                );

            }

        }

    });

}


/* ================= UI ================= */

function updateUI() {

    $("money").textContent =
        Math.floor(state.money)
            .toLocaleString();

    $("oil").textContent =
        Math.floor(state.oil)
            .toLocaleString();

    $("steel").textContent =
        Math.floor(state.steel)
            .toLocaleString();

    $("food").textContent =
        Math.floor(state.food)
            .toLocaleString();

    $("manpower").textContent =
        Math.floor(state.manpower)
            .toLocaleString();


    $("countryName").textContent =
        state.country.name;

    $("countryFlag").textContent =
        state.country.flag;


    const month =
        state.date
            .toLocaleString(
                "en-US",
                {
                    month: "short"
                }
            )
            .toUpperCase();


    $("gameDate").textContent =
        `${state.date.getFullYear()} • ${month} ${String(
            state.date.getDate()
        ).padStart(2,"0")}`;

}


function updateUnitPanel() {

    const unit =
        state.selectedUnit;


    if (!unit) {

        $("unitPanel")
            .classList.remove("open");

        return;

    }


    $("unitPanel")
        .classList.add("open");


    const data =
        unit.userData;


    const type =
        UNIT_TYPES[
            data.type
        ];


    $("selectedUnitType")
        .textContent =
        `${type.icon} ${data.type.toUpperCase()}`;


    $("selectedUnitName")
        .textContent =
        data.name;


    const hp =
        Math.max(
            0,
            Math.round(
                data.hp
            )
        );


    $("unitStats").innerHTML = `

        <div class="unit-stat">
            <span>HEALTH</span>
            <div class="progress">
                <i style="width:${(hp/data.maxHp)*100}%"></i>
            </div>
            <b>${hp}</b>
        </div>

        <div class="unit-stat">
            <span>ATTACK</span>
            <div class="progress">
                <i style="width:${Math.min(data.attack,100)}%"></i>
            </div>
            <b>${Math.round(data.attack)}</b>
        </div>

        <div class="unit-stat">
            <span>DEFENSE</span>
            <div class="progress">
                <i style="width:${Math.min(data.defense,100)}%"></i>
            </div>
            <b>${Math.round(data.defense)}</b>
        </div>

        <div class="stat-row">
            <span>STATUS</span>
            <b>${data.state.toUpperCase()}</b>
        </div>

        <div class="stat-row">
            <span>FACTION</span>
            <b>${data.faction.toUpperCase()}</b>
        </div>

    `;

}


/* ================= PANELS ================= */

function openPanel(name) {

    $("mainPanel")
        .classList.add("open");


    const content =
        $("panelContent");


    const title =
        $("panelTitle");

    const kicker =
        $("panelKicker");


    if (name === "overview") {

        kicker.textContent =
            "STRATEGIC COMMAND";

        title.textContent =
            "World Overview";


        content.innerHTML = `

            <div class="info-card">

                <h3>🌍 Global Situation</h3>

                <p>
                    Your nation is preparing for a major
                    continental conflict. Build your economy,
                    research new technology and secure your
                    borders.
                </p>

            </div>

            <div class="info-card">

                <h3>⚔️ Military Strength</h3>

                <div class="stat-row">
                    <span>Friendly Units</span>
                    <b>${countFaction("friendly")}</b>
                </div>

                <div class="stat-row">
                    <span>Enemy Units</span>
                    <b>${countFaction("enemy")}</b>
                </div>

                <div class="stat-row">
                    <span>Active Battles</span>
                    <b>${state.battles.length}</b>
                </div>

            </div>

            <div class="info-card">

                <h3>🌦️ Battlefield</h3>

                <div class="stat-row">
                    <span>Weather</span>
                    <b>Clear</b>
                </div>

                <div class="stat-row">
                    <span>Visibility</span>
                    <b>High</b>
                </div>

                <div class="stat-row">
                    <span>Time</span>
                    <b>Day</b>
                </div>

            </div>

        `;

    }


    if (name === "army") {

        kicker.textContent =
            "MILITARY COMMAND";

        title.textContent =
            "Army";


        content.innerHTML = `

            <div class="info-card">

                <h3>🪖 Army Overview</h3>

                ${state.units
                    .filter(u =>
                        u.userData.faction ===
                        "friendly"
                    )
                    .map(u => `

                        <div class="stat-row">
                            <span>
                                ${UNIT_TYPES[
                                    u.userData.type
                                ].icon}
                                ${u.userData.name}
                            </span>

                            <b>
                                ${Math.round(
                                    u.userData.hp
                                )} HP
                            </b>
                        </div>

                    `)
                    .join("")}

            </div>

            <button class="action-btn"
                    id="recruitBtn">
                + RECRUIT INFANTRY
            </button>

            <button class="action-btn"
                    id="tankBtn">
                + PRODUCE TANK
            </button>

        `;


        setTimeout(() => {

            $("recruitBtn")
                ?.addEventListener(
                    "click",
                    recruitInfantry
                );

            $("tankBtn")
                ?.addEventListener(
                    "click",
                    produceTank
                );

        });

    }


    if (name === "economy") {

        kicker.textContent =
            "NATIONAL ECONOMY";

        title.textContent =
            "Economy";


        content.innerHTML = `

            <div class="info-card">

                <h3>💰 Treasury</h3>

                <div class="stat-row">
                    <span>Money</span>
                    <b>₿ ${Math.floor(state.money).toLocaleString()}</b>
                </div>

                <div class="stat-row">
                    <span>Oil</span>
                    <b>${Math.floor(state.oil)}</b>
                </div>

                <div class="stat-row">
                    <span>Steel</span>
                    <b>${Math.floor(state.steel)}</b>
                </div>

                <div class="stat-row">
                    <span>Food</span>
                    <b>${Math.floor(state.food)}</b>
                </div>

            </div>

            <div class="info-card">

                <h3>📈 Daily Production</h3>

                <div class="stat-row">
                    <span>Money</span>
                    <b>+150</b>
                </div>

                <div class="stat-row">
                    <span>Oil</span>
                    <b>+12</b>
                </div>

                <div class="stat-row">
                    <span>Steel</span>
                    <b>+25</b>
                </div>

                <div class="stat-row">
                    <span>Food</span>
                    <b>+35</b>
                </div>

            </div>

        `;

    }


    if (name === "production") {

        kicker.textContent =
            "WAR INDUSTRY";

        title.textContent =
            "Production";


        content.innerHTML = `

            <div class="info-card">

                <h3>🏭 Production Queue</h3>

                <div class="stat-row">
                    <span>Infantry</span>
                    <b>READY</b>
                </div>

                <div class="stat-row">
                    <span>Armored Vehicles</span>
                    <b>35%</b>
                </div>

                <div class="stat-row">
                    <span>Aircraft</span>
                    <b>18%</b>
                </div>

            </div>

            <button class="action-btn"
                    id="factoryBtn">
                BUILD MILITARY FACTORY — $2500
            </button>

        `;

        setTimeout(() => {

            $("factoryBtn")
                ?.addEventListener(
                    "click",
                    () => {

                        if (
                            state.money < 2500
                        ) {

                            showToast(
                                "Not enough money."
                            );

                            return;

                        }

                        state.money -= 2500;

                        showToast(
                            "Military factory construction started."
                        );

                        updateUI();

                    }
                );

        });

    }


    if (name === "research") {

        kicker.textContent =
            "TECHNOLOGY";

        title.textContent =
            "Research";


        content.innerHTML = `

            ${researchCard(
                "infantry",
                "🪖",
                "Infantry Weapons"
            )}

            ${researchCard(
                "armor",
                "🛡️",
                "Advanced Armor"
            )}

            ${researchCard(
                "aviation",
                "✈️",
                "Air Technology"
            )}

            ${researchCard(
                "naval",
                "🚢",
                "Naval Engineering"
            )}

            ${researchCard(
                "logistics",
                "🚚",
                "Logistics"
            )}

        `;


        setTimeout(() => {

            document
                .querySelectorAll(
                    "[data-research]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const key =
                                button.dataset
                                    .research;

                            researchTechnology(
                                key
                            );

                        }
                    );

                });

        });

    }


    if (name === "diplomacy") {

        kicker.textContent =
            "FOREIGN AFFAIRS";

        title.textContent =
            "Diplomacy";


        content.innerHTML = `

            ${Object.entries(
                state.diplomacy
            )
                .map(([country, relation]) => `

                    <div class="info-card">

                        <div class="stat-row">
                            <span>${country}</span>
                            <b>${relation}</b>
                        </div>

                        <button class="action-btn"
                            data-diplomacy="${country}">
                            OPEN DIPLOMACY
                        </button>

                    </div>

                `)
                .join("")}

        `;


        setTimeout(() => {

            document
                .querySelectorAll(
                    "[data-diplomacy]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const country =
                                button.dataset
                                    .diplomacy;

                            showToast(
                                `Diplomatic channel opened with ${country}`
                            );

                        }
                    );

                });

        });

    }


    if (name === "intel") {

        kicker.textContent =
            "INTELLIGENCE AGENCY";

        title.textContent =
            "Intelligence";


        content.innerHTML = `

            <div class="info-card">

                <h3>🕵️ Reconnaissance</h3>

                <p>
                    Enemy formations detected near
                    the eastern frontier.
                </p>

                <div class="stat-row">
                    <span>Enemy Units Detected</span>
                    <b>${countFaction("enemy")}</b>
                </div>

                <div class="stat-row">
                    <span>Intel Confidence</span>
                    <b>74%</b>
                </div>

            </div>

            <button class="action-btn"
                    id="reconBtn">
                RUN RECON MISSION — $500
            </button>

        `;


        setTimeout(() => {

            $("reconBtn")
                ?.addEventListener(
                    "click",
                    runRecon
                );

        });

    }


    if (name === "settings") {

        kicker.textContent =
            "SYSTEM";

        title.textContent =
            "Settings";


        content.innerHTML = `

            <div class="info-card">

                <h3>🎮 Graphics</h3>

                <div class="stat-row">
                    <span>Quality</span>
                    <b>${state.settings.graphics}</b>
                </div>

                <button class="action-btn"
                        id="graphicsBtn">
                    CHANGE GRAPHICS
                </button>

            </div>

            <div class="info-card">

                <h3>📱 Controls</h3>

                <div class="stat-row">
                    <span>Camera Sensitivity</span>
                    <b>${state.settings.cameraSensitivity}</b>
                </div>

                <div class="stat-row">
                    <span>Vibration</span>
                    <b>${state.settings.vibration ? "ON" : "OFF"}</b>
                </div>

                <div class="stat-row">
                    <span>Cinematic Camera</span>
                    <b>${state.settings.cinematic ? "ON" : "OFF"}</b>
                </div>

                <button class="action-btn"
                        id="vibrationBtn">
                    TOGGLE VIBRATION
                </button>

                <button class="action-btn"
                        id="cinematicBtn">
                    TOGGLE CINEMATIC CAMERA
                </button>

            </div>

        `;


        setTimeout(() => {

            $("graphicsBtn")
                ?.addEventListener(
                    "click",
                    cycleGraphics
                );

            $("vibrationBtn")
                ?.addEventListener(
                    "click",
                    () => {

                        state.settings.vibration =
                            !state.settings.vibration;

                        openPanel(
                            "settings"
                        );

                    }
                );

            $("cinematicBtn")
                ?.addEventListener(
                    "click",
                    () => {

                        state.settings.cinematic =
                            !state.settings.cinematic;

                        openPanel(
                            "settings"
                        );

                    }
                );

        });

    }

}


function researchCard(
    key,
    icon,
    title
) {

    const level =
        state.technology[key];


    return `

        <div class="info-card">

            <div class="stat-row">

                <span>
                    ${icon} ${title}
                </span>

                <b>
                    LV.${level}
                </b>

            </div>

            <div class="progress">
                <i style="
                    width:${Math.min(
                        level * 25,
                        100
                    )}%
                "></i>
            </div>

            <button
                class="action-btn"
                data-research="${key}">
                RESEARCH — $1000
            </button>

        </div>

    `;

}


/* ================= ACTIONS ================= */

function recruitInfantry() {

    if (
        state.money < 100
    ) {

        showToast(
            "Not enough money."
        );

        return;

    }


    if (
        state.manpower < 1000
    ) {

        showToast(
            "Not enough manpower."
        );

        return;

    }


    state.money -= 100;

    state.manpower -= 1000;


    const unit =
        createUnit(
            "infantry",
            `Infantry Division ${state.units.length + 1}`,
            -15,
            5 + Math.random()*10,
            "friendly"
        );


    selectUnit(unit);

    updateUI();

    showToast(
        "New infantry division recruited."
    );

    openPanel(
        "army"
    );

}


function produceTank() {

    if (
        state.money < 250
    ) {

        showToast(
            "Not enough money."
        );

        return;

    }


    if (
        state.steel < 120
    ) {

        showToast(
            "Not enough steel."
        );

        return;

    }


    state.money -= 250;

    state.steel -= 120;


    const unit =
        createUnit(
            "tank",
            `Armored Division ${state.units.length + 1}`,
            -12,
            0 + Math.random()*15,
            "friendly"
        );


    selectUnit(unit);

    updateUI();

    showToast(
        "New tank division produced."
    );

}


function researchTechnology(key) {

    if (
        state.money < 1000
    ) {

        showToast(
            "Not enough money."
        );

        return;

    }


    state.money -= 1000;

    state.technology[key]++;


    showToast(
        `${key.toUpperCase()} technology upgraded to level ${state.technology[key]}`
    );


    updateUI();

    openPanel(
        "research"
    );

}


function runRecon() {

    if (
        state.money < 500
    ) {

        showToast(
            "Not enough money."
        );

        return;

    }


    state.money -= 500;


    showToast(
        "🕵️ Recon mission completed. Enemy positions revealed."
    );


    updateUI();

}


function cycleGraphics() {

    const options = [
        "Low",
        "Medium",
        "High",
        "Ultra"
    ];


    let index =
        options.indexOf(
            state.settings.graphics
        );


    index =
        (index + 1) %
        options.length;


    state.settings.graphics =
        options[index];


    applyGraphics();

    openPanel(
        "settings"
    );

}


function applyGraphics() {

    const quality =
        state.settings.graphics;


    let pixelRatio = 1;


    if (quality === "Medium")
        pixelRatio = 1.25;

    if (quality === "High")
        pixelRatio = 1.6;

    if (quality === "Ultra")
        pixelRatio = 2;


    renderer.setPixelRatio(
        Math.min(
            pixelRatio,
            window.devicePixelRatio * 1.2
        )
    );


    showToast(
        `Graphics: ${quality}`
    );

}


/* ================= GAME TIME ================= */

let gameTimeAccumulator = 0;


function updateGameTime(delta) {

    if (
        state.paused
    ) return;


    gameTimeAccumulator +=
        delta *
        state.speed;


    if (
        gameTimeAccumulator >= 3
    ) {

        gameTimeAccumulator = 0;


        state.date.setDate(
            state.date.getDate() + 1
        );


        state.money += 150;

        state.oil += 12;

        state.steel += 25;

        state.food += 35;


        updateUI();

    }

}


/* ================= SPEED ================= */

function togglePause() {

    state.paused =
        !state.paused;


    $("pauseBtn")
        .textContent =
        state.paused
            ? "▶"
            : "Ⅱ";


    showToast(
        state.paused
            ? "Game paused"
            : "Game resumed"
    );

}


function cycleSpeed() {

    const speeds = [
        1,
        2,
        4,
        8
    ];


    let index =
        speeds.indexOf(
            state.speed
        );


    index =
        (index + 1) %
        speeds.length;


    state.speed =
        speeds[index];


    $("speedBtn")
        .textContent =
        `${state.speed}×`;

}


/* ================= UNIT COMMANDS ================= */

function setupCommandButtons() {

    $("moveCommand")
        .addEventListener(
            "click",
            () => {

                if (
                    !state.selectedUnit
                ) {

                    showToast(
                        "Select a unit."
                    );

                    return;

                }

                showToast(
                    "Tap the battlefield to move the selected unit."
                );

            }
        );


    $("attackCommand")
        .addEventListener(
            "click",
            commandAttack
        );


    $("defendCommand")
        .addEventListener(
            "click",
            () => {

                if (
                    !state.selectedUnit
                ) return;

                state.selectedUnit
                    .userData.state =
                    "defending";

                showToast(
                    `${state.selectedUnit.userData.name} is defending.`
                );

                updateUnitPanel();

            }
        );


    $("holdCommand")
        .addEventListener(
            "click",
            () => {

                if (
                    !state.selectedUnit
                ) return;

                state.selectedUnit
                    .userData.target =
                    null;

                state.selectedUnit
                    .userData.state =
                    "idle";

                showToast(
                    "Unit holding position."
                );

                updateUnitPanel();

            }
        );


    $("retreatCommand")
        .addEventListener(
            "click",
            () => {

                if (
                    !state.selectedUnit
                ) return;


                commandMove(
                    state.selectedUnit,
                    new THREE.Vector3(
                        -50,
                        0,
                        55
                    )
                );

                showToast(
                    "Retreat order issued."
                );

            }
        );


    $("airstrikeCommand")
        .addEventListener(
            "click",
            launchAirstrike
        );

}


/* ================= CAMERA ================= */

function setupCameraButtons() {

    $("zoomIn")
        .addEventListener(
            "click",
            () => {

                camera.position.y *= .85;
                camera.position.z *= .85;

            }
        );


    $("zoomOut")
        .addEventListener(
            "click",
            () => {

                camera.position.y *= 1.15;
                camera.position.z *= 1.15;

            }
        );


    $("resetCamera")
        .addEventListener(
            "click",
            () => {

                camera.position.set(
                    0,
                    70,
                    75
                );

                controls.target.set(
                    0,
                    0,
                    0
                );

            }
        );

}


/* ================= COUNTRY ================= */

function selectCountry(id) {

    const countries = {

        USA: {
            name: "United States",
            flag: "🇺🇸"
        },

        GERMANY: {
            name: "Germany",
            flag: "🇩🇪"
        },

        UK: {
            name: "United Kingdom",
            flag: "🇬🇧"
        },

        JAPAN: {
            name: "Japan",
            flag: "🇯🇵"
        },

        USSR: {
            name: "Soviet Union",
            flag: "☭"
        },

        FRANCE: {
            name: "France",
            flag: "🇫🇷"
        }

    };


    if (
        !countries[id]
    ) return;


    state.country = {
        id,
        ...countries[id]
    };


    $("countryModal")
        .classList.remove(
            "open"
        );


    updateUI();


    showToast(
        `${state.country.flag} ${state.country.name} selected`
    );

}


/* ================= EVENTS ================= */

function setupEvents() {

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


    $("closePanel")
        .addEventListener(
            "click",
            () => {

                $("mainPanel")
                    .classList.remove(
                        "open"
                    );

            }
        );


    $("closeUnit")
        .addEventListener(
            "click",
            () => {

                if (
                    state.selectedUnit
                ) {

                    deselectUnit(
                        state.selectedUnit
                    );

                }

                state.selectedUnit = null;

                $("unitPanel")
                    .classList.remove(
                        "open"
                    );

            }
        );


    $("pauseBtn")
        .addEventListener(
            "click",
            togglePause
        );


    $("speedBtn")
        .addEventListener(
            "click",
            cycleSpeed
        );


    setupCommandButtons();

    setupCameraButtons();


    document
        .querySelectorAll(
            ".country-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    selectCountry(
                        card.dataset.country
                    );

                }
            );

        });


    $("closeCountryModal")
        .addEventListener(
            "click",
            () => {

                $("countryModal")
                    .classList.remove(
                        "open"
                    );

            }
        );


    $("tutorialNext")
        .addEventListener(
            "click",
            nextTutorial
        );

}


/* ================= TUTORIAL ================= */

let tutorialStep = 0;


const tutorialSteps = [

    [
        "Welcome, Commander",
        "This is your strategic world. Tap a military unit to select it."
    ],

    [
        "Move Your Army",
        "After selecting a unit, tap anywhere on the terrain to issue a movement order."
    ],

    [
        "Attack",
        "Use ATTACK to engage the nearest enemy. Units will move into range and fire automatically."
    ],

    [
        "Build Your Nation",
        "Use Economy, Production and Research to strengthen your country."
    ],

    [
        "Command Complete",
        "You are ready. Build your army, control the battlefield and expand your nation."
    ]

];


function startTutorial() {

    $("tutorial")
        .style.display =
        "grid";


    showTutorial();

}


function showTutorial() {

    const step =
        tutorialSteps[
            tutorialStep
        ];


    $("tutorialTitle")
        .textContent =
        step[0];

    $("tutorialText")
        .textContent =
        step[1];


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
            "Welcome to the battlefield, Commander."
        );

        return;

    }


    showTutorial();

}


/* ================= TOAST ================= */

let toastTimer;


function showToast(message) {

    const toast =
        $("toast");


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


/* ================= STATUS ================= */

function updateBattleStatus(text) {

    $("battleStatus")
        .textContent =
        text;

}


function countFaction(faction) {

    return state.units.filter(
        u =>
            u.userData.faction ===
            faction
    ).length;

}


/* ================= MINI MAP ================= */

function updateMiniMap() {

    const container =
        $("miniUnits");


    if (!container)
        return;


    container.innerHTML =
        "";


    state.units.forEach(unit => {

        const dot =
            document.createElement(
                "div"
            );


        const x =
            ((unit.position.x + 90) / 180) * 100;

        const z =
            ((unit.position.z + 70) / 140) * 100;


        dot.style.position =
            "absolute";

        dot.style.width =
            "4px";

        dot.style.height =
            "4px";

        dot.style.borderRadius =
            "50%";

        dot.style.left =
            `${Math.max(0,Math.min(98,x))}%`;

        dot.style.top =
            `${Math.max(0,Math.min(98,z))}%`;

        dot.style.background =
            unit.userData.faction ===
            "enemy"
                ? "#e45d5d"
                : "#59c9ff";


        container.appendChild(
            dot
        );

    });

}


/* ================= ANIMATION LOOP ================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            .05
        );


    controls.update();


    if (!state.paused) {

        updateGameTime(
            delta
        );

        updateUnitMovement(
            delta
        );

        updateCombat(
            delta
        );

        updateAirstrikes(
            delta
        );

    }


    if (
        selectedMarker &&
        state.selectedUnit
    ) {

        selectedMarker.position.copy(
            state.selectedUnit.position
        );

        selectedMarker.position.y =
            .16;

        selectedMarker.rotation.z +=
            delta * .8;

    }


    updateMiniMap();


    renderer.render(
        scene,
        camera
    );

}


/* ================= RESIZE ================= */

function onResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}


/* ================= START ================= */

boot();