const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

/**
 * Formats a UTC Date object into 'YYYY-MM-DD'
 */
export function formatDateUTC(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * Returns an array of all dates in a given month (1-12) and year.
 * Example item: { dateStr: '2026-11-08', dayName: 'Sunday', isSunday: true }
 */
export function getDatesInMonth(year, month) {
    const dates = [];
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let day = 1; day <= totalDays; day++) {
        const d = new Date(Date.UTC(year, month - 1, day));
        const dayIndex = d.getUTCDay(); // 0 = Sunday ... 6 = Saturday
        dates.push({
            dateStr: formatDateUTC(d),
            dayName: DAY_NAMES[dayIndex],
            isSunday: dayIndex === 0,
        });
    }
    return dates;
}

/**
 * Splits a month's dates into Mon–Sun weeks so we can assign 1 weekly off per week.
 * Returns an array of arrays: [ [day1, day2...], [day8, ...], ... ]
 */
export function groupDatesIntoWeeks(dates) {
    const weeks = [];
    let currentWeek = [];

    for (const dateInfo of dates) {
        // Start a new week every Monday (unless it's the very first day of the month)
        if (dateInfo.dayName === "Monday" && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(dateInfo);
    }
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }
    return weeks;
}

/**
 * Converts Public_Holidays rows into a fast Map: { '2026-11-08' => 'Diwali' }
 */
export function buildHolidayMap(publicHolidays) {
    const holidayMap = new Map();

    for (const h of publicHolidays) {
        const start = new Date(`${h.start_date}T00:00:00Z`);
        const end = new Date(`${h.end_date}T00:00:00Z`);

        for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
        ) {
            holidayMap.set(formatDateUTC(d), h.description);
        }
    }
    return holidayMap;
}

/**
 * Converts APPROVED Employee_Leaves rows into a fast lookup Map:
 * Key: `${employee_id}_${dateStr}` => Value: leave.type ('PLANNED_LEAVE' | 'COMP_OFF' | 'SICK_LEAVE')
 * Ignores PENDING and REJECTED leaves.
 */
export function buildApprovedLeaveMap(leaves) {
    const leaveMap = new Map();

    for (const leave of leaves) {
        if (leave.status !== "APPROVED") continue;

        const start = new Date(`${leave.start_date}T00:00:00Z`);
        const end = new Date(`${leave.end_date}T00:00:00Z`);

        for (
            let d = new Date(start);
            d <= end;
            d.setUTCDate(d.getUTCDate() + 1)
        ) {
            leaveMap.set(
                `${leave.employee_id}_${formatDateUTC(d)}`,
                leave.type,
            );
        }
    }
    return leaveMap;
}

/**
 * Core Calendar Rule Checker:
 * Answers whether a Brand_Process must operate on a specific date.
 */
export function doesProcessOperateOnDate(
    operatingCalendar,
    dateInfo,
    holidayMap,
) {
    const isHoliday = holidayMap.has(dateInfo.dateStr);
    const isSunday = dateInfo.isSunday;

    switch (operatingCalendar) {
        case "365_DAYS":
            return true;
        case "PUBLIC_HOLIDAYS_OFF":
            return !isHoliday;
        case "SUNDAYS_OFF":
            return !isSunday;
        case "SUNDAYS_AND_HOLIDAYS_OFF":
            return !isSunday && !isHoliday;
        default:
            // Fallback to SUNDAYS_OFF if an unknown value appears
            return !isSunday;
    }
}
