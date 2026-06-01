/* social.js - S1N Social System (Global/League + Friends Sub-Tabs) */

const socialList = document.getElementById('contest-list'); 
const searchInput = document.getElementById('user-search');
let socialViewMode = 'global'; // 'global', 'league', or 'friends'
let friendViewMode = 'list';   // 'list' or 'chats' (Sub-tabs for Friends)
let requestListener = null;

// --- INITIALIZATION ---
window.loadContestData = function() {
    // Check which tab is active in HTML or default to global
    const tabLeague = document.getElementById('tab-league');
    const tabFriends = document.getElementById('tab-friends');
    
    if (tabLeague && tabLeague.classList.contains('bg-main')) {
        socialViewMode = 'league';
    } else if (tabFriends && tabFriends.classList.contains('bg-main')) {
        socialViewMode = 'friends';
    } else {
        socialViewMode = 'global';
    }

    refreshSocialView();
    listenForRequests();
};

// --- MAIN TAB CONTROL ---
window.setSocialTab = function(mode) {
    socialViewMode = mode;
    friendViewMode = 'list'; // Reset sub-tab when switching main tabs
    
    const defaultClass = "px-4 py-2 rounded-full border border-border text-muted hover:text-main text-xs font-bold uppercase whitespace-nowrap transition-colors";
    const activeClass = "px-4 py-2 rounded-full border border-main bg-main text-body text-xs font-bold uppercase whitespace-nowrap transition-colors";

    const tabGlobal = document.getElementById('tab-global');
    const tabLeague = document.getElementById('tab-league');
    const tabFriends = document.getElementById('tab-friends');

    if(tabGlobal) tabGlobal.className = defaultClass;
    if(tabLeague) tabLeague.className = defaultClass;
    if(tabFriends) tabFriends.className = defaultClass;

    if (mode === 'league') {
        if(tabLeague) tabLeague.className = activeClass;
    } else if (mode === 'friends') {
        if(tabFriends) tabFriends.className = activeClass;
    } else {
        if(tabGlobal) tabGlobal.className = activeClass;
    }

    refreshSocialView();
};

// --- SUB TAB CONTROL (Friends vs Chats) ---
window.setFriendTab = function(subMode) {
    friendViewMode = subMode;
    renderFriendsTabs(); // Update button visual state
    
    if (subMode === 'list') {
        renderLeaderboard(searchInput ? searchInput.value : '');
    } else {
        renderChatInbox();
    }
};

// --- VIEW CONTROLLER ---
function refreshSocialView() {
    // 1. Handle League Header
    if (socialViewMode === 'league') {
        renderLeagueHeader();
    } else {
        removeLeagueHeader();
    }

    // 2. Handle Friends Sub-Tabs
    if (socialViewMode === 'friends') {
        renderFriendsTabs();
        // Render content based on sub-tab
        if (friendViewMode === 'chats') {
            renderChatInbox();
        } else {
            renderLeaderboard(searchInput ? searchInput.value : '');
        }
    } else {
        removeFriendsTabs();
        renderLeaderboard(searchInput ? searchInput.value : '');
    }
}

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        if (socialViewMode === 'friends' && friendViewMode === 'chats') {
            // Optional: Implement chat search here if needed
        } else {
            renderLeaderboard(e.target.value.toLowerCase());
        }
    });
}

// --- RENDERERS ---

// 1. League Header
function renderLeagueHeader() {
    const container = document.getElementById('view-contest');
    let header = document.getElementById('league-header');
    
    // Calculate Days Left
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (!header) {
        header = document.createElement('div');
        header.id = 'league-header';
        header.className = "mb-6 p-4 border border-border rounded-xl flex items-center justify-between animate-fade-in bg-input";
        const searchDiv = document.querySelector('#view-contest .relative');
        if(searchDiv && searchDiv.parentNode) {
            searchDiv.parentNode.insertBefore(header, searchDiv);
        }
    }
    
    header.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="trophy" class="w-5 h-5 text-main"></i>
            <div>
                <h3 class="font-bold text-sm"><span class="animate-title inline-block">Monthly League</span></h3>
                <p class="text-[10px] text-muted uppercase tracking-wider">Top 3 receive badges</p>
            </div>
        </div>
        <div class="text-right">
            <span class="block text-xl font-bold font-mono">${daysLeft}</span>
            <span class="text-[10px] uppercase font-bold text-muted">Days Left</span>
        </div>
    `;
    if(window.lucide) lucide.createIcons();
}

function removeLeagueHeader() {
    const header = document.getElementById('league-header');
    if(header) header.remove();
}

// 2. Friends Sub-Tabs
function renderFriendsTabs() {
    let header = document.getElementById('friends-subtabs');
    
    if (!header) {
        header = document.createElement('div');
        header.id = 'friends-subtabs';
        header.className = "flex p-1 bg-input rounded-xl border border-border mb-6 animate-fade-in";
        
        const searchDiv = document.querySelector('#view-contest .relative');
        if(searchDiv && searchDiv.parentNode) {
            searchDiv.parentNode.insertBefore(header, searchDiv);
        }
    }

    const activeBtn = "flex-1 py-2 text-xs font-bold uppercase rounded-lg bg-card shadow-sm text-main transition-all";
    const inactiveBtn = "flex-1 py-2 text-xs font-bold uppercase rounded-lg text-muted hover:text-main transition-all";

    header.innerHTML = `
        <button onclick="setFriendTab('list')" class="${friendViewMode === 'list' ? activeBtn : inactiveBtn}">My Connections</button>
        <button onclick="setFriendTab('chats')" class="${friendViewMode === 'chats' ? activeBtn : inactiveBtn}">Inbox</button>
    `;
}

function removeFriendsTabs() {
    const header = document.getElementById('friends-subtabs');
    if(header) header.remove();
}

// --- DATA LIST RENDERERS ---

// A. Leaderboard / Friends List
function renderLeaderboard(filter = '') {
    if (!socialList) return;
    
    socialList.innerHTML = '<div class="text-center py-12 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();

    firebase.database().ref('users').once('value').then((snapshot) => {
        const data = snapshot.val(); 
        let users = [];
        if (data) {
             users = Object.entries(data).map(([key, value]) => {
                if (!value.name) { value.name = key; }
                return value;
            });
        }

        const myUser = JSON.parse(localStorage.getItem('auraUser'));
        const now = new Date();
        const currentMonthStr = now.toISOString().slice(0, 7); 

        // Score Calculation
        users = users.map(u => {
            let score = 0;
            if (socialViewMode === 'league') {
                const userLastMonth = u.lastActiveMonth || "";
                let effectiveMonthly = (userLastMonth === currentMonthStr) ? (u.monthlyPoints || 0) : 0;
                // Safety cap
                if (effectiveMonthly > (u.points || 0)) effectiveMonthly = u.points || 0; 
                score = effectiveMonthly;
            } else {
                score = u.points || 0; 
            }
            return { ...u, displayScore: score };
        });

        // Filter
        users = users.filter(u => u.name !== 'Owner');

        if (socialViewMode === 'friends' && myUser) {
            const myFriends = myUser.friends || [];
            users = users.filter(u => myFriends.includes(u.name) || u.name === myUser.name);
        }
        
        if (filter) {
            users = users.filter(u => u.name.toLowerCase().includes(filter));
        }

        // Sort
        users.sort((a, b) => b.displayScore - a.displayScore);

        socialList.innerHTML = '';
        if (users.length === 0) {
            socialList.innerHTML = `<div class="text-center py-12 border border-dashed border-border rounded-xl"><p class="text-muted text-sm font-bold uppercase tracking-wider">No agents found.</p></div>`;
            return;
        }

        users.forEach((user, index) => {
            const isMe = myUser && user.name === myUser.name;
            const isFriend = myUser && myUser.friends && myUser.friends.includes(user.name);
            const requestSent = user.requests && user.requests[myUser.name];
            
            // Rank Badge
            const rank = index + 1;
            let rankHtml = `<span class="text-muted font-bold text-sm w-8 text-center font-mono">#${rank}</span>`;
            if (rank === 1) rankHtml = `<div class="rank-badge rank-1">1</div>`;
            else if (rank === 2) rankHtml = `<div class="rank-badge rank-2">2</div>`;
            else if (rank === 3) rankHtml = `<div class="rank-badge rank-3">3</div>`;

            // Buttons Logic
            let buttonsHtml = '';
            if (!isMe) {
                const profileBtn = `<button onclick="viewFriendProfile('${user.name}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Profile"><i data-lucide="user" class="w-4 h-4"></i></button>`;
                
                let actionBtn = '';
                if (isFriend) {
                    actionBtn = `<button onclick="openChat('${user.name}')" class="p-2 text-main hover:bg-input rounded-md transition-colors" title="Chat"><i data-lucide="message-circle" class="w-4 h-4"></i></button>`;
                } else if (requestSent) {
                    actionBtn = `<button disabled class="p-2 text-muted opacity-50 cursor-not-allowed" title="Pending"><i data-lucide="clock" class="w-4 h-4"></i></button>`;
                } else {
                    actionBtn = `<button onclick="sendFriendRequest('${user.name}')" class="p-2 text-muted hover:text-main hover:bg-input rounded-md transition-colors" title="Add"><i data-lucide="user-plus" class="w-4 h-4"></i></button>`;
                }
                buttonsHtml = `<div class="flex items-center gap-1">${profileBtn}${actionBtn}</div>`;
            } else {
                buttonsHtml = `<div class="p-2 text-muted cursor-default"><i data-lucide="user" class="w-4 h-4 opacity-50"></i></div>`;
            }

            const div = document.createElement('div');
            // Use different border for me vs others
            const borderClass = isMe ? 'border-main' : 'border-border';
            div.className = `user-row flex items-center justify-between p-4 rounded-xl border mb-2 transition-all animate-slide-in ${borderClass} hover:border-muted`;
            
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    ${rankHtml}
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="text-sm font-bold ${isMe ? 'text-main' : 'text-main'}">${user.name}</p>
                            ${isMe ? '<span class="text-[9px] border border-main px-1 rounded uppercase font-bold">You</span>' : ''}
                        </div>
                        <p class="text-[10px] text-muted font-bold uppercase tracking-wider">Streak: ${user.streak}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div class="text-right">
                        <div class="font-bold text-main font-mono">${user.displayScore.toLocaleString()}</div>
                    </div>
                    ${buttonsHtml}
                </div>
            `;
            socialList.appendChild(div);
        });
        if(window.lucide) lucide.createIcons();
    });
}

// B. Chat Inbox Render (Instagram Style)
async function renderChatInbox() {
    if (!socialList) return;
    
    socialList.innerHTML = '<div class="text-center py-12 opacity-50"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();

    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
        socialList.innerHTML = `<div class="text-center py-12 border border-dashed border-border rounded-xl">
            <p class="text-muted text-sm font-bold uppercase tracking-wider">Inbox Empty.</p>
            <p class="text-[10px] text-muted mt-2">Connect with agents to chat.</p>
        </div>`;
        return;
    }

    const getChatId = (u1, u2) => [u1, u2].sort().join('_');

    const chatPromises = currentUser.friends.map(async (friendName) => {
        const chatId = getChatId(currentUser.name, friendName);
        const snap = await firebase.database().ref(`chats/${chatId}/messages`).limitToLast(1).once('value');
        const msgs = snap.val();
        let lastMsg = null;
        if (msgs) {
            lastMsg = Object.values(msgs)[0];
        }
        return { friendName, lastMsg };
    });

    const results = await Promise.all(chatPromises);

    // Sort by Latest Message
    results.sort((a, b) => {
        const timeA = a.lastMsg ? a.lastMsg.timestamp : 0;
        const timeB = b.lastMsg ? b.lastMsg.timestamp : 0;
        return timeB - timeA;
    });

    socialList.innerHTML = '';

    results.forEach(item => {
        const { friendName, lastMsg } = item;
        
        let subText = "Start a conversation";
        let timeText = "";
        
        if (lastMsg) {
            const isMe = lastMsg.sender === currentUser.name;
            const prefix = isMe ? "You: " : "";
            subText = prefix + (lastMsg.text.length > 30 ? lastMsg.text.substring(0, 30) + '...' : lastMsg.text);
            
            const diff = Date.now() - lastMsg.timestamp;
            const mins = Math.floor(diff / 60000);
            if(mins < 60) timeText = `• ${mins}m`;
            else if(mins < 1440) timeText = `• ${Math.floor(mins/60)}h`;
            else timeText = `• ${Math.floor(mins/1440)}d`;
        }

        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3 rounded-xl hover:bg-input transition-all cursor-pointer animate-slide-in mb-1 border border-transparent hover:border-border";
        div.onclick = () => window.openChat(friendName);

        div.innerHTML = `
            <div class="flex items-center gap-4 w-full">
                <div class="relative">
                    <div class="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center font-bold text-lg text-main">
                        ${friendName.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline">
                        <h4 class="text-sm font-bold text-main truncate">${friendName}</h4>
                    </div>
                    <p class="text-xs text-muted truncate opacity-80 ${!lastMsg ? 'italic' : ''}">
                        ${subText} <span class="text-[10px] ml-1 opacity-50">${timeText}</span>
                    </p>
                </div>
                <div class="text-muted opacity-30">
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                </div>
            </div>
        `;
        socialList.appendChild(div);
    });
    if(window.lucide) lucide.createIcons();
}

// --- SHARED UTILS (Friend Requests, Profile) ---
function listenForRequests() {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return;

    if (requestListener) {
        firebase.database().ref(`users/${currentUser.name}/requests`).off('value', requestListener);
    }

    let reqContainer = document.getElementById('requests-container');
    if (!reqContainer && socialList && socialList.parentNode) {
        reqContainer = document.createElement('div');
        reqContainer.id = 'requests-container';
        reqContainer.className = "hidden mb-6 animate-fade-in";
        reqContainer.innerHTML = `
            <h3 class="text-xs font-bold uppercase text-main mb-3 pl-1 flex items-center gap-2">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Pending Requests
            </h3>
            <div id="requests-list" class="space-y-2"></div>
        `;
        socialList.parentNode.insertBefore(reqContainer, socialList);
    }

    const reqRef = firebase.database().ref(`users/${currentUser.name}/requests`);
    requestListener = reqRef.on('value', (snapshot) => {
        const requests = snapshot.val();
        const list = document.getElementById('requests-list');
        const container = document.getElementById('requests-container');
        
        if (!requests) {
            if(container) container.classList.add('hidden');
            return;
        }

        if(container) container.classList.remove('hidden');
        if(list) list.innerHTML = '';

        Object.keys(requests).forEach(senderName => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center p-3 bg-input border border-border rounded-xl shadow-sm mb-2";
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-main">
                        ${senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm font-bold text-main">${senderName}</p>
                        <p class="text-[9px] text-muted uppercase tracking-wider">Wants to connect</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="acceptRequest('${senderName}')" class="p-2 bg-main text-body rounded-lg hover:opacity-90 transition-opacity">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="rejectRequest('${senderName}')" class="p-2 border border-border text-muted rounded-lg hover:text-rose-500 hover:bg-card transition-colors">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
        if(window.lucide) lucide.createIcons();
    });
}

// ... (Existing helper functions: sendFriendRequest, acceptRequest, rejectRequest, removeFriend, viewFriendProfile remain unchanged) ...
window.sendFriendRequest = function(targetName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return alert("Login required.");
    firebase.database().ref(`users/${targetName}/requests/${currentUser.name}`).set(true)
    .then(() => {
        if(window.showNotification) window.showNotification("Sent", `Request sent to ${targetName}`, "success");
        if(friendViewMode === 'list') renderLeaderboard(searchInput ? searchInput.value : '');
    })
    .catch(err => alert("Error: " + err.message));
};

window.acceptRequest = async function(senderName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (!currentUser) return;
    try {
        if (!currentUser.friends) currentUser.friends = [];
        if (!currentUser.friends.includes(senderName)) currentUser.friends.push(senderName);
        localStorage.setItem('auraUser', JSON.stringify(currentUser));
        await firebase.database().ref(`users/${currentUser.name}`).update({ friends: currentUser.friends });
        const senderSnap = await firebase.database().ref(`users/${senderName}/friends`).get();
        let senderFriends = senderSnap.val() || [];
        if(!senderFriends.includes(currentUser.name)) {
            senderFriends.push(currentUser.name);
            await firebase.database().ref(`users/${senderName}`).update({ friends: senderFriends });
        }
        await firebase.database().ref(`users/${currentUser.name}/requests/${senderName}`).remove();
        if(window.showNotification) window.showNotification("Connected", `You are now friends with ${senderName}`, "success");
        if(friendViewMode === 'list') renderLeaderboard(searchInput ? searchInput.value : '');
    } catch(err) { alert("Sync Error: " + err.message); }
};

window.rejectRequest = function(senderName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    firebase.database().ref(`users/${currentUser.name}/requests/${senderName}`).remove();
};

window.removeFriend = function(targetName) {
    const currentUser = JSON.parse(localStorage.getItem('auraUser'));
    if (confirm(`Disconnect from ${targetName}?`)) {
        currentUser.friends = currentUser.friends.filter(name => name !== targetName);
        localStorage.setItem('auraUser', JSON.stringify(currentUser));
        firebase.database().ref('users/' + currentUser.name).update({ friends: currentUser.friends })
        .then(() => {
            document.getElementById('friend-modal').classList.add('hidden');
            if(friendViewMode === 'list') renderLeaderboard(searchInput ? searchInput.value : '');
        });
    }
};

window.viewFriendProfile = function(targetName) {
    const modal = document.getElementById('friend-modal');
    const content = document.getElementById('friend-modal-content');
    if(!modal || !content) return;
    modal.classList.remove('hidden');
    content.innerHTML = '<div class="text-center py-8 opacity-50"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto"></i></div>';
    if(window.lucide) lucide.createIcons();
    firebase.database().ref('users/' + targetName).once('value').then((snapshot) => {
        const user = snapshot.val();
        if (!user) { content.innerHTML = '<p class="text-center">Error</p>'; return; }
        
        // Reusing badge logic briefly for completeness
        const inventory = user.inventory || [];
        let badgesHtml = '';
        if (inventory.length > 0) {
            badgesHtml = `<div class="flex flex-wrap gap-2 justify-center mb-6 pt-4 border-t border-border">`;
            const badgeMap = {'badge_crown': 'crown', 'badge_star': 'star', 'badge_fire': 'flame', 'badge_zap': 'zap', 'theme_emerald': 'leaf'};
            inventory.forEach(id => {
                if(badgeMap[id]) badgesHtml += `<div class="p-2 border border-border rounded-md text-muted"><i data-lucide="${badgeMap[id]}" class="w-4 h-4"></i></div>`;
            });
            badgesHtml += `</div>`;
        }

        const currentUser = JSON.parse(localStorage.getItem('auraUser'));
        const isFriend = currentUser && currentUser.friends && currentUser.friends.includes(targetName);

        content.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full border border-border flex items-center justify-center font-bold text-xl bg-input">${user.name.charAt(0).toUpperCase()}</div>
                    <div><h3 class="text-xl font-bold">${user.name}</h3><p class="text-[10px] text-muted uppercase">Credits: ${user.points}</p></div>
                </div>
                <button onclick="document.getElementById('friend-modal').classList.add('hidden')"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="p-3 border border-border rounded-xl text-center"><div class="text-xl font-bold">${user.points||0}</div><div class="text-[10px] text-muted">Credits</div></div>
                <div class="p-3 border border-border rounded-xl text-center"><div class="text-xl font-bold">${user.streak||0}</div><div class="text-[10px] text-muted">Streak</div></div>
            </div>
            ${badgesHtml}
            ${isFriend ? 
                `<div class="grid grid-cols-2 gap-2"><button onclick="openChat('${user.name}'); document.getElementById('friend-modal').classList.add('hidden')" class="btn-s1n w-full py-3 text-xs uppercase">Message</button><button onclick="removeFriend('${user.name}')" class="w-full py-3 border border-rose-200 text-rose-500 font-bold text-xs uppercase rounded-xl">Disconnect</button></div>` 
                : 
                `<button onclick="sendFriendRequest('${user.name}'); document.getElementById('friend-modal').classList.add('hidden')" class="btn-s1n w-full py-3 text-xs uppercase tracking-wider">Send Request</button>`
            }
        `;
        if(window.lucide) lucide.createIcons();
    });
};
