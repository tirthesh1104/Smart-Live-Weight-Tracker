# INSTALLATION & DEPLOYMENT GUIDE
## Smart Live Weight Tracker – Railway Passenger Coach Weight Monitoring & Crowd Management System

**Author:** Tirthesh Vaijnath Gutte  
**GitHub:** [https://github.com/tirthesh1104](https://github.com/tirthesh1104)  
**Target Repository:** [https://github.com/tirthesh1104/Smart-Live-Weight-Tracker](https://github.com/tirthesh1104/Smart-Live-Weight-Tracker)  

---

## 1. System Requirements

### Hardware Requirements
* **Processor**: Intel Core i3 / AMD Ryzen 3 or higher (Quad-core recommended)
* **RAM**: 4 GB minimum (8 GB recommended for simultaneous frontend & backend development)
* **Storage**: 500 MB free disk space
* **Physical Railway Sensors**: **NONE** (100% Software-Only Execution)

### Software Prerequisites
| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :---: | :---: | :--- |
| **Node.js** | `v18.0.0` | `v20.12.0+` | `node -v` |
| **npm** | `v9.0.0` | `v10.5.0+` | `npm -v` |
| **Python** | `v3.10` | `v3.11.x` | `python --version` |
| **Git** | `v2.30` | `v2.40+` | `git --version` |

---

## 2. Quick-Start Setup (Under 3 Minutes)

### Step 1: Clone the Repository
```bash
git clone https://github.com/tirthesh1104/Smart-Live-Weight-Tracker.git
cd Smart-Live-Weight-Tracker
```

### Step 2: Configure Environment Variables
Copy the sanitized environment template:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env.local

# On Linux / macOS:
cp .env.example .env.local
```

> **Note on Zero-Config Demo Mode:**  
> The application will run **immediately** in full demonstration mode even without any Supabase or Railway API keys configured. The system automatically initializes `OfflineStorageService` with pre-loaded mock trains, coaches, telemetry, and feedback records.

---

## 3. Frontend Installation & Execution

### Install Node Dependencies
```bash
npm install
```

### Start Vite Development Server
```bash
npm run dev
```
Output:
```
  VITE v5.4.2  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
Open your browser and navigate to: **`http://localhost:5173`**

### Building for Production
To generate a production-ready, minified bundle:
```bash
npm run build
```
The optimized bundle will be compiled into the `dist/` directory in under 8 seconds.

---

## 4. Backend AI Microservice Setup (Optional)

The backend provides the high-precision Holt-Winters forecasting engine and multi-provider railway API gateway. *(If offline or unstarted, the frontend automatically falls back to its built-in client-side statistical forecaster).*

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create & Activate Virtual Environment
**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

**On Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Launch FastAPI Server
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```
Interactive Swagger API documentation: **`http://127.0.0.1:8000/docs`**

---

## 5. Running Automated Test Suites

### Run Backend Unit Tests
```bash
cd backend
pytest -v
```
Expected output:
```
========================= 55 passed in 0.94s =========================
```

### Run Frontend Static Type Checking
```bash
# From project root:
npx tsc --noEmit
```
Expected output: **Code exits cleanly with 0 errors.**

### Validate PostgreSQL Migrations (via PGlite)
```bash
node scripts/validate_postgres_runtime.mjs
```
Expected output:
```
[PASS] Table feedback_submissions: PASS
[SUMMARY] 19/19 Tables Validated (100% PASS with RLS)
```

---

## 6. Troubleshooting & FAQs

### Q1: Do I need to buy or connect an ESP32 or HX711 board?
**No.** The project is strictly **SOFTWARE-ONLY**. All weights, passenger headcounts, and telemetry are generated mathematically by the built-in 10-scenario software simulator.

### Q2: Port 5173 or 8000 is already in use. How do I change ports?
* To run Vite on a custom port: `npx vite --port 3000`
* To run FastAPI on a custom port: `python -m uvicorn main:app --port 8080` (and update `VITE_AI_SERVICE_URL=http://localhost:8080` in `.env.local`).

### Q3: How do I log in to the Administrator desk?
Navigate to `#/login`, click the **ADMIN** desk tab, enter:
* Email: `admin@railway.gov.in`
* Password: `Admin@123`
* 6-Digit PIN: `123456`

---
*Installation guide authored by Tirthesh Vaijnath Gutte.*
