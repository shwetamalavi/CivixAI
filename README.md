# CivixAI — Smart Civic Issue Resolver & Governance Platform

> **AI-Powered Civic Redressal & Municipal Governance Platform**  
> Built with **React**, **Express & Node.js**, **MongoDB Atlas (Geospatial 2dsphere Indexing)**, and **Google Gemini Multimodal Vision AI**.

---

## 🏛️ Problem Statement & The CivixAI Solution
Traditional municipal grievance portals suffer from:
1. **Slow manual routing:** Citizens file complaints that get bounced across wrong departments for weeks.
2. **Lack of transparency:** Citizens have no visibility into SLA timers, dispatched field crews, or real progress.
3. **Subjective priority assessment:** High-hazard civic emergencies (exposed 240V wires, cavernous potholes) sit in the same queue as minor cosmetic defects.

**CivixAI** transforms civic governance into an instant, automated, AI-supervised platform:
- **Snap & Triage:** Citizens upload photo evidence. Multimodal Vision AI (Gemini 1.5/2.0 Flash) inspects the image, assesses hazard index (0–100), tags risk elements, and assigns priority (Urgent, High, Medium, Low).
- **Automated Grievance Filing:** Auto-generates formal civic grievance legal drafts formatted with statutory municipal citations for official filing.
- **Geospatial 2dsphere Routing:** Issues are geo-tagged with coordinates `[lng, lat]` and mapped using Leaflet GIS with spherical proximity search.
- **Automated Field Dispatches:** Dispatches instant SMS/Email alerts to department engineers and notifies citizens via SMS upon status transitions.

---

## 🚀 Key Features

### 1. Citizen Portal
- **Instant Photo Evidence & Test Drives:** Upload or drag-and-drop photos, or test drive with 1-click preset civic problems (*Deep Asphalt Pothole*, *Overflowing Commercial Dumpster*, *Exposed High-Voltage Wire*, *Sub-surface Water Main Rupture*, *Hazardous Fallen Tree Limb*).
- **Multimodal AI Vision Telemetry:** Real-time visual hazard score, detected objects, and recommended SLA.
- **Auto-drafted Grievance Notice:** Formal RTI-compliant grievance petitions with reference numbers, legal clauses, and print/copy actions.
- **Live GPS Auto-Tagger:** Automatically extracts browser GPS coordinates and reverse geocodes the street address.
- **Community Feed & Upvotes:** Upvote local infrastructure issues to boost priority in municipal queues.

### 2. Interactive GIS Map (Leaflet)
- **CartoDB Dark Matter GIS Tiles:** Ultra-modern dark mode map canvas.
- **Dynamic Pulsing Pins:** Real-time color-coded pins (Red pulse for Urgent, Orange for High, Yellow for Medium, Green for Resolved).
- **Proximity Radar:** Radius search (1km, 5km, 10km) around user coordinates using GeoJSON `$near` / spherical Haversine calculations.
- **Popup Telemetry:** Preview thumbnail, ticket reference, defect category, and quick case inspection.

### 3. Municipal Governance Console
- **Multi-Department Queues:** Roads & Bridges, Sanitation & Solid Waste, Electrical & Streetlighting, Water & Sewerage Board, Urban Safety & Hazard Prevention.
- **SLA Countdown & Urgency Badges:** Urgent issues flagged with strict <12h response directive.
- **Status Lifecycle:** `Pending Triage` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved` (with photo proof).
- **Automated Notification Audit Log:** Live log of SMS & Email dispatches sent to Junior Engineers and Citizens.

---

## 🛠️ Tech Stack Breakdown

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide-React, Leaflet & React-Leaflet, Canvas-Confetti, Vanilla CSS Design System |
| **Backend** | Express 4, Node.js (ES Modules), Multer (File Telemetry), Morgan, CORS, Dotenv |
| **Database** | MongoDB Atlas / Mongoose with GeoJSON `Point` & `2dsphere` Geospatial Indexing + Resilient In-Memory Spatial Fallback |
| **AI Layer** | Google Gemini Multimodal Vision API (`@google/generative-ai`), Heuristic Civic Vision Engine |

---

## 🏃 Getting Started

### 1. Clone & Install Dependencies
```bash
# In project root
npm run install:all
```

### 2. Environment Configuration
Create or edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/civixai
GEMINI_API_KEY=your_gemini_api_key_here  # Optional: high-fidelity civic heuristic engine active by default
CLIENT_URL=http://localhost:5173
```
*(Note: A Gemini API key can also be configured directly in the web UI via the Settings modal!)*

### 3. Run Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: React Client (Port 5173)
cd client
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, MongoDB status, active geospatial index |
| `GET` | `/api/issues` | Query all issues (filters: `category`, `status`, `priority`, `department`, `search`) |
| `GET` | `/api/issues/nearby` | Geospatial query within radius (`lng`, `lat`, `maxDistance`) |
| `GET` | `/api/issues/:id` | Retrieve single issue by ID or Ticket Reference |
| `POST` | `/api/issues` | Create issue with photo upload, triggers AI Vision & notification dispatch |
| `PATCH` | `/api/issues/:id/status` | Update status (`In Progress`, `Resolved`), append note & resolution photo |
| `POST` | `/api/issues/:id/upvote` | Citizen upvote increment |
| `POST` | `/api/issues/:id/comments` | Post citizen/official comment |
| `POST` | `/api/ai/analyze-preview` | Multimodal AI preview analysis before filing |
| `GET` | `/api/ai/status` | Check Gemini API key configuration |
| `POST` | `/api/ai/set-key` | Dynamically update Gemini API key |
| `GET` | `/api/analytics/overview` | Municipal metrics, resolution rate, department distribution |
| `GET` | `/api/analytics/audit-logs` | Real-time SMS & Email dispatch audit logs |

---

## 👥 Municipal Departments Integrated
1. **Roads & Bridges Department (PWD)** — Pothole repairs, asphalt resurfacing, curb restoration.
2. **Sanitation & Solid Waste Management** — Dumpster overflow, bio-waste clearance, illegal dumping.
3. **Electrical & Public Streetlighting** — Dangling live wires, blackout repairs, feeder circuit isolation.
4. **Water Supply & Sewerage Board** — Water main bursts, pipeline replacement, storm drain clearance.
5. **Urban Safety & Hazard Prevention** — Precarious tree limbs, sidewalk collapse, missing manhole covers.
