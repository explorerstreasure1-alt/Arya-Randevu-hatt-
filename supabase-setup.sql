-- ============================================
-- ARYA TERZI - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    service VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_phone ON appointments(phone);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created ON appointments(created_at DESC);

-- ============================================
-- CUSTOMERS TABLE (CRM)
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================
-- WORKING HOURS TABLE
-- ============================================
CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default working hours (Turkish business hours)
INSERT INTO working_hours (day_of_week, open_time, close_time, is_open) VALUES
    (1, '09:00', '20:00', true),  -- Monday
    (2, '09:00', '20:00', true),  -- Tuesday
    (3, '09:00', '20:00', true),  -- Wednesday
    (4, '09:00', '20:00', true),  -- Thursday
    (5, '09:00', '20:00', true),  -- Friday
    (6, '09:00', '20:00', true),  -- Saturday
    (0, '09:00', '20:00', false); -- Sunday (closed or adjust as needed)

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (for new appointments)
CREATE POLICY "Allow anonymous insert" ON appointments
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow anonymous select for search (by phone)
CREATE POLICY "Allow select by phone" ON appointments
    FOR SELECT TO anon
    USING (true);  -- In production, consider more restrictive policies

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" ON appointments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated customers access" ON customers
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE appointment_date = NEW.appointment_date 
        AND appointment_time = NEW.appointment_time
        AND status NOT IN ('cancelled')
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'Bu saat dilimi dolu';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_double_booking BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION check_appointment_conflict();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily appointment summary
CREATE VIEW daily_appointments_summary AS
SELECT 
    appointment_date,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM appointments
GROUP BY appointment_date
ORDER BY appointment_date DESC;

-- Service popularity
CREATE VIEW service_popularity AS
SELECT 
    service,
    COUNT(*) as booking_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM appointments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY service
ORDER BY booking_count DESC;

-- Customer visit frequency
CREATE VIEW customer_frequency AS
SELECT 
    phone,
    first_name,
    last_name,
    COUNT(*) as visit_count,
    MAX(appointment_date) as last_visit
FROM appointments
GROUP BY phone, first_name, last_name
ORDER BY visit_count DESC;
