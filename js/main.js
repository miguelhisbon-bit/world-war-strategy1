/* =========================================================
   WARFRONT
   FULL 3D-LOOKING TACTICAL COMMAND
========================================================= */


/* =========================================================
   GAME STATE
========================================================= */

const state = {

  money: 11500,
  fuel: 1520,
  metal: 4076,

  level: 1,
  victories: 5,

  allyScore: 79,
  enemyScore: 26,

  zoom: 1,

  selectedUnit: "tank1",

  cameraX: 0,
  cameraY: 0,

  gameOver: false,

  units: {

    tank1:{
      name:"TANK ALPHA",
      hp:100,
      maxHp:100,
      attack:35,
      range:230,
      speed:3,
      alive:true
    },

    tank2:{
      name:"TANK BRAVO",
      hp:100,
      maxHp:100,
      attack:35,
      range:230,
      speed:3,
      alive:true
    },

    infantry1:{
      name:"INFANTRY A",
      hp:80,
      maxHp:80,
      attack:20,
      range:180,
      speed:4,
      alive:true
    },

    infantry2:{
      name:"INFANTRY B",
      hp:80,
      maxHp:80,
      attack:20,
      range:180,
      speed:4,
      alive:true
    },

    aircraft1:{
      name:"FIGHTER ONE",
      hp:90,
      maxHp:90,
      attack:45,
      range:400,
      speed:7,
      alive:true
    }

  },

  enemies:{

    enemyTank1:{
      name:"ENEMY TANK",
      hp:100,
      maxHp:100,
      attack:28,
      alive:true
    },

    enemyInfantry1:{
      name:"ENEMY INFANTRY",
      hp:80,
      maxHp:80,
      attack:18,
      alive:true
    },

    enemyAircraft1:{
      name:"ENEMY AIR",
      hp:90,
      maxHp:90,
      attack:32,
      alive:true
    },

    enemyInfantry2:{
      name:"ENEMY RIFLE",
      hp:75,
      maxHp:75,
      attack:17,
      alive:true
    },

    enemyTank2:{
      name:"ENEMY ARMOR",
      hp:100,
      maxHp:100,
      attack:30,
      alive:true
    }

  }

};


/* =========================================================
   ELEMENTS
========================================================= */

const $ = id => document.getElementById(id);

const battlefield = $("battlefield");
const terrain = $("terrain");
const effects = $("effects");

const notification = $("notification");

const targetMarker = $("targetMarker");


/* =========================================================
   LOADING
========================================================= */

let loading = 0;

const loadingMessages = [

  "Initializing battlefield...",

  "Loading terrain...",

  "Deploying armored units...",

  "Connecting tactical systems...",

  "Activating enemy AI...",

  "Preparing command center...",

  "Battlefield ready."

];


const loadingTimer = setInterval(() => {

  loading += 5;

  $("loadingProgress").style.width =
    loading + "%";

  const index =
    Math.min(
      Math.floor(loading / 15),
      loadingMessages.length - 1
    );

  $("loadingText").textContent =
    loadingMessages[index];


  if(loading >= 100){

    clearInterval(loadingTimer);

    setTimeout(() => {

      $("loadingScreen").style.opacity = "0";

      setTimeout(() => {

        $("loadingScreen").style.display = "none";

      },800);

    },300);

  }

},100);


/* =========================================================
   NOTIFICATION
========================================================= */

function notify(text){

  notification.textContent = text;

  notification.animate(
    [
      {
        opacity:.2,
        transform:"translateX(-50%) translateY(10px)"
      },

      {
        opacity:1,
        transform:"translateX(-50%) translateY(0)"
      }
    ],
    {
      duration:300
    }
  );

}


/* =========================================================
   UI
========================================================= */

function updateUI(){

  $("money").textContent =
    Math.max(0,Math.floor(state.money));

  $("fuel").textContent =
    Math.max(0,Math.floor(state.fuel));

  $("metal").textContent =
    Math.max(0,Math.floor(state.metal));

  $("victories").textContent =
    state.victories;

  $("victoryCount").textContent =
    state.victories;

  $("allyScore").textContent =
    state.allyScore;

  $("enemyScore").textContent =
    state.enemyScore;

  $("allyBar").style.width =
    state.allyScore + "%";


  const aliveUnits =
    Object.values(state.units)
      .filter(u => u.alive)
      .length;

  const aliveEnemies =
    Object.values(state.enemies)
      .filter(e => e.alive)
      .length;


  $("unitCount").textContent =
    aliveUnits;

  $("enemyCount").textContent =
    aliveEnemies;


  updateSelectedUnit();

}


/* =========================================================
   UNIT SELECTION
========================================================= */

document
  .querySelectorAll(".unitCard")
  .forEach(card => {

    card.addEventListener("click",() => {

      const id =
        card.dataset.unit;

      selectUnit(id);

    });

  });


document
  .querySelectorAll(".unit")
  .forEach(unit => {

    unit.addEventListener("click",event => {

      event.stopPropagation();

      const id =
        unit.dataset.unit;

      if(state.units[id]){

        selectUnit(id);

      }

      if(state.enemies[id]){

        selectEnemy(id);

      }

    });

  });


function selectUnit(id){

  const unit =
    state.units[id];

  if(!unit || !unit.alive){

    notify("This unit is unavailable.");

    return;

  }

  state.selectedUnit = id;


  document
    .querySelectorAll(".unitCard")
    .forEach(card => {

      card.classList.toggle(
        "selected",
        card.dataset.unit === id
      );

    });


  document
    .querySelectorAll(".unit")
    .forEach(el => {

      el.classList.remove("selected");

    });


  const element = $(id);

  if(element){

    element.classList.add("selected");

  }


  notify(
    "Selected: " + unit.name
  );

  updateSelectedUnit();

}


function selectEnemy(id){

  const enemy =
    state.enemies[id];

  if(!enemy || !enemy.alive){

    return;

  }

  state.target = id;

  showTarget(id);

  notify(
    "Target locked: " +
    enemy.name
  );

}


/* =========================================================
   SELECTED UNIT INFO
========================================================= */

function updateSelectedUnit(){

  const unit =
    state.units[state.selectedUnit];

  if(!unit){

    return;

  }

  $("selectedName").textContent =
    unit.name;

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        unit.hp / unit.maxHp * 100
      )
    );

  $("selectedHPBar").style.width =
    percent + "%";


  $("selectedStats").textContent =
    `HP ${Math.floor(unit.hp)}/${unit.maxHp} • ATK ${unit.attack} • RANGE ${unit.range}`;

}


/* =========================================================
   TARGET MARKER
========================================================= */

function showTarget(id){

  const element = $(id);

  if(!element){

    return;

  }

  targetMarker.style.display =
    "flex";


  const rect =
    element.getBoundingClientRect();

  const battleRect =
    battlefield.getBoundingClientRect();


  targetMarker.style.left =
    (rect.left - battleRect.left + rect.width/2)
    + "px";


  targetMarker.style.top =
    (rect.top - battleRect.top + rect.height/2)
    + "px";

}


/* =========================================================
   MOVE UNIT
========================================================= */

battlefield.addEventListener("click",event => {

  if(
    event.target.closest(".unit") ||
    event.target.closest("button")
  ){

    return;

  }

  const unit =
    state.units[state.selectedUnit];

  if(!unit || !unit.alive){

    return;

  }


  const rect =
    battlefield.getBoundingClientRect();


  let x =
    ((event.clientX - rect.left) /
      rect.width) * 100;

  let y =
    ((event.clientY - rect.top) /
      rect.height) * 100;


  x = Math.max(5,Math.min(95,x));
  y = Math.max(15,Math.min(90,y));


  moveUnit(
    state.selectedUnit,
    x,
    y
  );

});


function moveUnit(id,x,y){

  const element =
    $(id);

  if(!element){

    return;

  }

  element.style.left =
    x + "%";

  element.style.top =
    y + "%";


  notify(
    "Moving " +
    state.units[id].name
  );

}


/* =========================================================
   ATTACK
========================================================= */

$("attackBtn")
  .addEventListener("click",attack);


function attack(){

  if(state.gameOver){

    return;

  }

  const unit =
    state.units[state.selectedUnit];


  if(!unit || !unit.alive){

    notify("Select an available unit.");

    return;

  }


  if(state.fuel < 20){

    notify("Not enough fuel.");

    return;

  }


  state.fuel -= 20;


  let targetId =
    state.target;


  if(
    !targetId ||
    !state.enemies[targetId] ||
    !state.enemies[targetId].alive
  ){

    const enemies =
      Object.keys(state.enemies)
        .filter(id =>
          state.enemies[id].alive
        );

    if(!enemies.length){

      winBattle();

      return;

    }

    targetId =
      enemies[
        Math.floor(
          Math.random()*enemies.length
        )
      ];

  }


  const enemy =
    state.enemies[targetId];


  const damage =
    unit.attack +
    Math.floor(Math.random()*12);


  enemy.hp -= damage;


  createProjectile(
    state.selectedUnit,
    targetId
  );


  setTimeout(() => {

    createExplosion(targetId);

  },280);


  notify(
    `${unit.name} fired — ${damage} damage`
  );


  if(enemy.hp <= 0){

    destroyEnemy(targetId);

  }


  updateUI();

  checkBattleEnd();

}


/* =========================================================
   PROJECTILE
========================================================= */

function createProjectile(fromId,toId){

  const from =
    $(fromId);

  const to =
    $(toId);

  if(!from || !to){

    return;

  }


  const a =
    from.getBoundingClientRect();

  const b =
    to.getBoundingClientRect();

  const battle =
    battlefield.getBoundingClientRect();


  const startX =
    a.left -
    battle.left +
    a.width/2;

  const startY =
    a.top -
    battle.top +
    a.height/2;


  const endX =
    b.left -
    battle.left +
    b.width/2;

  const endY =
    b.top -
    battle.top +
    b.height/2;


  const projectile =
    document.createElement("div");

  projectile.className =
    "projectile";


  projectile.style.left =
    startX + "px";

  projectile.style.top =
    startY + "px";


  effects.appendChild(
    projectile
  );


  projectile.animate(
    [
      {
        left:startX+"px",
        top:startY+"px"
      },

      {
        left:endX+"px",
        top:endY+"px"
      }
    ],
    {
      duration:350,
      easing:"linear"
    }
  );


  setTimeout(() => {

    projectile.remove();

  },360);

}


/* =========================================================
   EXPLOSION
========================================================= */

function createExplosion(id){

  const element =
    $(id);

  if(!element){

    return;

  }


  const rect =
    element.getBoundingClientRect();

  const battle =
    battlefield.getBoundingClientRect();


  const boom =
    document.createElement("div");

  boom.className =
    "explosion";


  boom.style.left =
    (
      rect.left -
      battle.left +
      rect.width/2
    ) + "px";


  boom.style.top =
    (
      rect.top -
      battle.top +
      rect.height/2
    ) + "px";


  effects.appendChild(
    boom
  );


  setTimeout(() => {

    boom.remove();

  },800);

}


/* =========================================================
   DESTROY ENEMY
========================================================= */

function destroyEnemy(id){

  const enemy =
    state.enemies[id];

  if(!enemy){

    return;

  }

  enemy.hp = 0;

  enemy.alive = false;


  const element =
    $(id);

  if(element){

    createExplosion(id);

    element.style.opacity = "0";

    element.style.transform =
      "translate(-50%,-50%) scale(.2)";

    element.style.pointerEvents =
      "none";

  }


  state.allyScore =
    Math.min(
      100,
      state.allyScore + 8
    );

  state.enemyScore =
    Math.max(
      0,
      state.enemyScore - 8
    );


  notify(
    "☠️ ENEMY UNIT DESTROYED"
  );

}


/* =========================================================
   DEFEND
========================================================= */

$("defendBtn")
  .addEventListener("click",() => {

    state.allyScore =
      Math.min(
        100,
        state.allyScore + 5
      );

    state.money += 100;

    notify(
      "🛡️ Defensive formation activated."
    );

    updateUI();

  });


/* =========================================================
   AIR STRIKE
========================================================= */

$("airStrikeBtn")
  .addEventListener("click",() => {

    if(state.fuel < 120){

      notify(
        "Air strike requires 120 fuel."
      );

      return;

    }


    state.fuel -= 120;


    const enemies =
      Object.keys(state.enemies)
        .filter(id =>
          state.enemies[id].alive
        );


    if(!enemies.length){

      winBattle();

      return;

    }


    notify(
      "✈️ AIR STRIKE INCOMING!"
    );


    enemies.forEach((id,index) => {

      setTimeout(() => {

        const enemy =
          state.enemies[id];

        enemy.hp -= 40;

        createExplosion(id);


        if(enemy.hp <= 0){

          destroyEnemy(id);

        }

        updateUI();

        checkBattleEnd();

      },index*180);

    });

  });


/* =========================================================
   SCOUT
========================================================= */

$("scoutBtn")
  .addEventListener("click",() => {

    if(state.fuel < 30){

      notify(
        "Not enough fuel."
      );

      return;

    }


    state.fuel -= 30;


    document
      .querySelectorAll(".enemy")
      .forEach(enemy => {

        enemy.animate(
          [
            {opacity:.2},
            {opacity:1},
            {opacity:.2},
            {opacity:1}
          ],
          {
            duration:1500
          }
        );

      });


    notify(
      "🔭 Recon complete — enemy positions revealed."
    );


    updateUI();

  });


/* =========================================================
   REINFORCE
========================================================= */

$("reinforceBtn")
  .addEventListener("click",() => {

    if(state.money < 500){

      notify(
        "Need $500 for reinforcements."
      );

      return;

    }


    state.money -= 500;

    state.metal += 200;

    state.allyScore =
      Math.min(
        100,
        state.allyScore + 6
      );


    notify(
      "➕ Reinforcements deployed."
    );


    updateUI();

  });


/* =========================================================
   REPAIR
========================================================= */

$("repairBtn")
  .addEventListener("click",() => {

    const unit =
      state.units[state.selectedUnit];


    if(!unit || !unit.alive){

      notify(
        "Unit unavailable."
      );

      return;

    }


    if(state.metal < 100){

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

  });


/* =========================================================
   ENEMY AI
========================================================= */

function enemyTurn(){

  if(state.gameOver){

    return;

  }


  const enemies =
    Object.values(state.enemies)
      .filter(e => e.alive);


  if(!enemies.length){

    return;

  }


  const units =
    Object.keys(state.units)
      .filter(id =>
        state.units[id].alive
      );


  if(!units.length){

    loseBattle();

    return;

  }


  const targetId =
    units[
      Math.floor(
        Math.random()*units.length
      )
    ];


  const attacker =
    enemies[
      Math.floor(
        Math.random()*enemies.length
      )
    ];


  const damage =
    attacker.attack +
    Math.floor(
      Math.random()*10
    );


  const target =
    state.units[targetId];


  target.hp -= damage;


  notify(
    `⚠️ Enemy attack — ${damage} damage`
  );


  createExplosion(targetId);


  if(target.hp <= 0){

    target.hp = 0;

    target.alive = false;


    const element =
      $(targetId);

    if(element){

      element.style.opacity = "0";

      element.style.transform =
        "translate(-50%,-50%) scale(.2)";

    }


    state.enemyScore =
      Math.min(
        100,
        state.enemyScore + 8
      );


    notify(
      "☠️ Your unit was destroyed."
    );

  }


  updateUI();


  if(
    Object.values(state.units)
      .every(u => !u.alive)
  ){

    loseBattle();

  }

}


setInterval(enemyTurn,7000);


/* =========================================================
   CAMERA
========================================================= */

function updateCamera(){

  terrain.style.transform =
    `
      translate(${state.cameraX}px,${state.cameraY}px)
      rotateX(58deg)
      rotateZ(-3deg)
      scale(${state.zoom})
    `;

}


$("zoomIn")
  .addEventListener("click",() => {

    state.zoom =
      Math.min(
        1.55,
        state.zoom + .12
      );

    updateCamera();

  });


$("zoomOut")
  .addEventListener("click",() => {

    state.zoom =
      Math.max(
        .72,
        state.zoom - .12
      );

    updateCamera();

  });


$("resetCamera")
  .addEventListener("click",() => {

    state.zoom = 1;

    state.cameraX = 0;

    state.cameraY = 0;

    updateCamera();

    notify(
      "Camera reset."
    );

  });


/* =========================================================
   TOUCH CAMERA
========================================================= */

let touchStartX = 0;
let touchStartY = 0;

battlefield.addEventListener(
  "touchstart",
  event => {

    const touch =
      event.touches[0];

    touchStartX =
      touch.clientX;

    touchStartY =
      touch.clientY;

  },
  {
    passive:true
  }
);


battlefield.addEventListener(
  "touchmove",
  event => {

    const touch =
      event.touches[0];


    const dx =
      touch.clientX -
      touchStartX;


    const dy =
      touch.clientY -
      touchStartY;


    if(
      Math.abs(dx) > 10 ||
      Math.abs(dy) > 10
    ){

      state.cameraX =
        Math.max(
          -250,
          Math.min(
            250,
            state.cameraX + dx*.15
          )
        );


      state.cameraY =
        Math.max(
          -200,
          Math.min(
            200,
            state.cameraY + dy*.15
          )
        );


      updateCamera();


      touchStartX =
        touch.clientX;

      touchStartY =
        touch.clientY;

    }

  },
  {
    passive:true
  }
);


/* =========================================================
   JOYSTICK
========================================================= */

const joystick =
  $("joystick");

const knob =
  $("joystickKnob");


let joystickActive = false;


joystick.addEventListener(
  "touchstart",
  e => {

    joystickActive = true;

    e.stopPropagation();

  },
  {
    passive:true
  }
);


joystick.addEventListener(
  "touchmove",
  e => {

    if(!joystickActive){

      return;

    }


    const touch =
      e.touches[0];

    const rect =
      joystick.getBoundingClientRect();


    let x =
      touch.clientX -
      rect.left -
      rect.width/2;


    let y =
      touch.clientY -
      rect.top -
      rect.height/2;


    const distance =
      Math.sqrt(
        x*x+y*y
      );


    const max =
      rect.width/2 - 30;


    if(distance > max){

      x =
        x/distance*max;

      y =
        y/distance*max;

    }


    knob.style.transform =
      `translate(${x}px,${y}px)`;


    const unit =
      state.units[state.selectedUnit];


    if(unit && unit.alive){

      const element =
        $(state.selectedUnit);


      const left =
        parseFloat(element.style.left) || 50;


      const top =
        parseFloat(element.style.top) || 50;


      element.style.left =
        Math.max(
          3,
          Math.min(
            97,
            left + x*.002
          )
        ) + "%";


      element.style.top =
        Math.max(
          10,
          Math.min(
            90,
            top + y*.002
          )
        ) + "%";

    }

  },
  {
    passive:true
  }
);


joystick.addEventListener(
  "touchend",
  () => {

    joystickActive = false;

    knob.style.transform =
      "translate(0,0)";

  }
);


/* =========================================================
   RESEARCH
========================================================= */

$("researchBtn")
  .addEventListener("click",() => {

    $("modalTitle").textContent =
      "🔬 TECHNOLOGY RESEARCH";


    $("modalContent").innerHTML = `

      <div class="researchItem">

        <h3>Advanced Armor</h3>

        <p>
          Increase all allied unit HP.
        </p>

        <button onclick="research('armor')">
          RESEARCH — $700
        </button>

      </div>


      <div class="researchItem">

        <h3>Air Superiority</h3>

        <p>
          Increase fighter attack.
        </p>

        <button onclick="research('air')">
          RESEARCH — $900
        </button>

      </div>


      <div class="researchItem">

        <h3>Logistics</h3>

        <p>
          Improve fuel reserves.
        </p>

        <button onclick="research('logistics')">
          RESEARCH — $600
        </button>

      </div>

    `;


    $("modal")
      .classList
      .remove("hidden");

  });


window.research = function(type){

  const costs = {

    armor:700,

    air:900,

    logistics:600

  };


  if(state.money < costs[type]){

    notify(
      "Not enough money."
    );

    return;

  }


  state.money -=
    costs[type];


  if(type === "armor"){

    Object.values(state.units)
      .forEach(unit => {

        unit.maxHp += 10;

        unit.hp += 10;

      });

  }


  if(type === "air"){

    state.units.aircraft1.attack += 15;

  }


  if(type === "logistics"){

    state.fuel += 400;

  }


  notify(
    "🔬 Research completed."
  );


  $("modal")
    .classList
    .add("hidden");


  updateUI();

};


/* =========================================================
   MISSIONS
========================================================= */

$("missionBtn")
  .addEventListener("click",() => {

    $("modalTitle").textContent =
      "🎯 ACTIVE MISSIONS";


    $("modalContent").innerHTML = `

      <div class="researchItem">

        <h3>Primary Objective</h3>

        <p>
          Destroy enemy forces.
        </p>

      </div>


      <div class="researchItem">

        <h3>Secondary Objective</h3>

        <p>
          Keep at least 2 allied units alive.
        </p>

      </div>


      <div class="researchItem">

        <h3>Commander Level</h3>

        <p>
          Level ${state.level}
        </p>

      </div>

    `;


    $("modal")
      .classList
      .remove("hidden");

  });


/* =========================================================
   SAVE
========================================================= */

$("saveBtn")
  .addEventListener("click",() => {

    localStorage.setItem(
      "warfront_save",
      JSON.stringify(state)
    );


    notify(
      "💾 Game saved."
    );

  });


/* =========================================================
   LOAD
========================================================= */

function loadGame(){

  const saved =
    localStorage.getItem(
      "warfront_save"
    );


  if(!saved){

    return;

  }


  try{

    const data =
      JSON.parse(saved);


    state.money =
      data.money ?? state.money;

    state.fuel =
      data.fuel ?? state.fuel;

    state.metal =
      data.metal ?? state.metal;

    state.level =
      data.level ?? state.level;

    state.victories =
      data.victories ?? state.victories;

    state.allyScore =
      data.allyScore ?? state.allyScore;

    state.enemyScore =
      data.enemyScore ?? state.enemyScore;


    if(data.units){

      Object.keys(
        state.units
      ).forEach(id => {

        if(data.units[id]){

          Object.assign(
            state.units[id],
            data.units[id]
          );

        }

      });

    }


    if(data.enemies){

      Object.keys(
        state.enemies
      ).forEach(id => {

        if(data.enemies[id]){

          Object.assign(
            state.enemies[id],
            data.enemies[id]
          );

        }

      });

    }


    notify(
      "💾 Saved game loaded."
    );


  }catch(error){

    console.log(
      "Save error:",
      error
    );

  }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

$("closeModal")
  .addEventListener("click",() => {

    $("modal")
      .classList
      .add("hidden");

  });


$("modal")
  .addEventListener("click",event => {

    if(
      event.target === $("modal")
    ){

      $("modal")
        .classList
        .add("hidden");

    }

  });


/* =========================================================
   PASSIVE ECONOMY
========================================================= */

setInterval(() => {

  if(state.gameOver){

    return;

  }

  state.money += 40;

  state.metal += 15;

  updateUI();

},10000);


/* =========================================================
   RANDOM BATTLEFIELD EFFECTS
========================================================= */

setInterval(() => {

  if(
    $("loadingScreen").style.display !==
    "none"
  ){

    return;

  }


  if(Math.random() > .55){

    const x =
      Math.random() *
      battlefield.clientWidth;

    const y =
      180 +
      Math.random() *
      battlefield.clientHeight *
      .45;


    const boom =
      document.createElement("div");

    boom.className =
      "explosion";


    boom.style.left =
      x + "px";

    boom.style.top =
      y + "px";


    effects.appendChild(
      boom
    );


    setTimeout(() => {

      boom.remove();

    },800);

  }

},5000);


/* =========================================================
   BATTLE END
========================================================= */

function checkBattleEnd(){

  const enemiesAlive =
    Object.values(
      state.enemies
    ).some(
      enemy => enemy.alive
    );


  if(!enemiesAlive){

    winBattle();

  }

}


function winBattle(){

  if(state.gameOver){

    return;

  }


  state.gameOver = true;

  state.victories++;

  state.level++;

  state.money += 1500;

  state.metal += 500;

  state.fuel += 300;

  state.allyScore =
    Math.min(
      100,
      state.allyScore + 10
    );


  $("missionText").textContent =
    "Victory achieved — new mission unlocked.";


  notify(
    "🏆 VICTORY! Enemy headquarters captured."
  );


  updateUI();


  setTimeout(() => {

    state.gameOver = false;

  },3000);

}


function loseBattle(){

  if(state.gameOver){

    return;

  }


  state.gameOver = true;


  $("missionText").textContent =
    "Mission failed. Reorganize your forces.";


  notify(
    "⚠️ DEFEAT — Your forces were destroyed."
  );


  setTimeout(() => {

    state.gameOver = false;

  },3000);

}


/* =========================================================
   INITIALIZE
========================================================= */

loadGame();

updateUI();

updateCamera();


/* restore destroyed units */

Object.keys(
  state.enemies
).forEach(id => {

  if(
    !state.enemies[id].alive
  ){

    const element =
      $(id);

    if(element){

      element.style.opacity = "0";

      element.style.pointerEvents =
        "none";

    }

  }

});


console.log(
  "WARFRONT Tactical Command initialized."
);