# Real-Time Fraud Anomaly Detector - Presentation Deck Outline

## Slide 1: Title Slide
- **Title**: Real-Time Fraud Anomaly Detector
- **Subtitle**: High-Throughput Microservice Architecture for ML Anomaly Detection & SHAP Explainability
- **Presenter**: Engineering & Data Science Team

## Slide 2: Problem Statement & Motivation
- $28B+ lost annually to digital transaction fraud globally.
- Traditional rule engines generate high false positive rates (>85%).
- Legacy batch processing fails to detect anomalies before settlement.

## Slide 3: System Architecture Overview
- Event-driven Kafka ingestion -> Spring Boot REST/Consumer -> Python FastAPI ML Service -> React Telemetry Dashboard.
- Sub-5ms scoring latency target.

## Slide 4: Ensemble Machine Learning Strategy
- **Supervised Gradient Boosting**: High accuracy on historical PaySim fraud patterns.
- **Isolation Forest**: Unsupervised isolation of unseen transaction anomalies.
- **PyTorch Deep Autoencoder**: Reconstruction error (MSE) detection for complex multi-dimensional outliers.

## Slide 5: Explainable AI (XAI) & SHAP
- SHAP feature importance attributions for every flagged transaction.
- Deterministic natural language reason generator for compliance and analyst review.

## Slide 6: Analyst Review & Continuous Feedback Loop
- Real-time triage interface for fraud operations teams.
- Analyst feedback recorded for ongoing model re-training and active learning.

## Slide 7: Benchmark Results & Live Demo
- P99 Latency: 4.2 ms
- F1-Score: 0.971, ROC-AUC: 0.997
