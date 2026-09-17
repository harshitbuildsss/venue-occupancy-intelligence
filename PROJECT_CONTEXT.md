# Project Context: Real-Time Venue Occupancy Intelligence

**Event:** AWS Bharat Builds Tour — First Commit (Sept 17–20, 2026)  
**Strategy:** Target: Ship It (AWS Deployed) | Fallback: Build It (Local/Containerized)  
**Core Domain:** Privacy-preserving deterministic occupancy tracking (`occupancy = previous + entry - exit`).

---

## Completed Tasks

### Task 1: Core Domain & Idempotent Occupancy Engine
- **Models:**
  - `Venue`: Encapsulates venue metadata, capacity, occupancy, and dynamically evaluated `CrowdStatus`.
  - `VenueType`: Generic venue taxonomy (`MALL`, `GYM`, `LIBRARY`, `EVENT_VENUE`, `OFFICE`, etc.).
  - `OccupancyEvent`: Anonymized atomic counter event (`eventId`, `venueId`, `deviceId`, `eventType`, `timestamp`).
  - `EventType`: `ENTRY` (+1), `EXIT` (-1).
  - `CrowdStatus`: Centralized threshold evaluator (`QUIET`, `MODERATE`, `BUSY`, `VERY_BUSY`, `NEAR_CAPACITY`, `CAPACITY_ANOMALY`).
  - `EventProcessingStatus` & `EventProcessingResult`: Immutable result record communicating status and current counts.
- **Engine Invariants:**
  - **Idempotency:** Tracked via unique `eventId`; duplicates return `DUPLICATE_IGNORED` without modifying state.
  - **Zero Floor Protection:** `EXIT` at `occupancy = 0` rejected with `REJECTED_NEGATIVE_OCCUPANCY`.
  - **Anomaly Detection:** `occupancy > capacity` marks the venue status as `CAPACITY_ANOMALY`.
- **Test Suite:**
  - `OccupancyEngineTest`: Unit tests covering increment, decrement, idempotency duplicate handling, non-negative floor, over-capacity anomaly, and parameterized status threshold validation.

---

## Next Tasks
- **Task 2:** Persistence & Storage Idempotency layer (Spring Data JPA / DynamoDB contract).
- **Task 3:** Ingestion & Read REST API controllers.
- **Task 4:** Multi-gate traffic simulator.
- **Task 5:** React + Vite Dashboard UI.
- **Task 6:** 30/60m statistical trend & occupancy predictor.
- **Task 7:** AWS Pipeline (IoT Core -> Lambda -> DynamoDB).
