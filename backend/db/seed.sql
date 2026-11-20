-- RESET TABLES (can safely re-run seed.sql anytime)
SET
    FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Temporary_Cover;

TRUNCATE TABLE Roster_Entry;

TRUNCATE TABLE Monthly_Roster;

TRUNCATE TABLE Employee_Leaves;

TRUNCATE TABLE Public_Holidays;

TRUNCATE TABLE Employee_Allocation;

TRUNCATE TABLE Brand_Process;

TRUNCATE TABLE Brand;

TRUNCATE TABLE Process;

TRUNCATE TABLE Employee;

TRUNCATE TABLE Pod;

SET
    FOREIGN_KEY_CHECKS = 1;

-- 1. INSERT PODS (pod_lead_id starts as NULL)
INSERT INTO
    Pod (id, name, pod_lead_id)
VALUES
    (1, 'Pod Alpha', NULL),
    (2, 'Pod Beta', NULL),
    (3, 'Pod Gamma', NULL);

-- 2. INSERTING 32 EMPLOYEES (3 Pod Leads + 29 Agents)
INSERT INTO
    Employee (
        id,
        name,
        email,
        phone,
        pod_id,
        is_manager,
        preferred_weekly_off
    )
VALUES
    -- Pod Alpha (11 employees: ID 1 is Pod Lead)
    (
        1,
        'Aarav Sharma',
        'aarav.sharma@ops.com',
        '9800000001',
        1,
        TRUE,
        'Sunday'
    ),
    (
        2,
        'Priya Nair',
        'priya.nair@ops.com',
        '9800000002',
        1,
        FALSE,
        'Sunday'
    ),
    (
        3,
        'Rohan Mehta',
        'rohan.mehta@ops.com',
        '9800000003',
        1,
        FALSE,
        'Monday'
    ),
    (
        4,
        'Sneha Kulkarni',
        'sneha.kulkarni@ops.com',
        '9800000004',
        1,
        FALSE,
        'Tuesday'
    ),
    (
        5,
        'Vikram Joshi',
        'vikram.joshi@ops.com',
        '9800000005',
        1,
        FALSE,
        'Wednesday'
    ),
    (
        6,
        'Ananya Verma',
        'ananya.verma@ops.com',
        '9800000006',
        1,
        FALSE,
        'Thursday'
    ),
    (
        7,
        'Kabir Malhotra',
        'kabir.malhotra@ops.com',
        '9800000007',
        1,
        FALSE,
        'Friday'
    ),
    (
        8,
        'Meera Iyer',
        'meera.iyer@ops.com',
        '9800000008',
        1,
        FALSE,
        'Saturday'
    ),
    (
        9,
        'Arjun Desai',
        'arjun.desai@ops.com',
        '9800000009',
        1,
        FALSE,
        'Sunday'
    ),
    (
        10,
        'Divya Menon',
        'divya.menon@ops.com',
        '9800000010',
        1,
        FALSE,
        'Monday'
    ),
    (
        11,
        'Karan Patel',
        'karan.patel@ops.com',
        '9800000011',
        1,
        FALSE,
        'Tuesday'
    ),
    -- Pod Beta (11 employees: ID 12 is Pod Lead)
    (
        12,
        'Neha Kapoor',
        'neha.kapoor@ops.com',
        '9800000012',
        2,
        TRUE,
        'Sunday'
    ),
    (
        13,
        'Siddharth Rao',
        'siddharth.rao@ops.com',
        '9800000013',
        2,
        FALSE,
        'Wednesday'
    ),
    (
        14,
        'Pooja Bhatia',
        'pooja.bhatia@ops.com',
        '9800000014',
        2,
        FALSE,
        'Thursday'
    ),
    (
        15,
        'Aditya Sen',
        'aditya.sen@ops.com',
        '9800000015',
        2,
        FALSE,
        'Friday'
    ),
    (
        16,
        'Ritu Agarwal',
        'ritu.agarwal@ops.com',
        '9800000016',
        2,
        FALSE,
        'Saturday'
    ),
    (
        17,
        'Manish Tiwari',
        'manish.tiwari@ops.com',
        '9800000017',
        2,
        FALSE,
        'Sunday'
    ),
    (
        18,
        'Kavya Reddy',
        'kavya.reddy@ops.com',
        '9800000018',
        2,
        FALSE,
        'Monday'
    ),
    (
        19,
        'Nikhil Gupta',
        'nikhil.gupta@ops.com',
        '9800000019',
        2,
        FALSE,
        'Tuesday'
    ),
    (
        20,
        'Tanvi Shah',
        'tanvi.shah@ops.com',
        '9800000020',
        2,
        FALSE,
        'Wednesday'
    ),
    (
        21,
        'Harsh Vardhan',
        'harsh.vardhan@ops.com',
        '9800000021',
        2,
        FALSE,
        'Thursday'
    ),
    (
        22,
        'Shruti Bansal',
        'shruti.bansal@ops.com',
        '9800000022',
        2,
        FALSE,
        'Friday'
    ),
    -- Pod Gamma (10 employees: ID 23 is Pod Lead)
    (
        23,
        'Devika Pillai',
        'devika.pillai@ops.com',
        '9800000023',
        3,
        TRUE,
        'Sunday'
    ),
    (
        24,
        'Yash Choudhary',
        'yash.choudhary@ops.com',
        '9800000024',
        3,
        FALSE,
        'Saturday'
    ),
    (
        25,
        'Ishita Bose',
        'ishita.bose@ops.com',
        '9800000025',
        3,
        FALSE,
        'Sunday'
    ),
    (
        26,
        'Pranav Saxena',
        'pranav.saxena@ops.com',
        '9800000026',
        3,
        FALSE,
        'Monday'
    ),
    (
        27,
        'Swati Mishra',
        'swati.mishra@ops.com',
        '9800000027',
        3,
        FALSE,
        'Tuesday'
    ),
    (
        28,
        'Varun Khanna',
        'varun.khanna@ops.com',
        '9800000028',
        3,
        FALSE,
        'Wednesday'
    ),
    (
        29,
        'Nandini Rao',
        'nandini.rao@ops.com',
        '9800000029',
        3,
        FALSE,
        'Thursday'
    ),
    (
        30,
        'Gaurav Soni',
        'gaurav.soni@ops.com',
        '9800000030',
        3,
        FALSE,
        'Friday'
    ),
    (
        31,
        'Aisha Khan',
        'aisha.khan@ops.com',
        '9800000031',
        3,
        FALSE,
        'Saturday'
    ),
    (
        32,
        'Tarun Gill',
        'tarun.gill@ops.com',
        '9800000032',
        3,
        FALSE,
        'Sunday'
    );

UPDATE Pod
SET
    pod_lead_id = 1
WHERE
    id = 1;

UPDATE Pod
SET
    pod_lead_id = 12
WHERE
    id = 2;

UPDATE Pod
SET
    pod_lead_id = 23
WHERE
    id = 3;

-- 4. INSERTING 6 PROCESSES (4 Standard + 2 Brand-Specific)
INSERT INTO
    Process (id, name)
VALUES
    (1, 'Customer Support (CS)'),
    (2, 'Abandoned Cart Conversions (ACC)'),
    (3, 'Non-Delivery Report (NDR)'),
    (4, 'Retention'),
    (5, 'VIP Styling'),
    (6, 'Cold-Chain Tracking');

-- 5. INSERTING 20 BRANDS (16 Solo-Resource + 4 Multi-Employee)
INSERT INTO
    Brand (id, name, description, pod_id)
VALUES
    -- Pod Alpha (Pod 1): 5 Solo (1-5) + 2 Multi (6-7)
    (1, 'AeroWear', 'Athleisure apparel D2C brand', 1),
    (2, 'GlowSkin', 'Dermatologist-backed skincare', 1),
    (
        3,
        'UrbanStep',
        'Everyday sneakers and footwear',
        1
    ),
    (
        4,
        'BrewCraft',
        'Artisanal roasted coffee subscriptions',
        1
    ),
    (5, 'LuxeLoom', 'Handwoven ethnic wear', 1),
    (
        6,
        'NovaTech',
        'High-volume consumer electronics (Multi)',
        1
    ),
    (
        7,
        'VerveFit',
        'Smart fitness equipment (Multi)',
        1
    ),
    -- Pod Beta (Pod 2): 6 Solo (8-13) + 1 Multi (14)
    (8, 'PureBite', 'Organic healthy snacks', 2),
    (
        9,
        'FreshCrate',
        'Perishable farm-to-home produce',
        2
    ),
    (10, 'VelvetHue', 'Clean beauty cosmetics', 2),
    (
        11,
        'ZenSleep',
        'Orthopedic mattresses and bedding',
        2
    ),
    (
        12,
        'PeakGear',
        'Trekking and outdoor accessories',
        2
    ),
    (13, 'AuraScent', 'Fine luxury fragrances', 2),
    (
        14,
        'StyleVault',
        'Fast-fashion marketplace (Multi)',
        2
    ),
    -- Pod Gamma (Pod 3): 5 Solo (15-19) + 1 Multi (20)
    (15, 'KiddoJoy', 'Educational kids toys', 3),
    (16, 'PetPals', 'Pet nutrition and grooming', 3),
    (17, 'HomeCraft', 'Minimalist home decor', 3),
    (
        18,
        'EcoSip',
        'Insulated sustainable drinkware',
        3
    ),
    (19, 'SparkJewels', 'Custom demi-fine jewelry', 3),
    (
        20,
        'VoltRide',
        'Electric scooter accessories (Multi)',
        3
    );


-- 6. INSERTING BRAND_PROCESS (Operating Rules & Minimum Staff)

INSERT INTO
    Brand_Process (
        id,
        brand_id,
        process_id,
        minimum_staff,
        operating_calendar
    )
VALUES
    -- Pod Alpha Solo Brands (1-5)
    (1, 1, 1, 1, '365_DAYS'),
    (2, 1, 3, 1, 'SUNDAYS_OFF'),
    (3, 2, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (4, 2, 2, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (5, 3, 1, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (6, 3, 3, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (7, 4, 1, 1, '365_DAYS'),
    (8, 4, 4, 1, 'SUNDAYS_OFF'),
    (9, 5, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (10, 5, 5, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    -- Pod Alpha Multi Brands (6: NovaTech has shared CS min 2, 7: VerveFit is split)
    (11, 6, 1, 2, '365_DAYS'),
    (12, 6, 3, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (13, 6, 4, 1, 'SUNDAYS_OFF'),
    (14, 7, 1, 1, '365_DAYS'),
    (15, 7, 2, 1, 'SUNDAYS_OFF'),
    (16, 7, 4, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    -- Pod Beta Solo Brands (8-13)
    (17, 8, 1, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (18, 8, 3, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (19, 9, 1, 1, '365_DAYS'),
    (20, 9, 6, 1, '365_DAYS'),
    (21, 10, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (22, 10, 2, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (23, 11, 1, 1, 'SUNDAYS_OFF'),
    (24, 11, 4, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (25, 12, 1, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (26, 12, 3, 1, 'SUNDAYS_OFF'),
    (27, 13, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (28, 13, 2, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    -- Pod Beta Multi Brand (14: StyleVault has shared CS min 2 + split ACC/NDR)
    (29, 14, 1, 2, '365_DAYS'),
    (30, 14, 2, 1, 'SUNDAYS_OFF'),
    (31, 14, 3, 1, 'PUBLIC_HOLIDAYS_OFF'),
    -- Pod Gamma Solo Brands (15-19)
    (32, 15, 1, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (33, 15, 3, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (34, 16, 1, 1, '365_DAYS'),
    (35, 16, 4, 1, 'SUNDAYS_OFF'),
    (36, 17, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (37, 17, 2, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (38, 18, 1, 1, 'SUNDAYS_OFF'),
    (39, 18, 3, 1, 'SUNDAYS_AND_HOLIDAYS_OFF'),
    (40, 19, 1, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (41, 19, 5, 1, 'SUNDAYS_OFF'),
    -- Pod Gamma Multi Brand (20: VoltRide is split across 4 processes)
    (42, 20, 1, 1, '365_DAYS'),
    (43, 20, 2, 1, 'PUBLIC_HOLIDAYS_OFF'),
    (44, 20, 3, 1, 'SUNDAYS_OFF'),
    (45, 20, 4, 1, 'SUNDAYS_AND_HOLIDAYS_OFF');


-- 7. INSERTING EMPLOYEE_ALLOCATION (Permanent Assignments)

INSERT INTO
    Employee_Allocation (employee_id, brand_process_id)
VALUES
    -- Pod Alpha Solo Assignments (Emps 2-6 each own all processes for 1 brand)
    (2, 1),
    (2, 2),
    (3, 3),
    (3, 4),
    (4, 5),
    (4, 6),
    (5, 7),
    (5, 8),
    (6, 9),
    (6, 10),
    -- Pod Alpha Multi Assignments
    -- NovaTech CS (BP 11, min 2) shared by 3 agents: Emps 7, 8, 9
    (7, 11),
    (8, 11),
    (9, 11),
    (7, 12), -- NovaTech NDR -> Emp 7
    (10, 13), -- NovaTech Retention -> Emp 10 (Multi-Brand Employee!)
    (10, 14), -- VerveFit CS -> Emp 10 (Multi-Brand Employee!)
    (11, 15),
    (11, 16),
    -- Pod Beta Solo Assignments (Emps 13-18)
    (13, 17),
    (13, 18),
    (14, 19),
    (14, 20),
    (15, 21),
    (15, 22),
    (16, 23),
    (16, 24),
    (17, 25),
    (17, 26),
    (18, 27),
    (18, 28),
    -- Pod Beta Multi Assignments (StyleVault CS min 2 shared by Emps 19, 20, 21)
    (19, 29),
    (20, 29),
    (21, 29),
    (22, 30),
    (22, 31),
    -- Pod Gamma Solo Assignments (Emps 24-28)
    (24, 32),
    (24, 33),
    (25, 34),
    (25, 35),
    (26, 36),
    (26, 37),
    (27, 38),
    (27, 39),
    (28, 40),
    (28, 41),
    -- Pod Gamma Multi Assignments (VoltRide split across Emps 29-32)
    (29, 42),
    (30, 43),
    (31, 44),
    (32, 45);


-- 8. INSERTING  PUBLIC HOLIDAYS (Nov & Dec 2026)

INSERT INTO
    Public_Holidays (start_date, end_date, description)
VALUES
    ('2026-11-08', '2026-11-08', 'Diwali'),
    ('2026-11-24', '2026-11-24', 'Guru Nanak Jayanti'),
    ('2026-12-25', '2026-12-25', 'Christmas Day');


-- 9. INSERTING SAMPLE EMPLOYEE LEAVES & COMP-OFFS

INSERT INTO
    Employee_Leaves (employee_id, start_date, end_date, type, status)
VALUES
    (
        2,
        '2026-11-18',
        '2026-11-19',
        'PLANNED_LEAVE',
        'APPROVED'
    ), -- Solo brand gap test (AeroWear)
    (
        8,
        '2026-11-12',
        '2026-11-13',
        'PLANNED_LEAVE',
        'APPROVED'
    ), -- Shared CS test (NovaTech: 2 of 3 remain)
    (
        10,
        '2026-11-26',
        '2026-11-26',
        'COMP_OFF',
        'APPROVED'
    ), -- Multi-brand gap test (NovaTech + VerveFit)
    (
        14,
        '2026-11-20',
        '2026-11-21',
        'SICK_LEAVE',
        'APPROVED'
    ), -- 365-day Cold-Chain gap test (FreshCrate)
    (
        20,
        '2026-11-15',
        '2026-11-16',
        'PLANNED_LEAVE',
        'PENDING'
    ), -- Pending leave (should not block until approved)
    (
        25,
        '2026-12-10',
        '2026-12-11',
        'PLANNED_LEAVE',
        'APPROVED'
    ), -- December test (PetPals)
    (
        29,
        '2026-12-24',
        '2026-12-26',
        'PLANNED_LEAVE',
        'APPROVED'
    );

-- December holiday overlap test (VoltRide)
