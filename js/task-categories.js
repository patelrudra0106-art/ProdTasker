/* task-categories.js - S1N Task Categories & Organization */

// --- CATEGORY CONFIG ---
window.TASK_CATEGORIES = {
    general: { label: 'General', color: '#6B7280', icon: 'circle' },
    work: { label: 'Work', color: '#3B82F6', icon: 'briefcase' },
    health: { label: 'Health', color: '#10B981', icon: 'heart' },
    learning: { label: 'Learning', color: '#F59E0B', icon: 'book' },
    personal: { label: 'Personal', color: '#8B5CF6', icon: 'user' },
    urgent: { label: 'Urgent', color: '#EF4444', icon: 'alert-circle' },
    project: { label: 'Project', color: '#6366F1', icon: 'folder' }
};

// --- CREATE CUSTOM CATEGORY ---
window.createCustomCategory = function(name, color, icon = 'circle') {
    const id = name.toLowerCase().replace(/\s+/g, '_');
    window.TASK_CATEGORIES[id] = { label: name, color, icon };
    saveCategories();
    return id;
};

// --- FILTER TASKS BY CATEGORY ---
window.filterTasksByCategory = function(categoryId) {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (!user || !user.tasks) return [];
    
    return user.tasks.filter(task => (task.category || 'general') === categoryId);
};

// --- GET CATEGORY STATS ---
window.getCategoryStats = function() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (!user || !user.tasks) return {};
    
    const stats = {};
    Object.keys(window.TASK_CATEGORIES).forEach(catId => {
        const tasks = user.tasks.filter(t => (t.category || 'general') === catId);
        stats[catId] = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length
        };
    });
    return stats;
};

// --- RENDER CATEGORY BADGE ---
window.getCategoryBadgeHTML = function(categoryId) {
    const cat = window.TASK_CATEGORIES[categoryId || 'general'];
    if (!cat) return '';
    
    return `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider" 
              style="background-color: ${cat.color}20; color: ${cat.color}; border: 1px solid ${cat.color}40">
            <i data-lucide="${cat.icon}" class="w-3 h-3"></i>
            ${cat.label}
        </span>
    `;
};

// --- CATEGORY OVERVIEW DASHBOARD ---
window.renderCategoryOverview = function() {
    const container = document.getElementById('category-overview');
    if (!container) return;
    
    const stats = window.getCategoryStats();
    let html = '<div class="grid grid-cols-2 gap-3 mb-6">';
    
    Object.entries(stats).forEach(([catId, stat]) => {
        const cat = window.TASK_CATEGORIES[catId];
        if (stat.total === 0) return;
        
        const completionRate = Math.round((stat.completed / stat.total) * 100);
        
        html += `
            <div class="card-s1n p-4 border-l-4" style="border-left-color: ${cat.color}">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-main">${cat.label}</span>
                    <span class="text-[10px] font-bold text-muted">${completionRate}%</span>
                </div>
                <div class="w-full h-2 bg-input rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all" 
                         style="background-color: ${cat.color}; width: ${completionRate}%"></div>
                </div>
                <div class="flex justify-between mt-2 text-[10px] text-muted">
                    <span>${stat.completed}/${stat.total} done</span>
                    <span>${stat.pending} pending</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// --- PRIORITY LEVELS ---
window.PRIORITY_LEVELS = {
    low: { label: 'Low', color: '#10B981', icon: 'arrow-down' },
    medium: { label: 'Medium', color: '#F59E0B', icon: 'minus' },
    high: { label: 'High', color: '#EF4444', icon: 'arrow-up' }
};

// --- SET TASK PRIORITY ---
window.setTaskPriority = function(taskId, priority) {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    const task = user.tasks.find(t => t.id === taskId);
    if(task) {
        task.priority = priority;
        localStorage.setItem('auraUser', JSON.stringify(user));
        if(window.loadTasks) window.loadTasks();
    }
};

// --- SAVE/LOAD ---
function saveCategories() {
    localStorage.setItem('auraTaskCategories', JSON.stringify(window.TASK_CATEGORIES));
}

window.loadCategories = function() {
    const saved = localStorage.getItem('auraTaskCategories');
    if(saved) {
        window.TASK_CATEGORIES = JSON.parse(saved);
    }
};

// Init
window.loadCategories();
