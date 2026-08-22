/* =========================================================
   WARFRONT 3D TACTICAL COMMAND
   REAL 3D BATTLEFIELD VERSION
   Mobile + Desktop
========================================================= */

import * as THREE from
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


/* =========================================================
   GAME STATE
========================================================= */

const state = {

    money: 11500,
    fuel: 1520,
    metal: 4140,
    score: 5,

    selected: null,

    dayTime: 0.25,

    cameraDistance: 24,

    gameOver: false,

    units: [],

    enemies: [],

    bullets: [],

    effects: [],

    particles: []

};


/* =========================================================
   LOADING
========================================================= */

const loading = document.getElementById("loading");
const progress = document.getElementById("progress");
const loadText = document.getElementById("loadText");

let load = 0;

const loadingMessages = [
    "Initializing battlefield...",
    "Generating terrain...",
    "Deploying armored units...",
    "Loading enemy AI...",
    "Connecting tactical systems...",
    "Battlefield ready."
];

const loadTimer = setInterval(() => {

    load += 8;

    if (progress)
        progress.style.width = load + "%";

    if (loadText) {

        const index =
            Math.min(
                Math.floor(load / 20),
                loadingMessages.length - 1
            );

        loadText.textContent =
            loadingMessages[index];
    }

    if (load >= 100) {

        clearInterval(loadTimer);

        setTimeout(() => {

            if (loading) {

                loading.style.opacity = "0";

                setTimeout(() => {
                    loading.remove();
                }, 800);

            }

        }, 400);

    }

}, 100);


/* =========================================================
   THREE.JS SCENE
========================================================= */

const scene = new THREE.Scene();

scene.background =
    new THREE.Color(0x071317);

scene.fog =
    new THREE.FogExp2(
        0x071317,
        0.012
    );


/* =========================================================
   CAMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

camera.position.set(
    0,
    20,
    22
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.7)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

document.body.insertBefore(
    renderer.domElement,
    document.body.firstChild
);


/* =========================================================
   LIGHTING
========================================================= */

const ambient =
    new THREE.HemisphereLight(
        0x8ccfff,
        0x142016,
        1.6
    );

scene.add(ambient);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2.2
    );

sun.position.set(
    30,
    50,
    20
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;

scene.add(sun);


/* =========================================================
   TERRAIN
========================================================= */

const terrainSize = 100;

const terrainGeometry =
    new THREE.PlaneGeometry(
        terrainSize,
        terrainSize,
        60,
        60
    );

const terrainMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x163c28,
        roughness: 0.95
    });

const terrain =
    new THREE.Mesh(
        terrainGeometry,
        terrainMaterial
    );

terrain.rotation.x =
    -Math.PI / 2;

terrain.receiveShadow = true;

scene.add(terrain);


/* =========================================================
   TERRAIN GRID
========================================================= */

const grid =
    new THREE.GridHelper(
        100,
        50,
        0x1e5840,
        0x153c2e
    );

grid.position.y = 0.03;

scene.add(grid);


/* =========================================================
   RIVER
========================================================= */

const riverGeometry =
    new THREE.PlaneGeometry(
        12,
        100
    );

const riverMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x087fa0,
        transparent: true,
        opacity: 0.82,
        roughness: 0.15,
        metalness: 0.15
    });

const river =
    new THREE.Mesh(
        riverGeometry,
        riverMaterial
    );

river.rotation.x =
    -Math.PI / 2;

river.position.y = 0.06;

scene.add(river);


/* =========================================================
   ROADS
========================================================= */

function createRoad(
    x,
    z,
    width,
    length,
    rotation = 0
) {

    const geo =
        new THREE.PlaneGeometry(
            width,
            length
        );

    const mat =
        new THREE.MeshStandardMaterial({
            color: 0x4b4a40,
            roughness: 1
        });

    const road =
        new THREE.Mesh(
            geo,
            mat
        );

    road.rotation.x =
        -Math.PI / 2;

    road.rotation.z =
        rotation;

    road.position.set(
        x,
        0.08,
        z
    );

    scene.add(road);

    return road;
}

createRoad(
    -25,
    0,
    8,
    100
);

createRoad(
    25,
    0,
    8,
    100
);

createRoad(
    0,
    10,
    100,
    7,
    Math.PI / 2
);


/* =========================================================
   BRIDGE
========================================================= */

const bridge =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            18,
            0.8,
            13
        ),
        new THREE.MeshStandardMaterial({
            color: 0x555555
        })
    );

bridge.position.set(
    0,
    0.6,
    10
);

bridge.castShadow = true;

scene.add(bridge);


/* =========================================================
   TREES
========================================================= */

function createTree(x, z) {

    const group =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.18,
                0.25,
                1.5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x49321d
            })
        );

    trunk.position.y =
        0.75;

    trunk.castShadow = true;

    group.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                1.2,
                3,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1c6334
            })
        );

    leaves.position.y =
        2.3;

    leaves.castShadow = true;

    group.add(leaves);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

}


for (let i = 0; i < 45; i++) {

    const x =
        (Math.random() - 0.5) * 90;

    const z =
        (Math.random() - 0.5) * 90;

    if (Math.abs(x) < 10)
        continue;

    createTree(x, z);

}


/* =========================================================
   BUILDINGS
========================================================= */

function createBuilding(
    x,
    z,
    color = 0x343b40
) {

    const building =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                4,
                5
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    building.position.set(
        x,
        2,
        z
    );

    building.castShadow = true;

    building.receiveShadow = true;

    scene.add(building);

    return building;
}

createBuilding(
    -35,
    -25,
    0x35424a
);

createBuilding(
    35,
    25,
    0x3d3333
);

createBuilding(
    -32,
    30,
    0x454545
);

createBuilding(
    34,
    -30,
    0x454545
);


/* =========================================================
   BASES
========================================================= */

function createBase(
    x,
    z,
    color
) {

    const base =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                6,
                6,
                0.5,
                32
            ),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.12
            })
        );

    base.position.set(
        x,
        0.3,
        z
    );

    scene.add(base);

    return base;
}

createBase(
    -38,
    0,
    0x00bfff
);

createBase(
    38,
    0,
    0xff3045
);


/* =========================================================
   UNIT CREATION
========================================================= */

function createTank(
    color,
    x,
    z,
    enemy = false
) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                0.8,
                4
            ),
            new THREE.MeshStandardMaterial({
                color,
                metalness: 0.5,
                roughness: 0.45
            })
        );

    body.position.y =
        0.65;

    body.castShadow = true;

    group.add(body);


    const turret =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.9,
                0.9,
                0.45,
                16
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    turret.position.y =
        1.2;

    turret.castShadow = true;

    group.add(turret);


    const cannon =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.12,
                2.5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x17191a
            })
        );

    cannon.rotation.z =
        Math.PI / 2;

    cannon.position.set(
        1.5,
        1.2,
        0
    );

    group.add(cannon);


    group.position.set(
        x,
        0,
        z
    );


    scene.add(group);


    return {
        object: group,
        type: "tank",
        hp: 100,
        maxHp: 100,
        attack: 25,
        speed: 3.2,
        range: 15,
        enemy,
        target: null,
        cooldown: 0,
        alive: true
    };

}


/* =========================================================
   INFANTRY
========================================================= */

function createInfantry(
    color,
    x,
    z,
    enemy = false
) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.35,
                1,
                6,
                8
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    body.position.y =
        1;

    body.castShadow = true;

    group.add(body);


    const gun =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                0.12,
                1.4
            ),
            new THREE.MeshStandardMaterial({
                color: 0x171717
            })
        );

    gun.position.set(
        0,
        1,
        0.7
    );

    group.add(gun);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);


    return {
        object: group,
        type: "infantry",
        hp: 80,
        maxHp: 80,
        attack: 12,
        speed: 4,
        range: 10,
        enemy,
        target: null,
        cooldown: 0,
        alive: true
    };

}


/* =========================================================
   AIRCRAFT
========================================================= */

function createAircraft(
    color,
    x,
    z,
    enemy = false
) {

    const group =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                0.7,
                4,
                4
            ),
            new THREE.MeshStandardMaterial({
                color,
                metalness: 0.6
            })
        );

    body.rotation.x =
        Math.PI / 2;

    body.position.y =
        5;

    group.add(body);


    const wing =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                0.12,
                0.8
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    wing.position.y =
        5;

    group.add(wing);


    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);


    return {
        object: group,
        type: "aircraft",
        hp: 90,
        maxHp: 90,
        attack: 35,
        speed: 6,
        range: 22,
        enemy,
        target: null,
        cooldown: 0,
        alive: true
    };

}


/* =========================================================
   PLAYER ARMY
========================================================= */

state.units = [

    createTank(
        0x00dfff,
        -30,
        -8
    ),

    createTank(
        0x00a8d6,
        -30,
        8
    ),

    createInfantry(
        0x4fdfff,
        -25,
        -14
    ),

    createInfantry(
        0x4fdfff,
        -25,
        14
    ),

    createAircraft(
        0xdddddd,
        -18,
        0
    )

];


/* =========================================================
   ENEMY ARMY
========================================================= */

state.enemies = [

    createTank(
        0xff3045,
        30,
        -8,
        true
    ),

    createTank(
        0xff5533,
        30,
        8,
        true
    ),

    createInfantry(
        0xff4050,
        25,
        -15,
        true
    ),

    createInfantry(
        0xff4050,
        25,
        15,
        true
    ),

    createAircraft(
        0xff6666,
        18,
        0,
        true
    )

];


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(unit) {

    state.selected = unit;

    state.units.forEach(u => {

        if (u.object.children[0]) {

            u.object.children[0].material.emissive =
                new THREE.Color(
                    u === unit
                        ? 0x00ffff
                        : 0x000000
                );

        }

    });

    updateInfo(
        "SELECTED: " +
        unit.type.toUpperCase() +
        " | HP " +
        Math.floor(unit.hp)
    );

}


/* =========================================================
   RAYCASTER
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


function pointerSelect(
    clientX,
    clientY
) {

    mouse.x =
        (clientX / window.innerWidth) * 2 - 1;

    mouse.y =
        -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const objects = [];

    state.units.forEach(unit => {

        unit.object.traverse(child => {

            if (child.isMesh)
                objects.push({
                    mesh: child,
                    unit
                });

        });

    });

    const hits =
        raycaster.intersectObjects(
            objects.map(o => o.mesh)
        );

    if (!hits.length)
        return;

    const hit =
        objects.find(
            o => o.mesh === hits[0].object
        );

    if (hit)
        selectUnit(hit.unit);

}


/* =========================================================
   CLICK / TOUCH
========================================================= */

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        pointerSelect(
            event.clientX,
            event.clientY
        );

    }
);


/* =========================================================
   MOVEMENT
========================================================= */

function moveSelectedTo(
    x,
    z
) {

    if (!state.selected)
        return;

    state.selected.target =
        new THREE.Vector3(
            x,
            0,
            z
        );

    updateInfo(
        "MOVING " +
        state.selected.type.toUpperCase()
    );

}


/* =========================================================
   WORLD CLICK MOVEMENT
========================================================= */

renderer.domElement.addEventListener(
    "dblclick",
    event => {

        if (!state.selected)
            return;

        mouse.x =
            (event.clientX /
                window.innerWidth) * 2 - 1;

        mouse.y =
            -(event.clientY /
                window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(
            mouse,
            camera
        );

        const hit =
            raycaster.intersectObject(
                terrain
            );

        if (!hit.length)
            return;

        moveSelectedTo(
            hit[0].point.x,
            hit[0].point.z
        );

    }
);


/* =========================================================
   JOYSTICK
========================================================= */

const joystick =
    document.createElement("div");

joystick.id =
    "warfrontJoystick";

joystick.innerHTML = `
    <div id="joystickStick"></div>
`;

document.body.appendChild(
    joystick
);

const joystickStick =
    document.getElementById(
        "joystickStick"
    );

let joyActive = false;

let joyX = 0;
let joyY = 0;


joystick.addEventListener(
    "pointerdown",
    e => {

        joyActive = true;

        joystick.setPointerCapture(
            e.pointerId
        );

    }
);


joystick.addEventListener(
    "pointermove",
    e => {

        if (!joyActive)
            return;

        const rect =
            joystick.getBoundingClientRect();

        let x =
            e.clientX -
            (rect.left + rect.width / 2);

        let y =
            e.clientY -
            (rect.top + rect.height / 2);

        const distance =
            Math.sqrt(
                x * x + y * y
            );

        const max =
            rect.width / 2 - 25;

        if (distance > max) {

            x =
                x / distance * max;

            y =
                y / distance * max;

        }

        joyX =
            x / max;

        joyY =
            y / max;

        joystickStick.style.transform =
            `translate(${x}px, ${y}px)`;

    }
);


joystick.addEventListener(
    "pointerup",
    () => {

        joyActive = false;

        joyX = 0;
        joyY = 0;

        joystickStick.style.transform =
            "translate(0,0)";

    }
);


/* =========================================================
   ATTACK
========================================================= */

function attackSelected() {

    if (!state.selected)
        return;

    const unit =
        state.selected;

    if (!unit.alive)
        return;

    let nearest = null;

    let nearestDistance = Infinity;


    state.enemies.forEach(enemy => {

        if (!enemy.alive)
            return;

        const distance =
            unit.object.position.distanceTo(
                enemy.object.position
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

    });


    if (!nearest) {

        notify(
            "ALL ENEMY FORCES DESTROYED!"
        );

        return;
    }


    if (
        nearestDistance >
        unit.range
    ) {

        unit.target =
            nearest.object.position.clone();

        notify(
            "Moving into attack range..."
        );

        return;

    }


    fireWeapon(
        unit,
        nearest
    );

}


/* =========================================================
   FIRE
========================================================= */

function fireWeapon(
    attacker,
    target
) {

    if (attacker.cooldown > 0)
        return;

    attacker.cooldown =
        attacker.type === "aircraft"
            ? 1.5
            : 0.8;


    const start =
        attacker.object.position.clone();

    start.y +=
        attacker.type === "aircraft"
            ? 5
            : 1;


    const end =
        target.object.position.clone();

    end.y += 1;


    const bullet =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.12,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:
                    attacker.enemy
                        ? 0xff3030
                        : 0x00ffff
            })
        );

    bullet.position.copy(start);

    scene.add(bullet);


    state.bullets.push({

        object: bullet,

        target,

        speed: 35,

        damage:
            attacker.attack +
            Math.random() * 8

    });

}


/* =========================================================
   EXPLOSION
========================================================= */

function explosion(position) {

    const light =
        new THREE.PointLight(
            0xff7b22,
            8,
            10
        );

    light.position.copy(
        position
    );

    scene.add(light);


    const sphere =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.5,
                16,
                16
            ),
            new THREE.MeshBasicMaterial({
                color: 0xff6b00,
                transparent: true
            })
        );

    sphere.position.copy(
        position
    );

    scene.add(sphere);


    state.effects.push({

        object: sphere,

        light,

        life: 0.5

    });

}


/* =========================================================
   UPDATE BULLETS
========================================================= */

function updateBullets(delta) {

    state.bullets =
        state.bullets.filter(
            bullet => {

                if (
                    !bullet.target.alive
                ) {

                    scene.remove(
                        bullet.object
                    );

                    return false;

                }


                const target =
                    bullet.target.object
                        .position.clone();

                target.y += 1;


                const direction =
                    target.clone()
                        .sub(
                            bullet.object.position
                        );


                const distance =
                    direction.length();


                if (distance < 0.8) {

                    bullet.target.hp -=
                        bullet.damage;

                    explosion(target);

                    scene.remove(
                        bullet.object
                    );


                    if (
                        bullet.target.hp <= 0
                    ) {

                        bullet.target.hp = 0;

                        bullet.target.alive =
                            false;

                        bullet.target.object
                            .visible = false;

                        state.score +=
                            10;

                        notify(
                            "ENEMY UNIT DESTROYED!"
                        );

                    }


                    return false;

                }


                direction.normalize();

                bullet.object.position.add(
                    direction.multiplyScalar(
                        bullet.speed * delta
                    )
                );


                return true;

            }
        );

}


/* =========================================================
   UNIT MOVEMENT
========================================================= */

function updateUnitMovement(
    unit,
    delta
) {

    if (!unit.alive)
        return;


    if (unit.target) {

        const position =
            unit.object.position;

        const target =
            unit.target.clone();

        target.y =
            position.y;


        const direction =
            target.sub(position);


        const distance =
            direction.length();


        if (distance < 0.6) {

            unit.target = null;

        } else {

            direction.normalize();

            position.add(
                direction.multiplyScalar(
                    unit.speed * delta
                )
            );


            unit.object.lookAt(
                position.x +
                direction.x,
                position.y,
                position.z +
                direction.z
            );

        }

    }

}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemyAI(
    enemy,
    delta
) {

    if (!enemy.alive)
        return;


    let nearest = null;

    let distance = Infinity;


    state.units.forEach(unit => {

        if (!unit.alive)
            return;

        const d =
            enemy.object.position.distanceTo(
                unit.object.position
            );

        if (d < distance) {

            distance = d;

            nearest = unit;

        }

    });


    if (!nearest)
        return;


    if (
        distance <=
        enemy.range
    ) {

        enemy.target =
            nearest.object.position.clone();

        fireWeapon(
            enemy,
            nearest
        );

    } else {

        enemy.target =
            nearest.object.position.clone();

    }

}


/* =========================================================
   CAMERA
========================================================= */

let cameraAngle = 0;

let cameraHeight = 20;


function updateCamera() {

    const target =
        state.selected
            ? state.selected.object.position
            : new THREE.Vector3(
                0,
                0,
                0
            );


    const x =
        target.x +
        Math.sin(cameraAngle) *
        state.cameraDistance;


    const z =
        target.z +
        Math.cos(cameraAngle) *
        state.cameraDistance;


    camera.position.lerp(
        new THREE.Vector3(
            x,
            cameraHeight,
            z
        ),
        0.08
    );


    camera.lookAt(
        target.x,
        0,
        target.z
    );

}


/* =========================================================
   CAMERA TOUCH DRAG
========================================================= */

let lastTouchX = 0;

renderer.domElement.addEventListener(
    "pointermove",
    event => {

        if (
            event.pointerType !== "touch"
        )
            return;

        if (!joyActive) {

            const dx =
                event.movementX || 0;

            cameraAngle -=
                dx * 0.002;

        }

    }
);


/* =========================================================
   UI
========================================================= */

function createHUD() {

    const hud =
        document.createElement("div");

    hud.id =
        "warfrontHUD";

    hud.innerHTML = `

        <div class="wf-top">

            <strong>WARFRONT</strong>

            <div>
                💰 <span id="wfMoney">11500</span>
                ⛽ <span id="wfFuel">1520</span>
                ⭐ <span id="wfScore">5</span>
            </div>

        </div>


        <div class="wf-mission">

            🎯 CURRENT MISSION

            <small>
                Destroy enemy forces
            </small>

        </div>


        <div id="wfInfo">
            Tap a unit to select
        </div>


        <div class="wf-actions">

            <button id="wfAttack">
                ⚔ ATTACK
            </button>

            <button id="wfDefend">
                🛡 DEFEND
            </button>

            <button id="wfAir">
                ✈ AIR STRIKE
            </button>

            <button id="wfReset">
                🔄 CAMERA
            </button>

        </div>


        <div class="wf-status">

            ALLIES:
            <span id="wfAllies">5</span>

            |

            ENEMIES:
            <span id="wfEnemies">5</span>

        </div>

    `;

    document.body.appendChild(
        hud
    );


    document.getElementById(
        "wfAttack"
    ).onclick =
        attackSelected;


    document.getElementById(
        "wfDefend"
    ).onclick = () => {

        state.score += 2;

        notify(
            "DEFENSIVE FORMATION ACTIVE"
        );

    };


    document.getElementById(
        "wfAir"
    ).onclick = () => {

        if (state.fuel < 150) {

            notify(
                "NOT ENOUGH FUEL"
            );

            return;

        }

        state.fuel -= 150;

        state.enemies.forEach(
            enemy => {

                if (!enemy.alive)
                    return;

                enemy.hp -= 30;

                explosion(
                    enemy.object.position
                );

                if (
                    enemy.hp <= 0
                ) {

                    enemy.hp = 0;

                    enemy.alive =
                        false;

                    enemy.object.visible =
                        false;

                }

            }
        );

        state.score += 15;

        notify(
            "AIR STRIKE COMPLETE"
        );

    };


    document.getElementById(
        "wfReset"
    ).onclick = () => {

        cameraAngle = 0;

        state.cameraDistance = 24;

        cameraHeight = 20;

        notify(
            "CAMERA RESET"
        );

    };

}


createHUD();


/* =========================================================
   INFO
========================================================= */

function updateInfo(text) {

    const el =
        document.getElementById(
            "wfInfo"
        );

    if (el)
        el.textContent = text;

}


function notify(text) {

    updateInfo(text);

}


/* =========================================================
   HUD UPDATE
========================================================= */

function updateHUD() {

    const money =
        document.getElementById(
            "wfMoney"
        );

    const fuel =
        document.getElementById(
            "wfFuel"
        );

    const score =
        document.getElementById(
            "wfScore"
        );


    if (money)
        money.textContent =
            Math.floor(state.money);

    if (fuel)
        fuel.textContent =
            Math.floor(state.fuel);

    if (score)
        score.textContent =
            state.score;


    const allies =
        state.units.filter(
            u => u.alive
        ).length;


    const enemies =
        state.enemies.filter(
            u => u.alive
        ).length;


    document.getElementById(
        "wfAllies"
    ).textContent =
        allies;


    document.getElementById(
        "wfEnemies"
    ).textContent =
        enemies;


    if (
        enemies === 0 &&
        !state.gameOver
    ) {

        state.gameOver = true;

        notify(
            "🏆 VICTORY — ENEMY HQ CAPTURED!"
        );

    }

}


/* =========================================================
   RESOURCE INCOME
========================================================= */

setInterval(() => {

    if (state.gameOver)
        return;

    state.money += 50;

    state.metal += 20;

}, 5000);


/* =========================================================
   DAY / NIGHT
========================================================= */

function updateDayNight(delta) {

    state.dayTime +=
        delta * 0.01;


    if (state.dayTime > 1)
        state.dayTime = 0;


    const angle =
        state.dayTime *
        Math.PI * 2;


    const sunX =
        Math.cos(angle) * 50;


    const sunY =
        Math.max(
            8,
            Math.sin(angle) * 50
        );


    sun.position.set(
        sunX,
        sunY,
        25
    );


    const brightness =
        Math.max(
            0.25,
            Math.sin(angle) * 0.7 + 0.7
        );


    sun.intensity =
        brightness * 2;


    ambient.intensity =
        brightness * 1.3;

}


/* =========================================================
   EFFECT UPDATE
========================================================= */

function updateEffects(delta) {

    state.effects =
        state.effects.filter(
            effect => {

                effect.life -=
                    delta;

                effect.object.scale.multiplyScalar(
                    1 + delta * 5
                );

                effect.object.material.opacity =
                    Math.max(
                        0,
                        effect.life * 2
                    );

                effect.light.intensity =
                    Math.max(
                        0,
                        effect.life * 15
                    );


                if (
                    effect.life <= 0
                ) {

                    scene.remove(
                        effect.object
                    );

                    scene.remove(
                        effect.light
                    );

                    return false;

                }


                return true;

            }
        );

}


/* =========================================================
   ANIMATION
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


    /* joystick movement */

    if (
        state.selected &&
        state.selected.alive &&
        (Math.abs(joyX) > 0.05 ||
         Math.abs(joyY) > 0.05)
    ) {

        const unit =
            state.selected;

        const movement =
            new THREE.Vector3(
                joyX,
                0,
                joyY
            );


        movement.multiplyScalar(
            unit.speed * delta * 2
        );


        unit.object.position.add(
            movement
        );


        unit.object.position.x =
            THREE.MathUtils.clamp(
                unit.object.position.x,
                -47,
                47
            );


        unit.object.position.z =
            THREE.MathUtils.clamp(
                unit.object.position.z,
                -47,
                47
            );

    }


    /* units */

    state.units.forEach(
        unit => {

            updateUnitMovement(
                unit,
                delta
            );

            if (
                unit.cooldown > 0
            )
                unit.cooldown -=
                    delta;

        }
    );


    /* enemies */

    state.enemies.forEach(
        enemy => {

            updateEnemyAI(
                enemy,
                delta
            );

            updateUnitMovement(
                enemy,
                delta
            );

            if (
                enemy.cooldown > 0
            )
                enemy.cooldown -=
                    delta;

        }
    );


    updateBullets(
        delta
    );


    updateEffects(
        delta
    );


    updateDayNight(
        delta
    );


    updateCamera();


    updateHUD();


    renderer.render(
        scene,
        camera
    );

}


animate();


/* =========================================================
   RESIZE
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
   EXTRA MOBILE CSS
========================================================= */

const style =
    document.createElement("style");

style.textContent = `

#warfrontHUD {

    position:fixed;
    inset:0;
    z-index:20;
    pointer-events:none;

    font-family:Arial,sans-serif;
    color:white;
}

.wf-top {

    position:absolute;
    top:0;
    left:0;
    right:0;

    height:65px;

    padding:12px 16px;

    display:flex;
    justify-content:space-between;
    align-items:center;

    background:rgba(3,12,15,.88);

    border-bottom:
        1px solid rgba(0,220,255,.2);

    letter-spacing:2px;

}

.wf-top strong {

    font-size:20px;

    text-shadow:
        0 0 15px #00dfff;

}

.wf-top div {

    display:flex;

    gap:10px;

    font-size:11px;

}

.wf-mission {

    position:absolute;

    top:80px;
    left:12px;

    padding:12px 15px;

    background:
        rgba(2,12,15,.88);

    border-left:
        3px solid #00eaff;

    border-radius:
        0 8px 8px 0;

    font-size:10px;

    letter-spacing:2px;

}

.wf-mission small {

    display:block;

    margin-top:6px;

    color:#9fb4bb;

    letter-spacing:1px;

}

#wfInfo {

    position:absolute;

    left:12px;
    bottom:15px;

    padding:10px 14px;

    background:
        rgba(2,12,15,.92);

    border-left:
        3px solid #00eaff;

    border-radius:
        0 7px 7px 0;

    font-size:10px;

    max-width:280px;

}

.wf-actions {

    position:absolute;

    right:12px;
    bottom:15px;

    display:flex;

    gap:6px;

    pointer-events:auto;

}

.wf-actions button {

    border:
        1px solid #28515c;

    background:
        rgba(3,16,20,.94);

    color:white;

    padding:11px 12px;

    border-radius:7px;

    font-size:9px;

    font-weight:bold;

}

.wf-actions button:active {

    transform:scale(.94);

    border-color:#00eaff;

}

.wf-status {

    position:absolute;

    right:12px;
    top:80px;

    padding:10px;

    background:
        rgba(2,12,15,.88);

    border-radius:7px;

    font-size:9px;

    color:#a9bdc2;

}

#warfrontJoystick {

    position:fixed;

    z-index:30;

    left:20px;
    bottom:100px;

    width:125px;
    height:125px;

    border-radius:50%;

    background:
        radial-gradient(
            circle,
            rgba(0,230,255,.18),
            rgba(0,40,50,.55)
        );

    border:
        2px solid rgba(0,220,255,.35);

    box-shadow:
        0 0 25px rgba(0,220,255,.12);

    pointer-events:auto;

    touch-action:none;

}

#joystickStick {

    position:absolute;

    width:52px;
    height:52px;

    left:34px;
    top:34px;

    border-radius:50%;

    background:
        rgba(0,220,255,.55);

    border:
        2px solid #00eaff;

    box-shadow:
        0 0 20px #00dfff;

}

@media(max-width:700px) {

    .wf-top {

        height:58px;

        padding:
            9px 10px;

    }

    .wf-top strong {

       