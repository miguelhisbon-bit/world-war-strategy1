/* =========================================================
   WORLD WAR: BATTLEFIELD
   3D STRATEGY GAME
========================================================= */

const canvas = document.getElementById("gameCanvas");

let scene;
let camera;
let renderer;
let clock;

let selectedUnit = null;

let units = [];
let projectiles = [];
let explosions = [];
let effects = [];

let money = 5000;
let energy = 100;
let score = 0;

let gamePaused = false;
let gameSpeed = 1;

let enemyBase;
let playerBase;

let battlefieldSize = 180;

let cameraTarget = new THREE.Vector3(0, 0, 0);

let touchStart = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


/* =========================================================
   UNIT CONFIG
========================================================= */

const UNIT_TYPES = {

    infantry: {
        name: "Infantry",
        icon: "🪖",
        type: "SOLDIER",
        hp: 100,
        attack: 15,
        defense: 10,
        speed: 7,
        range: 18,
        cost: 500,
        color: 0x556b45
    },

    tank: {
        name: "Heavy Tank",
        icon: "🛡️",
        type: "ARMORED",
        hp: 300,
        attack: 45,
        defense: 40,
        speed: 4,
        range: 30,
        cost: 1500,
        color: 0x394b38
    },

    artillery: {
        name: "Artillery",
        icon: "💥",
        type: "ARTILLERY",
        hp: 180,
        attack: 70,
        defense: 20,
        speed: 2.5,
        range: 55,
        cost: 2000,
        color: 0x4d5140
    }

};


/* =========================================================
   INIT
========================================================= */

function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x78908a);

    scene.fog = new THREE.Fog(
        0x78908a,
        80,
        250
    );


    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );

    camera.position.set(
        0,
        75,
        70
    );

    camera.lookAt(
        cameraTarget
    );


    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    clock = new THREE.Clock();


    setupLighting();

    createBattlefield();

    createBases();

    createEnvironment();

    createInitialArmy();

    createEnemyArmy();

    setupEvents();

    animate();

}


/* =========================================================
   LIGHTING
========================================================= */

function setupLighting() {

    const hemi = new THREE.HemisphereLight(
        0xb8d1c3,
        0x20251f,
        1.8
    );

    scene.add(hemi);


    const sun = new THREE.DirectionalLight(
        0xffffff,
        2
    );

    sun.position.set(
        -50,
        100,
        50
    );

    sun.castShadow = true;

    scene.add(sun);


    const moon = new THREE.DirectionalLight(
        0x8fa9ff,
        .3
    );

    moon.position.set(
        50,
        30,
        -80
    );

    scene.add(moon);

}


/* =========================================================
   BATTLEFIELD
========================================================= */

function createBattlefield() {

    const groundGeometry =
        new THREE.PlaneGeometry(
            battlefieldSize,
            battlefieldSize,
            60,
            60
        );

    const groundMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x596653,
            roughness: 1
        });

    const ground =
        new THREE.Mesh(
            groundGeometry,
            groundMaterial
        );

    ground.rotation.x = -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);


    /* GRID */

    const grid =
        new THREE.GridHelper(
            battlefieldSize,
            36,
            0x344038,
            0x465348
        );

    grid.position.y = .03;

    grid.material.opacity = .25;
    grid.material.transparent = true;

    scene.add(grid);


    /* TERRAIN */

    for (let i = 0; i < 60; i++) {

        const rock =
            createRock();

        rock.position.set(
            randomTerrain(),
            .5,
            randomTerrain()
        );

        scene.add(rock);
    }


    /* ROAD */

    createRoad(
        0,
        0,
        battlefieldSize,
        9,
        0x3d4038
    );

}


/* =========================================================
   ROAD
========================================================= */

function createRoad(
    x,
    z,
    length,
    width,
    color
) {

    const geo =
        new THREE.PlaneGeometry(
            width,
            length
        );

    const mat =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 1
        });

    const road =
        new THREE.Mesh(
            geo,
            mat
        );

    road.rotation.x =
        -Math.PI / 2;

    road.position.set(
        x,
        .04,
        z
    );

    scene.add(road);

}


/* =========================================================
   ROCK
========================================================= */

function createRock() {

    const geo =
        new THREE.DodecahedronGeometry(
            Math.random() * 2 + 1,
            0
        );

    const mat =
        new THREE.MeshStandardMaterial({
            color:
                0x555b52
        });

    const rock =
        new THREE.Mesh(
            geo,
            mat
        );

    rock.scale.y =
        Math.random() * .6 + .4;

    return rock;

}


/* =========================================================
   TREES
========================================================= */

function createTree(
    x,
    z
) {

    const group =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .35,
                .5,
                3
            ),
            new THREE.MeshStandardMaterial({
                color: 0x55412e
            })
        );

    trunk.position.y = 1.5;

    group.add(trunk);


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const leaves =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    2.5 - i * .4,
                    4,
                    7
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x273c28
                })
            );

        leaves.position.y =
            3 + i * 1.5;

        group.add(leaves);
    }


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


/* =========================================================
   ENVIRONMENT
========================================================= */

function createEnvironment() {

    for (let i = 0; i < 40; i++) {

        let x =
            randomTerrain();

        let z =
            randomTerrain();

        if (
            Math.abs(x) < 15 &&
            Math.abs(z) < 15
        ) {
            continue;
        }

        createTree(x, z);

    }


    /* destroyed vehicles */

    for (let i = 0; i < 8; i++) {

        const wreck =
            createTankMesh(
                0x222823
            );

        wreck.rotation.y =
            Math.random() * Math.PI;

        wreck.position.set(
            randomTerrain(),
            .4,
            randomTerrain()
        );

        scene.add(wreck);
    }

}


/* =========================================================
   BASES
========================================================= */

function createBases() {

    playerBase =
        createBase(
            -65,
            0,
            0x375b38,
            "PLAYER BASE"
        );

    enemyBase =
        createBase(
            65,
            0,
            0x6b3630,
            "ENEMY BASE"
        );

}


/* =========================================================
   BASE
========================================================= */

function createBase(
    x,
    z,
    color,
    name
) {

    const group =
        new THREE.Group();


    const platform =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                9,
                11,
                1,
                24
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    platform.position.y = .5;

    group.add(platform);


    const tower =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                6,
                5
            ),
            new THREE.MeshStandardMaterial({
                color:
                    color
            })
        );

    tower.position.y = 3.5;

    group.add(tower);


    const flag =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .2,
                8,
                .2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x222222
            })
        );

    flag.position.set(
        0,
        7,
        0
    );

    group.add(flag);


    const flagCloth =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                3,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color,
                side: THREE.DoubleSide
            })
        );

    flagCloth.position.set(
        1.4,
        8,
        0
    );

    group.add(flagCloth);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    return group;

}


/* =========================================================
   INITIAL ARMY
========================================================= */

function createInitialArmy() {

    spawnUnit(
        "infantry",
        -45,
        -8,
        true
    );

    spawnUnit(
        "infantry",
        -48,
        0,
        true
    );

    spawnUnit(
        "infantry",
        -45,
        8,
        true
    );

    spawnUnit(
        "tank",
        -38,
        0,
        true
    );

    spawnUnit(
        "artillery",
        -42,
        15,
        true
    );

}


/* =========================================================
   ENEMY ARMY
========================================================= */

function createEnemyArmy() {

    spawnUnit(
        "infantry",
        45,
        -8,
        false
    );

    spawnUnit(
        "infantry",
        48,
        0,
        false
    );

    spawnUnit(
        "infantry",
        45,
        8,
        false
    );

    spawnUnit(
        "tank",
        38,
        0,
        false
    );

    spawnUnit(
        "artillery",
        42,
        15,
        false
    );

}


/* =========================================================
   SPAWN UNIT
========================================================= */

function spawnUnit(
    type,
    x,
    z,
    player
) {

    const data =
        UNIT_TYPES[type];

    const mesh =
        type === "tank"
            ? createTankMesh(data.color)
            : type === "artillery"
                ? createArtilleryMesh(data.color)
                : createInfantryMesh(data.color);


    mesh.position.set(
        x,
        0,
        z
    );


    mesh.userData.unit = {

        type,

        player,

        hp: data.hp,

        maxHP: data.hp,

        attack: data.attack,

        defense: data.defense,

        speed: data.speed,

        range: data.range,

        target: null,

        moving: false,

        cooldown: 0,

        selected: false

    };


    scene.add(mesh);

    units.push(mesh);

    return mesh;

}


/* =========================================================
   INFANTRY
========================================================= */

function createInfantryMesh(color) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                .45,
                1.2,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    body.position.y = 1;

    group.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .4,
                12,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb89a76
            })
        );

    head.position.y = 2;

    group.add(head);


    const helmet =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .43,
                12,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x343a30
            })
        );

    helmet.scale.y = .55;

    helmet.position.y = 2.15;

    group.add(helmet);


    const weapon =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .12,
                .12,
                1.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x191c19
            })
        );

    weapon.position.set(
        .45,
        1.1,
        -.45
    );

    weapon.rotation.x = -.3;

    group.add(weapon);


    return group;

}


/* =========================================================
   TANK
========================================================= */

function createTankMesh(color) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4,
                1.4,
                5
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    body.position.y = 1;

    group.add(body);


    /* tracks */

    for (
        const side of [-1, 1]
    ) {

        const track =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1,
                    1.2,
                    5.4
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x181b18
                })
            );

        track.position.set(
            side * 2,
            .8,
            0
        );

        group.add(track);

    }


    const turret =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.5,
                1.5,
                .8,
                12
            ),
            new THREE.MeshStandardMaterial({
                color:
                    color
            })
        );

    turret.position.y = 2;

    group.add(turret);


    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .18,
                .18,
                4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x151815
            })
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.set(
        0,
        2,
        -2.3
    );

    group.add(barrel);


    group.userData.turret = turret;

    return group;

}


/* =========================================================
   ARTILLERY
========================================================= */

function createArtilleryMesh(color) {

    const group =
        createTankMesh(color);

    group.scale.set(
        1.05,
        .85,
        1.15
    );

    return group;

}


/* =========================================================
   RANDOM TERRAIN
========================================================= */

function randomTerrain() {

    return (
        Math.random()
        * battlefieldSize
        - battlefieldSize / 2
    );

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    window.addEventListener(
        "resize",
        onResize
    );


    canvas.addEventListener(
        "pointerdown",
        onPointerDown
    );

    canvas.addEventListener(
        "pointermove",
        onPointerMove
    );

    canvas.addEventListener(
        "pointerup",
        onPointerUp
    );


    document
        .getElementById("attackButton")
        .onclick =
        attackSelected;


    document
        .getElementById("bombButton")
        .onclick =
        artilleryStrike;


    document
        .getElementById("moveButton")
        .onclick =
        enableMoveMode;


    document
        .getElementById("closeUnit")
        .onclick =
        deselectUnit;


    document
        .getElementById("pauseButton")
        .onclick =
        togglePause;


    document
        .getElementById("speedButton")
        .onclick =
        changeSpeed;


    document
        .getElementById("resetButton")
        .onclick =
        () => location.reload();


    document
        .querySelectorAll(".produce")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    produceUnit(
                        button.dataset.unit
                    );

                }
            );

        });


    document
        .getElementById("messageButton")
        .onclick =
        () => {

            document
                .getElementById("gameMessage")
                .classList.remove("show");

        };


    document
        .getElementById("camUp")
        .onclick =
        () => moveCamera(0, -5);

    document
        .getElementById("camDown")
        .onclick =
        () => moveCamera(0, 5);

    document
        .getElementById("camLeft")
        .onclick =
        () => moveCamera(-5, 0);

    document
        .getElementById("camRight")
        .onclick =
        () => moveCamera(5, 0);

}


/* =========================================================
   POINTER
========================================================= */

function onPointerDown(e) {

    touchStart = {
        x: e.clientX,
        y: e.clientY
    };

}


function onPointerMove(e) {

    if (!touchStart)
        return;


    const dx =
        e.clientX -
        touchStart.x;

    const dy =
        e.clientY -
        touchStart.y;


    if (
        Math.abs(dx) > 10 ||
        Math.abs(dy) > 10
    ) {

        cameraTarget.x -= dx * .08;
        cameraTarget.z -= dy * .08;

        clampCamera();

        touchStart.x =
            e.clientX;

        touchStart.y =
            e.clientY;

    }

}


function onPointerUp(e) {

    if (!touchStart)
        return;


    const dx =
        e.clientX -
        touchStart.x;

    const dy =
        e.clientY -
        touchStart.y;


    if (
        Math.abs(dx) < 12 &&
        Math.abs(dy) < 12
    ) {

        handleTap(
            e.clientX,
            e.clientY
        );

    }


    touchStart = null;

}


/* =========================================================
   TAP
========================================================= */

function handleTap(
    clientX,
    clientY
) {

    mouse.x =
        (clientX / window.innerWidth)
        * 2 - 1;

    mouse.y =
        -(clientY / window.innerHeight)
        * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const meshes =
        units.filter(
            unit =>
                unit.userData.unit.hp > 0
        );


    const hits =
        raycaster.intersectObjects(
            meshes,
            true
        );


    if (hits.length) {

        let object =
            hits[0].object;


        while (
            object.parent &&
            !object.userData.unit
        ) {

            object =
                object.parent;

        }


        if (
            object.userData.unit &&
            object.userData.unit.player
        ) {

            selectUnit(object);

            return;

        }

    }


    if (selectedUnit) {

        const point =
            getGroundPoint(
                clientX,
                clientY
            );

        if (point) {

            selectedUnit.userData.unit.target =
                point;

            selectedUnit.userData.unit.moving =
                true;

        }

    }

}


/* =========================================================
   GROUND POINT
========================================================= */

function getGroundPoint(
    clientX,
    clientY
) {

    mouse.x =
        clientX /
        window.innerWidth * 2 - 1;

    mouse.y =
        -(clientY /
            window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


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


    return point;

}


/* =========================================================
   SELECT
========================================================= */

function selectUnit(unit) {

    deselectUnit();

    selectedUnit = unit;

    unit.userData.unit.selected =
        true;


    const ring =
        new THREE.Mesh(
            new THREE.RingGeometry(
                1.5,
                1.8,
                32
            ),
            new THREE.MeshBasicMaterial({
                color: 0x5dff8a,
                side:
                    THREE.DoubleSide
            })
        );


    ring.rotation.x =
        -Math.PI / 2;

    ring.position.y =
        .08;


    unit.add(ring);

    unit.userData.selectionRing =
        ring;


    updateUnitUI();

}


/* =========================================================
   DESELECT
========================================================= */

function deselectUnit() {

    if (!selectedUnit)
        return;


    const ring =
        selectedUnit.userData.selectionRing;


    if (ring) {

        selectedUnit.remove(ring);

        ring.geometry.dispose();
        ring.material.dispose();

    }


    selectedUnit.userData.unit.selected =
        false;


    selectedUnit = null;


    document
        .getElementById("unitInfo")
        .classList.add("hidden");

}


/* =========================================================
   UI
========================================================= */

function updateUnitUI() {

    if (!selectedUnit)
        return;


    const data =
        selectedUnit.userData.unit;

    const config =
        UNIT_TYPES[data.type];


    document
        .getElementById("unitInfo")
        .classList.remove("hidden");


    document
        .getElementById("selectedIcon")
        .textContent =
        config.icon;


    document
        .getElementById("selectedName")
        .textContent =
        config.name;


    document
        .getElementById("selectedType")
        .textContent =
        config.type;


    document
        .getElementById("attackStat")
        .textContent =
        data.attack;


    document
        .getElementById("defenseStat")
        .textContent =
        data.defense;


    document
        .getElementById("speedStat")
        .textContent =
        data.speed;


    updateHPUI();

}


function updateHPUI() {

    if (!selectedUnit)
        return;


    const data =
        selectedUnit.userData.unit;


    const percent =
        Math.max(
            0,
            data.hp /
            data.maxHP * 100
        );


    document
        .getElementById("selectedHP")
        .style.width =
        percent + "%";


    document
        .getElementById("selectedHPText")
        .textContent =
        Math.ceil(data.hp)
        + "/" +
        data.maxHP;

}


/* =========================================================
   MOVE MODE
========================================================= */

function enableMoveMode() {

    if (!selectedUnit)
        return;

    showMessage(
        "MOVE UNIT",
        "Tap anywhere on the battlefield to move your selected unit."
    );

}


/* =========================================================
   ATTACK
========================================================= */

function attackSelected() {

    if (!selectedUnit)
        return;


    const enemy =
        findNearestEnemy(
            selectedUnit
        );


    if (!enemy) {

        showMessage(
            "NO TARGET",
            "No enemy is within attack range."
        );

        return;

    }


    fireWeapon(
        selectedUnit,
        enemy
    );

}


/* =========================================================
   FIND ENEMY
========================================================= */

function findNearestEnemy(
    unit
) {

    const data =
        unit.userData.unit;


    let closest = null;
    let distance = Infinity;


    units.forEach(other => {

        const otherData =
            other.userData.unit;


        if (
            otherData.hp <= 0 ||
            otherData.player === data.player
        )
            return;


        const d =
            unit.position.distanceTo(
                other.position
            );


        if (
            d < distance &&
            d <= data.range
        ) {

            distance = d;
            closest = other;

        }

    });


    return closest;

}


/* =========================================================
   FIRE WEAPON
========================================================= */

function fireWeapon(
    attacker,
    target
) {

    const data =
        attacker.userData.unit;


    if (data.cooldown > 0)
        return;


    const start =
        attacker.position.clone();

    start.y += 2;


    const end =
        target.position.clone();

    end.y += 1;


    createProjectile(
        start,
        end,
        attacker,
        target
    );


    data.cooldown =
        attacker.userData.unit.type ===
            "artillery"
            ? 3
            : 1.2;

}


/* =========================================================
   PROJECTILE
========================================================= */

function createProjectile(
    start,
    end,
    attacker,
    target
) {

    const geo =
        new THREE.SphereGeometry(
            .15,
            8,
            8
        );

    const mat =
        new THREE.MeshBasicMaterial({
            color: 0xffcc66
        });


    const bullet =
        new THREE.Mesh(
            geo,
            mat
        );


    bullet.position.copy(
        start
    );


    bullet.userData = {

        start:
            start.clone(),

        end:
            end.clone(),

        progress: 0,

        attacker,

        target

    };


    scene.add(bullet);

    projectiles.push(
        bullet
    );


    createMuzzleFlash(
        start
    );

}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function createMuzzleFlash(
    position
) {

    const flash =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .6,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffaa44,
                transparent: true
            })
        );


    flash.position.copy(
        position
    );


    scene.add(flash);


    effects.push({
        mesh: flash,
        life: .12
    });

}


/* =========================================================
   UPDATE PROJECTILES
========================================================= */

function updateProjectiles(
    delta
) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            projectiles[i];


        bullet.userData.progress +=
            delta * 4 * gameSpeed;


        const p =
            Math.min(
                1,
                bullet.userData.progress
            );


        bullet.position.lerpVectors(
            bullet.userData.start,
            bullet.userData.end,
            p
        );


        if (p >= 1) {

            const target =
                bullet.userData.target;


            if (
                target &&
                target.userData.unit.hp > 0
            ) {

                damageUnit(
                    target,
                    bullet.userData.attacker
                );

            }


            createExplosion(
                bullet.position.clone(),
                .8
            );


            scene.remove(
                bullet
            );


            bullet.geometry.dispose();
            bullet.material.dispose();


            projectiles.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   DAMAGE
========================================================= */

function damageUnit(
    target,
    attacker
) {

    const targetData =
        target.userData.unit;

    const attackerData =
        attacker.userData.unit;


    let damage =
        attackerData.attack *
        (100 /
            (100 +
                targetData.defense));


    damage *=
        .8 +
        Math.random() * .4;


    targetData.hp -= damage;


    if (
        target === selectedUnit
    ) {

        updateHPUI();

        flashDamage();

    }


    if (
        targetData.hp <= 0
    ) {

        destroyUnit(
            target
        );

    }


    updateScore();

}


/* =========================================================
   DESTROY UNIT
========================================================= */

function destroyUnit(
    unit
) {

    createExplosion(
        unit.position.clone(),
        2
    );


    unit.visible = false;

    unit.userData.unit.hp = 0;


    if (
        selectedUnit === unit
    ) {

        deselectUnit();

    }


    const index =
        units.indexOf(unit);


    if (index !== -1) {

        units.splice(
            index,
            1
        );

    }


    checkVictory();

}


/* =========================================================
   EXPLOSION
========================================================= */

function createExplosion(
    position,
    size = 1
) {

    const group =
        new THREE.Group();


    const fire =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                size,
                12,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff7b22,
                transparent: true
            })
        );


    const smoke =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                size * .8,
                10,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0x333333,
                transparent: true
            })
        );


    smoke.position.y =
        size * .5;


    group.add(
        fire,
        smoke
    );


    group.position.copy(
        position
    );


    scene.add(
        group
    );


    explosions.push({
        group,
        fire,
        smoke,
        life: .65,
        maxLife: .65
    });

}


/* =========================================================
   UPDATE EXPLOSIONS
========================================================= */

function updateExplosions(
    delta
) {

    for (
        let i = explosions.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            explosions[i];


        e.life -=
            delta *
            gameSpeed;


        const p =
            1 -
            e.life /
            e.maxLife;


        e.fire.scale.setScalar(
            1 + p * 2
        );


        e.smoke.scale.setScalar(
            1 + p * 3
        );


        e.fire.material.opacity =
            1 - p;


        e.smoke.material.opacity =
            .7 - p * .7;


        e.group.position.y +=
            delta * 4;


        if (
            e.life <= 0
        ) {

            scene.remove(
                e.group
            );

            explosions.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   BOMBING
========================================================= */

function artilleryStrike() {

    if (!selectedUnit)
        return;


    const data =
        selectedUnit.userData.unit;


    if (
        data.type !== "artillery"
    ) {

        showMessage(
            "ARTILLERY REQUIRED",
            "Select an artillery unit first."
        );

        return;

    }


    const target =
        findNearestEnemy(
            selectedUnit
        );


    if (!target) {

        showMessage(
            "NO TARGET",
            "No enemy is close enough."
        );

        return;

    }


    const center =
        target.position.clone();


    /* multiple shells */

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        setTimeout(
            () => {

                const offset =
                    new THREE.Vector3(
                        (Math.random() - .5) * 8,
                        0,
                        (Math.random() - .5) * 8
                    );


                const impact =
                    center.clone()
                    .add(offset);


                createBomb(
                    selectedUnit.position.clone()
                    .add(
                        new THREE.Vector3(
                            0,
                            3,
                            0
                        )
                    ),
                    impact,
                    target
                );

            },
            i * 180
        );

    }

}


/* =========================================================
   BOMB
========================================================= */

function createBomb(
    start,
    end,
    target
) {

    const bomb =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .2,
                8,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x151515
            })
        );


    bomb.position.copy(
        start
    );


    bomb.userData = {
        start,
        end,
        target,
        progress: 0
    };


    scene.add(
        bomb
    );


    effects.push({
        bomb,
        bombEffect: true
    });

}


/* =========================================================
   UPDATE BOMB
========================================================= */

function updateBombs(
    delta
) {

    effects.forEach(
        effect => {

            if (
                !effect.bombEffect
            )
                return;


            const bomb =
                effect.bomb;


            const d =
                bomb.userData;


            d.progress +=
                delta *
                1.4 *
                gameSpeed;


            const p =
                Math.min(
                    1,
                    d.progress
                );


            bomb.position.lerpVectors(
                d.start,
                d.end,
                p
            );


            bomb.position.y +=
                Math.sin(
                    p * Math.PI
                ) * 18;


            if (p >= 1) {

                createExplosion(
                    d.end,
                    4
                );


                /* area damage */

                units.forEach(
                    unit => {

                        if (
                            unit.userData.unit
                                .player
                        )
                            return;


                        const distance =
                            unit.position
                                .distanceTo(
                                    d.end
                                );


                        if (
                            distance < 10
                        ) {

                            unit.userData.unit.hp
                                -= 80;

                            if (
                                unit.userData.unit.hp
                                <= 0
                            ) {

                                destroyUnit(
                                    unit
                                );

                            }

                        }

                    }
                );


                scene.remove(
                    bomb
                );

                const index =
                    effects.indexOf(
                        effect
                    );

                if (index !== -1) {

                    effects.splice(
                        index,
                        1
                    );

                }

            }

        }
    );

}


/* =========================================================
   MOVEMENT
========================================================= */

function updateUnits(
    delta
) {

    units.forEach(
        unit => {

            const data =
                unit.userData.unit;


            if (data.hp <= 0)
                return;


            if (data.cooldown > 0) {

                data.cooldown -=
                    delta *
                    gameSpeed;

            }


            if (
                data.target &&
                data.moving
            ) {

                moveUnit(
                    unit,
                    delta
                );

            }


            /* automatic combat */

            const enemy =
                findNearestEnemy(
                    unit
                );


            if (
                enemy &&
                data.cooldown <= 0
            ) {

                fireWeapon(
                    unit,
                    enemy
                );

            }


            /* enemy AI */

            if (
                !data.player &&
                !data.target
            ) {

                data.target =
                    playerBase.position.clone();

                data.moving = true;

            }

        }
    );

}


/* =========================================================
   MOVE UNIT
========================================================= */

function moveUnit(
    unit,
    delta
) {

    const data =
        unit.userData.unit;


    const target =
        data.target;


    const direction =
        new THREE.Vector3()
        .subVectors(
            target,
            unit.position
        );


    direction.y = 0;


    const distance =
        direction.length();


    if (
        distance < 1
    ) {

        data.moving = false;

        data.target = null;

        return;

    }


    direction.normalize();


    const movement =
        data.speed *
        delta *
        gameSpeed;


    unit.position.add(
        direction.multiplyScalar(
            movement
        )
    );


    /* smooth rotation */

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


    /* walking/battle animation */

    const bob =
        Math.sin(
            performance.now() *
            .012
        ) * .04;


    unit.position.y =
        Math.max(
            0,
            bob
        );

}


/* =========================================================
   ANGLE
========================================================= */

function normalizeAngle(
    angle
) {

    while (
        angle > Math.PI
    )
        angle -=
            Math.PI * 2;

    while (
        angle < -Math.PI
    )
        angle +=
            Math.PI * 2;

    return angle;

}


/* =========================================================
   PRODUCE UNIT
========================================================= */

function produceUnit(
    type
) {

    const data =
        UNIT_TYPES[type];


    if (
        money < data.cost
    ) {

        showMessage(
            "INSUFFICIENT FUNDS",
            "You need $" +
            data.cost +
            " to deploy this unit."
        );

        return;

    }


    money -=
        data.cost;


    const unit =
        spawnUnit(
            type,
            playerBase.position.x + 10,
            playerBase.position.z +
            (Math.random() - .5) * 15,
            true
        );


    unit.userData.unit.target =
        new THREE.Vector3(
            0,
            0,
            (Math.random() - .5) * 20
        );


    unit.userData.unit.moving =
        true;


    updateHUD();

}


/* =========================================================
   SCORE
========================================================= */

function updateScore() {

    score += 10;

    document
        .getElementById("score")
        .textContent =
        score;

}


/* =========================================================
   INCOME
========================================================= */

setInterval(
    () => {

        if (gamePaused)
            return;

        money += 100;

        energy =
            Math.min(
                100,
                energy + 5
            );

        updateHUD();

    },
    5000
);


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    document
        .getElementById("money")
        .textContent =
        money;

    document
        .getElementById("energy")
        .textContent =
        energy;

    document
        .getElementById("score")
        .textContent =
        score;

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera(
    delta
) {

    const desired =
        new THREE.Vector3(
            cameraTarget.x,
            75,
            cameraTarget.z + 70
        );


    camera.position.lerp(
        desired,
        .06
    );


    camera.lookAt(
        cameraTarget
    );

}


/* =========================================================
   CAMERA MOVE
========================================================= */

function moveCamera(
    x,
    z
) {

    cameraTarget.x += x;
    cameraTarget.z += z;

    clampCamera();

}


/* =========================================================
   CAMERA LIMIT
========================================================= */

function clampCamera() {

    cameraTarget.x =
        THREE.MathUtils.clamp(
            cameraTarget.x,
            -70,
            70
        );

    cameraTarget.z =
        THREE.MathUtils.clamp(
            cameraTarget.z,
            -60,
            60
        );

}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    gamePaused =
        !gamePaused;


    document
        .getElementById("pauseButton")
        .textContent =
        gamePaused
            ? "▶"
            : "⏸";

}


/* =========================================================
   SPEED
========================================================= */

function changeSpeed() {

    if (gameSpeed === 1)
        gameSpeed = 2;

    else if (gameSpeed === 2)
        gameSpeed = .5;

    else
        gameSpeed = 1;


    document
        .getElementById("speedButton")
        .textContent =
        gameSpeed + "x";

}


/* =========================================================
   DAMAGE FLASH
========================================================= */

function flashDamage() {

    const flash =
        document
            .getElementById(
                "damageFlash"
            );


    flash.classList.remove(
        "flash"
    );


    void flash.offsetWidth;


    flash.classList.add(
        "flash"
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    title,
    text
) {

    document
        .getElementById(
            "messageTitle"
        )
        .textContent =
        title;


    document
        .getElementById(
            "messageText"
        )
        .textContent =
        text;


    document
        .getElementById(
            "gameMessage"
        )
        .classList.add(
            "show"
        );

}


/* =========================================================
   VICTORY
========================================================= */

function checkVictory() {

    const enemyUnits =
        units.filter(
            unit =>
                !unit.userData.unit.player &&
                unit.userData.unit.hp > 0
        );


    if (
        enemyUnits.length === 0
    ) {

        setTimeout(
            () => {

                showMessage(
                    "VICTORY",
                    "Enemy forces have been destroyed. Battlefield secured."
                );

            },
            500
        );

    }


    const playerUnits =
        units.filter(
            unit =>
                unit.userData.unit.player &&
                unit.userData.unit.hp > 0
        );


    if (
        playerUnits.length === 0
    ) {

        setTimeout(
            () => {

                showMessage(
                    "DEFEAT",
                    "Your army has been eliminated."
                );

            },
            500
        );

    }

}


/* =========================================================
   MINIMAP
========================================================= */

function updateMinimap() {

    const mini =
        document
            .getElementById(
                "miniCanvas"
            );


    const ctx =
        mini.getContext(
            "2d"
        );


    ctx.clearRect(
        0,
        0,
        150,
        100
    );


    ctx.fillStyle =
        "#253128";

    ctx.fillRect(
        0,
        0,
        150,
        100
    );


    /* bases */

    ctx.fillStyle =
        "#56b56b";

    ctx.fillRect(
        7,
        43,
        8,
        8
    );


    ctx.fillStyle =
        "#d64b42";

    ctx.fillRect(
        135,
        43,
        8,
        8
    );


    units.forEach(
        unit => {

            if (
                unit.userData.unit.hp <= 0
            )
                return;


            const x =
                (unit.position.x +
                    battlefieldSize / 2)
                / battlefieldSize
                * 150;


            const y =
                (unit.position.z +
                    battlefieldSize / 2)
                / battlefieldSize
                * 100;


            ctx.fillStyle =
                unit.userData.unit.player
                    ? "#62d878"
                    : "#ef5148";


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );

}


/* =========================================================
   EFFECTS
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


        if (
            effect.bombEffect
        )
            continue;


        effect.life -=
            delta *
            gameSpeed;


        if (
            effect.mesh
        ) {

            effect.mesh.scale
                .multiplyScalar(
                    1.05
                );

            effect.mesh.material
                .opacity =
                Math.max(
                    0,
                    effect.life /
                    .12
                );

        }


        if (
            effect.life <= 0
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
   ANIMATION
========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            clock.getDelta(),
            .05
        );


    if (!gamePaused) {

        updateUnits(
            delta
        );

        updateProjectiles(
            delta
        );

        updateBombs(
            delta
        );

        updateExplosions(
            delta
        );

        updateEffects(
            delta
        );

        updateCamera(
            delta
        );

    }


    updateMinimap();


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   RESIZE
========================================================= */

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


/* =========================================================
   LOADING SCREEN
========================================================= */

function startLoading() {

    let progress = 0;


    const interval =
        setInterval(
            () => {

                progress +=
                    Math.random() * 8 + 4;


                progress =
                    Math.min(
                        100,
                        progress
                    );


                document
                    .getElementById(
                        "loadingProgress"
                    )
                    .style.width =
                    progress + "%";


                document
                    .getElementById(
                        "loadingPercent"
                    )
                    .textContent =
                    Math.floor(
                        progress
                    ) + "%";


                if (
                    progress >= 100
                ) {

                    clearInterval(
                        interval
                    );


                    setTimeout(
                        () => {

                            document
                                .getElementById(
                                    "loadingScreen"
                                )
                                .classList.add(
                                    "hide"
                                );

                        },
                        500
                    );

                }

            },
            120
        );

}


/* =========================================================
   START
========================================================= */

window.addEventListener(
    "load",
    () => {

        init();

        updateHUD();

        startLoading();

    }
);