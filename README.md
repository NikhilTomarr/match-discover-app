# Coy — Discover Tab (SDE Intern Assignment)

A mobile-first, swipe-based discovery experience built alongside a placeholder Home tab for Coy, designed with strict mutual-match privacy guarantees.

## Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend:** Next.js API Routes
- **Storage:** File-based JSON persistence (`data/db.json`) — assumes a single logged-in user (no external auth)

## Features Implemented
- **Tab Navigation:** Blank placeholder `Home` tab and a full-featured `Discover` tab.
- **30 Seeded Profiles:** Includes name, age, photo, bio, city/college, and interests, with a subset pre-liked to demonstrate mutual matches.
- **Swipe Experience:** One card at a time with smooth drag gestures on mobile, clickable Like/Pass buttons (plus `←` / `→` keyboard shortcuts) on desktop, visual `LIKE`/`PASS` indicators, and a clear empty state when all profiles are swiped.
- **Privacy-First Matching:** `hasLikedUser` is strictly kept server-side and stripped from `GET /api/feed` responses so unreciprocated likes are never exposed in the UI or network payload.
- **Match Flow & Persistence:** Instant `"It's a match!"` modal on mutual likes, a dedicated **Matches** view, duplicate-swipe protection, and full persistence across page reloads.

## Backend API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/feed` | Returns unswiped profiles (with `hasLikedUser` stripped for privacy). |
| `POST` | `/api/swipe` | Accepts `{ id, action: "like" \| "pass" }`, persists the swipe, and returns `{ success, isMatch, matchedProfile }`. |
| `GET` | `/api/matches` | Returns all mutual matches persisted in storage. |

## Running Locally

```bash
# 1. Clone the repository
git clone [https://github.com/NikhilTomarr/match-discover-app.git](https://github.com/NikhilTomarr/match-discover-app.git)
cd match-discover-app

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

```

Open http://localhost:3000 in your browser (best viewed in mobile viewport or standard desktop browser).

## Resetting Demo State
To reset all swipes and matches back to the initial 30 profiles, set "swipes": [] and "matches": [] at the bottom of data/db.json.
