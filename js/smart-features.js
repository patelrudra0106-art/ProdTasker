/* smart-features.js - S1N Smart Features & UX Enhancements */

// --- UNDO STACK ---
let undoStack = JSON.parse(localStorage.getItem('auraUndoStack')) || [];
const MAX_UNDO_ITEMS = 20;

// --- PUSH TO UNDO STACK ---
window.pushUndo = function(action, data, label = '') {
    const entry = {
        id: Date.now(),
        action: action,
        data: JSON.parse(JSON.stringify(data)),
        label: label,
        timestamp: new Date().toISOString()
    };
    
    undoStack.unshift(entry);
    if (undoStack.length > MAX_UNDO_ITEMS) {
        undoStack.pop();
    }
    
    saveUndoStack();
    updateUndoUI();
};

// --- UNDO LAST ACTION ---
window.undoLastAction = function() {
    if (undoStack.length === 0) {
        if(window.showNotification) {
            window.showNotification("UNDO", "Nothing to undo.", "info");
        }
        return;
    }
    
    const lastAction = undoStack.shift();
    
    switch(lastAction.action) {
        case 'delete_task':
            // Restore deleted task
            const user = JSON.parse(localStorage.getItem('auraUser'));
            if (!user.tasks) user.tasks = [];
            user.tasks.push(lastAction.data);
            localStorage.setItem('auraUser', JSON.stringify(user));
            if(window.loadTasks) window.loadTasks();
            break;
        case 'complete_task':
            // Uncheck task
            const u = JSON.parse(localStorage.getItem('auraUser'));
            const task = u.tasks.find(t => t.id === lastAction.data.id);
            if(task) {
                task.completed = false;
                localStorage.setItem('auraUser', JSON.stringify(u));
                if(window.loadTasks) window.loadTasks();
            }
            break;
    }
    
    saveUndoStack();
    updateUndoUI();
    
    if(window.showNotification) {
        window.showNotification("UNDO", `${lastAction.label}`, "success");
    }
};

// --- TASK RECOMMENDATIONS ---
window.getTaskRecommendations = function() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (!user || !user.tasks) return [];
    
    const recommendations = [];
    const now = new Date();
    
    // 1. Overdue Tasks
    user.tasks.filter(t => !t.completed).forEach(task => {
        if (task.dueDate && new Date(task.dueDate) < now) {
            recommendations.push({
                type: 'overdue',
                task: task,
                priority: 'critical',
                message: `This task is overdue!`
            });
        }
    });
    
    // 2. Due Today
    const today = now.toISOString().split('T')[0];
    user.tasks.filter(t => !t.completed && t.dueDate === today).forEach(task => {
        recommendations.push({
            type: 'due_today',
            task: task,
            priority: 'high',
            message: `Due today`
        });
    });
    
    // 3. Tasks without category
    user.tasks.filter(t => !t.completed && !t.category).forEach(task => {
        recommendations.push({
            type: 'uncategorized',
            task: task,
            priority: 'low',
            message: `Add a category`
        });
    });
    
    return recommendations;
};

// --- RENDER RECOMMENDATIONS ---
window.renderRecommendations = function() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    const recs = getTaskRecommendations();
    
    if (recs.length === 0) {
        container.innerHTML = '<p class="text-center text-muted text-xs py-4">All caught up! 🎉</p>';
        return;
    }
    
    let html = '<div class="space-y-2">';
    
    recs.slice(0, 5).forEach(rec => {
        const priorityColors = {
            critical: 'border-rose-500 bg-rose-50 dark:bg-rose-900/10',
            high: 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
            medium: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
            low: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
        };
        
        const icon = {
            overdue: '⚠️',
            due_today: '📅',
            uncategorized: '🏷️',
            break_time: '☕'
        }[rec.type] || '💡';
        
        html += `
            <div class="border-l-4 ${priorityColors[rec.priority]} p-3 rounded">
                <p class="text-xs font-bold text-main">${icon} ${rec.message}</p>
                ${rec.task ? `<p class="text-[10px] text-muted mt-1">${rec.task.text}</p>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// --- GLOBAL KEYBOARD SHORTCUT HANDLER ---
document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.matches('input, textarea')) {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter submits form
            const form = e.target.closest('form');
            if(form) form.submit();
        }
        return;
    }
    
    // Shortcuts
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        document.getElementById('task-input')?.focus();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 's') {
        e.preventDefault();
        if(window.openFullSettings) window.openFullSettings();
    }
    
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        window.undoLastAction();
    }
    
    if (e.key === 'Escape') {
        e.preventDefault();
        closeAllModals();
    }
    
    // Number keys for view switching
    if (e.key >= '1' && e.key <= '5') {
        const views = ['tasks', 'focus', 'reports', 'contest', 'shop'];
        if(window.switchView) window.switchView(views[e.key - 1]);
    }
});

// --- CLOSE ALL MODALS ---
function closeAllModals() {
    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });
}

// --- TASK DIFFICULTY PREDICTOR ---
window.predictTaskDifficulty = function(taskText) {
    let difficulty = 'medium';
    const indicators = {
        hard: ['complex', 'difficult', 'urgent', 'critical', 'emergency', '!!!'],
        easy: ['simple', 'quick', 'brief', 'short', 'fast']
    };
    
    const text = taskText.toLowerCase();
    
    if (indicators.hard.some(word => text.includes(word))) {
        difficulty = 'hard';
    } else if (indicators.easy.some(word => text.includes(word))) {
        difficulty = 'easy';
    }
    
    return difficulty;
};

// --- UPDATE UNDO UI ---
function updateUndoUI() {
    const btn = document.getElementById('undo-btn');
    if (btn) {
        if (undoStack.length > 0) {
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.title = `Undo: ${undoStack[0].label}`;
        } else {
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.title = 'Nothing to undo';
        }
    }
}

// --- SAVE/LOAD ---
function saveUndoStack() {
    localStorage.setItem('auraUndoStack', JSON.stringify(undoStack));
}

window.initSmartFeatures = function() {
    undoStack = JSON.parse(localStorage.getItem('auraUndoStack')) || [];
    updateUndoUI();
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.initSmartFeatures) window.initSmartFeatures();
});
