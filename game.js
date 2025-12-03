/* GAME STATE */
const gameState = {
    currentLevel: 1,
    lives: 3,
    score: 0,
    maxLevels: 4,
    scenario: {}, // Holds dynamic data for current level
    l1ItemsQueue: [],
    l1CorrectCount: 0,
    l1Target: 8, // Increased difficulty
    l3CutsMade: 0,
    l3TargetCuts: 3
};

/* DOM ELEMENTS */
const screens = {
    start: document.getElementById('screen-start'),
    l1: document.getElementById('screen-level-1'),
    l2: document.getElementById('screen-level-2'),
    l3: document.getElementById('screen-level-3'),
    l4: document.getElementById('screen-level-4'),
    gameover: document.getElementById('screen-gameover'),
    victory: document.getElementById('screen-victory')
};

const hud = {
    container: document.getElementById('game-hud'),
    lives: document.getElementById('lives-display'),
    level: document.getElementById('level-display'),
    score: document.getElementById('score-display')
};

const modal = {
    el: document.getElementById('feedback-modal'),
    title: document.getElementById('feedback-title'),
    msg: document.getElementById('feedback-msg'),
    btn: document.getElementById('btn-close-feedback')
};

/* INITIALIZATION */
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-check-l2').addEventListener('click', checkLevel2);
document.getElementById('btn-success-project').addEventListener('click', () => checkLevel4(true));
document.getElementById('btn-fail-project').addEventListener('click', () => checkLevel4(false));
modal.btn.addEventListener('click', hideModal);

function startGame() {
    gameState.currentLevel = 1;
    gameState.lives = 3;
    gameState.score = 0;
    updateHUD();
    showScreen('l1');
    hud.container.classList.remove('hidden');
    initLevel1();
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
    { name: "Compra Terreno", type: "inversion" },
    { name: "Intereses Bancarios", type: "gasto" },
    { name: "Subvención Gobierno", type: "ingreso" }
];

function initLevel1() {
    gameState.l1ItemsQueue = [...l1Data].sort(() => Math.random() - 0.5); // Shuffle
    gameState.l1CorrectCount = 0;
    spawnNextItem();
    setupDragDrop();
}

function spawnNextItem() {
    const container = document.getElementById('item-spawner');
    container.innerHTML = '';

    if (gameState.l1CorrectCount >= gameState.l1Target) {
        levelComplete();
        return;
    }

    if (gameState.l1ItemsQueue.length === 0) {
        // Should not happen with target < total items, but safety check
        levelComplete();
        return;
    }

    const itemData = gameState.l1ItemsQueue.pop();
    const el = document.createElement('div');
    el.classList.add('draggable-item');
    el.draggable = true;
    el.textContent = itemData.name;
    el.dataset.type = itemData.type;
    el.id = 'drag-item';

    // Touch support for mobile would go here (simplified for web/mouse first)
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', itemData.type);
        e.target.classList.add('dragging');
    });

    el.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });

    container.appendChild(el);
}

function setupDragDrop() {
    const zones = document.querySelectorAll('.drop-zone');
    zones.forEach(zone => {
        // Clone to remove old listeners if re-initializing
        const newZone = zone.cloneNode(true);
        zone.parentNode.replaceChild(newZone, zone);

        newZone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Allow drop
            newZone.classList.add('drag-over');
        });

        newZone.addEventListener('dragleave', () => {
            newZone.classList.remove('drag-over');
        });

        newZone.addEventListener('drop', (e) => {
            e.preventDefault();
            newZone.classList.remove('drag-over');
            const type = e.dataTransfer.getData('text/plain');
            const targetType = newZone.dataset.type;

            if (type === targetType) {
                // Correct
                gameState.score += 100;
                gameState.l1CorrectCount++;
                updateHUD();
                spawnNextItem(); // Next item immediately
            } else {
                // Incorrect
                handleMistake("Clasificación Incorrecta", `Ese ítem no es un ${targetType}. Intenta de nuevo.`);
                spawnNextItem(); // Respawn same or next (design choice: next to avoid stuck)
            }
        });
    });
}

/* LEVEL 2 LOGIC (Punto de Equilibrio) */
function initLevel2() {
    // Generate Random Values
    const CF = Math.floor(Math.random() * (50 - 10 + 1) + 10) * 1000000; // 10M - 50M
    const Cv = Math.floor(Math.random() * (30 - 10 + 1) + 10) * 1000;    // 10k - 30k
    const margen = Math.floor(Math.random() * (50 - 20 + 1) + 20) * 1000;
    const PV = Cv + margen;

    gameState.scenario.l2 = { CF, Cv, PV };

    // Update UI
    document.getElementById('l2-cf').textContent = formatCurrency(CF);
    document.getElementById('l2-pv').textContent = formatCurrency(PV);
    document.getElementById('l2-cv').textContent = formatCurrency(Cv);
    document.getElementById('l2-input').value = '';
}

function checkLevel2() {
    const input = parseInt(document.getElementById('l2-input').value);
    const { CF, PV, Cv } = gameState.scenario.l2;
    const correctQ = Math.ceil(CF / (PV - Cv));

    // Allow 5% margin of error
    const margin = correctQ * 0.05;

    if (input >= correctQ - margin && input <= correctQ + margin) {
        gameState.score += 500;
        updateHUD();
        levelComplete();
    } else {
        handleMistake("Cálculo Incorrecto", `El Punto de Equilibrio era ${correctQ} unidades. Recuerda: CF / (PV - Cv).`);
    }
}

/* LEVEL 3 LOGIC (Optimización de Costos) */
const l3Expenses = [
    { name: "Suscripción Revistas Premium", essential: false, cost: 500000 },
    { name: "Mantenimiento Servidores", essential: true, cost: 2000000 },
    { name: "Fiesta Mensual Staff", essential: false, cost: 1500000 },
    { name: "Seguro de Responsabilidad", essential: true, cost: 3000000 },
    { name: "Decoración Oficina Nueva", essential: false, cost: 800000 },
    { name: "Nómina Desarrolladores", essential: true, cost: 15000000 },
    { name: "Café Gourmet Ilimitado", essential: false, cost: 300000 }
];

function initLevel3() {
    gameState.l3CutsMade = 0;
    const list = document.getElementById('expense-list');
    list.innerHTML = '';

    // Shuffle expenses
    const expenses = [...l3Expenses].sort(() => Math.random() - 0.5);

    expenses.forEach(exp => {
        const item = document.createElement('div');
        item.classList.add('expense-item');
        item.innerHTML = `
            <span>${exp.name} (${formatCurrency(exp.cost)})</span>
            <button class="btn-cut">CORTAR</button>
        `;

        const btn = item.querySelector('.btn-cut');
        btn.addEventListener('click', () => {
            if (exp.essential) {
                handleMistake("¡Error Crítico!", `No puedes cortar ${exp.name}, es vital para el proyecto.`);
            } else {
                item.classList.add('cut');
                btn.disabled = true;
                btn.textContent = "CORTADO";
                gameState.score += 300;
                gameState.l3CutsMade++;
                updateHUD();

                if (gameState.l3CutsMade >= gameState.l3TargetCuts) {
                    setTimeout(levelComplete, 500);
                }
            }
        });

        list.appendChild(item);
    });
}

/* LEVEL 4 LOGIC (VPN/TIR) - Previously Level 3 */
function initLevel4() {
    // Randomize Scenario: Success or Fail
    const isSuccess = Math.random() > 0.5;
    const tasaOportunidad = Math.floor(Math.random() * (15 - 8 + 1) + 8); // 8% - 15%

    let vpn, tir;

    if (isSuccess) {
        vpn = Math.floor(Math.random() * 5000000) + 100000; // Positive
        tir = tasaOportunidad + (Math.random() * 5); // Higher than tasa
    } else {
        vpn = Math.floor(Math.random() * 5000000) * -1; // Negative
        tir = tasaOportunidad - (Math.random() * 3); // Lower than tasa
    }

    gameState.scenario.l4 = { isSuccess, vpn, tir, tasaOportunidad };

    // Update UI
    document.getElementById('l4-tasa').textContent = `${tasaOportunidad}%`;
    document.getElementById('l4-vpn').textContent = formatCurrency(vpn);
    document.getElementById('l4-tir').textContent = `${tir.toFixed(2)}%`;
}

function checkLevel4(userSaysSuccess) {
    const { isSuccess } = gameState.scenario.l4;

    if (userSaysSuccess === isSuccess) {
        gameState.score += 1000;
        updateHUD();
        showScreen('victory');
        document.getElementById('final-score-value').textContent = gameState.score;
        hud.container.classList.add('hidden');
    } else {
        handleMistake("Decisión Errónea", "Tu análisis financiero fue incorrecto. Revisa el VPN y la TIR.");
    }
}

/* CORE FUNCTIONS */
function levelComplete() {
    if (gameState.currentLevel < gameState.maxLevels) {
        gameState.currentLevel++;
        updateHUD();

        if (gameState.currentLevel === 2) {
            showScreen('l2');
            initLevel2();
        } else if (gameState.currentLevel === 3) {
            showScreen('l3');
            initLevel3();
        } else if (gameState.currentLevel === 4) {
            showScreen('l4');
            initLevel4();
        }
    } else {
        showScreen('victory');
    }
}

function handleMistake(title, msg) {
    gameState.lives--;
    updateHUD();

    if (gameState.lives <= 0) {
        showScreen('gameover');
        hud.container.classList.add('hidden');
    } else {
        showModal(title, msg);
    }
}

function updateHUD() {
    hud.level.textContent = `${gameState.currentLevel}/${gameState.maxLevels}`;
    hud.score.textContent = gameState.score;

    // Update hearts
    let hearts = '';
    for (let i = 0; i < gameState.lives; i++) hearts += '❤️';
    hud.lives.innerHTML = hearts;
}

function showScreen(screenName) {
    // Hide all
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    Object.values(screens).forEach(el => el.classList.remove('active'));

    // Show target
    screens[screenName].classList.remove('hidden');
    // Small delay to allow CSS animation to trigger if display:none was just removed
    setTimeout(() => screens[screenName].classList.add('active'), 10);
}

function showModal(title, text) {
    modal.title.textContent = title;
    modal.msg.textContent = text;
    modal.el.classList.remove('hidden');
}

function hideModal() {
    modal.el.classList.add('hidden');
}

function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}
