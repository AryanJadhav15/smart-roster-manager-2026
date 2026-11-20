CREATE TABLE IF NOT EXISTS Pod (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    pod_lead_id INT NULL
);

CREATE TABLE IF NOT EXISTS Employee (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    pod_id INT NOT NULL,
    is_manager BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_weekly_off VARCHAR(15) DEFAULT 'Sunday',
    CONSTRAINT fk_employee_pod FOREIGN KEY (pod_id) REFERENCES Pod (id) ON DELETE RESTRICT
);

ALTER TABLE Pod ADD CONSTRAINT fk_pod_lead FOREIGN KEY (pod_lead_id) REFERENCES Employee (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS Process (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Brand (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    pod_id INT NOT NULL,
    CONSTRAINT fk_brand_pod FOREIGN KEY (pod_id) REFERENCES Pod (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Brand_Process (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    process_id INT NOT NULL,
    minimum_staff INT NOT NULL DEFAULT 1,
    operating_calendar VARCHAR(100) NOT NULL DEFAULT 'SUNDAYS_OFF',
    UNIQUE KEY uq_brand_process (brand_id, process_id),
    CONSTRAINT fk_bp_brand FOREIGN KEY (brand_id) REFERENCES Brand (id) ON DELETE CASCADE,
    CONSTRAINT fk_bp_process FOREIGN KEY (process_id) REFERENCES Process (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Employee_Allocation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    brand_process_id INT NOT NULL,
    UNIQUE uq_employee_allocation (employee_id, brand_process_id),
    CONSTRAINT fk_ea_employee FOREIGN KEY (employee_id) REFERENCES Employee (id) ON DELETE CASCADE,
    CONSTRAINT fk_ea_brand_process FOREIGN KEY (brand_process_id) REFERENCES Brand_Process (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Public_Holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Employee_Leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT GENERATED ALWAYS AS (DATEDIFF (end_date, start_date) + 1) VIRTUAL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    CONSTRAINT fk_leaves_employee FOREIGN KEY (employee_id) REFERENCES Employee (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Monthly_Roster (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month INT NOT NULL,
    year INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY roster_month_year (month, year)
);

CREATE TABLE IF NOT EXISTS Roster_Entry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monthly_roster_id INT NOT NULL,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(30) NOT NULL,
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    UNIQUE KEY uq_roster_employee_date (employee_id, date),
    CONSTRAINT fk_re_roster FOREIGN KEY (monthly_roster_id) REFERENCES Monthly_Roster (id) ON DELETE CASCADE,
    CONSTRAINT fk_re_employee FOREIGN KEY (employee_id) REFERENCES Employee (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Temporary_Cover (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roster_entry_id INT NOT NULL,
    brand_process_id INT NOT NULL,
    notes TEXT,
    UNIQUE KEY uq_temp_cover (roster_entry_id, brand_process_id),
    CONSTRAINT fk_tc_roster_entry FOREIGN KEY (roster_entry_id) REFERENCES Roster_Entry (id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_brand_process FOREIGN KEY (brand_process_id) REFERENCES Brand_Process (id) ON DELETE CASCADE
);
