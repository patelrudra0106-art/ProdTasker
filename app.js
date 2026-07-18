/* app.js - ProdTasker Global Logic & Theme System (Command Center Update) */

// --- GLOBAL SETTINGS STATE ---
window.appSettings = {
    theme: 'light',
    timeFormat: '12h',
    notifications: true,
    language: 'en'
};

// --- THEME CONTROL ---
window.setTheme = function(mode) {
    const btnLight = document.getElementById('theme-btn-light');
    const btnDark = document.getElementById('theme-btn-dark');
    
    // 1. Apply Class to HTML
    if (mode === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 2. Save Preference
    window.appSettings.theme = mode;
    saveAppSettings();

    // 3. Update Button Visuals (Solid Black/White for active)
    if (btnLight && btnDark) {
        if (mode === 'dark') {
            btnDark.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-main text-body shadow-sm";
            btnLight.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-transparent text-muted hover:text-main";
        } else {
            btnLight.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-main text-body shadow-sm";
            btnDark.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-transparent text-muted hover:text-main";
        }
    }
    
    // Audio Feedback
    playClickSound();
};

// --- SETTINGS LOGIC ---

window.openFullSettings = function() {
    const overlay = document.getElementById('settings-overlay');
    const usernameDisplay = document.getElementById('settings-username');
    
    // 1. Load User Identity
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (usernameDisplay) {
        usernameDisplay.textContent = user ? user.name : 'Guest user';
    }

    // 2. Load Timer Values
    const timerSettings = JSON.parse(localStorage.getItem('auraTimerSettings')) || { work: 25, short: 5, long: 15 };
    const inFocus = document.getElementById('setting-focus');
    const inShort = document.getElementById('setting-short');
    const inLong = document.getElementById('setting-long');
    
    if(inFocus) inFocus.value = timerSettings.work;
    if(inShort) inShort.value = timerSettings.short;
    if(inLong) inLong.value = timerSettings.long;

    // 3. Sync UI with Current State
    syncSettingsUI();

    // 4. Show Overlay
    if (overlay) overlay.classList.remove('hidden');
};

window.closeFullSettings = function() {
    const overlay = document.getElementById('settings-overlay');
    // Close password accordion if open
    const passForm = document.getElementById('change-pass-form');
    if(passForm) passForm.classList.add('hidden');
    
    if (overlay) overlay.classList.add('hidden');
};

// Toggle 12h / 24h
window.setTimeFormat = function(fmt) {
    window.appSettings.timeFormat = fmt;
    saveAppSettings();
    syncSettingsUI();
    // Reload tasks to reflect new time format
    if(window.loadTasks) window.loadTasks(); 
    // Reload Chat if open to fix timestamps immediately
    if(window.currentChatFriend && window.loadChatHistory) {
         const user = JSON.parse(localStorage.getItem('auraUser'));
         window.loadChatHistory(user.name, window.currentChatFriend);
    }
};

// Toggle Notifications
window.toggleNotifications = function() {
    window.appSettings.notifications = !window.appSettings.notifications;
    saveAppSettings();
    syncSettingsUI();
    
    if(window.showNotification && window.appSettings.notifications) {
        window.showNotification("System Active", "Notifications enabled.", "success");
    }
};

// Update Language
window.updateGeneralSettings = function() {
    const langSelect = document.getElementById('setting-lang');
    if(langSelect) {
        window.appSettings.language = langSelect.value;
        saveAppSettings();
    }
};

// Auto-Save Timer Settings (Called on input change)
window.saveTimerSettings = function() {
    const newWork = parseInt(document.getElementById('setting-focus').value) || 25;
    const newShort = parseInt(document.getElementById('setting-short').value) || 5;
    const newLong = parseInt(document.getElementById('setting-long').value) || 15;
    
    const settings = { work: newWork, short: newShort, long: newLong };
    localStorage.setItem('auraTimerSettings', JSON.stringify(settings));
    
    // Notify Pomodoro Module
    if(window.refreshTimerSettings) window.refreshTimerSettings();
};

// Helper: Update all visual toggles/buttons based on state
function syncSettingsUI() {
    // 1. Time Format Buttons
    const btn12 = document.getElementById('btn-12h');
    const btn24 = document.getElementById('btn-24h');
    if(btn12 && btn24) {
        if(window.appSettings.timeFormat === '24h') {
            btn24.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-main text-body shadow-sm";
            btn12.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-transparent text-muted hover:text-main";
        } else {
            btn12.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-main text-body shadow-sm";
            btn24.className = "px-3 py-1 text-[10px] font-bold rounded-md transition-all bg-transparent text-muted hover:text-main";
        }
    }

    // 2. Notification Toggle Knob
    const knob = document.getElementById('knob-notif');
    const toggleBtn = document.getElementById('btn-notif-toggle');
    if(knob && toggleBtn) {
        if(window.appSettings.notifications) {
            toggleBtn.className = "w-10 h-5 rounded-full bg-main relative transition-colors";
            knob.style.transform = "translateX(20px)";
        } else {
            toggleBtn.className = "w-10 h-5 rounded-full bg-border relative transition-colors";
            knob.style.transform = "translateX(0px)";
        }
    }

    // 3. Language Select
    const langSelect = document.getElementById('setting-lang');
    if(langSelect) langSelect.value = window.appSettings.language;

    // 4. Theme Buttons
    // (Re-run setTheme visuals just in case)
    window.setTheme(window.appSettings.theme);
}

function saveAppSettings() {
    localStorage.setItem('s1nSettings', JSON.stringify(window.appSettings));
}

function loadAppSettings() {
    const saved = JSON.parse(localStorage.getItem('s1nSettings'));
    if(saved) {
        window.appSettings = { ...window.appSettings, ...saved };
    } else {
        // Migration: Check old 'auraTheme'
        const oldTheme = localStorage.getItem('auraTheme');
        if(oldTheme) window.appSettings.theme = oldTheme;
    }
}

// --- JUICE SYSTEM (Visual Feedback) ---
window.triggerJuice = function(element, points) {
    if (!element) return;

    // 1. Shake Animation
    element.classList.remove('animate-shake');
    void element.offsetWidth; 
    element.classList.add('animate-shake');

    // 2. Flash Effect
    const flash = document.createElement('div');
    flash.className = "absolute inset-0 bg-main opacity-20 rounded-xl pointer-events-none z-10 transition-opacity duration-300";
    
    const style = window.getComputedStyle(element);
    if(style.position === 'static') element.style.position = 'relative'; 
    
    element.appendChild(flash);
    setTimeout(() => {
        flash.classList.add('opacity-0');
        setTimeout(() => flash.remove(), 300);
    }, 50);

    // 3. Floating Text (XP Popup)
    if (points > 0) {
        const rect = element.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = "xp-popup"; 
        popup.textContent = `+${points}`;
        
        popup.style.position = 'fixed';
        popup.style.left = `${rect.left + rect.width / 2}px`;
        popup.style.top = `${rect.top}px`;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }
};

function playClickSound() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
    audio.volume = 0.1;
    audio.play().catch(()=>{});
}

// --- GLOBAL INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Settings
    loadAppSettings();

    // 2. Apply Theme
    // Check LocalStorage -> System Preference -> Default to Light
    if(!localStorage.getItem('s1nSettings') && !localStorage.getItem('auraTheme')) {
        // First run detection
        if(window.matchMedia('(prefers-color-scheme: dark)').matches) {
            window.appSettings.theme = 'dark';
        }
    }
    window.setTheme(window.appSettings.theme);

    // 3. PWA Install Prompt Handler
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
    });

    // 4. Magnetic Button Setup
    const setupMagneticButtons = () => {
        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    };
    setupMagneticButtons();
    
    // Allow re-initialization if new buttons are added dynamically
    window.initMagneticButtons = setupMagneticButtons;
});
