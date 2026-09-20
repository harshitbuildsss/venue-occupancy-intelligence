# Bharat Occupancy

### Real-Time Venue Occupancy Intelligence

Bharat Occupancy is a real-time venue intelligence platform that helps people understand **how crowded a physical space is right now** and what occupancy may look like over the next 30–60 minutes.

It is designed for places such as:

- Shopping malls
- Gyms
- Libraries
- College buildings
- Event venues
- Offices and coworking spaces
- Cafeterias
- Other controlled-entry facilities

The system processes entry and exit events and turns them into live occupancy, capacity status, traffic trends, and short-term occupancy projections.

---

## Problem

People often have no reliable way to know how crowded a physical venue is before entering it.

A venue may become significantly more crowded within minutes, while existing services often provide historical or relative estimates rather than venue-controlled real-time occupancy.

Bharat Occupancy addresses this by working from explicit venue entry and exit events.

At its core:

```text
occupancy(t) = occupancy(t-1) + entries - exits
```

This allows the system to maintain a live occupancy count without requiring facial recognition, biometric identification, or personally identifiable information.

---

## What the Project Does

Bharat Occupancy provides:

- Real-time venue occupancy
- Current capacity percentage
- Crowd status indicators
- Entry and exit activity
- Occupancy trends
- 30-minute occupancy projection
- 60-minute occupancy projection
- Live event stream
- Multi-venue monitoring
- Simulated traffic bursts for testing
- AWS-based serverless event processing

The dashboard can receive individual entry/exit events as well as continuous simulated traffic.

---

## Live Demo

**Live Application:**  
https://main.d3mb9pvqbfy2jf.amplifyapp.com

**GitHub Repository:**  
https://github.com/harshitbuildsss/venue-occupancy-intelligence

---

## Architecture

### Production AWS Architecture

```text
                    ┌─────────────────────────┐
                    │     React Frontend      │
                    │   AWS Amplify Hosting   │
                    └────────────┬────────────┘
                                 │
                              HTTPS
                                 │
                    ┌────────────▼────────────┐
                    │     API Gateway         │
                    │       HTTP API           │
                    └───────┬─────────┬───────┘
                            │         │
                     POST /events     │ GET
                            │         │
                            ▼         ▼
                    ┌────────────┐ ┌───────────────┐
                    │   Lambda   │ │    Lambda     │
                    │   Event    │ │    Query      │
                    │ Processor  │ │    Handler    │
                    └─────┬──────┘ └───────┬───────┘
                          │                 │
                          └────────┬────────┘
                                   ▼
                         ┌──────────────────┐
                         │    DynamoDB      │
                         │                  │
                         │ venues           │
                         │ occupancy_events │
                         └──────────────────┘

        ┌─────────────────────┐
        │ Simulator / Device  │
        └──────────┬──────────┘
                   │ MQTT
                   ▼
        ┌─────────────────────┐
        │   AWS IoT Core      │
        └──────────┬──────────┘
                   │ IoT Rule
                   ▼
        ┌─────────────────────┐
        │ Occupancy Event     │
        │ Processor Lambda    │
        └─────────────────────┘
```

### Event Ingestion

The system supports two event ingestion paths.

**HTTP path:**

```text
React Frontend
      |
 POST /events
      |
      v
API Gateway
      |
      v
OccupancyEventProcessor Lambda
      |
      v
DynamoDB
```

**IoT/MQTT path:**

```text
Simulator / IoT Device
        |
       MQTT
        |
        v
AWS IoT Core
        |
     IoT Rule
        |
        v
OccupancyEventProcessor Lambda
        |
        v
DynamoDB
```

Both paths converge on the same event-processing and persistence layer.

### Query Flow

```text
React Frontend
      |
      | GET venue / analytics
      v
API Gateway
      |
      v
OccupancyQueryHandler Lambda
      |
      v
DynamoDB
      |
      v
Current Occupancy + Analytics
      |
      v
React Dashboard
```

---

## AWS Services Used

### AWS Amplify Hosting

Hosts the production React/Vite frontend.

The repository is connected to Amplify so pushes to the main branch can trigger a new frontend deployment.

### Amazon API Gateway

Provides the HTTP API used by the frontend for venue data, analytics, and event ingestion.

### AWS Lambda

Two Lambda functions are used:

**OccupancyEventProcessor**

- Processes incoming occupancy events
- Handles event idempotency
- Updates venue occupancy
- Persists processed events

**OccupancyQueryHandler**

- Reads venue state from DynamoDB
- Provides current occupancy
- Provides analytics and short-term projections

### AWS IoT Core

Provides MQTT-based event ingestion for simulated or physical device-style occupancy events.

An IoT rule routes occupancy events to the event-processing Lambda.

### Amazon DynamoDB

Stores the application's live cloud state.

Tables:

```text
venues
occupancy_events
```

The `occupancy_events` table supports event-level persistence and duplicate-event protection.

---

## Real-Time Processing

Each occupancy event contains information such as:

- Event ID
- Venue ID
- Device ID
- Event type
- Timestamp

Event types are:

```text
ENTRY
EXIT
```

The processing pipeline maintains occupancy using:

```text
new occupancy = current occupancy + entry/exit delta
```

Duplicate event IDs are ignored to prevent the same event from changing occupancy more than once.

Exit events are also prevented from producing negative occupancy.

---

## Occupancy Status

The dashboard classifies occupancy based on the venue's capacity.

| Occupancy | Status |
|---|---|
| < 30% | QUIET |
| < 60% | MODERATE |
| < 80% | BUSY |
| < 95% | VERY_BUSY |
| ≥ 95% | NEAR_CAPACITY |

If occupancy exceeds the configured venue capacity, the system reports a capacity anomaly.

---

## Occupancy Analytics

The system analyzes recent traffic over a configurable trailing window.

It calculates:

- Entry Rate
- Exit Rate
- Net Velocity

The net velocity represents the direction in which venue occupancy is changing.

Short-term projections are generated for:

- 30 minutes
- 60 minutes

The projections are bounded to prevent unrealistic values.

These projections are intended to provide an indication of where current footfall trends could lead rather than a guarantee of future occupancy.

---

## Engineering Console

The application includes an engineering telemetry interface for testing the live event pipeline.

It provides:

- AWS Live connection status
- Continuous traffic simulation
- Entry bursts
- Exit surges
- Live event stream
- API connectivity status

Example:

```text
AWS Cloud (Serverless Ingestion)

POST /events
      ↓
API Gateway
      ↓
Lambda
      ↓
DynamoDB
```

This allows the real-time behavior of the application to be demonstrated without requiring physical sensors.

---

## Privacy

Bharat Occupancy is designed around event-level counting rather than identity tracking.

The system does not require:

- Facial recognition
- Biometric identification
- Individual identity
- Personally identifiable information

The core input is simply an occupancy event:

```text
ENTRY
EXIT
```

---

## Local Development

The project also contains a local Java/Spring Boot implementation used as a development and reference backend.

### Local Stack

```text
Java 17
Spring Boot
Spring Data JPA
H2
REST APIs
```

The local backend is useful for development and testing.

The production/demo deployment uses the AWS serverless pipeline described above.

---

## Frontend

The frontend is built using:

- React
- Vite
- Tailwind CSS
- JavaScript

The production frontend is deployed using AWS Amplify Hosting.

---

## Project Structure

```text
venue-occupancy-intelligence/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── aws/
│   ├── lambda/
│   │   └── event_processor.py
│   ├── deploy_event_processor.py
│   ├── publish_iot_event.py
│   ├── setup_dynamodb.py
│   └── simulate_iot_stream.py
│
├── src/
│   └── ...
│
├── docs/
│   └── architecture.svg
│
└── README.md
```

---

## Key Technical Concepts

The project demonstrates:

- Event-driven architecture
- MQTT-based ingestion
- Serverless processing
- REST APIs
- DynamoDB persistence
- Event idempotency
- Atomic occupancy updates
- Real-time dashboard updates
- Short-term analytics
- Cloud deployment
- Multi-venue monitoring

---

## AI Development Tools

AI coding assistants were used during development as development aids for implementation guidance, debugging, code review, and iteration.

The final architecture, integrations, testing, deployment, and project behavior were reviewed and validated during development.

---

## Hackathon

Built for the **First Commit Hackathon by WeMakeDevs and AWS**.

The project focuses on applying AWS serverless and event-driven technologies to a real-world physical-space problem.

---

## Future Improvements

Potential future improvements include:

- Integration with physical entry/exit sensors
- WebSocket-based live updates instead of polling
- Authentication and role-based venue management
- More advanced forecasting models
- Historical reporting
- Venue-specific operating hours
- Alert notifications when capacity thresholds are reached
- Integration with additional venue management systems

---

## Author

### Harshit Kumar Singh

Primary contributions include:

- Product architecture
- Java/Spring Boot backend
- Occupancy domain and event-processing logic
- REST APIs
- React dashboard
- AWS serverless integration
- AWS IoT event pipeline
- Lambda functions
- DynamoDB integration
- API Gateway integration
- AWS Amplify deployment
- Testing and debugging
- Final UI and deployment
