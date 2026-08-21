"use strict";

/* =========================================================
   IRIS — FINAL ARCHIVE
   LEVELS 1-5 = PAC-MAN STYLE
   LEVEL 6 = ORIGINAL PLATFORMER BOSS
   ========================================================= */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const screens = $$(".screen");

const state = {

    stage:"intro",

    level:1,

    fragments:0,

    totalFragments:6,

    tools:{
        scanner:0,
        flipflop:0,
        key:0,
        icecream:0,
        mirror:0
    },

    boss:{
        lives:3,
        health:5,
        phase:1,
        scanner:false,
        mirror:false,
        icecream:false,
        key:false,
        flipflop:false,
        defeated:false
    },

    voice:true,

    agent:localStorage.getItem("agentName") || ""

};

function show(id){

    screens.forEach(s => s.classList.remove("active"));

    $(id).classList.add("active");

    state.stage=id.replace("#","");

}


/* =========================================================
   INTRO
   ========================================================= */

$("#beginButton").onclick=()=>{

    show("#arcadeScreen");

    state.level=1;
    state.fragments=0;

    setupLevel();

};


/* =========================================================
   LEVEL 1-5
   ========================================================= */

const levelMessages={

    1:"RECOVER THE FIRST FRAGMENT.",

    2:"SOMETHING CAN STOP THE HUNTERS.",

    3:"THERE ARE ROOMS WITHOUT ENTRANCES.",

    4:"THE SCANNER MAY REVEAL WHAT IS HIDDEN.",

    5:"DISTRACT THEM. WATCH THE REFLECTION.",

    6:"THE FINAL GUARDIAN IS WAITING."

};


function setupLevel(){

    $("#levelDisplay").textContent="LEVEL "+state.level;

    $("#arcadeMessage").textContent=levelMessages[state.level];

    $("#fragmentsFound").textContent=state.fragments;

    setTools();

    buildMaze();

}


function setTools(){

    state.tools={
        scanner:0,
        flipflop:0,
        key:0,
        icecream:0,
        mirror:0
    };

    const tools={

        1:{scanner:1},

        2:{flipflop:2},

        3:{key:1,icecream:1},

        4:{scanner:1,flipflop:1},

        5:{icecream:1,mirror:1}

    };

    Object.assign(state.tools,tools[state.level]||{});

    renderTools();

}


function renderTools(){

    $$(".tool").forEach(button=>{

        const tool=button.dataset.tool;

        const amount=state.tools[tool];

        button.querySelector("small").textContent=
            amount>0 ? "×"+amount : "";

        button.style.opacity=
            amount>0 ? "1" : ".25";

    });

}


function message(text){

    $("#toolMessage").textContent=text;

    setTimeout(()=>{

        $("#toolMessage").textContent="";

    },2200);

}


/* =========================================================
   PAC-MAN STYLE MAZE
   ========================================================= */

const TILE=24;

const GRID_W=21;

const GRID_H=21;

let canvas;
let ctx;

let map;

let player;

let enemies;

let fragments;

let doorOpen=false;

let iceTarget=null;

let mirrorTime=0;

let scannerTime=0;


function buildMaze(){

    canvas=$("#arcadeCanvas");

    ctx=canvas.getContext("2d");

    canvas.width=GRID_W*TILE;

    canvas.height=GRID_H*TILE;

    map=[];

    for(let y=0;y<GRID_H;y++){

        map[y]=[];

        for(let x=0;x<GRID_W;x++){

            if(
                x===0 ||
                y===0 ||
                x===GRID_W-1 ||
                y===GRID_H-1
            ){

                map[y][x]=1;

            }else{

                map[y][x]=
                    x%2===0 &&
                    y%2===0 ? 1 : 0;

            }

        }

    }


    /* corridors */

    for(let x=1;x<GRID_W-1;x++){

        map[1][x]=0;
        map[GRID_H-2][x]=0;

    }

    for(let y=1;y<GRID_H-1;y++){

        map[y][1]=0;
        map[y][GRID_W-2]=0;

    }


    for(let y=3;y<GRID_H-3;y+=4){

        for(let x=1;x<GRID_W-1;x++){

            map[y][x]=0;

        }

    }


    for(let x=3;x<GRID_W-3;x+=4){

        for(let y=1;y<GRID_H-1;y++){

            map[y][x]=0;

        }

    }


    /* LEVEL 3 SEALED ROOM */

    if(state.level===3){

        for(let y=5;y<=9;y++){

            for(let x=15;x<=18;x++){

                map[y][x]=0;

            }

        }

        for(let x=15;x<=18;x++){

            map[4][x]=1;

        }

        map[7][14]=1;

    }


    player={
        x:1,
        y:1
    };


    enemies=[

        {
            x:GRID_W-2,
            y:1,
            stunned:0
        },

        {
            x:GRID_W-2,
            y:GRID_H-2,
            stunned:0
        },

        {
            x:Math.floor(GRID_W/2),
            y:GRID_H-2,
            stunned:0
        }

    ];


    fragments=[];


    const positions=[

        {x:19,y:19},

        {x:19,y:1},

        {x:16,y:7},

        {x:1,y:19},

        {x:19,y:10}

    ];


    if(state.level<=5){

        fragments.push(
            positions[state.level-1]
        );

    }


    doorOpen=false;

    drawMaze();


}


function walkable(x,y){

    return map[y] &&
           map[y][x]===0;

}


function movePlayer(dx,dy){

    const nx=player.x+dx;

    const ny=player.y+dy;


    if(
        state.level===3 &&
        nx===14 &&
        ny===7 &&
        !doorOpen
    ){

        message("LOCKED. USE THE KEY.");

        return;

    }


    if(!walkable(nx,ny)){

        return;

    }


    player.x=nx;

    player.y=ny;


    collectFragment();

    enemyCollision();

    drawMaze();

}


function collectFragment(){

    const f=fragments.find(
        f =>
            f.x===player.x &&
            f.y===player.y &&
            !f.collected
    );


    if(!f)return;


    f.collected=true;

    state.fragments++;

    $("#fragmentsFound").textContent=
        state.fragments;


    message("FRAGMENT RECOVERED.");


    if(state.level<5){

        setTimeout(()=>{

            state.level++;

            setupLevel();

        },700);

    }else{

        setTimeout(startBoss,900);

    }

}


function enemyCollision(){

    enemies.forEach(enemy=>{

        if(enemy.stunned>Date.now())return;

        if(
            enemy.x===player.x &&
            enemy.y===player.y
        ){

            player.x=1;
            player.y=1;

            message(
                "CONTACT. RETURNED TO START."
            );

        }

    });

}


function enemyAI(){

    if(state.stage!=="arcade")return;

    enemies.forEach(enemy=>{

        if(enemy.stunned>Date.now())return;

        let target=player;

        if(
            iceTarget &&
            iceTarget.until>Date.now()
        ){

            target=iceTarget;

        }


        const options=[

            [1,0],
            [-1,0],
            [0,1],
            [0,-1]

        ].filter(
            d =>
                walkable(
                    enemy.x+d[0],
                    enemy.y+d[1]
                )
        );


        if(!options.length)return;


        options.sort((a,b)=>{

            const da=
                Math.abs(
                    enemy.x+a[0]-target.x
                )+
                Math.abs(
                    enemy.y+a[1]-target.y
                );

            const db=
                Math.abs(
                    enemy.x+b[0]-target.x
                )+
                Math.abs(
                    enemy.y+b[1]-target.y
                );

            return da-db;

        });


        enemy.x+=options[0][0];

        enemy.y+=options[0][1];

    });


    enemyCollision();

    drawMaze();

}


setInterval(enemyAI,800);


/* =========================================================
   DRAW PAC-MAN LEVELS
   ========================================================= */

function drawMaze(){

    if(!ctx)return;

    ctx.fillStyle="#000";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    for(let y=0;y<GRID_H;y++){

        for(let x=0;x<GRID_W;x++){

            if(map[y][x]){

                ctx.fillStyle="#151520";

                ctx.fillRect(
                    x*TILE,
                    y*TILE,
                    TILE,
                    TILE
                );

                ctx.strokeStyle="#292938";

                ctx.strokeRect(
                    x*TILE+1,
                    y*TILE+1,
                    TILE-2,
                    TILE-2
                );

            }

        }

    }


    fragments.forEach(f=>{

        if(f.collected)return;

        ctx.fillStyle="#eee";

        ctx.fillRect(
            f.x*TILE+7,
            f.y*TILE+7,
            10,
            10
        );

    });


    /* LEVEL 3 DOOR */

    if(state.level===3){

        ctx.fillStyle=
            doorOpen ? "#333" : "#900";

        ctx.fillRect(
            14*TILE+2,
            7*TILE+2,
            TILE-4,
            TILE-4
        );

        if(
            !doorOpen &&
            scannerTime>Date.now()
        ){

            ctx.strokeStyle="#fff";

            ctx.strokeRect(
                14*TILE,
                7*TILE,
                TILE,
                TILE
            );

        }

    }


    enemies.forEach(enemy=>{

        ctx.fillStyle=
            enemy.stunned>Date.now()
                ? "#555"
                : "#a22";

        ctx.beginPath();

        ctx.arc(
            enemy.x*TILE+12,
            enemy.y*TILE+12,
            8,
            0,
            Math.PI*2
        );

        ctx.fill();

    });


    ctx.fillStyle="#fff";

    ctx.beginPath();

    ctx.arc(
        player.x*TILE+12,
        player.y*TILE+12,
        9,
        0,
        Math.PI*2
    );

    ctx.fill();


    if(
        iceTarget &&
        iceTarget.until>Date.now()
    ){

        ctx.font="18px serif";

        ctx.fillText(
            "🍦",
            iceTarget.x*TILE,
            iceTarget.y*TILE+20
        );

    }


    if(
        mirrorTime>Date.now()
    ){

        ctx.strokeStyle="#ddd";

        ctx.strokeRect(
            3,
            3,
            canvas.width-6,
            canvas.height-6
        );

    }

}


/* =========================================================
   TOOLS
   ========================================================= */

$$(".tool").forEach(button=>{

    button.onclick=()=>{

        const tool=button.dataset.tool;

        if(state.tools[tool]<=0){

            message("OBJECT UNAVAILABLE.");

            return;

        }


        if(tool==="scanner"){

            state.tools.scanner--;

            scannerTime=
                Date.now()+5000;

            message(
                "SCANNER ACTIVE. HIDDEN OBJECTS REVEALED."
            );

            renderTools();

            drawMaze();

        }


        if(tool==="flipflop"){

            const enemy=enemies[0];

            enemy.stunned=
                Date.now()+4000;

            state.tools.flipflop--;

            message(
                "SMACK. ENEMY DISABLED."
            );

            renderTools();

            drawMaze();

        }


        if(tool==="key"){

            if(state.level!==3){

                message(
                    "THERE IS NO LOCK HERE."
                );

                return;

            }


            state.tools.key--;

            doorOpen=true;

            message(
                "KEY ACCEPTED. THE DOOR OPENS."
            );

            renderTools();

            drawMaze();

        }


        if(tool==="icecream"){

            state.tools.icecream--;

            iceTarget={
                x:player.x,
                y:player.y,
                until:Date.now()+6000
            };

            message(
                "ICE CREAM DEPLOYED. ENEMIES DISTRACTED."
            );

            renderTools();

            drawMaze();

        }


        if(tool==="mirror"){

            state.tools.mirror--;

            mirrorTime=
                Date.now()+5000;

            message(
                "THE MIRROR REVEALS THE HIDDEN PATH."
            );

            renderTools();

            drawMaze();

        }

    };

});


/* =========================================================
   CONTROLS
   ========================================================= */

document.addEventListener("keydown",e=>{

    if(state.stage==="arcade"){

        const d={

            ArrowUp:[0,-1],

            ArrowDown:[0,1],

            ArrowLeft:[-1,0],

            ArrowRight:[1,0],

            w:[0,-1],

            s:[0,1],

            a:[-1,0],

            d:[1,0]

        }[e.key];


        if(d){

            e.preventDefault();

            movePlayer(d[0],d[1]);

        }

    }

});


$$("[data-dir]").forEach(button=>{

    button.onclick=()=>{

        const d={

            up:[0,-1],

            down:[0,1],

            left:[-1,0],

            right:[1,0]

        }[button.dataset.dir];


        movePlayer(d[0],d[1]);

    };

});


/* =========================================================
   LEVEL 6 — BOSS PLATFORMER
   ========================================================= */

let bossCanvas;

let bossCtx;

let boss;

let bossRunning=false;

let bossKeys={};


function startBoss(){

    show("#bossScreen");

    state.level=6;

    state.boss={

        lives:3,

        health:5,

        phase:1,

        scanner:false,

        mirror:false,

        icecream:false,

        key:false,

        flipflop:false,

        defeated:false

    };


    $("#bossLives").textContent="3";

    $("#bossHealth").textContent="5";

    $("#bossMessage").textContent=
        "THE FINAL GUARDIAN IS AWAKE.";


    bossCanvas=$("#bossCanvas");

    bossCtx=bossCanvas.getContext("2d");

    bossCanvas.width=960;

    bossCanvas.height=540;


    boss={

        x:100,

        y:390,

        vx:0,

        vy:0,

        width:25,

        height:42,

        grounded:false,

        invulnerable:0,

        frame:0,

        platforms:[

            {x:0,y:485,w:960,h:55},

            {x:120,y:400,w:170,h:18},

            {x:360,y:330,w:150,h:18},

            {x:580,y:410,w:170,h:18},

            {x:780,y:300,w:120,h:18},

            {x:430,y:220,w:140,h:18}

        ],

        key:{x:850,y:260,visible:false},

        bossEye:{

            x:700,

            y:160,

            vx:0,

            vy:0,

            health:5,

            attackTimer:0,

            stunned:0,

            copies:false

        },

        projectiles:[],

        icecream:null,

        mirror:false,

        weakPoint:false,

        gate:false

    };


    bossRunning=true;

    requestAnimationFrame(bossLoop);

}


function bossLoop(){

    if(!bossRunning)return;

    updateBoss();

    drawBoss();

    requestAnimationFrame(bossLoop);

}


function updateBoss(){

    boss.frame++;


    /* PLAYER */

    boss.vy+=0.65;

    boss.x+=boss.vx;

    boss.y+=boss.vy;

    boss.vx*=0.82;


    if(boss.x<0)boss.x=0;

    if(boss.x>935)boss.x=935;


    boss.grounded=false;


    boss.platforms.forEach(p=>{

        if(

            boss.x+boss.width>p.x &&

            boss.x<p.x+p.w &&

            boss.y+boss.height>=p.y &&

            boss.y+boss.height<=p.y+25 &&

            boss.vy>=0

        ){

            boss.y=p.y-boss.height;

            boss.vy=0;

            boss.grounded=true;

        }

    });


    /* EYE */

    const eye=boss.bossEye;


    if(eye.stunned>0){

        eye.stunned--;

    }else{

        const targetX=boss.x+boss.width/2;

        eye.x+=(targetX-eye.x)*0.012;


        eye.attackTimer++;


        if(
            eye.attackTimer>100
        ){

            eye.attackTimer=0;

            fireEyeProjectile();

        }

    }


    /* PROJECTILES */

    boss.projectiles.forEach(p=>{

        p.x+=p.vx;

        p.y+=p.vy;

    });


    boss.projectiles=
        boss.projectiles.filter(
            p=>p.x>-50&&p.x<1010
        );


    /* PROJECTILE COLLISION */

    if(
        boss.invulnerable<=0
    ){

        boss.projectiles.forEach(p=>{

            if(

                p.x>boss.x &&

                p.x<boss.x+boss.width &&

                p.y>boss.y &&

                p.y<boss.y+boss.height

            ){

                loseLife();

            }

        });

    }else{

        boss.invulnerable--;

    }


    /* ICE CREAM */

    if(
        boss.icecream &&
        boss.icecream.time>0
    ){

        boss.icecream.time--;

        eye.x+=
            (boss.icecream.x-eye.x)*0.04;

    }


    /* KEY */

    if(
        Math.abs(boss.x-boss.key.x)<35 &&
        Math.abs(boss.y-boss.key.y)<45
    ){

        boss.key.visible=false;

        boss.gate=true;

        bossMessage(
            "KEY FOUND. REACH THE FINAL GATE."
        );

    }


    /* GATE */

    if(
        boss.gate &&
        boss.x>900 &&
        boss.y>420
    ){

        bossDefeated();

    }


    /* BOSS PHASES */

    if(eye.health<=3){

        state.boss.phase=2;

    }

    if(eye.health<=1){

        state.boss.phase=3;

    }

}


/* =========================================================
   BOSS PROJECTILES
   ========================================================= */

function fireEyeProjectile(){

    const eye=boss.bossEye;

    const dx=
        boss.x-eye.x;

    const dy=
        boss.y-eye.y;

    const distance=
        Math.sqrt(dx*dx+dy*dy)||1;


    boss.projectiles.push({

        x:eye.x,

        y:eye.y,

        vx:(dx/distance)*4,

        vy:(dy/distance)*4

    });

}


/* =========================================================
   BOSS LIFE
   ========================================================= */

function loseLife(){

    boss.invulnerable=100;

    boss.lives--;

    $("#bossLives").textContent=
        boss.lives;


    boss.x=100;

    boss.y=390;

    boss.vy=0;


    if(boss.lives<=0){

        boss.lives=3;

        $("#bossLives").textContent="3";

        bossMessage(
            "THE EYE RESET YOU. TRY AGAIN."
        );

    }else{

        bossMessage(
            "HIT. KEEP GOING."
        );

    }

}


/* =========================================================
   BOSS TOOLS
   ========================================================= */

$$("[data-boss-tool]").forEach(button=>{

    button.onclick=()=>{

        useBossTool(
            button.dataset.bossTool
        );

    };

});


function useBossTool(tool){

    if(tool==="scanner"){

        state.boss.scanner=true;

        boss.bossEye.weakPoint=true;

        bossMessage(
            "SCANNER: WEAK POINT REVEALED."
        );

    }


    if(tool==="flipflop"){

        if(!state.boss.scanner){

            bossMessage(
                "SCAN THE EYE FIRST."
            );

            return;

        }


        if(
            Math.abs(
                boss.x-boss.bossEye.x
            )<180
        ){

            boss.bossEye.health--;

            $("#bossHealth").textContent=
                boss.bossEye.health;

            boss.bossEye.stunned=60;

            bossMessage(
                "FLIP-FLOP HIT! THE EYE SCREAMS."
            );


            if(boss.bossEye.health<=0){

                boss.key.visible=true;

                bossMessage(
                    "THE EYE IS WEAK. THE KEY HAS APPEARED."
                );

            }

        }else{

            bossMessage(
                "GET CLOSER TO THE EYE."
            );

        }

    }


    if(tool==="icecream"){

        state.boss.icecream=true;

        boss.icecream={

            x:boss.x,

            y:boss.y,

            time:300

        };

        bossMessage(
            "ICE CREAM! THE EYE IS DISTRACTED."
        );

    }


    if(tool==="mirror"){

        state.boss.mirror=true;

        boss.bossEye.copies=true;

        bossMessage(
            "MIRROR ACTIVE. THE REAL EYE IS REVEALED."
        );

    }


    if(tool==="key"){

        if(boss.key.visible){

            boss.gate=true;

            bossMessage(
                "THE KEY IS READY. FIND THE FINAL GATE."
            );

        }else{

            bossMessage(
                "THE KEY HAS NOT APPEARED YET."
            );

        }

    }

}


/* =========================================================
   BOSS MESSAGE
   ========================================================= */

function bossMessage(text){

    $("#bossMessage").textContent=text;

}


/* =========================================================
   BOSS CONTROLS
   ========================================================= */

function bossLeft(){

    boss.vx=-4;

}

function bossRight(){

    boss.vx=4;

}

function bossJump(){

    if(boss.grounded){

        boss.vy=-12;

    }

}


$$("[data-boss-key]").forEach(button=>{

    button.onclick=()=>{

        const k=button.dataset.bossKey;

        if(k==="left")bossLeft();

        if(k==="right")bossRight();

        if(k==="jump")bossJump();

    };

});


document.addEventListener("keydown",e=>{

    if(state.stage!=="bossScreen")return;

    if(e.key==="ArrowLeft"||e.key==="a"){

        bossLeft();

    }

    if(e.key==="ArrowRight"||e.key==="d"){

        bossRight();

    }

    if(
        e.key==="ArrowUp"||
        e.key==="w"||
        e.key===" "
    ){

        bossJump();

    }

});


/* =========================================================
   DRAW THE LITTLE GIRL
   ========================================================= */

function drawGirl(c){

    const x=boss.x;

    const y=boss.y;


    /* shadow */

    c.fillStyle="#0008";

    c.beginPath();

    c.ellipse(
        x+13,
        y+43,
        17,
        4,
        0,
        0,
        Math.PI*2
    );

    c.fill();


    /* legs */

    c.fillStyle="#222";

    c.fillRect(
        x+6,
        y+30,
        6,
        12
    );

    c.fillRect(
        x+16,
        y+30,
        6,
        12
    );


    /* shoes */

    c.fillStyle="#111";

    c.fillRect(
        x+3,
        y+40,
        10,
        5
    );

    c.fillRect(
        x+16,
        y+40,
        10,
        5
    );


    /* dress */

    c.fillStyle="#b9b9c7";

    c.beginPath();

    c.moveTo(x+5,y+19);

    c.lineTo(x+23,y+19);

    c.lineTo(x+28,y+36);

    c.lineTo(x+2,y+36);

    c.closePath();

    c.fill();


    /* arms */

    c.fillStyle="#f0c6a0";

    c.fillRect(
        x,
        y+20,
        6,
        13
    );

    c.fillRect(
        x+23,
        y+20,
        6,
        13
    );


    /* neck */

    c.fillRect(
        x+11,
        y+14,
        8,
        8
    );


    /* hair */

    c.fillStyle="#f0c94f";

    c.fillRect(
        x+4,
        y+2,
        23,
        17
    );

    c.fillRect(
        x+1,
        y+8,
        7,
        19
    );

    c.fillRect(
        x+24,
        y+8,
        7,
        19
    );


    /* face */

    c.fillStyle="#f0c6a0";

    c.fillRect(
        x+8,
        y+7,
        16,
        14
    );


    /* eyes */

    c.fillStyle="#111";

    c.fillRect(
        x+11,
        y+13,
        2,
        2
    );

    c.fillRect(
        x+19,
        y+13,
        2,
        2
    );


    /* hat */

    c.fillStyle="#b42a38";

    c.fillRect(
        x+4,
        y,
        24,
        6
    );

    c.fillRect(
        x+9,
        y-5,
        13,
        6
    );

}


/* =========================================================
   DRAW THE GIANT RED EYE
   ========================================================= */

function drawBossEye(c){

    const eye=boss.bossEye;

    const x=eye.x;

    const y=eye.y;


    /* aura */

    c.shadowBlur=35;

    c.shadowColor="#f00000";


    /* outer eye */

    c.fillStyle="#eee";

    c.beginPath();

    c.ellipse(
        x,
        y,
        125,
        70,
        0,
        0,
        Math.PI*2
    );

    c.fill();


    /* red iris */

    c.fillStyle="#c00000";

    c.beginPath();

    c.arc(
        x,
        y,
        52,
        0,
        Math.PI*2
    );

    c.fill();


    /* iris detail */

    c.strokeStyle="#600";

    c.lineWidth=7;

    c.beginPath();

    c.arc(
        x,
        y,
        38,
        0,
        Math.PI*2
    );

    c.stroke();


    /* pupil */

    c.fillStyle="#050000";

    c.beginPath();

    c.arc(
        x,
        y,
        22,
        0,
        Math.PI*2
    );

    c.fill();


    c.shadowBlur=0;


    /* weak point */

    if(
        state.boss.scanner &&
        eye.health>0
    ){

        c.strokeStyle="#fff";

        c.lineWidth=3;

        c.beginPath();

        c.arc(
            x,
            y-2,
            68,
            0,
            Math.PI*2
        );

        c.stroke();

    }


    /* copies */

    if(
        state.boss.mirror &&
        state.boss.phase>=2
    ){

        c.globalAlpha=.18;

        c.fillStyle="#f00";

        c.beginPath();

        c.arc(
            x-190,
            y+50,
            50,
            0,
            Math.PI*2
        );

        c.fill();

        c.beginPath();

        c.arc(
            x+190,
            y+80,
            50,
            0,
            Math.PI*2
        );

        c.fill();

        c.globalAlpha=1;

    }

}


/* =========================================================
   DRAW BOSS LEVEL
   ========================================================= */

function drawBoss(){

    const c=bossCtx;

    c.clearRect(
        0,
        0,
        960,
        540
    );


    /* sky */

    c.fillStyle="#080008";

    c.fillRect(
        0,
        0,
        960,
        540
    );


    /* distant red glow */

    const gradient=
        c.createRadialGradient(
            700,
            170,
            20,
            700,
            170,
            400
        );

    gradient.addColorStop(
        0,
        "rgba(150,0,0,.28)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    c.fillStyle=gradient;

    c.fillRect(
        0,
        0,
        960,
        540
    );


    /* platforms */

    boss.platforms.forEach(p=>{

        c.fillStyle="#24242d";

        c.fillRect(
            p.x,
            p.y,
            p.w,
            p.h
        );

        c.fillStyle="#555";

        c.fillRect(
            p.x,
            p.y,
            p.w,
            3
        );

    });


    /* final gate */

    if(boss.gate){

        c.fillStyle="#777";

        c.fillRect(
            910,
            390,
            35,
            95
        );

        c.fillStyle="#f00";

        c.fillRect(
            920,
            430,
            12,
            12
        );

    }


    /* key */

    if(boss.key.visible){

        c.font="30px serif";

        c.fillText(
            "🔑",
            boss.key.x,
            boss.key.y
        );

    }


    /* ice cream */

    if(
        boss.icecream &&
        boss.icecream.time>0
    ){

        c.font="30px serif";

        c.fillText(
            "🍦",
            boss.icecream.x,
            boss.icecream.y
        );

    }


    /* projectiles */

    boss.projectiles.forEach(p=>{

        c.fillStyle="#f00";

        c.shadowBlur=15;

        c.shadowColor="#f00";

        c.beginPath();

        c.arc(
            p.x,
            p.y,
            8,
            0,
            Math.PI*2
        );

        c.fill();

        c.shadowBlur=0;

    });


    drawBossEye(c);

    drawGirl(c);


    /* HUD phase */

    c.fillStyle="#777";

    c.font="12px monospace";

    c.fillText(
        "PHASE "+state.boss.phase,
        15,
        25
    );


    if(
        state.boss.mirror
    ){

        c.fillStyle="#ddd";

        c.fillText(
            "MIRROR: REAL EYE REVEALED",
            15,
            43
        );

    }

}


/* =========================================================
   BOSS DEFEATED
   ========================================================= */

function bossDefeated(){

    if(state.boss.defeated)return;

    state.boss.defeated=true;

    bossRunning=false;

    $("#bossOverlayText").textContent=
        "BOSS DEFEATED";

    $("#bossOverlay").classList.remove("hidden");

}


$("#bossContinue").onclick=()=>{

    $("#bossOverlay").classList.add("hidden");

    show("#mazeScreen");

    startMazeGame();

};


/* =========================================================
   MAZE AFTER BOSS
   ========================================================= */

let mazeCtx;

let mazePlayer;

const mazeMap=[

"11111111111",

"10000000001",

"10111111101",

"10100000101",

"10101110101",

"10100000101",

"10111110101",

"10000000101",

"10111111101",

"10000000001",

"11111111111"

];


function startMazeGame(){

    mazeCtx=$("#mazeCanvas").getContext("2d");

    mazeCtx.canvas.width=440;

    mazeCtx.canvas.height=440;

    mazePlayer={
        x:1,
        y:1
    };

    $("#mazeMessage").textContent=
        "YOU THOUGHT THE EYE WAS THE END.";

    $("#mazeContinue").classList.add("hidden");

    drawAfterMaze();

}


function drawAfterMaze(){

    const c=mazeCtx;

    const size=40;

    c.fillStyle="#000";

    c.fillRect(
        0,
        0,
        440,
        440
    );


    for(
        let y=0;
        y<mazeMap.length;
        y++
    ){

        for(
            let x=0;
            x<11;
            x++
        ){

            if(
                mazeMap[y][x]==="1"
            ){

                c.fillStyle="#20202a";

                c.fillRect(
                    x*size,
                    y*size,
                    size,
                    size
                );

            }

        }

    }


    c.fillStyle="#fff";

    c.fillRect(
        mazePlayer.x*size+10,
        mazePlayer.y*size+10,
        20,
        20
    );


    c.fillStyle="#900";

    c.fillRect(
        9*size+10,
        9*size+10,
        20,
        20
    );

}


function moveAfterMaze(dx,dy){

    const x=mazePlayer.x+dx;

    const y=mazePlayer.y+dy;


    if(
        mazeMap[y] &&
        mazeMap[y][x]==="0"
    ){

        mazePlayer.x=x;

        mazePlayer.y=y;

        drawAfterMaze();

    }


    if(
        mazePlayer.x===9 &&
        mazePlayer.y===9
    ){

        $("#mazeMessage").textContent=
            "EXIT FOUND.";

        $("#mazeContinue").classList.remove(
            "hidden"
        );

    }

}


document.addEventListener("keydown",e=>{

    if(state.stage!=="mazeScreen")return;

    const d={

        ArrowUp:[0,-1],

        ArrowDown:[0,1],

        ArrowLeft:[-1,0],

        ArrowRight:[1,0]

    }[e.key];


    if(d){

        moveAfterMaze(
            d[0],
            d[1]
        );

    }

});


$("#mazeContinue").onclick=()=>{

    show("#blackBoxScreen");

};


/* =========================================================
   BLACK BOX
   ========================================================= */

let switches=[0,0,0,0];

let dials=[0,0,0];

let symbol=null;


$$("[data-switch]").forEach(button=>{

    button.onclick=()=>{

        const i=
            Number(button.dataset.switch);

        switches[i]^=1;

        button.classList.toggle(
            "active"
        );

    };

});


$$("[data-dial]").forEach(button=>{

    button.onclick=()=>{

        const i=
            Number(button.dataset.dial);

        dials[i]=
            (dials[i]+1)%4;

        button.textContent=
            ["◉","◎","●","○"][dials[i]];

    };

});


$$("[data-symbol]").forEach(button=>{

    button.onclick=()=>{

        symbol=
            button.dataset.symbol;

        $$("[data-symbol]").forEach(
            x=>x.classList.remove("active")
        );

        button.classList.add("active");

    };

});


$("#blackButton").onclick=()=>{

    if(

        switches.join("")==="1010" &&

        dials.join("")==="230" &&

        symbol==="eye"

    ){

        $("#blackBoxMessage").textContent=
            "CONFIGURATION ACCEPTED.";

        setTimeout(
            ()=>show("#dontPressScreen"),
            1200
        );

    }else{

        $("#blackBoxMessage").textContent=
            "NOTHING HAPPENS.";

    }

};


/* =========================================================
   DON'T PRESS
   ========================================================= */

let pressCount=0;

$("#dontPressButton").onclick=()=>{

    pressCount++;

    const lines=[

        "I TOLD YOU NOT TO PRESS IT.",

        "WHY DID YOU PRESS IT?",

        "STOP.",

        "...",

        "THERE IS NO ARCHIVE HERE."

    ];

    $("#dontPressText").textContent=
        lines[
            Math.min(
                pressCount-1,
                lines.length-1
            )
        ];


    if(pressCount>=5){

        setTimeout(
            ()=>show("#questionScreen"),
            1000
        );

    }

};


/* =========================================================
   QUESTION
   ========================================================= */

$("#questionYes").onclick=()=>{

    show("#easterEggScreen");

};


$("#questionNo").onclick=()=>{

    $("#questionScreen p").textContent=
        "THAT IS NOT TRUE.";

};


/* =========================================================
   EASTER EGG
   ========================================================= */

$("#eggContinue").onclick=()=>{

    show("#noArchiveScreen");

    eyeScene();

};


/* =========================================================
   EYE SCENE
   ========================================================= */

let eyeIndex=0;

const eyeLines=[

    "YOU FOUND ME.",

    "YOU THOUGHT THE BOSS WAS THE END.",

    "IT WAS ONLY A DOOR.",

    "NOW I KNOW YOUR NAME."

];


function eyeScene(){

    eyeIndex=0;

    $("#eyeContinue").classList.add(
        "hidden"
    );

    nextEyeLine();

}


function nextEyeLine(){

    if(
        eyeIndex>=eyeLines.length
    ){

        $("#eyeContinue").classList.remove(
            "hidden"
        );

        return;

    }


    $("#eyeText").textContent=
        eyeLines[eyeIndex];

    speak(
        eyeLines[eyeIndex]
    );

    eyeIndex++;

    setTimeout(
        nextEyeLine,
        2200
    );

}


$("#eyeContinue").onclick=()=>{

    show("#nameScreen");

};


/* =========================================================
   VOICE
   ========================================================= */

$("#voiceToggle").onclick=()=>{

    state.voice=!state.voice;

    $("#voiceToggle").textContent=
        state.voice
            ? "VOICE ON"
            : "VOICE OFF";

};


function speak(text){

    if(
        !state.voice ||
        !("speechSynthesis" in window)
    )return;

    speechSynthesis.cancel();

    const speech=
        new SpeechSynthesisUtterance(text);

    speech.rate=.8;

    speech.pitch=.5;

    speech.volume=.8;

    speechSynthesis.speak(
        speech
    );

}


/* =========================================================
   NAME
   ========================================================= */

$("#nameSubmit").onclick=()=>{

    const name=
        $("#agentName").value.trim();


    if(name){

        state.agent=name;

        localStorage.setItem(
            "agentName",
            name
        );

    }


    show("#eyeScreen");

    startFinalEye();

};


/* =========================================================
   FINAL EYE
   ========================================================= */

let dialogueIndex=0;

const dialogue=[

    "HELLO, "+(
        state.agent || "INVESTIGATOR"
    )+".",

    "YOU CAME ALL THIS WAY.",

    "YOU DEFEATED MY GUARDIAN.",

    "YOU OPENED THE ARCHIVE.",

    "BUT YOU STILL DON'T KNOW WHAT YOU FOUND."

];


function startFinalEye(){

    dialogueIndex=0;

    $("#eyeChoices").classList.add(
        "hidden"
    );

    finalDialogue();

}


function finalDialogue(){

    if(
        dialogueIndex>=dialogue.length
    ){

        $("#eyeChoices").classList.remove(
            "hidden"
        );

        return;

    }


    let text=dialogue[dialogueIndex];

    if(dialogueIndex===0){

        text=
            "HELLO, "+
            (state.agent||"INVESTIGATOR")+
            ".";

    }


    $("#eyeDialogue").textContent=
        text;

    speak(text);

    dialogueIndex++;

    setTimeout(
        finalDialogue,
        2600
    );

}


$$("[data-choice]").forEach(button=>{

    button.onclick=()=>{

        if(
            button.dataset.choice==="free"
        ){

            $("#eyeDialogue").textContent=
                "YOU OPENED THE WRONG DOOR.";

        }else{

            $("#eyeDialogue").textContent=
                "YOU CANNOT LEAVE.";

        }


        setTimeout(
            startMemory,
            2500
        );

    };

});


/* =========================================================
   MEMORY
   ========================================================= */

function startMemory(){

    show("#memoryScreen");

    const sequence=
        "17 03 01";

    $("#memorySequence").textContent=
        sequence;

    $("#memoryMessage").textContent=
        "REMEMBER THE DATE.";

}


$("#memorySubmit").onclick=()=>{

    const answer=
        $("#memoryInput").value
        .replace(/\D/g,"");


    if(
        answer==="170301" ||
        answer==="17032001"
    ){

        $("#memoryMessage").textContent=
            "MEMORY VERIFIED.";

        setTimeout(
            showEnding,
            1400
        );

    }else{

        $("#memoryMessage").textContent=
            "MEMORY CORRUPTED.";

    }

};


/* =========================================================
   ENDING
   ========================================================= */

function showEnding(){

    show("#endingScreen");

    $("#endingText").textContent=
        "THE ARCHIVE IS RESTORED. "+
        "BUT THE EYE WAS NEVER CONTAINED INSIDE IT. "+
        "IT WAS WATCHING FROM THE BEGINNING.";

}


$("#endingContinue").onclick=()=>{

    $("#endingText").textContent=
        "FINAL FILE: BLACK IRIS. "+
        "STATUS: OPEN.";

};


/* =========================================================
   INITIAL STATE
   ========================================================= */

renderTools();
