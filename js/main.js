import * as THREE from "https://esm.sh/three@0.180.0";
import { OrbitControls } from "https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js";

/* =========================================================
   WARFRONT 3D
   ========================================================= */

let scene;
let camera;
let renderer;
let controls;

let selectedUnit = null;
let enemyTank = null;

const units = [];

let gameStarted = false;
let lastTime = performance.now();
let aiTimer = 0;


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    try {

        createScene();

        createLighting();

        createTerrain();

        createEnvironment();

        createBases();

        createUnits();

        createUI();

        hideLoading();

        gameStarted = true;

        requestAnimationFrame(gameLoop);

    } catch (error) {

        console.error("WARFRONT ERROR:", error);

        const text =
            document.getElementById("loadText");

        if (text) {

            text.textContent =
                "Battlefield failed to load. Refresh the page.";

        }
    }
}


/* =========================================================
   SCENE
   ========================================================= */

function createScene() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x78989b);

    scene.fog =
        new THREE.Fog(
            0x78989b,
            45,
            140
        );


    camera =
        new THREE.PerspectiveCamera(
            55,
            window.innerWidth /
            window.innerHeight,
            0.1,
            500
        );

    camera.position.set(
        0,
        30,
        32
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            1.5
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    document.body.appendChild(
        renderer.domElement
    );


    controls =
        new OrbitControls(
            camera,
            renderer.domElement
        );


    controls.enableDamping = true;

    controls.dampingFactor = 0.08;

    controls.minDistance = 8;

    controls.maxDistance = 70;

    controls.maxPolarAngle =
        Math.PI / 2.08;


    controls.target.set(
        0,
        0,
        0
    );


    renderer.domElement.addEventListener(
        "pointerdown",
        selectOrMove
    );


    window.addEventListener(
        "resize",
        resizeGame
    );
}


/* =========================================================
   LIGHT
   ========================================================= */

function createLighting() {

    const ambient =
        new THREE.HemisphereLight(
            0xd8f4ff,
            0x182217,
            2
        );

    scene.add(ambient);


    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            3
        );


    sun.position.set(
        -30,
        45,
        25
    );


    sun.castShadow = true;

    sun.shadow.mapSize.width = 1024;

    sun.shadow.mapSize.height = 1024;


    scene.add(sun);
}


/* =========================================================
   TERRAIN
   ========================================================= */

function createTerrain() {

    const ground =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                100,
                80
            ),

            new THREE.MeshStandardMaterial({
                color: 0x304d2b,
                roughness: 1
            })

        );


    ground.rotation.x =
        -Math.PI / 2;


    ground.receiveShadow = true;


    ground.userData.isGround = true;


    scene.add(ground);


    /* GRID */

    const grid =
        new THREE.GridHelper(
            100,
            40,
            0x50694b,
            0x40583d
        );


    grid.position.y =
        0.03;


    scene.add(grid);


    /* RIVER */

    const river =
        new THREE.Mesh(

            new THREE.PlaneGeometry(
                9,
                80
            ),

            new THREE.MeshStandardMaterial({
                color: 0x167a9c,
                roughness: 0.2,
                metalness: 0.2
            })

        );


    river.rotation.x =
        -Math.PI / 2;


    river.rotation.z =
        -0.12;


    river.position.y =
        0.08;


    scene.add(river);


    /* ROADS */

    createRoad(
        0,
        0,
        0,
        4,
        100
    );


    createRoad(
        -20,
        0,
        Math.PI / 2,
        3,
        80
    );
}


/* =========================================================
   ROAD
   ========================================================= */

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

            new THREE.MeshStandardMaterial({
                color: 0x5b5648,
                roughness: 1
            })

        );


    road.rotation.x =
        -Math.PI / 2;


    road.rotation.z =
        rotation;


    road.position.set(
        x,
        0.07,
        z
    );


    scene.add(road);
}


/* =========================================================
   ENVIRONMENT
   ========================================================= */

function createEnvironment() {

    /* TREES */

    for (
        let i = 0;
        i < 55;
        i++
    ) {

        const x =
            THREE.MathUtils.randFloat(
                -46,
                46
            );


        const z =
            THREE.MathUtils.randFloat(
                -36,
                36
            );


        if (
            Math.abs(x) < 8
        ) {
            continue;
        }


        createTree(
            x,
            z
        );
    }


    /* ROCKS */

    for (
        let i = 0;
        i < 25;
        i++
    ) {

        const rock =
            new THREE.Mesh(

                new THREE.DodecahedronGeometry(
                    THREE.MathUtils.randFloat(
                        0.4,
                        1.3
                    )
                ),

                new THREE.MeshStandardMaterial({
                    color: 0x5d625b
                })

            );


        rock.position.set(

            THREE.MathUtils.randFloat(
                -45,
                45
            ),

            0.4,

            THREE.MathUtils.randFloat(
                -35,
                35
            )

        );


        rock.castShadow = true;


        scene.add(rock);
    }
}


/* =========================================================
   TREE
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
                0.28,
                1.8,
                7
            ),

            new THREE.MeshStandardMaterial({
                color: 0x513a24
            })

        );


    trunk.position.y =
        0.9;


    trunk.castShadow = true;


    tree.add(trunk);


    const leaves =
        new THREE.Mesh(

            new THREE.ConeGeometry(
                1.3,
                3.4,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x173d22
            })

        );


    leaves.position.y =
        2.8;


    leaves.castShadow = true;


    tree.add(leaves);


    tree.position.set(
        x,
        0,
        z
    );


    scene.add(tree);
}


/* =========================================================
   BASES
   ========================================================= */

function createBases() {

    createBase(
        -32,
        22,
        0x159ec2,
        "PLAYER HQ"
    );


    createBase(
        31,
        -22,
        0xc51f38,
        "ENEMY HQ"
    );


    createBase(
        -31,
        -20,
        0x248c68,
        "AIR BASE"
    );


    createBase(
        30,
        20,
        0x2079a0,
        "NAVAL BASE"
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

    const base =
        new THREE.Group();


    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                6,
                2.5,
                6
            ),

            new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7
            })

        );


    body.position.y =
        1.25;


    body.castShadow = true;


    base.add(body);


    const roof =
        new THREE.Mesh(

            new THREE.ConeGeometry(
                4.5,
                2,
                4
            ),

            new THREE.MeshStandardMaterial({
                color: 0x303638
            })

        );


    roof.rotation.y =
        Math.PI / 4;


    roof.position.y =
        3.5;


    roof.castShadow = true;


    base.add(roof);


    base.position.set(
        x,
        0,
        z
    );


    base.userData.name =
        name;


    scene.add(base);
}


/* =========================================================
   TANK
   ========================================================= */

function createTank(
    color,
    x,
    z,
    name,
    team
) {

    const tank =
        new THREE.Group();


    /* BODY */

    const body =
        new THREE.Mesh(

            new THREE.BoxGeometry(
                3,
                0.9,
                4.2
            ),

            new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7
            })

        );


    body.position.y =
        0.8;


    body.castShadow = true;


    tank.add(body);


    /* TURRET */

    const turret =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.9,
                1.05,
                0.5,
                12
            ),

            new THREE.MeshStandardMaterial({
                color: 0x4d5a53
            })

        );


    turret.position.y =
        1.45;


    turret.castShadow = true;


    tank.add(turret);


    /* BARREL */

    const barrel =
        new THREE.Mesh(

            new THREE.CylinderGeometry(
                0.13,
                0.13,
                2.7,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0x202426
            })

        );


    barrel.rotation.z =
        Math.PI / 2;


    barrel.position.set(
        1.35,
        1.45,
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

        team: team,

        hp: 100,

        maxHP: 100,

        attack: 25,

        speed: 4,

        target: null
    };


    scene.add(tank);

    units.push(tank);


    return tank;
}


/* =========================================================
   INFANTRY
   ========================================================= */

function createSoldier(
    color,
    x,
    z,
    name,
    team
) {

    const soldier =
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
                0.36,
                12,
                8
            ),

            new THREE.MeshStandardMaterial({
                color: 0xc58b69
            })

        );


    head.position.y =
        1.95;


    head.castShadow = true;


    soldier.add(head);


    soldier.position.set(
        x,
        0,
        z
    );


    soldier.userData = {

        name: name,

        team: team,

        hp: 80,

        maxHP: 80,

        attack: 15,

        speed: 3,

        target: null
    };


    scene.add(soldier);

    units.push(soldier);


    return soldier;
}


/* =========================================================
   CREATE ARMIES
   ========================================================= */

function createUnits() {

    const tank1 =
        createTank(
            0x159ec2,
            -15,
            10,
            "BLUE TANK",
            "player"
        );


    createTank(
        0x159ec2,
        -10,
        15,
        "BLUE TANK 2",
        "player"
    );


    createSoldier(
        0x239b70,
        -6,
        10,
        "BLUE INFANTRY",
        "player"
    );


    enemyTank =
        createTank(
            0xc51f38,
            16,
            -10,
            "RED TANK",
            "enemy"
        );


    createSoldier(
        0xc51f38,
        20,
        -7,
        "RED INFANTRY",
        "enemy"
    );


    selectedUnit =
        tank1;
}


/* =========================================================
   SELECT / MOVE
   ========================================================= */

function selectOrMove(
    event
) {

    if (!gameStarted) {
        return;
    }


    const rect =
        renderer.domElement.getBoundingClientRect();


    const mouse =
        new THREE.Vector2();


    mouse.x =
        (
            (event.clientX -
                rect.left) /
            rect.width
        ) * 2 - 1;


    mouse.y =
        -(
            (event.clientY -
                rect.top) /
            rect.height
        ) * 2 + 1;


    const raycaster =
        new THREE.Raycaster();


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const objects =
        raycaster.intersectObjects(
            scene.children,
            true
        );


    for (
        const hit of objects
    ) {

        let object =
            hit.object;


        while (
            object &&
            object.parent
        ) {

            if (
                object.userData &&
                object.userData.hp
            ) {

                if (
                    object.userData.team ===
                    "player"
                ) {

                    selectedUnit =
                        object;


                    showInfo(
                        "Selected: " +
                        object.userData.name
                    );

                    return;
                }

                break;
            }


            object =
                object.parent;
        }
    }


    const groundHit =
        objects.find(
            hit =>
                hit.object.userData &&
                hit.object.userData.isGround
        );


    if (
        groundHit &&
        selectedUnit
    ) {

        selectedUnit.userData.target =
            groundHit.point.clone();


        showInfo(
            "Moving " +
            selectedUnit.userData.name
        );
    }
}


/* =========================================================
   MOVEMENT
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


        const distance =
            direction.length();


        if (
            distance < 0.4
        ) {

            unit.userData.target =
                null;

            continue;
        }


        direction.normalize();


        unit.position.addScaledVector(
            direction,
            unit.userData.speed *
            delta
        );


        unit.rotation.y =
            Math.atan2(
                direction.x,
                direction.z
            );
    }
}


/* =========================================================
   ATTACK
   ========================================================= */

function attackEnemy() {

    if (!selectedUnit) {

        showInfo(
            "Select a unit first."
        );

        return;
    }


    if (!enemyTank) {

        showInfo(
            "Enemy tank destroyed."
        );

        return;
    }


    const distance =
        selectedUnit.position.distanceTo(
            enemyTank.position
        );


    if (distance > 15) {

        showInfo(
            "Enemy is too far away."
        );

        return;
    }


    enemyTank.userData.hp -=
        selectedUnit.userData.attack;


    createExplosion(
        enemyTank.position
    );


    showInfo(
        "⚔ ATTACK! Enemy HP: " +
        Math.max(
            0,
            enemyTank.userData.hp
        )
    );


    if (
        enemyTank.userData.hp <= 0
    ) {

        scene.remove(
            enemyTank
        );


        enemyTank =
            null;


        document.getElementById(
            "mission"
        ).textContent =
            "🏆 ENEMY TANK DESTROYED!";
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


    if (
        fuel < 150
    ) {

        showInfo(
            "Not enough fuel."
        );

        return;
    }


    if (!enemyTank) {

        showInfo(
            "No enemy target."
        );

        return;
    }


    fuel -= 150;


    fuelElement.textContent =
        fuel;


    enemyTank.userData.hp -=
        45;


    createExplosion(
        enemyTank.position
    );


    showInfo(
        "✈ AIR STRIKE! 45 DAMAGE"
    );


    if (
        enemyTank.userData.hp <= 0
    ) {

        scene.remove(
            enemyTank
        );


        enemyTank =
            null;


        document.getElementById(
            "mission"
        ).textContent =
            "🏆 AIR STRIKE SUCCESS!";
    }
}


/* =========================================================
   DEFENSE
   ========================================================= */

function defend() {

    showInfo(
        "🛡 DEFENSIVE FORMATION ACTIVATED"
    );
}


/* =========================================================
   EXPLOSION
   ========================================================= */

function createExplosion(
    position
) {

    const group =
        new THREE.Group();


    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const particle =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.15,
                    6,
                    6
                ),

                new THREE.MeshBasicMaterial({
                    color:
                        i % 2
                            ? 0xffcc33
                            : 0xff5b16
                })

            );


        particle.position.copy(
            position
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


        group.add(
            particle
        );
    }


    scene.add(group);


    let life = 0;


    function animate() {

        life += 0.035;


        group.children.forEach(
            particle => {

                particle.position.addScaledVector(
                    particle.userData.velocity,
                    0.035
                );


                particle.userData.velocity.y -=
                    0.08;
            }
        );


        group.scale.setScalar(
            1 + life
        );


        if (
            life < 1
        ) {

            requestAnimationFrame(
                animate
            );

        } else {

            scene.remove(
                group
            );
        }
    }


    animate();
}


/* =========================================================
   ENEMY AI
   ========================================================= */

function enemyAI(
    delta
) {

    aiTimer += delta;


    if (
        aiTimer < 5
    ) {
        return;
    }


    aiTimer = 0;


    if (
        !enemyTank ||
        !selectedUnit
    ) {
        return;
    }


    const distance =
        enemyTank.position.distanceTo(
            selectedUnit.position
        );


    if (
        distance > 7
    ) {

        enemyTank.userData.target =
            selectedUnit.position.clone();

    } else {

        selectedUnit.userData.hp -=
            enemyTank.userData.attack;


        showInfo(
            "⚠ ENEMY ATTACK! Your HP: " +
            Math.max(
                0,
                selectedUnit.userData.hp
            )
        );
    }
}


/* =========================================================
   UI
   ========================================================= */

function createUI() {

    const attack =
        document.getElementById(
            "attack"
        );


    const air =
        document.getElementById(
            "air"
        );


    const defendButton =
        document.getElementById(
            "defend"
        );


    const reset =
        document.getElementById(
            "reset"
        );


    if (attack) {

        attack.onclick =
            attackEnemy;
    }


    if (air) {

        air.onclick =
            airStrike;
    }


    if (defendButton) {

        defendButton.onclick =
            defend;
    }


    if (reset) {

        reset.onclick =
            resetCamera;
    }
}


/* =========================================================
   INFO
   ========================================================= */

function showInfo(
    message
) {

    const info =
        document.getElementById(
            "info"
        );


    if (info) {

        info.textContent =
            message;
    }
}


/* =========================================================
   RESET CAMERA
   ========================================================= */

function resetCamera() {

    camera.position.set(
        0,
        30,
        32
    );


    controls.target.set(
        0,
        0,
        0
    );


    controls.update();
}


/* =========================================================
   LOADING
   ========================================================= */

function hideLoading() {

    const loading =
        document.getElementById(
            "loading"
        );


    if (!loading) {
        return;
    }


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
            "100%";
    }


    if (text) {

        text.textContent =
            "Battlefield ready.";
    }


    setTimeout(
        () => {

            loading.style.opacity =
                "0";


            setTimeout(
                () => {

                    loading.style.display =
                        "none";

                },
                700
            );

        },
        500
    );
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeGame() {

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
   GAME LOOP
   ========================================================= */

function gameLoop(
    time
) {

    requestAnimationFrame(
        gameLoop
    );


    const delta =
        Math.min(
            0.05,
            (time - lastTime) /
            1000
        );


    lastTime =
        time;


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


/* =========================================================
   LOADING PROGRESS
   ========================================================= */

function loadingProgress() {

    const progress =
        document.getElementById(
            "progress"
        );


    const text =
        document.getElementById(
            "loadText"
        );


    const messages = [

        "Initializing battlefield...",

        "Creating terrain...",

        "Deploying military bases...",

        "Preparing army...",

        "Activating tactical systems...",

        "Battlefield ready."

    ];


    let value = 0;


    const timer =
        setInterval(
            () => {

                value += 4;


                if (progress) {

                    progress.style.width =
                        value + "%";
                }


                if (text) {

                    const index =
                        Math.min(
                            messages.length - 1,
                            Math.floor(
                                value / 20
                            )
                        );


                    text.textContent =
                        messages[index];
                }


                if (
                    value >= 100
                ) {

                    clearInterval(
                        timer
                    );
                }

            },
            100
        );
}


/* =========================================================
   BOOT
   ========================================================= */

loadingProgress();

setTimeout(
    startGame,
    700
);