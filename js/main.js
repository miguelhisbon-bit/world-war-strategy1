import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   WORLD WAR — 3D GRAND STRATEGY
   UPGRADED MAIN.JS
   Drop-in replacement for js/main.js
========================================================= */

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

let scene, camera, renderer, controls, clock;
let ground, worldGroup, unitGroup, effectsGroup;
let units = [];
let selectedUnit = null;
let gameRunning = true;
let gameSpeed = 1;
let gameDay = 1, gameMonth = 1, gameYear = 1940;
let money = 12500, oil = 850, steel = 1250, food = 1600, manpower = 85000;
let moveMode = false, attackMode = false;
let lastIncomeTick = 0, lastAiTick = 0, lastMiniTick = 0;
let battleLog = [];
let fogEnabled = true;
let saveKey = "world_war_strategy_save_v3";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clockStart = performance.now();

const countries = {
  USA:{name:"United States",flag:"🇺🇸",money:12500,oil:850,steel:1250,food:1600,manpower:85000},
  GERMANY:{name:"Germany",flag:"🇩🇪",money:10000,oil:650,steel:1100,food:1200,manpower:95000},
  UK:{name:"United Kingdom",flag:"🇬🇧",money:11000,oil:700,steel:950,food:1300,manpower:70000},
  JAPAN:{name:"Japan",flag:"🇯🇵",money:9500,oil:500,steel:850,food:1000,manpower:80000},
  USSR:{name:"Soviet Union",flag:"☭",money:9000,oil:900,steel:1400,food:1800,manpower:130000},
  FRANCE:{name:"France",flag:"🇫🇷",money:9500,oil:600,steel:1000,food:1400,manpower:75000}
};

let currentCountry = "USA";

function updateLoading(p, text) {
  if ($("loadingProgress"))
    $("loadingProgress").style.width = `${Math.min(100,p)}%`;

  if ($("loadingStatus"))
    $("loadingStatus").textContent = text;
}

async function init() {
  try {
    updateLoading(10,"Initializing command system...");
    createScene();

    updateLoading(28,"Generating terrain...");
    createTerrain();

    updateLoading(50,"Deploying military forces...");
    createUnits();

    updateLoading(68,"Preparing command interface...");
    setupUI();

    updateLoading(82,"Loading campaign systems...");
    loadGame();

    updateLoading(95,"Finalizing battlefield...");
    startGameLoop();

    updateLoading(100,"Battlefield ready.");
    setTimeout(hideLoading,350);

  } catch (e) {
    console.error(e);
    hideLoading();
    showToast("Recovery mode: battlefield initialized with limited systems.");
  }
}

function createScene() {
  const canvas = $("gameCanvas");

  if (!canvas)
    throw new Error("gameCanvas not found");

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081016);
  scene.fog = new THREE.Fog(0x081016,75,430);

  camera = new THREE.PerspectiveCamera(
    55,
    innerWidth/innerHeight,
    .1,
    1000
  );

  camera.position.set(0,82,86);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    powerPreference:"high-performance"
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
  renderer.setSize(innerWidth,innerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(
    0xb9c6c8,
    0x182018,
    1.45
  );

  scene.add(hemi);

  const sun = new THREE.DirectionalLight(
    0xffe3b0,
    2.15
  );

  sun.position.set(-80,140,70);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048,2048);

  sun.shadow.camera.left=-180;
  sun.shadow.camera.right=180;
  sun.shadow.camera.top=180;
  sun.shadow.camera.bottom=-180;

  scene.add(sun);

  worldGroup = new THREE.Group();
  unitGroup = new THREE.Group();
  effectsGroup = new THREE.Group();

  scene.add(
    worldGroup,
    unitGroup,
    effectsGroup
  );

  controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping=true;
  controls.dampingFactor=.08;
  controls.minDistance=22;
  controls.maxDistance=245;
  controls.maxPolarAngle=Math.PI*.47;
  controls.minPolarAngle=.16;
  controls.target.set(0,0,0);

  clock = new THREE.Clock();

  addEventListener("resize",onResize);

  renderer.domElement.addEventListener(
    "pointerdown",
    handleWorldClick
  );
}

function createTerrain() {
  const size = 360;
  const seg = 120;

  const geo = new THREE.PlaneGeometry(
    size,
    size,
    seg,
    seg
  );

  const pos = geo.attributes.position;

  for(let i=0;i<pos.count;i++){

    const x=pos.getX(i);
    const y=pos.getY(i);

    const h =
      Math.sin(x*.055)*1.8 +
      Math.cos(y*.045)*1.5 +
      Math.sin((x+y)*.022)*3.2 +
      Math.sin(x*.14+y*.08)*.65;

    pos.setZ(i,h);
  }

  geo.computeVertexNormals();

  const tex = createTerrainTexture();

  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;

  tex.repeat.set(9,9);
  tex.colorSpace=THREE.SRGBColorSpace;

  ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map:tex,
      color:0xffffff,
      roughness:.97,
      metalness:.015
    })
  );

  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  ground.userData.isGround=true;

  worldGroup.add(ground);

  const grid=new THREE.GridHelper(
    360,
    90,
    0x69715f,
    0x30392f
  );

  grid.position.y=.18;
  grid.material.opacity=.09;
  grid.material.transparent=true;

  worldGroup.add(grid);

  const water=new THREE.Mesh(
    new THREE.PlaneGeometry(520,520),
    new THREE.MeshStandardMaterial({
      color:0x174354,
      transparent:true,
      opacity:.58,
      roughness:.18,
      metalness:.08
    })
  );

  water.rotation.x=-Math.PI/2;
  water.position.y=-4.2;

  worldGroup.add(water);

  createRivers();
  createForests();
  createMountains();
  createRoads();
  createSettlements();
  createBattleMarkers();
}

function createTerrainTexture(){

  const c=document.createElement("canvas");

  c.width=512;
  c.height=512;

  const ctx=c.getContext("2d");

  const img=ctx.createImageData(512,512);

  for(let y=0;y<512;y++){

    for(let x=0;x<512;x++){

      const n=
        (
          Math.sin(x*.12)+
          Math.sin(y*.16)+
          Math.sin((x+y)*.055)
        )*3;

      const r=47+n;
      const g=63+n*.8;
      const b=45+n*.45;

      const i=(y*512+x)*4;

      img.data[i]=r;
      img.data[i+1]=g;
      img.data[i+2]=b;
      img.data[i+3]=255;
    }
  }

  ctx.putImageData(img,0,0);

  ctx.globalAlpha=.18;
  ctx.strokeStyle="#d4c89d";
  ctx.lineWidth=1;

  for(let i=0;i<80;i++){

    const x=Math.random()*512;
    const y=Math.random()*512;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      Math.random()*2+.5,
      0,
      Math.PI*2
    );

    ctx.stroke();
  }

  return new THREE.CanvasTexture(c);
}

function createRivers(){

  const mat=new THREE.MeshStandardMaterial({
    color:0x245a70,
    roughness:.16,
    metalness:.05,
    transparent:true,
    opacity:.9
  });

  for(let r=0;r<3;r++){

    const pts=[];
    const base=-150+r*95;

    for(let i=0;i<=14;i++){

      const x=base+i*22;

      const z=
        Math.sin(i*.8+r)*12+
        r*12;

      pts.push(
        new THREE.Vector3(
          x,
          .12,
          z
        )
      );
    }

    const curve=
      new THREE.CatmullRomCurve3(pts);

    const tube=new THREE.Mesh(
      new THREE.TubeGeometry(
        curve,
        80,
        1.15,
        8,
        false
      ),
      mat.clone()
    );

    tube.rotation.x=0;

    worldGroup.add(tube);
  }
}

function createForests(){

  const mat=new THREE.MeshStandardMaterial({
    color:0x263d28,
    roughness:1
  });

  for(let i=0;i<110;i++){

    const g=new THREE.Group();

    const trunk=new THREE.Mesh(
      new THREE.CylinderGeometry(
        .12,
        .18,
        1.3,
        5
      ),
      new THREE.MeshStandardMaterial({
        color:0x493a2a,
        roughness:1
      })
    );

    trunk.position.y=.65;

    const crown=new THREE.Mesh(
      new THREE.ConeGeometry(
        .75+Math.random()*.35,
        2.2+Math.random()*1.5,
        7
      ),
      mat.clone()
    );

    crown.position.y=2;

    g.add(
      trunk,
      crown
    );

    g.position.set(
      (Math.random()-.5)*330,
      .25,
      (Math.random()-.5)*330
    );

    g.scale.setScalar(
      .7+Math.random()*.8
    );

    g.rotation.y=
      Math.random()*Math.PI;

    g.castShadow=true;

    worldGroup.add(g);
  }
}

function createSettlements(){

  for(let i=0;i<22;i++){

    const g=new THREE.Group();

    for(let b=0;b<3;b++){

      const house=new THREE.Mesh(
        new THREE.BoxGeometry(
          1.4,
          1+Math.random(),
          1.2
        ),
        new THREE.MeshStandardMaterial({
          color:0x77715f,
          roughness:.9
        })
      );

      house.position.set(
        (b-1)*1.6,
        .5,
        (Math.random()-.5)*2
      );

      house.castShadow=true;

      g.add(house);
    }

    g.position.set(
      (Math.random()-.5)*300,
      .25,
      (Math.random()-.5)*300
    );

    worldGroup.add(g);
  }
}

function createMountains(){

  for(let i=0;i<34;i++){

    const h=10+Math.random()*22;
    const w=4+Math.random()*9;

    const m=new THREE.Mesh(
      new THREE.ConeGeometry(w,h,8),
      new THREE.MeshStandardMaterial({
        color:0x394039,
        roughness:1
      })
    );

    m.position.set(
      (Math.random()-.5)*320,
      h/2,
      (Math.random()-.5)*320
    );

    m.rotation.y=Math.random()*Math.PI;

    m.castShadow=true;

    worldGroup.add(m);

    if(h>20){

      const snow=new THREE.Mesh(
        new THREE.ConeGeometry(
          w*.48,
          h*.3,
          8
        ),
        new THREE.MeshStandardMaterial({
          color:0xb9b8aa,
          roughness:.95
        })
      );

      snow.position.set(
        m.position.x,
        h*.82,
        m.position.z
      );

      snow.castShadow=true;

      worldGroup.add(snow);
    }
  }
}

function createRoads(){

  const roadMat=
    new THREE.MeshStandardMaterial({
      color:0x33332f,
      roughness:.96
    });

  for(let i=0;i<16;i++){

    const road=new THREE.Mesh(
      new THREE.BoxGeometry(
        115,
        .09,
        1.7
      ),
      roadMat.clone()
    );

    road.position.set(
      (Math.random()-.5)*190,
      .3,
      (Math.random()-.5)*190
    );

    road.rotation.y=
      Math.random()*Math.PI;

    worldGroup.add(road);

    const line=new THREE.Mesh(
      new THREE.BoxGeometry(
        115,
        .012,
        .08
      ),
      new THREE.MeshBasicMaterial({
        color:0xc6b98a,
        transparent:true,
        opacity:.35
      })
    );

    line.position.copy(
      road.position
    );

    line.position.y=.36;
    line.rotation.y=road.rotation.y;

    worldGroup.add(line);
  }
}

function createBattleMarkers(){

  for(let i=0;i<18;i++){

    const ring=new THREE.Mesh(
      new THREE.RingGeometry(
        .7,
        1,
        16
      ),
      new THREE.MeshBasicMaterial({
        color:0x8b3d32,
        transparent:true,
        opacity:.4,
        side:THREE.DoubleSide
      })
    );

    ring.rotation.x=-Math.PI/2;

    ring.position.set(
      (Math.random()-.5)*280,
      .4,
      (Math.random()-.5)*280
    );

    worldGroup.add(ring);
  }
}

function createUnits(){

  units=[];

  const data=[
    ["1st Armored Division","TANK",-30,12,true],
    ["2nd Infantry Division","INFANTRY",-18,20,true],
    ["3rd Infantry Division","INFANTRY",-5,28,true],
    ["Air Wing Alpha","AIR",15,12,true],

    ["Enemy Armor Group","TANK",45,-20,false],
    ["Enemy Infantry Corps","INFANTRY",35,-5,false],
    ["Enemy Defense Force","INFANTRY",55,12,false],
    ["Enemy Air Wing","AIR",65,-18,false]
  ];

  data.forEach(d =>
    createMilitaryUnit(
      d[0],
      d[1],
      d[2],
      d[3],
      d[4]
    )
  );

  refreshMiniMap();
}

function createMilitaryUnit(
  name,
  type,
  x,
  z,
  friendly
){

  const group=new THREE.Group();

  const mainMat=new THREE.MeshStandardMaterial({
    color:
      friendly
        ?
          (
            type==="AIR"
              ?0x65737a
              :type==="TANK"
                ?0x566b4f
                :0x60715a
          )
        :
          (
            type==="AIR"
              ?0x704842
              :type==="TANK"
                ?0x633b36
                :0x68453f
          ),
    roughness:.72,
    metalness:type==="TANK"?.2:.08
  });

  if(type==="TANK"){

    const body=new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        1.8,
        3.2
      ),
      mainMat
    );

    body.position.y=1.2;
    body.castShadow=true;

    group.add(body);

    const turret=new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.25,
        1.35,
        .8,
        12
      ),
      mainMat
    );

    turret.position.y=2.25;
    turret.castShadow=true;

    group.add(turret);

    const cannon=new THREE.Mesh(
      new THREE.BoxGeometry(
        .35,
        .35,
        3.8
      ),
      new THREE.MeshStandardMaterial({
        color:0x202521,
        metalness:.6,
        roughness:.4
      })
    );

    cannon.position.set(
      0,
      2.35,
      2.1
    );

    group.add(cannon);

  } else if(type==="INFANTRY"){

    const body=new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .65,
        1.4,
        5,
        8
      ),
      mainMat
    );

    body.position.y=1.5;
    body.castShadow=true;

    group.add(body);

    const head=new THREE.Mesh(
      new THREE.SphereGeometry(
        .48,
        12,
        12
      ),
      new THREE.MeshStandardMaterial({
        color:0x8c6c50
      })
    );

    head.position.y=2.8;
    head.castShadow=true;

    group.add(head);

    const rifle=new THREE.Mesh(
      new THREE.BoxGeometry(
        .18,
        .18,
        2.2
      ),
      new THREE.MeshStandardMaterial({
        color:0x151817
      })
    );

    rifle.position.set(
      .5,
      1.5,
      .5
    );

    rifle.rotation.x=-.2;

    group.add(rifle);

  } else {

    const fuselage=new THREE.Mesh(
      new THREE.CapsuleGeometry(
        .7,
        4,
        5,
        10
      ),
      mainMat
    );

    fuselage.rotation.x=Math.PI/2;
    fuselage.castShadow=true;

    group.add(fuselage);

    const wing=new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        .2,
        1.3
      ),
      mainMat
    );

    group.add(wing);

    group.position.y=8;
  }

  group.position.set(
    x,
    type==="AIR"?8:.5,
    z
  );

  const unit={
    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),

    name,
    type,
    friendly,

    object:group,

    hp:100,
    maxHp:100,

    organization:100,
    morale:85,

    strength:
      type==="TANK"
        ?85
        :type==="AIR"
          ?75
          :70,

    speed:
      type==="TANK"
        ?18
        :type==="AIR"
          ?35
          :12,

    attack:
      type==="TANK"
        ?24
        :type==="AIR"
          ?30
          :16,

    range:
      type==="TANK"
        ?22
        :type==="AIR"
          ?55
          :16,

    destination:null,
    state:"READY",

    cooldown:0,
    experience:0,

    maxOrganization:100,
    maxMorale:100,

    manpowerCost:
      type==="TANK"
        ?2400
        :type==="AIR"
          ?1800
          :18000,

    equipment:
      type==="TANK"
        ?85
        :type==="AIR"
          ?90
          :100,

    fuelPerHour:
      type==="TANK"
        ?18
        :type==="AIR"
          ?34
          :7,

    supply:92,
    entrenchment:0,
    readiness:100,

    orders:[],

    template:
      type==="TANK"
        ?"Armored Breakthrough"
        :type==="AIR"
          ?"Air Superiority"
          :"Line Infantry",

    doctrine:
      type==="TANK"
        ?"Mobile Warfare"
        :"Combined Arms",

    experienceLevel:1,
    losses:0
  };

  group.userData.unit=unit;

  group.add(
    createUnitLabel(
      name,
      friendly
    )
  );

  unitGroup.add(group);
  units.push(unit);
}

function createUnitLabel(
  text,
  friendly
){

  const c=document.createElement("canvas");

  c.width=512;
  c.height=80;

  const ctx=c.getContext("2d");

  ctx.fillStyle="rgba(5,8,10,.85)";
  ctx.fillRect(0,0,512,80);

  ctx.font="bold 25px Arial";
  ctx.textAlign="center";

  ctx.fillStyle=
    friendly
      ?"#d5ad55"
      :"#e45d5d";

  ctx.fillText(
    text,
    256,
    48
  );

  const s=new THREE.Sprite(
    new THREE.SpriteMaterial({
      map:new THREE.CanvasTexture(c),
      transparent:true
    })
  );

  s.scale.set(
    8,
    1.25,
    1
  );

  s.position.y=5;

  return s;
}

function setupUI(){

  setupPanelButtons();
  setupUnitCommands();
  setupCountrySelection();

  setupSpeed();
  setupPause();
  setupCamera();
  setupTutorial();
  setupCloseButtons();

  updateResources();
  updateDate();

  openPanel("overview");
}

function setupPanelButtons(){

  document
    .querySelectorAll(".panel-button")
    .forEach(btn=>{

      btn.addEventListener(
        "click",
        ()=>{

          document
            .querySelectorAll(".panel-button")
            .forEach(b =>
              b.classList.remove("active")
            );

          btn.classList.add("active");

          openPanel(
            btn.dataset.panel
          );
        }
      );
    });
}

function stat(label,value){

  return `
    <div class="stat-row">
      <span>${label}</span>
      <b>${value}</b>
    </div>
  `;
}

function openPanel(type){

  const panel=$("mainPanel");
  const title=$("panelTitle");
  const kicker=$("panelKicker");
  const content=$("panelContent");

  if(
    !panel||
    !title||
    !kicker||
    !content
  )
    return;

  panel.classList.add("open");

  const friendly=
    units.filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    );

  const data={

    overview:[
      "World Overview",
      "STRATEGIC COMMAND",

      `
      <div class="info-card">

        <h3>Global Situation</h3>

        <p>
          Monitor the entire war:
          fronts, military balance,
          national resources,
          enemy activity and
          strategic readiness.
        </p>

        ${stat(
          "Active Fronts",
          countBattles()
        )}

        ${stat(
          "Friendly Forces",
          friendly.length
        )}

        ${stat(
          "Enemy Forces",
          units.filter(
            u =>
              !u.friendly &&
              u.state!=="DESTROYED"
          ).length
        )}

        ${stat(
          "Threat Level",
          enemyThreat()
        )}

        ${stat(
          "Campaign Year",
          gameYear
        )}

      </div>

      <div class="info-card">

        <h3>Military Strength</h3>

        ${barStat(
          "Army Strength",
          Math.round(avg("strength"))
        )}

        ${barStat(
          "Organization",
          Math.round(avg("organization"))
        )}

        ${barStat(
          "Morale",
          Math.round(avg("morale"))
        )}

        ${barStat(
          "Readiness",
          Math.round(avg("readiness"))
        )}

        ${stat(
          "Manpower",
          Math.floor(manpower)
            .toLocaleString()
        )}

      </div>

      <div class="info-card">

        <h3>War Status</h3>

        ${stat(
          "National Status",
          friendsStatus()
        )}

        ${stat(
          "Enemy Threat",
          enemyThreat()
        )}

        ${stat(
          "Enemy Armor",
          enemyArmor()
        )}

        ${stat(
          "Active Orders",
          friendly.filter(
            u =>
              u.destination ||
              u.state!=="READY"
          ).length
        )}

      </div>

      <div class="info-card">

        <h3>National Economy</h3>

        ${stat(
          "Treasury",
          "$"+
          Math.floor(money)
            .toLocaleString()
        )}

        ${stat(
          "Oil",
          Math.floor(oil)
            .toLocaleString()
        )}

        ${stat(
          "Steel",
          Math.floor(steel)
            .toLocaleString()
        )}

        ${stat(
          "Food",
          Math.floor(food)
            .toLocaleString()
        )}

      </div>

      <div class="info-card">

        <h3>Strategic Intelligence</h3>

        ${stat(
          "Enemy Units Spotted",
          units.filter(
            u =>
              !u.friendly &&
              u.state!=="DESTROYED"
          ).length
        )}

        ${stat(
          "Enemy Armor Groups",
          units.filter(
            u =>
              !u.friendly &&
              u.type==="TANK" &&
              u.state!=="DESTROYED"
          ).length
        )}

        ${stat(
          "Air Threat",
          units.filter(
            u =>
              !u.friendly &&
              u.type==="AIR" &&
              u.state!=="DESTROYED"
          ).length
            ?"DETECTED"
            :"LOW"
        )}

        ${stat(
          "Battle Log",
          battleLog.length
            ?"UPDATED"
            :"NO RECENT REPORT"
        )}

      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:6px
        "
      >

        <button
          class="action-btn"
          id="overviewArmyBtn"
        >
          VIEW ARMY
        </button>

        <button
          class="action-btn"
          id="overviewIntelBtn"
        >
          RUN INTELLIGENCE
        </button>

      </div>
      `
    ],

    army:[
      "Army Command",
      "MILITARY COMMAND",
      armyCommandHTML(friendly)
    ],

    economy:[
      "National Economy",
      "ECONOMIC COMMAND",

      `
      <div class="info-card">

        <h3>National Production</h3>

        ${stat(
          "Treasury",
          money.toLocaleString()
        )}

        ${stat(
          "Oil",
          Math.floor(oil)
        )}

        ${stat(
          "Steel",
          Math.floor(steel)
        )}

        ${stat(
          "Food",
          Math.floor(food)
        )}

        ${stat(
          "Manpower",
          Math.floor(manpower)
            .toLocaleString()
        )}

      </div>

      <button
        class="action-btn"
        id="economyBoost"
      >
        INVEST IN INDUSTRY — $1000
      </button>
      `
    ],

    production:[
      "Military Production",
      "INDUSTRIAL COMMAND",

      `
      <div class="info-card">

        <h3>Production Queue</h3>

        ${stat(
          "Tank production",
          "67%"
        )}

        ${stat(
          "Aircraft",
          "31%"
        )}

        ${stat(
          "Infantry equipment",
          "42%"
        )}

      </div>

      <button
        class="action-btn"
        id="produceTank"
      >
        PRODUCE TANK — $800 / 80 STEEL
      </button>

      <button
        class="action-btn"
        id="reinforce"
      >
        REINFORCE ARMY — 500 MANPOWER
      </button>
      `
    ],

    research:[
      "Technology",
      "RESEARCH COMMAND",

      `
      <div class="info-card">

        <h3>Research</h3>

        ${stat(
          "Armored Warfare",
          "64%"
        )}

        ${stat(
          "Logistics",
          "42%"
        )}

        ${stat(
          "Air Doctrine",
          "28%"
        )}

      </div>

      <button
        class="action-btn"
        id="researchBtn"
      >
        ADVANCE RESEARCH — $1200
      </button>
      `
    ],

    diplomacy:[
      "Diplomacy",
      "FOREIGN AFFAIRS",

      `
      <div class="info-card">

        <h3>International Relations</h3>

        ${stat(
          "Germany",
          "HOSTILE"
        )}

        ${stat(
          "United Kingdom",
          "NEUTRAL"
        )}

        ${stat(
          "USSR",
          "CAUTIOUS"
        )}

        ${stat(
          "Japan",
          "TENSE"
        )}

      </div>
      `
    ],

    intel:[
      "Intelligence",
      "INTELLIGENCE COMMAND",

      `
      <div class="info-card">

        <h3>Enemy Intelligence</h3>

        ${stat(
          "Enemy Army",
          enemyThreat()
        )}

        ${stat(
          "Enemy Armor",
          enemyArmor()
        )}

        ${stat(
          "Threat Level",
          enemyThreat()
        )}

      </div>

      <button
        class="action-btn"
        id="intelBtn"
      >
        RUN RECON — $250
      </button>
      `
    ],

    settings:[
      "Game Settings",
      "SYSTEM CONTROL",

      `
      <div class="info-card">

        <h3>Graphics</h3>

        <button
          class="action-btn"
          id="toggleFog"
        >
          TOGGLE BATTLEFIELD FOG
        </button>

        <button
          class="action-btn"
          id="resetBtn"
        >
          RESET CAMERA
        </button>

        <button
          class="action-btn"
          id="saveBtn"
        >
          SAVE CAMPAIGN
        </button>

        <button
          class="action-btn"
          id="loadBtn"
        >
          LOAD CAMPAIGN
        </button>

      </div>
      `
    ]
  };

  const d=data[type]||data.overview;

  title.textContent=d[0];
  kicker.textContent=d[1];
  content.innerHTML=d[2];

  bindUnitButtons();

  if(type==="army"){

    bindArmyPanel();

    if($("armyNewOrder"))
      $("armyNewOrder").onclick=() =>
        showToast(
          "Select a unit, then use MOVE or ATTACK to issue an order."
        );

    if($("armyMerge"))
      $("armyMerge").onclick=() =>
        showToast(
          "Select two compatible units to merge."
        );

    if($("armySplit"))
      $("armySplit").onclick=() =>
        showToast(
          "Select a unit to split its formation."
        );

    if($("armyDisband"))
      $("armyDisband").onclick=() =>
        showToast(
          "Select a unit before disbanding."
        );
  }

  if($("economyBoost"))
    $("economyBoost").onclick=()=>{

      if(money>=1000){

        money-=1000;
        steel+=150;

        saveGame();
        updateResources();

        showToast(
          "Industrial investment completed."
        );

      }else{

        showToast(
          "Insufficient funds."
        );
      }
    };

  if($("produceTank"))
    $("produceTank").onclick=
      produceTank;

  if($("reinforce"))
    $("reinforce").onclick=
      reinforceArmy;

  if($("researchBtn"))
    $("researchBtn").onclick=()=>{

      if(money>=1200){

        money-=1200;

        units
          .filter(u=>u.friendly)
          .forEach(
            u =>
              u.strength=
                Math.min(
                  100,
                  u.strength+3
                )
          );

        updateResources();

        showToast(
          "Research breakthrough completed."
        );

      }else{

        showToast(
          "Insufficient funds."
        );
      }
    };

  if($("intelBtn"))
    $("intelBtn").onclick=()=>{

      if(money>=250){

        money-=250;

        updateResources();

        showToast(
          "Recon report updated: enemy positions revealed."
        );

      }else{

        showToast(
          "Insufficient funds."
        );
      }
    };

  if($("supplyArmy"))
    $("supplyArmy").onclick=()=>{

      if(oil<120)
        return showToast(
          "Insufficient fuel reserve."
        );

      oil-=120;

      units
        .filter(
          u =>
            u.friendly &&
            u.state!=="DESTROYED"
        )
        .forEach(u=>{

          u.supply=
            Math.min(
              100,
              u.supply+15
            );

          u.readiness=
            Math.min(
              100,
              u.readiness+8
            );
        });

      updateResources();

      showToast(
        "Army supply priority activated."
      );
    };

  if($("upgradeDoctrine"))
    $("upgradeDoctrine").onclick=()=>{

      if(money<900)
        return showToast(
          "Need $900 for doctrine research."
        );

      money-=900;

      units
        .filter(u=>u.friendly)
        .forEach(
          u =>
            u.strength=
              Math.min(
                100,
                u.strength+2
              )
        );

      updateResources();

      showToast(
        "Doctrine upgraded."
      );
    };

  if($("createTemplate"))
    $("createTemplate").onclick=() =>
      showToast(
        "Template editor ready for future expansion."
      );

  if($("toggleFog"))
    $("toggleFog").onclick=()=>{

      fogEnabled=!fogEnabled;

      scene.fog=
        fogEnabled
          ?new THREE.Fog(
              0x081016,
              75,
              430
            )
          :null;

      showToast(
        fogEnabled
          ?"Fog enabled."
          :"Fog disabled."
      );
    };

  if($("resetBtn"))
    $("resetBtn").onclick=
      resetCamera;

  if($("saveBtn"))
    $("saveBtn").onclick=
      saveGame;

  if($("loadBtn"))
    $("loadBtn").onclick=()=>{

      loadGame();

      showToast(
        "Campaign loaded."
      );
    };

  if($("overviewArmyBtn"))
    $("overviewArmyBtn").onclick=
      () => openPanel("army");

  if($("overviewIntelBtn"))
    $("overviewIntelBtn").onclick=()=>{

      if(money>=250){

        money-=250;

        updateResources();

        addBattleLog(
          "Strategic intelligence report updated."
        );

        showToast(
          "Intelligence report updated."
        );

        openPanel("overview");

      }else{

        showToast(
          "Insufficient funds."
        );
      }
    };
}

function armyCommandHTML(friendly){

  const avgStrength=
    Math.round(
      avg("strength")
    );

  const avgOrg=
    Math.round(
      avg("organization")
    );

  const avgMorale=
    Math.round(
      avg("morale")
    );

  const ready=
    friendly.filter(
      u =>
        u.readiness>=75 &&
        u.hp>35
    ).length;

  const tanks=
    friendly.filter(
      u=>u.type==="TANK"
    ).length*8;

  const infantry=
    friendly.filter(
      u=>u.type==="INFANTRY"
    ).length*12;

  const air=
    friendly.filter(
      u=>u.type==="AIR"
    ).length*6;

  const artillery=
    friendly.filter(
      u=>u.type==="ARTILLERY"
    ).length*6;

  return `
  <div
    class="army-tabs"
    style="
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      margin-bottom:12px
    "
  >

    <button
      class="action-btn army-tab active"
      data-tab="overview"
    >
      OVERVIEW
    </button>

    <button
      class="action-btn army-tab"
      data-tab="units"
    >
      UNITS
    </button>

    <button
      class="action-btn army-tab"
      data-tab="templates"
    >
      TEMPLATES
    </button>

    <button
      class="action-btn army-tab"
      data-tab="doctrine"
    >
      DOCTRINE
    </button>

    <button
      class="action-btn army-tab"
      data-tab="logistics"
    >
      LOGISTICS
    </button>

  </div>

  <div id="armyTabContent">

    <div class="info-card">

      <h3>
        Available Forces

        <span style="float:right">
          ${ready}/${friendly.length} READY
        </span>
      </h3>

      ${friendly
        .slice(0,8)
        .map(
          u=>`
          <button
            class="action-btn unit-select"
            data-unit="${u.id}"
            style="
              text-align:left;
              margin:5px 0;
              width:100%
            "
          >

            <b>
              ${unitIcon(u.type)}
              ${u.name}
            </b>

            <br>

            <small>
              ${u.type}
              • ${Math.round(u.hp)}% HP
              • ${Math.round(u.readiness)}% READY
            </small>

          </button>
          `
        )
        .join("")}

    </div>

    <div class="info-card">

      <h3>
        Army Statistics
      </h3>

      ${barStat(
        "Army Strength",
        avgStrength
      )}

      ${barStat(
        "Organization",
        avgOrg
      )}

      ${barStat(
        "Morale",
        avgMorale
      )}

      ${barStat(
        "Readiness",
        Math.round(avg("readiness"))
      )}

      ${stat(
        "Manpower",
        Math.floor(manpower)
          .toLocaleString()
      )}

    </div>

    <div class="info-card">

      <h3>
        Composition
      </h3>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:4px
        "
      >

        ${stat(
          "Tanks",
          tanks
        )}

        ${stat(
          "Infantry",
          infantry
        )}

        ${stat(
          "Artillery",
          artillery
        )}

        ${stat(
          "Aircraft",
          air
        )}

      </div>

    </div>

    <div class="info-card">

      <h3>

        Active Orders

        <span style="float:right">

          ${
            friendly.filter(
              u =>
                u.destination ||
                [
                  "ATTACKING",
                  "DEFENDING",
                  "HOLDING",
                  "ADVANCING"
                ].includes(u.state)
            ).length
          }

          /
          ${Math.max(5,friendly.length)}

        </span>

      </h3>

      ${
        friendly
          .filter(
            u =>
              u.destination ||
              u.state!=="READY"
          )
          .slice(0,5)
          .map(
            u=>`
            <div class="stat-row">

              <span>

                ${unitIcon(u.type)}
                ${u.name}

                <small
                  style="
                    display:block;
                    opacity:.65
                  "
                >
                  ${
                    u.destination
                      ?"Moving to objective"
                      :"Holding / combat posture"
                  }
                </small>

              </span>

              <b>
                ${u.state}
              </b>

            </div>
            `
          )
          .join("")
        ||
        "<p>No active orders.</p>"
      }

    </div>

    <div
      style="
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:6px
      "
    >

      <button
        class="action-btn"
        id="armyNewOrder"
      >
        NEW ORDER
      </button>

      <button
        class="action-btn"
        id="armyMerge"
      >
        MERGE
      </button>

      <button
        class="action-btn"
        id="armySplit"
      >
        SPLIT
      </button>

      <button
        class="action-btn"
        id="armyDisband"
      >
        DISBAND
      </button>

    </div>

  </div>
  `;
}

function unitIcon(type){

  return type==="TANK"
    ?"🛡️"
    :type==="AIR"
      ?"✈️"
      :type==="ARTILLERY"
        ?"🎯"
        :"🪖";
}

function barStat(label,value){

  return `
    <div class="unit-stat">

      <span>${label}</span>

      <div class="progress">

        <i
          style="
            width:${Math.max(
              0,
              Math.min(
                100,
                value
              )
            )}%
          "
        ></i>

      </div>

      <b>${value}%</b>

    </div>
  `;
}

function bindArmyPanel(){

  document
    .querySelectorAll(".army-tab")
    .forEach(
      b =>
        b.onclick=()=>{

          document
            .querySelectorAll(".army-tab")
            .forEach(
              x =>
                x.classList.remove(
                  "active"
                )
            );

          b.classList.add("active");

          const box=$(
            "armyTabContent"
          );

          if(!box)
            return;

          const tab=
            b.dataset.tab;

          if(tab==="units"){

            box.innerHTML=
              units
                .filter(
                  u =>
                    u.friendly &&
                    u.state!=="DESTROYED"
                )
                .map(
                  u=>`
                  <button
                    class="action-btn unit-select"
                    data-unit="${u.id}"
                    style="
                      width:100%;
                      text-align:left;
                      margin:4px 0
                    "
                  >

                    ${unitIcon(u.type)}

                    <b>
                      ${u.name}
                    </b>

                    —
                    ${u.type}

                    —
                    HP
                    ${Math.round(u.hp)}%

                    —
                    ORG
                    ${Math.round(u.organization)}%

                    —
                    XP
                    ${Math.round(u.experience)}

                  </button>
                  `
                )
                .join("")
              ||
              "<p>No active units.</p>";

          }else if(tab==="templates"){

            box.innerHTML=`
              <div class="info-card">

                <h3>
                  Division Templates
                </h3>

                ${
                  [
                    "Armored Breakthrough",
                    "Mechanized Infantry",
                    "Line Infantry",
                    "Air Assault"
                  ]
                  .map(
                    (x,i)=>`
                    <div class="stat-row">

                      <span>

                        ${x}

                        <small
                          style="
                            display:block;
                            opacity:.6
                          "
                        >

                          ${
                            i===0
                              ?"High armor / breakthrough"
                              :i===1
                                ?"Fast combined arms"
                                :"Balanced frontline formation"
                          }

                        </small>

                      </span>

                      <b>
                        EDIT
                      </b>

                    </div>
                    `
                  )
                  .join("")
                }

                <button
                  class="action-btn"
                  id="createTemplate"
                >
                  CREATE TEMPLATE
                </button>

              </div>
            `;

          }else if(tab==="doctrine"){

            box.innerHTML=`
              <div class="info-card">

                <h3>
                  Army Doctrine
                </h3>

                ${stat(
                  "Current Doctrine",
                  "Combined Arms"
                )}

                ${stat(
                  "Armored Warfare",
                  "LEVEL II"
                )}

                ${stat(
                  "Air Support",
                  "LEVEL I"
                )}

                ${stat(
                  "Entrenchment",
                  "LEVEL II"
                )}

                <button
                  class="action-btn"
                  id="upgradeDoctrine"
                >
                  RESEARCH DOCTRINE — $900
                </button>

              </div>
            `;

          }else if(tab==="logistics"){

            box.innerHTML=`
              <div class="info-card">

                <h3>
                  Army Logistics
                </h3>

                ${barStat(
                  "Supply Coverage",
                  Math.round(
                    avg("supply")
                  )
                )}

                ${stat(
                  "Fuel Demand",
                  Math.round(
                    units
                      .filter(
                        u =>
                          u.friendly &&
                          u.state!=="DESTROYED"
                      )
                      .reduce(
                        (s,u)=>
                          s+u.fuelPerHour,
                        0
                      )
                  )+" / h"
                )}

                ${stat(
                  "Equipment",
                  Math.round(
                    units
                      .filter(
                        u =>
                          u.friendly &&
                          u.state!=="DESTROYED"
                      )
                      .reduce(
                        (s,u)=>
                          s+u.equipment,
                        0
                      )
                      /
                      Math.max(
                        1,
                        units.filter(
                          u =>
                            u.friendly &&
                            u.state!=="DESTROYED"
                        ).length
                      )
                  )+"%"
                )}

                ${stat(
                  "Fuel Reserve",
                  Math.floor(oil)
                )}

                <button
                  class="action-btn"
                  id="supplyArmy"
                >
                  PRIORITIZE SUPPLY — 120 OIL
                </button>

              </div>
            `;

          }else{

            box.outerHTML=
              armyCommandHTML(
                units.filter(
                  u =>
                    u.friendly &&
                    u.state!=="DESTROYED"
                )
              )
              .match(
                /<div id="armyTabContent">([\s\S]*)<\/div>\s*$/
              )?.[0]
              ||
              box.outerHTML;
          }

          bindArmyPanel();
          bindUnitButtons();
        }
    );
}

function bindUnitButtons(){

  document
    .querySelectorAll(".unit-select")
    .forEach(
      b =>
        b.onclick=()=>{

          const u=
            units.find(
              x =>
                x.id===
                b.dataset.unit
            );

          if(u)
            selectUnit(u);
        }
    );
}

function avg(k){

  const a=
    units.filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    );

  return a.length
    ?
      a.reduce(
        (s,u)=>s+u[k],
        0
      )/a.length
    :
      0;
}

function enemyThreat(){

  const e=
    units.filter(
      u =>
        !u.friendly &&
        u.state!=="DESTROYED"
    );

  return e.length>=4
    ?"HIGH"
    :e.length>=2
      ?"MEDIUM"
      :"LOW";
}

function enemyArmor(){

  return units.filter(
    u =>
      !u.friendly &&
      u.type==="TANK" &&
      u.state!=="DESTROYED"
  ).length
    ?"HIGH"
    :"LOW";
}

function friendsStatus(){

  const f=
    units.filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    );

  if(!f.length)
    return "DEFEAT";

  const avgHp=
    f.reduce(
      (s,u)=>s+u.hp,
      0
    )/f.length;

  const avgOrg=
    f.reduce(
      (s,u)=>s+u.organization,
      0
    )/f.length;

  if(
    avgHp<35 ||
    avgOrg<30
  )
    return "CRITICAL";

  if(
    avgHp<60 ||
    avgOrg<55
  )
    return "UNDER PRESSURE";

  if(
    avgHp<80 ||
    avgOrg<75
  )
    return "STABLE";

  return "STRONG";
}

function countBattles(){

  return units.filter(
    u =>
      u.state==="ATTACKING" ||
      u.state==="UNDER ATTACK"
  ).length;
}

function selectUnit(u){

  selectedUnit=u;

  if($("unitPanel"))
    $("unitPanel")
      .classList.add("open");

  if($("selectedUnitType"))
    $("selectedUnitType")
      .textContent=
        `${u.type} • ${u.state}`;

  if($("selectedUnitName"))
    $("selectedUnitName")
      .textContent=u.name;

  updateUnitStats();

  showToast(
    `${u.name} selected`
  );
}

function updateUnitStats(){

  if(
    !selectedUnit ||
    !$("unitStats")
  )
    return;

  const u=selectedUnit;

  $("unitStats").innerHTML=`

    <div class="unit-stat">

      <span>
        Strength
      </span>

      <div class="progress">
        <i
          style="width:${u.strength}%"
        ></i>
      </div>

      <b>
        ${Math.round(u.strength)}
      </b>

    </div>

    <div class="unit-stat">

      <span>
        Organization
      </span>

      <div class="progress">
        <i
          style="width:${u.organization}%"
        ></i>
      </div>

      <b>
        ${Math.round(u.organization)}
      </b>

    </div>

    <div class="unit-stat">

      <span>
        Morale
      </span>

      <div class="progress">
        <i
          style="width:${u.morale}%"
        ></i>
      </div>

      <b>
        ${Math.round(u.morale)}
      </b>

    </div>

    <div class="unit-stat">

      <span>
        Health
      </span>

      <div class="progress">
        <i
          style="width:${u.hp}%"
        ></i>
      </div>

      <b>
        ${Math.round(u.hp)}
      </b>

    </div>

    ${stat(
      "Speed",
      u.speed+" km/h"
    )}

    ${stat(
      "Experience",
      Math.round(u.experience)
    )}

    ${stat(
      "Status",
      u.state
    )}
  `;
}

function setupUnitCommands(){

  const on=(id,fn)=>{
    if($(id))
      $(id).onclick=fn;
  };

  on(
    "moveCommand",
    ()=>{
      if(!selectedUnit)
        return showToast(
          "Select a unit first."
        );

      moveMode=true;
      attackMode=false;

      showToast(
        "Tap battlefield for destination."
      );
    }
  );

  on(
    "attackCommand",
    ()=>{
      if(!selectedUnit)
        return showToast(
          "Select a unit first."
        );

      attackMode=true;
      moveMode=false;

      showToast(
        "Select an enemy target."
      );
    }
  );

  on(
    "defendCommand",
    ()=>{
      if(!selectedUnit)
        return;

      selectedUnit.state=
        "DEFENDING";

      selectedUnit.destination=
        null;

      selectedUnit.organization=
        Math.min(
          100,
          selectedUnit.organization+8
        );

      showToast(
        `${selectedUnit.name} is defending.`
      );

      updateUnitStats();
    }
  );

  on(
    "holdCommand",
    ()=>{
      if(!selectedUnit)
        return;

      selectedUnit.destination=
        null;

      selectedUnit.state=
        "HOLDING";

      showToast(
        `${selectedUnit.name} holding.`
      );
    }
  );

  on(
    "retreatCommand",
    ()=>{
      if(!selectedUnit)
        return;

      selectedUnit.state=
        "RETREATING";

      selectedUnit.destination=
        new THREE.Vector3(
          selectedUnit.object.position.x-25,
          selectedUnit.object.position.y,
          selectedUnit.object.position.z+25
        );

      showToast(
        `${selectedUnit.name} retreating.`
      );
    }
  );

  on(
    "airstrikeCommand",
    ()=>{

      if(!selectedUnit)
        return showToast(
          "Select an aircraft."
        );

      if(selectedUnit.type!=="AIR")
        return showToast(
          "Only aircraft can perform airstrikes."
        );

      if(selectedUnit.cooldown>0)
        return showToast(
          `Airstrike ready in ${Math.ceil(
            selectedUnit.cooldown
          )}s.`
        );

      performAirstrike();
    }
  );
}

function handleWorldClick(e){

  const r=
    renderer.domElement
      .getBoundingClientRect();

  mouse.x=
    ((e.clientX-r.left)/r.width)*2-1;

  mouse.y=
    -((e.clientY-r.top)/r.height)*2+1;

  raycaster.setFromCamera(
    mouse,
    camera
  );

  const objects=[];

  units.forEach(
    u =>
      u.object.traverse(
        o=>{
          if(
            o.isMesh ||
            o.isSprite
          )
            objects.push(o);
        }
      )
  );

  const hits=
    raycaster.intersectObjects(
      objects,
      true
    );

  if(hits.length){

    let o=
      hits[0].object;

    while(
      o &&
      !o.userData.unit
    )
      o=o.parent;

    if(o?.userData.unit){

      const u=
        o.userData.unit;

      if(
        attackMode &&
        selectedUnit &&
        !u.friendly
      ){

        attackUnit(
          selectedUnit,
          u
        );

        attackMode=false;

        return;
      }

      selectUnit(u);

      return;
    }
  }

  if(
    moveMode &&
    selectedUnit
  ){

    const hits2=
      raycaster.intersectObject(
        ground
      );

    if(hits2.length){

      const p=
        hits2[0].point;

      setDestination(
        selectedUnit,
        p
      );

      moveMode=false;
    }
  }
}

function setDestination(u,p){

  u.destination=
    new THREE.Vector3(
      p.x,
      u.object.position.y,
      p.z
    );

  u.state="MOVING";

  createDestinationMarker(p);

  showToast(
    `${u.name} moving to new position.`
  );
}

function createDestinationMarker(p){

  const ring=new THREE.Mesh(
    new THREE.RingGeometry(
      1.1,
      1.35,
      24
    ),
    new THREE.MeshBasicMaterial({
      color:0xd5ad55,
      transparent:true,
      opacity:.8,
      side:THREE.DoubleSide
    })
  );

  ring.rotation.x=-Math.PI/2;

  ring.position.set(
    p.x,
    .45,
    p.z
  );

  effectsGroup.add(ring);

  const t=performance.now();

  const animate=n=>{

    const q=
      Math.min(
        (n-t)/1200,
        1
      );

    ring.scale.setScalar(
      1+q*2
    );

    ring.material.opacity=
      .8*(1-q);

    if(q<1)
      requestAnimationFrame(
        animate
      );
    else{

      effectsGroup.remove(
        ring
      );

      ring.geometry.dispose();
      ring.material.dispose();
    }
  };

  requestAnimationFrame(
    animate
  );
}

function attackUnit(a,t){

  if(
    !a ||
    !t ||
    !a.friendly ||
    t.friendly
  )
    return;

  const d=
    a.object.position.distanceTo(
      t.object.position
    );

  if(d>a.range+5){

    setDestination(
      a,
      t.object.position
    );

    a.state="ATTACKING";

    showToast(
      "Target out of range — unit advancing."
    );

    return;
  }

  if(a.cooldown>0)
    return showToast(
      `Weapon reload: ${a.cooldown.toFixed(1)}s`
    );

  a.cooldown=
    a.type==="AIR"
      ?8
      :a.type==="TANK"
        ?2.2
        :3;

  a.state="ATTACKING";
  t.state="UNDER ATTACK";

  const terrainBonus=
    t.state==="DEFENDING"
      ?.8
      :1;

  const damage=Math.max(
    2,
    (
      a.attack*
      (.65+Math.random()*.7)*
      (a.organization/100)*
      (a.morale/100)*
      terrainBonus
    )
  );

  t.hp=
    Math.max(
      0,
      t.hp-damage
    );

  t.organization=
    Math.max(
      0,
      t.organization-damage*.8
    );

  t.morale=
    Math.max(
      0,
      t.morale-damage*.25
    );

  a.experience=
    Math.min(
      100,
      a.experience+1.2
    );

  a.strength=
    Math.min(
      100,
      a.strength+.05
    );

  createExplosion(
    t.object.position.clone()
  );

  addBattleLog(
    `${a.name} hit ${t.name} for ${Math.round(damage)} damage.`
  );

  if($("battleStatus"))
    $("battleStatus").textContent=
      `BATTLE: ${a.name} vs ${t.name}`;

  showToast(
    `${a.name} attacked ${t.name}`
  );

  if(t.hp<=0)
    destroyUnit(t);

  updateUnitStats();
}

function performAirstrike(){

  const enemies=
    units.filter(
      u =>
        !u.friendly &&
        u.state!=="DESTROYED"
    );

  if(!enemies.length)
    return showToast(
      "No enemy targets."
    );

  const target=
    enemies.reduce(
      (best,u)=>
        u.hp<best.hp
          ?u
          :best,
      enemies[0]
    );

  selectedUnit.cooldown=8;

  const p=
    target.object.position.clone();

  p.y=1;

  createExplosion(p);

  createExplosion(
    p.clone().add(
      new THREE.Vector3(
        3,
        0,
        2
      )
    )
  );

  target.hp=
    Math.max(
      0,
      target.hp-
      28-
      Math.random()*14
    );

  target.organization=
    Math.max(
      0,
      target.organization-24
    );

  target.morale=
    Math.max(
      0,
      target.morale-12
    );

  addBattleLog(
    `Airstrike hit ${target.name}.`
  );

  showToast(
    `Airstrike hit ${target.name}`
  );

  if(target.hp<=0)
    destroyUnit(target);
}

function createExplosion(pos){

  const g=
    new THREE.SphereGeometry(
      1,
      16,
      16
    );

  const m=
    new THREE.MeshBasicMaterial({
      color:0xff8a27,
      transparent:true,
      opacity:.9
    });

  const e=
    new THREE.Mesh(
      g,
      m
    );

  e.position.copy(pos);

  effectsGroup.add(e);

  const start=
    performance.now();

  const animate=n=>{

    const p=
      Math.min(
        (n-start)/650,
        1
      );

    e.scale.setScalar(
      1+p*5
    );

    m.opacity=
      .9*(1-p);

    if(p<1)
      requestAnimationFrame(
        animate
      );
    else{

      effectsGroup.remove(e);

      g.dispose();
      m.dispose();
    }
  };

  requestAnimationFrame(
    animate
  );

  createSmoke(pos);
}

function createSmoke(pos){

  const g=
    new THREE.SphereGeometry(
      .7,
      10,
      10
    );

  const m=
    new THREE.MeshBasicMaterial({
      color:0x3b3b35,
      transparent:true,
      opacity:.5
    });

  const s=
    new THREE.Mesh(
      g,
      m
    );

  s.position.copy(pos);
  s.position.y+=1;

  effectsGroup.add(s);

  const start=
    performance.now();

  const animate=n=>{

    const p=
      Math.min(
        (n-start)/1400,
        1
      );

    s.position.y+=.012;

    s.scale.setScalar(
      1+p*3
    );

    m.opacity=
      .5*(1-p);

    if(p<1)
      requestAnimationFrame(
        animate
      );
    else{

      effectsGroup.remove(s);

      g.dispose();
      m.dispose();
    }
  };

  requestAnimationFrame(
    animate
  );
}

function destroyUnit(u){

  u.state="DESTROYED";
  u.object.visible=false;
  u.destination=null;

  createExplosion(
    u.object.position.clone()
  );

  if(selectedUnit===u){

    selectedUnit=null;

    if($("unitPanel"))
      $("unitPanel")
        .classList.remove("open");
  }

  addBattleLog(
    `${u.name} was destroyed.`
  );

  refreshMiniMap();

  checkVictory();

  showToast(
    `${u.name} destroyed.`
  );
}

function updateGame(dt){

  if(!gameRunning)
    return;

  const d=
    dt*gameSpeed;

  units.forEach(u=>{

    if(u.state==="DESTROYED")
      return;

    u.cooldown=
      Math.max(
        0,
        u.cooldown-d
      );

    if(u.destination){

      const target=
        u.destination;

      const dist=
        u.object.position.distanceTo(
          target
        );

      if(dist<1){

        u.destination=null;

        if(
          u.state==="MOVING" ||
          u.state==="RETREATING"
        )
          u.state="READY";

      }else{

        const dir=
          new THREE.Vector3()
            .subVectors(
              target,
              u.object.position
            )
            .normalize();

        const speed=
          u.speed*.055*d;

        u.object.position.add(
          dir.multiplyScalar(
            Math.min(
              speed,
              dist
            )
          )
        );

        u.object.lookAt(
          target.x,
          u.object.position.y,
          target.z
        );

        u.organization=
          Math.max(
            0,
            u.organization-.004*d
          );

        if(u.type==="TANK")
          oil=
            Math.max(
              0,
              oil-.006*d
            );
      }
    }

    if(u.state==="DEFENDING")
      u.organization=
        Math.min(
          100,
          u.organization+.012*d
        );

    if(u.state==="HOLDING")
      u.morale=
        Math.min(
          100,
          u.morale+.006*d
        );

    u.supply=
      Math.max(
        0,
        Math.min(
          100,
          u.supply-
          (
            u.destination
              ?.018
              :.006
          )*d
        )
      );

    u.readiness=
      Math.max(
        0,
        Math.min(
          100,
          u.readiness+
          (
            u.supply>45
              ?.012
              :-0.035
          )*d
        )
      );

    if(u.type==="AIR")
      oil=
        Math.max(
          0,
          oil-.01*d
        );
  });

  lastIncomeTick+=dt;

  if(lastIncomeTick>=1){

    const income=
      lastIncomeTick*
      gameSpeed;

    money+=
      1.8*income;

    steel+=
      .55*income;

    food+=
      .4*income;

    oil+=
      .18*income;

    lastIncomeTick=0;

    updateResources();
  }

  lastAiTick+=dt;

  if(
    lastAiTick>
    2/gameSpeed
  ){

    enemyAI();

    lastAiTick=0;
  }

  if(
    performance.now()-
    lastMiniTick>700
  ){

    refreshMiniMap();

    lastMiniTick=
      performance.now();
  }

  if(selectedUnit)
    updateUnitStats();
}

function enemyAI(){

  const enemies=
    units.filter(
      u =>
        !u.friendly &&
        u.state!=="DESTROYED"
    );

  const friendlies=
    units.filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    );

  if(
    !friendlies.length ||
    !enemies.length
  )
    return;

  enemies.forEach(e=>{

    const target=
      friendlies.reduce(
        (best,u)=>{

          const bd=
            best.object.position
              .distanceTo(
                e.object.position
              );

          const d=
            u.object.position
              .distanceTo(
                e.object.position
              );

          return d<bd
            ?u
            :best;

        },
        friendlies[0]
      );

    const d=
      e.object.position
        .distanceTo(
          target.object.position
        );

    if(d<=e.range+2){

      e.state="ATTACKING";

      if(e.cooldown<=0)
        attackEnemy(
          e,
          target
        );

    }else if(
      !e.destination ||
      Math.random()<.025
    ){

      const p=
        target.object.position
          .clone();

      p.x+=
        (Math.random()-.5)*8;

      p.z+=
        (Math.random()-.5)*8;

      e.destination=
        new THREE.Vector3(
          p.x,
          e.object.position.y,
          p.z
        );

      e.state="ADVANCING";
    }
  });
}

function attackEnemy(a,t){

  if(a.cooldown>0)
    return;

  a.cooldown=
    a.type==="TANK"
      ?2.6
      :a.type==="AIR"
        ?7
        :3.4;

  const damage=Math.max(
    2,
    a.attack*
    (.5+Math.random()*.55)*
    (a.organization/100)*
    (a.morale/100)
  );

  t.hp=
    Math.max(
      0,
      t.hp-damage
    );

  t.organization=
    Math.max(
      0,
      t.organization-
      damage*.65
    );

  t.morale=
    Math.max(
      0,
      t.morale-
      damage*.18
    );

  createExplosion(
    t.object.position.clone()
  );

  addBattleLog(
    `${a.name} attacked ${t.name}.`
  );

  if(t.hp<=0)
    destroyUnit(t);
}

function checkVictory(){

  const enemies=
    units.filter(
      u =>
        !u.friendly &&
        u.state!=="DESTROYED"
    );

  const friends=
    units.filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    );

  if(!enemies.length){

    gameRunning=false;

    showToast(
      "VICTORY — Enemy forces eliminated."
    );

    if($("statusText"))
      $("statusText").textContent=
        "VICTORY";

  }else if(!friends.length){

    gameRunning=false;

    showToast(
      "DEFEAT — All friendly forces destroyed."
    );

    if($("statusText"))
      $("statusText").textContent=
        "DEFEAT";
  }
}

function produceTank(){

  if(
    money<800 ||
    steel<80
  )
    return showToast(
      "Need $800 and 80 steel."
    );

  money-=800;
  steel-=80;

  const base=
    units.find(
      u =>
        u.friendly &&
        u.type==="TANK" &&
        u.state!=="DESTROYED"
    );

  const x=
    base
      ?base.object.position.x-7
      :-35;

  const z=
    base
      ?base.object.position.z+5
      :15;

  createMilitaryUnit(
    `Reserve Tank ${
      units.filter(
        u =>
          u.friendly &&
          u.type==="TANK"
      ).length+1
    }`,
    "TANK",
    x,
    z,
    true
  );

  updateResources();
  refreshMiniMap();

  showToast(
    "New tank deployed."
  );
}

function reinforceArmy(){

  if(
    manpower<500 ||
    food<100
  )
    return showToast(
      "Need 500 manpower and 100 food."
    );

  manpower-=500;
  food-=100;

  units
    .filter(
      u =>
        u.friendly &&
        u.state!=="DESTROYED"
    )
    .forEach(u=>{

      u.hp=
        Math.min(
          100,
          u.hp+12
        );

      u.organization=
        Math.min(
          100,
          u.organization+15
        );
    });

  updateResources();

  showToast(
    "Reinforcements arrived."
  );
}

function setupSpeed(){

  if(!$("speedBtn"))
    return;

  $("speedBtn").onclick=()=>{

    const a=[
      1,
      2,
      4,
      8
    ];

    const i=
      a.indexOf(
        gameSpeed
      );

    gameSpeed=
      a[
        (i+1)%a.length
      ];

    $("speedBtn").textContent=
      `${gameSpeed}×`;
  };
}

function setupPause(){

  if(!$("pauseBtn"))
    return;

  $("pauseBtn").onclick=()=>{

    gameRunning=
      !gameRunning;

    $("pauseBtn").textContent=
      gameRunning
        ?"Ⅱ"
        :"▶";

    if($("statusText"))
      $("statusText").textContent=
        gameRunning
          ?"All systems operational"
          :"GAME PAUSED";
  };
}

function setupCamera(){

  if($("zoomIn"))
    $("zoomIn").onclick=()=>{
      camera.position.multiplyScalar(.85);
    };

  if($("zoomOut"))
    $("zoomOut").onclick=()=>{
      camera.position.multiplyScalar(1.15);
    };

  if($("resetCamera"))
    $("resetCamera").onclick=
      resetCamera;
}

function resetCamera(){

  camera.position.set(
    0,
    82,
    86
  );

  controls.target.set(
    0,
    0,
    0
  );

  controls.update();

  showToast(
    "Strategic camera reset."
  );
}

function setupCountrySelection(){

  document
    .querySelectorAll(".country-card")
    .forEach(
      c =>
        c.addEventListener(
          "click",
          ()=>selectCountry(
            c.dataset.country
          )
        )
    );

  if($("closeCountryModal"))
    $("closeCountryModal").onclick=()=>{

      if($("countryModal"))
        $("countryModal")
          .classList.remove("open");
    };
}

function selectCountry(id){

  const c=countries[id];

  if(!c)
    return;

  currentCountry=id;

  money=c.money;
  oil=c.oil;
  steel=c.steel;
  food=c.food;
  manpower=c.manpower;

  if($("countryFlag"))
    $("countryFlag").textContent=
      c.flag;

  if($("countryName"))
    $("countryName").textContent=
      c.name;

  updateResources();

  if($("countryModal"))
    $("countryModal")
      .classList.remove("open");

  saveGame();

  showToast(
    `Now commanding ${c.name}`
  );
}

function setupTutorial(){

  const t=$("tutorial");
  const title=$("tutorialTitle");
  const text=$("tutorialText");
  const btn=$("tutorialNext");

  if(
    !t ||
    !title ||
    !text ||
    !btn
  )
    return;

  const pages=[

    [
      "Welcome, Commander",
      "Select a unit and use MOVE, ATTACK, DEFEND or HOLD."
    ],

    [
      "Realistic Combat",
      "Units have health, organization, morale, range, reload and experience."
    ],

    [
      "Logistics",
      "Tanks consume oil. Food and manpower support your army."
    ],

    [
      "Enemy AI",
      "Enemy forces will advance, select targets and attack automatically."
    ],

    [
      "Campaign",
      "Use Economy, Production, Research and Intelligence to win the war."
    ]
  ];

  let page=0;

  btn.onclick=()=>{

    page++;

    if(page>=pages.length){

      t.style.display="none";

      return;
    }

    title.textContent=
      pages[page][0];

    text.textContent=
      pages[page][1];
  };
}

function setupCloseButtons(){

  if($("closePanel"))
    $("closePanel").onclick=() =>
      $("mainPanel")
        ?.classList.remove("open");

  if($("closeUnit"))
    $("closeUnit").onclick=()=>{

      $("unitPanel")
        ?.classList.remove("open");

      selectedUnit=null;
    };
}

function refreshMiniMap(){

  const c=$("miniUnits");

  if(!c)
    return;

  c.innerHTML="";

  units.forEach(u=>{

    if(u.state==="DESTROYED")
      return;

    const d=
      document.createElement("div");

    d.style.cssText=`
      position:absolute;
      width:6px;
      height:6px;
      border-radius:50%;
      left:${Math.max(
        3,
        Math.min(
          97,
          50+
          u.object.position.x/3
        )
      )}%;
      top:${Math.max(
        3,
        Math.min(
          97,
          50+
          u.object.position.z/3
        )
      )}%;
      background:${
        u.friendly
          ?"#55d18a"
          :"#e45d5d"
      };
      box-shadow:
        0 0 5px currentColor;
    `;

    c.appendChild(d);
  });
}

function advanceDate(){

  gameDay++;

  if(gameDay>30){

    gameDay=1;
    gameMonth++;

    if(gameMonth>12){

      gameMonth=1;
      gameYear++;
    }
  }

  updateDate();
  saveGame();
}

function updateDate(){

  const m=[
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

  if($("gameDate"))
    $("gameDate").textContent=
      `${gameYear} • ${
        m[gameMonth-1]
      } ${
        String(gameDay)
          .padStart(2,"0")
      }`;
}

function updateResources(){

  const set=(id,v)=>{

    if($(id))
      $(id).textContent=
        Math.floor(v)
          .toLocaleString();
  };

  set("money",money);
  set("oil",oil);
  set("steel",steel);
  set("food",food);
  set("manpower",manpower);
}

function addBattleLog(text){

  battleLog.unshift(
    `[${gameYear}-${
      String(gameMonth)
        .padStart(2,"0")
    }-${
      String(gameDay)
        .padStart(2,"0")
    }] ${text}`
  );

  battleLog=
    battleLog.slice(
      0,
      20
    );

  const el=$("battleLog");

  if(el)
    el.innerHTML=
      battleLog
        .map(
          x=>`<div>${x}</div>`
        )
        .join("");
}

function saveGame(){

  try{

    const data={

      currentCountry,

      money,
      oil,
      steel,
      food,
      manpower,

      gameDay,
      gameMonth,
      gameYear,

      units:
        units.map(
          u=>({

            id:u.id,
            name:u.name,
            type:u.type,
            friendly:u.friendly,

            hp:u.hp,
            organization:
              u.organization,

            morale:u.morale,
            strength:u.strength,

            experience:
              u.experience,

            state:u.state,

            supply:u.supply,
            readiness:
              u.readiness,

            losses:u.losses,

            x:u.object.position.x,
            y:u.object.position.y,
            z:u.object.position.z
          })
        )
    };

    localStorage.setItem(
      saveKey,
      JSON.stringify(data)
    );

  }catch(e){

    console.warn(
      "Save failed",
      e
    );
  }
}

function loadGame(){

  try{

    const raw=
      localStorage.getItem(
        saveKey
      );

    if(!raw)
      return;

    const d=
      JSON.parse(raw);

    if(d.currentCountry)
      currentCountry=
        d.currentCountry;

    [
      "money",
      "oil",
      "steel",
      "food",
      "manpower",
      "gameDay",
      "gameMonth",
      "gameYear"
    ]
    .forEach(
      k=>{

        if(
          Number.isFinite(
            d[k]
          )
        )
          window[k]=d[k];
      }
    );

    if(Array.isArray(d.units)){

      d.units.forEach(s=>{

        const u=
          units.find(
            x =>
              x.id===s.id ||
              x.name===s.name
          );

        if(u){

          [
            "hp",
            "organization",
            "morale",
            "strength",
            "experience",
            "supply",
            "readiness",
            "losses"
          ]
          .forEach(
            k=>{

              if(
                Number.isFinite(
                  s[k]
                )
              )
                u[k]=s[k];
            }
          );

          if(s.state)
            u.state=s.state;

          if(
            Number.isFinite(s.x)
          )
            u.object.position.set(
              s.x,
              s.y ??
                u.object.position.y,
              s.z ??
                u.object.position.z
            );

          if(
            u.state==="DESTROYED"
          )
            u.object.visible=false;
        }
      });
    }

    updateResources();
    updateDate();
    refreshMiniMap();

  }catch(e){

    console.warn(
      "Load failed",
      e
    );
  }
}

function startGameLoop(){

  let lastDateTick=
    performance.now();

  function animate(){

    requestAnimationFrame(
      animate
    );

    const delta=
      Math.min(
        clock.getDelta(),
        .1
      );

    updateGame(delta);

    if(
      performance.now()-
      lastDateTick>
      4000/gameSpeed
    ){

      advanceDate();

      lastDateTick=
        performance.now();
    }

    controls.update();

    renderer.render(
      scene,
      camera
    );
  }

  animate();
}

function showToast(message){

  const toast=$("toast");

  if(!toast)
    return;

  toast.textContent=
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer=
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2200
    );
}

function hideLoading(){

  $("loadingScreen")
    ?.classList.add(
      "hidden"
    );
}

function onResize(){

  if(
    !camera ||
    !renderer
  )
    return;

  camera.aspect=
    innerWidth/
    innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );
}

addEventListener(
  "error",
  e =>
    console.error(
      "Runtime error:",
      e.error
    )
);

addEventListener(
  "unhandledrejection",
  e =>
    console.error(
      "Promise error:",
      e.reason
    )
);

setTimeout(()=>{

  const l=$("loadingScreen");

  if(
    l &&
    !l.classList.contains(
      "hidden"
    )
  ){

    hideLoading();

    showToast(
      "Battlefield loaded in recovery mode."
    );
  }

},10000);

init();