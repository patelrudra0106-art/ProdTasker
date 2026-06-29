/* auth.js - S1N Industrial Theme Update (Onboarding Linked) */

// --- STATE ---
let currentUser = JSON.parse(localStorage.getItem('auraUser')) || null;
let broadcastListenerAttached = false;

// --- DOM ELEMENTS ---
const authOverlay = document.getElementById('auth-overlay');
const mainApp = document.getElementById('main-app');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit');
const toggleAuthText = document.getElementById('toggle-auth-mode');
const nameInput = document.getElementById('auth-name');
const passInput = document.getElementById('auth-pass');
const confirmPassField = document.getElementById('field-confirm-pass');
const confirmPassInput = document.getElementById('auth-confirm-pass');

let isLoginMode = true;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        // User is logged in
        if (mainApp) mainApp.classList.remove('hidden');
        if (authOverlay) authOverlay.classList.add('hidden');
        
        // Initialize Admin Checks & Stats
        checkAdminAccess();
        listenToStats(); 
        listenForBroadcasts(); 
        
        // Init Chat Notifications (CRITICAL for Chat Popup)
        setTimeout(() => {
            if(window.initChatNotifications) window.initChatNotifications();
        }, 1000);
    } else {
        // User needs to login
        if (authOverlay) authOverlay.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }
});

// --- BROADCAST LISTENER ---
function listenForBroadcasts() {
    if (broadcastListenerAttached) return;
    
    firebase.database().ref('system/broadcast').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.message && data.timestamp) {
            const timeSince = Date.now() - data.timestamp;
            // Show only recent broadcasts (10s window)
            if (timeSince < 10000) { 
                if (window.showNotification) {
                    window.showNotification("SYSTEM BROADCAST", data.message, "info");
                }
            }
        }
    });
    broadcastListenerAttached = true;
}

// --- ADMIN LOGIC ---
function checkAdminAccess() {
    const adminNav = document.getElementById('nav-admin');
    
    if (currentUser && currentUser.name === 'Rudra') {
        if (adminNav) adminNav.classList.remove('hidden');
        
        const search = document.getElementById('admin-search');
        if (search) {
            const newSearch = search.cloneNode(true);
            search.parentNode.replaceChild(newSearch, search);
            newSearch.addEventListener('input', (e) => loadAdminPanel(e.target.value));
        }
    } else {
        if (adminNav) adminNav.classList.add('hidden');
    }
}

window.loadAdminPanel = function(filter = '') {
    if (!currentUser || currentUser.name !== 'Rudra') return;
    
    const list = document.getElementById('admin-user-list');
    if (!list) return;

    list.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if (window.lucide) lucide.createIcons();

    firebase.database().ref('users').once('value').then((snapshot) => {
        const data = snapshot.val();
        let users = [];

        if (data) {
            users = Object.entries(data).map(([key, value]) => {
                if (!value.name) { value.name = key; }
                return value;
            });
        }

        // --- ANALYTICS DATA ---
        const totalUsers = users.length;
        const totalPoints = users.reduce((acc, curr) => acc + (curr.points || 0), 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const activeUsers = users.filter(u => u.lastActiveMonth === currentMonth).length;

        // --- FILTERING ---
        if (filter) {
            users = users.filter(u => u.name && u.name.toLowerCase().includes(filter.toLowerCase()));
        }

        list.innerHTML = '';

        // --- DASHBOARD UI (ANIMATED STATS) ---
        const dashboardHTML = `
            <div class="grid grid-cols-3 gap-2 mb-6 animate-fade-in">
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Users</div>
                    <div class="text-xl font-bold font-mono text-main overflow-hidden">
                        <span class="animate-title stagger-1 inline-block">${totalUsers}</span>
                    </div>
                </div>
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Active</div>
                    <div class="text-xl font-bold font-mono text-main overflow-hidden">
                        <span class="animate-title stagger-2 inline-block">${activeUsers}</span>
                    </div>
                </div>
                <div class="card-s1n p-3 text-center">
                    <div class="text-[10px] uppercase font-bold text-muted">Credits</div>
                    <div class="text-xl font-bold font-mono text-main overflow-hidden">
                        <span class="animate-title stagger-3 inline-block">${totalPoints >= 1000 ? (totalPoints/1000).toFixed(1)+'k' : totalPoints}</span>
                    </div>
                </div>
            </div>

            <div class="mb-6 pb-6 border-b border-border animate-fade-in">
                <h4 class="text-xs font-bold uppercase text-muted mb-2">Global Notification</h4>
                <div class="flex gap-2">
                    <input type="text" id="admin-broadcast-input" placeholder="System Notification..." class="input-s1n py-2 text-xs">
                    <button onclick="adminSendBroadcast()" class="btn-s1n px-4 py-2">
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="mb-6 pb-6 border-b border-border animate-fade-in">
                <h4 class="text-xs font-bold uppercase text-muted mb-2">Music Upload</h4>
                <div class="flex flex-col gap-2 mb-2">
                    <input type="text" id="sound-name-input" placeholder="Music Name (e.g. Rain)" class="input-s1n py-2 text-xs">
                    
                    <input type="file" id="sound-file-input" accept="audio/*" class="block w-full text-xs text-muted
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-bold file:uppercase
                        file:bg-main file:text-body
                        hover:file:opacity-80 cursor-pointer
                    ">
                </div>
                <button id="btn-upload-sound" onclick="adminAddSound()" class="btn-s1n w-full py-2 text-xs uppercase mb-4 tracking-wider">Upload Music</button>
                <div id="admin-sound-list" class="space-y-2">
                    <p class="text-[10px] text-muted italic">Loading Music...</p>
                </div>
            </div>

            <h4 class="text-xs font-bold uppercase text-muted mb-4">User Database</h4>
        `;
        list.insertAdjacentHTML('beforeend', dashboardHTML);

        loadAdminSounds();

        if (users.length === 0) {
            list.insertAdjacentHTML('beforeend', `<div class="text-center py-10 border border-dashed border-border rounded-xl"><p class="text-muted text-xs font-bold uppercase">No records found.</p></div>`);
            return;
        }

        // --- RENDER USER LIST ---
        users.forEach(user => {
            if (!user) return;

            const isAdmin = user.name === 'Rudra';
            const isBanned = user.isBanned === true; 
            const safeName = user.name.replace(/'/g, "\\'"); 
            
            const rowClass = isBanned 
                ? "border-border opacity-60" 
                : "border-border hover:border-main";

            const div = document.createElement('div');
            div.className = `flex items-center justify-between p-4 rounded-xl border mb-2 transition-all animate-fade-in bg-card ${rowClass}`;
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-main">
                        <i data-lucide="${isAdmin ? 'shield' : (isBanned ? 'ban' : 'user')}" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-main ${isBanned ? 'line-through decoration-rose-500' : ''}">
                            ${user.name} 
                        </p>
                        <p class="text-[10px] text-muted font-mono">PTS: ${user.points || 0}</p>
                        
                        <div class="flex items-center gap-2 mt-0.5">
                            <p id="pass-${safeName}" class="text-[10px] text-muted font-mono tracking-widest">••••••</p>
                            <button onclick="togglePassVisibility('${safeName}', '${user.password}')" class="text-muted hover:text-main"><i data-lucide="eye" class="w-3 h-3"></i></button>
                        </div>
                    </div>
                </div>
                ${!isAdmin ? `
                <div class="flex gap-1">
                    <button onclick="adminResetPass('${safeName}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Reset Key">
                        <i data-lucide="key" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminEditPoints('${safeName}', ${user.points || 0})" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Edit Stats">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminToggleBan('${safeName}', ${isBanned})" class="p-2 ${isBanned ? 'text-emerald-500' : 'text-muted hover:text-rose-500'} hover:bg-input rounded-md transition-colors" title="${isBanned ? 'Restore' : 'Suspend'}">
                        <i data-lucide="${isBanned ? 'check-circle' : 'ban'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="adminDeleteUser('${safeName}')" class="p-2 text-muted hover:text-rose-500 hover:bg-input rounded-md transition-colors" title="Purge">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                ` : '<span class="text-[10px] font-bold text-main uppercase tracking-wider border border-main px-2 py-0.5 rounded">Admin</span>'}
            `;
            list.appendChild(div);
        });
        if (window.lucide) lucide.createIcons();
    });
};

// --- SOUND MANAGER FUNCTIONS ---

window.loadAdminSounds = function() {
    const container = document.getElementById('admin-sound-list');
    if(!container) return;

    firebase.database().ref('system/sounds').on('value', (snapshot) => {
        const sounds = snapshot.val();
        container.innerHTML = '';

        if (!sounds) {
            container.innerHTML = '<p class="text-[10px] text-muted italic">No custom frequencies active.</p>';
            return;
        }

        Object.entries(sounds).forEach(([key, data]) => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center p-2 border border-border rounded bg-input mb-2";
            div.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden">
                    <i data-lucide="music" class="w-3 h-3 text-muted shrink-0"></i>
                    <span class="text-xs font-bold truncate text-main">${data.name}</span>
                </div>
                <button onclick="adminDeleteSound('${key}')" class="text-muted hover:text-rose-500 p-1">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            container.appendChild(div);
        });
        if(window.lucide) lucide.createIcons();
    });
};

window.adminAddSound = function() {
    const nameInput = document.getElementById('sound-name-input');
    const fileInput = document.getElementById('sound-file-input');
    const btn = document.getElementById('btn-upload-sound');
    
    const name = nameInput.value.trim();
    const file = fileInput.files[0];

    if(!name) return alert("Frequency Name required.");
    if(!file) return alert("Select an audio file.");

    // SIZE CHECK: Limit to 2MB to prevent Database freezing
    if(file.size > 2 * 1024 * 1024) {
        return alert("File too large. Max limit: 2MB.");
    }

    btn.textContent = "Encoding...";
    btn.disabled = true;

    // Convert File to Base64 Data URI
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const base64Url = e.target.result;

        firebase.database().ref('system/sounds').push({
            name: name,
            url: base64Url // Stores the actual file data as text
        }).then(() => {
            if(window.showNotification) window.showNotification("System Update", "Audio encoded & uploaded.", "success");
            nameInput.value = '';
            fileInput.value = '';
            btn.textContent = "Upload Music";
            btn.disabled = false;
        }).catch(err => {
            alert("Upload failed: " + err.message);
            btn.textContent = "Upload Music";
            btn.disabled = false;
        });
    };

    reader.onerror = function() {
        alert("Error reading file.");
        btn.textContent = "Upload Music";
        btn.disabled = false;
    };

    reader.readAsDataURL(file);
};

window.adminDeleteSound = function(key) {
    if(confirm("Terminate this audio protocol?")) {
        firebase.database().ref('system/sounds/' + key).remove();
    }
};

// --- ADMIN ACTIONS ---
window.adminSendBroadcast = function() {
    const input = document.getElementById('admin-broadcast-input');
    if (!input || !input.value.trim()) return;
    
    const msg = input.value.trim();
    if (confirm(`Broadcast global alert?\n\n"${msg}"`)) {
        firebase.database().ref('system/broadcast').set({
            message: msg,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            if(window.showNotification) window.showNotification("SENT", "Broadcast dispatched.", "success");
            input.value = '';
        });
    }
};

window.togglePassVisibility = function(elementId, password) {
    const el = document.getElementById(`pass-${elementId}`);
    if (el) {
        if (el.textContent === '••••••') {
            el.textContent = password;
            el.classList.add('text-main');
        } else {
            el.textContent = '••••••';
            el.classList.remove('text-main');
        }
    }
};

window.adminResetPass = function(targetName) {
    const newPass = prompt(`Reset Key for ${targetName}:`);
    if (newPass && newPass.trim() !== "") {
        firebase.database().ref('users/' + targetName).update({
            password: newPass.trim()
        }).then(() => {
            alert("Key Updated.");
            loadAdminPanel();
        });
    }
};

window.adminToggleBan = function(targetName, currentStatus) {
    const action = currentStatus ? "RESTORE" : "SUSPEND";
    if (confirm(`${action} access for ${targetName}?`)) {
        firebase.database().ref('users/' + targetName).update({
            isBanned: !currentStatus
        }).then(() => {
            loadAdminPanel();
        });
    }
};

window.adminEditPoints = async function(targetName, currentDisplayPoints) {
    if (!currentUser || currentUser.name !== 'Rudra') return;

    const newPointsStr = prompt(`Set TOTAL Credits for ${targetName}:`, currentDisplayPoints);
    if (newPointsStr === null || newPointsStr.trim() === "") return;

    const newPoints = parseInt(newPointsStr);
    if (isNaN(newPoints)) return alert("Invalid Format.");

    try {
        const snap = await firebase.database().ref('users/' + targetName).get();
        const data = snap.val();
        if (!data) return;

        const oldPoints = data.points || 0;
        const oldMonthly = data.monthlyPoints || 0;
        const diff = newPoints - oldPoints;
        const newMonthly = Math.max(0, oldMonthly + diff);

        await firebase.database().ref('users/' + targetName).update({
            points: newPoints,
            monthlyPoints: newMonthly
        });
        
        loadAdminPanel();
    } catch (err) {
        alert("Sync Error: " + err.message);
    }
};

window.adminDeleteUser = function(targetName) {
    if (!currentUser || currentUser.name !== 'Rudra') return;
    if (targetName === 'Rudra') return alert("Protected User.");
    
    if (confirm(`⚠️ PERMANENTLY PURGE "${targetName}"?`)) {
        firebase.database().ref('users/' + targetName).remove()
        .then(() => loadAdminPanel());
    }
};

// --- TOGGLE LOGIN / SIGNUP ---
window.toggleAuthMode = function() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        // ANIMATED TITLE SWITCH
        authTitle.innerHTML = '<span class="animate-title inline-block">Enter Workspace</span>';
        
        authSubmitBtn.textContent = "Initialize Session";
        toggleAuthText.innerHTML = "New agent? <span class='text-main font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Create ID</span>";
        confirmPassField.classList.add('hidden');
    } else {
        // ANIMATED TITLE SWITCH
        authTitle.innerHTML = '<span class="animate-title inline-block">New Registration</span>';
        
        authSubmitBtn.textContent = "Create Identity";
        toggleAuthText.innerHTML = "Have ID? <span class='text-main font-bold cursor-pointer hover:underline' onclick='toggleAuthMode()'>Log In</span>";
        confirmPassField.classList.remove('hidden');
    }
};

// --- HANDLE SUBMIT (CLOUD) ---
window.handleAuth = async function(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim().replace(/[.#$/[\]]/g, ""); 
    const password = passInput.value;
    const confirmPass = confirmPassInput.value;

    if (!name || !password) return alert("Credentials missing.");
    if (name.toLowerCase() === 'undefined' || name.toLowerCase() === 'null') return alert("Invalid ID.");

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = "Processing...";
    
    const userRef = firebase.database().ref('users/' + name);

    try {
        const snapshot = await userRef.get();
        const userData = snapshot.val();

        if (isLoginMode) {
            if (userData) {
                if (userData.isBanned) {
                    throw new Error("ACCESS DENIED. ID SUSPENDED.");
                }
                if (userData.password === password) {
                    loginUser(userData);
                    window.location.reload(); 
                } else {
                    throw new Error("Authentication Failed.");
                }
            } else {
                throw new Error("ID not found.");
            }
        } else {
            // --- SIGN UP LOGIC ---
            if (password !== confirmPass) throw new Error("Key Mismatch.");
            if (userData) throw new Error("ID Taken.");

            const newUser = {
                name: name,
                password: password,
                points: 0,
                monthlyPoints: 0,
                streak: 0,
                friends: [], 
                inventory: [],
                unlockedAchievements: [],
                isBanned: false,
                joinDate: new Date().toLocaleDateString(),
                lastActiveMonth: new Date().toISOString().slice(0, 7)
            };

            await userRef.set(newUser);
            loginUser(newUser);

            // --- TRIGGER ONBOARDING (NEW) ---
            setTimeout(() => {
                if(window.startOnboarding) window.startOnboarding();
            }, 500); 
        }
    } catch (error) {
        alert(error.message);
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? "Initialize Session" : "Create Identity";
    }
};

function loginUser(user) {
    currentUser = user;
    localStorage.setItem('auraUser', JSON.stringify(currentUser));
    
    let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
    profile.name = user.name;
    profile.points = user.points;
    profile.streak = user.streak;
    profile.monthlyPoints = user.monthlyPoints || 0;
    profile.lastActiveMonth = user.lastActiveMonth || new Date().toISOString().slice(0, 7);
    
    localStorage.setItem('auraProfile', JSON.stringify(profile));
    
    authOverlay.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    checkAdminAccess(); // Ensure admin button shows immediately on signup
    
    if(window.initChatNotifications) window.initChatNotifications();
}

// --- SYNC SCORE TO CLOUD ---
window.syncUserToDB = function(newPoints, newStreak, monthlyPoints, lastActiveMonth) {
    if (!currentUser) return;

    const stats = JSON.parse(localStorage.getItem('auraStats')) || { minutes: 0, sessions: 0 };
    const taskKey = `auraTasks_${currentUser.name}`;
    const tasks = JSON.parse(localStorage.getItem(taskKey)) || [];
    
    // FETCH LOCAL DATA TO ENSURE SYNC
    const userLocal = JSON.parse(localStorage.getItem('auraUser')) || {};
    const inventory = userLocal.inventory || [];
    const unlockedAchievements = userLocal.unlockedAchievements || []; 
    
    let completedTasks = 0;
    let onTime = 0;
    let late = 0;

    tasks.forEach(t => {
        if (t.completed) {
            completedTasks++;
            if (!t.date || !t.time) {
                onTime++;
            } else {
                const [tH, tM] = t.time.split(':').map(Number);
                const dueObj = new Date(t.date);
                dueObj.setHours(tH, tM, 0, 0);

                if (t.completedAt) {
                    if (t.completedAt <= dueObj.getTime()) onTime++;
                    else late++;
                } else {
                    onTime++; 
                }
            }
        }
    });

    if(monthlyPoints === undefined) {
        const p = JSON.parse(localStorage.getItem('auraProfile')) || {};
        monthlyPoints = p.monthlyPoints || 0;
        lastActiveMonth = p.lastActiveMonth || new Date().toISOString().slice(0, 7);
    }

    firebase.database().ref('users/' + currentUser.name).update({
        points: newPoints,
        streak: newStreak,
        monthlyPoints: monthlyPoints,
        lastActiveMonth: lastActiveMonth,
        inventory: inventory, 
        unlockedAchievements: unlockedAchievements,
        totalMinutes: stats.minutes,
        totalSessions: stats.sessions || 0,
        totalTasks: completedTasks,
        tasksOnTime: onTime,
        tasksLate: late
    });
};

function listenToStats() {
    firebase.database().ref('users/' + currentUser.name).on('value', (snapshot) => {
        const data = snapshot.val();
        if(data) {
             if (data.isBanned) {
                 alert("ID SUSPENDED.");
                 localStorage.removeItem('auraUser');
                 window.location.reload();
             }

             let localUser = JSON.parse(localStorage.getItem('auraUser')) || currentUser;
             let needsSave = false;

             // Background Sync Checks
             if(data.friends) {
                 localUser.friends = data.friends;
                 needsSave = true;
             }
             if(data.inventory) { 
                 localUser.inventory = data.inventory;
                 needsSave = true;
             }
             if(data.unlockedAchievements) {
                 localUser.unlockedAchievements = data.unlockedAchievements;
                 needsSave = true;
             }

             if(needsSave) {
                 localStorage.setItem('auraUser', JSON.stringify(localUser));
                 currentUser = localUser; // Update global reference
             }

             // Sync Profile Display Stats
             let profile = JSON.parse(localStorage.getItem('auraProfile')) || {};
             if(data.points !== profile.points) {
                 profile.points = data.points;
                 profile.streak = data.streak;
                 profile.monthlyPoints = data.monthlyPoints || 0;
                 localStorage.setItem('auraProfile', JSON.stringify(profile));
                 const pDisplay = document.getElementById('display-points');
                 if(pDisplay) pDisplay.textContent = data.points.toLocaleString();
             }
        }
    });
}

window.logout = function() {
    if(confirm("Terminating Session. Confirm?")) {
        localStorage.removeItem('auraUser');
        window.location.reload();
    }
};

window.deleteAccount = function() {
    if(!currentUser) return;
    if(confirm("⚠️ WARNING: This will permanently purge your Identity.")) {
        firebase.database().ref('users/' + currentUser.name).remove()
        .then(() => {
            localStorage.clear();
            window.location.reload();
        });
    }
};
