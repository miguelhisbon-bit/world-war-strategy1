// =========================================================
// WORLD WAR V2 — COMPLETE FIXED (All in One)
// =========================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// =========================================================
// GAME STATE
// =========================================================

const $ = id => document.getElementById(id);

let scene, camera, renderer, labelRenderer, controls, clock;
let ground, unitGroup, fxGroup, borderGroup, labelGroup, stateGroup, highlightGroup, stateBorderGroup;

let selectedUnit = null;
let moveMode = false;
let attackMode = false;
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
const cityManager = {};
const supplyLines = [];
const buildingQueue = [];
const diplomacy = {};
const alliances = {};
const wars = [];

// ================= NATIONS DATA =================
const nation = {};
const countryColors = {};

const countryDataList = [
    { id: 'BANGLADESH', name: 'Bangladesh', flag: '🇧🇩', color: 0x006a4e, lightColor: 0x00a87a, capital: 'Dhaka', region: 'South Asia', states: ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'], desc: 'Bangladesh is a South Asian country with a rich history.' },
    { id: 'PAKISTAN', name: 'Pakistan', flag: '🇵🇰', color: 0x01411c, lightColor: 0x027a35, capital: 'Islamabad', region: 'South Asia', states: ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit', 'Azad Kashmir', 'Islamabad'], desc: 'Pakistan is a South Asian nation with diverse landscapes.' },
    { id: 'TURKEY', name: 'Turkey', flag: '🇹🇷', color: 0xe30a17, lightColor: 0xff1a2a, capital: 'Ankara', region: 'Eurasia', states: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Konya', 'Adana', 'Gaziantep'], desc: 'Turkey is a transcontinental country bridging Europe and Asia.' },
    { id: 'IRAN', name: 'Iran', flag: '🇮🇷', color: 0x239f40, lightColor: 0x3ad060, capital: 'Tehran', region: 'Middle East', states: ['Tehran', 'Isfahan', 'Khuzestan', 'Fars', 'Razavi', 'East Azerbaijan', 'Mazandaran', 'Gilan'], desc: 'Iran is a Middle Eastern country with ancient history.' },
    { id: 'SAUDI', name: 'Saudi Arabia', flag: '🇸🇦', color: 0x165d31, lightColor: 0x229544, capital: 'Riyadh', region: 'Middle East', states: ['Riyadh', 'Makkah', 'Madinah', 'Eastern', 'Asir', 'Tabuk', 'Jazan', 'Najran'], desc: 'Saudi Arabia is the largest country in the Middle East.' },
    { id: 'EGYPT', name: 'Egypt', flag: '🇪🇬', color: 0xce1126, lightColor: 0xff1a33, capital: 'Cairo', region: 'North Africa', states: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Port Said', 'Suez', 'Minya'], desc: 'Egypt spans North Africa and the Middle East.' },
    { id: 'PALESTINE', name: 'Palestine', flag: '🇵🇸', color: 0x007a3d, lightColor: 0x00b85a, capital: 'Jerusalem', region: 'Middle East', states: ['West Bank', 'Gaza Strip', 'Jerusalem', 'Ramallah', 'Hebron', 'Nablus'], desc: 'Palestine is a historic region in the Middle East.' },
    { id: 'INDONESIA', name: 'Indonesia', flag: '🇮🇩', color: 0xce1126, lightColor: 0xff1a33, capital: 'Jakarta', region: 'Southeast Asia', states: ['Java', 'Sumatra', 'Kalimantan', 'Sulawesi', 'Papua', 'Bali', 'Lombok', 'Flores'], desc: 'Indonesia is the world\'s largest archipelago nation.' },
    { id: 'AFGHANISTAN', name: 'Afghanistan', flag: '🇦🇫', color: 0x000000, lightColor: 0x333333, capital: 'Kabul', region: 'Central Asia', states: ['Kabul', 'Kandahar', 'Herat', 'Mazar', 'Nangarhar', 'Balkh', 'Ghazni', 'Helmand'], desc: 'Afghanistan is a landlocked country at the crossroads of Central and South Asia.' },
    { id: 'INDIA', name: 'India', flag: '🇮🇳', color: 0xff9933, lightColor: 0xffbb55, capital: 'New Delhi', region: 'South Asia', states: ['UP', 'Maharashtra', 'Tamil Nadu', 'Gujarat', 'Karnataka', 'Rajasthan', 'West Bengal', 'Punjab'], desc: 'India is the world\'s largest democracy.' },
    { id: 'USA', name: 'United States', flag: '🇺🇸', color: 0x2a5c8a, lightColor: 0x4a8cc0, capital: 'Washington DC', region: 'North America', states: ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia'], desc: 'The United States is a global superpower.' },
    { id: 'CHINA', name: 'China', flag: '🇨🇳', color: 0xcc2222, lightColor: 0xff3333, capital: 'Beijing', region: 'East Asia', states: ['Guangdong', 'Shandong', 'Henan', 'Sichuan', 'Jiangsu', 'Hebei', 'Hunan', 'Anhui'], desc: 'China is the world\'s most populous country.' },
    { id: 'RUSSIA', name: 'Russia', flag: '🇷🇺', color: 0x003399, lightColor: 0x0055cc, capital: 'Moscow', region: 'Eurasia', states: ['Moscow', 'St Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny', 'Samara', 'Omsk'], desc: 'Russia is the world\'s largest country by area.' },
    { id: 'UK', name: 'United Kingdom', flag: '🇬🇧', color: 0x8a2a2a, lightColor: 0xcc4040, capital: 'London', region: 'Europe', states: ['England', 'Scotland', 'Wales', 'Northern Ireland'], desc: 'The United Kingdom is a European island nation.' },
    { id: 'FRANCE', name: 'France', flag: '🇫🇷', color: 0x2a5a8a, lightColor: 0x4a88c0, capital: 'Paris', region: 'Europe', states: ['Île-de-France', 'Provence', 'Brittany', 'Normandy', 'Alsace', 'Aquitaine', 'Lyon', 'Marseille'], desc: 'France is a European nation with a rich cultural heritage.' },
    { id: 'GERMANY', name: 'Germany', flag: '🇩🇪', color: 0x3a3a3a, lightColor: 0x666666, capital: 'Berlin', region: 'Europe', states: ['Bavaria', 'North Rhine', 'Baden', 'Saxony', 'Hesse', 'Berlin', 'Hamburg', 'Munich'], desc: 'Germany is Europe\'s largest economy.' }
];

countryDataList.forEach(c => {
    nation[c.id] = {
        flag: c.flag,
        name: c.name,
        color: c.color,
        lightColor: c.lightColor,
        capital: c.capital,
        region: c.region,
        states: c.states,
        desc: c.desc,
        cities: c.states.map(s => ({ id: s.toUpperCase(), name: s, population: 1000000 }))
    };
    countryColors[c.id] = c.color;
});

// ================= BUILDINGS =================
const BUILDINGS = {
    FARM: { id: 'FARM', name: 'Farm', icon: '🌾', cost: { money: 200, steel: 50 }, buildTime: 10, production: { food: 5 }, description: 'Produces food' },
    MINE: { id: 'MINE', name: 'Mine', icon: '⛏️', cost: { money: 300, steel: 100 }, buildTime: 12, production: { steel: 3 }, description: 'Extracts steel' },
    OIL_RIG: { id: 'OIL_RIG', name: 'Oil Rig', icon: '🛢️', cost: { money: 400, steel: 150 }, buildTime: 15, production: { oil: 2 }, description: 'Pumps oil' },
    FACTORY: { id: 'FACTORY', name: 'Factory', icon: '🏭', cost: { money: 500, steel: 200 }, buildTime: 20, production: { money: 10 }, description: 'Produces money' },
    BARRACKS: { id: 'BARRACKS', name: 'Barracks', icon: '🪖', cost: { money: 600, steel: 250 }, buildTime: 18, production: { manpower: 20 }, description: 'Trains soldiers' },
    FORT: { id: 'FORT', name: 'Fort', icon: '🏰', cost: { money: 700, steel: 300 }, buildTime: 25, production: { defense: 15 }, description: 'Defensive bonus' },
    AIRFIELD: { id: 'AIRFIELD', name: 'Airfield', icon: '✈️', cost: { money: 800, steel: 350 }, buildTime: 22, production: { air: 2 }, description: 'Air operations' }
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

const mapColors = {
    MILITARY: 0x596b58, POLITICAL: 0x58667d, TERRAIN: 0x52634d,
    SUPPLY: 0x4e6e5a, RESOURCES: 0x75633c, INTEL: 0x5d4c6b
};

// =========================================================
// INITIALIZATION
// =========================================================

async function init() {
    try {
        console.log('🚀 Starting V2...');
        loading(10, "Initializing...");
        setup3D();
        loading(20, "Creating terrain...");
        createTerrain();
        loading(30, "Drawing borders...");
        createCountryBorders();
        loading(40, "Adding states...");
        createStates();
        loading(45, "Creating state borders...");
        createStateBorderData();
        loading(50, "Deploying forces...");
        deployInitialForces();
        loading(55, "Initializing cities...");
        initCities();
        loading(60, "Setting up supply...");
        initSupplyLines();
        loading(70, "Loading save...");
        loadCampaign();
        loading(80, "Initializing AI...");
        loading(85, "Setting up UI...");
        setupUI();
        loading(90, "Initializing minimap...");
        initMinimap();
        loading(95, "Preparing...");
        updateAllUI();
        loading(100, "Ready!");
        autosave();

        setTimeout(() => {
            const loadingScreen = document.getElementById("loadingScreen");
            if (loadingScreen) {
                loadingScreen.classList.add("hidden");
                console.log('✅ Loading screen hidden!');
            }
        }, 650);

        requestAnimationFrame(loop);
        console.log('✅ Game initialized!');
    } catch (error) {
        console.error('❌ Init error:', error);
        const status = document.getElementById("loadingStatus");
        if (status) {
            status.textContent = '❌ Error: ' + error.message;
            status.style.color = '#e45d5d';
        }
    }
}

function loading(progress, text) {
    const bar = document.getElementById("loadingProgress");
    const status = document.getElementById("loadingStatus");
    if (bar) bar.style.width = progress + '%';
    if (status) status.textContent = text;
}

function initCities() {
    Object.keys(nation).forEach(key => {
        const data = nation[key];
        data.states.forEach(stateName => {
            const id = stateName.toUpperCase();
            if (!cityManager[id]) {
                cityManager[id] = {
                    name: stateName,
                    country: key,
                    population: 1000000,
                    industry: 3,
                    agriculture: 2,
                    buildings: [],
                    garrison: null,
                    fortification: 0,
                    supply: 100,
                    production: { money: 10, food: 5 }
                };
            }
        });
    });
}

function initSupplyLines() {
    Object.keys(nation).forEach(key => {
        const states = nation[key].states;
        if (states.length > 1) {
            const capital = states[0];
            for (let i = 1; i < states.length; i++) {
                createSupplyLine(capital.toUpperCase(), states[i].toUpperCase(), 50);
            }
        }
    });
}

function createSupplyLine(from, to, amount = 50) {
    const existing = supplyLines.find(s => 
        (s.from === from && s.to === to) || 
        (s.from === to && s.to === from)
    );
    if (existing) return false;
    supplyLines.push({
        id: 'supply_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        from, to, amount,
        status: 'ACTIVE',
        efficiency: 100,
        created: Date.now()
    });
    return true;
}

// =========================================================
// 3D SETUP
// =========================================================

function setup3D() {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1218);
    scene.fog = new THREE.Fog(0x0a1218, 80, 450);

    camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(80, 80, 120);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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
    window.addEventListener("resize", () => {
        if (!camera || !renderer) return;
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        if (labelRenderer) labelRenderer.setSize(innerWidth, innerHeight);
    });
}

// =========================================================
// TERRAIN
// =========================================================

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

    // Mountains
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
    }

    // Forests
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

    // Rivers
    const riverPoints = [
        [[-60, -30], [-40, -25], [-20, -20], [0, -15], [20, -10], [40, -5], [60, 0], [80, 5]],
        [[-50, 40], [-30, 35], [-10, 30], [10, 25], [30, 20], [50, 25], [70, 30]]
    ];
    riverPoints.forEach(points => {
        const pts = points.map(p => new THREE.Vector3(p[0], 0.15, p[1]));
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x1a5a7a, transparent: true, opacity: 0.35 }));
        scene.add(line);
    });
}

// =========================================================
// COUNTRY BORDERS
// =========================================================

function createCountryBorders() {
    const borderData = [
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

    borderData.forEach(data => {
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

// =========================================================
// UNIT CREATION
// =========================================================

function create3DInfantry(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.8 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
        new THREE.MeshStandardMaterial({ color: 0x445544, roughness: 0.5 })
    );
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

    let id;
    try { id = crypto.randomUUID(); } catch(e) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); }

    const unit = {
        id: id,
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
        city: null
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

// =========================================================
// ZOOM FUNCTIONS
// =========================================================

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
    const display = document.getElementById("selectedCountryDisplay");
    if (display) display.textContent = `📍 ${data.flag} ${data.name} • ${data.region} • ${stateCount} States • ${cityCount} Cities`;
    const flag = document.getElementById("countryFlag");
    if (flag) flag.textContent = data.flag;
    const name = document.getElementById("countryName");
    if (name) name.textContent = data.name;

    showCountryInfo(countryKey);
    toast(`📍 Zooming to ${data.name}`);
}

function showCities(countryKey) {
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

function showCountryInfo(countryKey) {
    const data = nation[countryKey];
    if (!data) return;

    const modal = document.getElementById("countryInfoModal");
    const title = document.getElementById("infoCountryTitle");
    const kicker = document.getElementById("infoCountryKicker");
    const content = document.getElementById("infoCountryContent");

    if (title) title.textContent = `${data.flag} ${data.name}`;
    if (kicker) kicker.textContent = `${data.region} • Capital: ${data.capital}`;
    
    if (content) {
        content.innerHTML = `
            <div class="country-detail-card">
                <h4>📍 Territory Information</h4>
                <div class="stat-row"><span>Country</span><b>${data.name}</b></div>
                <div class="stat-row"><span>Continent</span><b>${data.region}</b></div>
                <div class="stat-row"><span>Capital</span><b>${data.capital}</b></div>
                <div class="stat-row"><span>States</span><b>${data.states?.length || 0}</b></div>
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                    ${data.states?.map(s => `<span class="state-tag">${s}</span>`).join('') || ''}
                </div>
            </div>
            <div class="country-detail-card">
                <h4>📖 Description</h4>
                <p style="font-size:11px;color:var(--muted);line-height:1.6;">${data.desc || 'No description available.'}</p>
            </div>
            <button class="action-btn success" onclick="window.zoomToCountry('${countryKey}')">🎯 Zoom to ${data.name}</button>
        `;
    }

    if (modal) modal.classList.add('open');
}

// =========================================================
// WORLD CLICK
// =========================================================

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

    if (selectedUnit) {
        deselectUnit();
    }
}

// =========================================================
// UNIT SELECTION
// =========================================================

function selectUnit(unit) {
    if (selectedUnit) deselectUnit();
    selectedUnit = unit;
    unit.selected = true;
    updateUnitPanel();
    toast(`Selected ${unit.name}`);
}

function deselectUnit() {
    if (selectedUnit) {
        selectedUnit.selected = false;
        selectedUnit = null;
    }
    const panel = document.getElementById("unitPanel");
    if (panel) panel.classList.remove("open");
}

function updateUnitPanel() {
    const panel = document.getElementById("unitPanel");
    if (!selectedUnit || selectedUnit.state === 'DESTROYED') {
        if (panel) panel.classList.remove('open');
        return;
    }
    if (panel) panel.classList.add('open');
    const unit = selectedUnit;
    const type = document.getElementById("selectedUnitType");
    if (type) type.textContent = unit.type;
    const name = document.getElementById("selectedUnitName");
    if (name) name.textContent = unit.name;
    const stats = document.getElementById("unitStats");
    if (stats) {
        stats.innerHTML = `
            <div class="unit-stat"><span>Health</span><div class="progress"><i style="width:${(unit.hp/unit.maxHp)*100}%;background:${unit.hp > 50 ? 'var(--green)' : 'var(--red)'}"></i></div><b>${Math.round(unit.hp)}%</b></div>
            <div class="unit-stat"><span>Organization</span><div class="progress"><i style="width:${(unit.organization/unit.maxOrganization)*100}%"></i></div><b>${Math.round(unit.organization)}%</b></div>
            <div class="unit-stat"><span>Morale</span><div class="progress"><i style="width:${unit.morale}%"></i></div><b>${Math.round(unit.morale)}%</b></div>
            <div class="unit-stat"><span>Strength</span><div class="progress"><i style="width:${(unit.strength/unit.maxStrength)*100}%"></i></div><b>${Math.round(unit.strength)}%</b></div>
            <div class="unit-stat"><span>Supply</span><div class="progress"><i style="width:${unit.supply}%;background:${unit.supply > 40 ? 'var(--green)' : 'var(--red)'}"></i></div><b>${Math.round(unit.supply)}%</b></div>
            <div class="unit-stat"><span>Status</span><span style="color:var(--accent);font-weight:700;">${unit.state}</span><span></span></div>
            <div class="unit-stat"><span>Kills</span><span></span><b>${unit.kills}</b></div>
            <div class="unit-stat"><span>Experience</span><div class="progress"><i style="width:${unit.experience}%;background:var(--gold);"></i></div><b>${Math.round(unit.experience)}%</b></div>
        `;
    }
}

// =========================================================
// COMBAT
// =========================================================

function executeAttack(attacker, defender) {
    if (!attacker || !defender || defender.state === "DESTROYED") return;
    let damage = 10 + Math.random() * 20;
    defender.hp = Math.max(0, defender.hp - damage);
    updateUnitHPBar(defender);
    toast(`${attacker.name} attacked ${defender.name} for ${Math.round(damage)} damage`);
    if (defender.hp <= 0) {
        destroyUnit(defender, attacker);
    }
}

function destroyUnit(unit, killer = null) {
    unit.state = "DESTROYED";
    unit.hp = 0;
    unit.object.visible = false;
    if (killer) killer.kills++;
    toast(`${unit.name} destroyed`);
    if (selectedUnit === unit) {
        selectedUnit = null;
        const panel = document.getElementById("unitPanel");
        if (panel) panel.classList.remove("open");
    }
}

// =========================================================
// UI SETUP
// =========================================================

function setupUI() {
    // Panel buttons
    document.querySelectorAll('.panel-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.panel-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const panel = btn.dataset.panel;
            openPanel(panel);
        });
    });

    document.getElementById('closePanel')?.addEventListener('click', () => {
        document.getElementById('mainPanel')?.classList.remove('open');
    });

    document.getElementById('closeUnit')?.addEventListener('click', () => {
        document.getElementById('unitPanel')?.classList.remove('open');
        if (selectedUnit) deselectUnit();
    });

    // Country modal
    document.getElementById('countryDisplay')?.addEventListener('click', () => {
        populateCountryGrid();
        document.getElementById('countryModal')?.classList.add('open');
    });
    document.getElementById('closeCountryModal')?.addEventListener('click', () => {
        document.getElementById('countryModal')?.classList.remove('open');
    });
    document.getElementById('closeCountryInfo')?.addEventListener('click', () => {
        document.getElementById('countryInfoModal')?.classList.remove('open');
    });

    // Tutorial
    let tutorialStep = 0;
    document.getElementById('tutorialNext')?.addEventListener('click', () => {
        tutorialStep++;
        if (tutorialStep >= 4) {
            document.getElementById('tutorial').style.display = 'none';
            return;
        }
        const texts = [
            { title: 'Select a Country', text: 'Click any country on the map to zoom in and view details.' },
            { title: 'Manage Cities', text: 'Click on a city to view its details and manage production.' },
            { title: 'Command Units', text: 'Click on a unit to select it and give commands.' }
        ];
        document.getElementById('tutorialTitle').textContent = texts[tutorialStep-1]?.title || 'Done';
        document.getElementById('tutorialText').textContent = texts[tutorialStep-1]?.text || 'You are ready!';
        document.getElementById('tutorialNext').textContent = tutorialStep >= 3 ? 'START' : 'NEXT';
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Space') {
            e.preventDefault();
            paused = !paused;
            document.getElementById('pauseBtn').textContent = paused ? '▶' : '⏸';
            toast(paused ? 'Paused' : 'Resumed');
        }
        if (e.key === 'm' || e.key === 'M') {
            if (selectedUnit) {
                selectedUnit.state = 'MOVING';
                toast(`${selectedUnit.name} moving`);
            }
        }
        if (e.key === 'a' || e.key === 'A') {
            if (selectedUnit) {
                const targets = units.filter(u => !u.friendly && u.state !== 'DESTROYED');
                if (targets.length > 0) {
                    executeAttack(selectedUnit, targets[0]);
                }
            }
        }
    });

    // Camera controls
    document.getElementById('zoomIn')?.addEventListener('click', () => {
        camera.position.multiplyScalar(0.85);
        controls.update();
    });
    document.getElementById('zoomOut')?.addEventListener('click', () => {
        camera.position.multiplyScalar(1.15);
        controls.update();
    });
    document.getElementById('resetCamera')?.addEventListener('click', () => {
        camera.position.set(80, 80, 120);
        controls.target.set(0, 0, 0);
        controls.update();
        toast('Camera reset');
    });
    document.getElementById('zoomToCountry')?.addEventListener('click', () => {
        if (highlightedCountry) zoomToCountry(highlightedCountry);
        else toast('Select a country first');
    });

    // Quick actions
    document.getElementById('quickFactory')?.addEventListener('click', () => {
        if (money < 500) { toast("Need $500"); return; }
        money -= 500;
        factories.military++;
        toast("🏭 Factory built!");
        updateAllUI();
    });
    document.getElementById('quickReinforce')?.addEventListener('click', () => {
        if (money < 300) { toast("Need $300"); return; }
        if (manpower < 1000) { toast("Not enough manpower"); return; }
        money -= 300;
        manpower -= 1000;
        units.forEach(u => { if (u.friendly && u.state !== 'DESTROYED') { u.hp = Math.min(100, u.hp + 20); updateUnitHPBar(u); } });
        toast("🪖 Reinforced!");
        updateAllUI();
    });

    // Speed and pause
    document.getElementById('speedBtn')?.addEventListener('click', () => {
        if (speed === 1) speed = 2;
        else if (speed === 2) speed = 4;
        else speed = 1;
        document.getElementById('speedBtn').textContent = `${speed}×`;
        toast(`Speed: ${speed}×`);
    });
}

function populateCountryGrid() {
    const grid = document.getElementById('countryGrid');
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
            document.getElementById('countryModal').classList.remove('open');
            document.getElementById('countryFlag').textContent = data.flag;
            document.getElementById('countryName').textContent = data.name;
            zoomToCountry(key);
            toast(`Selected ${data.name}`);
        });
        grid.appendChild(card);
    });
}

function openPanel(panel) {
    const mainPanel = document.getElementById('mainPanel');
    const panelContent = document.getElementById('panelContent');
    const panelTitle = document.getElementById('panelTitle');
    const panelKicker = document.getElementById('panelKicker');

    if (!mainPanel || !panelContent) return;
    mainPanel.classList.add('open');

    if (panel === 'overview') {
        panelKicker.textContent = 'STRATEGIC COMMAND';
        panelTitle.textContent = 'World Overview';
        const totalUnits = units.filter(u => u.state !== 'DESTROYED').length;
        panelContent.innerHTML = `
            <div class="info-card"><h3>🌍 Global Status</h3>
                <div class="stat-row"><span>Countries</span><b>${Object.keys(nation).length}</b></div>
                <div class="stat-row"><span>Active Units</span><b>${totalUnits}</b></div>
                <div class="stat-row"><span>Weather</span><b>${weather}</b></div>
                <div class="stat-row"><span>Money</span><b>$${Math.round(money)}</b></div>
            </div>
            <div class="info-card"><h3>🎯 Selected Country</h3>
                ${highlightedCountry ? `
                    <div class="stat-row"><span>Country</span><b>${nation[highlightedCountry].flag} ${nation[highlightedCountry].name}</b></div>
                    <div class="stat-row"><span>Region</span><b>${nation[highlightedCountry].region}</b></div>
                    <div class="stat-row"><span>Capital</span><b>${nation[highlightedCountry].capital}</b></div>
                    <div class="stat-row"><span>States</span><b>${nation[highlightedCountry].states?.length || 0}</b></div>
                ` : '<p style="color:var(--muted);font-size:11px;">No country selected</p>'}
            </div>
            <button class="action-btn" onclick="window.changeWeather()">🌤️ Change Weather</button>
        `;
    } else {
        panelContent.innerHTML = `<div class="info-card"><h3>${panel.toUpperCase()}</h3><p style="color:var(--muted);font-size:11px;">Coming soon...</p></div>`;
    }
}

function updateAllUI() {
    document.getElementById('money').textContent = Math.round(money);
    document.getElementById('oil').textContent = Math.round(oil);
    document.getElementById('steel').textContent = Math.round(steel);
    document.getElementById('food').textContent = Math.round(food);
    document.getElementById('manpower').textContent = Math.round(manpower);
}

function toast(message) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function changeWeather() {
    if (weather === 'CLEAR') weather = 'RAIN';
    else if (weather === 'RAIN') weather = 'SNOW';
    else weather = 'CLEAR';
    if (ground) ground.material.color.setHex(weather === 'SNOW' ? 0x8a9a9a : 0x52634d);
    toast(`Weather: ${weather}`);
}

function autosave() {
    try {
        const data = { money, oil, steel, food, manpower, year, month, day };
        localStorage.setItem('worldWarV2', JSON.stringify(data));
    } catch(e) {}
}

function loadCampaign() {
    try {
        const raw = localStorage.getItem('worldWarV2');
        if (!raw) return;
        const data = JSON.parse(raw);
        money = data.money || money;
        oil = data.oil || oil;
        steel = data.steel || steel;
        food = data.food || food;
        manpower = data.manpower || manpower;
        if (data.year) year = data.year;
        if (data.month) month = data.month;
        if (data.day) day = data.day;
    } catch(e) {}
}

// =========================================================
// MINIMAP
// =========================================================

function initMinimap() {
    const canvas = document.getElementById('miniMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Draw initial minimap
    drawMinimap(ctx, canvas);
}

function drawMinimap(ctx, canvas) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(10,16,22,0.9)';
    ctx.fillRect(0, 0, w, h);
    // Draw country dots
    Object.keys(nation).forEach((key, i) => {
        const data = nation[key];
        const angle = (i / Object.keys(nation).length) * Math.PI * 2;
        const x = w/2 + Math.cos(angle) * 35;
        const y = h/2 + Math.sin(angle) * 35;
        ctx.fillStyle = '#' + (data.color || 0x888888).toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '4px Arial';
        ctx.fillText(data.flag, x-2, y-4);
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0, 0, w, h);
}

// =========================================================
// GAME LOOP
// =========================================================

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

        // Simple unit movement
        for (const unit of units) {
            if (unit.state === 'DESTROYED' || !unit.destination) continue;
            const pos = unit.object.position;
            const target = unit.destination;
            const dist = pos.distanceTo(target);
            if (dist < 1.5) {
                unit.destination = null;
                unit.state = 'HOLDING';
                continue;
            }
            const movement = unit.speed * dt * 0.045 * speed;
            const dir = new THREE.Vector3().subVectors(target, pos).normalize();
            pos.addScaledVector(dir, movement);
            if (unit.type === 'AIR') pos.y = 8;
            else pos.y = 0;
        }

        // Propeller animation
        for (const unit of units) {
            if (unit.type === 'AIR' && unit.object.userData.propeller) {
                unit.object.userData.propeller.rotation.z += dt * 30 * speed;
            }
        }

        // FX particles
        for (let i = fxGroup.children.length - 1; i >= 0; i--) {
            const fx = fxGroup.children[i];
            fx.userData.life -= dt;
            fx.position.add(fx.userData.velocity.clone().multiplyScalar(dt));
            fx.material.opacity = Math.max(0, fx.userData.life * 2);
            if (fx.userData.life <= 0) fxGroup.remove(fx);
        }
    }

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(loop);
}

// =========================================================
// START
// =========================================================

// Expose functions to window
window.zoomToCountry = zoomToCountry;
window.changeWeather = changeWeather;
window.toast = toast;

// Start
init().catch(error => {
    console.error('❌ Init error:', error);
    const status = document.getElementById('loadingStatus');
    if (status) {
        status.textContent = '❌ Error: ' + error.message;
        status.style.color = '#e45d5d';
    }
});

console.log('🌍 WORLD WAR V2 — Loading...');