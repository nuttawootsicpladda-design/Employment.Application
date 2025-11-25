require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload config - use /tmp for serverless environments
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : 'uploads';
const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if not exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Parse Resume with OpenAI
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        let textContent = '';

        // Extract text from PDF
        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            textContent = pdfData.text;
        } else {
            // For other file types, read as text
            textContent = fs.readFileSync(filePath, 'utf-8');
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Use OpenAI to extract information
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a resume parser. Extract information from the resume text and return a JSON object with these fields (use empty string if not found):
                    - firstNameTh, lastNameTh (Thai name)
                    - firstNameEn, lastNameEn (English name)
                    - nickname
                    - address, moo, subDistrict, district, province, zipCode
                    - mobile, email
                    - birthDate (YYYY-MM-DD format)
                    - age
                    - idCard (13 digits)
                    - sex (male/female)
                    - bloodType (A/B/AB/O)
                    - religion
                    - height, weight
                    - maritalStatus (single/married)
                    - bachelorYear, bachelorName, bachelorMajor, bachelorGpa
                    - masterYear, masterName, masterMajor, masterGpa
                    - work1Period, work1Company, work1Position, work1Responsibilities, work1Salary, work1Reason
                    - work2Period, work2Company, work2Position, work2Responsibilities, work2Salary, work2Reason
                    - englishSpoken, englishWritten, englishUnderstand (excellent/good/fair/no)
                    - computerSkills
                    - training1Course, training1Institution, training1Year

                    Return ONLY valid JSON, no markdown.`
                },
                {
                    role: 'user',
                    content: textContent
                }
            ],
            temperature: 0.1
        });

        const parsedData = JSON.parse(completion.choices[0].message.content);

        res.json({ success: true, data: parsedData });
    } catch (error) {
        console.error('Error parsing resume:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit application
app.post('/api/submit', async (req, res) => {
    try {
        // Integer fields that need conversion from empty string to null
        const integerFields = ['age', 'height', 'weight', 'family1Age', 'family2Age', 'family3Age', 'family4Age', 'numberOfChildren'];

        const applicationData = {
            ...req.body,
            created_at: new Date().toISOString(),
            status: 'pending'
        };

        // Convert empty strings to null for integer fields
        integerFields.forEach(field => {
            if (applicationData[field] === '' || applicationData[field] === undefined) {
                applicationData[field] = null;
            } else if (applicationData[field]) {
                applicationData[field] = parseInt(applicationData[field], 10) || null;
            }
        });

        const { data, error } = await supabase
            .from('applications')
            .insert([applicationData])
            .select();

        if (error) throw error;

        res.json({ success: true, id: data[0].id });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Generate PDF
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const data = req.body;

        // Create PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 30 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=employment-application.pdf');

        // Pipe to response
        doc.pipe(res);

        // Register Thai font
        const fontPath = path.join(__dirname, 'fonts', 'THSarabunNew.ttf');
        const fontBoldPath = path.join(__dirname, 'fonts', 'THSarabunNew-Bold.ttf');
        if (fs.existsSync(fontPath)) {
            doc.registerFont('Thai', fontPath);
            if (fs.existsSync(fontBoldPath)) {
                doc.registerFont('Thai-Bold', fontBoldPath);
            }
            doc.font('Thai');
        }

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 30;
        const contentWidth = pageWidth - (margin * 2);

        // Set border width
        doc.lineWidth(1);

        // Helper functions
        const drawBox = (x, y, w, h) => {
            doc.rect(x, y, w, h).stroke();
        };

        const drawText = (text, x, y, options = {}) => {
            doc.text(text, x, y, options);
        };

        const checkbox = (x, y, checked = false) => {
            doc.rect(x, y, 6, 6).stroke();
            if (checked) {
                doc.fontSize(7.5).text('✓', x + 1, y - 1, { width: 6, lineBreak: false });
            }
        };

        // ============ PAGE 1 ============

        // Header with logo and title
        const logoPath = path.join(__dirname, 'Logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, margin, margin, { width: 60 });
        }
        doc.fontSize(13.5).text('EMPLOYMENT APPLICATION', margin + 80, margin, { align: 'center', width: contentWidth - 160, lineBreak: false });
        doc.fontSize(11.5).text('ใบสมัครงาน', margin + 80, margin + 14, { align: 'center', width: contentWidth - 160, lineBreak: false });

        // Photo box (3 cm x 3.4 cm = 85 x 96 points)
        drawBox(pageWidth - margin - 85, margin, 85, 96);
        doc.fontSize(7.5).text('รูปถ่าย 1 นิ้ว', pageWidth - margin - 83, margin + 38, { width: 81, align: 'center', lineBreak: false });

        // Position and Salary section
        let y = margin + 40;
        doc.fontSize(9);
        drawBox(margin, y, contentWidth, 28);
        doc.text('(Please fill in English, if capable)', margin + 5, y + 2, { lineBreak: false });
        doc.text(`Position Applied ตำแหน่งที่สมัคร : ${data.positionApplied || ''}`, margin + 5, y + 10, { lineBreak: false });
        doc.text(`Expected Salary เงินเดือนที่คาดหวัง : ${data.expectedSalary || ''}`, margin + 5, y + 18, { lineBreak: false });

        // Staff Only section
        y += 32;
        drawBox(margin, y, contentWidth, 14);
        doc.text('Staff Only สำหรับเจ้าหน้าที่', margin + 5, y + 3, { lineBreak: false });

        // PERSONAL RECORD section
        y += 18;
        doc.fontSize(9.5).text('PERSONAL RECORD ประวัติส่วนตัว', margin, y, { align: 'center', width: contentWidth, lineBreak: false });
        doc.fontSize(7.5).text('(นักศึกษาฝึกงานกรอกเฉพาะหน้า 1)', pageWidth - margin - 100, y, { lineBreak: false });

        y += 12;
        drawBox(margin, y, contentWidth, 145);

        // Personal info fields
        let py = y + 3;
        doc.fontSize(9);
        doc.text(`ชื่อ : (นาย/นางสาว/นาง) ${data.firstNameTh || ''}`, margin + 3, py, { width: 170, lineBreak: false });
        doc.text(`ชื่อเล่น ${data.nickname || ''}`, margin + 180, py, { width: 130, lineBreak: false });
        doc.text(`นามสกุล : ${data.lastNameTh || ''}`, margin + 320, py, { width: 215, lineBreak: false });

        py += 14;
        doc.text(`Name : (Mr./Miss/Mrs.) ${data.firstNameEn || ''}`, margin + 3, py, { width: 310, lineBreak: false });
        doc.text(`Last Name : ${data.lastNameEn || ''}`, margin + 320, py, { width: 215, lineBreak: false });

        py += 14;
        doc.text(`Present Address ที่อยู่ปัจจุบัน : ${data.address || ''}`, margin + 3, py, { width: 240, lineBreak: false });
        doc.text(`Moo หมู่ : ${data.moo || ''}`, margin + 250, py, { width: 85, lineBreak: false });
        doc.text(`District ตำบล : ${data.subDistrict || ''}`, margin + 340, py, { width: 195, lineBreak: false });

        py += 14;
        doc.text(`District ซอย/ถ.แขวง : ${data.district || ''}`, margin + 3, py, { width: 240, lineBreak: false });
        doc.text(`Province จังหวัด : ${data.province || ''}`, margin + 250, py, { width: 285, lineBreak: false });

        py += 14;
        doc.text(`Zip Code รหัสไปรษณีย์ : ${data.zipCode || ''}`, margin + 3, py, { width: 240, lineBreak: false });
        doc.text(`Mobile Phone โทรศัพท์มือถือ : ${data.mobile || ''}`, margin + 250, py, { width: 285, lineBreak: false });

        py += 14;
        doc.text(`E mail อีเมล์: ${data.email || ''}`, margin + 3, py, { width: 532, lineBreak: false });

        py += 14;
        doc.text(`Date of Birth ว/ด/ปี/ เกิด : ${data.birthDate || ''}`, margin + 3, py, { width: 240, lineBreak: false });
        doc.text(`Age อายุ : ${data.age || ''}`, margin + 250, py, { width: 85, lineBreak: false });
        doc.text(`Years ปี`, margin + 340, py, { width: 195, lineBreak: false });

        py += 14;
        doc.text(`Identification Card No. หมายเลขบัตรประจำตัวประชาชน : ${data.idCard || ''}`, margin + 3, py, { width: 532, lineBreak: false });

        py += 14;
        doc.text(`Sex เพศ : ${data.sex || ''}`, margin + 3, py, { width: 110, lineBreak: false });
        doc.text(`Blood Type กรุ๊ปเลือด : ${data.bloodType || ''}`, margin + 120, py, { width: 195, lineBreak: false });
        doc.text(`Religion ศาสนา : ${data.religion || ''}`, margin + 320, py, { width: 215, lineBreak: false });

        py += 14;
        doc.text(`Height ส่วนสูง : ${data.height || ''}`, margin + 3, py, { width: 90, lineBreak: false });
        doc.text(`cm. เซนติเมตร`, margin + 100, py, { width: 145, lineBreak: false });
        doc.text(`Weight น้ำหนัก : ${data.weight || ''}`, margin + 250, py, { width: 105, lineBreak: false });
        doc.text(`kg. กิโลกรัม`, margin + 360, py, { width: 175, lineBreak: false });

        // FAMILY RECORD section
        y += 150;
        doc.fontSize(9.5).text('FAMILY RECORD ประวัติครอบครัว', margin, y, { align: 'center', width: contentWidth, lineBreak: false });
        doc.fontSize(7.5).text('(Particulard of your parents, brothers & sisters โปรดระบุชื่อบิดา มารดา)', margin, y + 10, { align: 'center', width: contentWidth, lineBreak: false });

        y += 18;
        // Family table header
        const famColWidths = [120, 120, 60, 135];
        let fx = margin;
        drawBox(margin, y, contentWidth, 58);

        // Draw column headers
        doc.fontSize(9);
        doc.text('Name ชื่อ', fx + 3, y + 2, { width: famColWidths[0] - 6, lineBreak: false });
        fx += famColWidths[0];
        doc.moveTo(fx, y).lineTo(fx, y + 58).stroke();
        doc.text('Relationship ความสัมพันธ์', fx + 3, y + 2, { width: famColWidths[1] - 6, lineBreak: false });
        fx += famColWidths[1];
        doc.moveTo(fx, y).lineTo(fx, y + 58).stroke();
        doc.text('Age อายุ', fx + 3, y + 2, { width: famColWidths[2] - 6, lineBreak: false });
        fx += famColWidths[2];
        doc.moveTo(fx, y).lineTo(fx, y + 58).stroke();
        doc.text('Occupation อาชีพ', fx + 3, y + 2, { width: famColWidths[3] - 6, lineBreak: false });

        // Draw row lines
        doc.moveTo(margin, y + 12).lineTo(margin + contentWidth, y + 12).stroke();
        doc.moveTo(margin, y + 24).lineTo(margin + contentWidth, y + 24).stroke();
        doc.moveTo(margin, y + 36).lineTo(margin + contentWidth, y + 36).stroke();

        // Fill family data if available
        if (data.family1Name) {
            doc.text(data.family1Name, margin + 3, y + 14, { width: famColWidths[0] - 6, lineBreak: false });
            doc.text(data.family1Relation || 'บิดา', margin + famColWidths[0] + 3, y + 14, { width: famColWidths[1] - 6, lineBreak: false });
            doc.text(data.family1Age || '', margin + famColWidths[0] + famColWidths[1] + 3, y + 14, { width: famColWidths[2] - 6, lineBreak: false });
            doc.text(data.family1Occupation || '', margin + famColWidths[0] + famColWidths[1] + famColWidths[2] + 3, y + 14, { width: famColWidths[3] - 6, lineBreak: false });
        }
        if (data.family2Name) {
            doc.text(data.family2Name, margin + 3, y + 26, { width: famColWidths[0] - 6, lineBreak: false });
            doc.text(data.family2Relation || 'มารดา', margin + famColWidths[0] + 3, y + 26, { width: famColWidths[1] - 6, lineBreak: false });
            doc.text(data.family2Age || '', margin + famColWidths[0] + famColWidths[1] + 3, y + 26, { width: famColWidths[2] - 6, lineBreak: false });
            doc.text(data.family2Occupation || '', margin + famColWidths[0] + famColWidths[1] + famColWidths[2] + 3, y + 26, { width: famColWidths[3] - 6, lineBreak: false });
        }
        if (data.family3Name) {
            doc.text(data.family3Name, margin + 3, y + 38, { width: famColWidths[0] - 6, lineBreak: false });
            doc.text(data.family3Relation || '', margin + famColWidths[0] + 3, y + 38, { width: famColWidths[1] - 6, lineBreak: false });
            doc.text(data.family3Age || '', margin + famColWidths[0] + famColWidths[1] + 3, y + 38, { width: famColWidths[2] - 6, lineBreak: false });
            doc.text(data.family3Occupation || '', margin + famColWidths[0] + famColWidths[1] + famColWidths[2] + 3, y + 38, { width: famColWidths[3] - 6, lineBreak: false });
        }

        // Marital Status
        y += 52;
        drawBox(margin, y, contentWidth, 60);
        doc.text('Marital Status สถานภาพสมรส', margin + 3, y + 3, { width: 130, lineBreak: false });
        checkbox(margin + 140, y + 3, data.maritalStatus === 'single');
        doc.text('Single โสด', margin + 150, y + 3, { width: 65, lineBreak: false });
        checkbox(margin + 220, y + 3, data.maritalStatus === 'married');
        doc.text('Married แต่งงาน', margin + 230, y + 3, { width: 305, lineBreak: false });

        doc.text(`Spouse's name ชื่อคู่สมรส : ${data.spouseName || ''}`, margin + 3, y + 20, { width: 240, lineBreak: false });
        doc.text(`Occupation อาชีพ : ${data.spouseOccupation || ''}`, margin + 250, y + 20, { width: 285, lineBreak: false });
        doc.text(`No. of Children จำนวนบุตร : ${data.numberOfChildren || ''}`, margin + 3, y + 30, { width: 532, lineBreak: false });

        // EMERGENCY CONTACT section
        y += 88;
        doc.fontSize(9.5).text('EMERGENCY CONTACT บุคคลติดต่อในกรณีฉุกเฉิน', margin, y, { align: 'center', width: contentWidth, lineBreak: false });

        y += 10;
        drawBox(margin, y, contentWidth, 90);
        doc.fontSize(9);
        doc.text(`Name ชื่อ : ${data.emergencyName || ''}`, margin + 3, y + 3, { width: 240, lineBreak: false });
        doc.text(`Relationship ความสัมพันธ์ : ${data.emergencyRelation || ''}`, margin + 250, y + 3, { width: 285, lineBreak: false });
        doc.text(`Address ที่อยู่ : ${data.emergencyAddress || ''}`, margin + 3, y + 31, { width: 532, lineBreak: false });
        doc.text(`Mobile Phone โทรศัพท์มือถือ : ${data.emergencyPhone || ''}`, margin + 3, y + 59, { width: 532, lineBreak: false });

        // EDUCATIONAL RECORD section
        y += 95;
        doc.fontSize(9.5).text('EDUCATIONAL RECORD ประวัติการศึกษา', margin, y, { align: 'center', width: contentWidth, lineBreak: false });

        y += 10;
        // Education table (4.5 cm = 128 points)
        const eduColWidths = [95, 50, 175, 75, 40];
        drawBox(margin, y, contentWidth, 128);

        // Header row
        let ex = margin;
        doc.fontSize(7.5);
        doc.text('Degree', ex + 3, y + 2, { width: eduColWidths[0] - 6, lineBreak: false });
        doc.text('ระดับการศึกษา', ex + 3, y + 8, { width: eduColWidths[0] - 6, lineBreak: false });
        ex += eduColWidths[0];
        doc.moveTo(ex, y).lineTo(ex, y + 128).stroke();
        doc.text('Year Graduated', ex + 2, y + 2, { width: eduColWidths[1] - 4, lineBreak: false });
        doc.text('ปีที่จบ Year ปี', ex + 2, y + 8, { width: eduColWidths[1] - 4, lineBreak: false });
        ex += eduColWidths[1];
        doc.moveTo(ex, y).lineTo(ex, y + 128).stroke();
        doc.text('Name of Institution', ex + 3, y + 2, { width: eduColWidths[2] - 6, lineBreak: false });
        doc.text('ชื่อสถาบัน', ex + 3, y + 8, { width: eduColWidths[2] - 6, lineBreak: false });
        ex += eduColWidths[2];
        doc.moveTo(ex, y).lineTo(ex, y + 128).stroke();
        doc.text('Major', ex + 3, y + 2, { width: eduColWidths[3] - 6, lineBreak: false });
        doc.text('วิชาเอก', ex + 3, y + 8, { width: eduColWidths[3] - 6, lineBreak: false });
        ex += eduColWidths[3];
        doc.moveTo(ex, y).lineTo(ex, y + 128).stroke();
        doc.text('GPA', ex + 3, y + 2, { width: eduColWidths[4] - 6, lineBreak: false });
        doc.text('เกรดเฉลี่ย', ex + 3, y + 8, { width: eduColWidths[4] - 6, lineBreak: false });

        // Row lines
        doc.moveTo(margin, y + 15).lineTo(margin + contentWidth, y + 15).stroke();

        // Education rows
        const eduRows = [
            { label: 'High School มัธยมศึกษา', year: data.highSchoolYear, name: data.highSchoolName, major: '', gpa: data.highSchoolGpa },
            { label: 'Diploma อนุปริญญา', year: data.diplomaYear, name: data.diplomaName, major: data.diplomaMajor, gpa: data.diplomaGpa },
            { label: 'Bachelor ปริญญาตรี', year: data.bachelorYear, name: data.bachelorName, major: data.bachelorMajor, gpa: data.bachelorGpa },
            { label: 'Master ปริญญาโท', year: data.masterYear, name: data.masterName, major: data.masterMajor, gpa: data.masterGpa },
            { label: 'Others อื่นๆ', year: data.otherYear, name: data.otherName, major: data.otherMajor, gpa: data.otherGpa }
        ];

        let ey = y + 17;
        eduRows.forEach((row, i) => {
            let exx = margin;
            doc.text(row.label, exx + 3, ey, { width: eduColWidths[0] - 6, lineBreak: false });
            exx += eduColWidths[0];
            doc.text(row.year || '', exx + 3, ey, { width: eduColWidths[1] - 6, lineBreak: false });
            exx += eduColWidths[1];
            doc.text(row.name || '', exx + 3, ey, { width: eduColWidths[2] - 6, lineBreak: false });
            exx += eduColWidths[2];
            doc.text(row.major || '', exx + 3, ey, { width: eduColWidths[3] - 6, lineBreak: false });
            exx += eduColWidths[3];
            doc.text(row.gpa || '', exx + 3, ey, { width: eduColWidths[4] - 6, lineBreak: false });
            ey += 11.5;
        });

        // Footer - use absolute positioning
        doc.fontSize(7.5);
        doc.text('1 / 2', 0, pageHeight - 25, { align: 'center', width: pageWidth, lineBreak: false });
        doc.text('F-HRM-01-05 Rev :02 01/01/67', pageWidth - margin - 100, pageHeight - 25, { lineBreak: false });

        // ============ PAGE 2 ============
        doc.addPage();

        // SPECIAL SKILL section
        y = margin;
        doc.fontSize(9.5).text('SPECIAL SKILL ความสามารถพิเศษ', margin, y, { align: 'center', width: contentWidth, lineBreak: false });

        y += 10;
        drawBox(margin, y, contentWidth, 68);

        // Language skills table
        doc.fontSize(7.5);
        doc.text('Foreign Languages', margin + 3, y + 2, { width: 80, lineBreak: false });
        doc.text('Spoken พูด', margin + 90, y + 2, { width: 120, lineBreak: false });
        doc.text('Written เขียน', margin + 220, y + 2, { width: 120, lineBreak: false });
        doc.text('Understand เข้าใจ', margin + 350, y + 2, { width: 185, lineBreak: false });

        // English row
        let ly = y + 12;
        doc.text('ภาษาอังกฤษ (English)', margin + 3, ly, { width: 80, lineBreak: false });

        // Checkboxes for English - simplified
        checkbox(margin + 90, ly, data.englishSpoken === 'excellent');
        doc.text('Excellent', margin + 100, ly, { width: 35, lineBreak: false });
        checkbox(margin + 140, ly, data.englishSpoken === 'good');
        doc.text('Good', margin + 150, ly, { width: 25, lineBreak: false });
        checkbox(margin + 180, ly, data.englishSpoken === 'fair');
        doc.text('Fair', margin + 190, ly, { width: 25, lineBreak: false });

        checkbox(margin + 220, ly, data.englishWritten === 'excellent');
        doc.text('Excellent', margin + 230, ly, { width: 35, lineBreak: false });
        checkbox(margin + 270, ly, data.englishWritten === 'good');
        doc.text('Good', margin + 280, ly, { width: 25, lineBreak: false });
        checkbox(margin + 310, ly, data.englishWritten === 'fair');
        doc.text('Fair', margin + 320, ly, { width: 25, lineBreak: false });

        checkbox(margin + 350, ly, data.englishUnderstand === 'excellent');
        doc.text('Excellent', margin + 360, ly, { width: 35, lineBreak: false });
        checkbox(margin + 400, ly, data.englishUnderstand === 'good');
        doc.text('Good', margin + 410, ly, { width: 35, lineBreak: false });
        checkbox(margin + 450, ly, data.englishUnderstand === 'fair');
        doc.text('Fair', margin + 460, ly, { width: 75, lineBreak: false });

        // Other skills
        ly = y + 28;
        checkbox(margin + 3, ly, data.hasComputer);
        doc.text('Computer คอมพิวเตอร์', margin + 12, ly, { width: 523, lineBreak: false });

        ly += 10.5;
        checkbox(margin + 3, ly, data.hasDrivingCar);
        doc.text(`Driving รถยนต์ : Driver Licence No. ${data.carLicenseNo || ''}`, margin + 12, ly, { width: 523, lineBreak: false });

        ly += 10.5;
        checkbox(margin + 3, ly, data.hasDrivingMotor);
        doc.text(`Driving รถจักรยานยนต์ : Driver Licence No. ${data.motorLicenseNo || ''}`, margin + 12, ly, { width: 523, lineBreak: false });

        // PROFESSIONAL TRAINING section
        y += 70;
        doc.fontSize(9.5).text('PROFESSIONAL TRAINING ประวัติการฝึกอบรม', margin, y, { align: 'center', width: contentWidth, lineBreak: false });
        doc.fontSize(7.5).text('(Curriculums หลักสูตร)', margin, y + 9, { align: 'center', width: contentWidth, lineBreak: false });

        y += 18;
        drawBox(margin, y, contentWidth, 45);

        // Training data
        doc.fontSize(7.5);
        if (data.training1Course) {
            doc.text(`${data.training1Course} - ${data.training1Institution || ''} (${data.training1Year || ''})`, margin + 3, y + 3, { width: contentWidth - 6, lineBreak: false });
        }
        if (data.training2Course) {
            doc.text(`${data.training2Course} - ${data.training2Institution || ''} (${data.training2Year || ''})`, margin + 3, y + 12, { width: contentWidth - 6, lineBreak: false });
        }
        if (data.training3Course) {
            doc.text(`${data.training3Course} - ${data.training3Institution || ''} (${data.training3Year || ''})`, margin + 3, y + 21, { width: contentWidth - 6, lineBreak: false });
        }

        // EMPLOYMENT RECORD section
        y += 40;
        doc.fontSize(9.5).text('EMPLOYMENT RECORD ประวัติการทำงาน', margin, y, { align: 'center', width: contentWidth, lineBreak: false });

        y += 10;
        // Employment table
        const empColWidths = [60, 110, 60, 85, 50, 80];
        drawBox(margin, y, contentWidth, 68);

        // Headers
        doc.fontSize(7.5);
        let empX = margin;
        doc.text('Period Time', empX + 2, y + 2, { width: empColWidths[0] - 4, lineBreak: false });
        doc.text('ระยะเวลา', empX + 2, y + 8, { width: empColWidths[0] - 4, lineBreak: false });
        empX += empColWidths[0];
        doc.moveTo(empX, y).lineTo(empX, y + 68).stroke();
        doc.text('List of Company', empX + 2, y + 2, { width: empColWidths[1] - 4, lineBreak: false });
        doc.text('ชื่อสถานประกอบการ', empX + 2, y + 8, { width: empColWidths[1] - 4, lineBreak: false });
        empX += empColWidths[1];
        doc.moveTo(empX, y).lineTo(empX, y + 68).stroke();
        doc.text('Position', empX + 2, y + 2, { width: empColWidths[2] - 4, lineBreak: false });
        doc.text('ตำแหน่ง', empX + 2, y + 8, { width: empColWidths[2] - 4, lineBreak: false });
        empX += empColWidths[2];
        doc.moveTo(empX, y).lineTo(empX, y + 68).stroke();
        doc.text('Responsibilities', empX + 2, y + 2, { width: empColWidths[3] - 4, lineBreak: false });
        doc.text('หน้าที่รับผิดชอบ', empX + 2, y + 8, { width: empColWidths[3] - 4, lineBreak: false });
        empX += empColWidths[3];
        doc.moveTo(empX, y).lineTo(empX, y + 68).stroke();
        doc.text('Salary', empX + 2, y + 2, { width: empColWidths[4] - 4, lineBreak: false });
        doc.text('เงินเดือน', empX + 2, y + 8, { width: empColWidths[4] - 4, lineBreak: false });
        empX += empColWidths[4];
        doc.moveTo(empX, y).lineTo(empX, y + 68).stroke();
        doc.text('Reason', empX + 2, y + 2, { width: empColWidths[5] - 4, lineBreak: false });
        doc.text('เหตุผลลาออก', empX + 2, y + 8, { width: empColWidths[5] - 4, lineBreak: false });

        doc.moveTo(margin, y + 15).lineTo(margin + contentWidth, y + 15).stroke();

        // Employment rows
        const empRows = [
            { period: data.work1Period, company: data.work1Company, position: data.work1Position, resp: data.work1Responsibilities, salary: data.work1Salary, reason: data.work1Reason },
            { period: data.work2Period, company: data.work2Company, position: data.work2Position, resp: data.work2Responsibilities, salary: data.work2Salary, reason: data.work2Reason },
            { period: data.work3Period, company: data.work3Company, position: data.work3Position, resp: data.work3Responsibilities, salary: data.work3Salary, reason: data.work3Reason }
        ];

        let empY = y + 17;
        // Helper to truncate text
        const truncate = (text, maxLen) => {
            if (!text) return '';
            return text.length > maxLen ? text.substring(0, maxLen) + '..' : text;
        };

        empRows.forEach((row, i) => {
            let rx = margin;
            doc.fontSize(5.5);
            doc.text(truncate(row.period, 12) || '', rx + 2, empY, { width: empColWidths[0] - 4, lineBreak: false });
            rx += empColWidths[0];
            doc.text(truncate(row.company, 20) || '', rx + 2, empY, { width: empColWidths[1] - 4, lineBreak: false });
            rx += empColWidths[1];
            doc.text(truncate(row.position, 12) || '', rx + 2, empY, { width: empColWidths[2] - 4, lineBreak: false });
            rx += empColWidths[2];
            doc.text(truncate(row.resp, 18) || '', rx + 2, empY, { width: empColWidths[3] - 4, lineBreak: false });
            rx += empColWidths[3];
            doc.text(truncate(row.salary, 8) || '', rx + 2, empY, { width: empColWidths[4] - 4, lineBreak: false });
            rx += empColWidths[4];
            doc.text(truncate(row.reason, 12) || '', rx + 2, empY, { width: empColWidths[5] - 4, lineBreak: false });
            empY += 14.5;
        });

        // OTHER section
        y += 70;
        doc.fontSize(9.5).text('OTHER ข้อมูลด้านอื่น ๆ', margin, y, { align: 'center', width: contentWidth, lineBreak: false });

        y += 10;
        doc.fontSize(6.5);

        const questions = [
            { q: '1. Have you ever applied or worked with I C P Group before?', qTh: 'ท่านเคยสมัครหรือทำงานในกลุ่มบริษัทในเครือ ไอ ซี พี มาก่อนหรือไม่?', field: 'workedBefore' },
            { q: '2. Do you have any relatives or friends working in I C P Group?', qTh: 'ท่านมีญาติพี่น้องหรือคนรู้จักทำงานในกลุ่มบริษัทในเครือ ไอ ซี พี หรือไม่?', field: 'hasRelatives' },
            { q: '3. Have you ever been convicted for any crimes?', qTh: 'ท่านเคยถูกตัดสินลงโทษหรือไม่?', field: 'convicted' },
            { q: '4. Have you ever been seriously ill within the past 5 years?', qTh: 'ในระยะ 5 ปีที่ผ่านมา ท่านเคยป่วยเป็นโรคร้ายแรงหรือไม่?', field: 'seriousIll' },
            { q: '5. Do you have color blindness?', qTh: 'ท่านมีภาวะตาบอดสีหรือไม่?', field: 'colorBlind' },
            { q: '6. Are you pregnant at the moment?', qTh: 'ขณะนี้ท่านอยู่ในระหว่างการตั้งครรภ์หรือไม่?', field: 'pregnant' },
            { q: '7. Have you ever contracted with contagious disease?', qTh: 'ท่านเคยป่วยเป็นโรคติดต่อร้ายแรงมาก่อนหรือไม่?', field: 'contagious' }
        ];

        questions.forEach((item, i) => {
            doc.text(item.q, margin + 3, y, { width: pageWidth - margin - 70, lineBreak: false });
            checkbox(pageWidth - margin - 60, y, data[item.field] === 'yes');
            doc.text('Yes', pageWidth - margin - 52, y, { width: 20, lineBreak: false });
            checkbox(pageWidth - margin - 30, y, data[item.field] === 'no');
            doc.text('No', pageWidth - margin - 22, y, { width: 22, lineBreak: false });
            y += 9.5;
            doc.text(item.qTh, margin + 3, y, { width: contentWidth, lineBreak: false });
            y += 10.5;
        });

        // Disclaimer
        y += 3;
        doc.fontSize(6.5);
        doc.text('I understand that any falsified statement on this application can be sufficient cause for dismissal if I am employed.', margin, y, { width: contentWidth, lineBreak: false });
        y += 9.5;
        doc.text('ข้าพเจ้ายอมรับว่าข้อความใดๆเป็นความจริงทุกประการ การปิดบังความจริงใดๆ จะทำให้ข้าพเจ้าหมดสิทธิ์ในการได้รับการพิจารณาว่าจ้างงาน', margin, y, { width: contentWidth, lineBreak: false });
        y += 6.5;
        doc.text('หรืออาจถูกปลดออกจากงานในกรณีที่บริษัทฯ ได้ว่าจ้างข้าพเจ้าแล้ว', margin, y, { width: contentWidth, lineBreak: false });

        // Signature
        y += 15;
        doc.fontSize(7.5);
        doc.text('Signature ลายมือชื่อผู้สมัคร', margin + 80, y, { width: 200, lineBreak: false });
        doc.text(`Date วัน เดือน ปี ${data.signatureDate || ''}`, pageWidth - margin - 120, y, { width: 120, lineBreak: false });

        // Footer - use absolute positioning
        doc.fontSize(7.5);
        doc.text('2 / 2', 0, pageHeight - 25, { align: 'center', width: pageWidth, lineBreak: false });
        doc.text('F-HRM-01-05 Rev :02 01/01/67', pageWidth - margin - 100, pageHeight - 25, { lineBreak: false });

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all applications
app.get('/api/applications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single application
app.get('/api/applications/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
