/* pomodoro.js - S1N Industrial Theme (Layout Update) */

// --- POMODORO CONFIG ---
let settings = JSON.parse(localStorage.getItem('auraTimerSettings')) || {
    work: 25,
    short: 5,
    long: 15
};

// MODES CONFIGURATION
let MODES = {
    work: { time: settings.work * 60, label: 'FOCUS PROTOCOL' },
    short: { time: settings.short * 60, label: 'SHORT RECHARGE' },
    long: { time: settings.long * 60, label: 'LONG RECHARGE' },
    stopwatch: { time: 0, label: 'FLOW STATE' } // Time 0 = Infinite start
};

// --- SOUNDS SYSTEM ---
let SOUND_URLS = {}; 
let ambientAudio = new Audio();
ambientAudio.loop = true;

// --- STATE ---
let timeLeft = MODES.work.time;
let currentMode = 'work';
let isRunning = false;
let timerInterval = null;
let stats = JSON.parse(localStorage.getItem('auraStats')) || { sessions: 0, minutes: 0 };
let history = JSON.parse(localStorage.getItem('auraHistory')) || [];
let currentFocusTask = null;

// --- ELEMENTS ---
const timerDisplay = document.getElementById('timer-display');
const timerStatus = document.getElementById('timer-status');
const toggleBtn = document.getElementById('timer-toggle');
const resetBtn = document.getElementById('timer-reset');
const progressRing = document.getElementById('progress-ring');
const soundSelector = document.getElementById('sound-selector');
const activeTaskDisplay = document.getElementById('active-task-display');
const focusTaskText = document.getElementById('focus-task-text');

// Layout Elements
const subModesContainer = document.getElementById('timer-submodes');
const switchPomodoro = document.getElementById('switch-pomodoro');
const switchStopwatch = document.getElementById('switch-stopwatch');

// Dynamic Mode Buttons
const modeBtns = {
    work: document.getElementById('mode-work'),
    short: document.getElementById('mode-short'),
    long: document.getElementById('mode-long')
};

// --- CONSTANTS ---
const CIRCLE_RADIUS = 118;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// --- INIT ---
function initPomodoro() {
    if(progressRing) {
        progressRing.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
        progressRing.style.strokeDashoffset = 0;
    }
    
    // Check if we switched settings, refresh mode times
    MODES.work.time = settings.work * 60;
    MODES.short.time = settings.short * 60;
    MODES.long.time = settings.long * 60;

    updateDisplay();
    renderHistory();
    setupModeListeners();
    setupSoundSystem();
    
    // Default Visual State
    updateLayoutState(currentMode);
}

// --- SOUND SYSTEM LOGIC ---
function setupSoundSystem() {
    if(window.firebase) {
        firebase.database().ref('system/sounds').on('value', (snapshot) => {
            refreshSoundDropdown(snapshot.val());
        });
    } else {
        refreshSoundDropdown(null);
    }

    if(soundSelector) {
        soundSelector.addEventListener('change', () => {
            const val = soundSelector.value;
            localStorage.setItem('auraSoundPref', val);
            if(isRunning && val !== 'none') playAudio(val);
            else if (val === 'none') ambientAudio.pause();
        });
    }
}

function refreshSoundDropdown(customSounds) {
    if (!soundSelector) return;
    const savedPref = localStorage.getItem('auraSoundPref') || 'none';
    
    soundSelector.innerHTML = '';
    SOUND_URLS = {}; 

    const silentOpt = document.createElement('option');
    silentOpt.value = 'none';
    silentOpt.textContent = 'Silent Mode';
    soundSelector.appendChild(silentOpt);

    if (customSounds) {
        const groupCustom = document.createElement('optgroup');
        groupCustom.label = "Active Protocols";
        Object.values(customSounds).forEach(sound => {
            const id = `custom_${sound.name.replace(/\s+/g, '_')}`;
            SOUND_URLS[id] = sound.url;
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = sound.name;
            groupCustom.appendChild(opt);
        });
        soundSelector.appendChild(groupCustom);
    }

    if (SOUND_URLS[savedPref] || savedPref === 'none') {
        soundSelector.value = savedPref;
    } else {
        soundSelector.value = 'none'; 
        localStorage.setItem('auraSoundPref', 'none');
        if(isRunning) ambientAudio.pause();
    }
}

function playAudio(key) {
    if (key === 'none' || !SOUND_URLS[key]) {
        ambientAudio.pause();
        return;
    }
    if (ambientAudio.src !== SOUND_URLS[key]) {
        ambientAudio.src = SOUND_URLS[key];
        ambientAudio.volume = 0.5; 
    }
    ambientAudio.play().catch(e => console.log("Audio Blocked", e));
}

// --- CORE FUNCTIONS ---
function updateDisplay() {
    if(!timerDisplay) return;
    
    let displayStr = "";
    
    // FORMATTING: Handle HH:MM:SS for Stopwatch (Flow Mode)
    if (currentMode === 'stopwatch' && timeLeft >= 3600) {
        const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
        const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        displayStr = `${h}:${m}:${s}`;
        
        // Adjust font size for longer string
        timerDisplay.classList.replace('text-7xl', 'text-5xl');
    } else {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        displayStr = `${m}:${s}`;
        
        // Reset font size
        timerDisplay.classList.replace('text-5xl', 'text-7xl');
    }

    timerDisplay.textContent = displayStr;
    
    // RING LOGIC
    if(progressRing) {
        if (currentMode === 'stopwatch') {
            // Pulse Effect: Complete a circle every 60 seconds
            const secondsInMinute = timeLeft % 60;
            const offset = CIRCLE_CIRCUMFERENCE - (secondsInMinute / 60) * CIRCLE_CIRCUMFERENCE;
            progressRing.style.strokeDashoffset = offset;
        } else {
            // Standard Countdown Logic
            const totalTime = MODES[currentMode].time;
            const offset = CIRCLE_CIRCUMFERENCE - (timeLeft / totalTime) * CIRCLE_CIRCUMFERENCE;
            progressRing.style.strokeDashoffset = offset;
        }
    }
    
    // Update Tab Title
    document.title = isRunning ? `[${displayStr}] ${MODES[currentMode].label}` : 'S1N.';
    
    // BUTTON LOGIC
    if(currentMode === 'stopwatch' && timeLeft > 0) {
        resetBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5 text-main"></i>';
        resetBtn.title = "Finish & Save";
    } else {
        resetBtn.innerHTML = '<i data-lucide="rotate-ccw" class="w-5 h-5"></i>';
        resetBtn.title = "Reset";
    }
    if(window.lucide) lucide.createIcons();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    
    const sound = soundSelector ? soundSelector.value : 'none';
    playAudio(sound);

    toggleBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5 fill-current"></i> Pause';
    toggleBtn.classList.add('opacity-90'); 
    
    if(window.lucide) lucide.createIcons();
    
    timerStatus.textContent = currentMode === 'stopwatch' ? 'FLOW STATE' : 'EXECUTING';
    timerStatus.classList.add('animate-pulse', 'text-main');
    
    timerInterval = setInterval(() => {
        if (currentMode === 'stopwatch') {
            // COUNT UP
            timeLeft++;
            updateDisplay();
        } else {
            // COUNT DOWN
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                completeTimer();
            }
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    ambientAudio.pause();
    
    toggleBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 fill-current"></i> Start';
    toggleBtn.classList.remove('opacity-90');
    
    timerStatus.textContent = 'PAUSED';
    timerStatus.classList.remove('animate-pulse', 'text-main');
    
    if(window.lucide) lucide.createIcons();
}

function resetTimer() {
    pauseTimer();
    
    if (currentMode === 'stopwatch' && timeLeft > 0) {
        completeStopwatchSession();
    } else {
        // Hard Reset
        timeLeft = MODES[currentMode].time;
        timerStatus.textContent = 'READY';
        updateDisplay();
    }
}

function completeStopwatchSession() {
    const minutes = Math.floor(timeLeft / 60);
    
    // --- FIX: 1 Minute = 1 Point ---
    const earnedPoints = minutes * 1; 

    finishSessionLogic(minutes, earnedPoints, "Flow State");
    
    timeLeft = 0;
    timerStatus.textContent = 'READY';
    updateDisplay();
}

function completeTimer() {
    pauseTimer();
    const alarm = document.getElementById('alarm-sound');
    if(alarm) alarm.play().catch(()=>{});

    if(currentMode === 'work') {
        const minutes = MODES.work.time / 60;
        const earnedPoints = Math.floor(minutes * 2); 
        finishSessionLogic(minutes, earnedPoints, "Focus Protocol");
        timerStatus.textContent = 'COMPLETE';
    } else {
        if (window.showNotification) {
            window.showNotification("BREAK OVER", "Return to focus.", "success"); 
        }
        timerStatus.textContent = 'READY';
        timeLeft = MODES[currentMode].time; // Auto-reset break
        updateDisplay();
    }
}

function finishSessionLogic(minutes, points, label) {
    if(window.confetti) {
        confetti({ 
            particleCount: 150, 
            spread: 100, 
            origin: { y: 0.6 }, 
            colors: ['#FF4500', '#FFD700', '#32CD32', '#00BFFF', '#9400D3', '#FF1493'] 
        });
    }

    if (window.triggerJuice && timerDisplay) {
        const card = timerDisplay.closest('.card-s1n');
        window.triggerJuice(card || timerDisplay, points);
    }

    if (window.showNotification) {
        window.showNotification("SESSION LOGGED", `${label}: ${minutes}m (+${points} Credits).`, "success"); 
    }

    if(points > 0 && window.addPoints) window.addPoints(points, label);
    saveStats(minutes);
    if(window.checkAchievements) window.checkAchievements();
    
    addToHistory(minutes, currentFocusTask || label);
}

// --- LAYOUT & MODE HELPERS ---

// Updates the visual appearance of the top toggles and sub-menu visibility
function updateLayoutState(mode) {
    // 1. Top Toggle Visuals
    const activeClass = "flex-1 py-2 text-xs font-bold uppercase rounded-lg bg-card shadow-sm text-main transition-all";
    const inactiveClass = "flex-1 py-2 text-xs font-bold uppercase rounded-lg text-muted hover:text-main transition-all";

    if (mode === 'stopwatch') {
        if(switchPomodoro) switchPomodoro.className = inactiveClass;
        if(switchStopwatch) switchStopwatch.className = activeClass;
        
        // Hide Sub-buttons
        if(subModesContainer) {
            subModesContainer.classList.add('opacity-50', 'pointer-events-none');
        }
    } else {
        if(switchPomodoro) switchPomodoro.className = activeClass;
        if(switchStopwatch) switchStopwatch.className = inactiveClass;
        
        // Show Sub-buttons
        if(subModesContainer) {
            subModesContainer.classList.remove('opacity-50', 'pointer-events-none', 'hidden');
        }
    }

    // 2. Sub-Button Visuals
    Object.keys(modeBtns).forEach(k => {
        const btn = modeBtns[k];
        if(!btn) return;
        
        if(k === mode && mode !== 'stopwatch') {
            btn.className = "px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-main bg-main text-body shadow-sm transition-all";
        } else {
            btn.className = "px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-transparent text-muted hover:bg-input transition-all";
        }
    });
}

function setMode(mode) {
    resetTimer();
    currentMode = mode;
    timeLeft = MODES[mode].time;
    updateLayoutState(mode);
    updateDisplay();
}

function setupModeListeners() {
    // Top Toggles
    if(switchPomodoro) switchPomodoro.addEventListener('click', () => setMode('work'));
    if(switchStopwatch) switchStopwatch.addEventListener('click', () => setMode('stopwatch'));

    // Sub-modes
    if(modeBtns.work) modeBtns.work.addEventListener('click', () => setMode('work'));
    if(modeBtns.short) modeBtns.short.addEventListener('click', () => setMode('short'));
    if(modeBtns.long) modeBtns.long.addEventListener('click', () => setMode('long'));
}

// --- SETTINGS & HISTORY (Helpers) ---

window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    if(modal) {
        modal.classList.remove('hidden');
        document.getElementById('setting-focus').value = settings.work;
        document.getElementById('setting-short').value = settings.short;
        document.getElementById('setting-long').value = settings.long;
    }
};

window.closeSettings = function() {
    document.getElementById('settings-modal').classList.add('hidden');
};

window.saveSettings = function() {
    const newWork = parseInt(document.getElementById('setting-focus').value) || 25;
    const newShort = parseInt(document.getElementById('setting-short').value) || 5;
    const newLong = parseInt(document.getElementById('setting-long').value) || 15;
    
    settings = { work: newWork, short: newShort, long: newLong };
    localStorage.setItem('auraTimerSettings', JSON.stringify(settings));
    
    MODES.work.time = newWork * 60;
    MODES.short.time = newShort * 60;
    MODES.long.time = newLong * 60;
    
    if(currentMode !== 'stopwatch') {
        timeLeft = MODES[currentMode].time;
        updateDisplay();
    }
    closeSettings();
};

window.setFocusTask = function(taskText) {
    currentFocusTask = taskText;
    if(focusTaskText) focusTaskText.textContent = taskText;
    if(activeTaskDisplay) activeTaskDisplay.classList.remove('hidden');
    if(window.switchView) window.switchView('focus');
    setMode('work'); 
};

window.clearFocusTask = function() {
    currentFocusTask = null;
    if(activeTaskDisplay) activeTaskDisplay.classList.add('hidden');
};

function saveStats(minutesToAdd) {
    stats.sessions += 1;
    stats.minutes += minutesToAdd;
    localStorage.setItem('auraStats', JSON.stringify(stats));
    
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if(user) {
        user.totalSessions = stats.sessions;
        user.totalMinutes = stats.minutes;
        localStorage.setItem('auraUser', JSON.stringify(user));
    }
}

function addToHistory(duration, label) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = {
        id: Date.now(),
        date: now.toLocaleDateString(),
        time: timeString,
        duration: duration,
        label: label
    };
    history.unshift(entry);
    if(history.length > 30) history.pop();
    localStorage.setItem('auraHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const focusView = document.getElementById('view-focus');
    if (!focusView) return;

    let historyContainer = document.getElementById('session-history');
    if (!historyContainer) {
        historyContainer = document.createElement('div');
        historyContainer.id = 'session-history';
        historyContainer.className = "w-full mt-8 animate-fade-in pb-24";
        focusView.appendChild(historyContainer);
    }

    if (history.length === 0) {
        historyContainer.innerHTML = '';
        return;
    }

    let html = `
        <div class="flex justify-between items-center mb-4 border-t border-border pt-6">
            <h4 class="text-[10px] font-bold uppercase text-muted tracking-widest">Session Log</h4>
            <button onclick="clearHistory()" class="text-[10px] font-bold uppercase text-rose-500 hover:text-rose-400">Clear</button>
        </div>
        <div class="space-y-2">
    `;

    history.forEach(session => {
        html += `
            <div class="flex justify-between items-center p-3 border border-border rounded-xl bg-card">
                <div>
                    <p class="text-xs font-bold text-main">${session.label || 'Focus Session'}</p>
                    <p class="text-[10px] text-muted font-mono">${session.date} • ${session.time}</p>
                </div>
                <div class="font-mono font-bold text-main text-sm">
                    ${session.duration}m
                </div>
            </div>
        `;
    });

    html += `</div>`;
    historyContainer.innerHTML = html;
}

window.clearHistory = function() {
    if(confirm('Purge session logs?')) {
        history = [];
        localStorage.setItem('auraHistory', JSON.stringify(history));
        renderHistory();
    }
}

if(toggleBtn) toggleBtn.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
if(resetBtn) resetBtn.addEventListener('click', resetTimer);

// Init
if(document.readyState === 'complete') initPomodoro();
else document.addEventListener('DOMContentLoaded', initPomodoro);
