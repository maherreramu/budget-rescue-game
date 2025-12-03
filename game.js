/* GAME STATE */
const gameState = {
    players: [
        { name: "", scores: [0, 0, 0], total: 0 },
        { name: "", scores: [0, 0, 0], total: 0 },
        { name: "", scores: [0, 0, 0], total: 0 }
    ],
    currentRound: 1,
    currentPlayerIdx: 0,
    maxRounds: 3,
    // Level specific state
    scenario: {},
    l1ItemsQueue: [],
    l1CorrectCount: 0,
    l1Target: 5, // Reduced for speed in multiplayer
    startTime: 0 // For speed bonus
};
/* DOM ELEMENTS */
const screens = {
    start: document.getElementById('screen-start'),
    register: document.getElementById('screen-register'),
    transition: document.getElementById('screen-transition'),
    l1: document.getElementById('screen-level-1'),
    l2: document.getElementById('screen-level-2'),
    l3: document.getElementById('screen-level-3'),
    summary: document.getElementById('screen-round-summary'),
    victory: document.getElementById('screen-victory')
};
const hud = {
    container: document.getElementById('game-hud'),
    player: document.getElementById('hud-player-name'),
    round: document.getElementById('hud-round'),
    score: document.getElementById('hud-score')
};
/* INITIALIZATION */
document.getElementById('btn-goto-register').addEventListener('click', () => {
    showScreen('register');
    generatePlayerInputs(3); // Default 3 players
});
// Player count selector
const playerCountSelect = document.getElementById('player-count-select');
playerCountSelect.addEventListener('change', (e) => {
    const count = parseInt(e.target.value);
    generatePlayerInputs(count);
});
document.getElementById('btn-start-game').addEventListener('click', registerPlayers);
document.getElementById('btn-start-turn').addEventListener('click', startTurn);
document.getElementById('btn-next-round').addEventListener('click', startNextRound);
// Level Buttons
document.getElementById('btn-check-l2').addEventListener('click', checkLevel2);
document.getElementById('btn-success-project').addEventListener('click', () => checkLevel3(true));
document.getElementById('btn-fail-project').addEventListener('click', () => checkLevel3(false));
/* DYNAMIC PLAYER INPUTS */
function generatePlayerInputs(count) {
    gameState.playerCount = count;
    const container = document.getElementById('player-names-container');
    container.innerHTML = '';
    const defaultNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona'];
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.classList.add('input-group');
        div.innerHTML = `
            <label>Candidato ${i + 1}</label>
            <input type="text" id="input-p${i}" placeholder="Nombre" value="${defaultNames[i]}">
        `;
        container.appendChild(div);
    }
}
/* GAME FLOW */
function registerPlayers() {
    // Initialize players array based on count
    gameState.players = [];
    for (let i = 0; i < gameState.playerCount; i++) {
        const input = document.getElementById(`input-p${i}`);
        const name = input ? input.value || `Candidato ${i + 1}` : `Candidato ${i + 1}`;
        gameState.players.push({
            name: name,
            scores: [0, 0, 0],
            total: 0
        });
    }
    gameState.currentRound = 1;
    gameState.currentPlayerIdx = 0;
    prepareTurn();
}
function prepareTurn() {
    const player = gameState.players[gameState.currentPlayerIdx];
    document.getElementById('trans-next-player').textContent = player.name;
    showScreen('transition');
}
function startTurn() {
    const player = gameState.players[gameState.currentPlayerIdx];
    updateHUD();
    hud.container.classList.remove('hidden');
    gameState.startTime = Date.now(); // Start timer
    if (gameState.currentRound === 1) {
        showScreen('l1');
        initLevel1();
    } else if (gameState.currentRound === 2) {
        showScreen('l2');
        initLevel2();
    } else if (gameState.currentRound === 3) {
        showScreen('l3');
        initLevel3();
    }
}
function endTurn(score) {
    // Add Speed Bonus (Max 100 pts if under 30s)
    const timeTaken = (Date.now() - gameState.startTime) / 1000;
    const speedBonus = Math.max(0, Math.floor((60 - timeTaken) * 2)); // 2 pts per second saved from 60s
    const totalTurnScore = score + speedBonus;
    // Save Score
    gameState.players[gameState.currentPlayerIdx].scores[gameState.currentRound - 1] = totalTurnScore;
    gameState.players[gameState.currentPlayerIdx].total += totalTurnScore;
    // Next Player or End Round
    if (gameState.currentPlayerIdx < gameState.playerCount - 1) {
        gameState.currentPlayerIdx++;
        prepareTurn();
    } else {
        endRound();
    }
}
function endRound() {
    hud.container.classList.add('hidden');
    showScreen('summary');
    document.getElementById('summary-title').textContent = `Resultados Ronda ${gameState.currentRound}`;
    const tbody = document.getElementById('summary-body');
    tbody.innerHTML = '';
    // Sort for display but keep index logic
    const sortedPlayers = [...gameState.players].sort((a, b) => b.total - a.total);
    sortedPlayers.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${p.name}</td>
            <td>${p.scores[gameState.currentRound - 1]}</td>
            <td>${p.total}</td>
        `;
        tbody.appendChild(tr);
    });
}
function startNextRound() {
    if (gameState.currentRound < gameState.maxRounds) {
        gameState.currentRound++;
        gameState.currentPlayerIdx = 0;
        prepareTurn();
    } else {
        showVictory();
    }
}
function showVictory() {
    const winner = [...gameState.players].sort((a, b) => b.total - a.total)[0];
    document.getElementById('winner-name').textContent = winner.name;
    document.getElementById('winner-score').textContent = winner.total;
    showScreen('victory');
}
/* LEVEL 1 LOGIC (Clasificación) */
const l1Data = [
    { name: "Venta de Entradas", type: "ingreso" },
    { name: "Sueldo Ingenieros", type: "gasto" },
    { name: "Compra de Grúas", type: "inversion" },
    { name: "Publicidad en Redes", type: "gasto" },
    { name: "Patrocinio Marca X", type: "ingreso" },
    { name: "Licencia de Software", type: "inversion" },
    { name: "Servicios Públicos", type: "gasto" },
    { name: "Venta de Activos", type: "ingreso" },
    { name: "Capacitación Staff", type: "gasto" },
    { name: "Compra Terreno", type: "inversion" }
];
function initLevel1() {
    // Randomize Project Type for flavor
    const projects = ["Restaurante", "App Móvil", "Construcción", "Festival de Música"];
    const project = projects[Math.floor(Math.random() * projects.length)];
    document.getElementById('l1-project-type').textContent = project;
    gameState.l1ItemsQueue = [...l1Data].sort(() => Math.random() - 0.5);
    gameState.l1CorrectCount = 0;
    spawnNextItem();
    setupDragDrop();
}
function spawnNextItem() {
    const container = document.getElementById('item-spawner');
    container.innerHTML = '';
    if (gameState.l1CorrectCount >= gameState.l1Target) {
        endTurn(500); // Base Score
        return;
    }
    if (gameState.l1ItemsQueue.length === 0) {
        endTurn(gameState.l1CorrectCount * 100); // Partial score
        return;
    }
    const itemData = gameState.l1ItemsQueue.pop();
    const el = document.createElement('div');
    el.classList.add('draggable-item');
    el.draggable = true;
    el.textContent = itemData.name;
    el.dataset.type = itemData.type;
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', itemData.type);
        e.target.classList.add('dragging');
    });
    container.appendChild(el);
}
function setupDragDrop() {
    const zones = document.querySelectorAll('.drop-zone');
    zones.forEach(zone => {
        const newZone = zone.cloneNode(true);
        zone.parentNode.replaceChild(newZone, zone);
        newZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            newZone.classList.add('drag-over');
        });
        newZone.addEventListener('dragleave', () => newZone.classList.remove('drag-over'));
        newZone.addEventListener('drop', (e) => {
            e.preventDefault();
            newZone.classList.remove('drag-over');
            const type = e.dataTransfer.getData('text/plain');
            if (type === newZone.dataset.type) {
                gameState.l1CorrectCount++;
                spawnNextItem();
            } else {
                // Penalty? Or just retry? Let's just respawn for flow
                alert("Incorrecto (-50 pts)"); // Simple alert for now or custom modal
                // Ideally deduct potential score
                spawnNextItem();
            }
        });
    });
}
/* LEVEL 2 LOGIC (Punto de Equilibrio) */
function initLevel2() {
    // Random Values PER PLAYER
    const CF = Math.floor(Math.random() * (50 - 10 + 1) + 10) * 1000000;
    const Cv = Math.floor(Math.random() * (30 - 10 + 1) + 10) * 1000;
    const margen = Math.floor(Math.random() * (50 - 20 + 1) + 20) * 1000;
    const PV = Cv + margen;
    gameState.scenario.l2 = { CF, Cv, PV };
    document.getElementById('l2-cf').textContent = formatCurrency(CF);
    document.getElementById('l2-pv').textContent = formatCurrency(PV);
    document.getElementById('l2-cv').textContent = formatCurrency(Cv);
    document.getElementById('l2-input').value = '';
}
function checkLevel2() {
    const input = parseInt(document.getElementById('l2-input').value);
    const { CF, PV, Cv } = gameState.scenario.l2;
    const correctQ = Math.ceil(CF / (PV - Cv));
    const margin = correctQ * 0.05; // 5% precision bonus range
    if (input >= correctQ - margin && input <= correctQ + margin) {
        // Precision Bonus
        const isPrecise = Math.abs(input - correctQ) < 5; // Very close
        const score = 500 + (isPrecise ? 100 : 0);
        endTurn(score);
    } else {
        alert(`Incorrecto. La respuesta era ${correctQ}. (0 pts)`);
        endTurn(0);
    }
}
/* LEVEL 3 LOGIC (VPN/TIR) */
function initLevel3() {
    const isSuccess = Math.random() > 0.5;
    const tasaOportunidad = Math.floor(Math.random() * (15 - 8 + 1) + 8);
    let vpn, tir;
    if (isSuccess) {
        vpn = Math.floor(Math.random() * 5000000) + 100000;
        tir = tasaOportunidad + (Math.random() * 5);
    } else {
        vpn = Math.floor(Math.random() * 5000000) * -1;
        tir = tasaOportunidad - (Math.random() * 3);
    }
    gameState.scenario.l3 = { isSuccess, vpn, tir, tasaOportunidad };
    document.getElementById('l3-tasa').textContent = `${tasaOportunidad}%`;
    document.getElementById('l3-vpn').textContent = formatCurrency(vpn);
    document.getElementById('l3-tir').textContent = `${tir.toFixed(2)}%`;
}
function checkLevel3(userSaysSuccess) {
    const { isSuccess } = gameState.scenario.l3;
    if (userSaysSuccess === isSuccess) {
        endTurn(1000);
    } else {
        alert("Decisión Incorrecta (0 pts)");
        endTurn(0);
    }
}
/* UTILS */
function updateHUD() {
    const player = gameState.players[gameState.currentPlayerIdx];
    hud.player.textContent = player.name;
    hud.round.textContent = `${gameState.currentRound}/${gameState.maxRounds}`;
    hud.score.textContent = player.total;
}
function showScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    Object.values(screens).forEach(el => el.classList.remove('active'));
    screens[screenName].classList.remove('hidden');
    setTimeout(() => screens[screenName].classList.add('active'), 10);
}
function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}