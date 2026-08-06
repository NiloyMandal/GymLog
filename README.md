# GymLog — Personal Gym Training Logger

A mobile-first, offline-first PWA for logging workouts mid-session and reviewing progress at home. All data stays on your device — no backend, no accounts, no cloud.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) on your phone or desktop.

## Install as PWA

1. Open the app in Chrome/Safari on your phone
2. Tap "Add to Home Screen" (or "Install" on desktop Chrome)
3. The app works fully offline after first load

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Storage | Dexie.js (IndexedDB) |
| Charts | Recharts |
| PWA | vite-plugin-pwa |
| Icons | Lucide React |
| Routing | React Router v6 |

## Data Model

All data lives in IndexedDB via Dexie.js. No server needed.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Exercise   │     │   Routine    │     │  WorkoutLog  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (auto)    │◄────│ exercises[]  │     │ id (auto)    │
│ name         │     │  exerciseId  │     │ date         │
│ muscleGroup  │     │  targetSets  │     │ routineId?   │
│ defaultUnit  │     │  targetReps  │     │ exercises[]  │
└──────────────┘     │ name         │     │  exerciseId  │
                     └──────────────┘     │  sets[]      │
                                          │   weight     │
┌──────────────┐     ┌──────────────┐     │   reps       │
│  BodyMetric  │     │   Settings   │     │   completed  │
├──────────────┤     ├──────────────┤     │ startTime    │
│ id (auto)    │     │ key (unique) │     │ endTime      │
│ date         │     │ value        │     │ notes        │
│ bodyweight   │     └──────────────┘     └──────────────┘
│ measurements │
└──────────────┘
```

### Relationships
- A **Routine** contains an ordered list of exercises (by `exerciseId`) with target sets × reps
- A **WorkoutLog** optionally references a routine and stores the actual performed sets
- **Settings** is a key-value store (unit preference, rest timer length, routine rotation index)
- **BodyMetric** entries are independent date-stamped bodyweight measurements

## Screens

| Screen | Path | Description |
|---|---|---|
| Dashboard | `/` | Today's date, next routine in rotation, streak, weekly view |
| Log Workout | `/workout` | Pick routine or freestyle, log sets with steppers, rest timer, PR detection |
| Exercise Library | `/exercises` | Searchable list grouped by muscle group, add custom exercises |
| Exercise Detail | `/exercises/:id` | History, PR highlight, weight-over-time chart |
| Routines | `/routines` | List, create, edit, delete routines |
| Routine Editor | `/routines/new` or `/routines/:id/edit` | Add/reorder exercises, set targets |
| Progress | `/progress` | Calendar heatmap, per-exercise charts, PR board, bodyweight trend |
| Settings | `/settings` | Unit toggle, rest timer, export/import JSON, reset |

## Features

- **Large tap targets & bold numbers** — designed for mid-workout use on a phone
- **Rest timer** — auto-starts after completing a set, circular countdown with audible alert
- **PR detection** — confetti celebration when you hit a new personal record
- **Routine rotation** — Dashboard suggests your next routine in the Push/Pull/Legs cycle
- **Streak tracking** — consecutive workout days
- **GitHub-style heatmap** — 52-week workout activity calendar
- **Offline-first** — all data in IndexedDB, works without internet
- **Export/Import** — full JSON backup and restore

## Seed Data

On first launch, the app seeds:
- ~48 common exercises across 7 muscle groups (chest, back, legs, shoulders, arms, core, cardio)
- 3 starter routines: Push Day, Pull Day, Leg Day

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```
