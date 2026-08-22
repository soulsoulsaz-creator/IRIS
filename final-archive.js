"use strict";

/* ============================================================
   BLACK IRIS — FINAL ARCHIVE
   FINAL MINI-GAME ENGINE

   Sequence:
   1. Pac-Man — 5 maps
   2. The Eye Boss
   3. Do Not Press / Under Pressure
   4. Security Grid
   5. 10-Second Memory
   6. The Eye
   7. 3D Final Archive
   ============================================================ */


/* ============================================================
   MUSIC FILES
   ============================================================ */

const MUSIC = {
    pacman: "music/pacman.mp3",
    boss: "music/boss.mp3",
    pressure: "music/pressure.mp3",
    grid: "music/security-grid.mp3",
    memory: "music/memory.mp3",
    eye: "music/eye.mp3"
};

let music = new Audio();
music.loop = true;
music.volume = 0.35;

function playMusic(track) {
    music.pause();
    music.currentTime = 0;
    music.src = track;

    music.play().catch(() => {
        /*
         Browser autoplay protection.
         Music will start after the first user interaction.
        */
    });
}

function stopMusic() {
    music.pause();
    music.currentTime = 0;
}


/* ============================================================
   SOUND EFFECT ENGINE
   ============================================================ */

let audioCtx = null;

function initAudio() {

    if (!audioCtx) {

        audioCtx = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function beep(
    frequency,
    duration = 0.08,
    type = "square",
    volume = 0.08
) {

    if (!audioCtx) return;

    const oscillator =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
        0.001,
        audioCtx.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        volume,
        audioCtx.currentTime + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();

    oscillator.stop(
        audioCtx.currentTime +
        duration +
        0.02
    );
}

function clickSound() {
    beep(850, 0.05, "square", 0.07);
}

function collectSound() {
    beep(550, 0.07, "square", 0.08);

    setTimeout(
        () => beep(850, 0.08, "square", 0.08),
        60
    );
}

function errorSound() {
    beep(130, 0.22, "sawtooth", 0.12);

    setTimeout(
        () => beep(75, 0.25, "sawtooth", 0.10),
        100
    );
}

function successSound() {

    beep(500, 0.08, "sine", 0.08);

    setTimeout(
        () => beep(700, 0.08, "sine", 0.08),
        80
    );

    setTimeout(
        () => beep(1000, 0.15, "sine", 0.10),
        160
    );
}

function alarmSound() {

    beep(700, 0.10, "square", 0.10);

    setTimeout(
        () => beep(350, 0.10, "square", 0.10),
        120
    );

    setTimeout(
        () => beep(700, 0.10, "square", 0.10),
        240
    );
}

function glitchSound() {

    for (let i = 0; i < 7; i++) {

        setTimeout(
            () => {

                beep(
                    100 +
                    Math.random() * 900,

                    0.035,
                    "sawtooth",
                    0.045
                );

            },
            i * 35
        );
    }
}

function heartbeatSound() {

    beep(75, 0.07, "sine", 0.12);

    setTimeout(
        () => beep(55, 0.09, "sine", 0.09),
        110
    );
}


/* ============================================================
   SCREEN CONTROL
   ============================================================ */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(element => {

            element.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(id);

    if (target) {

        target.classList.add(
            "active"
        );
    }
}


/* ============================================================
   START
   ============================================================ */

const startButton =
    document.getElementById("startBtn");

if (startButton) {

    startButton.addEventListener(
        "click",
        () => {

            initAudio();

            clickSound();

            startPacman();

        }
    );
}


/* ============================================================
   PAC-MAN
   ============================================================ */

const pacCanvas =
    document.getElementById("pacCanvas");

let pacCtx =
    pacCanvas ?
    pacCanvas.getContext("2d") :
    null;


/*
   Every map is exactly 17 x 17.

   No uneven rows.
   No accidental disconnected pellet areas.
*/

const PAC_MAPS = [

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
"#...............#",
"#.#####.#####.#.#",
"#.....#.....#.#.#",
"#####.#.###.#.#.#",
"#.....#...#.#...#",
"#.#######.#.###.#",
"#.......#.#.....#",
"#.#####.#.#####.#",
"#.....#.#.......#",
"###.#.#.#######.#",
"#...#.#.........#",
"#.#.#.#########.#",
"#.#.............#",
"#.#############.#",
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


/* ============================================================
   PAC-MAN VARIABLES
   ============================================================ */

let pacLevel = 0;

let pacMap = [];

let pacPlayer = {
    x: 1,
    y: 1,
    dx: 0,
    dy: 0
};

let pacNext = {
    x: 0,
    y: 0
};

let pacPellets = [];

let ghosts = [];

let pacScore = 0;

let pacInterval = null;

let pacFrame = null;


/*
   Ghost delay.

   Bigger number = slower.

   The increase is intentionally small.
*/

const GHOST_SPEED = [
    260,
    245,
    230,
    215,
    200
];


/* ============================================================
   PAC-MAN START
   ============================================================ */

function startPacman() {

    showScreen("pacman");

    playMusic(
        MUSIC.pacman
    );

    pacLevel = 0;
    pacScore = 0;

    updateScore();

    loadPacMap();

    clearInterval(
        pacInterval
    );

    pacInterval =
        setInterval(
            updatePacman,
            105
        );

    cancelAnimationFrame(
        pacFrame
    );

    drawPacman();
}


/* ============================================================
   LOAD MAP
   ============================================================ */

function loadPacMap() {

    pacMap =
        PAC_MAPS[pacLevel]
        .map(row => row.split(""));

    pacPlayer = {
        x: 1,
        y: 1,
        dx: 0,
        dy: 0
    };

    pacNext = {
        x: 0,
        y: 0
    };


    pacPellets = [];


    /*
       Create pellets.
    */

    for (
        let y = 0;
        y < pacMap.length;
        y++
    ) {

        for (
            let x = 0;
            x < pacMap[y].length;
            x++
        ) {

            if (
                pacMap[y][x] === "."
            ) {

                pacPellets.push({
                    x,
                    y
                });

            }
        }
    }


    /*
       Check reachability.

       This guarantees that every pellet
       the game counts can actually be reached.
    */

    const reachable =
        new Set();

    const queue = [
        [1, 1]
    ];

    reachable.add(
        "1,1"
    );


    while (
        queue.length
    ) {

        const [
            x,
            y
        ] =
            queue.shift();


        const directions = [

            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]

        ];


        directions.forEach(
            direction => {

                const nx =
                    x + direction[0];

                const ny =
                    y + direction[1];


                if (
                    ny < 0 ||
                    ny >= pacMap.length ||
                    nx < 0 ||
                    nx >= pacMap[ny].length
                ) {
                    return;
                }


                if (
                    pacMap[ny][nx] === "#"
                ) {
                    return;
                }


                const key =
                    `${nx},${ny}`;


                if (
                    reachable.has(key)
                ) {
                    return;
                }


                reachable.add(key);

                queue.push([
                    nx,
                    ny
                ]);

            }
        );
    }


    pacPellets =
        pacPellets.filter(
            pellet =>
                reachable.has(
                    `${pellet.x},${pellet.y}`
                )
        );


    /*
       Ghost positions.

       All are known open cells.
    */

    ghosts = [

        {
            x: 8,
            y: 8,
            dx: 1,
            dy: 0,
            timer: 0
        },

        {
            x: 14,
            y: 8,
            dx: -1,
            dy: 0,
            timer: 80
        }

    ];


    const levelText =
        document.getElementById(
            "levelText"
        );

    if (levelText) {

        levelText.textContent =
            `MAP ${pacLevel + 1} / 5`;

    }


    const status =
        document.getElementById(
            "pacStatus"
        );

    if (status) {

        status.textContent =
            "RECOVER ALL IRIS FRAGMENTS.";

    }


    glitchSound();
}


/* ============================================================
   PAC-MAN WALL
   ============================================================ */

function pacWall(x, y) {

    if (
        y < 0 ||
        y >= pacMap.length ||
        x < 0 ||
        x >= pacMap[y].length
    ) {

        return true;

    }

    return pacMap[y][x] === "#";
}


/* ============================================================
   PAC-MAN INPUT
   ============================================================ */

function setPacDirection(
    dx,
    dy
) {

    pacNext = {
        x: dx,
        y: dy
    };
}


/* Keyboard */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "ArrowUp" ||
            event.key.toLowerCase() === "w"
        ) {

            setPacDirection(
                0,
                -1
            );

        }


        if (
            event.key === "ArrowDown" ||
            event.key.toLowerCase() === "s"
        ) {

            setPacDirection(
                0,
                1
            );

        }


        if (
            event.key === "ArrowLeft" ||
            event.key.toLowerCase() === "a"
        ) {

            setPacDirection(
                -1,
                0
            );

        }


        if (
            event.key === "ArrowRight" ||
            event.key.toLowerCase() === "d"
        ) {

            setPacDirection(
                1,
                0
            );

        }

    }
);


/* Mobile buttons */

document
    .querySelectorAll(
        "[data-dir]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const dir =
                        button.dataset.dir;

                    if (
                        dir === "up"
                    ) {

                        setPacDirection(
                            0,
                            -1
                        );

                    }

                    if (
                        dir === "down"
                    ) {

                        setPacDirection(
                            0,
                            1
                        );

                    }

                    if (
                        dir === "left"
                    ) {

                        setPacDirection(
                            -1,
                            0
                        );

                    }

                    if (
                        dir === "right"
                    ) {

                        setPacDirection(
                            1,
                            0
                        );

                    }

                    initAudio();

                    clickSound();

                }
            );

        }
    );


/* ============================================================
   PAC-MAN UPDATE
   ============================================================ */

function updatePacman() {

    /*
       Change direction whenever possible.
    */

    if (
        !pacWall(
            pacPlayer.x +
            pacNext.x,

            pacPlayer.y +
            pacNext.y
        )
    ) {

        pacPlayer.dx =
            pacNext.x;

        pacPlayer.dy =
            pacNext.y;

    }


    /*
       Move.
    */

    if (
        !pacWall(
            pacPlayer.x +
            pacPlayer.dx,

            pacPlayer.y +
            pacPlayer.dy
        )
    ) {

        pacPlayer.x +=
            pacPlayer.dx;

        pacPlayer.y +=
            pacPlayer.dy;

    }


    /*
       Collect.
    */

    const oldLength =
        pacPellets.length;


    pacPellets =
        pacPellets.filter(
            pellet => {

                if (
                    pellet.x ===
                    pacPlayer.x &&

                    pellet.y ===
                    pacPlayer.y
                ) {

                    pacScore += 100;

                    collectSound();

                    return false;
                }

                return true;
            }
        );


    if (
        oldLength !==
        pacPellets.length
    ) {

        updateScore();

    }


    /*
       Ghost movement.

       They are intentionally slow.

       Their movement interval increases
       only slightly with each level.
    */

    ghosts.forEach(
        (ghost, index) => {

            ghost.timer -= 105;


            if (
                ghost.timer > 0
            ) {

                return;

            }


            ghost.timer =
                GHOST_SPEED[pacLevel];


            moveGhost(
                ghost,
                index
            );


            if (
                ghost.x ===
                pacPlayer.x &&

                ghost.y ===
                pacPlayer.y
            ) {

                pacPlayer.x = 1;
                pacPlayer.y = 1;

                pacPlayer.dx = 0;
                pacPlayer.dy = 0;

                pacNext.x = 0;
                pacNext.y = 0;

                errorSound();

                const status =
                    document.getElementById(
                        "pacStatus"
                    );

                if (status) {

                    status.textContent =
                        "SECURITY CONTACT — RETURN TO START.";

                }
            }

        }
    );


    /*
       Map complete.
    */

    if (
        pacPellets.length === 0
    ) {

        advancePacMap();

    }
}


/* ============================================================
   GHOST AI
   ============================================================ */

function moveGhost(
    ghost,
    index
) {

    const options = [

        {
            x: 1,
            y: 0
        },

        {
            x: -1,
            y: 0
        },

        {
            x: 0,
            y: 1
        },

        {
            x: 0,
            y: -1
        }

    ].filter(
        direction =>
            !pacWall(
                ghost.x +
                direction.x,

                ghost.y +
                direction.y
            )
    );


    if (
        options.length === 0
    ) {
        return;
    }


    /*
       Ghost 1:

       Slowly hunts the player.
    */

    if (
        index === 0
    ) {

        options.sort(
            (a, b) => {

                const distanceA =
                    Math.abs(
                        pacPlayer.x -
                        (
                            ghost.x +
                            a.x
                        )
                    ) +

                    Math.abs(
                        pacPlayer.y -
                        (
                            ghost.y +
                            a.y
                        )
                    );


                const distanceB =
                    Math.abs(
                        pacPlayer.x -
                        (
                            ghost.x +
                            b.x
                        )
                    ) +

                    Math.abs(
                        pacPlayer.y -
                        (
                            ghost.y +
                            b.y
                        )
                    );


                return (
                    distanceA -
                    distanceB
                );

            }
        );

    }


    /*
       Ghost 2:

       Less predictable.
    */

    else {

        if (
            Math.random() <
            0.65
        ) {

            options.sort(
                (a, b) => {

                    const distanceA =
                        Math.abs(
                            pacPlayer.x -
                            (
                                ghost.x +
                                a.x
                            )
                        ) +

                        Math.abs(
                            pacPlayer.y -
                            (
                                ghost.y +
                                a.y
                            )
                        );


                    const distanceB =
                        Math.abs(
                            pacPlayer.x -
                            (
                                ghost.x +
                                b.x
                            )
                        ) +

                        Math.abs(
                            pacPlayer.y -
                            (
                                ghost.y +
                                b.y
                            )
                        );


                    return (
                        distanceA -
                        distanceB
                    );

                }
            );

        }

        else {

            options.sort(
                () =>
                    Math.random() -
                    0.5
            );

        }
    }


    const choice =
        options[0];


    ghost.dx =
        choice.x;

    ghost.dy =
        choice.y;


    ghost.x +=
        choice.x;

    ghost.y +=
        choice.y;
}


/* ============================================================
   PAC-MAN SCORE
   ============================================================ */

function updateScore() {

    const score =
        document.getElementById(
            "scoreText"
        );

    if (score) {

        score.textContent =
            String(pacScore)
            .padStart(
                6,
                "0"
            );

    }
}


/* ============================================================
   NEXT MAP
   ============================================================ */

function advancePacMap() {

    if (
        pacLevel <
        PAC_MAPS.length - 1
    ) {

        pacLevel++;

        successSound();

        setTimeout(
            () => {

                loadPacMap();

            },
            700
        );

    }

    else {

        clearInterval(
            pacInterval
        );

        pacInterval = null;

        successSound();

        setTimeout(
            startBoss,
            1200
        );
    }
}


/* ============================================================
   PAC-MAN DRAW
   ============================================================ */

function drawPacman() {

    if (
        !pacCtx ||
        !pacCanvas ||
        pacMap.length === 0
    ) {

        return;
    }


    const width =
        pacCanvas.width;

    const height =
        pacCanvas.height;

    const tile =
        Math.min(
            width / 17,
            height / 17
        );


    pacCtx.fillStyle =
        "#000";

    pacCtx.fillRect(
        0,
        0,
        width,
        height
    );


    /*
       Maze.
    */

    for (
        let y = 0;
        y < 17;
        y++
    ) {

        for (
            let x = 0;
            x < 17;
            x++
        ) {

            if (
                pacMap[y][x] === "#"
            ) {

                pacCtx.fillStyle =
                    "#090000";

                pacCtx.fillRect(
                    x * tile,
                    y * tile,
                    tile,
                    tile
                );


                pacCtx.strokeStyle =
                    "#7a0000";

                pacCtx.lineWidth = 2;

                pacCtx.strokeRect(
                    x * tile + 2,
                    y * tile + 2,
                    tile - 4,
                    tile - 4
                );

            }
        }
    }


    /*
       Pellets.
    */

    pacPellets.forEach(
        pellet => {

            pacCtx.fillStyle =
                "#fff";

            pacCtx.shadowBlur = 8;

            pacCtx.shadowColor =
                "#ff0000";

            pacCtx.beginPath();

            pacCtx.arc(
                pellet.x * tile +
                    tile / 2,

                pellet.y * tile +
                    tile / 2,

                2.5,

                0,
                Math.PI * 2
            );

            pacCtx.fill();

            pacCtx.shadowBlur = 0;

        }
    );


    /*
       Ghosts.
    */

    ghosts.forEach(
        (ghost, index) => {

            pacCtx.fillStyle =
                index === 0 ?
                "#d00000" :
                "#ff5555";


            pacCtx.beginPath();

            pacCtx.arc(
                ghost.x * tile +
                    tile / 2,

                ghost.y * tile +
                    tile / 2,

                tile * 0.31,

                Math.PI,
                0
            );


            pacCtx.lineTo(
                ghost.x * tile +
                    tile * 0.82,

                ghost.y * tile +
                    tile * 0.85
            );

            pacCtx.lineTo(
                ghost.x * tile +
                    tile * 0.60,

                ghost.y * tile +
                    tile * 0.70
            );

            pacCtx.lineTo(
                ghost.x * tile +
                    tile * 0.40,

                ghost.y * tile +
                    tile * 0.85
            );

            pacCtx.lineTo(
                ghost.x * tile +
                    tile * 0.18,

                ghost.y * tile +
                    tile * 0.70
            );

            pacCtx.closePath();

            pacCtx.fill();


            pacCtx.fillStyle =
                "#fff";

            pacCtx.beginPath();

            pacCtx.arc(
                ghost.x * tile +
                    tile * 0.40,

                ghost.y * tile +
                    tile * 0.42,

                tile * 0.08,

                0,
                Math.PI * 2
            );

            pacCtx.arc(
                ghost.x * tile +
                    tile * 0.60,

                ghost.y * tile +
                    tile * 0.42,

                tile * 0.08,

                0,
                Math.PI * 2
            );

            pacCtx.fill();

        }
    );


    /*
       Player.
    */

    pacCtx.fillStyle =
        "#ffd900";

    pacCtx.shadowBlur = 15;

    pacCtx.shadowColor =
        "#ffd900";


    const angle =
        Math.atan2(
            pacPlayer.dy,
            pacPlayer.dx
        );


    const facing =
        (
            pacPlayer.dx === 0 &&
            pacPlayer.dy === 0
        ) ?
        0 :
        angle;


    pacCtx.beginPath();

    pacCtx.moveTo(
        pacPlayer.x * tile +
            tile / 2,

        pacPlayer.y * tile +
            tile / 2
    );


    pacCtx.arc(
        pacPlayer.x * tile +
            tile / 2,

        pacPlayer.y * tile +
            tile / 2,

        tile * 0.35,

        facing + 0.35,

        facing +
            Math.PI * 2 -
            0.35
    );


    pacCtx.closePath();

    pacCtx.fill();

    pacCtx.shadowBlur = 0;


    pacFrame =
        requestAnimationFrame(
            drawPacman
        );
}


/* ============================================================
   BOSS
   ============================================================ */

let bossHP = 100;

const bossCanvas =
    document.getElementById(
        "bossCanvas"
    );

const bossCtx =
    bossCanvas ?
    bossCanvas.getContext("2d") :
    null;


function startBoss() {

    showScreen("boss");

    playMusic(
        MUSIC.boss
    );

    bossHP = 100;

    updateBossHealth();

    const status =
        document.getElementById(
            "bossStatus"
        );

    if (status) {

        status.textContent =
            "THE EYE HAS AWAKENED.";

    }

    alarmSound();

    drawBoss();
}


function updateBossHealth() {

    const bar =
        document.getElementById(
            "bossHealth"
        );

    if (bar) {

        bar.style.width =
            `${bossHP}%`;

    }
}


function drawBoss() {

    if (!bossCtx) return;


    const width =
        bossCanvas.width;

    const height =
        bossCanvas.height;


    bossCtx.clearRect(
        0,
        0,
        width,
        height
    );


    /*
       Dark red background.
    */

    const gradient =
        bossCtx.createRadialGradient(
            width / 2,
            height / 2,
            10,
            width / 2,
            height / 2,
            width / 2
        );


    gradient.addColorStop(
        0,
        "#500000"
    );

    gradient.addColorStop(
        1,
        "#000000"
    );


    bossCtx.fillStyle =
        gradient;

    bossCtx.fillRect(
        0,
        0,
        width,
        height
    );


    const cx =
        width / 2;

    const cy =
        height / 2;


    /*
       Eye.
    */

    bossCtx.fillStyle =
        "#050505";


    bossCtx.beginPath();

    bossCtx.ellipse(
        cx,
        cy,
        180,
        110,
        0,
        0,
        Math.PI * 2
    );

    bossCtx.fill();


    bossCtx.strokeStyle =
        "#ff0000";

    bossCtx.lineWidth = 7;

    bossCtx.stroke();


    /*
       Iris.
    */

    const iris =
        bossCtx.createRadialGradient(
            cx,
            cy,
            10,
            cx,
            cy,
            125
        );


    iris.addColorStop(
        0,
        "#ff6666"
    );

    iris.addColorStop(
        0.45,
        "#d00000"
    );

    iris.addColorStop(
        0.75,
        "#600000"
    );

    iris.addColorStop(
        1,
        "#120000"
    );


    bossCtx.fillStyle =
        iris;


    bossCtx.beginPath();

    bossCtx.arc(
        cx,
        cy,
        125,
        0,
        Math.PI * 2
    );

    bossCtx.fill();


    /*
       Pupil.
    */

    bossCtx.fillStyle =
        "#000";


    bossCtx.beginPath();

    bossCtx.ellipse(
        cx,
        cy,
        28,
        100,
        0,
        0,
        Math.PI * 2
    );

    bossCtx.fill();


    /*
       Iris rays.
    */

    bossCtx.strokeStyle =
        "rgba(255,0,0,.45)";

    bossCtx.lineWidth = 2;


    for (
        let i = 0;
        i < 20;
        i++
    ) {

        const angle =
            i *
            Math.PI *
            2 /
            20;


        bossCtx.beginPath();

        bossCtx.moveTo(
            cx +
            Math.cos(angle) *
            35,

            cy +
            Math.sin(angle) *
            35
        );


        bossCtx.lineTo(
            cx +
            Math.cos(angle) *
            115,

            cy +
            Math.sin(angle) *
            115
        );

        bossCtx.stroke();
    }
}


/* Boss attack */

const attackButton =
    document.getElementById(
        "attackBtn"
    );

if (attackButton) {

    attackButton.addEventListener(
        "click",
        () => {

            initAudio();

            if (
                bossHP <= 0
            ) {
                return;
            }


            bossHP -= 10;

            if (
                bossHP < 0
            ) {

                bossHP = 0;

            }


            updateBossHealth();

            drawBoss();

            clickSound();


            if (
                bossHP === 0
            ) {

                successSound();

                const status =
                    document.getElementById(
                        "bossStatus"
                    );

                if (status) {

                    status.textContent =
                        "THE EYE HAS BEEN SILENCED.";

                }


                setTimeout(
                    startPressure,
                    1600
                );

            }

        }
    );
}


/* ============================================================
   DO NOT PRESS — UNDER PRESSURE
   ============================================================ */

let pressureTimer = null;

let pressureSeconds = 60;

let pressureRound = 0;

let pressureRule = null;

let pressurePressCount = 0;


const PRESSURE_RULES = [

    {
        text:
            "DO NOT PRESS THE BUTTON.",
        answer:
            "press"
    },

    {
        text:
            "PRESS THE BUTTON ONCE.",
        answer:
            "doNothing"
    },

    {
        text:
            "DO NOT PRESS IT.",
        answer:
            "press"
    },

    {
        text:
            "PRESS IT ONLY IF YOU DARE.",
        answer:
            "doNothing"
    },

    {
        text:
            "IGNORE THIS MESSAGE.",
        answer:
            "press"
    },

    {
        text:
            "DO NOT LISTEN TO THE INSTRUCTIONS.",
        answer:
            "doNothing"
    },

    {
        text:
            "PRESS THE BUTTON.",
        answer:
            "doNothing"
    },

    {
        text:
            "WHATEVER YOU DO, DO NOT PRESS IT.",
        answer:
            "press"
    }

];


function startPressure() {

    showScreen("pressure");

    playMusic(
        MUSIC.pressure
    );

    pressureSeconds = 60;
    pressureRound = 0;
    pressurePressCount = 0;

    clearInterval(
        pressureTimer
    );


    nextPressureRule();


    pressureTimer =
        setInterval(
            () => {

                pressureSeconds--;


                const timer =
                    document.getElementById(
                        "pressureTimer"
                    );

                if (timer) {

                    timer.textContent =
                        pressureSeconds;

                }


                if (
                    pressureSeconds <= 10 &&
                    pressureSeconds > 0
                ) {

                    heartbeatSound();

                }


                if (
                    pressureSeconds <= 0
                ) {

                    clearInterval(
                        pressureTimer
                    );

                    successSound();


                    const rule =
                        document.getElementById(
                            "pressureRule"
                        );

                    if (rule) {

                        rule.textContent =
                            "PRESSURE TEST COMPLETE.";

                    }


                    setTimeout(
                        startSecurityGrid,
                        1500
                    );

                }

            },
            1000
        );
}


function nextPressureRule() {

    pressureRule =
        PRESSURE_RULES[
            pressureRound %
            PRESSURE_RULES.length
        ];


    pressureRound++;


    const rule =
        document.getElementById(
            "pressureRule"
        );

    if (rule) {

        rule.textContent =
            pressureRule.text;

    }


    glitchSound();
}


/*
   The trick:

   The instructions deliberately conflict
   with what the system expects.

   She has to figure out the rule rather
   than blindly obeying the text.
*/

const pressureButton =
    document.getElementById(
        "pressureButton"
    );


if (pressureButton) {

    pressureButton.addEventListener(
        "click",
        () => {

            initAudio();

            pressurePressCount++;


            /*
               If the current rule expects a
               press, advance.

               If it says NOT to press,
               the system treats the press
               as the required contradiction.
            */

            if (
                pressureRule.answer ===
                "press"
            ) {

                clickSound();

                setTimeout(
                    nextPressureRule,
                    350
                );

            }

            else {

                /*
                   Wrong action.
                */

                errorSound();

                const rule =
                    document.getElementById(
                        "pressureRule"
                    );

                if (rule) {

                    rule.textContent =
                        "WRONG. THINK BEFORE YOU OBEY.";

                }


                clearInterval(
                    pressureTimer
                );


                setTimeout(
                    startPressure,
                    1300
                );
            }

        }
    );
}


/* ============================================================
   SECURITY GRID
   ============================================================ */

let gridPath = [];

let gridPosition = 0;


function startSecurityGrid() {

    showScreen("grid");

    playMusic(
        MUSIC.grid
    );


    const board =
        document.getElementById(
            "gridBoard"
        );


    if (!board) return;


    board.innerHTML = "";

    gridPosition = 0;


    /*
       8 x 8 grid.

       The player must follow the path.
    */

    gridPath = [

        0,
        1,
        2,
        10,
        18,
        26,
        27,
        35,
        43,
        51,
        59,
        60,
        61,
        62,
        63

    ];


    const status =
        document.getElementById(
            "gridStatus"
        );

    if (status) {

        status.textContent =
            "BYPASS THE SECURITY GRID.";

    }


    for (
        let i = 0;
        i < 64;
        i++
    ) {

        const cell =
            document.createElement(
                "button"
            );


        cell.className =
            "gridCell";


        cell.dataset.index =
            i;


        cell.addEventListener(
            "click",
            () => {

                initAudio();


                if (
                    i ===
                    gridPath[
                        gridPosition
                    ]
                ) {

                    cell.classList.add(
                        "safe"
                    );


                    gridPosition++;

                    clickSound();


                    if (
                        gridPosition ===
                        gridPath.length
                    ) {

                        successSound();


                        if (status) {

                            status.textContent =
                                "SECURITY BYPASSED.";

                        }


                        setTimeout(
                            startMemoryGame,
                            1500
                        );

                    }

                }

                else {

                    cell.classList.add(
                        "wrong"
                    );

                    alarmSound();


                    if (status) {

                        status.textContent =
                            "SECURITY BREACH.";

                    }


                    setTimeout(
                        startSecurityGrid,
                        900
                    );

                }

            }
        );


        board.appendChild(
            cell
        );
    }
}


/* ============================================================
   10 SECOND MEMORY GAME
   ============================================================ */

const MEMORY_OBJECTS = [

    {
        name: "eye",
        icon: "👁",
        x: 12,
        y: 20
    },

    {
        name: "key",
        icon: "🔑",
        x: 75,
        y: 20
    },

    {
        name: "clock",
        icon: "🕐",
        x: 43,
        y: 60
    },

    {
        name: "camera",
        icon: "📷",
        x: 75,
        y: 68
    },

    {
        name: "file",
        icon: "📁",
        x: 15,
        y: 67
    },

    {
        name: "red",
        icon: "🔴",
        x: 50,
        y: 15
    }

];


let memoryTimer = null;


function startMemoryGame() {

    showScreen("memory");

    playMusic(
        MUSIC.memory
    );


    const room =
        document.getElementById(
            "memoryRoom"
        );


    if (!room) return;


    room.innerHTML = "";


    const answers =
        document.getElementById(
            "memoryAnswers"
        );


    if (answers) {

        answers.classList.add(
            "hidden"
        );

    }


    const status =
        document.getElementById(
            "memoryStatus"
        );


    let seconds = 10;


    if (status) {

        status.textContent =
            "MEMORIZE EVERYTHING. 10 SECONDS.";

    }


    MEMORY_OBJECTS.forEach(
        object => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "memoryObject";


            element.textContent =
                object.icon;


            element.dataset.name =
                object.name;


            element.style.left =
                `${object.x}%`;


            element.style.top =
                `${object.y}%`;


            room.appendChild(
                element
            );

        }
    );


    clearInterval(
        memoryTimer
    );


    memoryTimer =
        setInterval(
            () => {

                seconds--;


                if (status) {

                    status.textContent =
                        `MEMORIZE EVERYTHING. ${seconds}`;

                }


                clickSound();


                if (
                    seconds <= 0
                ) {

                    clearInterval(
                        memoryTimer
                    );


                    room.innerHTML = "";


                    if (status) {

                        status.textContent =
                            "TIME IS UP.";

                    }


                    if (answers) {

                        answers.classList.remove(
                            "hidden"
                        );

                    }

                }

            },
            1000
        );
}


/* ============================================================
   MEMORY ANSWERS
   ============================================================ */

document
    .querySelectorAll(
        "[data-answer]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    initAudio();


                    if (
                        button.dataset.answer ===
                        "clock"
                    ) {

                        successSound();


                        const status =
                            document.getElementById(
                                "memoryStatus"
                            );


                        if (status) {

                            status.textContent =
                                "MEMORY VERIFIED.";

                        }


                        setTimeout(
                            startEyeGame,
                            1400
                        );

                    }

                    else {

                        errorSound();


                        const status =
                            document.getElementById(
                                "memoryStatus"
                            );


                        if (status) {

                            status.textContent =
                                "INCORRECT. TRY AGAIN.";

                        }


                        setTimeout(
                            startMemoryGame,
                            1100
                        );

                    }

                }
            );

        }
    );


/* ============================================================
   THE EYE
   ============================================================ */

let realEye = null;


function startEyeGame() {

    showScreen("eye");

    playMusic(
        MUSIC.eye
    );


    const field =
        document.getElementById(
            "eyeField"
        );


    if (!field) return;


    field.innerHTML = "";


    const status =
        document.getElementById(
            "eyeStatus"
        );


    if (status) {

        status.textContent =
            "ONE OF THEM IS WATCHING.";

    }


    const correctIndex =
        Math.floor(
            Math.random() * 24
        );


    for (
        let i = 0;
        i < 24;
        i++
    ) {

        const eye =
            document.createElement(
                "button"
            );


        eye.className =
            "eye";


        eye.textContent =
            "👁";


        eye.style.left =
            `${Math.random() * 90}%`;


        eye.style.top =
            `${Math.random() * 82}%`;


        if (
            i === correctIndex
        ) {

            realEye = eye;

            eye.addEventListener(
                "click",
                correctEye
            );

        }

        else {

            eye.addEventListener(
                "click",
                wrongEye
            );

        }


        field.appendChild(
            eye
        );

    }


    glitchSound();
}


function wrongEye() {

    errorSound();


    const status =
        document.getElementById(
            "eyeStatus"
        );


    if (status) {

        status.textContent =
            "NO. IT IS STILL WATCHING.";

    }


    document
        .querySelectorAll(
            ".eye"
        )
        .forEach(
            eye => {

                eye.style.transform =
                    `translate(
                        ${Math.random() * 30 - 15}px,
                        ${Math.random() * 30 - 15}px
                    )`;

            }
        );
}


function correctEye() {

    successSound();


    const status =
        document.getElementById(
            "eyeStatus"
        );


    if (status) {

        status.textContent =
            "YOU FOUND ME.";

    }


    document
        .querySelectorAll(
            ".eye"
        )
        .forEach(
            eye => {

                if (
                    eye !== realEye
                ) {

                    eye.style.opacity =
                        "0";

                }

            }
        );


    if (realEye) {

        realEye.style.transform =
            "scale(2.5)";

        realEye.style.color =
            "#ff0000";

        realEye.style.zIndex =
            "999";

    }


    setTimeout(
        () => {

            stopMusic();

            open3DArchive();

        },
        2200
    );
}


/* ============================================================
   FINAL 3D ARCHIVE
   ============================================================ */

function open3DArchive() {

    /*
       Your separate 3D game stays in its own file.
    */

    window.location.href =
        "final-archive-3d.html";
}


/* ============================================================
   SAFETY:
   START AUDIO AFTER ANY USER TOUCH
   ============================================================ */

document.addEventListener(
    "pointerdown",
    () => {

        initAudio();

    },
    {
        once: true
    }
);


/* ============================================================
   BLACK IRIS CONSOLE MESSAGE
   ============================================================ */

console.log(
`
╔══════════════════════════════════════╗
║          BLACK IRIS ARCHIVE          ║
║              ONLINE                  ║
╠══════════════════════════════════════╣
║ PAC-MAN MAPS ................. 05    ║
║ RED EYE BOSS .................. OK    ║
║ PRESSURE TEST ................. OK    ║
║ SECURITY GRID ................. OK    ║
║ MEMORY TEST ................... OK    ║
║ THE EYE ....................... OK    ║
║ 3D ARCHIVE .................... READY ║
╚══════════════════════════════════════╝
`
);
