const SAVE_KEY = "WWS_PREMIUM_SAVE";

const defaultGame = {
  money:10000,
  oil:5000,
  steel:5000,
  food:5000,

  reputation:50,
  stability:78,
  nationLevel:1,

  infantry:1000,
  armor:150,
  aircraft:60,
  ships:25,

  airBases:2,
  defense:500,

  wins:0,
  losses:0,
  xp:0,
  level:1,

  satellite:1,

  cities:[
    {
      name:"Aurora City",
      icon:"🏙️",
      type:"Capital",
      level:3,
      buildings:"Capital • Factory • Defense HQ"
    },
    {
      name:"Ironvale",
      icon:"⛏️",
      type:"Industrial City",
      level:2,
      buildings:"Steel Works • Factory • Mine"
    },
    {
      name:"Greenfield",
      icon:"🌾",
      type:"Agricultural City",
      level:2,
      buildings:"Farms • Food Storage • Housing"
    },
    {
      name:"Harbor Point",
      icon:"⚓",
      type:"Naval City",
      level:1,
      buildings:"Port • Shipyard"
    }
  ],

  research:{
    military:1,
    industry:1,
    air:1,
    naval:1,
    defense:1,
    economy:1,
    intelligence:1
  },

  diplomacy:{
    "Northern Dominion":-30,
    "Western Empire":-15,
    "Southern Republic":35,
    "Eastern Alliance":20
  },

  news:[
    "🌍 A new strategic era has begun.",
    "🏭 Industrial production is increasing.",
    "🛰️ Satellite network is online."
  ]
};


let game = loadGame();

let scene;
let camera;
let renderer;
let globe;
let globeGroup;

let rotating = true;

let targetRotation = 0;

let currentZoom = 5;


function loadGame(){

  try{

    const saved =
      localStorage.getItem(SAVE_KEY);

    if(saved){

      return {
        ...structuredClone(defaultGame),
        ...JSON.parse(saved)
      };

    }

  }catch(error){

    console.log(error);

  }

  return structuredClone(defaultGame);

}


function saveGame(){

  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(game)
  );

}


function format(value){

  return Math.floor(value).toLocaleString();

}


function toast(message){

  const box =
    document.getElementById("toast");

  box.textContent = message;

  box.classList.add("show");

  setTimeout(()=>{
    box.classList.remove("show");
  },2200);

}


function addNews(message){

  game.news.unshift(message);

  game.news =
    game.news.slice(0,8);

  renderNews();

  saveGame();

}


function militaryPower(){

  const researchBonus =
    1 + game.research.military * .04;

  return Math.floor(

    (
      game.infantry +
      game.armor * 12 +
      game.aircraft * 20 +
      game.ships * 25
    ) * researchBonus

  );

}


function init3D(){

  const container =
    document.getElementById("globeContainer");

  scene =
    new THREE.Scene();

  camera =
    new THREE.PerspectiveCamera(
      45,
      container.clientWidth /
      container.clientHeight,
      .1,
      100
    );

  camera.position.z =
    currentZoom;


  renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      alpha:true
    });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio,2)
  );

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  container.appendChild(renderer.domElement);


  const ambient =
    new THREE.AmbientLight(
      0x8ac8ff,
      1.5
    );

  scene.add(ambient);


  const light =
    new THREE.DirectionalLight(
      0xffffff,
      2.2
    );

  light.position.set(5,3,5);

  scene.add(light);


  globeGroup =
    new THREE.Group();

  scene.add(globeGroup);


  const geometry =
    new THREE.SphereGeometry(
      2.05,
      64,
      64
    );


  const material =
    new THREE.MeshPhongMaterial({

      color:0x0b5a91,

      emissive:0x031a2b,

      shininess:35,

      transparent:true,

      opacity:.98

    });


  globe =
    new THREE.Mesh(
      geometry,
      material
    );

  globeGroup.add(globe);


  createGrid();

  createAtmosphere();

  createContinents();

  createMarkers();


  window.addEventListener(
    "resize",
    resize3D
  );


  setupGlobeTouch();

  animate3D();

}


function createGrid(){

  const group =
    new THREE.Group();

  const material =
    new THREE.LineBasicMaterial({
      color:0x2a94c9,
      transparent:true,
      opacity:.18
    });


  for(let lat=-60;lat<=60;lat+=15){

    const points=[];

    const phi =
      (90-lat) * Math.PI/180;

    for(
      let lon=0;
      lon<=360;
      lon+=4
    ){

      const theta =
        lon * Math.PI/180;

      const r=2.06;

      points.push(
        new THREE.Vector3(
          r*Math.sin(phi)*Math.cos(theta),
          r*Math.cos(phi),
          r*Math.sin(phi)*Math.sin(theta)
        )
      );

    }

    const geometry =
      new THREE.BufferGeometry()
      .setFromPoints(points);

    group.add(
      new THREE.Line(
        geometry,
        material
      )
    );

  }


  for(let lon=0;lon<360;lon+=15){

    const points=[];

    const theta =
      lon*Math.PI/180;

    for(
      let lat=-90;
      lat<=90;
      lat+=4
    ){

      const phi =
        (90-lat)*Math.PI/180;

      const r=2.061;

      points.push(
        new THREE.Vector3(
          r*Math.sin(phi)*Math.cos(theta),
          r*Math.cos(phi),
          r*Math.sin(phi)*Math.sin(theta)
        )
      );

    }

    const geometry =
      new THREE.BufferGeometry()
      .setFromPoints(points);

    group.add(
      new THREE.Line(
        geometry,
        material
      )
    );

  }

  globeGroup.add(group);

}


function createAtmosphere(){

  const geometry =
    new THREE.SphereGeometry(
      2.15,
      64,
      64
    );

  const material =
    new THREE.MeshBasicMaterial({

      color:0x299dff,

      transparent:true,

      opacity:.10,

      side:THREE.BackSide

    });

  const atmosphere =
    new THREE.Mesh(
      geometry,
      material
    );

  globeGroup.add(atmosphere);

}


function createContinents(){

  const continentMaterial =
    new THREE.MeshBasicMaterial({
      color:0x3b9b65,
      transparent:true,
      opacity:.72
    });


  const shapes=[

    {
      x:-.5,
      y:.6,
      z:1.85,
      s:.5
    },

    {
      x:.75,
      y:.35,
      z:1.78,
      s:.42
    },

    {
      x:-.8,
      y:-.35,
      z:1.82,
      s:.55
    },

    {
      x:.45,
      y:-.65,
      z:1.72,
      s:.38
    },

    {
      x:1.05,
      y:-.15,
      z:1.75,
      s:.28
    }

  ];


  shapes.forEach(item=>{

    const geo =
      new THREE.IcosahedronGeometry(
        item.s,
        1
      );

    const mesh =
      new THREE.Mesh(
        geo,
        continentMaterial
      );

    mesh.position.set(
      item.x,
      item.y,
      item.z
    );

    mesh.scale.set(
      1.5,
      .55,
      .12
    );

    globeGroup.add(mesh);

  });

}


function createMarkers(){

  const markerData=[

    {
      x:-.65,
      y:.55,
      z:1.95,
      color:0x36c9ff
    },

    {
      x:.65,
      y:.75,
      z:1.85,
      color:0xff5264
    },

    {
      x:1.1,
      y:-.1,
      z:1.72,
      color:0xff5264
    },

    {
      x:-.35,
      y:-.65,
      z:1.88,
      color:0x3ee0a0
    }

  ];


  markerData.forEach(data=>{

    const geometry =
      new THREE.SphereGeometry(
        .06,
        16,
        16
      );

    const material =
      new THREE.MeshBasicMaterial({
        color:data.color
      });

    const marker =
      new THREE.Mesh(
        geometry,
        material
      );

    marker.position.set(
      data.x,
      data.y,
      data.z
    );

    globeGroup.add(marker);


    const ringGeometry =
      new THREE.RingGeometry(
        .08,
        .1,
        24
      );

    const ringMaterial =
      new THREE.MeshBasicMaterial({
        color:data.color,
        transparent:true,
        opacity:.5,
        side:THREE.DoubleSide
      });

    const ring =
      new THREE.Mesh(
        ringGeometry,
        ringMaterial
      );

    ring.position.copy(
      marker.position
    );

    ring.lookAt(0,0,0);

    globeGroup.add(ring);

  });

}


function animate3D(){

  requestAnimationFrame(
    animate3D
  );


  if(rotating){

    globeGroup.rotation.y += .0018;

  }


  renderer.render(
    scene,
    camera
  );

}


function resize3D(){

  const container =
    document.getElementById(
      "globeContainer"
    );

  if(!container || !renderer)
    return;

  camera.aspect =
    container.clientWidth /
    container.clientHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

}


function setupGlobeTouch(){

  const container =
    document.getElementById(
      "globeContainer"
    );

  let startX=0;

  container.addEventListener(
    "pointerdown",
    event=>{
      startX=event.clientX;
      rotating=false;
    }
  );


  container.addEventListener(
    "pointermove",
    event=>{

      if(!startX)
        return;

      const diff =
        event.clientX-startX;

      globeGroup.rotation.y +=
        diff*.004;

      startX=event.clientX;

    }
  );


  container.addEventListener(
    "pointerup",
    ()=>{
      startX=0;
    }
  );

}


function setupNavigation(){

  document.querySelectorAll(
    "[data-page]"
  ).forEach(button=>{

    button.addEventListener(
      "click",
      ()=>{

        const page =
          button.dataset.page;

        document.querySelectorAll(
          ".page"
        ).forEach(item=>{
          item.classList.remove(
            "active"
          );
        });


        const target =
          document.getElementById(page);

        if(target){

          target.classList.add(
            "active"
          );

        }


        document.querySelectorAll(
          ".menu-item,.mobile-nav button"
        ).forEach(item=>{
          item.classList.remove(
            "active"
          );
        });


        document.querySelectorAll(
          `[data-page="${page}"]`
        ).forEach(item=>{
          item.classList.add(
            "active"
          );
        });

      }
    );

  });

}


function render(){

  document.getElementById("money")
    .textContent=format(game.money);

  document.getElementById("oil")
    .textContent=format(game.oil);

  document.getElementById("steel")
    .textContent=format(game.steel);

  document.getElementById("food")
    .textContent=format(game.food);


  document.getElementById("nationMoney")
    .textContent=format(game.money);

  document.getElementById("stability")
    .textContent=game.stability;

  document.getElementById("reputation")
    .textContent=game.reputation;

  document.getElementById("nationLevel")
    .textContent=game.nationLevel;

  document.getElementById("defense")
    .textContent=format(game.defense);


  document.getElementById("infantry")
    .textContent=format(game.infantry);

  document.getElementById("armor")
    .textContent=format(game.armor);

  document.getElementById("aircraft")
    .textContent=format(game.aircraft);

  document.getElementById("ships")
    .textContent=format(game.ships);

  document.getElementById("airBases")
    .textContent=game.airBases;


  const power =
    militaryPower();

  document.getElementById("armyPower")
    .textContent=format(power);

  document.getElementById("battlePower")
    .textContent=format(power);


  document.getElementById("stabilityProgress")
    .style.width=game.stability+"%";

  document.getElementById("nationStability")
    .style.width=game.stability+"%";


  document.getElementById("satelliteLevel")
    .textContent=
      "Level "+game.satellite;


  renderNews();

  renderCities();

  renderResearch();

  renderDiplomacy();

  saveGame();

}


function renderNews(){

  const feed =
    document.getElementById(
      "newsFeed"
    );

  feed.innerHTML =
    game.news.map(item=>`

      <div class="news-item">
        ${item}
      </div>

    `).join("");

}


function renderCities(){

  const box =
    document.getElementById(
      "citiesList"
    );

  box.innerHTML =
    game.cities.map(
      (city,index)=>`

      <div class="city-item">

        <div class="item-left">

          <div class="city-icon">
            ${city.icon}
          </div>

          <div>

            <h3>
              ${city.name}
            </h3>

            <p>
              ${city.type}
              • Level ${city.level}
            </p>

            <p>
              ${city.buildings}
            </p>

          </div>

        </div>

        <div class="item-right">

          <strong>
            Level ${city.level}
          </strong>

          <button
            class="primary-button"
            onclick="upgradeCity(${index})">

            Upgrade

          </button>

        </div>

      </div>

    `).join("");

}


function upgradeCity(index){

  const city =
    game.cities[index];

  const cost =
    city.level*1000;

  if(game.money<cost){

    toast("Not enough money");

    return;

  }

  game.money-=cost;

  city.level++;

  game.defense+=25;

  game.xp+=50;

  addNews(
    `🏙️ ${city.name} upgraded to Level ${city.level}.`
  );

  render();

}


function renderResearch(){

  const names={

    military:[
      "🪖",
      "Military Technology",
      "Improve ground forces."
    ],

    industry:[
      "🏭",
      "Industrial Technology",
      "Increase steel production."
    ],

    air:[
      "✈️",
      "Aviation Technology",
      "Improve aircraft capability."
    ],

    naval:[
      "🚢",
      "Naval Technology",
      "Improve naval capability."
    ],

    defense:[
      "🛡️",
      "Defense Systems",
      "Increase national defense."
    ],

    economy:[
      "💰",
      "Economic Science",
      "Improve economic output."
    ],

    intelligence:[
      "🛰️",
      "Intelligence Systems",
      "Improve reconnaissance."
    ]

  };


  const box =
    document.getElementById(
      "researchList"
    );


  box.innerHTML =
    Object.entries(names)
    .map(([key,value])=>`

      <div class="research-item">

        <div class="item-left">

          <div class="research-icon">
            ${value[0]}
          </div>

          <div>

            <h3>
              ${value[1]}
            </h3>

            <p>
              ${value[2]}
            </p>

          </div>

        </div>

        <div class="item-right">

          <strong>
            Level ${game.research[key]}
          </strong>

          <button
            class="primary-button"
            onclick="research('${key}')">

            Research

          </button>

        </div>

      </div>

    `).join("");

}


function research(type){

  const cost =
    700 +
    game.research[type]*400;


  if(game.money<cost){

    toast("Need "+format(cost)+" money");

    return;

  }


  game.money-=cost;

  game.research[type]++;

  game.xp+=60;


  addNews(
    `🔬 ${type} technology advanced to Level ${game.research[type]}.`
  );


  render();

}


function renderDiplomacy(){

  const box =
    document.getElementById(
      "diplomacyList"
    );


  box.innerHTML =
    Object.entries(
      game.diplomacy
    ).map(([nation,relation])=>`

      <div class="diplomacy-item">

        <div class="item-left">

          <div class="research-icon">
            ${relation>=0 ? "🤝" : "⚠️"}
          </div>

          <div>

            <h3>${nation}</h3>

            <p>
              Relationship:
              ${relation}
            </p>

          </div>

        </div>

        <div class="item-right">

          <button
            class="primary-button"
            onclick="improveDiplomacy('${nation}')">

            Diplomatic Action

          </button>

        </div>

      </div>

    `).join("");

}


function improveDiplomacy(nation){

  game.diplomacy[nation]+=10;

  game.reputation+=1;

  game.xp+=30;

  addNews(
    `🤝 Diplomatic relations improved with ${nation}.`
  );

  render();

}


function trainUnit(type){

  if(type==="infantry"){

    if(game.food<100){

      toast("Need 100 food");

      return;

    }

    game.food-=100;

    game.infantry+=100;

  }


  if(type==="armor"){

    if(game.steel<250){

      toast("Need 250 steel");

      return;

    }

    game.steel-=250;

    game.armor+=5;

  }


  if(type==="aircraft"){

    if(
      game.steel<350 ||
      game.oil<200
    ){

      toast("Need steel + oil");

      return;

    }

    game.steel-=350;

    game.oil-=200;

    game.aircraft+=2;

  }


  if(type==="ships"){

    if(
      game.steel<600 ||
      game.oil<350
    ){

      toast("Need steel + oil");

      return;

    }

    game.steel-=600;

    game.oil-=350;

    game.ships++;

  }


  game.xp+=25;

  addNews(
    "🪖 Military production completed."
  );

  render();

}


function buildAirBase(){

  if(game.money<1500){

    toast("Need 1,500 money");

    return;

  }

  game.money-=1500;

  game.airBases++;

  game.aircraft+=5;

  game.defense+=30;

  game.xp+=50;

  addNews(
    "✈️ New Air Base became operational."
  );

  render();

}


function startBattle(){

  const target =
    document.getElementById(
      "target"
    ).value;


  const terrain =
    document.getElementById(
      "terrain"
    ).value;


  const weather =
    document.getElementById(
      "weather"
    ).value;


  let modifier=1;


  if(terrain.includes("Mountain"))
    modifier*=.84;

  if(terrain.includes("Urban"))
    modifier*=.91;

  if(terrain.includes("Forest"))
    modifier*=.93;

  if(weather.includes("Fog"))
    modifier*=.89;

  if(weather.includes("Snow"))
    modifier*=.88;

  if(weather.includes("Rain"))
    modifier*=.94;


  const enemy =
    Math.floor(
      (8500+Math.random()*9000)
      *modifier
    );


  const player =
    Math.floor(
      militaryPower()*
      (.88+Math.random()*.24)
    );


  document.getElementById(
    "enemyPower"
  ).textContent=format(enemy);


  const result =
    document.getElementById(
      "battleResult"
    );


  if(player>=enemy){

    game.wins++;

    game.money+=1500;

    game.steel+=300;

    game.reputation+=5;

    game.xp+=180;


    result.innerHTML=`
      🏆 <strong style="color:#35d69b">
      OPERATION SUCCESSFUL
      </strong>
      <br><br>
      Your forces defeated
      <b>${target}</b>.
      <br>
      Power ${format(player)}
      vs ${format(enemy)}
    `;


    addNews(
      `🏆 Victory! Forces successfully completed an operation against ${target}.`
    );

  }else{

    game.losses++;

    game.money=
      Math.max(0,game.money-500);

    game.stability=
      Math.max(0,game.stability-3);

    game.xp+=50;


    result.innerHTML=`
      ❌ <strong style="color:#ff5364">
      OPERATION FAILED
      </strong>
      <br><br>
      Your forces were pushed back.
      <br>
      Power ${format(player)}
      vs ${format(enemy)}
    `;


    addNews(
      `⚠️ Operation against ${target} failed.`
    );

  }


  render();

}


function randomEvent(){

  const events=[

    ["📈","Global trade boom","money",800],

    ["🏭","Industrial expansion","steel",400],

    ["🌾","Excellent harvest","food",500],

    ["🛢️","New oil reserves","oil",350],

    ["🤝","Diplomatic summit","reputation",4]

  ];


  const event =
    events[
      Math.floor(
        Math.random()*events.length
      )
    ];


  game[event[2]]+=event[3];


  addNews(
    `${event[0]} ${event[1]}: +${event[3]}`
  );


  toast(
    event[1]
  );


  render();

}


function setupButtons(){

  document.querySelectorAll(
    "[data-unit]"
  ).forEach(button=>{

    button.addEventListener(
      "click",
      ()=>{
        trainUnit(
          button.dataset.unit
        );
      }
    );

  });


  document.getElementById(
    "buildAirBase"
  ).addEventListener(
    "click",
    buildAirBase
  );


  document.getElementById(
    "startBattle"
  ).addEventListener(
    "click",
    startBattle
  );


  document.getElementById(
    "randomEvent"
  ).addEventListener(
    "click",
    randomEvent
  );


  document.getElementById(
    "industrialPolicy"
  ).addEventListener(
    "click",
    ()=>{

      game.money+=500;

      game.stability=
        Math.max(
          0,
          game.stability-2
        );

      addNews(
        "🏭 Industrial policy increased economic output."
      );

      render();

    }
  );


  document.getElementById(
    "socialPolicy"
  ).addEventListener(
    "click",
    ()=>{

      game.food=
        Math.max(
          0,
          game.food-150
        );

      game.stability=
        Math.min(
          100,
          game.stability+5
        );

      addNews(
        "👥 Social program improved national stability."
      );

      render();

    }
  );


  document.getElementById(
    "defensePolicy"
  ).addEventListener(
    "click",
    ()=>{

      if(game.money<500){

        toast("Need 500 money");

        return;

      }

      game.money-=500;

      game.defense+=75;

      game.stability=
        Math.min(
          100,
          game.stability+2
        );

      addNews(
        "🛡️ National defense strengthened."
      );

      render();

    }
  );


  document.getElementById(
    "tradeButton"
  ).addEventListener(
    "click",
    ()=>{

      if(game.money<500){

        toast("Need 500 money");

        return;

      }

      game.money-=500;

      game.oil+=250;

      game.food+=250;

      addNews(
        "🚢 International trade agreement expanded."
      );

      render();

    }
  );


  document.getElementById(
    "upgradeSatellite"
  ).addEventListener(
    "click",
    ()=>{

      const cost=
        900*game.satellite;

      if(game.money<cost){

        toast(
          "Need "+format(cost)+" money"
        );

        return;

      }

      game.money-=cost;

      game.satellite++;

      game.xp+=50;

      addNews(
        "🛰️ Satellite network upgraded."
      );

      render();

    }
  );


  document.getElementById(
    "scanButton"
  ).addEventListener(
    "click",
    ()=>{

      toast(
        "🛰️ Global scan completed."
      );

      addNews(
        "🛰️ Intelligence scan detected strategic activity."
      );

    }
  );


  document.getElementById(
    "reconButton"
  ).addEventListener(
    "click",
    ()=>{

      game.xp+=40;

      toast(
        "🔭 Recon mission completed."
      );

      addNews(
        "🔭 Reconnaissance mission returned successfully."
      );

      render();

    }
  );


  document.getElementById(
    "rotateButton"
  ).addEventListener(
    "click",
    ()=>{

      rotating=!rotating;

      toast(
        rotating
        ? "🌍 Auto rotation ON"
        : "🌍 Auto rotation OFF"
      );

    }
  );


  document.getElementById(
    "zoomIn"
  ).addEventListener(
    "click",
    ()=>{

      currentZoom=
        Math.max(
          3.5,
          currentZoom-.5
        );

      camera.position.z=
        currentZoom;

    }
  );


  document.getElementById(
    "zoomOut"
  ).addEventListener(
    "click",
    ()=>{

      currentZoom=
        Math.min(
          8,
          currentZoom+.5
        );

      camera.position.z=
        currentZoom;

    }
  );


  document.getElementById(
    "profileButton"
  ).addEventListener(
    "click",
    ()=>{

      toast(
        `👤 Commander Level ${game.level} • ${game.wins} victories`
      );

    }
  );

}


function startLoading(){

  const progress =
    document.getElementById(
      "loadingProgress"
    );

  const percent =
    document.getElementById(
      "loadingPercent"
    );

  const status =
    document.getElementById(
      "loadingStatus"
    );


  const stages=[

    [12,"CONNECTING TO WORLD..."],

    [27,"LOADING TERRITORIES..."],

    [43,"INITIALIZING ARMIES..."],

    [59,"PREPARING AIR BASES..."],

    [74,"CALIBRATING SATELLITES..."],

    [88,"BUILDING STRATEGIC MAP..."],

    [100,"COMMAND CENTER READY"]

  ];


  let index=0;


  const timer =
    setInterval(()=>{

      const stage=
        stages[index];

      progress.style.width=
        stage[0]+"%";

      percent.textContent=
        stage[0]+"%";

      status.textContent=
        stage[1];


      index++;


      if(index>=stages.length){

        clearInterval(timer);

        setTimeout(()=>{

          document
            .getElementById(
              "loadingScreen"
            )
            .classList.add(
              "hidden"
            );

        },500);

      }

    },350);

}


setupNavigation();

setupButtons();

render();

init3D();

startLoading();


setInterval(()=>{

  game.money+=100;

  game.oil+=50;

  game.steel+=75;

  game.food+=100;

  render();

},30000);


window.addEventListener(
  "beforeunload",
  saveGame
);