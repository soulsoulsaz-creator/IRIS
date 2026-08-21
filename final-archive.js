"use strict";

/* =========================================================
   BLACK IRIS — FINAL ARCHIVE GAME ENGINE
   ========================================================= */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const screens = $$(".screen");

const state = {
    stage: "intro",
    level: 1,
    fragments: 0,
    voice: true,
    agent: localStorage.getItem("agentName") || "",
    tools: {},
    boss: {}
};

function show(id) {
    screens.forEach((screen) => screen.classList.remove("active"));

    const target = $(id);

    if (target) {
        target.classList.add("active");
    }

    state.stage = id.replace("#", "");
}

function message(text) {
    const element = $("#toolMessage");

    if (!element) return;

    element.textContent = text;

    clearTimeout(message.timer);

    message.timer = setTimeout(() => {
        element.textContent = "";
    }, 2200);
}


/* =========================================================
   RECOVERY PROTOCOL — LEVELS 1–5
   ========================================================= */

const levelMessages = {
    1: "RECOVER THE FIRST FRAGMENT.",
    2: "SOMETHING CAN STOP THE HUNTERS.",
    3: "THERE ARE ROOMS WITHOUT ENTRANCES.",
    4: "THE SCANNER MAY REVEAL WHAT IS HIDDEN.",
    5: "DISTRACT THEM. WATCH THE REFLECTION."
};

const levelTools = {
    1: {
        scanner: 1
    },

    2: {
        flipflop: 2
    },

    3: {
        key: 1,
        icecream: 1
    },

    4: {
        scanner: 1,
        flipflop: 1
    },

    5: {
        icecream: 1,
        mirror: 1
    }
};

const TILE = 24;
const MAP_WIDTH = 21;
const MAP_HEIGHT = 21;

let canvas;
let ctx;

let map = [];
let player = null;
let enemies = [];
let fragments = [];

let doorOpen = false;
let keyArmed = false;

let iceTarget = null;
let mirrorTime = 0;
let scannerTime = 0;


/* =========================================================
   START GAME
   ========================================================= */

if ($("#beginButton")) {
    $("#beginButton").onclick = () => {
        state.level = 1;
        state.fragments = 0;

        show("#arcadeScreen");

        setupLevel();
    };
}


function setupLevel() {

    $("#levelDisplay").textContent = "LEVEL " + state.level;

    $("#arcadeMessage").textContent =
        levelMessages[state.level] || "";

    $("#fragmentsFound").textContent =
        state.fragments;

    state.tools = {
        scanner: 0,
        flipflop: 0,
        key: 0,
        icecream: 0,
        mirror: 0
    };

    Object.assign(
        state.tools,
        levelTools[state.level] || {}
    );

    keyArmed = false;
    iceTarget = null;
    mirrorTime = 0;
    scannerTime = 0;

    renderTools();

    buildMaze();
}


/* =========================================================
   TOOLS
   ========================================================= */

function renderTools() {

    $$(".tool").forEach((button) => {

        const tool = button.dataset.tool;

        const amount =
            state.tools[tool] || 0;

        const small = button.querySelector("small");

        if (small) {
            small.textContent =
                amount ? "×" + amount : "";
        }

        button.style.opacity =
            amount ? "1" : ".25";

        if (tool === "key") {
            button.draggable = amount > 0;
        }
    });
}


/* =========================================================
   MAZE
   ========================================================= */

function walkable(x, y) {

    return !!(
        map[y] &&
        map[y][x] === 0
    );
}


function buildMaze() {

    canvas = $("#arcadeCanvas");

    if (!canvas) return;

    ctx = canvas.getContext("2d");

    canvas.width =
        MAP_WIDTH * TILE;

    canvas.height =
        MAP_HEIGHT * TILE;

    map = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {

        map[y] = [];

        for (let x = 0; x < MAP_WIDTH; x++) {

            const wall =
                x === 0 ||
                y === 0 ||
                x === MAP_WIDTH - 1 ||
                y === MAP_HEIGHT - 1 ||
                (x % 2 === 0 && y % 2 === 0);

            map[y][x] = wall ? 1 : 0;
        }
    }

    /*
       Open corridors.
    */

    for (let x = 1; x < MAP_WIDTH - 1; x++) {

        map[1][x] = 0;
        map[MAP_HEIGHT - 2][x] = 0;
    }

    for (let y = 1; y < MAP_HEIGHT - 1; y++) {

        map[y][1] = 0;
        map[y][MAP_WIDTH - 2] = 0;
    }

    /*
       Horizontal corridors.
    */

    for (
        let y = 3;
        y < MAP_HEIGHT - 3;
        y += 4
    ) {

        for (
            let x = 1;
            x < MAP_WIDTH - 1;
            x++
        ) {

            map[y][x] = 0;
        }
    }

    /*
       Vertical corridors.
    */

    for (
        let x = 3;
        x < MAP_WIDTH - 3;
        x += 4
    ) {

        for (
            let y = 1;
            y < MAP_HEIGHT - 1;
            y++
        ) {

            map[y][x] = 0;
        }
    }


    /*
       LEVEL 3 — SECRET ROOM

       The room has no normal entrance.
       The player must find the key.
    */

    if (state.level === 3) {

        for (let y = 5; y <= 9; y++) {

            for (let x = 15; x <= 18; x++) {

                map[y][x] = 0;
            }
        }

        /*
           Seal room.
        */

        for (let x = 15; x <= 18; x++) {

            map[4][x] = 1;
            map[10][x] = 1;
        }

        for (let y = 5; y <= 9; y++) {

            map[y][19] = 1;
            map[y][14] = 1;
        }

        /*
           Locked door.
        */

        map[7][14] = 0;
    }


    player = {
        x: 1,
        y: 1
    };


    /*
       Difficulty progression.

       Levels 1–2 = easier.
       Level 3 = medium.
       Levels 4–5 = harder.
    */

    const enemyCount =
        state.level <= 2
            ? 1
            : state.level === 3
                ? 2
                : 3;


    const enemyPositions = [

        {
            x: 19,
            y: 1
        },

        {
            x: 19,
            y: 19
        },

        {
            x: 11,
            y: 19
        }
    ];


    enemies = enemyPositions
        .slice(0, enemyCount)
        .map((enemy) => ({
            ...enemy,
            stunned: 0
        }));


    const fragmentPositions = [

        {
            x: 19,
            y: 19
        },

        {
            x: 19,
            y: 1
        },

        {
            x: 16,
            y: 7
        },

        {
            x: 1,
            y: 19
        },

        {
            x: 19,
            y: 10
        }
    ];


    fragments = [

        {
            ...fragmentPositions[
                state.level - 1
            ],
            collected: false
        }

    ];

    doorOpen = false;

    drawMaze();
}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function movePlayer(dx, dy) {

    if (!player) return;

    const nextX =
        player.x + dx;

    const nextY =
        player.y + dy;


    /*
       Level 3 locked door.
    */

    if (
        state.level === 3 &&
        !doorOpen &&
        nextX === 14 &&
        nextY === 7
    ) {

        if (
            keyArmed ||
            state.tools.key > 0
        ) {

            doorOpen = true;
            keyArmed = false;

            if (state.tools.key > 0) {
                state.tools.key--;
            }

            renderTools();

            message(
                "KEY INSERTED. DOOR OPEN."
            );

        } else {

            message(
                "LOCKED. FIND THE KEY."
            );
        }

        drawMaze();

        return;
    }


    if (!walkable(nextX, nextY)) {
        return;
    }


    player.x = nextX;
    player.y = nextY;


    collectFragment();

    enemyCollision();

    drawMaze();
}


/* =========================================================
   FRAGMENT
   ========================================================= */

function collectFragment() {

    const fragment =
        fragments.find(
            (f) =>
                !f.collected &&
                f.x === player.x &&
                f.y === player.y
        );


    if (!fragment) return;


    fragment.collected = true;

    state.fragments++;


    $("#fragmentsFound").textContent =
        state.fragments;


    message(
        "FRAGMENT RECOVERED."
    );


    /*
       Move to next level.
    */

    if (state.level < 5) {

        setTimeout(() => {

            state.level++;

            setupLevel();

        }, 650);

    } else {

        setTimeout(
            startBoss,
            900
        );
    }
}


/* =========================================================
   ENEMY COLLISION
   ========================================================= */

function enemyCollision() {

    const now = Date.now();


    for (const enemy of enemies) {

        if (
            enemy.stunned > now
        ) {
            continue;
        }


        if (
            enemy.x === player.x &&
            enemy.y === player.y
        ) {

            player.x = 1;
            player.y = 1;

            message(
                "CONTACT. RETURNED TO START."
            );

            break;
        }
    }
}


/* =========================================================
   ENEMY AI

   IMPORTANT:
   ENEMIES MOVE EVEN WHEN THE PLAYER DOES NOTHING.
   ========================================================= */

function enemyAI() {

    if (
        state.stage !== "arcade" ||
        !enemies ||
        !player
    ) {
        return;
    }


    const now = Date.now();


    for (const enemy of enemies) {

        if (
            enemy.stunned > now
        ) {
            continue;
        }


        /*
           Ice cream becomes the enemy target.
        */

        const target =
            iceTarget &&
            iceTarget.until > now
                ? iceTarget
                : player;


        let options = [

            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]

        ].filter(
            (direction) =>
                walkable(
                    enemy.x + direction[0],
                    enemy.y + direction[1]
                )
        );


        if (!options.length) {
            continue;
        }


        /*
           Choose movement toward target.
        */

        options.sort(
            (a, b) => {

                const distanceA =
                    Math.abs(
                        enemy.x + a[0] - target.x
                    ) +
                    Math.abs(
                        enemy.y + a[1] - target.y
                    );


                const distanceB =
                    Math.abs(
                        enemy.x + b[0] - target.x
                    ) +
                    Math.abs(
                        enemy.y + b[1] - target.y
                    );


                return distanceA - distanceB;
            }
        );


        /*
           Early levels are forgiving.
        */

        if (
            state.level <= 2 &&
            Math.random() < 0.35
        ) {

            options.reverse();
        }


        if (
            state.level === 3 &&
            Math.random() < 0.18
        ) {

            options.reverse();
        }


        /*
           Harder levels chase more aggressively.
        */

        const direction =
            options[0];


        enemy.x += direction[0];
        enemy.y += direction[1];
    }


    enemyCollision();

    drawMaze();
}


/*
   Enemies have their own independent clock.
*/

setInterval(
    enemyAI,
    900
);


/* =========================================================
   DRAW MAZE
   ========================================================= */

function drawMaze() {

    if (!ctx || !map) return;


    ctx.fillStyle = "#000";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Walls.
    */

    for (
        let y = 0;
        y < MAP_HEIGHT;
        y++
    ) {

        for (
            let x = 0;
            x < MAP_WIDTH;
            x++
        ) {

            if (map[y][x]) {

                ctx.fillStyle =
                    "#151520";

                ctx.fillRect(
                    x * TILE,
                    y * TILE,
                    TILE,
                    TILE
                );

                ctx.strokeStyle =
                    "#292938";

                ctx.strokeRect(
                    x * TILE + 1,
                    y * TILE + 1,
                    TILE - 2,
                    TILE - 2
                );
            }
        }
    }


    /*
       Fragment.
    */

    fragments.forEach(
        (fragment) => {

            if (!fragment.collected) {

                ctx.fillStyle =
                    "#eee";

                ctx.fillRect(
                    fragment.x * TILE + 7,
                    fragment.y * TILE + 7,
                    10,
                    10
                );
            }
        }
    );


    /*
       Locked door.
    */

    if (state.level === 3) {

        ctx.fillStyle =
            doorOpen
                ? "#333"
                : "#900";

        ctx.fillRect(
            14 * TILE + 2,
            7 * TILE + 2,
            TILE - 4,
            TILE - 4
        );


        /*
           Scanner highlights door.
        */

        if (
            !doorOpen &&
            scannerTime > Date.now()
        ) {

            ctx.strokeStyle =
                "#fff";

            ctx.lineWidth = 3;

            ctx.strokeRect(
                14 * TILE,
                7 * TILE,
                TILE,
                TILE
            );
        }
    }


    /*
       Enemies.
    */

    enemies.forEach(
        (enemy) => {

            ctx.fillStyle =
                enemy.stunned > Date.now()
                    ? "#555"
                    : "#a22";

            ctx.beginPath();

            ctx.arc(
                enemy.x * TILE + 12,
                enemy.y * TILE + 12,
                8,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    );


    /*
       Player.
    */

    ctx.fillStyle =
        "#fff";

    ctx.beginPath();

    ctx.arc(
        player.x * TILE + 12,
        player.y * TILE + 12,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
       Ice cream.
    */

    if (
        iceTarget &&
        iceTarget.until > Date.now()
    ) {

        ctx.font = "18px serif";

        ctx.fillText(
            "🍦",
            iceTarget.x * TILE,
            iceTarget.y * TILE + 20
        );
    }


    /*
       Mirror effect.
    */

    if (
        mirrorTime > Date.now()
    ) {

        ctx.strokeStyle =
            "#ddd";

        ctx.strokeRect(
            3,
            3,
            canvas.width - 6,
            canvas.height - 6
        );
    }
}


/* =========================================================
   INVENTORY TOOLS
   ========================================================= */

$$(".tool").forEach(
    (button) => {

        button.onclick = () => {

            const tool =
                button.dataset.tool;

            const amount =
                state.tools[tool] || 0;


            if (!amount) {

                message(
                    "OBJECT UNAVAILABLE."
                );

                return;
            }


            /*
               SCANNER
            */

            if (tool === "scanner") {

                state.tools.scanner--;

                scannerTime =
                    Date.now() + 5000;

                message(
                    "SCANNER ACTIVE. HIDDEN OBJECTS REVEALED."
                );
            }


            /*
               FLIP-FLOP
            */

            else if (
                tool === "flipflop"
            ) {

                const enemy =
                    enemies.find(
                        (e) =>
                            e.stunned <= Date.now()
                    );


                if (enemy) {

                    enemy.stunned =
                        Date.now() + 4000;

                    state.tools.flipflop--;

                    message(
                        "SMACK. ENEMY DISABLED."
                    );
                }
            }


            /*
               KEY
            */

            else if (
                tool === "key"
            ) {

                keyArmed = true;

                message(
                    "KEY READY. PUT IT ON THE LOCKED DOOR."
                );
            }


            /*
               ICE CREAM
            */

            else if (
                tool === "icecream"
            ) {

                state.tools.icecream--;

                iceTarget = {

                    x: player.x,
                    y: player.y,

                    until:
                        Date.now() + 6000
                };


                message(
                    "ICE CREAM DEPLOYED. ENEMIES DISTRACTED."
                );
            }


            /*
               MIRROR
            */

            else if (
                tool === "mirror"
            ) {

                state.tools.mirror--;

                mirrorTime =
                    Date.now() + 5000;

                message(
                    "THE MIRROR REVEALS THE HIDDEN PATH."
                );
            }


            renderTools();

            drawMaze();
        };
    }
);


/* =========================================================
   KEY DRAGGING
   ========================================================= */

const keyButton =
    $(".tool[data-tool='key']");


if (keyButton) {

    keyButton.addEventListener(
        "dragstart",
        () => {

            keyArmed = true;

            message(
                "KEY PICKED UP. DRAG IT TO THE DOOR."
            );
        }
    );
}


if ($("#arcadeCanvas")) {

    $("#arcadeCanvas").addEventListener(
        "click",
        (event) => {

            if (
                state.stage !== "arcade" ||
                state.level !== 3 ||
                doorOpen
            ) {
                return;
            }


            const rect =
                canvas.getBoundingClientRect();


            const x =
                Math.floor(
                    (event.clientX - rect.left) /
                    TILE
                );


            const y =
                Math.floor(
                    (event.clientY - rect.top) /
                    TILE
                );


            /*
               Click/drag target = door.
            */

            if (
                x === 14 &&
                y === 7
            ) {

                if (
                    keyArmed ||
                    state.tools.key > 0
                ) {

                    doorOpen = true;

                    keyArmed = false;

                    if (
                        state.tools.key > 0
                    ) {
                        state.tools.key--;
                    }

                    renderTools();

                    message(
                        "KEY INSERTED. DOOR OPEN."
                    );

                } else {

                    message(
                        "LOCKED. FIND THE KEY."
                    );
                }


                drawMaze();
            }
        }
    );
}


/* =========================================================
   UNIVERSAL PC CONTROLS — WASD + ARROWS
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            state.stage !== "arcade"
        ) {
            return;
        }


        const direction = {

            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],

            w: [0, -1],
            W: [0, -1],

            s: [0, 1],
            S: [0, 1],

            a: [-1, 0],
            A: [-1, 0],

            d: [1, 0],
            D: [1, 0]

        }[event.key];


        if (direction) {

            event.preventDefault();

            movePlayer(
                direction[0],
                direction[1]
            );
        }
    }
);


/* =========================================================
   MOBILE CONTROLS
   ========================================================= */

$$("[data-dir]").forEach(
    (button) => {

        button.onclick = () => {

            const direction = {

                up: [0, -1],
                down: [0, 1],
                left: [-1, 0],
                right: [1, 0]

            }[button.dataset.dir];


            if (direction) {

                movePlayer(
                    direction[0],
                    direction[1]
                );
            }
        };
    }
);


/* =========================================================
   BOSS — THE RED EYE
   ========================================================= */

let bossCanvas;
let bossCtx;
let boss;
let bossRunning = false;


function startBoss() {

    show("#bossScreen");


    state.level = 6;


    state.boss = {

        lives: 3,

        health: 5,

        phase: 1,

        scanner: false,

        mirror: false,

        icecream: false,

        defeated: false
    };


    if ($("#bossLives")) {
        $("#bossLives").textContent = "3";
    }


    if ($("#bossHealth")) {
        $("#bossHealth").textContent = "5";
    }


    if ($("#bossMessage")) {

        $("#bossMessage").textContent =
            "THE FINAL GUARDIAN IS AWAKE.";
    }


    bossCanvas =
        $("#bossCanvas");


    if (!bossCanvas) return;


    bossCtx =
        bossCanvas.getContext("2d");


    bossCanvas.width = 960;
    bossCanvas.height = 540;


    boss = {

        x: 100,
        y: 390,

        vx: 0,
        vy: 0,

        width: 25,
        height: 42,

        grounded: false,

        invulnerable: 0,

        platforms: [

            {
                x: 0,
                y: 485,
                w: 960,
                h: 55
            },

            {
                x: 120,
                y: 400,
                w: 170,
                h: 18
            },

            {
                x: 360,
                y: 330,
                w: 150,
                h: 18
            },

            {
                x: 580,
                y: 410,
                w: 170,
                h: 18
            },

            {
                x: 780,
                y: 300,
                w: 120,
                h: 18
            },

            {
                x: 430,
                y: 220,
                w: 140,
                h: 18
            }
        ],


        key: {

            x: 850,
            y: 260,

            visible: false
        },


        gate: false,


        eye: {

            x: 700,
            y: 160,

            health: 5,

            attackTimer: 0,

            stunned: 0
        },


        projectiles: [],

        shots: [],

        icecream: null
    };


    bossRunning = true;

    requestAnimationFrame(
        bossLoop
    );
}


function bossLoop() {

    if (!bossRunning) {
        return;
    }


    updateBoss();

    drawBoss();


    requestAnimationFrame(
        bossLoop
    );
}


/* =========================================================
   BOSS UPDATE
   ========================================================= */

function updateBoss() {

    /*
       Gravity.
    */

    boss.vy += 0.65;

    boss.x += boss.vx;
    boss.y += boss.vy;


    boss.vx *= 0.82;


    /*
       Screen boundaries.
    */

    if (boss.x < 0) {
        boss.x = 0;
    }


    if (boss.x > 935) {
        boss.x = 935;
    }


    /*
       Platforms.
    */

    boss.grounded = false;


    for (
        const platform of boss.platforms
    ) {

        if (

            boss.x + boss.width >
                platform.x &&

            boss.x <
                platform.x + platform.w &&

            boss.y + boss.height >=
                platform.y &&

            boss.y + boss.height <=
                platform.y + 25 &&

            boss.vy >= 0

        ) {

            boss.y =
                platform.y -
                boss.height;

            boss.vy = 0;

            boss.grounded = true;
        }
    }


    const eye =
        boss.eye;


    /*
       Eye moves independently.
    */

    if (
        eye.stunned > 0
    ) {

        eye.stunned--;

    } else {

        /*
           Phase increases speed.
        */

        const speed =
            state.boss.phase === 1
                ? 0.012
                : state.boss.phase === 2
                    ? 0.020
                    : 0.030;


        eye.x +=
            (
                boss.x + 12 -
                eye.x
            ) * speed;


        eye.attackTimer++;


        const attackDelay =
            state.boss.phase === 1
                ? 115
                : state.boss.phase === 2
                    ? 90
                    : 65;


        if (
            eye.attackTimer >
            attackDelay
        ) {

            eye.attackTimer = 0;

            fireEyeProjectile();
        }
    }


    /*
       Eye projectiles.
    */

    boss.projectiles.forEach(
        (projectile) => {

            projectile.x +=
                projectile.vx;

            projectile.y +=
                projectile.vy;
        }
    );


    boss.projectiles =
        boss.projectiles.filter(
            (projectile) =>
                projectile.x > -50 &&
                projectile.x < 1010 &&
                projectile.y > -50 &&
                projectile.y < 590
        );


    /*
       Player hit.
    */

    if (
        boss.invulnerable <= 0
    ) {

        for (
            const projectile
            of boss.projectiles
        ) {

            if (

                projectile.x >
                    boss.x &&

                projectile.x <
                    boss.x +
                    boss.width &&

                projectile.y >
                    boss.y &&

                projectile.y <
                    boss.y +
                    boss.height

            ) {

                loseLife();

                break;
            }
        }

    } else {

        boss.invulnerable--;
    }


    /*
       Flip-flop projectiles.
    */

    boss.shots.forEach(
        (projectile) => {

            projectile.x +=
                projectile.vx;

            projectile.y +=
                projectile.vy;
        }
    );


    boss.shots =
        boss.shots.filter(
            (projectile) =>
                projectile.x > -30 &&
                projectile.x < 990 &&
                projectile.y > -30 &&
                projectile.y < 570
        );


    /*
       Weak-point collision.
    */

    for (
        const projectile
        of boss.shots
    ) {

        if (

            Math.hypot(
                projectile.x - eye.x,
                projectile.y - eye.y
            ) < 65 &&

            eye.health > 0 &&

            state.boss.scanner &&

            eye.stunned <= 0

        ) {

            eye.health--;

            $("#bossHealth").textContent =
                eye.health;


            eye.stunned = 50;

            projectile.hit = true;


            bossMessage(
                "FLIP-FLOP HIT! THE EYE SCREAMS."
            );


            /*
               New boss phase.
            */

            if (
                eye.health <= 3
            ) {

                state.boss.phase = 2;
            }


            if (
                eye.health <= 1
            ) {

                state.boss.phase = 3;
            }


            /*
               Boss defeated.
            */

            if (
                eye.health <= 0
            ) {

                boss.key.visible = true;

                bossMessage(
                    "THE EYE IS WEAK. THE KEY HAS APPEARED."
                );
            }
        }
    }


    boss.shots =
        boss.shots.filter(
            (projectile) =>
                !projectile.hit
        );


    /*
       Ice cream distracts Eye.
    */

    if (
        boss.icecream &&
        boss.icecream.time > 0
    ) {

        boss.icecream.time--;


        eye.x +=
            (
                boss.icecream.x -
                eye.x
            ) * 0.035;

    } else if (
        boss.icecream
    ) {

        boss.icecream = null;
    }


    /*
       Pick up key.
    */

    if (

        boss.key.visible &&

        Math.abs(
            boss.x -
            boss.key.x
        ) < 35 &&

        Math.abs(
            boss.y -
            boss.key.y
        ) < 55

    ) {

        boss.key.visible = false;

        boss.gate = true;


        bossMessage(
            "KEY FOUND. REACH THE FINAL GATE."
        );
    }


    /*
       Exit.
    */

    if (
        boss.gate &&
        boss.x > 900 &&
        boss.y > 420
    ) {

        bossDefeated();
    }
}


/* =========================================================
   EYE ATTACK
   ========================================================= */

function fireEyeProjectile() {

    const eye =
        boss.eye;


    const dx =
        boss.x -
        eye.x;


    const dy =
        boss.y -
        eye.y;


    const distance =
        Math.hypot(dx, dy) || 1;


    const projectileSpeed =
        state.boss.phase === 3
            ? 5
            : state.boss.phase === 2
                ? 4.2
                : 3.5;


    boss.projectiles.push({

        x: eye.x,

        y: eye.y,

        vx:
            dx / distance *
            projectileSpeed,

        vy:
            dy / distance *
            projectileSpeed
    });
}


/* =========================================================
   BOSS LIFE
   ========================================================= */

function loseLife() {

    boss.invulnerable = 100;

    boss.lives--;


    $("#bossLives").textContent =
        boss.lives;


    boss.x = 100;
    boss.y = 390;

    boss.vy = 0;


    if (
        boss.lives <= 0
    ) {

        /*
           Make it forgiving.

           She doesn't lose the entire boss fight.
        */

        boss.lives = 3;

        $("#bossLives").textContent =
            "3";


        bossMessage(
            "THE EYE RESET YOU. TRY AGAIN."
        );

    } else {

        bossMessage(
            "HIT. KEEP GOING."
        );
    }
}


/* =========================================================
   BOSS MOVEMENT
   ========================================================= */

function bossLeft() {

    if (!boss) return;

    boss.vx = -4;
}


function bossRight() {

    if (!boss) return;

    boss.vx = 4;
}


function bossJump() {

    if (
        boss &&
        boss.grounded
    ) {

        boss.vy = -12;
    }
}


/* =========================================================
   BOSS BUTTONS
   ========================================================= */

$$("[data-boss-key]").forEach(
    (button) => {

        button.onclick = () => {

            const key =
                button.dataset.bossKey;


            if (
                key === "left"
            ) {
                bossLeft();
            }


            if (
                key === "right"
            ) {
                bossRight();
            }


            if (
                key === "jump"
            ) {
                bossJump();
            }
        };
    }
);


/* =========================================================
   BOSS KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            state.stage !==
            "bossScreen"
        ) {
            return;
        }


        if (
            event.key === "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            bossLeft();
        }


        if (
            event.key === "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            bossRight();
        }


        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === "W" ||
            event.key === " "
        ) {

            event.preventDefault();

            bossJump();
        }
    }
);


/* =========================================================
   BOSS TOOLS
   ========================================================= */

$$("[data-boss-tool]").forEach(
    (button) => {

        button.onclick = () => {

            useBossTool(
                button.dataset.bossTool
            );
        };
    }
);


function useBossTool(tool) {

    /*
       SCANNER
    */

    if (
        tool === "scanner"
    ) {

        state.boss.scanner =
            true;


        bossMessage(
            "SCANNER: WEAK POINT REVEALED."
        );


        return;
    }


    /*
       FLIP-FLOP
    */

    if (
        tool === "flipflop"
    ) {

        if (
            !state.boss.scanner
        ) {

            bossMessage(
                "SCAN THE EYE FIRST."
            );

            return;
        }


        const dx =
            boss.eye.x -
            (boss.x + 12);


        const dy =
            boss.eye.y -
            (boss.y + 20);


        const distance =
            Math.hypot(dx, dy) || 1;


        boss.shots.push({

            x:
                boss.x + 12,

            y:
                boss.y + 20,

            vx:
                dx / distance * 9,

            vy:
                dy / distance * 9
        });


        bossMessage(
            "THROW!"
        );


        return;
    }


    /*
       ICE CREAM
    */

    if (
        tool === "icecream"
    ) {

        boss.icecream = {

            x: boss.x,

            y: boss.y,

            time: 300
        };


        state.boss.icecream =
            true;


        bossMessage(
            "ICE CREAM! THE EYE IS DISTRACTED."
        );


        return;
    }


    /*
       MIRROR
    */

    if (
        tool === "mirror"
    ) {

        state.boss.mirror =
            true;


        bossMessage(
            "MIRROR ACTIVE. THE REAL EYE IS REVEALED."
        );


        return;
    }


    /*
       KEY
    */

    if (
        tool === "key"
    ) {

        if (
            boss.key.visible
        ) {

            boss.gate = true;


            bossMessage(
                "KEY READY. FIND THE FINAL GATE."
            );

        } else {

            bossMessage(
                "THE KEY HAS NOT APPEARED YET."
            );
        }
    }
}


/* =========================================================
   GIRL CHARACTER
   Blonde hair + little hat
   ========================================================= */

function drawGirl(context) {

    const x = boss.x;
    const y = boss.y;


    /*
       Shadow.
    */

    context.fillStyle =
        "#0008";

    context.beginPath();

    context.ellipse(
        x + 13,
        y + 43,
        17,
        4,
        0,
        0,
        Math.PI * 2
    );

    context.fill();


    /*
       Legs.
    */

    context.fillStyle =
        "#222";

    context.fillRect(
        x + 6,
        y + 30,
        6,
        12
    );

    context.fillRect(
        x + 16,
        y + 30,
        6,
        12
    );


    /*
       Shoes.
    */

    context.fillStyle =
        "#111";

    context.fillRect(
        x + 3,
        y + 40,
        10,
        5
    );

    context.fillRect(
        x + 16,
        y + 40,
        10,
        5
    );


    /*
       Dress.
    */

    context.fillStyle =
        "#b9b9c7";

    context.beginPath();

    context.moveTo(
        x + 5,
        y + 19
    );

    context.lineTo(
        x + 23,
        y + 19
    );

    context.lineTo(
        x + 28,
        y + 36
    );

    context.lineTo(
        x + 2,
        y + 36
    );

    context.closePath();

    context.fill();


    /*
       Arms.
    */

    context.fillStyle =
        "#f0c6a0";

    context.fillRect(
        x,
        y + 20,
        6,
        13
    );

    context.fillRect(
        x + 23,
        y + 20,
        6,
        13
    );


    /*
       Neck.
    */

    context.fillRect(
        x + 11,
        y + 14,
        8,
        8
    );


    /*
       Blonde hair.
    */

    context.fillStyle =
        "#f0c94f";

    context.fillRect(
        x + 4,
        y + 2,
        23,
        17
    );

    context.fillRect(
        x + 1,
        y + 8,
        7,
        19
    );

    context.fillRect(
        x + 24,
        y + 8,
        7,
        19
    );


    /*
       Face.
    */

    context.fillStyle =
        "#f0c6a0";

    context.fillRect(
        x + 8,
        y + 7,
        16,
        14
    );


    /*
       Eyes.
    */

    context.fillStyle =
        "#111";

    context.fillRect(
        x + 11,
        y + 13,
        2,
        2
    );

    context.fillRect(
        x + 19,
        y + 13,
        2,
        2
    );


    /*
       Little hat.
    */

    context.fillStyle =
        "#b42a38";

    context.fillRect(
        x + 4,
        y,
        24,
        6
    );

    context.fillRect(
        x + 9,
        y - 5,
        13,
        6
    );
}


/* =========================================================
   RED EYE
   ========================================================= */

function drawBossEye(context) {

    const eye =
        boss.eye;


    const x =
        eye.x;


    const y =
        eye.y;


    /*
       Glow.
    */

    context.shadowBlur =
        35;

    context.shadowColor =
        "#f00000";


    /*
       White eye.
    */

    context.fillStyle =
        "#eee";

    context.beginPath();

    context.ellipse(
        x,
        y,
        125,
        70,
        0,
        0,
        Math.PI * 2
    );

    context.fill();


    /*
       Red iris.
    */

    context.fillStyle =
        "#c00000";

    context.beginPath();

    context.arc(
        x,
        y,
        52,
        0,
        Math.PI * 2
    );

    context.fill();


    /*
       Pupil.
    */

    context.fillStyle =
        "#050000";

    context.beginPath();

    context.arc(
        x,
        y,
        22,
        0,
        Math.PI * 2
    );

    context.fill();


    context.shadowBlur = 0;


    /*
       Scanner reveals weak point.
    */

    if (
        state.boss.scanner &&
        eye.health > 0
    ) {

        context.strokeStyle =
            "#fff";

        context.lineWidth = 3;

        context.beginPath();

        context.arc(
            x,
            y,
            68,
            0,
            Math.PI * 2
        );

        context.stroke();
    }


    /*
       Mirror effect.
    */

    if (
        state.boss.mirror &&
        state.boss.phase >= 2
    ) {

        context.globalAlpha =
            0.18;

        context.fillStyle =
            "#f00";


        context.beginPath();

        context.arc(
            x - 190,
            y + 50,
            50,
            0,
            Math.PI * 2
        );

        context.fill();


        context.beginPath();

        context.arc(
            x + 190,
            y + 80,
            50,
            0,
            Math.PI * 2
        );

        context.fill();


        context.globalAlpha = 1;
    }
}


/* =========================================================
   DRAW BOSS
   ========================================================= */

function drawBoss() {

    const context =
        bossCtx;


    context.clearRect(
        0,
        0,
        960,
        540
    );


    /*
       Background.
    */

    context.fillStyle =
        "#080008";

    context.fillRect(
        0,
        0,
        960,
        540
    );


    /*
       Platforms.
    */

    boss.platforms.forEach(
        (platform) => {

            context.fillStyle =
                "#24242d";

            context.fillRect(
                platform.x,
                platform.y,
                platform.w,
                platform.h
            );


            context.fillStyle =
                "#555";

            context.fillRect(
                platform.x,
                platform.y,
                platform.w,
                3
            );
        }
    );


    /*
       Final gate.
    */

    if (boss.gate) {

        context.fillStyle =
            "#777";

        context.fillRect(
            910,
            390,
            35,
            95
        );


        context.fillStyle =
            "#f00";

        context.fillRect(
            920,
            430,
            12,
            12
        );
    }


    /*
       Key.
    */

    if (
        boss.key.visible
    ) {

        context.font =
            "30px serif";

        context.fillText(
            "🔑",
            boss.key.x,
            boss.key.y
        );
    }


    /*
       Ice cream.
    */

    if (
        boss.icecream &&
        boss.icecream.time > 0
    ) {

        context.font =
            "30px serif";

        context.fillText(
            "🍦",
            boss.icecream.x,
            boss.icecream.y
        );
    }


    /*
       Eye projectiles.
    */

    boss.projectiles.forEach(
        (projectile) => {

            context.fillStyle =
                "#f00";

            context.beginPath();

            context.arc(
                projectile.x,
                projectile.y,
                8,
                0,
                Math.PI * 2
            );

            context.fill();
        }
    );


    /*
       Flip-flop projectiles.
    */

    boss.shots.forEach(
        (projectile) => {

            context.font =
                "24px serif";

            context.fillText(
                "🩴",
                projectile.x,
                projectile.y
            );
        }
    );


    drawBossEye(context);

    drawGirl(context);


    /*
       Phase indicator.
    */

    context.fillStyle =
        "#777";

    context.font =
        "12px monospace";

    context.fillText(
        "PHASE " +
        state.boss.phase,
        15,
        25
    );
}


/* =========================================================
   BOSS DEFEATED
   ========================================================= */

function bossMessage(text) {

    if ($("#bossMessage")) {

        $("#bossMessage").textContent =
            text;
    }
}


function bossDefeated() {

    if (
        state.boss.defeated
    ) {
        return;
    }


    state.boss.defeated =
        true;


    bossRunning = false;


    if ($("#bossOverlayText")) {

        $("#bossOverlayText").textContent =
            "BOSS DEFEATED";
    }


    if ($("#bossOverlay")) {

        $("#bossOverlay")
            .classList
            .remove("hidden");
    }
}


if ($("#bossContinue")) {

    $("#bossContinue").onclick = () => {

        $("#bossOverlay")
            ?.classList
            .add("hidden");


        show("#mazeScreen");

        startMazeGame();
    };
}


/* =========================================================
   VANISHING MAZE
   ========================================================= */

let mazeCtx;
let mazePlayer;


const mazeMap = [

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


function startMazeGame() {

    const mazeCanvas =
        $("#mazeCanvas");


    if (!mazeCanvas) {
        return;
    }


    mazeCtx =
        mazeCanvas.getContext("2d");


    mazeCtx.canvas.width =
        440;

    mazeCtx.canvas.height =
        440;


    mazePlayer = {

        x: 1,
        y: 1
    };


    $("#mazeMessage").textContent =
        "YOU THOUGHT THE EYE WAS THE END.";


    $("#mazeContinue")
        .classList
        .add("hidden");


    drawAfterMaze();
}


function drawAfterMaze() {

    const context =
        mazeCtx;


    const size = 40;


    context.fillStyle =
        "#000";


    context.fillRect(
        0,
        0,
        440,
        440
    );


    for (
        let y = 0;
        y < 11;
        y++
    ) {

        for (
            let x = 0;
            x < 11;
            x++
        ) {

            if (
                mazeMap[y][x] === "1"
            ) {

                context.fillStyle =
                    "#20202a";

                context.fillRect(
                    x * size,
                    y * size,
                    size,
                    size
                );
            }
        }
    }


    /*
       Player.
    */

    context.fillStyle =
        "#fff";

    context.fillRect(
        mazePlayer.x * size + 10,
        mazePlayer.y * size + 10,
        20,
        20
    );


    /*
       Exit.
    */

    context.fillStyle =
        "#900";

    context.fillRect(
        9 * size + 10,
        9 * size + 10,
        20,
        20
    );
}


function moveAfterMaze(dx, dy) {

    const x =
        mazePlayer.x + dx;

    const y =
        mazePlayer.y + dy;


    if (
        mazeMap[y] &&
        mazeMap[y][x] === "0"
    ) {

        mazePlayer.x = x;
        mazePlayer.y = y;

        drawAfterMaze();
    }


    if (
        mazePlayer.x === 9 &&
        mazePlayer.y === 9
    ) {

        $("#mazeMessage").textContent =
            "EXIT FOUND.";


        $("#mazeContinue")
            .classList
            .remove("hidden");
    }
}


document.addEventListener(
    "keydown",
    (event) => {

        if (
            state.stage !==
            "mazeScreen"
        ) {
            return;
        }


        const direction = {

            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],

            w: [0, -1],
            W: [0, -1],

            s: [0, 1],
            S: [0, 1],

            a: [-1, 0],
            A: [-1, 0],

            d: [1, 0],
            D: [1, 0]

        }[event.key];


        if (direction) {

            event.preventDefault();

            moveAfterMaze(
                direction[0],
                direction[1]
            );
        }
    }
);


if ($("#mazeContinue")) {

    $("#mazeContinue").onclick =
        () => {

            show(
                "#blackBoxScreen"
            );
        };
}


/* =========================================================
   BLACK BOX
   ========================================================= */

let switches = [
    0,
    0,
    0,
    0
];


let dials = [
    0,
    0,
    0
];


let selectedSymbol = null;


/*
   Switches.
*/

$$("[data-switch]").forEach(
    (button) => {

        button.onclick = () => {

            const index =
                Number(
                    button.dataset.switch
                );


            switches[index] ^= 1;


            button.classList.toggle(
                "active"
            );
        };
    }
);


/*
   Dials.
*/

$$("[data-dial]").forEach(
    (button) => {

        button.onclick = () => {

            const index =
                Number(
                    button.dataset.dial
                );


            dials[index] =
                (dials[index] + 1) % 4;


            const symbols = [
                "◉",
                "◎",
                "●",
                "○"
            ];


            button.textContent =
                symbols[dials[index]];
        };
    }
);


/*
   Symbols.
*/

$$("[data-symbol]").forEach(
    (button) => {

        button.onclick = () => {

            selectedSymbol =
                button.dataset.symbol;


            $$("[data-symbol]")
                .forEach(
                    (item) =>
                        item.classList.remove(
                            "active"
                        )
                );


            button.classList.add(
                "active"
            );
        };
    }
);


/*
   Black Box activation.

   The intended solution remains:
   switches = 1010
   dials = 230
   symbol = eye
*/

if ($("#blackButton")) {

    $("#blackButton").onclick = () => {

        if (

            switches.join("") ===
                "1010" &&

            dials.join("") ===
                "230" &&

            selectedSymbol ===
                "eye"

        ) {

            $("#blackBoxMessage")
                .textContent =
                "CONFIGURATION ACCEPTED.";


            setTimeout(
                () =>
                    show(
                        "#dontPressScreen"
                    ),
                900
            );

        } else {

            $("#blackBoxMessage")
                .textContent =
                "NOTHING HAPPENS.";
        }
    };
}


/* =========================================================
   DON'T PRESS
   ========================================================= */

let pressCount = 0;


if ($("#dontPressButton")) {

    $("#dontPressButton").onclick =
        () => {

            pressCount++;


            const lines = [

                "I TOLD YOU NOT TO PRESS IT.",

                "WHY DID YOU PRESS IT?",

                "STOP.",

                "...",

                "THERE IS NO ARCHIVE HERE."

            ];


            if ($("#dontPressText")) {

                $("#dontPressText")
                    .textContent =
                    lines[
                        Math.min(
                            pressCount - 1,
                            4
                        )
                    ];
            }


            if (
                pressCount >= 5
            ) {

                setTimeout(
                    () =>
                        show(
                            "#questionScreen"
                        ),
                    900
                );
            }
        };
}


/* =========================================================
   QUESTION
   ========================================================= */

if ($("#questionYes")) {

    $("#questionYes").onclick =
        () =>
            show(
                "#easterEggScreen"
            );
}


if ($("#questionNo")) {

    $("#questionNo").onclick =
        () => {

            if (
                $("#questionScreen p")
            ) {

                $("#questionScreen p")
                    .textContent =
                    "THAT IS NOT TRUE.";
            }
        };
}


/* =========================================================
   EASTER EGG
   ========================================================= */

if ($("#eggContinue")) {

    $("#eggContinue").onclick =
        () => {

            show(
                "#noArchiveScreen"
            );

            eyeScene();
        };
}


/* =========================================================
   THE EYE — HIDDEN SEQUENCE
   ========================================================= */

let eyeIndex = 0;


const eyeLines = [

    "YOU FOUND ME.",

    "YOU THOUGHT THE BOSS WAS THE END.",

    "IT WAS ONLY A DOOR.",

    "NOW I KNOW YOUR NAME."

];


function eyeScene() {

    eyeIndex = 0;


    $("#eyeContinue")
        ?.classList
        .add("hidden");


    nextEyeLine();
}


function nextEyeLine() {

    if (
        eyeIndex >=
        eyeLines.length
    ) {

        $("#eyeContinue")
            ?.classList
            .remove("hidden");

        return;
    }


    const text =
        eyeLines[eyeIndex++];


    if ($("#eyeText")) {

        $("#eyeText")
            .textContent =
            text;
    }


    speak(text);


    setTimeout(
        nextEyeLine,
        2200
    );
}


if ($("#eyeContinue")) {

    $("#eyeContinue").onclick =
        () =>
            show(
                "#nameScreen"
            );
}


/* =========================================================
   VOICE
   ========================================================= */

if ($("#voiceToggle")) {

    $("#voiceToggle").onclick =
        () => {

            state.voice =
                !state.voice;


            $("#voiceToggle")
                .textContent =
                state.voice
                    ? "VOICE ON"
                    : "VOICE OFF";
        };
}


function speak(text) {

    if (
        !state.voice ||
        !("speechSynthesis" in window)
    ) {
