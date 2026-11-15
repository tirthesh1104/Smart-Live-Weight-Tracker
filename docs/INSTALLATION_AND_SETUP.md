# Installation, Setup & Deployment Guide
## Smart Live Weight Tracker – Local Development & Demonstration Setup

---

### 1. System Requirements & Prerequisites

* **Operating System:** Windows 10/11, Ubuntu 22.04 LTS, or macOS 13+
* **Node.js Environment:** Node.js v18.0.0 or higher (v20+ recommended), with `npm` v9+
* **Python Environment:** Python 3.10, 3.11, 3.12, or 3.13
* **Network Access:** HTTPS outbound access to Supabase Cloud (`*.supabase.co`)

> **IMPORTANT Windows Precaution (Drive C: Disk Quota / Space Constraint):**  
> If your system C: drive has limited free disk space, always configure PowerShell to redirect temporary file allocation to drive D: before running Node, Vite, or Python compilation tasks:
> ```powershell
> $env:TEMP = "D:\temp"; $env:TMP = "D:\temp"
> ```

---

### 2. Environment Variables Configuration

Ensure `.env.local` exists in the repository root directory with the following configuration:

```env
# Supabase Cloud Project Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-placeholder

# FastAPI Machine Learning Microservice URL
VITE_AI_SERVICE_URL=http://127.0.0.1:8000

# Administrative Security Hash Salt
VITE_ADMIN_PIN_SALT=railway_crowd_tracker_2026_secure_salt
```

---

### 3. Step-by-Step Installation Commands

#### Step A: Clone & Enter Directory
```powershell
cd "d:\Lenovo\Downloads\AI-Powered Railway Crowd Management System"
```

#### Step B: Install Frontend Dependencies
```powershell
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"
npm install
```

#### Step C: Install Python Backend Dependencies
```powershell
pip install fastapi uvicorn pydantic numpy scipy pytest requests httpx
```

---

### 4. Running the Complete System Locally

To demonstrate the full cyber-physical architecture, run both the backend AI service and the frontend web dashboard concurrently in separate terminal windows:

#### Terminal 1: Launch FastAPI ML Backend Microservice
```powershell
python -m uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```
* The backend will start at: `http://127.0.0.1:8000`
* Interactive API Docs: `http://127.0.0.1:8000/docs`
* Telemetry Health Check: `http://127.0.0.1:8000/health`

#### Terminal 2: Launch React + Vite Web Application
```powershell
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"
npm run dev
```
* The web application will launch at: `http://localhost:5173`
* Open `http://localhost:5173` in any standard web browser (Chrome, Edge, Firefox).

---

### 5. Running the Verification & Test Suites

You can execute the entire automated regression harness with a single sequence:

```powershell
# 1. Static TypeScript Type Checking
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; npx tsc --noEmit

# 2. Production Build Verification
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; npm run build

# 3. Python Backend Unit Tests
python -m pytest backend -v

# 4. Live Supabase Database Verification
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; npm run db:verify

# 5. Full 16-Point Verification Checklist
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; node scripts/test_16_verification_checklist.mjs

# 6. Role-Wise Authentication Regression
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; node scripts/test_role_wise_auth_regression.mjs

# 7. Live Supabase CRUD & Offline Queue Audit
$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; node scripts/test_phase5_live_audit.mjs
```
