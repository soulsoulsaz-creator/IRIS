document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // SCREEN SYSTEM
    // =========================================================

    const screens = document.querySelectorAll(".screen");

    function showScreen(id) {
        screens.forEach(screen => {
            screen.classList.remove("active");
        });

        const target = document.getElementById(id);

        if (target) {
            target.classList.add("active");
        }
    }


    // =========================================================
    // GAME STATE
    // =========================================================

    let gameState = {
        fragments: 0,
        level: 1,
        bossHealth: 5,
        bossLives: 3,
        blackBoxSolved: false,
        playerName: localStorage.getItem("agentName") || ""
    };


    // =========================================================
    // INTRO
    // =========================================================

    const beginButton = document.getElementById("beginButton");

    if (beginButton) {
        beginButton.addEventListener("click", () => {

            showScreen("arcadeScreen");

            startArcade();

        });
    }


    // =========================================================
    // ARCADE GAME
    // =========================================================

    const arcadeCanvas = document.getElementById("arcadeCanvas");
    const arcadeMessage = document.getElementById("arcadeMessage");
    const toolMessage = document.getElementById("toolMessage");

    const levelDisplay = document.getElementById("levelDisplay");
    const fragmentsFound = document.getElementById("fragmentsFound");

    let arcadeRunning = false;
    let arcadeAnimation;

    const arcade = {
        width: 504,
        height: 360,

        player: {
            x: 40,
            y: 180,
            width: 22,
            height: 22,
            speed: 3
        },

        enemies: [],

        fragments: [],

        door: {
            x: 462,
            y: 155,
            width: 25,
            height: 50
        },

        keys: {},

        selectedTool: null
    };


    function setupArcadeCanvas() {

        if (!arcadeCanvas) return;

        arcadeCanvas.width = arcade.width;
        arcadeCanvas.height = arcade.height;

    }


    function createArcadeLevel() {

        arcade.player.x = 35;
        arcade.player.y = 170;

        arcade.fragments = [];

        for (let i = 0; i < 3 + gameState.level; i++) {

            arcade.fragments.push({
                x: 70 + Math.random() * 390,
                y: 30 + Math.random() * 290,
                collected: false
            });

        }

        arcade.enemies = [];

        const enemyCount = 2 + gameState.level;

        for (let i = 0; i < enemyCount; i++) {

            arcade.enemies.push({
                x: 100 + Math.random() * 350,
                y: 40 + Math.random() * 270,
                width: 22,
                height: 22,
                vx: (Math.random() > .5 ? 1 : -1) *
                    (0.7 + gameState.level * .15),
                vy: (Math.random() > .5 ? 1 : -1) *
                    (0.7 + gameState.level * .15),
                frozen: 0
            });

        }

    }


    function startArcade() {

        setupArcadeCanvas();

        gameState.fragments = 0;

        updateArcadeUI();

        createArcadeLevel();

        arcadeRunning = true;

        arcadeMessage.textContent =
            "Find the fragments. Find the door.";

        cancelAnimationFrame(arcadeAnimation);

        arcadeLoop();

    }


    function updateArcadeUI() {

        if (levelDisplay) {
            levelDisplay.textContent = gameState.level;
        }

        if (fragmentsFound) {
            fragmentsFound.textContent = gameState.fragments;
        }

    }


    function arcadeLoop() {

        if (!arcadeRunning) return;

        updateArcade();

        drawArcade();

        arcadeAnimation = requestAnimationFrame(arcadeLoop);

    }


    function updateArcade() {

        const p = arcade.player;

        if (arcade.keys["ArrowUp"] || arcade.keys["w"]) {
            p.y -= p.speed;
        }

        if (arcade.keys["ArrowDown"] || arcade.keys["s"]) {
            p.y += p.speed;
        }

        if (arcade.keys["ArrowLeft"] || arcade.keys["a"]) {
            p.x -= p.speed;
        }

        if (arcade.keys["ArrowRight"] || arcade.keys["d"]) {
            p.x += p.speed;
        }

        p.x = Math.max(0, Math.min(arcade.width - p.width, p.x));
        p.y = Math.max(0, Math.min(arcade.height - p.height, p.y));


        // Enemies move independently.

        arcade.enemies.forEach(enemy => {

            if (enemy.frozen > 0) {
                enemy.frozen--;
                return;
            }

            enemy.x += enemy.vx;
            enemy.y += enemy.vy;

            if (
                enemy.x <= 0 ||
                enemy.x + enemy.width >= arcade.width
            ) {
                enemy.vx *= -1;
            }

            if (
                enemy.y <= 0 ||
                enemy.y + enemy.height >= arcade.height
            ) {
                enemy.vy *= -1;
            }

            if (rectCollision(p, enemy)) {

                if (arcade.selectedTool === "flipflop") {

                    enemy.frozen = 120;

                    arcadeMessage.textContent =
                        "🩴 Direct hit! Enemy stunned.";

                    arcade.selectedTool = null;

                } else if (arcade.selectedTool === "icecream") {

                    enemy.frozen = 240;

                    arcadeMessage.textContent =
                        "🍦 The enemy is distracted.";

                    arcade.selectedTool = null;

                } else {

                    p.x = 35;
                    p.y = 170;

                    arcadeMessage.textContent =
                        "You were caught. Be careful.";

                }

            }

        });


        // Fragment collection.

        arcade.fragments.forEach(fragment => {

            if (
                !fragment.collected &&
                distance(
                    p.x,
                    p.y,
                    fragment.x,
                    fragment.y
                ) < 22
            ) {

                fragment.collected = true;

                gameState.fragments++;

                updateArcadeUI();

                arcadeMessage.textContent =
                    "Fragment recovered.";

            }

        });


        // Door.

        const nearDoor =
            p.x + p.width > arcade.door.x &&
            p.x < arcade.door.x + arcade.door.width &&
            p.y + p.height > arcade.door.y &&
            p.y < arcade.door.y + arcade.door.height;


        if (nearDoor) {

            if (arcade.selectedTool === "key") {

                arcadeRunning = false;

                arcadeMessage.textContent =
                    "🔑 Door unlocked.";

                setTimeout(() => {

                    showScreen("bossScreen");

                    startBoss();

                }, 700);

            } else {

                arcadeMessage.textContent =
                    "The door is locked. Find the key.";

            }

        }

    }


    function drawArcade() {

        const ctx = arcadeCanvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            arcade.width,
            arcade.height
        );

        ctx.fillStyle = "#050509";

        ctx.fillRect(
            0,
            0,
            arcade.width,
            arcade.height
        );


        // Maze-like walls.

        ctx.strokeStyle = "#20204a";
        ctx.lineWidth = 4;

        for (let x = 25; x < 480; x += 70) {

            ctx.beginPath();

            ctx.moveTo(x, 20);
            ctx.lineTo(x, 100);

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(x, 260);
            ctx.lineTo(x, 340);

            ctx.stroke();

        }


        // Door.

        ctx.fillStyle =
            arcade.selectedTool === "key"
                ? "#00aa55"
                : "#551111";

        ctx.fillRect(
            arcade.door.x,
            arcade.door.y,
            arcade.door.width,
            arcade.door.height
        );


        // Fragments.

        arcade.fragments.forEach(fragment => {

            if (fragment.collected) return;

            ctx.fillStyle = "#67b8ff";

            ctx.beginPath();

            ctx.arc(
                fragment.x,
                fragment.y,
                6,
                0,
                Math.PI * 2
            );

            ctx.fill();

        });


        // Enemies.

        arcade.enemies.forEach(enemy => {

            ctx.fillStyle =
                enemy.frozen > 0
                    ? "#777"
                    : "#c33";

            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );

        });


        // Player: little girl with blonde hair and hat.

        const p = arcade.player;

        // body

        ctx.fillStyle = "#ffd1b3";

        ctx.fillRect(
            p.x + 6,
            p.y + 3,
            10,
            9
        );

        // hair

        ctx.fillStyle = "#f2d36b";

        ctx.fillRect(
            p.x + 3,
            p.y,
            16,
            8
        );

        // hat

        ctx.fillStyle = "#d9b45c";

        ctx.fillRect(
            p.x + 2,
            p.y - 4,
            18,
            5
        );

        // dress

        ctx.fillStyle = "#7a6cff";

        ctx.fillRect(
            p.x + 3,
            p.y + 12,
            16,
            9
        );

    }


    function rectCollision(a, b) {

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );

    }


    function distance(x1, y1, x2, y2) {

        return Math.sqrt(
            Math.pow(x1 - x2, 2) +
            Math.pow(y1 - y2, 2)
        );

    }


    // Keyboard controls.

    document.addEventListener("keydown", event => {

        arcade.keys[event.key] = true;

        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
                .includes(event.key)
        ) {
            event.preventDefault();
        }

    });


    document.addEventListener("keyup", event => {

        arcade.keys[event.key] = false;

    });


    // Mobile controls.

    document.querySelectorAll("[data-dir]")
        .forEach(button => {

            button.addEventListener("pointerdown", () => {

                arcade.keys[
                    directionToKey(button.dataset.dir)
                ] = true;

            });

            button.addEventListener("pointerup", () => {

                arcade.keys[
                    directionToKey(button.dataset.dir)
                ] = false;

            });

        });


    function directionToKey(direction) {

        const map = {
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight"
        };

        return map[direction];

    }


    // =========================================================
    // TOOLS
    // =========================================================

    document.querySelectorAll("[data-tool]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const tool = button.dataset.tool;

                arcade.selectedTool = tool;

                if (tool === "scanner") {

                    toolMessage.textContent =
                        "🔎 Scanner: hidden objects detected.";

                }

                if (tool === "flipflop") {

                    toolMessage.textContent =
                        "🩴 Flip-flop equipped. Touch an enemy to hit it.";

                }

                if (tool === "icecream") {

                    toolMessage.textContent =
                        "🍦 Ice cream equipped. Touch an enemy to distract it.";

                }

                if (tool === "key") {

                    toolMessage.textContent =
                        "🔑 Key equipped. Take it to the locked door.";

                }

                if (tool === "mirror") {

                    toolMessage.textContent =
                        "🪞 Mirror equipped. Something about the Eye feels familiar.";

                }

            });

        });


    // =========================================================
    // BOSS LEVEL
    // =========================================================

    const bossCanvas = document.getElementById("bossCanvas");

    let bossAnimation;
    let bossRunning = false;

    const boss = {

        player: {
            x: 100,
            y: 300,
            width: 32,
            height: 45,
            vx: 0,
            vy: 0,
            grounded: true
        },

        eye: {
            x: 700,
            y: 100,
            size: 90,
            vx: 2
        },

        projectiles: [],

        enemyProjectiles: [],

        gravity: .7

    };


    function setupBossCanvas() {

        bossCanvas.width = 960;
        bossCanvas.height = 480;

    }


    function startBoss() {

        setupBossCanvas();

        gameState.bossHealth = 5;
        gameState.bossLives = 3;

        bossRunning = true;

        boss.player.x = 100;
        boss.player.y = 350;

        boss.eye.x = 700;
        boss.eye.y = 100;

        boss.projectiles = [];
        boss.enemyProjectiles = [];

        updateBossUI();

        document.getElementById("bossMessage").textContent =
            "THE EYE HAS AWAKENED.";

        cancelAnimationFrame(bossAnimation);

        bossLoop();

    }


    function updateBossUI() {

        document.getElementById("bossHealth").textContent =
            gameState.bossHealth;

        document.getElementById("bossLives").textContent =
            gameState.bossLives;

    }


    function bossLoop() {

        if (!bossRunning) return;

        updateBoss();

        drawBoss();

        bossAnimation =
            requestAnimationFrame(bossLoop);

    }


    function updateBoss() {

        const p = boss.player;

        if (boss.keys) {

            if (
                boss.keys.left
            ) {
                p.vx = -4;
            } else if (
                boss.keys.right
            ) {
                p.vx = 4;
            } else {
                p.vx = 0;
            }

            if (
                boss.keys.jump &&
                p.grounded
            ) {

                p.vy = -12;
                p.grounded = false;

            }

        }


        p.vy += boss.gravity;

        p.x += p.vx;
        p.y += p.vy;

        if (p.y >= 390) {

            p.y = 390;
            p.vy = 0;
            p.grounded = true;

        }

        p.x =
            Math.max(
                0,
                Math.min(
                    920,
                    p.x
                )
            );


        // Eye moves automatically.

        boss.eye.x += boss.eye.vx;

        if (
            boss.eye.x < 500 ||
            boss.eye.x > 820
        ) {

            boss.eye.vx *= -1;

        }


        // Eye periodically attacks.

        if (Math.random() < .012) {

            boss.enemyProjectiles.push({

                x: boss.eye.x,
                y: boss.eye.y + 70,
                vx: -2,
                vy: 3

            });

        }


        boss.projectiles.forEach(projectile => {

            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

        });


        boss.enemyProjectiles.forEach(projectile => {

            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

            if (
                projectile.x > p.x &&
                projectile.x < p.x + p.width &&
                projectile.y > p.y &&
                projectile.y < p.y + p.height
            ) {

                gameState.bossLives--;

                updateBossUI();

                projectile.y = 999;

                if (gameState.bossLives <= 0) {

                    gameState.bossLives = 3;

                    p.x = 100;
                    p.y = 350;

                    updateBossUI();

                    document.getElementById("bossMessage").textContent =
                        "You survived. Keep going.";

                }

            }

        });


        boss.projectiles.forEach(projectile => {

            const hit =
                projectile.x > boss.eye.x - boss.eye.size &&
                projectile.x <
                boss.eye.x + boss.eye.size &&
                projectile.y >
                boss.eye.y - boss.eye.size &&
                projectile.y <
                boss.eye.y + boss.eye.size;

            if (hit) {

                projectile.x = -999;

                gameState.bossHealth--;

                updateBossUI();

                if (gameState.bossHealth <= 0) {

                    defeatBoss();

                }

            }

        });

    }


    function drawBoss() {

        const ctx = bossCanvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            bossCanvas.width,
            bossCanvas.height
        );

        ctx.fillStyle = "#050000";

        ctx.fillRect(
            0,
            0,
            bossCanvas.width,
            bossCanvas.height
        );


        // Platforms.

        ctx.fillStyle = "#222";

        ctx.fillRect(
            0,
            435,
            960,
            45
        );

        ctx.fillRect(
            250,
            330,
            180,
            20
        );

        ctx.fillRect(
            520,
            270,
            180,
            20
        );


        // Red Eye.

        const e = boss.eye;

        ctx.fillStyle = "#220000";

        ctx.beginPath();

        ctx.arc(
            e.x,
            e.y,
            e.size,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
            e.x,
            e.y,
            e.size - 8,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.ellipse(
            e.x,
            e.y,
            48,
            30,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle = "#d00";

        ctx.beginPath();

        ctx.arc(
            e.x,
            e.y,
            18,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Girl.

        const p = boss.player;

        ctx.fillStyle = "#ffd1b3";

        ctx.fillRect(
            p.x + 8,
            p.y,
            18,
            18
        );

        ctx.fillStyle = "#f0cf6a";

        ctx.fillRect(
            p.x + 3,
            p.y - 5,
            28,
            10
        );

        ctx.fillStyle = "#c9a54b";

        ctx.fillRect(
            p.x,
            p.y - 10,
            34,
            6
        );

        ctx.fillStyle = "#6d5bd0";

        ctx.fillRect(
            p.x + 5,
            p.y + 18,
            24,
            27
        );


        // Flip-flops.

        boss.projectiles.forEach(projectile => {

            ctx.save();

            ctx.translate(
                projectile.x,
                projectile.y
            );

            ctx.rotate(
                projectile.rotation || 0
            );

            ctx.fillStyle = "#d8a15d";

            ctx.fillRect(
                -14,
                -5,
                28,
                10
            );

            ctx.restore();

        });


        // Enemy projectiles.

        ctx.fillStyle = "#ff2222";

        boss.enemyProjectiles.forEach(projectile => {

            ctx.beginPath();

            ctx.arc(
                projectile.x,
                projectile.y,
                6,
                0,
                Math.PI * 2
            );

            ctx.fill();

        });

    }


    boss.keys = {
        left: false,
        right: false,
        jump: false
    };


    document.addEventListener("keydown", event => {

        if (!document.getElementById("bossScreen").classList.contains("active")) {
            return;
        }

        if (
            event.key === "ArrowLeft" ||
            event.key === "a"
        ) {
            boss.keys.left = true;
        }

        if (
            event.key === "ArrowRight" ||
            event.key === "d"
        ) {
            boss.keys.right = true;
        }

        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === " "
        ) {
            boss.keys.jump = true;
            event.preventDefault();
        }

        if (event.key === "f") {
            throwFlipFlop();
        }

    });


    document.addEventListener("keyup", event => {

        if (
            event.key === "ArrowLeft" ||
            event.key === "a"
        ) {
            boss.keys.left = false;
        }

        if (
            event.key === "ArrowRight" ||
            event.key === "d"
        ) {
            boss.keys.right = false;
        }

        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === " "
        ) {
            boss.keys.jump = false;
        }

    });


    document.querySelectorAll("[data-boss-key]")
        .forEach(button => {

            const key = button.dataset.bossKey;

            button.addEventListener("pointerdown", () => {

                if (key === "jump") {
                    boss.keys.jump = true;
                } else {
                    boss.keys[key] = true;
                }

            });

            button.addEventListener("pointerup", () => {

                if (key === "jump") {
                    boss.keys.jump = false;
                } else {
                    boss.keys[key] = false;
                }

            });

        });


    function throwFlipFlop() {

        boss.projectiles.push({

            x: boss.player.x + 25,
            y: boss.player.y + 15,

            vx: 8,

            vy: -2,

            rotation: 0

        });

    }


    document.querySelectorAll("[data-boss-tool]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const tool = button.dataset.bossTool;

                if (tool === "flipflop") {

                    throwFlipFlop();

                    document.getElementById("bossMessage").textContent =
                        "🩴 FLIP-FLOP THROWN!";

                }

                if (tool === "icecream") {

                    document.getElementById("bossMessage").textContent =
                        "🍦 The Eye is distracted!";

                    boss.eye.vx *= 0.5;

                    setTimeout(() => {

                        boss.eye.vx *= 2;

                    }, 3000);

                }

                if (tool === "scanner") {

                    document.getElementById("bossMessage").textContent =
                        "🔎 SCANNER: The red pupil is the weak point.";

                }

                if (tool === "mirror") {

                    document.getElementById("bossMessage").textContent =
                        "🪞 The Eye sees itself.";

                    boss.eye.vx *= -1;

                }

                if (tool === "key") {

                    document.getElementById("bossMessage").textContent =
                        "🔑 The key has no power here.";

                }

            });

        });


    function defeatBoss() {

        bossRunning = false;

        cancelAnimationFrame(bossAnimation);

        document.getElementById("bossOverlay").classList.remove("hidden");

        document.getElementById("bossOverlayText").textContent =
            "THE RED EYE HAS FALLEN";

    }


    document.getElementById("bossContinue")
        .addEventListener("click", () => {

            document.getElementById("bossOverlay")
                .classList.add("hidden");

            showScreen("mazeScreen");

            startMaze();

        });


    // =========================================================
    // MAZE
    // =========================================================

    const mazeCanvas =
        document.getElementById("mazeCanvas");

    const maze = {

        size: 9,

        player: {
            x: 0,
            y: 0
        },

        exit: {
            x: 8,
            y: 8
        },

        map: [

            [0,0,1,0,0,0,1,0,0],

            [1,0,1,0,1,0,1,0,1],

            [0,0,0,0,1,0,0,0,0],

            [0,1,1,0,1,1,1,1,0],

            [0,0,0,0,0,0,0,1,0],

            [0,1,1,1,1,1,0,1,0],

            [0,0,0,0,0,1,0,0,0],

            [0,1,1,1,0,1,1,1,0],

            [0,0,0,0,0,0,0,0,0]

        ]

    };


    function startMaze() {

        maze.player.x = 0;
        maze.player.y = 0;

        drawMaze();

        document.getElementById("mazeMessage").textContent =
            "The walls are changing. Find the exit.";

    }


    function drawMaze() {

        const ctx = mazeCanvas.getContext("2d");

        const cell = 44;

        mazeCanvas.width =
            maze.size * cell;

        mazeCanvas.height =
            maze.size * cell;

        ctx.fillStyle = "#050505";

        ctx.fillRect(
            0,
            0,
            mazeCanvas.width,
            mazeCanvas.height
        );


        for (let y = 0; y < maze.size; y++) {

            for (let x = 0; x < maze.size; x++) {

                if (maze.map[y][x] === 1) {

                    ctx.fillStyle = "#242424";

                    ctx.fillRect(
                        x * cell,
                        y * cell,
                        cell,
                        cell
                    );

                }

            }

        }


        // Exit.

        ctx.fillStyle = "#164";

        ctx.fillRect(
            maze.exit.x * cell + 8,
            maze.exit.y * cell + 8,
            cell - 16,
            cell - 16
        );


        // Player.

        ctx.fillStyle = "#f2d36b";

        ctx.beginPath();

        ctx.arc(
            maze.player.x * cell + 22,
            maze.player.y * cell + 22,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    function moveMaze(dx, dy) {

        const nx =
            maze.player.x + dx;

        const ny =
            maze.player.y + dy;

        if (
            nx < 0 ||
            ny < 0 ||
            nx >= maze.size ||
            ny >= maze.size
        ) {
            return;
        }

        if (maze.map[ny][nx] === 1) {

            document.getElementById("mazeMessage").textContent =
                "A wall blocks the way.";

            return;

        }

        maze.player.x = nx;
        maze.player.y = ny;

        drawMaze();


        if (
            maze.player.x === maze.exit.x &&
            maze.player.y === maze.exit.y
        ) {

            document.getElementById("mazeMessage").textContent =
                "EXIT FOUND.";

            document.getElementById("mazeContinue")
                .classList.remove("hidden");

        }

    }


    document.addEventListener("keydown", event => {

        if (!document.getElementById("mazeScreen")
            .classList.contains("active")) {
            return;
        }

        if (
            event.key === "ArrowUp" ||
            event.key === "w"
        ) {
            moveMaze(0, -1);
        }

        if (
            event.key === "ArrowDown" ||
            event.key === "s"
        ) {
            moveMaze(0, 1);
        }

        if (
            event.key === "ArrowLeft" ||
            event.key === "a"
        ) {
            moveMaze(-1, 0);
        }

        if (
            event.key === "ArrowRight" ||
            event.key === "d"
        ) {
            moveMaze(1, 0);
        }

    });


    document.getElementById("mazeContinue")
        .addEventListener("click", () => {

            showScreen("blackBoxScreen");

        });


    // =========================================================
    // BLACK BOX
    // =========================================================

    const blackBoxState = {

        switches: [false,false,false,false],

        dials: [0,0,0],

        symbol: null

    };


    document.querySelectorAll(".switch")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.switch);

                blackBoxState.switches[index] =
                    !blackBoxState.switches[index];

                button.classList.toggle(
                    "active",
                    blackBoxState.switches[index]
                );

                button.textContent =
                    blackBoxState.switches[index]
                        ? "ON"
                        : "OFF";

            });

        });


    document.querySelectorAll(".dial")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.dial);

                blackBoxState.dials[index] =
                    (blackBoxState.dials[index] + 1) % 4;

                const values =
                    ["◉","◌","◎","●"];

                button.textContent =
                    values[
                        blackBoxState.dials[index]
                    ];

            });

        });


    document.querySelectorAll(".symbol")
        .forEach(button => {

            button.addEventListener("click", () => {

                document.querySelectorAll(".symbol")
                    .forEach(s =>
                        s.classList.remove("active")
                    );

                button.classList.add("active");

                blackBoxState.symbol =
                    button.dataset.symbol;

            });

        });


    document.getElementById("blackButton")
        .addEventListener("click", () => {

            /*
             * Correct configuration.
             *
             * The player must discover this from
             * previous clues.
             */

            const switchesCorrect =
                blackBoxState.switches[0] &&
                !blackBoxState.switches[1] &&
                blackBoxState.switches[2] &&
                !blackBoxState.switches[3];

            const dialsCorrect =
                blackBoxState.dials[0] === 1 &&
                blackBoxState.dials[1] === 2 &&
                blackBoxState.dials[2] === 3;

            const symbolCorrect =
                blackBoxState.symbol === "eye";


            if (
                switchesCorrect &&
                dialsCorrect &&
                symbolCorrect
            ) {

                gameState.blackBoxSolved = true;

                document.getElementById("blackBoxMessage")
                    .textContent =
                    "ACCESS GRANTED.";

                setTimeout(() => {

                    showScreen("dontPressScreen");

                }, 1000);

            } else {

                document.getElementById("blackBoxMessage")
                    .textContent =
                    "ACCESS DENIED. Something is wrong.";

            }

        });


    // =========================================================
    // DON'T PRESS BUTTON
    // =========================================================

    document.getElementById("dontPressButton")
        .addEventListener("click", () => {

            const text =
                document.getElementById("dontPressText");

            text.textContent =
                "You pressed it.";

            setTimeout(() => {

                showScreen("questionScreen");

            }, 1500);

        });


    // =========================================================
    // QUESTION
    // =========================================================

    document.getElementById("questionYes")
        .addEventListener("click", () => {

            showScreen("nameScreen");

        });


    document.getElementById("questionNo")
        .addEventListener("click", () => {

            showScreen("nameScreen");

        });


    // =========================================================
    // NAME
    // =========================================================

    document.getElementById("nameSubmit")
        .addEventListener("click", () => {

            const input =
                document.getElementById("agentName");

            const name =
                input.value.trim();

            if (!name) {

                input.focus();

                return;

            }

            gameState.playerName = name;

            localStorage.setItem(
                "agentName",
                name
            );

            startEyeSequence();

        });


    function startEyeSequence() {

        showScreen("eyeScreen");

        const dialogue =
            document.getElementById("eyeDialogue");

        dialogue.textContent =
            "I KNOW YOUR NAME, " +
            gameState.playerName.toUpperCase() +
            ".";

        setTimeout(() => {

            dialogue.textContent =
                "YOU HAVE BEEN LOOKING FOR ME.";

        }, 2200);

        setTimeout(() => {

            dialogue.textContent =
                "BUT YOU NEVER ASKED WHO WAS WATCHING.";

        }, 4500);

        setTimeout(() => {

            document.getElementById("eyeChoices")
                .classList.remove("hidden");

        }, 7000);

    }


    // =========================================================
    // EYE CHOICES
    // =========================================================

    document.querySelectorAll("[data-choice]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const choice =
                    button.dataset.choice;

                if (choice === "free") {

                    showScreen("memoryScreen");

                } else {

                    showScreen("easterEggScreen");

                }

            });

        });


    // =========================================================
    // EASTER EGG
    // =========================================================

    document.getElementById("eggContinue")
        .addEventListener("click", () => {

            showScreen("noArchiveScreen");

            setTimeout(() => {

                document.getElementById("eyeContinue")
                    .classList.remove("hidden");

            }, 2000);

        });


    document.getElementById("eyeContinue")
        .addEventListener("click", () => {

            showScreen("memoryScreen");

        });


    // =========================================================
    // MEMORY / FINAL CODE
    // =========================================================

    document.getElementById("memorySubmit")
        .addEventListener("click", () => {

            const input =
                document.getElementById("memoryInput");

            const value =
                input.value.trim();

            if (
                value === "170301" ||
                value === "17 03 01" ||
                value === "170301"
            ) {

                document.getElementById("memoryMessage")
                    .textContent =
                    "MEMORY VERIFIED.";

                setTimeout(() => {

                    startEnding();

                }, 1200);

            } else {

                document.getElementById("memoryMessage")
                    .textContent =
                    "INCORRECT. LOOK CLOSER.";

            }

        });


    // =========================================================
    // ENDING
    // =========================================================

    function startEnding() {

        showScreen("endingScreen");

        const ending =
            document.getElementById("endingText");

        ending.textContent =
            "The archive opens.";

        setTimeout(() => {

            ending.textContent =
                "There was never an investigation.";

        }, 2500);

        setTimeout(() => {

            ending.textContent =
                "There was only one subject.";

        }, 5000);

        setTimeout(() => {

            ending.textContent =
                "YOU.";

        }, 7500);

    }


    document.getElementById("endingContinue")
        .addEventListener("click", () => {

            document.getElementById("endingText")
                .textContent =
                "BLACK IRIS ARCHIVE COMPLETE.";

            document.getElementById("endingContinue")
                .style.display = "none";

        });


    // =========================================================
    // SAFETY CHECK
    // =========================================================

    console.log(
        "BLACK IRIS FINAL ARCHIVE loaded successfully."
    );

});
