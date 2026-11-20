import express from "express";
import db from "../config/db.js";

const router = express.Router();

const VALID_CALENDARS = [
    "365_DAYS",
    "PUBLIC_HOLIDAYS_OFF",
    "SUNDAYS_OFF",
    "SUNDAYS_AND_HOLIDAYS_OFF",
];

const VALID_LEAVE_TYPES = ["PLANNED_LEAVE", "COMP_OFF", "SICK_LEAVE"];
const VALID_LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

// Helper: Turn common MySQL constraint errors into clean HTTP responses
function handleDbError(res, err) {
    if (err.code === "ER_DUP_ENTRY") {
        return res
            .status(409)
            .json({ error: "Duplicate record: this entry already exists." });
    }
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            error: "Cannot delete this record because other employees or brands are still assigned to it.",
        });
    }
    return res.status(500).json({ error: err.message });
}

// =========================================================
// 0. FULL CONFIGURATION OVERVIEW (1 Call for UI Dropdowns)
// GET /api/config/overview
// =========================================================
router.get("/overview", async (req, res) => {
    try {
        const [
            [pods],
            [employees],
            [processes],
            [brands],
            [brandProcesses],
            [allocations],
            [holidays],
            [leaves],
        ] = await Promise.all([
            db.query(`
        SELECT p.*, e.name AS pod_lead_name
        FROM Pod p
        LEFT JOIN Employee e ON p.pod_lead_id = e.id
        ORDER BY p.id
      `),
            db.query(`
        SELECT e.*, p.name AS pod_name
        FROM Employee e
        JOIN Pod p ON e.pod_id = p.id
        ORDER BY e.pod_id, e.is_manager DESC, e.name
      `),
            db.query("SELECT * FROM Process ORDER BY id"),
            db.query(`
        SELECT b.*, p.name AS pod_name
        FROM Brand b
        JOIN Pod p ON b.pod_id = p.id
        ORDER BY b.pod_id, b.name
      `),
            db.query(`
        SELECT bp.*, b.name AS brand_name, b.pod_id, pr.name AS process_name
        FROM Brand_Process bp
        JOIN Brand b ON bp.brand_id = b.id
        JOIN Process pr ON bp.process_id = pr.id
        ORDER BY b.name, pr.name
      `),
            db.query(`
        SELECT ea.*, e.name AS employee_name, e.pod_id,
               bp.brand_id, b.name AS brand_name,
               bp.process_id, pr.name AS process_name
        FROM Employee_Allocation ea
        JOIN Employee e ON ea.employee_id = e.id
        JOIN Brand_Process bp ON ea.brand_process_id = bp.id
        JOIN Brand b ON bp.brand_id = b.id
        JOIN Process pr ON bp.process_id = pr.id
        ORDER BY e.name, b.name
      `),
            db.query("SELECT * FROM Public_Holidays ORDER BY start_date"),
            db.query(`
        SELECT el.*, e.name AS employee_name, e.pod_id
        FROM Employee_Leaves el
        JOIN Employee e ON el.employee_id = e.id
        ORDER BY el.start_date DESC
      `),
        ]);

        res.json({
            pods,
            employees,
            processes,
            brands,
            brandProcesses,
            allocations,
            holidays,
            leaves,
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 1. PODS CRUD
// =========================================================
router.get("/pods", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT p.*, e.name AS pod_lead_name
      FROM Pod p
      LEFT JOIN Employee e ON p.pod_lead_id = e.id
      ORDER BY p.id
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/pods", async (req, res) => {
    try {
        const { name = null, pod_lead_id = null } = req.body;
        const [result] = await db.query(
            "INSERT INTO Pod (name, pod_lead_id) VALUES (?, ?)",
            [name || null, pod_lead_id || null],
        );
        res.status(201).json({ id: result.insertId, name, pod_lead_id });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.put("/pods/:id", async (req, res) => {
    try {
        const { name = null, pod_lead_id = null } = req.body;
        const [result] = await db.query(
            "UPDATE Pod SET name = ?, pod_lead_id = ? WHERE id = ?",
            [name || null, pod_lead_id || null, Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Pod not found." });
        res.json({ id: Number(req.params.id), name, pod_lead_id });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/pods/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM Pod WHERE id = ?", [
            Number(req.params.id),
        ]);
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Pod not found." });
        res.json({ message: "Pod deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 2. EMPLOYEES CRUD (Auto-syncs Pod.pod_lead_id for managers)
// =========================================================
router.get("/employees", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT e.*, p.name AS pod_name
      FROM Employee e
      JOIN Pod p ON e.pod_id = p.id
      ORDER BY e.pod_id, e.is_manager DESC, e.name
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/employees", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            pod_id,
            is_manager = false,
            preferred_weekly_off = "Sunday",
        } = req.body;

        if (!name || !email || !phone || !pod_id) {
            return res
                .status(400)
                .json({
                    error: "name, email, phone, and pod_id are required.",
                });
        }

        const [result] = await db.query(
            `INSERT INTO Employee (name, email, phone, pod_id, is_manager, preferred_weekly_off)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                email,
                phone,
                Number(pod_id),
                Boolean(is_manager),
                preferred_weekly_off,
            ],
        );

        if (Boolean(is_manager)) {
            await db.query("UPDATE Pod SET pod_lead_id = ? WHERE id = ?", [
                result.insertId,
                Number(pod_id),
            ]);
        }

        res.status(201).json({
            id: result.insertId,
            name,
            email,
            phone,
            pod_id: Number(pod_id),
            is_manager: Boolean(is_manager),
            preferred_weekly_off,
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.put("/employees/:id", async (req, res) => {
    try {
        const empId = Number(req.params.id);
        const {
            name,
            email,
            phone,
            pod_id,
            is_manager = false,
            preferred_weekly_off = "Sunday",
        } = req.body;

        const [result] = await db.query(
            `UPDATE Employee
       SET name = ?, email = ?, phone = ?, pod_id = ?, is_manager = ?, preferred_weekly_off = ?
       WHERE id = ?`,
            [
                name,
                email,
                phone,
                Number(pod_id),
                Boolean(is_manager),
                preferred_weekly_off,
                empId,
            ],
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Employee not found." });

        if (Boolean(is_manager)) {
            await db.query("UPDATE Pod SET pod_lead_id = ? WHERE id = ?", [
                empId,
                Number(pod_id),
            ]);
        }

        res.json({ message: "Employee updated.", id: empId });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/employees/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM Employee WHERE id = ?", [
            Number(req.params.id),
        ]);
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Employee not found." });
        res.json({ message: "Employee deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 3. PROCESSES CRUD
// =========================================================
router.get("/processes", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM Process ORDER BY id");
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/processes", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: "Process name is required." });

        const [result] = await db.query(
            "INSERT INTO Process (name) VALUES (?)",
            [name],
        );
        res.status(201).json({ id: result.insertId, name });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.put("/processes/:id", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ error: "Process name is required." });

        const [result] = await db.query(
            "UPDATE Process SET name = ? WHERE id = ?",
            [name, Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Process not found." });
        res.json({ id: Number(req.params.id), name });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/processes/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM Process WHERE id = ?", [
            Number(req.params.id),
        ]);
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Process not found." });
        res.json({ message: "Process deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 4. BRANDS CRUD
// =========================================================
router.get("/brands", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT b.*, p.name AS pod_name
      FROM Brand b
      JOIN Pod p ON b.pod_id = p.id
      ORDER BY b.pod_id, b.name
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/brands", async (req, res) => {
    try {
        const { name, description = null, pod_id } = req.body;
        if (!name || !pod_id) {
            return res
                .status(400)
                .json({ error: "name and pod_id are required." });
        }

        const [result] = await db.query(
            "INSERT INTO Brand (name, description, pod_id) VALUES (?, ?, ?)",
            [name, description, Number(pod_id)],
        );
        res.status(201).json({
            id: result.insertId,
            name,
            description,
            pod_id: Number(pod_id),
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.put("/brands/:id", async (req, res) => {
    try {
        const { name, description = null, pod_id } = req.body;
        const [result] = await db.query(
            "UPDATE Brand SET name = ?, description = ?, pod_id = ? WHERE id = ?",
            [name, description, Number(pod_id), Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Brand not found." });
        res.json({
            id: Number(req.params.id),
            name,
            description,
            pod_id: Number(pod_id),
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/brands/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM Brand WHERE id = ?", [
            Number(req.params.id),
        ]);
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Brand not found." });
        res.json({ message: "Brand deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 5. BRAND_PROCESS CRUD (Operating Calendar & Min Staff)
// =========================================================
router.get("/brand-processes", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT bp.*, b.name AS brand_name, b.pod_id, pr.name AS process_name
      FROM Brand_Process bp
      JOIN Brand b ON bp.brand_id = b.id
      JOIN Process pr ON bp.process_id = pr.id
      ORDER BY b.name, pr.name
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/brand-processes", async (req, res) => {
    try {
        const {
            brand_id,
            process_id,
            minimum_staff = 1,
            operating_calendar = "SUNDAYS_OFF",
        } = req.body;

        if (!brand_id || !process_id) {
            return res
                .status(400)
                .json({ error: "brand_id and process_id are required." });
        }
        if (!VALID_CALENDARS.includes(operating_calendar)) {
            return res.status(400).json({
                error: `Invalid operating_calendar. Must be one of: ${VALID_CALENDARS.join(", ")}`,
            });
        }

        const [result] = await db.query(
            `INSERT INTO Brand_Process (brand_id, process_id, minimum_staff, operating_calendar)
       VALUES (?, ?, ?, ?)`,
            [
                Number(brand_id),
                Number(process_id),
                Number(minimum_staff),
                operating_calendar,
            ],
        );
        res.status(201).json({
            id: result.insertId,
            brand_id: Number(brand_id),
            process_id: Number(process_id),
            minimum_staff: Number(minimum_staff),
            operating_calendar,
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.put("/brand-processes/:id", async (req, res) => {
    try {
        const { minimum_staff = 1, operating_calendar = "SUNDAYS_OFF" } =
            req.body;

        if (!VALID_CALENDARS.includes(operating_calendar)) {
            return res.status(400).json({
                error: `Invalid operating_calendar. Must be one of: ${VALID_CALENDARS.join(", ")}`,
            });
        }

        const [result] = await db.query(
            "UPDATE Brand_Process SET minimum_staff = ?, operating_calendar = ? WHERE id = ?",
            [Number(minimum_staff), operating_calendar, Number(req.params.id)],
        );
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "Brand-Process rule not found." });
        }
        res.json({
            id: Number(req.params.id),
            minimum_staff: Number(minimum_staff),
            operating_calendar,
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/brand-processes/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM Brand_Process WHERE id = ?",
            [Number(req.params.id)],
        );
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "Brand-Process rule not found." });
        }
        res.json({
            message: "Brand-Process rule deleted.",
            id: Number(req.params.id),
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 6. EMPLOYEE_ALLOCATION CRUD (Permanent Assignments)
// =========================================================
router.get("/allocations", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT ea.*, e.name AS employee_name, e.pod_id,
             bp.brand_id, b.name AS brand_name,
             bp.process_id, pr.name AS process_name
      FROM Employee_Allocation ea
      JOIN Employee e ON ea.employee_id = e.id
      JOIN Brand_Process bp ON ea.brand_process_id = bp.id
      JOIN Brand b ON bp.brand_id = b.id
      JOIN Process pr ON bp.process_id = pr.id
      ORDER BY e.name, b.name
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/allocations", async (req, res) => {
    try {
        const { employee_id, brand_process_id } = req.body;
        if (!employee_id || !brand_process_id) {
            return res
                .status(400)
                .json({
                    error: "employee_id and brand_process_id are required.",
                });
        }

        const [result] = await db.query(
            "INSERT INTO Employee_Allocation (employee_id, brand_process_id) VALUES (?, ?)",
            [Number(employee_id), Number(brand_process_id)],
        );
        res.status(201).json({
            id: result.insertId,
            employee_id: Number(employee_id),
            brand_process_id: Number(brand_process_id),
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/allocations/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM Employee_Allocation WHERE id = ?",
            [Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Allocation not found." });
        res.json({ message: "Allocation removed.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 7. PUBLIC_HOLIDAYS CRUD
// =========================================================
router.get("/holidays", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM Public_Holidays ORDER BY start_date",
        );
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/holidays", async (req, res) => {
    try {
        const { start_date, end_date, description } = req.body;
        if (!start_date || !end_date || !description) {
            return res
                .status(400)
                .json({
                    error: "start_date, end_date, and description are required.",
                });
        }

        const [result] = await db.query(
            "INSERT INTO Public_Holidays (start_date, end_date, description) VALUES (?, ?, ?)",
            [start_date, end_date, description],
        );
        res.status(201).json({
            id: result.insertId,
            start_date,
            end_date,
            description,
        });
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/holidays/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM Public_Holidays WHERE id = ?",
            [Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Holiday not found." });
        res.json({ message: "Holiday deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

// =========================================================
// 8. EMPLOYEE_LEAVES CRUD (total_days is auto-calculated by TiDB)
// =========================================================
router.get("/leaves", async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT el.*, e.name AS employee_name, e.pod_id
      FROM Employee_Leaves el
      JOIN Employee e ON el.employee_id = e.id
      ORDER BY el.start_date DESC
    `);
        res.json(rows);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.post("/leaves", async (req, res) => {
    try {
        const {
            employee_id,
            start_date,
            end_date,
            type = "PLANNED_LEAVE",
            status = "APPROVED",
        } = req.body;

        if (!employee_id || !start_date || !end_date) {
            return res
                .status(400)
                .json({
                    error: "employee_id, start_date, and end_date are required.",
                });
        }
        if (!VALID_LEAVE_TYPES.includes(type)) {
            return res
                .status(400)
                .json({
                    error: `Invalid leave type: ${VALID_LEAVE_TYPES.join(", ")}`,
                });
        }
        if (!VALID_LEAVE_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid leave status: ${VALID_LEAVE_STATUSES.join(", ")}`,
            });
        }

        const [result] = await db.query(
            `INSERT INTO Employee_Leaves (employee_id, start_date, end_date, type, status)
       VALUES (?, ?, ?, ?, ?)`,
            [Number(employee_id), start_date, end_date, type, status],
        );

        const [[created]] = await db.query(
            "SELECT * FROM Employee_Leaves WHERE id = ?",
            [result.insertId],
        );
        res.status(201).json(created);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.patch("/leaves/:id", async (req, res) => {
    try {
        const { status, type, start_date, end_date } = req.body;
        const leaveId = Number(req.params.id);

        const [existing] = await db.query(
            "SELECT * FROM Employee_Leaves WHERE id = ?",
            [leaveId],
        );
        if (existing.length === 0)
            return res.status(404).json({ error: "Leave record not found." });

        const updated = {
            start_date: start_date ?? existing[0].start_date,
            end_date: end_date ?? existing[0].end_date,
            type: type ?? existing[0].type,
            status: status ?? existing[0].status,
        };

        if (!VALID_LEAVE_TYPES.includes(updated.type)) {
            return res
                .status(400)
                .json({
                    error: `Invalid leave type: ${VALID_LEAVE_TYPES.join(", ")}`,
                });
        }
        if (!VALID_LEAVE_STATUSES.includes(updated.status)) {
            return res.status(400).json({
                error: `Invalid leave status: ${VALID_LEAVE_STATUSES.join(", ")}`,
            });
        }

        await db.query(
            `UPDATE Employee_Leaves
       SET start_date = ?, end_date = ?, type = ?, status = ?
       WHERE id = ?`,
            [
                updated.start_date,
                updated.end_date,
                updated.type,
                updated.status,
                leaveId,
            ],
        );

        const [[row]] = await db.query(
            "SELECT * FROM Employee_Leaves WHERE id = ?",
            [leaveId],
        );
        res.json(row);
    } catch (err) {
        handleDbError(res, err);
    }
});

router.delete("/leaves/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM Employee_Leaves WHERE id = ?",
            [Number(req.params.id)],
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ error: "Leave record not found." });
        res.json({ message: "Leave deleted.", id: Number(req.params.id) });
    } catch (err) {
        handleDbError(res, err);
    }
});

export default router;
