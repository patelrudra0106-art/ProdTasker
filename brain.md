# ProdTasker — Technical Knowledge Base

> **Focus. Execute. Repeat.**
> A gamified deep-work productivity suite with a social economy, built as a client-rendered PWA.

---

## 1. Introduction

**ProdTasker** is a web-based productivity application that gamifies the "Deep Work" experience. Unlike conventional to-do apps, it enforces a strict **5-Task Daily Limit** to prevent burnout and force high-value prioritization.

### Purpose

- Help users develop disciplined, focused work habits through constrained task management.
- Reward consistency with a virtual Credits/XP economy.
- Foster healthy competition through a global social leaderboard.

### Target Audience

- Students and self-learners who need structured focus sessions.
- Remote workers seeking gamified accountability.
- Productivity enthusiasts who respond well to streak-based motivation.

### Key Design Principle

> *Constraint breeds creativity.* — Only 5 tasks per day forces ruthless prioritization.

---

## 2. System Architecture

### High-Level Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ HTML5    │  │ Tailwind │  │ Vanilla  │  │ Service Worker   │ │
│  │ (SPA)    │  │ CSS +    │  │ JS (ES6+)│  │ (Offline Cache)  │ │
│  │          │  │ Custom   │  │ Modules  │  │                  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                  LocalStorage Layer                          ││
│  │  (Tasks, Profile, Stats, History, Settings, Notifications)  ││
│  └──────────────────────────────────────────────────────────────┘│
│                        │                                         │
└────────────────────────┼─────────────────────────────────────────┘
                         │ Firebase Compat SDK (v9.22.0)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FIREBASE (Backend)                           │
│                                                                  │
│  ┌──────────────────────────────┐  ┌───────────────────────────┐ │
│  │  Realtime Database (RTDB)   │  │  Authentication           │ │
│  │  - /users/{username}        │  │  (Custom, password-based)  │ │
│  │  - /chats/{chatId}/messages │  │                           │ │
│  │  - /system/broadcast        │  │                           │ │
│  │  - /system/sounds           │  │                           │ │
│  └──────────────────────────────┘  └───────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ Groq API    │  │ Mixkit CDN  │  │ ui-avatars.com           │ │
│  │ (LLama 3.1) │  │ (SFX Audio) │  │ (PWA Icon Generation)    │ │
│  │ AI Breakdown│  │             │  │                          │ │
│  └─────────────┘  └─────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer         | Technology                                          |
|---------------|-----------------------------------------------------|
| Markup        | HTML5 (single `index.html` SPA)                     |
| Styling       | Tailwind CSS (CDN) + Custom CSS (`css/style.css`)   |
| Logic         | Vanilla JavaScript (ES6+), 14 modular `.js` files   |
| Icons         | Lucide Icons (CDN, latest)                          |
| Effects       | Canvas Confetti (v1.6.0)                            |
| Database      | Google Firebase Realtime Database (Compat SDK 9.22) |
| AI            | Groq API (LLama 3.1 8B Instant) via REST            |
| PWA           | `manifest.json` + `service-worker.js`               |
| Typography    | Inter (Google Fonts, weights 300–800)               |

### Script Load Order

Scripts are loaded at the bottom of `index.html` in strict dependency order:

```
1. Firebase SDK (App + Database Compat)
2. config.js          → Exposes ENV variables (GROQ_API_KEY)
3. firebase-config.js → Initializes Firebase app
4. auth.js            → Authentication, Admin, Session, Cloud Sync
5. social.js          → Leaderboard, Friends, Profile Inspect
6. chat.js            → Real-time messaging + Notifications
7. notifications.js   → Toast notification system
8. achievements.js    → Auto-unlock trophy evaluator
9. profile.js         → User stats, XP, levels, heatmap
10. shop.js           → Market economy (badges, consumables)
11. tasks.js          → Task CRUD, 5-limit, AI breakdown
12. app.js            → Global state, theme, settings, "juice" system
13. pomodoro.js       → Timer engine, sounds, session logging
14. reports.js        → Analytics (daily/weekly/monthly)
15. onboarding.js     → First-time user slide system
```

---

## 3. Core Features

### 3.1 Task Protocol System (`tasks.js`)

The constrained task engine is the application's core mechanic.

| Rule                  | Detail                                                              |
|-----------------------|---------------------------------------------------------------------|
| **Daily Limit**       | Max **5 tasks** per calendar day (by `createdAt` date)              |
| **Completion Reward** | +10 Credits per task completed on time                              |
| **Undo Penalty**      | −10 Credits if a completed task is unchecked                        |
| **Delete Penalty**    | −10 Credits if a completed task is deleted                          |
| **Filters**           | All / Active / Done                                                 |
| **Deadlines**         | Optional date + time. Overdue tasks display in red with alert icon  |

**AI Task Breakdown** — Users can type a high-level goal into the input field and click the ✨ (sparkles) button. The system calls the Groq API (LLama 3.1) to decompose the goal into exactly N sub-tasks (where N = remaining daily slots).

```
Flow: User Goal → Groq API → JSON Array of Strings → Auto-add to Task List
```

### 3.2 Focus System / Pomodoro (`pomodoro.js`)

Two timer modes accessible via a toggle at the top of the Focus view:

| Mode          | Behavior                                    | Reward Formula          |
|---------------|---------------------------------------------|-------------------------|
| **Pomodoro**  | Countdown timer with Focus/Short/Long modes | `minutes × 2` Credits   |
| **Stopwatch** | Count-up timer for free-form flow state     | `minutes × 1` Credits   |

**Sub-modes** (Pomodoro only):

| Sub-mode      | Default Duration | Purpose        |
|---------------|-----------------|----------------|
| Focus         | 25 minutes      | Deep work      |
| Short Recharge| 5 minutes       | Quick break    |
| Long Recharge | 15 minutes      | Extended break |

**Audio Engine** — Background soundscapes are admin-uploaded to Firebase (`/system/sounds`) and dynamically populate the `<select>` dropdown. Audio files are stored as Base64 Data URIs in the database (max 2MB per file).

**Visual Elements:**
- SVG circular progress ring (radius 118px, circumference 741px)
- Breathing ring animation during break modes
- Tab title updates with live countdown: `[24:59] FOCUS PROTOCOL`
- Session history log (last 30 entries)

### 3.3 Identity & Gamification

#### Credits System (`profile.js`)

```
Earning:
  +10   → Complete a task
  +N    → Complete a focus session (N = minutes × multiplier)
  +R    → Unlock an achievement (R = achievement reward value)

Spending:
  −Cost → Purchase shop item
  −10   → Undo or delete a completed task
```

#### Monthly Points Reset

At the start of each calendar month, `monthlyPoints` resets to `0` (detected via `lastActiveMonth` field). This powers the **League** leaderboard.

#### Streak System

- Completing a task on a new day extends the streak.
- Missing a day resets streak to `1`.
- A **Streak Restore** item (500 Credits) bridges a gap by backdating `lastTaskDate` to yesterday.

#### Achievements (`achievements.js`)

| ID               | Title        | Condition            | Reward |
|------------------|-------------|----------------------|--------|
| `ach_first_blood`| Initiation  | ≥1 task completed     | 50     |
| `ach_warmup`     | Warming Up  | ≥10 tasks completed   | 100    |
| `ach_focus_novice`| Deep Work  | ≥1 focus session      | 50     |
| `ach_streak_3`   | Momentum   | ≥3 day streak         | 150    |
| `ach_streak_7`   | Unstoppable| ≥7 day streak         | 500    |
| `ach_rich`       | Capitalist | ≥1,000 Credits        | 200    |

Achievements auto-evaluate on task completion, focus session end, and streak updates. Unlocking triggers confetti, sound effect, XP popup, and a screen shake.

### 3.4 The Market (`shop.js`)

An in-app store where earned Credits are spent on cosmetic badges and utility items.

| Item ID          | Name           | Type       | Cost  | Effect                        |
|------------------|----------------|------------|-------|-------------------------------|
| `badge_crown`    | Crown          | Badge      | 1,000 | Profile cosmetic (Lucide icon)|
| `badge_star`     | Star           | Badge      | 500   | Profile cosmetic              |
| `badge_fire`     | Flame          | Badge      | 300   | Profile cosmetic              |
| `badge_zap`      | Voltage        | Badge      | 250   | Profile cosmetic              |
| `restore_streak` | Streak Restore | Consumable | 500   | Repairs broken streak         |
| `theme_emerald`  | Support        | Consumable | 2,000 | Contributor badge             |

Badges (non-consumable) can only be purchased once. Consumables can be re-purchased. Purchase triggers a 3D reveal animation, confetti, and sound effect.

### 3.5 Social Network (`social.js`, `chat.js`)

**Three Views:**

1. **Global** — All-time leaderboard sorted by total Credits (excludes admin "Rudra").
2. **League** — Monthly leaderboard sorted by `monthlyPoints` for the current month.
3. **Friends** — Filtered to connected users only, with a sub-tab for **Inbox** (Instagram-style chat list).

**Friend System Flow:**

```
User A clicks "Add" → request stored at /users/B/requests/A = true
                    → User B sees "Pending Requests" banner
                    → User B accepts → both /users/A/friends and /users/B/friends updated
                    → Bidirectional chat unlocked
```

**Real-time Chat** (`chat.js`):
- Messages stored at `/chats/{chatId}/messages` (chatId = sorted `userA_userB`).
- Last 50 messages loaded with Firebase `limitToLast(50)`.
- Real-time updates via Firebase `on('value')` listener.
- New message notifications with sound (only if user is not viewing that chat).
- Inbox shows last message preview + relative timestamp.

### 3.6 Analytics (`reports.js`)

Three time-range tabs: **Daily**, **Weekly**, **Monthly**.

Metrics displayed:
- **Protocols Completed** — Tasks finished in the time range.
- **Focus Time** — Total minutes from session history.
- **Sessions** — Count of focus sessions.
- **Efficiency** — Minutes per task ratio.
- **Performance Ratio** — Donut chart (conic gradient) showing on-time vs delayed tasks.
- **Delayed Warning** — Red alert if any tasks were completed past deadline.

### 3.7 Admin Control Panel

Accessible only when `currentUser.name === 'Rudra'`. Provides:

- **Dashboard Stats** — Total users, active users (current month), total Credits in economy.
- **System Broadcast** — Push a message to all online users via `/system/broadcast`.
- **Music Upload** — Upload audio files (≤2MB) as Base64 to Firebase for the soundscape system.
- **User Management** — Per-user actions:
  - View/toggle password visibility
  - Reset password
  - Edit Credits (adjusts both `points` and `monthlyPoints`)
  - Ban/Unban (banned users are kicked on next Firebase sync)
  - Delete user permanently

### 3.8 Notification System (`notifications.js`)

- **Toast Notifications** — Industrial-style cards slide in from top center.
- **Settings-Aware** — Respects `appSettings.notifications` toggle.
- **Auto-Dismiss** — 4-second timeout with fade-out animation.
- **History Log** — Last 50 notifications persisted in LocalStorage, viewable in a modal.
- **Audio Feedback** — Mechanical click sound on each notification.

### 3.9 Onboarding (`onboarding.js`)

A 5-slide walkthrough triggered for new users after registration:

| Slide | Title            | Topic                           |
|-------|------------------|---------------------------------|
| 1     | Protocol System  | Task management overview        |
| 2     | Focus Engine     | Timer and audio environments    |
| 3     | System Analytics | Reports and efficiency tracking |
| 4     | Global Network   | Leaderboard and social features |
| 5     | Market Economy   | Credits and the shop system     |

Each slide shows a device mockup image (dark/light variants from `/assets/`). Completion triggers confetti.

### 3.10 Settings (`app.js`)

Full-screen settings overlay with sections:

| Section             | Controls                                                |
|---------------------|---------------------------------------------------------|
| Account Detail      | Username display, Change Password, Backup Data, Logout, Delete Account |
| General System      | Language (EN, ES WIP, JP WIP), Time Format (12h/24h), Theme (Light/Dark), Notifications Toggle, View Notification History |
| Focus Calibration   | Adjust Focus/Short/Long timer durations (saved to `auraTimerSettings`) |
| System Info         | Terms, Privacy, Version (`v2.5.0 IND`)                 |

---

## 4. Infrastructure

### Hosting & Deployment

ProdTasker is a **static site** (no server-side rendering). It can be deployed to any static hosting provider:

| Provider        | Method                                        |
|-----------------|-----------------------------------------------|
| GitHub Pages    | Push to `gh-pages` branch or `/docs` folder   |
| Netlify         | Drag & drop or Git integration                |
| Vercel          | Import repository                             |
| Firebase Hosting| `firebase deploy --only hosting`              |
| Local           | Open `index.html` directly or use `live-server` |

### PWA Capability

- **Service Worker** (`service-worker.js`) — Cache-first strategy.
  - Cache name: `s1n-productive-v5`
  - Precaches all HTML, CSS, JS, and asset files.
  - Falls back to network for uncached requests.
- **Manifest** (`manifest.json`) — Standalone display, portrait orientation, installable to home screen.
- **Icons** — Generated dynamically via `ui-avatars.com` API.

### Scalability Considerations

| Factor              | Current State                              | Limitation                          |
|---------------------|--------------------------------------------|-------------------------------------|
| User data           | Firebase RTDB (JSON tree)                  | 1GB free tier, scales to paid plans |
| Audio storage       | Base64 in RTDB                             | Max 2MB per file, not ideal at scale|
| Chat messages       | Firebase RTDB, `limitToLast(50)`           | Works for small user base           |
| Task data           | LocalStorage (per-user keyed)              | ~5MB browser limit                  |
| Authentication      | Custom (username/password in RTDB)         | Not hashed — see Security notes     |

### Security Notes

> ⚠️ **Critical**: Passwords are stored in **plaintext** in Firebase RTDB. This is acceptable for a personal/educational project but **must not be used in production** without implementing:
> - Server-side password hashing (bcrypt/argon2)
> - Firebase Authentication (Email/Password or OAuth)
> - Firebase Security Rules to restrict `/users` read access

Current Firebase config is client-exposed (standard for Firebase web apps) but Security Rules should be properly configured.

---

## 5. Database Schema

### Firebase Realtime Database Structure

```
/
├── users/
│   └── {username}/                    ← Key = username string
│       ├── name: string               ← Display name
│       ├── password: string           ← ⚠️ Plaintext password
│       ├── points: number             ← Total Credits (all-time)
│       ├── monthlyPoints: number      ← Credits earned this month (resets monthly)
│       ├── streak: number             ← Current consecutive-day streak
│       ├── lastTaskDate: string       ← ISO date of last completed task ("2026-07-18")
│       ├── lastActiveMonth: string    ← Month identifier ("2026-07")
│       ├── isBanned: boolean          ← Suspension flag
│       ├── joinDate: string           ← Formatted date string
│       ├── totalMinutes: number       ← Cumulative focus minutes
│       ├── totalSessions: number      ← Cumulative focus sessions
│       ├── totalTasks: number         ← Cumulative completed tasks
│       ├── tasksOnTime: number        ← Tasks completed before deadline
│       ├── tasksLate: number          ← Tasks completed after deadline
│       ├── friends: [string]          ← Array of friend usernames
│       ├── inventory: [string]        ← Array of owned item IDs
│       ├── unlockedAchievements: [string] ← Array of achievement IDs
│       └── requests/
│           └── {senderUsername}: true  ← Pending friend request
│
├── chats/
│   └── {chatId}/                      ← chatId = sorted "userA_userB"
│       └── messages/
│           └── {pushId}/
│               ├── sender: string
│               ├── text: string
│               └── timestamp: number  ← ServerValue.TIMESTAMP
│
└── system/
    ├── broadcast/
    │   ├── message: string            ← Admin broadcast text
    │   └── timestamp: number          ← ServerValue.TIMESTAMP
    └── sounds/
        └── {pushId}/
            ├── name: string           ← Display name for dropdown
            └── url: string            ← Base64 Data URI of audio file
```

### LocalStorage Keys

| Key                         | Type          | Purpose                              |
|-----------------------------|---------------|--------------------------------------|
| `auraUser`                  | JSON Object   | Current logged-in user snapshot      |
| `auraProfile`               | JSON Object   | Display stats (points, streak, etc.) |
| `auraStats`                 | JSON Object   | `{ sessions, minutes }`             |
| `auraHistory`               | JSON Array    | Last 30 focus session entries        |
| `auraTasks_{username}`      | JSON Array    | User's task list                     |
| `auraTimerSettings`         | JSON Object   | `{ work, short, long }` in minutes  |
| `auraTheme`                 | String        | Legacy theme preference              |
| `s1nSettings`               | JSON Object   | App settings (theme, timeFormat, notifications, language) |
| `auraSoundPref`             | String        | Selected sound key                   |
| `auraNotificationHistory`   | JSON Array    | Last 50 notification entries         |

---

## 6. API Documentation

### 6.1 Firebase Realtime Database (Internal)

All database operations use the Firebase JavaScript SDK (Compat mode):

```javascript
// READ (one-time)
firebase.database().ref('users/' + username).once('value')

// READ (real-time listener)
firebase.database().ref('users/' + username).on('value', callback)

// WRITE (update fields)
firebase.database().ref('users/' + username).update({ points: 100 })

// WRITE (set entire node)
firebase.database().ref('users/' + username).set(userObject)

// WRITE (push to list)
firebase.database().ref('chats/' + chatId + '/messages').push().set(message)

// DELETE
firebase.database().ref('users/' + username).remove()
```

### 6.2 Groq API (AI Task Breakdown)

**Endpoint:** `POST https://api.groq.com/openai/v1/chat/completions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {GROQ_API_KEY}
```

**Request Body:**
```json
{
  "model": "llama-3.1-8b-instant",
  "messages": [
    {
      "role": "user",
      "content": "Break down the goal: \"{user_goal}\" into exactly {N} highly actionable, short tasks. Return ONLY a valid JSON array of strings."
    }
  ],
  "temperature": 0.5
}
```

**Response Parsing:**
```javascript
const content = data.choices[0].message.content.trim();
const jsonMatch = content.match(/\[[\s\S]*\]/);  // Extract JSON array
const subtasks = JSON.parse(jsonMatch[0]);        // Parse as string array
```

**Error Handling:** Catches API errors, invalid JSON, and missing API key.

### 6.3 Global Function API (Window-scoped)

These functions are exposed on `window` for cross-module communication:

| Function                  | Module          | Purpose                                    |
|---------------------------|-----------------|--------------------------------------------|
| `addPoints(amount, reason)`| `profile.js`   | Add/deduct Credits, sync to cloud          |
| `updateStreak()`           | `profile.js`   | Evaluate and update streak counter         |
| `checkAchievements()`      | `achievements.js` | Evaluate all achievement conditions      |
| `showNotification(title, msg, type)` | `notifications.js` | Display toast notification      |
| `syncUserToDB(...)`        | `auth.js`       | Push local state to Firebase              |
| `loadTasks()`              | `tasks.js`      | Load and render task list                 |
| `loadShop()`               | `shop.js`       | Render market items                       |
| `loadContestData()`        | `social.js`     | Render social leaderboard                 |
| `initReports()`            | `reports.js`    | Generate analytics view                   |
| `triggerJuice(el, pts)`    | `app.js`        | Visual feedback (shake + flash + XP popup)|
| `setTheme(mode)`           | `app.js`        | Switch light/dark theme                   |
| `openChat(friendName)`     | `chat.js`       | Open chat modal with a friend             |
| `setFocusTask(text)`       | `pomodoro.js`   | Link a task to the focus timer            |
| `startOnboarding()`        | `onboarding.js` | Launch the onboarding slideshow           |
| `switchView(viewName)`     | Inline (HTML)   | Navigate between SPA views               |

---

## 7. Deployment Workflow

### Prerequisites

1. A Firebase project with Realtime Database enabled.
2. A Groq API key (for AI task breakdown feature).
3. A static file hosting service.

### Step-by-Step Deployment

```
Step 1: Clone or Download
─────────────────────────
$ git clone <repository-url>
$ cd ProdTasker

Step 2: Configure Firebase
──────────────────────────
Edit `js/firebase-config.js` with your Firebase project credentials:
  - apiKey, authDomain, databaseURL, projectId, etc.

Step 3: Configure Groq API Key
───────────────────────────────
Edit `js/config.js`:
  window.ENV = { GROQ_API_KEY: "your_key_here" };

Also update `.env` for reference:
  GROQ_API_KEY=your_key_here

Step 4: Configure Firebase Security Rules
──────────────────────────────────────────
In Firebase Console → Realtime Database → Rules:
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": true
      }
    },
    "chats": { ".read": true, ".write": true },
    "system": { ".read": true, ".write": true }
  }
}

Step 5: Deploy Static Files
───────────────────────────
Option A (GitHub Pages):
  $ git push origin main
  → Enable GitHub Pages in repo Settings → Source: main branch

Option B (Firebase Hosting):
  $ npm install -g firebase-tools
  $ firebase init hosting
  $ firebase deploy

Option C (Netlify):
  → Drag project folder into Netlify dashboard

Step 6: Verify
──────────────
  → Open deployed URL
  → Create a new account (triggers onboarding)
  → Add a task, start a focus session
  → Verify data appears in Firebase Console
```

### Pre-Deployment Checklist

- [ ] Firebase credentials in `firebase-config.js` are correct
- [ ] Groq API key in `config.js` is valid
- [ ] `.gitignore` includes `config.js` and `.env`
- [ ] Service worker cache version is bumped (if updating)
- [ ] All asset images exist in `/assets/`

---

## 8. Troubleshooting

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "API Key missing" on AI breakdown | `config.js` not loaded or missing `GROQ_API_KEY` | Verify `js/config.js` exists and is loaded before `tasks.js` |
| Tasks not persisting | LocalStorage full or cleared | Check `localStorage` quota; tasks are stored per-user key `auraTasks_{name}` |
| Theme not applying | `s1nSettings` key conflict | Clear `auraTheme` and `s1nSettings` from LocalStorage |
| Chat messages not appearing | Firebase listener detached | Ensure `loadChatHistory()` attaches `.on('value')` listener |
| User stuck on login screen | `auraUser` has stale/banned user data | Clear `auraUser` from LocalStorage |
| Sounds not playing in timer | Custom sound deleted from Firebase | Sound selector auto-resets to "Silent Mode" if saved pref is missing |
| Achievements not unlocking | Stats not synced to `auraUser` | Verify `totalTasks`, `totalSessions`, `streak` are being written to localStorage |
| Admin panel not showing | User is not named "Rudra" | Admin access is hardcoded to `currentUser.name === 'Rudra'` |
| PWA not updating | Old service worker cache | Bump `CACHE_NAME` version in `service-worker.js` and redeploy |
| Points "free item" glitch | Stale points read from localStorage | Fixed in `profile.js` — `addPoints()` reloads fresh data from localStorage before modifying |

### Debugging Tips

1. **Check Console** — All Firebase, Audio, and AI errors are logged to `console.error`.
2. **Inspect LocalStorage** — Use DevTools → Application → Local Storage to verify data integrity.
3. **Firebase Console** — Navigate to Realtime Database to inspect live data tree.
4. **Network Tab** — Monitor Groq API calls (status, request body, response).
5. **Service Worker** — Unregister in DevTools → Application → Service Workers if caching causes issues.

---

## 9. Maintenance & Updates

### Update Procedures

| Action | Steps |
|--------|-------|
| **Add a new achievement** | Add object to `ACHIEVEMENT_DATA` array in `achievements.js` with unique `id`, `condition`, and `reward` |
| **Add a shop item** | Add object to `SHOP_ITEMS` array in `shop.js`; add badge icon mapping in `profile.js` if badge type |
| **Change timer defaults** | Modify default values in `pomodoro.js` (`settings` object) |
| **Add a new view/tab** | 1. Add `<section id="view-name">` in `index.html` 2. Add `<button>` in `<nav>` 3. Update `switchView()` in inline script |
| **Bump PWA cache** | Increment version in `CACHE_NAME` in `service-worker.js` |
| **Add background sound** | Upload via Admin Panel (≤2MB audio file) or manually push to `/system/sounds` in Firebase |

### Backup & Recovery

- **User-initiated backup:** Settings → "Backup Database" exports all user data as a `.json` file.
- **Firebase backup:** Use Firebase Console → Realtime Database → Export JSON.
- **LocalStorage snapshot:** Can be exported via DevTools console:
  ```javascript
  JSON.stringify(localStorage, null, 2)
  ```

### Version History

| Version   | Codename    | Changes                                     |
|-----------|-------------|----------------------------------------------|
| v2.5.0    | IND         | Current — Industrial theme, AI breakdown, PWA |

---

## 10. Glossary

| Term                  | Definition |
|-----------------------|------------|
| **Protocol**          | A task/to-do item in ProdTasker's terminology |
| **Credits**           | Virtual currency earned by completing tasks and focus sessions |
| **XP**                | Experience points, used interchangeably with Credits |
| **Focus Session**     | A completed Pomodoro or Stopwatch timer run |
| **Streak**            | Count of consecutive days with at least one task completed |
| **League**            | Monthly leaderboard, reset at the start of each calendar month |
| **Agent**             | A registered ProdTasker user (used in UI copy) |
| **Deep Work**         | Prolonged, focused, distraction-free work session |
| **Soundscape**        | Background audio played during focus sessions |
| **Juice**             | Visual micro-feedback (shake, flash, XP popup) on user actions |
| **Magnetic Button**   | Button that subtly follows the cursor on hover |
| **Industrial Monochrome** | The app's design language — strict, clean, utilitarian |
| **RTDB**              | Firebase Realtime Database |
| **SPA**               | Single Page Application — all views in one HTML file |
| **PWA**               | Progressive Web App — installable, offline-capable web app |
| **Compat SDK**        | Firebase's backward-compatible JavaScript library (namespace-based) |
| **Base64 Data URI**   | Binary file encoded as a text string for inline storage |
| **Groq**              | AI inference platform used for the LLama 3.1 task breakdown |
| **Flow State**        | Stopwatch mode — untimed, open-ended focus |
| **Onboarding**        | First-time user tutorial slideshow |

---

## File Structure Reference

```
ProdTasker/
├── index.html              ← Single-page app entry point (all UI)
├── brain.md                ← This document
├── README.md               ← Public-facing project documentation
├── manifest.json           ← PWA configuration
├── service-worker.js       ← Offline caching (cache-first strategy)
├── .env                    ← Environment variables (gitignored)
├── .gitignore              ← Git exclusions
│
├── css/
│   └── style.css           ← Custom theme variables, components, animations
│
├── js/
│   ├── config.js           ← ENV variable exposure (GROQ_API_KEY)
│   ├── firebase-config.js  ← Firebase initialization
│   ├── auth.js             ← Login/Register, Admin panel, Cloud sync
│   ├── tasks.js            ← Task CRUD, 5-limit, AI breakdown
│   ├── pomodoro.js         ← Timer engine, sounds, session history
│   ├── profile.js          ← Credits, Streak, Heatmap, Data export
│   ├── social.js           ← Leaderboard, Friends, Profile inspect
│   ├── chat.js             ← Real-time messaging, Inbox
│   ├── shop.js             ← Market items, Purchase flow
│   ├── achievements.js     ← Trophy evaluation and effects
│   ├── notifications.js    ← Toast system with history
│   ├── reports.js          ← Analytics (daily/weekly/monthly)
│   ├── onboarding.js       ← New-user slide tutorial
│   └── app.js              ← Theme, Settings, Juice system, PWA
│
└── assets/
    ├── 122393.jpg           ← Onboarding slide images (dark variants)
    ├── 122395.jpg           ← Onboarding slide images (light variants)
    ├── ... (10 images total)
    └── 122413.jpg
```

---

## Potential Future Enhancements

- **AI Task Breakdown v2** — Context-aware breakdown using conversation history.
- **Multiplayer/Co-Op Focus Rooms** — Real-time shared Pomodoro sessions.
- **Contribution Heatmap** — GitHub-style calendar for daily consistency tracking.
- **Advanced Micro-Interactions** — Refined component animations and transitions.
- **Password Hashing** — Migrate to Firebase Authentication or implement bcrypt.
- **i18n Localization** — Complete Spanish and Japanese translations.

---

*Last updated: July 18, 2026 | Version: v2.5.0 (IND)*
