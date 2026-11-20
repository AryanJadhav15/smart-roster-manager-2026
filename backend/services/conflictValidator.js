import db from "../config/db.js";
import {
    getDatesInMonth,
    groupDatesIntoWeeks,
    buildHolidayMap,
    buildApprovedLeaveMap,
    doesProcessOperateOnDate,
} from "./calendarHelper.js";

/**
 * Validates an existing monthly roster and returns:
 * - isPublishable (true only if 0 CRITICAL conflicts)
 * - summary counts
 * - detailed list of CRITICAL errors and WARNINGS (with suggested same-pod backups)
 */
export async function validateMonthlyRoster(year, month) {
    // 1. Find the Monthly_Roster record
    const [[rosterRow]] = await db.query(
        `SELECT * FROM Monthly_Roster WHERE month = ? AND year = ?`,
        [month, year],
    );

    if (!rosterRow) {
        return {
            exists: false,
            isPublishable: false,
            summary: {
                totalConflicts: 0,
                criticalCount: 0,
                warningCount: 0,
                unstaffedCount: 0,
                understaffedCount: 0,
                cascadeCount: 0,
            },
            conflicts: [],
        };
    }

    const monthlyRosterId = rosterRow.id;

    // 2. Fetch all required tables in parallel
    const [
        [employees],
        [brands],
        [processes],
        [brandProcesses],
        [allocations],
        [publicHolidays],
        [leaves],
        [entries],
        [tempCovers],
    ] = await Promise.all([
        db.query(`SELECT * FROM Employee ORDER BY id ASC`),
        db.query(`SELECT * FROM Brand ORDER BY id ASC`),
        db.query(`SELECT * FROM Process ORDER BY id ASC`),
        db.query(`SELECT * FROM Brand_Process ORDER BY id ASC`),
        db.query(`SELECT * FROM Employee_Allocation ORDER BY id ASC`),
        db.query(`SELECT * FROM Public_Holidays`),
        db.query(`SELECT * FROM Employee_Leaves WHERE status = 'APPROVED'`),
        db.query(`SELECT * FROM Roster_Entry WHERE monthly_roster_id = ?`, [
            monthlyRosterId,
        ]),
        db.query(
            `SELECT tc.*, re.employee_id, re.date, re.status AS entry_status
       FROM Temporary_Cover tc
       JOIN Roster_Entry re ON tc.roster_entry_id = re.id
       WHERE re.monthly_roster_id = ?`,
            [monthlyRosterId],
        ),
    ]);

    // 3. Build lookup maps
    const dates = getDatesInMonth(year, month);
    const weeks = groupDatesIntoWeeks(dates);
    const holidayMap = buildHolidayMap(publicHolidays);
    const leaveMap = buildApprovedLeaveMap(leaves);

    const empById = new Map(employees.map((e) => [e.id, e]));
    const brandById = new Map(brands.map((b) => [b.id, b]));
    const processById = new Map(processes.map((p) => [p.id, p]));
    const bpById = new Map(brandProcesses.map((bp) => [bp.id, bp]));

    // Map: `${empId}_${dateStr}` => Roster_Entry
    const entryMap = new Map();
    for (const entry of entries) {
        entryMap.set(`${entry.employee_id}_${entry.date}`, entry);
    }

    // Map: brand_process_id => [employee_id, ...]
    const bpToEmps = new Map();
    // Map: employee_id => number of permanent processes (used to rank lighter-loaded backups)
    const empProcessCount = new Map();
    for (const bp of brandProcesses) bpToEmps.set(bp.id, []);
    for (const emp of employees) empProcessCount.set(emp.id, 0);

    for (const alloc of allocations) {
        bpToEmps.get(alloc.brand_process_id)?.push(alloc.employee_id);
        empProcessCount.set(
            alloc.employee_id,
            (empProcessCount.get(alloc.employee_id) || 0) + 1,
        );
    }

    // Map: `${dateStr}_${brand_process_id}` => [Temporary_Cover rows]
    const coverMap = new Map();
    const conflicts = [];

    for (const tc of tempCovers) {
        const bp = bpById.get(tc.brand_process_id);
        const brand = bp ? brandById.get(bp.brand_id) : null;
        const proc = bp ? processById.get(bp.process_id) : null;
        const emp = empById.get(tc.employee_id);

        // Check if the assigned substitute is no longer WORKING on that day
        if (tc.entry_status !== "WORKING") {
            conflicts.push({
                severity: "CRITICAL",
                type: "INVALID_TEMP_COVER",
                date: tc.date,
                brandId: brand?.id || null,
                brandName: brand?.name || "Unknown Brand",
                processId: proc?.id || null,
                processName: proc?.name || "Unknown Process",
                brandProcessId: tc.brand_process_id,
                employeeId: tc.employee_id,
                employeeName: emp?.name || "Unknown Employee",
                message: `${emp?.name} is assigned as temporary cover for ${brand?.name} - ${proc?.name} on ${tc.date}, but their status is ${tc.entry_status}.`,
            });
            continue;
        }

        const key = `${tc.date}_${tc.brand_process_id}`;
        if (!coverMap.has(key)) coverMap.set(key, []);
        coverMap.get(key).push(tc);
    }

    // Helper: Recommend up to 3 available WORKING backups from the same pod
    function getSuggestedBackups(podId, dateStr, excludeEmpIds) {
        const candidates = [];

        for (const emp of employees) {
            if (emp.pod_id !== podId) continue;
            if (excludeEmpIds.has(emp.id)) continue;

            const entry = entryMap.get(`${emp.id}_${dateStr}`);
            if (entry && entry.status === "WORKING") {
                candidates.push({
                    employeeId: emp.id,
                    rosterEntryId: entry.id,
                    name: emp.name,
                    isManager: Boolean(emp.is_manager),
                    currentProcessLoad: empProcessCount.get(emp.id) || 0,
                });
            }
        }

        // Prefer non-managers with the lightest process load first (Pod Lead as last-resort backup)
        candidates.sort((a, b) => {
            if (a.isManager !== b.isManager) return a.isManager ? 1 : -1;
            return a.currentProcessLoad - b.currentProcessLoad;
        });

        return candidates.slice(0, 3);
    }

    // Track multi-brand impacts per absent employee on each date
    // Key: `${empId}_${dateStr}` => { emp, status, impactedBrands: Map<brandId, Set<processName>> }
    const absenceImpactMap = new Map();

    // ------------------------------------------------------------------
    // CHECK 1: Daily Brand_Process Coverage (Hard Constraints)
    // ------------------------------------------------------------------
    for (const dateInfo of dates) {
        for (const bp of brandProcesses) {
            // Skip if this process does not operate on this date (e.g., Sunday or Holiday)
            if (
                !doesProcessOperateOnDate(
                    bp.operating_calendar,
                    dateInfo,
                    holidayMap,
                )
            ) {
                continue;
            }

            const brand = brandById.get(bp.brand_id);
            const proc = processById.get(bp.process_id);
            const assignedEmpIds = bpToEmps.get(bp.id) || [];

            const activeEmpIds = new Set();
            const absentDetails = [];

            // Count permanent WORKING employees
            for (const empId of assignedEmpIds) {
                const entry = entryMap.get(`${empId}_${dateInfo.dateStr}`);
                const emp = empById.get(empId);

                if (entry && entry.status === "WORKING") {
                    activeEmpIds.add(empId);
                } else {
                    const reason = entry ? entry.status : "UNSCHEDULED";
                    absentDetails.push({
                        employeeId: empId,
                        name: emp?.name || `Employee #${empId}`,
                        status: reason,
                    });
                }
            }

            // Add active Temporary_Cover substitutes
            const covers = coverMap.get(`${dateInfo.dateStr}_${bp.id}`) || [];
            for (const tc of covers) {
                activeEmpIds.add(tc.employee_id);
            }

            // Flag CRITICAL conflict if below minimum_staff
            if (activeEmpIds.size < bp.minimum_staff) {
                const isUnstaffed = activeEmpIds.size === 0;
                const absentSummary =
                    absentDetails.length > 0
                        ? absentDetails
                              .map((a) => `${a.name} (${a.status})`)
                              .join(", ")
                        : "No employees assigned";

                const excludeIds = new Set([
                    ...assignedEmpIds,
                    ...activeEmpIds,
                ]);
                const suggestedBackups = getSuggestedBackups(
                    brand.pod_id,
                    dateInfo.dateStr,
                    excludeIds,
                );

                conflicts.push({
                    severity: "CRITICAL",
                    type: isUnstaffed
                        ? "UNSTAFFED_PROCESS"
                        : "UNDERSTAFFED_PROCESS",
                    date: dateInfo.dateStr,
                    dayName: dateInfo.dayName,
                    podId: brand.pod_id,
                    brandId: brand.id,
                    brandName: brand.name,
                    processId: proc.id,
                    processName: proc.name,
                    brandProcessId: bp.id,
                    operatingCalendar: bp.operating_calendar,
                    requiredStaff: bp.minimum_staff,
                    activeStaff: activeEmpIds.size,
                    absentEmployees: absentDetails,
                    suggestedBackups,
                    message: `${brand.name} — ${proc.name} has ${activeEmpIds.size}/${bp.minimum_staff} staff on ${dateInfo.dateStr} (${dateInfo.dayName}). Absent: ${absentSummary}.`,
                });

                // Record impact for Multi-Brand Cascade detection
                for (const abs of absentDetails) {
                    const key = `${abs.employeeId}_${dateInfo.dateStr}`;
                    if (!absenceImpactMap.has(key)) {
                        absenceImpactMap.set(key, {
                            employeeId: abs.employeeId,
                            employeeName: abs.name,
                            date: dateInfo.dateStr,
                            status: abs.status,
                            brands: new Map(),
                        });
                    }
                    const rec = absenceImpactMap.get(key);
                    if (!rec.brands.has(brand.id)) {
                        rec.brands.set(brand.id, {
                            brandName: brand.name,
                            processes: [],
                        });
                    }
                    rec.brands.get(brand.id).processes.push(proc.name);
                }
            }
        }
    }

    // ------------------------------------------------------------------
    // CHECK 2: Multi-Brand Cascading Absences (e.g., Divya Menon on Nov 26)
    // ------------------------------------------------------------------
    for (const impact of absenceImpactMap.values()) {
        if (impact.brands.size >= 2) {
            const affectedList = Array.from(impact.brands.values()).map(
                (b) => `${b.brandName} (${b.processes.join(", ")})`,
            );

            conflicts.push({
                severity: "CRITICAL",
                type: "MULTI_BRAND_CASCADE",
                date: impact.date,
                employeeId: impact.employeeId,
                employeeName: impact.employeeName,
                affectedBrandsCount: impact.brands.size,
                message: `Cascading impact: ${impact.employeeName} (${impact.status}) on ${impact.date} creates coverage gaps across ${impact.brands.size} brands: ${affectedList.join(" & ")}.`,
            });
        }
    }

    // ------------------------------------------------------------------
    // CHECK 3: Soft Preferences & Employee-Level Rules (WARNINGS)
    // ------------------------------------------------------------------
    for (const emp of employees) {
        const preferredDay = emp.preferred_weekly_off || "Sunday";

        for (const dateInfo of dates) {
            const entry = entryMap.get(`${emp.id}_${dateInfo.dateStr}`);
            if (!entry) continue;

            // Warning A: Weekly off moved away from preferred day
            if (
                entry.status === "WEEKLY_OFF" &&
                dateInfo.dayName !== preferredDay
            ) {
                conflicts.push({
                    severity: "WARNING",
                    type: "PREFERENCE_OVERRIDDEN",
                    date: dateInfo.dateStr,
                    dayName: dateInfo.dayName,
                    podId: emp.pod_id,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    message: `${emp.name} was given Weekly Off on ${dateInfo.dayName} (${dateInfo.dateStr}) instead of preferred ${preferredDay} to preserve coverage.`,
                });
            }

            // Warning B: Manually scheduled WORKING on an APPROVED leave day
            const approvedLeaveType = leaveMap.get(
                `${emp.id}_${dateInfo.dateStr}`,
            );
            if (approvedLeaveType && entry.status === "WORKING") {
                conflicts.push({
                    severity: "WARNING",
                    type: "LEAVE_OVERRIDE",
                    date: dateInfo.dateStr,
                    podId: emp.pod_id,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    message: `${emp.name} is scheduled WORKING on ${dateInfo.dateStr}, overriding their approved ${approvedLeaveType}.`,
                });
            }
        }

        // Warning C: Working every single day of a full week (0 days off)
        for (const week of weeks) {
            if (week.length < 5) continue;
            const allWorking = week.every((d) => {
                const entry = entryMap.get(`${emp.id}_${d.dateStr}`);
                return entry && entry.status === "WORKING";
            });
            if (allWorking) {
                conflicts.push({
                    severity: "WARNING",
                    type: "NO_WEEKLY_OFF",
                    date: week[0].dateStr,
                    podId: emp.pod_id,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    message: `${emp.name} has no weekly off scheduled during the week of ${week[0].dateStr} to ${week[week.length - 1].dateStr}.`,
                });
            }
        }
    }

    // Sort: CRITICAL first, then chronologically by date
    conflicts.sort((a, b) => {
        if (a.severity !== b.severity) {
            return a.severity === "CRITICAL" ? -1 : 1;
        }
        return (a.date || "").localeCompare(b.date || "");
    });

    const criticalCount = conflicts.filter(
        (c) => c.severity === "CRITICAL",
    ).length;
    const warningCount = conflicts.filter(
        (c) => c.severity === "WARNING",
    ).length;

    return {
        exists: true,
        monthlyRosterId,
        month,
        year,
        rosterStatus: rosterRow.status,
        isPublishable: criticalCount === 0,
        summary: {
            totalConflicts: conflicts.length,
            criticalCount,
            warningCount,
            unstaffedCount: conflicts.filter(
                (c) => c.type === "UNSTAFFED_PROCESS",
            ).length,
            understaffedCount: conflicts.filter(
                (c) => c.type === "UNDERSTAFFED_PROCESS",
            ).length,
            cascadeCount: conflicts.filter(
                (c) => c.type === "MULTI_BRAND_CASCADE",
            ).length,
        },
        conflicts,
    };
}
