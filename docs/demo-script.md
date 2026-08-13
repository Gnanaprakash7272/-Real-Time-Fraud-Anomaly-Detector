# Real-Time Fraud Anomaly Detector - Finale Demo Script

*Focus: A fully functional, resilient, and transparent 3-model hybrid ML pipeline.*

---

## 1. Introduction & Architecture (1 min)
*Start with the PPT architecture diagram, then show the live dashboard.*

**Talk track:**
> "Our pipeline ingests transaction streams in real-time. Spring Boot orchestrates the flow, sending each transaction to our FastAPI ML engine. The ML engine runs a **3-model hybrid ensemble**: Gradient Boosting (60%), Isolation Forest (25%), and a deep PyTorch Autoencoder (15%). If a transaction is flagged, it goes directly to our React dashboard for human Analyst Review. Everything you see here is running live."

---

## 2. Live Demo Injection: The E2E Test (2 mins)

*Action: Open a new terminal and run:*
```bash
python test_demo_flow.py
```
*Switch immediately to the Dashboard.*

### Scenario A: The Normal Transaction (Low Risk)
*Click on the newly appeared `TXN-NORMAL-...` in the transaction feed.*
1. **Status**: Shows as `APPROVED` with a Low Risk badge.
2. **Transaction Inspector**:
   - Gradient Boosting: Near 0.0%
   - Isolation Forest: Shows `✓ NORMAL`
   - Autoencoder MSE: Very low score (e.g., `0.000...`) -> `✓ Normal pattern`
   - Ensemble Score: Very low.
> **Talk track:** "Here is a normal $25.50 coffee payment. All three models independently verify this behavior matches standard historical patterns. The ensemble confidently approves it."

### Scenario B: The Balance-Drain Fraud (Critical Risk)
*Click on the newly appeared `TXN-FRAUD-...` in the transaction feed.*
1. **Status**: Shows as `FLAGGED` in bright red.
2. **Transaction Details**: Note the massive amount (`₹4.1 Crore` equivalent) transferring to a Crypto Exchange.
3. **Transaction Inspector (The Proof)**:
   - **Gradient Boosting**: Spiked to ~99.0%
   - **Isolation Forest**: Flagged as `🚨 ANOMALY`
   - **Autoencoder MSE**: Spiked high (`⚠ High reconstruction error`)
   - **Ensemble Score**: >90% (CRITICAL)
4. **SHAP Explanations**: 
   - Show the panel explaining *why*. "Entire origin account balance drained to zero."
   - SHAP bars show exactly which features (like `oldBalanceOrg` vs `amount`) pushed the model to flag it.
> **Talk track:** "This is a balance-drain attack. You can see our Autoencoder struggled to reconstruct this data point, indicating a severe anomaly. The ensemble caught it instantly, and SHAP tells our analysts exactly why."

### Scenario C: Analyst Review Queue
1. Switch tab to **Analyst Review Queue**.
2. Select the `TXN-FRAUD` transaction.
3. Click **Block & Confirm Fraud**.
> **Talk track:** "Human-in-the-loop is critical. The analyst reviews the ML evidence and confirms the fraud, which can be fed back into future model training."

---

## 3. Anticipated Jury QA (Defending the System)

### Q1: "Why does the dashboard show 395 processed transactions but only 390 ML samples?"
**The Defense (Fault Tolerance):** 
"That is intentional graceful degradation. During testing, we simulated an ML node restart. While the ML FastAPI service was booting up, 5 transactions hit the Spring Boot backend. Instead of crashing the payment gateway, Spring Boot safely caught the timeout, marked the 5 transactions as `UNSCORED`, and processed them so the payment flow wasn't blocked. It proves our microservice architecture is highly resilient."

### Q2: "Where is your cloud infrastructure?"
**The Defense (Honesty & Focus):**
"We explicitly focused on the **Data Science & ML Engineering core**. We didn't want to show fake AWS/cloud diagrams or dummy JWT logins. Everything you see—Kafka, Redis, Postgres, Spring Boot, FastAPI, PyTorch, React—is fully implemented and communicating in real-time on our local cluster. It is entirely Docker/Cloud-ready for future deployment."

### Q3: "Why is the currency converted to INR on the dashboard but the model explains in USD thresholds?"
**The Defense (Model Integrity):**
"The models were trained on a dataset containing USD-equivalent numeric distributions. If we scaled the backend numbers by 84x, we would introduce data drift and destroy the model's accuracy. We kept the backend mathematically pure and implemented the currency localization (₹) strictly on the React presentation layer."
