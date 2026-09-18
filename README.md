# PseudoCoders
Code Cortex 3.0 Hackathon Project - Team PseudoCoders
TurboGuard System Architecture
1. Data & ML Backend (Python / Scikit-Learn / XGBoost)

Data Source: NASA C-MAPSS FD001 Dataset (Raw engine run-to-failure telemetry).

Preprocessing: Constant sensor dropping and MinMax scaling.

Inference Engine: Optimized XGBoost Regressor (Outputs whole-engine Remaining Useful Life / RUL).

Adapter Layer: Rule-based "Digital Twin Adapter" translates model RUL and scaled sensor data into component-level health states and simulated anomalies.

2. Handoff Interface

Payload: mockData.json (Structured data containing RUL, categorical maintenance states, timeline history, and active sensor status).

3. Frontend Client (React / Vite / Three.js)

Data Consumption: React useEffect fetches the local JSON payload.

3D Visualization (Three.js): Interactive turbofan engine that responds visually to the component-level health states mapped in the JSON.

UI Dashboards: "Black-first" aerospace modules (Command Center, Live Telemetry, Prediction Workstation) driven by the prediction and history arrays.

graph TD

    subgraph "1. Machine Learning Backend (Python)"
        A[(NASA C-MAPSS Dataset)] -->|Raw Telemetry| B(Data Preprocessing & Scaling)
        B --> C{XGBoost Regressor}
        C -->|Engine RUL Prediction| D[Digital Twin Adapter]
        B -->|Live Sensor States| D
        D -->|Component Mapping & Rules| E[[mockData.json]]
    end

    subgraph "2. Data Handoff"
        E -.->|Static JSON Export| F
    end

    subgraph "3. Frontend UI (React + Vite)"
        F[React Application] --> G[Three.js 3D Digital Twin]
        F --> H[Telemetry & Anomaly Feed]
        F --> I[Prediction & Maintenance UI]
    end

    classDef backend fill:#1e1e1e,stroke:#333,stroke-width:2px,color:#fff;
    classDef frontend fill:#0a192f,stroke:#64ffda,stroke-width:2px,color:#fff;
    classDef file fill:#2d3748,stroke:#a0aec0,stroke-width:2px,color:#fff;
    
    class A,B,C,D backend;
    class F,G,H,I frontend;
    class E file;
