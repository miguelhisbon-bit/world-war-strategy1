/* ============================================================
   WARFRONT
   3D TACTICAL COMMAND
   Mobile Tactical Battlefield
   No external libraries
============================================================ */

"use strict";

/* =========================
   DOM
========================= */

const canvas = document.getElementById("battlefield");
const ctx = canvas.getContext("2d");

const loadingScreen = document.getElementById("loadingScreen");
const loadingProgress = document.getElementById("loadingProgress");
const loadingText = document.getElementById("loadingText");

const notification = document.getElementById("notification");

const state = {
    money: 11500,
    fuel: 1500,
    metal: 4000,
    level: 5,

    allyScore: 50,
    enemyScore: 50,

    victories: 0,

    zoom: 1,

    cameraX: 0,
    cameraY: 0,

    selectedUnit: "tank1",

    gameOver: false,

    units: {
        tank1: {
            name: "Tank Alpha",
            type: "tank",
            x: -190,
            y: 180,
            hp: 100,
            maxHp: 100,
            attack: 35,
            range: 230,
            speed: 1.25,
            alive: true,
            color: "#38d8c1"
        },

        tank2: {
            name: "Tank Bravo",
            type: "tank",
            x: 120,
            y: 120,
            hp: 100,
            maxHp: 100,
            attack: 35,
            range: 230,
            speed: 1.25,
            alive: true,
            color: "#38d8c1"
        },

        infantry1: {
            name: "Infantry Alpha",
            type: "infantry",
            x: -260,
            y: 80,
            hp: 80,
            maxHp: 80,
            attack: 20,
            range: 190,
            speed: 1.7,
            alive: true,
            color: "#5ee48e"
        },

        infantry2: {
            name: "Infantry Bravo",
            type: "infantry",
            x: 230,
            y: 210,
            hp: 80,
            maxHp: 80,
            attack: 20,
            range: 190,
            speed: 1.7,
            alive: true,
            color: "#5ee48e"
        },

        aircraft1: {
            name: "Fighter One",
            type: "aircraft",
            x: -20,
            y: 260,
            hp: 90,
            maxHp: 90,
            attack: 45,
            range: 330,
            speed: 2.8,
            alive: true,
            color: "#63d8ff"
        }
    },

    enemies: {
        enemyTank1: {
            name: "Enemy Tank",
            type: "tank",
            x: 240,
            y: -150,
            hp: 100,
            maxHp: 100,
            attack: 28,
            range: 220,
            speed: .7,
            alive: true,
            color: "#ff5365"
        },

        enemyTank2: {
            name: "Enemy Armor",
            type: "tank",
            x: -100,
            y: -230,
            hp: 100,
            maxHp: 100,
            attack: 30,
            range: 220,
            speed: .65,
            alive: true,
            color: "#ff5365"
        },

        enemyInfantry1: {
            name: "Enemy Infantry",
            type: "infantry",
            x: 170,
            y: -300,
            hp: 80,
            maxHp: 80,
            attack: 18,
            range: 170,
            speed: .8,
            alive: true,
            color: "#ff5365"
        },

        enemyInfantry2: {
            name: "Enemy Infantry",
            type: "infantry",
            x: -250,
            y: -320,
            hp: 80,
            maxHp: 80,
            attack: 18,
            range: 170,
            speed: .8,
            alive: true,
            color: "#ff5365"
        },

        enemyAir: {
            name: "Enemy Fighter",
            type: "aircraft",
            x: 20,
            y: -390,
            hp: 90,
            maxHp: 90,
            attack: 38,
            range: 300,
            speed: 1.1,
            alive: true,
            color: "#ff5365"
        }
    },

    explosions: [],

    projectiles: [],

    particles: [],

    trees: [],

    buildings: [],

    moveTarget: null
};


/* =========================
   CANVAS
========================= */

function resizeCanvas(){

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr,0,0,dpr,0,0);

    generateWorld();
}

window.addEventListener("resize", resizeCanvas);


/* =========================
   WORLD
========================= */

function generateWorld(){

    state.trees = [];
    state.buildings = [];

    for(let i = 0; i < 75; i++){

        state.trees.push({
            x: -650 + Math.random() * 1300,
            y: -700 + Math.random() * 1400,
            size: 18 + Math.random() * 25
        });
    }

    for(let i = 0; i < 12; i++){

        state.buildings.push({
            x: -550 + Math.random() * 1100,
            y: -600 + Math.random() * 1200,
            w: 55 + Math.random() * 50,
            h: 45 + Math.random() * 40
        });
    }
}


/* =========================
   COORDINATE SYSTEM
========================= */

function worldToScreen(x,y){

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    return {
        x: cx + (x - state.cameraX) * state.zoom,
        y: cy + (y - state.cameraY) * state.zoom
    };
}


function screenToWorld(x,y){

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    return {
        x: (x - cx) / state.zoom + state.cameraX,
        y: (y - cy) / state.zoom + state.cameraY
    };
}


/* =========================
   DRAW TERRAIN
========================= */

function drawTerrain(){

    ctx.fillStyle = "#123f2d";
    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    const horizon = window.innerHeight * .28;

    /* distant sky */

    const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        horizon
    );

    gradient.addColorStop(0,"#071316");
    gradient.addColorStop(1,"#153b35");

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        window.innerWidth,
        horizon
    );

    /* road */

    ctx.save();

    ctx.translate(
        window.innerWidth / 2 - state.cameraX * .35,
        horizon
    );

    ctx.fillStyle = "#4d4f48";

    ctx.beginPath();

    ctx.moveTo(-90,-10);
    ctx.lineTo(95,-10);

    ctx.lineTo(420,window.innerHeight);
    ctx.lineTo(-430,window.innerHeight);

    ctx.closePath();

    ctx.fill();

    /* road markings */

    ctx.strokeStyle = "rgba(210,210,190,.35)";
    ctx.lineWidth = 8;

    for(let i=0;i<10;i++){

        const y = i * 95 + 40;

        ctx.beginPath();

        ctx.moveTo(-15,y);
        ctx.lineTo(20,y);

        ctx.stroke();
    }

    ctx.restore();

    /* river */

    ctx.save();

    ctx.translate(
        window.innerWidth/2 - state.cameraX * .2,
        horizon
    );

    ctx.fillStyle = "#08788f";

    ctx.beginPath();

    ctx.moveTo(150,-10);
    ctx.lineTo(245,-10);
    ctx.lineTo(420,window.innerHeight);
    ctx.lineTo(270,window.innerHeight);

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    /* tactical grid */

    ctx.strokeStyle = "rgba(120,220,180,.11)";
    ctx.lineWidth = 1;

    const grid = 65 * state.zoom;

    for(let x=-grid;x<window.innerWidth+grid;x+=grid){

        ctx.beginPath();
        ctx.moveTo(x,180);
        ctx.lineTo(x,window.innerHeight);
        ctx.stroke();
    }

    for(let y=180;y<window.innerHeight;y+=grid){

        ctx.beginPath();
        ctx.moveTo(0,y);
        ctx.lineTo(window.innerWidth,y);
        ctx.stroke();
    }
}


/* =========================
   TREES
========================= */

function drawTree(tree){

    const p = worldToScreen(tree.x,tree.y);

    if(
        p.x < -80 ||
        p.x > window.innerWidth+80 ||
        p.y < 150 ||
        p.y > window.innerHeight
    ) return;

    const s = tree.size * state.zoom;

    /* shadow */

    ctx.fillStyle = "rgba(0,0,0,.25)";

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y+s*.35,
        s*.75,
        s*.25,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /* trunk */

    ctx.fillStyle = "#533c2b";

    ctx.fillRect(
        p.x-s*.1,
        p.y,
        s*.2,
        s*.6
    );

    /* tree */

    ctx.fillStyle = "#07512e";

    ctx.beginPath();

    ctx.moveTo(p.x,p.y-s);
    ctx.lineTo(p.x-s*.65,p.y+s*.35);
    ctx.lineTo(p.x+s*.65,p.y+s*.35);

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle = "#0a683b";

    ctx.beginPath();

    ctx.moveTo(p.x,p.y-s*.65);
    ctx.lineTo(p.x-s*.48,p.y+s*.05);
    ctx.lineTo(p.x+s*.48,p.y+s*.05);

    ctx.closePath();

    ctx.fill();
}


/* =========================
   BUILDINGS
========================= */

function drawBuilding(building){

    const p = worldToScreen(
        building.x,
        building.y
    );

    const w = building.w * state.zoom;
    const h = building.h * state.zoom;

    if(
        p.x < -150 ||
        p.x > window.innerWidth+150 ||
        p.y < 130 ||
        p.y > window.innerHeight+100
    ) return;

    ctx.fillStyle = "rgba(0,0,0,.25)";

    ctx.fillRect(
        p.x+8,
        p.y+8,
        w,
        h
    );

    ctx.fillStyle = "#414b4b";

    ctx.fillRect(
        p.x,
        p.y,
        w,
        h
    );

    ctx.fillStyle = "#283132";

    ctx.fillRect(
        p.x+5,
        p.y+5,
        w-10,
        h*.28
    );

    ctx.fillStyle = "#7b8987";

    ctx.fillRect(
        p.x+w*.42,
        p.y+h*.5,
        w*.16,
        h*.5
    );
}


/* =========================
   UNITS
========================= */

function drawUnit(id,unit,isEnemy=false){

    if(!unit.alive) return;

    const p = worldToScreen(unit.x,unit.y);

    if(
        p.x < -100 ||
        p.x > window.innerWidth+100 ||
        p.y < 100 ||
        p.y > window.innerHeight+100
    ) return;

    const selected =
        !isEnemy &&
        state.selectedUnit === id;

    const scale =
        unit.type === "aircraft" ? 1.15 :
        unit.type === "tank" ? 1.05 : .8;

    /* selection ring */

    if(selected){

        ctx.strokeStyle = "#20eaff";
        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y+12,
            35*scale,
            12*scale,
            0,
            0,
            Math.PI*2
        );

        ctx.stroke();
    }

    /* HP */

    const hpWidth = 55;

    ctx.fillStyle = "rgba(0,0,0,.7)";

    ctx.fillRect(
        p.x-hpWidth/2,
        p.y-38,
        hpWidth,
        5
    );

    ctx.fillStyle =
        isEnemy ? "#ff3d57" : "#31e0b7";

    ctx.fillRect(
        p.x-hpWidth/2,
        p.y-38,
        hpWidth * (unit.hp/unit.maxHp),
        5
    );

    /* tank */

    if(unit.type === "tank"){

        ctx.fillStyle =
            isEnemy ? "#74343d" : "#3d8d81";

        ctx.fillRect(
            p.x-18,
            p.y-13,
            36,
            25
        );

        ctx.fillStyle =
            isEnemy ? "#a84a56" : "#55b9aa";

        ctx.fillRect(
            p.x-11,
            p.y-19,
            22,
            15
        );

        ctx.strokeStyle =
            isEnemy ? "#ff6877" : "#8fffee";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(p.x,p.y-12);
        ctx.lineTo(p.x+25,p.y-19);

        ctx.stroke();
    }

    /* infantry */

    if(unit.type === "infantry"){

        ctx.fillStyle =
            isEnemy ? "#c64050" : "#4abf7a";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y-8,
            9,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.fillRect(
            p.x-7,
            p.y,
            14,
            18
        );
    }

    /* aircraft */

    if(unit.type === "aircraft"){

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(-.15);

        ctx.fillStyle =
            isEnemy ? "#ba3e50" : "#56cde5";

        ctx.beginPath();

        ctx.moveTo(28,0);
        ctx.lineTo(-17,-9);
        ctx.lineTo(-7,0);
        ctx.lineTo(-17,9);
        ctx.closePath();

        ctx.fill();

        ctx.fillStyle =
            isEnemy ? "#ff6c7b" : "#a9f6ff";

        ctx.fillRect(
            -5,
            -25,
            10,
            50
        );

        ctx.restore();
    }

    /* name */

    if(selected || isEnemy){

        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";

        ctx.fillStyle = "#e5f7f8";

        ctx.fillText(
            unit.name.toUpperCase(),
            p.x,
            p.y-47
        );
    }
}


/* =========================
   PROJECTILES
========================= */

function drawProjectiles(){

    state.projectiles =
        state.projectiles.filter(p => {

            p.x += p.vx;
            p.y += p.vy;

            const s = worldToScreen(
                p.x,
                p.y
            );

            ctx.fillStyle = p.color;

            ctx.beginPath();

            ctx.arc(
                s.x,
                s.y,
                3,
                0,
                Math.PI*2
            );

            ctx.fill();

            return p.life-- > 0;
        });
}


/* =========================
   EXPLOSIONS
========================= */

function createExplosion(x,y){

    state.explosions.push({
        x,
        y,
        life:40,
        max:40
    });

    for(let i=0;i<15;i++){

        state.particles.push({
            x,
            y,
            vx:(Math.random()-.5)*5,
            vy:(Math.random()-.5)*5,
            life:30+Math.random()*20
        });
    }
}


function drawExplosions(){

    state.explosions =
        state.explosions.filter(e => {

            const p = worldToScreen(
                e.x,
                e.y
            );

            const progress =
                1 - e.life/e.max;

            const radius =
                8 + progress*45;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                radius,
                0,
                Math.PI*2
            );

            ctx.fillStyle =
                `rgba(255,120,30,${1-progress})`;

            ctx.fill();

            e.life--;

            return e.life>0;
        });

    state.particles =
        state.particles.filter(p => {

            p.x += p.vx;
            p.y += p.vy;

            p.vy += .05;

            const s =
                worldToScreen(p.x,p.y);

            ctx.fillStyle =
                "rgba(255,190,80,.8)";

            ctx.fillRect(
                s.x,
                s.y,
                3,
                3
            );

            return p.life-- > 0;
        });
}


/* =========================
   UNIT MOVEMENT
========================= */

function moveSelectedTo(x,y){

    const unit =
        state.units[state.selectedUnit];

    if(!unit || !unit.alive){
        notify("Selected unit is unavailable.");
        return;
    }

    if(state.fuel < 2){
        notify("Not enough fuel.");
        return;
    }

    state.moveTarget = {
        x,
        y
    };

    state.fuel -= 2;

    notify(
        unit.name +
        " moving to selected position."
    );
}


function updateMovement(){

    const unit =
        state.units[state.selectedUnit];

    if(
        !unit ||
        !unit.alive ||
        !state.moveTarget
    ) return;

    const dx =
        state.moveTarget.x-unit.x;

    const dy =
        state.moveTarget.y-unit.y;

    const distance =
        Math.hypot(dx,dy);

    if(distance < 5){

        state.moveTarget = null;
        return;
    }

    const step =
        Math.min(
            unit.speed,
            distance
        );

    unit.x += dx/distance*step;
    unit.y += dy/distance*step;
}


/* =========================
   ATTACK
========================= */

function findNearestEnemy(unit){

    let best = null;
    let bestDistance = Infinity;

    Object.values(state.enemies)
        .forEach(enemy => {

            if(!enemy.alive) return;

            const d =
                Math.hypot(
                    enemy.x-unit.x,
                    enemy.y-unit.y
                );

            if(d < bestDistance){

                best = enemy;
                bestDistance = d;
            }
        });

    return {
        enemy:best,
        distance:bestDistance
    };
}


function attack(){

    const unit =
        state.units[state.selectedUnit];

    if(!unit || !unit.alive){
        notify("Select an available unit.");
        return;
    }

    const target =
        findNearestEnemy(unit);

    if(!target.enemy){

        victory();
        return;
    }

    if(target.distance > unit.range){

        state.moveTarget = {
            x:target.enemy.x,
            y:target.enemy.y
        };

        notify(
            "Target out of range — unit advancing."
        );

        return;
    }

    if(state.fuel < 12){

        notify("Not enough fuel.");
        return;
    }

    state.fuel -= 12;

    const damage =
        unit.attack +
        Math.floor(Math.random()*12);

    target.enemy.hp -= damage;

    state.projectiles.push({
        x:unit.x,
        y:unit.y,
        vx:(target.enemy.x-unit.x)/30,
        vy:(target.enemy.y-unit.y)/30,
        life:30,
        color:"#ffdb58"
    });

    createExplosion(
        target.enemy.x,
        target.enemy.y
    );

    state.allyScore =
        Math.min(100,state.allyScore+2);

    state.enemyScore =
        Math.max(0,state.enemyScore-2);

    notify(
        unit.name +
        " dealt " +
        damage +
        " damage."
    );

    if(target.enemy.hp <= 0){

        target.enemy.hp = 0;
        target.enemy.alive = false;

        state.allyScore =
            Math.min(100,state.allyScore+8);

        state.enemyScore =
            Math.max(0,state.enemyScore-8);

        notify(
            "💥 Enemy unit destroyed!"
        );
    }

    updateUI();

    checkBattle();
}


/* =========================
   DEFEND
========================= */

function defend(){

    const unit =
        state.units[state.selectedUnit];

    if(!unit || !unit.alive){
        notify("Select an available unit.");
        return;
    }

    unit.hp =
        Math.min(
            unit.maxHp,
            unit.hp+10
        );

    state.allyScore =
        Math.min(
            100,
            state.allyScore+5
        );

    notify(
        unit.name +
        " entered defensive formation."
    );

    updateUI();
}


/* =========================
   AIR STRIKE
========================= */

function airStrike(){

    if(state.fuel < 150){

        notify(
            "Air strike requires 150 fuel."
        );

        return;
    }

    const enemies =
        Object.values(state.enemies)
            .filter(e=>e.alive);

    if(!enemies.length){

        victory();
        return;
    }

    state.fuel -= 150;

    enemies.forEach(enemy=>{

        enemy.hp -= 35;

        createExplosion(
            enemy.x,
            enemy.y
        );

        if(enemy.hp <= 0){

            enemy.hp = 0;
            enemy.alive = false;
        }
    });

    state.allyScore =
        Math.min(100,state.allyScore+10);

    state.enemyScore =
        Math.max(0,state.enemyScore-10);

    notify("✈️ AIR STRIKE COMPLETE!");

    updateUI();

    checkBattle();
}


/* =========================
   SCOUT
========================= */

function scout(){

    if(state.fuel < 30){

        notify("Recon requires 30 fuel.");
        return;
    }

    state.fuel -= 30;

    notify(
        "🔭 Recon complete — enemy positions revealed."
    );

    updateUI();
}


/* =========================
   REINFORCE
========================= */

function reinforce(){

    if(state.money < 500){

        notify("Need $500 for reinforcements.");
        return;
    }

    state.money -= 500;
    state.metal += 150;
    state.allyScore =
        Math.min(100,state.allyScore+6);

    const dead =
        Object.values(state.units)
            .find(u=>!u.alive);

    if(dead){

        dead.alive = true;
        dead.hp = dead.maxHp;

        notify(
            dead.name +
            " returned to battlefield."
        );

    }else{

        notify(
            "Reinforcements deployed."
        );
    }

    updateUI();
}


/* =========================
   REPAIR
========================= */

function repair(){

    const unit =
        state.units[state.selectedUnit];

    if(!unit || !unit.alive){

        notify("Select an available unit.");
        return;
    }

    if(state.metal < 100){

        notify("Need 100 metal.");
        return;
    }

    if(unit.hp >= unit.maxHp){

        notify("Unit is already at full HP.");
        return;
    }

    state.metal -= 100;

    unit.hp =
        Math.min(
            unit.maxHp,
            unit.hp+30
        );

    notify(
        unit.name +
        " repaired."
    );

    updateUI();
}


/* =========================
   RESEARCH
========================= */

function openResearch(){

    document.getElementById("modalTitle")
        .textContent="🔬 TECHNOLOGY RESEARCH";

    document.getElementById("modalContent")
        .innerHTML=`

        <div class="researchItem">
            <h3>Advanced Armor</h3>
            <p>Increase all ground unit HP.</p>
            <button onclick="research('armor')">
                Research — $700
            </button>
        </div>

        <br>

        <div class="researchItem">
            <h3>Air Superiority</h3>
            <p>Increase fighter attack power.</p>
            <button onclick="research('air')">
                Research — $900
            </button>
        </div>

        <br>

        <div class="researchItem">
            <h3>Logistics</h3>
            <p>Increase fuel reserves.</p>
            <button onclick="research('logistics')">
                Research — $600
            </button>
        </div>

        `;

    document.getElementById("modal")
        .classList.remove("hidden");
}


window.research=function(type){

    const costs={
        armor:700,
        air:900,
        logistics:600
    };

    if(state.money < costs[type]){

        notify("Not enough money.");
        return;
    }

    state.money -= costs[type];

    if(type==="armor"){

        Object.values(state.units)
            .forEach(unit=>{
                unit.maxHp += 10;
                unit.hp += 10;
            });
    }

    if(type==="air"){

        state.units.aircraft1.attack += 15;
    }

    if(type==="logistics"){

        state.fuel += 400;
    }

    notify(
        "Research completed."
    );

    document.getElementById("modal")
        .classList.add("hidden");

    updateUI();
};


/* =========================
   MISSIONS
========================= */

function openMissions(){

    document.getElementById("modalTitle")
        .textContent="🎯 ACTIVE MISSIONS";

    document.getElementById("modalContent")
        .innerHTML=`

        <p>🎯 Destroy enemy forces</p>
        <br>

        <p>🏰 Capture enemy headquarters</p>
        <br>

        <p>🔭 Complete reconnaissance</p>
        <br>

        <p>🏆 Current level:
            ${state.level}
        </p>

        `;

    document.getElementById("modal")
        .classList.remove("hidden");
}


/* =========================
   ENEMY AI
========================= */

function enemyAI(){

    if(state.gameOver) return;

    const enemies =
        Object.values(state.enemies)
            .filter(e=>e.alive);

    const allies =
        Object.values(state.units)
            .filter(u=>u.alive);

    if(!enemies.length || !allies.length){
        checkBattle();
        return;
    }

    enemies.forEach(enemy=>{

        let nearest=null;
        let distance=Infinity;

        allies.forEach(unit=>{

            const d =
                Math.hypot(
                    unit.x-enemy.x,
                    unit.y-enemy.y
                );

            if(d<distance){

                distance=d;
                nearest=unit;
            }
        });

        if(!nearest) return;

        if(distance <= enemy.range){

            const damage =
                enemy.attack +
                Math.floor(Math.random()*7);

            nearest.hp -= damage;

            createExplosion(
                nearest.x,
                nearest.y
            );

            if(nearest.hp<=0){

                nearest.hp=0;
                nearest.alive=false;

                state.enemyScore =
                    Math.min(
                        100,
                        state.enemyScore+8
                    );

                notify(
                    "☠ Your " +
                    nearest.name +
                    " was destroyed!"
                );
            }

        }else{

            const dx =
                nearest.x-enemy.x;

            const dy =
                nearest.y-enemy.y;

            const d =
                Math.hypot(dx,dy);

            enemy.x +=
                dx/d*enemy.speed;

            enemy.y +=
                dy/d*enemy.speed;
        }
    });

    updateUI();

    checkBattle();
}


/* =========================
   BATTLE END
========================= */

function checkBattle(){

    const enemiesAlive =
        Object.values(state.enemies)
            .some(e=>e.alive);

    const alliesAlive =
        Object.values(state.units)
            .some(u=>u.alive);

    if(!enemiesAlive){

        victory();

    }else if(!alliesAlive){

        defeat();
    }
}


function victory(){

    if(state.gameOver) return;

    state.gameOver=true;

    state.victories++;
    state.level++;

    state.money += 1500;
    state.fuel += 350;
    state.metal += 500;

    state.allyScore=100;
    state.enemyScore=0;

    document.getElementById("missionText")
        .textContent =
        "Victory achieved — new mission unlocked.";

    notify(
        "🏆 VICTORY! Enemy headquarters captured."
    );

    updateUI();
}


function defeat(){

    if(state.gameOver) return;

    state.gameOver=true;

    document.getElementById("missionText")
        .textContent =
        "Mission failed — reorganize your forces.";

    notify(
        "⚠️ DEFEAT — Your forces were destroyed."
    );

    updateUI();
}


/* =========================
   SAVE
========================= */

function saveGame(){

    try{

        localStorage.setItem(
            "warfront_save_v3",
            JSON.stringify(state)
        );

        notify(
            "💾 Game saved successfully."
        );

    }catch(error){

        console.error(error);

        notify(
            "Save failed."
        );
    }
}


/* =========================
   LOAD
========================= */

function loadGame(){

    try{

        const saved =
            localStorage.getItem(
                "warfront_save_v3"
            );

        if(!saved) return;

        const data =
            JSON.parse(saved);

        state.money =
            Number(data.money) || state.money;

        state.fuel =
            Number(data.fuel) || state.fuel;

        state.metal =
            Number(data.metal) || state.metal;

        state.level =
            Number(data.level) || state.level;

        state.allyScore =
            Number(data.allyScore) || 50;

        state.enemyScore =
            Number(data.enemyScore) || 50;

        state.victories =
            Number(data.victories) || 0;

        if(data.units){

            Object.keys(state.units)
                .forEach(id=>{

                    if(data.units[id]){

                        Object.assign(
                            state.units[id],
                            data.units[id]
                        );
                    }
                });
        }

        if(data.enemies){

            Object.keys(state.enemies)
                .forEach(id=>{

                    if(data.enemies[id]){

                        Object.assign(
                            state.enemies[id],
                            data.enemies[id]
                        );
                    }
                });
        }

    }catch(error){

        console.error(
            "Save load error:",
            error
        );
    }
}


/* =========================
   UI
========================= */

function updateUI(){

    document.getElementById("money")
        .textContent=Math.floor(state.money);

    document.getElementById("fuel")
        .textContent=Math.floor(state.fuel);

    document.getElementById("metal")
        .textContent=Math.floor(state.metal);

    document.getElementById("level")
        .textContent=state.level;

    document.getElementById("allyScore")
        .textContent=state.allyScore;

    document.getElementById("enemyScore")
        .textContent=state.enemyScore;

    document.getElementById("allyBar")
        .style.width=state.allyScore+"%";

    const units =
        Object.values(state.units)
            .filter(u=>u.alive).length;

    const enemies =
        Object.values(state.enemies)
            .filter(e=>e.alive).length;

    document.getElementById("unitCount")
        .textContent=units;

    document.getElementById("enemyCount")
        .textContent=enemies;

    document.getElementById("victories")
        .textContent=state.victories;

    updateSelectedInfo();
}


function updateSelectedInfo(){

    const unit =
        state.units[state.selectedUnit];

    if(!unit) return;

    document.getElementById("selectedName")
        .textContent =
        unit.name.toUpperCase();

    document.getElementById("selectedHp")
        .style.width =
        Math.max(
            0,
            unit.hp/unit.maxHp*100
        )+"%";

    document.getElementById("selectedStats")
        .textContent =
        `HP ${Math.ceil(unit.hp)}/${unit.maxHp} · ATK ${unit.attack} · RANGE ${unit.range}`;
}


/* =========================
   NOTIFICATION
========================= */

let notificationTimer=null;

function notify(message){

    notification.textContent=message;
    notification.style.opacity="1";

    clearTimeout(notificationTimer);

    notificationTimer =
        setTimeout(()=>{
            notification.style.opacity="0";
        },2200);
}


/* =========================
   UNIT SELECT
========================= */

document
    .querySelectorAll(".unit-card")
    .forEach(card=>{

        card.addEventListener("click",()=>{

            const id =
                card.dataset.unit;

            const unit =
                state.units[id];

            if(!unit || !unit.alive){

                notify(
                    "This unit is unavailable."
                );

                return;
            }

            document
                .querySelectorAll(".unit-card")
                .forEach(c=>{
                    c.classList.remove("selected");
                });

            card.classList.add("selected");

            state.selectedUnit=id;

            state.moveTarget=null;

            notify(
                unit.name +
                " selected."
            );

            updateSelectedInfo();
        });
    });


/* =========================
   BATTLEFIELD TOUCH
========================= */

canvas.addEventListener(
    "pointerdown",
    event=>{

        const rect =
            canvas.getBoundingClientRect();

        const x =
            event.clientX-rect.left;

        const y =
            event.clientY-rect.top;

        const world =
            screenToWorld(x,y);

        moveSelectedTo(
            world.x,
            world.y
        );
    }
);


/* =========================
   BUTTONS
========================= */

document.getElementById("attackBtn")
    .addEventListener("click",attack);

document.getElementById("defendBtn")
    .addEventListener("click",defend);

document.getElementById("airStrikeBtn")
    .addEventListener("click",airStrike);

document.getElementById("scoutBtn")
    .addEventListener("click",scout);

document.getElementById("reinforceBtn")
    .addEventListener("click",reinforce);

document.getElementById("repairBtn")
    .addEventListener("click",repair);

document.getElementById("researchBtn")
    .addEventListener("click",openResearch);

document.getElementById("missionBtn")
    .addEventListener("click",openMissions);

document.getElementById("saveBtn")
    .addEventListener("click",saveGame);


/* =========================
   CAMERA
========================= */

document.getElementById("zoomIn")
    .addEventListener("click",()=>{

        state.zoom =
            Math.min(
                1.65,
                state.zoom+.12
            );
    });


document.getElementById("zoomOut")
    .addEventListener("click",()=>{

        state.zoom =
            Math.max(
                .65,
                state.zoom-.12
            );
    });


document.getElementById("resetCamera")
    .addEventListener("click",()=>{

        state.zoom=1;
        state.cameraX=0;
        state.cameraY=0;

        notify("Camera reset.");
    });


/* =========================
   MODAL
========================= */

document.getElementById("closeModal")
    .addEventListener("click",()=>{

        document
            .getElementById("modal")
            .classList.add("hidden");
    });


document.getElementById("modal")
    .addEventListener("click",event=>{

        if(
            event.target ===
            document.getElementById("modal")
        ){

            document
                .getElementById("modal")
                .classList.add("hidden");
        }
    });


/* =========================
   PASSIVE ECONOMY
========================= */

setInterval(()=>{

    if(state.gameOver) return;

    state.money += 25;
    state.metal += 10;

    updateUI();

},10000);


/* =========================
   ENEMY TIMER
========================= */

setInterval(enemyAI,5000);


/* =========================
   GAME LOOP
========================= */

function gameLoop(){

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );

    drawTerrain();

    state.buildings
        .forEach(drawBuilding);

    state.trees
        .forEach(drawTree);

    Object.entries(state.enemies)
        .forEach(([id,enemy])=>{
            drawUnit(
                id,
                enemy,
                true
            );
        });

    Object.entries(state.units)
        .forEach(([id,unit])=>{
            drawUnit(
                id,
                unit,
                false
            );
        });

    updateMovement();

    drawProjectiles();

    drawExplosions();

    requestAnimationFrame(gameLoop);
}


/* =========================
   LOADING
========================= */

function startLoading(){

    let progress=0;

    const messages=[
        "Initializing battlefield...",
        "Loading terrain...",
        "Deploying armored units...",
        "Preparing tactical systems...",
        "Connecting AI commanders...",
        "Battlefield ready."
    ];

    const timer =
        setInterval(()=>{

            progress += 5;

            loadingProgress.style.width =
                progress+"%";

            const index =
                Math.min(
                    messages.length-1,
                    Math.floor(progress/20)
                );

            loadingText.textContent =
                messages[index];

            if(progress>=100){

                clearInterval(timer);

                setTimeout(()=>{

                    loadingScreen.style.opacity="0";

                    setTimeout(()=>{

                        loadingScreen.style.display="none";

                    },800);

                },300);
            }

        },100);
}


/* =========================
   START
========================= */

loadGame();

resizeCanvas();

updateUI();

startLoading();

gameLoop();

console.log(
    "WARFRONT Tactical Command initialized."
);