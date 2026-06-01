/* tasks.js - S1N Task Management & Logic (Notifications Enabled) */

let currentFilter = 'all';

// --- INITIALIZATION ---
window.loadTasks = function() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const guestKey = 'auraTasks_guest';
    const userKey = user ? `auraTasks_${user.name}` : guestKey;
    
    // Load from LocalStorage
    window.tasks = JSON.parse(localStorage.getItem(userKey)) || [];
    
    // Render
    renderTasks();
    
    // --- LISTENER SETUP ---
    const input = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const form = document.getElementById('task-form');

    // 1. Input Listener
    if (input && addBtn) {
        // Ensure button state is correct immediately on load
        addBtn.disabled = input.value.trim() === '';

        input.oninput = (e) => {
            addBtn.disabled = e.target.value.trim() === '';
        };
    }

    // 2. Form Submit
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            addNewTask();
        };
    }

    // Setup Filter Buttons
    setupFilterButtons();
};

// --- CORE FUNCTIONS ---
function addNewTask() {
    const input = document.getElementById('task-input');
    const dateInput = document.getElementById('date-input');
    const timeInput = document.getElementById('time-input');
    const text = input.value.trim();
    
    if (!text) return;

    // --- DAILY LIMIT CHECK ---
    const todayStr = new Date().toLocaleDateString();
    
    // Count tasks created today
    const tasksToday = window.tasks.filter(t => {
        const taskDate = new Date(t.createdAt).toLocaleDateString();
        return taskDate === todayStr;
    }).length;

    if (tasksToday >= 5) {
        if(window.showNotification) {
            window.showNotification("LIMIT REACHED", "Max 5 protocols per day.", "warning");
        } else {
            alert("Daily Limit Reached: Max 5 protocols per day.");
        }
        return; 
    }

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: Date.now(),
        date: dateInput.value || null,
        time: timeInput.value || null
    };

    window.tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    // Reset Form
    input.value = '';
    dateInput.value = '';
    timeInput.value = '';
    document.getElementById('add-btn').disabled = true;

    // Notification Feedback
    if(window.showNotification) window.showNotification("PROTOCOL ADDED", `Task queued (${tasksToday + 1}/5).`, "info");
    
    // Check "Initiation" achievement immediately
    if(window.checkAchievements) window.checkAchievements();
}

window.toggleTask = function(id) {
    const task = window.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        
        if (task.completed) {
            // --- TASK COMPLETE (+10) ---
            task.completedAt = Date.now();
            
            // Trigger Gamification
            if(window.addPoints) window.addPoints(10, "Task Complete");
            if(window.updateStreak) window.updateStreak();
            
            // Audio Feedback
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); 
            audio.volume = 0.2;
            audio.play().catch(()=>{});
        } else {
            // --- TASK UNDONE (-10) ---
            task.completedAt = null;
            
            // Deduct points if task is unchecked to prevent farming
            if(window.addPoints) window.addPoints(-10, "Task Undone");
        }
        
        saveTasks();
        renderTasks();
    }
};

window.deleteTask = function(id) {
    if(confirm("Delete this protocol?")) {
        // Check if task was completed before deleting
        // If they completed it (+10) and delete it, we must take the points back
        const task = window.tasks.find(t => t.id === id);
        
        if (task && task.completed && window.addPoints) {
            window.addPoints(-10, "Task Deleted");
        }

        window.tasks = window.tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
};

function saveTasks() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const key = user ? `auraTasks_${user.name}` : 'auraTasks_guest';
    localStorage.setItem(key, JSON.stringify(window.tasks));
}

// --- RENDERING ---
function renderTasks() {
    const list = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    if (!list) return;

    list.innerHTML = '';

    // Filter Logic
    let filtered = window.tasks;
    if (currentFilter === 'active') filtered = window.tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') filtered = window.tasks.filter(t => t.completed);

    if (filtered.length === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
    } else {
        if(emptyState) emptyState.classList.add('hidden');
        
        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = `flex items-center gap-3 p-4 rounded-2xl border transition-all animate-slide-in group ${task.completed ? 'bg-input border-transparent opacity-60' : 'bg-card border-border hover:border-main'}`;
            
            // Deadline Logic
            let deadlineHtml = '';
            if (task.date) {
                const today = new Date().toISOString().split('T')[0];
                const isLate = !task.completed && task.date < today;
                
                // Format Date/Time
                let displayDate = task.date;
                if(task.date === today) displayDate = 'Today';
                
                let displayTime = task.time ? ` @ ${formatTime(task.time)}` : '';

                deadlineHtml = `
                    <span class="text-[10px] font-bold font-mono uppercase tracking-wider mt-1 block ${isLate ? 'text-rose-500' : 'text-muted'}">
                        ${isLate ? '<i data-lucide="alert-circle" class="w-3 h-3 inline mb-0.5"></i> ' : ''}
                        ${displayDate}${displayTime}
                    </span>
                `;
            }

            li.innerHTML = `
                <button onclick="toggleTask(${task.id})" class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-main border-main text-body' : 'border-border text-transparent hover:border-main'}">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </button>
                
                <div class="flex-1 min-w-0 cursor-pointer" onclick="setFocusTask('${task.text.replace(/'/g, "\\'")}')">
                    <p class="font-bold text-sm truncate ${task.completed ? 'line-through text-muted' : 'text-main'}">${task.text}</p>
                    ${deadlineHtml}
                </div>

                <button onclick="deleteTask(${task.id})" class="shrink-0 p-2 text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            list.appendChild(li);
        });
    }
    if(window.lucide) lucide.createIcons();
}

// --- FILTER BUTTON LOGIC ---
function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Styles
    const activeClass = "filter-btn active text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-main bg-main text-body transition-colors";
    const inactiveClass = "filter-btn text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-transparent text-muted hover:text-main transition-colors";

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update State
            currentFilter = btn.dataset.filter;
            
            // Update UI Colors
            buttons.forEach(b => b.className = inactiveClass); // Reset all
            btn.className = activeClass; // Set active

            renderTasks();
        });
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

// Auto-load on script run if DOM is ready
if(document.readyState === 'complete') {
    window.loadTasks();
} else {
    document.addEventListener('DOMContentLoaded', window.loadTasks);
}
