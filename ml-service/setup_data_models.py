import os
import joblib
import pandas as pd
import numpy as np

os.makedirs('ml-service/data', exist_ok=True)
os.makedirs('ml-service/models', exist_ok=True)

gb_src = 'ml-service/models/gradient_boost.pkl'
gb_dst = 'ml-service/models/gb_model.pkl'
if os.path.exists(gb_src) and not os.path.exists(gb_dst):
    m = joblib.load(gb_src)
    joblib.dump(m, gb_dst)

np.random.seed(42)
n_samples = 500
data = {
    'step': np.random.randint(1, 100, n_samples),
    'type': np.random.choice(['CASH_IN', 'CASH_OUT', 'DEBIT', 'PAYMENT', 'TRANSFER'], n_samples, p=[0.2, 0.3, 0.05, 0.25, 0.2]),
    'amount': np.round(np.random.exponential(50000, n_samples), 2),
    'nameOrig': [f'C{i:09d}' for i in range(n_samples)],
    'oldbalanceOrg': np.round(np.random.uniform(0, 200000, n_samples), 2),
    'newbalanceOrig': np.round(np.random.uniform(0, 200000, n_samples), 2),
    'nameDest': [f'M{i:09d}' for i in range(n_samples)],
    'oldbalanceDest': np.round(np.random.uniform(0, 200000, n_samples), 2),
    'newbalanceDest': np.round(np.random.uniform(0, 200000, n_samples), 2),
    'isFraud': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),
    'isFlaggedFraud': np.zeros(n_samples, dtype=int)
}
df = pd.DataFrame(data)
df.to_csv('ml-service/data/paysim_subset.csv', index=False)
print('Dataset created successfully. Rows:', len(df))
