const SUPABASE_URL = "https://ltvxddamugsxzocdozik.supabase.co";
const SUPABASE_KEY = "sb_publishable_WBmz2U05M_JP2nh20qoFmg_i-jGMq1j";
const board = document.getElementById("sudoku-board");
const timer = document.getElementById("timer");
const mistakesText = document.getElementById("mistakes");
const scoreText = document.getElementById("score");
const message = document.getElementById("message");

const nameScreen = document.getElementById("name-screen");
const nameInput = document.getElementById("player-name");
const startButton = document.getElementById("start-game");
const playerText = document.getElementById("current-player");
const mobileInput = document.getElementById("mobile-input");
 

const newGameButton = document.getElementById("new-game");
const checkButton = document.getElementById("check-game");

const leaderboardButton = document.getElementById("leaderboard-button");
const leaderboard = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboard-list");
const closeLeaderboard = document.getElementById("close-leaderboard");

let solution = [];
let puzzle = [];
let playerBoard = [];
let selected = null;
let playerName = "";
let mistakes = 0;
let startTime = 0;
let timerID = null;
let finished = false;


// ---------- SUDOKU ----------

function emptyBoard() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function valid(board, r, c, n) {
    for (let i = 0; i < 9; i++) {
        if (board[r][i] === n || board[i][c] === n) return false;
    }

    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;

    for (let r2 = br; r2 < br + 3; r2++) {
        for (let c2 = bc; c2 < bc + 3; c2++) {
            if (board[r2][c2] === n) return false;
        }
    }

    return true;
}

function solve(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                const nums = [1,2,3,4,5,6,7,8,9];
                nums.sort(() => Math.random() - 0.5);

                for (const n of nums) {
                    if (valid(board, r, c, n)) {
                        board[r][c] = n;

                        if (solve(board)) return true;

                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function generateGame() {
    solution = emptyBoard();
    solve(solution);

    puzzle = solution.map(row => [...row]);

    let removed = 0;

    while (removed < 45) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);

        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            removed++;
        }
    }

    playerBoard = puzzle.map(row => [...row]);
}


// ---------- BOARD ----------

function createBoard() {
    board.innerHTML = "";

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement("div");

            cell.className = "cell";
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (puzzle[r][c] !== 0) {
                cell.textContent = puzzle[r][c];
                cell.classList.add("fixed");
            } else {
                cell.addEventListener("click", () => selectCell(cell));
            }

            board.appendChild(cell);
        }
    }
}

function selectCell(cell) {
    if (finished || cell.classList.contains("fixed")) return;
 
    document.querySelectorAll(".cell").forEach(c =>
        c.classList.remove("selected")
    );
 
    cell.classList.add("selected");
    selected = cell;
 
    // Open phone keyboard
    mobileInput.value = "";
    mobileInput.focus();
}


// ---------- KEYBOARD ----------

document.addEventListener("keydown", e => {
    if (finished || !selected || document.activeElement === nameInput) return;

    const r = +selected.dataset.row;
    const c = +selected.dataset.col;

    if (e.key >= "1" && e.key <= "9") {
        const n = +e.key;

        playerBoard[r][c] = n;
        selected.textContent = n;

        selected.classList.remove("wrong", "correct");

        if (n === solution[r][c]) {
            selected.classList.add("correct");
            nextEmpty(r, c);
        } else {
    selected.classList.add("wrong");
 
    mistakes++;
    mistakesText.textContent = mistakes;
 
    if (mistakes >= 5) {
        finishGame(false);
        return;
    }
        }

        updateScore();
        checkComplete();
        return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
        playerBoard[r][c] = 0;
        selected.textContent = "";
        selected.classList.remove("wrong", "correct");
        return;
    }

    const moves = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
    };

    if (moves[e.key]) {
        e.preventDefault();
        move(r, c, ...moves[e.key]);
    }
});

mobileInput.addEventListener("input", () => {
    if (finished || !selected) return;
 
    const value = mobileInput.value;
 
    if (value >= "1" && value <= "9") {
        selected.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: value,
                bubbles: true
            })
        );
 
        mobileInput.value = "";
    }
});

function move(r, c, dr, dc) {
    let nr = r + dr;
    let nc = c + dc;

    while (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
        if (puzzle[nr][nc] === 0) {
            selectCell(
                document.querySelector(
                    `.cell[data-row="${nr}"][data-col="${nc}"]`
                )
            );
            return;
        }

        nr += dr;
        nc += dc;
    }
}

function nextEmpty(r, c) {
    for (let i = 1; i <= 81; i++) {
        const index = (r * 9 + c + i) % 81;
        const nr = Math.floor(index / 9);
        const nc = index % 9;

        if (puzzle[nr][nc] === 0) {
            selectCell(
                document.querySelector(
                    `.cell[data-row="${nr}"][data-col="${nc}"]`
                )
            );
            return;
        }
    }
}


// ---------- TIMER & SCORE ----------

function startTimer() {
    stopTimer();
    startTime = Date.now();

    timerID = setInterval(() => {
        const seconds = Math.floor(
            (Date.now() - startTime) / 1000
        );

        timer.textContent = formatTime(seconds);
        updateScore();
    }, 250);
}

function stopTimer() {
    if (timerID) {
        clearInterval(timerID);
        timerID = null;
    }
}

function getSeconds() {
    return Math.floor((Date.now() - startTime) / 1000);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function updateScore() {
    const score = Math.max(
        100,
        10000 - getSeconds() * 10 - mistakes * 500
    );

    scoreText.textContent = score;
}


// ---------- CHECK GAME ----------

function checkComplete() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (
                puzzle[r][c] === 0 &&
                playerBoard[r][c] !== solution[r][c]
            ) {
                return;
            }
        }
    }

    finishGame();
}

checkButton.addEventListener("click", () => {
    if (finished) return;

    let wrong = 0;

    document.querySelectorAll(".cell").forEach(cell => {
        const r = +cell.dataset.row;
        const c = +cell.dataset.col;

        if (
            puzzle[r][c] === 0 &&
            playerBoard[r][c] !== 0 &&
            playerBoard[r][c] !== solution[r][c]
        ) {
            cell.classList.add("wrong");
            wrong++;
        }
    });

    message.textContent = wrong
        ? `❌ ${wrong} incorrect cell(s).`
        : "✅ No incorrect cells found!";
});


// ---------- START / NEW GAME ----------

function startGame() {
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter your name.");
        nameInput.focus();
        return;
    }

    playerName = name;
    playerText.textContent = playerName;

    nameScreen.classList.add("hidden");

    newGame();
}

startButton.addEventListener("click", startGame);

nameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") startGame();
});

function newGame() {
    stopTimer();

    finished = false;
    mistakes = 0;
    selected = null;

    timer.textContent = "00:00";
    mistakesText.textContent = "0";
    scoreText.textContent = "10000";
    message.textContent = "";

    leaderboard.classList.add("hidden");

    generateGame();
    createBoard();
    startTimer();
}

newGameButton.addEventListener("click", newGame);


// ---------- FINISH ----------

function finishGame(won = true) {
    if (finished) return;
 
    finished = true;
    stopTimer();
 
    if (!won) {
        message.textContent =
            `❌ Game Over! You made 5 mistakes.`;
 
        return;
    }
 
    const finalScore = Math.max(
        100,
        10000 - getSeconds() * 10 - mistakes * 500
    );
 
    scoreText.textContent = finalScore;
 
    message.textContent =
        `🎉 Congratulations ${playerName}! Score: ${finalScore}`;
 
    saveScore();
}

// ---------- LEADERBOARD ----------

async function saveScore() {
    const finalScore = Math.max(
        100,
        10000 - getSeconds() * 10 - mistakes * 500
    );
 
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                player_name: playerName,
                score: finalScore,
                time_seconds: getSeconds(),
                mistakes: mistakes
            })
        });
 
        if (!response.ok) {
            throw new Error(await response.text());
        }
 
        console.log("Score saved online!");
    } catch (error) {
        console.error("Could not save score:", error);
        message.textContent += " ⚠️ Score could not be uploaded.";
    }
}

async function showLeaderboard() {
    leaderboardList.innerHTML = "<p>Loading leaderboard...</p>";
    leaderboard.classList.remove("hidden");
 
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/scores?select=player_name,score,time_seconds,mistakes&order=score.desc&limit=10`,
            {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );
 
        if (!response.ok) {
            throw new Error(await response.text());
        }
 
        const scores = await response.json();
 
        leaderboardList.innerHTML = "";
 
        if (!scores.length) {
            leaderboardList.innerHTML = "<p>No scores yet.</p>";
            return;
        }
 
        scores.forEach((item, i) => {
            const row = document.createElement("div");
            row.className = "leaderboard-row";
 
            const rank = document.createElement("span");
            rank.className = "rank";
            rank.textContent = `#${i + 1}`;
 
            const name = document.createElement("span");
            name.className = "leader-name";
            name.textContent = item.player_name;
 
            const score = document.createElement("span");
            score.className = "leader-score";
            score.textContent = item.score;
 
            row.append(rank, name, score);
            leaderboardList.appendChild(row);
        });
 
    } catch (error) {
        console.error("Leaderboard error:", error);
        leaderboardList.innerHTML =
            "<p>⚠️ Could not load leaderboard.</p>";
    }
}

leaderboardButton.addEventListener("click", showLeaderboard);

closeLeaderboard.addEventListener("click", () => {
    leaderboard.classList.add("hidden");
});