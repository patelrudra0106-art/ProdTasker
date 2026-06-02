/* notifications.js - S1N Industrial Theme Update (Settings Aware) */

// --- STATE ---
let notificationHistory = JSON.parse(localStorage.getItem('auraNotificationHistory')) || [];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // Create container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        // Position: Top Center, z-index high (above modals)
        container.className = 'fixed top-6 left-0 right-0 z-[400] flex flex-col items-center gap-2 pointer-events-none px-4';
        document.body.appendChild(container);
    }
});

// --- MAIN SHOW FUNCTION ---
window.showNotification = function(title, message, type = 'info') {
    // 1. CHECK SETTINGS
    // If global settings exist and notifications are disabled, stop here.
    if (window.appSettings && window.appSettings.notifications === false) {
        return;
    }

    const container = document.getElementById('notification-container');
    if (!container) return;

    // 2. Save to History
    saveToHistory(title, message, type);

    // 3. Create Element
    const notif = document.createElement('div');
    
    let iconName = 'bell';
    if (type === 'success') iconName = 'check';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'x-circle';

    // Industrial Style Card
    notif.className = `pointer-events-auto relative w-full max-w-sm p-4 bg-main text-body rounded-lg shadow-2xl flex gap-4 items-start transform transition-all cursor-pointer animate-slide-in-top border border-transparent hover:border-border`;
    
    notif.innerHTML = `
        <div class="mt-0.5 shrink-0">
            <i data-lucide="${iconName}" class="w-5 h-5"></i>
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm uppercase tracking-wider leading-none mb-1">${title}</h4>
            <p class="text-xs font-medium opacity-80 leading-relaxed break-words">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="absolute top-2 right-2 opacity-50 hover:opacity-100 p-1">
            <i data-lucide="x" class="w-3 h-3"></i>
        </button>
    `;

    container.appendChild(notif);
    if (window.lucide) lucide.createIcons();

    // 4. Audio Feedback (Mechanical Click)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2345/2345-preview.mp3'); 
    audio.volume = 0.2;
    audio.play().catch(()=>{});

    // 5. Swipe/Click to Dismiss
    notif.addEventListener('click', (e) => {
        // Don't trigger if clicking the close button specifically (handled inline)
        if(e.target.closest('button')) return;
        dismissNotification(notif);
    });

    // 6. Auto Remove (4 Seconds)
    setTimeout(() => {
        dismissNotification(notif);
    }, 4000);
};

function dismissNotification(el) {
    if(!el) return;
    // Animation out
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px) scale(0.95)';
    setTimeout(() => { if(el.parentNode) el.remove(); }, 300);
}

// --- HISTORY LOGIC ---
function saveToHistory(title, message, type) {
    const entry = {
        id: Date.now(),
        title,
        message,
        type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
    };
    notificationHistory.unshift(entry);
    // Keep last 50 logs
    if (notificationHistory.length > 50) notificationHistory.pop();
    localStorage.setItem('auraNotificationHistory', JSON.stringify(notificationHistory));
}

// Open the history modal
window.openNotificationHistory = function() {
    const modal = document.getElementById('notification-history-modal');
    const list = document.getElementById('notification-history-list');
    
    // Close settings if open
    if(window.closeFullSettings) window.closeFullSettings();
    
    if(modal) modal.classList.remove('hidden');
    if(!list) return;
    
    renderHistoryList(list);
};

function renderHistoryList(container) {
    container.innerHTML = '';

    if (notificationHistory.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-muted">
                <i data-lucide="bell-off" class="w-8 h-8 mb-2 opacity-50"></i>
                <p class="text-xs uppercase font-bold tracking-wider">No Logs Available</p>
            </div>
        `;
    } else {
        notificationHistory.forEach(item => {
            let iconName = 'bell';
            if (item.type === 'success') iconName = 'check';
            if (item.type === 'warning') iconName = 'alert-triangle';

            const div = document.createElement('div');
            div.className = "flex gap-3 p-3 border-b border-border last:border-0 hover:bg-input transition-colors rounded-lg";
            div.innerHTML = `
                <div class="mt-0.5 text-main">
                    <i data-lucide="${iconName}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                        <p class="text-xs font-bold uppercase text-main truncate pr-2">${item.title}</p>
                        <span class="text-[9px] text-muted font-mono whitespace-nowrap opacity-70">${item.time}</span>
                    </div>
                    <p class="text-xs text-muted mt-0.5 line-clamp-2">${item.message}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }
    if(window.lucide) lucide.createIcons();
}

window.closeNotificationHistory = function() {
    const modal = document.getElementById('notification-history-modal');
    if(modal) modal.classList.add('hidden');
};

window.clearAllNotifications = function() {
    if(notificationHistory.length === 0) return;
    
    if(confirm("Permanently delete system logs?")) {
        notificationHistory = [];
        localStorage.setItem('auraNotificationHistory', JSON.stringify([]));
        
        const list = document.getElementById('notification-history-list');
        if(list) renderHistoryList(list);
    }
};
