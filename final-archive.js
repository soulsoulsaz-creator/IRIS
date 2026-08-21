/* ============================================================
   BLACK IRIS // FINAL ARCHIVE ENGINE
   Sound + Games + Progression
============================================================ */

"use strict";

/* ============================================================
   SOUND ENGINE
============================================================ */

let audioCtx=null;
let masterGain=null;

function initAudio(){

  if(audioCtx)return;

  audioCtx=new(
    window.AudioContext ||
    window.webkitAudioContext
  )();

  masterGain=audioCtx.createGain();
  masterGain.gain.value=.18;
  masterGain.connect(audioCtx.destination);
}

function tone(freq,duration,type="sine",volume=.15,delay=0){

  if(!audioCtx)return;

  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();

  osc.type=type;
  osc.frequency.setValueAtTime(freq,audioCtx.currentTime+delay);

  gain.gain.setValueAtTime(
    0,
    audioCtx.currentTime+delay
  );

  gain.gain.linearRampToValueAtTime(
    volume,
    audioCtx.currentTime+delay+.01
  );

  gain.gain.exponentialRampToValueAtTime(
    .001,
    audioCtx.currentTime+delay+duration
  );

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(audioCtx.currentTime+delay);
  osc.stop(audioCtx.currentTime+delay+duration+.02);
}

function soundClick(){
  tone(900,.06,"square",.12);
}

function soundCollect(){
  tone(600,.08,"square",.12);
  tone(900,.1,"square",.12,.07);
}

function soundError(){
  tone(120,.25,"sawtooth",.2);
  tone(70,.3,"sawtooth",.15,.12);
}

function soundSuccess(){
  tone(500,.1,"sine",.12);
  tone(700,.1,"sine",.12,.1);
  tone(1000,.18,"sine",.15,.2);
}

function soundAlarm(){

  tone(700,.12,"square",.15);
  tone(400,.12,"square",.15,.14);
  tone(700,.12,"square",.15,.28);
  tone(400,.12,"square",.15,.42);
}

function soundGlitch(){

  for(let i=0;i<7;i++){

    tone(
      100+Math.random()*900,
      .04,
      "sawtooth",
      .06,
      i*.035
    );
  }
}

function heartbeat(){

  tone(80,.08,"sine",.25);
  tone(60,.1,"sine",.18,.12);
}


/* ============================================================
   SCREEN
============================================================ */

function screen(id){

  document.querySelectorAll(".screen")
    .forEach(s=>s.classList.remove("active"));

  document.getElementById(id)
    .classList.add("active");
}


/* ============================================================
   START
============================================================ */

document.getElementById("startBtn")
.addEventListener("click",()=>{

  initAudio();

  if(audioCtx.state==="suspended")
    audioCtx.resume();

  soundSuccess();

  startPacman();

});


/* ============================================================
   PAC-MAN
============================================================ */

const canvas=document.getElementById("pacCanvas");
const ctx=canvas.getContext("2d");

const maps=[

[
"#################",
"#...............#",
"#.###.#####.###.#",
"#.#...........#.#",
"#.#.###.#.###.#.#",
"#...#...#...#...#",
"###.#.#####.#.###",
"#...............#",
"#.###.##.##.###.#",
"#...#.......#...#",
"###.#.#####.#.###",
"#...#...#...#...#",
"#.#.###.#.###.#.#",
"#.#...........#.#",
"#.###.#####.###.#",
"#...............#",
"#################"
],

[
"#################",
"#........#......#",
"#.######.#.####.#",
"#........#......#",
"#.####.####.###.#",
"#....#......#...#",
"####.#.####.#.###",
"#......#.........#",
"#.####.#.#######.#",
"#....#.#.........#",
"###.##.#####.###.#",
"#........#.......#",
"#.######.#.#####.#",
"#......#.........#",
"#.####.####.###..#",
"#.................#",
"#################"
],

[
"#################",
"#...#...........#",
"#.#.#.#########.#",
"#.#.............#",
"#.#####.#####.#.#",
"#.....#.....#.#.#",
"#####.#.###.#.#.#",
"#.....#...#.#...#",
"#.#########.#.###",
"#...........#...#",
"#.###########.#.#",
"#...#.........#.#",
"###.#.#######.#.#",
"#...#.........#.#",
"#.###########.#.#",
"#...............#",
"#################"
],

[
"#################",
"#...............#",
"#.#####.#######.#",
"#.#...#.#.......#",
"#.#.#.#.#.#####.#",
"#...#.#.........#",
"###.#.#########.#",
"#...#.....#.....#",
"#.#######.#.###.#",
"#.......#.#.....#",
"#.#####.#.#####.#",
"#.....#.#.......#",
"#.###.#.#######.#",
"#...#.#.........#",
"#.#.#.#########.#",
"#...............#",
"#################"
],

[
"#################",
"#...............#",
"#.###.#########.#",
"#.#...........#.#",
"#.#.#########.#.#",
"#.#.#.......#.#.#",
"#...#.#####.#...#",
"###.#.#...#.#.###",
"#...#.#.#.#.#...#",
"#.#.#...#...#.#.#",
"#.#.#########.#.#",
"#.#...........#.#",
"#.#############.#",
"#...............#",
"#.#############.#",
"#...............#",
"#################"
]

];

let mapIndex=0;
let map=[];
let player={x:1,y:1,dx:0,dy:0};
let next={x:0,y:0};
let enemies=[];
let pellets=[];
let score=0;
let pacTimer=null;

function startPacman(){

  screen("pacman");

  mapIndex=0;
  score=0;

  document.getElementById("scoreText")
    .textContent="000000";

  loadMap();

  if(!pacTimer)
    pacTimer=setInterval(updatePacman,115);

  requestAnimationFrame(drawPacman);
}

function loadMap(){

  map=maps[mapIndex];

  pellets=[];

  for(let y=0;y<map.length;y++){
    for(let x=0;x<map[y].length;x++){

      if(map[y][x]==="."){
        pellets.push({x,y});
      }
    }
  }

  player={
    x:1,
    y:1,
    dx:0,
    dy:0
  };

  next={
    x:0,
    y:0
  };

  enemies=[
    {x:8,y:8,dx:1,dy:0},
    {x:14,y:8,dx:-1,dy:0}
  ];

  document.getElementById("levelText")
    .textContent=`MAP ${mapIndex+1} / ${maps.length}`;

  document.getElementById("pacStatus")
    .textContent="RECOVER ALL IRIS FRAGMENTS.";

  soundGlitch();
}

function wall(x,y){

  if(
    y<0 ||
    y>=map.length ||
    x<0 ||
    x>=map[0].length
  )return true;

  return map[y][x]==="#";
}

function direction(x,y){

  next={x,y};
}

document.querySelectorAll("[data-dir]")
.forEach(btn=>{

  btn.addEventListener("click",()=>{

    const d=btn.dataset.dir;

    if(d==="up")direction(0,-1);
    if(d==="down")direction(0,1);
    if(d==="left")direction(-1,0);
    if(d==="right")direction(1,0);

    soundClick();

  });

});

document.addEventListener("keydown",e=>{

  if(e.key==="ArrowUp"||e.key.toLowerCase()==="w")
    direction(0,-1);

  if(e.key==="ArrowDown"||e.key.toLowerCase()==="s")
    direction(0,1);

  if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")
    direction(-1,0);

  if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")
    direction(1,0);

});

function updatePacman(){

  if(!document.getElementById("pacman")
    .classList.contains("active"))return;

  if(!wall(
    player.x+next.x,
    player.y+next.y
  )){

    player.dx=next.x;
    player.dy=next.y;

  }

  if(!wall(
    player.x+player.dx,
    player.y+player.dy
  )){

    player.x+=player.dx;
    player.y+=player.dy;

  }

  const before=pellets.length;

  pellets=pellets.filter(p=>{

    if(
      p.x===player.x &&
      p.y===player.y
    ){

      score+=100;

      soundCollect();

      return false;
    }

    return true;

  });

  if(before!==pellets.length){

    document.getElementById("scoreText")
      .textContent=String(score).padStart(6,"0");

  }

  enemies.forEach(e=>{

    const options=[
      {x:e.dx,y:e.dy},
      {x:1,y:0},
      {x:-1,y:0},
      {x:0,y:1},
      {x:0,y:-1}
    ].filter(d=>
      !wall(e.x+d.x,e.y+d.y)
    );

    if(!options.length)return;

    options.sort((a,b)=>{

      const da=
        Math.abs(
          player.x-(e.x+a.x)
        )+
        Math.abs(
          player.y-(e.y+a.y)
        );

      const db=
        Math.abs(
          player.x-(e.x+b.x)
        )+
        Math.abs(
          player.y-(e.y+b.y)
        );

      return da-db;

    });

    const d=options[0];

    e.dx=d.x;
    e.dy=d.y;

    e.x+=d.x;
    e.y+=d.y;

    if(
      e.x===player.x &&
      e.y===player.y
    ){

      soundError();

      player.x=1;
      player.y=1;

      document.getElementById("pacStatus")
        .textContent=
        "SECURITY CONTACT — RETURN TO START.";

    }

  });

  if(pellets.length===0){

    if(mapIndex<maps.length-1){

      mapIndex++;

      loadMap();

    }else{

      clearInterval(pacTimer);
      pacTimer=null;

      soundSuccess();

      setTimeout(startBoss,900);

    }

  }

}

function drawPacman(){

  if(!document.getElementById("pacman")
    .classList.contains("active"))return;

  const size=
    canvas.width/map[0].length;

  ctx.fillStyle="#000";
  ctx.fillRect(
    0,0,
    canvas.width,
    canvas.height
  );

  /* maze */

  for(let y=0;y<map.length;y++){

    for(let x=0;x<map[y].length;x++){

      if(map[y][x]==="#"){

        ctx.fillStyle="#170000";

        ctx.fillRect(
          x*size,
          y*size,
          size,
          size
        );

        ctx.strokeStyle="#680000";

        ctx.strokeRect(
          x*size+2,
          y*size+2,
          size-4,
          size-4
        );

      }

    }

  }

  /* pellets */

  pellets.forEach(p=>{

    ctx.fillStyle="#fff";
    ctx.shadowBlur=10;
    ctx.shadowColor="#f00";

    ctx.beginPath();

    ctx.arc(
      p.x*size+size/2,
      p.y*size+size/2,
      3,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.shadowBlur=0;

  });

  /* enemies */

  enemies.forEach((e,i)=>{

    ctx.fillStyle=
      i===0 ? "#e00000" : "#ff3333";

    ctx.beginPath();

    ctx.arc(
      e.x*size+size/2,
      e.y*size+size/2,
      size*.32,
      Math.PI,
      0
    );

    ctx.lineTo(
      e.x*size+size*.8,
      e.y*size+size*.85
    );

    ctx.lineTo(
      e.x*size+size*.6,
      e.y*size+size*.7
    );

    ctx.lineTo(
      e.x*size+size*.4,
      e.y*size+size*.85
    );

    ctx.lineTo(
      e.x*size+size*.2,
      e.y*size+size*.7
    );

    ctx.closePath();

    ctx.fill();

  });

  /* player */

  ctx.fillStyle="#ffd800";

  ctx.shadowBlur=15;
  ctx.shadowColor="#ffd800";

  ctx.beginPath();

  const angle=Math.atan2(
    player.dy,
    player.dx
  );

  ctx.moveTo(
    player.x*size+size/2,
    player.y*size+size/2
  );

  ctx.arc(
    player.x*size+size/2,
    player.y*size+size/2,
    size*.35,
    angle+.35,
    angle+Math.PI*2-.35
  );

  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur=0;

  requestAnimationFrame(drawPacman);
}


/* ============================================================
   RED EYE BOSS
============================================================ */

const bossCanvas=
  document.getElementById("bossCanvas");

const bctx=bossCanvas.getContext("2d");

let bossHP=100;

function startBoss(){

  screen("boss");

  bossHP=100;

  document.getElementById("bossHealth")
    .style.width="100%";

  document.getElementById("bossStatus")
    .textContent="DESTROY THE EYE.";

  drawBoss();

  soundAlarm();

}

function drawBoss(){

  bctx.clearRect(
    0,0,
    bossCanvas.width,
    bossCanvas.height
  );

  const g=bctx.createRadialGradient(
    350,225,10,
    350,225,350
  );

  g.addColorStop(0,"#550000");
  g.addColorStop(1,"#000");

  bctx.fillStyle=g;

  bctx.fillRect(
    0,0,
    700,
    450
  );

  /* eye */

  bctx.fillStyle="#050505";

  bctx.beginPath();

  bctx.ellipse(
    350,225,
    180,110,
    0,0,Math.PI*2
  );

  bctx.fill();

  bctx.strokeStyle="#f00";
  bctx.lineWidth=7;

  bctx.stroke();

  const iris=
    bctx.createRadialGradient(
      350,225,10,
      350,225,125
    );

  iris.addColorStop(0,"#ff0000");
  iris.addColorStop(.55,"#900000");
  iris.addColorStop(1,"#180000");

  bctx.fillStyle=iris;

  bctx.beginPath();

  bctx.arc(
    350,225,
    125,
    0,
    Math.PI*2
  );

  bctx.fill();

  bctx.fillStyle="#000";

  bctx.beginPath();

  bctx.ellipse(
    350,225,
    28,100,
    0,0,Math.PI*2
  );

  bctx.fill();

}

document.getElementById("attackBtn")
.addEventListener("click",()=>{

  if(bossHP<=0)return;

  bossHP-=10;

  if(bossHP<0)
    bossHP=0;

  document.getElementById("bossHealth")
    .style.width=bossHP+"%";

  soundClick();

  drawBoss();

  if(bossHP===0){

    soundSuccess();

    document.getElementById("bossStatus")
      .textContent=
      "THE RED EYE HAS BEEN SILENCED.";

    setTimeout(startPressure,1800);

  }else{

    soundGlitch();

  }

});


/* ============================================================
   PRESSURE TEST
============================================================ */

let pressureTime=60;
let pressureTimer=null;
let pressureRound=0;
let pressureState=null;

const pressureRules=[
  {
    text:"DO NOT PRESS THE BUTTON.",
    correct:"press"
  },
  {
    text:"PRESS THE BUTTON ONCE.",
    correct:"none"
  },
  {
    text:"DO NOT PRESS THE BUTTON FOR 5 SECONDS.",
    correct:"pressAfter"
  },
  {
    text:"PRESS ONLY WHEN THE TIMER SHOWS AN EVEN NUMBER.",
    correct:"even"
  },
  {
    text:"DO NOT PRESS WHEN THE TIMER SHOWS 7.",
    correct:"avoid7"
  },
  {
    text:"THE NEXT RULE IS A LIE.",
    correct:"lie"
  }
];

function startPressure(){

  screen("pressure");

  pressureTime=60;
  pressureRound=0;

  document.getElementById("pressureTimer")
    .textContent="60";

  nextPressureRule();

  clearInterval(pressureTimer);

  pressureTimer=setInterval(()=>{

    pressureTime--;

    document.getElementById("pressureTimer")
      .textContent=pressureTime;

    if(pressureTime<=10){
      heartbeat();
    }

    if(
      pressureTime<=0
    ){

      clearInterval(pressureTimer);

      document.getElementById("pressureRule")
        .textContent=
        "YOU SURVIVED THE PRESSURE TEST.";

      soundSuccess();

      setTimeout(startGrid,1800);

    }

  },1000);

}

function nextPressureRule(){

  const rule=
    pressureRules[
      pressureRound%
      pressureRules.length
    ];

  pressureState=rule;

  document.getElementById("pressureRule")
    .textContent=rule.text;

  pressureRound++;

  soundGlitch();

}

document.getElementById("pressureButton")
.addEventListener("click",()=>{

  const rule=pressureState;

  let correct=false;

  /*
    BLACK IRIS twists the normal instructions:
    the player must determine the intended opposite.
  */

  if(rule.correct==="press"){
    correct=false;
  }

  else if(rule.correct==="none"){
    correct=true;
  }

  else if(rule.correct==="pressAfter"){
    correct=pressureTime<=55;
  }

  else if(rule.correct==="even"){
    correct=pressureTime%2===0;
  }

  else if(rule.correct==="avoid7"){
    correct=pressureTime!==7;
  }

  else if(rule.correct==="lie"){
    correct=true;
  }

  if(!correct){

    soundError();

    document.getElementById("pressureRule")
      .textContent=
      "WRONG. THE PRESSURE WON.";

    clearInterval(pressureTimer);

    setTimeout(startPressure,1800);

  }else{

    soundClick();

    document.getElementById("pressureObject")
      .textContent="✓";

    setTimeout(()=>{

      document.getElementById("pressureObject")
        .textContent="";

      nextPressureRule();

    },400);

  }

});


/* ============================================================
   SECURITY GRID
============================================================ */

let gridPath=[];
let gridStep=0;

function startGrid(){

  screen("grid");

  const board=
    document.getElementById("gridBoard");

  board.innerHTML="";

  gridStep=0;

  gridPath=[
    0,1,2,
    10,18,26,
    27,35,43,
    51,59,
    60,61,62,63
  ];

  for(let i=0;i<64;i++){

    const cell=
      document.createElement("div");

    cell.className="gridCell";

    cell.addEventListener("click",()=>{

      if(i===gridPath[gridStep]){

        cell.classList.add("safe");

        gridStep++;

        soundClick();

        if(gridStep===gridPath.length){

          document.getElementById("gridStatus")
            .textContent=
            "SECURITY BYPASSED.";

          soundSuccess();

          setTimeout(startMemory,1600);

        }

      }else{

        cell.classList.add("wrong");

        document.getElementById("gridStatus")
          .textContent=
          "SECURITY TRIGGERED.";

        soundAlarm();

        setTimeout(startGrid,900);

      }

    });

    board.appendChild(cell);

  }

}


/* ============================================================
   MEMORY
============================================================ */

const memoryObjects=[
  ["eye","👁",10,20],
  ["key","🔑",75,20],
  ["clock","🕐",40,60],
  ["photo","📷",75,65],
  ["file","📁",15,65],
  ["red","🔴",50,15]
];

function startMemory(){

  screen("memory");

  const room=
    document.getElementById("memoryRoom");

  room.innerHTML="";

  document.getElementById("memoryAnswers")
    .classList.add("hidden");

  document.getElementById("memoryStatus")
    .textContent=
    "MEMORIZE EVERYTHING. 10 SECONDS.";

  memoryObjects.forEach(o=>{

    const el=
      document.createElement("div");

    el.className="memoryObject";

    el.textContent=o[1];

    el.dataset.name=o[0];

    el.style.left=o[2]+"%";
    el.style.top=o[3]+"%";

    room.appendChild(el);

  });

  let count=10;

  const interval=setInterval(()=>{

    count--;

    document.getElementById("memoryStatus")
      .textContent=
      `MEMORIZE EVERYTHING. ${count}`;

    soundClick();

    if(count<=0){

      clearInterval(interval);

      room.innerHTML="";

      document.getElementById("memoryStatus")
        .textContent=
        "TIME IS UP.";

      document.getElementById("memoryAnswers")
        .classList.remove("hidden");

    }

  },1000);

}

document.querySelectorAll("[data-answer]")
.forEach(btn=>{

  btn.addEventListener("click",()=>{

    if(btn.dataset.answer==="clock"){

      soundSuccess();

      document.getElementById("memoryStatus")
        .textContent=
        "CORRECT. MEMORY VERIFIED.";

      document.getElementById("memoryAnswers")
        .classList.add("hidden");

      setTimeout(startEye,1500);

    }else{

      soundError();

      document.getElementById("memoryStatus")
        .textContent=
        "INCORRECT.";

      setTimeout(startMemory,1500);

    }

  });

});


/* ============================================================
   THE EYE
============================================================ */

let realEye=null;

function startEye(){

  screen("eye");

  const field=
    document.getElementById("eyeField");

  field.innerHTML="";

  document.getElementById("eyeStatus")
    .textContent=
    "ONE OF THEM IS WATCHING.";

  const correct=
    Math.floor(Math.random()*24);

  for(let i=0;i<24;i++){

    const eye=
      document.createElement("div");

    eye.className="eye";

    eye.textContent="👁";

    eye.style.left=
      Math.random()*92+"%";

    eye.style.top=
      Math.random()*85+"%";

    if(i===correct){

      realEye=eye;

      eye.addEventListener("click",correctEye);

    }else{

      eye.addEventListener("click",wrongEye);

    }

    field.appendChild(eye);

  }

  soundGlitch();

}

function wrongEye(){

  soundError();

  document.getElementById("eyeStatus")
    .textContent=
    "THAT IS NOT ME.";

  document.querySelectorAll(".eye")
    .forEach(e=>{

      e.style.transform=
        `translate(
          ${Math.random()*30-15}px,
          ${Math.random()*30-15}px
        )`;

    });

}

function correctEye(){

  soundSuccess();

  document.getElementById("eyeStatus")
    .textContent=
    "YOU FOUND ME.";

  document.querySelectorAll(".eye")
    .forEach(e=>{

      if(e!==realEye)
        e.style.opacity="0";

    });

  realEye.style.color="#f00";
  realEye.style.transform="scale(2)";

  setTimeout(()=>{

    screen("complete");

    soundGlitch();

  },2200);

}


/* ============================================================
   FINAL 3D ARCHIVE
============================================================ */

document.getElementById("archiveBtn")
.addEventListener("click",()=>{

  soundSuccess();

  window.location.href=
    "final-archive-3d.html";

});
