/* reports.js - S1N Industrial Theme Update */

// --- INIT ---
window.initReports = function() {
    // Check if a tab is already active
    const activeBtn = document.querySelector('.report-tab.bg-main');
    if(activeBtn) {
        generateReport(activeBtn.dataset.type);
    } else {
        // Default to Daily
        switchReportTab('daily');
    }
};

// --- TABS (Solid Black Active State) ---
window.switchReportTab = function(type) {
    const reportTabs = document.querySelectorAll('.report-tab');

    // Default: Transparent with border-bottom transparent
    const inactiveClass = "report-tab flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-muted hover:text-main transition-colors";
    
    // Active: Solid bottom border
    const activeClass = "report-tab flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 border-main text-main transition-colors";

    reportTabs.forEach(btn => {
        if(btn.dataset.type === type) {
            btn.className = activeClass;
        } else {
            btn.className = inactiveClass;
        }
    });

    generateReport(type);
};

// --- LOGIC ---
function getReportStorageKey() {
    const user = JSON.parse(localStorage.getItem('auraUser'));
    if (user && user.name) {
        return `auraTasks_${user.name}`;
    }
    return 'auraTasks_guest';
}

function generateReport(type) {
    const reportContent = document.getElementById('report-content');
    if(!reportContent) return;

    // 1. Fetch Data
    const storageKey = getReportStorageKey();
    const tasks = JSON.parse(localStorage.getItem(storageKey)) || [];
    const history = JSON.parse(localStorage.getItem('auraHistory')) || [];

    // 2. Define Time Ranges
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startTime;

    if (type === 'daily') {
        startTime = startOfDay;
    } else if (type === 'weekly') {
        const day = now.getDay() || 7; 
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0,0,0,0);
        startTime = monday;
    } else if (type === 'monthly') {
        startTime = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 3. Filter Tasks
    let onTimeCount = 0;
    let lateCount = 0;
    let noDeadlineCount = 0;
    
    const filteredTasks = tasks.filter(t => {
        if(!t.completed) return false;
        
        const taskDateObj = t.completedAt ? new Date(t.completedAt) : (t.date ? new Date(t.date) : new Date());
        if (taskDateObj < startTime) return false;

        if (!t.date || !t.time) {
            noDeadlineCount++;
        } else {
            const [tH, tM] = t.time.split(':').map(Number);
            const dueObj = new Date(t.date);
            dueObj.setHours(tH, tM, 0, 0);

            if (t.completedAt) {
                if (t.completedAt <= dueObj.getTime()) {
                    onTimeCount++;
                } else {
                    lateCount++;
                }
            } else {
                onTimeCount++;
            }
        }
        return true; 
    });

    const filteredHistory = history.filter(h => {
        const hDate = new Date(h.date); 
        return hDate >= startTime;
    });

    // 4. Calculate Stats
    const totalTasks = filteredTasks.length;
    const totalFocusMinutes = filteredHistory.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const totalSessions = filteredHistory.length;
    
    // 5. Render
    renderReportUI(reportContent, type, totalTasks, totalFocusMinutes, totalSessions, onTimeCount, lateCount, noDeadlineCount);
}

function renderReportUI(container, type, tasks, mins, sessions, onTime, late, noDeadline) {
    const title = type.toUpperCase();
    const efficiency = tasks > 0 ? Math.round(mins / tasks) : 0;
    
    // Chart Calculations
    const totalForChart = (onTime + late + noDeadline) || 1; 
    const onTimePct = Math.round(((onTime + noDeadline) / totalForChart) * 100);
    const latePct = Math.round((late / totalForChart) * 100);
    
    // Chart Colors
    const isDark = document.documentElement.classList.contains('dark');
    const colorMain = isDark ? '#FFFFFF' : '#111827';
    const colorMuted = isDark ? '#27272a' : '#E5E7EB'; 

    const chartStyle = `background: conic-gradient(
        ${colorMain} 0% ${onTimePct}%, 
        ${colorMuted} ${onTimePct}% 100%
    )`;

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-4 animate-fade-in">
            <div class="card-s1n p-4 flex flex-col items-center justify-center text-center">
                <i data-lucide="check-circle-2" class="w-5 h-5 mb-2 text-main"></i>
                <div class="text-3xl font-bold font-mono text-main overflow-hidden">
                    <span class="animate-title stagger-1 inline-block">${tasks}</span>
                </div>
                <div class="text-[10px] font-bold uppercase text-muted tracking-wider mt-1">Protocols</div>
            </div>
            <div class="card-s1n p-4 flex flex-col items-center justify-center text-center">
                <i data-lucide="clock" class="w-5 h-5 mb-2 text-main"></i>
                <div class="text-3xl font-bold font-mono text-main overflow-hidden">
                    <span class="animate-title stagger-2 inline-block">${mins}</span><span class="text-sm opacity-50">m</span>
                </div>
                <div class="text-[10px] font-bold uppercase text-muted tracking-wider mt-1">Focus Time</div>
            </div>
        </div>

        <div class="space-y-2 mb-6 animate-fade-in">
            <div class="flex justify-between items-center p-4 border border-border rounded-xl">
                <div class="flex items-center gap-3">
                    <i data-lucide="target" class="w-4 h-4 text-muted"></i>
                    <div>
                        <p class="text-xs font-bold uppercase text-main">Sessions</p>
                    </div>
                </div>
                <span class="font-bold font-mono text-main">
                    <span class="animate-title stagger-3 inline-block">${sessions}</span>
                </span>
            </div>

            <div class="flex justify-between items-center p-4 border border-border rounded-xl">
                <div class="flex items-center gap-3">
                    <i data-lucide="zap" class="w-4 h-4 text-muted"></i>
                    <div>
                        <p class="text-xs font-bold uppercase text-main">Efficiency</p>
                    </div>
                </div>
                <span class="font-bold font-mono text-main">
                    <span class="animate-title stagger-3 inline-block">${efficiency}</span>m / Task
                </span>
            </div>
        </div>

        <div class="card-s1n p-6 mb-6 animate-fade-in">
            <h3 class="text-xs font-bold uppercase text-muted tracking-widest mb-6 border-b border-border pb-2">
                Performance Ratio
            </h3>
            
            <div class="flex items-center gap-8">
                <div class="relative w-28 h-28 shrink-0 rounded-full flex items-center justify-center" style="${chartStyle}">
                    <div class="w-20 h-20 bg-card rounded-full flex flex-col items-center justify-center border border-border overflow-hidden">
                        <span class="text-xl font-bold font-mono text-main">
                            <span class="animate-title stagger-2 inline-block">${onTimePct}%</span>
                        </span>
                    </div>
                </div>

                <div class="flex-1 space-y-4">
                    <div>
                        <div class="flex justify-between text-[10px] uppercase font-bold mb-1">
                            <span class="text-main flex items-center gap-2">
                                <span class="w-2 h-2 bg-main rounded-sm"></span> On Time
                            </span>
                            <span class="font-mono">${onTime + noDeadline}</span>
                        </div>
                        <div class="w-full bg-border rounded-full h-1 overflow-hidden">
                            <div class="bg-main h-full" style="width: ${onTimePct}%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between text-[10px] uppercase font-bold mb-1">
                            <span class="text-muted flex items-center gap-2">
                                <span class="w-2 h-2 bg-border rounded-sm"></span> Delayed
                            </span>
                            <span class="font-mono text-muted">${late}</span>
                        </div>
                        <div class="w-full bg-input rounded-full h-1 overflow-hidden">
                            <div class="bg-border h-full" style="width: ${latePct}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${late > 0 ? `
            <div class="mt-6 flex items-start gap-2 text-[10px] font-bold uppercase text-rose-500 p-2 border border-rose-200 dark:border-rose-900/30 rounded">
                <i data-lucide="alert-triangle" class="w-3 h-3 mt-0.5"></i> 
                <span>${late} Protocols Delayed. Optimize Workflow.</span>
            </div>` : ''}
        </div>
        
        <div class="text-center pb-8">
            <p class="text-[10px] font-bold uppercase text-muted tracking-[0.2em] opacity-50">System Analytics // ${title}</p>
        </div>
    `;
    
    if(window.lucide) lucide.createIcons();
}
