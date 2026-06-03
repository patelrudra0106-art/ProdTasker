/* recurring-tasks.js - S1N Recurring Task Management */

// --- CONFIG ---
window.RECURRENCE_TYPES = {
    none: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
};

// --- STATE ---
let recurringTemplates = JSON.parse(localStorage.getItem('auraRecurringTasks')) || [];

// --- CREATE RECURRING TASK ---
window.createRecurringTask = function(taskText, category, dueDate, recurrenceType, notesData = '') {
    const template = {
        id: Date.now(),
        text: taskText,
        category: category || 'general',
        dueDate: dueDate,
        recurrence: recurrenceType,
        notes: notesData,
        createdAt: new Date().toISOString(),
        isActive: true,
        nextDueDate: dueDate
    };
    
    recurringTemplates.push(template);
    saveRecurringTasks();
    
    if(window.showNotification) {
        window.showNotification("TEMPLATE CREATED", `${taskText} (${RECURRENCE_TYPES[recurrenceType]})`, "success");
    }
    
    // Auto-generate first instance
    if(recurrenceType !== 'none') {
        addTaskFromTemplate(template);
    }
    
    return template;
};

// --- ADD TASK FROM TEMPLATE ---
function addTaskFromTemplate(template) {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (!user) return;
    
    const newTask = {
        id: Date.now(),
        text: template.text,
        category: template.category,
        completed: false,
        dueDate: template.nextDueDate,
        dueTime: '09:00',
        isRecurring: true,
        templateId: template.id,
        createdAt: new Date().toISOString()
    };
    
    if (!user.tasks) user.tasks = [];
    user.tasks.push(newTask);
    localStorage.setItem('auraUser', JSON.stringify(user));
    
    if(window.loadTasks) window.loadTasks();
}

// --- GENERATE NEXT OCCURRENCE ---
window.generateNextOccurrence = function(templateId) {
    const template = recurringTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    const currentDue = new Date(template.nextDueDate);
    let nextDue = new Date(currentDue);
    
    switch(template.recurrence) {
        case 'daily':
            nextDue.setDate(nextDue.getDate() + 1);
            break;
        case 'weekly':
            nextDue.setDate(nextDue.getDate() + 7);
            break;
        case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
    }
    
    template.nextDueDate = nextDue.toISOString().split('T')[0];
    saveRecurringTasks();
    addTaskFromTemplate(template);
};

// --- DELETE RECURRING TEMPLATE ---
window.deleteRecurringTemplate = function(templateId) {
    recurringTemplates = recurringTemplates.filter(t => t.id !== templateId);
    saveRecurringTasks();
    
    if(window.showNotification) {
        window.showNotification("TEMPLATE REMOVED", "Recurring task deleted.", "info");
    }
};

// --- TOGGLE RECURRING STATUS ---
window.toggleRecurringTemplate = function(templateId) {
    const template = recurringTemplates.find(t => t.id === templateId);
    if(template) {
        template.isActive = !template.isActive;
        saveRecurringTasks();
    }
};

// --- LIST RECURRING TASKS UI ---
window.renderRecurringTasksList = function() {
    const container = document.getElementById('recurring-tasks-container');
    if (!container) return;
    
    if (recurringTemplates.length === 0) {
        container.innerHTML = '<p class="text-center text-muted text-sm py-6">No recurring tasks yet.</p>';
        return;
    }
    
    let html = '<div class="space-y-2">';
    
    recurringTemplates.forEach(template => {
        const icon = {
            daily: '📅',
            weekly: '📆',
            monthly: '📅',
            none: '◇'
        }[template.recurrence] || '◇';
        
        html += `
            <div class="card-s1n p-4 flex justify-between items-start border-l-4 border-main">
                <div class="flex-1">
                    <p class="text-sm font-bold text-main">${icon} ${template.text}</p>
                    <div class="flex gap-2 mt-2">
                        <span class="text-[10px] font-bold uppercase bg-input px-2 py-1 rounded text-muted">
                            ${RECURRENCE_TYPES[template.recurrence]}
                        </span>
                        <span class="text-[10px] font-bold uppercase bg-input px-2 py-1 rounded text-muted">
                            ${template.category}
                        </span>
                    </div>
                    <p class="text-[10px] text-muted mt-2">Next: ${template.nextDueDate}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleRecurringTemplate(${template.id})" class="p-2 hover:bg-input rounded transition-colors">
                        <i data-lucide="${template.isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteRecurringTemplate(${template.id})" class="p-2 hover:text-rose-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    if(window.lucide) lucide.createIcons();
};

// --- MODAL UI FOR CREATING RECURRING TASK ---
window.openRecurringTaskModal = function() {
    const modal = document.getElementById('recurring-task-modal');
    if(!modal) return;
    
    modal.classList.remove('hidden');
};

window.closeRecurringTaskModal = function() {
    const modal = document.getElementById('recurring-task-modal');
    if(modal) modal.classList.add('hidden');
};

window.submitRecurringTask = function() {
    const text = document.getElementById('recurring-task-input').value.trim();
    const category = document.getElementById('recurring-category').value;
    const dueDate = document.getElementById('recurring-due-date').value;
    const recurrence = document.getElementById('recurring-type').value;
    const notes = document.getElementById('recurring-notes').value;
    
    if (!text || !dueDate) {
        if(window.showNotification) {
            window.showNotification("ERROR", "Task & date required.", "error");
        }
        return;
    }
    
    window.createRecurringTask(text, category, dueDate, recurrence, notes);
    
    // Reset form
    document.getElementById('recurring-task-input').value = '';
    document.getElementById('recurring-notes').value = '';
    document.getElementById('recurring-category').value = 'general';
    document.getElementById('recurring-type').value = 'none';
    
    window.closeRecurringTaskModal();
    window.renderRecurringTasksList();
};

// --- SAVE/LOAD ---
function saveRecurringTasks() {
    localStorage.setItem('auraRecurringTasks', JSON.stringify(recurringTemplates));
}

// --- INIT ---
window.initRecurringTasks = function() {
    recurringTemplates = JSON.parse(localStorage.getItem('auraRecurringTasks')) || [];
    window.renderRecurringTasksList();
};

document.addEventListener('DOMContentLoaded', () => {
    if(window.initRecurringTasks) window.initRecurringTasks();
});
