-- Supabase SQL Schema for Employment Applications
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending',

    -- Position & Salary
    "positionApplied" TEXT,
    "expectedSalary" TEXT,

    -- Personal Record
    "prefixTh" TEXT,
    "firstNameTh" TEXT,
    "lastNameTh" TEXT,
    nickname TEXT,
    "prefixEn" TEXT,
    "firstNameEn" TEXT,
    "lastNameEn" TEXT,
    address TEXT,
    moo TEXT,
    "subDistrict" TEXT,
    district TEXT,
    province TEXT,
    "zipCode" TEXT,
    mobile TEXT,
    email TEXT,
    "birthDate" DATE,
    age INTEGER,
    "idCard" TEXT,
    sex TEXT,
    "bloodType" TEXT,
    religion TEXT,
    height INTEGER,
    weight INTEGER,

    -- Family Record
    "family1Name" TEXT,
    "family1Relation" TEXT,
    "family1Age" INTEGER,
    "family1Occupation" TEXT,
    "family2Name" TEXT,
    "family2Relation" TEXT,
    "family2Age" INTEGER,
    "family2Occupation" TEXT,
    "family3Name" TEXT,
    "family3Relation" TEXT,
    "family3Age" INTEGER,
    "family3Occupation" TEXT,
    "family4Name" TEXT,
    "family4Relation" TEXT,
    "family4Age" INTEGER,
    "family4Occupation" TEXT,
    "maritalStatus" TEXT,
    "spouseName" TEXT,
    "spouseOccupation" TEXT,
    "numberOfChildren" INTEGER,

    -- Emergency Contact
    "emergencyName" TEXT,
    "emergencyRelation" TEXT,
    "emergencyAddress" TEXT,
    "emergencyPhone" TEXT,

    -- Education
    "highSchoolYear" TEXT,
    "highSchoolName" TEXT,
    "highSchoolMajor" TEXT,
    "highSchoolGpa" TEXT,
    "diplomaYear" TEXT,
    "diplomaName" TEXT,
    "diplomaMajor" TEXT,
    "diplomaGpa" TEXT,
    "bachelorYear" TEXT,
    "bachelorName" TEXT,
    "bachelorMajor" TEXT,
    "bachelorGpa" TEXT,
    "masterYear" TEXT,
    "masterName" TEXT,
    "masterMajor" TEXT,
    "masterGpa" TEXT,
    "othersYear" TEXT,
    "othersName" TEXT,
    "othersMajor" TEXT,
    "othersGpa" TEXT,

    -- Skills
    "englishSpoken" TEXT,
    "englishWritten" TEXT,
    "englishUnderstand" TEXT,
    "otherLanguage" TEXT,
    "otherLangSpoken" TEXT,
    "otherLangWritten" TEXT,
    "otherLangUnderstand" TEXT,
    "hasComputer" BOOLEAN,
    "computerSkills" TEXT,
    "hasDrivingCar" BOOLEAN,
    "carLicenseNo" TEXT,
    "hasDrivingMotor" BOOLEAN,
    "motorLicenseNo" TEXT,
    "otherSkills" TEXT,

    -- Training
    "training1Course" TEXT,
    "training1Institution" TEXT,
    "training1Year" TEXT,
    "training1Duration" TEXT,
    "training2Course" TEXT,
    "training2Institution" TEXT,
    "training2Year" TEXT,
    "training2Duration" TEXT,
    "training3Course" TEXT,
    "training3Institution" TEXT,
    "training3Year" TEXT,
    "training3Duration" TEXT,

    -- Work Experience
    "work1Period" TEXT,
    "work1Company" TEXT,
    "work1Position" TEXT,
    "work1Responsibilities" TEXT,
    "work1Salary" TEXT,
    "work1Reason" TEXT,
    "work2Period" TEXT,
    "work2Company" TEXT,
    "work2Position" TEXT,
    "work2Responsibilities" TEXT,
    "work2Salary" TEXT,
    "work2Reason" TEXT,
    "work3Period" TEXT,
    "work3Company" TEXT,
    "work3Position" TEXT,
    "work3Responsibilities" TEXT,
    "work3Salary" TEXT,
    "work3Reason" TEXT,

    -- Other Questions
    "q1WorkedBefore" TEXT,
    "q1Details" TEXT,
    "q2Relatives" TEXT,
    "q2Details" TEXT,
    "q3Convicted" TEXT,
    "q3Details" TEXT,
    "q4Illness" TEXT,
    "q4Details" TEXT,
    "q5ColorBlind" TEXT,
    "q6Pregnant" TEXT,
    "q7Contagious" TEXT,

    -- Signature
    signature TEXT,
    "signatureDate" DATE
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
