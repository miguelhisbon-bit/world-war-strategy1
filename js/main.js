import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

/* =========================================================
   WARFRONT 3D
   Main Game Engine
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x78999b);

scene.fog = new THREE.FogExp2(
    0x78999b,
    0.008
);


/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(
    0,
    32,
    35
);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

document.body.appendChild(
    renderer.domElement
);


/* =========================================================
   CAMERA CONTROLS
   ========================================================= */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.dampingFactor = 0.08;

controls.maxPolarAngle =
    Math.PI / 2.05;

controls.minDistance = 8;

controls.maxDistance = 75;

controls.target.set(
    0,
    0,
    0
);


/* =========================================================
   LIGHTING
   ========================================================= */

const ambientLight =
    new THREE.HemisphereLight(
        0xbfeaff,
        0x182218,
        2
    );

scene.add(ambientLight);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        3
    );

sun.position.set(
    -25,
    45,
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
   WORLD
   ========================================================= */

const world =
    new THREE.Group();

scene.add(world);


/* =========================================================
   GROUND
   ========================================================= */

const groundMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x304b2a,
        roughness: 1
    });

const ground =
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            75,
            60,
            50,
            50
        ),
        groundMaterial
    );

ground.rotation.x =
    -Math.PI / 2;

ground.receiveShadow = true;

world.add(ground);


/* =========================================================
   MOUNTAINS / TERRAIN
   ========================================================= */

for (let i = 0; i < 35; i++) {

    const height =
        THREE.MathUtils.randFloat(
            0.5,
            4
        );

    const x =
        THREE.MathUtils.randFloat(
            -34,
            34
        );

    const z =
        THREE.MathUtils.randFloat(
            -26,
            26
        );

    const mountain =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                THREE.MathUtils.randFloat(
                    1.5,
                    4
                ),
                height,
                7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x405b32
            })
        );

    mountain.position.set(
        x,
        height / 2,
        z
    );

    mountain.scale.y = 1.8;

    mountain.castShadow = true;

    world.add(mountain);
}


/* =========================================================
   RIVER
   ========================================================= */

const riverMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x167da1,
        roughness: 0.2,
        metalness: 0.1
    });

const river =
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            8,
            60
        ),
        riverMaterial
    );

river.rotation.x =
    -Math.PI / 2;

river.rotation.z =
    -0.18;

river.position.y =
    0.06;

world.add(river);


/* =========================================================
   ROADS
   ========================================================= */

const roadMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x5c5545
    });


function createRoad(
    x,
    z,
    rotation,
    width,
    length
) {

    const road =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                width,
                length
            ),
            roadMaterial
        );

    road.rotation.x =
        -Math.PI / 2;

    road.rotation.z =
        rotation;

    road.position.set(
        x,
        0.09,
        z
    );

    world.add(road);
}


createRoad(
    -13,
    0,
    0.72,
    3,
    60
);

createRoad(
    13,
    0,
    -0.45,
    3,
    60
);


/* =========================================================
   TREES
   ========================================================= */

function createTree(
    x,
    z
) {

    const tree =
        new THREE.Group();


    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.18,
                0.25,
                1.7,
                7
            ),
            new THREE.MeshStandardMaterial({
                color: 0x513b24
            })
        );

    trunk.position.y =
        0.85;

    tree.add(trunk);


    const leaves =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                1.25,
                3.2,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x173d22
            })
        );

    leaves.position.y =
        2.7;

    leaves.castShadow = true;

    tree.add(leaves);


    tree.position.set(
        x,
        0,
        z
    );

    world.add(tree);
}


for (let i = 0; i < 80; i++) {

    const x =
        THREE.MathUtils.randFloat(
            -34,
            34
        );

    const z =
        THREE.MathUtils.randFloat(
            -26,
            26
        );

    if (Math.abs(x) < 6)
        continue;

    createTree(
        x,
        z
    );
}


/* =========================================================
   BUILDINGS
   ========================================================= */

function createBuilding(
    x,
    z,
    color,
    name
) {

    const building =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4,
                2.5,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: color
            })
        );

    body.position.y =
        1.25;

    body.castShadow = true;

    building.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                3.2,
                1.8,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: 0x343b3c
            })
        );

    roof.rotation.y =
        Math.PI / 4;

    roof.position.y =
        3.4;

    roof.castShadow = true;

    building.add(roof);


    building.position.set(
        x,
        0,
        z
    );

    building.userData.name =
        name;

    scene.add(building);

    return building;
}


/* PLAYER BASE */

createBuilding(
    -25,
    18,
    0x168eaa,
    "PLAYER HQ"
);


/* ENEMY BASE */

createBuilding(
    25,
    -18,
    0xb51f35,
    "ENEMY HQ"
);


/* AIR BASE */

createBuilding(
    -23,
    -14,
    0x258d68,
    "AIR BASE"
);


/* NAVAL BASE */

createBuilding(
    23,
    14,
    0x1679a4,
    "NAVAL BASE"
);


/* =========================================================
   UNITS
   ========================================================= */

const units = [];


/* =========================================================
   TANK
   ========================================================= */

function createTank(
    color,
    x,
    z,
    name
) {

    const tank =
        new THREE.Group();


    /* BODY */

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                0.8,
                4
            ),
            new THREE.MeshStandardMaterial({
                color: color
            })
        );

    body.position.y =
        0.7;

    body.castShadow = true;

    tank.add(body);


    /* TURRET */

    const turret =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.85,
                0.95,
                0.45,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x52625a
            })
        );

    turret.position.y =
        1.25;

    turret.castShadow = true;

    tank.add(turret);


    /* BARREL */

    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.12,
                0.12,
                2.4,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x202629
            })
        );

    barrel.rotation.z =
        Math.PI / 2;

    barrel.position.set(
        1.3,
        1.25,
        0
    );

    tank.add(barrel);


    tank.position.set(
        x,
        0,
        z
    );


    tank.userData = {

        name: name,

        hp: 100,

        maxHP: 100,

        attack: 25,

        speed: 5,

        type: "tank",

        team: color === 0xc51f38
            ? "enemy"
            : "player",

        target: null

    };


    scene.add(tank);

    units.push(tank);

    return tank;
}


/* =========================================================
   INFANTRY
   ========================================================= */

function createInfantry(
    color,
    x,
    z,
    name
) {

    const soldier =
        new THREE.Group();


    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.38,
                1,
                6,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: color
            })
        );

    body.position.y =
        1;

    body.castShadow = true;

    soldier.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.38,
                12,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc99472
            })
        );

    head.position.y =
        2;

    head.castShadow = true;

    soldier.add(head);


    soldier.position.set(
        x,
        0,
        z
    );


    soldier.userData = {

        name: name,

        hp: 80,

        maxHP: 80,

        attack: 15,

        speed: 4,

        type: "infantry",

        team: color === 0xc51f38
            ? "enemy"
            : "player",

        target: null

    };


    scene.add(soldier);

    units.push(soldier);

    return soldier;
}


/* =========================================================
   PLAYER ARMY
   ========================================================= */

const playerTank =
    createTank(
        0x159ec2,
        -12,
        10,
        "BLUE TANK"
    );


const playerTank2 =
    createTank(
        0x159ec2,
        -8,
        14,
        "BLUE TANK 2"
    );


const playerInfantry =
    createInfantry(
        0x24b86d,
        -5,
        8,
        "BLUE INFANTRY"
    );


/* =========================================================
   ENEMY ARMY
   ========================================================= */

let enemyTank =
    createTank(
        0xc51f38,
        12,
        -8,
        "RED TANK"
    );


let enemyInfantry =
    createInfantry(
        0xc51f38,
        16,
        -6,
        "RED INFANTRY"
    );


/* =========================================================
   SELECTION
   ========================================================= */

let selectedUnit =
    playerTank;


const raycaster =
    new THREE.Raycaster();


const pointer =
    new THREE.Vector2();


/* =========================================================
   POINTER CONTROL
   ========================================================= */

renderer.domElement.addEventListener(
    "pointerdown",
    function(event) {

        pointer.x =
            (event.clientX /
                window.innerWidth) *
            2 - 1;

        pointer.y =
            -(event.clientY /
                window.innerHeight) *
            2 + 1;


        raycaster.setFromCamera(
            pointer,
            camera
        );


        const hits =
            raycaster.intersectObjects(
                scene.children,
                true
            );


        /* UNIT SELECT */

        const unitHit =
            hits.find(
                hit =>
                    hit.object.parent &&
                    hit.object.parent.userData &&
                    hit.object.parent.userData.hp
            );


        if (unitHit) {

            const unit =
                unitHit.object.parent;


            if (
                unit.userData.team ===
                "player"
            ) {

                selectedUnit =
                    unit;


                document.getElementById(
                    "info"
                ).textContent =
                    "Selected: " +
                    unit.userData.name;
            }


            return;
        }


        /* MOVE */

        const groundHit =
            hits.find(
                hit =>
                    hit.object ===
                    ground
            );


        if (
            groundHit &&
            selectedUnit
        ) {

            selectedUnit.userData.target =
                groundHit.point.clone();


            document.getElementById(
                "info"
            ).textContent =
                "Moving " +
                selectedUnit.userData.name +
                "...";
        }

    }
);


/* =========================================================
   UNIT MOVEMENT
   ========================================================= */

function updateUnits(
    delta
) {

    for (
        const unit of units
    ) {

        if (
            !unit.userData.target
        ) {
            continue;
        }


        const target =
            unit.userData.target;


        const direction =
            new THREE.Vector3(
                target.x -
                    unit.position.x,

                0,

                target.z -
                    unit.position.z
            );


        if (
            direction.length() <
            0.3
        ) {

            unit.userData.target =
                null;

            continue;
        }


        direction.normalize();


        unit.position.addScaledVector(
            direction,
            delta *
                unit.userData.speed
        );


        unit.rotation.y =
            Math.atan2(
                direction.x,
                direction.z
            );
    }
}


/* =========================================================
   ATTACK SYSTEM
   ========================================================= */

function attackEnemy() {

    if (!selectedUnit) {

        return;
    }


    if (!enemyTank) {

        return;
    }


    enemyTank.userData.hp -=
        selectedUnit.userData.attack;


    const hp =
        Math.max(
            0,
            enemyTank.userData.hp
        );


    document.getElementById(
        "info"
    ).textContent =
        "⚔ Hit enemy for " +
        selectedUnit.userData.attack +
        " damage. Enemy HP: " +
        hp;


    createExplosion(
        enemyTank.position
    );


    if (
        enemyTank.userData.hp <=
        0
    ) {

        scene.remove(
            enemyTank
        );


        enemyTank =
            null;


        document.getElementById(
            "mission"
        ).textContent =
            "🏆 ENEMY TANK DESTROYED";
    }
}


/* =========================================================
   AIR STRIKE
   ========================================================= */

function airStrike() {

    const fuelElement =
        document.getElementById(
            "fuel"
        );


    let fuel =
        Number(
            fuelElement.textContent
        );


    if (fuel < 150) {

        document.getElementById(
            "info"
        ).textContent =
            "Not enough fuel.";

        return;
    }


    fuel -= 150;

    fuelElement.textContent =
        fuel;


    if (!enemyTank) {

        return;
    }


    enemyTank.userData.hp -=
        45;


    createExplosion(
        enemyTank.position
    );


    document.getElementById(
        "info"
    ).textContent =
        "✈ AIR STRIKE — 45 DAMAGE";


    if (
        enemyTank.userData.hp <=
        0
    ) {

        scene.remove(
            enemyTank
        );


        enemyTank =
            null;


        document.getElementById(
            "mission"
        ).textContent =
            "🏆 AIR STRIKE SUCCESSFUL";
    }
}


/* =========================================================
   DEFENSE
   ========================================================= */

function activateDefense() {

    document.getElementById(
        "info"
    ).textContent =
        "🛡 DEFENSIVE FORMATION ACTIVATED";

}


/* =========================================================
   EXPLOSION
   ========================================================= */

function createExplosion(
    position
) {

    const explosion =
        new THREE.Group();


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const particle =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color:
                        i % 2 === 0
                            ? 0xff8a00
                            : 0xffdd44
                })
            );


        particle.position.set(
            0,
            0,
            0
        );


        particle.userData.velocity =
            new THREE.Vector3(
                THREE.MathUtils.randFloat(
                    -3,
                    3
                ),

                THREE.MathUtils.randFloat(
                    1,
                    5
                ),

                THREE.MathUtils.randFloat(
                    -3,
                    3
                )
            );


        explosion.add(
            particle
        );
    }


    explosion.position.copy(
        position
    );


    scene.add(
        explosion
    );


    let life =
        0;


    function animateExplosion() {

        life += 0.04;


        explosion.children.forEach(
            particle => {

                particle.position.addScaledVector(
                    particle.userData.velocity,
                    0.04
                );

                particle.userData.velocity.y -=
                    0.12;
            }
        );


        explosion.scale.setScalar(
            1 + life
        );


        if (life < 1) {

            requestAnimationFrame(
                animateExplosion
            );

        } else {

            scene.remove(
                explosion
            );
        }
    }


    animateExplosion();
}


/* =========================================================
   BUTTONS
   ========================================================= */

document.getElementById(
    "attack"
).addEventListener(
    "click",
    attackEnemy
);


document.getElementById(
    "air"
).addEventListener(
    "click",
    airStrike
);


document.getElementById(
    "defend"
).addEventListener(
    "click",
    activateDefense
);


document.getElementById(
    "reset"
).addEventListener(
    "click",
    function() {

        camera.position.set(
            0,
            32,
            35
        );

        controls.target.set(
            0,
            0,
            0
        );

        controls.update();
    }
);


/* =========================================================
   ENEMY AI
   ========================================================= */

let aiTimer = 0;


function enemyAI(
    delta
) {

    aiTimer += delta;


    if (
        aiTimer < 4
    ) {

        return;
    }


    aiTimer = 0;


    if (
        enemyTank &&
        selectedUnit
    ) {

        const target =
            selectedUnit.position;


        enemyTank.userData.target =
            target.clone();


        if (
            enemyTank.position.distanceTo(
                target
            ) < 5
        ) {

            selectedUnit.userData.hp -=
                enemyTank.userData.attack;


            document.getElementById(
                "info"
            ).textContent =
                "⚠ ENEMY ATTACK! Your unit HP: " +
                Math.max(
                    0,
                    selectedUnit.userData.hp
                );
        }
    }
}


/* =========================================================
   DAY / NIGHT EFFECT
   ========================================================= */

let night =
    false;


setInterval(
    function() {

        night = !night;


        if (night) {

            scene.background.set(
                0x07121d
            );

            scene.fog.color.set(
                0x07121d
            );

            sun.intensity =
                0.8;

        } else {

            scene.background.set(
                0x78999b
            );

            scene.fog.color.set(
                0x78999b
            );

            sun.intensity =
                3;
        }

    },
    30000
);


/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    function() {

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
   GAME LOOP
   ========================================================= */

let lastTime =
    performance.now();


function gameLoop(
    currentTime
) {

    requestAnimationFrame(
        gameLoop
    );


    const delta =
        Math.min(
            0.05,
            (currentTime -
                lastTime) /
                1000
        );


    lastTime =
        currentTime;


    updateUnits(
        delta
    );


    enemyAI(
        delta
    );


    controls.update();


    renderer.render(
        scene,
        camera
    );
}


requestAnimationFrame(
    gameLoop
);


/* =========================================================
   LOADING SCREEN
   ========================================================= */

let loadingProgress =
    0;


const loadingMessages = [

    "Creating 3D terrain...",

    "Building mountains...",

    "Deploying military bases...",

    "Preparing army units...",

    "Activating battlefield AI...",

    "Connecting tactical systems...",

    "Battlefield ready."

];


const loadingTimer =
    setInterval(
        function() {

            loadingProgress +=
                5;


            const progress =
                document.getElementById(
                    "progress"
                );


            const text =
                document.getElementById(
                    "loadText"
                );


            if (progress) {

                progress.style.width =
                    loadingProgress +
                    "%";
            }


            if (text) {

                const index =
                    Math.min(
                        loadingMessages.length - 1,
                        Math.floor(
                            loadingProgress /
                            17
                        )
                    );


                text.textContent =
                    loadingMessages[
                        index
                    ];
            }


            if (
                loadingProgress >=
                100
            ) {

                clearInterval(
                    loadingTimer
                );


                setTimeout(
                    function() {

                        const loading =
                            document.getElementById(
                                "loading"
                            );


                        if (loading) {

                            loading.style.opacity =
                                "0";


                            setTimeout(
                                function() {

                                    loading.remove();

                                },
                                800
                            );
                        }

                    },
                    400
                );
            }

        },
        100
    );