/* =========================================================
   WARFRONT
   MOBILE 3D-LOOKING TACTICAL BATTLEFIELD
   No external library required.
========================================================= */

"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

function resize() {

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);

resize();


/* =========================================================
   GAME STATE
========================================================= */

const state = {

    money: 11500,

    fuel: 1520,

    metal: 4140,

    score: 5,

    level: 1,

    allyScore: 50,

    enemyScore: 50,

    victories: 0,

    selected: "tank1",

    zoom: 1,

    cameraX: 0,

    cameraY: 0,

    gameOver: false,

    won: false

};


/* =========================================================
   WORLD
========================================================= */

const world = {

    width: 2200,

    height: 1500,

    riverX: 1050,

    roadY: 850,

    baseX: 280,

    baseY: 700,

    enemyBaseX: 1880,

    enemyBaseY: 650

};


/* =========================================================
   UNITS
========================================================= */

const units = {

    tank1: {
        name: "TANK ALPHA",
        type: "tank",
        x: 400,
        y: 680,
        hp: 100,
        maxHp: 100,
        attack: 38,
        speed: 2.2,
        range: 240,
        alive: true,
        color: "#20dfff"
    },

    tank2: {
        name: "TANK BRAVO",
        type: "tank",
        x: 480,
        y: 780,
        hp: 100,
        maxHp: 100,
        attack: 35,
        speed: 2.1,
        range: 230,
        alive: true,
        color: "#20dfff"
    },

    infantry1: {
        name: "INFANTRY ALPHA",
        type: "infantry",
        x: 330,
        y: 830,
        hp: 80,
        maxHp: 80,
        attack: 22,
        speed: 2.8,
        range: 190,
        alive: true,
        color: "#58e59a"
    },

    infantry2: {
        name: "INFANTRY BRAVO",
        type: "infantry",
        x: 540,
        y: 900,
        hp: 80,
        maxHp: 80,
        attack: 20,
        speed: 2.8,
        range: 185,
        alive: true,
        color: "#58e59a"
    },

    fighter1: {
        name: "FIGHTER ONE",
        type: "fighter",
        x: 650,
        y: 550,
        hp: 90,
        maxHp: 90,
        attack: 50,
        speed: 4,
        range: 500,
        alive: true,
        color: "#55c8ff"
    }

};


/* =========================================================
   ENEMIES
========================================================= */

const enemies = {

    enemyTank1: {
        name: "ENEMY TANK",
        type: "tank",
        x: 1700,
        y: 600,
        hp: 100,
        maxHp: 100,
        attack: 30,
        alive: true
    },

    enemyTank2: {
        name: "ENEMY TANK",
        type: "tank",
        x: 1780,
        y: 760,
        hp: 100,
        maxHp: 100,
        attack: 30,
        alive: true
    },

    enemyInfantry1: {
        name: "ENEMY INFANTRY",
        type: "infantry",
        x: 1600,
        y: 820,
        hp: 80,
        maxHp: 80,
        attack: 20,
        alive: true
    },

    enemyInfantry2: {
        name: "ENEMY INFANTRY",
        type: "infantry",
        x: 1740,
        y: 920,
        hp: 80,
        maxHp: 80,
        attack: 20,
        alive: true
    },

    enemyFighter: {
        name: "ENEMY FIGHTER",
        type: "fighter",
        x: 1550,
        y: 450,
        hp: 90,
        maxHp: 90,
        attack: 38,
        alive: true
    }

};


/* =========================================================
   TREES
========================================================= */

const trees = [];

for (let i = 0; i < 80; i++) {

    const x = 40 + Math.random() * (world.width - 80);
    const y = 40 + Math.random() * (world.height - 80);

    if (
        Math.abs(x - world.riverX) < 120 ||
        Math.abs(y - world.roadY) < 80
    ) {
        continue;
    }

    trees.push({
        x,
        y,
        size: 12 + Math.random() * 15
    });

}


/* =========================================================
   BUILDINGS
========================================================= */

const buildings = [

    { x: 180, y: 450, w: 100, h: 70 },
    { x: 340, y: 430, w: 80, h: 55 },
    { x: 540, y: 500, w: 120, h: 65 },

    { x: 1450, y: 450, w: 100, h: 65 },
    { x: 1630, y: 420, w: 130, h: 75 },
    { x: 1810, y: 500, w: 90, h: 60 }

];


/* =========================================================
   EFFECTS
========================================================= */

const explosions = [];

const shots = [];

const smoke = [];


/* =========================================================
   PROJECT TO SCREEN
========================================================= */

function project(x, y) {

    const horizon = H * 0.24;

    const depth =
        0.45 +
        (y / world.height) * 0.75;

    const scale =
        depth * state.zoom;

    return {

        x:
            W / 2 +
            (x - world.width / 2) *
            scale *
            0.75 -
            state.cameraX,

        y:
            horizon +
            y * scale *
            0.55 -
            state.cameraY,

        scale

    };

}


/* =========================================================
   CAMERA
========================================================= */

function cameraCenterOnUnit() {

    const unit = units[state.selected];

    if (!unit) return;

    const p = project(unit.x, unit.y);

    state.cameraX +=
        (p.x - W / 2) * 0.04;

    state.cameraY +=
        (p.y - H / 2) * 0.025;

}


/* =========================================================
   DRAW SKY
========================================================= */

function drawSky() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H * 0.5
        );

    gradient.addColorStop(
        0,
        "#061217"
    );

    gradient.addColorStop(
        .55,
        "#102b31"
    );

    gradient.addColorStop(
        1,
        "#1d3930"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

}


/* =========================================================
   DRAW GROUND
========================================================= */

function drawGround() {

    const ground =
        ctx.createLinearGradient(
            0,
            H * .2,
            0,
            H
        );

    ground.addColorStop(
        0,
        "#214d36"
    );

    ground.addColorStop(
        1,
        "#0d2a1d"
    );

    ctx.fillStyle = ground;

    ctx.fillRect(
        0,
        H * .2,
        W,
        H
    );


    /* GRID */

    ctx.strokeStyle =
        "rgba(130,220,170,.10)";

    ctx.lineWidth = 1;

    const spacing = 70;

    for (
        let x = -state.cameraX % spacing;
        x < W;
        x += spacing
    ) {

        ctx.beginPath();

        ctx.moveTo(x, H * .2);

        ctx.lineTo(
            x + (x - W / 2) * .45,
            H
        );

        ctx.stroke();

    }


    for (
        let y = H * .2;
        y < H;
        y += 45
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(W, y);

        ctx.stroke();

    }

}


/* =========================================================
   DRAW RIVER
========================================================= */

function drawRiver() {

    const left =
        project(
            world.riverX - 90,
            0
        ).x;

    const right =
        project(
            world.riverX + 90,
            0
        ).x;

    const gradient =
        ctx.createLinearGradient(
            left,
            0,
            right,
            0
        );

    gradient.addColorStop(
        0,
        "#0b7080"
    );

    gradient.addColorStop(
        .5,
        "#19a9c0"
    );

    gradient.addColorStop(
        1,
        "#07566a"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.moveTo(left, H * .2);

    ctx.lineTo(right, H * .2);

    ctx.lineTo(
        right + 80,
        H
    );

    ctx.lineTo(
        left - 80,
        H
    );

    ctx.closePath();

    ctx.fill();


    /* WATER LINES */

    ctx.strokeStyle =
        "rgba(180,245,255,.18)";

    for (
        let y = H * .25;
        y < H;
        y += 45
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left + Math.random() * 20,
            y
        );

        ctx.lineTo(
            right - Math.random() * 20,
            y + 2
        );

        ctx.stroke();

    }

}


/* =========================================================
   DRAW ROAD
========================================================= */

function drawRoad() {

    const roadY =
        project(
            0,
            world.roadY
        ).y;

    ctx.fillStyle =
        "#454943";

    ctx.fillRect(
        0,
        roadY - 55,
        W,
        110
    );

    ctx.strokeStyle =
        "rgba(255,255,255,.12)";

    ctx.setLineDash([35, 25]);

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        0,
        roadY
    );

    ctx.lineTo(
        W,
        roadY
    );

    ctx.stroke();

    ctx.setLineDash([]);

}


/* =========================================================
   DRAW BRIDGE
========================================================= */

function drawBridge() {

    const center =
        project(
            world.riverX,
            world.roadY
        );

    ctx.fillStyle =
        "#555953";

    ctx.fillRect(
        center.x - 180,
        center.y - 35,
        360,
        70
    );

    ctx.strokeStyle =
        "#777b74";

    ctx.strokeRect(
        center.x - 180,
        center.y - 35,
        360,
        70
    );

}


/* =========================================================
   DRAW TREES
========================================================= */

function drawTrees() {

    trees.forEach(tree => {

        const p =
            project(
                tree.x,
                tree.y
            );

        if (
            p.x < -50 ||
            p.x > W + 50 ||
            p.y < H * .18 ||
            p.y > H + 50
        ) {
            return;
        }

        const s =
            tree.size *
            p.scale;

        /* shadow */

        ctx.fillStyle =
            "rgba(0,0,0,.25)";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + s * .7,
            s,
            s * .35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /* trunk */

        ctx.fillStyle =
            "#4a3524";

        ctx.fillRect(
            p.x - s * .12,
            p.y,
            s * .24,
            s
        );


        /* tree */

        ctx.fillStyle =
            "#0b4428";

        ctx.beginPath();

        ctx.moveTo(
            p.x,
            p.y - s * 2
        );

        ctx.lineTo(
            p.x - s,
            p.y + s * .5
        );

        ctx.lineTo(
            p.x + s,
            p.y + s * .5
        );

        ctx.closePath();

        ctx.fill();

    });

}


/* =========================================================
   DRAW BUILDINGS
========================================================= */

function drawBuildings() {

    buildings.forEach(b => {

        const p =
            project(
                b.x,
                b.y
            );

        const scale =
            p.scale;

        const w =
            b.w * scale;

        const h =
            b.h * scale;

        ctx.fillStyle =
            "#263338";

        ctx.fillRect(
            p.x - w / 2,
            p.y - h,
            w,
            h
        );

        ctx.strokeStyle =
            "rgba(255,255,255,.15)";

        ctx.strokeRect(
            p.x - w / 2,
            p.y - h,
            w,
            h
        );


        /* roof */

        ctx.fillStyle =
            "#182125";

        ctx.beginPath();

        ctx.moveTo(
            p.x - w / 2,
            p.y - h
        );

        ctx.lineTo(
            p.x,
            p.y - h - 20 * scale
        );

        ctx.lineTo(
            p.x + w / 2,
            p.y - h
        );

        ctx.closePath();

        ctx.fill();

    });

}


/* =========================================================
   DRAW BASE
========================================================= */

function drawBase(x, y, enemy = false) {

    const p = project(x, y);

    const size =
        70 * p.scale;

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.rotate(
        Math.PI / 4
    );

    ctx.fillStyle =
        enemy
            ? "rgba(160,25,35,.35)"
            : "rgba(20,210,230,.25)";

    ctx.fillRect(
        -size,
        -size,
        size * 2,
        size * 2
    );

    ctx.strokeStyle =
        enemy
            ? "#ff4050"
            : "#20dfff";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        -size,
        -size,
        size * 2,
        size * 2
    );

    ctx.restore();


    ctx.fillStyle =
        enemy
            ? "#ff5260"
            : "#20dfff";

    ctx.font =
        "bold 10px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        enemy ? "ENEMY HQ" : "ALLIED HQ",
        p.x,
        p.y - size * 1.5
    );

}


/* =========================================================
   DRAW UNIT
========================================================= */

function drawUnit(unit, id, enemy = false) {

    if (!unit.alive) return;

    const p =
        project(
            unit.x,
            unit.y
        );

    if (
        p.x < -100 ||
        p.x > W + 100 ||
        p.y < 100 ||
        p.y > H + 100
    ) {
        return;
    }

    const size =
        (unit.type === "tank" ? 23 :
         unit.type === "fighter" ? 21 : 14)
        * p.scale;


    /* selection ring */

    if (!enemy && id === state.selected) {

        ctx.strokeStyle =
            "#20e8ff";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + size,
            size * 1.6,
            size * .55,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    /* shadow */

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + size,
        size * 1.1,
        size * .4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* UNIT */

    if (unit.type === "tank") {

        ctx.fillStyle =
            enemy ? "#a82b36" : "#377f72";

        ctx.fillRect(
            p.x - size,
            p.y - size * .5,
            size * 2,
            size
        );

        ctx.fillStyle =
            enemy ? "#d04450" : "#4da995";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - size * .45,
            size * .48,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.strokeStyle =
            enemy ? "#ff6872" : "#8cf5e2";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            p.x,
            p.y - size * .45
        );

        ctx.lineTo(
            p.x + size * 1.3,
            p.y - size * .8
        );

        ctx.stroke();

    }

    else if (unit.type === "infantry") {

        ctx.fillStyle =
            enemy ? "#c13943" : "#56a85d";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - size * .3,
            size * .55,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillRect(
            p.x - size * .45,
            p.y,
            size * .9,
            size * .9
        );

    }

    else {

        ctx.fillStyle =
            enemy ? "#bd3945" : "#4ac9ed";

        ctx.beginPath();

        ctx.moveTo(
            p.x,
            p.y - size * 1.4
        );

        ctx.lineTo(
            p.x - size * .8,
            p.y + size
        );

        ctx.lineTo(
            p.x,
            p.y + size * .45
        );

        ctx.lineTo(
            p.x + size * .8,
            p.y + size
        );

        ctx.closePath();

        ctx.fill();

    }


    /* HP BAR */

    const hp =
        Math.max(
            0,
            unit.hp / unit.maxHp
        );

    ctx.fillStyle =
        "#171d1e";

    ctx.fillRect(
        p.x - size,
        p.y - size * 2,
        size * 2,
        4
    );

    ctx.fillStyle =
        enemy ? "#ff4350" : "#36e3a0";

    ctx.fillRect(
        p.x - size,
        p.y - size * 2,
        size * 2 * hp,
        4
    );


    /* name */

    if (
        !enemy &&
        id === state.selected
    ) {

        ctx.fillStyle = "#d9f8fc";

        ctx.font =
            "bold 9px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            unit.name,
            p.x,
            p.y - size * 2.5
        );

    }

}


/* =========================================================
   DRAW EFFECTS
========================================================= */

function drawEffects() {

    const now = Date.now();

    for (
        let i = explosions.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            explosions[i];

        const age =
            now - e.time;

        if (age > 700) {

            explosions.splice(i, 1);

            continue;
        }

        const p =
            project(
                e.x,
                e.y
            );

        const progress =
            age / 700;

        const radius =
            8 + progress * 55;

        ctx.globalAlpha =
            1 - progress;

        ctx.strokeStyle =
            "#ffbf45";

        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.fillStyle =
            "#ff6b20";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            Math.max(
                2,
                25 - progress * 25
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

    }


    for (
        let i = smoke.length - 1;
        i >= 0;
        i--
    ) {

        const s =
            smoke[i];

        const age =
            now - s.time;

        if (age > 2200) {

            smoke.splice(i, 1);

            continue;

        }

        const p =
            project(
                s.x,
                s.y
            );

        const progress =
            age / 2200;

        ctx.globalAlpha =
            .25 * (1 - progress);

        ctx.fillStyle =
            "#a6aca5";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - progress * 30,
            10 + progress * 20,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

    }


    /* bullets */

    shots.forEach(shot => {

        const age =
            now - shot.time;

        const t =
            Math.min(
                age / shot.duration,
                1
            );

        const x =
            shot.x1 +
            (shot.x2 - shot.x1) * t;

        const y =
            shot.y1 +
            (shot.y2 - shot.y1) * t;

        const p =
            project(x, y);

        ctx.fillStyle =
            "#fff5a3";

        ctx.shadowBlur = 12;

        ctx.shadowColor =
            "#ffe26e";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

    });

}


/* =========================================================
   CREATE EXPLOSION
========================================================= */

function createExplosion(x, y) {

    explosions.push({
        x,
        y,
        time: Date.now()
    });

    smoke.push({
        x,
        y,
        time: Date.now()
    });

}


/* =========================================================
   UPDATE SHOTS
========================================================= */

function cleanupShots() {

    const now = Date.now();

    for (
        let i = shots.length - 1;
        i >= 0;
        i--
    ) {

        if (
            now -
            shots[i].time >
            shots[i].duration
        ) {

            shots.splice(i, 1);

        }

    }

}


/* =========================================================
   FIND ENEMY
========================================================= */

function nearestEnemy(unit) {

    let best = null;

    let bestDistance = Infinity;

    Object.values(enemies)
        .forEach(enemy => {

            if (!enemy.alive) return;

            const dx =
                enemy.x - unit.x;

            const dy =
                enemy.y - unit.y;

            const d =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (d < bestDistance) {

                bestDistance = d;

                best = enemy;

            }

        });

    return {
        enemy: best,
        distance: bestDistance
    };

}


/* =========================================================
   ATTACK
========================================================= */

function attack() {

    if (state.gameOver) return;

    const unit =
        units[state.selected];

    if (!unit || !unit.alive) {

        notify(
            "Selected unit is unavailable."
        );

        return;

    }

    if (state.fuel < 15) {

        notify(
            "Not enough fuel."
        );

        return;

    }

    const result =
        nearestEnemy(unit);

    if (!result.enemy) {

        winBattle();

        return;

    }

    if (
        result.distance >
        unit.range
    ) {

        notify(
            "Target out of range. Move closer."
        );

        return;

    }

    state.fuel -= 15;

    const enemy =
        result.enemy;

    const damage =
        unit.attack +
        Math.floor(
            Math.random() * 12
        );

    enemy.hp -= damage;

    shots.push({
        x1: unit.x,
        y1: unit.y,
        x2: enemy.x,
        y2: enemy.y,
        time: Date.now(),
        duration: 220
    });

    createExplosion(
        enemy.x,
        enemy.y
    );

    notify(
        unit.name +
        " hit enemy for " +
        damage +
        " damage."
    );

    if (enemy.hp <= 0) {

        enemy.hp = 0;

        enemy.alive = false;

        state.allyScore =
            Math.min(
                100,
                state.allyScore + 10
            );

        state.enemyScore =
            Math.max(
                0,
                state.enemyScore - 10
            );

        state.score += 1;

        state.money += 300;

        notify(
            "☠ ENEMY UNIT DESTROYED!"
        );

    }

    updateUI();

    checkBattleEnd();

}


/* =========================================================
   DEFEND
========================================================= */

function defend() {

    if (state.gameOver) return;

    state.allyScore =
        Math.min(
            100,
            state.allyScore + 5
        );

    state.fuel += 15;

    notify(
        "🛡 Defensive formation activated."
    );

    updateUI();

}


/* =========================================================
   AIR STRIKE
========================================================= */

function airStrike() {

    if (state.gameOver) return;

    if (state.fuel < 150) {

        notify(
            "Air strike requires 150 fuel."
        );

        return;

    }

    state.fuel -= 150;

    let destroyed = 0;

    Object.values(enemies)
        .forEach(enemy => {

            if (!enemy.alive) return;

            enemy.hp -= 45;

            createExplosion(
                enemy.x,
                enemy.y
            );

            if (enemy.hp <= 0) {

                enemy.hp = 0;

                enemy.alive = false;

                destroyed++;

            }

        });

    state.allyScore =
        Math.min(
            100,
            state.allyScore + 12
        );

    state.enemyScore =
        Math.max(
            0,
            state.enemyScore - 12
        );

    notify(
        "✈ AIR STRIKE COMPLETE — " +
        destroyed +
        " targets destroyed."
    );

    updateUI();

    checkBattleEnd();

}


/* =========================================================
   SCOUT
========================================================= */

function scout() {

    if (state.fuel < 40) {

        notify(
            "Scout requires 40 fuel."
        );

        return;

    }

    state.fuel -= 40;

    notify(
        "🔭 Recon complete. Enemy positions revealed."
    );

    Object.values(enemies)
        .forEach(enemy => {

            if (!enemy.alive) return;

            createExplosion(
                enemy.x,
                enemy.y
            );

        });

    updateUI();

}


/* =========================================================
   REINFORCE
========================================================= */

function reinforce() {

    if (state.money < 700) {

        notify(
            "Need $700 for reinforcements."
        );

        return;

    }

    state.money -= 700;

    state.allyScore =
        Math.min(
            100,
            state.allyScore + 7
        );

    state.metal += 250;

    notify(
        "➕ Reinforcements deployed."
    );

    updateUI();

}


/* =========================================================
   REPAIR
========================================================= */

function repair() {

    const unit =
        units[state.selected];

    if (!unit || !unit.alive) {

        notify(
            "Unit unavailable."
        );

        return;

    }

    if (state.metal < 100) {

        notify(
            "Need 100 metal."
        );

        return;

    }

    state.metal -= 100;

    unit.hp =
        Math.min(
            unit.maxHp,
            unit.hp + 30
        );

    notify(
        "🔧 Unit repaired."
    );

    updateUI();

}


/* =========================================================
   ENEMY AI
========================================================= */

function enemyAI() {

    if (state.gameOver) return;

    const aliveEnemies =
        Object.values(enemies)
            .filter(e => e.alive);

    if (!aliveEnemies.length) {

        winBattle();

        return;

    }


    const aliveUnits =
        Object.values(units)
            .filter(u => u.alive);

    if (!aliveUnits.length) {

        loseBattle();

        return;

    }


    const enemy =
        aliveEnemies[
            Math.floor(
                Math.random() *
                aliveEnemies.length
            )
        ];


    let target =
        null;

    let shortest =
        Infinity;


    aliveUnits.forEach(unit => {

        const dx =
            unit.x - enemy.x;

        const dy =
            unit.y - enemy.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance < shortest) {

            shortest = distance;

            target = unit;

        }

    });


    if (
        target &&
        shortest < 420
    ) {

        const damage =
            enemy.attack +
            Math.floor(
                Math.random() * 8
            );

        target.hp -= damage;

        createExplosion(
            target.x,
            target.y
        );

        notify(
            "⚠ Enemy attack! " +
            damage +
            " damage."
        );

        if (target.hp <= 0) {

            target.hp = 0;

            target.alive = false;

            state.enemyScore =
                Math.min(
                    100,
                    state.enemyScore + 8
                );

        }

    }

    else if (target) {

        /* enemy advances */

        const dx =
            target.x - enemy.x;

        const dy =
            target.y - enemy.y;

        const length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        enemy.x +=
            (dx / length) * 8;

        enemy.y +=
            (dy / length) * 8;

    }

    updateUI();

}


/* =========================================================
   MOVE SELECTED UNIT
========================================================= */

function moveSelected(dx, dy) {

    const unit =
        units[state.selected];

    if (!unit || !unit.alive) return;

    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (length < .01) return;

    const speed =
        unit.speed *
        4;

    unit.x +=
        (dx / length) * speed;

    unit.y +=
        (dy / length) * speed;


    unit.x =
        Math.max(
            40,
            Math.min(
                world.width - 40,
                unit.x
            )
        );

    unit.y =
        Math.max(
            40,
            Math.min(
                world.height - 40,
                unit.y
            )
        );

    state.fuel =
        Math.max(
            0,
            state.fuel - .03
        );

}


/* =========================================================
   SELECT UNIT
========================================================= */

function selectUnit(id) {

    if (
        !units[id] ||
        !units[id].alive
    ) {

        notify(
            "Unit unavailable."
        );

        return;

    }

    state.selected = id;

    document
        .querySelectorAll(".unit-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.unit === id
            );

        });

    updateUnitInfo();

    notify(
        "Selected: " +
        units[id].name
    );

}


/* =========================================================
   CANVAS TAP SELECT
========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        const rect =
            canvas.getBoundingClientRect();

        const x =
            event.clientX -
            rect.left;

        const y =
            event.clientY -
            rect.top;


        let closest = null;

        let distance = 45;


        Object.entries(units)
            .forEach(([id, unit]) => {

                if (!unit.alive) return;

                const p =
                    project(
                        unit.x,
                        unit.y
                    );

                const dx =
                    p.x - x;

                const dy =
                    p.y - y;

                const d =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (d < distance) {

                    distance = d;

                    closest = id;

                }

            });


        if (closest) {

            selectUnit(closest);

        }

    }
);


/* =========================================================
   JOYSTICK
========================================================= */

const joystick =
    document.getElementById(
        "joystick"
    );

const knob =
    document.getElementById(
        "joystickKnob"
    );

let joystickActive = false;

let joyX = 0;

let joyY = 0;


function joystickMove(
    clientX,
    clientY
) {

    const rect =
        joystick.getBoundingClientRect();

    const centerX =
        rect.left +
        rect.width / 2;

    const centerY =
        rect.top +
        rect.height / 2;

    let dx =
        clientX - centerX;

    let dy =
        clientY - centerY;

    const max =
        32;

    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (length > max) {

        dx =
            dx / length * max;

        dy =
            dy / length * max;

    }

    joyX =
        dx / max;

    joyY =
        dy / max;

    knob.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;

}


joystick.addEventListener(
    "pointerdown",
    event => {

        joystickActive = true;

        joystick.setPointerCapture(
            event.pointerId
        );

        joystickMove(
            event.clientX,
            event.clientY
        );

    }
);


joystick.addEventListener(
    "pointermove",
    event => {

        if (!joystickActive) return;

        joystickMove(
            event.clientX,
            event.clientY
        );

    }
);


joystick.addEventListener(
    "pointerup",
    resetJoystick
);


joystick.addEventListener(
    "pointercancel",
    resetJoystick
);


function resetJoystick() {

    joystickActive = false;

    joyX = 0;

    joyY = 0;

    knob.style.transform =
        "translate(-50%, -50%)";

}


/* =========================================================
   CAMERA BUTTONS
========================================================= */

document
    .getElementById("zoomIn")
    .onclick = () => {

        state.zoom =
            Math.min(
                1.45,
                state.zoom + .1
            );

    };


document
    .getElementById("zoomOut")
    .onclick = () => {

        state.zoom =
            Math.max(
                .65,
                state.zoom - .1
            );

    };


document
    .getElementById("zoomReset")
    .onclick = () => {

        state.zoom = 1;

        state.cameraX = 0;

        state.cameraY = 0;

        notify(
            "Camera reset."
        );

    };


/* =========================================================
   BUTTON EVENTS
========================================================= */

document
    .getElementById("attack")
    .onclick = attack;

document
    .getElementById("defend")
    .onclick = defend;

document
    .getElementById("air")
    .onclick = airStrike;

document
    .getElementById("scout")
    .onclick = scout;

document
    .getElementById("reinforce")
    .onclick = reinforce;

document
    .getElementById("repair")
    .onclick = repair;


/* =========================================================
   UNIT BUTTONS
========================================================= */

document
    .querySelectorAll(".unit-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectUnit(
                    button.dataset.unit
                );

            }
        );

    });


/* =========================================================
   RESEARCH
========================================================= */

document
    .getElementById("research")
    .onclick = () => {

        document
            .getElementById("modalTitle")
            .textContent =
            "🔬 TECHNOLOGY RESEARCH";

        document
            .getElementById("modalContent")
            .innerHTML = `

                <div class="research-item">

                    <h3>Advanced Armor</h3>

                    <p>
                        Increase all ground unit HP.
                    </p>

                    <button onclick="researchArmor()">
                        RESEARCH — $900
                    </button>

                </div>


                <div class="research-item">

                    <h3>Weapon Systems</h3>

                    <p>
                        Increase tank and infantry attack.
                    </p>

                    <button onclick="researchWeapons()">
                        RESEARCH — $1100
                    </button>

                </div>


                <div class="research-item">

                    <h3>Logistics</h3>

                    <p>
                        Increase fuel reserves.
                    </p>

                    <button onclick="researchLogistics()">
                        RESEARCH — $700
                    </button>

                </div>

            `;

        document
            .getElementById("modal")
            .classList.remove("hidden");

    };


window.researchArmor = function() {

    if (state.money < 900) {

        notify(
            "Not enough money."
        );

        return;

    }

    state.money -= 900;

    Object.values(units)
        .forEach(unit => {

            unit.maxHp += 15;

            unit.hp += 15;

        });

    closeModal();

    notify(
        "🔬 Advanced Armor researched."
    );

    updateUI();

};


window.researchWeapons = function() {

    if (state.money < 1100) {

        notify(
            "Not enough money."
        );

        return;

    }

    state.money -= 1100;

    Object.values(units)
        .forEach(unit => {

            unit.attack += 8;

        });

    closeModal();

    notify(
        "🔬 Weapon systems upgraded."
    );

    updateUI();

};


window.researchLogistics = function() {

    if (state.money < 700) {

        notify(
            "Not enough money."
        );

        return;

    }

    state.money -= 700;

    state.fuel += 500;

    closeModal();

    notify(
        "🔬 Logistics upgraded."
    );

    updateUI();

};


/* =========================================================
   MISSIONS
========================================================= */

document
    .getElementById("missions")
    .onclick = () => {

        document
            .getElementById("modalTitle")
            .textContent =
            "🎯 MISSION CONTROL";

        document
            .getElementById("modalContent")
            .innerHTML = `

                <div class="research-item">
                    <h3>Operation First Strike</h3>

                    <p>
                        Destroy enemy forces and capture HQ.
                    </p>

                    <p>
                        Current Level:
                        ${state.level}
                    </p>

                    <p>
                        Victories:
                        ${state.victories}
                    </p>
                </div>


                <div class="research-item">
                    <h3>Battlefield Objectives</h3>

                    <p>
                        ⚔ Destroy enemy units
                    </p>

                    <p>
                        🛡 Maintain allied control
                    </p>

                    <p>
                        🏰 Capture enemy HQ
                    </p>
                </div>

            `;

        document
            .getElementById("modal")
            .classList.remove("hidden");

    };


/* =========================================================
   SAVE
========================================================= */

document
    .getElementById("save")
    .onclick = () => {

        const saveData = {

            state,

            units,

            enemies

        };

        localStorage.setItem(
            "warfront_save",
            JSON.stringify(saveData)
        );

        notify(
            "💾 Game saved."
        );

    };


/* =========================================================
   LOAD
========================================================= */

function loadGame() {

    const saved =
        localStorage.getItem(
            "warfront_save"
        );

    if (!saved) return;

    try {

        const data =
            JSON.parse(saved);

        if (data.state) {

            Object.assign(
                state,
                data.state
            );

        }

        if (data.units) {

            Object.keys(
                data.units
            ).forEach(id => {

                if (units[id]) {

                    Object.assign(
                        units[id],
                        data.units[id]
                    );

                }

            });

        }

        if (data.enemies) {

            Object.keys(
                data.enemies
            ).forEach(id => {

                if (enemies[id]) {

                    Object.assign(
                        enemies[id],
                        data.enemies[id]
                    );

                }

            });

        }

    }

    catch (error) {

        console.log(
            "Save load error:",
            error
        );

    }

}


/* =========================================================
   MODAL
========================================================= */

function closeModal() {

    document
        .getElementById("modal")
        .classList.add("hidden");

}

document
    .getElementById("closeModal")
    .onclick = closeModal;


document
    .getElementById("modal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "modal"
            ) {

                closeModal();

            }

        }
    );


/* =========================================================
   UI
========================================================= */

function updateUI() {

    document
        .getElementById("money")
        .textContent =
        Math.floor(state.money);

    document
        .getElementById("fuel")
        .textContent =
        Math.floor(state.fuel);

    document
        .getElementById("metal")
        .textContent =
        Math.floor(state.metal);

    document
        .getElementById("score")
        .textContent =
        state.score;

    document
        .getElementById("allyScore")
        .textContent =
        state.allyScore;

    document
        .getElementById("enemyScore")
        .textContent =
        state.enemyScore;

    document
        .getElementById("allyBar")
        .style.width =
        state.allyScore + "%";


    const aliveUnits =
        Object.values(units)
            .filter(
                unit => unit.alive
            )
            .length;


    const aliveEnemies =
        Object.values(enemies)
            .filter(
                enemy => enemy.alive
            )
            .length;


    document
        .getElementById("unitCount")
        .textContent =
        aliveUnits;


    document
        .getElementById("enemyCount")
        .textContent =
        aliveEnemies;


    document
        .getElementById("victories")
        .textContent =
        state.victories;


    updateUnitInfo();

}


/* =========================================================
   UNIT INFO
========================================================= */

function updateUnitInfo() {

    const unit =
        units[state.selected];

    if (!unit) return;

    document
        .getElementById("selectedName")
        .textContent =
        unit.name;


    const hp =
        Math.max(
            0,
            unit.hp / unit.maxHp
        ) * 100;


    document
        .getElementById("selectedHp")
        .style.width =
        hp + "%";


    document
        .getElementById("selectedStats")
        .textContent =
        `HP ${Math.floor(unit.hp)}/${unit.maxHp} • ATK ${unit.attack} • RANGE ${unit.range}`;

}


/* =========================================================
   NOTIFICATION
========================================================= */

let notificationTimer = null;

function notify(message) {

    const box =
        document.getElementById(
            "notification"
        );

    box.textContent =
        message;

    box.style.opacity = "1";

    clearTimeout(
        notificationTimer
    );

    notificationTimer =
        setTimeout(() => {

            box.style.opacity =
                "0";

        }, 2300);

}


/* =========================================================
   BATTLE END
========================================================= */

function checkBattleEnd() {

    const enemiesAlive =
        Object.values(enemies)
            .some(
                enemy => enemy.alive
            );

    if (!enemiesAlive) {

        winBattle();

    }


    const unitsAlive =
        Object.values(units)
            .some(
                unit => unit.alive
            );

    if (!unitsAlive) {

        loseBattle();

    }

}


function winBattle() {

    if (state.gameOver) return;

    state.gameOver = true;

    state.won = true;

    state.victories++;

    state.level++;

    state.money += 1800;

    state.fuel += 350;

    state.metal += 500;

    state.score += 3;

    state.allyScore = 100;

    state.enemyScore = 0;

    document
        .getElementById("missionText")
        .textContent =
        "🏆 Victory achieved — new mission unlocked.";

    notify(
        "🏆 VICTORY! Enemy headquarters captured."
    );

    updateUI();

}


function loseBattle() {

    if (state.gameOver) return;

    state.gameOver = true;

    document
        .getElementById("missionText")
        .textContent =
        "Mission failed — reorganize your forces.";

    notify(
        "⚠️ DEFEAT — All allied forces destroyed."
    );

}


/* =========================================================
   GAME LOOP
========================================================= */

function update() {

    if (!state.gameOver) {

        if (
            Math.abs(joyX) > .03 ||
            Math.abs(joyY) > .03
        ) {

            moveSelected(
                joyX,
                joyY
            );

        }

    }

    cleanupShots();

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawSky();

    drawGround();

    drawRoad();

    drawRiver();

    drawBridge();

    drawTrees();

    drawBuildings();

    drawBase(
        world.baseX,
        world.baseY,
        false
    );

    drawBase(
        world.enemyBaseX,
        world.enemyBaseY,
        true
    );


    /* units sorted by Y */

    const allObjects = [];

    Object.entries(units)
        .forEach(
            ([id, unit]) => {

                if (unit.alive) {

                    allObjects.push({
                        unit,
                        id,
                        enemy: false
                    });

                }

            }
        );


    Object.entries(enemies)
        .forEach(
            ([id, unit]) => {

                if (unit.alive) {

                    allObjects.push({
                        unit,
                        id,
                        enemy: true
                    });

                }

            }
        );


    allObjects.sort(
        (a, b) =>
            a.unit.y -
            b.unit.y
    );


    allObjects.forEach(
        object => {

            drawUnit(
                object.unit,
                object.id,
                object.enemy
            );

        }
    );


    drawEffects();

}


/* =========================================================
   LOOP
========================================================= */

function loop() {

    update();

    render();

    requestAnimationFrame(
        loop
    );

}


/* =========================================================
   PASSIVE ECONOMY
========================================================= */

setInterval(
    () => {

        if (state.gameOver) return;

        state.money += 45;

        state.metal += 12;

        updateUI();

    },
    10000
);


/* =========================================================
   ENEMY AI TIMER
========================================================= */

setInterval(
    () => {

        enemyAI();

    },
    3500
);


/* =========================================================
   RANDOM BATTLE EFFECTS
========================================================= */

setInterval(
    () => {

        if (state.gameOver) return;

        const enemiesAlive =
            Object.values(enemies)
                .filter(
                    e => e.alive
                );

        if (!enemiesAlive.length) {
            return;
        }

        const target =
            enemiesAlive[
                Math.floor(
                    Math.random() *
                    enemiesAlive.length
                )
            ];

        createExplosion(
            target.x +
            (Math.random() * 50 - 25),

            target.y +
            (Math.random() * 50 - 25)
        );

    },
    4200
);


/* =========================================================
   LOADING
========================================================= */

let loadingProgress = 0;

const loadingMessages = [

    "Initializing battlefield...",

    "Loading terrain...",

    "Deploying armored units...",

    "Preparing air support...",

    "Connecting tactical systems...",

    "Activating enemy AI...",

    "Battlefield ready."

];


const loadingTimer =
    setInterval(
        () => {

            loadingProgress += 5;

            document
                .getElementById("progress")
                .style.width =
                loadingProgress + "%";


            const index =
                Math.min(
                    Math.floor(
                        loadingProgress / 17
                    ),
                    loadingMessages.length - 1
                );


            document
                .getElementById("loadText")
                .textContent =
                loadingMessages[index];


            if (
                loadingProgress >= 100
            ) {

                clearInterval(
                    loadingTimer
                );


                setTimeout(
                    () => {

                        const loading =
                            document
                            .getElementById(
                                "loading"
                            );

                        loading.style.opacity =
                            "0";


                        setTimeout(
                            () => {

                                loading.style.display =
                                    "none";

                            },
                            800
                        );

                    },
                    400
                );

            }

        },
        100
    );


/* =========================================================
   START
========================================================= */

loadGame();

updateUI();

loop();

notify(
    "Battlefield initialized."
);

console.log(
    "WARFRONT Tactical Command — Ready."
);