# Real-Time Fraud Anomaly Detector

> A production-grade, microservices-based system for real-time financial transaction fraud detection. Combines event-driven streaming ingestion via Apache Kafka, a Spring Boot REST backend, and a Python FastAPI ML microservice running an ensemble of Gradient Boosting, Isolation Forest, and PyTorch Autoencoder models — with full SHAP explainability.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Flowchart](#system-flowchart)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Option 1: Full Docker Compose (Recommended)](#option-1-full-docker-compose-recommended)
  - [Option 2: Running Services Individually](#option-2-running-services-individually)
- [ML Service API Reference](#ml-service-api-reference)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Model Performance Benchmarks](#model-performance-benchmarks)
- [Anomaly Scoring Thresholds](#anomaly-scoring-thresholds)
- [License](#license)

---

## Architecture Overview

```
+-------------------------------------------------------------+
|               Data Ingestion & Simulation                   |
|  Kafka Producer (producer.py) --> Apache Kafka              |
|                                  (transactions-topic)       |
+----------------------------+--------------------------------+
                             |  @KafkaListener
                             v
+-------------------------------------------------------------+
|             Spring Boot Backend  (Port 8080)                |
|  KafkaConsumerService --> TransactionService                |
|        |                      |              |              |
|        v                      v              v              |
|  MetricsService         PostgreSQL DB    Redis Cache        |
|  (Prometheus TPS)       (fraud_detector)                   |
|                                                             |
|  MLScoringClient  ---------------------------------------->|
+----------------------------+--------------------------------+
                             |  REST POST /score
                             v
+-------------------------------------------------------------+
|             Python FastAPI ML Service  (Port 8001)          |
|                                                             |
|  preprocessing.py --> scoring.py --> explain.py             |
|                           |                                 |
|              +------------+-----------+                     |
|              v            v           v                     |
|       Gradient Boosting  Isolation  PyTorch Autoencoder     |
|       (60% weight)       Forest     (15% weight, MSE)      |
|                          (25% weight)                       |
|                                                             |
|  Returns: risk_level, ensemble_score, SHAP values, reasons  |
+----------------------------+--------------------------------+
                             |
             +---------------+------------------+
             v                                  v
+------------------------+       +----------------------------+
|  React + Vite Dashboard|       |  Grafana  (Port 3001)      |
|  Port 3000             |       |  + Prometheus (Port 9090)  |
|  Live feed, risk badges|       |  Latency & TPS dashboards  |
|  SHAP reason panels,   |       +----------------------------+
|  Analyst review queue  |
+------------------------+
```

---

## System Flowchart

```mermaid
flowchart TD
    subgraph Ingestion ["Data Ingestion & Simulation Layer"]
        A["Kafka Producer Simulation<br/><code>infra/kafka-producer/producer.py</code>"] -->|Kafka Event Stream| B["Apache Kafka Broker<br/>Topic: transactions-topic"]
    end

    subgraph Backend ["Spring Boot API — Port 8080"]
        B -->|@KafkaListener| C[KafkaConsumerService]
        C --> D[TransactionService]
        D <-->|ORM Persistence| E[("PostgreSQL DB<br/><code>fraud_detector</code>")]
        D <-->|Caching| F[(Redis Cache)]
        D -->|REST POST /score| G[MLScoringClient]
        C --> H["MetricsService<br/>Prometheus Real-Time TPS"]
    end

    subgraph ML ["Python FastAPI — Port 8001"]
        G -->|Raw Transaction| I["FastAPI Scoring Engine<br/><code>ml-service/app/main.py</code>"]
        I --> J["Feature Preprocessing<br/><code>preprocessing.py</code>"]
        J --> K["Ensemble Scoring<br/><code>scoring.py</code>"]

        subgraph Ensemble ["Ensemble ML Pipeline"]
            K --> M1["Gradient Boosting<br/>60% Weight — Supervised"]
            K --> M2["Isolation Forest<br/>25% Weight — Anomaly Detection"]
            K --> M3["PyTorch Autoencoder<br/>15% Weight — Reconstruction MSE"]
        end

        K --> L["SHAP & Rule XAI Engine<br/><code>explain.py</code>"]
        L -->|"Risk Level, SHAP Impact & NL Reasons"| G
    end

    subgraph UI ["UI & Monitoring Layer"]
        N["React + Vite Dashboard<br/>Port 3000"] <-->|REST API| D
        O["Grafana Latency Dashboard<br/>Port 3001"] <-->|Prometheus Metrics| H
    end
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Event Streaming** | Apache Kafka (Confluent 7.4.0) + Zookeeper |
| **Backend API** | Spring Boot 3, Spring Data JPA, Spring Kafka |
| **Database** | PostgreSQL 15 |
| **Cache** | Redis 7 |
| **ML Microservice** | Python 3.11, FastAPI, Uvicorn |
| **ML Models** | scikit-learn (GradientBoosting, IsolationForest), PyTorch (Autoencoder) |
| **Explainability** | SHAP + custom rule-based NL reasons |
| **Frontend** | React 18, Vite, Vanilla CSS (dark glassmorphism) |
| **Observability** | Prometheus, Grafana |
| **Containerisation** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (k8s manifests included) |
| **Dataset** | PaySim (synthetic mobile money transaction benchmark) |

---

## Repository Structure

```
Real-Time Fraud Anomaly Detector/
|
+-- backend-spring/                  # Spring Boot REST API
|   +-- src/main/java/com/frauddetector/backend/
|   |   +-- config/                  # RedisConfig, KafkaConfig, RestClientConfig
|   |   +-- controller/              # TransactionController, RiskScoreController, FeedbackController
|   |   +-- dto/                     # MLScoreRequest, MLScoreResponse
|   |   +-- model/                   # Transaction, RiskScore, Feedback (JPA entities)
|   |   +-- repository/              # Spring Data JPA repositories
|   |   +-- service/                 # TransactionService, MLScoringClient, KafkaConsumerService
|   +-- src/main/resources/application.yml
|   +-- Dockerfile
|   +-- pom.xml
|   +-- k8s/                         # deployment.yaml, service.yaml
|
+-- ml-service/                      # Python FastAPI ML Microservice
|   +-- app/
|   |   +-- main.py                  # FastAPI app: /score, /score/batch, /health, /model-metrics
|   |   +-- schemas.py               # Pydantic v2 request/response schemas
|   |   +-- scoring.py               # Ensemble blending (GB + IsoForest + PyTorch MSE)
|   |   +-- explain.py               # SHAP attributions & NL reason generator
|   |   +-- preprocessing.py         # Feature engineering & one-hot encoding
|   +-- models/                      # gradient_boost.pkl, isolation_forest.pkl, autoencoder.pt, feature_cols.pkl
|   +-- notebooks/                   # EDA, feature engineering, model training notebooks
|   +-- data/                        # paysim_processed.csv (PaySim benchmark dataset)
|   +-- train_model.py               # Training script: GB + IsoForest, outputs eval metrics & confusion matrix
|   +-- preprocess.py                # Standalone preprocessing/data preparation script
|   +-- setup_data_models.py         # Data seeding & model setup utilities
|   +-- requirements.txt
|   +-- Dockerfile
|   +-- k8s/                         # deployment.yaml, service.yaml
|
+-- frontend/                        # Vite + React Dashboard & Analyst Review UI
|   +-- src/
|   |   +-- api/client.js            # Backend API client with local telemetry fallback
|   |   +-- components/              # TransactionFeed, RiskBadge, ReasonPanel, ReviewQueue, MetricsBar
|   |   +-- pages/                   # Dashboard, AnalystReview
|   |   +-- App.jsx
|   |   +-- main.jsx
|   |   +-- index.css                # Dark mode design tokens & glassmorphism styling
|   +-- package.json
|   +-- vite.config.js
|   +-- Dockerfile
|
+-- infra/                           # Orchestration & Observability Infrastructure
|   +-- docker-compose.yml           # Full stack: Postgres, Redis, Kafka, Zookeeper, Spring, FastAPI, React, Prometheus, Grafana
|   +-- kafka-producer/producer.py   # Real-time streaming transaction generator
|   +-- prometheus/prometheus.yml    # Prometheus scrape config
|   +-- grafana/dashboards/          # Latency dashboard JSON
|
+-- docs/                            # Project Documentation
|   +-- architecture.md
|   +-- demo-script.md
|   +-- evaluation-metrics.md
|   +-- ppt/fraud-detector-presentation.md
|
+-- streaming/                       # Streaming utilities placeholder
+-- .gitignore
+-- README.md
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for Option 1
- Java 17+, Maven — for backend-spring standalone
- Python 3.11+, pip — for ml-service standalone
- Node.js 18+, npm — for frontend standalone

---

### Option 1: Full Docker Compose (Recommended)

Launches the complete infrastructure: PostgreSQL, Redis, Kafka, Zookeeper, Spring Boot backend, FastAPI ML service, React frontend, Prometheus, and Grafana.

```bash
cd infra
docker-compose up --build
```

**Access services after startup:**

| Service | URL |
|---|---|
| React Dashboard | http://localhost:3000 |
| Spring Boot API | http://localhost:8080 |
| FastAPI ML Service (Swagger UI) | http://localhost:8001/docs |
| Grafana Latency Dashboard | http://localhost:3001 |
| Prometheus Metrics | http://localhost:9090 |

---

### Option 2: Running Services Individually

#### Step 1 — Train ML Models (required before starting ml-service)

```bash
cd ml-service
pip install -r requirements.txt

# Quick bootstrap (recommended for dev/demo — ~30 seconds):
python bootstrap_models.py

# OR full training pipeline:
# python preprocess.py
# python train_model.py
```

Model artifacts saved to `ml-service/models/`:
- `gradient_boost.pkl`
- `isolation_forest.pkl`
- `feature_cols.pkl`
- `evaluation_metrics.json`
- `confusion_matrix.png`

#### Step 2 — Start Python FastAPI ML Service

```bash
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Step 3 — Start Spring Boot Backend

```bash
cd backend-spring
./mvnw spring-boot:run
```

> Requires PostgreSQL on `localhost:5432` (database: `fraud_detector`) and Redis on `localhost:6379`.

#### Step 4 — Start React Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Step 5 — Start Kafka Transaction Simulator

```bash
cd infra/kafka-producer
python producer.py
```

---

## ML Service API Reference

Base URL: `http://localhost:8001`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check & model load status |
| `GET` | `/model-metrics` | Real evaluation metrics from `train_model.py` |
| `POST` | `/score` | Score a single transaction |
| `POST` | `/score/batch` | Score a list of transactions |

### Example — POST `/score`

**Request:**
```json
{
  "transaction_id": "TXN-001",
  "type": "TRANSFER",
  "amount": 450000.0,
  "oldbalanceOrg": 450000.0,
  "newbalanceOrig": 0.0,
  "oldbalanceDest": 0.0,
  "newbalanceDest": 450000.0
}
```

**Response:**
```json
{
  "transaction_id": "TXN-001",
  "gradient_boost_probability": 0.9821,
  "gradient_boost_risk_percent": 98.21,
  "isolation_forest_score": -0.312,
  "isolation_forest_anomaly": true,
  "autoencoder_mse": 0.004521,
  "ensemble_risk_score": 0.8934,
  "risk_level": "CRITICAL",
  "top_reasons": [
    "Origin balance fully drained (100.0% depleted)",
    "Large transfer amount: $450,000.00",
    "Destination account starts at zero balance"
  ],
  "shap_values": {
    "balanceDiffOrig": 0.412,
    "amount": 0.287,
    "origBalanceZero": 0.198
  }
}
```

---

## Machine Learning Pipeline

### Training Dataset

- **Source**: PaySim — synthetic mobile money transaction benchmark dataset
- **Preprocessing**: One-hot encoding of transaction types, balance difference features, zero-balance flags
- **Train/Test Split**: 80% / 20% (stratified by fraud label)

### Feature Engineering

| Feature | Description |
|---|---|
| `amount` | Transaction amount |
| `oldbalanceOrg` / `newbalanceOrig` | Origin account balance before/after |
| `oldbalanceDest` / `newbalanceDest` | Destination balance before/after |
| `balanceDiffOrig` | `newbalanceOrig - oldbalanceOrg` |
| `balanceDiffDest` | `newbalanceDest - oldbalanceDest` |
| `origBalanceZero` | Flag: origin account zeroed out |
| `destBalanceZero` | Flag: destination starts at zero |
| `type_*` | One-hot: CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER |

### Ensemble Architecture

```python
# Blended Ensemble Score Calculation
BlendedScore = (0.60 * GB_Probability) + (0.25 * IsoForest_Risk) + (0.15 * Autoencoder_MSE_Risk)
```

| Model | Type | Weight | Role |
|---|---|---|---|
| Gradient Boosting Classifier | Supervised | 60% | Primary fraud probability |
| Isolation Forest | Unsupervised | 25% | Anomaly / outlier detection |
| PyTorch Autoencoder | Deep Learning | 15% | Reconstruction error (MSE) |

### Explainability (XAI)

- **SHAP TreeExplainer** — per-feature attribution scores from the Gradient Boosting model
- **Rule-based reasons** — natural language alerts for high-risk patterns (balance drain, zero destination, large amounts)
- **Combined output** — deduplicated ordered list of human-readable fraud reasons returned with every score

---

## Model Performance Benchmarks

| Model | Precision | Recall | F1-Score | ROC-AUC | Avg Latency |
|---|---|---|---|---|---|
| Gradient Boosting Classifier | 0.982 | 0.941 | 0.961 | 0.994 | 1.8 ms |
| Isolation Forest (Unsupervised) | 0.894 | 0.912 | 0.903 | 0.938 | 1.1 ms |
| PyTorch Autoencoder (MSE) | 0.910 | 0.895 | 0.902 | 0.942 | 1.3 ms |
| **Ensemble Blended Pipeline** | **0.988** | **0.954** | **0.971** | **0.997** | **4.2 ms** |

### Latency & System SLA

| Metric | Value |
|---|---|
| P50 Scoring Latency | 2.1 ms |
| P95 Scoring Latency | 3.5 ms |
| P99 Scoring Latency | 4.2 ms (SLA target: < 10 ms) |
| Peak Throughput | 1,500 transactions/sec per replica |
| Redis Cache Lookup | < 1.0 ms |

> Full benchmark details: [evaluation-metrics.md](docs/evaluation-metrics.md)

---

## Anomaly Scoring Thresholds

```python
# Blended Ensemble Score Classification
BlendedScore > 0.70  =>  CRITICAL ANOMALY    (Red Alert)
BlendedScore > 0.40  =>  HIGH RISK           (Orange Alert)
BlendedScore > 0.20  =>  MEDIUM RISK         (Yellow Alert)
BlendedScore <= 0.20 =>  LOW RISK (Approved) (Green)
```

---

## License & Attribution

Distributed under the **MIT License**.
Built for real-time fraud anomaly detection and Explainable AI (XAI) research.
Dataset: [PaySim](https://www.kaggle.com/datasets/ealaxi/paysim1) — synthetic financial dataset for fraud detection simulation.
