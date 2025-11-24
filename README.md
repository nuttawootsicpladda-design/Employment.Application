# Employment Application System

ระบบใบสมัครงานออนไลน์พร้อม AI Resume Parser

## Features

- HTML Form ครบทุก fields ตามฟอร์มกระดาษ
- Upload Resume แล้ว OpenAI ช่วยกรอกฟอร์มอัตโนมัติ
- บันทึกข้อมูลลง Supabase Database
- Generate PDF ให้ download

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. สร้างโปรเจคใน [Supabase](https://supabase.com)
2. ไปที่ SQL Editor แล้วรัน `supabase-schema.sql`
3. คัดลอก URL และ Anon Key จาก Project Settings > API

### 3. Setup OpenAI

1. สร้าง API Key จาก [OpenAI Platform](https://platform.openai.com)

### 4. Configure Environment

สร้างไฟล์ `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
PORT=3000
```

### 5. Run Server

```bash
npm start
```

หรือ development mode:

```bash
npm run dev
```

### 6. Open Browser

เปิด http://localhost:3000

## Usage

1. **Upload Resume** - อัปโหลดไฟล์ Resume (PDF) แล้วกด "Parse Resume with AI" เพื่อกรอกฟอร์มอัตโนมัติ
2. **กรอกข้อมูล** - ตรวจสอบและแก้ไขข้อมูลที่ AI กรอกให้
3. **ส่งใบสมัคร** - กดปุ่ม "ส่งใบสมัคร" เพื่อบันทึกลง Database
4. **Download PDF** - กดปุ่ม "Download PDF" เพื่อดาวน์โหลดใบสมัคร

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **PDF**: PDFKit

## Thai Font Support (Optional)

สำหรับ PDF ที่รองรับภาษาไทย:

1. ดาวน์โหลด THSarabunNew.ttf
2. สร้างโฟลเดอร์ `fonts/`
3. ใส่ไฟล์ font ไว้ที่ `fonts/THSarabunNew.ttf`

## API Endpoints

- `POST /api/parse-resume` - Parse resume with OpenAI
- `POST /api/submit` - Submit application
- `POST /api/generate-pdf` - Generate PDF
- `GET /api/applications` - Get all applications
- `GET /api/applications/:id` - Get single application
