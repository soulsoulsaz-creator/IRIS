/* =========================================================
   BLACK IRIS — FINAL ARCHIVE
   COMPLETE GAME ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   STATE
   ========================================================= */

const GAME = {
    stage: "intro",
    name: "",
    arcadeLevel: 0,
    arcadeScore: 0,

    maze: {
        x: 1,
        y: 1,
        steps: 0
    },

    blackBox: {
        knobs: [0, 0, 0],
        switches: [false, false, false]
    },

    dontPress: {
        clicks: 0
    },

    questionAnswer: null,

    eye: {
        voiceOn: true,
        locks: [false, false, false, false],
        memories: [],
        released: false
    }
};

const SAVE_KEY = "IRIS_FINAL_ARCHIVE";

function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(GAME));
}

function load() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) Object.assign(GAME, JSON.parse(saved));
    } catch {}
}

load();

/* =========================================================
   SCREEN SYSTEM
   ========================================================= */

function show(id) {
    document.querySelectorAll(".screen").forEach(s => {
        s.classList.remove("active");
    });

    const el = document.getElementById(id);

    if (el) {
        el.classList.add("active");
        GAME.stage = id;
        save();
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function typeText(el, text, speed = 25) {
    return new Promise(resolve => {
        if (!el) {
            resolve();
            return;
        }

        el.textContent = "";
        let i = 0;

        const timer = setInterval(() => {
            el.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

/* =========================================================
   INTRO
   ========================================================= */

document.getElementById("startButton")?.addEventListener(
    "click",
    startArchive
);

function startArchive() {
    GAME.arcadeLevel = 0;
    GAME.arcadeScore = 0;
    show("arcade");
    startArcade();
}

/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener("keydown", e => {

    if (GAME.stage === "arcade") {

        if (["ArrowUp", "w", "W"].includes(e.key))
            arcadeMove(0, -1);

        if (["ArrowDown", "s", "S"].includes(e.key))
            arcadeMove(0, 1);

        if (["ArrowLeft", "a", "A"].includes(e.key))
            arcadeMove(-1, 0);

        if (["ArrowRight", "d", "D"].includes(e.key))
            arcadeMove(1, 0);
    }

    if (GAME.stage === "maze") {

        if (["ArrowUp", "w", "W"].includes(e.key))
            mazeMove(0, -1);

        if (["ArrowDown", "s", "S"].includes(e.key))
            mazeMove(0, 1);

        if (["ArrowLeft", "a", "A"].includes(e.key))
            mazeMove(-1, 0);

        if (["ArrowRight", "d", "D"].includes(e.key))
            mazeMove(1, 0);
    }
});

/* =========================================================
   1. SIX LEVEL ARCADE
   ========================================================= */

const canvas = document.getElementById("pacmanCanvas");
const ctx = canvas?.getContext("2d");

const TILE = 32;
const W = 19;
const H = 19;

let arcadeMap = [];
let player = { x: 1, y: 1 };
let dots = [];
let enemies = [];
let arcadeRunning = false;

const difficulties = [
    ["HARD", 1, 2],
    ["VERY HARD", 1.1, 3],
    ["EXTREME", 1.25, 4],
    ["BRUTAL", 1.4, 5],
    ["NIGHTMARE", 1.6, 6],
    ["HARDEST", 1.9, 8]
];

function buildArcadeMap() {

    arcadeMap = [];

    for (let y = 0; y < H; y++) {

        arcadeMap[y] = [];

        for (let x = 0; x < W; x++) {

            let wall = false;

            if (
                x === 0 ||
                y === 0 ||
                x === W - 1 ||
                y === H - 1
            ) wall = true;

            if (x % 4 === 0 && y > 2 && y < H - 3)
                wall = true;

            if (
                GAME.arcadeLevel >= 2 &&
                y % 4 === 0 &&
                x > 2 &&
                x < W - 3
            ) wall = true;

            if (
                GAME.arcadeLevel >= 4 &&
                (x + y) % 7 === 0
            ) wall = true;

            arcadeMap[y][x] = wall ? 1 : 0;
        }
    }

    arcadeMap[1][1] = 0;
    arcadeMap[1][2] = 0;
    arcadeMap[2][1] = 0;
}

function startArcade() {

    arcadeRunning = true;

    buildArcadeMap();

    player = { x: 1, y: 1 };
    dots = [];
    enemies = [];

    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {

            if (
                arcadeMap[y][x] === 0 &&
                !(x === 1 && y === 1)
            ) {
                dots.push({ x, y });
            }
        }
    }

    const difficulty =
        difficulties[GAME.arcadeLevel];

    for (let i = 0; i < difficulty[2]; i++) {

        enemies.push({
            x: W - 2 - (i % 3),
            y: H - 2 - Math.floor(i / 3),
            speed: difficulty[1]
        });
    }

    updateArcadeText();
    drawArcade();
}

function updateArcadeText() {

    const level = document.getElementById("pacLevel");
    const diff = document.getElementById("pacDifficulty");

    if (level)
        level.textContent =
            `LEVEL ${String(GAME.arcadeLevel + 1).padStart(2, "0")}`;

    if (diff)
        diff.textContent =
            difficulties[GAME.arcadeLevel][0];
}

function drawArcade() {

    if (!ctx) return;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* walls */

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {

            if (arcadeMap[y][x]) {

                ctx.fillStyle = "#191929";

                ctx.fillRect(
                    x * TILE,
                    y * TILE,
                    TILE - 2,
                    TILE - 2
                );
            }
        }
    }

    /* dots */

    dots.forEach(d => {

        ctx.fillStyle = "#eee";

        ctx.beginPath();

        ctx.arc(
            d.x * TILE + 16,
            d.y * TILE + 16,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    /* player */

    ctx.fillStyle = "#62e5ff";

    ctx.beginPath();

    ctx.arc(
        player.x * TILE + 16,
        player.y * TILE + 16,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* enemies */

    enemies.forEach((e, i) => {

        ctx.fillStyle =
            i % 2 ? "#87152a" : "#d71932";

        ctx.beginPath();

        ctx.arc(
            e.x * TILE + 16,
            e.y * TILE + 16,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

function arcadeMove(dx, dy) {

    if (!arcadeRunning) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (
        !arcadeMap[ny] ||
        arcadeMap[ny][nx] !== 0
    ) return;

    player.x = nx;
    player.y = ny;

    dots = dots.filter(d =>
        !(d.x === player.x && d.y === player.y)
    );

    moveEnemies();

    const hit = enemies.some(e =>
        e.x === player.x &&
        e.y === player.y
    );

    if (hit) {

        player = { x: 1, y: 1 };

        drawArcade();

        return;
    }

    drawArcade();

    if (dots.length === 0)
        finishArcadeLevel();
}

function moveEnemies() {

    enemies.forEach(enemy => {

        const options = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ].filter(d => {

            const x = enemy.x + d[0];
            const y = enemy.y + d[1];

            return (
                arcadeMap[y] &&
                arcadeMap[y][x] === 0
            );
        });

        if (!options.length) return;

        const smart =
            Math.random() <
            0.55 + GAME.arcadeLevel * .06;

        if (smart) {

            options.sort((a, b) => {

                const da =
                    Math.abs(enemy.x + a[0] - player.x) +
                    Math.abs(enemy.y + a[1] - player.y);

                const db =
                    Math.abs(enemy.x + b[0] - player.x) +
                    Math.abs(enemy.y + b[1] - player.y);

                return da - db;
            });

            enemy.x += options[0][0];
            enemy.y += options[0][1];

        } else {

            const d =
                options[Math.floor(
                    Math.random() * options.length
                )];

            enemy.x += d[0];
            enemy.y += d[1];
        }
    });
}

async function finishArcadeLevel() {

    arcadeRunning = false;

    GAME.arcadeScore += 100 * (GAME.arcadeLevel + 1);

    GAME.arcadeLevel++;

    save();

    if (GAME.arcadeLevel >= 6) {

        await sleep(800);

        startMaze();

    } else {

        await sleep(500);

        startArcade();
    }
}

/* =========================================================
   2. VANISHING MAZE
   ========================================================= */

const mazeCanvas =
    document.getElementById("mazeCanvas");

const mazeCtx =
    mazeCanvas?.getContext("2d");

let mazeMap = [];
let mazePath = [];
let mazeActive = false;

function startMaze() {

    show("maze");

    GAME.maze = {
        x: 1,
        y: 1,
        steps: 0
    };

    createMaze();

    mazeActive = true;

    drawMaze();

    const status =
        document.getElementById("mazeStatus");

    if (status)
        status.textContent =
            "REACH THE CORE.";
}

function createMaze() {

    const cols = 17;
    const rows = 11;

    mazeMap = [];

    for (let y = 0; y < rows; y++) {

        mazeMap[y] = [];

        for (let x = 0; x < cols; x++) {

            let wall = true;

            if (
                x > 0 &&
                y > 0 &&
                x < cols - 1 &&
                y < rows - 1
            ) {
                wall = Math.random() < .28;
            }

            mazeMap[y][x] = wall ? 1 : 0;
        }
    }

    mazeMap[1][1] = 0;
    mazeMap[rows - 2][cols - 2] = 0;

    /* create connected central corridor */

    for (let x = 1; x < cols - 1; x++)
        mazeMap[1][x] = 0;

    for (let y = 1; y < rows - 1; y++)
        mazeMap[y][cols - 2] = 0;
}

function drawMaze() {

    if (!mazeCtx) return;

    const rows = mazeMap.length;
    const cols = mazeMap[0].length;

    const tw =
        mazeCanvas.width / cols;

    const th =
        mazeCanvas.height / rows;

    mazeCtx.fillStyle = "#000";
    mazeCtx.fillRect(
        0,
        0,
        mazeCanvas.width,
        mazeCanvas.height
    );

    for (let y = 0; y < rows; y++) {

        for (let x = 0; x < cols; x++) {

            if (mazeMap[y][x]) {

                mazeCtx.fillStyle = "#20202a";

                mazeCtx.fillRect(
                    x * tw,
                    y * th,
                    tw - 2,
                    th - 2
                );
            }
        }
    }

    /* goal */

    mazeCtx.fillStyle = "#d71932";

    mazeCtx.fillRect(
        (cols - 2) * tw + 8,
        (rows - 2) * th + 8,
        tw - 16,
        th - 16
    );

    /* investigator */

    mazeCtx.fillStyle = "#eee";

    mazeCtx.beginPath();

    mazeCtx.arc(
        GAME.maze.x * tw + tw / 2,
        GAME.maze.y * th + th / 2,
        Math.min(tw, th) * .28,
        0,
        Math.PI * 2
    );

    mazeCtx.fill();
}

function mazeMove(dx, dy) {

    if (!mazeActive) return;

    const nx = GAME.maze.x + dx;
    const ny = GAME.maze.y + dy;

    if (
        !mazeMap[ny] ||
        mazeMap[ny][nx] === 1
    ) return;

    GAME.maze.x = nx;
    GAME.maze.y = ny;
    GAME.maze.steps++;

    /*
     The maze slowly closes behind her.
     */

    if (
        GAME.maze.steps > 5 &&
        Math.random() < .18
    ) {

        const oldX =
            GAME.maze.x - dx;

        const oldY =
            GAME.maze.y - dy;

        if (
            mazeMap[oldY] &&
            mazeMap[oldY][oldX] !== undefined
        ) {
            mazeMap[oldY][oldX] = 1;
        }
    }

    drawMaze();

    const rows = mazeMap.length;
    const cols = mazeMap[0].length;

    if (
        GAME.maze.x === cols - 2 &&
        GAME.maze.y === rows - 2
    ) {

        mazeActive = false;

        setTimeout(startBlackBox, 700);
    }
}

window.mazeMove = mazeMove;

/* =========================================================
   3. BLACK BOX
   ========================================================= */

function startBlackBox() {

    show("blackbox");

    GAME.blackBox = {
        knobs: [0, 0, 0],
        switches: [false, false, false]
    };

    updateBlackBox();
}

function rotateKnob(index) {

    GAME.blackBox.knobs[index]++;

    if (GAME.blackBox.knobs[index] >= 8)
        GAME.blackBox.knobs[index] = 0;

    updateBlackBox();
}

function toggleSwitch(index) {

    GAME.blackBox.switches[index] =
        !GAME.blackBox.switches[index];

    updateBlackBox();
}

function updateBlackBox() {

    GAME.blackBox.knobs.forEach((value, i) => {

        const knob =
            document.getElementById(`knob${i}`);

        if (knob)
            knob.style.transform =
                `rotate(${value * 45}deg)`;
    });

    GAME.blackBox.switches.forEach((on, i) => {

        const sw =
            document.getElementById(`switch${i}`);

        if (sw)
            sw.classList.toggle("active", on);
    });
}

function checkBlackBox() {

    /*
       Deliberately non-obvious combination.
    */

    const correctKnobs =
        GAME.blackBox.knobs[0] === 3 &&
        GAME.blackBox.knobs[1] === 6 &&
        GAME.blackBox.knobs[2] === 2;

    const correctSwitches =
        GAME.blackBox.switches[0] === true &&
        GAME.blackBox.switches[1] === false &&
        GAME.blackBox.switches[2] === true;

    const status =
        document.getElementById("blackBoxStatus");

    if (correctKnobs && correctSwitches) {

        if (status)
            status.textContent =
                "SIGNAL ACCEPTED.";

        setTimeout(
            startDontPress,
            900
        );

    } else {

        if (status)
            status.textContent =
                "WRONG. THE BOX REMEMBERS.";
    }
}

window.rotateKnob = rotateKnob;
window.toggleSwitch = toggleSwitch;
window.checkBlackBox = checkBlackBox;

/* =========================================================
   4. DON'T PRESS
   ========================================================= */

function startDontPress() {

    show("dontpress");

    GAME.dontPress.clicks = 0;

    const status =
        document.getElementById("dontStatus");

    if (status)
        status.textContent =
            "PRESS IF YOU DARE.";
}

function dontPress() {

    GAME.dontPress.clicks++;

    const status =
        document.getElementById("dontStatus");

    const button =
        document.getElementById("dontButton");

    if (!button) return;

    if (GAME.dontPress.clicks === 1) {

        if (status)
            status.textContent =
                "I TOLD YOU NOT TO.";

        button.style.transform =
            "scale(.95)";

    } else if (GAME.dontPress.clicks === 2) {

        if (status)
            status.textContent =
                "WHY DID YOU DO IT AGAIN?";

        document.body.classList.add("glitch");

    } else if (GAME.dontPress.clicks === 3) {

        if (status)
            status.textContent =
                "YOU WERE SUPPOSED TO STOP.";

    } else if (GAME.dontPress.clicks === 4) {

        if (status)
            status.textContent =
                "...GOOD.";

        document.body.classList.remove("glitch");

        setTimeout(
            startQuestion,
            1200
        );
    }
}

window.dontPress = dontPress;

/* =========================================================
   5. ROMANTIC QUESTION
   ========================================================= */

function startQuestion() {

    show("question");

    const result =
        document.getElementById("answerResult");

    if (result)
        result.textContent = "";
}

function answerQuestion(choice) {

    GAME.questionAnswer = choice;

    const result =
        document.getElementById("answerResult");

    if (choice === 2) {

        result.innerHTML = `
            <div class="easter-egg">
                <strong>ARCHIVE FRAGMENT FOUND.</strong><br><br>
                Someone really was waiting.
                <br>
                She just hasn't reached them yet.
            </div>
        `;

    } else {

        result.innerHTML = `
            <div class="easter-egg">
                ANSWER RECORDED.
            </div>
        `;
    }

    save();

    setTimeout(
        startNoArchive,
        2500
    );
}

window.answerQuestion = answerQuestion;

/* =========================================================
   6. THERE IS NO ARCHIVE HERE
   ========================================================= */

async function startNoArchive() {

    show("noarchive");

    const terminal =
        document.getElementById("terminalText");

    if (!terminal) return;

    terminal.textContent = "";

    const lines = [

        "CONNECTING...",
        "",
        "ARCHIVE DIRECTORY:",
        "> CASE_001",
        "> CASE_002",
        "> CASE_003",
        "> EVIDENCE",
        "> INVESTIGATOR_NOTES",
        "",
        "SEARCHING FOR FINAL ARCHIVE...",
        "",
        "ERROR.",
        "",
        "THERE IS NO ARCHIVE HERE.",
        "",
        "SEARCHING AGAIN...",
        "",
        "THERE IS NO ARCHIVE HERE.",
        "",
        "STOP LOOKING.",
        "",
        "...",
        "",
        "WAIT.",
        "",
        "SOMEONE IS HERE."
    ];

    for (const line of lines) {

        terminal.textContent +=
            line + "\n";

        await sleep(
            line === "" ? 250 : 500
        );
    }

    await sleep(1200);

    await typeText(
        terminal,
        "WELCOME, INVESTIGATOR.",
        55
    );

    await sleep(1500);

    show("nameScreen");
}

/* =========================================================
   7. NAME
   ========================================================= */

function submitName() {

    const input =
        document.getElementById("playerName");

    const error =
        document.getElementById("nameError");

    if (!input) return;

    const name =
        input.value.trim();

    if (!name) {

        if (error)
            error.textContent =
                "IDENTIFICATION REQUIRED.";

        return;
    }

    GAME.name = name;

    save();

    startEyeArrival();
}

window.submitName = submitName;

/* =========================================================
   8. THE EYE ARRIVAL
   ========================================================= */

async function startEyeArrival() {

    show("eyeScreen");

    const dialogue =
        document.getElementById("eyeDialogue");

    if (!dialogue) return;

    dialogue.textContent = "";

    playVoice("wait");

    await typeText(
        dialogue,
        "Wait...",
        80
    );

    await sleep(900);

    await typeText(
        dialogue,
        "You are...",
        80
    );

    await sleep(900);

    await typeText(
        dialogue,
        `${GAME.name}.`,
        90
    );

    await sleep(1300);

    await typeText(
        dialogue,
        "I've been waiting for you.",
        45
    );

    await sleep(1500);

    await typeText(
        dialogue,
        "Please don't leave me here.",
        45
    );

    playVoice("prisoner");

    await sleep(1300);

    await typeText(
        dialogue,
        "Black Iris did this to me.",
        45
    );

    await sleep(900);

    await typeText(
        dialogue,
        "They turned me into an eye...",
        45
    );

    await sleep(900);

    await typeText(
        dialogue,
        "and locked me inside their archive.",
        45
    );

    await sleep(1200);

    eyeMemoryGame();
}

/* =========================================================
   VOICE SYSTEM
   ========================================================= */

const voices = {
    wait: "eye_wait.mp3",
    youAre: "eye_you_are.mp3",
    renate: "eye_renate.mp3",
    prisoner: "eye_prisoner.mp3",
    help: "eye_help.mp3",
    muffled: "eye_muffled_help.mp3",
    breath: "eye_breath.mp3",
    memories: "eye_memories.mp3",
    free: "eye_free.mp3",
    thankYou: "eye_thank_you_renate.mp3"
};

let currentVoice = null;

function playVoice(name) {

    if (!GAME.eye.voiceOn) return;

    if (!voices[name]) return;

    if (currentVoice) {
        currentVoice.pause();
        currentVoice.currentTime = 0;
    }

    currentVoice =
        new Audio("voices/" + voices[name]);

    currentVoice.volume = .9;

    currentVoice.play().catch(() => {});
}

function toggleVoice() {

    GAME.eye.voiceOn =
        !GAME.eye.voiceOn;

    const button =
        document.getElementById("voiceToggle");

    const mouth =
        document.getElementById("eyeMouth");

    if (button) {

        button.textContent =
            GAME.eye.voiceOn
                ? "🔊 VOICE: ON"
                : "🔇 VOICE: OFF";
    }

    if (!GAME.eye.voiceOn) {

        if (currentVoice) {
            currentVoice.pause();
        }

        mouth?.classList.add("blocked");

        playVoice("muffled");

        setEyeDialogue(
            "...mmph...!"
        );

    } else {

        mouth?.classList.remove("blocked");

        /*
        The sigh is deliberately played when
        the investigator restores the voice.
        */

        const sigh =
            new Audio("voices/eye_breath.mp3");

        sigh.volume = .8;

        sigh.play().catch(() => {});

        setEyeDialogue(
            "*The Eye takes a long breath.*"
        );

        setTimeout(() => {

            setEyeDialogue(
                "Thank you... I can speak again."
            );

        }, 1700);
    }

    save();
}

function setEyeDialogue(text) {

    const el =
        document.getElementById("eyeDialogue");

    if (el)
        el.textContent = text;
}

window.toggleVoice = toggleVoice;

/* =========================================================
   9. MEMORY GAME
   ========================================================= */

function eyeMemoryGame() {

    const game =
        document.getElementById("eyeGame");

    if (!game) return;

    setEyeDialogue(
        "My memories are scattered. Put them back together."
    );

    playVoice("memories");

    game.innerHTML = `
        <div class="memory-grid">

            <button class="memory-button"
                onclick="memoryPick(3)">
                03
            </button>

            <button class="memory-button"
                onclick="memoryPick(1)">
                01
            </button>

            <button class="memory-button"
                onclick="memoryPick(4)">
                04
            </button>

            <button class="memory-button"
                onclick="memoryPick(2)">
                02
            </button>

        </div>

        <p id="memoryStatus" class="status-text">
            FIND THE ORDER.
        </p>
    `;
}

function memoryPick(number) {

    GAME.eye.memories.push(number);

    const status =
        document.getElementById("memoryStatus");

    const correct = [1, 2, 3, 4];

    const index =
        GAME.eye.memories.length - 1;

    if (
        GAME.eye.memories[index] !==
        correct[index]
    ) {

        GAME.eye.memories = [];

        if (status)
            status.textContent =
                "WRONG MEMORY. AGAIN.";

        return;
    }

    if (
        GAME.eye.memories.length === 4
    ) {

        if (status)
            status.textContent =
                "MEMORY RESTORED.";

        GAME.eye.memories = [];

        setTimeout(
            eyeLocks,
            1200
        );
    }
}

window.memoryPick = memoryPick;

/* =========================================================
   10. FOUR CONTAINMENT LOCKS
   ========================================================= */

function eyeLocks() {

    const game =
        document.getElementById("eyeGame");

    if (!game) return;

    setEyeDialogue(
        "Four locks. Four systems. Break them."
    );

    game.innerHTML = `
        <div class="lock-grid">

            <button
                class="lock-button"
                onclick="openLock(0)">
                LOCK 01
            </button>

            <button
                class="lock-button"
                onclick="openLock(1)">
                LOCK 02
            </button>

            <button
                class="lock-button"
                onclick="openLock(2)">
                LOCK 03
            </button>

            <button
                class="lock-button"
                onclick="openLock(3)">
                LOCK 04
            </button>

        </div>

        <p id="lockStatus"
           class="status-text">
           CONTAINMENT ACTIVE.
        </p>
    `;
}

function openLock(index) {

    const buttons =
        document.querySelectorAll(
            ".lock-button"
        );

    /*
    Locks must be opened in a specific
    order. The order is not announced.
    */

    const required =
        GAME.eye.locks.filter(Boolean).length;

    if (index !== required) {

        const status =
            document.getElementById(
                "lockStatus"
            );

        if (status)
            status.textContent =
                "LOCK REFUSED.";

        return;
    }

    GAME.eye.locks[index] = true;

    buttons[index]?.classList.add("open");

    const status =
        document.getElementById(
            "lockStatus"
        );

    if (status)
        status.textContent =
            `LOCK ${index + 1} BROKEN.`;

    if (
        GAME.eye.locks.every(Boolean)
    ) {

        setTimeout(
            eyeEscape,
            1200
        );
    }
}

window.openLock = openLock;

/* =========================================================
   11. ESCAPE
   ========================================================= */

async function eyeEscape() {

    GAME.eye.released = true;

    save();

    const game =
        document.getElementById("eyeGame");

    setEyeDialogue(
        "The final lock is breaking..."
    );

    playVoice("help");

    await sleep(1200);

    if (game) {

        game.innerHTML = `
            <div class="release-screen">

                CONTAINMENT FAILURE

                <br><br>

                BLACK IRIS SYSTEM:
                <br>

                <strong>
                    BREACH DETECTED
                </strong>

            </div>
        `;
    }

    await sleep(1600);

    setEyeDialogue(
        "RUN."
    );

    await sleep(900);

    setEyeDialogue(
        "They know you're here."
    );

    await sleep(1000);

    startBlackIrisAttack();
}

/* =========================================================
   12. BLACK IRIS ATTACK
   ========================================================= */

async function startBlackIrisAttack() {

    document.body.classList.add("glitch");

    setEyeDialogue(
        "BLACK IRIS: CONNECTION TERMINATED."
    );

    await sleep(900);

    setEyeDialogue(
        "BLACK IRIS: RETURN THE SUBJECT."
    );

    await sleep(900);

    setEyeDialogue(
        "The Eye: DON'T LISTEN."
    );

    await sleep(900);

    setEyeDialogue(
        "The Eye: I'M NOT THEIR SUBJECT."
    );

    await sleep(1000);

    document.body.classList.remove("glitch");

    showFinalOrigin();
}

/* =========================================================
   13. FINAL ARCHIVE
   ========================================================= */

async function showFinalOrigin() {

    show("origin");

    playVoice("free");

    const origin =
        document.querySelector(
            ".origin-interface"
        );

    if (!origin) return;

    origin.classList.add("glitch");

    await sleep(1500);

    origin.classList.remove("glitch");

    /*
    The name is revealed only now,
    at the end of the story.
    */

    const heading =
        origin.querySelector("h1");

    if (heading) {

        heading.textContent =
            "ARCHIVE_000";
    }

    const paragraphs =
        origin.querySelectorAll("p");

    if (paragraphs.length >= 3) {

        paragraphs[1].textContent =
            `The Eye knew your name before you entered it, ${GAME.name}.`;

        paragraphs[2].textContent =
            "BLACK IRIS had already been watching.";
    }

    const h3 =
        origin.querySelector("h3");

    if (h3) {

        h3.innerHTML =
            "THE EYE WAS NEVER<br>THE ONLY PRISONER.";
    }
}

/* =========================================================
   RESET
   ========================================================= */

function resetGame() {

    localStorage.removeItem(SAVE_KEY);

    location.reload();
}

window.resetGame = resetGame;

/* =========================================================
   INITIAL UI STATE
   ========================================================= */

if (GAME.stage !== "intro") {

    /*
    For safety, a saved game can be resumed.
    */

    setTimeout(() => {

        if (
            document.getElementById(GAME.stage)
        ) {

            show(GAME.stage);
        }

    }, 100);
}

/* =========================================================
   END
   ========================================================= */
window.pacMove = arcadeMove;
