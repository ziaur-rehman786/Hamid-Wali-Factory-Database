-- Hamid Wali Shoe Factory - PostgreSQL Schema
-- Database: hamid_wali_factory
-- User: hw_factory_admin
-- Currency: All monetary columns (DECIMAL) store amounts in AFN (Afghan Afghani)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Admin & Staff)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Designs (ART No A-1, etc.)
CREATE TABLE IF NOT EXISTS product_designs (
    id SERIAL PRIMARY KEY,
    art_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Colors
CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    hex_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sizes
CREATE TABLE IF NOT EXISTS sizes (
    id SERIAL PRIMARY KEY,
    size_value VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory (Stock per design/color/size)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    design_id INTEGER NOT NULL REFERENCES product_designs(id) ON DELETE RESTRICT,
    color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE RESTRICT,
    size_id INTEGER NOT NULL REFERENCES sizes(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(design_id, color_id, size_id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    total_credit DECIMAL(14, 2) DEFAULT 0,
    total_paid DECIMAL(14, 2) DEFAULT 0,
    remaining_balance DECIMAL(14, 2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    grand_total DECIMAL(14, 2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    total_profit DECIMAL(14, 2) DEFAULT 0,
    total_loss DECIMAL(14, 2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    design_id INTEGER NOT NULL REFERENCES product_designs(id),
    color_id INTEGER NOT NULL REFERENCES colors(id),
    size_id INTEGER NOT NULL REFERENCES sizes(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cartons INTEGER DEFAULT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    item_total DECIMAL(14, 2) NOT NULL,
    profit DECIMAL(14, 2) DEFAULT 0,
    loss DECIMAL(14, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Payments (Khata)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    amount DECIMAL(14, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roznamcha (Daily Ledger)
CREATE TABLE IF NOT EXISTS roznamcha (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    details TEXT NOT NULL,
    income DECIMAL(14, 2) DEFAULT 0,
    expense DECIMAL(14, 2) DEFAULT 0,
    balance DECIMAL(14, 2) DEFAULT 0,
    entry_type VARCHAR(20) DEFAULT 'manual',
    reference_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factory Settings
CREATE TABLE IF NOT EXISTS factory_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movement Log
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(30),
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Salaries (profile + default monthly salary)
CREATE TABLE IF NOT EXISTS employee_salaries (
    id SERIAL PRIMARY KEY,
    employee_number VARCHAR(20),
    name VARCHAR(150) NOT NULL,
    address TEXT,
    father_name VARCHAR(150),
    tazkira_no VARCHAR(50),
    residence VARCHAR(150),
    start_date DATE,
    end_date DATE,
    salary_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly salary records (one row per employee per month)
CREATE TABLE IF NOT EXISTS salary_monthly_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employee_salaries(id) ON DELETE CASCADE,
    salary_year INTEGER NOT NULL,
    salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
    salary_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(14, 2),
    advance_deducted DECIMAL(14, 2) NOT NULL DEFAULT 0,
    owed_settled DECIMAL(14, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'not_paid' CHECK (payment_status IN ('paid', 'not_paid')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, salary_year, salary_month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_design ON inventory(design_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_roznamcha_date ON roznamcha(entry_date);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_name ON employee_salaries(name);
CREATE INDEX IF NOT EXISTS idx_salary_monthly_employee ON salary_monthly_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_monthly_period ON salary_monthly_records(salary_year, salary_month);
