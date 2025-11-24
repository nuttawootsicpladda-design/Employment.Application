-- Supabase SQL Schema for Employment Applications
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',

    -- Position & Salary
    position_applied TEXT,
    expected_salary TEXT,

    -- Personal Record
    first_name_th TEXT,
    last_name_th TEXT,
    nickname TEXT,
    first_name_en TEXT,
    last_name_en TEXT,
    address TEXT,
    moo TEXT,
    sub_district TEXT,
    district TEXT,
    province TEXT,
    zip_code TEXT,
    mobile TEXT,
    email TEXT,
    birth_date DATE,
    age INTEGER,
    id_card TEXT,
    sex TEXT,
    blood_type TEXT,
    religion TEXT,
    height INTEGER,
    weight INTEGER,

    -- Family Record
    family1_name TEXT,
    family1_relation TEXT,
    family1_age INTEGER,
    family1_occupation TEXT,
    family2_name TEXT,
    family2_relation TEXT,
    family2_age INTEGER,
    family2_occupation TEXT,
    family3_name TEXT,
    family3_relation TEXT,
    family3_age INTEGER,
    family3_occupation TEXT,
    family4_name TEXT,
    family4_relation TEXT,
    family4_age INTEGER,
    family4_occupation TEXT,
    marital_status TEXT,
    spouse_name TEXT,
    spouse_occupation TEXT,
    number_of_children INTEGER,

    -- Emergency Contact
    emergency_name TEXT,
    emergency_relation TEXT,
    emergency_address TEXT,
    emergency_phone TEXT,

    -- Education
    high_school_year TEXT,
    high_school_name TEXT,
    high_school_major TEXT,
    high_school_gpa TEXT,
    diploma_year TEXT,
    diploma_name TEXT,
    diploma_major TEXT,
    diploma_gpa TEXT,
    bachelor_year TEXT,
    bachelor_name TEXT,
    bachelor_major TEXT,
    bachelor_gpa TEXT,
    master_year TEXT,
    master_name TEXT,
    master_major TEXT,
    master_gpa TEXT,
    others_year TEXT,
    others_name TEXT,
    others_major TEXT,
    others_gpa TEXT,

    -- Skills
    english_spoken TEXT,
    english_written TEXT,
    english_understand TEXT,
    other_language TEXT,
    other_lang_spoken TEXT,
    other_lang_written TEXT,
    other_lang_understand TEXT,
    has_computer BOOLEAN,
    computer_skills TEXT,
    has_driving_car BOOLEAN,
    car_license_no TEXT,
    has_driving_motor BOOLEAN,
    motor_license_no TEXT,
    other_skills TEXT,

    -- Training
    training1_course TEXT,
    training1_institution TEXT,
    training1_year TEXT,
    training1_duration TEXT,
    training2_course TEXT,
    training2_institution TEXT,
    training2_year TEXT,
    training2_duration TEXT,
    training3_course TEXT,
    training3_institution TEXT,
    training3_year TEXT,
    training3_duration TEXT,

    -- Work Experience
    work1_period TEXT,
    work1_company TEXT,
    work1_position TEXT,
    work1_responsibilities TEXT,
    work1_salary TEXT,
    work1_reason TEXT,
    work2_period TEXT,
    work2_company TEXT,
    work2_position TEXT,
    work2_responsibilities TEXT,
    work2_salary TEXT,
    work2_reason TEXT,
    work3_period TEXT,
    work3_company TEXT,
    work3_position TEXT,
    work3_responsibilities TEXT,
    work3_salary TEXT,
    work3_reason TEXT,

    -- Other Questions
    q1_worked_before TEXT,
    q1_details TEXT,
    q2_relatives TEXT,
    q2_details TEXT,
    q3_convicted TEXT,
    q3_details TEXT,
    q4_illness TEXT,
    q4_details TEXT,
    q5_color_blind TEXT,
    q6_pregnant TEXT,
    q7_contagious TEXT,

    -- Signature
    signature TEXT,
    signature_date DATE
);

-- Enable Row Level Security (optional)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your needs)
CREATE POLICY "Allow all operations" ON applications
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_status ON applications(status);
