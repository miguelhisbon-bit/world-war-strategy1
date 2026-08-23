// =========================================================
// WORLD WAR V2 — Complete Game Engine
// =========================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ================= IMPORTS =================
import { WORLD_DATA, getCountryById, getStateById, getCityById, getCitiesByState } from './data/worldData.js';
import { BUILDINGS, getBuildingCost, getBuildingProduction } from './data/buildings.js';
import { TECH_TREE, getAllTechs, isTechAvailable } from './data/techTree.js';
import { UNITS_DATA, getUnitStats, getUnitCost, getUpgradeCost } from './data/units.js';
import { 
    calculateBattleDamage, executeBattle, generateBattleReport, findNearestEnemy,
    TERRAIN_EFFECTS, WEATHER_EFFECTS 
} from './systems/battle.js';
import { getDiplomacyState, formAlliance, breakAlliance, isAllied, declareWar, proposePeace } from './systems/diplomacy.js';
import { processEconomy, tradeResource, takeLoan, economyState } from './systems/economy.js';
import { 
    createSupplyLine, updateSupplyLines, getSupplyStatus, 
    getUnitsInSupply, supplyLines 
} from './systems/supply.js';
import { 
    getCity, updateCity, trainUnitInCity, buildInCity,
    getCityProduction, getCityGarrison, cityManager 
} from './systems/cityManager.js';
import { 
    trainUnit, getTrainingQueue, processTraining, 
    getUnitTrainingCost, trainingQueue 
} from './systems/training.js';
import { 
    calculateWarScore, getWarStatus, updateWarScore, 
    wars as warList 
} from './systems/warScore.js';
import { 
    checkVictoryConditions, getVictoryStatus, 
    victoryConditions 
} from './systems/victory.js';
import { processAI, getAIDifficulty, setAIDifficulty } from './systems/ai.js';
import { initMinimap, updateMinimap, handleMinimapClick } from './ui/minimap.js';
import { initShortcuts, handleKeyPress, SHORTCUTS } from './ui/shortcuts.js';
import { showTooltip, hideTooltip, initTooltips } from './ui/tooltips.js';
import { 
    addNotification, clearNotifications, 
    NOTIFICATION_TYPES, notifications 
} from './ui/notifications.js';
import { saveGame, loadGame, deleteSave, hasSave, getSaveInfo, SAVE_KEY } from './utils/saveLoad.js';
import { 
    random, randomInt, clamp, lerp, distance, formatNumber, 
    capitalize, truncate, log, debounce, throttle 
} from './utils/helpers.js';

// =========================================================
// GAME STATE
// =========================================================

const $ = id => document.getElementById(id);

let scene, camera, renderer, labelRenderer, controls, clock;
let ground, unitGroup, fxGroup, borderGroup, labelGroup, stateGroup, highlightGroup, stateBorderGroup;

let selectedUnit = null;
let moveMode = false;
let attackMode = false;
let selectedCountry = null;
let highlightedCountry = null;
let isZooming = false;

let paused = false;
let speed = 1;

let day = 1;
let month = 1;
let year = 1940;

let currentCountry = "BANGLADESH";
let weather = "CLEAR";
let mapLayer = "MILITARY";

// ================= RESOURCES =================
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

let lastDateTick = 0;
let autosaveTimer = 0;
let battleLog = [];
let diplomaticMessages = [];

const units = [];
const countryMeshMap = {};
const stateMeshMap = {};
let stateBorderPoints = {};

// ================= DIPLOMACY =================
const diplomacy = {};
const alliances = {};
const wars = [];

// ================= NATIONS DATA (from WORLD_DATA) =================
const nation = {};
const countryColors = {};

// Build nation data from WORLD_DATA
Object.keys(WORLD_DATA.continents).forEach(continentKey => {
    const continent = WORLD_DATA.continents[continentKey];
    continent.countries.forEach(country => {
        nation[country.id] = {
            flag: country.flag,
            name: country.name,
            color: country.color,
            lightColor: country.lightColor || country.color,
            capital: country.capital,
            region: continent.name,
            states: country.states.map(s => s.name),
            desc: country.description || `${country.name} is a nation in ${continent.name}.`,
            continent: continentKey,
            cities: country.states
        };
        countryColors[country.id] = country.color;
    });
});

const mapColors = {
    MILITARY: 0x596b58, POLITICAL: 0x58667d, TERRAIN: 0x52634d,
    SUPPLY: 0x4e6e5a, RESOURCES: 0x75633c, INTEL: 0x5d4c6b
};

const factories = { civilian: 18, military: 14, naval: 5 };

const production = {
    TANK: { name: "Tank", factories: 4, progress: 67, efficiency: 74, cost: 800, steel: 80, output: 0 },
    INFANTRY: { name: "Infantry", factories: 5, progress: 42, efficiency: 82, cost: 350, steel: 35, output: 0 },
    ARTILLERY: { name: "Artillery", factories: 3, progress: 55, efficiency: 68, cost: 600, steel: 65, output: 0 },
    AIR: { name: "Aircraft", factories: 2, progress: 31, efficiency: 59, cost: 1100, steel: 90, output: 0 }
};

const tech = {
    INFANTRY: { name: "Infantry Weapons", progress: 54, active: false, bonus: "+8% attack", completed: false },
    ARMOR: { name: "Advanced Armor", progress: 32, active: false, bonus: "+10% tank attack", completed: false },
    ARTILLERY: { name: "Modern Artillery", progress: 48, active: false, bonus: "+8% damage", completed: false },
    AIR: { name: "Fighter Interceptors", progress: 28, active: false, bonus: "+12% air defense", completed: false },
    INDUSTRY: { name: "Industrial Methods", progress: 71, active: false, bonus: "+1 factory", completed: false },
    LOGISTICS: { name: "Logistics", progress: 42, active: false, bonus: "-10% supply", completed: false },
    ELECTRONICS: { name: "Electronics", progress: 18, active: false, bonus: "+10 intel", completed: false }
};

const buildingQueue = [];

/* =========================================================
   INITIALIZATION
   ========================================================== */

async function init() {
    loading(10, "Initializing global command system...");
    setup3D();
    loading(20, "Generating world terrain...");
    createTerrain();
    loading(30, "Drawing country borders...");
    createCountryBorders();
    loading(40, "Adding states/provinces...");
    createStates();
    loading(45, "Creating state borders...");
    createStateBorderData();
    loading(50, "Deploying military forces...");
    deployInitialForces();
    loading(55, "Initializing cities...");
    initCities();
    loading(60, "Setting up supply lines...");
    initSupplyLines();
    loading(70, "Connecting economy...");
    loadCampaign();
    loading(80, "Initializing AI...");
    setAIDifficulty('MEDIUM');
    loading(85, "Initializing UI...");
    setupUI();
    loading(90, "Initializing minimap...");
    initMinimap();
    loading(95, "Preparing battlefield...");
    updateAllUI();
    loading(100, "Battlefield ready.");
    autosave();

    setTimeout(() => {
        const loadingScreen = $("loadingScreen");
        if (loadingScreen) loadingScreen.classList.add("hidden");
    }, 650);

    requestAnimationFrame(loop);
}

function loading(progress, text) {
    const bar = $("loadingProgress");
    const status = $("loadingStatus");
    if (bar) bar.style.width = `${progress}%`;
    if (status) status.textContent = text;
}

function initCities() {
    // Initialize city data for all countries
    Object.keys(WORLD_DATA.continents).forEach(continentKey => {
        const continent = WORLD_DATA.continents[continentKey];
        continent.countries.forEach(country => {
            country.states.forEach(state => {
                const cityData = getCity(state.id);
                if (!cityData) {
                    // Initialize city
                    cityManager[state.id] = {
                        name: state.name,
                        country: country.id,
                        population: state.population || 1000000,
                        industry: state.industry || 3,
                        agriculture: state.agriculture || 2,
                        buildings: [],
                        garrison: null,
                        fortification: 0,
                        supply: 100,
                        production: { money: 10, food: 5 }
                    };
                }
            });
        });
    });
}

function initSupplyLines() {
    // Create supply lines between capital and other cities
    Object.keys(WORLD_DATA.continents).forEach(continentKey => {
        const continent = WORLD_DATA.continents[continentKey];
        continent.countries.forEach(country => {
            const states = country.states;
            if (states.length > 1) {
                const capital = states[0];
                for (let i = 1; i < states.length; i++) {
                    createSupplyLine(capital.id, states[i].id, 50);
                }
            }
        });
    });
}

/* =========================================================
   3D SETUP
   ========================================================== */

function setup3D() {
    const canvas = $("gameCanvas");
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1218);
    scene.fog = new THREE.Fog(0x0a1218, 80, 450);

    camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(80, 80, 120);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(innerWidth, innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.style.zIndex = "10";
    document.getElementById("game").appendChild(labelRenderer.domElement);

    const hemi = new THREE.HemisphereLight(0xc8d2d5, 0x162017, 1.2);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffdfad, 2.5);
    sun.position.set(-80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 350;
    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(60, 40, -80);
    scene.add(fill);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 15;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0, 0);
    controls.update();

    clock = new THREE.Clock();
    unitGroup = new THREE.Group();
    fxGroup = new THREE.Group();
    borderGroup = new THREE.Group();
    labelGroup = new THREE.Group();
    stateGroup = new THREE.Group();
    highlightGroup = new THREE.Group();
    stateBorderGroup = new THREE.Group();
    scene.add(unitGroup);
    scene.add(fxGroup);
    scene.add(borderGroup);
    scene.add(labelGroup);
    scene.add(stateGroup);
    scene.add(highlightGroup);
    scene.add(stateBorderGroup);

    canvas.addEventListener("pointerdown", handleWorldClick);
    window.addEventListener("resize", resizeRenderer);
}

function resizeRenderer() {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    if (labelRenderer) labelRenderer.setSize(innerWidth, innerHeight);
}

/* =========================================================
   TERRAIN
   ========================================================== */

function createTerrain() {
    const geometry = new THREE.PlaneGeometry(420, 420, 200, 200);
    const positions = geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const height = 
            Math.sin(x * 0.032) * 2.0 +
            Math.cos(y * 0.038) * 1.8 +
            Math.sin((x + y) * 0.018) * 3.0 +
            Math.cos(x * 0.065 + y * 0.045) * 1.6 +
            Math.sin(x * 0.095) * Math.cos(y * 0.075) * 1.0 +
            Math.cos(x * 0.025 - y * 0.035) * 1.2;
        positions.setZ(i, height);
    }
    geometry.computeVertexNormals();

    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        let r = 0.18, g = 0.30, b = 0.18;
        if (z > 5) { r += 0.18; g += 0.15; b += 0.08; }
        if (z > 9) { r += 0.12; g += 0.05; b -= 0.02; }
        if (Math.sin(x * 0.07) * Math.cos(y * 0.07) > 0.35 && z < 3) { r -= 0.04; g += 0.10; b -= 0.02; }
        if (Math.abs(z) < 0.5) { r += 0.10; g += 0.06; b -= 0.04; }
        if (Math.sin(x * 0.02 + y * 0.03) > 0.6 && z < 1.5) { r += 0.15; g += 0.08; b -= 0.06; }
        if (z > 10) { r += 0.2; g += 0.2; b += 0.2; }
        colors[i*3] = Math.max(0.08, Math.min(0.7, r));
        colors[i*3+1] = Math.max(0.12, Math.min(0.7, g));
        colors[i*3+2] = Math.max(0.06, Math.min(0.5, b));
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.0,
        flatShading: false
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(420, 84, 0x68715f, 0x30382f);
    grid.material.transparent = true;
    grid.material.opacity = 0.04;
    scene.add(grid);

    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(620, 620),
        new THREE.MeshStandardMaterial({
            color: 0x0a2a3a,
            transparent: true,
            opacity: 0.28,
            roughness: 0.1,
            metalness: 0.5
        })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2.8;
    scene.add(water);

    createMountains();
    createForests();
    createRivers();
}

function createMountains() {
    for (let i = 0; i < 100; i++) {
        const height = 8 + Math.random() * 28;
        const radius = 2 + Math.random() * 12;
        const mountain = new THREE.Mesh(
            new THREE.ConeGeometry(radius, height, 6 + Math.floor(Math.random() * 6)),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.1, 0.2 + Math.random() * 0.15),
                roughness: 1,
                flatShading: true
            })
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 170;
        mountain.position.set(Math.cos(angle) * dist, 0.5 + height * 0.4, Math.sin(angle) * dist);
        mountain.rotation.set((Math.random() - 0.5) * 0.15, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.15);
        mountain.castShadow = true;
        scene.add(mountain);

        if (height > 20) {
            const snow = new THREE.Mesh(
                new THREE.ConeGeometry(radius * 0.25, height * 0.18, 6),
                new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 })
            );
            snow.position.copy(mountain.position);
            snow.position.y += height * 0.45;
            snow.castShadow = true;
            scene.add(snow);
        }
    }
}

function createForests() {
    for (let i = 0; i < 350; i++) {
        const tree = new THREE.Group();
        const trunkHeight = 0.8 + Math.random() * 2.0;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.15, trunkHeight, 5),
            new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 })
        );
        trunk.position.y = trunkHeight / 2;
        const crownSize = 0.5 + Math.random() * 1.2;
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(crownSize, 1.5 + Math.random() * 2.2, 5 + Math.floor(Math.random() * 5)),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.25 + Math.random() * 0.08, 0.3, 0.2 + Math.random() * 0.15),
                roughness: 1
            })
        );
        crown.position.y = trunkHeight + (0.5 + Math.random() * 0.8);
        tree.add(trunk, crown);
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 180;
        tree.position.set(Math.cos(angle) * dist + (Math.random() - 0.5) * 25, 0, Math.sin(angle) * dist + (Math.random() - 0.5) * 25);
        tree.scale.setScalar(0.6 + Math.random() * 0.8);
        scene.add(tree);
    }
}

function createRivers() {
    const riverPoints = [
        [[-60, -30], [-40, -25], [-20, -20], [0, -15], [20, -10], [40, -5], [60, 0], [80, 5]],
        [[-50, 40], [-30, 35], [-10, 30], [10, 25], [30, 20], [50, 25], [70, 30]],
        [[-100, -60], [-80, -50], [-60, -45], [-40, -50], [-20, -55], [0, -50], [20, -45]],
        [[-20, -5], [0, 0], [20, 5], [40, 10], [60, 15]]
    ];
    
    riverPoints.forEach(points => {
        const pts = points.map(p => new THREE.Vector3(p[0], 0.15, p[1]));
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x1a5a7a, transparent: true, opacity: 0.35 }));
        scene.add(line);
    });
}

/* =========================================================
   COUNTRY BORDERS & STATES
   ========================================================== */

function createCountryBorders() {
    const countryData = [
        { name: 'BANGLADESH', points: [[-8,-28],[12,-22],[22,-16],[18,-2],[4,4],[-8,-2],[-12,-12],[-8,-28]] },
        { name: 'PAKISTAN', points: [[18,14],[38,10],[48,20],[44,34],[30,38],[20,34],[16,24],[18,14]] },
        { name: 'TURKEY', points: [[-72,38],[-52,34],[-42,44],[-52,58],[-66,54],[-76,48],[-72,38]] },
        { name: 'IRAN', points: [[8,28],[28,24],[38,34],[34,48],[18,52],[8,48],[4,38],[8,28]] },
        { name: 'SAUDI', points: [[8,8],[28,4],[38,14],[34,28],[18,34],[4,28],[0,18],[8,8]] },
        { name: 'EGYPT', points: [[-42,4],[-22,0],[-12,10],[-16,24],[-32,28],[-46,24],[-50,14],[-42,4]] },
        { name: 'PALESTINE', points: [[-12,24],[0,20],[4,30],[0,38],[-12,34],[-16,28],[-12,24]] },
        { name: 'INDONESIA', points: [[78,-22],[98,-26],[118,-22],[114,-6],[94,0],[78,-6],[74,-16],[78,-22]] },
        { name: 'AFGHANISTAN', points: [[24,38],[44,34],[54,44],[48,58],[34,62],[18,58],[14,48],[24,38]] },
        { name: 'INDIA', points: [[-2,-8],[18,-12],[34,-6],[38,8],[28,24],[14,28],[4,22],[-6,12],[-2,-8]] },
        { name: 'USA', points: [[-152,-52],[-122,-48],[-102,-32],[-112,-12],[-132,-8],[-152,-16],[-162,-38],[-152,-52]] },
        { name: 'CHINA', points: [[38,-12],[68,-18],[88,-8],[84,14],[68,24],[48,18],[38,10],[34,-2],[38,-12]] },
        { name: 'RUSSIA', points: [[18,64],[58,60],[88,68],[98,84],[78,98],[48,104],[18,94],[8,78],[18,64]] },
        { name: 'UK', points: [[-138,24],[-122,20],[-112,34],[-122,48],[-138,44],[-142,34],[-138,24]] },
        { name: 'FRANCE', points: [[-62,28],[-42,24],[-32,38],[-42,54],[-56,50],[-66,40],[-62,28]] },
        { name: 'GERMANY', points: [[-22,4],[-2,0],[8,14],[-2,28],[-16,24],[-26,14],[-22,4]] }
    ];

    while(borderGroup.children.length) borderGroup.remove(borderGroup.children[0]);

    countryData.forEach(data => {
        const color = countryColors[data.name] || 0x888888;
        const points = data.points.map(p => new THREE.Vector3(p[0], 0.4, p[1]));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
        borderGroup.add(line);

        const shape = new THREE.Shape();
        points.forEach((p, i) => {
            if (i === 0) shape.moveTo(p.x, p.z);
            else shape.lineTo(p.x, p.z);
        });
        const fillGeom = new THREE.ShapeGeometry(shape);
        const fill = new THREE.Mesh(fillGeom, new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false
        }));
        fill.rotation.x = -Math.PI / 2;
        fill.position.y = 0.2;
        fill.userData.country = data.name;
        fill.userData.isCountry = true;
        borderGroup.add(fill);
        countryMeshMap[data.name] = fill;

        const center = points.reduce((acc, p) => { acc.x += p.x; acc.z += p.z; return acc; }, { x: 0, z: 0 });
        center.x /= points.length;
        center.z /= points.length;
        
        const labelDiv = document.createElement('div');
        labelDiv.textContent = `${nation[data.name]?.flag || '🏳️'} ${nation[data.name]?.name || data.name}`;
        labelDiv.style.cssText = 'color:#eef4f8;font-size:12px;font-weight:700;text-shadow:0 2px 16px rgba(0,0,0,0.95);background:rgba(0,0,0,0.7);padding:4px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(4px);pointer-events:none;user-select:none;';
        const label = new CSS2DObject(labelDiv);
        label.position.set(center.x, 2.5, center.z);
        labelGroup.add(label);
    });
}

function createStates() {
    const stateData = {
        BANGLADESH: { points: [[-8,-28],[-2,-22],[6,-20],[10,-16],[6,-10],[0,-8],[-6,-10],[-10,-14],[-12,-20],[-8,-28]], color: 0x006a4e },
        PAKISTAN: { points: [[22,18],[32,16],[40,20],[38,26],[30,30],[24,28],[20,22],[22,18]], color: 0x01411c },
        TURKEY: { points: [[-66,44],[-56,40],[-46,46],[-48,52],[-58,56],[-66,50],[-66,44]], color: 0xe30a17 },
        IRAN: { points: [[12,34],[22,30],[30,36],[26,42],[16,46],[10,40],[12,34]], color: 0x239f40 },
        SAUDI: { points: [[12,14],[22,10],[30,16],[26,22],[16,26],[8,20],[12,14]], color: 0x165d31 },
        EGYPT: { points: [[-36,10],[-26,8],[-18,14],[-22,22],[-32,24],[-38,18],[-36,10]], color: 0xce1126 },
        PALESTINE: { points: [[-8,26],[0,22],[4,30],[0,36],[-8,32],[-12,28],[-8,26]], color: 0x007a3d },
        INDIA: { points: [[2,-6],[16,-8],[28,-4],[32,4],[24,16],[12,20],[4,14],[-2,6],[2,-6]], color: 0xff9933 },
        USA: { points: [[-142,-42],[-130,-40],[-118,-32],[-124,-20],[-138,-16],[-148,-28],[-152,-38],[-142,-42]], color: 0x2a5c8a },
        CHINA: { points: [[42,-8],[62,-12],[78,-4],[74,8],[62,16],[48,12],[40,4],[36,-4],[42,-8]], color: 0xcc2222 },
        RUSSIA: { points: [[28,72],[52,68],[72,74],[80,86],[64,92],[40,96],[22,88],[16,78],[28,72]], color: 0x003399 },
        UK: { points: [[-130,28],[-118,24],[-110,34],[-118,44],[-130,40],[-134,34],[-130,28]], color: 0x8a2a2a },
        FRANCE: { points: [[-56,32],[-46,28],[-36,40],[-44,50],[-56,46],[-60,38],[-56,32]], color: 0x2a5a8a },
        GERMANY: { points: [[-16,8],[-4,4],[4,16],[-2,26],[-14,22],[-22,14],[-16,8]], color: 0x3a3a3a },
        INDONESIA: { points: [[82,-18],[96,-22],[110,-18],[106,-6],[90,-2],[78,-6],[74,-14],[82,-18]], color: 0xce1126 },
        AFGHANISTAN: { points: [[28,42],[42,38],[50,46],[44,56],[34,60],[22,56],[18,48],[28,42]], color: 0x000000 }
    };

    while(stateGroup.children.length) stateGroup.remove(stateGroup.children[0]);

    Object.keys(stateData).forEach(key => {
        const data = stateData[key];
        const color = data.color || countryColors[key] || 0x888888;
        const points = data.points.map(p => new THREE.Vector3(p[0], 0.25, p[1]));
        
        const shape = new THREE.Shape();
        points.forEach((p, i) => {
            if (i === 0) shape.moveTo(p.x, p.z);
            else shape.lineTo(p.x, p.z);
        });
        const geom = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false
        }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.1;
        mesh.userData.country = key;
        stateGroup.add(mesh);
        stateMeshMap[key] = mesh;

        const center = points.reduce((acc, p) => { acc.x += p.x; acc.z += p.z; return acc; }, { x: 0, z: 0 });
        center.x /= points.length;
        center.z /= points.length;
        
        const labelDiv = document.createElement('div');
        labelDiv.textContent = `📍 ${nation[key]?.name || key}`;
        labelDiv.style.cssText = 'color:#aabbcc;font-size:8px;font-weight:600;text-shadow:0 1px 10px rgba(0,0,0,0.95);background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:8px;pointer-events:none;user-select:none;';
        const label = new CSS2DObject(labelDiv);
        label.position.set(center.x, 1.0, center.z);
        labelGroup.add(label);
    });
}

/* =========================================================
   STATE BORDER DATA
   ========================================================== */

function createStateBorderData() {
    stateBorderPoints = {
        BANGLADESH: { "Dhaka": [[-8,-28],[-4,-24],[0,-22],[4,-18],[2,-14],[-2,-12],[-6,-14],[-10,-18],[-8,-28]], "Chittagong": [[4,-18],[8,-20],[12,-18],[14,-14],[10,-10],[6,-8],[2,-10],[4,-18]], "Rajshahi": [[-10,-18],[-6,-14],[-2,-12],[-4,-8],[-8,-6],[-12,-10],[-14,-14],[-10,-18]] },
        PAKISTAN: { "Punjab": [[22,18],[26,16],[30,20],[28,24],[24,22],[22,18]], "Sindh": [[28,24],[32,22],[36,26],[34,30],[30,28],[28,24]], "KPK": [[30,20],[34,18],[38,22],[36,26],[32,24],[30,20]] },
        TURKEY: { "Istanbul": [[-66,44],[-62,42],[-58,46],[-60,50],[-64,48],[-66,44]], "Ankara": [[-58,46],[-54,44],[-50,48],[-52,52],[-56,50],[-58,46]] },
        IRAN: { "Tehran": [[12,34],[16,32],[20,36],[18,40],[14,38],[12,34]], "Isfahan": [[16,32],[20,30],[24,34],[22,38],[18,36],[16,32]] },
        SAUDI: { "Riyadh": [[12,14],[16,12],[20,16],[18,20],[14,18],[12,14]], "Makkah": [[16,12],[20,10],[24,14],[22,18],[18,16],[16,12]] },
        EGYPT: { "Cairo": [[-36,10],[-32,8],[-28,12],[-30,16],[-34,14],[-36,10]], "Alexandria": [[-28,12],[-24,10],[-20,14],[-22,18],[-26,16],[-28,12]] },
        PALESTINE: { "West Bank": [[-8,26],[-4,24],[0,28],[-2,32],[-6,30],[-8,26]], "Gaza Strip": [[0,28],[4,26],[6,30],[4,34],[0,32],[-2,28]] },
        INDIA: { "UP": [[2,-6],[6,-8],[10,-4],[8,0],[4,-2],[2,-6]], "Maharashtra": [[8,0],[12,-2],[16,2],[14,6],[10,4],[8,0]] },
        USA: { "California": [[-142,-42],[-138,-40],[-134,-44],[-136,-48],[-140,-46],[-142,-42]], "Texas": [[-134,-44],[-130,-42],[-126,-46],[-128,-50],[-132,-48],[-134,-44]] },
        CHINA: { "Guangdong": [[42,-8],[46,-10],[50,-6],[48,-2],[44,-4],[42,-8]], "Shandong": [[46,-10],[50,-12],[54,-8],[52,-4],[48,-6],[46,-10]] },
        RUSSIA: { "Moscow": [[28,72],[32,70],[36,74],[34,78],[30,76],[28,72]], "St Petersburg": [[36,74],[40,72],[44,76],[42,80],[38,78],[36,74]] },
        UK: { "England": [[-130,28],[-126,26],[-122,30],[-124,34],[-128,32],[-130,28]], "Scotland": [[-126,26],[-122,24],[-118,28],[-120,32],[-124,30],[-126,26]] },
        FRANCE: { "Île-de-France": [[-56,32],[-52,30],[-48,34],[-50,38],[-54,36],[-56,32]], "Provence": [[-48,34],[-44,32],[-40,36],[-42,40],[-46,38],[-48,34]] },
        GERMANY: { "Bavaria": [[-16,8],[-12,6],[-8,10],[-10,14],[-14,12],[-16,8]], "North Rhine": [[-12,6],[-8,4],[-4,8],[-6,12],[-10,10],[-12,6]] },
        INDONESIA: { "Java": [[82,-18],[86,-20],[90,-16],[88,-12],[84,-14],[82,-18]], "Sumatra": [[86,-20],[90,-22],[94,-18],[92,-14],[88,-16],[86,-20]] },
        AFGHANISTAN: { "Kabul": [[28,42],[32,40],[36,44],[34,48],[30,46],[28,42]], "Kandahar": [[32,40],[36,38],[40,42],[38,46],[34,44],[32,40]] }
    };
}

/* =========================================================
   ZOOM & HIGHLIGHT
   ========================================================== */

function zoomToCountry(countryKey) {
    if (!countryKey || !nation[countryKey]) return;
    if (isZooming) return;
    isZooming = true;

    const mesh = countryMeshMap[countryKey];
    if (!mesh) { isZooming = false; return; }

    const positions = mesh.geometry.attributes.position;
    const center = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < positions.count; i++) {
        center.x += positions.getX(i);
        center.z += positions.getY(i);
        count++;
    }
    center.x /= count;
    center.z /= count;
    center.y = 5;

    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(center.x + 25, center.y + 20, center.z + 30);
    const startTarget = controls.target.clone();
    const endTarget = center.clone();
    
    const duration = 800;
    const startTime = Date.now();

    function animateZoom() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        camera.position.lerpVectors(startPos, endPos, ease);
        controls.target.lerpVectors(startTarget, endTarget, ease);
        controls.update();

        if (t < 1) {
            requestAnimationFrame(animateZoom);
        } else {
            isZooming = false;
            showStateBorders(countryKey);
            showStateLabels(countryKey);
            showCities(countryKey);
        }
    }
    animateZoom();

    highlightedCountry = countryKey;
    const data = nation[countryKey];
    const stateCount = data.states?.length || 0;
    const cityCount = data.cities?.length || 0;
    $("selectedCountryDisplay").textContent = `📍 ${data.flag} ${data.name} • ${data.region} • ${stateCount} States • ${cityCount} Cities`;
    $("countryFlag").textContent = data.flag;
    $("countryName").textContent = data.name;

    showCountryInfo(countryKey);
    toast(`📍 Zooming to ${data.name}`);
}

function showCities(countryKey) {
    // Remove old city labels
    const oldCityLabels = labelGroup.children.filter(child => child.userData && child.userData.isCityLabel);
    oldCityLabels.forEach(label => labelGroup.remove(label));

    const data = nation[countryKey];
    if (!data || !data.cities) return;

    const mesh = countryMeshMap[countryKey];
    if (!mesh) return;

    const positions = mesh.geometry.attributes.position;
    const center = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < positions.count; i++) {
        center.x += positions.getX(i);
        center.z += positions.getY(i);
        count++;
    }
    center.x /= count;
    center.z /= count;

    const radius = 10;
    const angleStep = (Math.PI * 2) / Math.min(data.cities.length, 6);

    data.cities.forEach((city, index) => {
        const angle = index * angleStep + 0.3;
        const x = center.x + Math.cos(angle) * radius * (0.6 + Math.random() * 0.4);
        const z = center.z + Math.sin(angle) * radius * (0.6 + Math.random() * 0.4);

        const labelDiv = document.createElement('div');
        labelDiv.textContent = `🏙️ ${city.name}`;
        labelDiv.style.cssText = 'color:#58a6ff;font-size:10px;font-weight:600;text-shadow:0 2px 20px rgba(0,0,0,0.95);background:rgba(0,0,0,0.75);padding:2px 8px;border-radius:10px;border:1px solid rgba(88,166,255,0.3);backdrop-filter:blur(4px);pointer-events:none;user-select:none;';
        const label = new CSS2DObject(labelDiv);
        label.position.set(x, 1.5, z);
        label.userData = { isCityLabel: true };
        labelGroup.add(label);
    });
}

function showStateBorders(countryKey) {
    while(stateBorderGroup.children.length) stateBorderGroup.remove(stateBorderGroup.children[0]);

    const countryStates = stateBorderPoints[countryKey];
    if (!countryStates) return;

    Object.keys(countryStates).forEach(stateName => {
        const points = countryStates[stateName].map(p => new THREE.Vector3(p[0], 0.6, p[1]));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.9 }));
        stateBorderGroup.add(line);
        const glowLine = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3 }));
        glowLine.position.y = 0.05;
        stateBorderGroup.add(glowLine);
    });
}

function showStateLabels(countryKey) {
    const oldLabels = labelGroup.children.filter(child => child.userData && child.userData.isStateLabel);
    oldLabels.forEach(label => labelGroup.remove(label));

    const data = nation[countryKey];
    if (!data || !data.states) return;

    const mesh = countryMeshMap[countryKey];
    if (!mesh) return;

    const positions = mesh.geometry.attributes.position;
    const center = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < positions.count; i++) {
        center.x += positions.getX(i);
        center.z += positions.getY(i);
        count++;
    }
    center.x /= count;
    center.z /= count;

    const radius = 8;
    const angleStep = (Math.PI * 2) / Math.min(data.states.length, 6);

    data.states.forEach((stateName, index) => {
        const angle = index * angleStep + 0.3;
        const x = center.x + Math.cos(angle) * radius * (0.6 + Math.random() * 0.4);
        const z = center.z + Math.sin(angle) * radius * (0.6 + Math.random() * 0.4);

        const labelDiv = document.createElement('div');
        labelDiv.textContent = `🏛️ ${stateName}`;
        labelDiv.style.cssText = 'color:#ffdd44;font-size:11px;font-weight:700;text-shadow:0 2px 20px rgba(0,0,0,0.95);background:rgba(0,0,0,0.75);padding:3px 10px;border-radius:12px;border:1px solid rgba(255,221,68,0.3);backdrop-filter:blur(4px);pointer-events:none;user-select:none;';
        const label = new CSS2DObject(labelDiv);
        label.position.set(x, 2.0, z);
        label.userData = { isStateLabel: true };
        labelGroup.add(label);
    });
}

function clearStateHighlights() {
    while(stateBorderGroup.children.length) stateBorderGroup.remove(stateBorderGroup.children[0]);
    const oldLabels = labelGroup.children.filter(child => child.userData && child.userData.isStateLabel);
    oldLabels.forEach(label => labelGroup.remove(label));
    const oldCityLabels = labelGroup.children.filter(child => child.userData && child.userData.isCityLabel);
    oldCityLabels.forEach(label => labelGroup.remove(label));
}

function highlightCountry(countryKey) {
    while(highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);

    if (!countryKey || !nation[countryKey]) {
        highlightedCountry = null;
        $("selectedCountryDisplay").textContent = '';
        clearStateHighlights();
        return;
    }

    highlightedCountry = countryKey;
    const data = nation[countryKey];

    const mesh = countryMeshMap[countryKey];
    if (mesh) {
        const highlight = mesh.clone();
        highlight.material = new THREE.MeshBasicMaterial({
            color: 0xffdd44, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false
        });
        highlight.position.y = 0.3;
        highlightGroup.add(highlight);

        const positions = mesh.geometry.attributes.position;
        const center = new THREE.Vector3();
        for (let i = 0; i < positions.count; i++) {
            center.x += positions.getX(i);
            center.z += positions.getY(i);
        }
        center.x /= positions.count;
        center.z /= positions.count;

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(4, 6, 32),
            new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(center.x, 0.5, center.z);
        highlightGroup.add(ring);

        const stateCount = data.states?.length || 0;
        const cityCount = data.cities?.length || 0;
        $("selectedCountryDisplay").textContent = `📍 ${data.flag} ${data.name} • ${data.region} • ${stateCount} States • ${cityCount} Cities`;
    }
}

function showCountryInfo(countryKey) {
    const data = nation[countryKey];
    if (!data) return;

    const modal = $("countryInfoModal");
    const title = $("infoCountryTitle");
    const kicker = $("infoCountryKicker");
    const content = $("infoCountryContent");

    if (title) title.textContent = `${data.flag} ${data.name}`;
    if (kicker) kicker.textContent = `${data.region} • Capital: ${data.capital}`;
    
    if (content) {
        content.innerHTML = `
            <div class="country-detail-card">
                <h4>📍 Territory Information</h4>
                <div class="stat-row"><span>Country</span><b>${data.name}</b></div>
                <div class="stat-row"><span>Continent</span><b>${data.continent}</b></div>
                <div class="stat-row"><span>Capital</span><b>${data.capital}</b></div>
                <div class="stat-row"><span>States</span><b>${data.states?.length || 0}</b></div>
                <div class="stat-row"><span>Cities</span><b>${data.cities?.length || 0}</b></div>
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                    ${data.states?.map(s => `<span class="state-tag">${s}</span>`).join('') || ''}
                </div>
            </div>
            <div class="country-detail-card">
                <h4>🏙️ Cities</h4>
                ${data.cities?.map(c => `
                    <div class="stat-row">
                        <span>${c.name}</span>
                        <b>Population: ${formatNumber(c.population)}</b>
                    </div>
                `).join('') || '<p style="color:var(--muted);font-size:11px;">No cities</p>'}
            </div>
            <div class="country-detail-card">
                <h4>📖 Description</h4>
                <p style="font-size:11px;color:var(--muted);line-height:1.6;">${data.desc || 'No description available.'}</p>
            </div>
            <button class="action-btn success" onclick="window.zoomToCountry('${countryKey}')">🎯 Zoom to ${data.name}</button>
            <button class="action-btn info" onclick="window.openCityPanel('${countryKey}')">🏙️ Manage Cities</button>
        `;
    }

    modal.classList.add('open');
}

/* =========================================================
   WORLD CLICK HANDLER
   ========================================================== */

function handleWorldClick(event) {
    if (isZooming) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const meshes = [];
    borderGroup.children.forEach(child => {
        if (child.userData && child.userData.isCountry) {
            meshes.push(child);
        }
    });

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
        const countryKey = intersects[0].object.userData.country;
        if (countryKey && nation[countryKey]) {
            zoomToCountry(countryKey);
            highlightCountry(countryKey);
            return;
        }
    }

    const unitMeshes = [];
    unitGroup.children.forEach(child => {
        child.children.forEach(mesh => {
            if (mesh.isMesh) {
                mesh.userData.parentUnit = child.userData.unit;
                unitMeshes.push(mesh);
            }
        });
    });

    const unitIntersects = raycaster.intersectObjects(unitMeshes);
    if (unitIntersects.length > 0) {
        const unit = unitIntersects[0].object.userData.parentUnit;
        if (unit && unit.state !== "DESTROYED") {
            selectUnit(unit);
            return;
        }
    }

    if (selectedUnit && moveMode) {
        const groundIntersects = raycaster.intersectObject(ground);
        if (groundIntersects.length > 0) {
            const point = groundIntersects[0].point;
            selectedUnit.destination = point.clone();
            selectedUnit.state = "MOVING";
            toast(`${selectedUnit.name} moving to position`);
            moveMode = false;
            $("moveCommand").style.borderColor = "var(--line)";
            return;
        }
    }

    if (selectedUnit && attackMode) {
        const groundIntersects = raycaster.intersectObject(ground);
        if (groundIntersects.length > 0) {
            const point = groundIntersects[0].point;
            let nearest = null;
            let minDist = Infinity;
            for (const unit of units) {
                if (unit.friendly === selectedUnit.friendly || unit.state === "DESTROYED") continue;
                const dist = unit.object.position.distanceTo(point);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = unit;
                }
            }
            if (nearest && minDist < 40) {
                executeAttack(selectedUnit, nearest);
            } else {
                toast("No enemy nearby");
            }
            attackMode = false;
            $("attackCommand").style.borderColor = "var(--line)";
            return;
        }
    }

    if (selectedUnit) {
        deselectUnit();
    }
}

/* =========================================================
   UNIT CREATION (Same as V1)
   ========================================================== */

function create3DTank(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.0), mat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.6, 12), mat);
    turret.position.y = 1.6;
    turret.castShadow = true;
    group.add(turret);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 2.0), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 }));
    barrel.position.set(0, 1.65, 1.4);
    group.add(barrel);

    for (let side of [-1, 1]) {
        const track = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 2.2), trackMat);
        track.position.set(side * 1.8, 0.3, 0);
        group.add(track);
        for (let i = -0.8; i <= 0.8; i += 0.4) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(side * 1.7, 0.4, i);
            group.add(wheel);
        }
    }

    const hatch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    hatch.position.set(0.3, 1.9, 0.2);
    group.add(hatch);

    return group;
}

function create3DInfantry(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.8 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 6, 8), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x445544, roughness: 0.5 }));
    helmet.position.y = 1.7;
    group.add(helmet);

    for (let side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 4), bodyMat);
        arm.position.set(side * 0.4, 1.2, 0);
        arm.rotation.z = side * 0.3;
        group.add(arm);
    }

    for (let side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 4), bodyMat);
        leg.position.set(side * 0.15, 0.35, 0);
        group.add(leg);
    }

    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 4), gunMat);
    gun.rotation.x = Math.PI / 2;
    gun.position.set(0.4, 1.2, 0.4);
    group.add(gun);

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.15), new THREE.MeshStandardMaterial({ color: 0x445544 }));
    pack.position.set(0, 0.9, -0.25);
    group.add(pack);

    return group;
}

function create3DArtillery(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.2), mat);
    base.position.y = 0.3;
    base.castShadow = true;
    group.add(base);

    for (let side of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 12), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 }));
        wheel.position.set(side * 0.7, 0.3, 0.5);
        wheel.rotation.y = Math.PI / 2;
        group.add(wheel);
    }

    const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.8), mat);
    carriage.position.y = 0.6;
    group.add(carriage);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.8, 8), metalMat);
    barrel.rotation.x = Math.PI / 2 * 0.3;
    barrel.position.set(0, 0.8, 1.2);
    group.add(barrel);

    const breech = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), metalMat);
    breech.position.set(0, 0.8, 0.3);
    group.add(breech);

    const shield = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.05), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    shield.position.set(0, 0.8, 0.7);
    group.add(shield);

    return group;
}

function create3DAircraft(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });

    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 2.8, 8), mat);
    fuse.rotation.x = Math.PI / 2;
    fuse.castShadow = true;
    group.add(fuse);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.6), mat);
    wing.position.y = 0;
    wing.castShadow = true;
    group.add(wing);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), mat);
    tail.position.set(-1.4, 0.2, 0);
    group.add(tail);
    const tailVertical = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.3), mat);
    tailVertical.position.set(-1.4, 0.2, 0);
    group.add(tailVertical);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), glassMat);
    cockpit.position.set(0.8, 0.2, 0);
    cockpit.scale.set(1, 1, 0.6);
    group.add(cockpit);

    const propGroup = new THREE.Group();
    const prop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    prop.position.x = 1.4;
    propGroup.add(prop);
    const prop2 = prop.clone();
    prop2.rotation.y = Math.PI / 2;
    propGroup.add(prop2);
    group.add(propGroup);
    group.userData.propeller = propGroup;

    for (let side of [-1, 1]) {
        const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        gear.position.set(side * 0.4, -0.2, -0.1);
        group.add(gear);
    }

    return group;
}

function create3DUnit(name, type, x, z, friendly = true, country = "BANGLADESH") {
    const group = new THREE.Group();
    const color = friendly ? 0x447744 : 0x884444;

    let model;
    switch(type) {
        case 'TANK': model = create3DTank(color); break;
        case 'ARTILLERY': model = create3DArtillery(color); break;
        case 'AIR': model = create3DAircraft(color); break;
        default: model = create3DInfantry(color);
    }
    group.add(model);

    const hpBar = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.15), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 }));
    bg.position.y = 0;
    hpBar.add(bg);
    const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.1), new THREE.MeshBasicMaterial({ color: 0x55dd55 }));
    hpFill.position.y = 0;
    hpBar.add(hpFill);
    hpBar.position.y = type === 'AIR' ? 9.5 : 3.0;
    group.add(hpBar);
    group.userData.hpBar = hpBar;
    group.userData.hpFill = hpFill;

    const flagDiv = document.createElement('div');
    const countryData = nation[country] || nation["BANGLADESH"];
    flagDiv.textContent = friendly ? countryData.flag : '🔴';
    flagDiv.style.cssText = 'font-size:14px;text-shadow:0 0 10px rgba(0,0,0,0.8);';
    const flagLabel = new CSS2DObject(flagDiv);
    flagLabel.position.set(0, type === 'AIR' ? 11 : 4.5, 0);
    group.add(flagLabel);
    group.userData.flagLabel = flagLabel;

    group.position.set(x, type === 'AIR' ? 8 : 0, z);
    group.castShadow = true;
    unitGroup.add(group);

    const unit = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        name, type, friendly, country,
        object: group,
        hp: 100, maxHp: 100,
        organization: type === 'AIR' ? 88 : 100,
        maxOrganization: type === 'AIR' ? 88 : 100,
        morale: type === 'TANK' ? 82 : 85,
        strength: type === 'TANK' ? 85 : type === 'AIR' ? 75 : 70,
        maxStrength: type === 'TANK' ? 85 : type === 'AIR' ? 75 : 70,
        readiness: 96, supply: 92,
        attack: type === 'TANK' ? 24 : type === 'ARTILLERY' ? 28 : type === 'AIR' ? 30 : 16,
        defense: type === 'TANK' ? 20 : type === 'ARTILLERY' ? 12 : 17,
        speed: type === 'TANK' ? 18 : type === 'ARTILLERY' ? 8 : type === 'AIR' ? 35 : 12,
        state: "READY",
        destination: null,
        kills: 0,
        experience: 0,
        entrenchment: 0,
        selected: false,
        city: null,
        supplyLine: null
    };

    group.userData.unit = unit;
    units.push(unit);
    updateUnitHPBar(unit);
    return unit;
}

function updateUnitHPBar(unit) {
    if (!unit || !unit.object.userData.hpFill) return;
    const hpPercent = Math.max(0, unit.hp / unit.maxHp);
    const fill = unit.object.userData.hpFill;
    fill.scale.x = hpPercent;
    fill.material.color.setHex(hpPercent > 0.6 ? 0x55dd55 : hpPercent > 0.3 ? 0xdddd55 : 0xdd5555);
}

function deployInitialForces() {
    units.length = 0;
    create3DUnit("1st Infantry Div", "INFANTRY", -6, -22, true, "BANGLADESH");
    create3DUnit("2nd Infantry Div", "INFANTRY", 2, -26, true, "BANGLADESH");
    create3DUnit("Armored Brigade", "TANK", -4, -18, true, "BANGLADESH");
    create3DUnit("Artillery Reg", "ARTILLERY", -10, -24, true, "BANGLADESH");
    create3DUnit("Air Wing", "AIR", -2, -30, true, "BANGLADESH");
    create3DUnit("Pakistani Infantry", "INFANTRY", 28, 16, true, "PAKISTAN");
    create3DUnit("Pakistani Armor", "TANK", 32, 20, true, "PAKISTAN");
    create3DUnit("Turkish Infantry", "INFANTRY", -58, 42, true, "TURKEY");
    create3DUnit("Turkish Artillery", "ARTILLERY", -62, 38, true, "TURKEY");
    create3DUnit("Iranian Infantry", "INFANTRY", 16, 32, true, "IRAN");
    create3DUnit("Iranian Armor", "TANK", 20, 36, true, "IRAN");
    create3DUnit("Saudi Infantry", "INFANTRY", 16, 16, true, "SAUDI");
    create3DUnit("Egyptian Infantry", "INFANTRY", -28, 10, true, "EGYPT");
    create3DUnit("Palestinian Defense", "INFANTRY", -4, 28, true, "PALESTINE");
    create3DUnit("Indian Infantry", "INFANTRY", 8, -12, false, "INDIA");
    create3DUnit("Indian Armor", "TANK", 14, -8, false, "INDIA");
    create3DUnit("Chinese Infantry", "INFANTRY", 52, 4, false, "CHINA");
    create3DUnit("Chinese Armor", "TANK", 58, 8, false, "CHINA");
    create3DUnit("Russian Infantry", "INFANTRY", 32, 68, false, "RUSSIA");
    create3DUnit("US Infantry", "INFANTRY", -132, -32, false, "USA");
    create3DUnit("US Armor", "TANK", -128, -38, false, "USA");
    create3DUnit("UK Infantry", "INFANTRY", -124, 32, false, "UK");
    create3DUnit("French Infantry", "INFANTRY", -48, 38, false, "FRANCE");
    create3DUnit("German Infantry", "INFANTRY", -12, 10, false, "GERMANY");
}

/* =========================================================
   COMBAT SYSTEM
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
    let maxRange = 35;
    if (attacker.type === 'ARTILLERY') maxRange = 80;
    if (attacker.type === 'AIR') maxRange = 100;
    
    if (distance > maxRange) { toast("Target is out of range"); return; }
    if (attacker.supply < 15) { toast("Insufficient supply"); return; }

    attacker.supply = Math.max(0, attacker.supply - 6);
    
    let attackPower = (attacker.attack * (attacker.strength / 100) * (attacker.organization / 100) *
        (attacker.morale / 100) * getTerrainModifier(attacker) * getTechAttackBonus(attacker)) + Math.random() * 8;
    
    if (attacker.type === 'ARTILLERY' && defender.state === 'DEFENDING') attackPower *= 1.3;
    
    const defensePower = (defender.defense * (defender.strength / 100) * (defender.organization / 100) *
        (defender.morale / 100) * getTerrainModifier(defender)) + Math.random() * 7;

    let damage = Math.max(3, attackPower - defensePower * 0.55);
    if (weather === "SNOW") damage *= 0.82;

    defender.hp = Math.max(0, defender.hp - damage);
    defender.organization = Math.max(0, defender.organization - damage * 0.48);
    defender.morale = Math.max(0, defender.morale - damage * 0.22);
    attacker.organization = Math.max(0, attacker.organization - Math.max(1, damage * 0.12));
    attacker.experience = Math.min(100, attacker.experience + damage * 0.08);
    
    updateUnitHPBar(defender);
    updateUnitHPBar(attacker);

    addBattleLog(`${attacker.name} attacked ${defender.name} for ${Math.round(damage)} damage`);

    if (defender.hp <= 0 || defender.organization <= 0) {
        destroyUnit(defender, attacker);
    } else {
        defender.state = "UNDER_ATTACK";
        attacker.state = "ATTACKING";
        createExplosion(defender.object.position);
        toast(`${attacker.name} dealt ${Math.round(damage)} damage`);
        addNotification(`⚔️ ${attacker.name} attacked ${defender.name}`, NOTIFICATION_TYPES.WARNING);
    }
    updateUnitPanel();
    updateAllUI();
}

function executeAirstrike(aircraft, target) {
    if (aircraft.supply < 20) { toast("Air unit needs supply"); return; }
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
    updateUnitHPBar(target);
    addBattleLog(`Airstrike hit ${target.name} for ${Math.round(damage)} damage`);
    toast(`Airstrike hit ${target.name}`);
    addNotification(`✈️ Airstrike hit ${target.name}`, NOTIFICATION_TYPES.DANGER);

    if (target.hp <= 0 || target.organization <= 0) {
        destroyUnit(target, aircraft);
    }
    updateUnitPanel();
    updateAllUI();
}

function createExplosion(position) {
    const count = 12;
    for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2 + Math.random() * 0.6, 6, 6),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 1, 0.4 + Math.random() * 0.4),
                transparent: true,
                opacity: 0.9
            })
        );
        mesh.position.copy(position);
        mesh.position.y += 0.5 + Math.random() * 1.5;
        const dir = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3).normalize();
        mesh.userData = { life: 0.3 + Math.random() * 0.4, velocity: dir.multiplyScalar(2 + Math.random() * 5) };
        fxGroup.add(mesh);
    }
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
    addNotification(`💀 ${unit.name} destroyed!`, NOTIFICATION_TYPES.DANGER);
    if (selectedUnit === unit) {
        selectedUnit = null;
        const panel = $("unitPanel");
        if (panel) panel.classList.remove("open");
    }
}

/* =========================================================
   ECONOMY, PRODUCTION, RESEARCH
   ========================================================== */

function updateEconomy(dt) {
    if (paused) return;
    const civilianIncome = factories.civilian * 0.22 * dt * speed;
    const taxIncome = civilianIncome * (tax / 20);
    money += taxIncome;
    oil += factories.military * 0.012 * dt * speed;
    steel += factories.military * 0.018 * dt * speed;
    food += 0.15 * dt * speed;
    manpower += 0.8 * dt * speed;

    if (tax > 35) {
        stability = Math.max(0, stability - dt * 0.025);
    } else if (tax < 18) {
        stability = Math.min(100, stability + dt * 0.01);
    }
    if (stability < 35) {
        political = Math.max(0, political - dt * 0.08);
    } else {
        political = Math.min(999, political + dt * 0.035);
    }
    construction = Math.min(20, construction + factories.civilian * 0.001 * dt * speed);
}

function updateProduction(dt) {
    if (paused) return;
    for (const key of Object.keys(production)) {
        const p = production[key];
        if (p.factories <= 0) continue;
        let progress = p.factories * p.efficiency * 0.004 * dt * speed;
        if (tech.INDUSTRY.completed) progress *= 1.12;
        p.progress += progress;
        if (p.progress >= 100) {
            p.progress -= 100;
            p.output += Math.max(1, Math.floor(p.factories * p.efficiency / 55));
            applyProductionOutput(key, p.output);
            p.output = 0;
            p.efficiency = Math.min(100, p.efficiency + 0.15);
        }
    }
}

function applyProductionOutput(type, amount) {
    if (type === "INFANTRY") {
        manpower += amount * 12;
    } else if (type === "TANK") {
        for (const unit of units) {
            if (unit.friendly && unit.type === "TANK" && unit.state !== "DESTROYED") {
                unit.strength = Math.min(unit.maxStrength, unit.strength + amount * 0.7);
                break;
            }
        }
    } else if (type === "ARTILLERY") {
        for (const unit of units) {
            if (unit.friendly && unit.type === "ARTILLERY" && unit.state !== "DESTROYED") {
                unit.strength = Math.min(unit.maxStrength, unit.strength + amount * 0.7);
                break;
            }
        }
    } else if (type === "AIR") {
        for (const unit of units) {
            if (unit.friendly && unit.type === "AIR" && unit.state !== "DESTROYED") {
                unit.readiness = Math.min(100, unit.readiness + amount * 1.2);
                break;
            }
        }
    }
}

function updateResearch(dt) {
    if (paused) return;
    for (const key of Object.keys(tech)) {
        const t = tech[key];
        if (!t.active || t.completed) continue;
        t.progress += 0.18 * dt * speed;
        if (t.progress >= 100) {
            t.progress = 100;
            t.completed = true;
            t.active = false;
            applyTechnology(key);
            toast(`${t.name} completed`);
            addNotification(`🔬 ${t.name} researched!`, NOTIFICATION_TYPES.SUCCESS);
        }
    }
}

function startResearch(key) {
    const t = tech[key];
    if (t.completed) { toast("Technology already completed"); return; }
    const active = Object.values(tech).filter(x => x.active).length;
    if (!t.active && active >= 3) { toast("All research slots are occupied"); return; }
    if (political < 10) { toast("Need 10 political power"); return; }
    political -= 10;
    t.active = true;
    toast(`Research started: ${t.name}`);
    openPanel("research");
}

function applyTechnology(key) {
    if (key === "INDUSTRY") factories.civilian++;
    if (key === "ELECTRONICS") intel = Math.min(100, intel + 10);
    if (key === "LOGISTICS") {
        for (const unit of units) {
            unit.supply = Math.min(100, unit.supply + 10);
        }
    }
}

/* =========================================================
   DIPLOMACY, INTEL, MISC FUNCTIONS
   ========================================================== */

function improveDiplomacy(country) {
    if (political < 15) { toast("Need political power"); return; }
    political -= 15;
    diplomacy[country] = Math.min(100, (diplomacy[country] || 0) + 8);
    addDiplomaticMessage(`Relations improved with ${nation[country]?.name || country}`);
    toast(`Relations improved with ${nation[country]?.name || country}`);
    openPanel("diplomacy");
}

function runRecon() {
    if (money < 250) { toast("Not enough money"); return; }
    money -= 250;
    intel = Math.min(100, intel + 10);
    for (const unit of units) {
        if (!unit.friendly) {
            unit.readiness = Math.max(0, unit.readiness - 2);
        }
    }
    toast("Recon completed");
    addNotification(`🕵️ Recon completed!`, NOTIFICATION_TYPES.INFO);
    updateAllUI();
}

function expandSpyNetwork() {
    if (money < 400) { toast("Not enough money"); return; }
    money -= 400;
    spy = Math.min(100, spy + 12);
    intel = Math.min(100, intel + 4);
    toast("Spy network expanded");
    updateAllUI();
}

function improveCounterIntel() {
    if (money < 350) { toast("Not enough money"); return; }
    money -= 350;
    counterIntel = Math.min(100, counterIntel + 12);
    toast("Counter-intelligence improved");
    updateAllUI();
}

function changeWeather() {
    if (weather === "CLEAR") weather = "RAIN";
    else if (weather === "RAIN") weather = "SNOW";
    else weather = "CLEAR";
    if (ground) {
        ground.material.color.setHex(weather === "SNOW" ? 0x8a9a9a : 0x52634d);
    }
    toast(`Weather: ${weather}`);
    addNotification(`🌤️ Weather changed to ${weather}`, NOTIFICATION_TYPES.INFO);
}

function setMapLayer(layer) {
    mapLayer = layer;
    if (ground) {
        ground.material.color.setHex(mapColors[layer]);
    }
    toast(`Map layer: ${layer}`);
}

function addBattleLog(message) {
    battleLog.unshift({ time: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, message });
    if (battleLog.length > 20) battleLog.pop();
}

function addDiplomaticMessage(message) {
    diplomaticMessages.unshift({ time: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, message });
    if (diplomaticMessages.length > 10) diplomaticMessages.pop();
}

function assignFactory(type) {
    const used = Object.values(production).reduce((sum, item) => sum + item.factories, 0);
    if (used >= factories.military) { toast("No free military factories"); return; }
    production[type].factories++;
    toast(`${type} factory assigned`);
    openPanel("production");
}

function quickBuildFactory() {
    if (money < 500) { toast("Need $500 to build factory"); return; }
    if (construction < 2) { toast("Need 2 construction points"); return; }
    money -= 500;
    construction -= 2;
    factories.military++;
    toast("🏭 Military factory built!");
    addNotification(`🏭 Factory built!`, NOTIFICATION_TYPES.SUCCESS);
    updateAllUI();
}

function quickReinforce() {
    if (money < 300) { toast("Need $300 to reinforce"); return; }
    if (manpower < 1000) { toast("Not enough manpower"); return; }
    money -= 300;
    manpower -= 1000;
    for (const unit of units) {
        if (unit.friendly && unit.state !== "DESTROYED") {
            unit.hp = Math.min(unit.maxHp, unit.hp + 20);
            unit.organization = Math.min(unit.maxOrganization, unit.organization + 15);
            unit.morale = Math.min(100, unit.morale + 10);
            updateUnitHPBar(unit);
        }
    }
    toast("🪖 Units reinforced!");
    addNotification(`🪖 Units reinforced!`, NOTIFICATION_TYPES.SUCCESS);
    updateAllUI();
}

function buildBuilding(buildingId) {
    const building = BUILDINGS[buildingId];
    if (!building) return;
    
    for (const [resource, amount] of Object.entries(building.cost)) {
        if (resource === 'money' && money < amount) { toast(`Not enough money`); return; }
        if (resource === 'steel' && steel < amount) { toast(`Not enough steel`); return; }
    }
    
    for (const [resource, amount] of Object.entries(building.cost)) {
        if (resource === 'money') money -= amount;
        else if (resource === 'steel') steel -= amount;
    }
    
    buildingQueue.push({
        buildingId: buildingId,
        progress: 0,
        totalTime: building.buildTime
    });
    
    toast(`🔨 Building ${building.name} started!`);
    addNotification(`🔨 Building ${building.name} started!`, NOTIFICATION_TYPES.INFO);
    openPanel('buildings');
    updateAllUI();
}

function trainUnitFromCity(cityId, unitType) {
    const cost = getUnitTrainingCost(unitType);
    if (!cost) { toast("Invalid unit type"); return; }
    
    for (const [resource, amount] of Object.entries(cost)) {
        if (resource === 'money' && money < amount) { toast(`Not enough money`); return; }
        if (resource === 'steel' && steel < amount) { toast(`Not enough steel`); return; }
        if (resource === 'manpower' && manpower < amount) { toast(`Not enough manpower`); return; }
    }
    
    for (const [resource, amount] of Object.entries(cost)) {
        if (resource === 'money') money -= amount;
        else if (resource === 'steel') steel -= amount;
        else if (resource === 'manpower') manpower -= amount;
    }
    
    trainUnit(cityId, unitType);
    toast(`🪖 Training ${unitType} in ${cityId}`);
    addNotification(`🪖 Training ${unitType} in ${cityId}`, NOTIFICATION_TYPES.INFO);
    updateAllUI();
}

/* =========================================================
   AUTOSAVE
   ========================================================== */

function autosave() {
    try {
        const saveData = {
            money, oil, steel, food, manpower,
            political, stability, tax, construction,
            intel, spy, counterIntel,
            factories, diplomacy,
            production, tech,
            year, month, day, currentCountry,
            buildingQueue,
            units: units.map(u => ({
                id: u.id, name: u.name, type: u.type, friendly: u.friendly, country: u.country,
                hp: u.hp, organization: u.organization, morale: u.morale,
                strength: u.strength, readiness: u.readiness, supply: u.supply,
                attack: u.attack, defense: u.defense, speed: u.speed,
                state: u.state, kills: u.kills, experience: u.experience,
                entrenchment: u.entrenchment,
                pos: u.object.position.toArray()
            })),
            cityManager,
            supplyLines,
            wars
        };
        localStorage.setItem('worldWarSaveV2', JSON.stringify(saveData));
    } catch (e) { /* silent fail */ }
}

function loadCampaign() {
    try {
        const raw = localStorage.getItem('worldWarSaveV2');
        if (!raw) return;
        const data = JSON.parse(raw);
        money = data.money || money;
        oil = data.oil || oil;
        steel = data.steel || steel;
        food = data.food || food;
        manpower = data.manpower || manpower;
        political = data.political || political;
        stability = data.stability || stability;
        tax = data.tax || tax;
        construction = data.construction || construction;
        intel = data.intel || intel;
        spy = data.spy || spy;
        counterIntel = data.counterIntel || counterIntel;
        if (data.factories) Object.assign(factories, data.factories);
        if (data.diplomacy) Object.assign(diplomacy, data.diplomacy);
        if (data.production) Object.assign(production, data.production);
        if (data.tech) Object.assign(tech, data.tech);
        if (data.year) year = data.year;
        if (data.month) month = data.month;
        if (data.day) day = data.day;
        if (data.currentCountry) currentCountry = data.currentCountry;
        if (data.buildingQueue) buildingQueue.push(...data.buildingQueue);
        if (data.cityManager) Object.assign(cityManager, data.cityManager);
        if (data.supplyLines) supplyLines.push(...data.supplyLines);
        if (data.wars) wars.push(...data.wars);
        if (data.units) {
            for (let i = 0; i < data.units.length && i < units.length; i++) {
                const d = data.units[i];
                const u = units[i];
                if (u && d.pos) {
                    u.object.position.fromArray(d.pos);
                }
            }
        }
    } catch (e) { /* silent fail */ }
}

/* =========================================================
   MOVEMENT & AI
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
        if (unit.type === "ARTILLERY") consumption = 0.5;
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
    
    // Update supply lines
    updateSupplyLines(dt);
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
    processAI(dt, units, nation, diplomacy);
}

/* =========================================================
   UI FUNCTIONS
   ========================================================== */

function setupUI() {
    // Panel buttons
    document.querySelectorAll('.panel-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.panel-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const panel = btn.dataset.panel;
            if (panel === 'overview') openPanel('overview');
            else if (panel === 'army') openPanel('army');
            else if (panel === 'economy') openPanel('economy');
            else if (panel === 'production') openPanel('production');
            else if (panel === 'research') openPanel('research');
            else if (panel === 'diplomacy') openPanel('diplomacy');
            else if (panel === 'intel') openPanel('intel');
            else if (panel === 'city') openPanel('city');
            else if (panel === 'supply') openPanel('supply');
            else if (panel === 'settings') openPanel('settings');
        });
    });

    // Close panel
    $('closePanel').addEventListener('click', () => { $('mainPanel').classList.remove('open'); });
    $('closeUnit').addEventListener('click', () => {
        $('unitPanel').classList.remove('open');
        if (selectedUnit) deselectUnit();
    });

    // Unit commands
    $('moveCommand').addEventListener('click', () => {
        if (!selectedUnit) return;
        moveMode = !moveMode;
        attackMode = false;
        $('moveCommand').style.borderColor = moveMode ? 'var(--accent)' : 'var(--line)';
        $('attackCommand').style.borderColor = 'var(--line)';
        toast(moveMode ? 'Click on map to move' : 'Move mode off');
    });

    $('attackCommand').addEventListener('click', () => {
        if (!selectedUnit) return;
        attackMode = !attackMode;
        moveMode = false;
        $('attackCommand').style.borderColor = attackMode ? 'var(--red)' : 'var(--line)';
        $('moveCommand').style.borderColor = 'var(--line)';
        toast(attackMode ? 'Click on map to attack' : 'Attack mode off');
    });

    $('defendCommand').addEventListener('click', () => {
        if (!selectedUnit) return;
        selectedUnit.state = 'DEFENDING';
        selectedUnit.entrenchment = Math.min(100, selectedUnit.entrenchment + 20);
        toast(`${selectedUnit.name} defending`);
        updateUnitPanel();
    });

    $('holdCommand').addEventListener('click', () => {
        if (!selectedUnit) return;
        selectedUnit.state = 'HOLDING';
        selectedUnit.destination = null;
        toast(`${selectedUnit.name} holding position`);
        updateUnitPanel();
    });

    $('retreatCommand').addEventListener('click', () => {
        if (!selectedUnit) return;
        const retreatPos = selectedUnit.object.position.clone();
        retreatPos.x += (Math.random() - 0.5) * 30;
        retreatPos.z += (Math.random() - 0.5) * 30;
        selectedUnit.destination = retreatPos;
        selectedUnit.state = 'RETREATING';
        toast(`${selectedUnit.name} retreating`);
        updateUnitPanel();
    });

    $('airstrikeCommand').addEventListener('click', () => {
        if (!selectedUnit || selectedUnit.type !== 'AIR') { toast('Select an air unit'); return; }
        const targets = units.filter(u => !u.friendly && u.state !== 'DESTROYED');
        if (!targets.length) { toast('No enemy targets'); return; }
        const target = targets[0];
        executeAirstrike(selectedUnit, target);
    });

    // Quick actions
    $('quickFactory').addEventListener('click', quickBuildFactory);
    $('quickReinforce').addEventListener('click', quickReinforce);

    // Date controls
    $('pauseBtn').addEventListener('click', () => {
        paused = !paused;
        $('pauseBtn').textContent = paused ? '▶' : '⏸';
        toast(paused ? 'Paused' : 'Resumed');
    });

    $('speedBtn').addEventListener('click', () => {
        if (speed === 1) speed = 2;
        else if (speed === 2) speed = 4;
        else speed = 1;
        $('speedBtn').textContent = `${speed}×`;
        toast(`Speed: ${speed}×`);
    });

    // Camera controls
    $('zoomIn').addEventListener('click', () => { camera.position.multiplyScalar(0.85); controls.update(); });
    $('zoomOut').addEventListener('click', () => { camera.position.multiplyScalar(1.15); controls.update(); });
    $('resetCamera').addEventListener('click', () => {
        camera.position.set(80, 80, 120);
        controls.target.set(0, 0, 0);
        controls.update();
        clearStateHighlights();
        while(highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);
        highlightedCountry = null;
        $("selectedCountryDisplay").textContent = '';
        toast('Camera reset');
    });
    $('topDown').addEventListener('click', () => {
        camera.position.set(0, 120, 0.1);
        controls.target.set(0, 0, 0);
        controls.update();
        toast('Top view');
    });
    $('zoomToCountry').addEventListener('click', () => {
        if (highlightedCountry) { zoomToCountry(highlightedCountry); }
        else { toast('Select a country first'); }
    });

    // Country modal
    $('countryDisplay').addEventListener('click', () => { 
        populateCountryGrid();
        $('countryModal').classList.add('open'); 
    });
    $('closeCountryModal').addEventListener('click', () => { $('countryModal').classList.remove('open'); });

    // Country info modal
    $('closeCountryInfo').addEventListener('click', () => { $('countryInfoModal').classList.remove('open'); });
    $('closeCityInfo').addEventListener('click', () => { $('cityInfoModal').classList.remove('open'); });

    // Tutorial
    let tutorialStep = 0;
    const tutorialTexts = [
        { title: 'Welcome to V2, Commander', text: 'Click any country to zoom in and manage cities. Train units, build supply lines, and conquer the world!' },
        { title: 'Manage Cities', text: 'Click on a city to view its details. You can train units, build buildings, and manage production.' },
        { title: 'Supply Lines', text: 'Supply lines connect your cities to your units. Make sure your units are always in supply!' },
        { title: 'Victory Conditions', text: 'Conquer territories, build your economy, research technology, or form alliances to achieve victory!' }
    ];
    $('tutorialNext').addEventListener('click', () => {
        tutorialStep++;
        if (tutorialStep >= tutorialTexts.length) { $('tutorial').style.display = 'none'; return; }
        $('tutorialTitle').textContent = tutorialTexts[tutorialStep].title;
        $('tutorialText').textContent = tutorialTexts[tutorialStep].text;
        $('tutorialNext').textContent = tutorialStep === tutorialTexts.length - 1 ? 'START' : 'NEXT';
    });

    // Minimap click
    document.getElementById('miniMapCanvas').addEventListener('click', handleMinimapClick);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    });
}

function populateCountryGrid() {
    const grid = $('countryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(nation).forEach(key => {
        const data = nation[key];
        const card = document.createElement('button');
        card.className = 'country-card';
        card.dataset.country = key;
        card.innerHTML = `
            <span>${data.flag}</span>
            <b>${data.name}</b>
            <small>${data.region} • ${data.states?.length || 0} States</small>
        `;
        card.addEventListener('click', () => {
            currentCountry = key;
            $('countryModal').classList.remove('open');
            $('countryFlag').textContent = data.flag;
            $('countryName').textContent = data.name;
            zoomToCountry(key);
            highlightCountry(key);
            toast(`Selected ${data.name}`);
        });
        grid.appendChild(card);
    });
}

function openPanel(panel) {
    const mainPanel = $('mainPanel');
    const panelKicker = $('panelKicker');
    const panelTitle = $('panelTitle');
    const panelContent = $('panelContent');

    mainPanel.classList.add('open');

    if (panel === 'overview') {
        panelKicker.textContent = 'STRATEGIC COMMAND V2';
        panelTitle.textContent = 'World Overview';
        const totalUnits = units.filter(u => u.state !== 'DESTROYED').length;
        const totalCities = Object.keys(cityManager).length;
        const totalSupplyLines = supplyLines.length;
        panelContent.innerHTML = `
            <div class="info-card"><h3>🌍 Global Status</h3>
                <div class="stat-row"><span>Countries</span><b>${Object.keys(nation).length}</b></div>
                <div class="stat-row"><span>Active Units</span><b>${totalUnits}</b></div>
                <div class="stat-row"><span>Total Cities</span><b>${totalCities}</b></div>
                <div class="stat-row"><span>Supply Lines</span><b>${totalSupplyLines}</b></div>
                <div class="stat-row"><span>Weather</span><b>${weather}</b></div>
                <div class="stat-row"><span>War Status</span><b style="color:${wars.length > 0 ? 'var(--red)' : 'var(--green)'}">${wars.length > 0 ? '⚔️ AT WAR' : '☮️ PEACE'}</b></div>
            </div>
            <div class="info-card"><h3>🎯 Selected Country</h3>
                ${highlightedCountry ? `
                    <div class="stat-row"><span>Country</span><b>${nation[highlightedCountry].flag} ${nation[highlightedCountry].name}</b></div>
                    <div class="stat-row"><span>Continent</span><b>${nation[highlightedCountry].continent}</b></div>
                    <div class="stat-row"><span>Capital</span><b>${nation[highlightedCountry].capital}</b></div>
                    <div class="stat-row"><span>States</span><b>${nation[highlightedCountry].states?.length || 0}</b></div>
                    <div class="stat-row"><span>Cities</span><b>${nation[highlightedCountry].cities?.length || 0}</b></div>
                ` : '<p style="color:var(--muted);font-size:11px;">No country selected. Click a country on the map.</p>'}
            </div>
            <button class="action-btn" onclick="window.changeWeather()">🌤️ Change Weather</button>
            <button class="action-btn info" onclick="window.setMapLayer('MILITARY')">🗺️ Military Map</button>
            <button class="action-btn" onclick="window.setMapLayer('TERRAIN')">⛰️ Terrain Map</button>
            <button class="action-btn success" onclick="window.openCityPanel('${highlightedCountry || currentCountry}')">🏙️ Manage Cities</button>
        `;
    } else if (panel === 'army') {
        panelKicker.textContent = 'MILITARY FORCES';
        panelTitle.textContent = 'Army Overview';
        const friendlyUnits = units.filter(u => u.friendly && u.state !== 'DESTROYED');
        const enemyUnits = units.filter(u => !u.friendly && u.state !== 'DESTROYED');
        panelContent.innerHTML = `
            <div class="info-card"><h3>🟢 Allied Forces (${friendlyUnits.length})</h3>
                ${friendlyUnits.map(u => `
                    <div class="stat-row">
                        <span>${u.type} ${u.name}</span>
                        <b style="color:${u.hp > 50 ? 'var(--green)' : 'var(--red)'}">HP: ${Math.round(u.hp)}%</b>
                        <span style="color:var(--muted);font-size:9px;">${u.state}</span>
                    </div>
                `).join('') || '<p style="color:var(--muted);font-size:11px;">No friendly units</p>'}
            </div>
            <div class="info-card"><h3>🔴 Enemy Forces (${enemyUnits.length})</h3>
                ${enemyUnits.map(u => `
                    <div class="stat-row">
                        <span>${u.type} ${u.name}</span>
                        <b style="color:${u.hp > 50 ? 'var(--green)' : 'var(--red)'}">HP: ${Math.round(u.hp)}%</b>
                        <span style="color:var(--muted);font-size:9px;">${u.state}</span>
                    </div>
                `).join('') || '<p style="color:var(--muted);font-size:11px;">No enemy units</p>'}
            </div>
            <button class="action-btn success" onclick="window.quickReinforce()">🪖 Reinforce All</button>
            <button class="action-btn info" onclick="window.openTrainingPanel()">🪖 Train Units</button>
        `;
    } else if (panel === 'economy') {
        panelKicker.textContent = 'ECONOMIC REPORT';
        panelTitle.textContent = 'Economy Overview';
        panelContent.innerHTML = `
            <div class="info-card"><h3>💰 Resources</h3>
                <div class="stat-row"><span>Money</span><b>$${Math.round(money)}</b></div>
                <div class="stat-row"><span>Oil</span><b>${Math.round(oil)}</b></div>
                <div class="stat-row"><span>Steel</span><b>${Math.round(steel)}</b></div>
                <div class="stat-row"><span>Food</span><b>${Math.round(food)}</b></div>
                <div class="stat-row"><span>Manpower</span><b>${Math.round(manpower)}</b></div>
            </div>
            <div class="info-card"><h3>🏭 Factories</h3>
                <div class="stat-row"><span>Civilian</span><b>${factories.civilian}</b></div>
                <div class="stat-row"><span>Military</span><b>${factories.military}</b></div>
                <div class="stat-row"><span>Naval</span><b>${factories.naval}</b></div>
                <div class="stat-row"><span>Construction</span><b>${Math.round(construction)}</b></div>
            </div>
            <div class="info-card"><h3>📊 Stats</h3>
                <div class="stat-row"><span>Stability</span><b style="color:${stability > 60 ? 'var(--green)' : 'var(--red)'}">${Math.round(stability)}%</b></div>
                <div class="stat-row"><span>Political Power</span><b>${Math.round(political)}</b></div>
                <div class="stat-row"><span>Tax Rate</span><b>${tax}%</b></div>
            </div>
            <button class="action-btn success" onclick="window.quickBuildFactory()">🏭 Build Military Factory ($500)</button>
        `;
    } else if (panel === 'production') {
        panelKicker.textContent = 'WAR PRODUCTION';
        panelTitle.textContent = 'Production Lines';
        panelContent.innerHTML = `
            ${Object.keys(production).map(key => {
                const p = production[key];
                return `<div class="info-card"><h3>${key} (${p.name})</h3>
                    <div class="stat-row"><span>Progress</span><b>${Math.round(p.progress)}%</b></div>
                    <div class="stat-row"><span>Factories</span><b>${p.factories}</b></div>
                    <div class="stat-row"><span>Efficiency</span><b>${Math.round(p.efficiency)}%</b></div>
                    <button class="action-btn" onclick="window.assignFactory('${key}')">➕ Assign Factory</button>
                </div>`;
            }).join('')}
            <div class="info-card"><h3>📦 Production Queue</h3><p style="color:var(--muted);font-size:11px;">Output is automatically applied to units.</p></div>
        `;
    } else if (panel === 'research') {
        panelKicker.textContent = 'RESEARCH & DEVELOPMENT';
        panelTitle.textContent = 'Technology Tree';
        panelContent.innerHTML = `
            ${Object.keys(tech).map(key => {
                const t = tech[key];
                return `<div class="info-card"><h3>${t.name}</h3>
                    <div class="stat-row"><span>Progress</span><b>${Math.round(t.progress)}%</b></div>
                    <div class="stat-row"><span>Status</span><b style="color:${t.completed ? 'var(--green)' : t.active ? 'var(--accent)' : 'var(--muted)'}">${t.completed ? '✅ Completed' : t.active ? '🔄 Researching' : '⏸ Inactive'}</b></div>
                    <div class="stat-row"><span>Bonus</span><b>${t.bonus}</b></div>
                    ${!t.completed && !t.active ? `<button class="action-btn" onclick="window.startResearch('${key}')">🔬 Start Research (10 PP)</button>` : ''}
                </div>`;
            }).join('')}
        `;
    } else if (panel === 'diplomacy') {
        panelKicker.textContent = 'FOREIGN RELATIONS';
        panelTitle.textContent = 'Diplomacy';
        panelContent.innerHTML = `
            ${Object.keys(nation).filter(k => k !== currentCountry).map(k => {
                const val = diplomacy[k] || 0;
                const state = getDiplomacyState(val);
                return `<div class="info-card"><h3>${nation[k].flag} ${nation[k].name}</h3>
                    <div class="stat-row"><span>Relations</span><b style="color:${state.color}">${state.name} (${val})</b></div>
                    <button class="action-btn ${val < -50 ? 'danger' : 'success'}" onclick="window.improveDiplomacy('${k}')">${val < -50 ? '⚔️ Declare War' : '🤝 Improve Relations'}</button>
                    ${val > 50 ? `<button class="action-btn info" onclick="window.formAlliance('${currentCountry}','${k}')">🤝 Form Alliance</button>` : ''}
                </div>`;
            }).join('')}
        `;
    } else if (panel === 'intel') {
        panelKicker.textContent = 'INTELLIGENCE REPORT';
        panelTitle.textContent = 'Intelligence';
        panelContent.innerHTML = `
            <div class="info-card"><h3>🕵️ Intel Status</h3>
                <div class="stat-row"><span>Intel Level</span><b>${Math.round(intel)}%</b></div>
                <div class="stat-row"><span>Spy Network</span><b>${Math.round(spy)}%</b></div>
                <div class="stat-row"><span>Counter-Intel</span><b>${Math.round(counterIntel)}%</b></div>
            </div>
            <button class="action-btn" onclick="window.runRecon()">🔭 Run Recon ($250)</button>
            <button class="action-btn" onclick="window.expandSpyNetwork()">🕵️ Expand Spy Network ($400)</button>
            <button class="action-btn" onclick="window.improveCounterIntel()">🛡️ Improve Counter-Intel ($350)</button>
            <div class="info-card"><h3>📋 Battle Log</h3>
                ${battleLog.slice(0, 5).map(log => `<div style="font-size:10px;color:var(--muted);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">[${log.time}] ${log.message}</div>`).join('') || '<p style="color:var(--muted);font-size:11px;">No battles yet</p>'}
            </div>
        `;
    } else if (panel === 'city') {
        panelKicker.textContent = 'CITY MANAGEMENT';
        panelTitle.textContent = 'Manage Cities';
        const countryKey = highlightedCountry || currentCountry;
        const data = nation[countryKey];
        if (!data || !data.cities) {
            panelContent.innerHTML = `<p style="color:var(--muted);font-size:11px;">Select a country first.</p>`;
        } else {
            panelContent.innerHTML = `
                <div class="info-card"><h3>🏙️ Cities of ${data.flag} ${data.name}</h3>
                    ${data.cities.map(city => {
                        const cityData = getCity(city.id);
                        return `<div class="city-detail-card">
                            <h4>${city.name}</h4>
                            <div class="stat-row"><span>Population</span><b>${formatNumber(city.population)}</b></div>
                            <div class="stat-row"><span>Industry</span><b>${cityData?.industry || 0}</b></div>
                            <div class="stat-row"><span>Agriculture</span><b>${cityData?.agriculture || 0}</b></div>
                            <div class="stat-row"><span>Fortification</span><b>${cityData?.fortification || 0}%</b></div>
                            <div class="stat-row"><span>Supply</span><b style="color:${cityData?.supply > 50 ? 'var(--green)' : 'var(--red)'}">${cityData?.supply || 0}%</b></div>
                            <button class="action-btn info" onclick="window.openCityDetails('${city.id}')">📋 View Details</button>
                            <button class="action-btn success" onclick="window.trainUnitFromCity('${city.id}','INFANTRY')">🪖 Train Infantry</button>
                            <button class="action-btn" onclick="window.trainUnitFromCity('${city.id}','TANK')">🔩 Train Tank</button>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }
    } else if (panel === 'supply') {
        panelKicker.textContent = 'SUPPLY LINES';
        panelTitle.textContent = 'Logistics Overview';
        const totalSupplyLines = supplyLines.length;
        const activeLines = supplyLines.filter(s => s.status === 'ACTIVE').length;
        panelContent.innerHTML = `
            <div class="info-card"><h3>📦 Supply Network</h3>
                <div class="stat-row"><span>Total Supply Lines</span><b>${totalSupplyLines}</b></div>
                <div class="stat-row"><span>Active Lines</span><b style="color:var(--green)">${activeLines}</b></div>
                <div class="stat-row"><span>Inactive Lines</span><b style="color:var(--red)">${totalSupplyLines - activeLines}</b></div>
            </div>
            ${supplyLines.map(line => {
                const status = line.status;
                const statusColor = status === 'ACTIVE' ? 'var(--green)' : 'var(--red)';
                return `<div class="info-card">
                    <h4>${line.from} → ${line.to}</h4>
                    <div class="stat-row"><span>Status</span><b style="color:${statusColor}">${status}</b></div>
                    <div class="stat-row"><span>Capacity</span><b>${line.amount || 50}</b></div>
                </div>`;
            }).join('') || '<p style="color:var(--muted);font-size:11px;">No supply lines established.</p>'}
        `;
    } else if (panel === 'settings') {
        panelKicker.textContent = 'SYSTEM SETTINGS V2';
        panelTitle.textContent = 'Settings';
        panelContent.innerHTML = `
            <div class="info-card"><h3>⚙️ Game Settings</h3>
                <div class="stat-row"><span>Current Country</span><b>${nation[currentCountry]?.flag} ${nation[currentCountry]?.name}</b></div>
                <div class="stat-row"><span>Speed</span><b>${speed}×</b></div>
                <div class="stat-row"><span>Status</span><b>${paused ? '⏸ Paused' : '▶ Running'}</b></div>
                <div class="stat-row"><span>AI Difficulty</span><b>${getAIDifficulty()}</b></div>
            </div>
            <button class="action-btn" onclick="window.changeWeather()">🌤️ Change Weather</button>
            <button class="action-btn danger" onclick="if(confirm('Reset everything?')){localStorage.removeItem('worldWarSaveV2');location.reload();}">🗑️ Reset Game</button>
            <div class="info-card"><h3>💾 Save/Load</h3>
                <button class="action-btn" onclick="window.autosave();toast('Game saved!')">💾 Save Game</button>
                <button class="action-btn" onclick="window.loadCampaign();toast('Game loaded!');updateAllUI();">📂 Load Game</button>
            </div>
            <div class="info-card"><h3>🎮 Keyboard Shortcuts</h3>
                <div class="stat-row"><span>M</span><b>Move</b></div>
                <div class="stat-row"><span>A</span><b>Attack</b></div>
                <div class="stat-row"><span>D</span><b>Defend</b></div>
                <div class="stat-row"><span>H</span><b>Hold</b></div>
                <div class="stat-row"><span>R</span><b>Retreat</b></div>
                <div class="stat-row"><span>Space</span><b>Pause</b></div>
            </div>
        `;
    }
}

function openCityDetails(cityId) {
    const cityData = getCity(cityId);
    if (!cityData) { toast("City not found"); return; }
    
    const modal = $("cityInfoModal");
    const title = $("infoCityTitle");
    const kicker = $("infoCityKicker");
    const content = $("infoCityContent");

    if (title) title.textContent = `🏙️ ${cityData.name}`;
    if (kicker) kicker.textContent = `Country: ${cityData.country}`;
    
    if (content) {
        content.innerHTML = `
            <div class="city-detail-card">
                <h4>📊 City Statistics</h4>
                <div class="stat-row"><span>Population</span><b>${formatNumber(cityData.population)}</b></div>
                <div class="stat-row"><span>Industry Level</span><b>${cityData.industry}</b></div>
                <div class="stat-row"><span>Agriculture Level</span><b>${cityData.agriculture}</b></div>
                <div class="stat-row"><span>Fortification</span><b>${cityData.fortification}%</b></div>
                <div class="stat-row"><span>Supply Status</span><b style="color:${cityData.supply > 50 ? 'var(--green)' : 'var(--red)'}">${cityData.supply}%</b></div>
            </div>
            <div class="city-detail-card">
                <h4>🏗️ Buildings</h4>
                ${cityData.buildings?.length ? cityData.buildings.map(b => 
                    `<span class="city-tag">${b}</span>`
                ).join('') : '<p style="color:var(--muted);font-size:11px;">No buildings</p>'}
            </div>
            <div class="city-detail-card">
                <h4>🪖 Garrison</h4>
                ${cityData.garrison ? 
                    `<div class="stat-row"><span>Unit</span><b>${cityData.garrison}</b></div>` :
                    '<p style="color:var(--muted);font-size:11px;">No garrison</p>'
                }
            </div>
            <button class="action-btn success" onclick="window.trainUnitFromCity('${cityId}','INFANTRY')">🪖 Train Infantry</button>
            <button class="action-btn" onclick="window.trainUnitFromCity('${cityId}','TANK')">🔩 Train Tank</button>
            <button class="action-btn info" onclick="window.trainUnitFromCity('${cityId}','ARTILLERY')">💥 Train Artillery</button>
            <button class="action-btn" onclick="window.trainUnitFromCity('${cityId}','AIR')">✈️ Train Aircraft</button>
        `;
    }

    modal.classList.add('open');
}

function updateUnitPanel() {
    const panel = $('unitPanel');
    if (!selectedUnit || selectedUnit.state === 'DESTROYED') {
        panel.classList.remove('open');
        return;
    }
    panel.classList.add('open');
    const unit = selectedUnit;
    $('selectedUnitType').textContent = unit.type;
    $('selectedUnitName').textContent = unit.name;
    $('unitLocation').textContent = `📍 Position: (${Math.round(unit.object.position.x)}, ${Math.round(unit.object.position.z)})`;
    $('unitStats').innerHTML = `
        <div class="unit-stat"><span>Health</span><div class="progress"><i style="width:${(unit.hp/unit.maxHp)*100}%;background:${unit.hp > 50 ? 'var(--green)' : 'var(--red)'}"></i></div><b>${Math.round(unit.hp)}%</b></div>
        <div class="unit-stat"><span>Organization</span><div class="progress"><i style="width:${(unit.organization/unit.maxOrganization)*100}%"></i></div><b>${Math.round(unit.organization)}%</b></div>
        <div class="unit-stat"><span>Morale</span><div class="progress"><i style="width:${unit.morale}%"></i></div><b>${Math.round(unit.morale)}%</b></div>
        <div class="unit-stat"><span>Strength</span><div class="progress"><i style="width:${(unit.strength/unit.maxStrength)*100}%"></i></div><b>${Math.round(unit.strength)}%</b></div>
        <div class="unit-stat"><span>Supply</span><div class="progress"><i style="width:${unit.supply}%;background:${unit.supply > 40 ? 'var(--green)' : 'var(--red)'}"></i></div><b>${Math.round(unit.supply)}%</b></div>
        <div class="unit-stat"><span>Readiness</span><div class="progress"><i style="width:${unit.readiness}%"></i></div><b>${Math.round(unit.readiness)}%</b></div>
        <div class="unit-stat"><span>Status</span><span style="color:var(--accent);font-weight:700;">${unit.state}</span><span></span></div>
        <div class="unit-stat"><span>Kills</span><span></span><b>${unit.kills}</b></div>
        <div class="unit-stat"><span>Experience</span><div class="progress"><i style="width:${unit.experience}%;background:var(--gold);"></i></div><b>${Math.round(unit.experience)}%</b></div>
    `;
}

function selectUnit(unit) {
    if (selectedUnit) deselectUnit();
    selectedUnit = unit;
    unit.selected = true;
    if (unit.object.children.length > 0) {
        const highlight = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.8, 16),
            new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })
        );
        highlight.rotation.x = -Math.PI / 2;
        highlight.position.set(0, 0.1, 0);
        highlight.name = 'selectionRing';
        unit.object.add(highlight);
    }
    updateUnitPanel();
    toast(`Selected ${unit.name}`);
}

function deselectUnit() {
    if (selectedUnit) {
        const ring = selectedUnit.object.getObjectByName('selectionRing');
        if (ring) selectedUnit.object.remove(ring);
        selectedUnit.selected = false;
        selectedUnit = null;
    }
    moveMode = false;
    attackMode = false;
    $('moveCommand').style.borderColor = 'var(--line)';
    $('attackCommand').style.borderColor = 'var(--line)';
    $('unitPanel').classList.remove('open');
}

function updateAllUI() {
    $('money').textContent = Math.round(money);
    $('oil').textContent = Math.round(oil);
    $('steel').textContent = Math.round(steel);
    $('food').textContent = Math.round(food);
    $('manpower').textContent = Math.round(manpower);
    
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    $('gameDate').textContent = `${year} • ${monthNames[month-1]} ${String(day).padStart(2,'0')}`;
    
    // Update war status
    const warStatus = $('warStatus');
    if (wars.length > 0) {
        warStatus.style.display = 'inline-block';
        warStatus.textContent = `⚔️ WAR (${wars.length})`;
    } else {
        warStatus.style.display = 'none';
    }
    
    // Update supply status
    const supplyStatus = $('supplyStatus');
    const avgSupply = units.filter(u => u.state !== 'DESTROYED').reduce((sum, u) => sum + u.supply, 0) / 
                      Math.max(1, units.filter(u => u.state !== 'DESTROYED').length);
    supplyStatus.textContent = `📦 Supply: ${Math.round(avgSupply)}%`;
    supplyStatus.style.color = avgSupply > 50 ? 'var(--green)' : 'var(--red)';
    
    if (selectedUnit) updateUnitPanel();
}

function toast(message) {
    const toastEl = $('toast');
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(() => { toastEl.classList.remove('show'); }, 2500);
}

/* =========================================================
   EXPOSE FUNCTIONS TO WINDOW
   ========================================================== */

window.zoomToCountry = zoomToCountry;
window.highlightCountry = highlightCountry;
window.changeWeather = changeWeather;
window.setMapLayer = setMapLayer;
window.startResearch = startResearch;
window.assignFactory = assignFactory;
window.quickBuildFactory = quickBuildFactory;
window.quickReinforce = quickReinforce;
window.improveDiplomacy = improveDiplomacy;
window.runRecon = runRecon;
window.expandSpyNetwork = expandSpyNetwork;
window.improveCounterIntel = improveCounterIntel;
window.autosave = autosave;
window.loadCampaign = loadCampaign;
window.toast = toast;
window.buildBuilding = buildBuilding;
window.trainUnitFromCity = trainUnitFromCity;
window.openCityDetails = openCityDetails;
window.openCityPanel = (country) => {
    highlightedCountry = country;
    openPanel('city');
};
window.openTrainingPanel = () => openPanel('army');
window.formAlliance = (c1, c2) => {
    if (formAlliance(c1, c2)) {
        toast(`🤝 Alliance formed between ${nation[c1].name} and ${nation[c2].name}`);
        addNotification(`🤝 Alliance formed!`, NOTIFICATION_TYPES.SUCCESS);
        openPanel('diplomacy');
    } else {
        toast("Failed to form alliance");
    }
};

/* =========================================================
   GAME LOOP
   ========================================================== */

function loop(timestamp) {
    const dt = Math.min(clock.getDelta(), 0.05);
    
    if (!paused) {
        lastDateTick += dt * speed;
        if (lastDateTick >= 0.5) {
            lastDateTick = 0;
            day++;
            if (day > 30) { day = 1; month++;
                if (month > 12) { month = 1; year++; }
            }
            updateAllUI();
            autosaveTimer += 0.5;
            if (autosaveTimer >= 30) { autosaveTimer = 0; autosave(); }
        }

        // Process building queue
        for (let i = buildingQueue.length - 1; i >= 0; i--) {
            const item = buildingQueue[i];
            item.progress += dt * speed;
            if (item.progress >= item.totalTime) {
                const building = BUILDINGS[item.buildingId];
                if (building) {
                    for (const [resource, amount] of Object.entries(building.production)) {
                        if (resource === 'money') money += amount * 10;
                        else if (resource === 'oil') oil += amount * 5;
                        else if (resource === 'steel') steel += amount * 5;
                        else if (resource === 'food') food += amount * 5;
                        else if (resource === 'manpower') manpower += amount * 10;
                    }
                    toast(`✅ ${building.name} completed!`);
                    addNotification(`✅ ${building.name} completed!`, NOTIFICATION_TYPES.SUCCESS);
                }
                buildingQueue.splice(i, 1);
                updateAllUI();
            }
        }

        // Process training queue
        processTraining(dt, units, nation);

        updateEconomy(dt);
        updateProduction(dt);
        updateResearch(dt);
        updateUnitMovement(dt);
        updateSupply(dt);
        updateRecovery(dt);
        enemyAI(dt);

        // Update war scores
        wars.forEach((war, index) => {
            updateWarScore(index, units);
        });

        // Check victory conditions
        const victory = checkVictoryConditions(units, nation, diplomacy, wars);
        if (victory) {
            const victoryScreen = $('victoryScreen');
            victoryScreen.style.display = 'grid';
            $('victoryIcon').textContent = victory.icon || '🏆';
            $('victoryTitle').textContent = victory.title || 'VICTORY!';
            $('victoryMessage').textContent = victory.message || 'You have conquered the world!';
            paused = true;
            addNotification(`🎉 ${victory.title}`, NOTIFICATION_TYPES.SUCCESS);
        }

        // Update FX particles
        for (let i = fxGroup.children.length - 1; i >= 0; i--) {
            const fx = fxGroup.children[i];
            fx.userData.life -= dt;
            fx.position.add(fx.userData.velocity.clone().multiplyScalar(dt));
            fx.material.opacity = Math.max(0, fx.userData.life * 2);
            if (fx.userData.life <= 0) { fxGroup.remove(fx); }
        }

        // Propeller animation
        for (const unit of units) {
            if (unit.type === 'AIR' && unit.object.userData.propeller) {
                unit.object.userData.propeller.rotation.z += dt * 30 * speed;
            }
        }

        // Update minimap
        updateMinimap(units, nation);
    }

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(loop);
}

/* =========================================================
   START
   ========================================================== */

init().catch(error => {
    console.error('Failed to initialize game:', error);
    const status = $("loadingStatus");
    if (status) {
        status.textContent = '❌ Error: ' + error.message;
        status.style.color = 'var(--red)';
    }
});

console.log('🌍 WORLD WAR V2 — Complete!');
console.log('📦 Version: V2.0.0');
console.log('📁 All systems loaded');
console.log('🎮 Click a country to zoom and manage cities!');