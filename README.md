# Vektra - Enterprise HR Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20TailwindCSS-61DAFB)](frontend/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB-339933)](backend/)
[![Python](https://img.shields.io/badge/AI%20Service-FastAPI%20%7C%20PyTorch%20%7C%20FaceNet-3776AB)](face-service/)
[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)]()

**Vektra** is a modern, full-stack, enterprise-grade **Human Resource Management System (E-HRMS)** engineered for multi-tenant organizations. It combines core HR administrative operations, intelligent shift evaluation, dynamic payroll processing, GPS geofencing, and AI-powered facial recognition biometric kiosks with real-time anti-spoofing liveness verification.

---

## 🏛️ System Architecture

Vektra is built as a highly scalable microservice-oriented architecture comprising three distinct tiers:

```
                          ┌────────────────────────────────────────┐
                          │          Vektra Web / Mobile           │
                          │   React 19 + Vite + Tailwind CSS UI    │
                          └───────────────────┬────────────────────┘
                                              │
                                   REST API / JWT Auth
                                              │
                                              ▼
                          ┌────────────────────────────────────────┐
                          │           Node.js / Express            │
                          │          Core HR REST Backend          │
                          └──────────┬──────────────────┬──────────┘
                                     │                  │
               MongoDB Persistence   │                  │  Internal Service Secret
            (Users, HR, Payroll, DB) │                  │  (X-Internal-Secret)
                                     ▼                  ▼
                          ┌────────────────────┐   ┌──────────────────────────┐
                          │   MongoDB Cluster  │   │  FastAPI PyTorch Service │
                          │  Multi-Tenant DB   │   │  FaceNet 512-d Embeddings│
                          └────────────────────┘   └──────────────────────────┘
```

---

## 🚀 Key Features

### 🏢 Multi-Tenant Organization Onboarding
- **Self-Service Registration**: Enterprise registration workflow with organization code allocation and admin credentials setup.
- **SuperAdmin Command Center**: Multi-tenant governance dashboard for inspecting organization requests, instant approval/rejection, tenant isolation, and audit trace logs.

### 🤖 AI Biometric Kiosk & Mobile Facial Attendance
- **FaceNet Deep Learning Engine**: High-accuracy 512-dimensional facial feature vector extraction via PyTorch.
- **Real-Time Liveness & Anti-Spoofing Check**: Frame texture and reflection analysis to prevent photo/screen spoofing.
- **Kiosk Verification Mode**: High-speed touchless clock-in terminal mode for office reception counters.
- **Mobile Camera Verification**: Self-service clock-in for remote/field employees directly from smartphones.

### 📍 GPS Geofencing & Smart Shift Evaluation
- **Haversine Geofencing**: Validates employee lat/long coordinates against configured branch office radiuses.
- **Dynamic Shift Engine**: Automated classification of arrivals into *On-Time*, *Late*, *Half-Day*, *Early Departure*, or *Overtime* based on shift policies.

### 💰 Compensation & Payroll Engine
- **Salary Calculations**: Base pay configuration, automated allowances (HRA, transport, medical), and statutory deductions (tax, insurance, provident fund).
- **Payslip Generation**: Dynamic breakdown with downloadable payslip records for management and self-service portals.
- **Payroll Status Workflow**: Draft, Pending Approval, Processed, and Disbursed execution stages.

### 👥 Comprehensive Employee Directory & Portals
- **Role-Based Access Control (RBAC)**: Enforces access boundaries across 5 roles: `SUPERADMIN`, `ADMIN`, `HR`, `MANAGER`, and `EMPLOYEE`.
- **Management Portal**: Staff list, department filtering, status management, attendance override, and biometrics enrollment modals.
- **Employee Self-Service Portal**: Individual dashboard showing attendance calendar, payslips, personal documents, and profile settings.

### 📊 BI Analytics & Global Fuzzy Search
- **KPI Dashboards**: Active headcount trend, attendance ratios, open positions, department breakdowns, and real-time activity feeds.
- **Global Search**: High-performance multi-field fuzzy search across employees, departments, and payroll runs.
- **Reports Export**: Instant export of employee rosters, attendance history, and payroll data in CSV and JSON formats.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS v3, Framer Motion, Lucide Icons, Chart.js, Recharts, Axios, React Router DOM v7 |
| **Backend API** | Node.js (ES Modules), Express v4, MongoDB, Mongoose ORM, JSON Web Tokens (JWT), BcryptJS, Express-Rate-Limit, Nodemailer |
| **AI Face Microservice** | Python 3.10+, FastAPI, PyTorch, Torchvision, OpenCV, Pillow, Scikit-learn, Python-Multipart, Uvicorn |
| **Database** | MongoDB (Local / Atlas Cloud) |

---

## 📁 Repository Structure

```
E-HRMS/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # MongoDB Connection configuration
│   │   ├── controllers/      # HR, Auth, Attendance, Payroll & SuperAdmin Logic
│   │   ├── middleware/       # JWT Auth verification & Rate Limiters
│   │   ├── models/           # Mongoose Data Schemas (User, Employee, Company, etc.)
│   │   ├── routes/           # REST API Endpoint Routers
│   │   ├── utils/            # Geofencing, Shift Evaluator, Email Dispatcher
│   │   ├── app.js            # Express app middleware declaration
│   │   └── server.js         # HTTP Server Entry Point
│   └── package.json
│
├── face-service/             # FastAPI PyTorch Face Recognition Microservice
│   ├── core/                 # FaceNet model, Liveness detection, Quality checks
│   ├── routers/              # Face Enrollment (/enroll) & Verification (/verify)
│   ├── main.py               # FastAPI Microservice Entry Point
│   ├── requirements.txt      # Python dependencies
│   └── start.sh              # Unix service startup script
│
├── frontend/                 # React 19 Vite Web Client
│   ├── src/
│   │   ├── api/              # Axios API Service Connectors
│   │   ├── components/       # Reusable UI Controls (Headers, Sidebars, Modals)
│   │   ├── context/          # Global Auth State & User Context
│   │   ├── portals/          # Modular Portal Views
│   │   │   ├── auth/         # Login, Org Signup, Reset Password
│   │   │   ├── employee/     # Self-Service Employee Portal & Mobile Check-in
│   │   │   ├── management/   # HR & Admin Operations, Kiosk Mode, Payroll, Reports
│   │   │   └── superadmin/   # System SuperAdmin Governance Center
│   │   ├── pages/            # Landing Page & Public routes
│   │   ├── App.jsx           # Master Client Router
│   │   └── main.jsx          # React DOM Root
│   └── package.json
│
├── LICENSE                   # MIT Open Source License
└── README.md                 # Project Documentation
```

---

## ⚡ Quick Start & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **MongoDB**: Local MongoDB server running on port `27017` OR a MongoDB Atlas connection string.

---

### Step 1: Configure Environment Variables

Create `.env` files in each service directory based on the configuration templates below:

#### `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ehrms
JWT_SECRET=vektra_jwt_super_secret_key_2026
EMAIL_USER=admin@vektra.io
EMAIL_PASS=your_smtp_app_password
FACE_SERVICE_URL=http://localhost:8000
INTERNAL_SERVICE_SECRET=ehrms_face_service_secret_2026
```

#### `face-service/.env` (Optional defaults built-in)
```env
INTERNAL_SERVICE_SECRET=ehrms_face_service_secret_2026
FACENET_THRESHOLD=0.6
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 2: Start the Services

#### 1️⃣ Start the Node.js Backend API
```bash
cd backend
npm install
npm run dev
```
*Backend server runs at:* `http://localhost:5000`

#### 2️⃣ Start the AI Face Recognition Microservice
```bash
cd face-service
pip install -r requirements.txt
python main.py
```
*FastAPI microservice runs at:* `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)

#### 3️⃣ Start the React Client
```bash
cd frontend
npm install
npm run dev
```
*Vite web application runs at:* `http://localhost:5173`

---

## 🔐 API Endpoint Quick Reference

### Auth & Organization Routes (`/api/auth`)
- `POST /api/auth/register-org` - Submit new company onboarding application
- `POST /api/auth/login` - Unified authentication for all user roles
- `POST /api/auth/forgot-password` - Dispatch password reset token email
- `POST /api/auth/reset-password` - Update account password with token

### HR & Staff Management (`/api/employees`)
- `GET /api/employees` - Fetch employee directory with department filters
- `POST /api/employees` - Register employee & auto-generate login credentials
- `PUT /api/employees/:id` - Update employee profile & salary settings
- `DELETE /api/employees/:id` - Remove employee record

### Attendance & Biometrics (`/api/attendance` & `/api/face`)
- `POST /api/attendance/clock-in` - Clock in with GPS coordinates verification
- `POST /api/attendance/clock-out` - Clock out & calculate shift duration
- `POST /api/face/verify` - Kiosk biometric face match clock-in/out
- `POST /api/face/enroll` - Enroll employee 512-d facial embedding vector

### Payroll Engine (`/api/payroll`)
- `GET /api/payroll` - Fetch company payroll runs & summaries
- `POST /api/payroll/process` - Execute bulk salary calculation run
- `GET /api/payroll/payslip/:employeeId` - Retrieve detailed payslip statement

### Company Document Storage (`/api/documents`)
- `POST /api/documents/upload` - Upload tenant document (Max 15MB, PDF/DOC/DOCX/PNG/JPEG) (`ADMIN`, `HR`)
- `GET /api/documents` - List active tenant documents with category filter & title search (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`)
- `GET /api/documents/:id/download` - Stream document binary content from GridFS (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`)
- `DELETE /api/documents/:id` - Soft-delete document metadata (`ADMIN`, `HR`)

### SuperAdmin Governance (`/api/superadmin`)
- `GET /api/superadmin/companies` - List pending & approved organization tenants
- `POST /api/superadmin/approve/:id` - Approve organization access
- `POST /api/superadmin/reject/:id` - Reject organization registration

---

## 🔐 RBAC Permission Matrix

| Module & Endpoint | SUPERADMIN | ADMIN | HR | MANAGER | EMPLOYEE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Org Onboarding & Approval** (`/api/superadmin/*`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Staff & Roles** (`/api/admin/*`) | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Employee Directory** (`/api/employees`) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Attendance & Biometrics** (`/api/attendance`, `/api/face`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Payroll Processing** (`/api/payroll`) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Upload Documents** (`POST /api/documents/upload`) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **List Documents** (`GET /api/documents`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Download Document** (`GET /api/documents/:id/download`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Soft-Delete Document** (`DELETE /api/documents/:id`) | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 🛡️ Security & Privacy Protections

- **Data Privacy Standard**: Built with strict data privacy principles inspired by enterprise compliance. Biometric data is converted to encrypted vector math embeddings; raw face images are never stored unencrypted.
- **Service Isolation**: Microservice-to-microservice calls are gated with secure `X-Internal-Secret` verification headers.
- **Password Encryption**: All password credentials are salted and hashed using `bcryptjs`.
- **API Rate Limiting**: Built-in protection against brute-force attacks via `express-rate-limit`.

---

## 👤 Author & Licensing

#### **Anubhav Das**
*Computer Science Engineering Student*

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
