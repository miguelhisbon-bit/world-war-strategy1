const defaultGame = {
  money:10000,
  oil:5000,
  steel:5000,
  food:5000,
  energy:3000,

  reputation:50,
  nationLevel:1,
  stability:78,

  infantry:1000,
  armor:150,
  aircraft:60,
  ships:25,

  supply:85,
  defense:500,
  airBases:2,

  level:1,
  xp:0,
  wins:0,
  losses:0,
  seasonPoints:0,

  satelliteLevel:1,

  research:{
    military:1,
    industry:1,
    air:1,
    naval:1,
    defense:1,
    economy:1,
    intelligence:1,
    energy:1,
    space:1,
    AI:1
  },

  cities:[
    {
      name:"Aurora City",
      level:1,
      buildings:[
        "🏛️ Capital",
        "🏭 Factory",
        "🪖 Military Base",
        "✈️ Air Base",
        "🚢 Naval Base"
      ]
    },
    {
      name:"Ironvale",
      level:1,
      buildings:[
        "🏭 Factory",
        "⛏️ Mine"
      ]
    },
    {
      name:"Greenfield",
      level:1,
      buildings:[
        "🌾 Farm",
        "🏙️ Housing"
      ]
    },
    {
      name:"Harbor Point",
      level:1,
      buildings:[
        "🚢 Port",
        "🏭 Factory"
      ]
    }
  ],

  diplomacy:{
    "Eastern Alliance":20,
    "Southern Republic":45,
    "Northern Dominion":-30,
    "Western Empire":-15
  },

  commanders:[
    {
      name:"General Orion",
      role:"Army Commander",
      level:1,
      bonus:"+10% Army"
    },
    {
      name:"Admiral Vega",
      role:"Naval Commander",
      level:1,
      bonus:"+10% Navy"
    },
    {
      name:"Air Marshal Nova",
      role:"Air Commander",
      level:1,
      bonus:"+10% Air"
    },
    {
      name:"Director Atlas",
      role:"Intelligence",
      level:1,
      bonus:"+10% Recon"
    }
  ],

  missions:[
    {
      name:"Build a stronger economy",
      done:false,
      reward:1000
    },
    {
      name:"Win your first battle",
      done:false,
      reward:1500
    },
    {
      name:"Research 3 technologies",
      done:false,
      reward:2000
    },
    {
      name:"Sign a diplomatic agreement",
      done:false,
      reward:1200
    }
  ],

  news:[
    "🌎 A new era has begun.",
    "🏭 Global production is increasing.",
    "🤝 Nations are forming new alliances."
  ]
};

let game = loadGame();

function cloneDefault(){
  return JSON.parse(JSON.stringify(defaultGame));
}

function loadGame(){

  try{

    const saved = localStorage.getItem("WWS_SAVE");

    if(!saved){
      return cloneDefault();
    }

    return {
      ...cloneDefault(),
      ...JSON.parse(saved)
    };

  }catch(error){

    return cloneDefault();

  }
}

function saveGame(){

  localStorage.setItem(
    "WWS_SAVE",
    JSON.stringify(game)
  );

  toast("💾 Game saved");

}

function silentSave(){

  localStorage.setItem(
    "WWS_SAVE",
    JSON.stringify(game)
  );

}

function toast(message){

  const box = document.getElementById("toast");

  box.textContent = message;

  box.classList.add("show");

  setTimeout(()=>{
    box.classList.remove("show");
  },2200);

}

function format(number){

  return Math.floor(number).toLocaleString();

}

function addNews(message){

  game.news.unshift(message);

  game.news = game.news.slice(0,30);

  renderNews();

}

function armyPower(){

  return Math.floor(

    (
      game.infantry +
      game.armor * 12 +
      game.aircraft * 20 +
      game.ships * 25

    )

    *

    (1 + game.research.military * 0.04)

    *

    (0.75 + game.supply / 400)

  );

}

function render(){

  document.getElementById("money").textContent =
    format(game.money);

  document.getElementById("oil").textContent =
    format(game.oil);

  document.getElementById("steel").textContent =
    format(game.steel);

  document.getElementById("food").textContent =
    format(game.food);

  document.getElementById("energy").textContent =
    format(game.energy);


  document.getElementById("ecoMoney").textContent =
    format(game.money);

  document.getElementById("ecoOil").textContent =
    format(game.oil);

  document.getElementById("ecoSteel").textContent =
    format(game.steel);

  document.getElementById("ecoFood").textContent =
    format(game.food);


  document.getElementById("reputation").textContent =
    game.reputation;

  document.getElementById("nationLevel").textContent =
    game.nationLevel;

  document.getElementById("stability").textContent =
    game.stability + "%";

  document.getElementById("stabilityBar").style.width =
    game.stability + "%";


  document.getElementById("infantry").textContent =
    format(game.infantry);

  document.getElementById("armor").textContent =
    format(game.armor);

  document.getElementById("aircraft").textContent =
    format(game.aircraft);

  document.getElementById("ships").textContent =
    format(game.ships);

  document.getElementById("supply").textContent =
    game.supply + "%";

  document.getElementById("supplyBar").style.width =
    game.supply + "%";

  document.getElementById("airBases").textContent =
    game.airBases;


  document.getElementById("armyPower").textContent =
    format(armyPower());

  document.getElementById("defense").textContent =
    format(game.defense);

  document.getElementById("battleSupply").textContent =
    game.supply + "%";


  document.getElementById("level").textContent =
    game.level;

  document.getElementById("xp").textContent =
    game.xp;

  document.getElementById("wins").textContent =
    game.wins;

  document.getElementById("losses").textContent =
    game.losses;

  document.getElementById("seasonPoints").textContent =
    game.seasonPoints;


  document.getElementById("satelliteLevel").textContent =
    game.satelliteLevel;


  renderCities();
  renderResearch();
  renderDiplomacy();
  renderMissions();
  renderCommanders();
  renderNews();

  silentSave();

}

function renderCities(){

  const box = document.getElementById("citiesList");

  box.innerHTML = game.cities.map((city,index)=>`

    <div class="row">

      <div>
        <h3>🏙️ ${city.name}</h3>

        <div class="muted">
          Level ${city.level}
        </div>

        <small>
          ${city.buildings.join(" • ")}
        </small>
      </div>

      <div>

        <button
          class="btn"
          onclick="upgradeCity(${index})">
          🏗️ Upgrade
        </button>

        <button
          class="btn"
          onclick="buildRandom(${index})">
          ➕ Build
        </button>

      </div>

    </div>

  `).join("");

}

function upgradeCity(index){

  const city = game.cities[index];

  const cost = 1000 * city.level;

  if(game.money < cost){

    toast("Not enough money");

    return;

  }

  game.money -= cost;

  city.level++;

  game.defense += 25;

  addNews(
    `🏗️ ${city.name} upgraded to level ${city.level}.`
  );

  render();

}

function buildRandom(index){

  const buildings = [

    "🏭 Factory",
    "⛏️ Mine",
    "🌾 Farm",
    "🪖 Military Base",
    "✈️ Air Base",
    "🚢 Naval Base",
    "🛡️ Defense Base",
    "🏦 Bank",
    "🛰️ Research Center",
    "🚆 Logistics Hub"

  ];

  if(game.money < 700){

    toast("Need 700 money");

    return;

  }

  game.money -= 700;

  const building =
    buildings[
      Math.floor(Math.random()*buildings.length)
    ];

  game.cities[index].buildings.push(building);

  game.defense += 10;

  addNews(
    `🏗️ ${building} built in ${game.cities[index].name}.`
  );

  render();

}

function trainUnit(type){

  if(type === "infantry"){

    if(game.food < 100){

      toast("Need food");

      return;

    }

    game.food -= 100;

    game.infantry += 100;

  }


  if(type === "armor"){

    if(game.steel < 250){

      toast("Need steel");

      return;

    }

    game.steel -= 250;

    game.armor += 5;

  }


  if(type === "aircraft"){

    if(
      game.steel < 350 ||
      game.oil < 200
    ){

      toast("Need steel + oil");

      return;

    }

    game.steel -= 350;

    game.oil -= 200;

    game.aircraft += 2;

  }


  if(type === "ships"){

    if(
      game.steel < 600 ||
      game.oil < 350
    ){

      toast("Need steel + oil");

      return;

    }

    game.steel -= 600;

    game.oil -= 350;

    game.ships++;

  }

  addNews("🪖 Military production completed.");

  render();

}

function improveSupply(){

  if(game.money < 500){

    toast("Need 500 money");

    return;

  }

  game.money -= 500;

  game.supply =
    Math.min(100,game.supply+5);

  addNews(
    "📦 Logistics efficiency improved."
  );

  render();

}

function buildAirBase(){

  if(game.money < 1500){

    toast("Need 1,500 money");

    return;

  }

  game.money -= 1500;

  game.airBases++;

  game.aircraft += 5;

  game.defense += 30;

  addNews(
    "✈️ New Air Base constructed."
  );

  render();

}

function startBattle(){

  const target =
    document.getElementById("target").value;

  const terrain =
    document.getElementById("terrain").value;

  const weather =
    document.getElementById("weather").value;


  let modifier = 1;

  if(terrain.includes("Mountain"))
    modifier *= 0.85;

  if(terrain.includes("City"))
    modifier *= 0.90;

  if(terrain.includes("Forest"))
    modifier *= 0.92;

  if(weather.includes("Fog"))
    modifier *= 0.90;

  if(weather.includes("Snow"))
    modifier *= 0.88;

  if(weather.includes("Rain"))
    modifier *= 0.94;


  const enemyPower =
    Math.floor(
      (900 + Math.random()*4200) *
      modifier
    );

  const playerPower =
    Math.floor(
      armyPower() *
      (0.85 + Math.random()*0.30)
    );


  const result =
    document.getElementById("battleResult");


  if(playerPower >= enemyPower){

    game.wins++;

    game.xp += 150;

    game.money += 1500;

    game.steel += 300;

    game.reputation += 5;

    game.seasonPoints += 25;

    result.innerHTML = `
      <h2 class="good">🏆 VICTORY</h2>
      <p>Target: ${target}</p>
      <p>Your Power: ${format(playerPower)}</p>
      <p>Enemy Power: ${format(enemyPower)}</p>
    `;

    addNews(
      `🏆 Victory reported against ${target}.`
    );

  }else{

    game.losses++;

    game.xp += 40;

    game.money =
      Math.max(0,game.money-500);

    game.reputation -= 3;

    result.innerHTML = `
      <h2 style="color:#e05252">
        ❌ DEFEAT
      </h2>
      <p>Target: ${target}</p>
      <p>Your Power: ${format(playerPower)}</p>
      <p>Enemy Power: ${format(enemyPower)}</p>
    `;

    addNews(
      `⚠️ Forces suffered a defeat against ${target}.`
    );

  }

  checkLevel();

  render();

}

function renderResearch(){

  const data = [

    ["military","🪖 Military","Better army efficiency"],
    ["industry","🏭 Industry","Better production"],
    ["air","✈️ Air","Improved air capability"],
    ["naval","🚢 Naval","Improved naval capability"],
    ["defense","🛡️ Defense","Stronger defenses"],
    ["economy","💰 Economy","Better income"],
    ["intelligence","🛰️ Intelligence","Better reconnaissance"],
    ["energy","⚡ Energy","Energy efficiency"],
    ["space","🚀 Space","Advanced fictional space research"],
    ["AI","🤖 AI","Advanced strategic AI"]

  ];

  document.getElementById("researchList").innerHTML =
    data.map(item=>`

      <div class="row">

        <div>
          <h3>${item[1]}</h3>
          <span class="muted">
            ${item[2]}
          </span>
        </div>

        <div>

          <b>
            Level ${game.research[item[0]]}
          </b>

          <button
            class="btn"
            onclick="researchTech('${item[0]}')">
            🔬 Research
          </button>

        </div>

      </div>

    `).join("");

}

function researchTech(type){

  const cost =
    800 + game.research[type] * 400;

  if(game.money < cost){

    toast("Not enough money");

    return;

  }

  game.money -= cost;

  game.research[type]++;

  game.xp += 50;

  addNews(
    `🔬 ${type} technology advanced.`
  );

  checkLevel();

  render();

}

function renderDiplomacy(){

  const box =
    document.getElementById("diplomacyList");

  box.innerHTML =
    Object.entries(game.diplomacy)
    .map(([nation,value])=>`

      <div class="row">

        <div>

          <h3>${nation}</h3>

          <span>
            Relationship:
            <b>${value}</b>
          </span>

        </div>

        <div>

          <button
            class="btn good"
            onclick="diplomacy('${nation}','peace')">
            🕊️ Peace
          </button>

          <button
            class="btn"
            onclick="diplomacy('${nation}','trade')">
            💹 Trade
          </button>

          <button
            class="btn gold"
            onclick="diplomacy('${nation}','alliance')">
            🤝 Alliance
          </button>

        </div>

      </div>

    `).join("");

}

function diplomacy(nation,type){

  if(type === "peace"){

    game.diplomacy[nation] += 10;

  }

  if(type === "trade"){

    if(game.diplomacy[nation] < 0){

      toast("Relations too low");

      return;

    }

    game.money += 500;

    game.diplomacy[nation] += 5;

  }

  if(type === "alliance"){

    if(game.diplomacy[nation] < 30){

      toast("Need relationship 30+");

      return;

    }

    game.diplomacy[nation] += 15;

    game.reputation += 3;

  }

  addNews(
    `🤝 Diplomatic action with ${nation}.`
  );

  render();

}

function renderMissions(){

  document.getElementById("missionsList").innerHTML =
    game.missions.map((mission,index)=>`

      <div class="row">

        <div>

          <h3>
            ${mission.done ? "✅" : "🎯"}
            ${mission.name}
          </h3>

          <span>
            Reward: 💰 ${mission.reward}
          </span>

        </div>

        <button
          class="btn gold"
          onclick="claimMission(${index})"
          ${mission.done ? "disabled" : ""}>

          ${mission.done ? "Completed" : "Claim"}

        </button>

      </div>

    `).join("");

}

function claimMission(index){

  const mission =
    game.missions[index];

  if(mission.done){

    return;

  }

  let completed = false;

  if(index === 0){

    completed =
      game.cities.some(
        city => city.buildings.length >= 5
      );

  }

  if(index === 1){

    completed = game.wins >= 1;

  }

  if(index === 2){

    const total =
      Object.values(game.research)
      .reduce((a,b)=>a+b,0);

    completed = total >= 23;

  }

  if(index === 3){

    completed =
      Object.values(game.diplomacy)
      .some(value => value >= 30);

  }

  if(!completed){

    toast("Mission objective not completed");

    return;

  }

  mission.done = true;

  game.money += mission.reward;

  game.xp += 100;

  addNews(
    `🎯 Mission completed: ${mission.name}`
  );

  checkLevel();

  render();

}

function renderCommanders(){

  document.getElementById("commandersList").innerHTML =
    game.commanders.map((commander,index)=>`

      <div class="row">

        <div>

          <h3>👑 ${commander.name}</h3>

          <span>
            ${commander.role}
            • Level ${commander.level}
          </span>

        </div>

        <div>

          <b>${commander.bonus}</b>

          <button
            class="btn"
            onclick="upgradeCommander(${index})">
            ⭐ Train
          </button>

        </div>

      </div>

    `).join("");

}

function upgradeCommander(index){

  if(game.money < 600){

    toast("Need 600 money");

    return;

  }

  game.money -= 600;

  game.commanders[index].level++;

  game.xp += 40;

  addNews(
    `👑 ${game.commanders[index].name} trained.`
  );

  render();

}

function renderNews(){

  document.getElementById("newsFeed").innerHTML =
    game.news.map(item=>`

      <div class="card">
        📰 ${item}
      </div>

    `).join("");

}

function checkLevel(){

  const needed =
    game.level * 500;

  if(game.xp >= needed){

    game.xp -= needed;

    game.level++;

    game.nationLevel++;

    game.reputation += 2;

    addNews(
      `⭐ Commander reached Level ${game.level}.`
    );

  }

}

function economicAction(type){

  if(type === "tax"){

    game.money += 500;

    game.stability =
      Math.max(0,game.stability-2);

  }

  if(type === "factory"){

    if(game.money < 700){

      toast("Need 700 money");

      return;

    }

    game.money -= 700;

    game.steel += 300;

  }

  if(type === "trade"){

    if(game.money < 500){

      toast("Need 500 money");

      return;

    }

    game.money -= 500;

    game.oil += 250;

    game.food += 250;

  }

  if(type === "bank"){

    if(game.money < 400){

      toast("Need 400 money");

      return;

    }

    game.money -= 400;

    game.money += 700;

  }

  addNews("💰 Economic program completed.");

  render();

}

function marketBuy(resource){

  if(game.money < 300){

    toast("Need 300 money");

    return;

  }

  game.money -= 300;

  game[resource] += 100;

  addNews(
    `💱 Purchased ${resource} from the market.`
  );

  render();

}

function randomEvent(){

  const events = [

    "📈 Global trade boom increased treasury.",
    "🌧️ Weather reduced food production.",
    "🤝 A diplomatic opportunity appeared.",
    "🏭 Industrial boom increased steel.",
    "📰 A peaceful summit improved relations."

  ];

  const event =
    events[
      Math.floor(Math.random()*events.length)
    ];

  game.money += 300;

  addNews(event);

  render();

}

function renameNation(){

  const name =
    prompt(
      "Enter your fictional nation name:",
      "Aurora Federation"
    );

  if(name && name.trim()){

    document.getElementById("nationName")
      .textContent = name.trim();

    addNews(
      "🏳️ Nation identity updated."
    );

    toast("Nation name updated");

  }

}

function toggleTheme(){

  document.body.classList.toggle("light");

}

function resetGame(){

  const answer =
    confirm(
      "Reset all game progress?"
    );

  if(!answer){

    return;

  }

  localStorage.removeItem("WWS_SAVE");

  location.reload();

}

function selectCountry(){

  const name =
    this.dataset.country;

  let type = "Neutral";

  if(this.classList.contains("player"))
    type = "Your Nation";

  if(this.classList.contains("ally"))
    type = "Friendly";

  if(this.classList.contains("enemy"))
    type = "Hostile";

  document.getElementById("countryInfo").innerHTML = `

    <h2>🌎 ${name}</h2>

    <p>Status:
      <b>${type}</b>
    </p>

    <p>
      Estimated military strength:
      ${format(800 + Math.random()*3500)}
    </p>

    <button
      class="btn"
      onclick="document.querySelector('[data-page=battle]').click()">
      ⚔️ Battle Planning
    </button>

    <button
      class="btn"
      onclick="document.querySelector('[data-page=diplomacy]').click()">
      🤝 Diplomacy
    </button>

  `;

}

function setupNavigation(){

  document.querySelectorAll(".nav")
    .forEach(button=>{

      button.addEventListener("click",()=>{

        const page =
          button.dataset.page;

        document.querySelectorAll(".page")
          .forEach(section=>{
            section.classList.remove("active");
          });

        document.getElementById(page)
          .classList.add("active");

        document.querySelectorAll(".nav")
          .forEach(item=>{
            item.classList.remove("active");
          });

        button.classList.add("active");

      });

    });

}

function setupButtons(){

  document.querySelectorAll("[data-unit]")
    .forEach(button=>{

      button.addEventListener("click",()=>{
        trainUnit(button.dataset.unit);
      });

    });


  document.querySelectorAll("[data-economy]")
    .forEach(button=>{

      button.addEventListener("click",()=>{
        economicAction(button.dataset.economy);
      });

    });


  document.querySelectorAll(".market-buy")
    .forEach(button=>{

      button.addEventListener("click",()=>{
        marketBuy(button.dataset.market);
      });

    });


  document.querySelectorAll(".country")
    .forEach(country=>{
      country.addEventListener("click",selectCountry);
    });


  document.getElementById("startBattle")
    .addEventListener("click",startBattle);


  document.getElementById("improveSupply")
    .addEventListener("click",improveSupply);


  document.getElementById("buildAirBase")
    .addEventListener("click",buildAirBase);


  document.getElementById("renameNation")
    .addEventListener("click",renameNation);


  document.getElementById("industrialPolicy")
    .addEventListener("click",()=>{
      game.money += 400;
      game.stability -= 2;
      addNews("🏭 Industrial policy activated.");
      render();
    });


  document.getElementById("socialPolicy")
    .addEventListener("click",()=>{
      game.food =
        Math.max(0,game.food-150);

      game.stability += 5;

      addNews("👥 Social policy improved stability.");

      render();
    });


  document.getElementById("defensePolicy")
    .addEventListener("click",()=>{
      game.money =
        Math.max(0,game.money-300);

      game.defense += 75;

      game.stability += 2;

      addNews("🛡️ Defense policy strengthened.");

      render();
    });


  document.getElementById("upgradeIntel")
    .addEventListener("click",()=>{
      if(game.money < 800){
        toast("Need 800 money");
        return;
      }

      game.money -= 800;
      game.satelliteLevel++;

      game.xp += 50;

      addNews("🛰️ Satellite system upgraded.");

      render();
    });


  document.getElementById("radarBtn")
    .addEventListener("click",()=>{
      toast("📡 Radar upgraded.");
      game.xp += 25;
      render();
    });


  document.getElementById("reconBtn")
    .addEventListener("click",()=>{
      toast("🔭 Recon mission completed.");
      game.xp += 50;
      render();
    });


  document.getElementById("scanBtn")
    .addEventListener("click",()=>{
      toast("🛰️ Territory scan completed.");
      addNews("🛰️ Intelligence scan revealed new information.");
      render();
    });


  document.getElementById("createClan")
    .addEventListener("click",()=>{
      toast("👥 Alliance system opened.");
    });


  document.getElementById("findClan")
    .addEventListener("click",()=>{
      toast("🔎 Searching fictional alliances.");
    });


  document.getElementById("joinTournament")
    .addEventListener("click",()=>{
      game.seasonPoints += 10;
      game.xp += 50;
      addNews("🏆 Tournament registration completed.");
      render();
    });


  document.getElementById("themeBtn")
    .addEventListener("click",toggleTheme);


  document.getElementById("saveBtn")
    .addEventListener("click",saveGame);


  document.getElementById("resetBtn")
    .addEventListener("click",resetGame);


  document.getElementById("eventBtn")
    .addEventListener("click",randomEvent);


  document.getElementById("zoomBtn")
    .addEventListener("click",()=>{
      toast("🔍 Map zoom controls activated.");
    });


  document.getElementById("fogBtn")
    .addEventListener("click",()=>{
      toast("🌫️ Fog of war toggled.");
    });


  document.getElementById("weatherBtn")
    .addEventListener("click",()=>{
      toast("🌦️ World weather updated.");
    });

}

function gameCycle(){

  game.money +=
    100 * game.research.economy;

  game.oil += 50;

  game.steel +=
    75 * game.research.industry;

  game.food += 100;

  game.energy += 25;

  render();

}

setupNavigation();

setupButtons();

render();

setInterval(gameCycle,30000);