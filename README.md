# Smart Roster Management System

A full-stack monthly roster planning, deterministic scheduling, and live conflict-validation platform built for D2C customer experience (CX) and operations agencies managing multiple brands, processes, and operational pods.

- **Live Application:** `[https://smart-roster-manager.vercel.app]`
- **Backend API Health Check:** `[https://smart-roster-manager-backend.vercel.app/api/health]`
- **Demo Video (3–5 min):** `[Add your demo video link here]`

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Key Features](#key-features)
3. [Architecture & Database Schema](#architecture--database-schema)
4. [Sample Dataset & Documented Assumptions](#sample-dataset--documented-assumptions)
5. [Local Setup Instructions](#local-setup-instructions)
6. [API Overview](#api-overview)
7. [Tell Us How You Think](#tell-us-how-you-think)

---

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS (`@tailwindcss/vite`), Lucide React
- **Backend:** Node.js, Express (ES Modules), `mysql2/promise`
- **Database:** MySQL-compatible **TiDB Cloud Starter** (11 normalized relational tables)
- **Deployment:** Vercel (Frontend + Serverless Express API)

---

## Key Features

- **Centralized Configuration (Full CRUD):** Manage Pods, Pod Leads, Employees (with preferred weekly offs), Brands, Processes, Brand-Process operating rules, Permanent Allocations, Public Holidays, and Employee Leaves directly through the UI—no code changes required.
- **4 Client-Specific Operating Calendars:** Granular working-day rules at the **Brand + Process** level:
  - `365_DAYS` (operates every day including Sundays and public holidays)
  - `PUBLIC_HOLIDAYS_OFF` (operates daily, closed on public holidays)
  - `SUNDAYS_OFF` (closed on Sundays, operates on public holidays)
  - `SUNDAYS_AND_HOLIDAYS_OFF` (closed on Sundays and public holidays)
- **Deterministic 2-Pass Monthly Roster Generator:** Generates an entire month's schedule in a single bulk upsert while preserving manual overrides (`is_manual_override`), honoring approved leaves, applying public holidays accurately, and staggering weekly offs to protect multi-employee minimum staffing.
- **Decoupled Live Conflict Validator:** Separates **Critical Hard Constraints** (`UNSTAFFED_PROCESS`, `UNDERSTAFFED_PROCESS`, `MULTI_BRAND_CASCADE`, `INVALID_TEMP_COVER`) from **Soft Warnings** (`PREFERENCE_OVERRIDDEN`, `NO_WEEKLY_OFF`, `LEAVE_OVERRIDE`), calculates publish readiness, and recommends available same-pod backups sorted by lightest workload.
- **All 5 Required Stakeholder Views:**
  1. **Company-Wide View:** Full 30-day schedule grid grouped by Pod with sticky employee columns.
  2. **Pod-Wise View:** Filtered view under each Pod Lead.
  3. **Brand-Wise View:** Daily Coverage Health Matrix (covered / shortage / closed per process) alongside assigned staff schedules.
  4. **Process-Wise View:** Cross-brand view of staffing requirements and schedules for any process.
  5. **Employee-Wise View:** Individual monthly calendar, allocation summary, status counters, and personal conflicts.
- **Post-Generation Change Handling:** Edit any individual schedule cell (`WORKING`, `WEEKLY_OFF`, `PUBLIC_HOLIDAY`, `PLANNED_LEAVE`, `COMP_OFF`, `SICK_LEAVE`) or assign/remove a one-day `Temporary_Cover` substitute with 1 click—re-validating the entire month live without rebuilding the roster.

---

## Architecture & Database Schema

The relational database is normalized into **11 tables** (8 configuration/input tables and 3 roster output tables):

### Configuration & Input Tables (8)
1. **`Pod`** — Operational pods with optional unique `name` and nullable `pod_lead_id` referencing `Employee(id)` (`ON DELETE SET NULL`).
2. **`Employee`** — Staff profiles (`name`, unique `email`, unique `phone`, `pod_id`, `is_manager`, `preferred_weekly_off`).
3. **`Process`** — Standard and brand-specific processes (CS, ACC, NDR, Retention, VIP Styling, Cold-Chain Tracking).
4. **`Brand`** — D2C client accounts assigned to a managing `Pod`.
5. **`Brand_Process`** — Composite junction (`UNIQUE(brand_id, process_id)`) storing `minimum_staff` and `operating_calendar`.
6. **`Employee_Allocation`** — Permanent staffing links (`UNIQUE(employee_id, brand_process_id)`).
7. **`Public_Holidays`** — Date-range company/client holiday lookup table (`start_date`, `end_date`, `description`).
8. **`Employee_Leaves`** — Planned leaves, comp-offs, and sick leaves (`type`, `status`, plus a MySQL `VIRTUAL` generated `total_days` column).

### Roster Output Tables (3)
9. **`Monthly_Roster`** — Month-level container (`UNIQUE(month, year)`) tracking `DRAFT` vs. `PUBLISHED` lifecycle.
10. **`Roster_Entry`** — One normalized row per `(employee_id, date)` storing daily `status`, `is_manual_override`, and `notes`.
11. **`Temporary_Cover`** — One-day substitute coverage linking a working employee's `roster_entry_id` to a `brand_process_id` without modifying permanent `Employee_Allocation` records.

### Project Structure
```text
smart-roster-manager/
├── backend/
│   ├── config/db.js                  # TiDB Cloud mysql2 connection pool (TLS + dateStrings)
│   ├── db/
│   │   ├── schema.sql                # Full 11-table DDL
│   │   ├── initDb.js                 # Schema initializer script
│   │   ├── seed.sql                  # Realistic 32-employee / 20-brand sample dataset
│   │   └── runSeed.js                # Seed runner script
│   ├── services/
│   │   ├── calendarHelper.js         # UTC date helpers, week grouping, 4-rule calendar checker
│   │   ├── rosterGenerator.js        # 2-pass deterministic generator + bulk upsert
│   │   └── conflictValidator.js      # Hard/soft conflict validator + same-pod backup recommender
│   ├── routes/
│   │   ├── rosterRoutes.js           # Generate, validate, publish, 5 views, cell edit, temp cover
│   │   └── configRoutes.js           # Full CRUD for all 8 setup tables
│   ├── server.js                     # Express app (local + Vercel serverless export)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.js                    # Centralized REST client
│   │   ├── context/ToastContext.jsx  # Global success/error toast notifications
│   │   └── components/               # 5 views, KPI strip, Edit Cell Modal, Conflicts Drawer, CRUD tabs
│   └── .env.example
└── README.md
```

---

## Sample Dataset & Documented Assumptions

The database is pre-seeded via `backend/db/seed.sql` with realistic operational data:
- **3 Operational Pods:** Pod Alpha (Aarav Sharma), Pod Beta (Neha Kapoor), Pod Gamma (Devika Pillai).
- **32 Employees:** 3 Pod Leads + 29 Agents with varied `preferred_weekly_off` days.
- **6 Processes:** Customer Support (CS), Abandoned Cart Conversions (ACC), Non-Delivery Report (NDR), Retention, VIP Styling, and Cold-Chain Tracking.
- **20 D2C Brands (80% Solo / 20% Multi-Employee Split):**
  - **16 Solo-Resource Brands (80%):** One dedicated employee owns all processes for the brand (e.g., *AeroWear*, *GlowSkin*, *FreshCrate*).
  - **4 Multi-Employee Brands (20%):** Demonstrates both **split-process** teams (e.g., *VoltRide*, *VerveFit*) and **shared-process** teams requiring `minimum_staff = 2` (e.g., *NovaTech CS* and *StyleVault CS*, each staffed by 3 agents).
  - **Cross-Brand Resource:** *Divya Menon* handles *NovaTech (Retention)* and *VerveFit (CS)* to demonstrate cascading multi-brand impact.
- **Calendar Scenarios (Nov & Dec 2026):** Includes Diwali (Nov 8), Guru Nanak Jayanti (Nov 24), Christmas Day (Dec 25), and a mix of `APPROVED` and `PENDING` leaves/comp-offs.

### Documented Assumptions
1. **1 Weekly Off Per Week:** Every full-time employee is entitled to 1 weekly off per calendar week (Mon–Sun). The generator never silently forces a solo employee to work 30 consecutive days to hide a staffing shortage.
2. **Approved Leaves Only:** Only `APPROVED` leaves in `Employee_Leaves` block availability during roster generation; `PENDING` and `REJECTED` requests are ignored until approved.
3. **Public Holiday Eligibility:** An employee automatically receives `PUBLIC_HOLIDAY` off only if **all** of their permanently assigned processes are closed on public holidays.
4. **Same-Pod Backups:** Backup suggestions prioritize non-manager teammates within the **same pod** who are already `WORKING` on that date, ranked by lightest permanent process load (with the Pod Lead available as last-resort backup).

---

## Engineering Focus & Key Trade-Offs

### 1. Backend-First Architecture (Frontend Built with Antigravity)
To prioritize solving the core operational scheduling problem within the assessment timeline, I designed and built the **11-table TiDB/MySQL schema, raw SQL seed dataset, deterministic 2-pass roster generator, decoupled conflict validator, and Express REST API** directly. The **React + Tailwind frontend was accelerated using Antigravity** and wired directly to my live backend endpoints (zero mock data). Rather than spending the majority of time on custom UI micro-animations, I focused on guaranteeing accurate coverage math, timezone-safe UTC date handling, manual-override protection, and live conflict re-validation.

### 2. Why Authentication / Login Is Intentionally Omitted
I intentionally left the application open without a login gate for this submission so reviewers and evaluators can immediately test all 5 roster views, trigger roster generation, edit schedules, assign temporary cover, and manage configuration rules without dealing with test credentials or sign-up friction. In a production deployment (or upon request), role-based authentication (e.g., JWT/session auth separating `Operations Manager` full access from `Pod Lead` pod-scoped access) can be added cleanly as Express middleware in front of `/api/rosters` and `/api/config`.


## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- A MySQL 8+ or TiDB Cloud Starter database

### 1. Clone the Repository
```bash
git clone https://github.com/AryanJadhav15/smart-roster-manager-2026
cd smart-roster-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Update `backend/.env` with your database credentials:
```env
PORT=5001
DB_HOST=your_tidb_or_mysql_host
DB_PORT=4000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_roster
```
Initialize all 11 tables and seed the sample data:
```bash
node db/initDb.js
node db/runSeed.js
npm run dev
```
Confirm the API is live at `http://localhost:5001/api/health`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```
Ensure `frontend/.env` points to your backend:
```env
VITE_API_URL=http://localhost:5001
```
Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## API Overview

| Area | Endpoint | Purpose |
| :--- | :--- | :--- |
| **Health** | `GET /api/health` | Verify DB connectivity |
| **Roster** | `POST /api/rosters/generate` | Generate/regenerate monthly roster + run validation |
| **Roster** | `GET /api/rosters/view` | Fetch Company, Pod, Brand, Process, or Employee view |
| **Roster** | `GET /api/rosters/validate` | Run live conflict validation for a month |
| **Roster** | `PATCH /api/rosters/:year/:month/status` | Publish (`PUBLISHED`) or reopen (`DRAFT`) a roster |
| **Edits** | `PATCH /api/rosters/entry/:id` | Manually edit a daily cell (`is_manual_override = TRUE`) + re-validate |
| **Cover** | `POST /api/rosters/temp-cover` | Assign one-day substitute cover + re-validate |
| **Cover** | `DELETE /api/rosters/temp-cover/:id` | Remove temporary cover + re-validate |
| **Config** | `GET /api/config/overview` | Fetch all 8 setup tables in parallel |
| **Config** | `/api/config/{pods,employees,processes,brands,brand-processes,allocations,holidays,leaves}` | Full CRUD for all configuration entities |

---

## Tell Us How You Think

### 1. How did you model employees, brands, processes, pods, and their relationships?
I normalized the domain into **8 configuration/input tables** and **3 schedule output tables**:
- `Pod` has a 1-to-Many relationship with both `Employee` and `Brand`, plus a nullable `pod_lead_id` foreign key pointing to `Employee(id)` (added via `ALTER TABLE` to cleanly handle the circular `Pod ↔ Employee` dependency).
- Rather than attaching operating calendars directly to `Brand` or linking employees independently to brands and processes, I introduced `Brand_Process` (`UNIQUE(brand_id, process_id)`) to own `minimum_staff` and `operating_calendar`. This allows two processes under the same brand (e.g., *AeroWear CS* on `365_DAYS` and *AeroWear NDR* on `SUNDAYS_OFF`) to follow different rules.
- `Employee_Allocation` maps `Employee` directly to `Brand_Process`, making it impossible to assign an employee to a process that a brand does not use.
- For generated schedules, instead of a rigid 31-column table, `Monthly_Roster` stores month-level `DRAFT`/`PUBLISHED` metadata, `Roster_Entry` stores one row per `(employee_id, date)` with an `is_manual_override` flag, and `Temporary_Cover` stores one-day substitute coverage without mutating permanent allocations.

### 2. How does your system generate a roster and determine whether it satisfies the required constraints?
I decoupled **Generation** (`rosterGenerator.js`) from **Validation** (`conflictValidator.js`):
- **2-Pass Deterministic Generator:**
  - *Pass 1 (Fixed States):* Builds all dates in UTC (eliminating IST/UTC off-by-one bugs), preserves existing `is_manual_override = TRUE` cells, applies `APPROVED` leaves, sets `PUBLIC_HOLIDAY` for employees whose assigned processes are all closed on that holiday, and defaults remaining days to `WORKING`.
  - *Pass 2 (Weekly-Off Rotation):* Iterates week-by-week (Mon–Sun) and tries each employee's `preferred_weekly_off` first. Before committing an off day, it checks whether removing that employee drops any operating `Brand_Process` below `minimum_staff`. If it would, the engine searches for a safe alternate day in that week; if no day is safe (such as a solo 365-day brand), it assigns the preferred off so the employee still gets rest and lets the validator surface the coverage gap. All ~960 cells are saved in a single bulk `INSERT ... ON DUPLICATE KEY UPDATE`.
- **Decoupled Validator:** Reads the saved `Roster_Entry` and `Temporary_Cover` rows and evaluates every operating `Brand_Process` on every date against `minimum_staff`, while scanning for multi-brand cascades, invalid temp covers, overridden preferences, and missing weekly offs. Because validation is independent, every manual edit or temp-cover assignment triggers instant live re-validation.

### 3. How did you handle the difference between single-resource brands and brands with multiple employees?
Both staffing models are handled natively by `Brand_Process` + `Employee_Allocation` without separate code paths or special-case tables:
- **Single-resource brands (~80%):** One employee holds multiple `Employee_Allocation` rows for that brand (e.g., CS and NDR for *AeroWear*, each with `minimum_staff = 1`). On non-operating days (like Sunday for `SUNDAYS_OFF`), their absence produces zero conflicts; on operating days (`365_DAYS`), their absence triggers a `0/1` `UNSTAFFED_PROCESS` alert.
- **Multi-employee brands (~20%):**
  - *Split-process brands* assign different agents to different `Brand_Process` rows (e.g., *VoltRide*), so one agent's leave only affects their process.
  - *Shared-process brands* assign multiple agents to the same `Brand_Process` with `minimum_staff > 1` (e.g., 3 agents on *NovaTech CS* with `minimum_staff = 2`). During generation, the engine staggers their weekly offs so at least 2 agents remain active; if one becomes unavailable, the validator recalculates active coverage (`2/2` = covered, `1/2` = `UNDERSTAFFED_PROCESS`).

### 4. What happens when an employee manages all processes for a brand but is unavailable on a required working day?
When a solo resource takes a weekly off, planned leave, or sudden sick leave on a required working day (for example, *Priya Nair* on *AeroWear CS* during her Nov 18–19 planned leave):
1. The validator immediately flags a `CRITICAL` `UNSTAFFED_PROCESS` conflict (`0/1 staff`) naming the exact brand, process, date, and absent employee.
2. It scans the same operational pod for teammates currently marked `WORKING` on that date and ranks up to 3 `suggestedBackups` by lightest current process load.
3. In the Conflicts Drawer, the operations manager clicks **"Assign [Name] as Cover"**, which inserts a single-day `Temporary_Cover` record without touching permanent `Employee_Allocation` data, and live re-validation immediately clears the gap.

### 5. How does your system handle conflicting requirements or insufficient staffing?
The engine enforces a clear hierarchy between **mandatory operational constraints** and **soft preferences**, and never silently hides impossible schedules:
- **Mandatory Constraints (`CRITICAL`):** `UNSTAFFED_PROCESS`, `UNDERSTAFFED_PROCESS`, `MULTI_BRAND_CASCADE` (when one person's absence impacts 2+ brands simultaneously, like *Divya Menon*), and `INVALID_TEMP_COVER` (if a substitute is later moved off `WORKING`). These block the "Publish Ready" indicator until resolved.
- **Soft Preferences (`WARNING`):** `PREFERENCE_OVERRIDDEN` (weekly off rotated away from preferred day to protect client coverage), `NO_WEEKLY_OFF` (manual edit left someone working a full week), and `LEAVE_OVERRIDE` (manual edit scheduled someone on an approved leave day).
- When staffing is mathematically insufficient (1 employee on a `365_DAYS` brand), the system preserves the employee's weekly off and surfaces the exact gap so leadership can assign temporary cover or adjust staffing.

### 6. Which parts of the process did you automate, and which did you leave under human control? Why?
- **Automated:** Monthly calendar expansion, holiday/leave resolution, weekly-off rotation on shared processes, exhaustive daily coverage validation across all 45 brand-processes, multi-brand cascade detection, and ranking available same-pod backup candidates. These are repetitive, error-prone calculations where deterministic logic is fast and 100% consistent.
- **Human Control:** Approving/rejecting leaves, choosing *which* specific teammate takes on `Temporary_Cover` (managers have context on brand familiarity, ticket volume, and fatigue), manual cell overrides (`is_manual_override`), and deciding when to publish a roster (`DRAFT` → `PUBLISHED`). Keeping final judgment with the operations manager builds operational trust while giving instant validation feedback on every change.

### 7. If the company doubled its team and brand count, what would you change about your solution?
At 2x scale (60+ employees, 40+ brands, ~1,800+ daily cells per month):
- **Database & UI Performance:** Add composite indexes on `Roster_Entry(monthly_roster_id, date, status)` and `Employee_Allocation(brand_process_id)`, and virtualize or paginate the Company-Wide grid by Pod so the browser isn't rendering 1,800+ cells simultaneously.
- **Scoped Incremental Validation:** On single-cell edits or temp-cover updates, re-validate only the edited `date` (and its week for `NO_WEEKLY_OFF`) rather than re-checking all 30 days.
- **Role-Based Access Control (RBAC):** Add authentication separating Ops Admins (company-wide) from Pod Leads (scoped to their own pod's approvals and conflicts).
- **Skill / Brand-Familiarity Matrix:** Track which agents are cross-trained on which brands so backup suggestions only recommend qualified substitutes.

### 8. If you had one additional week to work on this, what would you improve first?
1. **Cross-Month Fairness Rotation:** Track historical preference overrides and temporary-cover counts across consecutive months so the same employee isn't repeatedly asked to give up their preferred Sunday off or cover extra brands.
2. **Shift Windows & Overlap Support:** Extend `Brand_Process` and `Roster_Entry` to support shift timings (Morning / Evening / Night) and handoff overlaps for 24×7 support operations.
3. **Audit Log & Notifications:** Record a full audit trail of manual overrides (who edited what and why) and trigger Slack/email notifications whenever a `PUBLISHED` roster is modified.
4. **Batch Auto-Fill Backups (Preview Mode):** Allow managers to preview an auto-proposed set of `Temporary_Cover` assignments for all solo-brand weekly offs in a month and approve/adjust them in one click.
