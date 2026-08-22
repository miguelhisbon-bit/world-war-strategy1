import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — V4 (UPDATED)
   HTML/CSS compatible build
   ========================================================== */

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
let battleLog = [];
let diplomaticMessages = [];

const units = [];

const nation = {
    USA: ["🇺🇸", "United States"],
    GERMANY: ["🇩🇪", "Germany"],
    UK: ["🇬🇧", "United Kingdom"],
    JAPAN: ["🇯🇵", "Japan"],
    USSR: ["☭", "Soviet Union"],
    FRANCE: ["🇫🇷", "France"],
    ITALY: ["🇮🇹", "Italy"],
    CHINA: ["🇨🇳", "China"]
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
    FRANCE: 35,
    ITALY: -20,
    CHINA: 10
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
   ========================================================== */

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
    
    // Auto-save after load
    autosave();

    setTimeout(() => {
        $("loadingScreen")?.classList.add("hidden");
    }, 650);

    requestAnimationFrame(loop);
}

function loading(progress, text) {
    const bar = $("loadingProgress");
    const status = $("loadingStatus");
    if (bar) bar.style.width = `${progress}%`;
    if (status) status.textContent = text;
}

/* =========================================================
   THREE.JS
   ========================================================== */

function setup3D() {
    const canvas = $("gameCanvas");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071015);
    scene.fog = new THREE.Fog(0x071015, 80, 350); // Reduced for performance

    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(0, 82, 86);

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); // Capped for performance
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight(0xc8d2d5, 0x162017, 1.45);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffdfad, 2);
    sun.position.set(-100, 150, 80);
    sun.castShadow = true;
    scene.add(sun);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 18;
    controls.maxDistance = 260;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.target.set(0, 0, 0);

    clock = new THREE.Clock();
    unitGroup = new THREE.Group();
    fxGroup = new THREE.Group();
    scene.add(unitGroup);
    scene.add(fxGroup);

    canvas.addEventListener("pointerdown", handleWorldClick);
    window.addEventListener("resize", resizeRenderer);
}

function resizeRenderer() {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

/* =========================================================
   TERRAIN (UPDATED - Fixed Line Creation)
   ========================================================== */

function createTerrain() {
    const geometry = new THREE.PlaneGeometry(360, 360, 100, 100);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const height = Math.sin(x * 0.05) * 2 + Math.cos(y * 0.06) * 1.7 + Math.sin((x + y) * 0.025) * 3;
        positions.setZ(i, height);
    }
    geometry.computeVertexNormals();

    ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color: mapColors[mapLayer],
        roughness: 0.96,
        metalness: 0
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(360, 72, 0x68715f, 0x30382f);
    grid.material.transparent = true;
    grid.material.opacity = 0.08;
    scene.add(grid);

    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(520, 520),
        new THREE.MeshStandardMaterial({ color: 0x164659, transparent: true, opacity: 0.52, roughness: 0.2 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -4;
    scene.add(water);

    createMountains();
    createForest(); // Reduced count inside
    createFrontLines();
}

function createMountains() {
    for (let i = 0; i < 65; i++) {
        const mountain = new THREE.Mesh(
            new THREE.ConeGeometry(3 + Math.random() * 6, 9 + Math.random() * 18, 7),
            new THREE.MeshStandardMaterial({ color: 0x394039, roughness: 1 })
        );
        mountain.position.set((Math.random() - 0.5) * 320, 5 + Math.random() * 7, (Math.random() - 0.5) * 320);
        mountain.castShadow = true;
        scene.add(mountain);
    }
}

function createForest() {
    const count = 100; // Reduced from 150 for performance
    for (let i = 0; i < count; i++) {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.18, 1.3, 5),
            new THREE.MeshStandardMaterial({ color: 0x493a2a })
        );
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(0.7, 2.5, 7),
            new THREE.MeshStandardMaterial({ color: 0x263d28 })
        );
        trunk.position.y = 0.65;
        crown.position.y = 2;
        tree.add(trunk, crown);
        tree.position.set((Math.random() - 0.5) * 330, 0.3, (Math.random() - 0.5) * 330);
        tree.scale.setScalar(0.7 + Math.random() * 0.8);
        scene.add(tree);
    }
}

function createFrontLines() {
    // Fixed: Removed duplicate last point
    createLine(0xb0a66f, [
        [-150, -90], [-70, -125], [10, -100], [60, -60], [-10, -20]
    ]);
    createLine(0xb0a66f, [
        [-100, 35], [-40, 10], [20, 55], [-30, 120], [-120, 95]
    ]);
    createLine(0xb33f3f, [
        [15, -40], [45, -32], [75, -38], [105, -28], [135, -35]
    ]);
}

function createLine(color, points) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p[0], 0.4, p[1]))
    );
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45
    }));
    scene.add(line);
}

/* =========================================================
   UNIT SYSTEM (UPDATED - Added reinforcement)
   ========================================================== */

function createUnit(name, type, x, z, friendly = true) {
    const group = new THREE.Group();
    const color = friendly ? (type === "TANK" ? 0x566b4f : 0x60715a) : (type === "TANK" ? 0x633b36 : 0x68453f);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });

    if (type === "TANK") {
        const body = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 3.2), material);
        const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.8, 12), material);
        const barrel = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.35, 3.8),
            new THREE.MeshStandardMaterial({ color: 0x202521, metalness: 0.5 })
        );
        body.position.y = 1.1;
        turret.position.y = 2.2;
        barrel.position.set(0, 2.3, 2);
        group.add(body, turret, barrel);
    } else if (type === "AIR") {
        const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 4, 5, 10), material);
        const wings = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 1.3), material);
        fuselage.rotation.x = Math.PI / 2;
        group.add(fuselage, wings);
        group.position.y = 8;
    } else {
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.4, 5, 8), material);
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.48, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0x8c6c50 })
        );
        body.position.y = 1.4;
        head.position.y = 2.7;
        group.add(body, head);
    }

    group.position.set(x, type === "AIR" ? 8 : 0, z);
    group.castShadow = true;
    unitGroup.add(group);

    const unit = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        name,
        type,
        friendly,
        object: group,
        hp: 100,
        organization: type === "AIR" ? 88 : 100,
        morale: type === "TANK" ? 82 : 85,
        strength: type === "TANK" ? 85 : type === "AIR" ? 75 : 70,
        readiness: 96,
        supply: 92,
        attack: type === "TANK" ? 24 : type === "AIR" ? 30 : 16,
        defense: type === "TANK" ? 20 : 17,
        speed: type === "TANK" ? 18 : type === "AIR" ? 35 : 12,
        state: "READY",
        destination: null,
        kills: 0,
        experience: 0,
        entrenchment: 0,
        selected: false,
        maxHp: 100,
        maxOrganization: type === "AIR" ? 88 : 100,
        maxStrength: type === "TANK" ? 85 : type === "AIR" ? 75 : 70
    };

    group.userData.unit = unit;
    units.push(unit);
    return unit;
}

function deployInitialForces() {
    units.length = 0;
    createUnit("1st Armored Division", "TANK", -30, 12);
    createUnit("2nd Infantry Division", "INFANTRY", -18, 20);
    createUnit("3rd Infantry Division", "INFANTRY", -5, 28);
    createUnit("Air Wing Alpha", "AIR", 15, 12);
    createUnit("Enemy Armor Group", "TANK", 45, -20, false);
    createUnit("Enemy Infantry Corps", "INFANTRY", 35, -5, false);
    createUnit("Enemy Defense Force", "INFANTRY", 55, 12, false);
    createUnit("Enemy Air Wing", "AIR", 65, -18, false);
}

/* =========================================================
   SELECTION / COMMAND
   ========================================================== */

function selectUnit(unit) {
    if (!unit || unit.state === "DESTROYED") return;
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
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(3, 3.35, 32),
        new THREE.MeshBasicMaterial({
            color: unit.friendly ? 0xd5ad55 : 0xe45d5d,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = unit.type === "AIR" ? -7.7 : 0.05;
    ring.userData.selectionRing = true;
    unit.object.add(ring);
    unit.selectionRing = ring;
}

function clearSelectionVisual(unit) {
    if (!unit?.selectionRing) return;
    unit.object.remove(unit.selectionRing);
    unit.selectionRing.geometry.dispose();
    unit.selectionRing.material.dispose();
    unit.selectionRing = null;
}

function updateUnitPanel() {
    if (!selectedUnit) return;
    const u = selectedUnit;
    const type = $("selectedUnitType");
    const name = $("selectedUnitName");
    const stats = $("unitStats");

    if (type) type.textContent = `${u.type} • ${u.friendly ? "FRIENDLY" : "HOSTILE"}`;
    if (name) name.textContent = u.name;

    if (stats) {
        stats.innerHTML =
            progressRow("Strength", u.strength, u.maxStrength) +
            progressRow("Organization", u.organization, u.maxOrganization) +
            progressRow("Morale", u.morale) +
            progressRow("Readiness", u.readiness) +
            progressRow("Supply", u.supply) +
            statRow("State", u.state) +
            statRow("Experience", Math.round(u.experience)) +
            statRow("Kills", u.kills);
    }
}

function progressRow(label, value, max = 100) {
    const safe = Math.max(0, Math.min(max, value));
    const percent = (safe / max) * 100;
    return `
        <div class="unit-stat">
            <span>${label}</span>
            <div class="progress"><i style="width:${percent}%"></i></div>
            <b>${Math.round(percent)}%</b>
        </div>
    `;
}

function statRow(label, value) {
    return `<div class="stat-row"><span>${label}</span><b>${value}</b></div>`;
}

/* =========================================================
   WORLD INPUT
   ========================================================== */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function handleWorldClick(event) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const unitHits = raycaster.intersectObjects(unitGroup.children, true);
    if (unitHits.length) {
        let object = unitHits[0].object;
        while (object.parent && !object.userData.unit) {
            object = object.parent;
        }
        const target = object.userData.unit;
        if (target) {
            if (attackMode && selectedUnit && target !== selectedUnit && !target.friendly) {
                executeAttack(selectedUnit, target);
                attackMode = false;
                return;
            }
            selectUnit(target);
            return;
        }
    }

    if (selectedUnit && moveMode) {
        const groundHits = raycaster.intersectObject(ground);
        if (groundHits.length) {
            const point = groundHits[0].point;
            setUnitDestination(selectedUnit, point);
            moveMode = false;
            toast(`${selectedUnit.name} moving`);
        }
    }
}

function setUnitDestination(unit, point) {
    if (!unit || unit.state === "DESTROYED") return;
    unit.destination = new THREE.Vector3(point.x, unit.type === "AIR" ? 8 : 0, point.z);
    unit.state = "MOVING";
    unit.entrenchment = 0;
}

/* =========================================================
   COMMANDS
   ========================================================== */

function commandMove() {
    if (!selectedUnit) { toast("Select a friendly unit first"); return; }
    if (!selectedUnit.friendly) { toast("Enemy units cannot be commanded"); return; }
    moveMode = true;
    attackMode = false;
    toast("Tap terrain to set destination");
}

function commandAttack() {
    if (!selectedUnit) { toast("Select a friendly unit first"); return; }
    if (!selectedUnit.friendly) { toast("Enemy units cannot be commanded"); return; }
    attackMode = true;
    moveMode = false;
    toast("Tap an enemy unit to attack");
}

function commandDefend() {
    if (!selectedUnit) return;
    selectedUnit.state = "DEFENDING";
    selectedUnit.entrenchment = Math.min(100, selectedUnit.entrenchment + 25);
    selectedUnit.organization = Math.min(100, selectedUnit.organization + 5);
    selectedUnit.morale = Math.min(100, selectedUnit.morale + 4);
    selectedUnit.destination = null;
    toast(`${selectedUnit.name} taking defensive position`);
    updateUnitPanel();
}

function commandHold() {
    if (!selectedUnit) return;
    selectedUnit.state = "HOLDING";
    selectedUnit.destination = null;
    toast(`${selectedUnit.name} ordered to hold`);
    updateUnitPanel();
}

function commandRetreat() {
    if (!selectedUnit) return;
    const u = selectedUnit;
    const retreatPoint = u.object.position.clone();
    retreatPoint.x -= u.friendly ? 28 : -28;
    setUnitDestination(u, retreatPoint);
    u.state = "RETREATING";
    u.morale = Math.min(100, u.morale + 3);
    toast(`${u.name} retreating`);
    updateUnitPanel();
}

function commandAirstrike() {
    if (!selectedUnit) return;
    if (selectedUnit.type !== "AIR") {
        toast("Select an air unit");
        return;
    }
    const targets = units.filter(u => !u.friendly && u.state !== "DESTROYED");
    if (!targets.length) {
        toast("No enemy targets");
        return;
    }
    let target = targets.sort((a, b) =>
        selectedUnit.object.position.distanceTo(a.object.position) -
        selectedUnit.object.position.distanceTo(b.object.position)
    )[0];
    if (selectedUnit.object.position.distanceTo(target.object.position) > 100) {
        toast("Target outside airstrike range");
        return;
    }
    executeAirstrike(selectedUnit, target);
}

/* =========================================================
   COMBAT (UPDATED - Fixed error handling)
   ========================================================== */

function getTerrainModifier(unit) {
    let modifier = 1;
    if (unit.state === "DEFENDING") modifier += 0.18 + unit.entrenchment / 500;
    if (weather === "RAIN") modifier *= 0.9;
    if (weather === "SNOW") modifier *= 0.78;
    if (unit.supply < 30) modifier *= 0.72;
    if (unit.organization < 30) modifier *= 0.75;
    return modifier;
}

function getTechAttackBonus(unit) {
    let bonus = 1;
    if (unit.type === "INFANTRY" && tech.INFANTRY.completed) bonus *= 1.08;
    if (unit.type === "TANK" && tech.ARMOR.completed) bonus *= 1.10;
    if (unit.type === "AIR" && tech.AIR.completed) bonus *= 1.12;
    if (unit.type === "ARTILLERY" && tech.ARTILLERY.completed) bonus *= 1.08;
    return bonus;
}

function executeAttack(attacker, defender) {
    if (!attacker || !defender || defender.state === "DESTROYED") return;
    if (!attacker.friendly) return;

    const distance = attacker.object.position.distanceTo(defender.object.position);
    if (distance > 35 && attacker.type !== "AIR") {
        toast("Target is too far away");
        return;
    }
    if (attacker.supply < 15) {
        toast("Insufficient supply");
        return;
    }

    attacker.supply = Math.max(0, attacker.supply - 6);
    const attackPower = (attacker.attack * (attacker.strength / 100) * (attacker.organization / 100) *
        (attacker.morale / 100) * getTerrainModifier(attacker) * getTechAttackBonus(attacker)) + Math.random() * 8;
    const defensePower = (defender.defense * (defender.strength / 100) * (defender.organization / 100) *
        (defender.morale / 100) * getTerrainModifier(defender)) + Math.random() * 7;

    let damage = Math.max(3, attackPower - defensePower * 0.55);
    if (weather === "SNOW") damage *= 0.82;

    defender.hp = Math.max(0, defender.hp - damage);
    defender.organization = Math.max(0, defender.organization - damage * 0.48);
    defender.morale = Math.max(0, defender.morale - damage * 0.22);
    attacker.organization = Math.max(0, attacker.organization - Math.max(1, damage * 0.12));
    attacker.experience = Math.min(100, attacker.experience + damage * 0.08);

    addBattleLog(`${attacker.name} attacked ${defender.name} for ${Math.round(damage)} damage`);

    if (defender.hp <= 0 || defender.organization <= 0) {
        destroyUnit(defender, attacker);
    } else {
        defender.state = "UNDER_ATTACK";
        attacker.state = "ATTACKING";
        createExplosion(defender.object.position);
        toast(`${attacker.name} dealt ${Math.round(damage)} damage`);
    }
    updateUnitPanel();
    updateAllUI();
}

function executeAirstrike(aircraft, target) {
    if (aircraft.supply < 20) {
        toast("Air unit needs supply");
        return;
    }
    aircraft.supply -= 20;
    let damage = 18 + Math.random() * 18;
    damage *= aircraft.readiness / 100;
    damage *= getTechAttackBonus(aircraft);
    if (weather === "RAIN") damage *= 0.72;
    if (weather === "SNOW") damage *= 0.55;

    target.hp = Math.max(0, target.hp - damage);
    target.organization = Math.max(0, target.organization - damage * 0.7);
    target.morale = Math.max(0, target.morale - damage * 0.35);
    aircraft.experience = Math.min(100, aircraft.experience + 1);
    createExplosion(target.object.position);
    addBattleLog(`Airstrike hit ${target.name} for ${Math.round(damage)} damage`);
    toast(`Airstrike hit ${target.name}`);

    if (target.hp <= 0 || target.organization <= 0) {
        destroyUnit(target, aircraft);
    }
    updateUnitPanel();
    updateAllUI();
}

function destroyUnit(unit, killer = null) {
    unit.state = "DESTROYED";
    unit.hp = 0;
    unit.organization = 0;
    unit.object.visible = false;
    if (killer) {
        killer.kills++;
        killer.experience = Math.min(100, killer.experience + 8);
    }
    createExplosion(unit.object.position);
    addBattleLog(`${unit.name} destroyed`);
    toast(`${unit.name} destroyed`);
    if (selectedUnit === unit) {
        selectedUnit = null;
        $("unitPanel")?.classList.remove("open");
    }
}

/* =========================================================
   EFFECTS (UPDATED - Fixed dispose)
   ========================================================== */

function createExplosion(position) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff6a1f, transparent: true, opacity: 0.95 })
    );
    mesh.position.copy(position);
    mesh.position.y += 1;
    mesh.userData.life = 0.55;
    fxGroup.add(mesh);
}

function updateEffects(dt) {
    for (let i = fxGroup.children.length - 1; i >= 0; i--) {
        const fx = fxGroup.children[i];
        fx.userData.life -= dt;
        fx.scale.multiplyScalar(1 + dt * 5);
        fx.material.opacity = Math.max(0, fx.userData.life / 0.55);
        if (fx.userData.life <= 0) {
            fxGroup.remove(fx);
            fx.geometry?.dispose();
            fx.material?.dispose();
        }
    }
}

/* =========================================================
   MOVEMENT / AI (UPDATED - Fixed enemy AI)
   ========================================================== */

function updateUnitMovement(dt) {
    for (const unit of units) {
        if (unit.state === "DESTROYED" || !unit.destination) continue;
        const position = unit.object.position;
        const target = unit.destination;
        const distance = position.distanceTo(target);
        if (distance < 1.5) {
            unit.destination = null;
            unit.state = unit.state === "RETREATING" ? "HOLDING" : "HOLDING";
            unit.entrenchment = Math.min(100, unit.entrenchment + 5);
            continue;
        }
        let movement = unit.speed * dt * 0.045 * speed;
        if (weather === "RAIN") movement *= 0.82;
        if (weather === "SNOW") movement *= 0.62;
        if (unit.supply < 25) movement *= 0.65;
        const direction = new THREE.Vector3().subVectors(target, position).normalize();
        position.addScaledVector(direction, movement);
        if (unit.type === "AIR") position.y = 8;
        else position.y = 0;
        unit.entrenchment = Math.max(0, unit.entrenchment - dt * 2);
    }
}

function updateSupply(dt) {
    for (const unit of units) {
        if (unit.state === "DESTROYED") continue;
        let consumption = unit.type === "AIR" ? 0.9 : unit.type === "TANK" ? 0.65 : 0.35;
        if (tech.LOGISTICS.completed) consumption *= 0.9;
        if (unit.state === "MOVING" || unit.state === "ATTACKING") consumption *= 1.7;
        unit.supply = Math.max(0, unit.supply - consumption * dt * speed);
        if (unit.supply < 20) {
            unit.readiness = Math.max(20, unit.readiness - dt * 1.5);
            unit.morale = Math.max(20, unit.morale - dt * 0.7);
        } else {
            unit.readiness = Math.min(100, unit.readiness + dt * 0.12);
        }
    }
}

function updateRecovery(dt) {
    for (const unit of units) {
        if (unit.state === "DESTROYED") continue;
        if (unit.state === "HOLDING" || unit.state === "DEFENDING") {
            unit.organization = Math.min(100, unit.organization + dt * (unit.supply > 40 ? 1.2 : 0.35));
            unit.morale = Math.min(100, unit.morale + dt * 0.35);
            unit.entrenchment = Math.min(100, unit.entrenchment + dt * 0.8);
        }
    }
}

function enemyAI(dt) {
    if (paused) return;
    const enemies = units.filter(u => !u.friendly && u.state !== "DESTROYED");
    const friends = units.filter(u => u.friendly && u.state !== "DESTROYED");
    if (!friends.length) return;

    for (const enemy of enemies) {
        if (enemy.type === "AIR") {
            enemyAirAI(enemy);
            continue;
        }
        let closest = null;
        let distance = Infinity;
        for (const friend of friends) {
            const d = enemy.object.position.distanceTo(friend.object.position);
            if (d < distance) { distance = d; closest = friend; }
        }
        if (!closest) continue;
        if (distance <= 28) {
            enemy.state = "ATTACKING";
            enemyAICombat(enemy, closest);
        } else {
            enemy.destination = closest.object.position.clone();
            enemy.state = "MOVING";
        }
    }
}

function enemy