import db from "../config/db.js";
import {
    getDatesInMonth,
    groupDatesIntoWeeks,
    buildHolidayMap,
    buildApprovedLeaveMap,
    doesProcessOperateOnDate,
} from "./calendarHelper.js";

/**
 * Generates (or safely regenerates) a deterministic monthly roster for (year, month).
 * Preserves any cells where is_manual_override = TRUE.
 */
export async function generateMonthlyRoster(year, month) {
    // 1. Find or create the Monthly_Roster "folder" for this (month, year)
    await db.query(
        `INSERT IGNORE INTO Monthly_Roster (month, year, status) VALUES (?, ?, 'DRAFT')`,
        [month, year],
    );

    const [[rosterRow]] = await db.query(
        `SELECT * FROM Monthly_Roster WHERE month = ? AND year = ?`,
        [month, year],
    );
    const monthlyRosterId = rosterRow.id;

    // 2. Fetch all inputs from TiDB in parallel (ordered by id for 100% determinism)
    const [
        [employees],
        [brandProcesses],
        [allocations],
        [publicHolidays],
        [leaves],
        [existingEntries],
    ] = await Promise.all([
        db.query(`SELECT * FROM Employee ORDER BY id ASC`),
        db.query(`SELECT * FROM Brand_Process ORDER BY id ASC`),
        db.query(`SELECT * FROM Employee_Allocation ORDER BY id ASC`),
        db.query(`SELECT * FROM Public_Holidays`),
        db.query(`SELECT * FROM Employee_Leaves WHERE status = 'APPROVED'`),
        db.query(`SELECT * FROM Roster_Entry WHERE monthly_roster_id = ?`, [
            monthlyRosterId,
        ]),
    ]);

    // 3. Build fast in-memory lookup maps
    const dates = getDatesInMonth(year, month);
    const weeks = groupDatesIntoWeeks(dates);
    const holidayMap = buildHolidayMap(publicHolidays);
    const leaveMap = buildApprovedLeaveMap(leaves);

    const bpById = new Map(brandProcesses.map((bp) => [bp.id, bp]));
    const empToProcesses = new Map(); // employee_id => [Brand_Process, ...]
    const processToEmps = new Map(); // brand_process_id => [employee_id, ...]

    for (const emp of employees) empToProcesses.set(emp.id, []);
    for (const bp of brandProcesses) processToEmps.set(bp.id, []);

    for (const alloc of allocations) {
        const bp = bpById.get(alloc.brand_process_id);
        if (!bp) continue;
        empToProcesses.get(alloc.employee_id)?.push(bp);
        processToEmps.get(bp.id)?.push(alloc.employee_id);
    }

    // Track manual overrides so regeneration never erases human edits
    const manualOverrideMap = new Map();
    for (const entry of existingEntries) {
        if (entry.is_manual_override) {
            manualOverrideMap.set(`${entry.employee_id}_${entry.date}`, entry);
        }
    }

    // ------------------------------------------------------------------
    // PASS 1: Fixed States (Manual Overrides -> Approved Leaves -> Holidays -> WORKING)
    // schedule[empId][dateStr] = { status, notes, isManual }
    // ------------------------------------------------------------------
    const schedule = new Map();

    for (const emp of employees) {
        const empDays = new Map();
        const assignedProcesses = empToProcesses.get(emp.id) || [];

        for (const dateInfo of dates) {
            const key = `${emp.id}_${dateInfo.dateStr}`;

            // Priority 1: Keep manager's manual edit untouched
            if (manualOverrideMap.has(key)) {
                const existing = manualOverrideMap.get(key);
                empDays.set(dateInfo.dateStr, {
                    status: existing.status,
                    notes: existing.notes,
                    isManual: true,
                });
                continue;
            }

            // Priority 2: Approved Leaves / Comp-Offs / Sick Leaves
            if (leaveMap.has(key)) {
                const leaveType = leaveMap.get(key);
                empDays.set(dateInfo.dateStr, {
                    status: leaveType,
                    notes: `Approved ${leaveType.replace(/_/g, " ").toLowerCase()}`,
                    isManual: false,
                });
                continue;
            }

            // Priority 3: Public Holidays (only off if NO assigned process operates on this holiday)
            if (holidayMap.has(dateInfo.dateStr)) {
                const anyProcessOperates = assignedProcesses.some((bp) =>
                    doesProcessOperateOnDate(
                        bp.operating_calendar,
                        dateInfo,
                        holidayMap,
                    ),
                );

                if (!anyProcessOperates) {
                    empDays.set(dateInfo.dateStr, {
                        status: "PUBLIC_HOLIDAY",
                        notes: holidayMap.get(dateInfo.dateStr),
                        isManual: false,
                    });
                    continue;
                }
            }

            // Priority 5 (Default): Scheduled to work unless Pass 2 assigns a weekly off
            empDays.set(dateInfo.dateStr, {
                status: "WORKING",
                notes: null,
                isManual: false,
            });
        }

        schedule.set(emp.id, empDays);
    }

    // Helper: Check if giving `empId` this day off keeps ALL their operating processes >= minimum_staff
    function isSafeWeeklyOff(empId, dateInfo) {
        const assignedProcesses = empToProcesses.get(empId) || [];

        for (const bp of assignedProcesses) {
            // If the process is closed on this day (e.g., Sunday on SUNDAYS_OFF), it's always safe!
            if (
                !doesProcessOperateOnDate(
                    bp.operating_calendar,
                    dateInfo,
                    holidayMap,
                )
            ) {
                continue;
            }

            // Count how many assigned employees are currently WORKING on this date
            const teamIds = processToEmps.get(bp.id) || [];
            let workingCount = 0;
            for (const memberId of teamIds) {
                if (
                    schedule.get(memberId)?.get(dateInfo.dateStr)?.status ===
                    "WORKING"
                ) {
                    workingCount++;
                }
            }

            // If removing empId drops coverage below minimum_staff, this day is NOT safe
            if (workingCount - 1 < bp.minimum_staff) {
                return false;
            }
        }
        return true;
    }

    // ------------------------------------------------------------------
    // PASS 2: Priority 4 — Smart Weekly Off Rotation (1 Weekly Off / Week)
    // ------------------------------------------------------------------
    for (const week of weeks) {
        for (const emp of employees) {
            const empDays = schedule.get(emp.id);

            // Skip if manager already manually placed a WEEKLY_OFF this week
            const alreadyHasOff = week.some(
                (d) => empDays.get(d.dateStr)?.status === "WEEKLY_OFF",
            );
            if (alreadyHasOff) continue;

            const preferredDayName = emp.preferred_weekly_off || "Sunday";
            const preferredInWeek = week.some(
                (d) => d.dayName === preferredDayName,
            );

            // For short partial weeks at month start/end (< 4 days), only assign an off
            // if the employee's preferred weekly off actually falls inside those days
            if (week.length < 4 && !preferredInWeek) continue;

            // Candidate days: only non-manual WORKING days, with preferred day tried FIRST
            const workingDays = week.filter((d) => {
                const cell = empDays.get(d.dateStr);
                return cell.status === "WORKING" && !cell.isManual;
            });
            if (workingDays.length === 0) continue;

            const candidates = [
                ...workingDays.filter((d) => d.dayName === preferredDayName),
                ...workingDays.filter((d) => d.dayName !== preferredDayName),
            ];

            // Try to find the first safe day that preserves client minimum_staff
            const safeDay = candidates.find((d) => isSafeWeeklyOff(emp.id, d));

            if (safeDay) {
                const rotated = safeDay.dayName !== preferredDayName;
                empDays.set(safeDay.dateStr, {
                    status: "WEEKLY_OFF",
                    notes: rotated
                        ? `Rotated from preferred ${preferredDayName} to maintain client coverage`
                        : null,
                    isManual: false,
                });
            } else {
                // Solo-resource 365-day brand: no day is safe without backup.
                // Respect employee's right to a weekly off (preferring their preferred day)
                // and let conflictValidator.js flag the gap for Temporary_Cover.
                const fallbackDay = candidates[0];
                empDays.set(fallbackDay.dateStr, {
                    status: "WEEKLY_OFF",
                    notes: "Weekly off assigned (coverage gap flagged for temporary cover)",
                    isManual: false,
                });
            }
        }
    }

    // ------------------------------------------------------------------
    // STEP 4: Single Bulk Upsert into TiDB (Preserves manual overrides & IDs)
    // ------------------------------------------------------------------
    const rowsToUpsert = [];
    for (const emp of employees) {
        const empDays = schedule.get(emp.id);
        for (const dateInfo of dates) {
            const cell = empDays.get(dateInfo.dateStr);
            rowsToUpsert.push([
                monthlyRosterId,
                emp.id,
                dateInfo.dateStr,
                cell.status,
                cell.isManual ? 1 : 0,
                cell.notes,
            ]);
        }
    }

    if (rowsToUpsert.length > 0) {
        await db.query(
            `INSERT INTO Roster_Entry
         (monthly_roster_id, employee_id, date, status, is_manual_override, notes)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         status = IF(is_manual_override = TRUE, status, VALUES(status)),
         notes  = IF(is_manual_override = TRUE, notes,  VALUES(notes))`,
            [rowsToUpsert],
        );
    }

    return {
        monthlyRosterId,
        month,
        year,
        status: rosterRow.status,
        totalEntries: rowsToUpsert.length,
    };
}
