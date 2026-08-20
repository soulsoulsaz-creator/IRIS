/* =========================================================
   BLACK IRIS — FINAL ARCHIVE
   CORE ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   GAME STATE
   ========================================================= */

const GAME = {
    name: "",
    stage: "intro",

    arcadeLevel: 0,
    arcadeScore: 0,

    maze: {
        x: 1,
        y: 1,
        completed: false
    },

    blackBox: {
        knobs: [0, 0, 0],
        switches: [false, false, false],
        solved: false
    },

    dontPress: {
        clicks: 0,
        completed: false
    },

    question: {
        answered: false,
        choice: null
    },

    eye: {
        voiceOn: true,
        released: false,
        memories: [],
        locks: [false, false, false, false]
    }
};

const SAVE_KEY = "IRIS_FINAL_ARCHIVE";

function saveGame() {
    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(GAME)
    );
}

function loadGame() {

    try {

        const saved =
            localStorage.getItem(SAVE_KEY);

        if (!saved) return;

        const data = JSON.parse(saved);

        Object.assign(GAME, data);

    } catch (error) {

        console.warn(
            "Unable to load Final Archive save."
        );
    }
}

loadGame();


/* =========================================================
   SCREEN SYSTEM
   ========================================================= */

function showScreen(id) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove("active");

        });

    const target =
        document.getElementById(id);

    if (!target) {

        console.warn(
            "Screen not found:",
            id
        );

        return;
    }

    target.classList.add("active");

    GAME.stage = id;

    saveGame();
}


/* =========================================================
   SMALL UTILITIES
   ========================================================= */

function wait(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });
}


function random(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function typeText(element, text, speed = 25) {

    if (!element) return;

    element.textContent = "";

    let index = 0;

    return new Promise(resolve => {

        const timer =
            setInterval(() => {

                element.textContent +=
                    text[index];

                index++;

                if (index >= text.length) {

                    clearInterval(timer);

                    resolve();

                }

            }, speed);

    });
}


/* =========================================================
   INTRO
   ========================================================= */

const startButton =
    document.getElementById("startButton");

if (startButton) {

    startButton.addEventListener(
        "click",
        startArchive
    );
}


async function startArchive() {

    GAME.stage = "arcade";

    saveGame();

    showScreen("arcade");

    initializeArcade();
}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();

        if (
            GAME.stage === "arcade"
        ) {

            if (key === "arrowup" || key === "w") {
                arcadeMove(0, -1);
            }

            if (key === "arrowdown" || key === "s") {
                arcadeMove(0, 1);
            }

            if (key === "arrowleft" || key === "a") {
                arcadeMove(-1, 0);
            }

            if (key === "arrowright" || key === "d") {
                arcadeMove(1, 0);
            }
        }


        if (
            GAME.stage === "maze"
        ) {

            if (key === "arrowup" || key === "w") {
                mazeMove(0, -1);
            }

            if (key === "arrowdown" || key === "s") {
                mazeMove(0, 1);
            }

            if (key === "arrowleft" || key === "a") {
                mazeMove(-1, 0);
            }

            if (key === "arrowright" || key === "d") {
                mazeMove(1, 0);
            }
        }

    }
);


/* =========================================================
   MOBILE / TOUCH HELPER
   ========================================================= */

function arcadeMove(dx, dy) {

    if (
        typeof window._arcadeMove ===
        "function"
    ) {

        window._arcadeMove(dx, dy);

    }
}


function mazeMove(dx, dy) {

    if (
        typeof window._mazeMove ===
        "function"
    ) {

        window._mazeMove(dx, dy);

    }
}


/* =========================================================
   PLACEHOLDER FUNCTIONS
   =========================================================
   
   These are intentionally defined now so the HTML
   buttons don't produce errors while we build the
   remaining game systems.
   ========================================================= */

function rotateKnob(index) {

    console.log(
        "Knob rotated:",
        index
    );

}


function toggleSwitch(index) {

    console.log(
        "Switch toggled:",
        index
    );

}


function checkBlackBox() {

    console.log(
        "Black Box checked."
    );

}


function dontPress() {

    console.log(
        "Don't Press activated."
    );

}


function answerQuestion(choice) {

    console.log(
        "Question answer:",
        choice
    );

}


function submitName() {

    console.log(
        "Name submitted."
    );

}


function toggleVoice() {

    console.log(
        "Voice toggled."
    );

}


/* =========================================================
   RESET
   ========================================================= */

function resetGame() {

    localStorage.removeItem(
        SAVE_KEY
    );

    location.reload();
                }
