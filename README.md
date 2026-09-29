# MACHINA-X — Digital Twin Predictive Maintenance System

> **Academic Project** | Group 8 | ABES Engineering College | Dept. of CSE (Data Science)  
> Guide: Monika Sharma

An end-to-end explainable AI-driven Digital Twin platform for predictive maintenance of industrial equipment, starting with a 3-Phase Induction Motor.

---

## Architecture

```
                    ┌──────────────────┐
                    │   React Frontend │
                    │    Dashboard     │
                    │   (port 5173)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Spring Boot API │
                    │   (port 8080)    │
                    └───────┬───┬──────┘
                            │   │
                 ┌──────────┘   └──────────┐
                 ▼                         ▼
        ┌─────────────────┐       ┌─────────────────┐
        │   PostgreSQL    │       │   ML Service    │
        │  (port 5432)    │       │  (port 8000)    │
        │                 │       │                 │
        │ Sensor Readings │       │ Isolation Forest│
        │ Digital Twin    │       │ XGBoost         │
        │ Predictions     │       │ SHAP            │
        │ RUL             │       │ RUL             │
        └─────────────────┘       └─────────────────┘
                 ▲
                 │
        ┌─────────────────┐
        │ Python Simulator│
        │  (port 8001)    │
        └─────────────────┘
```

### Project Structure

```
machinax/
├── backend/        → Java Spring Boot REST API (port 8080)
├── ml-service/     → Python FastAPI ML: Isolation Forest + XGBoost + SHAP (port 8000)
├── simulator/      → Python sensor simulation service (port 8001)
└── frontend/       → React + Vite + TypeScript dashboard (port 5173)
```

---

## Quick Start

### Prerequisites

- Java 21+
- Apache Maven 3.9+
- Python 3.13+
- Node.js 20+
- PostgreSQL 18 running on port 5432

### Startup Order

> **Important**: Services must be started in this order.

```
PostgreSQL  →  Spring Boot  →  ML Service  →  Simulator  →  React Frontend
```

### 1. Database

PostgreSQL database `machinax_db` must be running:

```sql
CREATE DATABASE machinax_db;
CREATE USER machinax_user WITH PASSWORD 'machinax_pass';
GRANT ALL PRIVILEGES ON DATABASE machinax_db TO machinax_user;
```

### 2. Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

- **API**: http://localhost:8080
- **Health check**: http://localhost:8080/actuator/health

### 3. ML Service (Python FastAPI)

```bash
cd ml-service
python -m venv venv          # First time only
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- **Health check**: http://localhost:8000/health

### 4. Simulator (Python)

```bash
cd simulator
python -m venv venv          # First time only
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

- **Health check**: http://localhost:8001/health

### 5. Frontend (React Dashboard)

```bash
cd frontend
npm install
npm run dev
```

- **Dashboard**: http://localhost:5173/dashboard

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
| `VITE_REFRESH_INTERVAL_MS` | `5000` | Dashboard polling interval (ms) |

### Backend (`backend/src/main/resources/application.properties`)

| Property | Value | Description |
|---|---|---|
| `server.port` | `8080` | Backend server port |
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/machinax_db` | Database URL |
| `machinax.ml-service.base-url` | `http://localhost:8000` | ML service URL |
| `machinax.cors.allowed-origins` | `http://localhost:5173,http://localhost:3000` | CORS origins |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Recharts |
| Backend | Java 21 + Spring Boot 4.0 |
| Database | PostgreSQL 18 + Flyway migrations |
| ML Service | Python 3.13 + FastAPI + scikit-learn + XGBoost + SHAP |
| Simulator | Python 3.13 + FastAPI + NumPy/SciPy |
| Real-time | Controlled polling (5s configurable interval) |

---

## Data Flow

```
Simulator → POST /api/v1/machines/{id}/readings (Spring Boot)
         → SensorIngestionService stores readings
         → MLClientService calls Python ML API
         → DigitalTwinStateService updates twin state
         → React dashboard polls and updates in real time
```

---

## Dashboard Features

The React dashboard provides a complete predictive maintenance interface:

| Feature | Data Source |
|---|---|
| Machine selector | `GET /api/v1/machines` |
| Digital Twin state | `GET /api/v1/machines/{id}/digital-twin` |
| Health score gauge | Digital Twin healthScore |
| Operating state | Digital Twin operatingState |
| Live sensor values | Digital Twin latestSensors |
| Sensor trend charts | `GET /api/v1/machines/{id}/sensors/{sid}/trend` |
| ML anomaly detection | `GET /api/v1/machines/{id}/ml-prediction/latest` |
| Fault classification | ML prediction faultType |
| Fault probability | ML prediction faultProbability |
| SHAP explanation | `GET /api/v1/machines/{id}/explanations/latest` |
| RUL estimate | `GET /api/v1/machines/{id}/rul/latest` |
| Degradation trend | RUL prediction degradationTrend |
| Maintenance priority | `GET /api/v1/machines/{id}/maintenance/latest` |
| Maintenance recommendation | Maintenance recommendation text |

---

## Dashboard Usage

### Normal Operations

1. Open http://localhost:5173/dashboard
2. Select a machine from the dropdown
3. The dashboard displays real-time Digital Twin state
4. All sections update automatically via polling

### Healthy-Mode Test

1. Ensure the simulator is in **HEALTHY** mode
2. Dashboard should show:
   - Operating state: **NORMAL**
   - Health score: **High** (≥80)
   - Anomaly: **None** or low score
   - Fault: **None**
   - RUL: **High** hours
   - Priority: **P3 — Monitor**

### Fault-Mode Test

1. Change simulator to a fault mode (e.g., `BEARING_DEFECT`)
2. Allow several reading cycles
3. Dashboard should reflect changes:
   - Health score **decreases**
   - Anomaly **detected**
   - Fault **classified** (e.g., Bearing Defect)
   - Fault probability **increases**
   - SHAP shows **vibration** with higher impact
   - RUL **decreases**
   - Priority escalates to **P2** or **P1**
   - Maintenance recommendation **updates**

---

## API Failure Resilience

The dashboard isolates API failures per section:

- If ML service fails → Sensor data and Digital Twin still display
- If RUL fails → Other sections continue working
- If explanation fails → ML prediction still shows
- If all APIs fail → "Backend Offline" indicator shown

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Complete | Database schema (Flyway migrations) |
| 2 | ✅ Complete | Machine & sensor management APIs |
| 3 | ✅ Complete | Sensor simulation service |
| 4 | ✅ Complete | Sensor data ingestion |
| 5 | ✅ Complete | Digital Twin state & health engine |
| 6 | ✅ Complete | ML anomaly detection & fault classification |
| 7 | ✅ Complete | Explainability, RUL & predictive maintenance |
| 8 | ✅ Complete | React frontend dashboard & integration |

---

## Running Tests

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
mvn test
```

---

## Known Limitations

1. **Polling, not WebSocket**: The frontend uses controlled polling (5s interval) rather than WebSocket push. This is a pragmatic choice since the backend does not currently expose a WebSocket endpoint.
2. **Simulated data only**: All sensor data is generated by the Python simulation service and is labeled `source: SIMULATED`.
3. **Single-page dashboard**: The frontend is a single-page dashboard without multi-page navigation. This is intentional for a monitoring dashboard.
4. **No authentication**: The system does not implement user authentication. This is an academic project.
5. **Desktop-first**: The responsive design targets desktop/laptop/tablet. Mobile support is reasonable but not the primary design target.

---

## Sensor Data Note

> ⚠️ **Current Mode: SIMULATED**  
> All sensor data is generated by the Python simulation service and is clearly labeled `source: SIMULATED` in the database.  
> The architecture is designed for future replacement with real IoT/MQTT sensor data from edge devices (ESP32/Raspberry Pi).
