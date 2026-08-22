import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("gameCanvas");

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x80949a);
scene.fog = new THREE.FogExp2(0x80949a, 0.0028);

const camera = new THREE.PerspectiveCamera(
    52,
    innerWidth / innerHeight,
    0.1,
    2500
);

camera.position.set(48, 62, 68);

const controls = new OrbitControls(camera, canvas);

controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 16;
controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI / 2.04;
controls.target.set(0, 0, 0);

const clock = new THREE.Clock();
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const terrain = new THREE.Group();
const world = new THREE.Group();
const army = new THREE.Group();

scene.add(terrain, world, army);

const units = [];
const enemies = [];
const effects = [];

const S = {
    country: "USA",
    paused: false,
    speed: 1,

    date: new Date(1940, 0, 1),

    money: 12500,
    oil: 850,
    steel: 1250,
    food: 1600,
    manpower: 85000,

    selected: null,

    move: false,
    attack: false,

    battle: "NO ACTIVE BATTLE",
    status: "All systems operational"
};

const nations = {
    USA: ["🇺🇸", "United States", 0x4e7db7],
    GERMANY: ["🇩🇪", "Germany", 0x55585a],
    UK: ["🇬🇧", "United Kingdom", 0x3d5d8d],
    JAPAN: ["🇯🇵", "Japan", 0x8e4f4f],
    USSR: ["☭", "Soviet Union", 0x8b493f],
    FRANCE: ["🇫🇷", "France", 0x536e91]
};

const M = color =>
    new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82
    });

function h(x, z) {
    return Math.max(
        -1.5,
        Math.sin(x * 0.055) * 2.5 +
        Math.cos(z * 0.065) * 2 +
        Math.sin((x + z) * 0.025) * 4 +
        Math.cos(Math.hypot(x, z) * 0.035) * 2.2
    );
}


/* ================= TERRAIN ================= */

function terrainBuild() {

    const g = new THREE.PlaneGeometry(
        220,
        220,
        110,
        110
    );

    g.rotateX(-Math.PI / 2);

    const p = g.attributes.position;

    for (let i = 0; i < p.count; i++) {
        p.setY(
            i,
            h(
                p.getX(i),
                p.getZ(i)
            )
        );
    }

    g.computeVertexNormals();

    const ground = new THREE.Mesh(
        g,
        M(0x53654b)
    );

    ground.receiveShadow = true;

    terrain.add(ground);


    /* Roads */

    const rm = M(0x343937);

    for (let i = -3; i <= 3; i++) {

        const r = new THREE.Mesh(
            new THREE.PlaneGeometry(220, 3.2),
            rm
        );

        r.rotation.x = -Math.PI / 2;
        r.rotation.z = i * 0.035;
        r.position.y = 0.15;

        terrain.add(r);
    }


    /* River */

    const river = new THREE.Mesh(
        new THREE.PlaneGeometry(220, 8),
        new THREE.MeshStandardMaterial({
            color: 0x315d72,
            roughness: 0.2,
            transparent: true,
            opacity: 0.85
        })
    );

    river.rotation.x = -Math.PI / 2;
    river.rotation.z = -0.18;

    river.position.set(
        20,
        0.25,
        -38
    );

    terrain.add(river);
}


/* ================= TREES ================= */

function tree(x, z, s) {

    const g = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.16 * s,
            0.25 * s,
            2.4 * s,
            7
        ),
        M(0x4a382a)
    );

    const crown = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.6 * s,
            4.8 * s,
            8
        ),
        M(0x263d2c)
    );

    trunk.position.y = 1.2 * s;
    crown.position.y = 4 * s;

    trunk.castShadow = true;
    crown.castShadow = true;

    g.add(trunk, crown);

    g.position.set(
        x,
        h(x, z),
        z
    );

    world.add(g);
}


function forest() {

    for (let i = 0; i < 145; i++) {

        const x =
            (Math.random() - 0.5) * 205;

        const z =
            (Math.random() - 0.5) * 205;

        if (Math.abs(z) < 12)
            continue;

        tree(
            x,
            z,
            0.65 + Math.random() * 0.75
        );
    }
}


/* ================= BUILDINGS ================= */

function buildings() {

    [
        [-18, -8, 9, 7],
        [-5, -11, 11, 7],
        [9, -7, 8, 8],
        [18, 2, 12, 7],
        [-22, 7, 7, 6],
        [3, 10, 10, 7]
    ].forEach(a => {

        const [x, z, w, d] = a;

        const g = new THREE.Group();

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(
                w,
                6,
                d
            ),
            M(0x6d6258)
        );

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(
                Math.max(w, d) * 0.72,
                2.4,
                4
            ),
            M(0x45403c)
        );

        building.position.y = 3;
        roof.position.y = 7;
        roof.rotation.y = Math.PI / 4;

        building.castShadow = true;

        g.add(
            building,
            roof
        );

        g.position.set(
            x,
            h(x, z),
            z
        );

        world.add(g);
    });
}


/* ================= LIGHTING ================= */

function lights() {

    scene.add(
        new THREE.HemisphereLight(
            0xcfe5ff,
            0x3b4739,
            2.1
        )
    );

    const sun =
        new THREE.DirectionalLight(
            0xfff0d0,
            3.2
        );

    sun.position.set(
        -80,
        120,
        60
    );

    sun.castShadow = true;

    sun.shadow.mapSize.set(
        2048,
        2048
    );

    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;

    scene.add(sun);
}


/* ================= UNIT SYSTEM ================= */

function unit(
    name,
    x,
    z,
    type = "INFANTRY",
    enemy = false
) {

    const g = new THREE.Group();

    const color =
        enemy
            ? 0x9e3d3d
            : nations[S.country][2];


    /* TANK */

    if (type === "TANK") {

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(
                4.4,
                1.5,
                5.6
            ),
            M(color)
        );

        body.position.y = 1.1;

        const turret = new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.5,
                1.5,
                0.75,
                10
            ),
            M(0x30383a)
        );

        turret.position.y = 2.1;

        const gun = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.18,
                0.25,
                4.8,
                8
            ),
            M(0x24292b)
        );

        gun.rotation.z = Math.PI / 2;

        gun.position.set(
            2.4,
            2.15,
            0
        );

        g.add(
            body,
            turret,
            gun
        );
    }


    /* ARTILLERY */

    else if (type === "ARTILLERY") {

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(
                3,
                1.2,
                4
            ),
            M(color)
        );

        body.position.y = 0.8;

        const gun = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.3,
                4.5,
                8
            ),
            M(0x252a2b)
        );

        gun.rotation.z = Math.PI / 2;

        gun.position.set(
            2,
            1.8,
            0
        );

        g.add(
            body,
            gun
        );
    }


    /* INFANTRY */

    else {

        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.7,
                1.5,
                4,
                8
            ),
            M(color)
        );

        body.position.y = 1.25;

        const head = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.45,
                12,
                10
            ),
            M(0x8b6d55)
        );

        head.position.y = 2.7;

        const rifle = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                0.15,
                2.2
            ),
            M(0x242424)
        );

        rifle.position.set(
            0.6,
            1.45,
            0.1
        );

        rifle.rotation.z = -0.3;

        g.add(
            body,
            head,
            rifle
        );
    }


    /* Selection ring */

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(
            1.2,
            1.45,
            32
        ),
        new THREE.MeshBasicMaterial({
            color:
                enemy
                    ? 0xe45d5d
                    : 0xd5ad55,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        })
    );

    ring.rotation.x =
        -Math.PI / 2;

    ring.position.y = 0.12;

    ring.name = "ring";

    g.add(ring);


    g.position.set(
        x,
        h(x, z),
        z
    );


    g.userData = {

        unit: true,

        name,
        type,
        enemy,

        hp: enemy ? 75 : 100,

        morale: 82,

        org: 91,

        fuel:
            type === "INFANTRY"
                ? 100
                : 72,

        ammo: 100,

        speed:
            type === "TANK"
                ? 4.5
                : type === "ARTILLERY"
                    ? 3.2
                    : 5.2,

        moving: false,

        dest: null
    };


    army.add(g);

    if (enemy)
        enemies.push(g);
    else
        units.push(g);

    return g;
}


/* ================= ARMIES ================= */

function armies() {

    unit(
        "1st Infantry Division",
        -42,
        22
    );

    unit(
        "2nd Armored Division",
        -33,
        30,
        "TANK"
    );

    unit(
        "3rd Infantry Division",
        -25,
        25
    );

    unit(
        "7th Artillery Group",
        -39,
        34,
        "ARTILLERY"
    );


    unit(
        "Enemy 1st Division",
        36,
        -8,
        "INFANTRY",
        true
    );

    unit(
        "Enemy Armored Corps",
        47,
        3,
        "TANK",
        true
    );

    unit(
        "Enemy 4th Division",
        25,
        15,
        "INFANTRY",
        true
    );

    unit(
        "Enemy Artillery",
        42,
        20,
        "ARTILLERY",
        true
    );
}


/* ================= UI ================= */

function toast(text) {

    const e =
        document.getElementById("toast");

    e.textContent = text;

    e.classList.add("show");

    clearTimeout(toast.t);

    toast.t =
        setTimeout(
            () =>
                e.classList.remove("show"),
            1700
        );
}


/* ================= SELECT UNIT ================= */

function select(u) {

    if (S.selected) {

        S.selected
            .getObjectByName("ring")
            .material.opacity = 0;
    }

    S.selected = u;


    if (!u) {

        document
            .getElementById("unitPanel")
            .classList.remove("open");

        return;
    }


    u.getObjectByName("ring")
        .material.opacity = 0.9;


    document.getElementById(
        "selectedUnitType"
    ).textContent =
        `${u.userData.enemy ? "ENEMY" : "FRIENDLY"} • ${u.userData.type}`;


    document.getElementById(
        "selectedUnitName"
    ).textContent =
        u.userData.name;


    stats();

    document
        .getElementById("unitPanel")
        .classList.add("open");
}


/* ================= UNIT STATS ================= */

function stats() {

    if (!S.selected)
        return;

    const d =
        S.selected.userData;

    document.getElementById(
        "unitStats"
    ).innerHTML = `

        <div class="unit-stat">
            <span>Strength</span>

            <div class="progress">
                <i style="width:${d.hp}%"></i>
            </div>

            <b>${Math.round(d.hp)}</b>
        </div>

        <div class="unit-stat">
            <span>Morale</span>

            <div class="progress">
                <i style="width:${d.morale}%"></i>
            </div>

            <b>${Math.round(d.morale)}</b>
        </div>

        <div class="unit-stat">
            <span>Organization</span>

            <div class="progress">
                <i style="width:${d.org}%"></i>
            </div>

            <b>${Math.round(d.org)}</b>
        </div>

        <div class="unit-stat">
            <span>Fuel</span>

            <div class="progress">
                <i style="width:${d.fuel}%"></i>
            </div>

            <b>${Math.round(d.fuel)}</b>
        </div>

        <div class="unit-stat">
            <span>Ammunition</span>

            <div class="progress">
                <i style="width:${d.ammo}%"></i>
            </div>

            <b>${Math.round(d.ammo)}</b>
        </div>
    `;
}


/* ================= MOVE ================= */

function move(u, p) {

    if (!u || u.userData.enemy)
        return;

    u.userData.dest =
        p.clone();

    u.userData.moving = true;

    S.move = false;

    S.status =
        `${u.userData.name} moving to new position`;

    toast("MOVE ORDER ISSUED");
}


/* ================= EXPLOSION ================= */

function explosion(
    pos,
    big = false
) {

    const g =
        new THREE.Group();

    g.position.copy(pos);


    for (
        let i = 0;
        i < (big ? 18 : 9);
        i++
    ) {

        const m =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.15 +
                    Math.random() * 0.4,
                    7,
                    7
                ),
                new THREE.MeshBasicMaterial({
                    color:
                        Math.random() > 0.4
                            ? 0xff9d32
                            : 0x555555,

                    transparent: true,
                    opacity: 0.9
                })
            );


        m.position.set(
            (Math.random() - 0.5) * 2,
            Math.random() * 2.5,
            (Math.random() - 0.5) * 2
        );


        m.userData.v =
            new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );


        g.add(m);
    }


    scene.add(g);

    effects.push({
        g,
        life: 1.2
    });
}


/* ================= ATTACK ================= */

function attack(a, t) {

    if (
        !a ||
        !t ||
        a.userData.enemy ===
        t.userData.enemy
    )
        return;


    const dist =
        a.position.distanceTo(
            t.position
        );


    const range =
        a.userData.type === "ARTILLERY"
            ? 34
            : a.userData.type === "TANK"
                ? 18
                : 12;


    if (dist > range) {

        toast(
            `TARGET OUT OF RANGE • ${Math.round(dist)}m`
        );

        return move(
            a,
            t.position
        );
    }


    const dmg =
        a.userData.type === "ARTILLERY"
            ? 20
            : a.userData.type === "TANK"
                ? 14
                : 9;


    t.userData.hp =
        Math.max(
            0,
            t.userData.hp - dmg
        );


    a.userData.ammo =
        Math.max(
            0,
            a.userData.ammo - 4
        );


    t.userData.morale =
        Math.max(
            0,
            t.userData.morale - 7
        );


    explosion(t.position);


    S.battle =
        `${a.userData.name} ENGAGING ${t.userData.name}`;


    toast(
        `HIT • -${dmg} HP`
    );


    if (
        t.userData.hp <= 0
    )
        destroy(t);


    stats();
}


/* ================= DESTROY ================= */

function destroy(u) {

    const arr =
        u.userData.enemy
            ? enemies
            : units;

    const i =
        arr.indexOf(u);

    if (i >= 0)
        arr.splice(i, 1);


    if (S.selected === u)
        select(null);


    explosion(
        u.position,
        true
    );

    army.remove(u);
}


/* ================= UNIT AI ================= */

function updateUnits(dt) {

    /* Friendly */

    for (const u of units) {

        const d =
            u.userData;


        if (
            d.moving &&
            d.dest
        ) {

            const v =
                d.dest
                    .clone()
                    .sub(u.position);

            v.y = 0;


            if (v.length() < 1.2) {

                d.moving = false;
                d.dest = null;

            } else {

                v.normalize();

                u.position.addScaledVector(
                    v,
                    d.speed *
                    dt *
                    S.speed
                );

                u.position.y =
                    h(
                        u.position.x,
                        u.position.z
                    );

                u.rotation.y =
                    Math.atan2(
                        v.x,
                        v.z
                    );


                d.fuel =
                    Math.max(
                        0,
                        d.fuel -
                        dt * 0.05
                    );
            }
        }


        d.morale =
            Math.min(
                100,
                d.morale +
                dt * 0.6
            );
    }


    /* Enemy AI */

    for (const e of enemies) {

        const nearest =
            units.reduce(
                (best, u) =>

                    !best ||
                    e.position.distanceTo(u.position) <
                    e.position.distanceTo(best.position)
                        ? u
                        : best,

                null
            );


        if (!nearest)
            continue;


        const dist =
            e.position.distanceTo(
                nearest.position
            );


        const range =
            e.userData.type === "ARTILLERY"
                ? 32
                : e.userData.type === "TANK"
                    ? 16
                    : 10;


        if (dist < range) {

            if (
                Math.random() <
                dt *
                0.55 *
                S.speed
            ) {

                const dmg =
                    e.userData.type === "TANK"
                        ? 8
                        : e.userData.type === "ARTILLERY"
                            ? 12
                            : 5;


                nearest.userData.hp =
                    Math.max(
                        0,
                        nearest.userData.hp -
                        dmg
                    );


                explosion(
                    nearest.position
                );


                S.battle =
                    `${e.userData.name} ATTACKING ${nearest.userData.name}`;


                if (
                    S.selected ===
                    nearest
                )
                    stats();


                if (
                    nearest.userData.hp <= 0
                )
                    destroy(nearest);
            }

        } else if (
            Math.random() <
            dt * 0.18 * S.speed
        ) {

            e.userData.dest =
                nearest.position.clone();

            e.userData.moving = true;
        }


        if (
            e.userData.moving &&
            e.userData.dest
        ) {

            const v =
                e.userData.dest
                    .clone()
                    .sub(e.position);

            v.y = 0;


            if (v.length() > 1.2) {

                v.normalize();

                e.position.addScaledVector(
                    v,
                    e.userData.speed *
                    dt *
                    S.speed *
                    0.45
                );

                e.position.y =
                    h(
                        e.position.x,
                        e.position.z
                    );

                e.rotation.y =
                    Math.atan2(
                        v.x,
                        v.z
                    );

            } else {

                e.userData.moving =
                    false;
            }
        }
    }
}


/* ================= EFFECTS ================= */

function effectsUpdate(dt) {

    for (
        let i = effects.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            effects[i];

        e.life -= dt;


        e.g.children.forEach(p => {

            p.position.addScaledVector(
                p.userData.v,
                dt
            );

            p.userData.v.y -=
                2.5 * dt;

            p.material.opacity =
                Math.max(
                    0,
                    e.life
                );

            p.scale.multiplyScalar(
                1 + dt * 0.8
            );
        });


        if (
            e.life <= 0
        ) {

            scene.remove(e.g);

            effects.splice(
                i,
                1
            );
        }
    }
}


/* ================= RESOURCES ================= */

function resources() {

    money.textContent =
        Math.floor(
            S.money
        ).toLocaleString();

    oil.textContent =
        Math.floor(S.oil);

    steel.textContent =
        Math.floor(S.steel);

    food.textContent =
        Math.floor(S.food);

    manpower.textContent =
        Math.floor(
            S.manpower
        ).toLocaleString();

    battleStatus.textContent =
        S.battle;

    statusText.textContent =
        S.status;
}


/* ================= GAME TIME ================= */

function time(dt) {

    if (S.paused)
        return;


    S.date =
        new Date(
            S.date.getTime() +
            dt *
            0.35 *
            S.speed *
            86400000
        );


    S.money +=
        dt *
        1.8 *
        S.speed;

    S.oil =
        Math.max(
            0,
            S.oil +
            dt *
            0.35 *
            S.speed
        );

    S.steel +=
        dt *
        0.55 *
        S.speed;

    S.food +=
        dt *
        0.45 *
        S.speed;

    S.manpower =
        Math.max(
            0,
            S.manpower -
            dt *
            0.5 *
            S.speed
        );


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


    gameDate.textContent =
        `${S.date.getFullYear()} • ${
            months[S.date.getMonth()]
        } ${
            String(
                S.date.getDate()
            ).padStart(2, "0")
        }`;
}


/* ================= PANELS ================= */

function panel(type) {

    const title = {

        overview: [
            "STRATEGIC COMMAND",
            "World Overview"
        ],

        army: [
            "MILITARY COMMAND",
            "Army"
        ],

        economy: [
            "NATIONAL ECONOMY",
            "Economy"
        ],

        production: [
            "INDUSTRIAL COMMAND",
            "Production"
        ],

        research: [
            "TECHNOLOGY",
            "Research"
        ],

        diplomacy: [
            "FOREIGN AFFAIRS",
            "Diplomacy"
        ],

        intel: [
            "INTELLIGENCE",
            "Intelligence"
        ],

        settings: [
            "SYSTEM",
            "Settings"
        ]

    }[type] || [
        "STRATEGIC COMMAND",
        "World Overview"
    ];


    panelKicker.textContent =
        title[0];

    panelTitle.textContent =
        title[1];


    let html = "";


    if (type === "overview") {

        html = `

        <div class="info-card">

            <h3>
                Frontline Intelligence
            </h3>

            <p>
                Monitor formations,
                terrain, cities and
                combat zones.
            </p>

        </div>


        <div class="info-card">

            <div class="stat-row">
                <span>Friendly Units</span>
                <b>${units.length}</b>
            </div>

            <div class="stat-row">
                <span>Enemy Units</span>
                <b>${enemies.length}</b>
            </div>

            <div class="stat-row">
                <span>Territory Control</span>
                <b>42%</b>
            </div>

        </div>


        <button
            class="action-btn"
            id="nationBtn"
        >
            CHANGE NATION
        </button>
        `;
    }


    else if (type === "army") {

        html =
            units.map(u => `

            <div class="info-card">

                <h3>
                    ${u.userData.name}
                </h3>

                <div class="stat-row">
                    <span>Type</span>
                    <b>
                        ${u.userData.type}
                    </b>
                </div>

                <div class="stat-row">
                    <span>Strength</span>
                    <b>
                        ${Math.round(
                            u.userData.hp
                        )}%
                    </b>
                </div>

                <button
                    class="action-btn su"
                    data-id="${u.uuid}"
                >
                    SELECT UNIT
                </button>

            </div>

            `).join("");
    }


    else if (type === "economy") {

        html = `

        <div class="info-card">

            <div class="stat-row">
                <span>💰 Treasury</span>
                <b>
                    ${Math.floor(
                        S.money
                    ).toLocaleString()}
                </b>
            </div>

            <div class="stat-row">
                <span>🛢️ Oil</span>
                <b>
                    ${Math.floor(S.oil)}
                </b>
            </div>

            <div class="stat-row">
                <span>⚙️ Steel</span>
                <b>
                    ${Math.floor(S.steel)}
                </b>
            </div>

            <div class="stat-row">
                <span>🌾 Food</span>
                <b>
                    ${Math.floor(S.food)}
                </b>
            </div>

        </div>


        <button
            class="action-btn"
            id="mobilize"
        >
            MOBILIZE +5,000 MANPOWER
        </button>
        `;
    }


    else if (type === "production") {

        html = `

        <div class="info-card">

            <h3>
                Armored Vehicles
            </h3>

            <p>
                Steel 120 • Oil 35 •
                30 days
            </p>

            <button class="action-btn">
                START PRODUCTION
            </button>

        </div>


        <div class="info-card">

            <h3>
                Infantry Equipment
            </h3>

            <p>
                Steel 50 • 12 days
            </p>

            <button class="action-btn">
                START PRODUCTION
            </button>

        </div>
        `;
    }


    else if (type === "research") {

        html = `

        <div class="info-card">

            <h3>
                Improved Armor
            </h3>

            <p>
                +12% tank durability.
            </p>

            <button class="action-btn">
                RESEARCH
            </button>

        </div>


        <div class="info-card">

            <h3>
                Advanced Artillery
            </h3>

            <p>
                +20% artillery damage.
            </p>

            <button class="action-btn">
                RESEARCH
            </button>

        </div>
        `;
    }


    else if (type === "diplomacy") {

        html = `

        <div class="info-card">

            <h3>
                International Relations
            </h3>

            <div class="stat-row">
                <span>Germany</span>
                <b>-48</b>
            </div>

            <div class="stat-row">
                <span>United Kingdom</span>
                <b>+32</b>
            </div>

            <div class="stat-row">
                <span>France</span>
                <b>+18</b>
            </div>

        </div>
        `;
    }


    else if (type === "intel") {

        html = `

        <div class="info-card">

            <h3>
                Enemy Recon
            </h3>

            <p>
                Enemy formations tracked.
                Intel confidence: 76%.
            </p>

        </div>
        `;
    }


    else {

        html = `

        <div class="info-card">

            <h3>
                Controls
            </h3>

            <p>
                Drag = rotate •
                Wheel/pinch = zoom •
                Tap unit = select •
                Tap ground = move.
            </p>

        </div>
        `;
    }


    panelContent.innerHTML =
        html;

    mainPanel.classList.add(
        "open"
    );


    document
        .querySelectorAll(".su")
        .forEach(button => {

            button.onclick = () => {

                select(
                    units.find(
                        u =>
                            u.uuid ===
                            button.dataset.id
                    )
                );
            };
        });


    if (nationBtn) {

        nationBtn.onclick = () => {

            countryModal.classList.add(
                "open"
            );
        };
    }


    if (mobilize) {

        mobilize.onclick = () => {

            if (S.money >= 500) {

                S.money -= 500;

                S.manpower += 5000;

                toast(
                    "5,000 MANPOWER MOBILIZED"
                );
            }
        };
    }
}


/* ================= UI EVENTS ================= */

function ui() {

    document
        .querySelectorAll(".panel-button")
        .forEach(button => {

            button.onclick = () => {

                document
                    .querySelectorAll(
                        ".panel-button"
                    )
                    .forEach(x =>
                        x.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                panel(
                    button.dataset.panel
                );
            };
        });


    closePanel.onclick = () =>
        mainPanel.classList.remove(
            "open"
        );


    closeUnit.onclick = () =>
        select(null);


    pauseBtn.onclick = () => {

        S.paused =
            !S.paused;

        pauseBtn.textContent =
            S.paused
                ? "▶"
                : "Ⅱ";

        toast(
            S.paused
                ? "GAME PAUSED"
                : "GAME RESUMED"
        );
    };


    speedBtn.onclick = () => {

        S.speed =
            S.speed === 1
                ? 2
                : S.speed === 2
                    ? 4
                    : 1;

        speedBtn.textContent =
            S.speed + "×";
    };


    zoomIn.onclick = () => {

        camera.position.y =
            Math.max(
                12,
                camera.position.y - 8
            );
    };


    zoomOut.onclick = () => {

        camera.position.y =
            Math.min(
                150,
                camera.position.y + 8
            );
    };


    resetCamera.onclick = () => {

        camera.position.set(
            48,
            62,
            68
        );

        controls.target.set(
            0,
            0,
            0
        );
    };


    closeCountryModal.onclick =
        () =>
            countryModal.classList.remove(
                "open"
            );


    document
        .querySelectorAll(".country-card")
        .forEach(card => {

            card.onclick = () => {

                const n =
                    nations[
                        card.dataset.country
                    ];


                S.country =
                    card.dataset.country;


                countryFlag.textContent =
                    n[0];

                countryName.textContent =
                    n[1];


                countryModal.classList.remove(
                    "open"
                );


                toast(
                    n[1].toUpperCase() +
                    " SELECTED"
                );
            };
        });


    moveCommand.onclick = () => {

        if (!S.selected)
            return toast(
                "SELECT A UNIT FIRST"
            );

        S.move = true;

        toast(
            "TAP TERRAIN TO MOVE"
        );
    };


    attackCommand.onclick = () => {

        if (!S.selected)
            return toast(
                "SELECT A UNIT FIRST"
            );

        S.attack = true;

        toast(
            "TAP AN ENEMY UNIT"
        );
    };


    defendCommand.onclick = () => {

        if (!S.selected)
            return;


        S.selected.userData.morale =
            Math.min(
                100,
                S.selected.userData.morale +
                10
            );


        S.selected.userData.org =
            Math.min(
                100,
                S.selected.userData.org +
                8
            );


        toast(
            "DEFENSIVE POSITION SET"
        );

        stats();
    };


    holdCommand.onclick = () => {

        if (S.selected) {

            S.selected.userData.moving =
                false;

            S.selected.userData.dest =
                null;

            toast(
                "HOLD POSITION"
            );
        }
    };


    retreatCommand.onclick = () => {

        if (S.selected) {

            move(
                S.selected,
                new THREE.Vector3(
                    S.selected.position.x - 15,
                    0,
                    S.selected.position.z + 15
                )
            );
        }
    };


    airstrikeCommand.onclick = () => {

        if (!S.selected)
            return;


        if (S.oil < 40)
            return toast(
                "INSUFFICIENT OIL"
            );


        S.oil -= 40;


        const t =
            enemies[
                Math.floor(
                    Math.random() *
                    enemies.length
                )
            ];


        if (t) {

            t.userData.hp =
                Math.max(
                    0,
                    t.userData.hp - 25
                );


            explosion(
                t.position,
                true
            );


            if (
                t.userData.hp <= 0
            )
                destroy(t);


            toast(
                "AIRSTRIKE INCOMING"
            );
        }
    };
}


/* ================= MAP TOUCH ================= */

canvas.addEventListener(
    "pointerdown",
    e => {

        const r =
            canvas.getBoundingClientRect();


        pointer.x =
            ((e.clientX - r.left) /
                r.width) *
            2 -
            1;


        pointer.y =
            -(
                (e.clientY - r.top) /
                r.height
            ) *
            2 +
            1;


        ray.setFromCamera(
            pointer,
            camera
        );


        const hits =
            ray.intersectObjects(
                army.children,
                true
            );


        if (hits.length) {

            let o =
                hits[0].object;


            while (
                o &&
                !o.userData.unit
            )
                o = o.parent;


            if (o) {

                if (
                    S.attack &&
                    S.selected &&
                    o.userData.enemy
                ) {

                    S.attack = false;

                    attack(
                        S.selected,
                        o
                    );

                } else {

                    select(o);
                }
            }


            return;
        }


        if (
            S.move &&
            S.selected
        ) {

            const hits2 =
                ray.intersectObjects(
                    terrain.children,
                    true
                );


            if (hits2.length)
                move(
                    S.selected,
                    hits2[0].point
                );
        }
    }
);


/* ================= LOADING ================= */

function load() {

    let p = 0;

    const t =
        setInterval(() => {

            p +=
                Math.random() * 16 +
                8;

            p =
                Math.min(
                    100,
                    p
                );


            loadingProgress.style.width =
                p + "%";


            loadingStatus.textContent =
                p < 35
                    ? "Generating terrain..."
                    : p < 60
                        ? "Deploying military units..."
                        : p < 82
                            ? "Initializing combat AI..."
                            : "Finalizing tactical systems...";


            if (p >= 100) {

                clearInterval(t);

                setTimeout(
                    () =>
                        loadingScreen.classList.add(
                            "hidden"
                        ),
                    450
                );
            }

        }, 120);
}


/* ================= START GAME ================= */

terrainBuild();
forest();
buildings();
lights();
armies();

ui();

panel("overview");

load();


/* ================= GAME LOOP ================= */

function loop() {

    requestAnimationFrame(
        loop
    );


    const dt =
        Math.min(
            clock.getDelta(),
            0.05
        );


    time(dt);


    if (!S.paused)
        updateUnits(dt);


    effectsUpdate(dt);

    controls.update();

    resources();

    renderer.render(
        scene,
        camera
    );
}


loop();


/* ================= RESIZE ================= */

addEventListener(
    "resize",
    () => {

        camera.aspect =
            innerWidth /
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );

        renderer.setPixelRatio(
            Math.min(
                devicePixelRatio,
                2
            )
        );
    }
);