import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

/* =========================================================
   WORLD WAR — V8 (FULL REALISTIC MAP)
   Click Countries → Highlight Territory + States
   Full Production Info + Real-time Graphics
   ========================================================== */

const $ = id => document.getElementById(id);

let scene, camera, renderer, labelRenderer, controls, clock;
let ground, unitGroup, fxGroup, borderGroup, labelGroup, stateGroup, highlightGroup;

let selectedUnit = null;
let moveMode = false;
let attackMode = false;
let selectedCountry = null;
let highlightedCountry = null;

let paused = false;
let speed = 1;

let day = 1;
let month = 1;
let year = 1940;

let currentCountry = "BANGLADESH";
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

let lastDateTick = 0;
let autosaveTimer = 0;
let battleLog = [];
let diplomaticMessages = [];

const units = [];
const countryMeshMap = {};
const stateMeshMap = {};

/* =========================================================
   NATIONS DATA (16 Countries with Colors)
   ========================================================== */

const nation = {
    BANGLADESH: { 
        flag: "🇧🇩", name: "Bangladesh", color: 0x006a4e, lightColor: 0x00a87a, 
        capital: "Dhaka", region: "South Asia", 
        states: ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh"],
        desc: "Bangladesh is a South Asian country with a rich history and strategic location. Known for its textile industry and deltaic geography."
    },
    PAKISTAN: { 
        flag: "🇵🇰", name: "Pakistan", color: 0x01411c, lightColor: 0x027a35,
        capital: "Islamabad", region: "South Asia",
        states: ["Punjab", "Sindh", "KPK", "Balochistan", "Gilgit", "Azad Kashmir", "Islamabad"],
        desc: "Pakistan is a South Asian nation with diverse landscapes, from mountains to deserts. A nuclear power with a strategic location."
    },
    TURKEY: { 
        flag: "🇹🇷", name: "Turkey", color: 0xe30a17, lightColor: 0xff1a2a,
        capital: "Ankara", region: "Eurasia",
        states: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Adana", "Gaziantep"],
        desc: "Turkey is a transcontinental country bridging Europe and Asia. A key NATO member with a strong military and economy."
    },
    IRAN: { 
        flag: "🇮🇷", name: "Iran", color: 0x239f40, lightColor: 0x3ad060,
        capital: "Tehran", region: "Middle East",
        states: ["Tehran", "Isfahan", "Khuzestan", "Fars", "Razavi", "East Azerbaijan", "Mazandaran", "Gilan"],
        desc: "Iran is a Middle Eastern country with ancient history. A major regional power with significant oil reserves."
    },
    SAUDI: { 
        flag: "🇸🇦", name: "Saudi Arabia", color: 0x165d31, lightColor: 0x229544,
        capital: "Riyadh", region: "Middle East",
        states: ["Riyadh", "Makkah", "Madinah", "Eastern", "Asir", "Tabuk", "Jazan", "Najran"],
        desc: "Saudi Arabia is the largest country in the Middle East. The birthplace of Islam and a global oil powerhouse."
    },
    EGYPT: { 
        flag: "🇪🇬", name: "Egypt", color: 0xce1126, lightColor: 0xff1a33,
        capital: "Cairo", region: "North Africa",
        states: ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Port Said", "Suez", "Minya"],
        desc: "Egypt is a transcontinental country spanning North Africa and the Middle East. Home to ancient civilization and the Suez Canal."
    },
    PALESTINE: { 
        flag: "🇵🇸", name: "Palestine", color: 0x007a3d, lightColor: 0x00b85a,
        capital: "Jerusalem", region: "Middle East",
        states: ["West Bank", "Gaza Strip", "Jerusalem", "Ramallah", "Hebron", "Nablus"],
        desc: "Palestine is a historic region in the Middle East. Rich in cultural and religious heritage, with a resilient population."
    },
    INDONESIA: { 
        flag: "🇮🇩", name: "Indonesia", color: 0xce1126, lightColor: 0xff1a33,
        capital: "Jakarta", region: "Southeast Asia",
        states: ["Java", "Sumatra", "Kalimantan", "Sulawesi", "Papua", "Bali", "Lombok", "Flores"],
        desc: "Indonesia is the world's largest archipelago nation. Rich in biodiversity and natural resources, with a growing economy."
    },
    AFGHANISTAN: { 
        flag: "🇦🇫", name: "Afghanistan", color: 0x000000, lightColor: 0x333333,
        capital: "Kabul", region: "Central Asia",
        states: ["Kabul", "Kandahar", "Herat", "Mazar", "Nangarhar", "Balkh", "Ghazni", "Helmand"],
        desc: "Afghanistan is a landlocked country at the crossroads of Central and South Asia. Known for its rugged terrain and strategic importance."
    },
    INDIA: { 
        flag: "🇮🇳", name: "India", color: 0xff9933, lightColor: 0xffbb55,
        capital: "New Delhi", region: "South Asia",
        states: ["UP", "Maharashtra", "Tamil Nadu", "Gujarat", "Karnataka", "Rajasthan", "West Bengal", "Punjab"],
        desc: "India is the world's largest democracy. A rapidly growing economy with diverse culture and a major regional power."
    },
    USA: { 
        flag: "🇺🇸", name: "United States", color: 0x2a5c8a, lightColor: 0x4a8cc0,
        capital: "Washington DC", region: "North America",
        states: ["California", "Texas", "Florida", "New York", "Illinois", "Pennsylvania", "Ohio", "Georgia"],
        desc: "The United States is a global superpower with the world's largest economy and most powerful military."
    },
    CHINA: { 
        flag: "🇨🇳", name: "China", color: 0xcc2222, lightColor: 0xff3333,
        capital: "Beijing", region: "East Asia",
        states: ["Guangdong", "Shandong", "Henan", "Sichuan", "Jiangsu", "Hebei", "Hunan", "Anhui"],
        desc: "China is the world's most populous country and second-largest economy. A rising global power with ancient civilization."
    },
    RUSSIA: { 
        flag: "🇷🇺", name: "Russia", color: 0x003399, lightColor: 0x0055cc,
        capital: "Moscow", region: "Eurasia",
        states: ["Moscow", "St Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny", "Samara", "Omsk"],
        desc: "Russia is the world's largest country by area. A major global power with vast natural resources and a permanent UN Security Council seat."
    },
    UK: { 
        flag: "🇬🇧", name: "United Kingdom", color: 0x8a2a2a, lightColor: 0xcc4040,
        capital: "London", region: "Europe",
        states: ["England", "Scotland", "Wales", "Northern Ireland"],
        desc: "The United Kingdom is a European island nation with a rich history. A former global empire and current nuclear power."
    },
    FRANCE: { 
        flag: "🇫🇷", name: "France", color: 0x2a5a8a, lightColor: 0x4a88c0,
        capital: "Paris", region: "Europe",
        states: ["Île-de-France", "Provence", "Brittany", "Normandy", "Alsace", "Aquitaine", "Lyon", "Marseille"],
        desc: "France is a European nation with a rich cultural heritage. A nuclear power and permanent UN Security Council member."
    },
    GERMANY: { 
        flag: "🇩🇪", name: "Germany", color: 0x3a3a3a, lightColor: 0x666666,
        capital: "Berlin", region: "Europe",
        states: ["Bavaria", "North Rhine", "Baden", "Saxony", "Hesse", "Berlin", "Hamburg", "Munich"],
        desc: "Germany is Europe's largest economy. A key EU member with a strong industrial base and military."
    }
};

const countryColors = {};
Object.keys(nation).forEach(key => {
    countryColors[key] = nation[key].color;
});

const mapColors = {
    MILITARY: 0x596b58, POLITICAL: 0x58667d, TERRAIN: 0x52634d,
    SUPPLY: 0x4e6e5a, RESOURCES: 0x75633c, INTEL: 0x5d4c6b
};

const diplomacy = {};
Object.keys(nation).forEach(key => {
    diplomacy[key] = key === "BANGLADESH" ? 0 : (Math.random() * 60 - 30);
});

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

/* =========================================================
   INITIALIZATION
   ========================================================== */

async function init() {
    loading(10, "Initializing global command system...");
    setup3D();
    loading(25, "Generating world terrain...");
    createTerrain();
    loading(35, "Drawing country borders...");
    createCountryBorders();
    loading(45, "Adding states/provinces...");
    createStates();
    loading(55, "Deploying military forces...");
    deployInitialForces();
    loading(70, "Connecting economy...");
    loadCampaign();
    loading(85, "Initializing intelligence...");
    setupUI();
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

    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance"
    });
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
    controls.minDistance = 25;
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
    scene.add(unitGroup);
    scene.add(fxGroup);
    scene.add(borderGroup);
    scene.add(labelGroup);
    scene.add(stateGroup);
    scene.add(highlightGroup);

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
   TERRAIN (Enhanced Realistic)
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
        // Mountains
        if (z > 5) { r += 0.18; g += 0.15; b += 0.08; }
        if (z > 9) { r += 0.12; g += 0.05; b -= 0.02; }
        // Forests
        if (Math.sin(x * 0.07) * Math.cos(y * 0.07) > 0.35 && z < 3) { r -= 0.04; g += 0.10; b -= 0.02; }
        // Plains
        if (Math.abs(z) < 0.5) { r += 0.10; g += 0.06; b -= 0.04; }
        // Desert
        if (Math.sin(x * 0.02 + y * 0.03) > 0.6 && z < 1.5) { r += 0.15; g += 0.08; b -= 0.06; }
        // Snow
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
        mountain.position.set(
            Math.cos(angle) * dist,
            0.5 + height * 0.4,
            Math.sin(angle) * dist
        );
        mountain.rotation.set(
            (Math.random() - 0.5) * 0.15,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.15
        );
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
        tree.position.set(
            Math.cos(angle) * dist + (Math.random() - 0.5) * 25,
            0,
            Math.sin(angle) * dist + (Math.random() - 0.5) * 25
        );
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
        const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x1a5a7a, transparent: true, opacity: 0.35 })
        );
        scene.add(line);
    });
}

/* =========================================================
   COUNTRY BORDERS + STATES (Clickable)
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

    // Clear previous
    while(borderGroup.children.length) borderGroup.remove(borderGroup.children[0]);

    countryData.forEach(data => {
        const color = countryColors[data.name] || 0x888888;
        const points = data.points.map(p => new THREE.Vector3(p[0], 0.4, p[1]));
        
        // Border line (thicker)
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8, linewidth: 2 })
        );
        borderGroup.add(line);

        // Fill area (clickable)
        const shape = new THREE.Shape();
        points.forEach((p, i) => {
            if (i === 0) shape.moveTo(p.x, p.z);
            else shape.lineTo(p.x, p.z);
        });
        const fillGeom = new THREE.ShapeGeometry(shape);
        const fill = new THREE.Mesh(
            fillGeom,
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        fill.rotation.x = -Math.PI / 2;
        fill.position.y = 0.2;
        fill.userData.country = data.name;
        borderGroup.add(fill);
        countryMeshMap[data.name] = fill;

        // Country label
        const center = points.reduce((acc, p) => { acc.x += p.x; acc.z += p.z; return acc; }, { x: 0, z: 0 });
        center.x /= points.length;
        center.z /= points.length;
        
        const labelDiv = document.createElement('div');
        labelDiv.textContent = `${nation[data.name]?.flag || '🏳️'} ${nation[data.name]?.name || data.name}`;
        labelDiv.style.color = '#eef4f8';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.fontWeight = '700';
        labelDiv.style.textShadow = '0 2px 16px rgba(0,0,0,0.95)';
        labelDiv.style.background = 'rgba(0,0,0,0.7)';
        labelDiv.style.padding = '4px 12px';
        labelDiv.style.borderRadius = '12px';
        labelDiv.style.border = '1px solid rgba(255,255,255,0.08)';
        labelDiv.style.backdropFilter = 'blur(4px)';
        labelDiv.style.pointerEvents = 'none';
        labelDiv.style.userSelect = 'none';
        labelDiv.style.cursor = 'pointer';
        
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

    // Clear previous
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
        const mesh = new THREE.Mesh(
            geom,
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.1;
        mesh.userData.country = key;
        stateGroup.add(mesh);
        stateMeshMap[key] = mesh;

        // State label
        const center = points.reduce((acc, p) => { acc.x += p.x; acc.z += p.z; return acc; }, { x: 0, z: 0 });
        center.x /= points.length;
        center.z /= points.length;
        
        const labelDiv = document.createElement('div');
        labelDiv.textContent = `📍 ${nation[key]?.name || key}`;
        labelDiv.style.color = '#aabbcc';
        labelDiv.style.fontSize = '8px';
        labelDiv.style.fontWeight = '600';
        labelDiv.style.textShadow = '0 1px 10px rgba(0,0,0,0.95)';
        labelDiv.style.background = 'rgba(0,0,0,0.5)';
        labelDiv.style.padding = '2px 8px';
        labelDiv.style.borderRadius = '8px';
        labelDiv.style.pointerEvents = 'none';
        labelDiv.style.userSelect = 'none';
        
        const label = new CSS2DObject(labelDiv);
        label.position.set(center.x, 1.0, center.z);
        labelGroup.add(label);
    });
}

/* =========================================================
   HIGHLIGHT COUNTRY (Click to Highlight)
   ========================================================== */

function highlightCountry(countryKey) {
    // Clear previous highlight
    while(highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);

    if (!countryKey || !nation[countryKey]) {
        highlightedCountry = null;
        $("selectedCountryDisplay").textContent = '';
        return;
    }

    highlightedCountry = countryKey;
    const data = nation[countryKey];
    const color = data.color;

    // Find the country mesh
    const mesh = countryMeshMap[countryKey];
    if (mesh) {
        // Clone and highlight
        const highlight = mesh.clone();
        highlight.material = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        highlight.position.y = 0.3;
        highlightGroup.add(highlight);

        // Glow ring
        const points = mesh.geometry.attributes.position;
        const center = new THREE.Vector3();
        for (let i = 0; i < points.count; i++) {
            center.x += points.getX(i);
            center.z += points.getY(i);
        }
        center.x /= points.count;
        center.z /= points.count;

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(4, 6, 32),
            new THREE.MeshBasicMaterial({
                color: 0xffdd44,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(center.x, 0.5, center.z);
        highlightGroup.add(ring);

        // Show country info
        const stateCount = data.states?.length || 0;
        $("selectedCountryDisplay").textContent = `📍 ${data.flag} ${data.name} • ${data.region} • ${stateCount} States`;

        // Show info modal
        showCountryInfo(countryKey);
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
                <div class="stat-row"><span>Region</span><b>${data.region}</b></div>
                <div class="stat-row"><span>Capital</span><b>${data.capital}</b></div>
                <div class="stat-row"><span>States/Provinces</span><b>${data.states?.length || 0}</b></div>
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                    ${data.states?.map(s => `<span class="state-tag">${s}</span>`).join('') || ''}
                </div>
            </div>
            <div class="country-detail-card">
                <h4>📖 Description</h4>
                <p style="font-size:11px;color:var(--muted);line-height:1.6;">${data.desc || 'No description available.'}</p>
            </div>
            <div class="country-detail-card">
                <h4>⚔️ Military Forces</h4>
                ${units.filter(u => u.country === countryKey && u.state !== "DESTROYED").map(u => 
                    `<div class="stat-row"><span>${u.type}</span><b>${u.name} (${u.state})</b></div>`
                ).join('') || '<p style="font-size:10px;color:var(--muted);">No active units</p>'}
            </div>
            <div class="country-detail-card">
                <h4>🤝 Diplomatic Relations</h4>
                ${Object.keys(nation).filter(k => k !== countryKey).map(k => {
                    const val = diplomacy[k] || 0;
                    return `<div class="stat-row"><span>${nation[k].flag} ${nation[k].name}</span><b style="color:${val > 0 ? 'var(--green)' : val < -30 ? 'var(--red)' : 'var(--accent)'}">${val}</b></div>`;
                }).join('')}
            </div>
        `;
    }

    modal.classList.add('open');
}

/* =========================================================
   3D UNIT CREATION
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

    const barrel = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 })
    );
    barrel.position.set(0, 1.65, 1.4);
    group.add(barrel);

    for (let side of [-1, 1]) {
        const track = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 2.2), trackMat);
        track.position.set(side * 1.8, 0.3, 0);
        group.add(track);
        for (let i = -0.8; i <= 0.8; i += 0.4) {
            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8),
                new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
            );
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

function create3DArtillery(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.2), mat);
    base.position.y = 0.3;
    base.castShadow = true;
    group.add(base);

    for (let side of [-1, 1]) {
        const wheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.08, 8, 12),
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
        );
        wheel.position.set(side * 0.7, 0.3, 0.5);
        wheel.rotation.y = Math.PI / 2;
        group.add(wheel);
    }

    const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.8), mat);
    carriage.position.y = 0.6;
    group.add(carriage);

    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 1.8, 8),
        metalMat
    );
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
    const prop = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.02, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    prop.position.x = 1.4;
    propGroup.add(prop);
    const prop2 = prop.clone();
    prop2.rotation.y = Math.PI / 2;
    propGroup.add(prop2);
    group.add(propGroup);
    group.userData.propeller = propGroup;

    for (let side of [-1, 1]) {
        const gear = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.03, 0.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
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
    const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 })
    );
    bg.position.y = 0;
    hpBar.add(bg);
    const hpFill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x55dd55 })
    );
    hpFill.position.y = 0;
    hpBar.add(hpFill);
    hpBar.position.y = type === 'AIR' ? 9.5 : 3.0;
    group.add(hpBar);
    group.userData.hpBar = hpBar;
    group.userData.hpFill = hpFill;

    const flagDiv = document.createElement('div');
    const countryData = nation[country] || nation["BANGLADESH"];
    flagDiv.textContent = friendly ? countryData.flag : '🔴';
    flagDiv.style.fontSize = '14px';
    flagDiv.style.textShadow = '0 0 10px rgba(0,0,0,0.8)';
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
        selected: false
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
    // Bangladesh
    create3DUnit("1st Infantry Div", "INFANTRY", -6, -22, true, "BANGLADESH");
    create3DUnit("2nd Infantry Div", "INFANTRY", 2, -26, true, "BANGLADESH");
    create3DUnit("Armored Brigade", "TANK", -4, -18, true, "BANGLADESH");
    create3DUnit("Artillery Reg", "ARTILLERY", -10, -24, true, "BANGLADESH");
    create3DUnit("Air Wing", "AIR", -2, -30, true, "BANGLADESH");
    
    // Pakistan
    create3DUnit("Pakistani Infantry", "INFANTRY", 28, 16, true, "PAKISTAN");
    create3DUnit("Pakistani Armor", "TANK", 32, 20, true, "PAKISTAN");
    
    // Turkey
    create3DUnit("Turkish Infantry", "INFANTRY", -58, 42, true, "TURKEY");
    create3DUnit("Turkish Artillery", "ARTILLERY", -62, 38, true, "TURKEY");
    
    // Iran
    create3DUnit("Iranian Infantry", "INFANTRY", 16, 32, true, "IRAN");
    create3DUnit("Iranian Armor", "TANK", 20, 36, true, "IRAN");
    
    // Saudi
    create3DUnit("Saudi Infantry", "INFANTRY", 16, 16, true, "SAUDI");
    
    // Egypt
    create3DUnit("Egyptian Infantry", "INFANTRY", -28, 10, true, "EGYPT");
    
    // Palestine
    create3DUnit("Palestinian Defense", "INFANTRY", -4, 28, true, "PALESTINE");
    
    // India (Neutral)
    create3DUnit("Indian Infantry", "INFANTRY", 8, -12, false, "INDIA");
    create3DUnit("Indian Armor", "TANK", 14, -8, false, "INDIA");
    
    // China (Neutral)
    create3DUnit("Chinese Infantry", "INFANTRY", 52, 4, false, "CHINA");
    create3DUnit("Chinese Armor", "TANK", 58, 8, false, "CHINA");
    
    // Russia
    create3DUnit("Russian Infantry", "INFANTRY", 32, 68, false, "RUSSIA");
    
    // USA
    create3DUnit("US Infantry", "INFANTRY", -132, -32, false, "USA");
    create3DUnit("US Armor", "TANK", -128, -38, false, "USA");
    
    // UK
    create3DUnit("UK Infantry", "INFANTRY", -124, 32, false, "UK");
    
    // France
    create3DUnit("French Infantry", "INFANTRY", -48, 38, false, "FRANCE");
    
    // Germany
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
    
    if (distance > maxRange) {
        toast("Target is out of range");
        return;
    }
    if (attacker.supply < 15) {
        toast("Insufficient supply");
        return;
    }

    attacker.supply = Math.max(0, attacker.supply - 6);
    
    let attackPower = (attacker.attack * (attacker.strength / 100) * (attacker.organization / 100) *
        (attacker.morale / 100) * getTerrainModifier(attacker) * getTechAttackBonus(attacker)) + Math.random() * 8;
    
    if (attacker.type === 'ARTILLERY' && defender.state === 'DEFENDING') {
        attackPower *= 1.3;
    }
    
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
    updateUnitHPBar(target);
    addBattleLog(`Airstrike hit ${target.name} for ${Math.round(damage)} damage`);
    toast(`Airstrike hit ${target.name}`);

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
        const dir = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 3,
            (Math.random() - 0.5) * 3
        ).normalize();
        mesh.userData = {
            life: 0.3 + Math.random() * 0.4,
            velocity: dir.multiplyScalar(2 + Math.random() * 5)
        };
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
    if (selectedUnit === unit) {
        selectedUnit = null;
        const panel = $("unitPanel");
        if (panel) panel.classList.remove("open");
    }
}

/* =========================================================
   ECONOMY
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

/* =========================================================
   PRODUCTION
   ========================================================== */

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

function assignFactory(type) {
    const used = Object.values(production).reduce((sum, item) => sum + item.factories, 0);
    if (used >= factories.military) {
        toast("No free military factories");
        return;
    }
    production[type].factories++;
    toast(`${type} factory assigned`);
    openPanel("production");
}

function quickBuildFactory() {
    if (money < 500) {
        toast("Need $500 to build factory");
        return;
    }
    if (construction < 2) {
        toast("Need 2 construction points");
        return;
    }
    money -= 500;
    construction -= 2;
    factories.military++;
    toast("🏭 Military factory built!");
    updateAllUI();
}

function quickReinforce() {
    if (money < 300) {
        toast("Need $300 to reinforce");
        return;
    }
    if (manpower < 1000) {
        toast("Not enough manpower");
        return;
    }
    money -= 300;
    manpower -= 1000;
    // Reinforce all friendly units
    for (const unit of units) {
        if (unit.friendly && unit.state !== "DESTROYED") {
            unit.hp = Math.min(unit.maxHp, unit.hp + 20);
            unit.organization = Math.min(unit.maxOrganization, unit.organization + 15);
            unit.morale = Math.min(100, unit.morale + 10);
            updateUnitHPBar(unit);
        }
    }
    toast("🪖 Units reinforced!");
    updateAllUI();
}

/* =========================================================
   RESEARCH
   ========================================================== */

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
        }
    }
}

function startResearch(key) {
    const t = tech[key];
    if (t.completed) {
        toast("Technology already completed");
        return;
    }
    const active = Object.values(tech).filter(x => x.active).length;
    if (!t.active && active >= 3) {
        toast("All research slots are occupied");
        return;
    }
    if (political < 10) {
        toast("Need 10 political power");
        return;
    }
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
   DIPLOMACY
   ========================================================== */

function improveDiplomacy(country) {
    if (political < 15) {
        toast("Need political power");
        return;
    }
    political -= 15;
    diplomacy[country] = Math.min(100, diplomacy[country] + 8);
    addDiplomaticMessage(`Relations improved with ${nation[country]?.name || country}`);
    toast(`Relations improved with ${nation[country]?.name || country}`);
    openPanel("diplomacy");
}

function diplomaticAction(country) {
    const value = diplomacy[country] || 0;
    if (value <= -50) {
        diplomacy[country] = -100;
        stability = Math.max(0, stability - 2);
        addDiplomaticMessage(`War declared on ${nation[country]?.name || country}`);
        toast(`War declared on ${nation[country]?.name || country}`);
    } else {
        diplomacy[country] = Math.min(100, value + 12);
        political = Math.max(0, political - 8);
        addDiplomaticMessage(`Pact proposed to ${nation[country]?.name || country}`);
        toast(`Pact proposed to ${nation[country]?.name || country}`);
    }
    openPanel("diplomacy");
}

/* =========================================================
   INTELLIGENCE
   ========================================================== */

function runRecon() {
    if (money < 250) {
        toast("Not enough money");
        return;
    }
    money -= 250;
    intel = Math.min(100, intel + 10);
    for (const unit of units) {
        if (!unit.friendly) {
            unit.readiness = Math.max(0, unit.readiness - 2);
        }
    }
    toast("Recon completed");
    updateAllUI();
}

function expandSpyNetwork() {
    if (money < 400) {
        toast("Not enough money");
        return;
    }
    money -= 400;
    spy = Math.min(100, spy + 12);
    intel = Math.min(100, intel + 4);
    toast("Spy network expanded");
    updateAllUI();
}

function improveCounterIntel() {
    if (money < 350) {
        toast("Not enough money");
        return;
    }
    money -= 350;
    counterIntel = Math.min(100, counterIntel + 12);
    toast("Counter-intelligence improved");
    updateAllUI();
}

/* =========================================================
   WEATHER / MAP
   ========================================================== */

function changeWeather() {
    if (weather === "CLEAR") weather = "RAIN";
    else if (weather === "RAIN") weather = "SNOW";
    else weather = "CLEAR";
    if (ground) {
        ground.material.color.setHex(weather === "SNOW" ? 0x8a9a9a : 0x52634d);
    }
    toast(`Weather: ${weather}`);
}

function setMapLayer(layer) {
    mapLayer = layer;
    if (ground) {
        ground.material.color.setHex(mapColors[layer]);
    }
    toast(`Map layer: ${layer}`);
}

/* =========================================================
   BATTLE LOG & DIPLOMATIC MESSAGES
   ========================================================== */

function addBattleLog(message) {
    battleLog.unshift({ time: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, message });
    if (battleLog.length > 20) battleLog.pop();
}

function addDiplomaticMessage(message) {
    diplomaticMessages.unshift({ time: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`, message });
    if (diplomaticMessages.length > 10) diplomaticMessages.pop();
}

/* =========================================================
   AUTO-SAVE
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
            units: units.map(u => ({
                id: u.id, name: u.name, type: u.type, friendly: u.friendly, country: u.country,
                hp: u.hp, organization: u.organization, morale: u.morale,
                strength: u.strength, readiness: u.readiness, supply: u.supply,
                attack: u.attack, defense: u.defense, speed: u.speed,
                state: u.state, kills: u.kills, experience: u.experience,
                entrenchment: u.entrenchment,
                pos: u.object.position.toArray()
            }))
        };
        localStorage.setItem('worldWarSave', JSON.stringify(saveData));
    } catch (e) { /* silent fail */ }
}

function loadCampaign() {
    try {
        const raw = localStorage.getItem('worldWarSave');
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
   MOVEMENT / AI
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
        let attackRange = 28;
        if (enemy.type === "ARTILLERY") attackRange = 60;
        
        if (distance <= attackRange) {
            enemy.state = "ATTACKING";
            enemyAICombat(enemy, closest);
        } else {
            enemy.destination = closest.object.position.clone();
            enemy.state = "MOVING";
        }
    }
}

function enemyAirAI(enemy) {
    const targets = units.filter(u => u.friendly && u.state !== "DESTROYED");
    if (!targets.length) return;
    const target = targets.sort((a, b) =>
        enemy.object.position.distanceTo(a.object.position) -
        enemy.object.position.distanceTo(b.object.position)
    )[0];
    if (enemy.object.position.distanceTo(target.object.position) < 80) {
        if (Math.random() < 0.03 * speed) {
            enemyAirstrike(enemy, target);
        }
    } else {
        enemy.destination = new THREE.Vector3(target.object.position.x, 8, target.object.position.z);
        enemy.state = "MOVING";
    }
}

function enemyAICombat(attacker, defender) {
    if (Math.random() > 0.025 * speed) return;
    if (attacker.strength <= 0 || attacker.organization <= 0) return;

    let attack = attacker.attack * (attacker.strength / 100) * (attacker.organization / 100);
    if (attacker.type === "ARTILLERY" && defender.state === "DEFENDING") {
        attack *= 1.3;
    }
    const defense = defender.defense * (defender.organization / 100);
    let damage = Math.max(2, attack - defense * 0.45 + Math.random() * 5);
    if (weather === "RAIN") damage *= 0.9;
    if (weather === "SNOW") damage *= 0.75;

    defender.hp = Math.max(0, defender.hp - damage);
    defender.organization = Math.max(0, defender.organization - damage * 0.45);
    defender.morale = Math.max(0, defender.morale - damage * 0.18);
    createExplosion(defender.object.position);
    updateUnitHPBar(defender);

    if (defender.hp <= 0 || defender.organization <= 0) {
        destroyUnit(defender, attacker);
    }
}

function enemyAirstrike(aircraft, target) {
    let damage = 10 + Math.random() * 15;
    if (weather === "RAIN") damage *= 0.7;
    if (weather === "SNOW") damage *= 0.55;
    target.hp = Math.max(0, target.hp - damage);
    target.organization = Math.max(0, target.organization - damage * 0.6);
    createExplosion(target.object.position);
    updateUnitHPBar(target);
    if (target.hp <= 0 || target.organization <= 0) {
        destroyUnit(target, aircraft);
    }
}

/* =========================================================
   PANELS
   ========================================================== */

function averageStat(key) {
    const list = units.filter(u => u.friendly && u.state !== "DESTROYED");
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, u) => sum + (u[key] || 0), 0) / list.length);
}

function threatLevel() {
    const friendly = units.filter(u => u.friendly && u.state !== "DESTROYED").reduce((s, u) => s + u.strength, 0);
    const enemy = units.filter(u => !u.friendly && u.state !== "DESTROYED").reduce((s, u) => s + u.strength, 0);
    if (enemy > friendly) return "HIGH";
    if (enemy > friendly * 0.75) return "MEDIUM";
    return "LOW";
}

function infoCard(title, content) {
    return `<div class="info-card"><h3>${title}</h3>${content}</div>`;
}

function actionButton(id, text, cls = "") {
    return `<button class="action-btn ${cls}" id="${id}">${text}</button>`;
}

const panels = {
    overview: {
        title: "World Overview",
        kicker: "STRATEGIC COMMAND",
        html: () =>
            infoCard("Global Situation",
                statRow("Active Forces", units.filter(u => u.friendly && u.state !== "DESTROYED").length) +
                statRow("Enemy Forces", units.filter(u => !u.friendly && u.state !== "DESTROYED").length) +
                statRow("Threat Level", threatLevel()) +
                statRow("Weather", weather) +
                statRow("Map Layer", mapLayer) +
                statRow("Your Country", `${nation[currentCountry]?.flag || '🏳️'} ${nation[currentCountry]?.name || currentCountry}`)
            ) +
            infoCard("Map Layers",
                ["MILITARY", "POLITICAL", "TERRAIN", "SUPPLY", "RESOURCES", "INTEL"]
                    .map(layer => actionButton("", layer, `layer-btn`).replace("<button ", `<button data-layer="${layer}" `))
                    .join("")
            ) +
            infoCard("Army Readiness",
                progressRow("Strength", averageStat("strength")) +
                progressRow("Organization", averageStat("organization")) +
                progressRow("Morale", averageStat("morale")) +
                progressRow("Readiness", averageStat("readiness"))
            ) +
            infoCard("💡 Tip", 
                '<p style="font-size:10px;color:var(--accent);">Click any country on the map to view its territory, states, and diplomatic relations!</p>'
            )
    },
    army: {
        title: "Army Command",
        kicker: "MILITARY COMMAND",
        html: () => {
            const friendly = units.filter(u => u.friendly && u.state !== "DESTROYED");
            return infoCard("Available Forces",
                friendly.map(u => `
                    <button class="action-btn select-unit" data-id="${u.id}" style="text-align:left">
                        ${u.type === "TANK" ? "🛡️" : u.type === "ARTILLERY" ? "💥" : u.type === "AIR" ? "✈️" : "🪖"}
                        ${u.name} (${nation[u.country]?.flag || '🏳️'}) — ${u.state}
                    </button>
                `).join("")
            ) +
            infoCard("Army Statistics",
                progressRow("Strength", averageStat("strength")) +
                progressRow("Organization", averageStat("organization")) +
                progressRow("Morale", averageStat("morale")) +
                statRow("Manpower", Math.floor(manpower).toLocaleString())
            );
        }
    },
    economy: {
        title: "Economy",
        kicker: "NATIONAL ECONOMY",
        html: () =>
            infoCard("Resources",
                statRow("💰 Money", Math.floor(money).toLocaleString(), "highlight") +
                statRow("🛢️ Oil", Math.floor(oil).toLocaleString()) +
                statRow("⚙️ Steel", Math.floor(steel).toLocaleString()) +
                statRow("🌾 Food", Math.floor(food).toLocaleString()) +
                statRow("👥 Manpower", Math.floor(manpower).toLocaleString())
            ) +
            infoCard("National Stability",
                progressRow("Stability", stability) +
                statRow("Tax Rate", `${tax}%`) +
                statRow("Political Power", Math.floor(political)) +
                statRow("Construction", construction.toFixed(1)) +
                statRow("🏭 Civilian Factories", factories.civilian) +
                statRow("🏭 Military Factories", factories.military)
            ) +
            actionButton("tax-down", "LOWER TAX — 2%") +
            actionButton("tax-up", "RAISE TAX — 2%") +
            actionButton("invest-industry", "INVEST IN INDUSTRY — $1000") +
            actionButton("build-factory", "BUILD FACTORY — 4 CONSTRUCTION")
    },
    production: {
        title: "Military Production",
        kicker: "INDUSTRIAL COMMAND",
        html: () =>
            infoCard("Production Lines",
                Object.entries(production).map(([key, p]) =>
                    `<div>
                        ${statRow(p.name, `${p.factories} factories`)}
                        ${progressRow("Progress", p.progress)}
                        ${actionButton(`factory-${key}`, `ASSIGN +1 ${key}`)}
                    </div>`
                ).join("")
            ) +
            actionButton("buy-tank", "BUY TANK — $800 / 80 STEEL", "success") +
            actionButton("buy-infantry", "BUY INFANTRY — $350 / 35 STEEL", "success") +
            actionButton("buy-artillery", "BUY ARTILLERY — $600 / 65 STEEL", "success") +
            actionButton("buy-air", "BUY AIRCRAFT — $1100 / 90 STEEL", "success") +
            actionButton("quick-factory", "⚡ QUICK BUILD FACTORY — $500", "success") +
            actionButton("quick-reinforce", "🪖 QUICK REINFORCE — $300", "success")
    },
    research: {
        title: "Technology",
        kicker: "RESEARCH COMMAND",
        html: () =>
            infoCard("Research",
                Object.entries(tech).map(([key, t]) =>
                    `<div>
                        ${statRow(t.name, t.completed ? "✅ COMPLETED" : t.active ? `${Math.round(t.progress)}%` : "📖 AVAILABLE")}
                        ${progressRow("Progress", t.progress)}
                        ${actionButton(`research-${key}`,
                            t.completed ? "COMPLETED ✓" : t.active ? "RESEARCHING..." : "START RESEARCH"
                        )}
                    </div>`
                ).join("")
            )
    },
    diplomacy: {
        title: "Diplomacy",
        kicker: "FOREIGN AFFAIRS",
        html: () =>
            infoCard("International Relations",
                Object.keys(nation).filter(key => key !== currentCountry).map(key => {
                    const value = diplomacy[key] || 0;
                    return `<div>
                        ${statRow(`${nation[key]?.flag || '🏳️'} ${nation[key]?.name || key}`, value)}
                        ${actionButton(`dip-${key}`, "IMPROVE RELATIONS")}
                        ${actionButton(`diplomatic-${key}`, value < -50 ? "⚔️ WAR" : "🤝 PACT")}
                    </div>`;
                }).join("")
            ) +
            infoCard("Diplomatic Log",
                diplomaticMessages.map(m =>
                    `<div style="font-size:10px;color:var(--muted);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                        [${m.time}] ${m.message}
                    </div>`
                ).join("") || "No diplomatic activity"
            )
    },
    intel: {
        title: "Intelligence",
        kicker: "INTELLIGENCE COMMAND",
        html: () =>
            infoCard("Intelligence Network",
                progressRow("Intel Level", intel) +
                progressRow("Spy Network", spy) +
                progressRow("Counter Intel", counterIntel) +
                statRow("Enemy Units Detected", units.filter(u => !u.friendly && u.state !== "DESTROYED").length)
            ) +
            actionButton("run-recon", "RUN RECON — $250") +
            actionButton("expand-spy", "EXPAND SPY — $400") +
            actionButton("improve-counter", "IMPROVE COUNTER — $350")
    }
};

/* =========================================================
   UI SETUP
   ========================================================== */

function setupUI() {
    document.querySelectorAll('.panel-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            if (panel === 'settings') {
                toast("Settings panel coming soon");
                return;
            }
            openPanel(panel);
        });
    });

    const closePanel = $("closePanel");
    if (closePanel) {
        closePanel.addEventListener('click', () => {
            const mainPanel = $("mainPanel");
            if (mainPanel) mainPanel.classList.remove('open');
        });
    }

    const closeUnit = $("closeUnit");
    if (closeUnit) {
        closeUnit.addEventListener('click', () => {
            const unitPanel = $("unitPanel");
            if (unitPanel) unitPanel.classList.remove('open');
            if (selectedUnit) {
                selectedUnit.selected = false;
                clearSelectionVisual(selectedUnit);
                selectedUnit = null;
            }
        });
    }

    const moveBtn = $("moveCommand");
    if (moveBtn) moveBtn.addEventListener('click', commandMove);
    const attackBtn = $("attackCommand");
    if (attackBtn) attackBtn.addEventListener('click', commandAttack);
    const defendBtn = $("defendCommand");
    if (defendBtn) defendBtn.addEventListener('click', commandDefend);
    const holdBtn = $("holdCommand");
    if (holdBtn) holdBtn.addEventListener('click', commandHold);
    const retreatBtn = $("retreatCommand");
    if (retreatBtn) retreatBtn.addEventListener('click', commandRetreat);
    const airstrikeBtn = $("airstrikeCommand");
    if (airstrikeBtn) airstrikeBtn.addEventListener('click', commandAirstrike);

    // Quick actions
    const quickFactory = $("quickFactory");
    if (quickFactory) quickFactory.addEventListener('click', quickBuildFactory);
    const quickReinforce = $("quickReinforce");
    if (quickReinforce) quickReinforce.addEventListener('click', quickReinforce);

    // Camera controls
    const zoomIn = $("zoomIn");
    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
            camera.position.addScaledVector(dir, -10);
            controls.update();
        });
    }
    const zoomOut = $("zoomOut");
    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
            camera.position.addScaledVector(dir, 10);
            controls.update();
        });
    }
    const resetCam = $("resetCamera");
    if (resetCam) {
        resetCam.addEventListener('click', () => {
            camera.position.set(80, 80, 120);
            controls.target.set(0, 0, 0);
            controls.update();
        });
    }
    const topDown = $("topDown");
    if (topDown) {
        topDown.addEventListener('click', () => {
            camera.position.set(0, 140, 0.1);
            controls.target.set(0, 0, 0);
            controls.update();
        });
    }

    const pauseBtn = $("pauseBtn");
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            paused = !paused;
            pauseBtn.textContent = paused ? "▶" : "Ⅱ";
            toast(paused ? "Game paused" : "Game resumed");
        });
    }
    const speedBtn = $("speedBtn");
    if (speedBtn) {
        speedBtn.addEventListener('click', () => {
            speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
            speedBtn.textContent = `${speed}×`;
            toast(`Speed: ${speed}×`);
        });
    }

    // Country display click
    const countryDisplay = $("countryDisplay");
    if (countryDisplay) {
        countryDisplay.addEventListener('click', () => {
            const modal = $("countryModal");
            if (modal) modal.classList.add('open');
        });
    }

    // Country selection
    document.querySelectorAll('.country-card').forEach(card => {
        card.addEventListener('click', () => {
            currentCountry = card.dataset.country;
            const data = nation[currentCountry] || { flag: "🏳️", name: currentCountry };
            const flagEl = $("countryFlag");
            const nameEl = $("countryName");
            if (flagEl) flagEl.textContent = data.flag;
            if (nameEl) nameEl.textContent = data.name;
            const modal = $("countryModal");
            if (modal) modal.classList.remove('open');
            toast(`Switched to ${data.name}`);
            updateAllUI();
            highlightCountry(currentCountry);
        });
    });
    const closeCountry = $("closeCountryModal");
    if (closeCountry) {
        closeCountry.addEventListener('click', () => {
            const modal = $("countryModal");
            if (modal) modal.classList.remove('open');
        });
    }

    // Country Info Modal close
    const closeCountryInfo = $("closeCountryInfo");
    if (closeCountryInfo) {
        closeCountryInfo.addEventListener('click', () => {
            const modal = $("countryInfoModal");
            if (modal) modal.classList.remove('open');
        });
    }

    // Tutorial
    let tutorialStep = 0;
    const tutorialData = [
        { title: "🌍 Welcome, Commander!", text: "Select a military unit and command it across the global battlefield. Click any country to view its territory and states." },
        { title: "📍 Movement", text: "Click a friendly unit (🟢), then click 'MOVE' and tap terrain to set destination." },
        { title: "⚔️ Combat", text: "Select a unit, click 'ATTACK', then tap an enemy unit (🔴) to engage in combat." },
        { title: "📊 Strategy", text: "Use the left panel to manage economy, production, research, and diplomacy. Click countries for detailed info!" }
    ];
    const tutorialNext = $("tutorialNext");
    if (tutorialNext) {
        tutorialNext.addEventListener('click', () => {
            tutorialStep++;
            if (tutorialStep >= tutorialData.length) {
                const tutorial = $("tutorial");
                if (tutorial) tutorial.style.display = 'none';
                return;
            }
            const t = tutorialData[tutorialStep];
            const titleEl = $("tutorialTitle");
            const textEl = $("tutorialText");
            if (titleEl) titleEl.textContent = t.title;
            if (textEl) textEl.textContent = t.text;
            tutorialNext.textContent = tutorialStep === tutorialData.length - 1 ? "FINISH" : "NEXT";
        });
    }

    const panelContent = $("panelContent");
    if (panelContent) {
        panelContent.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.dataset.layer) {
                setMapLayer(target.dataset.layer);
                openPanel("overview");
                return;
            }

            if (target.classList.contains('select-unit')) {
                const id = target.dataset.id;
                const unit = units.find(u => u.id === id);
                if (unit) selectUnit(unit);
                return;
            }

            if (target.id === 'tax-down') {
                tax = Math.max(5, tax - 2);
                toast(`Tax lowered to ${tax}%`);
                openPanel("economy");
                return;
            }
            if (target.id === 'tax-up') {
                tax = Math.min(50, tax + 2);
                toast(`Tax raised to ${tax}%`);
                openPanel("economy");
                return;
            }
            if (target.id === 'invest-industry') {
                if (money < 1000) { toast("Not enough money"); return; }
                money -= 1000;
                construction += 2;
                toast("Industry investment successful");
                openPanel("economy");
                return;
            }
            if (target.id === 'build-factory') {
                if (construction < 4) { toast("Need 4 construction points"); return; }
                construction -= 4;
                factories.military++;
                toast("Military factory built");
                openPanel("economy");
                return;
            }
            if (target.id === 'quick-factory') {
                quickBuildFactory();
                openPanel("production");
                return;
            }
            if (target.id === 'quick-reinforce') {
                quickReinforce();
                openPanel("production");
                return;
            }

            if (target.id.startsWith('factory-')) {
                const type = target.id.replace('factory-', '');
                assignFactory(type);
                return;
            }
            ['buy-tank', 'buy-infantry', 'buy-artillery', 'buy-air'].forEach(id => {
                if (target.id === id) {
                    const type = id.replace('buy-', '').toUpperCase();
                    const p = production[type];
                    if (!p) return;
                    if (money < p.cost) { toast("Not enough money"); return; }
                    if (steel < p.steel) { toast("Not enough steel"); return; }
                    money -= p.cost;
                    steel -= p.steel;
                    const pos = new THREE.Vector3((Math.random() - 0.5) * 30, 0, (Math.random() - 0.5) * 30);
                    create3DUnit(`New ${p.name} Unit`, type, pos.x, pos.z, true, currentCountry);
                    toast(`${p.name} unit deployed!`);
                    openPanel("production");
                    updateAllUI();
                }
            });

            if (target.id.startsWith('research-')) {
                const key = target.id.replace('research-', '');
                startResearch(key);
                return;
            }

            if (target.id.startsWith('dip-')) {
                const country = target.id.replace('dip-', '');
                improveDiplomacy(country);
                return;
            }
            if (target.id.startsWith('diplomatic-')) {
                const country = target.id.replace('diplomatic-', '');
                diplomaticAction(country);
                return;
            }

            if (target.id === 'run-recon') { runRecon(); return; }
            if (target.id === 'expand-spy') { expandSpyNetwork(); return; }
            if (target.id === 'improve-counter') { improveCounterIntel(); return; }
        });
    }

    // Set initial country
    const data = nation[currentCountry] || { flag: "🏳️", name: currentCountry };
    const flagEl = $("countryFlag");
    const nameEl = $("countryName");
    if (flagEl) flagEl.textContent = data.flag;
    if (nameEl) nameEl.textContent = data.name;

    // Highlight initial country
    highlightCountry(currentCountry);

    openPanel('overview');
    updateDateDisplay();
}

function openPanel(name) {
    const panel = panels[name];
    if (!panel) return;
    const kicker = $("panelKicker");
    const title = $("panelTitle");
    const content = $("panelContent");
    const mainPanel = $("mainPanel");

    if (kicker) kicker.textContent = panel.kicker || "STRATEGIC COMMAND";
    if (title) title.textContent = panel.title || name.toUpperCase();
    if (content) content.innerHTML = panel.html();
    if (mainPanel) mainPanel.classList.add('open');

    document.querySelectorAll('.panel-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === name);
    });
}

function updateAllUI() {
    updateDateDisplay();
    updateResources();
    updateUnitPanel();
    updateBattleStatus();
}

function updateDateDisplay() {
    const date = $("gameDate");
    if (!date) return;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    date.textContent = `${year} • ${months[month-1] || "JAN"} ${String(day).padStart(2,'0')}`;
}

function updateResources() {
    const res = [
        { id: 'money', val: Math.floor(money).toLocaleString() },
        { id: 'oil', val: Math.floor(oil).toLocaleString() },
        { id: 'steel', val: Math.floor(steel).toLocaleString() },
        { id: 'food', val: Math.floor(food).toLocaleString() },
        { id: 'manpower', val: Math.floor(manpower).toLocaleString() }
    ];
    res.forEach(r => {
        const el = $(r.id);
        if (el) el.textContent = r.val;
    });
}

function updateBattleStatus() {
    const el = $("battleStatus");
    if (!el) return;
    const enemies = units.filter(u => !u.friendly && u.state !== "DESTROYED");
    if (enemies.length === 0) {
        el.textContent = "🎉 VICTORY! ALL ENEMIES DESTROYED";
        el.style.color = "var(--green)";
        return;
    }
    const activeBattles = units.filter(u => u.state === "UNDER_ATTACK" || u.state === "ATTACKING");
    if (activeBattles.length > 0) {
        el.textContent = `⚔️ ACTIVE BATTLE — ${activeBattles.length} units engaged`;
        el.style.color = "var(--red)";
    } else {
        el.textContent = `🛡️ STANDING BY — ${enemies.length} enemy units remain`;
        el.style.color = "var(--accent)";
    }
}

function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
}

/* =========================================================
   COMMAND FUNCTIONS
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

function setUnitDestination(unit, point) {
    if (!unit || unit.state === "DESTROYED") return;
    unit.destination = new THREE.Vector3(point.x, unit.type === "AIR" ? 8 : 0, point.z);
    unit.state = "MOVING";
    unit.entrenchment = 0;
}

function handleWorldClick(event) {
    if (!renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // Check for country clicks first (on ground)
    const groundHits = raycaster.intersectObjects(borderGroup.children, true);
    for (const hit of groundHits) {
        let obj = hit.object;
        while (obj) {
            if (obj.userData?.country && nation[obj.userData.country]) {
                const country = obj.userData.country;
                highlightCountry(country);
                toast(`📍 ${nation[country].flag} ${nation[country].name} — Clicked!`);
                return;
            }
            obj = obj.parent;
        }
    }

    // Check for unit clicks
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

    // Move command
    if (selectedUnit && moveMode) {
        const groundHits2 = raycaster.intersectObject(ground);
        if (groundHits2.length) {
            const point = groundHits2[0].point;
            setUnitDestination(selectedUnit, point);
            moveMode = false;
            toast(`${selectedUnit.name} moving`);
        }
    }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

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
    const panel = $("unitPanel");
    if (panel) panel.classList.add("open");
}

function createSelectionVisual(unit) {
    clearSelectionVisual(unit);
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.5, 3.2, 32),
        new THREE.MeshBasicMaterial({
            color: unit.friendly ? 0xd5ad55 : 0xe45d5d,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = unit.type === 'AIR' ? -7.5 : 0.1;
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
    if (name) name.textContent = `${u.name} (${nation[u.country]?.flag || '🏳️'})`;

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

function statRow(label, value, cls = "") {
    return `<div class="stat-row"><span>${label}</span><b class="${cls}">${value}</b></div>`;
}

/* =========================================================
   GAME LOOP
   ========================================================== */

function loop() {
    requestAnimationFrame(loop);

    const dt = Math.min(clock.getDelta(), 0.05);

    if (!paused) {
        lastDateTick += dt * speed;
        if (lastDateTick >= 1.2) {
            lastDateTick = 0;
            day++;
            if (day > 30) {
                day = 1;
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
                updateDateDisplay();
            }
        }

        updateEconomy(dt);
        updateProduction(dt);
        updateResearch(dt);
        updateUnitMovement(dt);
        updateSupply(dt);
        updateRecovery(dt);
        enemyAI(dt);
        updateEffects(dt);

        for (const unit of units) {
            if (unit.state !== "DESTROYED") {
                updateUnitHPBar(unit);
            }
        }

        for (const unit of units) {
            if (unit.type === "AIR" && unit.object.userData.propeller) {
                unit.object.userData.propeller.rotation.x += dt * 30 * speed;
            }
        }

        autosaveTimer += dt;
        if (autosaveTimer >= 30) {
            autosaveTimer = 0;
            autosave();
        }

        updateResources();
        updateBattleStatus();

        if (selectedUnit && selectedUnit.selectionRing) {
            const ring = selectedUnit.selectionRing;
            ring.material.opacity = 0.6 + Math.sin(Date.now() * 0.003) * 0.3;
            ring.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
        }

        // Highlight animation
        if (highlightGroup.children.length > 0) {
            for (const child of highlightGroup.children) {
                if (child.material) {
                    child.material.opacity = 0.2 + Math.sin(Date.now() * 0.002) * 0.15;
                }
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
    if (labelRenderer) labelRenderer.render(scene, camera);
}

function updateEffects(dt) {
    for (let i = fxGroup.children.length - 1; i >= 0; i--) {
        const fx = fxGroup.children[i];
        fx.userData.life -= dt;
        if (fx.userData.velocity) {
            fx.position.add(fx.userData.velocity.clone().multiplyScalar(dt));
            fx.userData.velocity.multiplyScalar(0.98);
        }
        fx.scale.multiplyScalar(1 + dt * 0.5);
        fx.material.opacity = Math.max(0, fx.userData.life / 0.5);
        if (fx.userData.life <= 0) {
            fxGroup.remove(fx);
            fx.geometry?.dispose();
            fx.material?.dispose();
        }
    }
}

// Start the game
init().catch(console.error);