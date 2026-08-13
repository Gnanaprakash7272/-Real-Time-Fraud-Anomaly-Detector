import requests
import time
import json
import uuid

BACKEND_URL = "http://localhost:8080/api/transactions"

def send_txn(txn):
    print(f"Sending {txn['transactionId']}...")
    try:
        res = requests.post(
            BACKEND_URL,
            json=txn,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if res.status_code in (200, 201, 202):
            print(f"✅ SUCCESS: {res.json()}")
        else:
            print(f"❌ FAILED: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    # 1. Normal Transaction (Small payment at Coffee shop)
    normal_txn = {
        "transactionId": f"TXN-NORMAL-{str(uuid.uuid4())[:8]}",
        "userId": "USR-1111",
        "amount": 25.50,
        "oldBalanceOrg": 1500.00,
        "newBalanceOrig": 1474.50,
        "oldBalanceDest": 50000.00,
        "newBalanceDest": 50025.50,
        "type": "PAYMENT",
        "merchant": "Coffee & Bakers",
        "location": "London, UK",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "PENDING"
    }

    # 2. Fraud / Balance-Drain Transaction (Massive transfer, account drained)
    fraud_txn = {
        "transactionId": f"TXN-FRAUD-{str(uuid.uuid4())[:8]}",
        "userId": "USR-9999",
        "amount": 495000.00,
        "oldBalanceOrg": 495000.00,
        "newBalanceOrig": 0.00,
        "oldBalanceDest": 0.00,
        "newBalanceDest": 0.00,
        "type": "TRANSFER",
        "merchant": "CryptoExchange Liquidity",
        "location": "Zurich, CH",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "PENDING"
    }

    print("--- INJECTING NORMAL TRANSACTION ---")
    send_txn(normal_txn)
    
    print("\n--- INJECTING FRAUD TRANSACTION ---")
    send_txn(fraud_txn)
