# Real-Time Fraud Anomaly Detector Architecture

```
+------------------+         +------------------+
|  Kafka Producer  | ------> | Kafka Topic      |
|  (producer.py)   |         | transactions     |
+------------------+         +--------+---------+
                                      |
                                      v
                             +------------------+
                             | Spring Boot      | <----> PostgreSQL / Redis
                             | Backend Service  |
                             +--------+---------+
                                      |
                                      v (REST POST /score)
                             +------------------+
                             | Python FastAPI   | <----> Ensemble Models
                             | ML Service       |        (GB + IsoForest + PyTorch)
                             +--------+---------+
                                      |
                                      v (SHAP & Risk Scores)
                             +------------------+
                             | React Dashboard  |
                             | & Analyst Review |
                             +------------------+
```

## Core Components

1. **Spring Boot Backend (`backend-spring/`)**:
   - Port `8080`
   - Connects to PostgreSQL database (`fraud_detector`) and Redis cache.
   - Listens to Kafka topic `transactions-topic` via `KafkaConsumerService`.
   - Calls Python ML service via `MLScoringClient`.

2. **Python ML Microservice (`ml-service/`)**:
   - Port `8001`
   - FastAPI microservice loading `gb_model.pkl`, `isolation_forest.pkl`, `autoencoder.pt`.
   - Evaluates ensemble risk scores and computes SHAP feature attributions.

3. **React Frontend (`frontend/`)**:
   - Port `3000`
   - Modern dark UI displaying live transaction feed, risk badge indicators, SHAP reason panels, and analyst review queue.