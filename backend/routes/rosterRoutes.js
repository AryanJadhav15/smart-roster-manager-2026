import express from "express";
import db from "../config/db.js";
import { generateMonthlyRoster } from "../services/rosterGenerator.js";
import { validateMonthlyRoster } from "../services/conflictValidator.js";

const router = express.Router();

const VALID_ENTRY_STATUSES = [
    "WORKING",
    "WEEKLY_OFF",
    "PUBLIC_HOLIDAY",
    "PLANNED_LEAVE",
    "COMP_OFF",
    "SICK_LEAVE",
];

// Helper: Generate ['YYYY-MM-01', ..., 'YYYY-MM-30'] in UTC (timezone-safe)
function getMonthDateStrings(year, month) {
    const dates = [];
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mm = String(month).padStart(2, "0");
    for (let d = 1; d <= totalDays; d++) {
        dates.push(`${year}-${mm}-${String(d).padStart(2, "0")}`);
    }
    return dates;
}

// =========================================================
// 1. LIST ALL GENERATED MONTHLY ROSTERS
// GET /api/rosters
// =========================================================
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM Monthly_Roster ORDER BY year DESC, month DESC",
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 2. GENERATE (OR REGENERATE) A MONTHLY ROSTER + VALIDATE
// POST /api/rosters/generate   Body: { year: 2026, month: 11 }
// =========================================================
router.post("/generate", async (req, res) => {
    try {
        const year = Number(req.body.year);
        const month = Number(req.body.month);

        if (!year || !month || month < 1 || month > 12) {
            return res
                .status(400)
                .json({ error: "Valid year and month (1-12) are required." });
        }

        const generation = await generateMonthlyRoster(year, month);
        const validation = await validateMonthlyRoster(year, month);

        res.json({
            message: `Roster generated for ${year}-${String(month).padStart(2, "0")}`,
            generation,
            validation,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 3. VALIDATE AN EXISTING MONTHLY ROSTER
// GET /api/rosters/validate?year=2026&month=11
// =========================================================
router.get("/validate", async (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!year || !month || month < 1 || month > 12) {
            return res
                .status(400)
                .json({
                    error: "Valid year and month query params are required.",
                });
        }

        const validation = await validateMonthlyRoster(year, month);
        res.json(validation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 4. PUBLISH OR REOPEN A MONTHLY ROSTER
// PATCH /api/rosters/:year/:month/status   Body: { status: 'PUBLISHED' }
// =========================================================
router.patch("/:year/:month/status", async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);
        const { status } = req.body;

        if (!["DRAFT", "PUBLISHED"].includes(status)) {
            return res
                .status(400)
                .json({ error: "Status must be 'DRAFT' or 'PUBLISHED'." });
        }

        const [result] = await db.query(
            "UPDATE Monthly_Roster SET status = ? WHERE year = ? AND month = ?",
            [status, year, month],
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Monthly roster not found." });
        }

        res.json({
            message: `Roster status updated to ${status}`,
            year,
            month,
            status,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 5. ALL 5 ROSTER VIEWS (Company, Pod, Brand, Process, Employee)
// GET /api/rosters/view?year=2026&month=11&view=company
//     &podId=1 | &brandId=1 | &processId=1 | &employeeId=2
// =========================================================
router.get("/view", async (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const view = (req.query.view || "company").toLowerCase();
        const { podId, brandId, processId, employeeId } = req.query;

        if (!year || !month || month < 1 || month > 12) {
            return res
                .status(400)
                .json({ error: "Valid year and month are required." });
        }

        // 1. Check if Monthly_Roster exists
        const [rosters] = await db.query(
            "SELECT * FROM Monthly_Roster WHERE year = ? AND month = ?",
            [year, month],
        );
        if (rosters.length === 0) {
            return res.json({
                exists: false,
                message: "No roster has been generated for this month yet.",
            });
        }
        const roster = rosters[0];
        const dates = getMonthDateStrings(year, month);

        // 2. Fetch employees with their pod info (filtered by view if applicable)
        let empSql = `
      SELECT e.*, p.name AS pod_name, p.pod_lead_id
      FROM Employee e
      JOIN Pod p ON e.pod_id = p.id
    `;
        const empParams = [];

        if (view === "pod" && podId) {
            empSql += " WHERE e.pod_id = ?";
            empParams.push(Number(podId));
        } else if (view === "employee" && employeeId) {
            empSql += " WHERE e.id = ?";
            empParams.push(Number(employeeId));
        } else if (view === "brand" && brandId) {
            empSql += `
        WHERE e.id IN (
          SELECT DISTINCT ea.employee_id
          FROM Employee_Allocation ea
          JOIN Brand_Process bp ON ea.brand_process_id = bp.id
          WHERE bp.brand_id = ?
          UNION
          SELECT DISTINCT re.employee_id
          FROM Temporary_Cover tc
          JOIN Roster_Entry re ON tc.roster_entry_id = re.id
          JOIN Brand_Process bp ON tc.brand_process_id = bp.id
          WHERE re.monthly_roster_id = ? AND bp.brand_id = ?
        )
      `;
            empParams.push(Number(brandId), roster.id, Number(brandId));
        } else if (view === "process" && processId) {
            empSql += `
        WHERE e.id IN (
          SELECT DISTINCT ea.employee_id
          FROM Employee_Allocation ea
          JOIN Brand_Process bp ON ea.brand_process_id = bp.id
          WHERE bp.process_id = ?
          UNION
          SELECT DISTINCT re.employee_id
          FROM Temporary_Cover tc
          JOIN Roster_Entry re ON tc.roster_entry_id = re.id
          JOIN Brand_Process bp ON tc.brand_process_id = bp.id
          WHERE re.monthly_roster_id = ? AND bp.process_id = ?
        )
      `;
            empParams.push(Number(processId), roster.id, Number(processId));
        }
        empSql += " ORDER BY e.pod_id, e.is_manager DESC, e.name";

        const [employees] = await db.query(empSql, empParams);

        // 3. Fetch daily Roster_Entry rows for this month
        const [entries] = await db.query(
            "SELECT * FROM Roster_Entry WHERE monthly_roster_id = ? ORDER BY date",
            [roster.id],
        );

        // 4. Fetch permanent allocations with Brand & Process names
        const [allocations] = await db.query(`
      SELECT
        ea.employee_id,
        ea.brand_process_id,
        bp.brand_id,
        b.name AS brand_name,
        b.pod_id AS brand_pod_id,
        bp.process_id,
        pr.name AS process_name,
        bp.minimum_staff,
        bp.operating_calendar
      FROM Employee_Allocation ea
      JOIN Brand_Process bp ON ea.brand_process_id = bp.id
      JOIN Brand b ON bp.brand_id = b.id
      JOIN Process pr ON bp.process_id = pr.id
    `);

        // 5. Fetch Temporary_Cover rows for this month
        const [tempCovers] = await db.query(
            `
      SELECT
        tc.id,
        tc.roster_entry_id,
        tc.brand_process_id,
        tc.notes,
        re.employee_id,
        re.date,
        e.name AS employee_name,
        b.name AS brand_name,
        pr.name AS process_name
      FROM Temporary_Cover tc
      JOIN Roster_Entry re ON tc.roster_entry_id = re.id
      JOIN Employee e ON re.employee_id = e.id
      JOIN Brand_Process bp ON tc.brand_process_id = bp.id
      JOIN Brand b ON bp.brand_id = b.id
      JOIN Process pr ON bp.process_id = pr.id
      WHERE re.monthly_roster_id = ?
    `,
            [roster.id],
        );

        // 6. Group entries, allocations, and temp covers by employee_id
        const entriesByEmp = {};
        for (const entry of entries) {
            if (!entriesByEmp[entry.employee_id])
                entriesByEmp[entry.employee_id] = {};
            entriesByEmp[entry.employee_id][entry.date] = entry;
        }

        const allocsByEmp = {};
        for (const a of allocations) {
            if (!allocsByEmp[a.employee_id]) allocsByEmp[a.employee_id] = [];
            allocsByEmp[a.employee_id].push(a);
        }

        const coversByEntryId = {};
        for (const tc of tempCovers) {
            if (!coversByEntryId[tc.roster_entry_id])
                coversByEntryId[tc.roster_entry_id] = [];
            coversByEntryId[tc.roster_entry_id].push(tc);
        }

        const formattedEmployees = employees.map((emp) => {
            const empEntries = entriesByEmp[emp.id] || {};
            const schedule = {};
            for (const date of dates) {
                const cell = empEntries[date] || null;
                schedule[date] = cell
                    ? { ...cell, temp_covers: coversByEntryId[cell.id] || [] }
                    : null;
            }
            return {
                ...emp,
                allocations: allocsByEmp[emp.id] || [],
                schedule,
            };
        });

        // 7. Fetch Brand_Process list (useful for Brand & Process coverage views)
        let bpSql = `
      SELECT
        bp.id AS brand_process_id,
        bp.brand_id,
        b.name AS brand_name,
        b.pod_id,
        bp.process_id,
        pr.name AS process_name,
        bp.minimum_staff,
        bp.operating_calendar
      FROM Brand_Process bp
      JOIN Brand b ON bp.brand_id = b.id
      JOIN Process pr ON bp.process_id = pr.id
    `;
        const bpParams = [];
        if (view === "pod" && podId) {
            bpSql += " WHERE b.pod_id = ?";
            bpParams.push(Number(podId));
        } else if (view === "brand" && brandId) {
            bpSql += " WHERE bp.brand_id = ?";
            bpParams.push(Number(brandId));
        } else if (view === "process" && processId) {
            bpSql += " WHERE bp.process_id = ?";
            bpParams.push(Number(processId));
        }
        bpSql += " ORDER BY b.name, pr.name";

        const [brandProcesses] = await db.query(bpSql, bpParams);

        // 8. Run live validation so every view knows its exact conflicts
        const validation = await validateMonthlyRoster(year, month);

        res.json({
            exists: true,
            view,
            roster,
            dates,
            employees: formattedEmployees,
            brandProcesses,
            tempCovers,
            validation,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 6. MANUAL CELL EDIT + INSTANT LIVE RE-VALIDATION
// PATCH /api/rosters/entry/:id
// Body: { status: 'SICK_LEAVE', notes: 'Called in sick', is_manual_override: true }
// =========================================================
router.patch("/entry/:id", async (req, res) => {
    try {
        const entryId = Number(req.params.id);
        const { status, notes, is_manual_override = true } = req.body;

        if (!VALID_ENTRY_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_ENTRY_STATUSES.join(", ")}`,
            });
        }

        // Find which month/year this entry belongs to before updating
        const [existing] = await db.query(
            `SELECT re.id, mr.year, mr.month
       FROM Roster_Entry re
       JOIN Monthly_Roster mr ON re.monthly_roster_id = mr.id
       WHERE re.id = ?`,
            [entryId],
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: "Roster entry not found." });
        }

        await db.query(
            `UPDATE Roster_Entry
       SET status = ?, notes = ?, is_manual_override = ?
       WHERE id = ?`,
            [status, notes ?? null, Boolean(is_manual_override), entryId],
        );

        const { year, month } = existing[0];
        const validation = await validateMonthlyRoster(year, month);

        res.json({
            message: "Roster entry updated and re-validated.",
            entryId,
            status,
            is_manual_override: Boolean(is_manual_override),
            validation,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 7. ASSIGN TEMPORARY COVER (One-Day Substitute) + RE-VALIDATE
// POST /api/rosters/temp-cover
// Body: { roster_entry_id, brand_process_id, notes }
//    OR { employee_id, date, brand_process_id, notes }
// =========================================================
router.post("/temp-cover", async (req, res) => {
    try {
        let { roster_entry_id, employee_id, date, brand_process_id, notes } =
            req.body;

        if (!brand_process_id) {
            return res
                .status(400)
                .json({ error: "brand_process_id is required." });
        }

        // Look up Roster_Entry either by ID or by (employee_id + date)
        let entryRows;
        if (roster_entry_id) {
            [entryRows] = await db.query(
                `SELECT re.*, mr.year, mr.month
         FROM Roster_Entry re
         JOIN Monthly_Roster mr ON re.monthly_roster_id = mr.id
         WHERE re.id = ?`,
                [Number(roster_entry_id)],
            );
        } else if (employee_id && date) {
            [entryRows] = await db.query(
                `SELECT re.*, mr.year, mr.month
         FROM Roster_Entry re
         JOIN Monthly_Roster mr ON re.monthly_roster_id = mr.id
         WHERE re.employee_id = ? AND re.date = ?`,
                [Number(employee_id), date],
            );
        } else {
            return res.status(400).json({
                error: "Provide either roster_entry_id or (employee_id and date).",
            });
        }

        if (entryRows.length === 0) {
            return res
                .status(404)
                .json({
                    error: "Matching roster entry not found for that date.",
                });
        }

        const entry = entryRows[0];

        // Guard: A substitute must be WORKING on that day to provide coverage
        if (entry.status !== "WORKING") {
            return res.status(400).json({
                error: `Employee is currently marked '${entry.status}' on ${entry.date}. Switch them to 'WORKING' before assigning temporary cover.`,
            });
        }

        const [insertResult] = await db.query(
            `INSERT INTO Temporary_Cover (roster_entry_id, brand_process_id, notes)
       VALUES (?, ?, ?)`,
            [entry.id, Number(brand_process_id), notes ?? null],
        );

        const validation = await validateMonthlyRoster(entry.year, entry.month);

        res.status(201).json({
            message: "Temporary cover assigned and roster re-validated.",
            id: insertResult.insertId,
            roster_entry_id: entry.id,
            brand_process_id: Number(brand_process_id),
            validation,
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "This employee is already assigned temporary cover for this brand-process on this date.",
            });
        }
        res.status(500).json({ error: err.message });
    }
});

// =========================================================
// 8. REMOVE TEMPORARY COVER + RE-VALIDATE
// DELETE /api/rosters/temp-cover/:id
// =========================================================
router.delete("/temp-cover/:id", async (req, res) => {
    try {
        const coverId = Number(req.params.id);

        const [rows] = await db.query(
            `SELECT tc.id, mr.year, mr.month
       FROM Temporary_Cover tc
       JOIN Roster_Entry re ON tc.roster_entry_id = re.id
       JOIN Monthly_Roster mr ON re.monthly_roster_id = mr.id
       WHERE tc.id = ?`,
            [coverId],
        );

        if (rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Temporary cover record not found." });
        }

        await db.query("DELETE FROM Temporary_Cover WHERE id = ?", [coverId]);

        const { year, month } = rows[0];
        const validation = await validateMonthlyRoster(year, month);

        res.json({
            message: "Temporary cover removed and roster re-validated.",
            deletedId: coverId,
            validation,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
